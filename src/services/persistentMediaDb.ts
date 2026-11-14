import { Crop, CropPhoto, Pest, Disease, FarmingTip } from '../types';

const DB_NAME = 'agrovya_persistent_db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

export type PersistentSnapshot = {
  crops: Crop[] | null;
  cropPhotosMap: Record<string, CropPhoto[]> | null;
  pests: Pest[] | null;
  diseases: Disease[] | null;
  tips: FarmingTip[] | null;
  deletedCropIds: string[] | null;
  deletedCropPhotoIds: string[] | null;
  deletedPestIds: string[] | null;
  deletedDiseaseIds: string[] | null;
  deletedTipIds: string[] | null;
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openPersistentDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

export async function savePersistedKey<T>(key: string, value: T): Promise<boolean> {
  const db = await openPersistentDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function loadPersistedKey<T>(key: string): Promise<T | null> {
  const db = await openPersistentDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCropsToPersistentDb(crops: Crop[]): Promise<boolean> {
  return savePersistedKey('crops', crops);
}

export async function saveCropPhotosMapToPersistentDb(
  map: Record<string, CropPhoto[]>
): Promise<boolean> {
  return savePersistedKey('cropPhotosMap', map);
}

export async function saveDeletedIdsToPersistentDb(
  key:
    | 'deletedCropIds'
    | 'deletedCropPhotoIds'
    | 'deletedPestIds'
    | 'deletedDiseaseIds'
    | 'deletedTipIds',
  ids: Set<string> | string[]
): Promise<boolean> {
  const list = ids instanceof Set ? Array.from(ids) : ids;
  return savePersistedKey(key, list);
}

export async function loadPersistentSnapshot(): Promise<PersistentSnapshot> {
  const [
    crops,
    cropPhotosMap,
    pests,
    diseases,
    tips,
    deletedCropIds,
    deletedCropPhotoIds,
    deletedPestIds,
    deletedDiseaseIds,
    deletedTipIds
  ] = await Promise.all([
    loadPersistedKey<Crop[]>('crops'),
    loadPersistedKey<Record<string, CropPhoto[]>>('cropPhotosMap'),
    loadPersistedKey<Pest[]>('pests'),
    loadPersistedKey<Disease[]>('diseases'),
    loadPersistedKey<FarmingTip[]>('tips'),
    loadPersistedKey<string[]>('deletedCropIds'),
    loadPersistedKey<string[]>('deletedCropPhotoIds'),
    loadPersistedKey<string[]>('deletedPestIds'),
    loadPersistedKey<string[]>('deletedDiseaseIds'),
    loadPersistedKey<string[]>('deletedTipIds')
  ]);

  return {
    crops: Array.isArray(crops) ? crops : null,
    cropPhotosMap: cropPhotosMap && typeof cropPhotosMap === 'object' ? cropPhotosMap : null,
    pests: Array.isArray(pests) ? pests : null,
    diseases: Array.isArray(diseases) ? diseases : null,
    tips: Array.isArray(tips) ? tips : null,
    deletedCropIds: Array.isArray(deletedCropIds) ? deletedCropIds : null,
    deletedCropPhotoIds: Array.isArray(deletedCropPhotoIds) ? deletedCropPhotoIds : null,
    deletedPestIds: Array.isArray(deletedPestIds) ? deletedPestIds : null,
    deletedDiseaseIds: Array.isArray(deletedDiseaseIds) ? deletedDiseaseIds : null,
    deletedTipIds: Array.isArray(deletedTipIds) ? deletedTipIds : null
  };
}
