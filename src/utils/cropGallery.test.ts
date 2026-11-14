import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_PHOTO_CAPTIONS,
  getStarterPhotosForCrop,
  normalizeCropPhoto,
  filterPhotosByCropId,
  getCropGallery,
  addPhotosToCropGallery,
  updateCropGalleryPhoto,
  deleteCropGalleryPhoto,
  mergeCropPhotosMaps
} from './cropGallery';
import { Crop, CropPhoto } from '../types';

const wheatCrop: Crop = {
  id: 'crop-1',
  commonName: 'Wheat',
  scientificName: 'Triticum aestivum',
  family: 'Poaceae (Gramineae)',
  cropCategory: 'Cereals',
  colour: 'Golden amber',
  shape: 'Elliptical',
  size: '6 mm',
  description: 'Wheat staple grain',
  imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80'
};

const riceCrop: Crop = {
  id: 'crop-2',
  commonName: 'Rice',
  scientificName: 'Oryza sativa',
  family: 'Poaceae (Gramineae)',
  cropCategory: 'Cereals',
  colour: 'Straw yellow',
  shape: 'Elongated',
  size: '7 mm',
  description: 'Rice paddy staple',
  imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=1200&q=80'
};

test('CROP_PHOTO_CAPTIONS includes all 8 agricultural growth stage and diagnostic captions', () => {
  assert.deepEqual([...CROP_PHOTO_CAPTIONS], [
    'Seed',
    'Seedling',
    'Vegetative stage',
    'Flowering stage',
    'Harvesting',
    'Mature crop',
    'Diseases and symptoms',
    'Pest damage'
  ]);
});

test('Each crop has a separate starter gallery and never leaks photos across crops', () => {
  const wheatGallery = getCropGallery(wheatCrop, {}, new Set());
  const riceGallery = getCropGallery(riceCrop, {}, new Set());

  assert.equal(wheatGallery.length, 5);
  assert.ok(wheatGallery.every(p => p.cropId === 'crop-1'));
  assert.equal(riceGallery.length, 1);
  assert.ok(riceGallery.every(p => p.cropId === 'crop-2'));
  assert.notEqual(wheatGallery[0].imageUrl, riceGallery[0].imageUrl);
});

test('filterPhotosByCropId and normalizeCropPhoto enforce strict per-crop isolation', () => {
  const mixedList: CropPhoto[] = [
    { id: 'p1', cropId: 'crop-1', imageUrl: 'data:image/jpeg;base64,aaa', caption: 'Seed' },
    { id: 'p2', cropId: 'crop-2', imageUrl: 'data:image/jpeg;base64,bbb', caption: 'Seedling' },
    { id: 'p3', cropId: 'crop-1', imageUrl: '   ', caption: 'Empty' }
  ];

  const wheatOnly = filterPhotosByCropId(mixedList, 'crop-1');
  assert.equal(wheatOnly.length, 1);
  assert.equal(wheatOnly[0].id, 'p1');

  // Even if someone stored a photo with wrong cropId inside rice's map slot, getCropGallery rejects it
  const pollutedMap: Record<string, CropPhoto[]> = {
    'crop-2': [
      { id: 'rogue', cropId: 'crop-1', imageUrl: 'data:image/jpeg;base64,rogue', caption: 'Rogue' },
      { id: 'valid-rice', cropId: 'crop-2', imageUrl: 'data:image/jpeg;base64,rice', caption: 'Vegetative stage' }
    ]
  };
  const riceGallery = getCropGallery(riceCrop, pollutedMap, new Set());
  assert.equal(riceGallery.length, 2);
  assert.ok(riceGallery.every(p => p.cropId === 'crop-2'));
  assert.ok(!riceGallery.some(p => p.id === 'rogue'));

  const bound = normalizeCropPhoto({ id: 'x y', cropId: 'wrong-crop', imageUrl: 'https://example.com/a.jpg', caption: '  Flowering stage  ' }, 'crop-tulsi');
  assert.equal(bound.cropId, 'crop-tulsi');
  assert.equal(bound.caption, 'Flowering stage');
  assert.equal(bound.id, 'x-y');
});

test('Admin can batch upload multiple photos, update captions/notes, and delete photos for a crop independently', () => {
  let map: Record<string, CropPhoto[]> = {};
  let deleted = new Set<string>();

  // 1. Add multiple photos to Rice
  const addResult = addPhotosToCropGallery(
    map,
    riceCrop,
    [
      { imageUrl: 'data:image/jpeg;base64,riceSeed', caption: 'Seed', notes: 'Paddy seed lot' },
      { imageUrl: 'data:image/jpeg;base64,riceVeg', caption: 'Vegetative stage' },
      { imageUrl: 'data:image/jpeg;base64,ricePest', caption: 'Pest damage', notes: 'Leaf folder symptoms' }
    ],
    deleted
  );
  map = addResult.nextMap;
  assert.equal(addResult.added.length, 3);
  assert.ok(addResult.added.every(p => p.cropId === 'crop-2'));

  const riceAfterAdd = getCropGallery(riceCrop, map, deleted);
  assert.equal(riceAfterAdd.length, 4); // cover + 3 added
  assert.equal(getCropGallery(wheatCrop, map, deleted).length, 5); // Wheat untouched

  // 2. Update a photo caption and notes
  const targetPhoto = addResult.added[1];
  const updateResult = updateCropGalleryPhoto(map, riceCrop, {
    ...targetPhoto,
    caption: 'Flowering stage',
    notes: 'Panicle emergence updated'
  });
  map = updateResult.nextMap;

  const riceAfterUpdate = getCropGallery(riceCrop, map, deleted);
  const updatedFound = riceAfterUpdate.find(p => p.id === targetPhoto.id);
  assert.ok(updatedFound);
  assert.equal(updatedFound.caption, 'Flowering stage');
  assert.equal(updatedFound.notes, 'Panicle emergence updated');

  // 3. Delete both an added photo AND a starter photo from Rice
  const del1 = deleteCropGalleryPhoto(map, deleted, 'crop-2', addResult.added[0].id);
  map = del1.nextMap;
  deleted = del1.nextDeletedIds;

  const starterId = getStarterPhotosForCrop(riceCrop)[0].id;
  const del2 = deleteCropGalleryPhoto(map, deleted, 'crop-2', starterId);
  map = del2.nextMap;
  deleted = del2.nextDeletedIds;

  const riceAfterDelete = getCropGallery(riceCrop, map, deleted);
  assert.equal(riceAfterDelete.length, 2);
  assert.ok(!riceAfterDelete.some(p => p.id === addResult.added[0].id));
  assert.ok(!riceAfterDelete.some(p => p.id === starterId));
});

test('Crop with Seed Photo, Flowering Stage Photo, and Mature Crop Photo includes all 3 in its gallery without duplicating identical cover', () => {
  const customThreeStageCrop: Crop = {
    id: 'crop-mustard-3stage',
    commonName: 'Mustard Test',
    scientificName: 'Brassica juncea',
    family: 'Brassicaceae',
    cropCategory: 'Oilseeds',
    colour: 'Yellow',
    shape: 'Globular',
    size: '2 mm',
    description: 'Sample 3-stage oilseed crop',
    imageUrl: 'data:image/jpeg;base64,MATURE',
    seedImageUrl: 'data:image/jpeg;base64,SEED',
    floweringImageUrl: 'data:image/jpeg;base64,FLOWERING',
    matureImageUrl: 'data:image/jpeg;base64,MATURE'
  };

  const gallery = getCropGallery(customThreeStageCrop, {}, new Set());
  assert.equal(gallery.length, 3);
  assert.deepEqual(
    gallery.map(g => g.caption),
    ['Seed', 'Flowering stage', 'Mature crop']
  );
  assert.equal(gallery[0].imageUrl, 'data:image/jpeg;base64,SEED');
  assert.equal(gallery[1].imageUrl, 'data:image/jpeg;base64,FLOWERING');
  assert.equal(gallery[2].imageUrl, 'data:image/jpeg;base64,MATURE');
});

test('mergeCropPhotosMaps merges IndexedDB and cache photo maps without losing crops, respects tombstones, and prefers newer updatedAt', () => {
  const idbMap: Record<string, CropPhoto[]> = {
    'crop-2': [
      {
        id: 'rice-1',
        cropId: 'crop-2',
        imageUrl: 'data:image/jpeg;base64,riceOld',
        caption: 'Seed',
        order: 1,
        updatedAt: '2026-11-10T10:00:00.000Z'
      },
      {
        id: 'rice-deleted',
        cropId: 'crop-2',
        imageUrl: 'data:image/jpeg;base64,deleted',
        caption: 'Harvesting',
        order: 2
      }
    ],
    'crop-tulsi': [
      {
        id: 'tulsi-1',
        cropId: 'crop-tulsi',
        imageUrl: 'data:image/jpeg;base64,tulsiSeed',
        caption: 'Seedling',
        order: 1
      }
    ]
  };

  const memoryMap: Record<string, CropPhoto[]> = {
    'crop-2': [
      {
        id: 'rice-1',
        cropId: 'crop-2',
        imageUrl: 'data:image/jpeg;base64,riceNew',
        caption: 'Flowering stage',
        order: 1,
        updatedAt: '2026-11-12T10:00:00.000Z'
      },
      {
        id: 'rice-2',
        cropId: 'crop-2',
        imageUrl: 'data:image/jpeg;base64,riceExtra',
        caption: 'Mature crop',
        order: 3
      }
    ]
  };

  const merged = mergeCropPhotosMaps(idbMap, memoryMap, new Set(['rice-deleted']));
  assert.equal(merged['crop-tulsi'].length, 1);
  assert.equal(merged['crop-tulsi'][0].imageUrl, 'data:image/jpeg;base64,tulsiSeed');

  assert.equal(merged['crop-2'].length, 2);
  assert.equal(merged['crop-2'][0].id, 'rice-1');
  assert.equal(merged['crop-2'][0].caption, 'Flowering stage');
  assert.equal(merged['crop-2'][1].id, 'rice-2');
  assert.ok(!merged['crop-2'].some(p => p.id === 'rice-deleted'));
});
