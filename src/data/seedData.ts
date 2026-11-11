import { Crop, Pest, Disease, FarmingTip } from '../types';

export const INITIAL_CROPS: Crop[] = [
  {
    id: 'crop-1',
    commonName: 'Wheat',
    scientificName: 'Triticum aestivum',
    family: 'Poaceae (Gramineae)',
    colour: 'Golden amber to light brownish yellow',
    shape: 'Elliptical to oblong grain with a rounded dorsal surface and longitudinal ventral crease (groove)',
    size: '5 to 8 mm in length, 2.5 to 3.5 mm in width, average 1000-grain weight: 35–45 grams',
    description: 'Wheat is one of the world\'s most essential cereal crops, providing roughly 20% of the total dietary calories and proteins consumed by humans worldwide. Primarily cultivated in temperate and subtropical climates during the winter or spring cycles (Rabi season in South Asia). It thrives in well-drained loamy soils with moderate moisture and cool temperatures during the vegetative phase, followed by warm, sunny dry weather for grain filling and ripening.',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80',
    season: 'Winter / Spring (Rabi)',
    soilType: 'Well-drained fertile loamy to clay-loam soil (pH 6.0 – 7.5)',
    waterRequirement: '450 - 650 mm (Critical at CRI and flowering stages)',
    growthDuration: '110 - 140 days',
    featured: true
  },
  {
    id: 'crop-2',
    commonName: 'Rice',
    scientificName: 'Oryza sativa',
    family: 'Poaceae (Gramineae)',
    colour: 'Straw yellow to brown husk; dehulled grain is pearly white to translucent creamy yellow (or red/brown in unpolished varieties)',
    shape: 'Slender to plump elongated oval caryopsis kernel with pointed apices',
    size: '6 to 9 mm in length, 2.0 to 2.8 mm in width, length-to-breadth ratio: 2.5–3.5',
    description: 'Rice is the primary staple food for more than half of the world\'s human population, especially across Asia. It is an annual grass cultivated predominantly in submerged paddy wetlands or lowland irrigation systems. Rice requires abundant warm sunlight, high relative humidity (above 60%), and temperatures between 20°C and 35°C, with standing water management during tillering and panicle initiation.',
    imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=1200&q=80',
    season: 'Monsoon / Wet (Kharif / Aus / Aman)',
    soilType: 'Heavy clay or alluvial clay soils with high water-holding capacity (pH 5.5 – 6.5)',
    waterRequirement: '1200 - 1600 mm (Flooded / continuous shallow submergence)',
    growthDuration: '105 - 150 days',
    featured: true
  },
  {
    id: 'crop-3',
    commonName: 'Maize (Corn)',
    scientificName: 'Zea mays',
    family: 'Poaceae (Gramineae)',
    colour: 'Bright yellow to golden orange, white, and deep purple kernels',
    shape: 'Flattened wedge-shaped or dented caryopsis tightly clustered on an elongated central cob',
    size: '8 to 14 mm length, 6 to 10 mm width, 1000-kernel weight: 250–350 grams',
    description: 'Often referred to as the Queen of Cereals, maize has one of the highest yield potentials among grain crops. Cultivated for human nutrition, animal livestock feed, starch extraction, and biofuel. It is a C4 plant that utilizes warm sunlight efficiently with moderate water requirements.',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
    season: 'Kharif, Spring, and Rabi',
    soilType: 'Deep, rich loamy soil rich in organic matter (pH 6.5 – 7.5)',
    waterRequirement: '500 - 800 mm',
    growthDuration: '90 - 120 days',
    featured: false
  },
  {
    id: 'crop-4',
    commonName: 'Chickpea (Gram)',
    scientificName: 'Cicer arietinum',
    family: 'Fabaceae (Leguminosae)',
    colour: 'Light beige to yellowish-tan (Kabuli) or dark brown to black (Desi)',
    shape: 'Angular to ram\'s-head globular seed with a prominent beaked protrusion',
    size: '7 to 10 mm diameter (Kabuli), 4 to 7 mm (Desi)',
    description: 'Chickpea is a valuable pulse legume that plays a vital role in food security and sustainable agriculture. Its symbiotic root nodules fix atmospheric nitrogen, enhancing natural soil fertility. Highly resilient to drought and suitable for rainfed crop rotation.',
    imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=1200&q=80',
    season: 'Rabi (Post-monsoon winter)',
    soilType: 'Deep sandy loam to clay loam, well aerated without waterlogging',
    waterRequirement: '250 - 350 mm',
    growthDuration: '90 - 110 days',
    featured: false
  },
  {
    id: 'crop-5',
    commonName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    family: 'Solanaceae (Nightshade)',
    colour: 'Deep scarlet red when ripe (green when unripe, yellow/orange in heirloom)',
    shape: 'Globular to slightly flattened oblate berry with smooth shiny pericarp',
    size: '50 to 90 mm diameter, weight ranging from 80 to 220 grams per fruit',
    description: 'Tomato is among the most widely grown horticultural vegetable crops worldwide, rich in antioxidant lycopene, vitamin C, and potassium. Requires staked trellis support for indeterminate varieties and precise drip fertigation for maximum quality and yield.',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=80',
    season: 'Year-round under climate control, Spring/Autumn in open fields',
    soilType: 'Sandy loam rich in humus, well-draining (pH 6.0 – 6.8)',
    waterRequirement: '400 - 600 mm',
    growthDuration: '70 - 90 days from transplanting',
    featured: false
  }
];

export const INITIAL_PESTS: Pest[] = [
  {
    id: 'pest-1',
    name: 'Yellow Stem Borer',
    scientificName: 'Scirpophaga incertulas',
    affectedCrops: ['Rice', 'Wild grasses'],
    symptoms: 'Larvae bore into the central leaf sheath causing "Deadheart" during early vegetative tillering and "Whitehead" (empty whitish panicles) during flowering and reproductive stages.',
    prevention: 'Clip seedling leaf tips before transplanting to remove egg masses; avoid excessive synthetic nitrogen fertilizer; monitor with light traps.',
    controlMethod: 'Introduce Trichogramma egg parasitoid wasps; apply neem seed kernel extract (NSKE 5%) or targeted eco-friendly systemic insecticides if threshold exceeds 2 egg masses/sq.m.',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    severity: 'High'
  },
  {
    id: 'pest-2',
    name: 'Wheat Aphid',
    scientificName: 'Rhopalosiphum padi / Sitobion avenae',
    affectedCrops: ['Wheat', 'Barley', 'Oats'],
    symptoms: 'Colonies cluster on tender leaves, shoots, and developing ears, sucking sap and secreting sticky honeydew which fosters black sooty mold growth and causes stunting.',
    prevention: 'Conserve natural predators such as ladybird beetles, hoverfly maggots, and lacewings; maintain balanced phosphorus and potassium nutrition.',
    controlMethod: 'Spray neem-based formulations (Azadirachtin 0.03%) at first appearance; if colonies exceed 10–15 aphids per earhead, apply approved selective biopesticides.',
    imageUrl: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?auto=format&fit=crop&w=800&q=80',
    severity: 'Moderate'
  },
  {
    id: 'pest-3',
    name: 'Brown Planthopper (BPH)',
    scientificName: 'Nilaparvata lugens',
    affectedCrops: ['Rice'],
    symptoms: 'Nymphs and adults gather at the base of rice tillers, draining vascular sap resulting in circular patches of dried, straw-colored collapsed plants known as "Hopper Burn". Also transmits grassy stunt virus.',
    prevention: 'Practice alternate wetting and drying (AWD) rather than continuous flooding; avoid blanket broad-spectrum synthetic pyrethroid sprays that destroy spider predators.',
    controlMethod: 'Drain standing water for 3 to 4 days to disrupt microclimate humidity; apply botanical neem oil sprays or targeted insect growth regulators.',
    imageUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
    severity: 'High'
  },
  {
    id: 'pest-4',
    name: 'Fall Armyworm',
    scientificName: 'Spodoptera frugiperda',
    affectedCrops: ['Maize', 'Sorghum', 'Rice', 'Wheat'],
    symptoms: 'Ragged, saw-toothed holes on leaf whorls with heavy granular frass (excreta) packed inside the central whorl, leading to severed seedlings and damaged ears.',
    prevention: 'Intercrop with leguminous pulses (push-pull strategy); erect pheromone traps for early male moth monitoring.',
    controlMethod: 'Handpick egg masses; apply Bacillus thuringiensis (Bt) microbial sprays or Metarhizium anisopliae bio-fungus.',
    imageUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80',
    severity: 'High'
  }
];

export const INITIAL_DISEASES: Disease[] = [
  {
    id: 'disease-1',
    name: 'Wheat Rust (Stripe / Yellow & Brown Rust)',
    causalOrganism: 'Puccinia striiformis / Puccinia triticina',
    pathogenType: 'Fungal',
    affectedCrops: ['Wheat', 'Triticale', 'Barley'],
    symptoms: 'Yellow to orange-brown powdery pustules (uredinia) arranged in distinct linear stripes along the leaf veins on stripe rust, or randomly scattered brown spots on leaves in leaf rust, severely cutting photosynthetic area.',
    treatment: 'Foliar application of triazole fungicides (such as Propiconazole or Tebuconazole) at first sign of pustules on flag leaves.',
    prevention: 'Sow resistant seed cultivars (e.g., HD-2967, PBW-550); practice timely early planting; avoid excessive nitrogen doses.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'disease-2',
    name: 'Rice Blast',
    causalOrganism: 'Magnaporthe oryzae (Pyricularia oryzae)',
    pathogenType: 'Fungal',
    affectedCrops: ['Rice'],
    symptoms: 'Spindle- or diamond-shaped lesions with grayish-white centers and dark brown margins on leaves; rotting and darkening of the panicle neck ("Neck Blast") causing empty grain heads.',
    treatment: 'Spray systemic bio-fungicides or Tricyclazole / Isoprothiolane at panicle emergence and flowering.',
    prevention: 'Seed treatment with Trichoderma viride or Carbendazim before nursery sowing; maintain split application of nitrogenous fertilizers.',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'disease-3',
    name: 'Bacterial Leaf Blight (BLB)',
    causalOrganism: 'Xanthomonas oryzae pv. oryzae',
    pathogenType: 'Bacterial',
    affectedCrops: ['Rice'],
    symptoms: 'Water-soaked translucent stripes on leaf margins turning wavy yellow-white, developing milky bacterial ooze droplets on leaves during early morning humid hours.',
    treatment: 'Apply Copper Oxychloride combined with Streptocycline or plant extracts upon symptom detection; avoid clipping seedlings at transplanting.',
    prevention: 'Ensure balanced potassium fertilization; ensure field drainage; use certified disease-free foundation seed.',
    imageUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'disease-4',
    name: 'Tomato Early Blight',
    causalOrganism: 'Alternaria solani',
    pathogenType: 'Fungal',
    affectedCrops: ['Tomato', 'Potato', 'Eggplant'],
    symptoms: 'Circular dark brown spots with concentric target-board rings on older lower leaves first, surrounded by a chlorotic yellow halo; leaf drop and stem collar rot.',
    treatment: 'Foliar spray with Copper Hydroxide, Mancozeb, or biological Bacillus subtilis formulation.',
    prevention: 'Mulch soil surface with clean straw to prevent soil-splash onto foliage; prune lower suckers; maintain drip irrigation instead of overhead sprinklers.',
    imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80'
  }
];

export const INITIAL_TIPS: FarmingTip[] = [
  {
    id: 'tip-1',
    title: 'Modern Crop Rotation: Breaking Pest & Disease Cycles',
    category: 'Crop Rotation',
    summary: 'Rotating heavy feeder cereals (like Wheat and Rice) with nitrogen-fixing pulses (Chickpea, Lentil) restores soil organic matter and slashes fertilizer expenditures.',
    fullGuide: 'Continuous monocropping depletes specific soil micronutrients and allows specialized soil-borne pathogens (like nematodes and root rots) to build up lethal population thresholds. By alternating deep-rooted taproot legumes with shallow fibrous-rooted cereals:\n\n1. Biological Nitrogen Fixation: Rhizobium bacteria in pulse root nodules fix up to 40-70 kg of atmospheric N per hectare.\n2. Weed Suppression: Smother crops outcompete seasonal weed seeds without chemical herbicides.\n3. Pest Interruption: Pests specific to monocot cereals starve when a dicot legume is introduced in the rotation cycle.',
    targetAudience: 'All',
    readTime: '3 min read'
  },
  {
    id: 'tip-2',
    title: 'Alternate Wetting and Drying (AWD) in Paddy Rice',
    category: 'Irrigation',
    summary: 'A proven smart irrigation technique that cuts water consumption in rice cultivation by up to 30% while reducing greenhouse methane emissions without reducing yields.',
    fullGuide: 'Rather than maintaining 5 cm of continuous standing floodwater throughout the entire season, AWD allows the field to drain naturally until water drops 15 cm below soil surface (monitored via a perforated field pipe) before re-flooding.\n\nKey steps:\n- Install a 30 cm long, 10–15 cm diameter perforated PVC field tube 15 cm deep into the soil.\n- Keep flooded for the first 1–2 weeks after transplanting for seedling establishment.\n- Allow water to recede to the bottom of the tube before adding 5 cm of fresh water.\n- Maintain continuous shallow water strictly during flowering and panicle heading stages.',
    targetAudience: 'Farmers',
    readTime: '4 min read'
  },
  {
    id: 'tip-3',
    title: 'Soil pH Testing and Nutrients: Student Laboratory & Field Guide',
    category: 'Soil Health',
    summary: 'Understanding how soil acidity or alkalinity dictates mineral availability (NPK, Zinc, Iron, Boron) for optimal seedling germination and root development.',
    fullGuide: 'Soil pH is the master variable in agronomy. Most cereal grains thrive in the 6.2 – 7.2 pH range.\n\n- Acid Soils (pH < 5.8): Aluminum and manganese toxicity occur, while phosphorus becomes strongly bound and unavailable. Apply agricultural lime (calcium carbonate) or dolomite.\n- Alkaline / Sodic Soils (pH > 7.8): Micronutrients like Iron, Manganese, and Zinc precipitate. Apply agricultural gypsum (calcium sulfate) along with sulfur and organic compost.\n\nStudent tip: Always use a calibrated digital pH probe or colorimetric test kit with a 1:2.5 soil-to-distilled-water slurry for accurate field diagnostics.',
    targetAudience: 'Students',
    readTime: '5 min read'
  },
  {
    id: 'tip-4',
    title: 'Integrated Pest Management (IPM) 4-Pillar Strategy',
    category: 'Pest Management',
    summary: 'Combining cultural, mechanical, biological, and chemical controls in a stepped hierarchy to protect crops economically and preserve beneficial pollinators.',
    fullGuide: 'IPM is an ecosystem approach that focuses on long-term pest management through minimal pesticide reliance:\n\n1. Cultural Control: Resistant crop varieties, clean field borders, trap crops (such as marigold planted around tomatoes to trap fruit borers).\n2. Mechanical Control: Yellow sticky traps for whiteflies, blue traps for thrips, pheromone delta traps for moths.\n3. Biological Control: Encouraging ladybug predators, installing bird perches, deploying Bacillus thuringiensis (Bt).\n4. Chemical Control: Used only as an absolute last resort when economic injury levels (EIL) are breached, using narrow-spectrum targeted products.',
    targetAudience: 'All',
    readTime: '4 min read'
  }
];
