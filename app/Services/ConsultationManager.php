<?php

namespace App\Services;

use App\Models\ConsultationAppointment;
use App\Models\SiteContent;
use App\Models\Transaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class ConsultationManager
{
    public function publicContent(): array
    {
        $saved = SiteContent::where('key', 'site_content')->value('value');
        $saved = $saved ? data_get(json_decode($saved, true), 'home.consultation', []) : [];

        return array_replace(config('consultation.public'), is_array($saved) ? $saved : []);
    }

    public function settings(): array
    {
        $saved = SiteContent::where('key', 'consultation_settings')->value('value');
        $saved = $saved ? json_decode($saved, true) : [];

        return array_replace(config('consultation.settings'), is_array($saved) ? $saved : []);
    }

    public function resolveOption(string $packageSlug, string $optionKey): array
    {
        $package = collect($this->publicContent()['packages'] ?? [])->firstWhere('slug', $packageSlug);
        $option = collect($package['options'] ?? [])->firstWhere('key', $optionKey);

        if (! $package || ! $option) {
            throw ValidationException::withMessages(['package_slug' => 'Paket atau pilihan konsultasi tidak tersedia.']);
        }

        return [$package, $option];
    }

    public function requestedStart(string $date, string $time, int $durationMinutes): Carbon
    {
        $settings = $this->settings();
        $timezone = $settings['timezone'];
        $start = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}", $timezone)->startOfMinute();
        $now = now($timezone);

        if ($start->lt($now->copy()->addHours((int) $settings['minimumLeadHours']))) {
            throw ValidationException::withMessages(['requested_date' => "Jadwal harus diajukan minimal {$settings['minimumLeadHours']} jam sebelumnya."]);
        }

        if (! in_array($start->dayOfWeekIso, array_map('intval', $settings['workingDays']), true)) {
            throw ValidationException::withMessages(['requested_date' => 'Konsultasi hanya tersedia pada Selasa sampai Sabtu.']);
        }

        $opensAt = $start->copy()->setTimeFromTimeString($settings['opensAt']);
        $closesAt = $start->copy()->setTimeFromTimeString($settings['closesAt']);
        if ($start->lt($opensAt) || $start->copy()->addMinutes($durationMinutes)->gt($closesAt)) {
            throw ValidationException::withMessages(['requested_time' => "Sesi harus dimulai setelah {$settings['opensAt']} dan selesai paling lambat {$settings['closesAt']} WIB."]);
        }

        return $start->utc();
    }

    public function mentor(string $key): ?array
    {
        return collect($this->settings()['mentors'] ?? [])
            ->first(fn (array $mentor) => ($mentor['key'] ?? null) === $key && ($mentor['active'] ?? false));
    }

    public function hasConflict(string $mentorKey, Carbon $start, int $durationMinutes, ?int $ignoreAppointmentId = null): bool
    {
        $end = $start->copy()->addMinutes($durationMinutes);

        // ponytail: a per-mentor/day scan is enough for current volume; move overlap checks into SQL if daily bookings become large.
        return ConsultationAppointment::query()
            ->where('mentor_key', $mentorKey)
            ->whereIn('status', ['awaiting_deposit', 'deposit_review', 'booked'])
            ->when($ignoreAppointmentId, fn ($query) => $query->where('id', '!=', $ignoreAppointmentId))
            ->get()
            ->contains(function (ConsultationAppointment $appointment) use ($start, $end) {
                // Timestamps are persisted in UTC; do not let APP_TIMEZONE reinterpret them on read.
                $existingStart = Carbon::parse($appointment->getRawOriginal('scheduled_start_at'), 'UTC');
                $existingEnd = $existingStart->copy()->addMinutes($appointment->duration_minutes);

                return $existingStart->lt($end) && $existingEnd->gt($start);
            });
    }

    public function conflictMap(): array
    {
        $appointments = ConsultationAppointment::query()
            ->whereIn('status', ['requested', 'awaiting_deposit', 'deposit_review', 'booked'])
            ->orderBy('created_at')
            ->get();
        $conflicts = [];

        // ponytail: O(n²) is sufficient for the small admin booking queue; move this overlap scan into SQL when volume grows materially.
        foreach ($appointments as $index => $appointment) {
            $start = Carbon::parse($appointment->getRawOriginal('scheduled_start_at') ?: $appointment->getRawOriginal('requested_start_at'), 'UTC');
            $end = $start->copy()->addMinutes($appointment->duration_minutes);

            foreach ($appointments->slice($index + 1) as $other) {
                $otherStart = Carbon::parse($other->getRawOriginal('scheduled_start_at') ?: $other->getRawOriginal('requested_start_at'), 'UTC');
                $otherEnd = $otherStart->copy()->addMinutes($other->duration_minutes);

                if (! $start->lt($otherEnd) || ! $otherStart->lt($end)) {
                    continue;
                }

                foreach ([$appointment, $other] as $source) {
                    $target = $source->is($appointment) ? $other : $appointment;
                    $targetStart = $source->is($appointment) ? $otherStart : $start;
                    $conflicts[$source->id][] = [
                        'booking_code' => $target->booking_code,
                        'customer_name' => $target->customer_name,
                        'status' => $target->status,
                        'scheduled_start_at' => $targetStart->toIso8601String(),
                        'duration_minutes' => $target->duration_minutes,
                        'created_at' => $target->created_at->toIso8601String(),
                    ];
                }
            }
        }

        return $conflicts;
    }

    public function normalizeWhatsapp(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value);
        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        return $digits;
    }

    public function paymentUrl(ConsultationAppointment $appointment): ?string
    {
        if (! $appointment->deposit_due_at || $appointment->deposit_due_at->isPast()) {
            return null;
        }

        return URL::temporarySignedRoute('consultations.payment', $appointment->deposit_due_at, $appointment);
    }

    public function whatsappUrl(ConsultationAppointment $appointment, string $message): string
    {
        return 'https://wa.me/'.$appointment->whatsapp.'?text='.rawurlencode($message);
    }

    public function expireOverdue(): int
    {
        return DB::transaction(function () {
            $ids = ConsultationAppointment::query()
                ->where('status', 'awaiting_deposit')
                ->where('deposit_due_at', '<=', now())
                ->lockForUpdate()
                ->pluck('id');

            if ($ids->isEmpty()) {
                return 0;
            }

            Transaction::whereIn('consultation_appointment_id', $ids)
                ->where('purpose', 'consultation_deposit')
                ->where('status', 'pending')
                ->update(['status' => 'expired']);

            return ConsultationAppointment::whereIn('id', $ids)->update(['status' => 'expired']);
        });
    }
}
