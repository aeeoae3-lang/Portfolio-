import React from 'react';
import { X, Sparkles, Droplets, Sun, Sprout, Clock, Layers, Edit3, Trash2, Tag, ZoomIn, ShieldCheck, Camera } from 'lucide-react';
import { Crop, CropPhoto } from '../types';
import { resolveCropCategory, resolveVegetableSubcategory } from '../utils/cropCategories';
import { CropGallerySection } from './CropGallerySection';

interface CropDetailModalProps {
  crop: Crop | null;
  galleryPhotos: CropPhoto[];
  onClose: () => void;
  onZoom?: (crop: Crop, photoIndex?: number) => void;
  isOwner: boolean;
  onEdit?: (crop: Crop) => void;
  onDelete?: (crop: Crop) => void;
  onAddPhotos: (
    crop: Crop,
    items: Array<{ imageUrl: string; caption: string; notes?: string }>
  ) => Promise<void> | void;
  onUpdatePhoto: (crop: Crop, photo: CropPhoto) => Promise<void> | void;
  onDeletePhoto: (crop: Crop, photo: CropPhoto) => Promise<void> | void;
  onRequestOwnerMode?: () => void;
}

const FALLBACK_STAGE_IMAGE =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80';

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  galleryPhotos,
  onClose,
  onZoom,
  isOwner,
  onEdit,
  onDelete,
  onAddPhotos,
  onUpdatePhoto,
  onDeletePhoto,
  onRequestOwnerMode
}) => {
  if (!crop) return null;

  const category = resolveCropCategory(crop);
  const vegetableSubcategory = category === 'Vegetables' ? resolveVegetableSubcategory(crop) : null;
  const heroImageUrl = galleryPhotos[0]?.imageUrl || crop.matureImageUrl || crop.imageUrl;

  const stageSlots = [
    {
      key: 'seed',
      label: 'Seed Photo',
      imageUrl:
        crop.seedImageUrl ||
        galleryPhotos.find(p => p.caption.toLowerCase() === 'seed')?.imageUrl ||
        '',
      emptyHint: 'No Seed Photo uploaded'
    },
    {
      key: 'flowering',
      label: 'Flowering Stage Photo',
      imageUrl:
        crop.floweringImageUrl ||
        galleryPhotos.find(p => p.caption.toLowerCase() === 'flowering stage')?.imageUrl ||
        '',
      emptyHint: 'No Flowering Stage Photo uploaded'
    },
    {
      key: 'mature',
      label: 'Mature Crop Photo',
      imageUrl:
        crop.matureImageUrl ||
        galleryPhotos.find(p => p.caption.toLowerCase() === 'mature crop')?.imageUrl ||
        '',
      emptyHint: 'No Mature Crop Photo uploaded'
    }
  ] as const;

  const handleOpenStagePhoto = (imageUrl: string) => {
    const idx = galleryPhotos.findIndex(p => p.imageUrl === imageUrl);
    onZoom?.(crop, idx >= 0 ? idx : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        data-testid="crop-detail-modal"
      >
        {/* Header Media */}
        <div className="relative h-60 sm:h-76 w-full bg-stone-900 group">
          <button
            type="button"
            onClick={() => onZoom?.(crop, 0)}
            aria-label={`Zoom photo of ${crop.commonName}`}
            className="relative w-full h-full block text-left cursor-zoom-in focus:outline-hidden"
          >
            <img
              src={heroImageUrl}
              alt={crop.commonName}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_STAGE_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />

            {/* Tap to zoom badge */}
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 group-hover:bg-emerald-600/95 text-white text-xs font-bold border border-white/20 transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>
                {galleryPhotos.length > 1
                  ? `Tap photo to zoom · ${galleryPhotos.length} photos`
                  : 'Tap photo to zoom'}
              </span>
            </span>

            {/* Badges and Names */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {crop.featured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    Primary Featured Crop
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md">
                  <Tag className="w-3.5 h-3.5" />
                  {category}
                </span>
                {vegetableSubcategory && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-xs font-bold shadow-md">
                    {vegetableSubcategory}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-white/25 text-white text-xs font-semibold">
                  {crop.family}
                </span>
              </div>

              <h2 id="crop-modal-title" className="text-3xl sm:text-4xl font-black tracking-tight">
                {crop.commonName}
              </h2>
              <p className="text-base sm:text-lg italic font-serif text-emerald-200 mt-0.5">
                {crop.scientificName}
              </p>
            </div>
          </button>

          {/* Close Button (sibling outside photo zoom button) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6 max-h-[64vh] overflow-y-auto">
          {/* 3 Dedicated Crop Stage Photo Sections: Seed Photo, Flowering Stage Photo, Mature Crop Photo */}
          <section aria-labelledby="crop-stage-photos-heading" data-testid="crop-stage-photos-section" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                id="crop-stage-photos-heading"
                className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Crop Stage Photos (Seed · Flowering · Mature)</span>
              </h3>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(crop);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Edit Stage Photos
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stageSlots.map((slot) => (
                <div
                  key={slot.key}
                  data-testid={`stage-photo-${slot.key}`}
                  className="rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden flex flex-col"
                >
                  <div className="px-3 py-2 bg-emerald-50/70 border-b border-emerald-100 text-xs font-bold text-emerald-950">
                    {slot.label}
                  </div>
                  {slot.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => handleOpenStagePhoto(slot.imageUrl)}
                      aria-label={`View ${slot.label} for ${crop.commonName}`}
                      className="relative aspect-[4/3] w-full bg-stone-200 group overflow-hidden cursor-zoom-in focus:outline-hidden"
                    >
                      <img
                        src={slot.imageUrl}
                        alt={`${crop.commonName} — ${slot.label}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_STAGE_IMAGE;
                        }}
                      />
                      <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/55 text-white opacity-85 group-hover:bg-emerald-600 transition-colors">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ) : (
                    <div className="aspect-[4/3] w-full flex flex-col items-center justify-center p-4 text-center text-stone-400">
                      <Camera className="w-6 h-6 mb-1.5 opacity-60" />
                      <span className="text-xs font-medium text-stone-500">{slot.emptyHint}</span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEdit?.(crop);
                          }}
                          className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Upload Photo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Multiple Photos Gallery (Strictly isolated to this crop) */}
          <CropGallerySection
            crop={crop}
            photos={galleryPhotos}
            isOwner={isOwner}
            onOpenPhoto={(idx) => onZoom?.(crop, idx)}
            onAddPhotos={onAddPhotos}
            onUpdatePhoto={onUpdatePhoto}
            onDeletePhoto={onDeletePhoto}
            onRequestOwnerMode={onRequestOwnerMode}
          />

          {/* Morphological Physical Traits */}
          <div className="pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Morphological & Physical Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block mb-1">Colour</span>
                <span className="text-sm font-semibold text-stone-900 leading-snug">{crop.colour}</span>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block mb-1">Shape</span>
                <span className="text-sm font-semibold text-stone-900 leading-snug">{crop.shape}</span>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block mb-1">Grain / Seed Size</span>
                <span className="text-sm font-semibold text-stone-900 leading-snug">{crop.size}</span>
              </div>
            </div>
          </div>

          {/* Detailed Agronomic Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
              Comprehensive Agronomic Overview
            </h3>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
              {crop.description}
            </p>
          </div>

          {/* Cultivation & Environmental Requirements */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
              Cultivation & Growing Conditions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <Sun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800 block">Sowing Season</span>
                  <span className="text-stone-600">{crop.season || 'Standard growing window'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <Sprout className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800 block">Soil Preferences</span>
                  <span className="text-stone-600">{crop.soilType || 'Loamy fertile soil'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <Droplets className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800 block">Water & Irrigation</span>
                  <span className="text-stone-600">{crop.waterRequirement || 'Moderate moisture requirements'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <Clock className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-800 block">Growth Duration</span>
                  <span className="text-stone-600">{crop.growthDuration || '100-140 days'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            Botanical family: <strong className="text-stone-800">{crop.family}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit?.(crop);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Crop
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete?.(crop);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            ) : (
              onRequestOwnerMode && (
                <button
                  type="button"
                  onClick={onRequestOwnerMode}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Owner: Edit / Delete</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
