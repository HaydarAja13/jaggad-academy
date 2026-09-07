<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        // Ensure all products have slugs
        Product::whereNull('slug')->orWhere('slug', '')->get()->each(function ($p) {
            $p->slug = Str::slug($p->name).'-'.uniqid();
            $p->save();
        });

        $products = Product::with('category')->latest()->get();

        return Inertia::render('Admin/AdminProducts', [
            'dbProducts' => $products,
        ]);
    }

    public function create()
    {
        $categories = Category::all();

        return Inertia::render('Admin/AdminProductForm', [
            'dbCategories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'originalPrice' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'longDescription' => 'nullable|string',
            'badge' => 'nullable|string|max:255',
            'imageFile' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'imageUrl' => 'nullable|url:http,https|max:2048',
            'benefits' => 'nullable|array',
            'benefits.*' => 'string|max:500',
            'materials' => 'nullable|array',
            'materials.*.title' => 'required|string|max:255',
            'materials.*.duration' => 'nullable|string|max:100',
            'materials.*.link' => 'nullable|url:http,https|max:2048',
            'materials.*.pages' => 'nullable|integer|min:0',
            'materials.*.videos' => 'nullable|integer|min:0',
            'startAt' => 'nullable|date',
            'endAt' => 'nullable|date|after_or_equal:startAt',
            'location' => 'nullable|string|max:255',
            'landingBlocks' => 'nullable|string|max:50000',
            'landingBlockImages.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $imagePath = $data['imageUrl'] ?? null;
        if ($request->hasFile('imageFile')) {
            $imagePath = $this->saveImageAsWebp($request->file('imageFile'), 'products');
        }

        // Handle landing block images
        $landingBlocks = [];
        if ($request->filled('landingBlocks')) {
            $landingBlocks = json_decode($request->landingBlocks, true) ?: [];
        }
        // Upload new images from block files
        if ($request->hasFile('landingBlockImages')) {
            foreach ($request->file('landingBlockImages') as $key => $file) {
                $path = $this->saveImageAsWebp($file, 'landing');
                // key format: "blockIdx_imageIdx" or "blockIdx"
                [$blockIdx] = array_pad(explode('_', $key), 2, null);
                if (isset($landingBlocks[$blockIdx])) {
                    if ($landingBlocks[$blockIdx]['type'] === 'image') {
                        $landingBlocks[$blockIdx]['url'] = $path;
                    } elseif ($landingBlocks[$blockIdx]['type'] === 'slider') {
                        $imageIdx = explode('_', $key)[1] ?? 0;
                        $landingBlocks[$blockIdx]['images'][$imageIdx] = $path;
                    }
                }
            }
        }

        Product::create([
            'name' => $data['title'],
            'category_id' => $data['category'] ?? null,
            'price' => $data['price'],
            'normal_price' => $data['originalPrice'] ?? null,
            'image' => $imagePath,
            'badge' => $data['badge'] ?? null,
            'short_description' => $data['description'] ?? null,
            'description' => $data['longDescription'] ?? null,
            'benefits' => $data['benefits'] ?? [],
            'materials' => $data['materials'] ?? [],
            'start_at' => $data['startAt'] ?? null,
            'end_at' => $data['endAt'] ?? null,
            'location' => $data['location'] ?? null,
            'landing_blocks' => $landingBlocks,
        ]);

        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(Product $product)
    {
        $categories = Category::all();

        return Inertia::render('Admin/AdminProductForm', [
            'product' => $product,
            'dbCategories' => $categories,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'nullable|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'originalPrice' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'longDescription' => 'nullable|string',
            'badge' => 'nullable|string|max:255',
            'imageFile' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'imageUrl' => 'nullable|url:http,https|max:2048',
            'benefits' => 'nullable|array',
            'benefits.*' => 'string|max:500',
            'materials' => 'nullable|array',
            'materials.*.title' => 'required|string|max:255',
            'materials.*.duration' => 'nullable|string|max:100',
            'materials.*.link' => 'nullable|url:http,https|max:2048',
            'materials.*.pages' => 'nullable|integer|min:0',
            'materials.*.videos' => 'nullable|integer|min:0',
            'startAt' => 'nullable|date',
            'endAt' => 'nullable|date|after_or_equal:startAt',
            'location' => 'nullable|string|max:255',
            'landingBlocks' => 'nullable|string|max:50000',
            'landingBlockImages.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $imagePath = $product->image;
        if ($request->hasFile('imageFile')) {
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = $this->saveImageAsWebp($request->file('imageFile'), 'products');
        } elseif (! empty($data['imageUrl'])) {
            $imagePath = $data['imageUrl'];
        }

        // Handle landing block images
        $landingBlocks = $product->landing_blocks ?: [];
        if ($request->filled('landingBlocks')) {
            $landingBlocks = json_decode($request->landingBlocks, true) ?: [];
        }
        if ($request->hasFile('landingBlockImages')) {
            foreach ($request->file('landingBlockImages') as $key => $file) {
                $path = $this->saveImageAsWebp($file, 'landing');
                [$blockIdx] = array_pad(explode('_', $key), 2, null);
                if (isset($landingBlocks[$blockIdx])) {
                    if ($landingBlocks[$blockIdx]['type'] === 'image') {
                        $landingBlocks[$blockIdx]['url'] = $path;
                    } elseif ($landingBlocks[$blockIdx]['type'] === 'slider') {
                        $imageIdx = explode('_', $key)[1] ?? 0;
                        $landingBlocks[$blockIdx]['images'][$imageIdx] = $path;
                    }
                }
            }
        }

        $product->update([
            'name' => $data['title'],
            'category_id' => $data['category'] ?? null,
            'price' => $data['price'],
            'normal_price' => $data['originalPrice'] ?? null,
            'image' => $imagePath,
            'badge' => $data['badge'] ?? null,
            'short_description' => $data['description'] ?? null,
            'description' => $data['longDescription'] ?? null,
            'benefits' => $data['benefits'] ?? [],
            'materials' => $data['materials'] ?? [],
            'start_at' => $data['startAt'] ?? null,
            'end_at' => $data['endAt'] ?? null,
            'location' => $data['location'] ?? null,
            'landing_blocks' => $landingBlocks,
        ]);

        return redirect()->route('admin.products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product)
    {
        if ($product->transactionItems()->exists() || $product->users()->exists()) {
            throw ValidationException::withMessages([
                'product' => 'Produk yang memiliki histori transaksi atau akses pelanggan tidak dapat dihapus.',
            ]);
        }

        // Delete thumbnail
        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

        // Delete landing block images
        $blocks = is_array($product->landing_blocks) ? $product->landing_blocks : json_decode($product->landing_blocks, true) ?? [];
        foreach ($blocks as $b) {
            if ($b['type'] === 'image' && ! empty($b['url']) && ! str_starts_with($b['url'], 'http')) {
                if (Storage::disk('public')->exists($b['url'])) {
                    Storage::disk('public')->delete($b['url']);
                }
            }
            if ($b['type'] === 'slider' && ! empty($b['images'])) {
                foreach ($b['images'] as $img) {
                    if (! str_starts_with($img, 'http') && Storage::disk('public')->exists($img)) {
                        Storage::disk('public')->delete($img);
                    }
                }
            }
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }

    public function updateLandingBlocks(Request $request, Product $product)
    {
        $request->validate([
            'salesContent' => 'required|json',
            'salesHeroImage' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'salesBlockImages.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        $salesContent = json_decode($request->salesContent, true);
        validator($salesContent, [
            'hero' => 'required|array',
            'hero.title' => 'required|string|max:255',
            'hero.description' => 'nullable|string|max:3000',
            'hero.benefits' => 'nullable|array|max:12',
            'hero.benefits.*' => 'nullable|string|max:300',
            'hero.image' => 'nullable|string|max:2048',
            'offer' => 'required|array',
            'offer.label' => 'required|string|max:120',
            'offer.headerCta' => 'required|string|max:80',
            'offer.cta' => 'required|string|max:80',
            'offer.trustNote' => 'required|string|max:300',
            'outcomes.title' => 'required|string|max:160',
            'outcomes.description' => 'nullable|string|max:500',
            'materials.title' => 'required|string|max:160',
            'materials.description' => 'nullable|string|max:500',
            'blocks' => 'nullable|array|max:30',
            'blocks.*.type' => 'required|in:image,slider,youtube,button',
            'blocks.*.url' => 'nullable|string|max:2048',
            'blocks.*.label' => 'nullable|string|max:120',
            'blocks.*.images' => 'nullable|array|max:20',
            'blocks.*.images.*' => 'nullable|string|max:2048',
            'faq.title' => 'required|string|max:160',
            'faq.description' => 'nullable|string|max:500',
            'faq.items' => 'nullable|array|max:12',
            'faq.items.*.q' => 'nullable|string|max:240',
            'faq.items.*.a' => 'nullable|string|max:2000',
            'urgency.countdownHours' => 'nullable|integer|min:0|max:8760',
            'urgency.quotaText' => 'nullable|string|max:255',
            'closing.title' => 'required|string|max:200',
            'closing.description' => 'nullable|string|max:600',
            'closing.cta' => 'required|string|max:80',
            'confirmation.heading' => 'required|string|max:200',
            'confirmation.description' => 'nullable|string|max:600',
            'confirmation.backLabel' => 'required|string|max:80',
            'confirmation.orderTitle' => 'required|string|max:120',
            'confirmation.payCta' => 'required|string|max:80',
            'confirmation.ownedCta' => 'required|string|max:80',
            'confirmation.trustNote' => 'required|string|max:300',
        ])->validate();

        $oldImages = $this->salesImages($product->sales_content ?: []);

        if ($request->hasFile('salesHeroImage')) {
            $salesContent['hero']['image'] = $this->saveImageAsWebp($request->file('salesHeroImage'), 'landing');
        }

        if ($request->hasFile('salesBlockImages')) {
            foreach ($request->file('salesBlockImages') as $key => $file) {
                $path = $this->saveImageAsWebp($file, 'landing');
                $parts = explode('_', $key);
                $blockIdx = $parts[0] ?? null;
                if ($blockIdx !== null && isset($salesContent['blocks'][$blockIdx])) {
                    if ($salesContent['blocks'][$blockIdx]['type'] === 'image') {
                        $salesContent['blocks'][$blockIdx]['url'] = $path;
                    } elseif ($salesContent['blocks'][$blockIdx]['type'] === 'slider') {
                        $imageIdx = $parts[1] ?? 0;
                        $salesContent['blocks'][$blockIdx]['images'][$imageIdx] = $path;
                    }
                }
            }
        }

        $product->update(['sales_content' => $salesContent]);

        foreach (array_diff($oldImages, $this->salesImages($salesContent)) as $img) {
            if (Storage::disk('public')->exists($img)) {
                Storage::disk('public')->delete($img);
            }
        }

        return back()->with('success', 'Halaman penjualan berhasil diperbarui.');
    }

    private function salesImages(array $content): array
    {
        $images = [];
        $hero = $content['hero']['image'] ?? null;
        if ($hero && ! str_starts_with($hero, 'http')) {
            $images[] = $hero;
        }

        foreach ($content['blocks'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'image' && ! empty($block['url']) && ! str_starts_with($block['url'], 'http')) {
                $images[] = $block['url'];
            }
            foreach ($block['images'] ?? [] as $image) {
                if ($image && ! str_starts_with($image, 'http')) {
                    $images[] = $image;
                }
            }
        }

        return $images;
    }

    private function saveImageAsWebp($file, $directory)
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new WebpEncoder(80));
        $filename = uniqid().'.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }
}
