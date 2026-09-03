import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMaterialLink } from './materialLinks.js';

test('classifyMaterialLink maps known material providers to the right kind', () => {
    assert.equal(classifyMaterialLink('https://docs.google.com/document/d/123'), 'document');
    assert.equal(classifyMaterialLink('https://youtube.com/watch?v=abc'), 'video');
    assert.equal(classifyMaterialLink('https://drive.google.com/file/d/123/view'), 'drive');
    assert.equal(classifyMaterialLink('https://meet.google.com/abc-defg-hij'), 'meeting');
    assert.equal(classifyMaterialLink('https://www.canva.com/design/abc/view'), 'design');
    assert.equal(classifyMaterialLink('https://example.com/anything-else'), 'document');
});
