import {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import { db, auth } from './auth';
import { Crop, CropPhoto, Pest, Disease, FarmingTip } from '../types';
import { INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS } from '../data/seedData';
import { normalizeCropRecord } from '../utils/cropCategories';
import { normalizeCropPhoto } from '../utils/cropGallery';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on boot
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / check configuration.');
    }
    // Expected during first connection check
    return false;
  }
}

/**
 * Seed Firestore with initial agricultural database if collections are currently empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const cropsSnap = await getDocs(query(collection(db, 'crops'), limit(1)));
    if (cropsSnap.empty) {
      console.log('Seeding initial crops into Firestore...');
      for (const crop of INITIAL_CROPS) {
        await setDoc(doc(db, 'crops', crop.id), crop);
      }
    }

    const pestsSnap = await getDocs(query(collection(db, 'pests'), limit(1)));
    if (pestsSnap.empty) {
      console.log('Seeding initial pests into Firestore...');
      for (const pest of INITIAL_PESTS) {
        await setDoc(doc(db, 'pests', pest.id), pest);
      }
    }

    const diseasesSnap = await getDocs(query(collection(db, 'diseases'), limit(1)));
    if (diseasesSnap.empty) {
      console.log('Seeding initial diseases into Firestore...');
      for (const disease of INITIAL_DISEASES) {
        await setDoc(doc(db, 'diseases', disease.id), disease);
      }
    }

    const tipsSnap = await getDocs(query(collection(db, 'farmingTips'), limit(1)));
    if (tipsSnap.empty) {
      console.log('Seeding initial farming tips into Firestore...');
      for (const tip of INITIAL_TIPS) {
        await setDoc(doc(db, 'farmingTips', tip.id), tip);
      }
    }
  } catch (err) {
    console.warn('Initial seeding note (e.g. read permissions or already populated):', err);
  }
}

// REALTIME SUBSCRIPTIONS
export function subscribeToCrops(
  onData: (crops: Crop[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'crops';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Crop[] = [];
      snapshot.forEach((docSnap) => {
        items.push(normalizeCropRecord(docSnap.data() as Crop));
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

/**
 * Subscribes strictly to `/crops/{cropId}/photos` subcollection for a single crop.
 */
export function subscribeToCropPhotos(
  cropId: string,
  onData: (photos: CropPhoto[]) => void,
  onError?: (err: Error) => void
) {
  const path = `crops/${cropId}/photos`;
  return onSnapshot(
    collection(db, 'crops', cropId, 'photos'),
    (snapshot) => {
      const items: CropPhoto[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<CropPhoto>;
        if (data && data.imageUrl) {
          items.push(normalizeCropPhoto({ ...data, id: docSnap.id }, cropId));
        }
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.warn('Firestore crop photos listener note:', error);
      }
    }
  );
}

export function subscribeToPests(
  onData: (pests: Pest[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'pests';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Pest[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Pest);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

export function subscribeToDiseases(
  onData: (diseases: Disease[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'diseases';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Disease[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Disease);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

export function subscribeToTips(
  onData: (tips: FarmingTip[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'farmingTips';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: FarmingTip[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as FarmingTip);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

function stripUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// CROP MUTATIONS
export async function saveCropToFirestore(crop: Crop): Promise<void> {
  const path = `crops/${crop.id}`;
  try {
    const normalized = normalizeCropRecord(crop);
    const cleanPayload = stripUndefined({
      ...normalized,
      ...(auth.currentUser?.uid ? { authorId: auth.currentUser.uid } : {})
    });
    await setDoc(doc(db, 'crops', crop.id), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCropFromFirestore(cropId: string): Promise<void> {
  const path = `crops/${cropId}`;
  try {
    await deleteDoc(doc(db, 'crops', cropId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// PER-CROP PHOTO GALLERY MUTATIONS (`/crops/{cropId}/photos/{photoId}`)
export async function saveCropPhotoToFirestore(crop: Crop, photo: CropPhoto): Promise<void> {
  const path = `crops/${crop.id}/photos/${photo.id}`;
  try {
    // Ensure parent crop document exists so relational Master Gate `exists()` check succeeds
    const parentRef = doc(db, 'crops', crop.id);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) {
      await saveCropToFirestore(crop);
    }

    const normalized = normalizeCropPhoto(photo, crop.id);
    const cleanPayload = stripUndefined({
      ...normalized,
      ...(auth.currentUser?.uid ? { authorId: auth.currentUser.uid } : {})
    });
    await setDoc(doc(db, 'crops', crop.id, 'photos', normalized.id), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCropPhotosBatchToFirestore(crop: Crop, photos: CropPhoto[]): Promise<void> {
  for (const photo of photos) {
    await saveCropPhotoToFirestore(crop, photo);
  }
}

export async function deleteCropPhotoFromFirestore(cropId: string, photoId: string): Promise<void> {
  const path = `crops/${cropId}/photos/${photoId}`;
  try {
    await deleteDoc(doc(db, 'crops', cropId, 'photos', photoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// PEST MUTATIONS
export async function savePestToFirestore(pest: Pest): Promise<void> {
  const path = `pests/${pest.id}`;
  try {
    const cleanPayload = stripUndefined({
      ...pest,
      ...(auth.currentUser?.uid ? { authorId: auth.currentUser.uid } : {})
    });
    await setDoc(doc(db, 'pests', pest.id), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePestFromFirestore(pestId: string): Promise<void> {
  const path = `pests/${pestId}`;
  try {
    await deleteDoc(doc(db, 'pests', pestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// DISEASE MUTATIONS
export async function saveDiseaseToFirestore(disease: Disease): Promise<void> {
  const path = `diseases/${disease.id}`;
  try {
    const cleanPayload = stripUndefined({
      ...disease,
      ...(auth.currentUser?.uid ? { authorId: auth.currentUser.uid } : {})
    });
    await setDoc(doc(db, 'diseases', disease.id), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDiseaseFromFirestore(diseaseId: string): Promise<void> {
  const path = `diseases/${diseaseId}`;
  try {
    await deleteDoc(doc(db, 'diseases', diseaseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// TIP MUTATIONS
export async function saveTipToFirestore(tip: FarmingTip): Promise<void> {
  const path = `farmingTips/${tip.id}`;
  try {
    const cleanPayload = stripUndefined({
      ...tip,
      ...(auth.currentUser?.uid ? { authorId: auth.currentUser.uid } : {})
    });
    await setDoc(doc(db, 'farmingTips', tip.id), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTipFromFirestore(tipId: string): Promise<void> {
  const path = `farmingTips/${tipId}`;
  try {
    await deleteDoc(doc(db, 'farmingTips', tipId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
