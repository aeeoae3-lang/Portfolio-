import { Crop, CropCategory, VegetableSubcategory } from '../types';

export const CROP_CATEGORIES: CropCategory[] = [
  'Cereals',
  'Pulses',
  'Oilseeds',
  'Fibre Crops',
  'Spices and Condiments',
  'Drug Crops',
  'Fodder Crops',
  'Sugar Crops',
  'Vegetables',
  'Fruits',
  'Flowers',
  'Medicinal Plants'
];

export const VEGETABLE_SUBCATEGORIES: VegetableSubcategory[] = [
  'Leafy Vegetables',
  'Root and Tuber Vegetables',
  'Fruiting Vegetables',
  'Bulb Vegetables',
  'Flower Vegetables'
];

/**
 * Matches a crop text against the 12 agricultural categories in strict agronomic priority.
 */
function classifyByText(text: string, allowBroadFodderKeywords: boolean): CropCategory | null {
  // 1. Medicinal Plants (Strictly separate from Drug Crops and Spices)
  if (
    /\b(tulsi|holy basil|ocimum|aloe vera|aloe barbadensis|aloe|ashwagandha|asgandh|withania|neem|azadirachta|turmeric|haldi|curcuma|ginger|adrak|zingiber|giloy|guduchi|tinospora|amla|indian gooseberry|phyllanthus emblica|emblica|shatavari|asparagus racemosus|brahmi|water hyssop|bacopa)\b/i.test(text)
  ) {
    return 'Medicinal Plants';
  }

  // 2. Spices and Condiments
  if (
    /\b(black pepper|pepper|cardamom|elaichi|cumin|jeera|coriander|dhania|fenugreek|clove|cinnamon|fennel|saunf|piper nigrum|elettaria|cuminum)\b/i.test(text)
  ) {
    return 'Spices and Condiments';
  }

  // 3. Fibre Crops
  if (
    /\b(cotton|jute|flax|hemp|kenaf|sunn hemp|sisal|gossypium|corchorus|crotalaria|hibiscus cannabinus)\b/i.test(text)
  ) {
    return 'Fibre Crops';
  }

  // 4. Oilseeds (Check Soybean & Groundnut before Pulses even though both share Fabaceae family)
  if (
    /\b(mustard|raya|sarson|rapeseed|canola|sunflower|groundnut|peanut|soybean|soya|glycine max|sesame|til|linseed|flaxseed|safflower|castor|brassica juncea|brassica napus|helianthus|arachis|sesamum|ricinus)\b/i.test(text)
  ) {
    return 'Oilseeds';
  }

  // 5. Pulses
  if (
    /\b(chickpea|gram|lentil|masoor|pigeon pea|arhar|tur|moong|mung|urad|black gram|green gram|cowpea|kidney bean|rajma|field pea|broad bean|cicer|lens culinaris|cajanus|vigna|phaseolus)\b/i.test(text) &&
    !/fodder|leaf/i.test(text)
  ) {
    return 'Pulses';
  }

  // 6. Drug Crops (Strictly separate from Medicinal Plants)
  if (
    /\b(opium|poppy|papaver|tobacco|nicotiana|isabgol|psyllium|plantago|belladonna|cannabis|cinchona|senna)\b/i.test(text)
  ) {
    return 'Drug Crops';
  }

  // 7. Sugar Crops (Check before Cereals since Sugarcane shares Poaceae family)
  if (
    /\b(sugarcane|sugar cane|sugarbeet|sugar beet|sweet sorghum|saccharum|beta vulgaris)\b/i.test(text)
  ) {
    return 'Sugar Crops';
  }

  // 8. Cereals (Include millets, jowar, bajra, ragi, oats, paddy before broad fodder fallback)
  if (
    /\b(wheat|rice|paddy|maize|corn|barley|oat|oats|rye|sorghum|jowar|millet|foxtail|kodo|proso|barnyard|bajra|ragi|triticum|oryza|zea mays|hordeum|avena|eleusine|panicum|setaria|paspalum|echinochloa|echinochla|pennisetum)\b/i.test(text)
  ) {
    return 'Cereals';
  }

  // 9. Fodder Crops
  if (
    /\b(berseem|egyptian clover|alfalfa|lucerne|trifolium|medicago|napier|sudan grass)\b/i.test(text) ||
    (allowBroadFodderKeywords && /\b(fodder|forage)\b/i.test(text))
  ) {
    return 'Fodder Crops';
  }

  // 10. Vegetables
  if (
    /\b(tomato|potato|aloo|spinach|palak|onion|pyaz|garlic|lahsun|cauliflower|gobhi|cabbage|patta gobhi|broccoli|brinjal|eggplant|baingan|okra|bhindi|ladyfinger|lady finger|carrot|gajar|radish|mooli|beetroot|cucumber|kheera|bitter gourd|bottle gourd|pumpkin|capsicum|chilli|solanum lycopersicum|solanum tuberosum|solanum melongena|allium|brassica oleracea)\b/i.test(text)
  ) {
    return 'Vegetables';
  }

  // 11. Fruits
  if (
    /\b(mango|aam|apple|seb|banana|kela|citrus|orange|santra|lemon|guava|amrood|papaya|papita|grape|angoor|pomegranate|anar|pineapple|litchi|watermelon|tarbooz|mangifera|malus|musa)\b/i.test(text)
  ) {
    return 'Fruits';
  }

  // 12. Flowers
  if (
    /\b(marigold|genda|rose|gulab|jasmine|chameli|mogra|carnation|chrysanthemum|gladiolus|tuberose|gerbera|orchid|tagetes|rosa|jasminum)\b/i.test(text)
  ) {
    return 'Flowers';
  }

  return null;
}

/**
 * Robust classifier for any legacy or user-entered crop missing an explicit Crop Category.
 * Uses cropCategory first, then legacy category alias, then commonName+scientificName, then description.
 */
export function resolveCropCategory(crop: Partial<Crop>): CropCategory {
  if (crop.id === 'crop-ashwagandha' && (!crop.cropCategory || crop.cropCategory === 'Drug Crops')) {
    return 'Medicinal Plants';
  }
  if (crop.id === 'crop-turmeric' && (!crop.cropCategory || crop.cropCategory === 'Spices and Condiments')) {
    return 'Medicinal Plants';
  }

  if (crop.cropCategory && CROP_CATEGORIES.includes(crop.cropCategory as CropCategory)) {
    return crop.cropCategory as CropCategory;
  }
  if (crop.category && CROP_CATEGORIES.includes(crop.category as CropCategory)) {
    return crop.category as CropCategory;
  }

  const name = (crop.commonName || '').toLowerCase();
  const sci = (crop.scientificName || '').toLowerCase();
  const fam = (crop.family || '').toLowerCase();
  const desc = (crop.description || '').toLowerCase();

  // Pass 1: Classify primarily from crop name & scientific name so dual-use mentions in description
  // (e.g., "Jowar is an important cereal and fodder crop") do not override true Cereal classification.
  const primaryMatch = classifyByText(`${name} ${sci}`, false);
  if (primaryMatch) return primaryMatch;

  // Pass 2: Fall back to description + family keywords
  const secondaryMatch = classifyByText(`${name} ${sci} ${fam} ${desc}`, true);
  if (secondaryMatch) return secondaryMatch;

  return 'Cereals';
}

/**
 * Classifies vegetable crops into the 5 agronomic subcategories:
 * 1. Leafy Vegetables
 * 2. Root and Tuber Vegetables
 * 3. Fruiting Vegetables
 * 4. Bulb Vegetables
 * 5. Flower Vegetables
 */
export function resolveVegetableSubcategory(crop: Partial<Crop>): VegetableSubcategory {
  if (crop.subcategory && VEGETABLE_SUBCATEGORIES.includes(crop.subcategory as VegetableSubcategory)) {
    return crop.subcategory as VegetableSubcategory;
  }

  const name = (crop.commonName || '').toLowerCase();
  const sci = (crop.scientificName || '').toLowerCase();
  const desc = (crop.description || '').toLowerCase();
  const combined = `${name} ${sci} ${desc}`;

  if (/\b(spinach|palak|lettuce|methi|fenugreek leaves|amaranth|chaulai|kale|swiss chard|coriander leaves|cabbage|spinacia)\b/i.test(combined)) {
    return 'Leafy Vegetables';
  }

  if (/\b(potato|aloo|sweet potato|shakarkand|carrot|gajar|radish|mooli|beetroot|chukandar|turnip|shalgam|tapioca|cassava|yam|jimikand|solanum tuberosum|daucus|raphanus)\b/i.test(combined)) {
    return 'Root and Tuber Vegetables';
  }

  if (/\b(onion|pyaz|garlic|lahsun|leek|shallot|scallion|allium)\b/i.test(combined)) {
    return 'Bulb Vegetables';
  }

  if (/\b(cauliflower|phool gobhi|broccoli|globe artichoke|artichoke)\b/i.test(combined)) {
    return 'Flower Vegetables';
  }

  return 'Fruiting Vegetables';
}

/**
 * Ensures every crop record has a populated `cropCategory` (and `category` mirror for compatibility),
 * and a valid `subcategory` when `cropCategory === 'Vegetables'`, without altering user data or images.
 */
export function normalizeCropRecord(crop: Crop): Crop {
  const resolvedCategory = resolveCropCategory(crop);
  const normalized: Crop = {
    ...crop,
    cropCategory: resolvedCategory,
    category: resolvedCategory
  };

  if (resolvedCategory === 'Vegetables') {
    normalized.subcategory = resolveVegetableSubcategory(crop);
  } else {
    delete normalized.subcategory;
  }

  return normalized;
}

function getBaseCropName(commonName?: string): string {
  return (commonName || '')
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
}

function parseTimestampMs(iso?: string): number {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUploadedMediaUrl(url?: string): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith('data:image/') || u.includes('firebasestorage.googleapis.com');
}

function countUploadedImages(crop: Crop): number {
  let count = 0;
  if (isUploadedMediaUrl(crop.imageUrl)) count++;
  if (isUploadedMediaUrl(crop.seedImageUrl)) count++;
  if (isUploadedMediaUrl(crop.floweringImageUrl)) count++;
  if (isUploadedMediaUrl(crop.matureImageUrl)) count++;
  return count;
}

/**
 * Non-destructively merges existing crop records (from localStorage/IndexedDB/Firestore/Sheets) with secondary/seed records,
 * preserving newer edits by `updatedAt` timestamp and all user images/custom crops while ensuring every record
 * has `cropCategory` and all 12 categories have representative crops.
 */
export function mergeAndNormalizeCrops(existingCrops: Crop[], seedCrops: Crop[]): Crop[] {
  const byId = new Map<string, Crop>();
  const existingBaseNames = new Set<string>();

  for (const crop of existingCrops) {
    if (crop && crop.id) {
      const normalized = normalizeCropRecord(crop);
      byId.set(crop.id, normalized);
      const base = getBaseCropName(normalized.commonName);
      if (base) existingBaseNames.add(base);
    }
  }

  for (const seed of seedCrops) {
    if (!seed || !seed.id) continue;
    const normalizedSeed = normalizeCropRecord(seed);
    const seedBase = getBaseCropName(normalizedSeed.commonName);
    const current = byId.get(seed.id);

    if (current) {
      const seedTs = parseTimestampMs(normalizedSeed.updatedAt);
      const currentTs = parseTimestampMs(current.updatedAt);
      if (seedTs > currentTs) {
        byId.set(seed.id, normalizedSeed);
        if (seedBase) existingBaseNames.add(seedBase);
      } else if (seedTs === currentTs && countUploadedImages(normalizedSeed) > countUploadedImages(current)) {
        byId.set(seed.id, {
          ...current,
          imageUrl: isUploadedMediaUrl(normalizedSeed.imageUrl) ? normalizedSeed.imageUrl : current.imageUrl,
          seedImageUrl: normalizedSeed.seedImageUrl || current.seedImageUrl,
          floweringImageUrl: normalizedSeed.floweringImageUrl || current.floweringImageUrl,
          matureImageUrl: normalizedSeed.matureImageUrl || current.matureImageUrl
        });
      }
    } else if (!seedBase || !existingBaseNames.has(seedBase)) {
      byId.set(seed.id, normalizedSeed);
      if (seedBase) existingBaseNames.add(seedBase);
    }
  }

  return Array.from(byId.values());
}

/**
 * Checks if a single crop matches a text search query across common name, scientific name,
 * Crop Category, vegetable subcategory, description, and botanical family.
 */
export function matchesCropSearch(crop: Crop, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const cropCategory = resolveCropCategory(crop).toLowerCase();
  const subcategory = cropCategory === 'vegetables' ? resolveVegetableSubcategory(crop).toLowerCase() : '';

  return (
    (crop.commonName || '').toLowerCase().includes(q) ||
    (crop.scientificName || '').toLowerCase().includes(q) ||
    cropCategory.includes(q) ||
    (subcategory !== '' && subcategory.includes(q)) ||
    (crop.family || '').toLowerCase().includes(q) ||
    (crop.description || '').toLowerCase().includes(q)
  );
}

/**
 * Filters crops based on active Crop Category, Vegetable Subcategory, and optional search query.
 * Strictly filters by Crop Category (NOT botanical family).
 */
export function filterCropsByCategory(
  crops: Crop[],
  selectedCategory: string,
  selectedVegetableSubcategory: string,
  searchQuery: string = ''
): Crop[] {
  return crops.filter(crop => {
    const category = resolveCropCategory(crop);

    // 1. Match main Crop Category filter ('All' shows all categories)
    if (selectedCategory !== 'All' && category !== selectedCategory) {
      return false;
    }

    // 2. Match Vegetable Subcategory only when 'Vegetables' is active
    if (selectedCategory === 'Vegetables' && selectedVegetableSubcategory !== 'All') {
      const subcategory = resolveVegetableSubcategory(crop);
      if (subcategory !== selectedVegetableSubcategory) {
        return false;
      }
    }

    // 3. Match search query (works together with category filter)
    if (searchQuery.trim() && !matchesCropSearch(crop, searchQuery)) {
      return false;
    }

    return true;
  });
}
