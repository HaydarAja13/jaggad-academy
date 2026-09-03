<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Transaction $transaction) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Akses Produk Aktif - ' . $this->transaction->transaction_code . ' | JAGGAD ACADEMY',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.purchase-receipt',
        );
    }
}
