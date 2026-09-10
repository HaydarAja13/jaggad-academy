<?php

namespace Tests\Feature;

use App\Models\ConsultationAppointment;
use App\Models\PaymentMethod;
use App\Models\SiteContent;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ConsultationManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConsultationBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_request_uses_cms_price_and_enforces_service_window(): void
    {
        $start = $this->validStart();

        $this->post(route('consultations.store'), [
            'customer_name' => 'Ayu Larasati',
            'whatsapp' => '081234567890',
            'package_slug' => 'quick-talk',
            'option_key' => '30-minutes',
            'consultation_need' => 'Saya ingin menentukan langkah paling tepat untuk masalah karier saya.',
            'requested_date' => $start->format('Y-m-d'),
            'requested_time' => $start->format('H:i'),
            'total_price' => 1,
            'deposit_amount' => 1,
            'policy_accepted' => true,
        ])->assertSessionHasNoErrors()->assertSessionHas('booking_code');

        $appointment = ConsultationAppointment::firstOrFail();
        $this->assertSame('6281234567890', $appointment->whatsapp);
        $this->assertSame(200000, (int) $appointment->total_price);
        $this->assertSame(100000, (int) $appointment->deposit_amount);

        $sunday = $start->copy()->next(Carbon::SUNDAY);
        $this->post(route('consultations.store'), [
            'customer_name' => 'Ayu Larasati', 'whatsapp' => '081234567890',
            'package_slug' => 'quick-talk', 'option_key' => '30-minutes',
            'consultation_need' => 'Permintaan ini sengaja memakai hari layanan yang tidak valid.',
            'requested_date' => $sunday->format('Y-m-d'), 'requested_time' => '20:00', 'policy_accepted' => true,
        ])->assertSessionHasErrors('requested_date');
    }

    public function test_admin_cannot_double_book_the_same_mentor(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $start = $this->validStart();
        $first = $this->appointment('KON-FIRST', $start);
        $second = $this->appointment('KON-SECOND', $start);
        $payload = ['mentor_key' => 'mentor-1', 'scheduled_date' => $start->format('Y-m-d'), 'scheduled_time' => $start->format('H:i'), 'location' => 'JAGGAD Studio'];

        $this->actingAs($admin)->patch(route('admin.consultations.approve', $first), $payload)->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.consultations.approve', $second), $payload)->assertSessionHasErrors('scheduled_time');

        $this->assertSame('awaiting_deposit', $first->fresh()->status);
        $this->assertSame('requested', $second->fresh()->status);
        $this->assertDatabaseHas('transactions', [
            'consultation_appointment_id' => $first->id,
            'purpose' => Transaction::PURPOSE_CONSULTATION_DEPOSIT,
            'total_amount' => 100000,
        ]);
    }

    public function test_signed_payment_link_accepts_proof_and_approval_is_idempotent(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $start = $this->validStart();
        $appointment = $this->appointment('KON-PAYMENT', $start);
        $bank = $this->bankMethod();
        $payload = ['mentor_key' => 'mentor-1', 'scheduled_date' => $start->format('Y-m-d'), 'scheduled_time' => $start->format('H:i'), 'location' => 'JAGGAD Studio'];
        $this->actingAs($admin)->patch(route('admin.consultations.approve', $appointment), $payload)->assertSessionHasNoErrors();

        $this->post(route('consultations.payment.store', $appointment), [
            'payment_method_id' => $bank->id,
            'proof' => UploadedFile::fake()->image('dp.jpg', 900, 600),
        ])->assertForbidden();

        $signedUrl = app(ConsultationManager::class)->paymentUrl($appointment->fresh());
        $this->post($signedUrl, [
            'payment_method_id' => $bank->id,
            'proof' => UploadedFile::fake()->image('dp.jpg', 900, 600),
        ])->assertSessionHasNoErrors();

        $deposit = $appointment->transactions()->where('purpose', Transaction::PURPOSE_CONSULTATION_DEPOSIT)->firstOrFail();
        $this->assertSame('deposit_review', $appointment->fresh()->status);
        Storage::disk('local')->assertExists($deposit->payment->proof_image);

        $this->actingAs($admin)->patch(route('admin.transactions.approve', $deposit))->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.transactions.approve', $deposit))->assertSessionHasNoErrors();
        $this->assertSame('booked', $appointment->fresh()->status);
        $this->assertSame('success', $deposit->fresh()->status);
        $this->assertDatabaseCount('user_products', 0);
    }

    public function test_customer_reschedule_limit_and_exact_offline_balance_are_enforced(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $start = $this->validStart()->addWeek();
        $appointment = $this->bookedAppointment('KON-COMPLETE', $start);
        $newStart = $start->copy()->addDay();
        while (! in_array($newStart->dayOfWeekIso, [2, 3, 4, 5, 6], true)) {
            $newStart->addDay();
        }
        $payload = ['initiator' => 'customer', 'mentor_key' => 'mentor-1', 'scheduled_date' => $newStart->format('Y-m-d'), 'scheduled_time' => $newStart->format('H:i'), 'location' => 'JAGGAD Studio'];

        $this->actingAs($admin)->patch(route('admin.consultations.reschedule', $appointment), $payload)->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.consultations.reschedule', $appointment), $payload)->assertSessionHasErrors('initiator');

        $this->actingAs($admin)->patch(route('admin.consultations.complete', $appointment), ['amount' => 1, 'payment_method' => 'cash'])->assertSessionHasErrors('amount');
        $this->actingAs($admin)->patch(route('admin.consultations.complete', $appointment), ['amount' => 100000, 'payment_method' => 'cash'])->assertSessionHasNoErrors();

        $this->assertSame('completed', $appointment->fresh()->status);
        $this->assertDatabaseHas('transactions', ['purpose' => Transaction::PURPOSE_CONSULTATION_BALANCE, 'total_amount' => 100000, 'status' => 'success']);
    }

    public function test_refund_is_only_recorded_for_provider_cancellation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customerCancellation = $this->bookedAppointment('KON-CUSTOMER-CANCEL', $this->validStart());
        $this->actingAs($admin)->patch(route('admin.consultations.cancel', $customerCancellation), ['status' => 'cancelled', 'initiator' => 'customer', 'reason' => 'Customer tidak dapat menghadiri sesi.'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.consultations.refund', $customerCancellation), ['note' => 'Refund percobaan yang tidak boleh lolos.'])->assertSessionHasErrors('appointment');

        $providerCancellation = $this->bookedAppointment('KON-PROVIDER-CANCEL', $this->validStart()->addWeek());
        $this->actingAs($admin)->patch(route('admin.consultations.cancel', $providerCancellation), ['status' => 'cancelled', 'initiator' => 'provider', 'reason' => 'Mentor berhalangan dan customer memilih refund.'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.consultations.refund', $providerCancellation), ['note' => 'Refund ditransfer manual ke rekening customer.'])->assertSessionHasNoErrors();

        $this->assertSame('refunded', $providerCancellation->fresh()->status);
        $this->assertSame(100000, (int) $providerCancellation->fresh()->refund_amount);
    }

    private function validStart(): Carbon
    {
        $start = now('Asia/Jakarta')->addDays(2)->setTime(20, 0);
        while (! in_array($start->dayOfWeekIso, [2, 3, 4, 5, 6], true)) {
            $start->addDay();
        }

        return $start;
    }

    private function appointment(string $code, Carbon $start): ConsultationAppointment
    {
        $this->settings();

        return ConsultationAppointment::create([
            'booking_code' => $code,
            'customer_name' => 'Ayu Larasati',
            'whatsapp' => '6281234567890',
            'package_slug' => 'quick-talk',
            'package_name' => 'Quick Talk',
            'option_key' => '30-minutes',
            'option_label' => '30 Menit',
            'duration_minutes' => 30,
            'total_price' => 200000,
            'deposit_amount' => 100000,
            'consultation_need' => 'Membutuhkan arahan untuk menentukan langkah tindakan berikutnya.',
            'requested_start_at' => $start->copy()->utc(),
            'status' => 'requested',
        ]);
    }

    private function bookedAppointment(string $code, Carbon $start): ConsultationAppointment
    {
        $appointment = $this->appointment($code, $start);
        $appointment->update([
            'scheduled_start_at' => $start->copy()->utc(),
            'mentor_key' => 'mentor-1',
            'mentor_name' => 'Mentor JAGGAD',
            'location' => 'JAGGAD Studio',
            'status' => 'booked',
            'deposit_due_at' => now()->addDay(),
        ]);
        $appointment->transactions()->create([
            'transaction_code' => 'TRX-'.strtoupper(str()->random(8)),
            'purpose' => Transaction::PURPOSE_CONSULTATION_DEPOSIT,
            'total_amount' => 100000,
            'status' => 'success',
            'paid_at' => now(),
        ]);

        return $appointment->fresh();
    }

    private function settings(): void
    {
        SiteContent::updateOrCreate(['key' => 'consultation_settings'], ['value' => json_encode([
            ...config('consultation.settings'),
            'mentors' => [['key' => 'mentor-1', 'name' => 'Mentor JAGGAD', 'active' => true]],
        ])]);
    }

    private function bankMethod(): PaymentMethod
    {
        return PaymentMethod::create([
            'type' => PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'BCA',
            'account_name' => 'JAGGAD ACADEMY',
            'account_number' => '991239123',
            'status' => true,
        ]);
    }
}
