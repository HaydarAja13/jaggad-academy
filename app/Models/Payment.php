<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Payment extends Model
{
    protected $appends = ['proof_url'];

    protected $hidden = ['proof_image'];

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
            foreach (['local', 'public'] as $disk) {
                if ($payment->proof_image && Storage::disk($disk)->exists($payment->proof_image)) {
                    Storage::disk($disk)->delete($payment->proof_image);
                }
            }
        });
    }

    public function getProofUrlAttribute(): ?string
    {
        return $this->proof_image ? route('payments.proof', $this) : null;
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
