<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\TransactionFinalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MidtransWebhookController extends Controller
{
    public function handle(Request $request, TransactionFinalizer $finalizer)
    {
        $serverKey = (string) config('services.midtrans.server_key');
        if ($serverKey === '') {
            return response()->json(['message' => 'Payment gateway is not configured'], 503);
        }

        $validator = Validator::make($request->all(), [
            'order_id' => ['required', 'string', 'max:40'],
            'status_code' => ['required', 'string', 'max:3'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'signature_key' => ['required', 'string', 'size:128'],
            'transaction_status' => ['required', 'string'],
            'payment_type' => ['nullable', 'string'],
            'fraud_status' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid payload'], 422);
        }

        $payload = $validator->validated();
        $signature = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].$serverKey);
        if (!hash_equals($signature, $payload['signature_key'])) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transaction = Transaction::where('transaction_code', $payload['order_id'])->first();
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 200);
        }

        if (number_format((float) $payload['gross_amount'], 2, '.', '')
            !== number_format((float) $transaction->total_amount, 2, '.', '')) {
            return response()->json(['message' => 'Amount mismatch'], 422);
        }

        $status = $this->mapStatus(
            $payload['transaction_status'],
            $payload['payment_type'] ?? '',
            $payload['fraud_status'] ?? '',
        );

        if ($status) {
            $finalizer->apply($transaction, $status, $payload['payment_type'] ?? null, $request->all());
        }

        return response()->json(['message' => 'OK']);
    }

    private function mapStatus(string $transactionStatus, string $paymentType, string $fraudStatus): ?string
    {
        if ($transactionStatus === 'capture') {
            return $paymentType === 'credit_card' && $fraudStatus === 'challenge' ? 'pending' : 'success';
        }

        return match ($transactionStatus) {
            'settlement' => 'success',
            'pending' => 'pending',
            'deny', 'cancel' => 'failed',
            'expire' => 'expired',
            default => null,
        };
    }
}
