<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\PaymentRejectedMail;
use App\Mail\PurchaseReceiptMail;
use App\Models\PaymentMethod;
use App\Models\Transaction;
use App\Services\TransactionFinalizer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AdminTransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::with(['user', 'items.product', 'payment.paymentMethod'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/AdminTransactions', [
            'dbTransactions' => $transactions
        ]);
    }

    public function approve(Request $request, Transaction $transaction, TransactionFinalizer $finalizer)
    {
        $result = $finalizer->apply($transaction, 'success', guard: function (Transaction $lockedTransaction) {
            $payment = $lockedTransaction->payment;
            if ($lockedTransaction->status !== 'pending'
                || !$payment
                || !$payment->proof_image
                || $payment->status !== 'pending'
                || $payment->paymentMethod?->type !== PaymentMethod::TYPE_BANK_TRANSFER) {
                throw ValidationException::withMessages([
                    'transaction' => 'Hanya transfer manual dengan bukti yang sedang menunggu verifikasi yang dapat disetujui.',
                ]);
            }
        });

        if (!$result['changed']) {
            return back()->with('info', 'Transaksi ini sudah pernah diverifikasi.');
        }

        $response = back()->with('success', 'Pembayaran terverifikasi dan akses produk telah diaktifkan.');
        return $result['email_sent']
            ? $response
            : $response->with('email_warning', 'Akses sudah aktif, tetapi email gagal dikirim. Gunakan tombol kirim ulang email.');
    }

    public function reject(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:500',
        ]);

        $rejectedTransaction = DB::transaction(function () use ($transaction, $validated) {
            $lockedTransaction = Transaction::whereKey($transaction->id)->lockForUpdate()->firstOrFail();
            $lockedTransaction->load(['user', 'items.product', 'payment.paymentMethod']);

            if ($lockedTransaction->status !== 'pending' || !$lockedTransaction->payment || $lockedTransaction->payment->status !== 'pending') {
                throw ValidationException::withMessages(['transaction' => 'Transaksi ini tidak lagi menunggu verifikasi.']);
            }

            $lockedTransaction->payment->update([
                'status' => 'rejected',
                'rejection_reason' => trim($validated['reason']),
            ]);

            return $lockedTransaction->refresh()->load(['user', 'items.product', 'payment.paymentMethod']);
        });

        try {
            Mail::to($rejectedTransaction->user->email)->send(new PaymentRejectedMail($rejectedTransaction));
            return back()->with('success', 'Bukti ditolak. Alasan telah dikirim kepada pelanggan.');
        } catch (\Throwable $exception) {
            Log::error('Payment Rejected Email Error: ' . $exception->getMessage());
            return back()
                ->with('success', 'Bukti ditolak dan pelanggan dapat mengunggah ulang dari dashboard.')
                ->with('email_warning', 'Email penolakan gagal dikirim.');
        }
    }

    public function resendAccessEmail(Transaction $transaction)
    {
        if ($transaction->status !== 'success') {
            throw ValidationException::withMessages(['transaction' => 'Email akses hanya dapat dikirim untuk transaksi terverifikasi.']);
        }

        $transaction->load(['user', 'items.product.category', 'payment.paymentMethod']);
        if (!$this->sendAccessEmail($transaction)) {
            return back()->withErrors(['email' => 'Email akses gagal dikirim. Periksa konfigurasi SMTP.']);
        }

        return back()->with('success', 'Email akses berhasil dikirim ulang.');
    }

    private function sendAccessEmail(Transaction $transaction): bool
    {
        try {
            Mail::to($transaction->user->email)->send(new PurchaseReceiptMail($transaction));
            return true;
        } catch (\Throwable $exception) {
            Log::error('Purchase Receipt Email Error: ' . $exception->getMessage());
            return false;
        }
    }

    public function exportCsv()
    {
        $transactions = Transaction::with(['user', 'items.product', 'payment.paymentMethod'])
            ->latest()
            ->get();

        $filename = "transactions-" . date('Y-m-d') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID Transaksi', 'Tanggal', 'Pelanggan', 'Email', 'Produk', 'Total', 'Status', 'Metode Pembayaran'];

        $callback = function() use($transactions, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($transactions as $t) {
                $row['ID'] = $t->transaction_code;
                $row['Tanggal'] = $t->created_at->format('Y-m-d H:i');
                $row['Pelanggan'] = $t->user->name ?? 'N/A';
                $row['Email'] = $t->user->email ?? 'N/A';
                $row['Produk'] = $t->items->map(fn($i) => $i->product?->name ?? 'Produk dihapus')->join(', ');
                $row['Total'] = $t->total_amount;
                $row['Status'] = $t->status;
                $row['Metode'] = $t->payment->paymentMethod->bank_name ?? 'Gateway/Lainnya';

                fputcsv($file, array_values($row));
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
