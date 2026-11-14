import React from 'react';
import { Search, ShieldAlert, Bug, Wheat, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { SectionType } from '../types';

interface HeroProps {
  onSearchFocus: () => void;
  onNavigate: (section: SectionType) => void;
  cropCount: number;
  pestCount: number;
  diseaseCount: number;
  tipCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  onSearchFocus,
  onNavigate,
  cropCount,
  pestCount,
  diseaseCount,
  tipCount
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-stone-50/30 pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-emerald-100/60">
      {/* Subtle organic background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-green-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Welcome Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold tracking-wide mb-6 shadow-2xs">
          <img
            src="/assets/aistudio/Screenshot_20261111-175134_8465347c.png"
            alt="AgroVya"
            className="w-4 h-4 rounded-full object-cover"
          />
          <span>Agricultural Knowledge & Field Intelligence</span>
        </div>

        {/* Welcome Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.15]">
          Smart Farming <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy decoration-2">Starts Here!</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-normal">
          AgroVya empowers agricultural students, modern farmers, and agronomists with verified crop profiles, scientific pest control, plant pathology diagnostics, and sustainable soil practices.
        </p>

        {/* Interactive Search Bar */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <div 
            onClick={onSearchFocus}
            className="group relative flex items-center bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-950/5 border-2 border-emerald-200 hover:border-emerald-500 transition-all p-2 sm:p-2.5 cursor-pointer"
          >
            <div className="pl-3 sm:pl-4 pr-2 text-emerald-600">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
            </div>
            <input
              type="text"
              readOnly
              placeholder="Search crops (Wheat, Pulses, Medicinal Plants, Tulsi), pests, or tips..."
              className="w-full bg-transparent text-sm sm:text-base text-stone-800 placeholder-stone-400 focus:outline-hidden cursor-pointer py-1.5"
            />
            <button
              type="button"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-500">
            <span className="font-medium">Quick suggestions:</span>
            <button onClick={() => onNavigate('crops')} className="hover:text-emerald-700 underline font-medium cursor-pointer">Wheat</button>
            <span>•</span>
            <button onClick={() => onNavigate('crops')} className="hover:text-emerald-700 underline font-medium cursor-pointer">Medicinal Plants</button>
            <span>•</span>
            <button onClick={() => onNavigate('pests')} className="hover:text-emerald-700 underline font-medium cursor-pointer">Stem Borer</button>
            <span>•</span>
            <button onClick={() => onNavigate('diseases')} className="hover:text-emerald-700 underline font-medium cursor-pointer">Rust</button>
          </div>
        </div>

        {/* Responsive Quick Stats Bar */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div 
            onClick={() => onNavigate('crops')}
            className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Wheat className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-stone-900">{cropCount}</div>
            <div className="text-xs sm:text-sm font-semibold text-stone-600">Crops Documented</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Botanical & agronomical traits</p>
          </div>

          <div 
            onClick={() => onNavigate('pests')}
            className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Bug className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-stone-900">{pestCount}</div>
            <div className="text-xs sm:text-sm font-semibold text-stone-600">Major Crop Pests</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Symptoms & bio-control</p>
          </div>

          <div 
            onClick={() => onNavigate('diseases')}
            className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-stone-900">{diseaseCount}</div>
            <div className="text-xs sm:text-sm font-semibold text-stone-600">Plant Pathologies</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Fungal, bacterial & viral</p>
          </div>

          <div 
            onClick={() => onNavigate('tips')}
            className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-stone-900">{tipCount}</div>
            <div className="text-xs sm:text-sm font-semibold text-stone-600">Farming Tips</div>
            <p className="text-[11px] text-stone-400 mt-0.5">Soil, irrigation & rotations</p>
          </div>
        </div>

      </div>
    </section>
  );
};
