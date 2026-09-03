<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'transaction_id',
        'payment_method_id',
        'amount',
        'proof_image',
        'status',
        'rejection_reason',
    ];

    protected static function booted()
    {
        static::deleting(function ($payment) {
            if ($payment->proof_image && \Illuminate\Support\Facades\Storage::disk('public')->exists($payment->proof_image)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($payment->proof_image);
            }
        });
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }
}
