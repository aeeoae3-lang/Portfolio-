import test from 'node:test';
import assert from 'node:assert/strict';
import { cropsToRows, rowsToCrops, pestsToRows, rowsToPests } from './sheetMapper';
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
  assert.equal(restored[0].featured, true);
  assert.equal(restored[1].commonName, 'Rice');
  assert.equal(restored[1].featured, true);
});

test('pests roundtrip serialization to and from Sheet rows', () => {
  const rows = pestsToRows(INITIAL_PESTS);
  assert.equal(rows.length, INITIAL_PESTS.length + 1);

  const restored = rowsToPests(rows);
  assert.equal(restored.length, INITIAL_PESTS.length);
  assert.equal(restored[0].name, 'Yellow Stem Borer');
  assert.ok(restored[0].affectedCrops.includes('Rice'));
});
