<?php

namespace Tests\Feature;

use App\Mail\PurchaseReceiptMail;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Checkout donasi tanpa login (akun diam-diam + magic link akses).
 */
class GuestDonationCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_claim_zero_donation_without_login(): void
    {
        Mail::fake();
        $product = $this->donationProduct();

        $this->post(route('checkout.process'), [
            'name' => 'Tamu Donasi',
            'email' => 'tamu-donasi@example.com',
            'phone' => '081111111111',
            'cart' => [['id' => $product->id, 'donation_amount' => 0]],
        ])->assertSessionHasNoErrors()->assertSessionHas('success');

        // Tetap tamu — tidak ada login paksa (akun lain tidak bisa diambil alih lewat email).
        $this->assertGuest();

        $user = User::where('email', 'tamu-donasi@example.com')->firstOrFail();
        $this->assertNull($user->password);
        $this->assertSame('customer', $user->role);
        $this->assertTrue($user->products()->whereKey($product->id)->exists());

        $transaction = Transaction::firstOrFail();
        $this->assertSame($user->id, $transaction->user_id);
        $this->assertSame(Transaction::PURPOSE_DONATION, $transaction->purpose);
        $this->assertSame('success', $transaction->status);

        // Email akses (magic link) dikirim begitu akses dibuka.
        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_guest_paid_donation_grants_access_and_emails_access_link_immediately(): void
    {
        Storage::fake('local');
        Mail::fake();
        $product = $this->donationProduct();
        $method = $this->bankMethod();

        $this->post(route('checkout.process'), [
            'name' => 'Tamu Bayar',
            'email' => 'tamu-bayar@example.com',
            'phone' => '082222222222',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 50000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors()->assertSessionHas('success');

        $this->assertGuest();

        $user = User::where('email', 'tamu-bayar@example.com')->firstOrFail();
        // Akses langsung terbuka walau verifikasi uang masih pending (Model A).
        $this->assertTrue($user->products()->whereKey($product->id)->exists());

        $transaction = Transaction::with('payment')->firstOrFail();
        $this->assertSame('pending', $transaction->status);
        $this->assertSame('pending', $transaction->payment->status);

        // Email akses tidak menunggu approve admin.
        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_admin_approval_of_manual_donation_does_not_send_duplicate_access_email(): void
    {
        Storage::fake('local');
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $product = $this->donationProduct();
        $method = $this->bankMethod();

        $this->post(route('checkout.process'), [
            'name' => 'Tamu Duplikat',
            'email' => 'tamu-duplikat@example.com',
            'phone' => '083333333333',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 25000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        Mail::assertSent(PurchaseReceiptMail::class, 1);

        $transaction = Transaction::firstOrFail();
        $this->actingAs($admin)
            ->patch(route('admin.transactions.approve', $transaction->transaction_code))
            ->assertSessionHasNoErrors();

        $this->assertSame('success', $transaction->fresh()->status);
        // Tidak ada email ganda saat approve.
        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_guest_is_rejected_for_non_donation_cart(): void
    {
        Mail::fake();
        $product = Product::create([
            'name' => 'Produk Harga Tetap',
            'price' => 100000,
            'status' => 'published',
        ]);

        $this->post(route('checkout.process'), [
            'name' => 'Tamu',
            'email' => 'tamu@example.com',
            'phone' => '085555555555',
            'cart' => [['id' => $product->id]],
        ])->assertRedirect(route('login'))->assertSessionHasErrors('cart');

        $this->assertGuest();
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseMissing('users', ['email' => 'tamu@example.com']);
    }

    public function test_guest_donation_with_existing_email_attaches_without_login(): void
    {
        Mail::fake();
        $existing = User::factory()->create(['email' => 'pelanggan-lama@example.com']);
        $product = $this->donationProduct();

        $this->post(route('checkout.process'), [
            'name' => 'Nama Berbeda',
            'email' => 'pelanggan-lama@example.com',
            'phone' => '086666666666',
            'cart' => [['id' => $product->id, 'donation_amount' => 0]],
        ])->assertSessionHasNoErrors();

        // Email sama → akses menempel ke akun existing; tamu TIDAK ikut login.
        $this->assertGuest();
        $this->assertTrue($existing->fresh()->products()->whereKey($product->id)->exists());
        $this->assertSame($existing->id, Transaction::firstOrFail()->user_id);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_magic_link_logs_in_passwordless_user(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->get(URL::signedRoute('access.magic', ['user' => $user->slug]))
            ->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_magic_link_is_rejected_without_signature(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->get(route('access.magic', ['user' => $user->slug]))->assertForbidden();

        $this->assertGuest();
    }

    public function test_magic_link_ignored_for_user_with_password(): void
    {
        $user = User::factory()->create();

        $this->get(URL::signedRoute('access.magic', ['user' => $user->slug]))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }

    private function donationProduct(): Product
    {
        return Product::create([
            'name' => 'Kotak Dukung',
            'price' => 0,
            'pricing_type' => Product::PRICING_DONATION,
            'status' => 'published',
        ]);
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
