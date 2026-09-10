<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationAppointment extends Model
{
    protected $fillable = [
        'booking_code',
        'customer_name',
        'whatsapp',
        'package_slug',
        'package_name',
        'option_key',
        'option_label',
        'duration_minutes',
        'total_price',
        'deposit_amount',
        'consultation_need',
        'requested_start_at',
        'scheduled_start_at',
        'mentor_key',
        'mentor_name',
        'location',
        'status',
        'deposit_due_at',
        'customer_reschedule_count',
        'rejection_reason',
        'cancellation_initiator',
        'cancellation_reason',
        'refund_amount',
        'refund_at',
        'refund_note',
    ];

    protected $casts = [
        'requested_start_at' => 'datetime',
        'scheduled_start_at' => 'datetime',
        'deposit_due_at' => 'datetime',
        'refund_at' => 'datetime',
        'total_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
    ];

    public function getRouteKeyName()
    {
        return 'booking_code';
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
