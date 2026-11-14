import { Crop, CropPhoto } from '../types';

export const CROP_PHOTO_CAPTIONS = [
  'Seed',
  'Seedling',
  'Vegetative stage',
  'Flowering stage',
  'Harvesting',
  'Mature crop',
  'Diseases and symptoms',
  'Pest damage'
] as const;

export type CropPhotoCaption = (typeof CROP_PHOTO_CAPTIONS)[number];

const STARTER_STAGE_PHOTOS: Record<string, Array<{ suffix: string; imageUrl: string; caption: string; notes: string; order: number }>> = {
  'crop-1': [
    {
      suffix: 'seed',
      imageUrl: '/assets/stages/wheat_seed_grains_1794561239079.jpg',
      caption: 'Seed',
      notes: 'Golden amber wheat grains showing dorsal surface and ventral crease',
      order: 1
    },
    {
      suffix: 'seedling',
      imageUrl: '/assets/stages/wheat_seedling_stage_1794561238785.jpg',
      caption: 'Seedling',
      notes: 'Young wheat seedlings emerging uniformly in rows on loamy soil',
      order: 2
    },
    {
      suffix: 'flowering',
      imageUrl: '/assets/stages/wheat_flowering_stage_1794561239431.jpg',
      caption: 'Flowering stage',
      notes: 'Green wheat spikes during anthesis with yellow pollen anthers',
      order: 3
    },
    {
      suffix: 'harvesting',
      imageUrl: '/assets/stages/wheat_harvesting_stage_1794561240623.jpg',
      caption: 'Harvesting',
      notes: 'Ripe golden wheat crop at physiological maturity during harvest',
      order: 4
    }
  ]
};

/**
 * Generates starter gallery photos strictly scoped to a single crop ID.
 */
export function getStarterPhotosForCrop(crop: Crop): CropPhoto[] {
  if (!crop || !crop.id) return [];

  const photos: CropPhoto[] = [];
  const addedUrls = new Set<string>();
  const explicitCaptions = new Set<string>();

  if (crop.seedImageUrl && crop.seedImageUrl.trim()) {
    const url = crop.seedImageUrl.trim();
    photos.push({
      id: `${crop.id}-stage-seed`,
      cropId: crop.id,
      imageUrl: url,
      caption: 'Seed',
      notes: `${crop.commonName} — Seed Photo`,
      isPrimaryCover: false,
      order: 0.1
    });
    addedUrls.add(url);
    explicitCaptions.add('Seed');
  }

  if (crop.floweringImageUrl && crop.floweringImageUrl.trim()) {
    const url = crop.floweringImageUrl.trim();
    photos.push({
      id: `${crop.id}-stage-flowering`,
      cropId: crop.id,
      imageUrl: url,
      caption: 'Flowering stage',
      notes: `${crop.commonName} — Flowering Stage Photo`,
      isPrimaryCover: false,
      order: 0.2
    });
    addedUrls.add(url);
    explicitCaptions.add('Flowering stage');
  }

  if (crop.matureImageUrl && crop.matureImageUrl.trim()) {
    const url = crop.matureImageUrl.trim();
    photos.push({
      id: `${crop.id}-stage-mature`,
      cropId: crop.id,
      imageUrl: url,
      caption: 'Mature crop',
      notes: `${crop.commonName} — Mature Crop Photo`,
      isPrimaryCover: true,
      order: 0.3
    });
    addedUrls.add(url);
    explicitCaptions.add('Mature crop');
  }

  if (crop.imageUrl && crop.imageUrl.trim() && !addedUrls.has(crop.imageUrl.trim())) {
    photos.push({
      id: `${crop.id}-photo-cover`,
      cropId: crop.id,
      imageUrl: crop.imageUrl.trim(),
      caption: 'Mature crop',
      notes: `${crop.commonName} primary agronomic view`,
      isPrimaryCover: !crop.matureImageUrl?.trim(),
      order: 0
    });
  }

  const cropSpecificStages = STARTER_STAGE_PHOTOS[crop.id] || [];
  for (const stage of cropSpecificStages) {
    if (explicitCaptions.has(stage.caption) || addedUrls.has(stage.imageUrl)) {
      continue;
    }
    photos.push({
      id: `${crop.id}-photo-${stage.suffix}`,
      cropId: crop.id,
      imageUrl: stage.imageUrl,
      caption: stage.caption,
      notes: stage.notes,
      isPrimaryCover: false,
      order: stage.order
    });
  }

  return photos;
}

/**
 * Sanitizes a CropPhoto record and forcibly binds it to expectedCropId so photos can never cross-associate.
 */
export function normalizeCropPhoto(photo: Partial<CropPhoto>, expectedCropId: string, fallbackOrder = 10): CropPhoto {
  const cleanCaption = (photo.caption || '').trim() || 'Mature crop';
  const cleanNotes = (photo.notes || '').trim();
  const normalized: CropPhoto = {
    id: (photo.id || `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).replace(/[^a-zA-Z0-9_-]/g, '-'),
    cropId: expectedCropId,
    imageUrl: (photo.imageUrl || '').trim(),
    caption: cleanCaption.slice(0, 150),
    order: typeof photo.order === 'number' && Number.isFinite(photo.order) ? photo.order : fallbackOrder
  };

  if (cleanNotes) {
    normalized.notes = cleanNotes.slice(0, 500);
  }
  if (typeof photo.isPrimaryCover === 'boolean') {
    normalized.isPrimaryCover = photo.isPrimaryCover;
  }
  if (photo.createdAt) {
    normalized.createdAt = photo.createdAt;
  }
  if (photo.updatedAt) {
    normalized.updatedAt = photo.updatedAt;
  }

  return normalized;
}

/**
 * Filters a list of photos strictly to those belonging to `cropId`.
 */
export function filterPhotosByCropId(photos: CropPhoto[], cropId: string): CropPhoto[] {
  if (!cropId) return [];
  return photos.filter(p => p && p.cropId === cropId && Boolean(p.imageUrl && p.imageUrl.trim()));
}

/**
 * Returns the complete isolated photo gallery for a single crop, merging starter photos and
 * stored/uploaded photos while respecting deleted photo IDs and preventing any cross-crop leakage.
 */
export function getCropGallery(
  crop: Crop,
  photosByCrop: Record<string, CropPhoto[]>,
  deletedPhotoIds: Set<string> | string[] = []
): CropPhoto[] {
  if (!crop || !crop.id) return [];

  const deletedSet = deletedPhotoIds instanceof Set ? deletedPhotoIds : new Set(deletedPhotoIds);
  const byId = new Map<string, CropPhoto>();

  // 1. Seed starter photos for this crop (unless explicitly deleted by admin)
  for (const starter of getStarterPhotosForCrop(crop)) {
    if (!deletedSet.has(starter.id)) {
      byId.set(starter.id, starter);
    }
  }

  // 2. Overlay user/admin-managed photos strictly filtered by crop.id
  const storedForCrop = filterPhotosByCropId(photosByCrop[crop.id] || [], crop.id);
  storedForCrop.forEach((photo, idx) => {
    if (!deletedSet.has(photo.id)) {
      byId.set(photo.id, normalizeCropPhoto(photo, crop.id, 10 + idx));
    }
  });

  return Array.from(byId.values()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Appends one or more newly uploaded photos strictly to the target crop's gallery.
 */
export function addPhotosToCropGallery(
  photosByCrop: Record<string, CropPhoto[]>,
  crop: Crop,
  newItems: Array<{ imageUrl: string; caption: string; notes?: string }>,
  deletedPhotoIds: Set<string> | string[] = []
): { nextMap: Record<string, CropPhoto[]>; added: CropPhoto[] } {
  const existingGallery = getCropGallery(crop, photosByCrop, deletedPhotoIds);
  const maxOrder = existingGallery.reduce((max, p) => Math.max(max, p.order ?? 0), 0);
  const nowIso = new Date().toISOString();

  const added: CropPhoto[] = newItems
    .filter(item => item && item.imageUrl && item.imageUrl.trim())
    .map((item, idx) =>
      normalizeCropPhoto(
        {
          id: `photo-${crop.id}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          cropId: crop.id,
          imageUrl: item.imageUrl.trim(),
          caption: item.caption,
          notes: item.notes,
          isPrimaryCover: existingGallery.length === 0 && idx === 0,
          order: maxOrder + idx + 1,
          createdAt: nowIso,
          updatedAt: nowIso
        },
        crop.id,
        maxOrder + idx + 1
      )
    );

  const currentStored = filterPhotosByCropId(photosByCrop[crop.id] || [], crop.id);
  const nextStored = [...currentStored, ...added];

  return {
    nextMap: {
      ...photosByCrop,
      [crop.id]: nextStored
    },
    added
  };
}

/**
 * Updates an existing photo inside a specific crop's gallery (caption, notes, or imageUrl).
 */
export function updateCropGalleryPhoto(
  photosByCrop: Record<string, CropPhoto[]>,
  crop: Crop,
  updatedPhoto: CropPhoto
): { nextMap: Record<string, CropPhoto[]>; saved: CropPhoto } {
  const safePhoto = normalizeCropPhoto(
    {
      ...updatedPhoto,
      updatedAt: new Date().toISOString()
    },
    crop.id,
    updatedPhoto.order ?? 0
  );

  const currentStored = filterPhotosByCropId(photosByCrop[crop.id] || [], crop.id);
  const existsInStored = currentStored.some(p => p.id === safePhoto.id);

  const nextStored = existsInStored
    ? currentStored.map(p => (p.id === safePhoto.id ? safePhoto : p))
    : [...currentStored, safePhoto];

  return {
    nextMap: {
      ...photosByCrop,
      [crop.id]: nextStored
    },
    saved: safePhoto
  };
}

/**
 * Deletes a photo strictly from the specified crop's gallery and records its ID so deleted starters stay deleted.
 */
export function deleteCropGalleryPhoto(
  photosByCrop: Record<string, CropPhoto[]>,
  deletedPhotoIds: Set<string> | string[],
  cropId: string,
  photoId: string
): { nextMap: Record<string, CropPhoto[]>; nextDeletedIds: Set<string> } {
  const nextDeletedIds = new Set(deletedPhotoIds instanceof Set ? deletedPhotoIds : deletedPhotoIds);
  nextDeletedIds.add(photoId);

  const currentStored = filterPhotosByCropId(photosByCrop[cropId] || [], cropId);
  const nextStored = currentStored.filter(p => p.id !== photoId);

  return {
    nextMap: {
      ...photosByCrop,
      [cropId]: nextStored
    },
    nextDeletedIds
  };
}

function parsePhotoTimestamp(iso?: string): number {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Merges two per-crop photo gallery maps non-destructively while enforcing strict cropId isolation,
 * deletion tombstones, and newer `updatedAt` precedence.
 */
export function mergeCropPhotosMaps(
  primaryMap: Record<string, CropPhoto[]>,
  secondaryMap: Record<string, CropPhoto[]>,
  deletedPhotoIds: Set<string> | string[] = []
): Record<string, CropPhoto[]> {
  const deletedSet = deletedPhotoIds instanceof Set ? deletedPhotoIds : new Set(deletedPhotoIds);
  const allCropIds = new Set<string>([
    ...Object.keys(primaryMap || {}),
    ...Object.keys(secondaryMap || {})
  ]);
  const merged: Record<string, CropPhoto[]> = {};

  for (const cropId of allCropIds) {
    if (!cropId) continue;
    const byPhotoId = new Map<string, CropPhoto>();
    const listA = filterPhotosByCropId(primaryMap?.[cropId] || [], cropId);
    const listB = filterPhotosByCropId(secondaryMap?.[cropId] || [], cropId);

    for (const p of listA) {
      if (!deletedSet.has(p.id)) {
        byPhotoId.set(p.id, normalizeCropPhoto(p, cropId, p.order ?? 10));
      }
    }
    for (const p of listB) {
      if (deletedSet.has(p.id)) continue;
      const existing = byPhotoId.get(p.id);
      if (!existing || parsePhotoTimestamp(p.updatedAt) > parsePhotoTimestamp(existing.updatedAt)) {
        byPhotoId.set(p.id, normalizeCropPhoto(p, cropId, p.order ?? 10));
      }
    }

    const combined = Array.from(byPhotoId.values()).sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999)
    );
    if (combined.length > 0) {
      merged[cropId] = combined;
    }
  }

  return merged;
}
