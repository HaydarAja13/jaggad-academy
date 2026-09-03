import assert from 'node:assert/strict';
import { getYoutubeId, normalizePromoContent } from './promoContent.js';

const legacy = normalizePromoContent(JSON.stringify({
    title: 'Judul lama',
    videoUrl: 'https://youtu.be/abc123XYZ',
    ctaTitle: 'Beli sekarang',
    selectedProductIds: ['2', 2, '3'],
}));

assert.equal(legacy.hero.title, 'Judul lama');
assert.equal(legacy.hero.mediaType, 'youtube');
assert.equal(legacy.cta.primary, 'Beli sekarang');
assert.deepEqual(legacy.selectedProductIds, [2, 3]);
assert.equal(getYoutubeId('https://youtube.com/watch?v=abc123XYZ'), 'abc123XYZ');
assert.equal(getYoutubeId('https://example.com/watch?v=abc123XYZ'), '');

console.log('promoContent checks passed');
