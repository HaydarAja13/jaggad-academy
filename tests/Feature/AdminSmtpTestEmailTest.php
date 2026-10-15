<?php

namespace Tests\Feature;

use App\Mail\SmtpTestMail;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminSmtpTestEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_smtp_test_email(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedSmtpSettings();

        $this->actingAs($admin)
            ->post(route('admin.settings.test-email'), ['to' => 'test-tujuan@example.com'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        Mail::assertSent(SmtpTestMail::class, function ($mail) {
            return $mail->hasTo('test-tujuan@example.com')
                && $mail->smtpHost === 'smtp.sumopod.com';
        });
    }

    public function test_smtp_test_email_requires_saved_smtp_settings(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.settings.test-email'), ['to' => 'test-tujuan@example.com'])
            ->assertSessionHasErrors('to');

        Mail::assertNotSent(SmtpTestMail::class);
    }

    public function test_smtp_test_email_requires_valid_email(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedSmtpSettings();

        $this->actingAs($admin)
            ->post(route('admin.settings.test-email'), ['to' => 'bukan-email'])
            ->assertSessionHasErrors('to');
    }

    public function test_non_admin_cannot_send_smtp_test_email(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)
            ->post(route('admin.settings.test-email'), ['to' => 'test-tujuan@example.com'])
            ->assertForbidden();
    }

    public function test_guest_cannot_send_smtp_test_email(): void
    {
        $this->post(route('admin.settings.test-email'), ['to' => 'test-tujuan@example.com'])
            ->assertRedirect(route('login'));
    }

    private function seedSmtpSettings(): void
    {
        SiteContent::create([
            'key' => 'site_settings',
            'value' => json_encode([
                'mail_host' => 'smtp.sumopod.com',
                'mail_port' => 465,
                'mail_username' => 'test-user',
                'mail_password' => 'test-pass',
                'mail_encryption' => 'ssl',
                'mail_from_address' => 'test@example.com',
                'mail_from_name' => 'JAGGAD ACADEMY',
            ]),
        ]);
        // Simulasikan AppServiceProvider yang menerapkan pengaturan DB ke config.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.sumopod.com',
            'mail.mailers.smtp.port' => 465,
        ]);
    }
}
