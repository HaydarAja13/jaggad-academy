/**
 * Rich text helpers.
 *
 * Konten deskripsi disimpan sebagai HTML terbatas (bold, italic, underline,
 * bullet, numbered list, tautan). Semua konten lama yang masih berupa teks
 * biasa tetap tampil benar karena newline otomatis diubah menjadi <br>.
 *
 * Sanitasi di sini adalah lapisan pertahanan tambahan di sisi klien.
 * Validasi utama tetap dilakukan di server (App\Support\RichText).
 */

const BLOCK_TAGS = new Set([
    'p', 'div', 'li', 'ul', 'ol',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'section', 'article', 'header', 'footer',
    'aside', 'main', 'figure', 'figcaption', 'table', 'thead', 'tbody',
    'tfoot', 'tr', 'td', 'th', 'address',
]);

const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 'a', 'br']);

const ALLOWED_TAGS = new Set([...BLOCK_TAGS, ...INLINE_TAGS]);

const DROP_TAGS = new Set([
    'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
    'form', 'input', 'button', 'select', 'textarea', 'svg', 'math', 'img',
    'video', 'audio', 'source', 'picture', 'template', 'noscript', 'canvas',
]);

const TAG_HINT = /<\/?(?:p|div|br|strong|b|em|i|u|ul|ol|li|a|span|h[1-6]|blockquote|script|style|iframe|img)\b/i;

const escapeHtml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttribute = value => escapeHtml(value).replace(/`/g, '&#96;');

const ENTITY_HINT = /&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});/;

const hasMarkup = value => TAG_HINT.test(String(value ?? ''));

/**
 * Ubah entitas HTML (&amp;, &lt;, &#39;, ...) menjadi karakter aslinya.
 * Hanya dipakai untuk menghitung teks polos; implementasinya murni string
 * sehingga tidak pernah membuat elemen/HTML baru.
 */
const decodeEntities = value => {
    const text = String(value ?? '');
    if (!ENTITY_HINT.test(text)) return text;

    const named = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: '\u00a0',
    };

    return text.replace(/&(?:([a-zA-Z][a-zA-Z0-9]{1,31})|#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6}));/g, (match, name, decimal, hex) => {
        if (name) return named[name.toLowerCase()] ?? match;

        const code = decimal ? Number(decimal) : parseInt(hex, 16);
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;

        try {
            return String.fromCodePoint(code);
        } catch {
            return match;
        }
    });
};

const parseRoot = html => {
    if (typeof DOMParser === 'undefined') return null;
    const document = new DOMParser().parseFromString(
        `<body><div data-rich-root="true">${html}</div></body>`,
        'text/html',
    );
    return document.querySelector('[data-rich-root]');
};

const safeUrl = url => {
    const value = String(url ?? '').trim().replace(/[\u0000-\u001F\u007F]+/g, '');
    if (!value) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
        return /^(?:https?|mailto|tel):/i.test(value) ? value : '';
    }
    return value;
};

const unwrap = node => {
    const parent = node.parentNode;
    if (!parent) {
        node.remove();
        return;
    }
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    node.remove();
};

const cleanNode = node => {
    if (node.nodeType === 3) return;
    if (node.nodeType !== 1) {
        node.remove();
        return;
    }

    const tag = node.tagName.toLowerCase();
    if (DROP_TAGS.has(tag)) {
        node.remove();
        return;
    }

    const href = tag === 'a' ? node.getAttribute('href') : null;
    const title = tag === 'a' ? node.getAttribute('title') : null;

    cleanChildren(node);

    Array.from(node.attributes).forEach(attribute => node.removeAttribute(attribute.name));

    if (!ALLOWED_TAGS.has(tag)) {
        unwrap(node);
        return;
    }

    if (tag === 'a') {
        const url = safeUrl(href);
        if (!url) {
            unwrap(node);
            return;
        }
        node.setAttribute('href', url);
        if (title && title.trim()) node.setAttribute('title', title.trim().slice(0, 200));
    }
};

const cleanChildren = node => {
    Array.from(node.childNodes).forEach(cleanNode);
};

/** Buang tag/atribut berbahaya, sisakan format yang didukung editor. */
export function sanitizeRichText(value) {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw || !hasMarkup(raw)) return '';

    const root = parseRoot(raw);
    if (!root) return '';

    cleanChildren(root);

    return root.innerHTML.trim();
}

/**
 * Ubah HTML kaya menjadi HTML inline saja (untuk kartu katalog atau paragraf
 * pendek): list diratakan dengan pemisah, tag blok dilepas, format inline
 * (bold/italic/underline/link) tetap tampil.
 */
export function toInlineRichText(value) {
    const safe = sanitizeRichText(value);
    if (!safe) return '';

    const root = parseRoot(safe);
    if (!root) return '';

    const render = parent => {
        let output = '';

        Array.from(parent.childNodes).forEach(node => {
            if (node.nodeType === 3) {
                output += escapeHtml(node.nodeValue);
                return;
            }
            if (node.nodeType !== 1) return;

            const tag = node.tagName.toLowerCase();
            if (tag === 'br') {
                output += ' ';
                return;
            }

            const inner = render(node);

            if (INLINE_TAGS.has(tag)) {
                if (tag === 'a') {
                    output += `<a href="${escapeAttribute(node.getAttribute('href') || '')}">${inner}</a>`;
                } else {
                    output += `<${tag}>${inner}</${tag}>`;
                }
                return;
            }

            const separator = tag === 'li' ? ' · ' : ' ';
            output += `${separator}${inner}${separator}`;
        });

        return output;
    };

    return render(root)
        .replace(/[ \t\r\n]+/g, ' ')
        .replace(/^(?:\s|·)+/u, '')
        .replace(/(?:\s|·)+$/u, '')
        .trim();
}

/** HTML siap tampil; teks biasa lama otomatis diberi <br> dan di-escape. */
export function prepareRichText(value, { inline = false } = {}) {
    if (value === null || value === undefined) return '';
    const raw = String(value).replace(/\r\n?/g, '\n').trim();
    if (!raw) return '';

    if (!hasMarkup(raw)) {
        const escaped = escapeHtml(raw)
            .replace(/\n{2,}/g, '<br><br>')
            .replace(/\n/g, '<br>');
        return inline ? escaped.replace(/<br\s*\/?>/gi, ' ') : escaped;
    }

    return inline ? toInlineRichText(raw) : sanitizeRichText(raw);
}

/**
 * Ubah teks polos (hasil ketikan di editor) menjadi HTML paragraf.
 * Dipakai editor supaya nilai yang disimpan selalu berbentuk HTML, sehingga
 * karakter seperti `&` atau `<` tidak ter-escape dua kali di server.
 */
export function plainTextToRichText(value) {
    const raw = String(value ?? '').replace(/\r\n?/g, '\n').trim();
    if (!raw) return '';

    return raw
        .split(/\n{2,}/)
        .map(chunk => chunk.trim())
        .filter(Boolean)
        .map(chunk => `<p>${escapeHtml(chunk).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

/**
 * Nilai dari contentEditable menjadi HTML tersimpan yang aman:
 * - sudah ada tag  -> disanitasi (format dipertahankan, baris baru tetap),
 * - hanya teks     -> di-escape dan dibungkus paragraf.
 */
export function normalizeRichText(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (/<\/?[a-zA-Z][^>]*>/.test(raw)) return sanitizeRichText(raw);

    return plainTextToRichText(decodeEntities(raw));
}

/** Teks polos untuk pencarian, hitungan karakter, atribut, dan meta. */
export function richTextToPlainText(value) {
    if (value === null || value === undefined) return '';
    const raw = String(value);
    if (!raw) return '';
    if (!hasMarkup(raw)) return decodeEntities(raw).replace(/\s+/g, ' ').trim();

    const spaced = raw
        .replace(/<\/(?:p|div|li|h[1-6]|ul|ol|blockquote)>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ');

    if (typeof DOMParser === 'undefined') {
        return spaced.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const document = new DOMParser().parseFromString(spaced, 'text/html');
    return (document.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function richTextLength(value) {
    return richTextToPlainText(value).length;
}

export function isRichTextEmpty(value) {
    return richTextLength(value) === 0;
}

export { safeUrl as sanitizeRichTextUrl };
