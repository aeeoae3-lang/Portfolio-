import React, { useState, useRef } from 'react';
import { X, Save, Wheat, Bug, ShieldAlert, Lightbulb, Loader2, AlertCircle, Tag, Images, Upload, Trash2 } from 'lucide-react';
import { Crop, Pest, Disease, FarmingTip } from '../types';
import { ImagePickerUpload } from './ImagePickerUpload';
import { CROP_PHOTO_CAPTIONS } from '../utils/cropGallery';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';
import {
  CROP_CATEGORIES,
  VEGETABLE_SUBCATEGORIES,
  resolveCropCategory,
  resolveVegetableSubcategory
} from '../utils/cropCategories';

export type ExtraGalleryDraft = { imageUrl: string; caption: string; notes?: string };

export type EditEntity =
  | { type: 'crop'; data: Partial<Crop>; extraPhotos?: ExtraGalleryDraft[] }
  | { type: 'pest'; data: Partial<Pest> }
  | { type: 'disease'; data: Partial<Disease> }
  | { type: 'tip'; data: Partial<FarmingTip> };

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: EditEntity | null;
  onSave: (entity: EditEntity) => Promise<boolean | void> | void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave
}) => {
  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {entity.type === 'crop' && (
          <CropEditForm
            key={entity.data.id || 'new-crop'}
            initial={entity.data}
            onClose={onClose}
            onSave={(data, extraPhotos) => onSave({ type: 'crop', data, extraPhotos })}
          />
        )}
        {entity.type === 'pest' && (
          <PestEditForm
            key={entity.data.id || 'new-pest'}
            initial={entity.data}
            onClose={onClose}
            onSave={(data) => onSave({ type: 'pest', data })}
          />
        )}
        {entity.type === 'disease' && (
          <DiseaseEditForm
            key={entity.data.id || 'new-disease'}
            initial={entity.data}
            onClose={onClose}
            onSave={(data) => onSave({ type: 'disease', data })}
          />
        )}
        {entity.type === 'tip' && (
          <TipEditForm
            key={entity.data.id || 'new-tip'}
            initial={entity.data}
            onClose={onClose}
            onSave={(data) => onSave({ type: 'tip', data })}
          />
        )}
      </div>
    </div>
  );
};

const DEFAULT_CROP_IMAGE =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80';

// Crop Edit Form
function CropEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Crop>;
  onClose: () => void;
  onSave: (data: Crop, extraPhotos?: ExtraGalleryDraft[]) => Promise<boolean | void> | void;
}) {
  const initialCategory = resolveCropCategory(initial);
  const [formData, setFormData] = useState<Crop>({
    id: initial.id || `crop-${Date.now()}`,
    commonName: initial.commonName || '',
    scientificName: initial.scientificName || '',
    family: initial.family || 'Poaceae (Gramineae)',
    cropCategory: initialCategory,
    category: initialCategory,
    subcategory: initial.subcategory || (initialCategory === 'Vegetables' ? resolveVegetableSubcategory(initial) : 'Fruiting Vegetables'),
    colour: initial.colour || '',
    shape: initial.shape || '',
    size: initial.size || '',
    description: initial.description || '',
    imageUrl: initial.imageUrl || '',
    seedImageUrl: initial.seedImageUrl || '',
    floweringImageUrl: initial.floweringImageUrl || '',
    matureImageUrl: initial.matureImageUrl || '',
    season: initial.season || 'Rabi / Winter',
    soilType: initial.soilType || 'Loam',
    waterRequirement: initial.waterRequirement || '400 - 600 mm',
    growthDuration: initial.growthDuration || '120 days',
    featured: initial.featured ?? false,
    createdAt: initial.createdAt
  });
  const [extraPhotos, setExtraPhotos] = useState<ExtraGalleryDraft[]>([]);
  const [isProcessingExtra, setIsProcessingExtra] = useState(false);
  const [processingStageCount, setProcessingStageCount] = useState(0);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStageProcessingChange = (busy: boolean) => {
    setProcessingStageCount(prev => Math.max(0, prev + (busy ? 1 : -1)));
  };
  const isBusyProcessingImages = isProcessingExtra || processingStageCount > 0;

  const handleExtraFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingExtra(true);
    const items: ExtraGalleryDraft[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validateImageFile(file).valid) continue;
      try {
        const res = await compressImageFile(file, 720, 540, 0.72, 95 * 1024);
        items.push({
          imageUrl: res.dataUrl,
          caption: CROP_PHOTO_CAPTIONS[(extraPhotos.length + items.length) % CROP_PHOTO_CAPTIONS.length],
          notes: ''
        });
      } catch {
        // skip unreadable file
      }
    }
    if (items.length > 0) {
      setExtraPhotos(prev => [...prev, ...items]);
    }
    setIsProcessingExtra(false);
    if (extraFileRef.current) extraFileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isBusyProcessingImages) return;
    const cleanCommonName = formData.commonName.trim();
    if (!cleanCommonName) {
      setErrorMessage('Crop Name is required. Please provide a common name (e.g. Barley, Mustard).');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const resolvedCat = resolveCropCategory(formData);
      const nowIso = new Date().toISOString();
      const seedPhoto = (formData.seedImageUrl || '').trim();
      const floweringPhoto = (formData.floweringImageUrl || '').trim();
      const maturePhoto = (formData.matureImageUrl || '').trim();
      const primaryCover =
        maturePhoto ||
        floweringPhoto ||
        seedPhoto ||
        (formData.imageUrl || '').trim() ||
        DEFAULT_CROP_IMAGE;

      const sanitized: Crop = {
        id: formData.id || `crop-${Date.now()}`,
        commonName: cleanCommonName,
        scientificName: (formData.scientificName || '').trim(),
        family: (formData.family || 'Poaceae (Gramineae)').trim(),
        cropCategory: resolvedCat,
        category: resolvedCat,
        subcategory: resolvedCat === 'Vegetables' ? (formData.subcategory || 'Fruiting Vegetables') : undefined,
        colour: (formData.colour || '').trim(),
        shape: (formData.shape || '').trim(),
        size: (formData.size || '').trim(),
        description: (formData.description || '').trim(),
        imageUrl: primaryCover,
        seedImageUrl: seedPhoto || undefined,
        floweringImageUrl: floweringPhoto || undefined,
        matureImageUrl: maturePhoto || undefined,
        season: (formData.season || '').trim(),
        soilType: (formData.soilType || '').trim(),
        waterRequirement: (formData.waterRequirement || '').trim(),
        growthDuration: (formData.growthDuration || '').trim(),
        featured: Boolean(formData.featured),
        createdAt: formData.createdAt || nowIso,
        updatedAt: nowIso
      };

      await onSave(sanitized, extraPhotos.length > 0 ? extraPhotos : undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save crop. Please verify your permissions and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="p-5 bg-emerald-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Wheat className="w-5 h-5 text-emerald-200" />
          <h3 id="edit-modal-title" className="text-lg font-bold">
            {initial.commonName ? `Edit Crop: ${initial.commonName}` : 'Add New Agricultural Crop'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="p-1 rounded-lg text-emerald-200 hover:text-white disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs sm:text-sm">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to save crop</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Crop Name (Common Name) <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.commonName}
              onChange={(e) => {
                setFormData({ ...formData, commonName: e.target.value });
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500 font-semibold"
              placeholder="e.g. Barley"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Scientific Name (Botanical)</label>
            <input
              type="text"
              value={formData.scientificName}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500 italic"
              placeholder="e.g. Hordeum vulgare"
            />
          </div>
        </div>

        {/* Agricultural Crop Category & Vegetable Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
          <div>
            <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Crop Category *</span>
            </label>
            <select
              value={formData.cropCategory}
              onChange={(e) => setFormData({ ...formData, cropCategory: e.target.value as any, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              {CROP_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {formData.cropCategory === 'Vegetables' ? (
            <div>
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Vegetable Subcategory *</span>
              </label>
              <select
                value={formData.subcategory || 'Fruiting Vegetables'}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value as any })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
              >
                {VEGETABLE_SUBCATEGORIES.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-stone-700 mb-1">Botanical Family</label>
              <input
                type="text"
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500"
                placeholder="e.g. Poaceae (Gramineae)"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formData.cropCategory === 'Vegetables' && (
            <div>
              <label className="block font-bold text-stone-700 mb-1">Botanical Family</label>
              <input
                type="text"
                value={formData.family}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                placeholder="e.g. Solanaceae, Brassicaceae"
              />
            </div>
          )}
          <div className={formData.cropCategory === 'Vegetables' ? '' : 'sm:col-span-2'}>
            <label className="block font-bold text-stone-700 mb-1">Grain / Seed / Produce Colour</label>
            <input
              type="text"
              value={formData.colour}
              onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Pale straw yellow to amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Grain / Seed Shape</label>
            <input
              type="text"
              value={formData.shape}
              onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Spindle-shaped grain with tapered ends"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Size Specification</label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. 6 to 9 mm length, 2.8 to 3.5 mm width"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Agronomic Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
            placeholder="Detailed botanical summary, cultivation habits, and importance..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Season</label>
            <input
              type="text"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Rabi / Winter"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Soil Type</label>
            <input
              type="text"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Well-drained loam"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Water Requirement</label>
            <input
              type="text"
              value={formData.waterRequirement}
              onChange={(e) => setFormData({ ...formData, waterRequirement: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. 350 - 500 mm"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Growth Duration</label>
            <input
              type="text"
              value={formData.growthDuration}
              onChange={(e) => setFormData({ ...formData, growthDuration: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. 110 - 130 days"
            />
          </div>
        </div>

        {/* 3 Separate Crop Growth Stage Photo Sections */}
        <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-5">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2">
              <Images className="w-4 h-4 text-emerald-600" />
              <span>Crop Stage Photo Columns (Device Gallery Upload)</span>
            </h4>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              Select photos directly from your device for each growth stage. Saved permanently to this crop&apos;s Seed Photo, Flowering Stage Photo, and Mature Crop Photo columns.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
              <ImagePickerUpload
                testId="seed-photo-uploader"
                value={formData.seedImageUrl}
                onChange={(val) => setFormData(prev => ({ ...prev, seedImageUrl: val }))}
                onProcessingChange={handleStageProcessingChange}
                label="Seed Photo"
                category="crop"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
              <ImagePickerUpload
                testId="flowering-photo-uploader"
                value={formData.floweringImageUrl}
                onChange={(val) => setFormData(prev => ({ ...prev, floweringImageUrl: val }))}
                onProcessingChange={handleStageProcessingChange}
                label="Flowering Stage Photo"
                category="crop"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
              <ImagePickerUpload
                testId="mature-photo-uploader"
                value={formData.matureImageUrl}
                onChange={(val) => setFormData(prev => ({
                  ...prev,
                  matureImageUrl: val,
                  imageUrl: val || prev.imageUrl
                }))}
                onProcessingChange={handleStageProcessingChange}
                label="Mature Crop Photo"
                category="crop"
              />
            </div>
          </div>
        </div>

        {/* Additional Multi-Photo Gallery Queue */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Images className="w-4 h-4 text-emerald-600" />
              <span>Additional Gallery Photos (Optional)</span>
            </div>
            <button
              type="button"
              disabled={isProcessingExtra}
              onClick={() => extraFileRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessingExtra ? 'Processing...' : 'Select Multiple Photos'}</span>
            </button>
          </div>
          <input
            ref={extraFileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/*"
            onChange={(e) => handleExtraFiles(e.target.files)}
            className="hidden"
          />
          {extraPhotos.length > 0 && (
            <div className="space-y-2 pt-1">
              {extraPhotos.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-emerald-100">
                  <img src={item.imageUrl} alt={`Stage ${idx + 1}`} className="w-12 h-10 rounded-lg object-cover shrink-0" />
                  <select
                    value={item.caption}
                    onChange={(e) =>
                      setExtraPhotos(prev => prev.map((p, i) => (i === idx ? { ...p, caption: e.target.value } : p)))
                    }
                    className="flex-1 px-2 py-1.5 text-xs font-semibold border border-stone-200 rounded-lg bg-white"
                  >
                    {CROP_PHOTO_CAPTIONS.map(cap => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setExtraPhotos(prev => prev.filter((_, i) => i !== idx))}
                    aria-label={`Remove extra photo ${idx + 1}`}
                    className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="featuredCrop"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded-sm"
          />
          <label htmlFor="featuredCrop" className="font-bold text-stone-700 cursor-pointer">
            Mark as Featured Crop on Homepage (like Wheat or Rice)
          </label>
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isBusyProcessingImages}
          data-testid="save-crop-btn"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Crop...</span>
            </>
          ) : isBusyProcessingImages ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Photo...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{initial.commonName ? 'Save Changes' : 'Save Crop'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Pest Edit Form
function PestEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Pest>;
  onClose: () => void;
  onSave: (data: Pest) => Promise<boolean | void> | void;
}) {
  const [formData, setFormData] = useState<Pest>({
    id: initial.id || `pest-${Date.now()}`,
    name: initial.name || '',
    scientificName: initial.scientificName || '',
    affectedCrops: initial.affectedCrops || ['Rice'],
    symptoms: initial.symptoms || '',
    prevention: initial.prevention || '',
    controlMethod: initial.controlMethod || '',
    imageUrl: initial.imageUrl || '',
    severity: initial.severity || 'Moderate',
    createdAt: initial.createdAt
  });

  const [cropsText, setCropsText] = useState(formData.affectedCrops.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim()) {
      setErrorMessage('Pest Name is required.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const crops = cropsText.split(',').map(s => s.trim()).filter(Boolean);
      const nowIso = new Date().toISOString();
      await onSave({
        ...formData,
        name: formData.name.trim(),
        scientificName: formData.scientificName.trim(),
        affectedCrops: crops,
        createdAt: formData.createdAt || nowIso,
        updatedAt: nowIso
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save pest record.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="p-5 bg-red-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-red-200" />
          <h3 id="edit-modal-title" className="text-lg font-bold">
            {initial.name ? `Edit Pest: ${initial.name}` : 'Add New Agricultural Pest'}
          </h3>
        </div>
        <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 rounded-lg text-red-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs sm:text-sm">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Pest Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Scientific Name</label>
            <input
              type="text"
              value={formData.scientificName}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl italic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Vulnerable Crops (comma separated)</label>
            <input
              type="text"
              value={cropsText}
              onChange={(e) => setCropsText(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Rice, Wheat, Maize"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Threat Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Field Symptoms</label>
          <textarea
            rows={2}
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Control & Bio-Remediation Methods</label>
          <textarea
            rows={2}
            value={formData.controlMethod}
            onChange={(e) => setFormData({ ...formData, controlMethod: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Cultural Prevention</label>
          <input
            type="text"
            value={formData.prevention}
            onChange={(e) => setFormData({ ...formData, prevention: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <ImagePickerUpload
          testId="pest-photo-uploader"
          value={formData.imageUrl}
          onChange={(val) => setFormData({ ...formData, imageUrl: val })}
          label="Pest Photo / Field Damage"
          category="pest"
        />
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 shrink-0">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSubmitting ? 'Saving...' : 'Save Pest'}</span>
        </button>
      </div>
    </form>
  );
}

// Disease Edit Form
function DiseaseEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Disease>;
  onClose: () => void;
  onSave: (data: Disease) => Promise<boolean | void> | void;
}) {
  const [formData, setFormData] = useState<Disease>({
    id: initial.id || `disease-${Date.now()}`,
    name: initial.name || '',
    causalOrganism: initial.causalOrganism || '',
    pathogenType: initial.pathogenType || 'Fungal',
    affectedCrops: initial.affectedCrops || ['Wheat'],
    symptoms: initial.symptoms || '',
    treatment: initial.treatment || '',
    prevention: initial.prevention || '',
    imageUrl: initial.imageUrl || '',
    createdAt: initial.createdAt
  });

  const [cropsText, setCropsText] = useState(formData.affectedCrops.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim()) {
      setErrorMessage('Disease Name is required.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const crops = cropsText.split(',').map(s => s.trim()).filter(Boolean);
      const nowIso = new Date().toISOString();
      await onSave({
        ...formData,
        name: formData.name.trim(),
        causalOrganism: formData.causalOrganism.trim(),
        affectedCrops: crops,
        createdAt: formData.createdAt || nowIso,
        updatedAt: nowIso
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save disease record.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="p-5 bg-purple-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-200" />
          <h3 id="edit-modal-title" className="text-lg font-bold">
            {initial.name ? `Edit Disease: ${initial.name}` : 'Add New Plant Disease'}
          </h3>
        </div>
        <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 rounded-lg text-purple-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs sm:text-sm">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Disease Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Causal Organism</label>
            <input
              type="text"
              value={formData.causalOrganism}
              onChange={(e) => setFormData({ ...formData, causalOrganism: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl italic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Pathogen Classification</label>
            <select
              value={formData.pathogenType}
              onChange={(e) => setFormData({ ...formData, pathogenType: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Fungal">Fungal</option>
              <option value="Bacterial">Bacterial</option>
              <option value="Viral">Viral</option>
              <option value="Nematode">Nematode</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Host Crops (comma separated)</label>
            <input
              type="text"
              value={cropsText}
              onChange={(e) => setCropsText(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Diagnostic Symptoms</label>
          <textarea
            rows={2}
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Chemical & Cultural Treatment</label>
          <textarea
            rows={2}
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <ImagePickerUpload
          testId="disease-photo-uploader"
          value={formData.imageUrl}
          onChange={(val) => setFormData({ ...formData, imageUrl: val })}
          label="Plant Disease Symptom Photo"
          category="disease"
        />
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 shrink-0">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSubmitting ? 'Saving...' : 'Save Disease'}</span>
        </button>
      </div>
    </form>
  );
}

// Tip Edit Form
function TipEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<FarmingTip>;
  onClose: () => void;
  onSave: (data: FarmingTip) => Promise<boolean | void> | void;
}) {
  const [formData, setFormData] = useState<FarmingTip>({
    id: initial.id || `tip-${Date.now()}`,
    title: initial.title || '',
    category: initial.category || 'Crop Rotation',
    summary: initial.summary || '',
    fullGuide: initial.fullGuide || '',
    targetAudience: initial.targetAudience || 'All',
    readTime: initial.readTime || '3 min read',
    imageUrl: initial.imageUrl || '',
    createdAt: initial.createdAt
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.title.trim()) {
      setErrorMessage('Tip Title is required.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      await onSave({
        ...formData,
        title: formData.title.trim(),
        imageUrl: formData.imageUrl?.trim() || undefined,
        createdAt: formData.createdAt || nowIso,
        updatedAt: nowIso
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save farming tip.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
      <div className="p-5 bg-emerald-800 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-emerald-200" />
          <h3 id="edit-modal-title" className="text-lg font-bold">
            {initial.title ? `Edit Tip: ${initial.title}` : 'Add New Farming Tip'}
          </h3>
        </div>
        <button type="button" onClick={onClose} disabled={isSubmitting} className="p-1 rounded-lg text-emerald-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs sm:text-sm">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block font-bold text-stone-700 mb-1">Tip Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Soil Health">Soil Health</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Crop Rotation">Crop Rotation</option>
              <option value="Pest Management">Pest Management</option>
              <option value="Harvesting">Harvesting</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Target Audience</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="All">All</option>
              <option value="Farmers">Farmers</option>
              <option value="Students">Students</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Read Time</label>
            <input
              type="text"
              value={formData.readTime}
              onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Summary (1-2 sentences)</label>
          <textarea
            rows={2}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Full Detailed Guide & Science</label>
          <textarea
            rows={5}
            value={formData.fullGuide}
            onChange={(e) => setFormData({ ...formData, fullGuide: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-xs"
          />
        </div>

        <ImagePickerUpload
          testId="tip-photo-uploader"
          value={formData.imageUrl}
          onChange={(val) => setFormData({ ...formData, imageUrl: val })}
          label="Farming Guide Photo (Optional)"
          category="tip"
        />
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2 shrink-0">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSubmitting ? 'Saving...' : 'Save Farming Tip'}</span>
        </button>
      </div>
    </form>
  );
}
