<?php

namespace Tests\Unit;

use App\Support\RichText;
use PHPUnit\Framework\TestCase;

/**
 * Sanitasi konten deskripsi kaya (WYSIWYG) di sisi server.
 */
class RichTextTest extends TestCase
{
    public function test_plain_text_is_converted_to_safe_paragraphs(): void
    {
        $this->assertSame(
            '<p>Baris satu</p><p>Baris dua</p>',
            RichText::sanitize("Baris satu\n\nBaris dua")
        );

        $this->assertSame(
            '<p>Baris satu<br>Baris dua</p>',
            RichText::sanitize("Baris satu\nBaris dua")
        );
    }

    public function test_plain_text_is_escaped_exactly_once(): void
    {
        $this->assertSame(
            '<p>Kopi &amp; Teh &lt; Rp10.000</p>',
            RichText::sanitize('Kopi & Teh < Rp10.000')
        );

        // Konten dari editor sudah berupa HTML: entitas tidak boleh ter-escape dua kali.
        $this->assertSame('<p>Kopi &amp; Teh</p>', RichText::sanitize('<p>Kopi &amp; Teh</p>'));
    }

    public function test_scripts_and_event_attributes_are_removed(): void
    {
        $this->assertSame(
            '<p>Halo dunia</p>',
            RichText::sanitize('<p>Halo <script>alert(1)</script>dunia</p>')
        );

        $this->assertSame(
            '<p>Klik</p>',
            RichText::sanitize('<p style="color:red" onclick="evil()">Klik</p>')
        );

        $this->assertSame(
            '<p>aman</p>',
            RichText::sanitize('<p>aman</p><img src="x" onerror="alert(1)">')
        );

        $this->assertSame(
            '<p>a</p><p>b</p>',
            RichText::sanitize('<p>a</p><iframe src="https://evil.test"></iframe><p>b</p>')
        );
    }

    public function test_unsafe_links_are_unwrapped_and_safe_links_are_kept(): void
    {
        $this->assertSame('Klik di sini', RichText::sanitize('<a href="javascript:alert(1)">Klik di sini</a>'));

        $this->assertSame(
            '<a href="https://jaggad.test/kelas">Kelas</a>',
            RichText::sanitize('<a href="https://jaggad.test/kelas" target="_blank" onclick="x()">Kelas</a>')
        );

        $this->assertSame(
            '<a href="mailto:halo@jaggad.test">Email</a>',
            RichText::sanitize('<a href="mailto:halo@jaggad.test">Email</a>')
        );
    }

    public function test_supported_formatting_is_preserved(): void
    {
        $html = '<p><strong>Tebal</strong> <em>miring</em> <u>garis</u></p><ul><li>Poin</li></ul><ol><li>Nomor</li></ol>';

        $this->assertSame($html, RichText::sanitize($html));
    }

    public function test_utf8_content_is_preserved(): void
    {
        $this->assertSame(
            '<p>Harga spesial — Rp 100.000, “promo”</p>',
            RichText::sanitize('<p>Harga spesial — Rp 100.000, “promo”</p>')
        );
    }

    public function test_empty_values_become_null(): void
    {
        $this->assertNull(RichText::sanitize(null));
        $this->assertNull(RichText::sanitize(''));
        $this->assertNull(RichText::sanitize("   \n  "));
        $this->assertNull(RichText::sanitize('<p><br></p>'));
    }

    public function test_plain_text_extraction_ignores_formatting(): void
    {
        $this->assertSame(
            'Halo dunia satu dua',
            RichText::toPlainText('<p>Halo <strong>dunia</strong></p><ul><li>satu</li><li>dua</li></ul>')
        );

        $this->assertSame(10, RichText::length('<p><strong>Halo</strong> dunia</p>'));
        $this->assertSame(0, RichText::length(null));
    }
}
