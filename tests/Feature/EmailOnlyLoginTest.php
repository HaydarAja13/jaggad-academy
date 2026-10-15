<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Login tanpa password khusus akun donasi (dibuat otomatis saat checkout
 * donasi tanpa login). Akun dengan password tetap wajib password.
 */
class EmailOnlyLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_donor_account_can_login_with_email_only(): void
    {
        $user = User::factory()->create(['password' => null]);
        $this->donationTransactionFor($user);

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => '',
        ])->assertSessionHasNoErrors()->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_regular_user_still_requires_password(): void
    {
        $user = User::factory()->create();

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => '',
        ])->assertSessionHasErrors('password');

        $this->assertGuest();
    }

    public function test_passwordless_user_without_donation_requires_password(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => '',
        ])->assertSessionHasErrors('password');

        $this->assertGuest();
    }

    public function test_wrong_password_is_still_rejected(): void
    {
        $user = User::factory()->create();

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password-salah',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    private function donationTransactionFor(User $user): void
    {
        Transaction::create([
            'transaction_code' => 'TRX-'.strtoupper(uniqid()),
            'user_id' => $user->id,
            'purpose' => Transaction::PURPOSE_DONATION,
            'total_amount' => 10000,
            'status' => 'success',
        ]);
    }
}
