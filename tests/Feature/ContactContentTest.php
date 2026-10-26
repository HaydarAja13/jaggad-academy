<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_contact_page_content(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $contact = [
            'title' => 'Mari bicara',
            'subtitle' => 'Tim kami siap membantu.',
            'topics' => [
                ['title' => 'Memilih program', 'desc' => 'Bantu saya memilih program yang sesuai.'],
            ],
            'email' => 'halo@example.com',
            'phone' => '+62 812 3456 7890',
            'address' => 'Jakarta',
            'mapsUrl' => 'https://maps.google.com/',
        ];
        $dashboard = [
            'welcomeTitle' => 'Selamat datang kembali',
            'welcomeDescription' => 'Lanjutkan belajar dari dashboard.',
        ];

        $this->actingAs($admin)->post(route('admin.content.store'), [
            'home' => ['title' => 'Home'],
            'about' => ['title' => 'About'],
            'contact' => $contact,
            'dashboard' => $dashboard,
            'social' => ['instagram' => 'https://instagram.com/jaggad'],
            'branding' => ['siteName' => 'JAGGAD'],
            'checkout' => ['title' => 'Checkout'],
        ])->assertSessionHasNoErrors();

        $saved = json_decode(SiteContent::where('key', 'site_content')->firstOrFail()->value, true);

        // Field teks panjang sekarang disimpan sebagai HTML paragraf yang aman.
        $this->assertSame('<p>Tim kami siap membantu.</p>', $saved['contact']['subtitle']);
        $this->assertSame('<p>Bantu saya memilih program yang sesuai.</p>', $saved['contact']['topics'][0]['desc']);
        $this->assertSame('<p>Lanjutkan belajar dari dashboard.</p>', $saved['dashboard']['welcomeDescription']);

        // Field lain tetap seperti dikirim.
        $this->assertSame('Mari bicara', $saved['contact']['title']);
        $this->assertSame('Memilih program', $saved['contact']['topics'][0]['title']);
        $this->assertSame('halo@example.com', $saved['contact']['email']);
        $this->assertSame('+62 812 3456 7890', $saved['contact']['phone']);
        $this->assertSame('Jakarta', $saved['contact']['address']);
        $this->assertSame('https://maps.google.com/', $saved['contact']['mapsUrl']);
        $this->assertSame('Selamat datang kembali', $saved['dashboard']['welcomeTitle']);
    }
}
