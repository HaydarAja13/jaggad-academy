<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
class AdminCategoryController extends Controller
{
    public function index()
    {
        // Ensure all categories have slugs
        \App\Models\Category::whereNull('slug')->orWhere('slug', '')->get()->each(function($c) {
            $c->slug = \Illuminate\Support\Str::slug($c->name);
            $c->save();
        });

        // Get all categories with product count
        $categories = Category::withCount('products')->latest()->get();
        return Inertia::render('Admin/AdminCategories', [
            'dbCategories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string|max:255|unique:categories,slug',
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'imageFile' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('imageFile')) {
            $imagePath = $this->saveImageAsWebp($request->file('imageFile'), 'categories');
        }

        Category::create([
            'name' => $data['label'],
            'slug' => Str::slug($data['id']),
            'description' => ($data['description'] ?? null) ?: 'Kategori ' . $data['label'],
            'image' => $imagePath,
            'is_active' => true,
        ]);

        return back()->with('success', 'Kategori baru berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'imageFile' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $imagePath = $category->image;
        if ($request->hasFile('imageFile')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $imagePath = $this->saveImageAsWebp($request->file('imageFile'), 'categories');
        }

        $category->update([
            'name' => $data['label'],
            'description' => $data['description'] ?? null,
            'image' => $imagePath,
        ]);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return back()->withErrors(['message' => 'Kategori tidak bisa dihapus karena memiliki produk terkait.']);
        }

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    private function saveImageAsWebp($file, $directory)
    {
        $manager = new ImageManager(new Driver());
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new WebpEncoder(80));
        $filename = uniqid() . '.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, (string) $encoded);
        return $path;
    }
}
