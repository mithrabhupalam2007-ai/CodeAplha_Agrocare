/**
 * Product taxonomy shared by the whole store.
 *
 * Data model mapping (important — the schema uses historic field names):
 *   Product.type     -> MAIN category    ('Seeds' | 'Pesticides' | 'Fertilizers' | 'Farming Essentials')
 *   Product.category -> SUB category     (e.g. 'Vegetable Seeds', 'Herbicides (Weed Killers)')
 *
 * Farming Essentials is intentionally the one type WITHOUT subcategories:
 * its category page goes straight to the product listing.
 *
 * The frontend mirror of this list lives in client/js/taxonomy.js —
 * server/scripts/checkTaxonomyParity.js verifies the two never drift apart.
 */

const MAIN_CATEGORIES = ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'];

const SUBCATEGORIES = {
  Seeds: [
    'Vegetable Seeds',
    'Cereal and Grain Seeds',
    'Pulse and Legume Seeds',
    'Oilseed Seeds',
    'Fruit and Melon Seeds',
    'Fibre and Commercial Crop Seeds',
    'Hybrid Seeds',
    'Organic and Traditional Seeds',
  ],
  Pesticides: [
    'Insecticides',
    'Herbicides (Weed Killers)',
    'Fungicides',
    'Bactericides',
    'Nematicides',
    'Acaricides (Mite Killers)',
    'Rodenticides (Rat Killers)',
    'Molluscicides (Snail and Slug Killers)',
    'Bio-Pesticides',
    'Seed Treatment Pesticides',
  ],
  Fertilizers: [
    'Organic Fertilizers',
    'Chemical Fertilizers',
    'Biofertilizers',
    'Nitrogen Fertilizers',
    'Phosphorus Fertilizers',
    'Potassium Fertilizers',
    'NPK Fertilizers',
    'Micronutrient Fertilizers',
    'Water-Soluble Fertilizers',
    'Slow-Release Fertilizers',
  ],
  'Farming Essentials': [], // no subcategories — direct product listing
};

/** Types that own a subcategory slider on their category page. */
const typesWithSubcategories = () => MAIN_CATEGORIES.filter((t) => SUBCATEGORIES[t].length > 0);

const hasSubcategories = (type) => (SUBCATEGORIES[type] || []).length > 0;

/**
 * Validate + canonicalize a { type, category } pair.
 * Returns { type, category, error } — `category` is normalized to the
 * canonical taxonomy spelling (case-insensitive input is accepted), and for
 * Farming Essentials it defaults to the type name since no subcategory exists.
 *
 * `existing` lets partial updates validate a single changed half against the
 * stored product (e.g. category sent without re-sending type).
 */
function validatePair({ type, category, existing = {} } = {}) {
  const effType = type !== undefined && type !== null && String(type).trim() !== '' ? String(type).trim() : existing.type;

  if (!effType) return { error: 'Product category (type) is required.' };
  if (!MAIN_CATEGORIES.includes(effType)) {
    return { error: `Category must be one of: ${MAIN_CATEGORIES.join(', ')}.` };
  }

  const subs = SUBCATEGORIES[effType];

  // Farming Essentials: no subcategory required; default it to the type name
  // so every product still carries a category value for cards/filters.
  if (!subs.length) {
    const raw = category !== undefined && category !== null ? String(category).trim() : '';
    return {
      type: effType,
      category: raw && raw.toLowerCase() !== effType.toLowerCase() ? raw : effType,
    };
  }

  const rawSub =
    category !== undefined && category !== null && String(category).trim() !== ''
      ? String(category).trim()
      : existing.category;

  if (!rawSub) {
    return { error: `Subcategory is required for ${effType}. Choose one of: ${subs.join(', ')}.` };
  }

  const canonical = subs.find((s) => s.toLowerCase() === String(rawSub).toLowerCase());
  if (!canonical) {
    return {
      error: `"${rawSub}" is not a ${effType} subcategory. Allowed: ${subs.join(', ')}.`,
    };
  }
  return { type: effType, category: canonical };
}

module.exports = {
  MAIN_CATEGORIES,
  SUBCATEGORIES,
  typesWithSubcategories,
  hasSubcategories,
  validatePair,
};
