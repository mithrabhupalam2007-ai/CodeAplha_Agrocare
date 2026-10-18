/**
 * Client-side store taxonomy — the frontend mirror of
 * server/utils/taxonomy.js (that file is the source of truth; the parity
 * check in server/scripts/checkTaxonomyParity.js fails the build if the
 * two lists ever drift apart).
 *
 * Naming map: Product.type     = MAIN category ('Seeds', 'Pesticides', …)
 *             Product.category = SUB category ('Vegetable Seeds', …)
 * Farming Essentials has NO subcategories — its category page goes straight
 * to the product listing.
 */
const TAXONOMY = (() => {
  const MAIN = ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'];

  const SUBS = {
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
    'Farming Essentials': [],
  };

  /** Short one-line blurbs for the main-category slider cards. */
  const MAIN_BLURBS = {
    Seeds: 'Vegetable, cereal, pulse, hybrid & traditional seeds',
    Pesticides: 'Insecticide, herbicide, fungicide & bio-pesticide demos',
    Fertilizers: 'Organic, NPK, micronutrient & water-soluble grades',
    'Farming Essentials': 'Sprayers, gloves, safety gear & field tools',
  };

  /** Photos reused from the existing category art for the four main cards. */
  const MAIN_IMAGES = {
    Seeds: '/images/categories/field-crop-seeds.jpg',
    Pesticides: '/images/categories/insecticides.jpg',
    Fertilizers: '/images/categories/fertilizers.jpg',
    'Farming Essentials': '/images/categories/farming-tools.jpg',
  };

  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const subcategoriesOf = (type) => SUBS[type] || [];
  const hasSubcategories = (type) => subcategoriesOf(type).length > 0;
  const subImage = (sub) => `/images/subcategories/${slug(sub)}.svg`;
  const categoryUrl = (type) => `/pages/category.html?type=${encodeURIComponent(type)}`;
  const subcategoryUrl = (type, sub) =>
    `/pages/category.html?type=${encodeURIComponent(type)}&sub=${encodeURIComponent(sub)}`;

  return {
    MAIN,
    SUBS,
    MAIN_CARDS: MAIN.map((type) => ({
      type,
      blurb: MAIN_BLURBS[type],
      image: MAIN_IMAGES[type],
      href: categoryUrl(type),
    })),
    subcategoriesOf,
    hasSubcategories,
    subImage,
    categoryUrl,
    subcategoryUrl,
  };
})();
