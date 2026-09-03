<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminPaymentController extends Controller
{
    public function index()
    {
        // Ensure all payment methods have slugs
        PaymentMethod::whereNull('slug')->orWhere('slug', '')->get()->each(function($pm) {
            $pm->slug = \Illuminate\Support\Str::slug($pm->bank_name) . '-' . uniqid();
            $pm->save();
        });

        $banks = PaymentMethod::orderBy('id')->get();

        return Inertia::render('Admin/AdminPayment', [
            'dbBanks' => $banks
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_holder' => 'required|string|max:120',
            'account_number' => ['required', 'string', 'max:50', 'not_in:-', 'regex:/^[0-9\s-]+$/'],
        ]);

        PaymentMethod::create([
            'type' => PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => $request->bank_name,
            'account_name' => $request->account_holder,
            'account_number' => $request->account_number,
            'status' => true,
        ]);

        return back()->with('success', 'Rekening baru berhasil ditambahkan.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->isMidtrans()) {
            throw ValidationException::withMessages(['payment_method' => 'Data Midtrans dikelola melalui pengaturan credential.']);
        }

        $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_holder' => 'required|string|max:120',
            'account_number' => ['required', 'string', 'max:50', 'not_in:-', 'regex:/^[0-9\s-]+$/'],
        ]);

        $paymentMethod->update([
            'bank_name' => $request->bank_name,
            'account_name' => $request->account_holder,
            'account_number' => $request->account_number,
        ]);

        return back()->with('success', 'Informasi rekening berhasil diperbarui.');
    }

    public function toggle(PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->isMidtrans() && !$paymentMethod->status) {
            $settings = SiteContent::where('key', 'site_settings')->first();
            $credentials = $settings ? json_decode($settings->value, true) : [];

            $serverKey = $credentials['midtrans_server_key'] ?? config('services.midtrans.server_key');
            $clientKey = $credentials['midtrans_client_key'] ?? config('services.midtrans.client_key');

            if (empty($serverKey) || empty($clientKey)) {
                throw ValidationException::withMessages([
                    'midtrans' => 'Lengkapi Server Key dan Client Key Midtrans sebelum mengaktifkan pembayaran otomatis.',
                ]);
            }
        }

        $paymentMethod->update([
            'status' => !$paymentMethod->status
        ]);

        return back()->with('success', $paymentMethod->isMidtrans() ? 'Status Midtrans berhasil diubah.' : 'Status rekening berhasil diubah.');
    }

    public function destroy(PaymentMethod $paymentMethod)
    {
        if ($paymentMethod->isMidtrans()) {
            throw ValidationException::withMessages(['payment_method' => 'Midtrans tidak dapat dihapus, hanya dapat dinonaktifkan.']);
        }

        if ($paymentMethod->payments()->exists()) {
            throw ValidationException::withMessages(['payment_method' => 'Rekening yang memiliki histori pembayaran tidak dapat dihapus.']);
        }

        $paymentMethod->delete();

        return back()->with('success', 'Rekening berhasil dihapus.');
    }
}
