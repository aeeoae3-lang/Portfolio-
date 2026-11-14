import { Crop, Pest, Disease, FarmingTip, SearchResultItem } from '../types';
import { matchesCropSearch, resolveCropCategory } from './cropCategories';

export function searchAll(
  query: string,
  crops: Crop[],
  pests: Pest[],
  diseases: Disease[],
  tips: FarmingTip[]
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // Search Crops (including common name, scientific name, Crop Category, subcategory, family, description)
  for (const crop of crops) {
    if (matchesCropSearch(crop, q)) {
      const category = resolveCropCategory(crop);
      results.push({
        id: crop.id,
        type: 'crop',
        title: crop.commonName,
        subtitle: crop.scientificName,
        description: `${category} • ${crop.family}${crop.season ? ' • ' + crop.season : ''}`,
        badge: category,
        item: crop
      });
    }
  }

  // Search Pests
  for (const pest of pests) {
    if (
      pest.name.toLowerCase().includes(q) ||
      pest.scientificName.toLowerCase().includes(q) ||
      pest.affectedCrops.some(c => c.toLowerCase().includes(q)) ||
      pest.symptoms.toLowerCase().includes(q)
    ) {
      results.push({
        id: pest.id,
        type: 'pest',
        title: pest.name,
        subtitle: pest.scientificName,
        description: 'Affects: ' + pest.affectedCrops.join(', '),
        badge: 'Pest (' + pest.severity + ')',
        item: pest
      });
    }
  }

  // Search Diseases
  for (const disease of diseases) {
    if (
      disease.name.toLowerCase().includes(q) ||
      disease.causalOrganism.toLowerCase().includes(q) ||
      disease.affectedCrops.some(c => c.toLowerCase().includes(q)) ||
      disease.symptoms.toLowerCase().includes(q)
    ) {
      results.push({
        id: disease.id,
        type: 'disease',
        title: disease.name,
        subtitle: disease.causalOrganism,
        description: 'Type: ' + disease.pathogenType + ' • ' + disease.affectedCrops.join(', '),
        badge: 'Disease',
        item: disease
      });
    }
  }

  // Search Tips
  for (const tip of tips) {
    if (
      tip.title.toLowerCase().includes(q) ||
      tip.category.toLowerCase().includes(q) ||
      tip.summary.toLowerCase().includes(q) ||
      tip.fullGuide.toLowerCase().includes(q)
    ) {
      results.push({
        id: tip.id,
        type: 'tip',
        title: tip.title,
        subtitle: tip.category,
        description: tip.summary,
        badge: 'Tip (' + tip.targetAudience + ')',
        item: tip
      });
    }
  }

  return results;
}

export function isOwnerEmail(
  userEmail: string | null | undefined,
  designatedOwner: string | readonly string[]
): boolean {
  if (!userEmail) return false;
  const clean = userEmail.trim().toLowerCase();
  if (Array.isArray(designatedOwner)) {
    return designatedOwner.some(owner => owner.trim().toLowerCase() === clean);
  }
  return clean === (designatedOwner as string).trim().toLowerCase();
}
