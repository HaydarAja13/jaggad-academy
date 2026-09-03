<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;

class PublicController extends Controller
{
    public function home()
    {
        $content = \App\Models\SiteContent::where('key', 'site_content')->first();
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

        $categories = Category::withCount('products')->get();
        
        $stats = [
            'users' => \App\Models\User::where('role', 'customer')->count(),
            'products' => Product::count(),
            'sales' => \App\Models\Transaction::where('status', 'success')->count(),
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
        
        // Similar products
        $similarProducts = Product::with('category')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(3)
            ->get();

        return Inertia::render('Guest/ProductDetail', [
            'product' => $product,
            'similarProducts' => $similarProducts
        ]);
    }
    public function productSales(Product $product)
    {
        $product->load('category');
        return Inertia::render('Guest/ProductSales', [
            'product' => $product
        ]);
    }

    public function promo()
    {
        $adsData = \App\Models\SiteContent::where('key', 'ads_promo')->first();
        return Inertia::render('Guest/Ads', [
            'dbAds' => $adsData ? $adsData->value : null,
            'dbProducts' => \App\Models\Product::with('category')->get()
        ]);
    }
}
