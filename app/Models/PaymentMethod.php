<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    public const TYPE_BANK_TRANSFER = 'bank_transfer';
    public const TYPE_MIDTRANS = 'midtrans';

    protected $fillable = [
        'type',
        'bank_name',
        'slug',
        'account_number',
        'account_name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function isMidtrans(): bool
    {
        return $this->type === self::TYPE_MIDTRANS;
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }

    protected static function booted()
    {
        static::creating(function ($pm) {
            if (empty($pm->slug)) {
                $pm->slug = \Illuminate\Support\Str::slug($pm->bank_name) . '-' . uniqid();
            }
        });

        static::updating(function ($pm) {
            if ($pm->isDirty('bank_name') || empty($pm->slug)) {
                $pm->slug = \Illuminate\Support\Str::slug($pm->bank_name) . '-' . uniqid();
            }
        });
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
