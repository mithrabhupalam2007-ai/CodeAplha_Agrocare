/**
 * Seed the database with clearly-labelled DEMO products and categories.
 * Safe to re-run: every record is upserted by name; category records that
 * no longer exist in the taxonomy are removed.
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
  'Cereal and Grain Seeds': 'Paddy, wheat, maize and other cereal grain seeds (demo catalogue).',
  'Pulse and Legume Seeds': 'Gram, tur, moong and other pulse seeds for kharif and rabi (demo catalogue).',
  'Oilseed Seeds': 'Groundnut and other oilseed crop seeds (demo catalogue).',
  'Fruit and Melon Seeds': 'Melon, papaya, gourd and other fruit crop seeds (demo catalogue).',
  'Fibre and Commercial Crop Seeds': 'Cotton and other fibre / commercial crop seeds (demo catalogue).',
  'Hybrid Seeds': 'Hybrid vegetable seed listings in the demo catalogue.',
  'Organic and Traditional Seeds': 'Heirloom and traditional open-pollinated seed listings (demo catalogue).',
  // Pesticides
  Insecticides: 'Demo insecticide listings — always follow the original product label.',
  'Herbicides (Weed Killers)': 'Demo weed-management listings for field and orchard use.',
  Fungicides: 'Demo fungicide listings for fungal disease management.',
  Bactericides: 'Demo bacterial-disease management listings (label data is fictional).',
  Nematicides: 'Demo soil nematode management listings (label data is fictional).',
  'Acaricides (Mite Killers)': 'Demo mite-control listings for crops and orchards (label data is fictional).',
  'Rodenticides (Rat Killers)': 'Demo rodent-control listings — keep bait away from children and animals.',
  'Molluscicides (Snail and Slug Killers)': 'Demo snail and slug control listings (label data is fictional).',
  'Bio-Pesticides': 'Neem-based and microbial demo products for low-chemical farming.',
  'Seed Treatment Pesticides': 'Demo seed-treatment listings (label data is fictional).',
  // Fertilizers
  'Organic Fertilizers': 'Compost, vermicompost and organic manure listings (demo catalogue).',
  'Chemical Fertilizers': 'Conventional straight-fertilizer listings such as urea, SSP and ammonium sulphate (demo catalogue).',
  Biofertilizers: 'Rhizobium and other microbial biofertilizer listings (demo catalogue).',
  'Nitrogen Fertilizers': 'Nitrogen sources for top-dressing and basal application (demo catalogue).',
  'Phosphorus Fertilizers': 'Phosphatic fertilizers for root and grain development (demo catalogue).',
  'Potassium Fertilizers': 'Potassic fertilizers for quality and stress tolerance (demo catalogue).',
  'NPK Fertilizers': 'Balanced NPK blend listings (demo catalogue).',
  'Micronutrient Fertilizers': 'Zinc, iron and other micronutrient listings (demo catalogue).',
  'Water-Soluble Fertilizers': 'Soluble grades for fertigation and foliar feeding (demo catalogue).',
  'Slow-Release Fertilizers': 'Coated and controlled-release fertilizer listings (demo catalogue).',
};

/**
 * Category records = every taxonomy subcategory + one Farming Essentials
 * entry (that type has no subcategories, so it is its own category value).
 */
const CATEGORIES = [
  ...Object.entries(taxonomy.SUBCATEGORIES).flatMap(([type, subs]) =>
    subs.map((name) => ({
      name,
      type,
      image: `/images/subcategories/${slug(name)}.svg`,
      description: SUB_DESCRIPTIONS[name] || `${name} demo listings.`,
    }))
  ),
  {
    name: 'Farming Essentials',
    type: 'Farming Essentials',
    image: '/images/categories/farming-tools.jpg',
    description: 'Hand tools, sprayers and personal protective equipment.',
  },
];

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
    category: 'Cereal and Grain Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 480, packSize: '5 kg',
    image: '/images/products/paddy-seed.svg', stockQuantity: 85, featured: true, isSeasonal: true, seasonalNote: 'Kharif sowing season (demo)', rating: 4.6,
    crops: ['Paddy', 'Rice'],
    seedInfo: { variety: 'Sugandha (demo variety)', cropType: 'Paddy', germinationPercent: 88, daysToGerminate: '3-5 days', sowingInstructions: 'Demo guidance: nursery raise 25 days, transplant 2-3 seedlings per hill at 20 x 15 cm.' },
    specifications: [{ label: 'Grain type', value: 'Long slender (demo)' }, { label: 'Duration', value: '125-135 days (demo)' }],
  }),
  P({
    name: 'Wheat Seed - Sharad (Demo)',
    description: 'Rabi wheat demo seed listing with strong tillering and good grain filling under irrigated conditions.',
    category: 'Cereal and Grain Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 650, packSize: '10 kg',
    image: '/images/products/wheat-seed.svg', stockQuantity: 70, isSeasonal: true, seasonalNote: 'Rabi sowing season (demo)', rating: 4.4,
    crops: ['Wheat'],
    seedInfo: { variety: 'Sharad (demo variety)', cropType: 'Wheat', germinationPercent: 90, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: drill at 20 cm row spacing with 40-50 kg seed per hectare after timely sowing.' },
    specifications: [{ label: 'Duration', value: '110-120 days (demo)' }],
  }),
  P({
    name: 'Maize Seed - Amber Hybrid (Demo)',
    description: 'Yellow-flint maize demo seed listing with sturdy stalks and uniform cobs for kharif or rabi plantings.',
    category: 'Cereal and Grain Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 280, packSize: '1 kg',
    image: '/images/products/maize-seed.svg', stockQuantity: 110, rating: 4.3,
    crops: ['Maize', 'Corn'],
    seedInfo: { variety: 'Amber Hybrid (demo variety)', cropType: 'Maize', germinationPercent: 87, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: sow at 60 x 25 cm spacing; thin to one plant per hill after emergence.' },
    specifications: [],
  }),

  // ---------------- Oilseed / Fibre seeds ----------------
  P({
    name: 'Groundnut Seed - Kadbi (Demo)',
    description: 'Kharif groundnut demo seed listing with high shelling percentage and medium-duration maturity.',
    category: 'Oilseed Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 260, packSize: '1 kg',
    image: '/images/products/groundnut-seed.svg', stockQuantity: 55, rating: 4.2,
    crops: ['Groundnut'],
    seedInfo: { variety: 'Kadbi (demo variety)', cropType: 'Groundnut', germinationPercent: 82, daysToGerminate: '6-8 days', sowingInstructions: 'Demo guidance: sow at 30 x 15 cm in well-drained sandy loam; avoid waterlogging.' },
    specifications: [],
  }),
  P({
    name: 'Cotton Seed - Kapaat F1 (Demo)',
    description: 'Bollgard-style demo listing for hybrid cotton seed with medium duration and uniform boll opening. Fictional demo product.',
    category: 'Fibre and Commercial Crop Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 340, packSize: '500 g',
    image: '/images/products/cotton-seed.jpg', stockQuantity: 60, bestseller: true, isSeasonal: true, seasonalNote: 'Kharif cotton belt (demo)', rating: 4.5,
    crops: ['Cotton'],
    seedInfo: { variety: 'Kapaat F1 (demo variety)', cropType: 'Cotton', germinationPercent: 80, daysToGerminate: '7-10 days', sowingInstructions: 'Demo guidance: sow at 60 x 30 cm spacing after the soil reaches suitable temperature for your region.' },
    specifications: [{ label: 'Duration', value: '160-170 days (demo data)' }],
  }),

  // ---------------- Fruit and Melon Seeds ----------------
  P({
    name: 'Watermelon Seed - Chandan (Demo)',
    description: 'Sweet, round watermelon demo seed listing with strong vine vigour and uniform fruit size.',
    category: 'Fruit and Melon Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 165, packSize: '10 g',
    image: '/images/products/watermelon-seed.jpg', stockQuantity: 68, isSeasonal: true, seasonalNote: 'Summer season pick (demo)', rating: 4.6,
    crops: ['Watermelon'],
    seedInfo: { variety: 'Chandan (demo variety)', cropType: 'Watermelon', germinationPercent: 86, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: raise transplants in poly bags, plant out at 2 x 1.5 m spacing.' },
    specifications: [{ label: 'Rind', value: 'Striped dark green (demo)' }],
  }),
  P({
    name: 'Muskmelon Seed - Madhur (Demo)',
    description: 'Aromatic muskmelon demo seed listing with netted rind and high sugar content in demo descriptions.',
    category: 'Fruit and Melon Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 85, packSize: '10 g',
    image: '/images/products/muskmelon-seed.jpg', stockQuantity: 90, rating: 4.3,
    crops: ['Muskmelon'],
    seedInfo: { variety: 'Madhur (demo variety)', cropType: 'Muskmelon', germinationPercent: 83, daysToGerminate: '5-7 days', sowingInstructions: 'Demo guidance: direct sow at 2 x 1 m spacing on well-drained sandy loam.' },
    specifications: [],
  }),
  P({
    name: 'Papaya Seed - Madhuram (Demo)',
    description: 'Papaya demo seed listing from a fictional hybrid line; plants begin bearing early under good management.',
    category: 'Fruit and Melon Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 75, packSize: '50 seeds',
    image: '/images/products/papaya-seed.jpg', stockQuantity: 120, rating: 4.4,
    crops: ['Papaya'],
    seedInfo: { variety: 'Madhuram (demo variety)', cropType: 'Papaya', germinationPercent: 76, daysToGerminate: '10-15 days', sowingInstructions: 'Demo guidance: sow nursery-raised seedlings at 2.5 x 2.5 m spacing; avoid waterlogged soil.' },
    specifications: [],
  }),
  P({
    name: 'Strawberry Seed - Sunkiss (Demo)',
    description: 'Day-neutral strawberry demo seed listing for kitchen gardens and polyhouse trays.',
    category: 'Fruit and Melon Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 199, packSize: '100 seeds',
    image: '/images/products/strawberry-seed.jpg', stockQuantity: 44, rating: 4.0,
    crops: ['Strawberry'],
    seedInfo: { variety: 'Sunkiss (demo variety)', cropType: 'Strawberry', germinationPercent: 70, daysToGerminate: '14-21 days', sowingInstructions: 'Demo guidance: surface-sow on moist cocopeat, cover lightly, keep 20-25 C until germination.' },
    specifications: [],
  }),

  // ---------------- Pulse and Legume Seeds (new demo listings) ----------------
  P({
    name: 'Gram (Chickpea) Seed - Jyoti (Demo)',
    description: 'Desi-style gram demo seed listing with medium-duration maturity for rabi plantings on well-drained soils.',
    category: 'Pulse and Legume Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 165, packSize: '1 kg',
    image: '/images/products/pulse-gram-seed.svg', stockQuantity: 90, rating: 4.3,
    crops: ['Gram', 'Chickpea'],
    seedInfo: { variety: 'Jyoti (demo variety)', cropType: 'Gram', germinationPercent: 85, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: drill at 30 x 10 cm spacing after timely rabi sowing; avoid waterlogged fields.' },
    specifications: [{ label: 'Seed type', value: 'Desi (demo data)' }],
  }),
  P({
    name: 'Tur (Arhar) Seed - Sukhad (Demo)',
    description: 'Medium-duration tur demo seed listing suited to kharif and summer plantings in pulse-growing regions.',
    category: 'Pulse and Legume Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 210, packSize: '1 kg',
    image: '/images/products/pulse-tur-seed.svg', stockQuantity: 66, rating: 4.2,
    crops: ['Tur', 'Arhar', 'Pigeon Pea'],
    seedInfo: { variety: 'Sukhad (demo variety)', cropType: 'Tur', germinationPercent: 80, daysToGerminate: '6-10 days', sowingInstructions: 'Demo guidance: sow at 60 x 30 cm spacing; thin to one plant per hill after emergence.' },
    specifications: [],
  }),
  P({
    name: 'Moong Seed - Sona (Demo)',
    description: 'Short-duration moong demo seed listing for kharif and summer sowings with quick maturity.',
    category: 'Pulse and Legume Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 145, packSize: '1 kg',
    image: '/images/products/pulse-moong-seed.svg', stockQuantity: 110, rating: 4.1,
    crops: ['Moong', 'Green Gram'],
    seedInfo: { variety: 'Sona (demo variety)', cropType: 'Moong', germinationPercent: 82, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: broadcast or drill in 30 cm rows; avoid waterlogging after flowering.' },
    specifications: [],
  }),

  // ---------------- Hybrid Seeds (new demo listings) ----------------
  P({
    name: 'Hybrid Bitter Gourd Seed - Karuna F1 (Demo)',
    description: 'High-yielding hybrid bitter gourd demo seed listing with uniform ridged fruits and early vine maturity.',
    category: 'Hybrid Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 95, packSize: '10 g',
    image: '/images/products/hybrid-bittergourd-seed.svg', stockQuantity: 58, rating: 4.2,
    crops: ['Bitter Gourd'],
    seedInfo: { variety: 'Karuna F1 (demo variety)', cropType: 'Bitter Gourd', germinationPercent: 83, daysToGerminate: '5-8 days', sowingInstructions: 'Demo guidance: raise poly-bag transplants, plant out at 2 x 1 m on trellis systems.' },
    specifications: [{ label: 'Seed type', value: 'Hybrid (demo data)' }],
  }),
  P({
    name: 'Hybrid Cauliflower Seed - Sheet F1 (Demo)',
    description: 'Mid-season hybrid cauliflower demo seed listing with compact white curds and uniform maturity.',
    category: 'Hybrid Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 110, packSize: '10 g',
    image: '/images/products/hybrid-cauliflower-seed.svg', stockQuantity: 64, rating: 4.3,
    crops: ['Cauliflower'],
    seedInfo: { variety: 'Sheet F1 (demo variety)', cropType: 'Cauliflower', germinationPercent: 86, daysToGerminate: '4-7 days', sowingInstructions: 'Demo guidance: raise nursery seedlings, transplant at 60 x 45 cm spacing in rabi plantings.' },
    specifications: [{ label: 'Seed type', value: 'Hybrid (demo data)' }],
  }),

  // ---------------- Organic and Traditional Seeds (new demo listings) ----------------
  P({
    name: 'Heirloom Bottle Gourd Seed - Desi (Demo)',
    description: 'Traditional open-pollinated bottle gourd demo seed listing saved from long-running desi lines.',
    category: 'Organic and Traditional Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 60, packSize: '20 g',
    image: '/images/products/organic-bottlegourd-seed.svg', stockQuantity: 120, rating: 4.0,
    crops: ['Bottle Gourd'],
    seedInfo: { variety: 'Desi long (demo variety)', cropType: 'Bottle Gourd', germinationPercent: 78, daysToGerminate: '6-10 days', sowingInstructions: 'Demo guidance: direct sow 2 seeds per hill at 2 x 1.5 m spacing on raised beds.' },
    specifications: [{ label: 'Seed type', value: 'Open-pollinated heirloom (demo)' }],
  }),
  P({
    name: 'Traditional Foxtail Millet Seed (Demo)',
    description: 'Traditional foxtail millet demo seed listing for dryland farming demonstrations and kitchen gardens.',
    category: 'Organic and Traditional Seeds', type: 'Seeds', brand: 'KrishiBeej (Demo)', price: 120, packSize: '500 g',
    image: '/images/products/organic-millet-seed.svg', stockQuantity: 85, rating: 4.2,
    crops: ['Foxtail Millet'],
    seedInfo: { variety: 'Traditional (demo variety)', cropType: 'Foxtail Millet', germinationPercent: 80, daysToGerminate: '4-6 days', sowingInstructions: 'Demo guidance: drill or broadcast in 25 cm rows; thin seedlings after 15-20 days.' },
    specifications: [{ label: 'Seed type', value: 'Traditional open-pollinated (demo)' }],
  }),

  // ---------------- Insecticides (demo label data only) ----------------
  P({
    name: 'FarmGuard Crop Shield Insecticide (Demo)',
    description: 'Fictional broad-spectrum insecticide demo listing for the AgroShield marketplace. This is demonstration data only — it is not a registered product. Always rely on the original product label of whatever you actually purchase.',
    category: 'Insecticides', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 425, packSize: '500 ml',
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
    category: 'Insecticides', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 640, packSize: '1 L',
    image: '/images/products/leaf-guard-spray.svg', stockQuantity: 40, rating: 4.2,
    crops: ['Vegetables', 'Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'BioAgro Beat Bug Concentrate (Demo)',
    description: 'Fictional concentrated insecticide demo listing for nursery and greenhouse demonstrations on this site.',
    category: 'Insecticides', type: 'Pesticides', brand: 'BioAgro (Demo)', price: 290, packSize: '250 ml',
    image: '/images/products/beat-bug.svg', stockQuantity: 88, rating: 4.1,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Fungicides ----------------
  P({
    name: 'FarmGuard Fungal Shield WP (Demo)',
    description: 'Fictional protective fungicide demo listing. Demonstration data only — replace with verified label details of a genuinely registered product before real listing.',
    category: 'Fungicides', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 380, packSize: '500 g',
    image: '/images/products/fungal-shield.svg', stockQuantity: 62, rating: 4.3,
    crops: ['Paddy', 'Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Blight Guard Fungicide (Demo)',
    description: 'Fictional systemic fungicide demo listing for demonstrating crop-protection pages. Not a real registered product.',
    category: 'Fungicides', type: 'Pesticides', brand: 'GreenField (Demo)', price: 720, packSize: '1 L',
    image: '/images/products/blight-guard.svg', stockQuantity: 36, rating: 4.5,
    crops: ['Tomato', 'Potato', 'Grapes'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Herbicides (Weed Killers) ----------------
  P({
    name: 'WeedOut Field Herbicide (Demo)',
    description: 'Fictional pre-emergence herbicide demo listing for field weed management demonstrations on this platform.',
    category: 'Herbicides (Weed Killers)', type: 'Pesticides', brand: 'WeedOut (Demo)', price: 560, packSize: '1 L',
    image: '/images/products/weedout-field.svg', stockQuantity: 58, rating: 4.2,
    crops: ['Cotton', 'Maize', 'Paddy'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'WeedOut Orchard Cleaner (Demo)',
    description: 'Fictional non-selective herbicide demo listing for orchard floor management demonstrations. Not a real product.',
    category: 'Herbicides (Weed Killers)', type: 'Pesticides', brand: 'WeedOut (Demo)', price: 395, packSize: '500 ml',
    image: '/images/products/orchard-cleaner.svg', stockQuantity: 47, rating: 4.0,
    crops: ['Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- New pesticide subcategories (demo label data only) ----------------
  P({
    name: 'FarmGuard Copper Bactericide WP (Demo)',
    description: 'Fictional copper-based bactericide demo listing for demonstrating the Bactericides subcategory. Not a registered product — verified label data would be required before any real listing.',
    category: 'Bactericides', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 280, packSize: '500 g',
    image: '/images/products/bactericide-copper.svg', stockQuantity: 55, rating: 4.1,
    crops: ['Vegetables', 'Fruits'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Soil Nematicide (Demo)',
    description: 'Fictional soil-applied nematicide demo listing for demonstrating the Nematicides subcategory. Not a registered product.',
    category: 'Nematicides', type: 'Pesticides', brand: 'GreenField (Demo)', price: 450, packSize: '1 L',
    image: '/images/products/nematicide-soil.svg', stockQuantity: 42, rating: 4.0,
    crops: ['Vegetables', 'Banana'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'FarmGuard Mite Kill Acaricide (Demo)',
    description: 'Fictional acaricide demo listing for demonstrating the Acaricides (Mite Killers) subcategory. Not a registered product.',
    category: 'Acaricides (Mite Killers)', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 390, packSize: '500 ml',
    image: '/images/products/acaricide-mite.svg', stockQuantity: 48, rating: 4.1,
    crops: ['Fruits', 'Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'SafeKill Rodenticide Bait Blocks (Demo)',
    description: 'Fictional rodenticide bait-block demo listing for demonstrating the Rodenticides subcategory. Not a real product — secure all bait stations against children and animals.',
    category: 'Rodenticides (Rat Killers)', type: 'Pesticides', brand: 'SafeKill (Demo)', price: 150, packSize: '100 g (blocks)',
    image: '/images/products/rodenticide-bait.svg', stockQuantity: 70, rating: 4.0,
    crops: [],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'GreenField Molluscicide Pellets (Demo)',
    description: 'Fictional molluscicide pellet demo listing for demonstrating the Molluscicides (Snail and Slug Killers) subcategory. Not a registered product.',
    category: 'Molluscicides (Snail and Slug Killers)', type: 'Pesticides', brand: 'GreenField (Demo)', price: 230, packSize: '500 g',
    image: '/images/products/molluscicide-pellets.svg', stockQuantity: 51, rating: 4.0,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'FarmGuard Seed Treatment Fungi Guard (Demo)',
    description: 'Fictional seed-treatment fungicide demo listing for demonstrating the Seed Treatment Pesticides subcategory. Not a registered product.',
    category: 'Seed Treatment Pesticides', type: 'Pesticides', brand: 'FarmGuard (Demo)', price: 320, packSize: '1 kg',
    image: '/images/products/seed-treatment.svg', stockQuantity: 63, rating: 4.2,
    crops: ['Wheat', 'Groundnut', 'Cotton'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Bio-Pesticides ----------------
  P({
    name: 'BioAgro Cold-Pressed Neem Oil (Demo)',
    description: 'Cold-pressed neem oil demo listing for organic farming demonstrations. Label details below are placeholder demo text.',
    category: 'Bio-Pesticides', type: 'Pesticides', brand: 'BioAgro (Demo)', price: 350, packSize: '500 ml',
    image: '/images/products/neem-oil.svg', stockQuantity: 102, bestseller: true, featured: true, isSeasonal: true, seasonalNote: 'Kharif pest management (demo)', rating: 4.5,
    crops: ['Vegetables', 'Fruits', 'Ornamentals'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — cold-pressed neem oil listing; percentage and registration not verified.' },
    specifications: [{ label: 'Product status', value: 'DEMO LISTING — verify licensing before any sale' }],
  }),
  P({
    name: 'BioAgro Trichoderma Bio-Fungicide (Demo)',
    description: 'Microbial bio-fungicide demo listing for seed and soil application demonstrations on this site.',
    category: 'Bio-Pesticides', type: 'Pesticides', brand: 'BioAgro (Demo)', price: 280, packSize: '250 g',
    image: '/images/products/trichoderma.svg', stockQuantity: 84, rating: 4.4,
    crops: ['Vegetables', 'Field Crops'],
    labelInfo: { ...DEMO_LABEL, composition: 'DEMO DATA — microbial formulation listing; viable count and registration not verified.' },
    specifications: PESTICIDE_SPEC,
  }),
  P({
    name: 'BioAgro Botanical Guard Spray (Demo)',
    description: 'Plant-extract based botanical spray demo listing for integrated pest management demonstrations.',
    category: 'Bio-Pesticides', type: 'Pesticides', brand: 'BioAgro (Demo)', price: 320, packSize: '500 ml',
    image: '/images/products/botanical-guard.svg', stockQuantity: 71, rating: 4.2,
    crops: ['Vegetables'],
    labelInfo: { ...DEMO_LABEL },
    specifications: PESTICIDE_SPEC,
  }),

  // ---------------- Fertilizers ----------------
  P({
    name: 'AgroShield Vermicompost 5 kg',
    description: 'Screened organic vermicompost for gardens and field application. Improves soil structure and moisture retention when worked into the topsoil.',
    category: 'Organic Fertilizers', type: 'Fertilizers', brand: 'AgroShield Naturals', price: 250, packSize: '5 kg',
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
    category: 'NPK Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 540, packSize: '5 kg',
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
    category: 'Micronutrient Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 310, packSize: '1 kg',
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
    category: 'Water-Soluble Fertilizers', type: 'Fertilizers', brand: 'BioAgro (Demo)', price: 450, packSize: '1 L',
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
    category: 'Nitrogen Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 295, packSize: '45 kg',
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
    category: 'Phosphorus Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 340, packSize: '50 kg',
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
    category: 'Potassium Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 1275, packSize: '50 kg',
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
    category: 'Biofertilizers', type: 'Fertilizers', brand: 'BioAgro (Demo)', price: 180, packSize: '250 g',
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
    category: 'Chemical Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 310, packSize: '45 kg',
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
    category: 'Slow-Release Fertilizers', type: 'Fertilizers', brand: 'AgroShield Nutrition', price: 410, packSize: '45 kg',
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
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 450, packSize: '1 piece',
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
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 1899, packSize: '1 unit (16 L)',
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
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Safety', price: 199, packSize: '1 pair',
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
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Safety', price: 249, packSize: '1 piece',
    image: '/images/products/respirator-mask.svg', stockQuantity: 145, rating: 4.4,
    specifications: [
      { label: 'Type', value: 'Reusable half-mask' },
      { label: 'Filters', value: 'Twin replaceable cartridges' },
    ],
  }),
  P({
    name: 'AgroShield Bypass Pruning Shears',
    description: 'Sharp bypass pruning shears with ergonomic handles for vines, orchards and greenhouse pruning.',
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 349, packSize: '1 piece',
    image: '/images/products/pruning-shears.svg', stockQuantity: 88, rating: 4.2,
    specifications: [
      { label: 'Blade', value: 'Hardened carbon steel' },
      { label: 'Cut capacity', value: 'Up to 20 mm' },
    ],
  }),
  P({
    name: 'AgroShield Weed Cutter with Wooden Handle',
    description: 'Traditional curved weed-cutter blade with a smooth wooden handle for clearing field bunds, borders and canal sides.',
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 599, packSize: '1 piece',
    image: '/images/products/weed-cutter.svg', stockQuantity: 52, isSeasonal: true, seasonalNote: 'Monsoon bund clearing (demo)', rating: 4.1,
    specifications: [
      { label: 'Blade', value: 'Carbon steel, curved' },
      { label: 'Handle', value: 'Wooden, 110 cm' },
    ],
  }),
  P({
    name: 'AgroShield Anti-Fog Safety Goggles',
    description: 'Wrap-around safety goggles with anti-fog polycarbonate lenses and a soft seal for spraying, handling seeds and dusty field work (demo listing).',
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Safety', price: 279, packSize: '1 piece',
    image: '/images/products/safety-goggles.svg', stockQuantity: 96, rating: 4.3,
    specifications: [
      { label: 'Lens', value: 'Polycarbonate, anti-fog' },
      { label: 'Protection', value: 'UV + splash guard' },
    ],
  }),
  P({
    name: 'AgroShield Garden Watering Can 5 L',
    description: 'Lightweight 5-litre watering can with an arched handle and rose sprinkler head for seedlings, terrace gardens and nursery beds (demo listing).',
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 389, packSize: '1 unit (5 L)',
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
    category: 'Farming Essentials', type: 'Farming Essentials', brand: 'AgroShield Tools', price: 499, packSize: '1 kit (3 pieces)',
    image: '/images/products/measuring-set.svg', stockQuantity: 61, rating: 4.2,
    specifications: [
      { label: 'Includes', value: 'pH strips, moisture meter, cup' },
      { label: 'Cup range', value: '50–1000 ml' },
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

/** Quick guard: every product must satisfy the store taxonomy. */
const { validatePair } = taxonomy;
for (const p of PRODUCTS) {
  const pair = validatePair({ type: p.type, category: p.category });
  if (pair.error) throw new Error(`Seed product "${p.name}" fails taxonomy: ${pair.error}`);
}

async function seed() {
  await connectDB();

  let categoryCount = 0;
  for (const cat of CATEGORIES) {
    await Category.updateOne({ name: cat.name }, { $set: cat }, { upsert: true });
    categoryCount += 1;
  }
  // Remove category records that are no longer part of the taxonomy
  // (e.g. the retired 'Field Crop Seeds' / 'Herbicides' groupings).
  const stale = await Category.deleteMany({ name: { $nin: CATEGORIES.map((c) => c.name) } });
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

  const total = await Product.countDocuments();
  const totalCategories = await Category.countDocuments();
  const seasonal = await Product.countDocuments({ active: true, isSeasonal: true });
  console.log(`[seed] Upserted ${categoryCount} categories (${totalCategories} total in DB).`);
  console.log(`[seed] Upserted ${productCount} demo products (${total} total in DB; ${seasonal} seasonal).`);
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
