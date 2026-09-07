<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\TransactionFinalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Midtrans\Config;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_midtrans_webhook_is_authenticated_amount_checked_and_idempotent(): void
    {
        Mail::fake();
        config(['services.midtrans.server_key' => 'server-secret']);
        $user = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Aman', 'price' => 149000]);
        $transaction = Transaction::create(['transaction_code' => 'TRX-WEBHOOK', 'user_id' => $user->id, 'total_amount' => 149000, 'status' => 'pending']);
        TransactionItem::create(['transaction_id' => $transaction->id, 'product_id' => $product->id, 'price' => 149000]);

        $payload = ['order_id' => 'TRX-WEBHOOK', 'status_code' => '200', 'gross_amount' => '149000.00', 'transaction_status' => 'settlement', 'payment_type' => 'bank_transfer'];
        $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'server-secret');

        $this->postJson('/midtrans/webhook', [...$payload, 'signature_key' => str_repeat('a', 128)])->assertForbidden();
        $this->postJson('/midtrans/webhook', [...$payload, 'gross_amount' => '1.00'])->assertForbidden();
        $this->postJson('/midtrans/webhook', $payload)->assertOk();
        $this->postJson('/midtrans/webhook', $payload)->assertOk();

        $this->assertSame('success', $transaction->fresh()->status);
        $this->assertSame(1, $product->fresh()->sold_count);
        $this->assertSame(1, $user->fresh()->purchase_count);
        $this->assertEquals(149000, $user->fresh()->total_spent);
    }

    public function test_package_checkout_uses_server_price_and_real_products(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        foreach (config('packages.starter-pack.products') as $slug) {
            Product::create(['name' => $slug, 'slug' => $slug, 'price' => 999999]);
        }
        $method = PaymentMethod::create(['type' => 'bank_transfer', 'bank_name' => 'BCA', 'account_name' => 'JAGGAD', 'account_number' => '123', 'status' => true]);

        $this->actingAs($user)->post(route('checkout.process'), [
            'phone' => '08123456789',
            'payment_method_id' => $method->id,
            'cart' => [['package_slug' => 'starter-pack']],
            'proof' => UploadedFile::fake()->image('proof.png'),
        ])->assertSessionHasNoErrors();

        $transaction = Transaction::with('items')->firstOrFail();
        $this->assertEquals(399000, $transaction->total_amount);
        $this->assertCount(2, $transaction->items);
        $this->assertEquals(399000, $transaction->items->sum('price'));
    }

    public function test_package_landing_is_hidden_until_all_configured_products_exist(): void
    {
        $this->get(route('packages.landing', 'starter-pack'))->assertNotFound();

        foreach (config('packages.starter-pack.products') as $slug) {
            Product::create(['name' => $slug, 'slug' => $slug, 'price' => 250000]);
        }

        $this->get(route('packages.landing', 'starter-pack'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guest/PackageLanding')
                ->where('serverPackage.price', 399000));
    }

    public function test_midtrans_token_failure_keeps_transaction_pending_without_granting_access(): void
    {
        Storage::fake('local');
        config([
            'services.midtrans.server_key' => 'server-key',
            'services.midtrans.client_key' => 'client-key',
        ]);
        $user = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Midtrans', 'price' => 149000]);
        $method = PaymentMethod::create([
            'type' => PaymentMethod::TYPE_MIDTRANS,
            'bank_name' => 'Midtrans',
            'account_name' => 'Gateway',
            'account_number' => '-',
            'status' => true,
        ]);
        \Mockery::mock('alias:Midtrans\\Snap')
            ->shouldReceive('getSnapToken')
            ->once()
            ->andThrow(new \RuntimeException('provider unavailable'));

        $this->actingAs($user)->post(route('checkout.process'), [
            'phone' => '08123456789',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $product->id]],
        ])->assertSessionHasErrors('payment_method_id');

        $this->assertDatabaseHas('transactions', ['user_id' => $user->id, 'status' => 'pending', 'snap_token' => null]);
        $this->assertDatabaseMissing('user_products', ['user_id' => $user->id, 'product_id' => $product->id]);
    }

    public function test_historical_master_data_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Produk Terjual', 'price' => 1000]);
        $transaction = Transaction::create(['transaction_code' => 'TRX-HISTORY', 'user_id' => $customer->id, 'total_amount' => 1000, 'status' => 'success']);
        TransactionItem::create(['transaction_id' => $transaction->id, 'product_id' => $product->id, 'price' => 1000]);

        $this->actingAs($admin)->delete(route('admin.products.destroy', $product))->assertSessionHasErrors('product');
        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->actingAs($admin)->delete(route('admin.users.destroy', $customer))->assertSessionHasErrors('user');
        $this->assertDatabaseHas('users', ['id' => $customer->id]);
    }

    public function test_customer_can_complete_only_owned_available_material(): void
    {
        $user = User::factory()->create();
        $product = Product::create(['name' => 'Kelas', 'price' => 1000, 'materials' => [['title' => 'Bab 1', 'link' => 'https://example.com/materi']]]);
        $user->products()->attach($product->id, ['purchased_at' => now()]);

        $this->actingAs($user)->post(route('dashboard.learning.complete', [$product, 0]), ['completed' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('material_progress', ['user_id' => $user->id, 'product_id' => $product->id, 'material_index' => 0]);
    }

    public function test_last_active_admin_cannot_be_demoted_or_deactivated(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->actingAs($admin);

        $this->put(route('admin.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'customer',
            'status' => 'active',
        ])->assertSessionHasErrors('user');

        $this->patch(route('admin.users.toggle', $admin))->assertSessionHasErrors('user');
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->actingAs($admin);

        $this->delete(route('admin.users.destroy', $admin))->assertSessionHasErrors('user');
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_nullable_product_fields_do_not_cause_server_error(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $this->post(route('admin.products.store'), [
            'title' => 'Test Produk Minimal',
            'price' => 50000,
        ])->assertSessionHasNoErrors();

        $product = Product::where('name', 'Test Produk Minimal')->firstOrFail();
        $this->assertNull($product->category_id);
        $this->assertNull($product->normal_price);
        $this->assertNull($product->badge);
        $this->assertNull($product->short_description);
        $this->assertNull($product->description);
    }

    public function test_verified_user_can_access_protected_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
        $this->actingAs($user)->get(route('checkout'))->assertOk();
    }

    public function test_inactive_user_is_rejected_at_login(): void
    {
        $user = User::factory()->create(['status' => 'inactive']);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_inactive_authenticated_session_is_terminated(): void
    {
        $user = User::factory()->create(['status' => 'inactive']);

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));

        $this->assertGuest();
    }

    public function test_public_product_outline_does_not_expose_material_links(): void
    {
        $product = Product::create([
            'name' => 'Materi Privat',
            'price' => 1000,
            'materials' => [['title' => 'Bab Rahasia', 'link' => 'https://example.com/private']],
        ]);

        $this->get(route('products.detail', $product))->assertInertia(fn (Assert $page) => $page
            ->where('product.materials.0.title', 'Bab Rahasia')
            ->missing('product.materials.0.link'));

        $user = User::factory()->create();
        $user->products()->attach($product->id, ['purchased_at' => now()]);
        $this->actingAs($user)->get(route('dashboard.learning', $product))->assertInertia(fn (Assert $page) => $page
            ->where('product.materials.0.link', 'https://example.com/private'));
    }

    public function test_admin_cannot_save_unsafe_material_link(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'title' => 'Produk Tidak Aman',
            'price' => 1000,
            'materials' => [['title' => 'Klik', 'link' => 'javascript:alert(1)']],
        ])->assertSessionHasErrors('materials.0.link');

        $this->assertDatabaseMissing('products', ['name' => 'Produk Tidak Aman']);
    }

    public function test_midtrans_fraud_denial_never_grants_access(): void
    {
        config(['services.midtrans.server_key' => 'server-secret']);
        $user = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Fraud', 'price' => 149000]);
        $transaction = Transaction::create(['transaction_code' => 'TRX-FRAUD', 'user_id' => $user->id, 'total_amount' => 149000, 'status' => 'pending']);
        TransactionItem::create(['transaction_id' => $transaction->id, 'product_id' => $product->id, 'price' => 149000]);
        $payload = ['order_id' => 'TRX-FRAUD', 'status_code' => '202', 'gross_amount' => '149000.00', 'transaction_status' => 'capture', 'payment_type' => 'credit_card', 'fraud_status' => 'deny'];
        $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'server-secret');

        $this->postJson('/midtrans/webhook', $payload)->assertOk();

        $this->assertSame('failed', $transaction->fresh()->status);
        $this->assertFalse($user->products()->whereKey($product->id)->exists());
        $this->assertSame(0, $product->fresh()->sold_count);
    }

    public function test_meta_purchase_uses_current_api_and_deduplication_id(): void
    {
        Mail::fake();
        Http::fake();
        SiteContent::create(['key' => 'site_settings', 'value' => json_encode(['meta_pixel_id' => '123456789', 'meta_access_token' => 'token'])]);
        $user = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Meta', 'price' => 1000]);
        $transaction = Transaction::create(['transaction_code' => 'TRX-META', 'user_id' => $user->id, 'total_amount' => 1000, 'status' => 'pending']);
        TransactionItem::create(['transaction_id' => $transaction->id, 'product_id' => $product->id, 'price' => 1000]);

        app(TransactionFinalizer::class)->apply($transaction, 'success');

        Http::assertSent(fn ($request) => $request->url() === 'https://graph.facebook.com/v26.0/123456789/events'
            && $request['data'][0]['event_id'] === 'TRX-META');
    }

    public function test_admin_settings_do_not_expose_saved_secrets_and_blank_values_preserve_them(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        SiteContent::create(['key' => 'site_settings', 'value' => json_encode([
            'midtrans_server_key' => 'server-secret',
            'midtrans_client_key' => 'client-key',
            'mail_password' => 'smtp-secret',
        ])]);

        $this->actingAs($admin)->get(route('admin.settings.index'))->assertInertia(fn (Assert $page) => $page
            ->missing('dbSettings.midtrans_server_key')
            ->missing('dbSettings.mail_password')
            ->where('dbSettings.midtrans_client_key', 'client-key'));

        $this->actingAs($admin)->post(route('admin.settings.store'), [
            'midtrans_server_key' => '',
            'midtrans_client_key' => 'client-key',
            'mail_password' => '',
        ])->assertSessionHasNoErrors();

        $saved = json_decode(SiteContent::where('key', 'site_settings')->value('value'), true);
        $this->assertSame('server-secret', $saved['midtrans_server_key']);
        $this->assertSame('smtp-secret', $saved['mail_password']);
    }

    public function test_webhook_rejected_when_server_key_empty(): void
    {
        config(['services.midtrans.server_key' => '']);

        $this->postJson('/midtrans/webhook', [
            'order_id' => 'TRX-NOKEY',
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => str_repeat('a', 128),
            'transaction_status' => 'settlement',
        ])->assertStatus(503);
    }

    public function test_security_headers_are_present_on_web_responses(): void
    {
        $this->assertFalse(Route::has('storage.local'));
        $this->assertSame(20, Config::$curlOptions[CURLOPT_TIMEOUT]);

        $response = $this->get('/');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
}
