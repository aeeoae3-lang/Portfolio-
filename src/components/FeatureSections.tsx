import React from 'react';
import { Wheat, Bug, ShieldAlert, Lightbulb, ArrowUpRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { SectionType } from '../types';

interface FeatureSectionsProps {
  onNavigate: (section: SectionType) => void;
  cropCount: number;
  pestCount: number;
  diseaseCount: number;
  tipCount: number;
}

export const FeatureSections: React.FC<FeatureSectionsProps> = ({
  onNavigate,
  cropCount,
  pestCount,
  diseaseCount,
  tipCount
}) => {
  const features = [
    {
      id: 'crops' as SectionType,
      title: 'Crop Library',
      badge: `${cropCount} Species`,
      icon: Wheat,
      iconBg: 'bg-amber-100 text-amber-700',
      gradient: 'from-amber-500/10 to-emerald-500/5',
      borderColor: 'border-amber-200/80 hover:border-amber-400',
      description: 'Comprehensive botanical profiles featuring Wheat, Rice, and staple cereals. Includes common name, scientific name, family, colour, shape, seed size, and soil requirements.',
      highlights: ['Full botanical taxonomy', 'Physical grain morphology', 'Ideal soil & seasonal cycles', 'High-res field photography'],
      cta: 'Explore Crop Library'
    },
    {
      id: 'pests' as SectionType,
      title: 'Pest Guide',
      badge: `${pestCount} Key Threats`,
      icon: Bug,
      iconBg: 'bg-red-100 text-red-700',
      gradient: 'from-red-500/10 to-orange-500/5',
      borderColor: 'border-red-200/80 hover:border-red-400',
      description: 'Identify destructive agricultural pests like Stem Borers, Aphids, and Planthoppers. Learn symptom signatures, economic threshold levels, and biological pest controls.',
      highlights: ['Early symptom identification', 'Targeted crop vulnerability', 'Biological parasitoids & predators', 'Eco-friendly organic control'],
      cta: 'View Pest Guide'
    },
    {
      id: 'diseases' as SectionType,
      title: 'Disease Information',
      badge: `${diseaseCount} Pathologies`,
      icon: ShieldAlert,
      iconBg: 'bg-purple-100 text-purple-700',
      gradient: 'from-purple-500/10 to-indigo-500/5',
      borderColor: 'border-purple-200/80 hover:border-purple-400',
      description: 'Diagnostic handbook for fungal rusts, bacterial blights, and viral infections. Detailed causal organisms, environmental triggers, and chemical & cultural treatments.',
      highlights: ['Causal organism classification', 'Leaf, stem & grain symptoms', 'Preventative seed treatments', 'Fungicide & bactericide timing'],
      cta: 'Inspect Plant Diseases'
    },
    {
      id: 'tips' as SectionType,
      title: 'Farming Tips',
      badge: `${tipCount} Field Guides`,
      icon: Lightbulb,
      iconBg: 'bg-emerald-100 text-emerald-800',
      gradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-200/80 hover:border-emerald-400',
      description: 'Actionable agronomic wisdom covering Alternate Wetting & Drying (AWD), soil pH testing, crop rotation schedules, and Integrated Pest Management (IPM).',
      highlights: ['Water conservation strategies', 'Soil chemistry and fertility', 'Sustainable crop rotations', 'Student agronomy experiments'],
      cta: 'Read Farming Tips'
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-stone-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Core Agronomic Modules
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Four Pillars of Agricultural Knowledge
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600">
            Tailored for agricultural college students conducting research and hardworking farmers aiming to optimize crop yields and soil health.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                onClick={() => onNavigate(f.id)}
                className={`group relative bg-white rounded-3xl p-6 sm:p-8 border-2 ${f.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                        <Icon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                          {f.title}
                        </h3>
                        <span className="text-xs font-semibold text-stone-400">
                          Interactive Database
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      {f.badge}
                    </span>
                  </div>

                  {/* Card Description */}
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
                    {f.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {f.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-medium text-stone-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1.5">
                    {f.cta}
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    Click to browse
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
