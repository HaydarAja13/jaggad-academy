<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Transaction $transaction) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bukti Transfer Perlu Diperbaiki - ' . $this->transaction->transaction_code,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.payment-rejected');
    }
}
