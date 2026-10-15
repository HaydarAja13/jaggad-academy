<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ConsultationAppointment;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\TransactionFinalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Midtrans\Snap;

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

    public function process(Request $request, TransactionFinalizer $finalizer)
    {
        $isGuest = $request->user() === null;

        $validated = $request->validate([
            'phone' => 'required|string|max:32',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'cart' => 'required|array|min:1|max:50',
            'cart.*.id' => 'nullable|required_without:cart.*.package_slug|integer|distinct|exists:products,id',
            'cart.*.package_slug' => 'nullable|required_without:cart.*.id|string|distinct',
            // Nominal donasi bebas (bukan whitelist): Rp 0 sampai batas wajar.
            'cart.*.donation_amount' => 'nullable|numeric|min:0|max:100000000',
            'active_trx' => 'nullable|string|max:40',
            'proof' => 'nullable|image|mimes:jpg,jpeg,png|max:5120|dimensions:max_width=8000,max_height=8000',
        ]);

        if ($isGuest) {
            // Tamu wajib isi nama & email — dipakai untuk akun diam-diam & pengiriman link akses.
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
            ]);
            $validated['name'] = $request->string('name')->toString();
            $validated['email'] = $request->string('email')->toString();
        }

        [$products, $linePrices, $itemDetails, $grandTotal, $isDonation] = $this->resolveCart($validated['cart']);

        // Tamu hanya boleh checkout keranjang murni produk donasi — produk lain wajib login.
        if ($isGuest && ! $isDonation) {
            return redirect()->route('login')->withErrors([
                'cart' => 'Silakan login atau daftar terlebih dahulu untuk membeli produk selain donasi.',
            ]);
        }

        $user = $request->user() ?? $this->resolveGuestUser($validated);
        $ownedProducts = $user->products()
            ->whereIn('products.id', $products->keys())
            ->pluck('products.name');
        // Donasi berbayar (nominal > 0) boleh diulang meski produk sudah dimiliki.
        // Klaim Rp 0 tetap diblokir agar tidak ada transaksi gratis tak berujung.
        if ($ownedProducts->isNotEmpty() && ! ($isDonation && (int) $grandTotal > 0)) {
            throw ValidationException::withMessages([
                'cart' => 'Anda sudah memiliki produk berikut: '.$ownedProducts->join(', ').'.',
            ]);
        }

        $purpose = $isDonation ? Transaction::PURPOSE_DONATION : Transaction::PURPOSE_PRODUCT;

        // Cabang klaim gratis: seluruh isi keranjang berharga Rp 0 (price == 0 dari DB).
        // Tanpa metode bayar, tanpa Snap, tanpa upload bukti — langsung beri akses.
        if ((int) $grandTotal === 0) {
            if (empty($user->phone)) {
                $user->update(['phone' => $validated['phone']]);
            }

            $transaction = DB::transaction(function () use ($user, $products, $purpose) {
                $transaction = Transaction::create([
                    'transaction_code' => 'TRX-'.strtoupper(Str::random(8)),
                    'user_id' => $user->id,
                    'purpose' => $purpose,
                    'total_amount' => 0,
                    'status' => 'pending',
                ]);

                foreach ($products as $product) {
                    TransactionItem::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $product->id,
                        'price' => 0,
                    ]);
                }

                return $transaction;
            });

            $finalizer->apply($transaction, 'success', 'free_claim', ['source' => 'free_claim']);

            // Tamu dengan akun tanpa password langsung masuk — modal checkout
            // menawarkan tombol "Lihat Halaman Produk" yang membuka materi.
            $this->loginPasswordless($request, $user);

            return back()->with([
                'success' => $isDonation
                    ? 'Akses berhasil dibuka! Materi sudah tersedia di dashboard.'
                    : 'Produk gratis berhasil dibuka! Materi sudah tersedia di dashboard.',
                'trx_code' => $transaction->transaction_code,
                'free_claim' => true,
                'direct_access' => $isGuest,
                'product_slug' => $products->count() === 1 ? $products->first()->slug : null,
            ]);
        }

        if (empty($validated['payment_method_id'])) {
            throw ValidationException::withMessages(['payment_method_id' => 'Pilih metode pembayaran yang tersedia.']);
        }

        $paymentMethod = PaymentMethod::findOrFail($validated['payment_method_id']);
        if (! $paymentMethod->status) {
            throw ValidationException::withMessages(['payment_method_id' => 'Metode pembayaran ini sedang tidak tersedia.']);
        }

        $isManual = $paymentMethod->type === PaymentMethod::TYPE_BANK_TRANSFER;
        if ($isManual) {
            $request->validate(['proof' => 'required|image|mimes:jpg,jpeg,png|max:5120|dimensions:max_width=8000,max_height=8000']);
        } elseif (empty(config('services.midtrans.server_key')) || empty(config('services.midtrans.client_key'))) {
            throw ValidationException::withMessages(['payment_method_id' => 'Midtrans masih dalam pemeliharaan. Silakan gunakan transfer bank.']);
        }

        // Update user phone if empty
        if (empty($user->phone)) {
            $user->update(['phone' => $request->phone]);
        }

        $proofPath = $isManual ? $this->saveImageAsWebp($request->file('proof'), 'payments') : null;
        try {
            $transaction = DB::transaction(function () use ($validated, $user, $grandTotal, $products, $linePrices, $isManual, $proofPath, $paymentMethod, $purpose, $isDonation) {
                $transaction = null;
                if (! empty($validated['active_trx'])) {
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
                    $transaction->update(['total_amount' => $grandTotal, 'snap_token' => null, 'purpose' => $purpose]);
                    $transaction->items()->delete();
                    $transaction->payment?->delete();
                } else {
                    $transaction = Transaction::create([
                        'transaction_code' => 'TRX-'.strtoupper(Str::random(8)),
                        'user_id' => $user->id,
                        'purpose' => $purpose,
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

                // Model A: donasi memberi akses SEGERA saat checkout.
                // Verifikasi uang (Midtrans / approve admin) berjalan paralel untuk pelaporan.
                if ($isDonation) {
                    foreach ($products as $product) {
                        $user->products()->syncWithoutDetaching([
                            $product->id => ['purchased_at' => now()],
                        ]);
                    }
                }

                return $transaction;
            });
        } catch (\Throwable $exception) {
            if ($proofPath) {
                Storage::disk('local')->delete($proofPath);
            }
            throw $exception;
        }

        if ($isManual) {
            // Donasi: tanpa email otomatis saat checkout — akses langsung aktif
            // (Model A) dan tamu tanpa password langsung masuk, sehingga modal
            // menawarkan "Lihat Halaman Produk".
            $this->loginPasswordless($request, $user);

            return back()->with([
                'success' => $isDonation
                    ? 'Terima kasih! Pembayaran tercatat dan akses materi sudah aktif. Verifikasi bukti hanya untuk konfirmasi nominal.'
                    : 'Pesanan berhasil dibuat, silakan tunggu konfirmasi admin!',
                'trx_code' => $transaction->transaction_code,
                'direct_access' => $isGuest,
                'product_slug' => $products->count() === 1 ? $products->first()->slug : null,
            ]);
        }

        try {
            $params = [
                'transaction_details' => [
                    'order_id' => $transaction->transaction_code,
                    'gross_amount' => (int) $grandTotal,
                ],
                'customer_details' => [
                    'first_name' => $user->name,
                    'email' => $user->email,
                    'phone' => $request->phone,
                ],
                'item_details' => $itemDetails,
                'callbacks' => [
                    'finish' => url('/dashboard'),
                    'unfinish' => url('/dashboard'),
                    'error' => url('/checkout'),
                ],
            ];

            $snapToken = Snap::getSnapToken($params);
            $transaction->update(['snap_token' => $snapToken]);

            if ($isGuest) {
                // Penanda sesi: verify() tamu hanya boleh untuk transaksi Snap ini.
                $request->session()->put('guest_trx', $transaction->transaction_code);
            }

            // Akses donasi sudah aktif sejak checkout (Model A) — masuk sekarang
            // juga supaya setelah bayar modal menawarkan "Lihat Halaman Produk".
            $this->loginPasswordless($request, $user);

            return back()->with([
                'success' => $isDonation
                    ? 'Silakan selesaikan pembayaran — akses materi sudah aktif.'
                    : 'Silakan selesaikan pembayaran!',
                'snap_token' => $snapToken,
                'trx_code' => $transaction->transaction_code,
                'direct_access' => $isGuest,
                'product_slug' => $products->count() === 1 ? $products->first()->slug : null,
            ]);

        } catch (\Exception $e) {
            Log::error('Midtrans Snap token error: '.$e->getMessage());

            throw ValidationException::withMessages([
                'payment_method_id' => 'Gagal terhubung ke gateway pembayaran. Silakan coba lagi atau gunakan transfer bank.',
            ]);
        }
    }

    public function uploadProof(Request $request, Transaction $transaction)
    {
        if ($request->user()->id !== $transaction->user_id) {
            abort(403);
        }

        $request->validate([
            'proof' => 'required|image|mimes:jpg,jpeg,png|max:5120|dimensions:max_width=8000,max_height=8000',
        ]);

        $transaction->load('payment.paymentMethod');
        $payment = $transaction->payment;
        if ($transaction->status !== 'pending' || ! $payment || $payment->status !== 'rejected' || $payment->paymentMethod?->type !== PaymentMethod::TYPE_BANK_TRANSFER) {
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
            Storage::disk('local')->delete($newProof);
            throw $exception;
        }

        if ($oldProof && $oldProof !== $newProof) {
            foreach (['local', 'public'] as $disk) {
                Storage::disk($disk)->delete($oldProof);
            }
        }

        return back()->with('success', 'Bukti transfer baru berhasil dikirim dan menunggu verifikasi admin.');
    }

    public function uploadConsultationProof(Request $request, ConsultationAppointment $consultationAppointment)
    {
        $validated = $request->validate([
            'payment_method_id' => 'required|exists:payment_methods,id',
            'proof' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120|dimensions:max_width=8000,max_height=8000',
        ]);
        $paymentMethod = PaymentMethod::query()
            ->whereKey($validated['payment_method_id'])
            ->where('type', PaymentMethod::TYPE_BANK_TRANSFER)
            ->where('status', true)
            ->first();
        if (! $paymentMethod) {
            throw ValidationException::withMessages(['payment_method_id' => 'Rekening pembayaran sedang tidak tersedia.']);
        }

        $proofPath = $this->saveImageAsWebp($request->file('proof'), 'payments');
        $oldProof = null;
        try {
            DB::transaction(function () use ($consultationAppointment, $paymentMethod, $proofPath, &$oldProof) {
                $appointment = ConsultationAppointment::whereKey($consultationAppointment->id)->lockForUpdate()->firstOrFail();
                if ($appointment->status !== 'awaiting_deposit' || ! $appointment->deposit_due_at?->isFuture()) {
                    throw ValidationException::withMessages(['proof' => 'Link pembayaran sudah kedaluwarsa atau booking tidak lagi menunggu DP.']);
                }

                $transaction = $appointment->transactions()
                    ->where('purpose', Transaction::PURPOSE_CONSULTATION_DEPOSIT)
                    ->where('status', 'pending')
                    ->latest()
                    ->lockForUpdate()
                    ->firstOrFail();
                $payment = $transaction->payment;
                if ($payment && $payment->status !== 'rejected') {
                    throw ValidationException::withMessages(['proof' => 'Bukti pembayaran sudah dikirim dan sedang diperiksa.']);
                }

                if ($payment) {
                    $oldProof = $payment->proof_image;
                    $payment->update([
                        'payment_method_id' => $paymentMethod->id,
                        'amount' => $appointment->deposit_amount,
                        'proof_image' => $proofPath,
                        'status' => 'pending',
                        'rejection_reason' => null,
                    ]);
                } else {
                    Payment::create([
                        'transaction_id' => $transaction->id,
                        'payment_method_id' => $paymentMethod->id,
                        'amount' => $appointment->deposit_amount,
                        'proof_image' => $proofPath,
                        'status' => 'pending',
                    ]);
                }

                $appointment->update(['status' => 'deposit_review']);
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($proofPath);
            throw $exception;
        }

        if ($oldProof && $oldProof !== $proofPath) {
            foreach (['local', 'public'] as $disk) {
                Storage::disk($disk)->delete($oldProof);
            }
        }

        return back()->with('success', 'Bukti DP berhasil dikirim dan sedang diperiksa admin.');
    }

    public function proof(Request $request, Payment $payment)
    {
        $payment->load('transaction');
        abort_unless($request->user()->role === 'admin' || $request->user()->id === $payment->transaction?->user_id, 403);

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($payment->proof_image)) {
                return Storage::disk($disk)->response($payment->proof_image, headers: [
                    'Cache-Control' => 'private, no-store',
                    'X-Content-Type-Options' => 'nosniff',
                ]);
            }
        }

        abort(404);
    }

    public function verify(Request $request, Transaction $transaction, TransactionFinalizer $finalizer)
    {
        // For security, only the owner can verify or admin
        $authUser = $request->user();
        if ($authUser) {
            if ($authUser->id !== $transaction->user_id && $authUser->role !== 'admin') {
                abort(403);
            }
        } elseif ($request->session()->get('guest_trx') !== $transaction->transaction_code) {
            // Tamu: hanya transaksi Snap milik sesi checkout ini yang boleh diverifikasi.
            abort(403);
        }

        if (! $transaction->snap_token || $transaction->payment) {
            throw ValidationException::withMessages(['payment' => 'Transaksi ini bukan pembayaran Midtrans.']);
        }

        try {
            $status = \Midtrans\Transaction::status($transaction->transaction_code);
            $payload = (array) $status;
            $trStatus = $payload['transaction_status'] ?? null;
            $type = $payload['payment_type'] ?? null;
            $fraudStatus = $payload['fraud_status'] ?? null;
            $amount = $payload['gross_amount'] ?? null;

            if (($payload['order_id'] ?? null) !== $transaction->transaction_code
                || ! is_numeric($amount)
                || number_format((float) $amount, 2, '.', '') !== number_format((float) $transaction->total_amount, 2, '.', '')) {
                throw ValidationException::withMessages(['payment' => 'Data pembayaran dari Midtrans tidak cocok dengan transaksi.']);
            }

            if ($trStatus === 'settlement' || ($trStatus === 'capture' && $fraudStatus === 'accept')) {
                $finalizer->apply($transaction, 'success', $type, $payload);

                return back()->with([
                    'success' => 'Pembayaran berhasil dikonfirmasi secara otomatis!',
                ]);
            }

            throw ValidationException::withMessages(['payment' => 'Pembayaran belum berhasil dikonfirmasi oleh Midtrans.']);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            Log::error('Midtrans verification error: '.$exception->getMessage());

            throw ValidationException::withMessages(['payment' => 'Status pembayaran belum dapat diverifikasi. Silakan coba lagi.']);
        }
    }

    /**
     * Magic link akses untuk akun tanpa password (dibuat otomatis saat checkout
     * tamu). URL ditandatangani (HMAC) & hanya dikirim lewat email — buka halaman
     * ini langsung login dan membuka dashboard.
     */
    public function magicAccess(Request $request, User $user)
    {
        // Akun dengan password (register biasa) masuk lewat login seperti biasa.
        if (! empty($user->password)) {
            return redirect()->route('login');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', 'Selamat datang kembali! Materi Anda sudah tersedia di dashboard.');
    }

    /**
     * Tamu checkout donasi: pakai akun existing per email (tanpa login) atau
     * buat akun diam-diam (tanpa password) — akses via magic link / Lupa Password.
     */
    private function resolveGuestUser(array $validated): User
    {
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            if (empty($user->phone) && ! empty($validated['phone'])) {
                $user->update(['phone' => $validated['phone']]);
            }

            return $user;
        }

        return User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => null,
            'status' => 'Aktif',
            'role' => 'customer',
        ]);
    }

    /**
     * Login otomatis hanya untuk tamu checkout donasi dengan akun tanpa
     * password (dibuat diam-diam saat checkout). Akun ber-password TIDAK pernah
     * di-login di sini — mereka wajib lewat halaman masuk dengan password.
     */
    private function loginPasswordless(Request $request, User $user): bool
    {
        if ($request->user() !== null || ! empty($user->password)) {
            return false;
        }

        Auth::login($user);
        $request->session()->regenerate();

        return true;
    }

    private function saveImageAsWebp($file, $directory)
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new WebpEncoder(80));
        $filename = uniqid().'.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('local')->put($path, (string) $encoded);

        return $path;
    }

    private function resolveCart(array $cart): array
    {
        $products = collect();
        $linePrices = [];
        $itemDetails = [];
        $grandTotal = 0;
        $hasDonation = false;
        $hasRegular = false;

        foreach ($cart as $item) {
            if (! empty($item['id'])) {
                $product = Product::findOrFail($item['id']);
                if ($product->isDraft()) {
                    throw ValidationException::withMessages(['cart' => 'Produk "'.$product->name.'" belum tersedia untuk dibeli.']);
                }
                if ($products->has($product->id)) {
                    throw ValidationException::withMessages(['cart' => 'Produk yang sama tidak boleh muncul lebih dari sekali.']);
                }

                if ($product->isDonation()) {
                    // Nominal donasi bebas dari browser — sudah divalidasi (numeric, >= 0).
                    // Harga DB (0) tidak dipakai untuk penagihan.
                    $hasDonation = true;
                    $price = (int) round((float) ($item['donation_amount'] ?? 0));
                } else {
                    // Selalu pakai harga DB untuk produk harga tetap.
                    $hasRegular = true;
                    $price = (int) round((float) $product->price);
                }

                $products->put($product->id, $product);
                $linePrices[$product->id] = $price;
                $itemDetails[] = ['id' => $product->id, 'price' => $price, 'quantity' => 1, 'name' => $product->name];
                $grandTotal += $price;

                continue;
            }

            $slug = $item['package_slug'];
            $package = config("packages.{$slug}");
            if (! $package) {
                throw ValidationException::withMessages(['cart' => 'Paket yang dipilih tidak tersedia.']);
            }

            $packageProducts = Product::whereIn('slug', $package['products'])->get();
            if ($packageProducts->count() !== count($package['products']) || $packageProducts->contains(fn ($product) => $product->isDraft())) {
                throw ValidationException::withMessages(['cart' => 'Salah satu produk dalam paket tidak tersedia.']);
            }

            $hasRegular = true;
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

        if ($hasDonation && $hasRegular) {
            throw ValidationException::withMessages([
                'cart' => 'Produk dengan nominal bebas harus di-checkout terpisah dari produk lain. Selesaikan terlebih dahulu.',
            ]);
        }

        return [$products, $linePrices, $itemDetails, $grandTotal, $hasDonation];
    }
}
