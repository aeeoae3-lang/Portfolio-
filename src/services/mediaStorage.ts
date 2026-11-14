import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './auth';
import { Crop } from '../types';
import { dataUrlToBlob, isDataUrl } from '../utils/imageUtils';
import firebaseConfig from '../../firebase-applet-config.json';

let storageInstance: ReturnType<typeof getStorage> | null = null;

function getFirebaseStorageSafe() {
  if (storageInstance) return storageInstance;
  const bucket = (firebaseConfig as { storageBucket?: string }).storageBucket;
  if (!bucket) return null;
  try {
    storageInstance = getStorage(getApp());
    return storageInstance;
  } catch {
    return null;
  }
}

/**
 * Persists a compressed device image (`data:image/...`) to Firebase Cloud Storage when authenticated
 * to produce a permanent HTTPS URL, falling back cleanly to the compact data URL if Storage is
 * unreachable or the user is in offline/local owner mode.
 */
export async function persistUploadedImageUrl(
  value: string | undefined,
  storagePath: string,
  timeoutMs = 5000
): Promise<string | undefined> {
  const trimmed = (value || '').trim();
  if (!trimmed) return undefined;
  if (!isDataUrl(trimmed)) return trimmed;

  const storage = getFirebaseStorageSafe();
  if (!storage || !auth.currentUser) {
    return trimmed;
  }

  try {
    const blob = dataUrlToBlob(trimmed);
    const storageRef = ref(storage, storagePath);
    const uploadTask = (async () => {
      await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: 'public,max-age=31536000'
      });
      return getDownloadURL(storageRef);
    })();

    const timeoutTask = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), timeoutMs)
    );

    const downloadUrl = await Promise.race([uploadTask, timeoutTask]);
    return downloadUrl || trimmed;
  } catch (err) {
    console.warn(`Cloud Storage fallback to embedded persistent data (${storagePath}):`, err);
    return trimmed;
  }
}

/**
 * Resolves and persists all 4 image columns (`seedImageUrl`, `floweringImageUrl`, `matureImageUrl`, `imageUrl`)
 * for a crop record without duplicating uploads when cover matches a stage photo.
 */
export async function persistCropImages(crop: Crop): Promise<Crop> {
  const versionStamp = Date.now();
  const rawSeed = crop.seedImageUrl?.trim();
  const rawFlowering = crop.floweringImageUrl?.trim();
  const rawMature = crop.matureImageUrl?.trim();
  const rawCover = crop.imageUrl?.trim();

  const uploadedBySource = new Map<string, string>();
  const uploadDeduped = async (src: string | undefined, slot: string): Promise<string | undefined> => {
    if (!src) return undefined;
    const cached = uploadedBySource.get(src);
    if (cached) return cached;
    const result = await persistUploadedImageUrl(src, `crops/${crop.id}/${slot}_${versionStamp}.jpg`);
    if (result) {
      uploadedBySource.set(src, result);
    }
    return result;
  };

  const [seedImageUrl, floweringImageUrl, matureImageUrl] = await Promise.all([
    uploadDeduped(rawSeed, 'seed'),
    uploadDeduped(rawFlowering, 'flowering'),
    uploadDeduped(rawMature, 'mature')
  ]);

  const coverUrl =
    matureImageUrl ||
    floweringImageUrl ||
    seedImageUrl ||
    (await uploadDeduped(rawCover, 'cover')) ||
    rawCover ||
    '';

  return {
    ...crop,
    imageUrl: coverUrl,
    seedImageUrl,
    floweringImageUrl,
    matureImageUrl
  };
}
