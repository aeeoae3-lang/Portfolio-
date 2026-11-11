export type SectionType = 'home' | 'crops' | 'pests' | 'diseases' | 'tips' | 'about';

export interface Crop {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  colour: string;
  shape: string;
  size: string;
  description: string;
  imageUrl: string;
  season?: string;
  soilType?: string;
  waterRequirement?: string;
  growthDuration?: string;
  featured?: boolean;
}

export interface Pest {
  id: string;
  name: string;
  scientificName: string;
  affectedCrops: string[];
  symptoms: string;
  prevention: string;
  controlMethod: string;
  imageUrl: string;
  severity: 'Low' | 'Moderate' | 'High';
}

export interface Disease {
  id: string;
  name: string;
  causalOrganism: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Nematode';
  affectedCrops: string[];
  symptoms: string;
  treatment: string;
  prevention: string;
  imageUrl: string;
}

export interface FarmingTip {
  id: string;
  title: string;
  category: 'Soil Health' | 'Irrigation' | 'Crop Rotation' | 'Pest Management' | 'Harvesting';
  summary: string;
  fullGuide: string;
  targetAudience: 'Farmers' | 'Students' | 'All';
  readTime: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface SearchResultItem {
  id: string;
  type: 'crop' | 'pest' | 'disease' | 'tip';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  item: Crop | Pest | Disease | FarmingTip;
}
