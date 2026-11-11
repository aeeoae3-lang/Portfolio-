import React from 'react';
import { X, Sparkles, Droplets, Sun, Sprout, Clock, Layers, Edit3, Trash2 } from 'lucide-react';
import { Crop } from '../types';

interface CropDetailModalProps {
  crop: Crop | null;
  onClose: () => void;
  isOwner: boolean;
  onEdit?: (crop: Crop) => void;
  onDelete?: (crop: Crop) => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  crop,
  onClose,
  isOwner,
  onEdit,
  onDelete
}) => {
  if (!crop) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        
        {/* Header Media */}
        <div className="relative h-64 sm:h-80 w-full bg-stone-900">
          <img
            src={crop.imageUrl}
            alt={crop.commonName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges and Names */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {crop.featured && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  Primary Featured Crop
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
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
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Morphological Physical Traits */}
          <div>
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

          <div className="flex items-center gap-2">
            {isOwner && (
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
