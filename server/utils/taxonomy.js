/**
 * Product taxonomy shared by the whole store — SINGLE SOURCE OF TRUTH.
 *
 * Data model (product classification):
 *   Product.primaryCategory   -> MAIN category  ('Seeds' | 'Crop Protection' | 'Crop Nutrition'
 *                                                | 'Equipments' | 'Animal Husbandry'
 *                                                | 'Organic' | 'Tapas')
 *   Product.heading           -> section heading under that main category
 *                                (e.g. 'Horticulture Crops'); '' for Tapas,
 *                                which lists its subcategories directly.
 *   Product.subcategory       -> subcategory (e.g. 'Vegetable Seeds')
 *   Product.additionalCategories -> extra main categories where the SAME
 *                                canonical product record is discoverable
 *                                (e.g. a bio-fungicide that is primarily
 *                                'Crop Protection' but also sold under
 *                                'Organic'). No duplicate product rows.
 *
 * Every main category owns heading sections, each with its subcategories.
 * Tapas has NO headings — its seven subcategories are shown directly
 * (heading: null).
 *
 * The frontend mirror of this list lives in client/js/taxonomy.js —
 * server/scripts/checkTaxonomyParity.js verifies the two never drift apart.
 */

const MAIN_CATEGORIES = [
  'Seeds',
  'Crop Protection',
  'Crop Nutrition',
  'Equipments',
  'Animal Husbandry',
  'Organic',
  'Tapas',
];

/** Ordered heading sections per main category. `heading: null` = show the
    subcategories directly (Tapas). Display spellings are authoritative:
    'Tarpaulin', 'Growth Promoters', 'Bio Stimulants', 'Yield Boosters'. */
const CATEGORY_STRUCTURE = {
  Seeds: [
    { heading: 'Horticulture Crops', subcategories: ['Vegetable Seeds', 'Fruit Seeds', 'Flower Seeds'] },
    { heading: 'Field Crops', subcategories: ['Forages', 'Maize/Corn', 'Paddy', 'Mustard', 'Jowar', 'Cotton'] },
    { heading: 'Special Category', subcategories: ['Polyhouse', 'Exotics', 'Urban Garden'] },
  ],
  'Crop Protection': [
    { heading: 'Chemical Pesticides', subcategories: ['Insecticides', 'Fungicides', 'Herbicides', 'Bactericides'] },
    { heading: 'Bio/Organic Pesticides', subcategories: ['Bio Insecticides', 'Bio Fungicides', 'Bio Viricides', 'Bio Nematicides'] },
    { heading: 'Traps and Lures', subcategories: ['Sticky Traps', 'Pheromone Lures', 'Pheromone Traps', 'Solar Light Traps'] },
  ],
  'Crop Nutrition': [
    { heading: 'Fertilizers', subcategories: ['Chemical Fertilizers', 'Bio/Organic Fertilizers', 'Micro Nutrients', 'Humic Acids', 'pH Balancers'] },
    { heading: 'Growth Promoters', subcategories: ['Plain Growth Promoters', 'Plant Enhancers', 'Bio Stimulants'] },
    { heading: 'Plant Growth Regulators', subcategories: ['Yield Boosters', 'Fruit Enhancers', 'Flower Boosters'] },
  ],
  Equipments: [
    { heading: 'Implements', subcategories: ['Sprayers', 'Brush Cutter', 'Weeder/Tiller', 'Chaff Cutter and Parts', 'Solar Dryer', 'Rice Mill', 'Earth Augers', 'Power Reaper', 'Chain Saw', 'Sugarcane Machine'] },
    { heading: 'Agriculture Tools', subcategories: ['Nursery Inputs', 'Fruit Harvester/Plucker', 'Garden Tools', 'Seeder/Transplanter'] },
    { heading: 'Farm Protection and Covering', subcategories: ['Tarpaulin', 'Mulch', 'Shade Net', 'Traps and Lure', 'Safety Kit', 'Torch/Lantern', 'Crop Cover'] },
    { heading: 'Irrigation', subcategories: ['Pipe', 'Water Pump', 'Sprinkler', 'Drip Kit'] },
  ],
  'Animal Husbandry': [
    { heading: 'Cattle', subcategories: ['Cattle Feed', 'Cattle Supplements', 'Milking Machine', 'Milking Machine Accessories', 'Calf Feeding Bottle'] },
    { heading: 'Poultry', subcategories: ['Poultry Supplements', 'Poultry Equipment'] },
  ],
  Organic: [
    { heading: 'Bio/Organic Pesticides', subcategories: ['Bio Insecticides', 'Bio Fungicides', 'Bio Viricides', 'Bio Nematicides'] },
    { heading: 'Crop Nutrition', subcategories: ['Bio/Organic Fertilizers', 'Bio Stimulants'] },
  ],
  Tapas: [
    { heading: null, subcategories: ['Crop Nutrition', 'Crop Protection', 'Farm Implements', 'Traps and Lures', 'Mulching Sheet', 'Safety Kit', 'Sprayers'] },
  ],
};

/** Flat subcategory list per main category (union of its headings, in order). */
const SUBCATEGORIES = Object.fromEntries(
  MAIN_CATEGORIES.map((m) => [m, CATEGORY_STRUCTURE[m].flatMap((g) => g.subcategories)])
);

/** The stored-subcategory spellings that satisfy a (mainCategory, sub) browse. */
function subsFor(mainCategory, sub) {
  return [sub];
}

const isMainCategory = (x) => MAIN_CATEGORIES.includes(x);

const headingsOf = (type) => (CATEGORY_STRUCTURE[type] || []).map((g) => g.heading);

const subcategoriesOf = (type) => SUBCATEGORIES[type] || [];

const hasSubcategories = (type) => subcategoriesOf(type).length > 0;

/** The heading a subcategory sits under inside a main category (null for Tapas). */
function headingOf(type, sub) {
  const group = (CATEGORY_STRUCTURE[type] || []).find((g) => g.subcategories.includes(sub));
  return group ? group.heading : undefined;
}

/** Subcategories listed under one heading of a main category. */
function subsUnder(type, heading) {
  const group = (CATEGORY_STRUCTURE[type] || []).find((g) => g.heading === heading);
  return group ? group.subcategories.slice() : [];
}

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Tile artwork path for a subcategory (shared names reuse one tile). */
const tilePath = (sub) => `/images/subcategories/${slug(sub)}.svg`;

/**
 * Validate + canonicalize a product classification payload.
 *
 * Accepts either the new field names ({primaryCategory, subcategory}) or the
 * historic request aliases ({type, category}) so older clients keep working.
 * Returns { primaryCategory, subcategory, heading, additionalCategories, error }.
 *
 * - `heading` is DERIVED from the taxonomy (authoritative); if the caller also
 *   sent a heading it must match the derived one.
 * - `subcategory` must be listed under that main category (case-insensitive
 *   canonicalization) — an invalid combination is rejected.
 * - `additionalCategories` must be main categories; the primary one is dropped
 *   if present.
 * - `existing` lets partial updates validate a single changed half against the
 *   stored product.
 *
 * Exception (legacy/unmapped records only): a partial update that explicitly
 * sends `subcategory: ''` is accepted when the stored product already has no
 * subcategory — such records keep a heading + primary category so they stay
 * visible in the main grid, but belong to no subcategory until an admin picks
 * one.
 */
function validatePair(payload = {}) {
  const {
    type,
    category,
    primaryCategory,
    subcategory,
    heading,
    additionalCategories,
    existing = {},
  } = payload;

  const rawMain =
    primaryCategory !== undefined && primaryCategory !== null && String(primaryCategory).trim() !== ''
      ? String(primaryCategory).trim()
      : type !== undefined && type !== null && String(type).trim() !== ''
        ? String(type).trim()
        : existing.primaryCategory;

  if (!rawMain) return { error: 'Product primary category is required.' };
  // Canonicalize the main category case-insensitively ('seeds' -> 'Seeds').
  const mainCanonical = MAIN_CATEGORIES.find((m) => m.toLowerCase() === String(rawMain).toLowerCase());
  if (!mainCanonical) {
    return { error: `Primary category must be one of: ${MAIN_CATEGORIES.join(', ')}.` };
  }

  // Explicit clearing of an already-unmapped legacy subcategory (partial only).
  const clearingSub =
    subcategory !== undefined && String(subcategory).trim() === '' && String(existing.subcategory || '').trim() === '';

  const rawSub =
    subcategory !== undefined && subcategory !== null && String(subcategory).trim() !== ''
      ? String(subcategory).trim()
      : category !== undefined && category !== null && String(category).trim() !== ''
        ? String(category).trim()
        : existing.subcategory;

  if (clearingSub) {
    const extra = sanitizeAdditional(additionalCategories, existing.additionalCategories, mainCanonical);
    if (extra.error) return { error: extra.error };
    // Keep the stored heading, unless a valid one was explicitly supplied.
    let clearedHeading = existing.heading !== undefined && existing.heading !== null ? existing.heading : '';
    if (heading !== undefined && heading !== null && String(heading).trim() !== '') {
      const given = String(heading).trim();
      const valid = headingsOf(mainCanonical).filter(Boolean);
      if (!valid.includes(given)) {
        return { error: `"${given}" is not a heading of ${mainCanonical}. Allowed: ${valid.join(', ') || '(none — this category lists subcategories directly)'}.` };
      }
      clearedHeading = given;
    }
    return {
      primaryCategory: mainCanonical,
      subcategory: '',
      heading: clearedHeading,
      additionalCategories: extra.list,
    };
  }

  if (!rawSub) {
    return {
      error: `Subcategory is required for ${mainCanonical}. Choose one of: ${subcategoriesOf(mainCanonical).join(', ')}.`,
    };
  }

  const subs = subcategoriesOf(mainCanonical);
  const canonical = subs.find((s) => s.toLowerCase() === rawSub.toLowerCase());
  if (!canonical) {
    return {
      error: `"${rawSub}" is not a ${mainCanonical} subcategory. Allowed: ${subs.join(', ')}.`,
    };
  }

  const derivedHeading = headingOf(mainCanonical, canonical); // null for Tapas
  const normalizedHeading = derivedHeading === null ? '' : derivedHeading;

  if (heading !== undefined && heading !== null && String(heading).trim() !== '') {
    const given = String(heading).trim();
    if (normalizedHeading === '') {
      return { error: `Category "${mainCanonical}" has no headings — its subcategories are listed directly.` };
    }
    if (given !== normalizedHeading) {
      return { error: `"${given}" is not a heading of ${mainCanonical}. The subcategory "${canonical}" belongs to "${normalizedHeading}".` };
    }
  }

  const extra = sanitizeAdditional(additionalCategories, existing.additionalCategories, mainCanonical);
  if (extra.error) return { error: extra.error };
  return {
    primaryCategory: mainCanonical,
    subcategory: canonical,
    heading: normalizedHeading,
    additionalCategories: extra.list,
  };
}

/** Validate/clean the extra browse memberships. -> { list } | { error }. */
function sanitizeAdditional(incoming, existingList, primaryCategory) {
  const source = incoming !== undefined ? incoming : existingList;
  if (source === undefined || source === null) return { list: [] };
  const list = Array.isArray(source) ? source : String(source).split(',');
  const cleaned = [];
  for (const raw of list) {
    const val = String(raw || '').trim();
    if (!val) continue;
    if (!isMainCategory(val)) {
      return { error: `additionalCategories entry "${val}" must be one of: ${MAIN_CATEGORIES.join(', ')}.` };
    }
    if (val === primaryCategory || cleaned.includes(val)) continue;
    cleaned.push(val);
  }
  return { list: cleaned };
}

module.exports = {
  MAIN_CATEGORIES,
  CATEGORY_STRUCTURE,
  SUBCATEGORIES,
  isMainCategory,
  headingsOf,
  subcategoriesOf,
  hasSubcategories,
  headingOf,
  subsUnder,
  subsFor,
  slug,
  tilePath,
  validatePair,
  sanitizeAdditional,
};
