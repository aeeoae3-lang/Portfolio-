import React, { useState } from 'react';
import { X, Save, Layers, Wheat, Bug, ShieldAlert, Lightbulb } from 'lucide-react';
import { Crop, Pest, Disease, FarmingTip } from '../types';

export type EditEntity =
  | { type: 'crop'; data: Partial<Crop> }
  | { type: 'pest'; data: Partial<Pest> }
  | { type: 'disease'; data: Partial<Disease> }
  | { type: 'tip'; data: Partial<FarmingTip> };

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: EditEntity | null;
  onSave: (entity: EditEntity) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave
}) => {
  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {entity.type === 'crop' && (
          <CropEditForm initial={entity.data} onClose={onClose} onSave={(data) => onSave({ type: 'crop', data })} />
        )}
        {entity.type === 'pest' && (
          <PestEditForm initial={entity.data} onClose={onClose} onSave={(data) => onSave({ type: 'pest', data })} />
        )}
        {entity.type === 'disease' && (
          <DiseaseEditForm initial={entity.data} onClose={onClose} onSave={(data) => onSave({ type: 'disease', data })} />
        )}
        {entity.type === 'tip' && (
          <TipEditForm initial={entity.data} onClose={onClose} onSave={(data) => onSave({ type: 'tip', data })} />
        )}
      </div>
    </div>
  );
};

// Crop Edit Form
function CropEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Crop>;
  onClose: () => void;
  onSave: (data: Crop) => void;
}) {
  const [formData, setFormData] = useState<Crop>({
    id: initial.id || `crop-${Date.now()}`,
    commonName: initial.commonName || '',
    scientificName: initial.scientificName || '',
    family: initial.family || 'Poaceae (Gramineae)',
    colour: initial.colour || '',
    shape: initial.shape || '',
    size: initial.size || '',
    description: initial.description || '',
    imageUrl: initial.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80',
    season: initial.season || 'Rabi / Winter',
    soilType: initial.soilType || 'Loam',
    waterRequirement: initial.waterRequirement || '400 - 600 mm',
    growthDuration: initial.growthDuration || '120 days',
    featured: initial.featured ?? false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commonName.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wheat className="w-5 h-5 text-emerald-200" />
          <h3 id="edit-modal-title" className="text-lg font-bold">
            {initial.commonName ? `Edit Crop: ${initial.commonName}` : 'Add New Agricultural Crop'}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Common Name *</label>
            <input
              type="text"
              required
              value={formData.commonName}
              onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Wheat"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Scientific Name (Botanical) *</label>
            <input
              type="text"
              required
              value={formData.scientificName}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500 italic"
              placeholder="e.g. Triticum aestivum"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Botanical Family</label>
            <input
              type="text"
              value={formData.family}
              onChange={(e) => setFormData({ ...formData, family: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Poaceae (Gramineae)"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Grain / Seed Colour</label>
            <input
              type="text"
              value={formData.colour}
              onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Golden amber to light brown"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Grain / Seed Shape</label>
            <input
              type="text"
              value={formData.shape}
              onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. Elliptical to oblong grain with crease"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Size Specification</label>
            <input
              type="text"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
              placeholder="e.g. 5 to 8 mm length, 2.5 to 3.5 mm width"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Agronomic Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
            placeholder="Detailed botanical summary, cultivation habits, and importance..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Season</label>
            <input
              type="text"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Rabi"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Soil Type</label>
            <input
              type="text"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Well-drained loam"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Growth Duration</label>
            <input
              type="text"
              value={formData.growthDuration}
              onChange={(e) => setFormData({ ...formData, growthDuration: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. 110 - 130 days"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Photo Image URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="featuredCrop"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded-sm"
          />
          <label htmlFor="featuredCrop" className="font-bold text-stone-700 cursor-pointer">
            Mark as Featured Crop on Homepage (like Wheat or Rice)
          </label>
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Crop</span>
        </button>
      </div>
    </form>
  );
}

// Pest Edit Form
function PestEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Pest>;
  onClose: () => void;
  onSave: (data: Pest) => void;
}) {
  const [formData, setFormData] = useState<Pest>({
    id: initial.id || `pest-${Date.now()}`,
    name: initial.name || '',
    scientificName: initial.scientificName || '',
    affectedCrops: initial.affectedCrops || ['Rice'],
    symptoms: initial.symptoms || '',
    prevention: initial.prevention || '',
    controlMethod: initial.controlMethod || '',
    imageUrl: initial.imageUrl || '',
    severity: initial.severity || 'Moderate'
  });

  const [cropsText, setCropsText] = useState(formData.affectedCrops.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const crops = cropsText.split(',').map(s => s.trim()).filter(Boolean);
    onSave({ ...formData, affectedCrops: crops });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-5 bg-red-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-red-200" />
          <h3 className="text-lg font-bold">
            {initial.name ? `Edit Pest: ${initial.name}` : 'Add New Agricultural Pest'}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-red-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Pest Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Scientific Name</label>
            <input
              type="text"
              value={formData.scientificName}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl italic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Vulnerable Crops (comma separated)</label>
            <input
              type="text"
              value={cropsText}
              onChange={(e) => setCropsText(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              placeholder="e.g. Rice, Wheat, Maize"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Threat Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Field Symptoms</label>
          <textarea
            rows={2}
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Control & Bio-Remediation Methods</label>
          <textarea
            rows={2}
            value={formData.controlMethod}
            onChange={(e) => setFormData({ ...formData, controlMethod: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Cultural Prevention</label>
          <input
            type="text"
            value={formData.prevention}
            onChange={(e) => setFormData({ ...formData, prevention: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Save Pest</span>
        </button>
      </div>
    </form>
  );
}

// Disease Edit Form
function DiseaseEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<Disease>;
  onClose: () => void;
  onSave: (data: Disease) => void;
}) {
  const [formData, setFormData] = useState<Disease>({
    id: initial.id || `disease-${Date.now()}`,
    name: initial.name || '',
    causalOrganism: initial.causalOrganism || '',
    pathogenType: initial.pathogenType || 'Fungal',
    affectedCrops: initial.affectedCrops || ['Wheat'],
    symptoms: initial.symptoms || '',
    treatment: initial.treatment || '',
    prevention: initial.prevention || '',
    imageUrl: initial.imageUrl || ''
  });

  const [cropsText, setCropsText] = useState(formData.affectedCrops.join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const crops = cropsText.split(',').map(s => s.trim()).filter(Boolean);
    onSave({ ...formData, affectedCrops: crops });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-5 bg-purple-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-200" />
          <h3 className="text-lg font-bold">
            {initial.name ? `Edit Disease: ${initial.name}` : 'Add New Plant Disease'}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-purple-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Disease Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Causal Organism</label>
            <input
              type="text"
              value={formData.causalOrganism}
              onChange={(e) => setFormData({ ...formData, causalOrganism: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl italic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Pathogen Classification</label>
            <select
              value={formData.pathogenType}
              onChange={(e) => setFormData({ ...formData, pathogenType: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Fungal">Fungal</option>
              <option value="Bacterial">Bacterial</option>
              <option value="Viral">Viral</option>
              <option value="Nematode">Nematode</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Host Crops (comma separated)</label>
            <input
              type="text"
              value={cropsText}
              onChange={(e) => setCropsText(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Diagnostic Symptoms</label>
          <textarea
            rows={2}
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Chemical & Cultural Treatment</label>
          <textarea
            rows={2}
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Save Disease</span>
        </button>
      </div>
    </form>
  );
}

// Tip Edit Form
function TipEditForm({
  initial,
  onClose,
  onSave
}: {
  initial: Partial<FarmingTip>;
  onClose: () => void;
  onSave: (data: FarmingTip) => void;
}) {
  const [formData, setFormData] = useState<FarmingTip>({
    id: initial.id || `tip-${Date.now()}`,
    title: initial.title || '',
    category: initial.category || 'Crop Rotation',
    summary: initial.summary || '',
    fullGuide: initial.fullGuide || '',
    targetAudience: initial.targetAudience || 'All',
    readTime: initial.readTime || '3 min read'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-emerald-200" />
          <h3 className="text-lg font-bold">
            {initial.title ? `Edit Tip: ${initial.title}` : 'Add New Farming Tip'}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
        <div>
          <label className="block font-bold text-stone-700 mb-1">Tip Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="Soil Health">Soil Health</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Crop Rotation">Crop Rotation</option>
              <option value="Pest Management">Pest Management</option>
              <option value="Harvesting">Harvesting</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Target Audience</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            >
              <option value="All">All</option>
              <option value="Farmers">Farmers</option>
              <option value="Students">Students</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Read Time</label>
            <input
              type="text"
              value={formData.readTime}
              onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Summary (1-2 sentences)</label>
          <textarea
            rows={2}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Full Detailed Guide & Science</label>
          <textarea
            rows={6}
            value={formData.fullGuide}
            onChange={(e) => setFormData({ ...formData, fullGuide: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-xs"
          />
        </div>
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-xl font-semibold">
          Cancel
        </button>
        <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Save Farming Tip</span>
        </button>
      </div>
    </form>
  );
}
