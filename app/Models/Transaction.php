<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    public const PURPOSE_PRODUCT = 'product_purchase';
    public const PURPOSE_CONSULTATION_DEPOSIT = 'consultation_deposit';
    public const PURPOSE_CONSULTATION_BALANCE = 'consultation_balance';

    protected $fillable = [
        'transaction_code',
        'purpose',
        'user_id',
        'consultation_appointment_id',
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

    public function consultationAppointment()
    {
        return $this->belongsTo(ConsultationAppointment::class);
    }
}
