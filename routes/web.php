<?php

use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminConsultationController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminTransactionController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\MidtransWebhookController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\UserController;
use App\Models\Product;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/products', [PublicController::class, 'products'])->name('products');
Route::get('/products/{product}', [PublicController::class, 'productDetail'])->name('products.detail');
Route::get('/konsultasi', [ConsultationController::class, 'index'])->name('consultations.index');
Route::post('/konsultasi', [ConsultationController::class, 'store'])->middleware('throttle:5,1')->name('consultations.store');
Route::get('/konsultasi/{consultationAppointment}/pembayaran', [ConsultationController::class, 'payment'])
    ->middleware('signed')->name('consultations.payment');
Route::post('/konsultasi/{consultationAppointment}/pembayaran', [CheckoutController::class, 'uploadConsultationProof'])
    ->middleware(['signed', 'throttle:5,1'])->name('consultations.payment.store');

Route::get('/about', function () {
    return Inertia::render('Guest/About');
})->name('about');

Route::get('/contact', function () {
    return Inertia::render('Guest/Contact');
})->name('contact');

Route::get('/products/{product}/sales', [PublicController::class, 'productSales'])->name('products.sales');

Route::get('/packages/{slug}', function ($slug) {
    $package = config("packages.{$slug}");
    abort_unless($package && Product::whereIn('slug', $package['products'])->count() === count($package['products']), 404);

    return Inertia::render('Guest/PackageLanding', [
        'slug' => $slug,
        'serverPackage' => ['name' => $package['name'], 'price' => $package['price']],
    ]);
})->name('packages.landing');

Route::middleware(['auth'])->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'process'])->middleware('throttle:10,1')->name('checkout.process');
    Route::post('/dashboard/transactions/{transaction}/proof', [CheckoutController::class, 'uploadProof'])->middleware('throttle:5,1')->name('transactions.proof');
    Route::get('/payments/{payment}/proof', [CheckoutController::class, 'proof'])->name('payments.proof');
    Route::post('/checkout/verify/{transaction}', [CheckoutController::class, 'verify'])->middleware('throttle:10,1')->name('checkout.verify');
});

Route::get('/promo', [PublicController::class, 'promo'])->name('ads');

Route::middleware(['auth'])->group(function () {
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

        Route::get('/consultations', [AdminConsultationController::class, 'index'])->name('consultations.index');
        Route::post('/consultations/settings', [AdminConsultationController::class, 'saveSettings'])->name('consultations.settings');
        Route::patch('/consultations/{consultationAppointment}/approve', [AdminConsultationController::class, 'approve'])->name('consultations.approve');
        Route::patch('/consultations/{consultationAppointment}/reject', [AdminConsultationController::class, 'reject'])->name('consultations.reject');
        Route::patch('/consultations/{consultationAppointment}/reschedule', [AdminConsultationController::class, 'reschedule'])->name('consultations.reschedule');
        Route::patch('/consultations/{consultationAppointment}/complete', [AdminConsultationController::class, 'complete'])->name('consultations.complete');
        Route::patch('/consultations/{consultationAppointment}/cancel', [AdminConsultationController::class, 'cancel'])->name('consultations.cancel');
        Route::patch('/consultations/{consultationAppointment}/refund', [AdminConsultationController::class, 'refund'])->name('consultations.refund');

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
        Route::post('/settings/reset-data', [AdminSettingController::class, 'resetData'])->name('settings.reset-data');
        Route::post('/settings/reset-stats', [AdminSettingController::class, 'resetStats'])->name('settings.reset-stats');

        Route::get('/payment', [AdminPaymentController::class, 'index'])->name('payment.index');
        Route::post('/payment', [AdminPaymentController::class, 'store'])->name('payment.store');
        Route::put('/payment/{paymentMethod}', [AdminPaymentController::class, 'update'])->name('payment.update');
        Route::patch('/payment/{paymentMethod}/toggle', [AdminPaymentController::class, 'toggle'])->name('payment.toggle');
        Route::delete('/payment/{paymentMethod}', [AdminPaymentController::class, 'destroy'])->name('payment.destroy');

        Route::get('/chatbot', [AdminSettingController::class, 'chatbot'])->name('chatbot.index');
    });
});

Route::post('/midtrans/webhook', [MidtransWebhookController::class, 'handle']);

require __DIR__.'/auth.php';
