import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import {
  Images,
  Plus,
  Edit3,
  Trash2,
  ZoomIn,
  Upload,
  Check,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Library,
  Camera
} from 'lucide-react';
import { Crop, CropPhoto } from '../types';
import { CROP_PHOTO_CAPTIONS } from '../utils/cropGallery';
import {
  validateImageFile,
  compressImageFile,
  getRecommendedPresets,
  PresetImage
} from '../utils/imageUtils';
import { ImagePickerUpload } from './ImagePickerUpload';

interface StagedPhotoUpload {
  tempId: string;
  imageUrl: string;
  caption: string;
  notes: string;
  fileName: string;
}

interface CropGallerySectionProps {
  crop: Crop;
  photos: CropPhoto[];
  isOwner: boolean;
  onOpenPhoto: (index: number) => void;
  onAddPhotos: (
    crop: Crop,
    items: Array<{ imageUrl: string; caption: string; notes?: string }>
  ) => Promise<void> | void;
  onUpdatePhoto: (crop: Crop, photo: CropPhoto) => Promise<void> | void;
  onDeletePhoto: (crop: Crop, photo: CropPhoto) => Promise<void> | void;
  onRequestOwnerMode?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80';

export const CropGallerySection: React.FC<CropGallerySectionProps> = ({
  crop,
  photos,
  isOwner,
  onOpenPhoto,
  onAddPhotos,
  onUpdatePhoto,
  onDeletePhoto,
  onRequestOwnerMode
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addModeTab, setAddModeTab] = useState<'device' | 'presets'>('device');
  const [stagedItems, setStagedItems] = useState<StagedPhotoUpload[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit existing photo state
  const [editingPhoto, setEditingPhoto] = useState<CropPhoto | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const allPresets = getRecommendedPresets('crop');

  // Strictly isolate transient upload/edit state whenever crop changes
  useEffect(() => {
    setIsAddOpen(false);
    setStagedItems([]);
    setEditingPhoto(null);
    setUploadError(null);
  }, [crop.id]);

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError(null);
    setIsProcessingFiles(true);
    const newlyStaged: StagedPhotoUpload[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      try {
        const compressed = await compressImageFile(file, 800, 600, 0.72, 95 * 1024);
        const suggestedCaption =
          CROP_PHOTO_CAPTIONS[(photos.length + stagedItems.length + newlyStaged.length) % CROP_PHOTO_CAPTIONS.length];
        newlyStaged.push({
          tempId: `stage-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          imageUrl: compressed.dataUrl,
          caption: suggestedCaption,
          notes: '',
          fileName: file.name
        });
      } catch (err: any) {
        errors.push(`${file.name}: ${err?.message || 'Could not process image'}`);
      }
    }

    if (newlyStaged.length > 0) {
      setStagedItems(prev => [...prev, ...newlyStaged]);
    }
    if (errors.length > 0) {
      setUploadError(errors.join(' '));
    }
    setIsProcessingFiles(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleTogglePreset = (preset: PresetImage) => {
    setStagedItems(prev => {
      const existing = prev.find(s => s.imageUrl === preset.url);
      if (existing) {
        return prev.filter(s => s.imageUrl !== preset.url);
      }
      const nextCaption =
        CROP_PHOTO_CAPTIONS[(photos.length + prev.length) % CROP_PHOTO_CAPTIONS.length];
      return [
        ...prev,
        {
          tempId: `preset-${preset.id}-${Date.now()}`,
          imageUrl: preset.url,
          caption: nextCaption,
          notes: preset.label,
          fileName: preset.label
        }
      ];
    });
  };

  const handleSaveBatch = async () => {
    if (stagedItems.length === 0) return;
    setIsSavingBatch(true);
    setUploadError(null);
    try {
      await onAddPhotos(
        crop,
        stagedItems.map(item => ({
          imageUrl: item.imageUrl,
          caption: item.caption.trim() || 'Mature crop',
          notes: item.notes.trim() || undefined
        }))
      );
      setStagedItems([]);
      setIsAddOpen(false);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to save gallery photos.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const openEditPhoto = (photo: CropPhoto) => {
    setIsAddOpen(false);
    setEditingPhoto(photo);
    setEditCaption(photo.caption);
    setEditNotes(photo.notes || '');
    setEditImageUrl(photo.imageUrl);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto || !editImageUrl.trim()) return;
    setIsSavingEdit(true);
    try {
      await onUpdatePhoto(crop, {
        ...editingPhoto,
        cropId: crop.id,
        imageUrl: editImageUrl.trim(),
        caption: editCaption.trim() || 'Mature crop',
        notes: editNotes.trim() || undefined
      });
      setEditingPhoto(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <section aria-labelledby="crop-gallery-heading" data-testid="crop-gallery-section" className="space-y-4">
      {/* Gallery Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-emerald-700" />
          <h3
            id="crop-gallery-heading"
            className="text-xs font-bold uppercase tracking-wider text-emerald-800"
          >
            {crop.commonName} Photo Gallery
          </h3>
          <span
            data-testid="crop-gallery-count"
            className="text-xs font-semibold text-stone-500 tabular-nums"
          >
            · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setEditingPhoto(null);
              setIsAddOpen(prev => !prev);
            }}
            aria-label={`Add photos to ${crop.commonName} gallery`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAddOpen
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
            }`}
          >
            {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAddOpen ? 'Close Uploader' : 'Add Photos'}</span>
          </button>
        ) : (
          onRequestOwnerMode && (
            <button
              type="button"
              onClick={onRequestOwnerMode}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin: Manage Photos</span>
            </button>
          )
        )}
      </div>

      {/* Inline Multi-Photo Upload Panel (Admin Only) */}
      {isOwner && isAddOpen && (
        <div
          data-testid="gallery-add-panel"
          className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                Upload Multiple Photos for {crop.commonName}
              </p>
              <p className="text-[11px] text-emerald-800/80">
                Photos added here are saved exclusively to {crop.commonName} and never mixed with other crops.
              </p>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-emerald-200 text-xs">
              <button
                type="button"
                onClick={() => setAddModeTab('device')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  addModeTab === 'device' ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Device Files</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModeTab('presets')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  addModeTab === 'presets' ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Library className="w-3 h-3" />
                <span>Stage Presets</span>
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{uploadError}</span>
            </div>
          )}

          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/*"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label={`Select multiple photos for ${crop.commonName}`}
            data-testid="gallery-multi-file-input"
          />

          {addModeTab === 'device' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-100/70'
                  : 'border-emerald-300 bg-white hover:border-emerald-500'
              }`}
            >
              <Camera className="w-6 h-6 text-emerald-600 mb-1.5" />
              <p className="text-xs font-bold text-stone-800">
                {isProcessingFiles
                  ? 'Optimizing selected photos...'
                  : 'Drop multiple crop photos here or tap to choose from device'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Select multiple JPG, PNG, or WebP photos at once (Seed, Seedling, Flowering, Pest damage, etc.)
              </p>
              <button
                type="button"
                disabled={isProcessingFiles}
                onClick={() => multiFileInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Multiple Photos</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 bg-white rounded-xl border border-emerald-100">
              {allPresets.map(preset => {
                const isPicked = stagedItems.some(s => s.imageUrl === preset.url);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleTogglePreset(preset)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                      isPicked
                        ? 'border-emerald-600 ring-2 ring-emerald-200'
                        : 'border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="h-16 w-full bg-stone-100">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1 text-[10px] font-bold text-stone-800 truncate bg-white">
                      {preset.label}
                    </div>
                    {isPicked && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Staged Photos Queue with Caption Selection */}
          {stagedItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span>Ready to Upload ({stagedItems.length})</span>
                <button
                  type="button"
                  onClick={() => setStagedItems([])}
                  className="text-stone-500 hover:text-red-600 font-semibold cursor-pointer"
                >
                  Clear queue
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {stagedItems.map((item, idx) => (
                  <div
                    key={item.tempId}
                    className="flex flex-col sm:flex-row gap-3 bg-white p-2.5 rounded-xl border border-emerald-200 items-start sm:items-center"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.fileName}
                      className="w-full sm:w-20 h-24 sm:h-16 rounded-lg object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          Stage / Caption
                        </label>
                        <select
                          aria-label={`Caption preset for photo ${idx + 1}`}
                          value={
                            (CROP_PHOTO_CAPTIONS as readonly string[]).includes(item.caption)
                              ? item.caption
                              : '__custom__'
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setStagedItems(prev =>
                              prev.map(p =>
                                p.tempId === item.tempId
                                  ? { ...p, caption: val === '__custom__' ? '' : val }
                                  : p
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 text-xs font-semibold border border-stone-300 rounded-lg bg-white"
                        >
                          {CROP_PHOTO_CAPTIONS.map(c => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="__custom__">Custom caption...</option>
                        </select>
                        {!(CROP_PHOTO_CAPTIONS as readonly string[]).includes(item.caption) && (
                          <input
                            type="text"
                            value={item.caption}
                            onChange={(e) =>
                              setStagedItems(prev =>
                                prev.map(p =>
                                  p.tempId === item.tempId ? { ...p, caption: e.target.value } : p
                                )
                              )
                            }
                            placeholder="Enter custom caption..."
                            className="mt-1 w-full px-2 py-1 text-xs border border-stone-300 rounded-lg"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          Observation Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) =>
                            setStagedItems(prev =>
                              prev.map(p =>
                                p.tempId === item.tempId ? { ...p, notes: e.target.value } : p
                              )
                            )
                          }
                          placeholder="e.g. Healthy leaf canopy"
                          className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStagedItems(prev => prev.filter(p => p.tempId !== item.tempId))}
                      aria-label={`Remove staged photo ${idx + 1}`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 self-end sm:self-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStagedItems([]);
                    setIsAddOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingBatch}
                  onClick={handleSaveBatch}
                  data-testid="save-gallery-batch-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Save {stagedItems.length} {stagedItems.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Edit Photo Panel (Admin Only) */}
      {isOwner && editingPhoto && (
        <form
          onSubmit={handleSaveEdit}
          data-testid="gallery-edit-panel"
          className="bg-stone-50 border border-emerald-300 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900">
              Update Gallery Photo ({crop.commonName})
            </h4>
            <button
              type="button"
              onClick={() => setEditingPhoto(null)}
              aria-label="Cancel photo edit"
              className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">Caption / Growth Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {CROP_PHOTO_CAPTIONS.map(presetCaption => (
                <button
                  key={presetCaption}
                  type="button"
                  onClick={() => setEditCaption(presetCaption)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    editCaption === presetCaption
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-400'
                  }`}
                >
                  {presetCaption}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Photo caption (e.g. Vegetative stage)"
              aria-label="Photo caption"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observation Note (Optional)
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Field observations, symptoms, or stage details..."
              aria-label="Photo observation note"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-xl bg-white"
            />
          </div>

          <ImagePickerUpload
            value={editImageUrl}
            onChange={(val) => setEditImageUrl(val)}
            label="Replace Photo (Optional)"
            category="crop"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingPhoto(null)}
              className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit || !editImageUrl.trim()}
              data-testid="save-edited-photo-btn"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Update Photo</span>
            </button>
          </div>
        </form>
      )}

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-center space-y-2">
          <Images className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-stone-700">
            No gallery photos uploaded for {crop.commonName} yet
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Crop Photos</span>
            </button>
          )}
        </div>
      ) : (
        <div
          data-testid="crop-gallery-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              data-testid={`gallery-item-${index}`}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs hover:shadow-md transition-all"
            >
              <button
                type="button"
                onClick={() => onOpenPhoto(index)}
                aria-label={`Open ${photo.caption} photo of ${crop.commonName}`}
                className="relative w-full h-full block text-left cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <img
                  src={photo.imageUrl}
                  alt={`${crop.commonName} - ${photo.caption}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <span className="block text-xs font-bold leading-tight truncate drop-shadow-xs">
                      {photo.caption}
                    </span>
                    {photo.notes && (
                      <span className="block text-[10px] text-emerald-200/95 truncate mt-0.5">
                        {photo.notes}
                      </span>
                    )}
                  </div>
                  <span className="p-1 rounded-md bg-black/50 text-white opacity-85 group-hover:opacity-100 group-hover:bg-emerald-600 transition-colors shrink-0">
                    <ZoomIn className="w-3 h-3" />
                  </span>
                </div>
              </button>

              {/* Sibling Admin Controls (Update / Delete) */}
              {isOwner && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => openEditPhoto(photo)}
                    aria-label={`Edit photo ${photo.caption}`}
                    title="Edit caption or photo"
                    className="p-1.5 rounded-md text-stone-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(crop, photo)}
                    aria-label={`Delete photo ${photo.caption}`}
                    title="Delete photo from gallery"
                    className="p-1.5 rounded-md text-stone-700 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
