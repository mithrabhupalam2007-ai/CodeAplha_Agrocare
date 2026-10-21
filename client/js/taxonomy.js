/**
 * Client-side store taxonomy — the frontend mirror of
 * server/utils/taxonomy.js (that file is the source of truth; the parity
 * check in server/scripts/checkTaxonomyParity.js fails the build if the
 * two lists ever drift apart).
 *
 * Naming map: Product.primaryCategory = MAIN category ('Seeds', 'Crop Protection', …)
 *             Product.heading          = heading section ('Horticulture Crops', …)
 *             Product.subcategory      = SUB category ('Vegetable Seeds', …)
 * The seven main categories each own heading sections; Tapas has NO
 * headings (heading: null) and lists its seven subcategories directly.
 * A product may also carry additionalCategories entries so ONE canonical
 * record is discoverable in overlapping sections (Organic/Tapas).
 */
const TAXONOMY = (() => {
  const MAIN = ['Seeds', 'Crop Protection', 'Crop Nutrition', 'Equipments', 'Animal Husbandry', 'Organic', 'Tapas'];

  /** Ordered heading sections per main category (mirror of CATEGORY_STRUCTURE). */
  const STRUCTURE = {
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
  const SUBS = Object.fromEntries(MAIN.map((m) => [m, STRUCTURE[m].flatMap((g) => g.subcategories)]));

  /** Short one-line blurbs for the main-category slider cards. */
  const MAIN_BLURBS = {
    Seeds: 'Vegetable, fruit, flower & field-crop seeds',
    'Crop Protection': 'Chemical & bio pesticides, traps and lures',
    'Crop Nutrition': 'Fertilizers, growth promoters & regulators',
    Equipments: 'Implements, tools, protection & irrigation',
    'Animal Husbandry': 'Cattle & poultry feed, supplements, equipment',
    Organic: 'Bio pesticides, organic fertilizers & stimulants',
    Tapas: 'A curated mix of nutrition, protection & equipment',
  };

  /** Reused category photos where they fit; the rest are generated demo art. */
  const MAIN_IMAGES = {
    Seeds: '/images/categories/field-crop-seeds.jpg',
    'Crop Protection': '/images/categories/insecticides.jpg',
    'Crop Nutrition': '/images/categories/fertilizers.jpg',
    Equipments: '/images/categories/farming-tools.jpg',
    'Animal Husbandry': '/images/categories/animal-husbandry.svg',
    Organic: '/images/categories/organic-bio.jpg',
    Tapas: '/images/categories/tapas.svg',
  };

  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const subcategoriesOf = (type) => SUBS[type] || [];
  const hasSubcategories = (type) => subcategoriesOf(type).length > 0;
  const headingsOf = (type) => (STRUCTURE[type] || []).map((g) => g.heading);
  const subcategoriesUnder = (type, heading) => {
    const group = (STRUCTURE[type] || []).find((g) => g.heading === heading);
    return group ? group.subcategories.slice() : [];
  };
  /** Heading a subcategory sits under in a main category (null/'' for Tapas). */
  const headingOf = (type, sub) => {
    const group = (STRUCTURE[type] || []).find((g) => g.subcategories.includes(sub));
    if (!group) return group === undefined ? undefined : '';
    return group.heading === null ? '' : group.heading;
  };
  const isMain = (x) => MAIN.includes(x);
  /**
   * Label shown on product cards / detail chips: the subcategory when the
   * product has one, otherwise its heading section (legacy heading-only
   * records), otherwise the main category. Never the pre-restructure names.
   */
  const labelFor = (p) => (p && (p.subcategory || p.heading || p.primaryCategory)) || '';
  const subImage = (sub) => `/images/subcategories/${slug(sub)}.svg`;
  const mainImage = (type) => MAIN_IMAGES[type] || '/images/categories/image-fallback.svg';
  const categoryUrl = (type) => `/pages/category.html?type=${encodeURIComponent(type)}`;
  const subcategoryUrl = (type, sub) =>
    `/pages/category.html?type=${encodeURIComponent(type)}&sub=${encodeURIComponent(sub)}`;

  return {
    MAIN,
    STRUCTURE,
    SUBS,
    MAIN_BLURBS,
    MAIN_IMAGES,
    MAIN_CARDS: MAIN.map((type) => ({
      type,
      blurb: MAIN_BLURBS[type],
      image: MAIN_IMAGES[type],
      href: categoryUrl(type),
    })),
    subcategoriesOf,
    hasSubcategories,
    headingsOf,
    subcategoriesUnder,
    headingOf,
    isMain,
    labelFor,
    subImage,
    mainImage,
    categoryUrl,
    subcategoryUrl,
    slug,
  };
})();
