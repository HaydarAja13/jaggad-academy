<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Field "URL gambar" di form edit bisa terisi path lokal hasil upload
 * (/storage/...) — tidak boleh gagal validasi karena bukan URL eksternal.
 */
class AdminProductImageUrlTest extends TestCase
{
    use RefreshDatabase;

    public function test_edit_product_with_prefilled_storage_path_does_not_fail_url_validation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create([
            'name' => 'Kelas Terupload',
            'price' => 50000,
            'status' => 'published',
            'image' => 'products/cover-lama.webp',
        ]);

        // Bundle JS lama mengirim path lokal lewat imageUrl (bukan URL http).
        $this->actingAs($admin)
            ->put(route('admin.products.update', $product->slug), [
                'title' => 'Kelas Terupload',
                'price' => 50000,
                'status' => 'published',
                'imageUrl' => '/storage/products/cover-lama.webp',
            ])
            ->assertSessionHasNoErrors();

        // Gambar tetap tidak berubah.
        $this->assertSame('products/cover-lama.webp', $product->fresh()->image);
    }

    public function test_edit_product_with_real_external_url_is_accepted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create([
            'name' => 'Kelas Eksternal',
            'price' => 50000,
            'status' => 'published',
        ]);

        $this->actingAs($admin)
            ->put(route('admin.products.update', $product->slug), [
                'title' => 'Kelas Eksternal',
                'price' => 50000,
                'status' => 'published',
                'imageUrl' => 'https://cdn.example.com/cover.jpg',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('https://cdn.example.com/cover.jpg', $product->fresh()->image);
    }

    public function test_edit_product_with_bogus_url_still_fails(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create([
            'name' => 'Kelas Validasi',
            'price' => 50000,
            'status' => 'published',
        ]);

        $this->actingAs($admin)
            ->put(route('admin.products.update', $product->slug), [
                'title' => 'Kelas Validasi',
                'price' => 50000,
                'status' => 'published',
                'imageUrl' => 'bukan-url-sama-sekali',
            ])
            ->assertSessionHasErrors('imageUrl');
    }
}
