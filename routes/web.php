<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminTransactionController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminUserController;

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/products', [PublicController::class, 'products'])->name('products');
Route::get('/products/{product}', [PublicController::class, 'productDetail'])->name('products.detail');


Route::get('/about', function () {
    return Inertia::render('Guest/About');
})->name('about');

Route::get('/contact', function () {
    return Inertia::render('Guest/Contact');
})->name('contact');

Route::get('/products/{product}/sales', [PublicController::class, 'productSales'])->name('products.sales');

Route::get('/packages/{slug}', function ($slug) {
    abort_unless(config("packages.{$slug}"), 404);

    return Inertia::render('Guest/PackageLanding', ['slug' => $slug]);
})->name('packages.landing');

Route::middleware(['auth'])->group(function() {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
    Route::post('/dashboard/transactions/{transaction}/proof', [CheckoutController::class, 'uploadProof'])->name('transactions.proof');
    Route::post('/checkout/verify/{transaction}', [CheckoutController::class, 'verify'])->name('checkout.verify');
});


Route::get('/promo', [PublicController::class, 'promo'])->name('ads');

Route::middleware(['auth'])->group(function() {
    Route::get('/dashboard', [UserController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/learning/{product}', [UserController::class, 'learning'])->name('dashboard.learning');
    Route::post('/dashboard/learning/{product}/materials/{material}/complete', [UserController::class, 'completeMaterial'])->name('dashboard.learning.complete');
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', function () {
        return Inertia::render('User/EditProfile');
    })->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
        Route::match(['POST', 'PUT'], '/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::post('/products/{product}/landing-blocks', [AdminProductController::class, 'updateLandingBlocks'])->name('products.landing');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');

        Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/export', [AdminTransactionController::class, 'exportCsv'])->name('transactions.export');
        Route::patch('/transactions/{transaction}/approve', [AdminTransactionController::class, 'approve'])->name('transactions.approve');
        Route::patch('/transactions/{transaction}/reject', [AdminTransactionController::class, 'reject'])->name('transactions.reject');
        Route::post('/transactions/{transaction}/resend-access-email', [AdminTransactionController::class, 'resendAccessEmail'])->name('transactions.resend-email');


        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::patch('/users/{user}/toggle', [AdminUserController::class, 'toggleStatus'])->name('users.toggle');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        Route::get('/testimonials', function () {
            return Inertia::render('Admin/AdminTestimonials');
        })->name('testimonials.index');

        Route::get('/content', [AdminSettingController::class, 'content'])->name('content.index');
        Route::post('/content', [AdminSettingController::class, 'saveContent'])->name('content.store');

        Route::get('/ads', [AdminSettingController::class, 'ads'])->name('ads.index');
        Route::post('/ads', [AdminSettingController::class, 'saveAds'])->name('ads.store');

        Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [AdminSettingController::class, 'saveSettings'])->name('settings.store');

        Route::get('/payment', [AdminPaymentController::class, 'index'])->name('payment.index');
        Route::post('/payment', [AdminPaymentController::class, 'store'])->name('payment.store');
        Route::put('/payment/{paymentMethod}', [AdminPaymentController::class, 'update'])->name('payment.update');
        Route::patch('/payment/{paymentMethod}/toggle', [AdminPaymentController::class, 'toggle'])->name('payment.toggle');
        Route::delete('/payment/{paymentMethod}', [AdminPaymentController::class, 'destroy'])->name('payment.destroy');

        Route::get('/chatbot', [AdminSettingController::class, 'chatbot'])->name('chatbot.index');
    });
});

Route::post('/midtrans/webhook', [\App\Http\Controllers\MidtransWebhookController::class, 'handle']);

require __DIR__.'/auth.php';

// Google Auth
Route::get('auth/google', [App\Http\Controllers\Auth\GoogleController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('auth/google/callback', [App\Http\Controllers\Auth\GoogleController::class, 'handleGoogleCallback']);
