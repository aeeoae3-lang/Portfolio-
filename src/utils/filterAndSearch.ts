import { Crop, Pest, Disease, FarmingTip, SearchResultItem } from '../types';

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

  // Search Crops
  for (const crop of crops) {
    if (
      crop.commonName.toLowerCase().includes(q) ||
      crop.scientificName.toLowerCase().includes(q) ||
      crop.family.toLowerCase().includes(q) ||
      crop.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: crop.id,
        type: 'crop',
        title: crop.commonName,
        subtitle: crop.scientificName,
        description: crop.family + ' • ' + crop.season,
        badge: 'Crop',
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

export function isOwnerEmail(userEmail: string | null | undefined, designatedOwner: string): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === designatedOwner.trim().toLowerCase();
}
