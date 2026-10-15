<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSlugTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_set_custom_slug_on_create(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.products.store'), [
                'title' => 'Produk Uji Slug',
                'slug' => 'produk-custom',
                'price' => 100000,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', ['slug' => 'produk-custom']);
    }

    public function test_slug_is_generated_from_name_when_left_empty(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.products.store'), [
                'title' => 'Produk Otomatis',
                'price' => 50000,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', ['slug' => 'produk-otomatis']);
    }

    public function test_duplicate_slug_is_rejected(): void
    {
        Product::create(['name' => 'Existing', 'slug' => 'sudah-ada', 'price' => 1000, 'status' => 'published']);

        $this->actingAs($this->admin())
            ->from(route('admin.products.create'))
            ->post(route('admin.products.store'), [
                'title' => 'Produk Baru',
                'slug' => 'sudah-ada',
                'price' => 1000,
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('slug');

        $this->assertDatabaseMissing('products', ['slug' => 'sudah-ada', 'name' => 'Produk Baru']);
    }

    public function test_invalid_slug_format_is_rejected(): void
    {
        $this->actingAs($this->admin())
            ->from(route('admin.products.create'))
            ->post(route('admin.products.store'), [
                'title' => 'Produk Baru',
                'slug' => 'Slug Tidak Valid!',
                'price' => 1000,
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('slug');
    }

    public function test_changing_slug_records_history_and_old_url_redirects_permanently(): void
    {
        Product::create(['name' => 'Produk Ganti', 'slug' => 'lama', 'price' => 1000, 'status' => 'published']);

        $this->actingAs($this->admin())
            ->put(route('admin.products.update', 'lama'), [
                'title' => 'Produk Ganti',
                'slug' => 'baru',
                'price' => 1000,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.products.index'));

        $product = Product::where('slug', 'baru')->firstOrFail();
        $this->assertContains('lama', $product->previous_slugs ?? []);

        // URL lama redirect permanen (301) ke URL baru — detail & sales.
        $this->get('/products/lama')->assertStatus(301)->assertRedirect(route('products.detail', 'baru'));
        $this->get('/products/lama/sales')->assertStatus(301);
        $this->get('/products/baru')->assertStatus(200);
    }

    public function test_previous_slugs_from_seeded_data_redirect(): void
    {
        Product::create([
            'name' => 'Produk Redirect',
            'slug' => 'slug-baru',
            'previous_slugs' => ['slug-lama'],
            'price' => 100000,
            'status' => Product::STATUS_PUBLISHED,
        ]);

        $this->get('/products/slug-lama')
            ->assertStatus(301)
            ->assertRedirect(route('products.detail', 'slug-baru'));

        $this->get('/products/slug-lama/sales')->assertStatus(301);
        $this->get('/products/slug-baru')->assertStatus(200);
    }

    public function test_leaving_slug_empty_on_update_keeps_existing_slug(): void
    {
        Product::create(['name' => 'Produk Tetap', 'slug' => 'tetap-sini', 'price' => 1000, 'status' => 'published']);

        $this->actingAs($this->admin())
            ->put(route('admin.products.update', 'tetap-sini'), [
                'title' => 'Produk Tetap Diperbarui',
                'slug' => '',
                'price' => 2000,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', ['slug' => 'tetap-sini', 'name' => 'Produk Tetap Diperbarui']);
    }
}
