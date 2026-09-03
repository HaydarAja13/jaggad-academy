<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_code',
        'user_id',
        'total_amount',
        'status',
        'snap_token',
        'paid_at',
        'payment_type',
        'payment_payload',
    ];

    public function getRouteKeyName()
    {
        return 'transaction_code';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
