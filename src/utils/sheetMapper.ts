import { Crop, Pest, Disease, FarmingTip } from '../types';

export const CROP_HEADERS = [
  'ID',
  'Common Name',
  'Scientific Name',
  'Family',
  'Colour',
  'Shape',
  'Size',
  'Description',
  'Image URL',
  'Season',
  'Soil Type',
  'Water Requirement',
  'Growth Duration',
  'Featured'
];

export const PEST_HEADERS = [
  'ID',
  'Name',
  'Scientific Name',
  'Affected Crops',
  'Symptoms',
  'Prevention',
  'Control Method',
  'Image URL',
  'Severity'
];

export const DISEASE_HEADERS = [
  'ID',
  'Name',
  'Causal Organism',
  'Pathogen Type',
  'Affected Crops',
  'Symptoms',
  'Treatment',
  'Prevention',
  'Image URL'
];

export const TIP_HEADERS = [
  'ID',
  'Title',
  'Category',
  'Summary',
  'Full Guide',
  'Target Audience',
  'Read Time'
];

export function cropsToRows(crops: Crop[]): (string | number)[][] {
  const rows: (string | number)[][] = [CROP_HEADERS];
  for (const c of crops) {
    rows.push([
      c.id,
      c.commonName,
      c.scientificName,
      c.family,
      c.colour,
      c.shape,
      c.size,
      c.description,
      c.imageUrl,
      c.season || '',
      c.soilType || '',
      c.waterRequirement || '',
      c.growthDuration || '',
      c.featured ? 'TRUE' : 'FALSE'
    ]);
  }
  return rows;
}

export function rowsToCrops(rows: (string | number)[][]): Crop[] {
  if (!rows || rows.length <= 1) return [];
  const crops: Crop[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2 || !r[1]) continue;
    crops.push({
      id: String(r[0] || `crop-${i}`),
      commonName: String(r[1] || ''),
      scientificName: String(r[2] || ''),
      family: String(r[3] || ''),
      colour: String(r[4] || ''),
      shape: String(r[5] || ''),
      size: String(r[6] || ''),
      description: String(r[7] || ''),
      imageUrl: String(r[8] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80'),
      season: String(r[9] || ''),
      soilType: String(r[10] || ''),
      waterRequirement: String(r[11] || ''),
      growthDuration: String(r[12] || ''),
      featured: String(r[13] || '').toUpperCase() === 'TRUE'
    });
  }
  return crops;
}

export function pestsToRows(pests: Pest[]): (string | number)[][] {
  const rows: (string | number)[][] = [PEST_HEADERS];
  for (const p of pests) {
    rows.push([
      p.id,
      p.name,
      p.scientificName,
      p.affectedCrops.join(', '),
      p.symptoms,
      p.prevention,
      p.controlMethod,
      p.imageUrl,
      p.severity
    ]);
  }
  return rows;
}

export function rowsToPests(rows: (string | number)[][]): Pest[] {
  if (!rows || rows.length <= 1) return [];
  const pests: Pest[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2 || !r[1]) continue;
    pests.push({
      id: String(r[0] || `pest-${i}`),
      name: String(r[1] || ''),
      scientificName: String(r[2] || ''),
      affectedCrops: String(r[3] || '').split(',').map(s => s.trim()).filter(Boolean),
      symptoms: String(r[4] || ''),
      prevention: String(r[5] || ''),
      controlMethod: String(r[6] || ''),
      imageUrl: String(r[7] || ''),
      severity: (String(r[8] || 'Moderate') as 'Low' | 'Moderate' | 'High')
    });
  }
  return pests;
}

export function diseasesToRows(diseases: Disease[]): (string | number)[][] {
  const rows: (string | number)[][] = [DISEASE_HEADERS];
  for (const d of diseases) {
    rows.push([
      d.id,
      d.name,
      d.causalOrganism,
      d.pathogenType,
      d.affectedCrops.join(', '),
      d.symptoms,
      d.treatment,
      d.prevention,
      d.imageUrl
    ]);
  }
  return rows;
}

export function rowsToDiseases(rows: (string | number)[][]): Disease[] {
  if (!rows || rows.length <= 1) return [];
  const diseases: Disease[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2 || !r[1]) continue;
    diseases.push({
      id: String(r[0] || `disease-${i}`),
      name: String(r[1] || ''),
      causalOrganism: String(r[2] || ''),
      pathogenType: (String(r[3] || 'Fungal') as 'Fungal' | 'Bacterial' | 'Viral' | 'Nematode'),
      affectedCrops: String(r[4] || '').split(',').map(s => s.trim()).filter(Boolean),
      symptoms: String(r[5] || ''),
      treatment: String(r[6] || ''),
      prevention: String(r[7] || ''),
      imageUrl: String(r[8] || '')
    });
  }
  return diseases;
}

export function tipsToRows(tips: FarmingTip[]): (string | number)[][] {
  const rows: (string | number)[][] = [TIP_HEADERS];
  for (const t of tips) {
    rows.push([
      t.id,
      t.title,
      t.category,
      t.summary,
      t.fullGuide,
      t.targetAudience,
      t.readTime
    ]);
  }
  return rows;
}

export function rowsToTips(rows: (string | number)[][]): FarmingTip[] {
  if (!rows || rows.length <= 1) return [];
  const tips: FarmingTip[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2 || !r[1]) continue;
    tips.push({
      id: String(r[0] || `tip-${i}`),
      title: String(r[1] || ''),
      category: (String(r[2] || 'Soil Health') as 'Soil Health' | 'Irrigation' | 'Crop Rotation' | 'Pest Management' | 'Harvesting'),
      summary: String(r[3] || ''),
      fullGuide: String(r[4] || ''),
      targetAudience: (String(r[5] || 'All') as 'Farmers' | 'Students' | 'All'),
      readTime: String(r[6] || '3 min read')
    });
  }
  return tips;
}
