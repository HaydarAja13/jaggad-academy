<?php

namespace Tests\Feature;

use App\Mail\PurchaseReceiptMail;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FreeClaimTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_product_can_be_claimed_without_payment_method(): void
    {
        Mail::fake();
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Gratis', 'price' => 0, 'status' => 'published']);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasNoErrors()
            ->assertSessionHas('free_claim', true);

        $transaction = Transaction::firstOrFail();
        $this->assertEquals(0, $transaction->total_amount);
        $this->assertSame('success', $transaction->status);
        $this->assertSame('free_claim', $transaction->payment_type);
        $this->assertDatabaseCount('payments', 0);
        $this->assertTrue($customer->fresh()->products()->whereKey($product->id)->exists());
        $this->assertSame(1, $product->fresh()->sold_count);
        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_free_claim_is_rejected_when_already_owned(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Gratis', 'price' => 0, 'status' => 'published']);
        $customer->products()->attach($product->id, ['purchased_at' => now()]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasErrors('cart');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_paid_product_still_requires_payment_method(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Berbayar', 'price' => 149000, 'status' => 'published']);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasErrors('payment_method_id');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_mixed_free_and_paid_cart_requires_payment(): void
    {
        $customer = User::factory()->create();
        $free = Product::create(['name' => 'Kelas Gratis', 'price' => 0, 'status' => 'published']);
        $paid = Product::create(['name' => 'Kelas Berbayar', 'price' => 50000, 'status' => 'published']);

        // Tanpa metode bayar harus ditolak karena total > 0
        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $free->id], ['id' => $paid->id]],
        ])->assertSessionHasErrors('payment_method_id');

        $this->assertDatabaseCount('transactions', 0);

        // Dengan metode manual harus lolos dan total hanya harga produk berbayar
        $method = PaymentMethod::create([
            'type' => PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'BCA',
            'account_name' => 'JAGGAD ACADEMY',
            'account_number' => '991239123',
            'status' => true,
        ]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $free->id], ['id' => $paid->id]],
            'proof' => \Illuminate\Http\UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::firstOrFail();
        $this->assertEquals(50000, $transaction->total_amount);
        $this->assertSame('pending', $transaction->status);
    }

    public function test_client_price_is_ignored_for_paid_product(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Berbayar', 'price' => 149000, 'status' => 'published']);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'cart' => [['id' => $product->id, 'price' => 0]],
        ])->assertSessionHasErrors('payment_method_id');

        $this->assertDatabaseCount('transactions', 0);
    }
}
