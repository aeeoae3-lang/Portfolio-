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
  Database
} from 'lucide-react';

import { Crop, Pest, Disease, FarmingTip, SectionType } from './types';
import { INITIAL_CROPS, INITIAL_PESTS, INITIAL_DISEASES, INITIAL_TIPS } from './data/seedData';
import {
  initAuth,
  googleSignIn,
  logoutUser,
  getAccessToken,
  setAccessToken,
  checkIsOwner,
  PRIMARY_OWNER_EMAIL
} from './services/auth';
import {
  validateFirestoreConnection,
  seedFirestoreIfEmpty,
  subscribeToCrops,
  subscribeToPests,
  subscribeToDiseases,
  subscribeToTips,
  saveCropToFirestore,
  deleteCropFromFirestore,
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

export default function App() {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<SectionType>('home');

  // Core Data State (Loaded from localStorage or Initial Seed Data)
  const [crops, setCrops] = useState<Crop[]>(() => {
    try {
      const saved = localStorage.getItem('agri_crops');
      return saved ? JSON.parse(saved) : INITIAL_CROPS;
    } catch {
      return INITIAL_CROPS;
    }
  });

  const [pests, setPests] = useState<Pest[]>(() => {
    try {
      const saved = localStorage.getItem('agri_pests');
      return saved ? JSON.parse(saved) : INITIAL_PESTS;
    } catch {
      return INITIAL_PESTS;
    }
  });

  const [diseases, setDiseases] = useState<Disease[]>(() => {
    try {
      const saved = localStorage.getItem('agri_diseases');
      return saved ? JSON.parse(saved) : INITIAL_DISEASES;
    } catch {
      return INITIAL_DISEASES;
    }
  });

  const [tips, setTips] = useState<FarmingTip[]>(() => {
    try {
      const saved = localStorage.getItem('agri_tips');
      return saved ? JSON.parse(saved) : INITIAL_TIPS;
    } catch {
      return INITIAL_TIPS;
    }
  });

  // Auth & Permissions State
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [accessToken, setLocalAccessToken] = useState<string | null>(null);

  // Google Sheets state
  const [connectedSheetId, setConnectedSheetId] = useState<string | null>(() => getStoredSpreadsheetId());
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Modals & Selections
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [editEntity, setEditEntity] = useState<EditEntity | null>(null);
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

  // Crop category filter
  const [cropFamilyFilter, setCropFamilyFilter] = useState<string>('All');

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('agri_crops', JSON.stringify(crops));
      localStorage.setItem('agri_pests', JSON.stringify(pests));
      localStorage.setItem('agri_diseases', JSON.stringify(diseases));
      localStorage.setItem('agri_tips', JSON.stringify(tips));
    } catch {
      // ignore
    }
  }, [crops, pests, diseases, tips]);

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
    seedFirestoreIfEmpty();

    const unsubCrops = subscribeToCrops((firestoreCrops) => {
      if (firestoreCrops.length > 0) setCrops(firestoreCrops);
    });

    const unsubPests = subscribeToPests((firestorePests) => {
      if (firestorePests.length > 0) setPests(firestorePests);
    });

    const unsubDiseases = subscribeToDiseases((firestoreDiseases) => {
      if (firestoreDiseases.length > 0) setDiseases(firestoreDiseases);
    });

    const unsubTips = subscribeToTips((firestoreTips) => {
      if (firestoreTips.length > 0) setTips(firestoreTips);
    });

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
          if (data.crops.length > 0) setCrops(data.crops);
          if (data.pests.length > 0) setPests(data.pests);
          if (data.diseases.length > 0) setDiseases(data.diseases);
          if (data.tips.length > 0) setTips(data.tips);
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
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setIsOwner(false);
    setLocalAccessToken(null);
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
    if (!isOwner) return;

    if (entity.type === 'crop') {
      const updatedCrop = entity.data as Crop;
      const exists = crops.some(c => c.id === updatedCrop.id);
      const newCrops = exists
        ? crops.map(c => (c.id === updatedCrop.id ? updatedCrop : c))
        : [updatedCrop, ...crops];
      setCrops(newCrops);
      await saveCropToFirestore(updatedCrop).catch(e => console.warn('Firestore crop save note:', e));
      trySyncToSheet(newCrops, pests, diseases, tips);
    } else if (entity.type === 'pest') {
      const updatedPest = entity.data as Pest;
      const exists = pests.some(p => p.id === updatedPest.id);
      const newPests = exists
        ? pests.map(p => (p.id === updatedPest.id ? updatedPest : p))
        : [updatedPest, ...pests];
      setPests(newPests);
      await savePestToFirestore(updatedPest).catch(e => console.warn('Firestore pest save note:', e));
      trySyncToSheet(crops, newPests, diseases, tips);
    } else if (entity.type === 'disease') {
      const updatedDisease = entity.data as Disease;
      const exists = diseases.some(d => d.id === updatedDisease.id);
      const newDiseases = exists
        ? diseases.map(d => (d.id === updatedDisease.id ? updatedDisease : d))
        : [updatedDisease, ...diseases];
      setDiseases(newDiseases);
      await saveDiseaseToFirestore(updatedDisease).catch(e => console.warn('Firestore disease save note:', e));
      trySyncToSheet(crops, pests, newDiseases, tips);
    } else if (entity.type === 'tip') {
      const updatedTip = entity.data as FarmingTip;
      const exists = tips.some(t => t.id === updatedTip.id);
      const newTips = exists
        ? tips.map(t => (t.id === updatedTip.id ? updatedTip : t))
        : [updatedTip, ...tips];
      setTips(newTips);
      await saveTipToFirestore(updatedTip).catch(e => console.warn('Firestore tip save note:', e));
      trySyncToSheet(crops, pests, diseases, newTips);
    }

    setEditEntity(null);
  };

  // Confirmation before destructive crop deletion
  const handleDeleteCrop = (crop: Crop) => {
    if (!isOwner) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete Crop: ${crop.commonName}?`,
      message: `Are you sure you want to permanently delete ${crop.commonName} (${crop.scientificName}) from the AgriNex database? This action cannot be undone.`,
      confirmLabel: 'Delete Crop',
      onConfirm: async () => {
        const updated = crops.filter(c => c.id !== crop.id);
        setCrops(updated);
        await deleteCropFromFirestore(crop.id).catch(e => console.warn('Firestore crop delete note:', e));
        trySyncToSheet(updated, pests, diseases, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
        const updated = pests.filter(p => p.id !== pest.id);
        setPests(updated);
        await deletePestFromFirestore(pest.id).catch(e => console.warn('Firestore pest delete note:', e));
        trySyncToSheet(crops, updated, diseases, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
        const updated = diseases.filter(d => d.id !== disease.id);
        setDiseases(updated);
        await deleteDiseaseFromFirestore(disease.id).catch(e => console.warn('Firestore disease delete note:', e));
        trySyncToSheet(crops, pests, updated, tips);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
        const updated = tips.filter(t => t.id !== tip.id);
        setTips(updated);
        await deleteTipFromFirestore(tip.id).catch(e => console.warn('Firestore tip delete note:', e));
        trySyncToSheet(crops, pests, diseases, updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
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

  // Filter crops
  const availableFamilies = ['All', ...Array.from(new Set(crops.map(c => c.family.split(' ')[0]))).filter(Boolean)];
  const filteredCrops = crops.filter(c => {
    if (cropFamilyFilter === 'All') return true;
    return c.family.toLowerCase().includes(cropFamilyFilter.toLowerCase());
  });

  const featuredCrops = crops.filter(c => c.featured);
  const regularCrops = crops.filter(c => !c.featured);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/40 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
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
                      onSelect={(c) => setSelectedCrop(c)}
                      isOwner={isOwner}
                      onEdit={(c) => setEditEntity({ type: 'crop', data: c })}
                      onDelete={(c) => handleDeleteCrop(c)}
                    />
                  ))}
                </div>

              </div>
            </section>

            {/* Quick Preview of Farming Tips & Pest Guides */}
            <section className="py-12 sm:py-16 bg-stone-50/80 border-t border-emerald-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  
                  {/* Left Column: Sustainable Agriculture */}
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Student & Farmer Fieldwork
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
                      Modern Agronomy for a Changing Climate
                    </h2>
                    <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                      Whether you are an agronomy student analyzing soil cation exchange capacities or a farmer implementing Alternate Wetting and Drying (AWD) in rice paddies, AgriNex delivers verified field intelligence.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">Crop Rotation Schedules</h4>
                          <p className="text-xs text-stone-600 mt-0.5">Disrupt insect pupation cycles and fix natural atmospheric nitrogen.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
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

                  {/* Right Column: Google Sheets Database Highlight */}
                  <div className="bg-gradient-to-br from-emerald-800 to-green-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-emerald-300">
                      <Database className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Decentralized Storage
                    </span>
                    <h3 className="text-2xl font-black mt-1 mb-3">
                      Powered by Google Sheets
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                      AgriNex syncs with Google Sheets. As the verified owner (<span className="text-emerald-200 font-mono">{PRIMARY_OWNER_EMAIL}</span>), you can add and update crop information directly on this web app or in your Google spreadsheet.
                    </p>

                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-200">Database Status:</span>
                        <span className="font-bold text-white">
                          {connectedSheetId ? 'Connected to Google Drive' : 'Preloaded Local Seed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-200">Editorial Permissions:</span>
                        <span className="font-bold text-white">
                          {isOwner ? 'Owner (Edit Enabled)' : 'Public Read-Only'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSheetModalOpen(true)}
                      className="mt-6 w-full py-2.5 px-4 bg-white text-emerald-950 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-emerald-700" />
                      <span>Configure Google Sheets Sync</span>
                    </button>
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
                    Browse comprehensive profiles of wheat, rice, pulses, and vegetables. Includes common and scientific nomenclature, grain dimensions, colour, morphology, and growing conditions.
                  </p>
                </div>

                {isOwner && (
                  <button
                    onClick={() => setEditEntity({ type: 'crop', data: {} })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start md:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Crop</span>
                  </button>
                )}
              </div>

              {/* Family Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
                <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Family:
                </span>
                {availableFamilies.map(fam => (
                  <button
                    key={fam}
                    onClick={() => setCropFamilyFilter(fam)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      cropFamilyFilter === fam
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50'
                    }`}
                  >
                    {fam === 'All' ? 'All Families' : fam}
                  </button>
                ))}
              </div>

              {/* Crops Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredCrops.map(crop => (
                  <CropCard
                    key={crop.id}
                    crop={crop}
                    onSelect={(c) => setSelectedCrop(c)}
                    isOwner={isOwner}
                    onEdit={(c) => setEditEntity({ type: 'crop', data: c })}
                    onDelete={(c) => handleDeleteCrop(c)}
                  />
                ))}
              </div>

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
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white">
                  Agri<span className="text-emerald-400">Nex</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
                Empowering agricultural students and field farmers with botanical profiles, pest diagnostics, plant pathology solutions, and Google Sheets data synchronization.
              </p>
              <div className="text-xs text-stone-500 pt-1">
                Owner & Primary Editorial Governance: <span className="text-emerald-400 font-mono">{PRIMARY_OWNER_EMAIL}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><button onClick={() => setCurrentSection('home')} className="hover:text-emerald-400">Home</button></li>
                <li><button onClick={() => setCurrentSection('crops')} className="hover:text-emerald-400">Crop Library (Wheat & Rice)</button></li>
                <li><button onClick={() => setCurrentSection('pests')} className="hover:text-emerald-400">Pest Guide</button></li>
                <li><button onClick={() => setCurrentSection('diseases')} className="hover:text-emerald-400">Disease Information</button></li>
                <li><button onClick={() => setCurrentSection('tips')} className="hover:text-emerald-400">Farming Tips</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">
                Database Integration
              </h4>
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
            <p>© {new Date().getFullYear()} AgriNex — Smart Agriculture Knowledge Platform.</p>
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
      />

      {/* 2. Detailed Crop Profile Modal */}
      <CropDetailModal
        crop={selectedCrop}
        onClose={() => setSelectedCrop(null)}
        isOwner={isOwner}
        onEdit={(c) => {
          setSelectedCrop(null);
          setEditEntity({ type: 'crop', data: c });
        }}
        onDelete={(c) => {
          setSelectedCrop(null);
          handleDeleteCrop(c);
        }}
      />

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
          if (data.crops.length > 0) setCrops(data.crops);
          if (data.pests.length > 0) setPests(data.pests);
          if (data.diseases.length > 0) setDiseases(data.diseases);
          if (data.tips.length > 0) setTips(data.tips);
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

    </div>
  );
}
