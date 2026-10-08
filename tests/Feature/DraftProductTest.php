<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DraftProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_draft_product_is_hidden_from_all_public_pages(): void
    {
        Product::create(['name' => 'Kelas Draft', 'price' => 100000, 'status' => 'draft']);
        $published = Product::create(['name' => 'Kelas Publish', 'price' => 100000, 'status' => 'published']);

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->component('Guest/Welcome')
            ->has('products', 1)
            ->has('toastProducts', 1)
            ->where('products.0.id', $published->id));

        $this->get(route('products'))->assertInertia(fn (Assert $page) => $page
            ->component('Guest/Products')
            ->has('products', 1));

        $this->get(route('ads'))->assertInertia(fn (Assert $page) => $page
            ->component('Guest/Ads')
            ->has('dbProducts', 1));
    }

    public function test_draft_product_detail_and_sales_pages_return_404(): void
    {
        $draft = Product::create(['name' => 'Kelas Draft', 'price' => 100000, 'status' => 'draft']);

        $this->get(route('products.detail', $draft))->assertNotFound();
        $this->get(route('products.sales', $draft))->assertNotFound();
    }

    public function test_draft_product_cannot_be_checked_out(): void
    {
        Storage::fake('local');
        $customer = User::factory()->create();
        $draft = Product::create(['name' => 'Kelas Draft', 'price' => 100000, 'status' => 'draft']);
        $method = PaymentMethod::create([
            'type' => PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'BCA',
            'account_name' => 'JAGGAD ACADEMY',
            'account_number' => '1234567890',
            'status' => true,
        ]);

        $this->actingAs($customer)->post(route('checkout.process'), [
            'phone' => '081234567890',
            'payment_method_id' => $method->id,
            'cart' => [['id' => $draft->id]],
            'proof' => UploadedFile::fake()->image('bukti.png', 900, 600),
        ])->assertSessionHasErrors('cart');

        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_admin_product_defaults_to_draft_and_can_be_published(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $this->post(route('admin.products.store'), [
            'title' => 'Kelas Baru',
            'price' => 50000,
        ])->assertSessionHasNoErrors();

        $product = Product::where('name', 'Kelas Baru')->firstOrFail();
        $this->assertSame('draft', $product->status);
        $this->get(route('products.detail', $product))->assertNotFound();

        $this->patch(route('admin.products.status', $product), ['status' => 'published'])
            ->assertSessionHasNoErrors();

        $this->assertSame('published', $product->fresh()->status);
        $this->get(route('products.detail', $product))->assertOk();
    }

    public function test_admin_can_return_published_product_to_draft(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create(['name' => 'Kelas Publish', 'price' => 100000, 'status' => 'published']);

        $this->actingAs($admin)->patch(route('admin.products.status', $product), ['status' => 'draft'])
            ->assertSessionHasNoErrors();

        $this->assertSame('draft', $product->fresh()->status);
        $this->get(route('products.detail', $product))->assertNotFound();
        $this->get(route('products'))->assertInertia(fn (Assert $page) => $page
            ->has('products', 0));
    }

    public function test_owner_keeps_learning_access_after_product_returns_to_draft(): void
    {
        $customer = User::factory()->create();
        $product = Product::create(['name' => 'Kelas Publish', 'price' => 100000, 'status' => 'published']);
        $customer->products()->attach($product->id, ['purchased_at' => now()]);

        $product->update(['status' => 'draft']);

        $this->actingAs($customer)->get(route('dashboard.learning', $product))->assertOk();
    }

    public function test_promo_page_rejects_draft_products(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $draft = Product::create(['name' => 'Kelas Draft', 'price' => 100000, 'status' => 'draft']);

        $this->actingAs($admin)->post(route('admin.ads.store'), [
            'hero' => [
                'badge' => 'Promo',
                'title' => 'Promo terarah',
                'subtitle' => 'Pilih program.',
                'mediaType' => 'image',
                'imageAlt' => 'Promo',
                'videoUrl' => null,
                'guarantee' => 'Info mengikuti produk.',
            ],
            'urgency' => ['countdownHours' => 12, 'quotaText' => 'Terbatas.', 'ctaNote' => 'Periksa dulu.'],
            'proofItems' => ['Akses dashboard', 'Belajar fleksibel', 'Pilihan terkurasi'],
            'offers' => ['title' => 'Pilihan promo', 'description' => 'Bandingkan.'],
            'trust' => [
                'title' => 'Jelas',
                'description' => 'Info tersedia.',
                'items' => [
                    ['title' => 'Harga', 'description' => 'Ikut katalog.'],
                    ['title' => 'Akses', 'description' => 'Via dashboard.'],
                    ['title' => 'Bantuan', 'description' => 'Hubungi tim.'],
                ],
            ],
            'cta' => ['primary' => 'Lihat penawaran'],
            'closing' => [
                'title' => 'Siap?',
                'description' => 'Periksa.',
                'primary' => 'Pilih promo',
                'secondary' => 'Konsultasi',
                'asideTitle' => 'Ragu?',
                'asideDescription' => 'Hubungi kami.',
            ],
            'selectedProductIds' => [$draft->id],
        ])->assertSessionHasErrors('selectedProductIds');
    }

    public function test_admin_product_list_still_shows_drafts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Product::create(['name' => 'Kelas Draft', 'price' => 100000, 'status' => 'draft']);
        Product::create(['name' => 'Kelas Publish', 'price' => 100000, 'status' => 'published']);

        $this->actingAs($admin)->get(route('admin.products.index'))->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AdminProducts')
            ->has('dbProducts', 2));
    }
}
