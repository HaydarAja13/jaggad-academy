<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeToastProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_receives_catalog_products_for_purchase_activity_toast(): void
    {
        Product::create(['name' => 'Kelas A', 'price' => 100000]);
        Product::create(['name' => 'Kelas B', 'price' => 200000]);

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->component('Guest/Welcome')
            ->has('toastProducts', 2)
            ->has('toastProducts.0', fn (Assert $product) => $product
                ->has('id')
                ->has('name')));
    }
}
