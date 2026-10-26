<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Deskripsi dari editor WYSIWYG harus disanitasi sebelum disimpan.
 */
class RichTextDescriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_descriptions_are_sanitized_and_keep_formatting(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create(['name' => 'Kelas Rich', 'price' => 50000, 'status' => 'published']);

        $this->actingAs($admin)->put(route('admin.products.update', $product->slug), [
            'title' => 'Kelas Rich',
            'price' => 50000,
            'status' => 'published',
            'description' => '<p>Deskripsi <strong>singkat</strong></p><script>alert(1)</script>',
            'longDescription' => '<p>Poin penting:</p><ul><li>Satu</li><li>Dua</li></ul><a href="javascript:alert(1)">klik</a>',
        ])->assertSessionHasNoErrors();

        $product->refresh();

        $this->assertSame('<p>Deskripsi <strong>singkat</strong></p>', $product->short_description);
        $this->assertStringContainsString('<li>Satu</li>', $product->description);
        $this->assertStringNotContainsString('javascript:', $product->description);
        $this->assertStringContainsString('klik', $product->description);
    }

    public function test_legacy_plain_text_description_is_stored_as_escaped_paragraphs(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create(['name' => 'Kelas Lama', 'price' => 25000, 'status' => 'published']);

        $this->actingAs($admin)->put(route('admin.products.update', $product->slug), [
            'title' => 'Kelas Lama',
            'price' => 25000,
            'status' => 'published',
            'description' => "Baris satu & dua\nBaris tiga",
        ])->assertSessionHasNoErrors();

        $this->assertSame(
            '<p>Baris satu &amp; dua<br>Baris tiga</p>',
            $product->fresh()->short_description
        );
    }

    public function test_category_description_is_sanitized(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.categories.store'), [
            'id' => 'ebook-baru',
            'label' => 'Ebook Baru',
            'description' => '<p>Isi <em>menarik</em></p><script>alert(1)</script>',
        ])->assertSessionHasNoErrors();

        $category = Category::where('name', 'Ebook Baru')->firstOrFail();

        $this->assertSame('<p>Isi <em>menarik</em></p>', $category->description);
    }

    public function test_sales_page_descriptions_are_sanitized_and_limited_by_plain_text(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::create(['name' => 'Kelas Sales', 'price' => 75000, 'status' => 'published']);

        $longText = str_repeat('a', 480);
        $payload = $this->salesPayload([
            'outcomes' => ['title' => 'Manfaat', 'description' => '<p><strong>'.$longText.'</strong></p>'],
            'faq' => [
                'title' => 'FAQ',
                'items' => [['q' => 'Aman?', 'a' => '<p>Ya <script>alert(1)</script>aman</p>']],
            ],
        ]);

        $this->actingAs($admin)->post(route('admin.products.landing', $product->slug), [
            'salesContent' => json_encode($payload),
        ])->assertSessionHasNoErrors();

        $saved = $product->fresh()->sales_content;

        // Tag format tidak dihitung sebagai karakter: 480 huruf tetap lolos batas 500.
        $this->assertStringContainsString($longText, $saved['outcomes']['description']);
        $this->assertSame('<p>Ya aman</p>', $saved['faq']['items'][0]['a']);
    }

    public function test_global_copy_long_text_is_sanitized_and_pages_render(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.content.store'), [
            'home' => [
                'title' => 'Home',
                'faqs' => [
                    ['q' => 'Aman?', 'a' => '<p>Ya <strong>aman</strong></p><script>alert(1)</script>'],
                ],
            ],
            'about' => [
                'heroDesc' => '<p>Deskripsi <em>hero</em></p>',
                'storyP1' => '<p>Cerita satu</p>',
                'storyP2' => '<p>Cerita dua</p>',
                'visionDesc' => '<p>Visi kami</p>',
                'proofDesc' => '<p>Bukti</p>',
                'ctaDesc' => '<p>Ajakan</p>',
                'milestones' => [['year' => '2024', 'text' => '<p>Pencapaian</p>']],
            ],
            'contact' => [
                'title' => 'Kontak',
                'subtitle' => '<p>Tim <strong>siap</strong> membantu.</p>',
                'topics' => [['title' => 'Bantuan', 'desc' => '<p>Pilih program.</p>']],
                'email' => 'halo@example.com',
                'phone' => '0812',
                'address' => 'Jakarta',
            ],
            'dashboard' => [
                'welcomeTitle' => 'Halo',
                'welcomeDescription' => '<p>Lanjut belajar.</p>',
            ],
            'social' => ['instagram' => 'https://instagram.com/jaggad'],
            'branding' => ['siteName' => 'JAGGAD'],
            'checkout' => ['title' => 'Checkout'],
        ])->assertSessionHasNoErrors();

        $saved = json_decode(SiteContent::where('key', 'site_content')->firstOrFail()->value, true);

        $this->assertSame('<p>Ya <strong>aman</strong></p>', $saved['home']['faqs'][0]['a']);
        $this->assertSame('<p>Deskripsi <em>hero</em></p>', $saved['about']['heroDesc']);
        $this->assertSame('<p>Cerita satu</p>', $saved['about']['storyP1']);
        $this->assertSame('<p>Visi kami</p>', $saved['about']['visionDesc']);
        $this->assertSame('<p>Pencapaian</p>', $saved['about']['milestones'][0]['text']);
        $this->assertSame('<p>Tim <strong>siap</strong> membantu.</p>', $saved['contact']['subtitle']);
        $this->assertSame('<p>Pilih program.</p>', $saved['contact']['topics'][0]['desc']);
        $this->assertSame('<p>Lanjut belajar.</p>', $saved['dashboard']['welcomeDescription']);

        $this->get(route('about'))->assertOk();
        $this->get(route('contact'))->assertOk();
    }

    private function salesPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'hero' => ['title' => 'Hero', 'description' => '<p>Pembuka <strong>menarik</strong></p>', 'benefits' => []],
            'offer' => ['label' => 'Penawaran', 'headerCta' => 'Beli', 'cta' => 'Beli', 'trustNote' => 'Aman.'],
            'outcomes' => ['title' => 'Manfaat', 'description' => ''],
            'materials' => ['title' => 'Materi', 'description' => ''],
            'faq' => ['title' => 'FAQ', 'items' => []],
            'closing' => ['title' => 'Penutup', 'description' => '', 'cta' => 'Beli'],
            'confirmation' => [
                'heading' => 'Konfirmasi',
                'description' => '',
                'backLabel' => 'Kembali',
                'orderTitle' => 'Pesanan',
                'payCta' => 'Bayar',
                'ownedCta' => 'Akses',
                'trustNote' => 'Aman.',
            ],
        ], $overrides);
    }
}
