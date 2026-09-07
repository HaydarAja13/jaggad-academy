<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CategorySlugTest extends TestCase
{
    use RefreshDatabase;

    public function test_editing_a_category_name_keeps_its_cms_slug_stable(): void
    {
        $category = Category::create([
            'name' => 'Video Kelas',
            'slug' => 'video',
            'description' => 'Deskripsi awal',
        ]);

        $category->update(['name' => 'Kelas Video Praktis']);

        $this->assertSame('video', $category->fresh()->slug);
    }

    public function test_products_page_opens_a_valid_category_and_rejects_an_unknown_one(): void
    {
        Category::create(['name' => 'Video Kelas', 'slug' => 'video']);

        $this->get(route('products', ['category' => 'video']))
            ->assertInertia(fn (Assert $page) => $page->component('Guest/Products')->where('category', 'video'));

        $this->get(route('products', ['category' => 'unknown']))
            ->assertInertia(fn (Assert $page) => $page->component('Guest/Products')->where('category', 'all'));
    }

    public function test_product_and_category_slugs_are_unique_in_the_database(): void
    {
        Category::create(['name' => 'Pertama', 'slug' => 'same-category']);
        Product::create(['name' => 'Pertama', 'slug' => 'same-product', 'price' => 1000]);

        try {
            Category::create(['name' => 'Kedua', 'slug' => 'same-category']);
            $this->fail('Database menerima slug kategori duplikat.');
        } catch (QueryException) {
            $this->assertTrue(true);
        }

        $this->expectException(QueryException::class);
        Product::create(['name' => 'Kedua', 'slug' => 'same-product', 'price' => 1000]);
    }

    public function test_generated_product_slug_is_readable_unique_and_stable(): void
    {
        $first = Product::create(['name' => 'Ebook Pemula', 'price' => 1000]);
        $second = Product::create(['name' => 'Ebook Pemula', 'price' => 1000]);

        $this->assertSame('ebook-pemula', $first->slug);
        $this->assertSame('ebook-pemula-2', $second->slug);

        $first->update(['name' => 'Ebook Pemula Edisi Baru']);
        $this->assertSame('ebook-pemula', $first->fresh()->slug);
    }
}
