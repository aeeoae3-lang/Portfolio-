export type SectionType = 'home' | 'crops' | 'pests' | 'diseases' | 'tips' | 'about';

export type CropCategory =
  | 'Cereals'
  | 'Pulses'
  | 'Oilseeds'
  | 'Fibre Crops'
  | 'Spices and Condiments'
  | 'Drug Crops'
  | 'Fodder Crops'
  | 'Sugar Crops'
  | 'Vegetables'
  | 'Fruits'
  | 'Flowers'
  | 'Medicinal Plants';

export type VegetableSubcategory =
  | 'Leafy Vegetables'
  | 'Root and Tuber Vegetables'
  | 'Fruiting Vegetables'
  | 'Bulb Vegetables'
  | 'Flower Vegetables';

export interface Crop {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  cropCategory: CropCategory | string;
  category?: CropCategory | string;
  subcategory?: VegetableSubcategory | string;
  colour: string;
  shape: string;
  size: string;
  description: string;
  imageUrl: string;
  seedImageUrl?: string;
  floweringImageUrl?: string;
  matureImageUrl?: string;
  season?: string;
  soilType?: string;
  waterRequirement?: string;
  growthDuration?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CropPhoto {
  id: string;
  cropId: string;
  imageUrl: string;
  caption: string;
  notes?: string;
  isPrimaryCover?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmingTip {
  id: string;
  title: string;
  category: 'Soil Health' | 'Irrigation' | 'Crop Rotation' | 'Pest Management' | 'Harvesting';
  summary: string;
  fullGuide: string;
  targetAudience: 'Farmers' | 'Students' | 'All';
  readTime: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
