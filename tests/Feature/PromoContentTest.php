<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PromoContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_publish_complete_promo_content_with_a_hero_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create(['name' => 'Kelas Promo', 'price' => 149000, 'normal_price' => 299000]);
        $payload = $this->promoPayload($product->id);
        $payload['heroImageFile'] = UploadedFile::fake()->image('promo.jpg', 1600, 900);

        $this->actingAs($admin)
            ->post(route('admin.ads.store'), $payload)
            ->assertSessionHasNoErrors();

        $saved = json_decode(SiteContent::where('key', 'ads_promo')->firstOrFail()->value, true);

        $this->assertSame('Promo terarah', $saved['hero']['title']);
        $this->assertSame([$product->id], $saved['selectedProductIds']);
        $this->assertStringStartsWith('promo/', $saved['hero']['image']);
        Storage::disk('public')->assertExists($saved['hero']['image']);
    }

    public function test_promo_rejects_unknown_products_and_non_youtube_video_urls(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = $this->promoPayload(999999);
        $payload['hero']['mediaType'] = 'youtube';
        $payload['hero']['videoUrl'] = 'https://example.com/video';

        $this->actingAs($admin)
            ->post(route('admin.ads.store'), $payload)
            ->assertSessionHasErrors(['hero.videoUrl', 'selectedProductIds.0']);
    }

    public function test_public_promo_receives_saved_content_and_products(): void
    {
        $product = Product::create(['name' => 'Kelas Promo', 'price' => 149000]);
        SiteContent::create(['key' => 'ads_promo', 'value' => json_encode($this->promoPayload($product->id))]);

        $this->get(route('ads'))->assertInertia(fn (Assert $page) => $page
            ->component('Guest/Ads')
            ->has('dbAds')
            ->has('dbProducts', 1));
    }

    private function promoPayload(int $productId): array
    {
        return [
            'hero' => [
                'badge' => 'Promo pilihan',
                'title' => 'Promo terarah',
                'subtitle' => 'Pilih program yang relevan.',
                'mediaType' => 'image',
                'imageAlt' => 'Materi program pilihan',
                'videoUrl' => null,
                'guarantee' => 'Detail mengikuti informasi produk.',
            ],
            'urgency' => [
                'countdownHours' => 12,
                'quotaText' => 'Tersedia terbatas.',
                'ctaNote' => 'Periksa detail sebelum membeli.',
            ],
            'proofItems' => ['Akses dashboard', 'Belajar fleksibel', 'Pilihan terkurasi'],
            'offers' => ['title' => 'Pilihan promo', 'description' => 'Bandingkan program berikut.'],
            'trust' => [
                'title' => 'Pilih dengan jelas',
                'description' => 'Semua informasi penting tersedia.',
                'items' => [
                    ['title' => 'Harga', 'description' => 'Harga mengikuti katalog.'],
                    ['title' => 'Akses', 'description' => 'Akses melalui dashboard.'],
                    ['title' => 'Bantuan', 'description' => 'Tim dapat dihubungi.'],
                ],
            ],
            'cta' => ['primary' => 'Lihat penawaran'],
            'closing' => [
                'title' => 'Siap memilih?',
                'description' => 'Periksa pilihan Anda.',
                'primary' => 'Pilih promo',
                'secondary' => 'Konsultasi dulu',
                'asideTitle' => 'Masih ragu?',
                'asideDescription' => 'Hubungi tim kami.',
            ],
            'selectedProductIds' => [$productId],
        ];
    }
}
