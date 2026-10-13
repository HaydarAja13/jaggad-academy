<?php

namespace Tests\Feature;

use App\Mail\PaymentRejectedMail;
use App\Mail\PurchaseReceiptMail;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DonationCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_zero_donation_grants_access_immediately_without_payment(): void
    {
        Mail::fake();
        $customer = User::factory()->create();
        $product = $this->donationProduct();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $product->id, 'donation_amount' => 0]],
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::firstOrFail();
        $this->assertSame(Transaction::PURPOSE_DONATION, $transaction->purpose);
        $this->assertSame('success', $transaction->status);
        $this->assertEquals(0, $transaction->total_amount);
        $this->assertNull($transaction->payment);

        // Akses langsung terbuka, tetapi angka penjualan produk tidak terpengaruh.
        $this->assertTrue($customer->fresh()->products()->whereKey($product->id)->exists());
        $this->assertSame(0, $product->fresh()->sold_count);
        $this->assertSame(0, $customer->fresh()->purchase_count);
        $this->assertEquals(0, $customer->fresh()->total_spent);

        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_paid_donation_grants_access_immediately_and_keeps_money_verification_pending(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create();
        $product = $this->donationProduct();
        $method = $this->bankMethod();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 50000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::with('payment')->firstOrFail();
        $this->assertSame(Transaction::PURPOSE_DONATION, $transaction->purpose);
        $this->assertSame('pending', $transaction->status);
        $this->assertEquals(50000, $transaction->total_amount);
        $this->assertSame('pending', $transaction->payment->status);
        $this->assertEquals(50000, $transaction->payment->amount);

        // Model A: akses diberikan SEBELUM verifikasi uang.
        $this->assertTrue($customer->fresh()->products()->whereKey($product->id)->exists());
        $this->assertSame(0, $product->fresh()->sold_count);
    }

    public function test_admin_approval_verifies_donation_without_touching_sales_stats(): void
    {
        Storage::fake('local');
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $product = $this->donationProduct();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 25000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::with('payment')->firstOrFail();

        $this->actingAs($admin)->patch(route('admin.transactions.approve', $transaction))
            ->assertSessionHasNoErrors();

        $this->assertSame('success', $transaction->fresh()->status);
        $this->assertSame('verified', $transaction->payment->fresh()->status);

        // Donasi tidak menghitung penjualan produk.
        $this->assertSame(0, $product->fresh()->sold_count);
        $this->assertSame(0, $customer->fresh()->purchase_count);
        $this->assertEquals(0, $customer->fresh()->total_spent);

        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_admin_reject_keeps_donation_access_and_transaction_pending(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $product = $this->donationProduct();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 15000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::with('payment')->firstOrFail();

        $this->actingAs($admin)->patch(route('admin.transactions.reject', $transaction), [
            'reason' => 'Nominal transfer tidak sesuai dengan bukti.',
        ])->assertSessionHasNoErrors();

        $this->assertSame('pending', $transaction->fresh()->status);
        $this->assertSame('rejected', $transaction->payment->fresh()->status);
        // Penolakan uang tidak pernah mencabut akses (Model A).
        $this->assertTrue($customer->fresh()->products()->whereKey($product->id)->exists());

        Mail::assertSent(PaymentRejectedMail::class, 1);
        Mail::assertNotSent(PurchaseReceiptMail::class);
    }

    public function test_mixed_cart_of_donation_and_regular_product_is_rejected(): void
    {
        $customer = User::factory()->create();
        $donation = $this->donationProduct();
        $regular = Product::create(['name' => 'Kelas Aman', 'price' => 149000, 'status' => 'published']);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [
                ['id' => $donation->id, 'donation_amount' => 5000],
                ['id' => $regular->id],
            ],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasErrors('cart');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_donation_amount_is_validated(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create();
        $product = $this->donationProduct();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => -1]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasErrors('cart.0.donation_amount');

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 100000001]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasErrors('cart.0.donation_amount');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_donation_amount_is_ignored_for_fixed_price_products(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Aman', 'price' => 149000, 'status' => 'published']);

        // Upaya menekan harga lewat donation_amount pada produk harga tetap: harga DB tetap menang.
        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 1]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::firstOrFail();
        $this->assertSame(Transaction::PURPOSE_PRODUCT, $transaction->purpose);
        $this->assertEquals(149000, $transaction->total_amount);
    }

    public function test_repeat_paid_donation_is_allowed_for_owned_product(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create();
        $product = $this->donationProduct();
        $customer->products()->attach($product->id, ['purchased_at' => now()]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id, 'donation_amount' => 10000]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, Transaction::count());
        $this->assertEquals(10000, Transaction::firstOrFail()->total_amount);
    }

    public function test_admin_product_form_saves_donation_pricing_as_zero_price(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'title' => 'Kotak Donasi',
            'status' => 'published',
            'pricingType' => 'donation',
            'price' => 999999,
        ])->assertSessionHasNoErrors();

        $product = Product::where('name', 'Kotak Donasi')->firstOrFail();
        $this->assertSame(Product::PRICING_DONATION, $product->pricing_type);
        $this->assertEquals(0, $product->price);
    }

    public function test_verified_donation_allows_resend_access_email(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $product = $this->donationProduct();
        $transaction = Transaction::create([
            'transaction_code' => 'TRX-DONATE1',
            'purpose' => Transaction::PURPOSE_DONATION,
            'user_id' => $customer->id,
            'total_amount' => 20000,
            'status' => 'success',
        ]);
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'price' => 20000,
        ]);

        $this->actingAs($admin)->post(route('admin.transactions.resend-email', $transaction))
            ->assertSessionHasNoErrors();

        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_csv_export_includes_donation_purpose_column(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $product = $this->donationProduct();
        $transaction = Transaction::create([
            'transaction_code' => 'TRX-DONATE2',
            'purpose' => Transaction::PURPOSE_DONATION,
            'user_id' => $customer->id,
            'total_amount' => 30000,
            'status' => 'pending',
        ]);
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'price' => 30000,
        ]);

        $csv = $this->actingAs($admin)->get(route('admin.transactions.export'))
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('Jenis', $csv);
        $this->assertStringContainsString('Donasi', $csv);
        $this->assertStringContainsString($product->name, $csv);
    }

    private function donationProduct(): Product
    {
        return Product::create([
            'name' => 'Kotak Donasi JAGGAD',
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
