import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_CATEGORIES,
  VEGETABLE_SUBCATEGORIES,
  resolveCropCategory,
  resolveVegetableSubcategory,
  normalizeCropRecord,
  mergeAndNormalizeCrops,
  filterCropsByCategory
} from './cropCategories';
import { Crop } from '../types';
import { INITIAL_CROPS } from '../data/seedData';

test('Crop Categories: contains exactly 12 agricultural categories in required order', () => {
  assert.equal(CROP_CATEGORIES.length, 12);
  assert.deepEqual(CROP_CATEGORIES, [
    'Cereals',
    'Pulses',
    'Oilseeds',
    'Fibre Crops',
    'Spices and Condiments',
    'Drug Crops',
    'Fodder Crops',
    'Sugar Crops',
    'Vegetables',
    'Fruits',
    'Flowers',
    'Medicinal Plants'
  ]);
});

test('Vegetable Subcategories: contains all 5 required classifications', () => {
  assert.equal(VEGETABLE_SUBCATEGORIES.length, 5);
  assert.deepEqual(VEGETABLE_SUBCATEGORIES, [
    'Leafy Vegetables',
    'Root and Tuber Vegetables',
    'Fruiting Vegetables',
    'Bulb Vegetables',
    'Flower Vegetables'
  ]);
});

test('resolveCropCategory: accurately classifies crops and separates Medicinal Plants from Drug Crops and Botanical Family', () => {
  // Cereals (Poaceae) including millets and oats even when description mentions fodder
  assert.equal(resolveCropCategory({ commonName: 'Wheat', family: 'Poaceae' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Rice', family: 'Poaceae' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Maize (Corn)', family: 'Poaceae' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Great Millet ( Jowar)', scientificName: 'Sorghum bicolor (M)', description: 'Jowar is an important cereal and fodder crop' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Oat', scientificName: 'Avena sativa L', description: 'Oat is an important cereal and fodder crop' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Pearl Millet', scientificName: 'Pennisetum typhodium', description: 'Bajra coarse cereal and fodder' }), 'Cereals');
  assert.equal(resolveCropCategory({ commonName: 'Kodo Millet', scientificName: 'Paspalum scrobiculatum', description: 'Small millet grain and forage' }), 'Cereals');

  // Pulses (Fabaceae)
  assert.equal(resolveCropCategory({ commonName: 'Chickpea (Gram)', family: 'Fabaceae' }), 'Pulses');
  assert.equal(resolveCropCategory({ commonName: 'Pigeon Pea (Arhar / Tur)', family: 'Fabaceae' }), 'Pulses');

  // Oilseeds (including Fabaceae legumes Soybean & Groundnut!)
  assert.equal(resolveCropCategory({ commonName: 'Indian Mustard', family: 'Brassicaceae' }), 'Oilseeds');
  assert.equal(resolveCropCategory({ commonName: 'Soybean', family: 'Fabaceae (Leguminosae)' }), 'Oilseeds');
  assert.equal(resolveCropCategory({ commonName: 'Groundnut (Peanut)', family: 'Fabaceae (Leguminosae)' }), 'Oilseeds');

  // Fibre Crops (Malvaceae)
  assert.equal(resolveCropCategory({ commonName: 'Cotton', family: 'Malvaceae' }), 'Fibre Crops');

  // Sugar Crops (Poaceae Sugarcane must NOT fall into Cereals)
  assert.equal(resolveCropCategory({ commonName: 'Sugarcane', family: 'Poaceae (Gramineae)' }), 'Sugar Crops');

  // Spices, Drug, Fodder, Vegetables, Fruits, Flowers
  assert.equal(resolveCropCategory({ commonName: 'Black Pepper' }), 'Spices and Condiments');
  assert.equal(resolveCropCategory({ commonName: 'Cumin' }), 'Spices and Condiments');
  assert.equal(resolveCropCategory({ commonName: 'Opium Poppy' }), 'Drug Crops');
  assert.equal(resolveCropCategory({ commonName: 'Isabgol' }), 'Drug Crops');
  assert.equal(resolveCropCategory({ commonName: 'Berseem' }), 'Fodder Crops');
  assert.equal(resolveCropCategory({ commonName: 'Tomato' }), 'Vegetables');
  assert.equal(resolveCropCategory({ commonName: 'Mango' }), 'Fruits');
  assert.equal(resolveCropCategory({ commonName: 'Marigold' }), 'Flowers');

  // All 10 Medicinal Plants classify strictly as Medicinal Plants (separate from Drug Crops)
  for (const name of [
    'Tulsi',
    'Aloe Vera',
    'Ashwagandha',
    'Neem',
    'Turmeric',
    'Ginger',
    'Giloy',
    'Amla',
    'Shatavari',
    'Brahmi'
  ]) {
    assert.equal(resolveCropCategory({ commonName: name }), 'Medicinal Plants');
  }

  // Dedicated cropCategory field overrides heuristic
  assert.equal(
    resolveCropCategory({ commonName: 'Custom Crop', family: 'Poaceae', cropCategory: 'Fodder Crops' }),
    'Fodder Crops'
  );
});

test('resolveVegetableSubcategory: accurately classifies vegetable subcategories', () => {
  assert.equal(resolveVegetableSubcategory({ commonName: 'Spinach (Palak)' }), 'Leafy Vegetables');
  assert.equal(resolveVegetableSubcategory({ commonName: 'Potato' }), 'Root and Tuber Vegetables');
  assert.equal(resolveVegetableSubcategory({ commonName: 'Tomato' }), 'Fruiting Vegetables');
  assert.equal(resolveVegetableSubcategory({ commonName: 'Onion' }), 'Bulb Vegetables');
  assert.equal(resolveVegetableSubcategory({ commonName: 'Cauliflower' }), 'Flower Vegetables');
});

test('filterCropsByCategory: filters strictly by Crop Category including Medicinal Plants vs Drug Crops', () => {
  // All Categories shows every seed crop
  const all = filterCropsByCategory(INITIAL_CROPS, 'All', 'All');
  assert.equal(all.length, INITIAL_CROPS.length);

  // Cereals shows Wheat, Rice, Maize, Barley — NOT Sugarcane (even though Sugarcane is Poaceae)
  const cereals = filterCropsByCategory(INITIAL_CROPS, 'Cereals', 'All');
  const cerealNames = cereals.map(c => c.commonName);
  assert.ok(cerealNames.includes('Wheat'));
  assert.ok(cerealNames.includes('Rice'));
  assert.ok(cerealNames.includes('Maize (Corn)'));
  assert.ok(!cerealNames.includes('Sugarcane'));

  // Pulses shows Chickpea, Red Lentil, Pigeon Pea — NOT Soybean or Groundnut (even though all share Fabaceae)
  const pulses = filterCropsByCategory(INITIAL_CROPS, 'Pulses', 'All');
  const pulseNames = pulses.map(c => c.commonName);
  assert.ok(pulseNames.includes('Chickpea (Gram)'));
  assert.ok(pulseNames.includes('Pigeon Pea (Arhar / Tur)'));
  assert.ok(!pulseNames.includes('Soybean'));
  assert.ok(!pulseNames.includes('Groundnut (Peanut)'));

  // Oilseeds shows Indian Mustard, Soybean, Groundnut
  const oilseeds = filterCropsByCategory(INITIAL_CROPS, 'Oilseeds', 'All');
  const oilseedNames = oilseeds.map(c => c.commonName);
  assert.ok(oilseedNames.includes('Soybean'));
  assert.ok(oilseedNames.includes('Groundnut (Peanut)'));
  assert.ok(oilseedNames.includes('Indian Mustard (Raya)'));
  assert.ok(!oilseedNames.includes('Chickpea (Gram)'));

  // Medicinal Plants includes all 10 required plants and stays separate from Drug Crops
  const medicinal = filterCropsByCategory(INITIAL_CROPS, 'Medicinal Plants', 'All');
  const medicinalNames = medicinal.map(c => c.commonName).join(' | ');
  assert.equal(medicinal.length, 10);
  for (const required of ['Tulsi', 'Aloe Vera', 'Ashwagandha', 'Neem', 'Turmeric', 'Ginger', 'Giloy', 'Amla', 'Shatavari', 'Brahmi']) {
    assert.ok(medicinalNames.includes(required), `Expected Medicinal Plants to include ${required}`);
  }
  const drugCrops = filterCropsByCategory(INITIAL_CROPS, 'Drug Crops', 'All');
  assert.ok(drugCrops.some(c => c.commonName.includes('Opium Poppy')));
  assert.ok(drugCrops.some(c => c.commonName.includes('Isabgol')));
  assert.ok(!drugCrops.some(c => c.commonName.includes('Ashwagandha')));

  // Vegetables, Fruits, Flowers remain 3 distinct categories
  const fruits = filterCropsByCategory(INITIAL_CROPS, 'Fruits', 'All');
  const flowers = filterCropsByCategory(INITIAL_CROPS, 'Flowers', 'All');
  const vegs = filterCropsByCategory(INITIAL_CROPS, 'Vegetables', 'All');
  assert.ok(fruits.every(c => c.cropCategory === 'Fruits'));
  assert.ok(flowers.every(c => c.cropCategory === 'Flowers'));
  assert.ok(vegs.every(c => c.cropCategory === 'Vegetables'));

  // Vegetable Subcategories inside Vegetables
  assert.equal(filterCropsByCategory(INITIAL_CROPS, 'Vegetables', 'Leafy Vegetables')[0].commonName, 'Spinach (Palak)');
  assert.equal(filterCropsByCategory(INITIAL_CROPS, 'Vegetables', 'Root and Tuber Vegetables')[0].commonName, 'Potato (Aloo)');
  assert.equal(filterCropsByCategory(INITIAL_CROPS, 'Vegetables', 'Bulb Vegetables')[0].commonName, 'Onion (Pyaz)');
  assert.equal(filterCropsByCategory(INITIAL_CROPS, 'Vegetables', 'Flower Vegetables')[0].commonName, 'Cauliflower (Phool Gobhi)');

  // Search by category name displays all crops in that category
  const searchPulses = filterCropsByCategory(INITIAL_CROPS, 'All', 'All', 'Pulses');
  assert.equal(searchPulses.length, pulses.length);

  const searchCereals = filterCropsByCategory(INITIAL_CROPS, 'All', 'All', 'Cereals');
  assert.equal(searchCereals.length, cereals.length);

  const searchMedicinal = filterCropsByCategory(INITIAL_CROPS, 'All', 'All', 'Medicinal Plants');
  assert.equal(searchMedicinal.length, medicinal.length);

  // Search + category filter work together
  const searchSoybeanInOilseeds = filterCropsByCategory(INITIAL_CROPS, 'Oilseeds', 'All', 'Soybean');
  assert.equal(searchSoybeanInOilseeds.length, 1);
  assert.equal(searchSoybeanInOilseeds[0].commonName, 'Soybean');

  const searchSoybeanInPulses = filterCropsByCategory(INITIAL_CROPS, 'Pulses', 'All', 'Soybean');
  assert.equal(searchSoybeanInPulses.length, 0);
});

test('mergeAndNormalizeCrops: preserves existing user records & images while normalizing cropCategory and upgrading legacy Ashwagandha/Turmeric seed IDs', () => {
  const legacyUserCrop = {
    id: 'crop-1',
    commonName: 'Wheat',
    scientificName: 'Triticum aestivum',
    family: 'Poaceae (Gramineae)',
    colour: 'Custom Amber',
    shape: 'Oval',
    size: '6mm',
    description: 'User updated wheat record',
    imageUrl: 'data:image/png;base64,customimage'
  } as unknown as Crop;

  const legacySeedAshwagandha = {
    id: 'crop-ashwagandha',
    commonName: 'Ashwagandha (Indian Ginseng)',
    scientificName: 'Withania somnifera',
    family: 'Solanaceae',
    cropCategory: 'Drug Crops',
    colour: 'Creamy',
    shape: 'Taproot',
    size: '20cm',
    description: 'Existing ashwagandha record',
    imageUrl: 'data:image/png;base64,ashwa'
  } as unknown as Crop;

  const customUserCrop = normalizeCropRecord({
    id: 'crop-custom-1',
    commonName: 'Mung Bean',
    scientificName: 'Vigna radiata',
    family: 'Fabaceae',
    cropCategory: 'Pulses',
    colour: 'Green',
    shape: 'Cylindrical',
    size: '4mm',
    description: 'Custom pulse crop',
    imageUrl: 'data:image/png;base64,mung'
  });

  const merged = mergeAndNormalizeCrops([legacyUserCrop, legacySeedAshwagandha, customUserCrop], INITIAL_CROPS);
  const preservedWheat = merged.find(c => c.id === 'crop-1');
  assert.ok(preservedWheat);
  assert.equal(preservedWheat.imageUrl, 'data:image/png;base64,customimage');
  assert.equal(preservedWheat.cropCategory, 'Cereals');

  const upgradedAshwagandha = merged.find(c => c.id === 'crop-ashwagandha');
  assert.ok(upgradedAshwagandha);
  assert.equal(upgradedAshwagandha.imageUrl, 'data:image/png;base64,ashwa');
  assert.equal(upgradedAshwagandha.cropCategory, 'Medicinal Plants');

  assert.ok(merged.some(c => c.id === 'crop-custom-1'));
  assert.ok(merged.some(c => c.id === 'crop-tulsi'));
  assert.ok(merged.some(c => c.id === 'crop-brahmi'));
});

test('mergeAndNormalizeCrops: newer local updatedAt timestamp is never overwritten by stale Firestore record', () => {
  const staleRemote = normalizeCropRecord({
    id: 'crop-custom-time-1',
    commonName: 'Mustard Old',
    scientificName: 'Brassica juncea',
    family: 'Brassicaceae',
    cropCategory: 'Oilseeds',
    colour: 'Yellow',
    shape: 'Round',
    size: '2 mm',
    description: 'Older remote state',
    imageUrl: 'https://example.com/old.jpg',
    updatedAt: '2026-11-12T10:00:00.000Z'
  });

  const newerLocal = normalizeCropRecord({
    id: 'crop-custom-time-1',
    commonName: 'Mustard Updated',
    scientificName: 'Brassica juncea',
    family: 'Brassicaceae',
    cropCategory: 'Oilseeds',
    colour: 'Brownish Yellow',
    shape: 'Round',
    size: '2.2 mm',
    description: 'Newer local edit with 3 stage photos',
    imageUrl: 'data:image/jpeg;base64,mature',
    seedImageUrl: 'data:image/jpeg;base64,seed',
    floweringImageUrl: 'data:image/jpeg;base64,flower',
    matureImageUrl: 'data:image/jpeg;base64,mature',
    updatedAt: '2026-11-13T12:00:00.000Z'
  });

  const merged = mergeAndNormalizeCrops([staleRemote], [newerLocal]);
  const winner = merged.find(c => c.id === 'crop-custom-time-1');
  assert.ok(winner);
  assert.equal(winner.commonName, 'Mustard Updated');
  assert.equal(winner.seedImageUrl, 'data:image/jpeg;base64,seed');
  assert.equal(winner.floweringImageUrl, 'data:image/jpeg;base64,flower');
  assert.equal(winner.matureImageUrl, 'data:image/jpeg;base64,mature');
});

test('mergeAndNormalizeCrops: preserves uploaded images even when timestamps match fallback seed records', () => {
  const seedWithoutUploads = normalizeCropRecord({
    id: 'crop-rice',
    commonName: 'Rice',
    scientificName: 'Oryza sativa',
    family: 'Poaceae',
    cropCategory: 'Cereals',
    colour: 'Straw',
    shape: 'Slender',
    size: '7 mm',
    description: 'Rice paddy',
    imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=1200&q=80'
  });

  const idbWithUploads = normalizeCropRecord({
    ...seedWithoutUploads,
    imageUrl: 'data:image/jpeg;base64,riceMature',
    seedImageUrl: 'data:image/jpeg;base64,riceSeed',
    floweringImageUrl: 'data:image/jpeg;base64,riceFlower',
    matureImageUrl: 'data:image/jpeg;base64,riceMature'
  });

  const merged = mergeAndNormalizeCrops([seedWithoutUploads], [idbWithUploads]);
  const winner = merged.find(c => c.id === 'crop-rice');
  assert.ok(winner);
  assert.equal(winner.imageUrl, 'data:image/jpeg;base64,riceMature');
  assert.equal(winner.seedImageUrl, 'data:image/jpeg;base64,riceSeed');
  assert.equal(winner.floweringImageUrl, 'data:image/jpeg;base64,riceFlower');
  assert.equal(winner.matureImageUrl, 'data:image/jpeg;base64,riceMature');
});
