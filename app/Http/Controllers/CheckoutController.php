<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Payment;
use App\Services\TransactionFinalizer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;

class CheckoutController extends Controller
{
    public function index()
    {
        $paymentMethods = PaymentMethod::where(function ($query) {
            $query->where('type', PaymentMethod::TYPE_MIDTRANS)
                ->orWhere(function ($bankQuery) {
                    $bankQuery->where('type', PaymentMethod::TYPE_BANK_TRANSFER)
                        ->where('status', true);
                });
        })->orderBy('id')->get();

        return Inertia::render('Guest/Checkout', [
            'dbPaymentMethods' => $paymentMethods,
        ]);
    }

    public function process(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:32',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'nullable|required_without:cart.*.package_slug|integer|distinct|exists:products,id',
            'cart.*.package_slug' => 'nullable|required_without:cart.*.id|string|distinct',
            'active_trx' => 'nullable|string|max:40',
            'proof' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        [$products, $linePrices, $itemDetails, $grandTotal] = $this->resolveCart($validated['cart']);

        $user = $request->user();
        $ownedProducts = $user->products()
            ->whereIn('products.id', $products->keys())
            ->pluck('products.name');
        if ($ownedProducts->isNotEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Anda sudah memiliki produk berikut: ' . $ownedProducts->join(', ') . '.',
            ]);
        }

        $paymentMethod = PaymentMethod::findOrFail($validated['payment_method_id']);
        if (!$paymentMethod->status) {
            throw ValidationException::withMessages(['payment_method_id' => 'Metode pembayaran ini sedang tidak tersedia.']);
        }

        $isManual = $paymentMethod->type === PaymentMethod::TYPE_BANK_TRANSFER;
        if ($isManual) {
            $request->validate(['proof' => 'required|image|mimes:jpg,jpeg,png|max:5120']);
        } elseif (empty(config('services.midtrans.server_key')) || empty(config('services.midtrans.client_key'))) {
            throw ValidationException::withMessages(['payment_method_id' => 'Midtrans masih dalam pemeliharaan. Silakan gunakan transfer bank.']);
        }

        // Update user phone if empty
        if (empty($user->phone)) {
            $user->update(['phone' => $request->phone]);
        }

        $proofPath = $isManual ? $this->saveImageAsWebp($request->file('proof'), 'payments') : null;
        try {
            $transaction = DB::transaction(function () use ($validated, $user, $grandTotal, $products, $linePrices, $isManual, $proofPath, $paymentMethod) {
                $transaction = null;
                if (!empty($validated['active_trx'])) {
                    $transaction = Transaction::where('transaction_code', $validated['active_trx'])
                        ->where('user_id', $user->id)
                        ->where('status', 'pending')
                        ->lockForUpdate()
                        ->first();

                    if ($transaction?->snap_token) {
                        $transaction = null;
                    }
                }

                if ($transaction) {
                    $transaction->update(['total_amount' => $grandTotal, 'snap_token' => null]);
                    $transaction->items()->delete();
                    $transaction->payment?->delete();
                } else {
                    $transaction = Transaction::create([
                        'transaction_code' => 'TRX-' . strtoupper(Str::random(8)),
                        'user_id' => $user->id,
                        'total_amount' => $grandTotal,
                        'status' => 'pending',
                    ]);
                }

                foreach ($products as $product) {
                    TransactionItem::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $product->id,
                        'price' => $linePrices[$product->id],
                    ]);
                }

                if ($isManual) {
                    Payment::create([
                        'transaction_id' => $transaction->id,
                        'payment_method_id' => $paymentMethod->id,
                        'amount' => $grandTotal,
                        'proof_image' => $proofPath,
                        'status' => 'pending',
                    ]);
                }

                return $transaction;
            });
        } catch (\Throwable $exception) {
            if ($proofPath) {
                Storage::disk('public')->delete($proofPath);
            }
            throw $exception;
        }

        if ($isManual) {
            return back()->with([
                'success' => 'Pesanan berhasil dibuat, silakan tunggu konfirmasi admin!',
                'trx_code' => $transaction->transaction_code
            ]);
        }

        try {
            $params = [
                    'transaction_details' => [
                        'order_id' => $transaction->transaction_code,
                        'gross_amount' => (int)$grandTotal,
                    ],
                    'customer_details' => [
                        'first_name' => $user->name,
                        'email' => $user->email,
                        'phone' => $request->phone,
                    ],
                    'item_details' => $itemDetails,
                    'callbacks' => [
                        'finish'   => url('/dashboard'),
                        'unfinish' => url('/dashboard'),
                        'error'    => url('/checkout'),
                    ],
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($params);
            $transaction->update(['snap_token' => $snapToken]);

            return back()->with([
                'success' => 'Silakan selesaikan pembayaran!',
                'snap_token' => $snapToken,
                'trx_code' => $transaction->transaction_code
            ]);

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal terhubung ke gateway pembayaran: ' . $e->getMessage());
        }
    }

    public function uploadProof(Request $request, Transaction $transaction)
    {
        if ($request->user()->id !== $transaction->user_id) {
            abort(403);
        }

        $request->validate([
            'proof' => 'required|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        $transaction->load('payment.paymentMethod');
        $payment = $transaction->payment;
        if ($transaction->status !== 'pending' || !$payment || $payment->status !== 'rejected' || $payment->paymentMethod?->type !== PaymentMethod::TYPE_BANK_TRANSFER) {
            throw ValidationException::withMessages(['proof' => 'Bukti pembayaran pada transaksi ini tidak dapat diubah.']);
        }

        $oldProof = $payment->proof_image;
        $newProof = $this->saveImageAsWebp($request->file('proof'), 'payments');

        try {
            $payment->update([
                'proof_image' => $newProof,
                'status' => 'pending',
                'rejection_reason' => null,
            ]);
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($newProof);
            throw $exception;
        }

        if ($oldProof && $oldProof !== $newProof) {
            Storage::disk('public')->delete($oldProof);
        }

        return back()->with('success', 'Bukti transfer baru berhasil dikirim dan menunggu verifikasi admin.');
    }

    public function verify(Request $request, Transaction $transaction, TransactionFinalizer $finalizer)
    {
        // For security, only the owner can verify or admin
        if ($request->user()->id !== $transaction->user_id && $request->user()->role !== 'admin') {
            abort(403);
        }

        try {
            $status = \Midtrans\Transaction::status($transaction->transaction_code);
            
            // Handle both object and array response
            $trStatus = is_object($status) ? $status->transaction_status : $status['transaction_status'];
            $type = is_object($status) ? $status->payment_type : $status['payment_type'];

            if ($trStatus == 'settlement' || $trStatus == 'capture') {
                $finalizer->apply($transaction, 'success', $type, (array) $status);
                return back()->with('success', 'Pembayaran berhasil dikonfirmasi secara otomatis!');
            }

            return back()->with('info', 'Status pembayaran saat ini: ' . $trStatus);

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal verifikasi: ' . $e->getMessage());
        }
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

    private function resolveCart(array $cart): array
    {
        $products = collect();
        $linePrices = [];
        $itemDetails = [];
        $grandTotal = 0;

        foreach ($cart as $item) {
            if (!empty($item['id'])) {
                $product = Product::findOrFail($item['id']);
                if ($products->has($product->id)) {
                    throw ValidationException::withMessages(['cart' => 'Produk yang sama tidak boleh muncul lebih dari sekali.']);
                }

                $price = (int) round((float) $product->price);
                $products->put($product->id, $product);
                $linePrices[$product->id] = $price;
                $itemDetails[] = ['id' => $product->id, 'price' => $price, 'quantity' => 1, 'name' => $product->name];
                $grandTotal += $price;
                continue;
            }

            $slug = $item['package_slug'];
            $package = config("packages.{$slug}");
            if (!$package) {
                throw ValidationException::withMessages(['cart' => 'Paket yang dipilih tidak tersedia.']);
            }

            $packageProducts = Product::whereIn('slug', $package['products'])->get();
            if ($packageProducts->count() !== count($package['products'])) {
                throw ValidationException::withMessages(['cart' => 'Salah satu produk dalam paket tidak tersedia.']);
            }

            $basePrice = intdiv((int) $package['price'], $packageProducts->count());
            $remainder = (int) $package['price'] - ($basePrice * $packageProducts->count());
            foreach ($packageProducts->values() as $index => $product) {
                if ($products->has($product->id)) {
                    throw ValidationException::withMessages(['cart' => 'Produk paket tidak boleh dibeli dua kali dalam satu transaksi.']);
                }
                $products->put($product->id, $product);
                $linePrices[$product->id] = $basePrice + ($index === 0 ? $remainder : 0);
            }

            $itemDetails[] = ['id' => 'pkg-'.$slug, 'price' => (int) $package['price'], 'quantity' => 1, 'name' => $package['name']];
            $grandTotal += (int) $package['price'];
        }

        return [$products, $linePrices, $itemDetails, $grandTotal];
    }
}
