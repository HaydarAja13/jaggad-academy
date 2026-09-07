<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function home()
    {
        $content = SiteContent::where('key', 'site_content')->first();
        $content = $content ? json_decode($content->value, true) : [];
        $featuredIds = collect($content['home']['featuredProductIds'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->take(6)
            ->values();

        $featuredProducts = $featuredIds->isEmpty()
            ? Product::with('category')->latest()->take(6)->get()
            : Product::with('category')->whereIn('id', $featuredIds)->get()
                ->sortBy(fn ($product) => $featuredIds->search($product->id))
                ->values();
        $featuredProducts->each(fn (Product $product) => $this->hideMaterialLinks($product));

        $categories = Category::withCount('products')->get();

        $stats = [
            'users' => User::where('role', 'customer')->count(),
            'products' => Product::count(),
            'sales' => Transaction::where('status', 'success')->count(),
        ];

        return Inertia::render('Guest/Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'products' => $featuredProducts,
            'toastProducts' => Product::query()
                ->whereNotNull('name')
                ->where('name', '!=', '')
                ->latest()
                ->get(['id', 'name']),
            'categories' => $categories,
            'dbStats' => $stats,
        ]);
    }

    public function products(Request $request)
    {
        $products = Product::with('category')->latest()->get();
        $products->each(fn (Product $product) => $this->hideMaterialLinks($product));
        $categories = Category::all();

        return Inertia::render('Guest/Products', [
            'products' => $products,
            'categories' => $categories,
            'category' => $categories->contains('slug', $request->query('category')) ? $request->query('category') : 'all',
        ]);
    }

    public function productDetail(Product $product)
    {
        $product->load('category');
        $this->hideMaterialLinks($product);

        // Similar products
        $similarProducts = Product::with('category')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(3)
            ->get();
        $similarProducts->each(fn (Product $similar) => $this->hideMaterialLinks($similar));

        return Inertia::render('Guest/ProductDetail', [
            'product' => $product,
            'similarProducts' => $similarProducts,
        ]);
    }

    public function productSales(Product $product)
    {
        $product->load('category');
        $this->hideMaterialLinks($product);

        return Inertia::render('Guest/ProductSales', [
            'product' => $product,
        ]);
    }

    public function promo()
    {
        $adsData = SiteContent::where('key', 'ads_promo')->first();
        $products = Product::with('category')->get();
        $products->each(fn (Product $product) => $this->hideMaterialLinks($product));

        return Inertia::render('Guest/Ads', [
            'dbAds' => $adsData ? $adsData->value : null,
            'dbProducts' => $products,
        ]);
    }

    private function hideMaterialLinks(Product $product): void
    {
        $product->setAttribute('materials', collect($product->materials ?? [])
            ->map(fn ($material) => is_array($material) ? Arr::except($material, ['link']) : $material)
            ->all());
    }
}
