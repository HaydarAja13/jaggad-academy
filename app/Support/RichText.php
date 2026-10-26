<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * Sanitasi konten deskripsi kaya (bold, italic, underline, list, tautan).
 *
 * Semua konten yang berasal dari editor WYSIWYG wajib melewati kelas ini
 * sebelum disimpan, supaya admin tidak bisa menyisipkan script/atribut
 * berbahaya ke halaman publik.
 */
final class RichText
{
    private const ALLOWED_TAGS = [
        'p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a',
    ];

    private const DROP_TAGS = [
        'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
        'form', 'input', 'button', 'select', 'textarea', 'svg', 'math', 'img',
        'video', 'audio', 'source', 'picture', 'template', 'noscript', 'canvas',
    ];

    private const TAG_HINT = '/<\/?(?:p|div|br|strong|b|em|i|u|ul|ol|li|a|span|h[1-6]|blockquote|script|style|iframe|img)\b/i';

    public static function sanitize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim(str_replace(["\r\n", "\r"], "\n", $value));

        if ($value === '') {
            return null;
        }

        // Konten lama berupa teks biasa: ubah menjadi paragraf HTML supaya
        // konsisten dengan konten dari editor dan tidak ter-escape dua kali.
        if (! self::hasMarkup($value)) {
            return self::plainTextToHtml($value);
        }

        $dom = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="utf-8" ?><body>'.$value.'</body>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $dom->getElementsByTagName('body')->item(0);
        if (! $body) {
            return null;
        }

        self::cleanChildren($body);

        $html = '';
        foreach ($body->childNodes as $child) {
            $html .= $dom->saveHTML($child);
        }

        $html = trim($html);

        return $html === '' || self::toPlainText($html) === '' ? null : $html;
    }

    /** Teks polos: dipakai untuk hitungan karakter, pencarian, dan meta. */
    public static function toPlainText(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        $value = (string) $value;

        if ($value === '') {
            return '';
        }

        if (! self::hasMarkup($value)) {
            return trim((string) preg_replace('/\s+/u', ' ', $value));
        }

        $spaced = (string) preg_replace(
            ['/<\/(?:p|div|li|h[1-6]|ul|ol|blockquote)>/i', '/<br\s*\/?>/i'],
            ' ',
            $value
        );

        $text = html_entity_decode(strip_tags($spaced), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }

    public static function length(?string $value): int
    {
        return mb_strlen(self::toPlainText($value));
    }

    private static function hasMarkup(string $value): bool
    {
        return (bool) preg_match(self::TAG_HINT, $value);
    }

    /** Teks polos (konten lama) menjadi paragraf HTML yang aman. */
    private static function plainTextToHtml(string $value): ?string
    {
        $paragraphs = preg_split('/\n{2,}/', $value) ?: [];
        $html = '';

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);

            if ($paragraph === '') {
                continue;
            }

            $html .= '<p>'.str_replace("\n", '<br>', e($paragraph)).'</p>';
        }

        return $html === '' ? null : $html;
    }

    private static function cleanChildren(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            self::cleanNode($child);
        }
    }

    private static function cleanNode(DOMNode $node): void
    {
        if ($node instanceof DOMText) {
            return;
        }

        if (! $node instanceof DOMElement) {
            $node->parentNode?->removeChild($node);

            return;
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, self::DROP_TAGS, true)) {
            $node->parentNode?->removeChild($node);

            return;
        }

        $href = $tag === 'a' ? $node->getAttribute('href') : null;
        $title = $tag === 'a' ? $node->getAttribute('title') : null;

        self::cleanChildren($node);

        // Hapus seluruh atribut (style, on*, class, dsb).
        foreach (iterator_to_array($node->attributes) as $attribute) {
            $node->removeAttribute($attribute->nodeName);
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            self::unwrap($node);

            return;
        }

        if ($tag === 'a') {
            $url = self::safeUrl($href);

            if ($url === null) {
                self::unwrap($node);

                return;
            }

            $node->setAttribute('href', $url);

            if ($title !== null && trim($title) !== '') {
                $node->setAttribute('title', mb_substr(trim($title), 0, 200));
            }
        }
    }

    private static function unwrap(DOMElement $node): void
    {
        $parent = $node->parentNode;

        if (! $parent) {
            return;
        }

        while ($node->firstChild) {
            $parent->insertBefore($node->firstChild, $node);
        }

        $parent->removeChild($node);
    }

    private static function safeUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        $url = trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', '', html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8')));

        if ($url === '') {
            return null;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $url)) {
            return preg_match('/^(?:https?|mailto|tel):/i', $url) ? $url : null;
        }

        return $url;
    }
}
