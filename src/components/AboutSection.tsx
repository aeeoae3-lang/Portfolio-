import React from 'react';
import { Sprout, BookOpen, Database, ShieldCheck, HeartHandshake, CheckCircle } from 'lucide-react';
import { PRIMARY_OWNER_EMAIL } from '../services/auth';

interface AboutSectionProps {
  isOwner: boolean;
  currentUserEmail?: string | null;
  onOpenSheetModal: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  isOwner,
  currentUserEmail,
  onOpenSheetModal
}) => {
  return (
    <section className="py-12 sm:py-20 bg-white border-t border-emerald-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sprout className="w-3.5 h-3.5" />
            About AgriNex
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Connecting Scientific Agronomy with Practical Agriculture
          </h2>
          <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed">
            AgriNex was engineered as an open, accessible knowledge repository for agricultural students conducting botanical studies and farmers striving for resilient, sustainable crop yields.
          </p>
        </div>

        {/* 3 Core Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-14">
          <div className="p-6 sm:p-8 bg-stone-50 rounded-3xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">For Agronomy Students</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Provides detailed taxonomic classifications, botanical families, seed morphology (length, breadth, crease, colour), and causal organisms for academic coursework and field exams.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-stone-50 rounded-3xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">For Working Farmers</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Delivers straightforward field symptom diagnostics, economic threshold levels, eco-friendly biological pest treatments, and water-saving irrigation routines like AWD.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-stone-50 rounded-3xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Live Google Sheets Core</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Backed directly by Google Sheets spreadsheets. Crop data, pests, and field recommendations can be updated, expanded, and synchronized in real time.
            </p>
          </div>
        </div>

        {/* Database & Ownership Status Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-green-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Ownership & Editorial Governance
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mb-3">
              Protected Editorial Control
            </h3>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6">
              To ensure data integrity and prevent unauthorized modifications, editing and adding agricultural records is strictly restricted to the verified site owner (<span className="text-emerald-300 font-mono font-semibold">{PRIMARY_OWNER_EMAIL}</span>). All public visitors, students, and farmers enjoy unlimited search, filtering, and study access.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenSheetModal}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Google Sheets Database Configuration</span>
              </button>
              
              <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-emerald-200 border border-white/10">
                {currentUserEmail ? (
                  <span>Signed in as: <strong className="text-white">{currentUserEmail}</strong> {isOwner ? '✓ (Owner)' : '(Public)'}</span>
                ) : (
                  <span>Visitor status: Public Read-Only Access</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
