import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Crop } from '../types';
import { cropsToRows, rowsToCrops, CROP_HEADERS } from './sheetMapper';
import { checkIsOwner, OWNER_EMAILS, PRIMARY_OWNER_EMAIL, BUSINESS_CONTACT_EMAIL } from '../services/auth';

function sanitizeCropData(raw: Partial<Crop>): { success: true; crop: Crop } | { success: false; error: string } {
  const cleanCommonName = (raw.commonName || '').trim();
  if (!cleanCommonName) {
    return { success: false, error: 'Crop Name is required.' };
  }

  const resolvedCat = (raw.cropCategory || raw.category || 'Cereals').trim();
  const crop: Crop = {
    id: raw.id || `crop-${Date.now()}`,
    commonName: cleanCommonName,
    scientificName: (raw.scientificName || '').trim(),
    family: (raw.family || 'Poaceae (Gramineae)').trim(),
    cropCategory: resolvedCat,
    category: resolvedCat,
    colour: (raw.colour || '').trim(),
    shape: (raw.shape || '').trim(),
    size: (raw.size || '').trim(),
    description: (raw.description || '').trim(),
    imageUrl: raw.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80',
    season: (raw.season || '').trim(),
    soilType: (raw.soilType || '').trim(),
    waterRequirement: (raw.waterRequirement || '').trim(),
    growthDuration: (raw.growthDuration || '').trim(),
    featured: Boolean(raw.featured)
  };

  return { success: true, crop };
}

test('Crop Validation: requires commonName and allows empty scientificName', () => {
  const invalidResult = sanitizeCropData({ commonName: '   ' });
  assert.equal(invalidResult.success, false);
  if (!invalidResult.success) {
    assert.match(invalidResult.error, /Crop Name is required/);
  }

  const validResult = sanitizeCropData({ commonName: 'Barley', scientificName: '' });
  assert.equal(validResult.success, true);
  if (validResult.success) {
    assert.equal(validResult.crop.commonName, 'Barley');
    assert.equal(validResult.crop.scientificName, '');
    assert.equal(validResult.crop.family, 'Poaceae (Gramineae)');
    assert.equal(validResult.crop.cropCategory, 'Cereals');
    assert.match(validResult.crop.id, /^crop-/);
  }
});

test('Crop Database Mapping: all 20 columns including Crop Category and 3 Stage Photos map to sheet row and round-trip', () => {
  const newCrop: Crop = {
    id: 'crop-barley-test-1',
    commonName: 'Barley',
    scientificName: 'Hordeum vulgare',
    family: 'Poaceae',
    cropCategory: 'Cereals',
    category: 'Cereals',
    colour: 'Amber / Golden',
    shape: 'Elliptical with furrow',
    size: '8 mm x 3 mm',
    description: 'High-fiber cereal grain used for malting and fodder.',
    imageUrl: 'data:image/jpeg;base64,MATURE_BARLEY',
    seedImageUrl: 'data:image/jpeg;base64,SEED_BARLEY',
    floweringImageUrl: 'data:image/jpeg;base64,FLOWER_BARLEY',
    matureImageUrl: 'data:image/jpeg;base64,MATURE_BARLEY',
    season: 'Rabi',
    soilType: 'Loamy to clay loam',
    waterRequirement: '350 - 450 mm',
    growthDuration: '110 days',
    featured: false,
    updatedAt: '2026-11-13T10:30:00.000Z'
  };

  const rows = cropsToRows([newCrop]);
  assert.equal(rows.length, 2);
  assert.equal(CROP_HEADERS[14], 'Crop Category');
  assert.equal(CROP_HEADERS[16], 'Seed Photo');
  assert.equal(CROP_HEADERS[17], 'Flowering Stage Photo');
  assert.equal(CROP_HEADERS[18], 'Mature Crop Photo');
  const dataRow = rows[1];
  assert.equal(dataRow[0], 'crop-barley-test-1');
  assert.equal(dataRow[1], 'Barley');
  assert.equal(dataRow[2], 'Hordeum vulgare');
  assert.equal(dataRow[7], 'High-fiber cereal grain used for malting and fodder.');
  assert.equal(dataRow[11], '350 - 450 mm');
  assert.equal(dataRow[14], 'Cereals');
  assert.equal(dataRow[16], 'data:image/jpeg;base64,SEED_BARLEY');
  assert.equal(dataRow[17], 'data:image/jpeg;base64,FLOWER_BARLEY');
  assert.equal(dataRow[18], 'data:image/jpeg;base64,MATURE_BARLEY');

  const restoredList = rowsToCrops(rows);
  assert.equal(restoredList.length, 1);
  assert.equal(restoredList[0].id, newCrop.id);
  assert.equal(restoredList[0].commonName, newCrop.commonName);
  assert.equal(restoredList[0].cropCategory, 'Cereals');
  assert.equal(restoredList[0].seedImageUrl, 'data:image/jpeg;base64,SEED_BARLEY');
  assert.equal(restoredList[0].floweringImageUrl, 'data:image/jpeg;base64,FLOWER_BARLEY');
  assert.equal(restoredList[0].matureImageUrl, 'data:image/jpeg;base64,MATURE_BARLEY');
  assert.equal(restoredList[0].updatedAt, '2026-11-13T10:30:00.000Z');
});

test('Access Control: Both personal and business owner accounts have permission to add or modify crops', () => {
  assert.deepEqual([...OWNER_EMAILS], [PRIMARY_OWNER_EMAIL, BUSINESS_CONTACT_EMAIL]);
  assert.equal(checkIsOwner('kalkotwaratharva77@gmail.com'), true);
  assert.equal(checkIsOwner('KALKOTWARATHARVA77@GMAIL.COM'), true);
  assert.equal(checkIsOwner('agrovya.contact@gmail.com'), true);
  assert.equal(checkIsOwner('AgroVya.Contact@GMAIL.COM'), true);
  assert.equal(checkIsOwner('student@agri-college.edu'), false);
  assert.equal(checkIsOwner('farmer_john@gmail.com'), false);
  assert.equal(checkIsOwner(null), false);
  assert.equal(checkIsOwner(undefined), false);
});
