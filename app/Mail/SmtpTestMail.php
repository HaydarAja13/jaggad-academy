<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email percobaan untuk memverifikasi konfigurasi SMTP
 * dari halaman Admin → Pengaturan.
 */
class SmtpTestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $smtpHost = '',
        public int|string $smtpPort = '',
        public string $fromAddress = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Test Email SMTP Berhasil - JAGGAD ACADEMY',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.smtp-test',
        );
    }
}
