<?php

namespace Tests\Feature;

use App\Models\Category;
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
}
