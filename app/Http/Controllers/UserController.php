<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        $purchasedProducts = $user->products()->with('category')->get();
        // Load recent transactions
        $transactions = $user->transactions()
            ->with(['items.product', 'payment.paymentMethod'])
            ->latest()
            ->take(5)
            ->get();

        $paymentMethods = \App\Models\PaymentMethod::where('status', true)->get();

        return Inertia::render('User/UserDashboard', [
            'purchasedProducts' => $purchasedProducts,
            'transactions' => $transactions,
            'dbPaymentMethods' => $paymentMethods,
        ]);
    }

    public function learning(Request $request, \App\Models\Product $product)
    {
        $user = $request->user();
        
        // Ensure user owns this product
        if (!$user->products()->where('products.id', $product->id)->exists()) {
            abort(403, 'Anda tidak memiliki akses ke produk ini.');
        }

        $product->load('category');

        return Inertia::render('User/UserLearning', [
            'product' => $product,
            'completedMaterials' => DB::table('material_progress')
                ->where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->pluck('material_index'),
        ]);
    }

    public function completeMaterial(Request $request, \App\Models\Product $product, int $material)
    {
        $user = $request->user();
        if (!$user->products()->where('products.id', $product->id)->exists()) {
            abort(403);
        }

        $materials = is_array($product->materials) ? $product->materials : json_decode($product->materials ?: '[]', true);
        $selected = $materials[$material] ?? null;
        if (!$selected || empty($selected['link'])) {
            throw ValidationException::withMessages(['material' => 'Materi ini belum dapat diselesaikan.']);
        }

        $completed = $request->boolean('completed', true);
        if ($completed) {
            DB::table('material_progress')->updateOrInsert(
                ['user_id' => $user->id, 'product_id' => $product->id, 'material_index' => $material],
                ['completed_at' => now(), 'created_at' => now(), 'updated_at' => now()],
            );
        } else {
            DB::table('material_progress')
                ->where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->where('material_index', $material)
                ->delete();
        }

        return back()->with('success', $completed ? 'Materi ditandai selesai.' : 'Status materi diperbarui.');
    }
}
