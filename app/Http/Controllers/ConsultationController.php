<?php

namespace App\Http\Controllers;

use App\Models\ConsultationAppointment;
use App\Models\PaymentMethod;
use App\Services\ConsultationManager;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ConsultationController extends Controller
{
    public function index(ConsultationManager $consultations)
    {
        return Inertia::render('Guest/Consultation', [
            'consultation' => $consultations->publicContent(),
            'consultationSettings' => $consultations->settings(),
        ]);
    }

    public function store(Request $request, ConsultationManager $consultations)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|min:2|max:120',
            'whatsapp' => 'required|string|max:24',
            'package_slug' => 'required|string|max:80',
            'option_key' => 'required|string|max:80',
            'consultation_need' => 'required|string|min:10|max:2000',
            'requested_date' => 'required|date_format:Y-m-d',
            'requested_time' => 'required|date_format:H:i',
            'policy_accepted' => 'accepted',
        ]);

        [$package, $option] = $consultations->resolveOption($validated['package_slug'], $validated['option_key']);
        $start = $consultations->requestedStart(
            $validated['requested_date'],
            $validated['requested_time'],
            (int) $option['durationMinutes'],
        );
        $whatsapp = $consultations->normalizeWhatsapp($validated['whatsapp']);
        if (! preg_match('/^62\d{8,13}$/', $whatsapp)) {
            throw ValidationException::withMessages(['whatsapp' => 'Gunakan nomor WhatsApp Indonesia yang aktif.']);
        }

        $appointment = ConsultationAppointment::create([
            'booking_code' => 'KON-'.strtoupper(Str::random(10)),
            'customer_name' => trim($validated['customer_name']),
            'whatsapp' => $whatsapp,
            'package_slug' => $package['slug'],
            'package_name' => $package['name'],
            'option_key' => $option['key'],
            'option_label' => $option['label'],
            'duration_minutes' => $option['durationMinutes'],
            'total_price' => $option['totalPrice'],
            'deposit_amount' => $option['depositAmount'],
            'consultation_need' => trim($validated['consultation_need']),
            'requested_start_at' => $start,
            'status' => 'requested',
        ]);

        return redirect()->route('consultations.index')->with([
            'success' => 'Permintaan konsultasi berhasil dikirim. Admin akan menghubungi Anda melalui WhatsApp.',
            'booking_code' => $appointment->booking_code,
        ]);
    }

    public function payment(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $consultationAppointment->load(['transactions' => fn ($query) => $query
            ->where('purpose', 'consultation_deposit')
            ->latest(), 'transactions.payment.paymentMethod']);
        $transaction = $consultationAppointment->transactions->first();
        abort_unless($transaction, 404);

        return Inertia::render('Guest/ConsultationPayment', [
            'appointment' => $consultationAppointment,
            'transaction' => $transaction,
            'dbPaymentMethods' => PaymentMethod::query()
                ->where('type', PaymentMethod::TYPE_BANK_TRANSFER)
                ->where('status', true)
                ->orderBy('id')
                ->get(),
            'uploadUrl' => $request->fullUrl(),
        ]);
    }
}
