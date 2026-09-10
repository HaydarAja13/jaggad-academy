<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConsultationAppointment;
use App\Models\SiteContent;
use App\Models\Transaction;
use App\Services\ConsultationManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminConsultationController extends Controller
{
    public function index(ConsultationManager $consultations)
    {
        $consultations->expireOverdue();
        $settings = $consultations->settings();
        $appointments = ConsultationAppointment::with(['transactions' => fn ($query) => $query->latest(), 'transactions.payment.paymentMethod'])
            ->latest('requested_start_at')
            ->paginate(20)
            ->through(function (ConsultationAppointment $appointment) use ($consultations) {
                $paymentLink = $consultations->paymentUrl($appointment);
                $schedule = $appointment->scheduled_start_at?->timezone('Asia/Jakarta')->translatedFormat('l, d F Y · H.i');
                $message = $paymentLink
                    ? "Halo {$appointment->customer_name}, jadwal konsultasi {$appointment->package_name} ({$appointment->booking_code}) telah disetujui untuk {$schedule} WIB bersama {$appointment->mentor_name}. Silakan bayar DP Rp ".number_format($appointment->deposit_amount, 0, ',', '.')." sebelum ".$appointment->deposit_due_at->timezone('Asia/Jakarta')->format('d/m/Y H:i')." WIB melalui {$paymentLink}"
                    : "Halo {$appointment->customer_name}, kami ingin menindaklanjuti permintaan konsultasi {$appointment->booking_code} untuk penyesuaian jadwal. Apakah Anda bersedia mendiskusikan waktu alternatif?";

                $appointment->setAttribute('payment_link', $paymentLink);
                $appointment->setAttribute('whatsapp_url', $consultations->whatsappUrl($appointment, $message));

                return $appointment;
            });

        return Inertia::render('Admin/AdminConsultations', [
            'appointments' => $appointments,
            'consultationSettings' => $settings,
        ]);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'timezone' => ['required', Rule::in(['Asia/Jakarta'])],
            'workingDays' => 'required|array|min:1|max:7',
            'workingDays.*' => 'required|integer|between:1,7|distinct',
            'workingDaysLabel' => 'required|string|max:80',
            'opensAt' => 'required|date_format:H:i',
            'closesAt' => 'required|date_format:H:i|after:opensAt',
            'minimumLeadHours' => 'required|integer|min:1|max:720',
            'depositExpiryHours' => 'required|integer|min:1|max:168',
            'rescheduleCutoffHours' => 'required|integer|min:1|max:168',
            'maximumCustomerReschedules' => 'required|integer|min:0|max:10',
            'mentors' => 'required|array|max:50',
            'mentors.*.key' => 'nullable|string|max:64|distinct',
            'mentors.*.name' => 'required|string|min:2|max:120',
            'mentors.*.active' => 'required|boolean',
        ]);

        $validated['mentors'] = collect($validated['mentors'])->map(fn (array $mentor) => [
            'key' => $mentor['key'] ?: (string) Str::uuid(),
            'name' => trim($mentor['name']),
            'active' => (bool) $mentor['active'],
        ])->values()->all();

        SiteContent::updateOrCreate(
            ['key' => 'consultation_settings'],
            ['value' => json_encode($validated, JSON_UNESCAPED_UNICODE)],
        );

        return back()->with('success', 'Pengaturan konsultasi berhasil disimpan.');
    }

    public function approve(Request $request, ConsultationAppointment $consultationAppointment, ConsultationManager $consultations)
    {
        $validated = $request->validate([
            'mentor_key' => 'required|string|max:64',
            'scheduled_date' => 'required|date_format:Y-m-d',
            'scheduled_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
        ]);
        $mentor = $consultations->mentor($validated['mentor_key']);
        if (! $mentor) {
            throw ValidationException::withMessages(['mentor_key' => 'Pilih mentor aktif.']);
        }
        $start = $consultations->requestedStart($validated['scheduled_date'], $validated['scheduled_time'], $consultationAppointment->duration_minutes);

        DB::transaction(function () use ($consultationAppointment, $consultations, $validated, $mentor, $start) {
            SiteContent::firstOrCreate(
                ['key' => 'consultation_settings'],
                ['value' => json_encode(config('consultation.settings'))],
            );
            SiteContent::where('key', 'consultation_settings')->lockForUpdate()->firstOrFail();
            $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
            if (! in_array($appointment->status, ['requested', 'expired'], true)) {
                throw ValidationException::withMessages(['appointment' => 'Permintaan ini tidak dapat disetujui lagi.']);
            }
            if ($consultations->hasConflict($mentor['key'], $start, $appointment->duration_minutes, $appointment->id)) {
                throw ValidationException::withMessages(['scheduled_time' => 'Mentor sudah memiliki sesi yang bertabrakan pada rentang waktu tersebut.']);
            }

            $dueAt = now()->addHours((int) $consultations->settings()['depositExpiryHours']);
            $appointment->update([
                'scheduled_start_at' => $start,
                'mentor_key' => $mentor['key'],
                'mentor_name' => $mentor['name'],
                'location' => trim($validated['location']),
                'status' => 'awaiting_deposit',
                'deposit_due_at' => $dueAt,
                'rejection_reason' => null,
            ]);

            Transaction::create([
                'transaction_code' => 'TRX-'.strtoupper(Str::random(8)),
                'purpose' => Transaction::PURPOSE_CONSULTATION_DEPOSIT,
                'consultation_appointment_id' => $appointment->id,
                'user_id' => null,
                'total_amount' => $appointment->deposit_amount,
                'status' => 'pending',
            ]);
        });

        return back()->with('success', 'Jadwal disetujui. Kirim link pembayaran melalui tombol WhatsApp.');
    }

    public function reject(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $validated = $request->validate(['reason' => 'required|string|min:5|max:500']);
        abort_unless(in_array($consultationAppointment->status, ['requested', 'expired'], true), 422);
        $consultationAppointment->update(['status' => 'rejected', 'rejection_reason' => trim($validated['reason'])]);

        return back()->with('success', 'Permintaan konsultasi ditolak.');
    }

    public function reschedule(Request $request, ConsultationAppointment $consultationAppointment, ConsultationManager $consultations)
    {
        $validated = $request->validate([
            'initiator' => ['required', Rule::in(['customer', 'provider'])],
            'mentor_key' => 'required|string|max:64',
            'scheduled_date' => 'required|date_format:Y-m-d',
            'scheduled_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
        ]);
        $settings = $consultations->settings();
        $mentor = $consultations->mentor($validated['mentor_key']);
        if (! $mentor) {
            throw ValidationException::withMessages(['mentor_key' => 'Pilih mentor aktif.']);
        }
        if ($validated['initiator'] === 'customer') {
            if ($consultationAppointment->customer_reschedule_count >= $settings['maximumCustomerReschedules']) {
                throw ValidationException::withMessages(['initiator' => 'Batas reschedule customer sudah digunakan.']);
            }
            if (! $consultationAppointment->scheduled_start_at?->gt(now('Asia/Jakarta')->addHours($settings['rescheduleCutoffHours']))) {
                throw ValidationException::withMessages(['scheduled_date' => "Reschedule customer harus diajukan minimal {$settings['rescheduleCutoffHours']} jam sebelum sesi."]);
            }
        }
        $start = $consultations->requestedStart($validated['scheduled_date'], $validated['scheduled_time'], $consultationAppointment->duration_minutes);

        DB::transaction(function () use ($consultationAppointment, $consultations, $validated, $mentor, $start) {
            SiteContent::where('key', 'consultation_settings')->lockForUpdate()->firstOrFail();
            $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
            if ($appointment->status !== 'booked') {
                throw ValidationException::withMessages(['appointment' => 'Hanya booking terkonfirmasi yang dapat dijadwal ulang.']);
            }
            if ($consultations->hasConflict($mentor['key'], $start, $appointment->duration_minutes, $appointment->id)) {
                throw ValidationException::withMessages(['scheduled_time' => 'Mentor sudah memiliki sesi yang bertabrakan pada rentang waktu tersebut.']);
            }
            $appointment->update([
                'scheduled_start_at' => $start,
                'mentor_key' => $mentor['key'],
                'mentor_name' => $mentor['name'],
                'location' => trim($validated['location']),
                'customer_reschedule_count' => $appointment->customer_reschedule_count + ($validated['initiator'] === 'customer' ? 1 : 0),
            ]);
        });

        return back()->with('success', 'Jadwal konsultasi berhasil diperbarui.');
    }

    public function complete(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_method' => ['required', Rule::in(['cash', 'bank_transfer', 'qris', 'other'])],
        ]);

        DB::transaction(function () use ($consultationAppointment, $validated) {
            $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
            if ($appointment->status !== 'booked') {
                throw ValidationException::withMessages(['appointment' => 'Hanya booking terkonfirmasi yang dapat diselesaikan.']);
            }
            if ($appointment->transactions()->where('purpose', Transaction::PURPOSE_CONSULTATION_BALANCE)->where('status', 'success')->exists()) {
                throw ValidationException::withMessages(['appointment' => 'Pelunasan konsultasi ini sudah dicatat.']);
            }
            $balance = (int) $appointment->total_price - (int) $appointment->deposit_amount;
            if ((int) round($validated['amount']) !== $balance) {
                throw ValidationException::withMessages(['amount' => 'Nominal pelunasan harus Rp '.number_format($balance, 0, ',', '.').'.']);
            }

            Transaction::create([
                'transaction_code' => 'TRX-'.strtoupper(Str::random(8)),
                'purpose' => Transaction::PURPOSE_CONSULTATION_BALANCE,
                'consultation_appointment_id' => $appointment->id,
                'user_id' => null,
                'total_amount' => $balance,
                'status' => 'success',
                'paid_at' => now(),
                'payment_type' => $validated['payment_method'],
            ]);
            $appointment->update(['status' => 'completed']);
        });

        return back()->with('success', 'Konsultasi selesai dan pelunasan berhasil dicatat.');
    }

    public function cancel(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['cancelled', 'no_show'])],
            'initiator' => ['required', Rule::in(['customer', 'provider'])],
            'reason' => 'required|string|min:5|max:500',
        ]);
        DB::transaction(function () use ($consultationAppointment, $validated) {
            $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
            if (! in_array($appointment->status, ['requested', 'awaiting_deposit', 'deposit_review', 'booked'], true)) {
                throw ValidationException::withMessages(['appointment' => 'Booking ini tidak dapat dibatalkan lagi.']);
            }
            $appointment->update([
                'status' => $validated['status'],
                'cancellation_initiator' => $validated['initiator'],
                'cancellation_reason' => trim($validated['reason']),
            ]);
            $appointment->transactions()->where('status', 'pending')->update(['status' => 'failed']);
            $appointment->transactions()->where('status', 'failed')->each(fn (Transaction $transaction) => $transaction->payment?->update([
                'status' => 'rejected',
                'rejection_reason' => 'Booking dibatalkan sebelum pembayaran diverifikasi.',
            ]));
        });

        return back()->with('success', 'Status konsultasi berhasil diperbarui.');
    }

    public function refund(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $validated = $request->validate(['note' => 'required|string|min:5|max:500']);

        DB::transaction(function () use ($consultationAppointment, $validated) {
            $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
            $deposit = $appointment->transactions()
                ->where('purpose', Transaction::PURPOSE_CONSULTATION_DEPOSIT)
                ->where('status', 'success')
                ->lockForUpdate()
                ->first();
            if (! $deposit || $appointment->status !== 'cancelled' || $appointment->cancellation_initiator !== 'provider') {
                throw ValidationException::withMessages(['appointment' => 'Refund DP hanya tersedia untuk pembatalan oleh JAGGAD atau mentor.']);
            }

            $deposit->update(['status' => 'refunded']);
            $appointment->update([
                'status' => 'refunded',
                'refund_amount' => $appointment->deposit_amount,
                'refund_at' => now(),
                'refund_note' => trim($validated['note']),
            ]);
        });

        return back()->with('success', 'Refund DP telah dicatat. Proses transfer refund dilakukan manual.');
    }
}
