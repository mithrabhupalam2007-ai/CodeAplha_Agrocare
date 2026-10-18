/**
 * Generate the placeholder illustration art used by the demo store:
 *
 *   1. Subcategory slider cards  -> client/images/subcategories/<slug>.svg
 *   2. New demo product pack-shots -> client/images/products/<file>.svg
 *
 * All art is original SVG drawn in the AgroShield palette (forest green /
 * beige) so the store never depends on external image hosts. Re-run with:
 *
 *   node server/scripts/generateDemoArt.js
 *
 * The subcategory list is imported from server/utils/taxonomy.js, and this
 * script throws if any subcategory is missing an abbreviation/hue below —
 * so new taxonomy entries can never ship without art.
 */
const fs = require('fs');
const path = require('path');
const taxonomy = require('../utils/taxonomy');

const IMAGES_DIR = path.join(__dirname, '..', '..', 'client', 'images');
const SUB_DIR = path.join(IMAGES_DIR, 'subcategories');
const PROD_DIR = path.join(IMAGES_DIR, 'products');

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ *
 * 1. Subcategory slider illustrations (320 x 200 rounded tiles)
 * ------------------------------------------------------------------ */

/** Per-subcategory abbreviation badge + accent hue. */
const SUB_BADGES = {
  // Seeds
  'Vegetable Seeds': { abbr: 'VG', hue: 95 },
  'Cereal and Grain Seeds': { abbr: 'CG', hue: 45 },
  'Pulse and Legume Seeds': { abbr: 'PL', hue: 25 },
  'Oilseed Seeds': { abbr: 'OS', hue: 40 },
  'Fruit and Melon Seeds': { abbr: 'FM', hue: 5 },
  'Fibre and Commercial Crop Seeds': { abbr: 'FC', hue: 160 },
  'Hybrid Seeds': { abbr: 'HY', hue: 265 },
  'Organic and Traditional Seeds': { abbr: 'OT', hue: 120 },
  // Pesticides
  Insecticides: { abbr: 'IN', hue: 210 },
  'Herbicides (Weed Killers)': { abbr: 'HE', hue: 145 },
  Fungicides: { abbr: 'FU', hue: 280 },
  Bactericides: { abbr: 'BA', hue: 195 },
  Nematicides: { abbr: 'NE', hue: 15 },
  'Acaricides (Mite Killers)': { abbr: 'AC', hue: 330 },
  'Rodenticides (Rat Killers)': { abbr: 'RO', hue: 240 },
  'Molluscicides (Snail and Slug Killers)': { abbr: 'MO', hue: 80 },
  'Bio-Pesticides': { abbr: 'BP', hue: 110 },
  'Seed Treatment Pesticides': { abbr: 'ST', hue: 175 },
  // Fertilizers
  'Organic Fertilizers': { abbr: 'OF', hue: 90 },
  'Chemical Fertilizers': { abbr: 'CF', hue: 205 },
  Biofertilizers: { abbr: 'BF', hue: 130 },
  'Nitrogen Fertilizers': { abbr: 'N', hue: 220 },
  'Phosphorus Fertilizers': { abbr: 'P', hue: 30 },
  'Potassium Fertilizers': { abbr: 'K', hue: 345 },
  'NPK Fertilizers': { abbr: 'NPK', hue: 255 },
  'Micronutrient Fertilizers': { abbr: 'MN', hue: 50 },
  'Water-Soluble Fertilizers': { abbr: 'WS', hue: 190 },
  'Slow-Release Fertilizers': { abbr: 'SR', hue: 100 },
};

/** Group emblem drawn in forest green inside the badge circle. */
const GROUP_EMBLEM = {
  Seeds: `
  <g stroke="#234832" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M64 118 V88"/>
    <path d="M64 96 C64 84 54 78 44 78 C44 90 52 96 64 96 Z" fill="#234832" stroke="none"/>
    <path d="M64 90 C64 78 72 70 84 70 C84 82 76 90 64 90 Z" fill="#234832" stroke="none" opacity=".65"/>
    <path d="M52 118 h24"/>
  </g>`,
  Pesticides: `
  <g stroke="#234832" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M64 62 L84 70 V96 C84 110 74 120 64 124 C54 120 44 110 44 96 V70 Z"/>
    <path d="M56 92 l6 6 12-12" stroke-width="5"/>
  </g>`,
  Fertilizers: `
  <g stroke="#234832" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 84 h28 l6 40 h-40 Z" fill="#234832" fill-opacity=".14"/>
    <path d="M46 84 h36"/>
    <path d="M64 78 C64 66 72 58 84 58 C84 70 76 78 64 78 Z" fill="#234832" stroke="none" opacity=".8"/>
    <path d="M64 84 V70"/>
  </g>`,
};

function subcategorySvg(name) {
  const { abbr, hue } = SUB_BADGES[name];
  const emblem = GROUP_EMBLEM[taxonomy.MAIN_CATEGORIES.find((t) => taxonomy.SUBCATEGORIES[t].includes(name))];
  const abbrSize = abbr.length > 2 ? 24 : 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${name}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(90,25%,95%)"/><stop offset="1" stop-color="hsl(45,40%,91%)"/></linearGradient>
<linearGradient id="chip" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="hsl(${hue},45%,93%)"/></linearGradient></defs>
<rect width="320" height="200" rx="18" fill="url(#bg)"/>
<path d="M0 168 Q160 138 320 168 V200 H0 Z" fill="hsl(${hue},40%,86%)" opacity=".6"/>
<circle cx="64" cy="96" r="52" fill="url(#chip)" stroke="hsl(${hue},45%,55%)" stroke-width="2"/>
${emblem}
<circle cx="252" cy="52" r="34" fill="#234832"/>
<text x="252" y="${52 + abbrSize / 3}" text-anchor="middle" font-family="Georgia,serif" font-size="${abbrSize}" font-weight="bold" fill="#f3ead6">${abbr}</text>
<circle cx="212" cy="140" r="8" fill="hsl(${hue},55%,52%)" opacity=".85"/>
<circle cx="234" cy="156" r="5" fill="hsl(${hue},45%,45%)" opacity=".7"/>
<circle cx="196" cy="162" r="4" fill="#234832" opacity=".4"/>
</svg>`;
}

/* ------------------------------------------------------------------ *
 * 2. Demo product pack-shots (800 x 520, same style as existing art)
 * ------------------------------------------------------------------ */

const SHAPES = {
  // Stand-up pouch with label window (seed packets, powders)
  pouch: (h) => `
<rect x="300" y="170" width="200" height="270" rx="12" fill="hsl(${h},55%,46%)"/>
<rect x="300" y="170" width="200" height="60" rx="12" fill="hsl(${h},60%,34%)"/>
<rect x="320" y="255" width="160" height="120" rx="8" fill="#fdfbe8"/>
<circle cx="400" cy="315" r="34" fill="hsl(${h},50%,55%)" opacity=".6"/>`,
  // Bottle with cap + label (liquids)
  bottle: (h) => `
<rect x="382" y="120" width="36" height="40" rx="6" fill="hsl(${h},55%,38%)"/>
<rect x="330" y="158" width="140" height="282" rx="16" fill="hsl(${h},55%,46%)"/>
<rect x="348" y="230" width="104" height="120" rx="8" fill="#fdfbe8"/>
<circle cx="400" cy="290" r="28" fill="hsl(${h},50%,55%)" opacity=".6"/>`,
  // Big sack (45/50 kg fertilizer bags)
  sack: (h) => `
<rect x="270" y="150" width="260" height="290" rx="20" fill="hsl(${h},45%,48%)"/>
<rect x="270" y="150" width="260" height="46" rx="20" fill="hsl(${h},50%,36%)"/>
<rect x="300" y="240" width="200" height="120" rx="10" fill="#fdfbe8"/>
<circle cx="400" cy="300" r="36" fill="hsl(${h},50%,58%)" opacity=".55"/>`,
  // Carton box (rodenticide bait, tool kits)
  box: (h) => `
<rect x="290" y="180" width="220" height="240" rx="10" fill="hsl(${h},45%,50%)"/>
<rect x="290" y="180" width="220" height="52" rx="10" fill="hsl(${h},50%,38%)"/>
<line x1="400" y1="180" x2="400" y2="420" stroke="hsl(${h},45%,38%)" stroke-width="3"/>
<rect x="316" y="262" width="168" height="100" rx="8" fill="#fdfbe8"/>
<circle cx="400" cy="312" r="30" fill="hsl(${h},50%,55%)" opacity=".55"/>`,
  // Short jar with lid (pellets, granules)
  jar: (h) => `
<rect x="330" y="150" width="140" height="36" rx="8" fill="hsl(${h},55%,38%)"/>
<rect x="322" y="184" width="156" height="250" rx="18" fill="hsl(${h},55%,47%)"/>
<rect x="344" y="240" width="112" height="110" rx="8" fill="#fdfbe8"/>
<circle cx="400" cy="295" r="27" fill="hsl(${h},50%,55%)" opacity=".6"/>`,
};

/** caption -> file config for every new demo product image. */
const PRODUCT_ART = [
  // Seeds — pulses
  { file: 'pulse-gram-seed.svg', caption: 'Gram Seed', shape: 'pouch', hue: 30 },
  { file: 'pulse-tur-seed.svg', caption: 'Tur Seed', shape: 'pouch', hue: 20 },
  { file: 'pulse-moong-seed.svg', caption: 'Moong Seed', shape: 'pouch', hue: 85 },
  // Seeds — hybrid / organic
  { file: 'hybrid-bittergourd-seed.svg', caption: 'Hybrid Bitter Gourd', shape: 'pouch', hue: 130 },
  { file: 'hybrid-cauliflower-seed.svg', caption: 'Hybrid Cauliflower', shape: 'pouch', hue: 95 },
  { file: 'organic-bottlegourd-seed.svg', caption: 'Bottle Gourd Seed', shape: 'pouch', hue: 110 },
  { file: 'organic-millet-seed.svg', caption: 'Foxtail Millet', shape: 'pouch', hue: 45 },
  // Pesticides (demo listings)
  { file: 'bactericide-copper.svg', caption: 'Copper Bactericide', shape: 'jar', hue: 190 },
  { file: 'nematicide-soil.svg', caption: 'Soil Nematicide', shape: 'bottle', hue: 20 },
  { file: 'acaricide-mite.svg', caption: 'Mite Kill', shape: 'bottle', hue: 330 },
  { file: 'rodenticide-bait.svg', caption: 'Rodenticide Bait', shape: 'box', hue: 240 },
  { file: 'molluscicide-pellets.svg', caption: 'Molluscicide Pellets', shape: 'jar', hue: 80 },
  { file: 'seed-treatment.svg', caption: 'Seed Treatment', shape: 'pouch', hue: 175 },
  // Fertilizers
  { file: 'fertilizer-urea.svg', caption: 'Urea 46% N', shape: 'sack', hue: 220 },
  { file: 'fertilizer-ssp.svg', caption: 'Super Phosphate', shape: 'sack', hue: 35 },
  { file: 'fertilizer-mop.svg', caption: 'Muriate of Potash', shape: 'sack', hue: 345 },
  { file: 'fertilizer-rhizobium.svg', caption: 'Rhizobium', shape: 'jar', hue: 130 },
  { file: 'fertilizer-ammonium.svg', caption: 'Ammonium Sulphate', shape: 'sack', hue: 205 },
  { file: 'fertilizer-slowrelease.svg', caption: 'Slow-Release Urea', shape: 'sack', hue: 100 },
];

function productSvg({ caption, shape, hue }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(90,30%,93%)"/><stop offset="1" stop-color="hsl(90,25%,86%)"/></linearGradient></defs>
<ellipse cx="400" cy="462" rx="180" ry="22" fill="rgba(0,0,0,.12)"/>
<rect width="800" height="520" fill="url(#bg)"/>${SHAPES[shape](hue)}
<text x="400" y="495" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#2f4a26">${caption}</text>
</svg>`;
}

/* ------------------------------------------------------------------ */

function main() {
  fs.mkdirSync(SUB_DIR, { recursive: true });

  let written = 0;
  for (const [type, subs] of Object.entries(taxonomy.SUBCATEGORIES)) {
    for (const sub of subs) {
      if (!SUB_BADGES[sub]) throw new Error(`Missing badge/hue config for subcategory: ${sub} (${type})`);
      fs.writeFileSync(path.join(SUB_DIR, `${slug(sub)}.svg`), subcategorySvg(sub));
      written += 1;
    }
  }

  for (const art of PRODUCT_ART) {
    fs.writeFileSync(path.join(PROD_DIR, art.file), productSvg(art));
    written += 1;
  }

  console.log(`[art] Wrote ${written} SVGs (${Object.values(taxonomy.SUBCATEGORIES).flat().length} subcategory tiles, ${PRODUCT_ART.length} product pack-shots).`);
}

main();
