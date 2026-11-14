import test from 'node:test';
import assert from 'node:assert/strict';
import { cropsToRows, rowsToCrops, pestsToRows, rowsToPests, sanitizeSheetImageCell } from './sheetMapper';
import { INITIAL_CROPS, INITIAL_PESTS } from '../data/seedData';

test('crops roundtrip serialization to and from Sheet rows', () => {
  const rows = cropsToRows(INITIAL_CROPS);
  assert.equal(rows.length, INITIAL_CROPS.length + 1); // Header + data rows
  assert.equal(rows[0][1], 'Common Name');

  const restored = rowsToCrops(rows);
  assert.equal(restored.length, INITIAL_CROPS.length);
  assert.equal(restored[0].commonName, 'Wheat');
  assert.equal(restored[0].scientificName, 'Triticum aestivum');
  assert.equal(restored[0].family, 'Poaceae (Gramineae)');
  assert.equal(restored[0].cropCategory, 'Cereals');
  assert.equal(restored[0].featured, true);
  assert.equal(restored[1].commonName, 'Rice');
  assert.equal(restored[1].featured, true);
  const restoredSoybean = restored.find(c => c.commonName === 'Soybean');
  assert.ok(restoredSoybean);
  assert.equal(restoredSoybean.cropCategory, 'Oilseeds');
});

test('pests roundtrip serialization to and from Sheet rows', () => {
  const rows = pestsToRows(INITIAL_PESTS);
  assert.equal(rows.length, INITIAL_PESTS.length + 1);

  const restored = rowsToPests(rows);
  assert.equal(restored.length, INITIAL_PESTS.length);
  assert.equal(restored[0].name, 'Yellow Stem Borer');
  assert.ok(restored[0].affectedCrops.includes('Rice'));
});

test('sanitizeSheetImageCell skips oversized base64 payloads above Sheets 50k limit while keeping HTTPS Storage URLs', () => {
  const httpsUrl = 'https://firebasestorage.googleapis.com/v0/b/demo/o/rice.jpg?alt=media';
  assert.equal(sanitizeSheetImageCell(httpsUrl), httpsUrl);

  const hugeDataUrl = `data:image/jpeg;base64,${'A'.repeat(60000)}`;
  assert.equal(sanitizeSheetImageCell(hugeDataUrl), '');
});
