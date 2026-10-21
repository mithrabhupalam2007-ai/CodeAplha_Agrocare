/**
 * One-time migration for the seven-category restructuring.
 *
 *   npm run migrate:taxonomy
 *
 * What it does (non-destructively — no orders, accounts, wishlists or
 * product records are deleted):
 *
 *  1. Renames the legacy product classification fields
 *       type     -> primaryCategory
 *       category -> subcategory
 *     and derives `heading` (+ optional `additionalCategories`) from the
 *     store taxonomy (server/utils/taxonomy.js) using a per-product-name
 *     map for the known demo catalogue and a per-legacy-category fallback
 *     for anything else (e.g. admin-created products).
 *  2. Legacy demo products with no fitting subcategory in the new structure
 *     (wheat, pulses, groundnut, millet, nematicide, rodenticide,
 *     molluscicide) keep a heading + primary category but get subcategory ''
 *     — they stay visible in the main-category grid and are REPORTED below
 *     so an administrator can reassign them.
 *  3. Fixes the Category collection indexes: the old unique index on
 *     `name` is dropped (subcategory names now repeat across main
 *     categories, e.g. 'Bio Insecticides' under Crop Protection AND
 *     Organic) and the compound unique { name, type } is ensured.
 *
 * Safe to re-run: every step is idempotent.
 */
require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const taxonomy = require('../utils/taxonomy');

/**
 * Known demo products: exact new classification per product name.
 * (The seed normalizes these too — this map matters for databases that run
 * the migration WITHOUT re-seeding.)
 * [primaryCategory, subcategory, additionalCategories, heading(only when unmapped)]
 */
const NAME_MAP = {
  // ---- Seeds ----
  'Paddy (Rice) Seed - Sugandha (Demo)': ['Seeds', 'Paddy'],
  'Wheat Seed - Sharad (Demo)': ['Seeds', '', [], 'Field Crops'],
  'Maize Seed - Amber Hybrid (Demo)': ['Seeds', 'Maize/Corn'],
  'Groundnut Seed - Kadbi (Demo)': ['Seeds', '', [], 'Field Crops'],
  'Cotton Seed - Kapaat F1 (Demo)': ['Seeds', 'Cotton'],
  'Watermelon Seed - Chandan (Demo)': ['Seeds', 'Fruit Seeds'],
  'Muskmelon Seed - Madhur (Demo)': ['Seeds', 'Fruit Seeds'],
  'Papaya Seed - Madhuram (Demo)': ['Seeds', 'Fruit Seeds'],
  'Strawberry Seed - Sunkiss (Demo)': ['Seeds', 'Fruit Seeds'],
  'Gram (Chickpea) Seed - Jyoti (Demo)': ['Seeds', '', [], 'Field Crops'],
  'Tur (Arhar) Seed - Sukhad (Demo)': ['Seeds', '', [], 'Field Crops'],
  'Moong Seed - Sona (Demo)': ['Seeds', '', [], 'Field Crops'],
  'Hybrid Bitter Gourd Seed - Karuna F1 (Demo)': ['Seeds', 'Vegetable Seeds'],
  'Hybrid Cauliflower Seed - Sheet F1 (Demo)': ['Seeds', 'Vegetable Seeds'],
  'Heirloom Bottle Gourd Seed - Desi (Demo)': ['Seeds', 'Vegetable Seeds'],
  'Traditional Foxtail Millet Seed (Demo)': ['Seeds', '', [], 'Field Crops'],
  // ---- Crop Protection (was Pesticides) ----
  'FarmGuard Crop Shield Insecticide (Demo)': ['Crop Protection', 'Insecticides'],
  'FarmGuard Leaf Guard Spray (Demo)': ['Crop Protection', 'Insecticides'],
  'BioAgro Beat Bug Concentrate (Demo)': ['Crop Protection', 'Insecticides'],
  'FarmGuard Fungal Shield WP (Demo)': ['Crop Protection', 'Fungicides'],
  'GreenField Blight Guard Fungicide (Demo)': ['Crop Protection', 'Fungicides'],
  'WeedOut Field Herbicide (Demo)': ['Crop Protection', 'Herbicides'],
  'WeedOut Orchard Cleaner (Demo)': ['Crop Protection', 'Herbicides'],
  'FarmGuard Copper Bactericide WP (Demo)': ['Crop Protection', 'Bactericides'],
  'GreenField Soil Nematicide (Demo)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  'SafeKill Rodenticide Bait Blocks (Demo)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  'GreenField Molluscicide Pellets (Demo)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  'FarmGuard Seed Treatment Fungi Guard (Demo)': ['Crop Protection', 'Fungicides'],
  'BioAgro Cold-Pressed Neem Oil (Demo)': ['Crop Protection', 'Bio Insecticides', ['Organic']],
  'BioAgro Trichoderma Bio-Fungicide (Demo)': ['Crop Protection', 'Bio Fungicides', ['Organic']],
  'BioAgro Botanical Guard Spray (Demo)': ['Crop Protection', 'Bio Insecticides', ['Organic']],
  // ---- Crop Nutrition (was Fertilizers) ----
  'AgroShield Vermicompost 5 kg': ['Crop Nutrition', 'Bio/Organic Fertilizers', ['Organic']],
  'AgroShield NPK 19:19:19 Granules (Demo)': ['Crop Nutrition', 'Chemical Fertilizers'],
  'AgroShield Micronutrient Mix - Zinc': ['Crop Nutrition', 'Micro Nutrients'],
  'BioAgro SeaGrow Liquid Fertilizer': ['Crop Nutrition', 'Bio Stimulants', ['Organic']],
  'AgroShield Urea 46% Nitrogen': ['Crop Nutrition', 'Chemical Fertilizers'],
  'AgroShield Single Super Phosphate (SSP)': ['Crop Nutrition', 'Chemical Fertilizers'],
  'AgroShield Muriate of Potash (MOP)': ['Crop Nutrition', 'Chemical Fertilizers'],
  'BioAgro Rhizobium Biofertilizer (Demo)': ['Crop Nutrition', 'Bio/Organic Fertilizers', ['Organic']],
  'AgroShield Ammonium Sulphate': ['Crop Nutrition', 'Chemical Fertilizers'],
  'AgroShield Coated Slow-Release Urea (Demo)': ['Crop Nutrition', 'Chemical Fertilizers'],
  // ---- Equipments (was Farming Essentials) ----
  'AgroShield Stainless Steel Garden Hoe': ['Equipments', 'Garden Tools'],
  'AgroShield 16 L Knapsack Sprayer': ['Equipments', 'Sprayers'],
  'AgroShield Chemical-Resistant Gloves (Pair)': ['Equipments', 'Safety Kit'],
  'AgroShield Respirator Safety Mask': ['Equipments', 'Safety Kit'],
  'AgroShield Bypass Pruning Shears': ['Equipments', 'Garden Tools'],
  'AgroShield Weed Cutter with Wooden Handle': ['Equipments', 'Weeder/Tiller'],
  'AgroShield Anti-Fog Safety Goggles': ['Equipments', 'Safety Kit'],
  'AgroShield Garden Watering Can 5 L': ['Equipments', 'Nursery Inputs'],
  'AgroShield Garden Measuring Set': ['Equipments', 'Garden Tools'],
};

/**
 * Fallback for any other legacy product (admin-created): map each OLD
 * subcategory to a new (main, sub) pair, or [main, '', [], heading] when
 * the old grouping has no single confident home in the new structure
 * (those are reported for manual reassignment).
 */
const LEGACY_SUB_MAP = {
  // old Seeds subs
  'Vegetable Seeds': ['Seeds', 'Vegetable Seeds'],
  'Fruit and Melon Seeds': ['Seeds', 'Fruit Seeds'],
  'Cereal and Grain Seeds': ['Seeds', '', [], 'Field Crops'],
  'Pulse and Legume Seeds': ['Seeds', '', [], 'Field Crops'],
  'Oilseed Seeds': ['Seeds', '', [], 'Field Crops'],
  'Fibre and Commercial Crop Seeds': ['Seeds', '', [], 'Field Crops'],
  'Hybrid Seeds': ['Seeds', '', [], 'Horticulture Crops'],
  'Organic and Traditional Seeds': ['Seeds', '', [], 'Horticulture Crops'],
  // old Pesticides subs
  Insecticides: ['Crop Protection', 'Insecticides'],
  Fungicides: ['Crop Protection', 'Fungicides'],
  'Herbicides (Weed Killers)': ['Crop Protection', 'Herbicides'],
  Bactericides: ['Crop Protection', 'Bactericides'],
  'Acaricides (Mite Killers)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  Nematicides: ['Crop Protection', '', [], 'Chemical Pesticides'],
  'Rodenticides (Rat Killers)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  'Molluscicides (Snail and Slug Killers)': ['Crop Protection', '', [], 'Chemical Pesticides'],
  'Bio-Pesticides': ['Crop Protection', '', [], 'Bio/Organic Pesticides'],
  'Seed Treatment Pesticides': ['Crop Protection', '', [], 'Chemical Pesticides'],
  // old Fertilizers subs
  'Organic Fertilizers': ['Crop Nutrition', 'Bio/Organic Fertilizers'],
  Biofertilizers: ['Crop Nutrition', 'Bio/Organic Fertilizers'],
  'Chemical Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'Nitrogen Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'Phosphorus Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'Potassium Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'NPK Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'Micronutrient Fertilizers': ['Crop Nutrition', 'Micro Nutrients'],
  'Slow-Release Fertilizers': ['Crop Nutrition', 'Chemical Fertilizers'],
  'Water-Soluble Fertilizers': ['Crop Nutrition', '', [], 'Fertilizers'],
  // old Farming Essentials (no subs)
  'Farming Essentials': ['Equipments', '', [], 'Implements'],
};

/** Resolve the new classification for one legacy product document. */
function classify(doc) {
  if (NAME_MAP[doc.name]) {
    const [main, sub, addl = [], heading] = NAME_MAP[doc.name];
    return { main, sub, addl, heading, confident: Boolean(sub) };
  }
  const oldSub = String(doc.category || '').trim();
  const hit = LEGACY_SUB_MAP[oldSub];
  if (hit) {
    const [main, sub, addl = [], heading] = hit;
    return { main, sub, addl, heading, confident: Boolean(sub) };
  }
  // Unknown legacy category: keep it in its (closest) main family with a
  // heading only, so nothing disappears while nothing is mis-filed.
  const oldType = String(doc.type || '').trim();
  if (oldType === 'Seeds') return { main: 'Seeds', sub: '', addl: [], heading: 'Horticulture Crops', confident: false };
  if (oldType === 'Pesticides') return { main: 'Crop Protection', sub: '', addl: [], heading: 'Chemical Pesticides', confident: false };
  if (oldType === 'Fertilizers') return { main: 'Crop Nutrition', sub: '', addl: [], heading: 'Fertilizers', confident: false };
  if (oldType === 'Farming Essentials') return { main: 'Equipments', sub: '', addl: [], heading: 'Implements', confident: false };
  return null; // should not happen — old schema required `type`
}

async function migrate() {
  await connectDB();
  const unmapped = [];
  let updated = 0;

  // ---- 1. Products: rename + derive classification ------------------------
  const products = await Product.find({ primaryCategory: { $exists: false } }).lean();
  for (const doc of products) {
    const next = classify(doc);
    if (!next) {
      console.warn(`[migrate] SKIP ${doc._id} "${doc.name}" — no legacy type found.`);
      continue;
    }
    if (!next.confident) unmapped.push(`${doc.name} (was: ${doc.type} / ${doc.category || '—'})`);
    await Product.updateOne(
      { _id: doc._id },
      {
        $set: {
          primaryCategory: next.main,
          heading: next.heading || taxonomy.headingOf(next.main, next.sub) || '',
          subcategory: next.sub,
          additionalCategories: next.addl,
        },
      }
    );
    updated += 1;
  }

  // Mongoose strict mode strips $unset paths that are absent from the
  // schema, so the legacy classification fields have to be cleared through
  // the raw collection after the rewrite above.
  await Product.collection.updateMany(
    { $or: [{ type: { $exists: true } }, { category: { $exists: true } }] },
    { $unset: { type: '', category: '' } }
  );

  // Idempotency top-up: any product already migrated but missing the new
  // optional fields gets them (empty additional list / derived heading).
  await Product.updateMany(
    { additionalCategories: { $exists: false } },
    { $set: { additionalCategories: [] } }
  );
  const missingHeading = await Product.find({ heading: { $exists: false } }).lean();
  for (const doc of missingHeading) {
    // Heading is always derived from the taxonomy, never free-form.
    const heading = doc.subcategory ? taxonomy.headingOf(doc.primaryCategory, doc.subcategory) || '' : '';
    await Product.updateOne({ _id: doc._id }, { $set: { heading } });
  }

  // ---- 2. Category collection: fix the indexes ---------------------------
  try {
    await Category.collection.dropIndex('name_1');
    console.log('[migrate] Dropped legacy unique index Category.name_1.');
  } catch (err) {
    if (err.code !== 27 && !/index not found/i.test(String(err.message))) throw err;
  }
  await Category.collection.createIndex({ name: 1, type: 1 }, { unique: true });
  console.log('[migrate] Ensured compound unique index Category { name, type }.');

  const [catCount, prodCount] = await Promise.all([Category.countDocuments(), Product.countDocuments()]);
  console.log(`[migrate] Migrated ${updated} product record(s) (${prodCount} total; ${catCount} categories).`);
  if (unmapped.length) {
    console.log(`[migrate] ${unmapped.length} product(s) had no single confident home in the new structure.`);
    console.log('[migrate] They keep a primary category + heading (visible in the main grid) but NO subcategory:');
    for (const line of unmapped) console.log(`[migrate]   - ${line}`);
    console.log('[migrate] Reassign them from the admin dashboard when a suitable subcategory is confirmed.');
  }
  console.log('[migrate] Done — run `npm run seed` to refresh the demo catalogue.');

  await disconnectDB();
  process.exit(0);
}

migrate().catch(async (err) => {
  console.error('[migrate] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
