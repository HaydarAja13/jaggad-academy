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

        $this->assertSame($contact, $saved['contact']);
        $this->assertSame($dashboard, $saved['dashboard']);
    }
}
