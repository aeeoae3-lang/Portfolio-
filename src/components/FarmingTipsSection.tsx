import React, { useState } from 'react';
import { Lightbulb, Clock, Users, ChevronDown, ChevronUp, Plus, Edit3, Trash2, BookOpen, Check } from 'lucide-react';
import { FarmingTip } from '../types';

interface FarmingTipsSectionProps {
  tips: FarmingTip[];
  isOwner: boolean;
  onAddTip: () => void;
  onEditTip: (tip: FarmingTip) => void;
  onDeleteTip: (tip: FarmingTip) => void;
}

export const FarmingTipsSection: React.FC<FarmingTipsSectionProps> = ({
  tips,
  isOwner,
  onAddTip,
  onEditTip,
  onDeleteTip
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(tips[0]?.id || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<'All' | 'Farmers' | 'Students'>('All');

  const categories = ['All', 'Soil Health', 'Irrigation', 'Crop Rotation', 'Pest Management'];

  const filteredTips = tips.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesAud = selectedAudience === 'All' || t.targetAudience === 'All' || t.targetAudience === selectedAudience;
    return matchesCat && matchesAud;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-12 sm:py-16 bg-stone-50/70 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              Agronomic Practices & Field Science
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Farming Tips & Student Knowledge
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Practical guides bridging soil chemistry, water conservation methods like AWD, and eco-friendly integrated pest management.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={onAddTip}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Farming Tip</span>
            </button>
          )}
        </div>

        {/* Category & Audience Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
            <span className="text-xs font-semibold text-stone-400 pl-2 pr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Audience:
            </span>
            {(['All', 'Farmers', 'Students'] as const).map(aud => (
              <button
                key={aud}
                onClick={() => setSelectedAudience(aud)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedAudience === aud
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {aud}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Accordion List */}
        <div className="space-y-4">
          {filteredTips.map(tip => {
            const isExpanded = expandedId === tip.id;
            return (
              <div
                key={tip.id}
                className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all overflow-hidden ${
                  isExpanded ? 'border-emerald-400 shadow-md ring-2 ring-emerald-50' : 'border-stone-200 hover:border-emerald-200'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(tip.id)}
                  className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {tip.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {tip.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
                        <Users className="w-3 h-3" />
                        Target: {tip.targetAudience}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-xl font-bold text-stone-900 group-hover:text-emerald-700">
                      {tip.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {tip.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditTip(tip)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-lg"
                          title="Edit Tip"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTip(tip)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-100 rounded-lg"
                          title="Delete Tip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="p-2 rounded-xl bg-stone-100 text-stone-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Full Guide */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-emerald-100 bg-emerald-50/20 animate-in fade-in">
                    <div className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed text-stone-700 whitespace-pre-line bg-white p-5 rounded-2xl border border-stone-200">
                      {tip.fullGuide}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <Check className="w-4 h-4 text-emerald-600" /> Verified Agricultural Extension Advice
                      </span>
                      <button
                        onClick={() => toggleExpand(tip.id)}
                        className="text-stone-500 hover:text-stone-800 font-semibold underline"
                      >
                        Collapse guide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
