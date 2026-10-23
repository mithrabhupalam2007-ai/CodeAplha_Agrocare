/**
 * Seed the database with categories and the owner's IMPORTED product
 * catalogue for the seven-category store taxonomy (Seeds, Crop Protection,
 * Crop Nutrition, Equipments, Animal Husbandry, Organic, Tapas).
 * Safe to re-run: every record is upserted; category records that no longer
 * exist in the taxonomy are removed.
 *
 *   npm run seed
 *
 * IMPORTED CATALOGUE (the only products seeded)
 * server/data/importedProducts.json (generated once by
 * server/scripts/importImages.js from the owner's images/ folder) is
 * upserted by its stable import slug — real brand photos with deterministic
 * in-band prices, so re-runs stay idempotent.
 *
 * DEMO PRODUCTS REMOVED
 * The old fictional demo/sample product array (110 entries) was removed on
 * 2026-10-23: it is no longer seeded, and demo rows were deleted from the
 * database (a backup lives in server/backups/). Category sub-descriptions
 * below are generic text and do NOT imply demo products.
 *
 * NOTE: imported listings' price/rating/stock are demo-derived placeholders
 * computed by importImages.js — verify them before real sales.
 */
require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const taxonomy = require('../utils/taxonomy');

/** Imported real-photo catalogue (one-time output of scripts/importImages.js). */
const IMPORTED = require('../data/importedProducts.json');

/**
 * One-line category descriptions stored on each Category record (shown in the
 * admin categories manager). Neutral, factual wording — the catalogue now
 * holds the owner's real imported products, so no "demo" phrasing remains.
 */
const SUB_DESCRIPTIONS = {
  // Seeds
  'Vegetable Seeds': 'Vegetable seeds for kharif, rabi and kitchen-garden plantings.',
  'Fruit Seeds': 'Melon, papaya, gourd and other fruit-crop seeds.',
  'Flower Seeds': 'Marigold, rose and other flowering-crop seeds.',
  Forages: 'Berseem, fodder maize and other forage crop seeds.',
  'Maize/Corn': 'Hybrid and open-pollinated maize seed listings.',
  Paddy: 'Paddy (rice) varieties for kharif plantings.',
  Mustard: 'Mustard and oilseed varieties for rabi.',
  Jowar: 'Jowar (sorghum) seed listings.',
  Cotton: 'Cotton hybrid and deshi seed listings.',
  Polyhouse: 'Seeds suited to polyhouse and protected cultivation.',
  Exotics: 'Exotic vegetable seed listings for specialty markets.',

  'Urban Garden': 'Terrace and kitchen-garden seed packs.',

  // Crop Protection — chemical
  Insecticides: 'Insecticide listings — always follow the original product label.',
  Fungicides: 'Fungicide listings for fungal disease management.',
  Herbicides: 'Weed-management listings for field and orchard use.',
  Bactericides: 'Bacterial-disease management listings.',
  // Crop Protection — bio
  'Bio Insecticides': 'Neem-based and microbial products for low-chemical farming.',
  'Bio Fungicides': 'Microbial bio-fungicide listings.',
  'Bio Viricides': 'Virus-management bio listings.',
  'Bio Nematicides': 'Bio nematicide listings for soil nematode management.',
  // Crop Protection — traps and lures
  'Sticky Traps': 'Yellow and blue sticky trap listings for monitoring and mass trapping.',
  'Pheromone Lures': 'Species-specific pheromone lure capsule listings.',
  'Pheromone Traps': 'Funnel and bucket pheromone trap listings.',
  'Solar Light Traps': 'Solar-powered light trap listings for night-time insect monitoring.',
  // Crop Nutrition — fertilizers
  'Chemical Fertilizers': 'Straight and complex fertilizer listings such as urea, SSP and MOP.',
  'Bio/Organic Fertilizers': 'Compost, vermicompost and microbial biofertilizer listings.',
  'Micro Nutrients': 'Zinc, iron and other micronutrient listings.',
  'Humic Acids': 'Humic and fulvic acid soil-conditioner listings.',
  'pH Balancers': 'Soil pH correction product listings such as lime.',
  // Crop Nutrition — growth promoters
  'Plain Growth Promoters': 'General plant-growth promoter listings.',
  'Plant Enhancers': 'Foliar enhancer and vigour listings.',
  'Bio Stimulants': 'Seaweed, amino-acid and microbial bio-stimulant listings.',
  // Crop Nutrition — plant growth regulators
  'Yield Boosters': 'Plant growth regulator listings — follow the product label strictly.',
  'Fruit Enhancers': 'Fruit-set and quality enhancer listings.',
  'Flower Boosters': 'Flowering promoter listings.',
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
  'Cattle Feed': 'Cattle feed pellet and mash listings.',
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
    description: SUB_DESCRIPTIONS[name] || `${name} listings.`,
  }))
);

const { validatePair } = taxonomy;

/**
 * Imported catalogue records (real brand photos): classification + demo
 * price/rating are computed by importImages.js; only the heading is
 * derived here so the taxonomy stays the single source of truth.
 */
for (const p of IMPORTED) {
  const pair = validatePair({
    primaryCategory: p.primaryCategory,
    subcategory: p.subcategory,
    additionalCategories: p.additionalCategories,
  });
  if (pair.error) throw new Error(`Imported product "${p.name}" fails taxonomy: ${pair.error}`);
  p.primaryCategory = pair.primaryCategory;
  p.subcategory = pair.subcategory;
  p.heading = pair.heading;
  p.additionalCategories = pair.additionalCategories;
  p.priceExempt = false;
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

  // Imported catalogue products — upserted by their stable import slug.
  let importedCount = 0;
  for (const product of IMPORTED) {
    const { slug: importSlug, ...rest } = product;
    await Product.updateOne({ slug: importSlug }, { $set: { ...rest, slug: importSlug } }, { upsert: true });
    importedCount += 1;
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
  console.log(`[seed] Upserted ${importedCount} imported catalogue products (${total} total in DB; ${seasonal} seasonal).`);
  console.log('[seed] Demo/sample products are no longer seeded (removed 2026-10-23).');
  console.log('[seed] Done.');

  await disconnectDB();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
