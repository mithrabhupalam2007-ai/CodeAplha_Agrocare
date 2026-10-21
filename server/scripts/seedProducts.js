/**
 * Seed the database with clearly-labelled DEMO products and categories for
 * the seven-category store taxonomy (Seeds, Crop Protection, Crop
 * Nutrition, Equipments, Animal Husbandry, Organic, Tapas).
 * Safe to re-run: every record is upserted by name; category records that
 * no longer exist in the taxonomy are removed.
 *
 * Entries below classify with the historic shorthand `type` (main) +
 * `category` (sub) (+ optional `additionalCategories` / `heading`); the
 * validation pass just before seeding normalizes everything to
 * primaryCategory / heading / subcategory / additionalCategories against
 * server/utils/taxonomy.js. A few legacy demo records have no fitting
 * subcategory in the new structure — they are seeded with a heading only
 * (subcategory '') and reported below, so nothing is silently deleted.
 *
 *   npm run seed
 *
 * DEMO-DATA NOTICE
 * All brands, prices, label text and specifications below are fictional
 * demonstration data. In particular, pesticide label / registration fields
 * are NOT real and must be replaced with verified label information before
 * any real sale (Indian Insecticides Act, 1968 registration + seller licence
 * apply).
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const taxonomy = require('../utils/taxonomy');

/** URL-style slug shared with the art generator (server/scripts/generateDemoArt.js). */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SUB_DESCRIPTIONS = {
  // Seeds
  'Vegetable Seeds': 'Vegetable seeds for kharif, rabi and kitchen-garden plantings (demo catalogue).',
  'Fruit Seeds': 'Melon, papaya, gourd and other fruit-crop seeds (demo catalogue).',
  'Flower Seeds': 'Marigold, rose and other flowering-crop seeds (demo catalogue).',
  Forages: 'Berseem, fodder maize and other forage crop seeds (demo catalogue).',
  'Maize/Corn': 'Hybrid and open-pollinated maize seed listings (demo catalogue).',
  Paddy: 'Paddy (rice) varieties for kharif plantings (demo catalogue).',
  Mustard: 'Mustard and oilseed varieties for rabi (demo catalogue).',
  Jowar: 'Jowar (sorghum) seed listings (demo catalogue).',
  Cotton: 'Cotton hybrid and deshi seed listings (demo catalogue).',
  Polyhouse: 'Seeds suited to polyhouse and protected cultivation (demo catalogue).',
  Exotics: 'Exotic vegetable seed listings for specialty markets (demo catalogue).',

  'Urban Garden': 'Terrace and kitchen-garden seed packs (demo catalogue).',

  // Crop Protection — chemical
  Insecticides: 'Demo insecticide listings — always follow the original product label.',
  Fungicides: 'Demo fungicide listings for fungal disease management.',
  Herbicides: 'Demo weed-management listings for field and orchard use.',
  Bactericides: 'Demo bacterial-disease management listings (label data is fictional).',
  // Crop Protection — bio
  'Bio Insecticides': 'Neem-based and microbial demo products for low-chemical farming.',
  'Bio Fungicides': 'Microbial bio-fungicide demo listings (label data is fictional).',
  'Bio Viricides': 'Demo virus-management bio listings (label data is fictional).',
  'Bio Nematicides': 'Demo bio nematicide listings for soil nematode management.',
  // Crop Protection — traps and lures
  'Sticky Traps': 'Yellow and blue sticky trap listings for monitoring and mass trapping.',
  'Pheromone Lures': 'Species-specific pheromone lure capsule listings (demo).',
  'Pheromone Traps': 'Funnel and bucket pheromone trap listings (demo).',
  'Solar Light Traps': 'Solar-powered light trap listings for night-time insect monitoring.',
  // Crop Nutrition — fertilizers
  'Chemical Fertilizers': 'Straight and complex fertilizer listings such as urea, SSP and MOP (demo catalogue).',
  'Bio/Organic Fertilizers': 'Compost, vermicompost and microbial biofertilizer listings (demo catalogue).',
  'Micro Nutrients': 'Zinc, iron and other micronutrient listings (demo catalogue).',
  'Humic Acids': 'Humic and fulvic acid soil-conditioner listings (demo catalogue).',
  'pH Balancers': 'Soil pH correction product listings such as lime (demo catalogue).',
  // Crop Nutrition — growth promoters
  'Plain Growth Promoters': 'General plant-growth promoter listings (demo catalogue).',
  'Plant Enhancers': 'Foliar enhancer and vigour listings (demo catalogue).',
  'Bio Stimulants': 'Seaweed, amino-acid and microbial bio-stimulant listings (demo catalogue).',
  // Crop Nutrition — plant growth regulators
  'Yield Boosters': 'Plant growth regulator demo listings — follow the product label strictly.',
  'Fruit Enhancers': 'Fruit-set and quality enhancer demo listings (label data is fictional).',
  'Flower Boosters': 'Flowering promoter demo listings (label data is fictional).',
  // Equipments — implements
  Sprayers: 'Knapsack, battery and power sprayer listings.',
  'Brush Cutter': 'Brush cutter and blade-set listings for field clearing.',
  'Weeder/Tiller': 'Weeder and rotary tiller listings for small holdings.',
  'Chaff Cutter and Parts': 'Chaff cutter machines and spare-part listings.',
  'Solar Dryer': 'Solar crop dryer listings for grains, fruit and spice drying.',
  'Rice Mill': 'Domestic and commercial rice mill listings.',
  'Earth Augers': 'Manual and engine earth-auger listings for pole and pit digging.',
  'Power Reaper': 'Power reaper listings for small-grain harvesting.',
  'Chain Saw': 'Petrol and electric chain saw listings.',
  'Sugarcane Machine': 'Sugarcane loading and handling machine listings.',
  // Equipments — agriculture tools
  'Nursery Inputs': 'Watering cans, seedling trays and nursery-bed supplies.',
  'Fruit Harvester/Plucker': 'Fruit harvester pole and plucker listings.',
  'Garden Tools': 'Hoes, shears and hand-tool listings for garden and field.',
  'Seeder/Transplanter': 'Seed drill and paddy transplanter listings.',
  // Equipments — farm protection and covering
  Tarpaulin: 'Tarpaulin and heavy-duty cover sheet listings.',
  Mulch: 'Mulch film and organic mulch material listings.',
  'Shade Net': 'Green shade-net listings for nurseries and polyhouses.',
  'Traps and Lure': 'Combo trap-and-lure kits for integrated pest management.',
  'Safety Kit': 'Gloves, masks, goggles and protective-equipment listings.',
  'Torch/Lantern': 'Rechargeable field torch and lantern listings.',
  'Crop Cover': 'Crop cover net and row-cover listings.',
  // Equipments — irrigation
  Pipe: 'HDPE and layflat irrigation pipe listings.',
  'Water Pump': 'Monoblock and centrifugal water pump listings.',
  Sprinkler: 'Rotary and micro-sprinkler listings.',
  'Drip Kit': 'Ready-to-install drip irrigation kit listings.',
  // Animal Husbandry — cattle
  'Cattle Feed': 'Cattle feed pellet and mash listings (demo catalogue).',
  'Cattle Supplements': 'Mineral mixture and feed supplement listings for cattle.',
  'Milking Machine': 'Bucket and pipeline milking machine listings.',
  'Milking Machine Accessories': 'Liner, claw and tubing spare-part listings.',
  'Calf Feeding Bottle': 'Calf feeding bottle and teat listings.',
  // Animal Husbandry — poultry
  'Poultry Supplements': 'Calcium and vitamin supplement listings for poultry.',
  'Poultry Equipment': 'Feeders, drinkers and brooder equipment listings.',
  // Organic (cross-listed bio lines)
  // Tapas
  'Farm Implements': 'Curated small-implement combo listings for the Tapas collection.',
  'Traps and Lures': 'Curated trap-and-lure combo listings for the Tapas collection.',
  'Mulching Sheet': 'Curated mulching sheet listings for the Tapas collection.',
};

/** Category records = every subcategory of the seven main categories. */
const CATEGORIES = Object.entries(taxonomy.SUBCATEGORIES).flatMap(([type, subs]) =>
  subs.map((name) => ({
    name,
    type,
    // Heading section ('' for Tapas, which lists subcategories directly).
    heading: taxonomy.headingOf(type, name) || '',
    image: taxonomy.tilePath(name),
    description: SUB_DESCRIPTIONS[name] || `${name} demo listings.`,
  }))
);

/** Demo label template — deliberately avoids invented dosage/claim data. */
const DEMO_LABEL = {
  composition: 'DEMO DATA — composition not verified. Refer to the actual product label before use.',
  registrationNo: 'DEMO-000000 (fictional demo entry, not a real registration number)',
  labelInstructions:
    'Demo listing. Always read and follow the instructions printed on the original product label, including the approved method of application, pre-harvest interval and recommended personal protective equipment.',
  safetyPrecautions:
    'Demo listing. As a general precaution: wear gloves, a face mask and protective clothing when handling any crop-protection product; wash hands and face after handling; do not eat, drink or smoke while spraying.',
  storage: 'Demo listing. Store in the original closed container, away from food, feed and out of reach of children and animals.',
  disposal: 'Demo listing. Do not reuse the container. Dispose of empty packaging and leftover product according to local municipal and agricultural-authority guidelines.',
};

const PESTICIDE_SPEC = [{ label: 'Product status', value: 'DEMO LISTING — not a real product' }];

const P = (doc) => ({
  isDemoData: true,
  active: true,
  // explicit defaults so re-seeding always resets demo state
  mrp: null,
  images: [],
  manualOutOfStock: false,
  isNewRelease: false,
  releaseDate: null,
  isSeasonal: false,
  seasonalNote: '',
  reviewCount: 40 + Math.floor(Math.random() * 160),
  ...doc,
});

const PRODUCTS = [
  // ---------------- Vegetable Seeds ----------------
  P({
    name: 'Tomato Hybrid Seed - Pushpa F1 (Demo)',
    description: 'Early-maturing hybrid tomato seed demo listing with uniform red fruit and good field tolerance. Suitable for kharif and rabi plantings in most Indian growing regions.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 120, packSize: '10 g',
    image: '/images/products/tomato-hybrid-seed.jpg', stockQuantity: 148, featured: true, bestseller: true, rating: 4.5,
    crops: ['Tomato'],
    seedInfo: { variety: 'Pushpa F1 (demo variety)', cropType: 'Tomato', germinationPercent: 85, daysToGerminate: '6-10 days', sowingInstructions: 'Demo guidance: sow in raised nursery beds, transplant 25-30 day seedlings at 45 x 30 cm spacing. Refer to local horticulture advisories for your region.' },
    specifications: [
      { label: 'Seed type', value: 'Hybrid (demo data)' },
      { label: 'Sowing season', value: 'Kharif and Rabi (demo)' },
      { label: 'Germination', value: '85% minimum (demo claim, not lab verified)' },
    ],
  }),
  P({
    name: 'Chilli Seed - Tejas Hybrid (Demo)',
    description: 'Medium-pungent hybrid chilli seed demo listing with long, dark-green to red fruits that mature evenly across the field.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 145, packSize: '10 g',
    image: '/images/products/chilli-seed.jpg', stockQuantity: 96, rating: 4.3,
    crops: ['Chilli'],
    seedInfo: { variety: 'Tejas Hybrid (demo variety)', cropType: 'Chilli', germinationPercent: 82, daysToGerminate: '8-12 days', sowingInstructions: 'Demo guidance: raise seedlings in poly trays, transplant after 45-50 days at 60 x 45 cm spacing.' },
    specifications: [{ label: 'Fruit length', value: '8-10 cm (demo data)' }, { label: 'Pungency', value: 'Medium (demo data)' }],
  }),
  P({
    name: 'Okra (Bhindi) Seed - Annapurna (Demo)',
    description: 'Straight-podded okra demo seed listing with vigorous growth and continuous picking over the season.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 95, packSize: '50 g',
    image: '/images/products/okra-seed.jpg', stockQuantity: 132, rating: 4.4,
    crops: ['Okra'],
    seedInfo: { variety: 'Annapurna (demo variety)', cropType: 'Okra', germinationPercent: 80, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: direct-sow 2-3 seeds per hill at 60 x 45 cm spacing after soil warms.' },
    specifications: [{ label: 'Pod colour', value: 'Dark green (demo)' }],
  }),
  P({
    name: 'Spinach (Palak) Seed - Green Drop (Demo)',
    description: 'Quick-growing spinach demo seed listing for year-round leafy greens; suitable for beds and container growing.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 60, packSize: '25 g',
    image: '/images/products/spinach-seed.jpg', stockQuantity: 210, isSeasonal: true, seasonalNote: 'Cool-weather leafy greens (demo)', rating: 4.2,
    crops: ['Spinach'],
    seedInfo: { variety: 'Green Drop (demo variety)', cropType: 'Spinach', germinationPercent: 78, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: sow shallowly in rows 30 cm apart; successive sowings every 3 weeks keep leaves coming.' },
    specifications: [],
  }),
  P({
    name: 'Cucumber Seed - Kaveri Hybrid (Demo)',
    description: 'High-yielding cucumber demo seed listing with crisp medium-long fruits, suited to trellis or flat cultivation.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 110, packSize: '20 g',
    image: '/images/products/cucumber-seed.jpg', stockQuantity: 74, rating: 4.1,
    crops: ['Cucumber'],
    seedInfo: { variety: 'Kaveri Hybrid (demo variety)', cropType: 'Cucumber', germinationPercent: 84, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: direct sow at 2 hills per metre; keep soil evenly moist during flowering.' },
    specifications: [],
  }),

  // ---------------- Cereal and Grain Seeds ----------------
  P({
    name: 'Paddy (Rice) Seed - Sugandha (Demo)',
    description: 'Aromatic long-grain paddy demo seed listing suited to transplanted cultivation under normal water management.',
    category: 'Paddy', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 480, packSize: '5 kg',
    image: '/images/products/paddy-seed.svg', stockQuantity: 85, featured: true, isSeasonal: true, seasonalNote: 'Kharif sowing season (demo)', rating: 4.6,
    crops: ['Paddy', 'Rice'],
    seedInfo: { variety: 'Sugandha (demo variety)', cropType: 'Paddy', germinationPercent: 88, daysToGerminate: '3-5 days', sowingInstructions: 'Demo guidance: nursery raise 25 days, transplant 2-3 seedlings per hill at 20 x 15 cm.' },
    specifications: [{ label: 'Grain type', value: 'Long slender (demo)' }, { label: 'Duration', value: '125-135 days (demo)' }],
  }),
  P({
    name: 'Wheat Seed - Sharad (Demo)',
    description: 'Rabi wheat demo seed listing with strong tillering and good grain filling under irrigated conditions.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 650, packSize: '10 kg',
    image: '/images/products/wheat-seed.svg', stockQuantity: 70, isSeasonal: true, seasonalNote: 'Rabi sowing season (demo)', rating: 4.4,
    crops: ['Wheat'],
    seedInfo: { variety: 'Sharad (demo variety)', cropType: 'Wheat', germinationPercent: 90, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: drill at 20 cm row spacing with 40-50 kg seed per hectare after timely sowing.' },
    specifications: [{ label: 'Duration', value: '110-120 days (demo)' }],
  }),
  P({
    name: 'Maize Seed - Amber Hybrid (Demo)',
    description: 'Yellow-flint maize demo seed listing with sturdy stalks and uniform cobs for kharif or rabi plantings.',
    category: 'Maize/Corn', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 280, packSize: '1 kg',
    image: '/images/products/maize-seed.svg', stockQuantity: 110, rating: 4.3,
    crops: ['Maize', 'Corn'],
    seedInfo: { variety: 'Amber Hybrid (demo variety)', cropType: 'Maize', germinationPercent: 87, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: sow at 60 x 25 cm spacing; thin to one plant per hill after emergence.' },
    specifications: [],
  }),

  // ---------------- Oilseed / Fibre seeds ----------------
  P({
    name: 'Groundnut Seed - Kadbi (Demo)',
    description: 'Kharif groundnut demo seed listing with high shelling percentage and medium-duration maturity.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 260, packSize: '1 kg',
    image: '/images/products/groundnut-seed.svg', stockQuantity: 55, rating: 4.2,
    crops: ['Groundnut'],
    seedInfo: { variety: 'Kadbi (demo variety)', cropType: 'Groundnut', germinationPercent: 82, daysToGerminate: '6-8 days', sowingInstructions: 'Demo guidance: sow at 30 x 15 cm in well-drained sandy loam; avoid waterlogging.' },
    specifications: [],
  }),
  P({
    name: 'Cotton Seed - Kapaat F1 (Demo)',
    description: 'Bollgard-style demo listing for hybrid cotton seed with medium duration and uniform boll opening. Fictional demo product.',
    category: 'Cotton', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 340, packSize: '500 g',
    image: '/images/products/cotton-seed.jpg', stockQuantity: 60, bestseller: true, isSeasonal: true, seasonalNote: 'Kharif cotton belt (demo)', rating: 4.5,
    crops: ['Cotton'],
    seedInfo: { variety: 'Kapaat F1 (demo variety)', cropType: 'Cotton', germinationPercent: 80, daysToGerminate: '7-10 days', sowingInstructions: 'Demo guidance: sow at 60 x 30 cm spacing after the soil reaches suitable temperature for your region.' },
    specifications: [{ label: 'Duration', value: '160-170 days (demo data)' }],
  }),

  // ---------------- Fruit and Melon Seeds ----------------
  P({
    name: 'Watermelon Seed - Chandan (Demo)',
    description: 'Sweet, round watermelon demo seed listing with strong vine vigour and uniform fruit size.',
    category: 'Fruit Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 165, packSize: '10 g',
    image: '/images/products/watermelon-seed.jpg', stockQuantity: 68, isSeasonal: true, seasonalNote: 'Summer season pick (demo)', rating: 4.6,
    crops: ['Watermelon'],
    seedInfo: { variety: 'Chandan (demo variety)', cropType: 'Watermelon', germinationPercent: 86, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: raise transplants in poly bags, plant out at 2 x 1.5 m spacing.' },
    specifications: [{ label: 'Rind', value: 'Striped dark green (demo)' }],
  }),
  P({
    name: 'Muskmelon Seed - Madhur (Demo)',
    description: 'Aromatic muskmelon demo seed listing with netted rind and high sugar content in demo descriptions.',
    category: 'Fruit Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 85, packSize: '10 g',
    image: '/images/products/muskmelon-seed.jpg', stockQuantity: 90, rating: 4.3,
    crops: ['Muskmelon'],
    seedInfo: { variety: 'Madhur (demo variety)', cropType: 'Muskmelon', germinationPercent: 83, daysToGerminate: '5-7 days', sowingInstructions: 'Demo guidance: direct sow at 2 x 1 m spacing on well-drained sandy loam.' },
    specifications: [],
  }),
  P({
    name: 'Papaya Seed - Madhuram (Demo)',
    description: 'Papaya demo seed listing from a fictional hybrid line; plants begin bearing early under good management.',
    category: 'Fruit Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 75, packSize: '50 seeds',
    image: '/images/products/papaya-seed.jpg', stockQuantity: 120, rating: 4.4,
    crops: ['Papaya'],
    seedInfo: { variety: 'Madhuram (demo variety)', cropType: 'Papaya', germinationPercent: 76, daysToGerminate: '10-15 days', sowingInstructions: 'Demo guidance: sow nursery-raised seedlings at 2.5 x 2.5 m spacing; avoid waterlogged soil.' },
    specifications: [],
  }),
  P({
    name: 'Strawberry Seed - Sunkiss (Demo)',
    description: 'Day-neutral strawberry demo seed listing for kitchen gardens and polyhouse trays.',
    category: 'Fruit Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 199, packSize: '100 seeds',
    image: '/images/products/strawberry-seed.jpg', stockQuantity: 44, rating: 4.0,
    crops: ['Strawberry'],
    seedInfo: { variety: 'Sunkiss (demo variety)', cropType: 'Strawberry', germinationPercent: 70, daysToGerminate: '14-21 days', sowingInstructions: 'Demo guidance: surface-sow on moist cocopeat, cover lightly, keep 20-25 C until germination.' },
    specifications: [],
  }),

  // ---------------- Pulse and Legume Seeds (new demo listings) ----------------
  P({
    name: 'Gram (Chickpea) Seed - Jyoti (Demo)',
    description: 'Desi-style gram demo seed listing with medium-duration maturity for rabi plantings on well-drained soils.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 165, packSize: '1 kg',
    image: '/images/products/pulse-gram-seed.svg', stockQuantity: 90, rating: 4.3,
    crops: ['Gram', 'Chickpea'],
    seedInfo: { variety: 'Jyoti (demo variety)', cropType: 'Gram', germinationPercent: 85, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: drill at 30 x 10 cm spacing after timely rabi sowing; avoid waterlogged fields.' },
    specifications: [{ label: 'Seed type', value: 'Desi (demo data)' }],
  }),
  P({
    name: 'Tur (Arhar) Seed - Sukhad (Demo)',
    description: 'Medium-duration tur demo seed listing suited to kharif and summer plantings in pulse-growing regions.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 210, packSize: '1 kg',
    image: '/images/products/pulse-tur-seed.svg', stockQuantity: 66, rating: 4.2,
    crops: ['Tur', 'Arhar', 'Pigeon Pea'],
    seedInfo: { variety: 'Sukhad (demo variety)', cropType: 'Tur', germinationPercent: 80, daysToGerminate: '6-10 days', sowingInstructions: 'Demo guidance: sow at 60 x 30 cm spacing; thin to one plant per hill after emergence.' },
    specifications: [],
  }),
  P({
    name: 'Moong Seed - Sona (Demo)',
    description: 'Short-duration moong demo seed listing for kharif and summer sowings with quick maturity.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 145, packSize: '1 kg',
    image: '/images/products/pulse-moong-seed.svg', stockQuantity: 110, rating: 4.1,
    crops: ['Moong', 'Green Gram'],
    seedInfo: { variety: 'Sona (demo variety)', cropType: 'Moong', germinationPercent: 82, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: broadcast or drill in 30 cm rows; avoid waterlogging after flowering.' },
    specifications: [],
  }),

  // ---------------- Hybrid Seeds (new demo listings) ----------------
  P({
    name: 'Hybrid Bitter Gourd Seed - Karuna F1 (Demo)',
    description: 'High-yielding hybrid bitter gourd demo seed listing with uniform ridged fruits and early vine maturity.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 95, packSize: '10 g',
    image: '/images/products/hybrid-bittergourd-seed.svg', stockQuantity: 58, rating: 4.2,
    crops: ['Bitter Gourd'],
    seedInfo: { variety: 'Karuna F1 (demo variety)', cropType: 'Bitter Gourd', germinationPercent: 83, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: raise poly-bag transplants, plant out at 2 x 1 m on trellis systems.' },
    specifications: [{ label: 'Seed type', value: 'Hybrid (demo data)' }],
  }),
  P({
    name: 'Hybrid Cauliflower Seed - Sheet F1 (Demo)',
    description: 'Mid-season hybrid cauliflower demo seed listing with compact white curds and uniform maturity.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 110, packSize: '10 g',
    image: '/images/products/hybrid-cauliflower-seed.svg', stockQuantity: 64, rating: 4.3,
    crops: ['Cauliflower'],
    seedInfo: { variety: 'Sheet F1 (demo variety)', cropType: 'Cauliflower', germinationPercent: 86, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: raise nursery seedlings, transplant at 60 x 45 cm spacing in rabi plantings.' },
    specifications: [{ label: 'Seed type', value: 'Hybrid (demo data)' }],
  }),

  // ---------------- Organic and Traditional Seeds (new demo listings) ----------------
  P({
    name: 'Heirloom Bottle Gourd Seed - Desi (Demo)',
    description: 'Traditional open-pollinated bottle gourd demo seed listing saved from long-running desi lines.',
    category: 'Vegetable Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 60, packSize: '20 g',
    image: '/images/products/organic-bottlegourd-seed.svg', stockQuantity: 120, rating: 4.0,
    crops: ['Bottle Gourd'],
    seedInfo: { variety: 'Desi long (demo variety)', cropType: 'Bottle Gourd', germinationPercent: 78, daysToGerminate: '6-10 days', sowingInstructions: 'Demo guidance: direct sow 2 seeds per hill at 2 x 1.5 m spacing on raised beds.' },
    specifications: [{ label: 'Seed type', value: 'Open-pollinated heirloom (demo)' }],
  }),
  P({
    name: 'Traditional Foxtail Millet Seed (Demo)',
    description: 'Traditional foxtail millet demo seed listing for dryland farming demonstrations and kitchen gardens.',
    category: '', type: 'Seeds', heading: 'Field Crops', brand: 'KrishiBeej (Demo)', price: 120, packSize: '500 g',
    image: '/images/products/organic-millet-seed.svg', stockQuantity: 85, rating: 4.2,
    crops: ['Foxtail Millet'],
    seedInfo: { variety: 'Traditional (demo variety)', cropType: 'Foxtail Millet', germinationPercent: 80, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: drill or broadcast in 25 cm rows; thin seedlings after 15-20 days.' },
    specifications: [{ label: 'Seed type', value: 'Traditional open-pollinated (demo)' }],
  }),

  // ---------------- Insecticides (demo label data only) ----------------
  P({
    name: 'FarmGuard Crop Shield Insecticide (Demo)',
    description: 'Fictional broad-spectrum insecticide demo listing for the AgroShield marketplace. This is demonstration data only — it is not a registered product. Always rely on the original product label of whatever you actually purchase.',
    category: 'Insecticides', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 425, packSize: '500 ml',
    image: '/images/products/insecticide-shield.svg', stockQuantity: 75, bestseller: true, rating: 4.4,
    crops: ['Cotton', 'Paddy', 'Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: [
      { label: 'Product status', value: 'DEMO LISTING — not a real product' },
      { label: 'Formulation', value: 'See original label of actual product' },
      { label: 'Shelf life', value: 'See original label of actual product' },
    ],
  }),
  P({
    name: 'FarmGuard Leaf Guard Spray (Demo)',
    description: 'Fictional foliar insecticide demo listing used to demonstrate pesticide pages on this platform. Not for sale — not a registered product.',
    category: 'Insecticides', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 640, packSize: '1 L',
    image: '/images/products/leaf-guard-spray.svg', stockQuantity: 40, rating: 4.2,
    crops: ['Vegetables', 'Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'BioAgro Beat Bug Concentrate (Demo)',
    description: 'Fictional concentrated insecticide demo listing for nursery and greenhouse demonstrations on this site.',
    category: 'Insecticides', type: 'Crop Protection', brand: 'BioAgro (Demo)', price: 290, packSize: '250 ml',
    image: '/images/products/beat-bug.svg', stockQuantity: 88, rating: 4.1,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Fungicides ----------------
  P({
    name: 'FarmGuard Fungal Shield WP (Demo)',
    description: 'Fictional protective fungicide demo listing. Demonstration data only — replace with verified label details of a genuinely registered product before real listing.',
    category: 'Fungicides', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 380, packSize: '500 g',
    image: '/images/products/fungal-shield.svg', stockQuantity: 62, rating: 4.3,
    crops: ['Paddy', 'Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Blight Guard Fungicide (Demo)',
    description: 'Fictional systemic fungicide demo listing for demonstrating crop-protection pages. Not a real registered product.',
    category: 'Fungicides', type: 'Crop Protection', brand: 'GreenField (Demo)', price: 720, packSize: '1 L',
    image: '/images/products/blight-guard.svg', stockQuantity: 36, rating: 4.5,
    crops: ['Tomato', 'Potato', 'Grapes'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Herbicides (Weed Killers) ----------------
  P({
    name: 'WeedOut Field Herbicide (Demo)',
    description: 'Fictional pre-emergence herbicide demo listing for field weed management demonstrations on this platform.',
    category: 'Herbicides', type: 'Crop Protection', brand: 'WeedOut (Demo)', price: 560, packSize: '1 L',
    image: '/images/products/weedout-field.svg', stockQuantity: 58, rating: 4.2,
    crops: ['Cotton', 'Maize', 'Paddy'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'WeedOut Orchard Cleaner (Demo)',
    description: 'Fictional non-selective herbicide demo listing for orchard floor management demonstrations. Not a real product.',
    category: 'Herbicides', type: 'Crop Protection', brand: 'WeedOut (Demo)', price: 395, packSize: '500 ml',
    image: '/images/products/orchard-cleaner.svg', stockQuantity: 47, rating: 4.0,
    crops: ['Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- New pesticide subcategories (demo label data only) ----------------
  P({
    name: 'FarmGuard Copper Bactericide WP (Demo)',
    description: 'Fictional copper-based bactericide demo listing for demonstrating the Bactericides subcategory. Not a registered product — verified label data would be required before any real listing.',
    category: 'Bactericides', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 280, packSize: '500 g',
    image: '/images/products/bactericide-copper.svg', stockQuantity: 55, rating: 4.1,
    crops: ['Vegetables', 'Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Soil Nematicide (Demo)',
    description: 'Fictional soil-applied nematicide demo listing for demonstrating the Nematicides subcategory. Not a registered product.',
    category: '', type: 'Crop Protection', heading: 'Chemical Pesticides', brand: 'GreenField (Demo)', price: 450, packSize: '1 L',
    image: '/images/products/nematicide-soil.svg', stockQuantity: 42, rating: 4.0,
    crops: ['Vegetables', 'Banana'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'SafeKill Rodenticide Bait Blocks (Demo)',
    description: 'Fictional rodenticide bait-block demo listing for demonstrating the Rodenticides subcategory. Not a real product — secure all bait stations against children and animals.',
    category: '', type: 'Crop Protection', heading: 'Chemical Pesticides', brand: 'SafeKill (Demo)', price: 150, packSize: '100 g (blocks)',
    image: '/images/products/rodenticide-bait.svg', stockQuantity: 70, rating: 4.0,
    crops: [],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Molluscicide Pellets (Demo)',
    description: 'Fictional molluscicide pellet demo listing for demonstrating the Molluscicides (Snail and Slug Killers) subcategory. Not a registered product.',
    category: '', type: 'Crop Protection', heading: 'Chemical Pesticides', brand: 'GreenField (Demo)', price: 230, packSize: '500 g',
    image: '/images/products/molluscicide-pellets.svg', stockQuantity: 51, rating: 4.0,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'FarmGuard Seed Treatment Fungi Guard (Demo)',
    description: 'Fictional seed-treatment fungicide demo listing for demonstrating the Seed Treatment Pesticides subcategory. Not a registered product.',
    category: 'Fungicides', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 320, packSize: '1 kg',
    image: '/images/products/seed-treatment.svg', stockQuantity: 63, rating: 4.2,
    crops: ['Wheat', 'Groundnut', 'Cotton'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Bio-Pesticides ----------------
  P({
    name: 'BioAgro Cold-Pressed Neem Oil (Demo)',
    description: 'Cold-pressed neem oil demo listing for organic farming demonstrations. Label details below are placeholder demo text.',
    category: 'Bio Insecticides', type: 'Crop Protection', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 350, packSize: '500 ml',
    image: '/images/products/neem-oil.svg', stockQuantity: 102, bestseller: true, featured: true, isSeasonal: true, seasonalNote: 'Kharif pest management (demo)', rating: 4.5,
    crops: ['Vegetables', 'Fruits', 'Ornamentals'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — cold-pressed neem oil listing; percentage and registration not verified.' },
    specifications: [{ label: 'Product status', value: 'DEMO LISTING — verify licensing before any sale' }],
  }),
  P({
    name: 'BioAgro Trichoderma Bio-Fungicide (Demo)',
    description: 'Microbial bio-fungicide demo listing for seed and soil application demonstrations on this site.',
    category: 'Bio Fungicides', type: 'Crop Protection', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 280, packSize: '250 g',
    image: '/images/products/trichoderma.svg', stockQuantity: 84, rating: 4.4,
    crops: ['Vegetables', 'Field Crops'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — microbial formulation listing; viable count and registration not verified.' },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'BioAgro Botanical Guard Spray (Demo)',
    description: 'Plant-extract based botanical spray demo listing for integrated pest management demonstrations.',
    category: 'Bio Insecticides', type: 'Crop Protection', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 320, packSize: '500 ml',
    image: '/images/products/botanical-guard.svg', stockQuantity: 71, rating: 4.2,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Fertilizers ----------------
  P({
    name: 'AgroShield Vermicompost 5 kg',
    description: 'Screened organic vermicompost for gardens and field application. Improves soil structure and moisture retention when worked into the topsoil.',
    category: 'Bio/Organic Fertilizers', type: 'Crop Nutrition', additionalCategories: ['Organic'], brand: 'AgroShield Naturals', price: 250, packSize: '5 kg',
    image: '/images/products/vermicompost.svg', stockQuantity: 160, featured: true, rating: 4.6,
    crops: ['Vegetables', 'Fruits', 'Flowers'],
    specifications: [
      { label: 'Type', value: 'Organic manure' },
      { label: 'Form', value: 'Granular, screened' },
      { label: 'Application', value: 'Soil application before sowing' },
    ],
    batch: { batchNumber: 'VC-DEMO-001', expiryDate: null },
  }),
  P({
    name: 'AgroShield NPK 19:19:19 Granules (Demo)',
    description: 'Balanced water-soluble NPK demo listing for fertigation and foliar programmes. Demonstration data — verify grade and guidance on the actual bag.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 540, packSize: '5 kg',
    image: '/images/products/npk-granules.svg', stockQuantity: 95, bestseller: true, rating: 4.5,
    crops: ['Vegetables', 'Fruits', 'Field Crops'],
    specifications: [
      { label: 'Grade', value: 'NPK 19:19:19 (demo data)' },
      { label: 'Form', value: 'Water-soluble granules' },
    ],
    batch: { batchNumber: 'NPK-DEMO-014', expiryDate: null },
  }),
  P({
    name: 'AgroShield Micronutrient Mix - Zinc',
    description: 'Zinc-based micronutrient demo listing for correcting common micronutrient deficiencies in cereals, orchards and vegetables.',
    category: 'Micro Nutrients', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 310, packSize: '1 kg',
    image: '/images/products/micronutrient-zinc.svg', stockQuantity: 78, rating: 4.3,
    crops: ['Paddy', 'Maize', 'Citrus'],
    specifications: [
      { label: 'Nutrient', value: 'Zinc (demo data)' },
      { label: 'Form', value: 'Powder' },
    ],
    batch: { batchNumber: 'ZN-DEMO-007', expiryDate: null },
  }),
  P({
    name: 'BioAgro SeaGrow Liquid Fertilizer',
    description: 'Seaweed-based liquid foliar nutrition demo listing for vigorous vegetative growth. Demonstration product for the AgroShield demo store.',
    category: 'Bio Stimulants', type: 'Crop Nutrition', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 450, packSize: '1 L',
    image: '/images/products/seagrow-liquid.svg', stockQuantity: 66, isSeasonal: true, seasonalNote: 'Foliar feeding in peak growth (demo)', rating: 4.4,
    crops: ['Vegetables', 'Fruits'],
    specifications: [
      { label: 'Base', value: 'Seaweed extract (demo data)' },
      { label: 'Application', value: 'Foliar spray / drip' },
    ],
    batch: { batchNumber: 'SG-DEMO-021', expiryDate: null },
  }),

  // ---------------- New fertilizer subcategories (demo listings) ----------------
  P({
    name: 'AgroShield Urea 46% Nitrogen',
    description: 'Straight nitrogen fertilizer demo listing (urea, 46% N) for top-dressing cereals and field crops. Demo store data — follow local agricultural advisories for rates and timing.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 295, packSize: '45 kg',
    image: '/images/products/fertilizer-urea.svg', stockQuantity: 200, isSeasonal: true, seasonalNote: 'Rabi top-dressing (demo)', rating: 4.4,
    crops: ['Paddy', 'Wheat', 'Maize'],
    specifications: [
      { label: 'Nutrient', value: 'Nitrogen 46% (demo data)' },
      { label: 'Form', value: 'Prilled granules' },
    ],
    batch: { batchNumber: 'UR-DEMO-001', expiryDate: null },
  }),
  P({
    name: 'AgroShield Single Super Phosphate (SSP)',
    description: 'Phosphatic fertilizer demo listing (SSP) for basal application at sowing. Demo store data — confirm grade on the actual bag.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 340, packSize: '50 kg',
    image: '/images/products/fertilizer-ssp.svg', stockQuantity: 150, rating: 4.2,
    crops: ['Pulses', 'Oilseeds', 'Vegetables'],
    specifications: [
      { label: 'Nutrient', value: 'Phosphorus as P2O5 16% + Ca/S (demo data)' },
      { label: 'Form', value: 'Granular' },
    ],
    batch: { batchNumber: 'SSP-DEMO-002', expiryDate: null },
  }),
  P({
    name: 'AgroShield Muriate of Potash (MOP)',
    description: 'Potassic fertilizer demo listing (MOP) for quality and stress tolerance. Demo store data — confirm grade on the actual bag.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 1275, packSize: '50 kg',
    image: '/images/products/fertilizer-mop.svg', stockQuantity: 90, rating: 4.3,
    crops: ['Fruits', 'Vegetables', 'Field Crops'],
    specifications: [
      { label: 'Nutrient', value: 'Potassium as K2O 60% (demo data)' },
      { label: 'Form', value: 'Granular' },
    ],
    batch: { batchNumber: 'MOP-DEMO-003', expiryDate: null },
  }),
  P({
    name: 'BioAgro Rhizobium Biofertilizer (Demo)',
    description: 'Rhizobium-based biofertilizer demo listing for pulse seed inoculation demonstrations. Demonstration data — viability counts are not verified.',
    category: 'Bio/Organic Fertilizers', type: 'Crop Nutrition', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 180, packSize: '250 g',
    image: '/images/products/fertilizer-rhizobium.svg', stockQuantity: 74, rating: 4.2,
    crops: ['Gram', 'Tur', 'Moong'],
    specifications: [
      { label: 'Culture', value: 'Rhizobium (demo data)' },
      { label: 'Use', value: 'Seed inoculation before sowing' },
    ],
    batch: { batchNumber: 'RH-DEMO-004', expiryDate: null },
  }),
  P({
    name: 'AgroShield Ammonium Sulphate',
    description: 'Straight nitrogen-sulfur fertilizer demo listing for cereals and vegetable plantings. Demo store data — follow local advisories for rates.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 310, packSize: '45 kg',
    image: '/images/products/fertilizer-ammonium.svg', stockQuantity: 130, rating: 4.1,
    crops: ['Paddy', 'Vegetables'],
    specifications: [
      { label: 'Nutrient', value: 'Nitrogen 21% + Sulphur 24% (demo data)' },
      { label: 'Form', value: 'Crystalline granules' },
    ],
    batch: { batchNumber: 'AS-DEMO-005', expiryDate: null },
  }),
  P({
    name: 'AgroShield Coated Slow-Release Urea (Demo)',
    description: 'Polymer-coated slow-release urea demo listing for extended nitrogen availability. Demonstration data for the AgroShield demo store.',
    category: 'Chemical Fertilizers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 410, packSize: '45 kg',
    image: '/images/products/fertilizer-slowrelease.svg', stockQuantity: 60, rating: 4.3,
    crops: ['Orchards', 'Field Crops'],
    specifications: [
      { label: 'Nutrient', value: 'Nitrogen 44% (coated, demo data)' },
      { label: 'Release', value: 'Extended (demo claim)' },
    ],
    batch: { batchNumber: 'SRU-DEMO-006', expiryDate: null },
  }),

  // ---------------- Farming Essentials ----------------
  P({
    name: 'AgroShield Stainless Steel Garden Hoe',
    description: 'Rust-resistant stainless steel hoe with a hardwood handle for weeding, shaping beds and loosening soil in gardens and small fields.',
    category: 'Garden Tools', type: 'Equipments', brand: 'AgroShield Tools', price: 450, packSize: '1 piece',
    image: '/images/products/garden-hoe.svg', stockQuantity: 120, rating: 4.5,
    specifications: [
      { label: 'Blade', value: 'Stainless steel' },
      { label: 'Handle', value: 'Hardwood, 120 cm' },
      { label: 'Weight', value: 'Approx. 1.2 kg' },
    ],
  }),
  P({
    name: 'AgroShield 16 L Knapsack Sprayer',
    description: 'Comfortable 16-litre knapsack sprayer with adjustable brass nozzle, padded straps and a pressure pump for fields and orchards.',
    category: 'Sprayers', type: 'Equipments', brand: 'AgroShield Tools', price: 1899, packSize: '1 unit (16 L)',
    image: '/images/products/knapsack-sprayer.svg', stockQuantity: 34, featured: true, bestseller: true, rating: 4.6,
    specifications: [
      { label: 'Capacity', value: '16 litres' },
      { label: 'Pump', value: 'Dual-action lever pump' },
      { label: 'Nozzle', value: 'Adjustable brass' },
      { label: 'Straps', value: 'Padded shoulder straps' },
    ],
  }),
  P({
    name: 'AgroShield Chemical-Resistant Gloves (Pair)',
    description: 'Long-cuff chemical-resistant gloves for handling fertilizers and crop-protection products. Always follow product label PPE guidance.',
    category: 'Safety Kit', type: 'Equipments', brand: 'AgroShield Safety', price: 199, packSize: '1 pair',
    image: '/images/products/safety-gloves.svg', stockQuantity: 210, rating: 4.3,
    specifications: [
      { label: 'Material', value: 'Nitrile-coated fabric' },
      { label: 'Cuff', value: 'Long cuff' },
      { label: 'Sizes', value: 'L / XL' },
    ],
  }),
  P({
    name: 'AgroShield Respirator Safety Mask',
    description: 'Reusable dust and mist respirator with adjustable straps for spraying and dusty farm work. A general precaution only — check the mask rating required by each product label.',
    category: 'Safety Kit', type: 'Equipments', brand: 'AgroShield Safety', price: 249, packSize: '1 piece',
    image: '/images/products/respirator-mask.svg', stockQuantity: 145, rating: 4.4,
    specifications: [
      { label: 'Type', value: 'Reusable half-mask' },
      { label: 'Filters', value: 'Twin replaceable cartridges' },
    ],
  }),
  P({
    name: 'AgroShield Bypass Pruning Shears',
    description: 'Sharp bypass pruning shears with ergonomic handles for vines, orchards and greenhouse pruning.',
    category: 'Garden Tools', type: 'Equipments', brand: 'AgroShield Tools', price: 349, packSize: '1 piece',
    image: '/images/products/pruning-shears.svg', stockQuantity: 88, rating: 4.2,
    specifications: [
      { label: 'Blade', value: 'Hardened carbon steel' },
      { label: 'Cut capacity', value: 'Up to 20 mm' },
    ],
  }),
  P({
    name: 'AgroShield Weed Cutter with Wooden Handle',
    description: 'Traditional curved weed-cutter blade with a smooth wooden handle for clearing field bunds, borders and canal sides.',
    category: 'Weeder/Tiller', type: 'Equipments', brand: 'AgroShield Tools', price: 599, packSize: '1 piece',
    image: '/images/products/weed-cutter.svg', stockQuantity: 52, isSeasonal: true, seasonalNote: 'Monsoon bund clearing (demo)', rating: 4.1,
    specifications: [
      { label: 'Blade', value: 'Carbon steel, curved' },
      { label: 'Handle', value: 'Wooden, 110 cm' },
    ],
  }),
  P({
    name: 'AgroShield Anti-Fog Safety Goggles',
    description: 'Wrap-around safety goggles with anti-fog polycarbonate lenses and a soft seal for spraying, handling seeds and dusty field work (demo listing).',
    category: 'Safety Kit', type: 'Equipments', brand: 'AgroShield Safety', price: 279, packSize: '1 piece',
    image: '/images/products/safety-goggles.svg', stockQuantity: 96, rating: 4.3,
    specifications: [
      { label: 'Lens', value: 'Polycarbonate, anti-fog' },
      { label: 'Protection', value: 'UV + splash guard' },
    ],
  }),
  P({
    name: 'AgroShield Garden Watering Can 5 L',
    description: 'Lightweight 5-litre watering can with an arched handle and rose sprinkler head for seedlings, terrace gardens and nursery beds (demo listing).',
    category: 'Nursery Inputs', type: 'Equipments', brand: 'AgroShield Tools', price: 389, packSize: '1 unit (5 L)',
    image: '/images/products/watering-can.svg', stockQuantity: 74, featured: true, rating: 4.4,
    specifications: [
      { label: 'Capacity', value: '5 litres' },
      { label: 'Material', value: 'UV-stabilised HDPE' },
      { label: 'Outlet', value: 'Removable rose head' },
    ],
  }),
  P({
    name: 'AgroShield Garden Measuring Set',
    description: 'Handy measuring set with soil pH strips, moisture meter and a graduated measuring cup for accurate watering and fertigation dosing (demo listing).',
    category: 'Garden Tools', type: 'Equipments', brand: 'AgroShield Tools', price: 499, packSize: '1 kit (3 pieces)',
    image: '/images/products/measuring-set.svg', stockQuantity: 61, rating: 4.2,
    specifications: [
      { label: 'Includes', value: 'pH strips, moisture meter, cup' },
      { label: 'Cup range', value: '50–1000 ml' },
    ],
  }),

  // ---------------- New Seeds subcategory demos ----------------
  P({
    name: 'Marigold Flower Seed - Pooja (Demo)',
    description: 'Open-pollinated marigold seed for border, field and temple-garden plantings (demo listing).',
    category: 'Flower Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 70, packSize: '10 g',
    image: '/images/products/flower-seeds.svg', stockQuantity: 130, rating: 4.3,
    crops: ['Marigold'],
    seedInfo: { variety: 'Pooja (demo variety)', cropType: 'Marigold', germinationPercent: 80, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: sow shallowly in nursery rows; transplant after 30-35 days at 30 x 30 cm spacing.' },
  }),
  P({
    name: 'Berseem Fodder Seed - Local (Demo)',
    description: 'Berseem clover fodder seed for rabi green-manure and cattle-feed production (demo listing).',
    category: 'Forages', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 240, packSize: '1 kg',
    image: '/images/products/forage-seeds.svg', stockQuantity: 80, rating: 4.2,
    crops: ['Berseem', 'Forage'],
    seedInfo: { variety: 'Local (demo variety)', cropType: 'Berseem', germinationPercent: 78, daysToGerminate: '6-9 days', sowingInstructions: 'Demo guidance: sow in 25 cm rows after first irrigation; cut at 50% flowering for fodder.' },
  }),
  P({
    name: 'Mustard Seed - Pusa Bold (Demo)',
    description: 'Rabi mustard seed listing for oilseed plantings (demo listing; variety name is fictional).',
    category: 'Mustard', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 320, packSize: '1 kg',
    image: '/images/products/mustard-seeds.svg', stockQuantity: 95, rating: 4.4, isSeasonal: true, seasonalNote: 'Rabi sowing window (demo)',
    crops: ['Mustard'],
    seedInfo: { variety: 'Pusa Bold (demo variety)', cropType: 'Mustard', germinationPercent: 85, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: drill in 30 cm rows at 2-3 kg seed per hectare for timely rabi sowing.' },
  }),
  P({
    name: 'Jowar (Sorghum) Seed - CSH 14 (Demo)',
    description: 'Jowar (sorghum) hybrid seed listing for dryland kharif plantings (demo listing).',
    category: 'Jowar', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 360, packSize: '2 kg',
    image: '/images/products/jowar-seeds.svg', stockQuantity: 70, rating: 4.1,
    crops: ['Jowar', 'Sorghum'],
    seedInfo: { variety: 'CSH 14 (demo variety)', cropType: 'Jowar', germinationPercent: 82, daysToGerminate: '5-7 days', sowingInstructions: 'Demo guidance: sow at 45 x 15 cm spacing after onset of reliable rains.' },
  }),
  P({
    name: 'Polyhouse Capsicum Seed - Indra F1 (Demo)',
    description: 'Capsicum hybrid seed suited to polyhouse and protected cultivation (demo listing).',
    category: 'Polyhouse', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 265, packSize: '10 g',
    image: '/images/products/polyhouse-seeds.svg', stockQuantity: 60, rating: 4.5,
    crops: ['Capsicum'],
    seedInfo: { variety: 'Indra F1 (demo variety)', cropType: 'Capsicum', germinationPercent: 84, daysToGerminate: '7-10 days', sowingInstructions: 'Demo guidance: raise in poly trays under shade; transplant into polyhouse beds at 45 x 45 cm.' },
  }),
  P({
    name: 'Exotic Broccoli Seed - Calabrese (Demo)',
    description: 'Exotic broccoli seed listing for cool-season and specialty-market plantings (demo listing).',
    category: 'Exotics', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 210, packSize: '25 g',
    image: '/images/products/exotic-seeds.svg', stockQuantity: 55, rating: 4.2,
    crops: ['Broccoli'],
    seedInfo: { variety: 'Calabrese (demo variety)', cropType: 'Broccoli', germinationPercent: 82, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: raise nursery seedlings, transplant at 45 x 45 cm in cool conditions.' },
  }),
  P({
    name: 'Urban Terrace Garden Seed Pack (Demo)',
    description: 'Mixed terrace-garden pack of five small packs (tomato, chilli, coriander, spinach, marigold) for balcony and rooftop gardens (demo listing).',
    category: 'Urban Garden', type: 'Seeds', brand: 'CitySprout (Demo)', price: 199, packSize: '5 varieties / 50 g',
    image: '/images/products/urban-garden-seeds.svg', stockQuantity: 110, rating: 4.6, featured: true,
    crops: ['Tomato', 'Chilli', 'Coriander', 'Spinach', 'Marigold'],
    seedInfo: { variety: 'Mixed pack (demo)', cropType: 'Mixed vegetables', germinationPercent: 75, daysToGerminate: '4-10 days', sowingInstructions: 'Demo guidance: sow in 8-12 inch grow bags on a sunny terrace; harvest little and often.' },
  }),
  // ---------------- New Crop Protection subcategory demos ----------------
  P({
    name: 'GreenField Virus Shield Bio Viricide (Demo)',
    description: 'DEMO LISTING for a bio viricide product type. No performance claim is made — always follow the verified product label.',
    category: 'Bio Viricides', type: 'Crop Protection', additionalCategories: ['Organic'], brand: 'GreenField (Demo)', price: 375, packSize: '500 ml',
    image: '/images/products/bio-viricide.svg', stockQuantity: 42, rating: 4.0,
    crops: ['Vegetables', 'Orchards'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — bio viricide listing; composition and registration not verified.' },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'BioAgro NemaKill Bio Nematicide (Demo)',
    description: 'DEMO LISTING for a bio nematicide product type. No performance claim is made — always follow the verified product label.',
    category: 'Bio Nematicides', type: 'Crop Protection', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 330, packSize: '500 ml',
    image: '/images/products/bio-nematicide.svg', stockQuantity: 38, rating: 4.1,
    crops: ['Vegetables', 'Pulses'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — microbial/botanical nematicide listing; composition and registration not verified.' },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'FarmGuard Sticky Trap Cards - Yellow (Demo)',
    description: 'Yellow sticky trap cards for monitoring and mass-trapping of whiteflies, leafminers and other flying pests (demo listing).',
    category: 'Sticky Traps', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 149, packSize: 'pack of 20',
    image: '/images/products/sticky-traps.svg', stockQuantity: 150, rating: 4.4,
    crops: ['Vegetables', 'Nursery'],
    specifications: [
      { label: 'Size', value: '25 x 40 cm (demo)' },
      { label: 'Mounting', value: 'Wire hanger included' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'ChemLure Pheromone Lure Capsules (Demo)',
    description: 'Species-specific pheromone lure capsules for use with funnel traps; use one capsule per trap per season (demo listing).',
    category: 'Pheromone Lures', type: 'Crop Protection', brand: 'ChemLure (Demo)', price: 210, packSize: 'pack of 10',
    image: '/images/products/pheromone-lures.svg', stockQuantity: 90, rating: 4.2,
    crops: ['Paddy', 'Vegetables'],
    specifications: [
      { label: 'Dosage', value: '1 capsule per trap (demo)' },
      { label: 'Longevity', value: 'About 30-45 days per capsule (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'FarmGuard Funnel Pheromone Trap (Demo)',
    description: 'Reusable funnel-type pheromone trap with funnel, lid, hanger and collection bag for mass trapping (demo listing).',
    category: 'Pheromone Traps', type: 'Crop Protection', brand: 'FarmGuard (Demo)', price: 275, packSize: '1 unit',
    image: '/images/products/pheromone-traps.svg', stockQuantity: 85, rating: 4.3,
    crops: ['Paddy', 'Cotton', 'Vegetables'],
    specifications: [
      { label: 'Type', value: 'Funnel trap with collection bag (demo)' },
      { label: 'Reusability', value: 'Lid and funnel reusable; bag replaceable' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Solar Light Trap 20 W (Demo)',
    description: 'Solar-powered LED light trap for night-flying insect monitoring and mass trapping in fields and orchards (demo listing).',
    category: 'Solar Light Traps', type: 'Crop Protection', brand: 'AgroShield Tools', price: 1450, packSize: '1 unit',
    image: '/images/products/solar-light-traps.svg', stockQuantity: 28, rating: 4.1, featured: true,
    crops: ['Vegetables', 'Orchards'],
    specifications: [
      { label: 'Panel', value: '20 W solar panel (demo)' },
      { label: 'Battery', value: 'Rechargeable, dusk-to-dawn controller' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  // ---------------- New Crop Nutrition subcategory demos ----------------
  P({
    name: 'AgroShield Humic Acid Granules 98% (Demo)',
    description: 'Humic acid granules for soil conditioning and nutrient availability (demo listing; analysis not verified).',
    category: 'Humic Acids', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 420, packSize: '1 kg',
    image: '/images/products/humic-acid.svg', stockQuantity: 66, rating: 4.2,
    crops: ['Vegetables', 'Orchards', 'Field Crops'],
    specifications: [
      { label: 'Form', value: 'Granules, 98% humic acid (demo claim)' },
      { label: 'Application', value: 'Basal or drip dosing (demo)' },
    ],
  }),
  P({
    name: 'AgroShield Soil pH Balancer Lime (Demo)',
    description: 'Agricultural lime for correcting soil acidity ahead of sowing (demo listing).',
    category: 'pH Balancers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 260, packSize: '5 kg',
    image: '/images/products/ph-balancer.svg', stockQuantity: 90, rating: 4.1,
    crops: ['Tea', 'Vegetables', 'Field Crops'],
    specifications: [
      { label: 'Form', value: 'Pulverised lime (demo)' },
      { label: 'Note', value: 'Apply based on soil test report (demo guidance)' },
    ],
  }),
  P({
    name: 'AgroShield Plain Growth Promoter Mix (Demo)',
    description: 'General plant growth promoter powder for foliar and fertigation use (demo listing; no performance claim).',
    category: 'Plain Growth Promoters', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 310, packSize: '500 g',
    image: '/images/products/growth-promoter.svg', stockQuantity: 74, rating: 4.0,
    crops: ['Vegetables', 'Field Crops'],
    specifications: [
      { label: 'Form', value: 'Water-dispersible powder (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Plant Enhancer Spray (Demo)',
    description: 'Foliar plant enhancer spray for periodic vigour support (demo listing; no performance claim).',
    category: 'Plant Enhancers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 385, packSize: '250 ml',
    image: '/images/products/plant-enhancer.svg', stockQuantity: 58, rating: 4.1,
    crops: ['Vegetables', 'Fruits'],
    specifications: [
      { label: 'Form', value: 'Foliar concentrate (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'BioAgro Bio Stimulant Amino Acid Mix (Demo)',
    description: 'Amino-acid based bio stimulant for stress-period foliar nutrition (demo listing; composition not verified).',
    category: 'Bio Stimulants', type: 'Crop Nutrition', additionalCategories: ['Organic'], brand: 'BioAgro (Demo)', price: 465, packSize: '1 L',
    image: '/images/products/bio-stimulant.svg', stockQuantity: 47, rating: 4.3,
    crops: ['Vegetables', 'Fruits', 'Field Crops'],
    specifications: [
      { label: 'Form', value: 'Liquid, amino-acid based (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Yield Booster PGR (Demo)',
    description: 'DEMO LISTING for a plant growth regulator product type. Use only as permitted by the verified label and local regulations; no performance claim is made.',
    category: 'Yield Boosters', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 495, packSize: '500 ml',
    image: '/images/products/yield-booster.svg', stockQuantity: 40, rating: 4.0,
    crops: ['Paddy', 'Cotton'],
    specifications: [
      { label: 'Form', value: 'Plant growth regulator solution (demo)' },
      { label: 'Note', value: 'Follow the verified label and local regulations' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Fruit Enhancer Spray (Demo)',
    description: 'DEMO LISTING for a fruit-set and quality enhancer product type. No performance claim is made; follow the verified label.',
    category: 'Fruit Enhancers', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 525, packSize: '250 ml',
    image: '/images/products/fruit-enhancer.svg', stockQuantity: 36, rating: 4.1,
    crops: ['Mango', 'Grapes', 'Papaya'],
    specifications: [
      { label: 'Form', value: 'Foliar spray (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Flower Booster Spray (Demo)',
    description: 'DEMO LISTING for a flowering promoter product type. No performance claim is made; follow the verified label.',
    category: 'Flower Boosters', type: 'Crop Nutrition', brand: 'AgroShield Nutrition', price: 445, packSize: '250 ml',
    image: '/images/products/flower-booster.svg', stockQuantity: 44, rating: 4.0,
    crops: ['Marigold', 'Rose', 'Jasmine'],
    specifications: [
      { label: 'Form', value: 'Foliar spray (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  // ---------------- New Equipments subcategory demos ----------------
  P({
    name: 'AgroShield Brush Cutter BC-25 (Demo)',
    description: '2-stroke petrol brush cutter with blade and nylon-line head for clearing bunds and borders (demo listing).',
    category: 'Brush Cutter', type: 'Equipments', brand: 'AgroShield Tools', price: 8999, packSize: '1 unit',
    image: '/images/products/brush-cutter.svg', stockQuantity: 18, rating: 4.2,
    specifications: [
      { label: 'Engine', value: '2-stroke 25 cc (demo)' },
      { label: 'Cutting head', value: 'Blade + nylon line (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Chaff Cutter Mini (Demo)',
    description: 'Compact chaff cutter for fodder slicing on small dairy farms (demo listing).',
    category: 'Chaff Cutter and Parts', type: 'Equipments', brand: 'AgroShield Tools', price: 12499, packSize: '1 unit',
    image: '/images/products/chaff-cutter.svg', stockQuantity: 12, rating: 4.3,
    specifications: [
      { label: 'Motor', value: '1 HP electric (demo)' },
      { label: 'Capacity', value: '200 kg/hour (demo claim)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Solar Crop Dryer 10 kg (Demo)',
    description: 'Solar tunnel dryer for grains, fruit slices and spices with drying trays and poly cover (demo listing).',
    category: 'Solar Dryer', type: 'Equipments', brand: 'AgroShield Tools', price: 7499, packSize: '1 unit (10 kg)',
    image: '/images/products/solar-dryer.svg', stockQuantity: 15, rating: 4.1,
    specifications: [
      { label: 'Capacity', value: '10 kg per batch (demo)' },
      { label: 'Trays', value: '5 mesh trays (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Domestic Rice Mill (Demo)',
    description: 'Compact domestic rice mill with husk separation for household and small-shop use (demo listing).',
    category: 'Rice Mill', type: 'Equipments', brand: 'AgroShield Tools', price: 6799, packSize: '1 unit',
    image: '/images/products/rice-mill.svg', stockQuantity: 14, rating: 4.2,
    specifications: [
      { label: 'Motor', value: '1.5 HP electric (demo)' },
      { label: 'Output', value: '100-120 kg/hour (demo claim)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Earth Auger 2-Stroke (Demo)',
    description: 'Two-stroke earth auger with drill bits for planting pits, pole holes and fencing (demo listing).',
    category: 'Earth Augers', type: 'Equipments', brand: 'AgroShield Tools', price: 9499, packSize: '1 unit',
    image: '/images/products/earth-auger.svg', stockQuantity: 11, rating: 4.0,
    specifications: [
      { label: 'Engine', value: '2-stroke 52 cc (demo)' },
      { label: 'Bits', value: '10 cm and 20 cm (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Power Reaper R-12 (Demo)',
    description: 'Walk-behind power reaper for paddy, wheat and other small-grain harvesting (demo listing).',
    category: 'Power Reaper', type: 'Equipments', brand: 'AgroShield Tools', price: 15999, packSize: '1 unit',
    image: '/images/products/power-reaper.svg', stockQuantity: 9, rating: 4.1,
    specifications: [
      { label: 'Engine', value: '4-stroke 6 HP (demo)' },
      { label: 'Cutting width', value: '120 cm (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Chain Saw 16 inch (Demo)',
    description: 'Petrol chain saw with 16-inch bar for pruning, lopping and small-log cutting (demo listing).',
    category: 'Chain Saw', type: 'Equipments', brand: 'AgroShield Tools', price: 7299, packSize: '1 unit',
    image: '/images/products/chain-saw.svg', stockQuantity: 16, rating: 4.0,
    specifications: [
      { label: 'Engine', value: '2-stroke 45 cc (demo)' },
      { label: 'Bar', value: '16 inch (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Sugarcane Machine HR-3 (Demo)',
    description: 'Sugarcane loading and handling machine demo listing for farm-gate transport (demo listing).',
    category: 'Sugarcane Machine', type: 'Equipments', brand: 'AgroShield Tools', price: 13999, packSize: '1 unit',
    image: '/images/products/sugarcane-machine.svg', stockQuantity: 7, rating: 3.9,
    specifications: [
      { label: 'Use', value: 'Cane loading and transport (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Fruit Harvester Pole (Demo)',
    description: 'Telescopic fruit harvester pole with plucker head and collection bag for mango, coconut and sapota (demo listing).',
    category: 'Fruit Harvester/Plucker', type: 'Equipments', brand: 'AgroShield Tools', price: 1299, packSize: '1 unit (3 m)',
    image: '/images/products/fruit-harvester.svg', stockQuantity: 30, rating: 4.2,
    specifications: [
      { label: 'Reach', value: 'Up to 6 m with extension (demo)' },
      { label: 'Head', value: 'Spring-loaded plucker with bag' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield 4-Row Seed Drill (Demo)',
    description: 'Four-row animal/power-trailed seed drill for wheat, paddy and pulses (demo listing).',
    category: 'Seeder/Transplanter', type: 'Equipments', brand: 'AgroShield Tools', price: 11499, packSize: '1 unit',
    image: '/images/products/seed-drill.svg', stockQuantity: 10, rating: 4.1,
    specifications: [
      { label: 'Rows', value: '4 rows, 30 cm spacing (demo)' },
      { label: 'Hopper', value: '50 kg seed box (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Tarpaulin Sheet 6x8 m (Demo)',
    description: 'Heavy-duty blue tarpaulin sheet for grain drying, fodder cover and equipment protection (demo listing).',
    category: 'Tarpaulin', type: 'Equipments', brand: 'AgroShield Tools', price: 899, packSize: '1 sheet (6 x 8 m)',
    image: '/images/products/tarpaulin.svg', stockQuantity: 60, rating: 4.3,
    specifications: [
      { label: 'Material', value: 'HDPE weave, laminated (demo)' },
      { label: 'GSM', value: '200 GSM (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Mulch Film 500 micron (Demo)',
    description: 'Black mulch film roll for moisture conservation and weed suppression in vegetable beds (demo listing).',
    category: 'Mulch', type: 'Equipments', brand: 'AgroShield Tools', price: 640, packSize: 'roll (100 sq.m)',
    image: '/images/products/mulch-film.svg', stockQuantity: 48, rating: 4.2,
    specifications: [
      { label: 'Thickness', value: '500 micron (demo)' },
      { label: 'Colour', value: 'Black (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Shade Net 50% (Demo)',
    description: 'Green poly shade net for nurseries, polyhouse shading and nursery-bed protection (demo listing).',
    category: 'Shade Net', type: 'Equipments', brand: 'AgroShield Tools', price: 520, packSize: 'roll (50 sq.m)',
    image: '/images/products/shade-net.svg', stockQuantity: 52, rating: 4.3, isSeasonal: true, seasonalNote: 'Summer nursery shade (demo)',
    specifications: [
      { label: 'Shade', value: '50% (demo)' },
      { label: 'Width', value: '2 m (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Traps and Lure Combo Kit (Demo)',
    description: 'Combo kit of two funnel traps and two pheromone lure capsules for integrated pest management (demo listing).',
    category: 'Traps and Lure', type: 'Equipments', brand: 'AgroShield Tools', price: 499, packSize: '1 kit',
    image: '/images/products/traps-lure-kit.svg', stockQuantity: 40, rating: 4.2,
    specifications: [
      { label: 'Contents', value: '2 traps + 2 lure capsules (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Rechargeable Field Torch (Demo)',
    description: 'Rechargeable LED field torch and lantern for night farm rounds and power cuts (demo listing).',
    category: 'Torch/Lantern', type: 'Equipments', brand: 'AgroShield Tools', price: 749, packSize: '1 unit',
    image: '/images/products/field-torch.svg', stockQuantity: 65, rating: 4.1,
    specifications: [
      { label: 'Battery', value: 'Rechargeable lithium (demo)' },
      { label: 'Modes', value: 'Torch + lantern (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Crop Cover Net 2x5 m (Demo)',
    description: 'Fine mesh crop cover net for row protection against insect entry in vegetable beds (demo listing).',
    category: 'Crop Cover', type: 'Equipments', brand: 'AgroShield Tools', price: 380, packSize: '1 piece (2 x 5 m)',
    image: '/images/products/crop-cover-net.svg', stockQuantity: 55, rating: 4.2,
    specifications: [
      { label: 'Mesh', value: '40 mesh (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield HDPE Pipe 50 mm (Demo)',
    description: 'HDPE irrigation pipe coil for field conveyance and pump delivery lines (demo listing).',
    category: 'Pipe', type: 'Equipments', brand: 'AgroShield Tools', price: 1250, packSize: '10 m coil',
    image: '/images/products/hdpe-pipe.svg', stockQuantity: 42, rating: 4.2,
    specifications: [
      { label: 'Diameter', value: '50 mm (demo)' },
      { label: 'Pressure', value: '4 kg/sq.cm working (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield 1 HP Water Pump (Demo)',
    description: 'Monoblock centrifugal water pump for borewell and tank delivery on small farms (demo listing).',
    category: 'Water Pump', type: 'Equipments', brand: 'AgroShield Tools', price: 4299, packSize: '1 unit',
    image: '/images/products/water-pump.svg', stockQuantity: 20, rating: 4.1,
    specifications: [
      { label: 'Power', value: '1 HP (demo)' },
      { label: 'Type', value: 'Monoblock centrifugal (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Rotary Sprinkler (Demo)',
    description: 'Impact rotary sprinkler for garden and small-field coverage with adjustable arc (demo listing).',
    category: 'Sprinkler', type: 'Equipments', brand: 'AgroShield Tools', price: 349, packSize: '1 unit',
    image: '/images/products/rotary-sprinkler.svg', stockQuantity: 70, rating: 4.0,
    specifications: [
      { label: 'Coverage', value: 'Up to 6 m radius (demo claim)' },
      { label: 'Connection', value: '3/4 inch thread (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Drip Kit for 100 Plants (Demo)',
    description: 'Ready-to-install drip irrigation kit with laterals, drippers and connector for up to 100 plants (demo listing).',
    category: 'Drip Kit', type: 'Equipments', brand: 'AgroShield Tools', price: 1699, packSize: '1 kit',
    image: '/images/products/drip-kit.svg', stockQuantity: 35, rating: 4.3, featured: true,
    specifications: [
      { label: 'Plants', value: 'Up to 100 plants (demo)' },
      { label: 'Includes', value: 'Laterals, drippers, filter, connectors' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  // ---------------- New Animal Husbandry subcategory demos ----------------
  P({
    name: 'AgroShield Cattle Feed Pellets 40 kg (Demo)',
    description: 'Balanced cattle feed pellet bag for daily dairy feeding (demo listing; composition not verified).',
    category: 'Cattle Feed', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 1250, packSize: '40 kg',
    image: '/images/products/cattle-feed.svg', stockQuantity: 45, rating: 4.3,
    specifications: [
      { label: 'Form', value: 'Pellets (demo)' },
      { label: 'Protein', value: 'Demo value — refer to verified label' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Cattle Mineral Mixture 1 kg (Demo)',
    description: 'Mineral mixture supplement for cattle with macro and trace minerals (demo listing; composition not verified).',
    category: 'Cattle Supplements', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 460, packSize: '1 kg',
    image: '/images/products/cattle-supplements.svg', stockQuantity: 60, rating: 4.2,
    specifications: [
      { label: 'Form', value: 'Powder mineral mixture (demo)' },
      { label: 'Dosage', value: 'Follow the verified label (demo guidance)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Bucket Milking Machine (Demo)',
    description: 'Two-bucket portable milking machine for small dairy units (demo listing).',
    category: 'Milking Machine', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 18999, packSize: '1 unit (2 buckets)',
    image: '/images/products/milking-machine.svg', stockQuantity: 6, rating: 4.1,
    specifications: [
      { label: 'Buckets', value: '2 x 25 L stainless (demo)' },
      { label: 'Pump', value: 'Double-cylinder hand/vacuum pump (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Milking Liner and Claw Kit (Demo)',
    description: 'Spare liner and claw kit for bucket milking machines (demo listing).',
    category: 'Milking Machine Accessories', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 1450, packSize: '1 kit',
    image: '/images/products/milking-accessories.svg', stockQuantity: 25, rating: 4.0,
    specifications: [
      { label: 'Contents', value: '8 liners, 1 claw, tubing (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Calf Feeding Bottle 2 L (Demo)',
    description: 'Nursery calf feeding bottle with teat and hanger for milk feeding of newborn calves (demo listing).',
    category: 'Calf Feeding Bottle', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 399, packSize: '1 unit (2 L)',
    image: '/images/products/calf-bottle.svg', stockQuantity: 50, rating: 4.4,
    specifications: [
      { label: 'Capacity', value: '2 litres (demo)' },
      { label: 'Includes', value: 'Teat and hanger' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Poultry Calcium Booster 500 g (Demo)',
    description: 'Calcium and vitamin supplement powder for layers and broilers (demo listing; composition not verified).',
    category: 'Poultry Supplements', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 285, packSize: '500 g',
    image: '/images/products/poultry-supplements.svg', stockQuantity: 55, rating: 4.1,
    specifications: [
      { label: 'Form', value: 'Water-soluble powder (demo)' },
      { label: 'Dosage', value: 'Follow the verified label (demo guidance)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'AgroShield Poultry Tube Feeder 5 kg (Demo)',
    description: 'Tube-type poultry feeder with adjustable ports for broiler and layer sheds (demo listing).',
    category: 'Poultry Equipment', type: 'Animal Husbandry', brand: 'AgroShield Agrovet', price: 549, packSize: '1 unit (5 kg)',
    image: '/images/products/poultry-equipment.svg', stockQuantity: 40, rating: 4.2,
    specifications: [
      { label: 'Capacity', value: '5 kg feed (demo)' },
      { label: 'Material', value: 'Food-grade HDPE (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  // ---------------- Tapas curated-collection demos ----------------
  P({
    name: 'Tapas Garden Nutrition Combo 2 kg (Demo)',
    description: 'Curated Tapas-collection nutrition combo for home and kitchen gardens (demo listing).',
    category: 'Crop Nutrition', type: 'Tapas', brand: 'Tapas (Demo)', price: 549, packSize: '2 kg combo',
    image: '/images/products/tapas-nutrition.svg', stockQuantity: 42, rating: 4.2,
    specifications: [
      { label: 'Contents', value: 'Compost + micronutrient mix (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'Tapas Home Garden Crop Protection Kit (Demo)',
    description: 'DEMO LISTING for a curated home-garden crop protection kit. No performance claim is made — always follow the verified product label.',
    category: 'Crop Protection', type: 'Tapas', brand: 'Tapas (Demo)', price: 699, packSize: '1 kit (500 ml)',
    image: '/images/products/tapas-protection.svg', stockQuantity: 36, rating: 4.1,
    crops: ['Vegetables', 'Flowers'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — curated kit listing; contents and registration not verified.' },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'Tapas Farm Implement Blade Set (Demo)',
    description: 'Curated Tapas-collection blade set of hoe, sickle and knife for small farms (demo listing).',
    category: 'Farm Implements', type: 'Tapas', brand: 'Tapas (Demo)', price: 1299, packSize: '1 set (3 pieces)',
    image: '/images/products/tapas-implements.svg', stockQuantity: 28, rating: 4.2,
    specifications: [
      { label: 'Includes', value: 'Hoe, sickle, knife (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'Tapas Pheromone Lure and Trap Combo (Demo)',
    description: 'Curated Tapas-collection combo of one funnel trap and two lure capsules (demo listing).',
    category: 'Traps and Lures', type: 'Tapas', brand: 'Tapas (Demo)', price: 449, packSize: '1 kit',
    image: '/images/products/tapas-lures.svg', stockQuantity: 34, rating: 4.0,
    specifications: [
      { label: 'Contents', value: '1 funnel trap + 2 lure capsules (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'Tapas Mulching Sheet 3x10 m (Demo)',
    description: 'Curated Tapas-collection mulching sheet for vegetable beds and terrace planters (demo listing).',
    category: 'Mulching Sheet', type: 'Tapas', brand: 'Tapas (Demo)', price: 320, packSize: '1 sheet (3 x 10 m)',
    image: '/images/products/tapas-mulch.svg', stockQuantity: 46, rating: 4.1,
    specifications: [
      { label: 'Material', value: 'Black LDPE mulch (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'Tapas Safety Kit - Gloves and Goggles (Demo)',
    description: 'Curated Tapas-collection safety kit of chemical-resistant gloves and anti-fog goggles (demo listing).',
    category: 'Safety Kit', type: 'Tapas', brand: 'Tapas (Demo)', price: 599, packSize: '1 kit',
    image: '/images/products/tapas-safety.svg', stockQuantity: 50, rating: 4.3,
    specifications: [
      { label: 'Includes', value: 'Gloves (pair) + goggles (demo)' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
  P({
    name: 'Tapas Knapsack Sprayer 5 L (Demo)',
    description: 'Curated Tapas-collection 5-litre knapsack sprayer for terrace and kitchen gardens (demo listing).',
    category: 'Sprayers', type: 'Tapas', brand: 'Tapas (Demo)', price: 1499, packSize: '1 unit (5 L)',
    image: '/images/products/tapas-sprayer.svg', stockQuantity: 22, rating: 4.2,
    specifications: [
      { label: 'Capacity', value: '5 litres (demo)' },
      { label: 'Lance', value: 'Adjustable nozzle lance' },
      { label: 'Status', value: 'DEMO LISTING — not a real product' },
    ],
  }),
];

/* ---------------------------------------------------------------------------
 * Merchandising pass (clearly-labelled DEMO data)
 * - A few listings are flagged as "newly released" with staggered release
 *   dates so the home page New Releases section has real database content.
 * - A few listings carry a genuine MRP above the selling price so the
 *   discount badge logic has data to work with. Nothing is auto-discounted
 *   silently: an MRP is only shown when it is genuinely higher than the price.
 * ------------------------------------------------------------------------- */
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const NEW_RELEASES = [
  'AgroShield Weed Cutter with Wooden Handle',
  'AgroShield Bypass Pruning Shears',
  'Hybrid Bitter Gourd Seed - Karuna F1 (Demo)',
  'AgroShield Coated Slow-Release Urea (Demo)',
  'FarmGuard Seed Treatment Fungi Guard (Demo)',
  'Watermelon Seed - Chandan (Demo)',
  'Urban Terrace Garden Seed Pack (Demo)',
  'AgroShield Solar Light Trap 20 W (Demo)',
  'AgroShield Drip Kit for 100 Plants (Demo)',
];

const DISCOUNTED = [
  'Tomato Hybrid Seed - Pushpa F1 (Demo)',
  'Cotton Seed - Kapaat F1 (Demo)',
  'Gram (Chickpea) Seed - Jyoti (Demo)',
  'FarmGuard Crop Shield Insecticide (Demo)',
  'AgroShield NPK 19:19:19 Granules (Demo)',
  'AgroShield Muriate of Potash (MOP)',
  'BioAgro Cold-Pressed Neem Oil (Demo)',
  'AgroShield 16 L Knapsack Sprayer',
  'Paddy (Rice) Seed - Sugandha (Demo)',
  'WeedOut Field Herbicide (Demo)',
  'Marigold Flower Seed - Pooja (Demo)',
  'AgroShield Cattle Feed Pellets 40 kg (Demo)',
  'Tapas Knapsack Sprayer 5 L (Demo)',
];

for (const p of PRODUCTS) {
  const releaseIdx = NEW_RELEASES.indexOf(p.name);
  if (releaseIdx !== -1) {
    p.isNewRelease = true;
    p.releaseDate = daysAgo(releaseIdx * 2 + 1);
  }
  if (DISCOUNTED.includes(p.name)) {
    // Round the MRP up to the nearest ₹5 for a clean demo discount.
    p.mrp = Math.ceil((p.price * 1.2) / 5) * 5;
  }
}

/**
 * Normalize + validate every seed classification against the taxonomy.
 * Writes primaryCategory / heading / subcategory / additionalCategories
 * (the historic `type` / `category` shorthand used by the entries above is
 * consumed here). Legacy demo records without a fitting subcategory in the
 * new structure are kept with a heading only and reported at the end of the
 * seed run — never silently deleted.
 */
const { validatePair } = taxonomy;
const UNMAPPED = [];
for (const p of PRODUCTS) {
  const main = p.primaryCategory !== undefined ? p.primaryCategory : p.type;
  const sub = p.subcategory !== undefined ? p.subcategory : p.category;
  const headingIn = p.heading;
  delete p.type;
  delete p.category;

  if (String(sub === undefined || sub === null ? '' : sub).trim() === '') {
    const headings = taxonomy.headingsOf(main).filter(Boolean);
    if (!headings.includes(headingIn)) {
      throw new Error(`Seed product "${p.name}" is unmapped and needs a valid heading (${headings.join(' | ')})`);
    }
    p.primaryCategory = main;
    p.subcategory = '';
    p.heading = headingIn;
    p.additionalCategories = p.additionalCategories || [];
    UNMAPPED.push(p.name);
    continue;
  }

  const pair = validatePair({
    primaryCategory: main,
    subcategory: sub,
    heading: headingIn,
    additionalCategories: p.additionalCategories,
  });
  if (pair.error) throw new Error(`Seed product "${p.name}" fails taxonomy: ${pair.error}`);
  p.primaryCategory = pair.primaryCategory;
  p.subcategory = pair.subcategory;
  p.heading = pair.heading;
  p.additionalCategories = pair.additionalCategories;
}

async function seed() {
  await connectDB();

  let categoryCount = 0;
  for (const cat of CATEGORIES) {
    // Subcategory names repeat across main categories ('Bio Insecticides' is
    // listed under Crop Protection AND Organic), so uniqueness is the pair.
    await Category.updateOne({ name: cat.name, type: cat.type }, { $set: cat }, { upsert: true });
    categoryCount += 1;
  }
  // Remove category records that are no longer part of the taxonomy
  // (retired names AND retired main-category assignments).
  const stale = await Category.deleteMany({
    $nor: CATEGORIES.map((c) => ({ name: c.name, type: c.type })),
  });
  if (stale.deletedCount) console.log(`[seed] Removed ${stale.deletedCount} stale category record(s).`);

  let productCount = 0;
  const usedSlugs = new Set();
  for (const product of PRODUCTS) {
    const { name, ...rest } = product;
    // URL slug derived from the name (deduplicated inside this batch).
    let slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'product';
    let candidate = slug;
    for (let i = 2; usedSlugs.has(candidate); i += 1) candidate = `${slug}-${i}`;
    usedSlugs.add(candidate);
    await Product.updateOne({ name }, { $set: { ...rest, name, slug: candidate } }, { upsert: true });
    productCount += 1;
  }

  // Clear any lingering pre-restructure fields (type/category). This has to
  // go through the raw collection: Mongoose strict mode silently strips
  // $unset paths that are absent from the schema, so an inline $unset in the
  // update above would never run.
  await Product.collection.updateMany(
    { $or: [{ type: { $exists: true } }, { category: { $exists: true } }] },
    { $unset: { type: '', category: '' } }
  );

  const total = await Product.countDocuments();
  const totalCategories = await Category.countDocuments();
  const seasonal = await Product.countDocuments({ active: true, isSeasonal: true });
  console.log(`[seed] Upserted ${categoryCount} categories (${totalCategories} total in DB).`);
  console.log(`[seed] Upserted ${productCount} demo products (${total} total in DB; ${seasonal} seasonal).`);
  if (UNMAPPED.length) {
    console.log(`[seed] ${UNMAPPED.length} legacy demo product(s) have no fitting subcategory in the new structure.`);
    console.log('[seed] They keep a heading + primary category (visible in the main grid) but no subcategory:');
    for (const n of UNMAPPED) console.log(`[seed]   - ${n}`);
    console.log('[seed] Reassign them from the admin dashboard when a suitable subcategory is confirmed.');
  }
  console.log('[seed] All pesticide label/registration fields are clearly labelled DEMO data.');
  console.log('[seed] Done.');

  await disconnectDB();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
