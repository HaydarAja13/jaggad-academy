<?php

namespace Tests\Feature;

use App\Mail\PaymentRejectedMail;
use App\Mail\PurchaseReceiptMail;
use App\Models\Payment;
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

class ManualBankTransferTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_checkout_uses_database_price_and_stores_payment_proof(): void
    {
        Storage::fake('public');
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Aman', 'price' => 149000]);
        $method = $this->bankMethod();

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $product->id, 'price' => 1]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::with('payment')->firstOrFail();
        $this->assertEquals(149000, $transaction->total_amount);
        $this->assertSame('pending', $transaction->payment->status);
        Storage::disk('public')->assertExists($transaction->payment->proof_image);
    }

    public function test_inactive_midtrans_cannot_be_selected_directly(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Aman', 'price' => 149000]);
        $midtrans = PaymentMethod::create([
            'type' => PaymentMethod::TYPE_MIDTRANS,
            'bank_name' => 'Midtrans',
            'account_name' => 'JAGGAD ACADEMY',
            'account_number' => '-',
            'status' => false,
        ]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $midtrans->id,
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasErrors('payment_method_id');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_customer_cannot_checkout_a_product_they_already_own(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Milik Saya', 'price' => 149000]);
        $customer->products()->attach($product->id, ['purchased_at' => now()]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $this->bankMethod()->id,
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasErrors('cart');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_rejected_proof_can_be_reuploaded_by_its_owner(): void
    {
        Storage::fake('public');
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        [$transaction, $payment] = $this->pendingTransfer($customer);
        Storage::disk('public')->put($payment->proof_image, 'old-proof');

        $this->actingAs($admin)->patch(route('admin.transactions.reject', $transaction), [
            'reason' => 'Nominal pada bukti tidak sesuai dengan total pesanan.',
        ])->assertSessionHasNoErrors();

        $this->assertSame('pending', $transaction->fresh()->status);
        $this->assertSame('rejected', $payment->fresh()->status);
        Mail::assertSent(PaymentRejectedMail::class, fn ($mail) => $mail->hasTo($customer->email));

        $this->actingAs($customer)->post(route('transactions.proof', $transaction), [
            'proof' => UploadedFile::fake()->image('bukti-baru.jpg', 900, 600),
        ])->assertSessionHasNoErrors();

        $payment->refresh();
        $this->assertSame('pending', $payment->status);
        $this->assertNull($payment->rejection_reason);
        Storage::disk('public')->assertExists($payment->proof_image);
    }

    public function test_approval_is_idempotent_and_sends_access_email(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        [$transaction, $payment, $product] = $this->pendingTransfer($customer);

        $this->actingAs($admin)->patch(route('admin.transactions.approve', $transaction))
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch(route('admin.transactions.approve', $transaction))
            ->assertSessionHasNoErrors();

        $this->assertSame('success', $transaction->fresh()->status);
        $this->assertSame('verified', $payment->fresh()->status);
        $this->assertTrue($customer->fresh()->products()->whereKey($product->id)->exists());
        $this->assertSame(1, $product->fresh()->sold_count);
        $this->assertSame(1, $customer->fresh()->purchase_count);
        $this->assertEquals(149000, $customer->fresh()->total_spent);
        Mail::assertSent(PurchaseReceiptMail::class, 1);
    }

    public function test_another_customer_cannot_replace_the_payment_proof(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $otherCustomer = User::factory()->create();
        [$transaction, $payment] = $this->pendingTransfer($owner);
        $payment->update(['status' => 'rejected', 'rejection_reason' => 'Bukti tidak jelas.']);

        $this->actingAs($otherCustomer)->post(route('transactions.proof', $transaction), [
            'proof' => UploadedFile::fake()->image('bukti.png'),
        ])->assertForbidden();
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

    private function pendingTransfer(User $customer): array
    {
        $product = Product::create(['name' => 'Kelas Aman', 'price' => 149000]);
        $transaction = Transaction::create([
            'transaction_code' => 'TRX-' . strtoupper(str()->random(8)),
            'user_id' => $customer->id,
            'total_amount' => 149000,
            'status' => 'pending',
        ]);
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'price' => 149000,
        ]);
        $payment = Payment::create([
            'transaction_id' => $transaction->id,
            'payment_method_id' => $this->bankMethod()->id,
            'amount' => 149000,
            'proof_image' => 'payments/original.webp',
            'status' => 'pending',
        ]);

        return [$transaction, $payment, $product];
    }
}
