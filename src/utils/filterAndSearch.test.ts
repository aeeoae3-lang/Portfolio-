import test from 'node:test';
import assert from 'node:assert/strict';
import { searchAll, isOwnerEmail } from './filterAndSearch';
import { INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS } from '../data/seedData';

test('searchAll finds Wheat by common name and scientific name', () => {
  const byCommon = searchAll('Wheat', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS);
  assert.ok(byCommon.some(r => r.title === 'Wheat'));

  const byScientific = searchAll('Triticum', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS);
  assert.ok(byScientific.some(r => r.subtitle.includes('Triticum')));
});

test('searchAll finds Rice and its diseases', () => {
  const results = searchAll('Rice', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS);
  const cropMatch = results.find(r => r.type === 'crop' && r.title === 'Rice');
  assert.ok(cropMatch, 'Rice should be found in crops');

  const pestOrDisease = results.some(r => r.type === 'pest' || r.type === 'disease');
  assert.ok(pestOrDisease, 'Should find pests or diseases affecting rice');
});

test('searchAll returns empty list for empty or whitespace query', () => {
  assert.deepEqual(searchAll('', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS), []);
  assert.deepEqual(searchAll('   ', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS), []);
});

test('isOwnerEmail correctly identifies owner email case-insensitively', () => {
  const owner = 'kalkotwaratharva77@gmail.com';
  assert.equal(isOwnerEmail('kalkotwaratharva77@gmail.com', owner), true);
  assert.equal(isOwnerEmail('KalkotwarAtharva77@GMAIL.COM', owner), true);
  assert.equal(isOwnerEmail('otherfarmer@gmail.com', owner), false);
  assert.equal(isOwnerEmail(null, owner), false);
  assert.equal(isOwnerEmail(undefined, owner), false);
});
