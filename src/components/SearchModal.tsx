import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Wheat, Bug, ShieldAlert, Lightbulb, ArrowRight, CornerDownLeft, Tag } from 'lucide-react';
import { Crop, Pest, Disease, FarmingTip, CropCategory } from '../types';
import { searchAll } from '../utils/filterAndSearch';
import { CROP_CATEGORIES, resolveCropCategory } from '../utils/cropCategories';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  crops: Crop[];
  pests: Pest[];
  diseases: Disease[];
  tips: FarmingTip[];
  onSelectItem: (type: 'crop' | 'pest' | 'disease' | 'tip', item: any) => void;
  onSelectCategory?: (category: CropCategory) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  crops,
  pests,
  diseases,
  tips,
  onSelectItem,
  onSelectCategory
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'crop' | 'pest' | 'disease' | 'tip'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const rawResults = trimmedQuery ? searchAll(trimmedQuery, crops, pests, diseases, tips) : [];
  const results = activeFilter === 'all' 
    ? rawResults 
    : rawResults.filter(r => r.type === activeFilter);

  const matchedCategory = normalizedQuery.length >= 3
    ? CROP_CATEGORIES.find(cat => cat.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(cat.toLowerCase()))
    : undefined;
  const matchedCategoryCount = matchedCategory
    ? crops.filter(c => resolveCropCategory(c) === matchedCategory).length
    : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crop': return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'pest': return <Bug className="w-4 h-4 text-red-600" />;
      case 'disease': return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default: return <Lightbulb className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3 bg-stone-50/50">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops (Wheat, Pulses, Medicinal Plants, Tulsi), pests, diseases..."
            className="w-full bg-transparent text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-stone-500 hover:text-stone-800 bg-stone-200/60 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          <span className="text-xs font-semibold text-stone-400 pr-1 shrink-0">Filter:</span>
          {(['all', 'crop', 'pest', 'disease', 'tip'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {filter === 'all' ? 'All Results' : filter + 's'}
            </button>
          ))}
        </div>

        {/* Category Quick-Jump Banner when query matches a Crop Category */}
        {matchedCategory && onSelectCategory && (activeFilter === 'all' || activeFilter === 'crop') && (
          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-900 font-semibold">
              <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Category match: <strong>{matchedCategory}</strong> ({matchedCategoryCount} {matchedCategoryCount === 1 ? 'crop' : 'crops'})
              </span>
            </div>
            <button
              onClick={() => {
                onSelectCategory(matchedCategory);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <span>Open in Crop Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="p-2 sm:p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-stone-100">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-stone-500">
              <Search className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Type something to search across AgroVya</p>
              <p className="text-xs text-stone-400 mt-1">Try "Medicinal Plants", "Pulses", "Cereals", "Tulsi", "Ashwagandha", or "Rust"</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p className="text-sm font-medium">No agricultural records found for "{query}"</p>
              <p className="text-xs text-stone-400 mt-1">Check spelling or choose a different category</p>
            </div>
          ) : (
            results.map(res => (
              <div
                key={`${res.type}-${res.id}`}
                onClick={() => {
                  onSelectItem(res.type, res.item);
                  onClose();
                }}
                className="group p-3 sm:p-4 rounded-2xl hover:bg-emerald-50/70 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getTypeIcon(res.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-emerald-800 truncate">
                        {res.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 shrink-0">
                        {res.badge}
                      </span>
                    </div>
                    {res.subtitle && (
                      <p className="text-xs italic font-serif text-stone-500 truncate">
                        {res.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                      {res.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-stone-300 group-hover:text-emerald-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-400 hidden sm:flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> Select result</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
          <span>AgroVya Instant Knowledge Index</span>
        </div>

      </div>
    </div>
  );
};
