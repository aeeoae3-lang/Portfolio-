import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFile,
  formatFileSize,
  isDataUrl,
  getRecommendedPresets,
  AGRICULTURAL_PRESETS
} from './imageUtils';

test('validateImageFile rejects non-images and accepts valid image MIME types', () => {
  const validJpeg = validateImageFile({ type: 'image/jpeg', size: 1024 * 500 });
  assert.equal(validJpeg.valid, true);

  const validPng = validateImageFile({ type: 'image/png', size: 1024 * 1024 });
  assert.equal(validPng.valid, true);

  const validWebp = validateImageFile({ type: 'image/webp', size: 1024 * 200 });
  assert.equal(validWebp.valid, true);

  const invalidPdf = validateImageFile({ type: 'application/pdf', size: 1024 * 100 });
  assert.equal(invalidPdf.valid, false);
  assert.ok(invalidPdf.error?.includes('image'));

  const oversized = validateImageFile({ type: 'image/jpeg', size: 20 * 1024 * 1024 });
  assert.equal(oversized.valid, false);
  assert.ok(oversized.error?.includes('15MB'));
});

test('formatFileSize formats bytes, KB, and MB cleanly', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1024 * 45), '45.0 KB');
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');
});

test('isDataUrl detects data URLs accurately', () => {
  assert.equal(isDataUrl('data:image/jpeg;base64,abc123xyz'), true);
  assert.equal(isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA'), true);
  assert.equal(isDataUrl('https://images.unsplash.com/photo-123'), false);
  assert.equal(isDataUrl(''), false);
});

test('getRecommendedPresets filters by category correctly', () => {
  const all = getRecommendedPresets();
  assert.equal(all.length, AGRICULTURAL_PRESETS.length);

  const crops = getRecommendedPresets('crop');
  assert.ok(crops.length > 0);
  assert.ok(crops.every(p => p.category === 'crop'));

  const pests = getRecommendedPresets('pest');
  assert.ok(pests.length > 0);
  assert.ok(pests.every(p => p.category === 'pest'));

  const diseases = getRecommendedPresets('disease');
  assert.ok(diseases.length > 0);
  assert.ok(diseases.every(p => p.category === 'disease'));

  const tips = getRecommendedPresets('tip');
  assert.ok(tips.length > 0);
  assert.ok(tips.every(p => p.category === 'tip'));
});
