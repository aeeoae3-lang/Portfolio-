import React, { useState } from 'react';
import { Bug, ShieldAlert, AlertTriangle, ShieldCheck, Plus, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { Pest, Disease } from '../types';

interface PestDiseaseSectionProps {
  pests: Pest[];
  diseases: Disease[];
  isOwner: boolean;
  onAddPest: () => void;
  onEditPest: (pest: Pest) => void;
  onDeletePest: (pest: Pest) => void;
  onAddDisease: () => void;
  onEditDisease: (disease: Disease) => void;
  onDeleteDisease: (disease: Disease) => void;
  initialTab?: 'pests' | 'diseases';
}

export const PestDiseaseSection: React.FC<PestDiseaseSectionProps> = ({
  pests,
  diseases,
  isOwner,
  onAddPest,
  onEditPest,
  onDeletePest,
  onAddDisease,
  onEditDisease,
  onDeleteDisease,
  initialTab = 'pests'
}) => {
  const [activeTab, setActiveTab] = useState<'pests' | 'diseases'>(initialTab);
  const [filterQuery, setFilterQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'High' | 'Moderate' | 'Low'>('All');
  const [pathogenFilter, setPathogenFilter] = useState<'All' | 'Fungal' | 'Bacterial' | 'Viral'>('All');

  const filteredPests = pests.filter(p => {
    const matchesQuery = 
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.affectedCrops.some(c => c.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesSeverity = severityFilter === 'All' || p.severity === severityFilter;
    return matchesQuery && matchesSeverity;
  });

  const filteredDiseases = diseases.filter(d => {
    const matchesQuery = 
      d.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      d.causalOrganism.toLowerCase().includes(filterQuery.toLowerCase()) ||
      d.affectedCrops.some(c => c.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesPathogen = pathogenFilter === 'All' || d.pathogenType === pathogenFilter;
    return matchesQuery && matchesPathogen;
  });

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Crop Protection & Pathology
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Pest Guide & Disease Information
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Scientific identification, biological remedies, and chemical controls to protect grain harvests from devastating biotic stresses.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab('pests')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'pests'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>Pest Guide ({pests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('diseases')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'diseases'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Diseases ({diseases.length})</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`Filter ${activeTab} by name, crop (e.g. Rice, Wheat)...`}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {activeTab === 'pests' ? (
              <>
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Severity:
                </span>
                {(['All', 'High', 'Moderate', 'Low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      severityFilter === sev
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </>
            ) : (
              <>
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Pathogen:
                </span>
                {(['All', 'Fungal', 'Bacterial', 'Viral'] as const).map(pathogen => (
                  <button
                    key={pathogen}
                    onClick={() => setPathogenFilter(pathogen)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      pathogenFilter === pathogen
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {pathogen}
                  </button>
                ))}
              </>
            )}

            {/* Owner Add Button */}
            {isOwner && (
              <button
                onClick={activeTab === 'pests' ? onAddPest : onAddDisease}
                className="ml-auto shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add {activeTab === 'pests' ? 'Pest' : 'Disease'}</span>
              </button>
            )}
          </div>
        </div>

        {/* PESTS GRID */}
        {activeTab === 'pests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPests.map(pest => (
              <div
                key={pest.id}
                className="group bg-white rounded-3xl border-2 border-stone-200 hover:border-red-300 p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Bug className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">{pest.name}</h3>
                        <p className="text-xs italic font-serif text-stone-500">{pest.scientificName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        pest.severity === 'High'
                          ? 'bg-red-100 text-red-800'
                          : pest.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pest.severity} Threat
                      </span>

                      {isOwner && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => onEditPest(pest)}
                            className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-lg"
                            title="Edit Pest"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePest(pest)}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-100 rounded-lg"
                            title="Delete Pest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Affected Crops Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-xs font-semibold text-stone-400 mr-1">Vulnerable Crops:</span>
                    {pest.affectedCrops.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Symptoms */}
                  <div className="mb-3 p-3.5 bg-red-50/50 rounded-2xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Field Symptoms
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{pest.symptoms}</p>
                  </div>

                  {/* Prevention & Control */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Control & Bio-Remediation
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{pest.controlMethod}</p>
                    <p className="text-xs text-stone-500 mt-2">
                      <strong className="text-stone-700">Prevention:</strong> {pest.prevention}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DISEASES GRID */}
        {activeTab === 'diseases' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDiseases.map(disease => (
              <div
                key={disease.id}
                className="group bg-white rounded-3xl border-2 border-stone-200 hover:border-purple-300 p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">{disease.name}</h3>
                        <p className="text-xs italic font-serif text-stone-500">{disease.causalOrganism}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        {disease.pathogenType}
                      </span>

                      {isOwner && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => onEditDisease(disease)}
                            className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-lg"
                            title="Edit Disease"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDisease(disease)}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-100 rounded-lg"
                            title="Delete Disease"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Affected Crops Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-xs font-semibold text-stone-400 mr-1">Host Crops:</span>
                    {disease.affectedCrops.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Symptoms */}
                  <div className="mb-3 p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                      Disease Symptoms
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{disease.symptoms}</p>
                  </div>

                  {/* Treatment & Prevention */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Fungicide / Bactericide Treatment
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{disease.treatment}</p>
                    <p className="text-xs text-stone-500 mt-2">
                      <strong className="text-stone-700">Preventative Culture:</strong> {disease.prevention}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
