<?php

namespace App\Services;

use App\Mail\PurchaseReceiptMail;
use App\Models\SiteContent;
use App\Models\Transaction;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TransactionFinalizer
{
    public function apply(
        Transaction $transaction,
        string $status,
        ?string $paymentType = null,
        ?array $payload = null,
        ?Closure $guard = null,
    ): array {
        $finalized = DB::transaction(function () use ($transaction, $status, $paymentType, $payload, $guard) {
            $locked = Transaction::whereKey($transaction->id)->lockForUpdate()->firstOrFail();
            $locked->load(['user', 'items.product.category', 'payment.paymentMethod']);

            if ($locked->status === 'success') {
                return null;
            }

            if ($guard) {
                $guard($locked);
            }

            $locked->update([
                'status' => $status,
                'paid_at' => $status === 'success' ? now() : $locked->paid_at,
                'payment_type' => $paymentType ?: $locked->payment_type,
                'payment_payload' => $payload ? json_encode($payload) : $locked->payment_payload,
            ]);

            if ($locked->payment) {
                $locked->payment->update([
                    'status' => match ($status) {
                        'success' => 'verified',
                        'failed', 'expired' => 'rejected',
                        default => 'pending',
                    },
                    'rejection_reason' => $status === 'success' ? null : $locked->payment->rejection_reason,
                ]);
            }

            if ($status !== 'success') {
                return null;
            }

            foreach ($locked->items as $item) {
                if (!$item->product_id) {
                    continue;
                }

                $locked->user->products()->syncWithoutDetaching([
                    $item->product_id => ['purchased_at' => now()],
                ]);
                $item->product?->increment('sold_count');
            }

            $locked->user->increment('purchase_count', $locked->items->count());
            $locked->user->increment('total_spent', $locked->total_amount);

            return $locked->fresh()->load(['user', 'items.product.category', 'payment.paymentMethod']);
        });

        if (!$finalized) {
            return ['changed' => false, 'email_sent' => true];
        }

        return [
            'changed' => true,
            'email_sent' => $this->sendReceipt($finalized),
        ];
    }

    private function sendReceipt(Transaction $transaction): bool
    {
        try {
            Mail::to($transaction->user->email)->send(new PurchaseReceiptMail($transaction));
            $this->trackMetaPurchase($transaction);

            return true;
        } catch (\Throwable $exception) {
            Log::error('Purchase completion notification error: '.$exception->getMessage());

            return false;
        }
    }

    private function trackMetaPurchase(Transaction $transaction): void
    {
        $settings = SiteContent::where('key', 'site_settings')->first();
        $settingsData = $settings ? json_decode($settings->value, true) : [];
        $pixelId = $settingsData['meta_pixel_id'] ?? null;
        $accessToken = $settingsData['meta_access_token'] ?? null;

        if (!$pixelId || !$accessToken) {
            return;
        }

        try {
            $contents = $transaction->items->map(fn ($item) => [
                'id' => (string) $item->product_id,
                'quantity' => 1,
                'item_price' => (float) $item->price,
            ])->all();

            Http::post("https://graph.facebook.com/v19.0/{$pixelId}/events", [
                'data' => [[
                    'event_name' => 'Purchase',
                    'event_time' => time(),
                    'action_source' => 'website',
                    'user_data' => [
                        'em' => hash('sha256', strtolower(trim($transaction->user->email))),
                        'ph' => $transaction->user->phone ? hash('sha256', preg_replace('/[^0-9]/', '', $transaction->user->phone)) : null,
                    ],
                    'custom_data' => [
                        'currency' => 'IDR',
                        'value' => (float) $transaction->total_amount,
                        'content_type' => 'product',
                        'content_ids' => array_column($contents, 'id'),
                        'contents' => $contents,
                        'order_id' => $transaction->transaction_code,
                    ],
                ]],
                'access_token' => $accessToken,
            ])->throw();
        } catch (\Throwable $exception) {
            Log::error('Meta CAPI Error: '.$exception->getMessage());
        }
    }
}
