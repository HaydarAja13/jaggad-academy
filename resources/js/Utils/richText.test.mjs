import assert from 'node:assert/strict';
import {
    isRichTextEmpty,
    normalizeRichText,
    plainTextToRichText,
    prepareRichText,
    richTextLength,
    richTextToPlainText,
} from './richText.js';

// Teks biasa lama tetap tampil benar (newline menjadi <br>, karakter di-escape).
assert.equal(prepareRichText('Baris satu\nBaris dua'), 'Baris satu<br>Baris dua');
assert.equal(prepareRichText('Kopi & Teh < Rp10.000'), 'Kopi &amp; Teh &lt; Rp10.000');
assert.equal(prepareRichText('A\n\nB', { inline: true }), 'A  B');
assert.equal(prepareRichText(null), '');

// Teks ketikan editor diubah menjadi paragraf HTML tanpa escape ganda.
assert.equal(plainTextToRichText('Halo dunia'), '<p>Halo dunia</p>');
assert.equal(plainTextToRichText('Kopi & Teh'), '<p>Kopi &amp; Teh</p>');
assert.equal(plainTextToRichText('Baris satu\nBaris dua'), '<p>Baris satu<br>Baris dua</p>');
assert.equal(plainTextToRichText('Paragraf satu\n\nParagraf dua'), '<p>Paragraf satu</p><p>Paragraf dua</p>');
assert.equal(plainTextToRichText('   '), '');

// Nilai dari editor: teks tanpa tag dibungkus paragraf, entitas tidak dobel.
assert.equal(normalizeRichText('Halo dunia'), '<p>Halo dunia</p>');
assert.equal(normalizeRichText('Kopi &amp; Teh'), '<p>Kopi &amp; Teh</p>');
assert.equal(normalizeRichText('   '), '');

// Teks polos: entitas hasil editor tidak boleh ikut terhitung sebagai karakter mentah.
assert.equal(richTextToPlainText('Kopi &amp; Teh'), 'Kopi & Teh');
assert.equal(richTextToPlainText('<p>Halo <strong>dunia</strong></p>'), 'Halo dunia');
assert.equal(richTextToPlainText('<ul><li>satu</li><li>dua</li></ul>'), 'satu dua');
assert.equal(richTextToPlainText('a&nbsp;b'), 'a b');
assert.equal(richTextToPlainText(null), '');

assert.equal(richTextLength('<p><strong>Halo</strong> dunia</p>'), 10);
assert.equal(richTextLength('Kopi &amp; Teh'), 10);
assert.equal(isRichTextEmpty('<p><br></p>'), true);
assert.equal(isRichTextEmpty('<p>isi</p>'), false);

console.log('richText checks passed');
