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

test('searchAll finds all crops matching a Crop Category (Pulses, Cereals, Oilseeds) and specific crops', () => {
  const pulsesResults = searchAll('Pulses', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS)
    .filter(r => r.type === 'crop');
  const pulseTitles = pulsesResults.map(r => r.title);
  assert.ok(pulseTitles.includes('Chickpea (Gram)'));
  assert.ok(pulseTitles.includes('Red Lentil (Masoor)'));
  assert.ok(pulseTitles.includes('Pigeon Pea (Arhar / Tur)'));
  assert.ok(!pulseTitles.includes('Soybean'));

  const cerealsResults = searchAll('Cereals', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS)
    .filter(r => r.type === 'crop');
  const cerealTitles = cerealsResults.map(r => r.title);
  assert.ok(cerealTitles.includes('Wheat'));
  assert.ok(cerealTitles.includes('Rice'));
  assert.ok(cerealTitles.includes('Maize (Corn)'));
  assert.ok(cerealTitles.includes('Barley'));

  const oilseedsResults = searchAll('Oilseeds', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS)
    .filter(r => r.type === 'crop');
  const oilseedTitles = oilseedsResults.map(r => r.title);
  assert.ok(oilseedTitles.includes('Soybean'));
  assert.ok(oilseedTitles.includes('Groundnut (Peanut)'));
  assert.ok(oilseedTitles.includes('Indian Mustard (Raya)'));

  assert.ok(searchAll('Chickpea', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS).some(r => r.title.includes('Chickpea')));
  assert.ok(searchAll('Soybean', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS).some(r => r.title === 'Soybean'));
  assert.ok(searchAll('Groundnut', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS).some(r => r.title.includes('Groundnut')));

  const medicinalResults = searchAll('Medicinal Plants', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS)
    .filter(r => r.type === 'crop');
  assert.equal(medicinalResults.length, 10);
  for (const name of ['Tulsi', 'Aloe Vera', 'Ashwagandha', 'Neem', 'Turmeric', 'Ginger', 'Giloy', 'Amla', 'Shatavari', 'Brahmi']) {
    assert.ok(medicinalResults.some(r => r.title.includes(name)), `Search for Medicinal Plants must include ${name}`);
  }
});

test('searchAll returns empty list for empty or whitespace query', () => {
  assert.deepEqual(searchAll('', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS), []);
  assert.deepEqual(searchAll('   ', INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS), []);
});

test('isOwnerEmail correctly identifies personal and business owner emails case-insensitively', () => {
  const owners = ['kalkotwaratharva77@gmail.com', 'agrovya.contact@gmail.com'];
  assert.equal(isOwnerEmail('kalkotwaratharva77@gmail.com', owners[0]), true);
  assert.equal(isOwnerEmail('kalkotwaratharva77@gmail.com', owners), true);
  assert.equal(isOwnerEmail('KalkotwarAtharva77@GMAIL.COM', owners), true);
  assert.equal(isOwnerEmail('agrovya.contact@gmail.com', owners), true);
  assert.equal(isOwnerEmail('AgroVya.Contact@GMAIL.COM', owners), true);
  assert.equal(isOwnerEmail('otherfarmer@gmail.com', owners), false);
  assert.equal(isOwnerEmail(null, owners), false);
  assert.equal(isOwnerEmail(undefined, owners), false);
});
