import React from 'react';
import { Sparkles, Calendar, Layers, Eye, Edit3, Trash2, Tag, ZoomIn } from 'lucide-react';
import { Crop } from '../types';
import { resolveCropCategory, resolveVegetableSubcategory } from '../utils/cropCategories';

interface CropCardProps {
  crop: Crop;
  onSelect: (crop: Crop) => void;
  onZoom?: (crop: Crop) => void;
  galleryCount?: number;
  isOwner: boolean;
  onEdit?: (crop: Crop) => void;
  onDelete?: (crop: Crop) => void;
}

export const CropCard: React.FC<CropCardProps> = ({
  crop,
  onSelect,
  onZoom,
  galleryCount,
  isOwner,
  onEdit,
  onDelete
}) => {
  const category = resolveCropCategory(crop);
  const vegetableSubcategory = category === 'Vegetables' ? resolveVegetableSubcategory(crop) : null;

  return (
    <div className={`group relative bg-white rounded-3xl border-2 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
      crop.featured ? 'border-amber-300/80 ring-2 ring-amber-100' : 'border-stone-200 hover:border-emerald-300'
    }`}>
      
      {/* Media Container (Overlays stay siblings outside the photo button for valid accessible HTML) */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-stone-100">
        {/* Featured Ribbon */}
        {crop.featured && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Staple</span>
          </div>
        )}

        {/* Owner Quick Action Buttons */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-stone-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(crop);
              }}
              className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Edit Crop (Owner)"
              aria-label={`Edit ${crop.commonName}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(crop);
              }}
              className="p-1.5 text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Crop (Owner)"
              aria-label={`Delete ${crop.commonName}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Clickable Crop Photo Trigger (Opens full-screen zoom popup) */}
        <button
          type="button"
          onClick={() => (onZoom ? onZoom(crop) : onSelect(crop))}
          aria-label={`Zoom photo of ${crop.commonName}`}
          className="relative w-full h-full block text-left cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <img
            src={crop.imageUrl || crop.matureImageUrl || crop.floweringImageUrl || crop.seedImageUrl}
            alt={crop.commonName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/35 to-transparent" />
          
          {/* Title overlay + Zoom badge on bottom of image */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug drop-shadow-xs line-clamp-2">
                {crop.commonName}
              </h3>
              <p className="text-xs sm:text-sm italic font-serif text-emerald-200 drop-shadow-xs truncate">
                {crop.scientificName}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/55 group-hover:bg-emerald-600/95 text-white text-[11px] font-bold backdrop-blur-xs border border-white/25 transition-colors">
              <ZoomIn className="w-3 h-3" />
              <span>{galleryCount && galleryCount > 1 ? `${galleryCount} photos` : 'Zoom'}</span>
            </span>
          </div>
        </button>
      </div>

      {/* Content Details */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5">
          {/* Category, Subcategory, Family & Season Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs">
              <Tag className="w-3 h-3" />
              {category}
            </span>

            {vegetableSubcategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-semibold border border-emerald-200">
                {vegetableSubcategory}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium border border-stone-200">
              <Layers className="w-3 h-3 text-stone-500" />
              {crop.family}
            </span>

            {crop.season && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-50 text-stone-600 text-[11px] font-medium">
                <Calendar className="w-3 h-3 text-stone-400" />
                {crop.season}
              </span>
            )}
          </div>

          {/* Key Traits: Colour, Shape, Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-stone-600">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <span className="font-bold text-stone-900 block mb-0.5">Colour</span>
              <span className="line-clamp-1">{crop.colour}</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <span className="font-bold text-stone-900 block mb-0.5">Grain Size</span>
              <span className="line-clamp-1">{crop.size}</span>
            </div>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-stone-600">
            <span className="font-bold text-stone-900 block mb-0.5">Shape</span>
            <span className="line-clamp-2">{crop.shape}</span>
          </div>

          {/* Description snippet */}
          <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
            {crop.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={() => onSelect(crop)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View Full Agronomic Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
