<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminResetDataTest extends TestCase
{
    use RefreshDatabase;

    private function seedDummyData(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer', 'purchase_count' => 2, 'total_spent' => 500000]);

        $category = Category::create(['name' => 'Ebook Dummy']);
        $product = Product::create([
            'name' => 'Produk Dummy',
            'category_id' => $category->id,
            'price' => 250000,
            'sold_count' => 7,
        ]);

        $method = PaymentMethod::create([
            'type' => PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'JAGGAD ACADEMY',
            'status' => true,
        ]);

        $transaction = Transaction::create([
            'transaction_code' => 'TRX-DUMMY-001',
            'user_id' => $customer->id,
            'total_amount' => 250000,
            'status' => 'success',
        ]);
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'price' => 250000,
        ]);
        Payment::create([
            'transaction_id' => $transaction->id,
            'payment_method_id' => $method->id,
            'amount' => 250000,
            'proof_image' => 'payments/dummy.webp',
            'status' => 'verified',
        ]);

        DB::table('user_products')->insert([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'purchased_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('material_progress')->insert([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'material_index' => 0,
            'completed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$admin, $customer, $category, $product, $method, $transaction];
    }

    public function test_reset_data_deletes_dummy_data_and_keeps_admins_and_payment_methods(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Storage::disk('local')->put('payments/dummy.webp', 'proof');
        Storage::disk('public')->put('products/dummy.webp', 'product');
        Storage::disk('public')->put('categories/dummy.webp', 'category');
        Storage::disk('public')->put('landing/dummy.webp', 'landing');
        [$admin, $customer, $category, $product, $method, $transaction] = $this->seedDummyData();

        $this->actingAs($admin)
            ->post(route('admin.settings.reset-data'), ['confirmation' => 'RESET'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        // Customer dihapus, admin tetap ada
        $this->assertDatabaseMissing('users', ['id' => $customer->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);

        // Semua data dummy hilang
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('transactions', 0);
        $this->assertDatabaseCount('transaction_items', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('user_products', 0);
        $this->assertDatabaseCount('material_progress', 0);

        // Metode pembayaran dipertahankan
        $this->assertDatabaseHas('payment_methods', ['id' => $method->id]);

        // Statistik akun admin yang dipertahankan di-nol-kan
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'purchase_count' => 0, 'total_spent' => 0]);
        Storage::disk('local')->assertMissing('payments/dummy.webp');
        Storage::disk('public')->assertMissing('products/dummy.webp');
        Storage::disk('public')->assertMissing('categories/dummy.webp');
        Storage::disk('public')->assertMissing('landing/dummy.webp');
    }

    public function test_reset_data_requires_exact_confirmation(): void
    {
        [$admin] = $this->seedDummyData();

        // Konfirmasi salah
        $this->actingAs($admin)
            ->post(route('admin.settings.reset-data'), ['confirmation' => 'reset'])
            ->assertSessionHasErrors('confirmation');
        $this->assertDatabaseCount('products', 1);

        // Konfirmasi tidak dikirim
        $this->actingAs($admin)
            ->post(route('admin.settings.reset-data'), [])
            ->assertSessionHasErrors('confirmation');
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('users', 2);
    }

    public function test_reset_data_is_admin_only(): void
    {
        $this->seedDummyData();
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->post(route('admin.settings.reset-data'), ['confirmation' => 'RESET'])
            ->assertForbidden();

        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_reset_stats_zeroes_counters_without_deleting_data(): void
    {
        [$admin, , , $product] = $this->seedDummyData();
        $admin->update(['purchase_count' => 3, 'total_spent' => 750000]);

        $this->actingAs($admin)
            ->post(route('admin.settings.reset-stats'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        // Data tetap ada
        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
        $this->assertDatabaseHas('transactions', ['transaction_code' => 'TRX-DUMMY-001']);

        // Counter di-nol-kan
        $this->assertDatabaseHas('products', ['id' => $product->id, 'sold_count' => 0]);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'purchase_count' => 0, 'total_spent' => 0]);
    }
}
