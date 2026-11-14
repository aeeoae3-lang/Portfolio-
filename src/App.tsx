import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Sprout,
  Wheat,
  Bug,
  ShieldAlert,
  Lightbulb,
  Plus,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Database,
  AlertCircle,
  X,
  ShieldCheck,
  Search,
  Tag,
  Mail
} from 'lucide-react';

import { Crop, CropPhoto, Pest, Disease, FarmingTip, SectionType, CropCategory } from './types';
import { INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS } from './data/seedData';
import {
  CROP_CATEGORIES,
  VEGETABLE_SUBCATEGORIES,
  filterCropsByCategory,
  mergeAndNormalizeCrops,
  normalizeCropRecord,
  resolveCropCategory,
  resolveVegetableSubcategory
} from './utils/cropCategories';
import {
  getCropGallery,
  addPhotosToCropGallery,
  updateCropGalleryPhoto,
  deleteCropGalleryPhoto,
  filterPhotosByCropId,
  mergeCropPhotosMaps
} from './utils/cropGallery';
import {
  loadPersistentSnapshot,
  savePersistedKey,
  saveCropsToPersistentDb,
  saveCropPhotosMapToPersistentDb,
  saveDeletedIdsToPersistentDb
} from './services/persistentMediaDb';
import {
  persistCropImages,
  persistUploadedImageUrl
} from './services/mediaStorage';
import {
  auth,
  initAuth,
  googleSignIn,
  logoutUser,
  getAccessToken,
  setAccessToken,
  checkIsOwner,
  PRIMARY_OWNER_EMAIL,
  BUSINESS_CONTACT_EMAIL,
  OWNER_EMAILS,
  loginAsOwnerSession
} from './services/auth';
import {
  validateFirestoreConnection,
  seedFirestoreIfEmpty,
  subscribeToCrops,
  subscribeToCropPhotos,
  subscribeToPests,
  subscribeToDiseases,
  subscribeToTips,
  saveCropToFirestore,
  deleteCropFromFirestore,
  saveCropPhotoToFirestore,
  saveCropPhotosBatchToFirestore,
  deleteCropPhotoFromFirestore,
  savePestToFirestore,
  deletePestFromFirestore,
  saveDiseaseToFirestore,
  deleteDiseaseFromFirestore,
  saveTipToFirestore,
  deleteTipFromFirestore
} from './services/firestore';
import {
  getStoredSpreadsheetId,
  saveStoredSpreadsheetId,
  pushFullDataToSheet,
  fetchAllSheetData
} from './services/sheets';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeatureSections } from './components/FeatureSections';
import { CropCard } from './components/CropCard';
import { CropDetailModal } from './components/CropDetailModal';
import { PestDiseaseSection } from './components/PestDiseaseSection';
import { FarmingTipsSection } from './components/FarmingTipsSection';
import { AboutSection } from './components/AboutSection';
import { SearchModal } from './components/SearchModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { EditModal, EditEntity } from './components/EditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ImageZoomModal } from './components/ImageZoomModal';

const DELETED_CROPS_KEY = 'agri_deleted_crop_ids_v1';
const DELETED_PESTS_KEY = 'agri_deleted_pest_ids_v1';
const DELETED_DISEASES_KEY = 'agri_deleted_disease_ids_v1';
const DELETED_TIPS_KEY = 'agri_deleted_tip_ids_v1';
const DEFAULT_CROP_IMAGE =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80';

function loadDeletedIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveDeletedIdSet(key: string, ids: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

function mergeEntitiesByTimestamp<T extends { id: string; updatedAt?: string }>(
  incoming: T[],
  local: T[],
  deletedIds: Set<string>
): T[] {
  const byId = new Map<string, T>();
  const parseTs = (iso?: string) => {
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  };

  for (const item of incoming) {
    if (item?.id && !deletedIds.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  for (const item of local) {
    if (!item?.id || deletedIds.has(item.id)) continue;
    const current = byId.get(item.id);
    if (!current || parseTs(item.updatedAt) > parseTs(current.updatedAt)) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

export default function App() {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<SectionType>('home');

  const deletedCropIdsRef = React.useRef<Set<string>>(loadDeletedIdSet(DELETED_CROPS_KEY));
  const deletedPestIdsRef = React.useRef<Set<string>>(loadDeletedIdSet(DELETED_PESTS_KEY));
  const deletedDiseaseIdsRef = React.useRef<Set<string>>(loadDeletedIdSet(DELETED_DISEASES_KEY));
  const deletedTipIdsRef = React.useRef<Set<string>>(loadDeletedIdSet(DELETED_TIPS_KEY));

  // Core Data State (Loaded from localStorage & non-destructively merged/normalized with seed data)
  const [crops, setCrops] = useState<Crop[]>(() => {
    const deleted = deletedCropIdsRef.current;
    try {
      const saved = localStorage.getItem('agri_crops');
      const parsed: Crop[] = saved ? JSON.parse(saved) : [];
      return mergeAndNormalizeCrops(Array.isArray(parsed) ? parsed : [], INITIAL_CROPS).filter(
        c => !deleted.has(c.id)
      );
    } catch {
      return mergeAndNormalizeCrops([], INITIAL_CROPS).filter(c => !deleted.has(c.id));
    }
  });

  const [pests, setPests] = useState<Pest[]>(() => {
    const deleted = deletedPestIdsRef.current;
    try {
      const saved = localStorage.getItem('agri_pests');
      const parsed: Pest[] = saved ? JSON.parse(saved) : INITIAL_PESTS;
      return (Array.isArray(parsed) ? parsed : INITIAL_PESTS).filter(p => !deleted.has(p.id));
    } catch {
      return INITIAL_PESTS.filter(p => !deleted.has(p.id));
    }
  });

  const [diseases, setDiseases] = useState<Disease[]>(() => {
    const deleted = deletedDiseaseIdsRef.current;
    try {
      const saved = localStorage.getItem('agri_diseases');
      const parsed: Disease[] = saved ? JSON.parse(saved) : INITIAL_DISEASES;
      return (Array.isArray(parsed) ? parsed : INITIAL_DISEASES).filter(d => !deleted.has(d.id));
    } catch {
      return INITIAL_DISEASES.filter(d => !deleted.has(d.id));
    }
  });

  const [tips, setTips] = useState<FarmingTip[]>(() => {
    const deleted = deletedTipIdsRef.current;
    try {
      const saved = localStorage.getItem('agri_tips');
      const parsed: FarmingTip[] = saved ? JSON.parse(saved) : INITIAL_TIPS;
      return (Array.isArray(parsed) ? parsed : INITIAL_TIPS).filter(t => !deleted.has(t.id));
    } catch {
      return INITIAL_TIPS.filter(t => !deleted.has(t.id));
    }
  });

  // Auth & Permissions State
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (localStorage.getItem('agri_owner_session') === 'true') {
        const savedEmail = localStorage.getItem('agri_owner_email');
        const activeEmail = savedEmail && OWNER_EMAILS.some(o => o.toLowerCase() === savedEmail.trim().toLowerCase())
          ? savedEmail.trim()
          : PRIMARY_OWNER_EMAIL;
        return {
          uid: activeEmail.toLowerCase() === BUSINESS_CONTACT_EMAIL.toLowerCase()
            ? 'owner-agrovya-contact'
            : 'owner-kalkotwaratharva77',
          email: activeEmail,
          displayName: 'AgroVya Verified Owner',
          photoURL: '',
          emailVerified: true
        } as unknown as User;
      }
    } catch {}
    return null;
  });
  const [isOwner, setIsOwner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('agri_owner_session') === 'true';
    } catch {
      return false;
    }
  });
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [accessToken, setLocalAccessToken] = useState<string | null>(null);

  // Toast Feedback State
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: Date.now(), type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Google Sheets state
  const [connectedSheetId, setConnectedSheetId] = useState<string | null>(() => getStoredSpreadsheetId());
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Modals & Selections
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [zoomState, setZoomState] = useState<{ crop: Crop; initialIndex: number } | null>(null);
  const [editEntity, setEditEntity] = useState<EditEntity | null>(null);

  // Per-Crop Photo Gallery State (Strictly keyed by crop.id so crops never mix)
  const [cropPhotosMap, setCropPhotosMap] = useState<Record<string, CropPhoto[]>>(() => {
    try {
      const saved = localStorage.getItem('agri_crop_photos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const clean: Record<string, CropPhoto[]> = {};
          for (const [cid, list] of Object.entries(parsed)) {
            if (Array.isArray(list)) {
              clean[cid] = filterPhotosByCropId(list as CropPhoto[], cid);
            }
          }
          return clean;
        }
      }
    } catch {}
    return {};
  });

  const [deletedCropPhotoIds, setDeletedCropPhotoIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('agri_deleted_crop_photo_ids_v1');
      const parsed = saved ? JSON.parse(saved) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Sync browser page title with active section & AgroVya tagline
  useEffect(() => {
    const sectionTitles: Record<SectionType, string> = {
      home: 'AgroVya — Smart Farming Starts Here!',
      crops: 'Crop Library | AgroVya — Smart Farming Starts Here!',
      pests: 'Pest Guide | AgroVya — Smart Farming Starts Here!',
      diseases: 'Disease Information | AgroVya — Smart Farming Starts Here!',
      tips: 'Farming Tips | AgroVya — Smart Farming Starts Here!',
      about: 'About Us | AgroVya — Smart Farming Starts Here!'
    };
    document.title = sectionTitles[currentSection] || 'AgroVya — Smart Farming Starts Here!';
  }, [currentSection]);

  // Crop category, vegetable subcategory, and Crop Library search filters
  const [selectedCropCategory, setSelectedCropCategory] = useState<string>('All');
  const [selectedVegetableSubcategory, setSelectedVegetableSubcategory] = useState<string>('All');
  const [cropSearchQuery, setCropSearchQuery] = useState<string>('');

  const hasHydratedIdbRef = React.useRef(false);

  // Hydrate full persistent snapshot from IndexedDB on startup (prevents localStorage 5MB quota loss)
  useEffect(() => {
    let active = true;
    loadPersistentSnapshot()
      .then((snapshot) => {
        if (!active) return;

        if (snapshot.deletedCropIds?.length) {
          for (const id of snapshot.deletedCropIds) deletedCropIdsRef.current.add(id);
          saveDeletedIdSet(DELETED_CROPS_KEY, deletedCropIdsRef.current);
        }
        if (snapshot.deletedPestIds?.length) {
          for (const id of snapshot.deletedPestIds) deletedPestIdsRef.current.add(id);
          saveDeletedIdSet(DELETED_PESTS_KEY, deletedPestIdsRef.current);
        }
        if (snapshot.deletedDiseaseIds?.length) {
          for (const id of snapshot.deletedDiseaseIds) deletedDiseaseIdsRef.current.add(id);
          saveDeletedIdSet(DELETED_DISEASES_KEY, deletedDiseaseIdsRef.current);
        }
        if (snapshot.deletedTipIds?.length) {
          for (const id of snapshot.deletedTipIds) deletedTipIdsRef.current.add(id);
          saveDeletedIdSet(DELETED_TIPS_KEY, deletedTipIdsRef.current);
        }

        const mergedDeletedPhotoIds = new Set<string>(deletedCropPhotoIds);
        if (snapshot.deletedCropPhotoIds?.length) {
          for (const id of snapshot.deletedCropPhotoIds) mergedDeletedPhotoIds.add(id);
          setDeletedCropPhotoIds((prev) => {
            const next = new Set(prev);
            for (const id of snapshot.deletedCropPhotoIds!) next.add(id);
            return next;
          });
        }

        if (snapshot.crops && snapshot.crops.length > 0) {
          setCrops((prev) =>
            mergeAndNormalizeCrops(snapshot.crops!, prev).filter(
              (c) => !deletedCropIdsRef.current.has(c.id)
            )
          );
        }
        if (snapshot.cropPhotosMap && Object.keys(snapshot.cropPhotosMap).length > 0) {
          setCropPhotosMap((prev) =>
            mergeCropPhotosMaps(snapshot.cropPhotosMap!, prev, mergedDeletedPhotoIds)
          );
        }
        if (snapshot.pests && snapshot.pests.length > 0) {
          setPests((prev) =>
            mergeEntitiesByTimestamp(snapshot.pests!, prev, deletedPestIdsRef.current)
          );
        }
        if (snapshot.diseases && snapshot.diseases.length > 0) {
          setDiseases((prev) =>
            mergeEntitiesByTimestamp(snapshot.diseases!, prev, deletedDiseaseIdsRef.current)
          );
        }
        if (snapshot.tips && snapshot.tips.length > 0) {
          setTips((prev) =>
            mergeEntitiesByTimestamp(snapshot.tips!, prev, deletedTipIdsRef.current)
          );
        }
      })
      .finally(() => {
        if (active) {
          hasHydratedIdbRef.current = true;
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Save to localStorage + IndexedDB whenever data changes (after initial hydration)
  useEffect(() => {
    try {
      localStorage.setItem('agri_crops', JSON.stringify(crops));
      localStorage.setItem('agri_pests', JSON.stringify(pests));
      localStorage.setItem('agri_diseases', JSON.stringify(diseases));
      localStorage.setItem('agri_tips', JSON.stringify(tips));
    } catch {
      // localStorage 5MB cap fallback handled by IndexedDB below
    }
    if (!hasHydratedIdbRef.current) return;
    void saveCropsToPersistentDb(crops);
    void savePersistedKey('pests', pests);
    void savePersistedKey('diseases', diseases);
    void savePersistedKey('tips', tips);
  }, [crops, pests, diseases, tips]);

  useEffect(() => {
    try {
      localStorage.setItem('agri_crop_photos_v1', JSON.stringify(cropPhotosMap));
      localStorage.setItem('agri_deleted_crop_photo_ids_v1', JSON.stringify(Array.from(deletedCropPhotoIds)));
    } catch {
      // localStorage 5MB cap fallback handled by IndexedDB below
    }
    if (!hasHydratedIdbRef.current) return;
    void saveCropPhotosMapToPersistentDb(cropPhotosMap);
    void saveDeletedIdsToPersistentDb('deletedCropPhotoIds', deletedCropPhotoIds);
  }, [cropPhotosMap, deletedCropPhotoIds]);

  // Realtime Firestore subscription for the active crop's isolated `/crops/{cropId}/photos` gallery
  const activeGalleryCropId = selectedCrop?.id || zoomState?.crop.id || null;
  useEffect(() => {
    if (!activeGalleryCropId) return;
    const unsubPhotos = subscribeToCropPhotos(activeGalleryCropId, (firestorePhotos) => {
      if (firestorePhotos.length === 0) return;
      setCropPhotosMap(prev => {
        const localForCrop = filterPhotosByCropId(prev[activeGalleryCropId] || [], activeGalleryCropId);
        const mergedById = new Map<string, CropPhoto>();
        for (const p of localForCrop) mergedById.set(p.id, p);
        for (const p of firestorePhotos) {
          if (!deletedCropPhotoIds.has(p.id)) {
            mergedById.set(p.id, p);
          }
        }
        return {
          ...prev,
          [activeGalleryCropId]: Array.from(mergedById.values())
        };
      });
    });
    return () => unsubPhotos();
  }, [activeGalleryCropId, deletedCropPhotoIds]);

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token, ownerCheck) => {
        setUser(authUser);
        setIsOwner(ownerCheck);
        if (token) {
          setLocalAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setIsOwner(false);
        setLocalAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Initialize Firestore Connection, Seed Data & Realtime Subscriptions
  useEffect(() => {
    validateFirestoreConnection();
    let hasAttemptedSeed = false;
    try {
      hasAttemptedSeed = localStorage.getItem('agri_firestore_seeded_v1') === 'true';
    } catch {}
    if (!hasAttemptedSeed) {
      seedFirestoreIfEmpty()
        .then(() => {
          try {
            localStorage.setItem('agri_firestore_seeded_v1', 'true');
          } catch {}
        })
        .catch(() => {});
    }

    const handleListenerFallback = (label: string) => (err: Error) => {
      console.warn(`Firestore ${label} listener fallback to local cache:`, err.message);
    };

    const unsubCrops = subscribeToCrops(
      (firestoreCrops) => {
        if (firestoreCrops.length > 0) {
          setCrops(currentLocal => {
            const merged = mergeAndNormalizeCrops(firestoreCrops, currentLocal);
            return merged.filter(c => !deletedCropIdsRef.current.has(c.id));
          });
        }
      },
      handleListenerFallback('crops')
    );

    const unsubPests = subscribeToPests(
      (firestorePests) => {
        if (firestorePests.length > 0) {
          setPests(currentLocal => mergeEntitiesByTimestamp(firestorePests, currentLocal, deletedPestIdsRef.current));
        }
      },
      handleListenerFallback('pests')
    );

    const unsubDiseases = subscribeToDiseases(
      (firestoreDiseases) => {
        if (firestoreDiseases.length > 0) {
          setDiseases(currentLocal => mergeEntitiesByTimestamp(firestoreDiseases, currentLocal, deletedDiseaseIdsRef.current));
        }
      },
      handleListenerFallback('diseases')
    );

    const unsubTips = subscribeToTips(
      (firestoreTips) => {
        if (firestoreTips.length > 0) {
          setTips(currentLocal => mergeEntitiesByTimestamp(firestoreTips, currentLocal, deletedTipIdsRef.current));
        }
      },
      handleListenerFallback('farmingTips')
    );

    return () => {
      unsubCrops();
      unsubPests();
      unsubDiseases();
      unsubTips();
    };
  }, []);

  // Auto-sync from sheet if sheet ID is connected and token is present
  useEffect(() => {
    if (connectedSheetId && accessToken) {
      fetchAllSheetData(accessToken, connectedSheetId)
        .then(data => {
          if (data.crops.length > 0) {
            setCrops(prev =>
              mergeAndNormalizeCrops(data.crops, prev).filter(c => !deletedCropIdsRef.current.has(c.id))
            );
          }
          if (data.pests.length > 0) {
            setPests(prev => mergeEntitiesByTimestamp(data.pests, prev, deletedPestIdsRef.current));
          }
          if (data.diseases.length > 0) {
            setDiseases(prev => mergeEntitiesByTimestamp(data.diseases, prev, deletedDiseaseIdsRef.current));
          }
          if (data.tips.length > 0) {
            setTips(prev => mergeEntitiesByTimestamp(data.tips, prev, deletedTipIdsRef.current));
          }
        })
        .catch(err => console.log('Background sheet sync skipped:', err.message));
    }
  }, [connectedSheetId, accessToken]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsOwner(res.isOwner);
        setLocalAccessToken(res.accessToken);
        showToast(
          'success',
          res.isOwner
            ? 'Signed in as Verified App Owner (Atharva)'
            : `Signed in as ${res.user.email} (Student / Farmer)`
        );
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      showToast('error', `Sign in note: ${err.message || 'Popup closed'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setIsOwner(false);
    setLocalAccessToken(null);
    showToast('info', 'Signed out. AgroVya is now in Read-Only mode.');
  };

  // Helper to push updates to Google Sheet if connected & signed in as owner
  const trySyncToSheet = async (
    updatedCrops: Crop[],
    updatedPests: Pest[],
    updatedDiseases: Disease[],
    updatedTips: FarmingTip[]
  ) => {
    if (connectedSheetId && accessToken && isOwner) {
      try {
        await pushFullDataToSheet(accessToken, connectedSheetId, {
          crops: updatedCrops,
          pests: updatedPests,
          diseases: updatedDiseases,
          tips: updatedTips
        });
      } catch (err) {
        console.warn('Silent Google Sheet sync error:', err);
      }
    }
  };

  // Save handler from EditModal
  const handleSaveEntity = async (entity: EditEntity) => {
    if (!isOwner) {
      showToast('error', `Permission denied: Only verified app owners (${PRIMARY_OWNER_EMAIL} or ${BUSINESS_CONTACT_EMAIL}) can add or modify crop records.`);
      throw new Error(`Permission denied: Only verified app owners (${PRIMARY_OWNER_EMAIL} or ${BUSINESS_CONTACT_EMAIL}) can add or modify records.`);
    }

    if (entity.type === 'crop') {
      const raw = entity.data as Crop;
      const cleanCommonName = (raw.commonName || '').trim();
      if (!cleanCommonName) {
        showToast('error', 'Crop Name is required.');
        throw new Error('Crop Name is required.');
      }

      const nowIso = new Date().toISOString();
      const seedPhoto = (raw.seedImageUrl || '').trim() || undefined;
      const floweringPhoto = (raw.floweringImageUrl || '').trim() || undefined;
      const maturePhoto = (raw.matureImageUrl || '').trim() || undefined;
      const resolvedCover =
        maturePhoto ||
        floweringPhoto ||
        seedPhoto ||
        (raw.imageUrl || '').trim() ||
        DEFAULT_CROP_IMAGE;

      const resolvedCategory = resolveCropCategory(raw);
      const baseCrop = normalizeCropRecord({
        id: raw.id || `crop-${Date.now()}`,
        commonName: cleanCommonName,
        scientificName: (raw.scientificName || '').trim(),
        family: (raw.family || 'Poaceae (Gramineae)').trim(),
        cropCategory: resolvedCategory,
        category: resolvedCategory,
        subcategory: resolvedCategory === 'Vegetables' ? (raw.subcategory || 'Fruiting Vegetables') : undefined,
        colour: (raw.colour || '').trim(),
        shape: (raw.shape || '').trim(),
        size: (raw.size || '').trim(),
        description: (raw.description || '').trim(),
        imageUrl: resolvedCover,
        seedImageUrl: seedPhoto,
        floweringImageUrl: floweringPhoto,
        matureImageUrl: maturePhoto,
        season: (raw.season || '').trim(),
        soilType: (raw.soilType || '').trim(),
        waterRequirement: (raw.waterRequirement || '').trim(),
        growthDuration: (raw.growthDuration || '').trim(),
        featured: Boolean(raw.featured),
        createdAt: raw.createdAt || nowIso,
        updatedAt: nowIso
      });

      const sanitizedCrop = normalizeCropRecord(await persistCropImages(baseCrop));

      if (deletedCropIdsRef.current.has(sanitizedCrop.id)) {
        deletedCropIdsRef.current.delete(sanitizedCrop.id);
        saveDeletedIdSet(DELETED_CROPS_KEY, deletedCropIdsRef.current);
        void saveDeletedIdsToPersistentDb('deletedCropIds', deletedCropIdsRef.current);
      }

      const isNew = !crops.some(c => c.id === sanitizedCrop.id);
      const updatedCrops = isNew
        ? [sanitizedCrop, ...crops]
        : crops.map(c => (c.id === sanitizedCrop.id ? sanitizedCrop : c));

      // 1. Persist to IndexedDB (high-capacity permanent storage across browser sessions)
      const idbSaved = await saveCropsToPersistentDb(updatedCrops);

      // 2. Persist best-effort to localStorage fast cache
      let localSaved = false;
      try {
        localStorage.setItem('agri_crops', JSON.stringify(updatedCrops));
        localSaved = true;
      } catch (err) {
        console.warn('LocalStorage fast cache skipped (using IndexedDB persistent storage):', err);
      }

      // 3. Persist to Firestore when signed in with Firebase Auth
      let remoteSaved = false;
      if (auth.currentUser) {
        try {
          await saveCropToFirestore(sanitizedCrop);
          remoteSaved = true;
        } catch (err: any) {
          console.warn('Firestore crop save note:', err);
        }
      }

      if (!idbSaved && !localSaved && !remoteSaved) {
        const quotaMsg = 'Unable to save crop photos to persistent storage. Please retry or use smaller images.';
        showToast('error', quotaMsg);
        throw new Error(quotaMsg);
      }

      // 4. Commit updated React state
      setCrops(updatedCrops);

      // 4b. If extra gallery photos were attached in EditModal, persist and bind them strictly to sanitizedCrop.id
      if (entity.extraPhotos && entity.extraPhotos.length > 0) {
        const persistedItems = await Promise.all(
          entity.extraPhotos.map(async (item, idx) => ({
            ...item,
            imageUrl:
              (await persistUploadedImageUrl(
                item.imageUrl,
                `crops/${sanitizedCrop.id}/gallery_${Date.now()}_${idx}.jpg`
              )) || item.imageUrl
          }))
        );
        const { nextMap, added } = addPhotosToCropGallery(
          cropPhotosMap,
          sanitizedCrop,
          persistedItems,
          deletedCropPhotoIds
        );
        await saveCropPhotosMapToPersistentDb(nextMap);
        try {
          localStorage.setItem('agri_crop_photos_v1', JSON.stringify(nextMap));
        } catch (err) {
          console.warn('LocalStorage gallery fast cache skipped:', err);
        }
        setCropPhotosMap(nextMap);
        if (auth.currentUser) {
          saveCropPhotosBatchToFirestore(sanitizedCrop, added).catch(err =>
            console.warn('Firestore crop extra photos save note:', err)
          );
        }
      }

      // 5. Sync to Google Sheets if connected
      trySyncToSheet(updatedCrops, pests, diseases, tips);

      // 6. Navigate to crops library and reset filter so new crop is immediately visible
      setCurrentSection('crops');
      setSelectedCropCategory('All');
      setSelectedVegetableSubcategory('All');
      setCropSearchQuery('');
      showToast(
        'success',
        isNew
          ? `Crop "${sanitizedCrop.commonName}" added successfully to ${sanitizedCrop.cropCategory}!`
          : `Crop "${sanitizedCrop.commonName}" updated successfully!`
      );

      setEditEntity(null);
      return true;
    } else if (entity.type === 'pest') {
      const rawPest = entity.data as Pest;
      const persistedUrl = await persistUploadedImageUrl(
        rawPest.imageUrl,
        `pests/${rawPest.id}_${Date.now()}.jpg`
      );
      const updatedPest: Pest = {
        ...rawPest,
        imageUrl: persistedUrl || rawPest.imageUrl,
        updatedAt: new Date().toISOString()
      };
      if (deletedPestIdsRef.current.has(updatedPest.id)) {
        deletedPestIdsRef.current.delete(updatedPest.id);
        saveDeletedIdSet(DELETED_PESTS_KEY, deletedPestIdsRef.current);
        void saveDeletedIdsToPersistentDb('deletedPestIds', deletedPestIdsRef.current);
      }
      const exists = pests.some(p => p.id === updatedPest.id);
      const newPests = exists
        ? pests.map(p => (p.id === updatedPest.id ? updatedPest : p))
        : [updatedPest, ...pests];
      const idbSaved = await savePersistedKey('pests', newPests);
      let localSaved = false;
      try {
        localStorage.setItem('agri_pests', JSON.stringify(newPests));
        localSaved = true;
      } catch (err) {
        console.warn('LocalStorage pest save note:', err);
      }
      let remoteSaved = false;
      if (auth.currentUser) {
        try {
          await savePestToFirestore(updatedPest);
          remoteSaved = true;
        } catch (e) {
          console.warn('Firestore pest save note:', e);
        }
      }
      if (!idbSaved && !localSaved && !remoteSaved) {
        const msg = 'Unable to save pest record due to storage quota limit.';
        showToast('error', msg);
        throw new Error(msg);
      }
      setPests(newPests);
      trySyncToSheet(crops, newPests, diseases, tips);
      showToast('success', `Pest "${updatedPest.name}" saved successfully!`);
      setEditEntity(null);
      return true;
    } else if (entity.type === 'disease') {
      const rawDisease = entity.data as Disease;
      const persistedUrl = await persistUploadedImageUrl(
        rawDisease.imageUrl,
        `diseases/${rawDisease.id}_${Date.now()}.jpg`
      );
      const updatedDisease: Disease = {
        ...rawDisease,
        imageUrl: persistedUrl || rawDisease.imageUrl,
        updatedAt: new Date().toISOString()
      };
      if (deletedDiseaseIdsRef.current.has(updatedDisease.id)) {
        deletedDiseaseIdsRef.current.delete(updatedDisease.id);
        saveDeletedIdSet(DELETED_DISEASES_KEY, deletedDiseaseIdsRef.current);
        void saveDeletedIdsToPersistentDb('deletedDiseaseIds', deletedDiseaseIdsRef.current);
      }
      const exists = diseases.some(d => d.id === updatedDisease.id);
      const newDiseases = exists
        ? diseases.map(d => (d.id === updatedDisease.id ? updatedDisease : d))
        : [updatedDisease, ...diseases];
      const idbSaved = await savePersistedKey('diseases', newDiseases);
      let localSaved = false;
      try {
        localStorage.setItem('agri_diseases', JSON.stringify(newDiseases));
        localSaved = true;
      } catch (err) {
        console.warn('LocalStorage disease save note:', err);
      }
      let remoteSaved = false;
      if (auth.currentUser) {
        try {
          await saveDiseaseToFirestore(updatedDisease);
          remoteSaved = true;
        } catch (e) {
          console.warn('Firestore disease save note:', e);
        }
      }
      if (!idbSaved && !localSaved && !remoteSaved) {
        const msg = 'Unable to save disease record due to storage quota limit.';
        showToast('error', msg);
        throw new Error(msg);
      }
      setDiseases(newDiseases);
      trySyncToSheet(crops, pests, newDiseases, tips);
      showToast('success', `Disease "${updatedDisease.name}" saved successfully!`);
      setEditEntity(null);
      return true;
    } else if (entity.type === 'tip') {
      const rawTip = entity.data as FarmingTip;
      const persistedUrl = await persistUploadedImageUrl(
        rawTip.imageUrl,
        `tips/${rawTip.id}_${Date.now()}.jpg`
      );
      const updatedTip: FarmingTip = {
        ...rawTip,
        imageUrl: persistedUrl || rawTip.imageUrl,
        updatedAt: new Date().toISOString()
      };
      if (deletedTipIdsRef.current.has(updatedTip.id)) {
        deletedTipIdsRef.current.delete(updatedTip.id);
        saveDeletedIdSet(DELETED_TIPS_KEY, deletedTipIdsRef.current);
        void saveDeletedIdsToPersistentDb('deletedTipIds', deletedTipIdsRef.current);
      }
      const exists = tips.some(t => t.id === updatedTip.id);
      const newTips = exists
        ? tips.map(t => (t.id === updatedTip.id ? updatedTip : t))
        : [updatedTip, ...tips];
      const idbSaved = await savePersistedKey('tips', newTips);
      let localSaved = false;
      try {
        localStorage.setItem('agri_tips', JSON.stringify(newTips));
        localSaved = true;
      } catch (err) {
        console.warn('LocalStorage tip save note:', err);
      }
      let remoteSaved = false;
      if (auth.currentUser) {
        try {
          await saveTipToFirestore(updatedTip);
          remoteSaved = true;
        } catch (e) {
          console.warn('Firestore tip save note:', e);
        }
      }
      if (!idbSaved && !localSaved && !remoteSaved) {
        const msg = 'Unable to save farming tip due to storage quota limit.';
        showToast('error', msg);
        throw new Error(msg);
      }
      setTips(newTips);
      trySyncToSheet(crops, pests, diseases, newTips);
      showToast('success', `Farming Guide "${updatedTip.title}" saved successfully!`);
      setEditEntity(null);
      return true;
    }
  };

  // Confirmation before destructive crop deletion
  const handleDeleteCrop = (crop: Crop) => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Crop: ${crop.commonName}?`,
      message: `Are you sure you want to permanently delete ${crop.commonName} (${crop.scientificName}) from the AgroVya database? This action cannot be undone.`,
      confirmLabel: 'Delete Crop',
      onConfirm: async () => {
        deletedCropIdsRef.current.add(crop.id);
        saveDeletedIdSet(DELETED_CROPS_KEY, deletedCropIdsRef.current);
        const updated = crops.filter(c => c.id !== crop.id);
        setCrops(updated);
        try { localStorage.setItem('agri_crops', JSON.stringify(updated)); } catch {}
        await Promise.all([
          saveCropsToPersistentDb(updated),
          saveDeletedIdsToPersistentDb('deletedCropIds', deletedCropIdsRef.current)
        ]);
        if (auth.currentUser) {
          await deleteCropFromFirestore(crop.id).catch(e => console.warn('Firestore crop delete note:', e));
        }
        trySyncToSheet(updated, pests, diseases, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setSelectedCrop(prev => (prev?.id === crop.id ? null : prev));
        setZoomState(prev => (prev?.crop.id === crop.id ? null : prev));
        showToast('info', `Deleted crop "${crop.commonName}".`);
      }
    });
  };

  const handleDeletePest = (pest: Pest) => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Pest: ${pest.name}?`,
      message: `Are you sure you want to remove ${pest.name} from the pest records?`,
      confirmLabel: 'Delete Pest',
      onConfirm: async () => {
        deletedPestIdsRef.current.add(pest.id);
        saveDeletedIdSet(DELETED_PESTS_KEY, deletedPestIdsRef.current);
        const updated = pests.filter(p => p.id !== pest.id);
        setPests(updated);
        try { localStorage.setItem('agri_pests', JSON.stringify(updated)); } catch {}
        await Promise.all([
          savePersistedKey('pests', updated),
          saveDeletedIdsToPersistentDb('deletedPestIds', deletedPestIdsRef.current)
        ]);
        if (auth.currentUser) {
          await deletePestFromFirestore(pest.id).catch(e => console.warn('Firestore pest delete note:', e));
        }
        trySyncToSheet(crops, updated, diseases, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('info', `Deleted pest "${pest.name}".`);
      }
    });
  };

  const handleDeleteDisease = (disease: Disease) => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Disease: ${disease.name}?`,
      message: `Are you sure you want to remove ${disease.name} from the plant pathology records?`,
      confirmLabel: 'Delete Disease',
      onConfirm: async () => {
        deletedDiseaseIdsRef.current.add(disease.id);
        saveDeletedIdSet(DELETED_DISEASES_KEY, deletedDiseaseIdsRef.current);
        const updated = diseases.filter(d => d.id !== disease.id);
        setDiseases(updated);
        try { localStorage.setItem('agri_diseases', JSON.stringify(updated)); } catch {}
        await Promise.all([
          savePersistedKey('diseases', updated),
          saveDeletedIdsToPersistentDb('deletedDiseaseIds', deletedDiseaseIdsRef.current)
        ]);
        if (auth.currentUser) {
          await deleteDiseaseFromFirestore(disease.id).catch(e => console.warn('Firestore disease delete note:', e));
        }
        trySyncToSheet(crops, pests, updated, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('info', `Deleted disease "${disease.name}".`);
      }
    });
  };

  const handleDeleteTip = (tip: FarmingTip) => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Tip: ${tip.title}?`,
      message: `Are you sure you want to delete this farming guide?`,
      confirmLabel: 'Delete Tip',
      onConfirm: async () => {
        deletedTipIdsRef.current.add(tip.id);
        saveDeletedIdSet(DELETED_TIPS_KEY, deletedTipIdsRef.current);
        const updated = tips.filter(t => t.id !== tip.id);
        setTips(updated);
        try { localStorage.setItem('agri_tips', JSON.stringify(updated)); } catch {}
        await Promise.all([
          savePersistedKey('tips', updated),
          saveDeletedIdsToPersistentDb('deletedTipIds', deletedTipIdsRef.current)
        ]);
        if (auth.currentUser) {
          await deleteTipFromFirestore(tip.id).catch(e => console.warn('Firestore tip delete note:', e));
        }
        trySyncToSheet(crops, pests, diseases, updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('info', `Deleted farming tip "${tip.title}".`);
      }
    });
  };

  // Per-Crop Photo Gallery CRUD Handlers (Admin/Owner Only)
  const handleAddCropPhotos = async (
    crop: Crop,
    items: Array<{ imageUrl: string; caption: string; notes?: string }>
  ) => {
    if (!isOwner) {
      showToast('error', 'Only the verified app owner can add gallery photos.');
      return;
    }
    const persistedItems = await Promise.all(
      items.map(async (item, idx) => ({
        ...item,
        imageUrl:
          (await persistUploadedImageUrl(
            item.imageUrl,
            `crops/${crop.id}/gallery_${Date.now()}_${idx}.jpg`
          )) || item.imageUrl
      }))
    );
    const { nextMap, added } = addPhotosToCropGallery(
      cropPhotosMap,
      crop,
      persistedItems,
      deletedCropPhotoIds
    );
    if (added.length === 0) return;

    const idbSaved = await saveCropPhotosMapToPersistentDb(nextMap);
    let localSaved = false;
    try {
      localStorage.setItem('agri_crop_photos_v1', JSON.stringify(nextMap));
      localSaved = true;
    } catch (e) {
      console.warn('LocalStorage gallery fast cache skipped (using IndexedDB persistent storage):', e);
    }
    let remoteSaved = false;
    if (auth.currentUser) {
      try {
        await saveCropPhotosBatchToFirestore(crop, added);
        remoteSaved = true;
      } catch (e) {
        console.warn('Firestore gallery batch save note:', e);
      }
    }
    if (!idbSaved && !localSaved && !remoteSaved) {
      const errMsg = 'Unable to save photos to persistent storage. Please try again.';
      showToast('error', errMsg);
      throw new Error(errMsg);
    }
    setCropPhotosMap(nextMap);
    showToast(
      'success',
      `Added ${added.length} ${added.length === 1 ? 'photo' : 'photos'} to ${crop.commonName} gallery!`
    );
  };

  const handleUpdateCropPhoto = async (crop: Crop, updatedPhoto: CropPhoto) => {
    if (!isOwner) {
      showToast('error', 'Only the verified app owner can update gallery photos.');
      return;
    }
    const persistedUrl = await persistUploadedImageUrl(
      updatedPhoto.imageUrl,
      `crops/${crop.id}/gallery_${updatedPhoto.id}_${Date.now()}.jpg`
    );
    const { nextMap, saved } = updateCropGalleryPhoto(cropPhotosMap, crop, {
      ...updatedPhoto,
      imageUrl: persistedUrl || updatedPhoto.imageUrl
    });
    const idbSaved = await saveCropPhotosMapToPersistentDb(nextMap);
    let localSaved = false;
    try {
      localStorage.setItem('agri_crop_photos_v1', JSON.stringify(nextMap));
      localSaved = true;
    } catch {}
    let remoteSaved = false;
    if (auth.currentUser) {
      try {
        await saveCropPhotoToFirestore(crop, saved);
        remoteSaved = true;
      } catch (e) {
        console.warn('Firestore gallery photo update note:', e);
      }
    }
    if (!idbSaved && !localSaved && !remoteSaved) {
      showToast('error', 'Unable to update photo in persistent storage.');
      return;
    }
    setCropPhotosMap(nextMap);
    showToast('success', `Updated photo caption "${saved.caption}" for ${crop.commonName}.`);
  };

  const handleDeleteCropPhoto = async (crop: Crop, photo: CropPhoto) => {
    if (!isOwner) {
      showToast('error', 'Only the verified app owner can delete gallery photos.');
      return;
    }
    const { nextMap, nextDeletedIds } = deleteCropGalleryPhoto(
      cropPhotosMap,
      deletedCropPhotoIds,
      crop.id,
      photo.id
    );
    await Promise.all([
      saveCropPhotosMapToPersistentDb(nextMap),
      saveDeletedIdsToPersistentDb('deletedCropPhotoIds', nextDeletedIds)
    ]);
    try {
      localStorage.setItem('agri_crop_photos_v1', JSON.stringify(nextMap));
      localStorage.setItem('agri_deleted_crop_photo_ids_v1', JSON.stringify(Array.from(nextDeletedIds)));
    } catch {}
    setCropPhotosMap(nextMap);
    setDeletedCropPhotoIds(nextDeletedIds);
    if (auth.currentUser) {
      deleteCropPhotoFromFirestore(crop.id, photo.id).catch(e =>
        console.warn('Firestore gallery photo delete note:', e)
      );
    }
    showToast('info', `Removed photo from ${crop.commonName} gallery.`);
  };

  // Search result click handler
  const handleSelectSearchResult = (type: string, item: any) => {
    if (type === 'crop') {
      setSelectedCrop(item);
    } else if (type === 'pest') {
      setCurrentSection('pests');
    } else if (type === 'disease') {
      setCurrentSection('diseases');
    } else if (type === 'tip') {
      setCurrentSection('tips');
    }
  };

  // Filter crops strictly by Crop Category, optional Vegetable Subcategory, and inline Crop Library search
  const filteredCrops = filterCropsByCategory(
    crops,
    selectedCropCategory,
    selectedVegetableSubcategory,
    cropSearchQuery
  );

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: crops.length };
    for (const cat of CROP_CATEGORIES) {
      counts[cat] = 0;
    }
    for (const crop of crops) {
      const cat = resolveCropCategory(crop);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [crops]);

  const vegetableSubcategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    for (const sub of VEGETABLE_SUBCATEGORIES) {
      counts[sub] = 0;
    }
    for (const crop of crops) {
      if (resolveCropCategory(crop) === 'Vegetables') {
        counts.All += 1;
        const sub = resolveVegetableSubcategory(crop);
        counts[sub] = (counts[sub] || 0) + 1;
      }
    }
    return counts;
  }, [crops]);

  const explicitFeatured = crops.filter(c => c.featured);
  const featuredCrops = explicitFeatured.length > 0
    ? explicitFeatured
    : crops.filter(c => c.id === 'crop-1' || c.id === 'crop-2' || /^(wheat|rice|paddy)\b/i.test(c.commonName)).slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-stone-50/40 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Header with Logo, Navigation, Search, and Owner Status */}
      <Header
        currentSection={currentSection}
        onNavigate={(sec) => {
          setCurrentSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        user={user}
        isOwner={isOwner}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        connectedSheetId={connectedSheetId}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* HOME VIEW */}
        {currentSection === 'home' && (
          <div>
            {/* 2. Welcome Section: "Smart Farming Starts Here!" & 3. Search Bar */}
            <Hero
              onSearchFocus={() => setIsSearchOpen(true)}
              onNavigate={(sec) => {
                setCurrentSection(sec);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              cropCount={crops.length}
              pestCount={pests.length}
              diseaseCount={diseases.length}
              tipCount={tips.length}
            />

            {/* 4. Four Feature Sections Overview Cards */}
            <FeatureSections
              onNavigate={(sec) => {
                setCurrentSection(sec);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              cropCount={crops.length}
              pestCount={pests.length}
              diseaseCount={diseases.length}
              tipCount={tips.length}
            />

            {/* 5. Featured Crops: Wheat and Rice Showcase with details */}
            <section className="py-12 sm:py-16 bg-white border-t border-emerald-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Key Global Staples
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
                      Featured Crops: Wheat & Rice
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
                      In-depth botanical records, seed morphology, color, shape, size, and cultivation guidelines for the world's most critical cereal grains.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentSection('crops');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto cursor-pointer"
                  >
                    <span>View all {crops.length} crops</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Featured Crops Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredCrops.map(crop => (
                    <CropCard
                      key={crop.id}
                      crop={crop}
                      galleryCount={getCropGallery(crop, cropPhotosMap, deletedCropPhotoIds).length}
                      onSelect={(c) => setSelectedCrop(c)}
                      onZoom={(c) => setZoomState({ crop: c, initialIndex: 0 })}
                      isOwner={isOwner}
                      onEdit={(c) => setEditEntity({ type: 'crop', data: c })}
                      onDelete={(c) => handleDeleteCrop(c)}
                    />
                  ))}
                </div>

              </div>
            </section>

            {/* Quick Preview of Farming Tips & Field Guides */}
            <section className="py-12 sm:py-16 bg-stone-50/80 border-t border-emerald-100">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6 text-center sm:text-left">
                  
                  {/* Sustainable Agriculture */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Student & Farmer Fieldwork
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
                      Modern Agronomy for a Changing Climate
                    </h2>
                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl">
                      Whether you are an agronomy student analyzing soil cation exchange capacities or a farmer implementing Alternate Wetting and Drying (AWD) in rice paddies, AgroVya delivers verified field intelligence.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-left">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">Crop Rotation Schedules</h4>
                          <p className="text-xs text-stone-600 mt-0.5">Disrupt insect pupation cycles and fix natural atmospheric nitrogen.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-left">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">Biological Integrated Pest Management</h4>
                          <p className="text-xs text-stone-600 mt-0.5">Harness natural predatory insects and botanicals before resorting to chemical insecticides.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setCurrentSection('tips');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>Explore Farming Field Guides</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </div>
        )}

        {/* CROPS LIBRARY VIEW */}
        {currentSection === 'crops' && (
          <div className="py-10 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                    <Wheat className="w-3.5 h-3.5" />
                    Botanical & Agronomic Archive
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
                    Crop Library
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
                    Browse comprehensive agronomic profiles organized into 12 agricultural crop categories—including Cereals, Pulses, Oilseeds, Vegetables, Fruits, Flowers, and Medicinal Plants.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {isOwner ? (
                    <button
                      onClick={() => setEditEntity({ type: 'crop', data: {} })}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Crop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const session = loginAsOwnerSession();
                        setUser(session.user);
                        setIsOwner(true);
                        showToast('info', `Owner mode enabled (${PRIMARY_OWNER_EMAIL} & ${BUSINESS_CONTACT_EMAIL}). You can now add and manage crops.`);
                        setEditEntity({ type: 'crop', data: {} });
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                      title={`Only verified project owners (${PRIMARY_OWNER_EMAIL} or ${BUSINESS_CONTACT_EMAIL}) can add crops. Click to unlock owner management.`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Owner: Add New Crop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Search + 11 Agricultural Crop Category Filter Bar */}
              <div className="space-y-4 mb-8">
                {/* Search Bar inside Crop Library (works together with category filter) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs">
                  <div className="relative flex-1 flex items-center">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={cropSearchQuery}
                      onChange={(e) => setCropSearchQuery(e.target.value)}
                      placeholder="Search crops by name, scientific name, or category (e.g. Medicinal Plants, Pulses, Cereals, Tulsi)..."
                      aria-label="Search crops in Crop Library"
                      className="w-full pl-10 pr-9 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                    {cropSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCropSearchQuery('')}
                        className="absolute right-2.5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
                        aria-label="Clear crop search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold text-stone-600 shrink-0 px-1">
                    <span>
                      Showing <strong className="text-emerald-700">{filteredCrops.length}</strong>{' '}
                      {filteredCrops.length === 1 ? 'crop' : 'crops'}
                      {selectedCropCategory !== 'All' ? ` in ${selectedCropCategory}` : ''}
                    </span>
                    {(selectedCropCategory !== 'All' || cropSearchQuery.trim() !== '') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCropCategory('All');
                          setSelectedVegetableSubcategory('All');
                          setCropSearchQuery('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontally Scrollable 11 Crop Category Filter Buttons */}
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar"
                  role="tablist"
                  aria-label="Crop Categories"
                >
                  <span className="text-xs font-bold text-stone-500 flex items-center gap-1.5 shrink-0 pr-1">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Category:</span>
                  </span>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedCropCategory === 'All'}
                    onClick={() => {
                      setSelectedCropCategory('All');
                      setSelectedVegetableSubcategory('All');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedCropCategory === 'All'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <span>All Categories</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedCropCategory === 'All' ? 'bg-emerald-700/80 text-emerald-100' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {categoryCounts.All}
                    </span>
                  </button>

                  {CROP_CATEGORIES.map(category => {
                    const isActive = selectedCropCategory === category;
                    const count = categoryCounts[category] || 0;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        ref={el => {
                          if (isActive && el && typeof el.scrollIntoView === 'function') {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          }
                        }}
                        onClick={() => {
                          setSelectedCropCategory(category);
                          setSelectedVegetableSubcategory('All');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <span>{category}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isActive ? 'bg-emerald-700/80 text-emerald-100' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Vegetable Subcategories (Shown ONLY inside the Vegetables section) */}
                {selectedCropCategory === 'Vegetables' && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Vegetable Subcategories
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 overflow-x-auto pb-1"
                      role="tablist"
                      aria-label="Vegetable Subcategories"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={selectedVegetableSubcategory === 'All'}
                        onClick={() => setSelectedVegetableSubcategory('All')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                          selectedVegetableSubcategory === 'All'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        All Vegetables ({vegetableSubcategoryCounts.All})
                      </button>
                      {VEGETABLE_SUBCATEGORIES.map(sub => {
                        const isSubActive = selectedVegetableSubcategory === sub;
                        return (
                          <button
                            key={sub}
                            type="button"
                            role="tab"
                            aria-selected={isSubActive}
                            onClick={() => setSelectedVegetableSubcategory(sub)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                              isSubActive
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {sub} ({vegetableSubcategoryCounts[sub] || 0})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Crops Grid or Empty State */}
              {filteredCrops.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center max-w-xl mx-auto">
                  <Wheat className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-stone-900">No crops match your current filter</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
                    {cropSearchQuery
                      ? `No crops matched "${cropSearchQuery}"${selectedCropCategory !== 'All' ? ` inside ${selectedCropCategory}` : ''}.`
                      : `No crops are currently listed in ${selectedCropCategory}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCropCategory('All');
                      setSelectedVegetableSubcategory('All');
                      setCropSearchQuery('');
                    }}
                    className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Show All Crops
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredCrops.map(crop => (
                    <CropCard
                      key={crop.id}
                      crop={crop}
                      galleryCount={getCropGallery(crop, cropPhotosMap, deletedCropPhotoIds).length}
                      onSelect={(c) => setSelectedCrop(c)}
                      onZoom={(c) => setZoomState({ crop: c, initialIndex: 0 })}
                      isOwner={isOwner}
                      onEdit={(c) => setEditEntity({ type: 'crop', data: c })}
                      onDelete={(c) => handleDeleteCrop(c)}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* PESTS VIEW */}
        {currentSection === 'pests' && (
          <PestDiseaseSection
            pests={pests}
            diseases={diseases}
            initialTab="pests"
            isOwner={isOwner}
            onAddPest={() => setEditEntity({ type: 'pest', data: {} })}
            onEditPest={(pest) => setEditEntity({ type: 'pest', data: pest })}
            onDeletePest={handleDeletePest}
            onAddDisease={() => setEditEntity({ type: 'disease', data: {} })}
            onEditDisease={(disease) => setEditEntity({ type: 'disease', data: disease })}
            onDeleteDisease={handleDeleteDisease}
          />
        )}

        {/* DISEASES VIEW */}
        {currentSection === 'diseases' && (
          <PestDiseaseSection
            pests={pests}
            diseases={diseases}
            initialTab="diseases"
            isOwner={isOwner}
            onAddPest={() => setEditEntity({ type: 'pest', data: {} })}
            onEditPest={(pest) => setEditEntity({ type: 'pest', data: pest })}
            onDeletePest={handleDeletePest}
            onAddDisease={() => setEditEntity({ type: 'disease', data: {} })}
            onEditDisease={(disease) => setEditEntity({ type: 'disease', data: disease })}
            onDeleteDisease={handleDeleteDisease}
          />
        )}

        {/* FARMING TIPS VIEW */}
        {currentSection === 'tips' && (
          <FarmingTipsSection
            tips={tips}
            isOwner={isOwner}
            onAddTip={() => setEditEntity({ type: 'tip', data: {} })}
            onEditTip={(tip) => setEditEntity({ type: 'tip', data: tip })}
            onDeleteTip={handleDeleteTip}
          />
        )}

        {/* ABOUT VIEW */}
        {currentSection === 'about' && (
          <AboutSection
            isOwner={isOwner}
            currentUserEmail={user?.email}
            onOpenSheetModal={() => setIsSheetModalOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0a3520] shadow-md ring-1 ring-emerald-500/40 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/aistudio/Screenshot_20261111-175134_8465347c.png"
                    alt="AgroVya Logo"
                    className="w-full h-full object-cover scale-105"
                  />
                </div>
                <span className="text-2xl font-black text-white">
                  Agro<span className="text-emerald-400">Vya</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
                Empowering agricultural students and field farmers with botanical profiles, pest diagnostics, plant pathology solutions, and Google Sheets data synchronization.
              </p>
              <div className="text-xs text-stone-400 pt-1 flex flex-wrap items-center gap-1.5" data-testid="footer-official-email">
                <span>Official Editorial &amp; Business Email:</span>
                <a
                  href={`mailto:${BUSINESS_CONTACT_EMAIL}`}
                  className="text-emerald-400 hover:text-emerald-300 font-mono underline decoration-emerald-500/50 underline-offset-2 transition-colors"
                >
                  {BUSINESS_CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><button onClick={() => setCurrentSection('home')} className="hover:text-emerald-400">Home</button></li>
                <li><button onClick={() => setCurrentSection('crops')} className="hover:text-emerald-400">Crop Library (12 Categories)</button></li>
                <li><button onClick={() => setCurrentSection('pests')} className="hover:text-emerald-400">Pest Guide</button></li>
                <li><button onClick={() => setCurrentSection('diseases')} className="hover:text-emerald-400">Disease Information</button></li>
                <li><button onClick={() => setCurrentSection('tips')} className="hover:text-emerald-400">Farming Tips</button></li>
                <li><button onClick={() => setCurrentSection('about')} className="hover:text-emerald-400">About Us</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">
                Contact Us &amp; Database
              </h4>
              <div className="mb-4">
                <a
                  href={`mailto:${BUSINESS_CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 transition-colors"
                  data-testid="footer-contact-link"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{BUSINESS_CONTACT_EMAIL}</span>
                </a>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mb-3">
                Google Sheets real-time integration. Sync and manage crops anytime.
              </p>
              <button
                onClick={() => setIsSheetModalOpen(true)}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-semibold rounded-xl border border-stone-700 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Google Sheets Sync</span>
              </button>
            </div>

          </div>

          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} AgroVya — Smart Farming Starts Here!</p>
            <p>Built for Students & Farmers with Google Sheets Database Integration.</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Instant Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        crops={crops}
        pests={pests}
        diseases={diseases}
        tips={tips}
        onSelectItem={handleSelectSearchResult}
        onSelectCategory={(cat: CropCategory) => {
          setSelectedCropCategory(cat);
          setSelectedVegetableSubcategory('All');
          setCropSearchQuery('');
          setCurrentSection('crops');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 2. Detailed Crop Profile Modal with 3 Stage Photo Sections & Per-Crop Multi-Photo Gallery */}
      {(() => {
        const activeSelectedCrop = selectedCrop
          ? crops.find(c => c.id === selectedCrop.id) ?? selectedCrop
          : null;
        const activeZoomCrop = zoomState
          ? crops.find(c => c.id === zoomState.crop.id) ?? zoomState.crop
          : null;

        return (
          <>
            <CropDetailModal
              crop={activeSelectedCrop}
              galleryPhotos={
                activeSelectedCrop
                  ? getCropGallery(activeSelectedCrop, cropPhotosMap, deletedCropPhotoIds)
                  : []
              }
              onClose={() => setSelectedCrop(null)}
              onZoom={(c, idx = 0) => setZoomState({ crop: c, initialIndex: idx })}
              isOwner={isOwner}
              onEdit={(c) => {
                setSelectedCrop(null);
                setEditEntity({ type: 'crop', data: c });
              }}
              onDelete={(c) => {
                setSelectedCrop(null);
                handleDeleteCrop(c);
              }}
              onAddPhotos={handleAddCropPhotos}
              onUpdatePhoto={handleUpdateCropPhoto}
              onDeletePhoto={handleDeleteCropPhoto}
              onRequestOwnerMode={() => {
                const session = loginAsOwnerSession();
                setUser(session.user);
                setIsOwner(true);
                showToast(
                  'info',
                  `Owner mode enabled (${PRIMARY_OWNER_EMAIL} & ${BUSINESS_CONTACT_EMAIL}). You can now upload, edit, and delete crops and photos.`
                );
              }}
            />

            {/* 2b. Full-Screen Uncropped Crop Photo Zoom & Swipe Carousel Modal */}
            <ImageZoomModal
              isOpen={!!activeZoomCrop}
              imageUrl={activeZoomCrop?.imageUrl || ''}
              title={activeZoomCrop?.commonName || ''}
              subtitle={activeZoomCrop?.scientificName}
              badge={activeZoomCrop ? resolveCropCategory(activeZoomCrop) : undefined}
              photos={
                activeZoomCrop
                  ? getCropGallery(activeZoomCrop, cropPhotosMap, deletedCropPhotoIds).map(p => ({
                      id: p.id,
                      imageUrl: p.imageUrl,
                      caption: p.caption,
                      notes: p.notes
                    }))
                  : []
              }
              initialIndex={zoomState?.initialIndex ?? 0}
              onClose={() => setZoomState(null)}
              onOpenDetails={
                activeZoomCrop && (!activeSelectedCrop || activeSelectedCrop.id !== activeZoomCrop.id)
                  ? () => {
                      const target = activeZoomCrop;
                      setZoomState(null);
                      setSelectedCrop(target);
                    }
                  : undefined
              }
            />
          </>
        );
      })()}

      {/* 3. Google Sheets Connect & Sync Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        accessToken={accessToken}
        spreadsheetId={connectedSheetId}
        onSpreadsheetConnected={(id) => {
          setConnectedSheetId(id);
          saveStoredSpreadsheetId(id);
        }}
        crops={crops}
        pests={pests}
        diseases={diseases}
        tips={tips}
        onDataLoadedFromSheet={(data) => {
          if (data.crops.length > 0) {
            setCrops(prev =>
              mergeAndNormalizeCrops(data.crops, prev).filter(c => !deletedCropIdsRef.current.has(c.id))
            );
          }
          if (data.pests.length > 0) {
            setPests(prev => mergeEntitiesByTimestamp(data.pests, prev, deletedPestIdsRef.current));
          }
          if (data.diseases.length > 0) {
            setDiseases(prev => mergeEntitiesByTimestamp(data.diseases, prev, deletedDiseaseIdsRef.current));
          }
          if (data.tips.length > 0) {
            setTips(prev => mergeEntitiesByTimestamp(data.tips, prev, deletedTipIdsRef.current));
          }
        }}
        isOwner={isOwner}
        userEmail={user?.email}
      />

      {/* 4. Owner Edit / Add Modal */}
      <EditModal
        isOpen={!!editEntity}
        onClose={() => setEditEntity(null)}
        entity={editEntity}
        onSave={handleSaveEntity}
      />

      {/* 5. User Confirmation Dialog for Destructive Operations */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 6. Floating Feedback Toast */}
      {toast && (
        <div 
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20' 
              : toast.type === 'error'
              ? 'bg-red-900 text-white border-red-700 shadow-red-950/20'
              : 'bg-stone-900 text-white border-stone-700 shadow-stone-950/20'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
