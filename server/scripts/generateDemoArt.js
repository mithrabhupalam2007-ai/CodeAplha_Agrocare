/**
 * Generate the placeholder illustration art used by the demo store:
 *
 *   1. Subcategory slider cards  -> client/images/subcategories/<slug>.svg
 *   2. Demo product pack-shots   -> client/images/products/<file>.svg
 *   3. Main-category slider art  -> client/images/categories/<...>.svg
 *
 * All art is original SVG drawn in the AgroShield palette (forest green /
 * beige) so the store never depends on external image hosts. Re-run with:
 *
 *   node server/scripts/generateDemoArt.js
 *
 * The subcategory list is imported from server/utils/taxonomy.js, and this
 * script throws if any subcategory of the seven-category taxonomy is
 * missing a scene below — so new taxonomy entries can never ship without
 * art. Stale tile files from older taxonomies are removed automatically.
 *
 * DEMO-ART NOTICE: these illustrations are generic scene art for the demo
 * catalogue. They do NOT depict or verify any real commercial product.
 */
const fs = require('fs');
const path = require('path');
const taxonomy = require('../utils/taxonomy');

const IMAGES_DIR = path.join(__dirname, '..', '..', 'client', 'images');
const SUB_DIR = path.join(IMAGES_DIR, 'subcategories');
const PROD_DIR = path.join(IMAGES_DIR, 'products');
const CAT_DIR = path.join(IMAGES_DIR, 'categories');

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ---------------------------------------------------------------------------
 * Palette + primitive library
 *
 * Every primitive draws an object whose base sits at the origin (0,0) and
 * grows upward (negative y). Scenes compose 2-4 primitives at a ground line
 * of y = 168 inside the 320x200 tile. K = the shared outline ink.
 * ------------------------------------------------------------------------- */
const K = '#234832';

const G = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;

/** Soft ground shadow under any object. */
const shadow = (x, rx, ry = 6) =>
  `<ellipse cx="${x}" cy="170" rx="${rx}" ry="${ry}" fill="${K}" opacity=".12"/>`;

/* --- paper / packaging --------------------------------------------------- */
const seedGlyph = `
<circle cx="-9" cy="-50" r="4" fill="hsl(38,62%,55%)" stroke="${K}" stroke-width="1.8"/>
<circle cx="7" cy="-46" r="4" fill="hsl(28,66%,50%)" stroke="${K}" stroke-width="1.8"/>
<circle cx="-2" cy="-36" r="3.5" fill="hsl(50,60%,52%)" stroke="${K}" stroke-width="1.8"/>`;

const fruitGlyph = `
<circle cx="0" cy="-45" r="11" fill="hsl(5,70%,58%)" stroke="${K}" stroke-width="2"/>
<path d="M0 -56 q6 -6 12 -4" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;

const leafGlyph = `
<path d="M-14 -44 q14 -14 28 0 q-14 12 -28 0 z" fill="hsl(110,45%,55%)" stroke="${K}" stroke-width="2"/>`;

const flowerGlyph = `
<circle cx="0" cy="-46" r="5" fill="hsl(45,75%,55%)" stroke="${K}" stroke-width="2"/>
<circle cx="-9" cy="-51" r="5" fill="hsl(335,65%,66%)" stroke="${K}" stroke-width="2"/>
<circle cx="9" cy="-51" r="5" fill="hsl(335,65%,66%)" stroke="${K}" stroke-width="2"/>
<circle cx="-9" cy="-41" r="5" fill="hsl(335,65%,66%)" stroke="${K}" stroke-width="2"/>
<circle cx="9" cy="-41" r="5" fill="hsl(335,65%,66%)" stroke="${K}" stroke-width="2"/>`;

/** Folded seed packet. */
const packet = (x, y, s, h, glyph = seedGlyph) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="30" ry="6" fill="${K}" opacity=".12"/>
<rect x="-32" y="-86" width="64" height="86" rx="7" fill="hsl(${h},54%,60%)" stroke="${K}" stroke-width="3"/>
<path d="M-32 -86 h64 l-7 -13 h-50 z" fill="hsl(${h},58%,42%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-22" y="-62" width="44" height="36" rx="5" fill="#fffbe9" stroke="${K}" stroke-width="2.5"/>
${glyph}
<circle cx="0" cy="-14" r="8" fill="hsl(${h},64%,44%)" stroke="${K}" stroke-width="2.5"/>`);

/** Fertilizer sack with optional letter badge. */
const sack = (x, y, s, h, letter = '') => G(x, y, s, `
<ellipse cx="0" cy="2" rx="34" ry="6" fill="${K}" opacity=".12"/>
<path d="M-34 -6 q-6 -64 6 -82 h56 q12 18 6 82 z" fill="hsl(${h},46%,64%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-28 -76 q28 -11 56 0" fill="none" stroke="${K}" stroke-width="3"/>
<rect x="-21" y="-55" width="42" height="29" rx="5" fill="#fffbe9" stroke="${K}" stroke-width="2.5"/>
${letter ? `<text x="0" y="-34" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="${K}">${letter}</text>` : ''}
<ellipse cx="0" cy="-5" rx="34" ry="7" fill="hsl(${h},44%,54%)" stroke="${K}" stroke-width="3"/>`);

/** Jug / bottle with a cross label. */
const bottle = (x, y, s, h) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<rect x="-14" y="-96" width="28" height="14" rx="4" fill="hsl(${h},52%,44%)" stroke="${K}" stroke-width="3"/>
<rect x="-9" y="-83" width="18" height="9" fill="hsl(${h},58%,58%)" stroke="${K}" stroke-width="3"/>
<path d="M-9 -74 q-15 11 -15 32 v30 a8 8 0 0 0 8 8 h22 a8 8 0 0 0 8 -8 v-30 q0 -21 -15 -32 z" fill="hsl(${h},58%,62%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-17" y="-56" width="34" height="26" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.5"/>
<path d="M-8 -43 h16 M0 -51 v16" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>`);

/** Aerosol / spray can with puff. */
const sprayCan = (x, y, s, h) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="22" ry="5" fill="${K}" opacity=".12"/>
<rect x="-16" y="-84" width="32" height="84" rx="9" fill="hsl(${h},56%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-7" y="-96" width="14" height="12" rx="3" fill="hsl(${h},60%,46%)" stroke="${K}" stroke-width="3"/>
<rect x="-16" y="-58" width="32" height="24" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.5"/>
<path d="M-7 -46 h14 M0 -53 v14" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="24" cy="-84" r="3.4" fill="hsl(${h},70%,55%)" stroke="${K}" stroke-width="1.6"/>
<circle cx="32" cy="-90" r="2.6" fill="hsl(${h},70%,55%)" stroke="${K}" stroke-width="1.6"/>
<circle cx="30" cy="-76" r="2.2" fill="hsl(${h},70%,55%)" stroke="${K}" stroke-width="1.6"/>`);

/** Knapsack sprayer with tank, strap and lance spray. */
const knapsack = (x, y, s, h) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="30" ry="6" fill="${K}" opacity=".12"/>
<rect x="-30" y="-78" width="52" height="76" rx="12" fill="hsl(${h},54%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-30" y="-52" width="52" height="8" fill="hsl(${h},58%,46%)"/>
<rect x="-24" y="-66" width="40" height="14" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.5"/>
<path d="M-30 -66 q-10 26 -2 52" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<path d="M22 -70 q20 -14 34 -6" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M56 -76 l14 -6" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<path d="M74 -84 l10 -5 M74 -76 l11 0 M74 -68 l10 5" stroke="hsl(${h},72%,48%)" stroke-width="3" stroke-linecap="round"/>`);

/** Lab flask with bubbles. */
const flask = (x, y, s, h) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="5" fill="${K}" opacity=".12"/>
<path d="M-8 -84 h16 v22 l22 44 a10 10 0 0 1 -9 15 h-42 a10 10 0 0 1 -9 -15 l22 -44 z" fill="#ffffff" fill-opacity=".6" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-19 -40 l14 28 h20 l14 -28 z" fill="hsl(${h},60%,62%)"/>
<path d="M-9 -86 h18" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<circle cx="-6" cy="-18" r="4" fill="hsl(${h},70%,52%)" stroke="${K}" stroke-width="1.8"/>
<circle cx="7" cy="-26" r="3" fill="hsl(${h},70%,52%)" stroke="${K}" stroke-width="1.8"/>`);

/* --- living things ------------------------------------------------------- */
/** Young sprout with n leaf pairs. */
const plant = (x, y, s, h, n = 3) => {
  let leaves = '';
  for (let i = 0; i < n; i += 1) {
    const yy = -18 - i * 20;
    const dir = i % 2 ? 1 : -1;
    leaves += `<path d="M0 ${yy} q${dir * 16} -4 ${dir * 24} -14 q-${dir * 16} -6 -${dir * 24} 14 z" fill="hsl(${h},52%,54%)" stroke="${K}" stroke-width="2.4"/>`;
  }
  return G(x, y, s, `
<ellipse cx="0" cy="2" rx="16" ry="4.5" fill="${K}" opacity=".12"/>
<path d="M0 -6 v${-16 - (n - 1) * 20}" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
${leaves}
<path d="M-9 -2 h18" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);
};

/** Round leafy bush / canopy plant. */
const bushPlant = (x, y, s, h) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<path d="M0 -8 v-24" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<circle cx="0" cy="-56" r="30" fill="hsl(${h},50%,56%)" stroke="${K}" stroke-width="3"/>
<path d="M-18 -60 q10 -12 22 -6 M0 -70 q10 -8 18 -2" fill="none" stroke="${K}" stroke-width="2.2" opacity=".55"/>
<path d="M-12 -14 q-12 -6 -16 -16 M12 -14 q12 -6 16 -16" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`);

/** Flower on a stem. */
const flower = (x, y, s, h, petal = 6) => {
  let petals = '';
  for (let i = 0; i < petal; i += 1) {
    const a = (i * 360) / petal;
    petals += `<ellipse cx="0" cy="-16" rx="7" ry="11" fill="hsl(${h},66%,66%)" stroke="${K}" stroke-width="2.2" transform="rotate(${a})"/>`;
  }
  return G(x, y, s, `
<ellipse cx="0" cy="2" rx="14" ry="4" fill="${K}" opacity=".12"/>
<path d="M0 -8 v-52" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M0 -34 q-14 -4 -20 -14 M0 -46 q14 -4 20 -14" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<g transform="translate(0 -64)">${petals}<circle cx="0" cy="0" r="7" fill="hsl(45,78%,56%)" stroke="${K}" stroke-width="2.4"/></g>`);
};

/**
 * Cereal / oilseed / fibre stalk. kind:
 *   wheat  — narrow head with awns        jowar  — compact oval panicle
 *   paddy  — drooping grain panicle        mustard— raceme of small flowers
 *   maize  — tall stalk with two cobs      cotton — bush with white bolls
 */
const ear = (x, y, s, h, kind = 'wheat') => {
  if (kind === 'maize') {
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="22" ry="5" fill="${K}" opacity=".12"/>
<path d="M0 -6 v-96" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -84 q-30 -6 -38 -30 q26 -2 38 16 M0 -64 q30 -6 38 -30 q-26 -2 -38 16" fill="hsl(${h},48%,52%)" stroke="${K}" stroke-width="2.6"/>
<ellipse cx="-16" cy="-58" rx="9" ry="20" fill="hsl(48,72%,60%)" stroke="${K}" stroke-width="2.6" transform="rotate(-18 -16 -58)"/>
<ellipse cx="16" cy="-74" rx="9" ry="20" fill="hsl(44,74%,56%)" stroke="${K}" stroke-width="2.6" transform="rotate(16 16 -74)"/>
<path d="M-16 -76 v10 M16 -92 v10" stroke="hsl(30,50%,45%)" stroke-width="2.4"/>`);
  }
  if (kind === 'paddy') {
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="16" ry="4.5" fill="${K}" opacity=".12"/>
<path d="M0 -6 q-6 -46 8 -70" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M0 -30 q-18 -8 -26 -22 M0 -52 q16 -8 24 -24" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M8 -76 q22 4 26 26 q-14 8 -24 -4 q-8 -12 -2 -22" fill="hsl(${h},66%,64%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="16" cy="-64" r="3.4" fill="hsl(${h},70%,52%)" stroke="${K}" stroke-width="1.6"/>
<circle cx="26" cy="-56" r="3.4" fill="hsl(${h},70%,52%)" stroke="${K}" stroke-width="1.6"/>
<circle cx="22" cy="-44" r="3.4" fill="hsl(${h},70%,52%" stroke="${K}" stroke-width="1.6"/>`);
  }
  if (kind === 'mustard') {
    let blooms = '';
    for (let i = 0; i < 5; i += 1) {
      const yy = -44 - i * 13;
      const xx = i % 2 ? 7 : -7;
      blooms += `<circle cx="${xx}" cy="${yy}" r="5" fill="hsl(48,80%,56%)" stroke="${K}" stroke-width="2"/>`;
    }
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="14" ry="4" fill="${K}" opacity=".12"/>
<path d="M0 -6 v-84" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M0 -34 q-14 -4 -20 -16 M0 -50 q14 -4 20 -16" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
${blooms}
<path d="M-4 -104 l6 -12 M4 -104 l6 -12" stroke="hsl(${h},55%,48%)" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  if (kind === 'jowar') {
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="16" ry="4.5" fill="${K}" opacity=".12"/>
<path d="M0 -6 v-72" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M0 -40 q-16 -6 -24 -20 M0 -58 q16 -6 24 -20" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="0" cy="-96" rx="14" ry="24" fill="hsl(${h},62%,60%)" stroke="${K}" stroke-width="3"/>
<path d="M-7 -112 v14 M0 -118 v20 M7 -112 v14" stroke="${K}" stroke-width="2.2" opacity=".6"/>`);
  }
  // wheat (default): narrow head + awns
  return G(x, y, s, `
<ellipse cx="0" cy="2" rx="14" ry="4" fill="${K}" opacity=".12"/>
<path d="M0 -6 v-70" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M0 -38 q-14 -4 -20 -16 M0 -54 q14 -4 20 -16" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="0" cy="-94" rx="9" ry="22" fill="hsl(${h},62%,58%)" stroke="${K}" stroke-width="2.6"/>
<path d="M0 -116 l-8 -14 M0 -116 l0 -16 M0 -116 l8 -14 M-6 -104 l-10 -10 M6 -104 l10 -10" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`);
};

/** Striped melon with a cut slice. */
const melon = (x, y, s, h = 95) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="30" ry="6" fill="${K}" opacity=".12"/>
<circle cx="-6" cy="-34" r="32" fill="hsl(${h},55%,58%)" stroke="${K}" stroke-width="3"/>
<path d="M-24 -54 q6 20 0 40 M-6 -66 q8 32 0 64 M12 -54 q-6 20 0 40" fill="none" stroke="${K}" stroke-width="2.4" opacity=".6"/>
<path d="M-6 -66 q4 -8 12 -8" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<circle cx="36" cy="-22" r="20" fill="#fffbe9" stroke="${K}" stroke-width="3"/>
<circle cx="36" cy="-22" r="11" fill="hsl(${h},68%,64%)" stroke="${K}" stroke-width="2"/>
<circle cx="33" cy="-25" r="1.8" fill="${K}"/><circle cx="39" cy="-21" r="1.8" fill="${K}"/><circle cx="35" cy="-17" r="1.8" fill="${K}"/>`);

/** Round/oval fruit or vegetable head. kind: papaya | mango | capsicum | broccoli | apple */
const fruit = (x, y, s, h, kind = 'apple') => {
  if (kind === 'broccoli') {
    let florets = '';
    [[-18, -46], [0, -58], [18, -46], [-8, -36], [10, -36]].forEach(([cx, cy]) => {
      florets += `<circle cx="${cx}" cy="${cy}" r="13" fill="hsl(${h},48%,52%)" stroke="${K}" stroke-width="2.4"/>`;
    });
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<path d="M-16 -12 q16 -12 32 0" fill="hsl(110,42%,55%)" stroke="${K}" stroke-width="2.6"/>
<path d="M0 -14 v-16" stroke="${K}" stroke-width="3.4"/>
${florets}`);
  }
  if (kind === 'capsicum') {
    return G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="6" fill="${K}" opacity=".12"/>
<path d="M-24 -34 q0 -34 24 -34 q24 0 24 34 q0 30 -24 30 q-24 0 -24 -30 z" fill="hsl(${h},62%,54%)" stroke="${K}" stroke-width="3"/>
<path d="M-10 -62 q4 26 -2 50 M10 -62 q-4 26 2 50" fill="none" stroke="${K}" stroke-width="2.4" opacity=".55"/>
<path d="M0 -68 v-10 M0 -78 q-12 -2 -16 -10 q12 -2 16 6" fill="hsl(110,45%,50%)" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>`);
  }
  // apple / papaya / mango style body + leaf
  return G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="6" fill="${K}" opacity=".12"/>
<ellipse cx="0" cy="-32" rx="${kind === 'papaya' ? 24 : 28}" ry="${kind === 'papaya' ? 36 : 30}" fill="hsl(${h},64%,58%)" stroke="${K}" stroke-width="3"/>
<path d="M0 -62 v-10" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M0 -70 q14 -8 24 -2 q-10 12 -24 6 z" fill="hsl(110,48%,52%)" stroke="${K}" stroke-width="2.4"/>
${kind === 'papaya' ? `<circle cx="0" cy="-30" r="4" fill="${K}"/><circle cx="8" cy="-40" r="3.4" fill="${K}"/><circle cx="-7" cy="-42" r="3.4" fill="${K}"/>` : `<path d="M-14 -36 q6 -8 14 -6" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7"/>`}`);
};

/** Berseem / legume clover clump. */
const clover = (x, y, s, h = 110) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="5.5" fill="${K}" opacity=".12"/>
<path d="M0 -6 q-4 -30 -18 -44 M0 -6 q0 -34 0 -50 M0 -6 q4 -30 18 -44" fill="none" stroke="${K}" stroke-width="2.8" stroke-linecap="round"/>
<g fill="hsl(${h},48%,54%)" stroke="${K}" stroke-width="2.2">
<path d="M-24 -52 q-10 -4 -12 -14 q12 -2 16 8 z"/><path d="M-30 -50 q2 -12 12 -14 q6 10 -2 16 z"/>
<path d="M-18 -66 q-10 -4 -12 -14 q12 -2 16 8 z"/><path d="M-24 -64 q2 -12 12 -14 q6 10 -2 16 z"/>
<path d="M24 -52 q10 -4 12 -14 q-12 -2 -16 8 z"/><path d="M30 -50 q-2 -12 -12 -14 q-6 10 2 16 z"/>
<path d="M18 -66 q10 -4 12 -14 q-12 -2 -16 8 z"/><path d="M24 -64 q-2 -12 -12 -14 q-6 10 2 16 z"/>
<path d="M-7 -76 q-10 -4 -12 -14 q12 -2 16 8 z"/><path d="M-1 -78 q2 -12 12 -14 q6 10 -2 16 z"/>
</g>
<circle cx="-26" cy="-40" r="7" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<circle cx="26" cy="-40" r="7" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<circle cx="4" cy="-62" r="7" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>`);

/** Forestry tree. */
const tree = (x, y, s, h = 115) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="22" ry="5.5" fill="${K}" opacity=".12"/>
<path d="M-6 -8 v-46 h12 v46 z" fill="hsl(24,42%,44%)" stroke="${K}" stroke-width="2.6"/>
<path d="M0 -30 l-16 -14 M0 -48 l16 -14" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<circle cx="0" cy="-84" r="34" fill="hsl(${h},46%,54%)" stroke="${K}" stroke-width="3"/>
<circle cx="-26" cy="-64" r="20" fill="hsl(${h},46%,50%)" stroke="${K}" stroke-width="3"/>
<circle cx="26" cy="-64" r="20" fill="hsl(${h},46%,52%)" stroke="${K}" stroke-width="3"/>
<path d="M-14 -92 q14 -10 28 -2" fill="none" stroke="#fff" stroke-width="2.4" opacity=".5"/>`);

/** Nursery poly-bag with a small plant. */
const polybag = (x, y, s, h = 105) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="20" ry="5" fill="${K}" opacity=".12"/>
<path d="M-18 -34 l4 32 h28 l4 -32 z" fill="#6b4a33" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<path d="M-18 -34 h36" stroke="${K}" stroke-width="3"/>
<path d="M0 -36 v-30" stroke="${K}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M0 -50 q-14 -4 -20 -14 q14 -4 20 8 z" fill="hsl(${h},50%,54%)" stroke="${K}" stroke-width="2.4"/>
<path d="M0 -62 q14 -4 20 -14 q-14 -4 -20 8 z" fill="hsl(${h},50%,58%)" stroke="${K}" stroke-width="2.4"/>`);

/** Polyhouse / greenhouse arch tunnel. */
const tunnel = (x, y, s, h = 150) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="52" ry="7" fill="${K}" opacity=".12"/>
<path d="M-56 0 q0 -66 56 -66 q56 0 56 66 z" fill="#ffffff" fill-opacity=".62" stroke="${K}" stroke-width="3.4"/>
<path d="M-30 0 q0 -58 30 -58 M0 0 v-66 M30 0 q0 -58 30 -58" fill="none" stroke="${K}" stroke-width="2.4" opacity=".65"/>
<path d="M-56 0 h112" stroke="${K}" stroke-width="3.4"/>
<rect x="-20" y="-30" width="40" height="30" rx="4" fill="hsl(${h},52%,62%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="-8" cy="-16" r="5" fill="hsl(110,50%,52%)" stroke="${K}" stroke-width="2"/>
<circle cx="8" cy="-16" r="5" fill="hsl(110,50%,52%)" stroke="${K}" stroke-width="2"/>`);

/* --- animal husbandry ---------------------------------------------------- */
const cow = (x, y, s, h = 30) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<path d="M-24 -56 q-10 -6 -14 -18 q12 -2 16 6 M24 -56 q10 -6 14 -18 q-12 -2 -16 6" fill="hsl(35,45%,72%)" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<ellipse cx="0" cy="-44" rx="30" ry="34" fill="hsl(${h},40%,80%)" stroke="${K}" stroke-width="3"/>
<ellipse cx="0" cy="-30" rx="17" ry="13" fill="hsl(18,45%,78%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="-6" cy="-28" r="2.8" fill="${K}"/><circle cx="6" cy="-28" r="2.8" fill="${K}"/>
<circle cx="-11" cy="-52" r="4.4" fill="${K}"/><circle cx="11" cy="-52" r="4.4" fill="${K}"/>
<path d="M-20 -66 q6 -8 12 -6 M8 -72 q6 -6 12 -2" fill="none" stroke="${K}" stroke-width="2.4" opacity=".5"/>`);

const chicken = (x, y, s, h = 35) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="5.5" fill="${K}" opacity=".12"/>
<path d="M26 -40 q14 -6 18 -20 q-10 -6 -18 2" fill="hsl(${h},58%,60%)" stroke="${K}" stroke-width="2.6"/>
<path d="M44 -58 q4 -10 -4 -12 q-2 8 -6 10" fill="hsl(4,72%,54%)" stroke="${K}" stroke-width="2.4"/>
<ellipse cx="0" cy="-30" rx="30" ry="26" fill="hsl(${h},54%,62%)" stroke="${K}" stroke-width="3"/>
<path d="M-26 -44 q-14 -6 -20 -18 q16 -4 24 6" fill="hsl(${h},50%,54%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="34" cy="-56" r="3" fill="${K}"/>
<path d="M-6 -6 v10 M8 -6 v10" stroke="${K}" stroke-width="2.8" stroke-linecap="round"/>
<path d="M-14 -28 q10 -8 20 0 q-10 8 -20 0 z" fill="#fffbe9" opacity=".7"/>`);

const feedBowl = (x, y, s, h = 34) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="5.5" fill="${K}" opacity=".12"/>
<path d="M-26 -26 h52 l-8 24 a6 6 0 0 1 -6 4 h-24 a6 6 0 0 1 -6 -4 z" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="0" cy="-26" rx="26" ry="7" fill="hsl(40,50%,64%)" stroke="${K}" stroke-width="3"/>
<circle cx="-10" cy="-30" r="4" fill="hsl(30,55%,52%)" stroke="${K}" stroke-width="1.8"/>
<circle cx="4" cy="-33" r="4" fill="hsl(34,58%,50%)" stroke="${K}" stroke-width="1.8"/>
<circle cx="14" cy="-28" r="4" fill="hsl(28,55%,54%)" stroke="${K}" stroke-width="1.8"/>`);

/** Milking bucket / machine pail with hose. */
const bucket = (x, y, s, h = 195) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<path d="M-24 -60 h48 l-6 56 a6 6 0 0 1 -6 5 h-24 a6 6 0 0 1 -6 -5 z" fill="hsl(${h},46%,64%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="0" cy="-60" rx="24" ry="7" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<path d="M-24 -60 q6 -34 24 -34 q18 0 24 34" fill="none" stroke="${K}" stroke-width="3"/>
<rect x="-16" y="-40" width="32" height="16" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M24 -52 q22 -8 26 10 q4 16 -10 22" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`);

const calfBottle = (x, y, s, h = 25) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="20" ry="5" fill="${K}" opacity=".12"/>
<rect x="-18" y="-76" width="36" height="70" rx="12" fill="#ffffff" fill-opacity=".75" stroke="${K}" stroke-width="3"/>
<rect x="-18" y="-40" width="36" height="26" rx="6" fill="hsl(${h},70%,72%)"/>
<path d="M-8 -76 q8 -16 16 0" fill="hsl(35,55%,60%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-12" y="-62" width="24" height="10" rx="4" fill="hsl(${h},60%,66%)" stroke="${K}" stroke-width="2.4"/>
<path d="M-12 -22 h24 M-12 -14 h24" stroke="${K}" stroke-width="2" opacity=".5"/>`);

const tubeFeeder = (x, y, s, h = 30) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="5.5" fill="${K}" opacity=".12"/>
<rect x="-14" y="-86" width="28" height="76" rx="14" fill="hsl(${h},52%,62%)" stroke="${K}" stroke-width="3"/>
<path d="M-14 -74 h28" stroke="${K}" stroke-width="2.4"/>
<circle cx="-7" cy="-54" r="4.5" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<circle cx="7" cy="-44" r="4.5" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<circle cx="-7" cy="-34" r="4.5" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<path d="M-20 -10 l6 -10 h28 l6 10" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="0" cy="-96" rx="14" ry="5" fill="hsl(44,60%,62%)" stroke="${K}" stroke-width="2.6"/>`);

/* --- traps and lures ----------------------------------------------------- */
/** Yellow sticky trap card on a stake. */
const trapCard = (x, y, s, h = 55) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="18" ry="5" fill="${K}" opacity=".12"/>
<path d="M0 -6 v-58" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<rect x="-34" y="-116" width="68" height="58" rx="6" fill="hsl(${h},84%,62%)" stroke="${K}" stroke-width="3"/>
<rect x="-34" y="-116" width="68" height="12" rx="6" fill="hsl(${h},80%,52%)"/>
<circle cx="-16" cy="-88" r="4" fill="${K}" opacity=".8"/><circle cx="-2" cy="-96" r="3.4" fill="${K}" opacity=".8"/>
<circle cx="12" cy="-84" r="4" fill="${K}" opacity=".8"/><circle cx="4" cy="-72" r="3.4" fill="${K}" opacity=".8"/>
<circle cx="-14" cy="-68" r="3" fill="${K}" opacity=".8"/><circle cx="20" cy="-98" r="3" fill="${K}" opacity=".8"/>`);

/** Pheromone lure vial + capsule. */
const lureVial = (x, y, s, h = 20) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="20" ry="5" fill="${K}" opacity=".12"/>
<rect x="-13" y="-64" width="26" height="60" rx="9" fill="hsl(${h},58%,64%)" stroke="${K}" stroke-width="3"/>
<rect x="-8" y="-74" width="16" height="10" rx="3" fill="hsl(${h},62%,48%)" stroke="${K}" stroke-width="2.6"/>
<rect x="-13" y="-46" width="26" height="14" rx="3" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<rect x="-8" y="-42" width="16" height="6" rx="3" fill="hsl(${h},70%,52%)"/>
<ellipse cx="26" cy="-16" rx="14" ry="10" fill="hsl(${h},66%,58%)" stroke="${K}" stroke-width="2.8"/>
<path d="M18 -18 h16" stroke="${K}" stroke-width="2" opacity=".6"/>`);

/** Funnel / bucket pheromone trap. */
const funnelTrap = (x, y, s, h = 160) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="26" ry="6" fill="${K}" opacity=".12"/>
<path d="M0 -74 v-24" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<circle cx="0" cy="-104" r="7" fill="none" stroke="${K}" stroke-width="3"/>
<path d="M-30 -74 h60 l-8 -18 h-44 z" fill="hsl(${h},50%,54%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-22 -56 h44 l-6 38 a6 6 0 0 1 -6 5 h-20 a6 6 0 0 1 -6 -5 z" fill="#ffffff" fill-opacity=".7" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-22 -44 h44" stroke="${K}" stroke-width="2.2" opacity=".6"/>
<circle cx="-8" cy="-34" r="3" fill="${K}" opacity=".7"/><circle cx="6" cy="-26" r="3" fill="${K}" opacity=".7"/>`);

/** Solar light trap: panel + lamp + rays. */
const solarTrap = (x, y, s, h = 215) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="24" ry="6" fill="${K}" opacity=".12"/>
<path d="M0 -8 v-72" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<rect x="-36" y="-118" width="72" height="26" rx="5" fill="hsl(${h},58%,58%)" stroke="${K}" stroke-width="3" transform="rotate(-14 0 -105)"/>
<path d="M-24 -108 l6 -14 M-6 -114 l6 -14 M12 -118 l6 -14" stroke="${K}" stroke-width="2" opacity=".6" transform="rotate(-14 0 -105)"/>
<rect x="-16" y="-72" width="32" height="26" rx="6" fill="hsl(48,90%,70%)" stroke="${K}" stroke-width="3"/>
<path d="M-10 -46 q10 10 20 0" fill="none" stroke="${K}" stroke-width="2.6"/>
<path d="M28 -84 l14 -8 M30 -66 h16 M28 -50 l14 6" stroke="hsl(${h},80%,55%)" stroke-width="3" stroke-linecap="round"/>`);

/* --- coverings, rolls, pipes --------------------------------------------- */
/** Grid net / mesh panel in a frame. cols x rows. */
const netPanel = (x, y, s, h = 145, cols = 6, rows = 4, w = 84, hh = 62) => {
  let grid = '';
  for (let i = 1; i < cols; i += 1) grid += `<path d="M${-w / 2 + (i * w) / cols} ${-hh} v${hh}" stroke="${K}" stroke-width="2" opacity=".55"/>`;
  for (let i = 1; i < rows; i += 1) grid += `<path d="M${-w / 2} ${-hh + (i * hh) / rows} h${w}" stroke="${K}" stroke-width="2" opacity=".55"/>`;
  return G(x, y, s, `
<ellipse cx="0" cy="2" rx="${w / 2 + 6}" ry="6" fill="${K}" opacity=".12"/>
<rect x="${-w / 2}" y="${-hh}" width="${w}" height="${hh}" rx="6" fill="hsl(${h},44%,70%)" fill-opacity=".55" stroke="${K}" stroke-width="3"/>
${grid}
<path d="M${-w / 2 - 6} 0 v-8 M${w / 2 + 6} 0 v-8" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`);
};

/** Stack of folded tarpaulin sheets. */
const tarpStack = (x, y, s, h = 215) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="40" ry="6" fill="${K}" opacity=".12"/>
<rect x="-42" y="-34" width="84" height="30" rx="7" fill="hsl(${h},54%,58%)" stroke="${K}" stroke-width="3"/>
<rect x="-38" y="-56" width="76" height="24" rx="7" fill="hsl(${h},58%,66%)" stroke="${K}" stroke-width="3"/>
<rect x="-34" y="-76" width="68" height="22" rx="7" fill="hsl(${h},62%,74%)" stroke="${K}" stroke-width="3"/>
<path d="M-42 -34 h84 M-38 -56 h76" stroke="#fff" stroke-width="2" opacity=".55"/>
<circle cx="-24" cy="-24" r="3.4" fill="none" stroke="${K}" stroke-width="2"/>
<circle cx="24" cy="-46" r="3.4" fill="none" stroke="${K}" stroke-width="2"/>`);

/** Horizontal roll of film / net / mulch. */
const rollCyl = (x, y, s, h = 260) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="42" ry="6" fill="${K}" opacity=".12"/>
<rect x="-44" y="-44" width="76" height="40" rx="4" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="3"/>
<ellipse cx="32" cy="-24" rx="12" ry="20" fill="hsl(${h},56%,48%)" stroke="${K}" stroke-width="3"/>
<ellipse cx="32" cy="-24" rx="5" ry="9" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<ellipse cx="-44" cy="-24" rx="8" ry="20" fill="hsl(${h},56%,64%)" stroke="${K}" stroke-width="3"/>
<path d="M-44 -36 h76 M-44 -16 h76" stroke="#fff" stroke-width="2" opacity=".45"/>`);

/** Pipe segment with elbow and water drops. */
const pipeSeg = (x, y, s, h = 140) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="36" ry="6" fill="${K}" opacity=".12"/>
<path d="M-46 -14 h70 a14 14 0 0 1 14 14 v-46" fill="none" stroke="hsl(${h},50%,52%)" stroke-width="16" stroke-linecap="round"/>
<path d="M-46 -14 h70 a14 14 0 0 1 14 14 v-46" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round" opacity=".85"/>
<rect x="-56" y="-24" width="12" height="20" rx="3" fill="hsl(${h},54%,44%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="38" cy="-70" r="5" fill="hsl(200,70%,62%)" stroke="${K}" stroke-width="2.2"/>
<circle cx="38" cy="-52" r="4" fill="hsl(200,70%,62%)" stroke="${K}" stroke-width="2.2"/>`);

/** Water pump unit with outlet arc. */
const pumpUnit = (x, y, s, h = 200) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="34" ry="6" fill="${K}" opacity=".12"/>
<rect x="-34" y="-30" width="52" height="28" rx="6" fill="hsl(${h},46%,58%)" stroke="${K}" stroke-width="3"/>
<rect x="-28" y="-52" width="34" height="24" rx="7" fill="hsl(${h},52%,64%)" stroke="${K}" stroke-width="3"/>
<circle cx="-11" cy="-40" r="7" fill="#fffbe9" stroke="${K}" stroke-width="2.6"/>
<path d="M18 -44 h16 a8 8 0 0 1 8 8 v6" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>
<path d="M42 -62 q14 -18 30 -8" fill="none" stroke="hsl(200,72%,55%)" stroke-width="5" stroke-linecap="round"/>
<circle cx="74" cy="-66" r="4" fill="hsl(200,72%,58%)" stroke="${K}" stroke-width="2"/>`);

/** Sprinkler head with spray arcs. */
const sprinklerHead = (x, y, s, h = 95) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="16" ry="4.5" fill="${K}" opacity=".12"/>
<path d="M0 -8 v-34" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<path d="M-8 -42 h16 l-3 -12 h-10 z" fill="hsl(${h},52%,54%)" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<path d="M-6 -56 q-18 -26 -34 -30 M0 -58 v-34 M6 -56 q18 -26 34 -30" fill="none" stroke="hsl(200,70%,55%)" stroke-width="3.4" stroke-linecap="round"/>
<circle cx="-40" cy="-86" r="3.4" fill="hsl(200,70%,60%)"/><circle cx="0" cy="-96" r="3.4" fill="hsl(200,70%,60%)"/><circle cx="40" cy="-86" r="3.4" fill="hsl(200,70%,60%)"/>`);

/** Drip irrigation lateral with emitters and drops. */
const dripLine = (x, y, s, h = 25) => G(x, y, s, `
<path d="M-56 -10 h112" fill="none" stroke="hsl(${h},50%,48%)" stroke-width="7" stroke-linecap="round"/>
<path d="M-56 -10 h112" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
<rect x="-40" y="-18" width="12" height="9" rx="3" fill="hsl(${h},56%,56%)" stroke="${K}" stroke-width="2.2"/>
<rect x="-4" y="-18" width="12" height="9" rx="3" fill="hsl(${h},56%,56%)" stroke="${K}" stroke-width="2.2"/>
<rect x="32" y="-18" width="12" height="9" rx="3" fill="hsl(${h},56%,56%)" stroke="${K}" stroke-width="2.2"/>
<circle cx="-34" cy="6" r="4.5" fill="hsl(200,70%,62%)" stroke="${K}" stroke-width="2"/>
<circle cx="2" cy="8" r="4.5" fill="hsl(200,70%,62%)" stroke="${K}" stroke-width="2"/>
<circle cx="38" cy="5" r="4.5" fill="hsl(200,70%,62%)" stroke="${K}" stroke-width="2"/>
<path d="M-56 -10 q-14 -10 -22 -34 M56 -10 q14 -10 22 -34" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);

/* --- tools, safety, machines --------------------------------------------- */
/** Hand-tool set: hoe + sickle + shears arranged as a trio. */
const toolSet = (x, y, s, h = 95) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="34" ry="6" fill="${K}" opacity=".12"/>
<path d="M-34 -6 l40 -70" stroke="#a9744f" stroke-width="7" stroke-linecap="round"/>
<path d="M-34 -6 l40 -70" stroke="${K}" stroke-width="2" stroke-linecap="round" opacity=".6"/>
<path d="M6 -76 q16 -12 30 -4 q-8 16 -24 16 z" fill="hsl(${h},46%,58%)" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<path d="M34 -6 l-38 -58" stroke="#a9744f" stroke-width="6" stroke-linecap="round"/>
<path d="M-4 -64 q22 -20 34 -6 q-16 14 -34 6 z" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M16 -4 l14 -30 M26 -2 l12 -32" stroke="#7f8c9b" stroke-width="5" stroke-linecap="round"/>
<circle cx="14" cy="-6" r="6" fill="hsl(45,60%,55%)" stroke="${K}" stroke-width="2.6"/>`);

/** Safety trio: glove + goggles + mask. */
const safetyTrio = (x, y, s, h = 205) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="44" ry="6" fill="${K}" opacity=".12"/>
<path d="M-46 -8 q-8 -34 2 -44 q6 -4 8 8 v-22 q0 -8 8 -8 q8 0 8 10 v-14 q0 -8 8 -8 q8 0 8 12 v16 q0 -10 8 -8 q8 2 6 14 l-4 26 q-2 14 -18 14 q-18 0 -24 -10 z" fill="hsl(${h},58%,64%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-6" y="-64" width="56" height="26" rx="13" fill="#fffbe9" stroke="${K}" stroke-width="3"/>
<circle cx="8" cy="-51" r="9" fill="hsl(195,70%,72%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="36" cy="-51" r="9" fill="hsl(195,70%,72%)" stroke="${K}" stroke-width="2.6"/>
<path d="M17 -51 h10" stroke="${K}" stroke-width="2.6"/>
<path d="M46 -66 l14 -8 M46 -38 l14 6" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<path d="M-4 -22 h48 q4 22 -20 24 h-8 q-24 -2 -20 -24 z" fill="hsl(200,30%,88%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M4 -16 h32 M2 -8 h36" stroke="${K}" stroke-width="2.2" opacity=".6"/>
<path d="M-4 -22 l-12 -6 M44 -22 l12 -6" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);

/** Field torch / lantern. */
const torchHead = (x, y, s, h = 45) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="22" ry="5" fill="${K}" opacity=".12"/>
<rect x="-14" y="-56" width="28" height="54" rx="9" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="3"/>
<rect x="-14" y="-38" width="28" height="8" fill="hsl(${h},56%,46%)"/>
<path d="M-16 -56 l6 -20 h20 l6 20 z" fill="hsl(${h},58%,44%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M-10 -84 h20" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<path d="M-6 -88 l-4 -14 M6 -88 l4 -14 M0 -90 v-16" stroke="hsl(48,92%,60%)" stroke-width="3.4" stroke-linecap="round"/>
<rect x="-6" y="-26" width="12" height="14" rx="3" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>`);

/**
 * Generic implement silhouettes. kind:
 *   tiller | chaff | dryer | mill | auger | reaper | saw | cane | drill |
 *   brush | milkmachine | harvester
 */
const machine = (x, y, s, h = 100, kind = 'tiller') => {
  const body = (inner) => `
<ellipse cx="0" cy="2" rx="44" ry="7" fill="${K}" opacity=".12"/>
<rect x="-40" y="-64" width="64" height="54" rx="9" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-32" y="-54" width="30" height="20" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
${inner}`;
  switch (kind) {
    case 'auger':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="30" ry="6" fill="${K}" opacity=".12"/>
<rect x="-26" y="-84" width="52" height="40" rx="9" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-18" y="-74" width="22" height="14" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M-10 -44 l-14 44 M10 -44 l14 44" stroke="${K}" stroke-width="5" stroke-linecap="round"/>
<path d="M-20 -32 l16 8 M-22 -18 l20 8 M-24 -4 l22 8 M20 -32 l-16 8 M22 -18 l-20 8 M24 -4 l-22 8" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);
    case 'saw':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="44" ry="6" fill="${K}" opacity=".12"/>
<rect x="-46" y="-58" width="44" height="34" rx="9" fill="hsl(${h},54%,58%)" stroke="${K}" stroke-width="3"/>
<rect x="-38" y="-50" width="18" height="12" rx="3" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<path d="M-4 -46 h74" stroke="hsl(210,20%,72%)" stroke-width="14" stroke-linecap="round"/>
<path d="M-4 -46 h74" stroke="${K}" stroke-width="2.6"/>
<path d="M6 -38 l6 6 M20 -38 l6 6 M34 -38 l6 6 M48 -38 l6 6 M62 -38 l6 6" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M-40 -58 q14 -14 32 -8" fill="none" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`);
    case 'reaper':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="46" ry="6" fill="${K}" opacity=".12"/>
<rect x="-36" y="-70" width="54" height="46" rx="8" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-28" y="-62" width="24" height="16" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M18 -44 h34 v18 h-34 z" fill="hsl(${h},56%,52%)" stroke="${K}" stroke-width="3"/>
<circle cx="-24" cy="-16" r="12" fill="#6b4a33" stroke="${K}" stroke-width="3"/>
<circle cx="6" cy="-16" r="12" fill="#6b4a33" stroke="${K}" stroke-width="3"/>
<path d="M52 -26 h26 M52 -34 h26 M52 -42 h26" stroke="${K}" stroke-width="3.4" stroke-linecap="round"/>`);
    case 'cane':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="44" ry="6" fill="${K}" opacity=".12"/>
<rect x="-42" y="-56" width="66" height="46" rx="9" fill="hsl(${h},50%,58%)" stroke="${K}" stroke-width="3"/>
<circle cx="-22" cy="-34" r="11" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<circle cx="2" cy="-34" r="11" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<path d="M-40 -70 h30 l4 14 h-38 z" fill="hsl(${h},54%,48%)" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<path d="M30 -64 v-40 M40 -64 v-46 M50 -64 v-36" stroke="hsl(95,45%,48%)" stroke-width="6" stroke-linecap="round"/>
<path d="M30 -76 h22 M32 -60 h20" stroke="hsl(45,55%,55%)" stroke-width="3" stroke-linecap="round"/>`);
    case 'drill':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="48" ry="6" fill="${K}" opacity=".12"/>
<rect x="-44" y="-72" width="70" height="40" rx="8" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<path d="M-44 -72 h70 l-8 -18 h-54 z" fill="hsl(${h},56%,48%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<rect x="-34" y="-64" width="26" height="14" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<circle cx="-30" cy="-22" r="13" fill="#7f8c9b" stroke="${K}" stroke-width="3"/>
<circle cx="0" cy="-22" r="13" fill="#7f8c9b" stroke="${K}" stroke-width="3"/>
<circle cx="26" cy="-22" r="13" fill="#7f8c9b" stroke="${K}" stroke-width="3"/>
<path d="M26 -72 q24 -6 34 -26" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`);
    case 'brush':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="46" ry="6" fill="${K}" opacity=".12"/>
<rect x="-44" y="-74" width="46" height="34" rx="9" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-36" y="-66" width="20" height="12" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.2"/>
<path d="M-4 -56 l64 34" stroke="#a9744f" stroke-width="7" stroke-linecap="round"/>
<path d="M-4 -56 l64 34" stroke="${K}" stroke-width="1.6" opacity=".5"/>
<ellipse cx="64" cy="-16" rx="18" ry="9" fill="hsl(${h},56%,50%)" stroke="${K}" stroke-width="3" transform="rotate(28 64 -16)"/>
<path d="M52 -6 l16 10 M56 -16 l18 8 M60 -26 l16 6" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);
    case 'milkmachine':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="36" ry="6" fill="${K}" opacity=".12"/>
<rect x="-34" y="-62" width="46" height="54" rx="9" fill="hsl(${h},48%,64%)" stroke="${K}" stroke-width="3"/>
<ellipse cx="-11" cy="-62" rx="23" ry="7" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<rect x="-26" y="-44" width="30" height="14" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M14 -54 q28 -10 34 12 q6 20 -12 26" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
<path d="M36 -74 l10 -8 M46 -78 l6 -14" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<circle cx="52" cy="-96" r="7" fill="hsl(${h},58%,60%)" stroke="${K}" stroke-width="2.6"/>`);
    case 'harvester':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="34" ry="6" fill="${K}" opacity=".12"/>
<path d="M0 -8 v-84" stroke="#7f8c9b" stroke-width="7" stroke-linecap="round"/>
<path d="M0 -8 v-84" stroke="${K}" stroke-width="1.6"/>
<rect x="-26" y="-124" width="52" height="30" rx="9" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="3"/>
<path d="M-26 -112 h-14 a8 8 0 0 0 -8 8 v10 a8 8 0 0 0 8 8 h48" fill="none" stroke="${K}" stroke-width="3"/>
<circle cx="-6" cy="-108" r="4.5" fill="hsl(5,68%,56%)" stroke="${K}" stroke-width="2"/>
<circle cx="8" cy="-106" r="4.5" fill="hsl(40,74%,56%)" stroke="${K}" stroke-width="2"/>`);
    case 'chaff':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="44" ry="6" fill="${K}" opacity=".12"/>
<rect x="-40" y="-58" width="60" height="48" rx="9" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-32" y="-50" width="26" height="16" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M20 -58 l30 -22 v22 z" fill="hsl(${h},56%,50%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<circle cx="-14" cy="-22" r="10" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<path d="M46 -30 q16 -6 26 4" fill="none" stroke="hsl(45,60%,58%)" stroke-width="5" stroke-linecap="round"/>
<circle cx="-34" cy="-8" r="4" fill="hsl(45,64%,56%)" stroke="${K}" stroke-width="2"/>`);
    case 'dryer':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="46" ry="6" fill="${K}" opacity=".12"/>
<path d="M-46 -12 q0 -40 46 -40 q46 0 46 40 z" fill="#ffffff" fill-opacity=".62" stroke="${K}" stroke-width="3.4"/>
<path d="M-46 -12 h92" stroke="${K}" stroke-width="3.4"/>
<path d="M-20 -16 q0 -30 20 -30 M12 -16 q0 -30 20 -30" fill="none" stroke="${K}" stroke-width="2.2" opacity=".6"/>
<rect x="-24" y="-18" width="48" height="10" rx="4" fill="hsl(${h},56%,54%)" stroke="${K}" stroke-width="2.4"/>
<circle cx="60" cy="-70" r="14" fill="hsl(46,88%,60%)" stroke="${K}" stroke-width="3"/>
<path d="M78 -70 h10 M74 -84 l8 -8 M74 -56 l8 8" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);
    case 'mill':
      return G(x, y, s, `
<ellipse cx="0" cy="2" rx="40" ry="6" fill="${K}" opacity=".12"/>
<rect x="-34" y="-52" width="58" height="42" rx="9" fill="hsl(${h},50%,60%)" stroke="${K}" stroke-width="3"/>
<rect x="-26" y="-44" width="24" height="14" rx="4" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>
<path d="M-8 -52 l4 -34 h30 l4 34 z" fill="hsl(${h},54%,50%)" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<circle cx="-14" cy="-24" r="9" fill="#dfe8ea" stroke="${K}" stroke-width="3"/>
<path d="M30 -30 q16 4 20 20 q-14 6 -22 -6" fill="hsl(45,70%,72%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="38" cy="-6" r="2.6" fill="hsl(45,70%,64%)"/><circle cx="46" cy="-8" r="2.6" fill="hsl(45,70%,64%)"/>`);
    default:
      // tiller — the default implement body with rotating tines
      return G(x, y, s, body(`
<path d="M24 -56 q26 -8 34 -30" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>
<rect x="-30" y="-86" width="26" height="30" rx="7" fill="#7f8c9b" stroke="${K}" stroke-width="3"/>
<circle cx="24" cy="-26" r="14" fill="hsl(${h},48%,46%)" stroke="${K}" stroke-width="3"/>
<path d="M24 -40 v10 M14 -32 l8 6 M34 -32 l-8 6 M24 -12 v10" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
<rect x="-46" y="-74" width="18" height="10" rx="5" fill="${K}"/>`));
  }
};

/* --- bio agents + granules ----------------------------------------------- */
const microbe = (x, y, s, h = 130) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="20" ry="5" fill="${K}" opacity=".12"/>
<path d="M-34 -40 q-14 -6 -18 -20 M34 -40 q14 -6 18 -20 M0 -62 v-18" fill="none" stroke="${K}" stroke-width="2.8" stroke-linecap="round"/>
<ellipse cx="0" cy="-34" rx="30" ry="26" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="3"/>
<circle cx="-10" cy="-40" r="5" fill="#fffbe9" stroke="${K}" stroke-width="2"/>
<circle cx="8" cy="-30" r="6" fill="#fffbe9" stroke="${K}" stroke-width="2"/>
<circle cx="4" cy="-46" r="3.4" fill="#fffbe9" stroke="${K}" stroke-width="1.8"/>
<path d="M-52 -60 q-8 8 -4 18 M52 -60 q8 8 4 18" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`);

const virus = (x, y, s, h = 265) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="20" ry="5" fill="${K}" opacity=".12"/>
<g stroke="${K}" stroke-width="3" stroke-linecap="round">
<path d="M0 -74 v-16 M0 -16 v14 M-44 -46 h-16 M44 -46 h16 M-30 -76 l-12 -12 M30 -76 l12 -12 M-30 -22 l-14 12 M30 -22 l14 12"/>
</g>
<g fill="hsl(${h},56%,58%)" stroke="${K}" stroke-width="3">
<circle cx="0" cy="-46" r="28"/>
</g>
<circle cx="-9" cy="-54" r="5" fill="#fffbe9" stroke="${K}" stroke-width="2"/>
<circle cx="8" cy="-40" r="6" fill="#fffbe9" stroke="${K}" stroke-width="2"/>
<circle cx="-6" cy="-34" r="3.4" fill="#fffbe9" stroke="${K}" stroke-width="1.8"/>
<g fill="hsl(${h},60%,48%)" stroke="${K}" stroke-width="2">
<circle cx="0" cy="-90" r="5"/><circle cx="0" cy="-2" r="5"/><circle cx="-60" cy="-46" r="5"/><circle cx="60" cy="-46" r="5"/>
<circle cx="-42" cy="-88" r="5"/><circle cx="42" cy="-88" r="5"/><circle cx="-44" cy="-10" r="5"/><circle cx="44" cy="-10" r="5"/>
</g>`);

const worm = (x, y, s, h = 45) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="30" ry="5.5" fill="${K}" opacity=".12"/>
<path d="M-44 -18 q18 -26 40 -6 q22 20 44 -6" fill="none" stroke="hsl(${h},64%,58%)" stroke-width="11" stroke-linecap="round"/>
<path d="M-44 -18 q18 -26 40 -6 q22 20 44 -6" fill="none" stroke="${K}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
<circle cx="40" cy="-26" r="3" fill="${K}"/>`);

const bug = (x, y, s, h = 5, kind = 'beetle') => {
  if (kind === 'mite') {
    return G(x, y, s, `
<ellipse cx="0" cy="0" rx="14" ry="11" fill="hsl(${h},55%,54%)" stroke="${K}" stroke-width="2.6"/>
<circle cx="-12" cy="-6" r="5" fill="hsl(${h},58%,46%)" stroke="${K}" stroke-width="2.2"/>
<path d="M-14 -14 l-6 -8 M-6 -16 l-2 -10 M2 -16 l4 -10 M10 -12 l8 -8 M14 0 h12 M12 8 l10 8 M4 11 l4 10 M-4 11 l-2 10 M-12 8 l-8 8" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`);
  }
  if (kind === 'fly') {
    return G(x, y, s, `
<ellipse cx="0" cy="0" rx="10" ry="8" fill="hsl(${h},45%,45%)" stroke="${K}" stroke-width="2.4"/>
<ellipse cx="-10" cy="-8" rx="11" ry="6" fill="#ffffff" fill-opacity=".75" stroke="${K}" stroke-width="2" transform="rotate(-24 -10 -8)"/>
<ellipse cx="10" cy="-8" rx="11" ry="6" fill="#ffffff" fill-opacity=".75" stroke="${K}" stroke-width="2" transform="rotate(24 10 -8)"/>
<circle cx="0" cy="-6" r="4" fill="hsl(${h},50%,38%)" stroke="${K}" stroke-width="2"/>
<path d="M-8 8 l-6 8 M8 8 l6 8" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`);
  }
  // beetle
  return G(x, y, s, `
<ellipse cx="0" cy="0" rx="13" ry="16" fill="hsl(${h},58%,52%)" stroke="${K}" stroke-width="2.6"/>
<path d="M0 -16 v30" stroke="${K}" stroke-width="2.2"/>
<circle cx="0" cy="-18" r="7" fill="hsl(${h},62%,42%)" stroke="${K}" stroke-width="2.4"/>
<path d="M-6 -24 l-6 -8 M6 -24 l6 -8 M-13 -6 l-12 -4 M13 -6 l12 -4 M-13 6 l-12 4 M13 6 l12 4" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>`);
};

/** Pile of granules / pellets. */
const granulePile = (x, y, s, h = 40) => {
  let dots = '';
  const pts = [[-26, -8], [-12, -14], [2, -10], [16, -14], [28, -7], [-18, -2], [-4, -3], [10, -3], [24, 1], [-30, 1]];
  pts.forEach(([cx, cy], i) => {
    dots += `<circle cx="${cx}" cy="${cy}" r="6" fill="hsl(${h + i * 4},58%,${58 + (i % 3) * 6}%)" stroke="${K}" stroke-width="2.2"/>`;
  });
  return G(x, y, s, `
<ellipse cx="0" cy="4" rx="38" ry="7" fill="${K}" opacity=".12"/>
<path d="M-38 0 q14 -30 38 -30 q24 0 38 30 z" fill="hsl(${h},44%,66%)" fill-opacity=".7" stroke="none"/>
${dots}`);
};

/** pH colour scale strip. */
const phStrip = (x, y, s) => G(x, y, s, `
<ellipse cx="0" cy="2" rx="34" ry="6" fill="${K}" opacity=".12"/>
<rect x="-44" y="-58" width="88" height="34" rx="7" fill="#fffbe9" stroke="${K}" stroke-width="3"/>
<rect x="-44" y="-58" width="18" height="34" rx="7" fill="hsl(0,70%,58%)"/>
<rect x="-26" y="-58" width="17" height="34" fill="hsl(35,75%,56%)"/>
<rect x="-9" y="-58" width="17" height="34" fill="hsl(55,75%,55%)"/>
<rect x="8" y="-58" width="17" height="34" fill="hsl(120,55%,55%)"/>
<rect x="25" y="-58" width="19" height="34" rx="7" fill="hsl(215,65%,58%)"/>
<rect x="-44" y="-58" width="88" height="34" rx="7" fill="none" stroke="${K}" stroke-width="3"/>
<rect x="-34" y="-24" width="68" height="18" rx="5" fill="hsl(50,45%,64%)" stroke="${K}" stroke-width="2.6"/>
<path d="M-34 -6 v-14 M-12 -6 v-14 M12 -6 v-14 M34 -6 v-14" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`);

/** Upward trend arrow. */
const arrowUp = (x, y, s, h = 130) => G(x, y, s, `
<path d="M-40 0 l16 -28 l16 12 l24 -36 l16 10" fill="none" stroke="hsl(${h},60%,50%)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-40 0 l16 -28 l16 12 l24 -36 l16 10" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
<path d="M48 -64 h12 v12" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`);

/* ---------------------------------------------------------------------------
 * SUB_TILES — one literal scene per subcategory of the seven-category
 * taxonomy. Scenes compose the primitives above on the ground line y=168
 * inside the 320x200 tile; the top-right corner is left clear for the
 * category pill. The coverage check in main() throws if any taxonomy
 * subcategory is missing here, so new entries can never ship without art.
 * ------------------------------------------------------------------------- */
const SUB_TILES = {
  /* ---- Seeds ----------------------------------------------------------- */
  'Vegetable Seeds': { hue: 95, scene: `${packet(110, 168, 1, 95, seedGlyph)}${plant(200, 168, 1.1, 110, 4)}${fruit(258, 168, 0.75, 5)}` },
  'Fruit Seeds': { hue: 12, scene: `${packet(110, 168, 1, 12, fruitGlyph)}${melon(208, 168, 1, 95)}` },
  'Flower Seeds': { hue: 335, scene: `${packet(108, 168, 1, 335, flowerGlyph)}${flower(200, 168, 1, 335)}${flower(258, 168, 0.7, 45)}` },
  Forages: { hue: 100, scene: `${clover(125, 168, 1, 100)}${clover(210, 168, 0.8, 108)}${plant(266, 168, 0.7, 95, 3)}` },
  'Maize/Corn': { hue: 48, scene: `${ear(138, 168, 1, 48, 'maize')}${ear(208, 168, 0.9, 52, 'maize')}${packet(266, 168, 0.7, 45, seedGlyph)}` },
  Paddy: { hue: 45, scene: `${ear(138, 168, 1, 45, 'paddy')}${ear(203, 168, 0.95, 50, 'paddy')}<path d="M40 172 q16 -8 32 0 t32 0 t32 0" fill="none" stroke="#7fb6d9" stroke-width="4" stroke-linecap="round"/>` },
  Mustard: { hue: 50, scene: `${ear(142, 168, 1, 50, 'mustard')}${ear(202, 168, 0.85, 55, 'mustard')}${granulePile(264, 168, 0.7, 45)}` },
  Jowar: { hue: 35, scene: `${ear(142, 168, 1, 35, 'jowar')}${ear(203, 168, 0.9, 40, 'jowar')}${packet(262, 168, 0.7, 35, seedGlyph)}` },
  Cotton: { hue: 120, scene: `${bushPlant(140, 168, 1, 120)}<circle cx="124" cy="104" r="9" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/><circle cx="152" cy="120" r="8" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/><circle cx="139" cy="88" r="7.5" fill="#fffbe9" stroke="${K}" stroke-width="2.4"/>${packet(246, 168, 0.75, 115, seedGlyph)}` },
  Polyhouse: { hue: 150, scene: `${tunnel(166, 168, 1.15, 150)}${packet(62, 168, 0.75, 140, seedGlyph)}` },
  Exotics: { hue: 175, scene: `${fruit(128, 168, 1, 120, 'broccoli')}${fruit(212, 168, 0.85, 175, 'capsicum')}${packet(272, 168, 0.65, 175, seedGlyph)}` },
  'Urban Garden': { hue: 285, scene: `<path d="M60 156 h200 M72 156 v-30 M112 156 v-30 M152 156 v-30 M192 156 v-30 M232 156 v-30" stroke="${K}" stroke-width="2.6" opacity=".45"/>${polybag(112, 168, 1, 110)}${polybag(172, 168, 0.85, 285)}${flower(234, 168, 0.9, 335)}` },

  /* ---- Crop Protection (chemical) -------------------------------------- */
  Insecticides: { hue: 200, scene: `${bottle(118, 168, 1, 200)}${bug(206, 152, 0.9, 5, 'beetle')}${bug(252, 163, 0.8, 5, 'fly')}` },
  Fungicides: { hue: 165, scene: `${bottle(118, 168, 1, 165)}${bushPlant(216, 168, 0.8, 110)}<circle cx="204" cy="108" r="5" fill="hsl(28,55%,50%)" stroke="${K}" stroke-width="2"/><circle cx="226" cy="96" r="4.4" fill="hsl(28,55%,50%)" stroke="${K}" stroke-width="2"/><circle cx="230" cy="118" r="4" fill="hsl(28,55%,50%)" stroke="${K}" stroke-width="2"/>` },
  Herbicides: { hue: 95, scene: `${bottle(118, 168, 1, 95)}<path d="M198 168 q-8 -32 8 -50 q18 14 8 32 q-3 12 -16 18 z" fill="hsl(82,32%,56%)" stroke="${K}" stroke-width="2.6"/><path d="M252 108 v30 M245 131 l7 8 l7 -8" fill="none" stroke="#b3543a" stroke-width="4.4" stroke-linecap="round"/>` },
  Bactericides: { hue: 190, scene: `${bottle(118, 168, 1, 190)}${microbe(216, 168, 0.8, 190)}` },

  /* ---- Crop Protection (bio) ------------------------------------------- */
  'Bio Insecticides': { hue: 100, scene: `<path d="M52 152 q20 -24 48 -20 q-4 28 -32 32 q-15 2 -16 -12 z" fill="hsl(100,45%,52%)" stroke="${K}" stroke-width="2.6"/><path d="M60 148 q18 -14 38 -14" fill="none" stroke="${K}" stroke-width="2" opacity=".6"/>${bug(116, 158, 0.85, 5, 'beetle')}${bottle(212, 168, 0.95, 90)}` },
  'Bio Fungicides': { hue: 145, scene: `${flask(128, 168, 1, 145)}${microbe(226, 168, 0.85, 145)}<circle cx="268" cy="120" r="4" fill="hsl(145,60%,48%)" stroke="${K}" stroke-width="1.8"/><circle cx="280" cy="138" r="3.4" fill="hsl(145,60%,48%)" stroke="${K}" stroke-width="1.8"/>` },
  'Bio Viricides': { hue: 265, scene: `${virus(150, 168, 1, 265)}${flask(240, 168, 0.8, 265)}` },
  'Bio Nematicides': { hue: 150, scene: `${worm(118, 158, 1, 45)}${flask(222, 168, 0.95, 150)}<path d="M276 104 l16 6 v14 q0 16 -16 24 q-16 -8 -16 -24 v-14 z" fill="hsl(150,45%,62%)" stroke="${K}" stroke-width="2.6" stroke-linejoin="round"/>` },

  /* ---- Crop Protection (traps and lures) ------------------------------- */
  'Sticky Traps': { hue: 55, scene: `${trapCard(128, 168, 1.05, 55)}${trapCard(220, 168, 0.85, 50)}${bug(272, 158, 0.7, 10, 'fly')}` },
  'Pheromone Lures': { hue: 20, scene: `${lureVial(128, 168, 1.05, 20)}${lureVial(212, 168, 0.9, 25)}<ellipse cx="262" cy="158" rx="13" ry="9" fill="hsl(20,70%,60%)" stroke="${K}" stroke-width="2.6"/><path d="M253 160 h18" stroke="${K}" stroke-width="2" opacity=".6"/>` },
  'Pheromone Traps': { hue: 160, scene: `${funnelTrap(148, 168, 1.1, 160)}${lureVial(245, 168, 0.85, 20)}` },
  'Solar Light Traps': { hue: 215, scene: `${solarTrap(158, 168, 1.15, 215)}${bug(258, 136, 0.7, 40, 'fly')}${bug(64, 152, 0.7, 30, 'beetle')}` },

  /* ---- Crop Nutrition -------------------------------------------------- */
  'Chemical Fertilizers': { hue: 220, scene: `${sack(118, 168, 1.05, 220, 'NPK')}${granulePile(222, 168, 0.9, 215)}${sack(280, 168, 0.62, 230, 'K')}` },
  'Bio/Organic Fertilizers': { hue: 30, scene: `${worm(108, 152, 0.9, 25)}${sack(192, 168, 1.05, 30, 'Org')}${granulePile(268, 168, 0.7, 35)}` },
  'Micro Nutrients': { hue: 45, scene: `${sack(112, 168, 0.95, 45, 'Zn')}${sack(188, 168, 0.95, 55, 'Fe')}${sack(262, 168, 0.95, 205, 'Cu')}` },
  'Humic Acids': { hue: 25, scene: `${granulePile(128, 168, 1.1, 25)}${flask(224, 168, 0.95, 25)}<circle cx="270" cy="118" r="6" fill="hsl(25,60%,55%)" stroke="${K}" stroke-width="2.2"/><circle cx="286" cy="132" r="5" fill="hsl(25,60%,55%)" stroke="${K}" stroke-width="2.2"/><path d="M270 124 l16 8" stroke="${K}" stroke-width="2.4"/>` },
  'pH Balancers': { hue: 50, scene: `${phStrip(150, 168, 1.05)}${sack(244, 168, 0.8, 50, 'Ca')}` },
  'Plain Growth Promoters': { hue: 95, scene: `${packet(118, 168, 1, 95, leafGlyph)}${plant(214, 168, 1.1, 105, 4)}` },
  'Plant Enhancers': { hue: 165, scene: `${sprayCan(128, 168, 1, 165)}${bushPlant(224, 168, 0.85, 110)}<path d="M266 78 v-14 M266 114 v14 M246 96 h-14 M286 96 h14" stroke="hsl(48,85%,55%)" stroke-width="3" stroke-linecap="round"/>` },
  'Bio Stimulants': { hue: 190, scene: `${bottle(118, 168, 0.95, 190)}<path d="M208 168 q-12 -32 4 -54 q15 -20 4 -42 M232 168 q11 -28 -2 -48" fill="none" stroke="hsl(190,50%,45%)" stroke-width="5" stroke-linecap="round"/><circle cx="256" cy="120" r="4.5" fill="hsl(195,65%,62%)" stroke="${K}" stroke-width="1.8"/>` },
  'Yield Boosters': { hue: 285, scene: `${ear(118, 168, 1, 45, 'wheat')}${arrowUp(212, 152, 1, 130)}${bottle(270, 168, 0.72, 285)}` },
  'Fruit Enhancers': { hue: 15, scene: `${fruit(128, 168, 1, 40, 'papaya')}${arrowUp(212, 152, 0.95, 15)}${fruit(268, 168, 0.7, 5)}` },
  'Flower Boosters': { hue: 330, scene: `${flower(128, 168, 1, 330)}${arrowUp(208, 150, 0.95, 300)}${flower(266, 168, 0.65, 45)}` },

  /* ---- Equipments (implements) ----------------------------------------- */
  Sprayers: { hue: 115, scene: `${knapsack(146, 168, 1.15, 115)}${plant(258, 168, 0.75, 110, 3)}` },
  'Brush Cutter': { hue: 15, scene: `${machine(138, 168, 1.1, 15, 'brush')}${bushPlant(256, 168, 0.72, 110)}` },
  'Weeder/Tiller': { hue: 105, scene: `${machine(146, 168, 1.15, 105, 'tiller')}<path d="M240 160 h44 M248 170 h32" stroke="#8a6a4a" stroke-width="4.4" stroke-linecap="round"/>` },
  'Chaff Cutter and Parts': { hue: 45, scene: `${machine(150, 168, 1.1, 45, 'chaff')}<path d="M246 158 l30 -8 M250 166 l28 2" stroke="hsl(45,62%,58%)" stroke-width="4" stroke-linecap="round"/>${sack(284, 168, 0.55, 50, 'F')}` },
  'Solar Dryer': { hue: 30, scene: `${machine(156, 168, 1.1, 30, 'dryer')}${granulePile(262, 168, 0.55, 40)}` },
  'Rice Mill': { hue: 215, scene: `${machine(146, 168, 1.1, 215, 'mill')}${ear(256, 168, 0.75, 45, 'paddy')}` },
  'Earth Augers': { hue: 100, scene: `${machine(146, 168, 1.1, 100, 'auger')}<ellipse cx="252" cy="166" rx="27" ry="9" fill="#8a6a4a" stroke="${K}" stroke-width="2.6"/><ellipse cx="252" cy="166" rx="13" ry="4" fill="#6b4a33"/>` },
  'Power Reaper': { hue: 95, scene: `${machine(150, 168, 1.1, 95, 'reaper')}${ear(262, 168, 0.7, 45, 'wheat')}` },
  'Chain Saw': { hue: 5, scene: `${machine(144, 168, 1.15, 5, 'saw')}<rect x="222" y="148" width="62" height="18" rx="9" fill="#a9744f" stroke="${K}" stroke-width="2.6"/><ellipse cx="234" cy="157" rx="5" ry="7" fill="#8a6a4a" stroke="${K}" stroke-width="2"/>` },
  'Sugarcane Machine': { hue: 45, scene: `${machine(150, 168, 1.1, 45, 'cane')}` },

  /* ---- Equipments (agriculture tools) ---------------------------------- */
  'Nursery Inputs': { hue: 110, scene: `<rect x="56" y="146" width="112" height="24" rx="6" fill="hsl(30,25%,62%)" stroke="${K}" stroke-width="2.8"/><path d="M84 146 v24 M112 146 v24 M140 146 v24" stroke="${K}" stroke-width="2.2" opacity=".6"/>${plant(70, 146, 0.55, 110, 2)}${plant(98, 146, 0.55, 110, 3)}${plant(126, 146, 0.55, 110, 2)}${plant(154, 146, 0.55, 110, 3)}${packet(238, 168, 0.8, 110, leafGlyph)}` },
  'Fruit Harvester/Plucker': { hue: 30, scene: `${machine(142, 168, 1.05, 30, 'harvester')}${tree(252, 168, 0.72, 105)}${fruit(246, 132, 0.42, 40)}` },
  'Garden Tools': { hue: 95, scene: `${toolSet(150, 168, 1.25, 95)}${flower(256, 168, 0.7, 335)}` },
  'Seeder/Transplanter': { hue: 135, scene: `${machine(150, 168, 1.1, 135, 'drill')}${plant(252, 168, 0.55, 110, 2)}${plant(278, 168, 0.5, 110, 3)}` },

  /* ---- Equipments (farm protection and covering) ----------------------- */
  Tarpaulin: { hue: 215, scene: `${tarpStack(148, 168, 1.25, 215)}<circle cx="66" cy="72" r="17" fill="hsl(46,88%,60%)" stroke="${K}" stroke-width="2.8"/><path d="M66 44 v-10 M66 100 v10 M38 72 h-10 M94 72 h10 M46 52 l-7 -7 M86 92 l7 7 M86 52 l7 -7 M46 92 l-7 7" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>` },
  Mulch: { hue: 260, scene: `${rollCyl(126, 168, 1.05, 260)}<rect x="204" y="150" width="82" height="18" rx="6" fill="hsl(260,30%,34%)" stroke="${K}" stroke-width="2.6"/>${plant(224, 150, 0.5, 110, 2)}${plant(262, 150, 0.48, 110, 3)}` },
  'Shade Net': { hue: 145, scene: `${netPanel(150, 168, 1.35, 145, 6, 4)}${plant(258, 168, 0.6, 110, 3)}` },
  'Traps and Lure': { hue: 55, scene: `${funnelTrap(122, 168, 1, 160)}${lureVial(202, 168, 0.95, 20)}${trapCard(268, 168, 0.68, 55)}` },
  'Safety Kit': { hue: 205, scene: `${safetyTrio(150, 168, 1.25, 205)}` },
  'Torch/Lantern': { hue: 45, scene: `${torchHead(126, 168, 1.15, 45)}<rect x="214" y="122" width="46" height="44" rx="10" fill="hsl(46,85%,62%)" stroke="${K}" stroke-width="3"/><path d="M224 122 q13 -18 26 0" fill="none" stroke="${K}" stroke-width="3"/><circle cx="237" cy="144" r="9" fill="#fffbe9" stroke="${K}" stroke-width="2.6"/>` },
  'Crop Cover': { hue: 110, scene: `${plant(118, 168, 0.6, 110, 2)}${plant(184, 168, 0.55, 110, 3)}${netPanel(150, 168, 1.3, 110, 7, 3, 92, 46)}${plant(258, 168, 0.6, 105, 2)}` },

  /* ---- Equipments (irrigation) ----------------------------------------- */
  Pipe: { hue: 140, scene: `${pipeSeg(142, 168, 1.2, 140)}<ellipse cx="256" cy="162" rx="30" ry="9" fill="hsl(200,65%,62%)" stroke="${K}" stroke-width="2.6"/>` },
  'Water Pump': { hue: 200, scene: `${pumpUnit(146, 168, 1.15, 200)}<rect x="226" y="140" width="60" height="28" rx="6" fill="hsl(210,25%,72%)" stroke="${K}" stroke-width="2.8"/><ellipse cx="256" cy="140" rx="30" ry="7" fill="hsl(200,65%,62%)" stroke="${K}" stroke-width="2.6"/>` },
  Sprinkler: { hue: 95, scene: `${plant(78, 168, 0.7, 105, 2)}${sprinklerHead(152, 168, 1.3, 95)}${plant(252, 168, 0.8, 110, 3)}` },
  'Drip Kit': { hue: 25, scene: `${plant(122, 168, 0.6, 110, 2)}${plant(188, 168, 0.6, 110, 3)}${plant(256, 168, 0.55, 110, 2)}${dripLine(152, 168, 1.35, 25)}` },

  /* ---- Animal Husbandry ------------------------------------------------ */
  'Cattle Feed': { hue: 30, scene: `${sack(122, 168, 1.1, 30, 'Feed')}${cow(230, 168, 1, 30)}` },
  'Cattle Supplements': { hue: 205, scene: `${sack(120, 168, 0.9, 205, 'Min')}${cow(224, 168, 0.95, 25)}${feedBowl(282, 168, 0.6, 205)}` },
  'Milking Machine': { hue: 195, scene: `${machine(146, 168, 1.1, 195, 'milkmachine')}${cow(262, 168, 0.72, 30)}` },
  'Milking Machine Accessories': { hue: 215, scene: `${bucket(126, 168, 1.05, 215)}<path d="M198 128 h58 M198 144 h58 M198 160 h58" stroke="hsl(215,30%,72%)" stroke-width="8" stroke-linecap="round"/><circle cx="262" cy="112" r="11" fill="#dfe8ea" stroke="${K}" stroke-width="2.6"/><path d="M256 112 h12 M262 106 v12" stroke="${K}" stroke-width="2.2"/>` },
  'Calf Feeding Bottle': { hue: 25, scene: `${calfBottle(142, 168, 1.35, 25)}${cow(250, 168, 0.7, 35)}` },
  'Poultry Supplements': { hue: 45, scene: `${sack(122, 168, 0.95, 45, 'Cal')}${chicken(230, 168, 1.1, 35)}` },
  'Poultry Equipment': { hue: 20, scene: `${tubeFeeder(132, 168, 1.15, 20)}${chicken(240, 168, 1, 40)}<path d="M278 150 h22 v9 a7 7 0 0 1 -7 7 h-8 a7 7 0 0 1 -7 -7 z" fill="hsl(200,60%,66%)" stroke="${K}" stroke-width="2.4"/>` },


  /* ---- Tapas (curated collection subcategories) ------------------------ */
  'Crop Nutrition': { hue: 95, scene: `${packet(118, 168, 0.9, 95, leafGlyph)}${sack(208, 168, 0.9, 110, 'N')}${plant(272, 168, 0.65, 110, 3)}` },
  'Crop Protection': { hue: 15, scene: `${bottle(122, 168, 0.95, 15)}${funnelTrap(212, 168, 0.85, 160)}${bug(270, 160, 0.65, 5, 'beetle')}` },
  'Farm Implements': { hue: 35, scene: `${toolSet(122, 168, 1.1, 35)}${machine(238, 168, 0.8, 105, 'tiller')}` },
  'Traps and Lures': { hue: 55, scene: `${funnelTrap(128, 168, 1, 160)}${lureVial(208, 168, 0.95, 55)}<ellipse cx="262" cy="158" rx="12" ry="8" fill="hsl(55,72%,60%)" stroke="${K}" stroke-width="2.6"/>` },
  'Mulching Sheet': { hue: 265, scene: `${tarpStack(136, 168, 1.05, 265)}<rect x="210" y="152" width="80" height="16" rx="6" fill="hsl(265,28%,32%)" stroke="${K}" stroke-width="2.6"/>${plant(230, 152, 0.5, 110, 2)}${plant(268, 152, 0.5, 110, 3)}` },
};

/** Rounded pill naming the main category a tile belongs to (top-right). */
function groupPill(group) {
  const w = group.length * 7.6 + 24;
  const x = 304 - w;
  return `<g>
<rect x="${x}" y="14" width="${w}" height="24" rx="12" fill="#234832"/>
<text x="${x + w / 2}" y="30" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12.5" font-weight="bold" fill="#fdfcf3">${group}</text>
</g>`;
}

/** Render one subcategory tile SVG (320x200, beige-to-hue backdrop). */
function subcategorySvg(name) {
  const meta = SUB_TILES[name];
  if (!meta) throw new Error(`No scene defined for subcategory "${name}"`);
  const group =
    taxonomy.MAIN_CATEGORIES.find((t) => taxonomy.SUBCATEGORIES[t].includes(name)) || 'Store';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${name} demo illustration">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${meta.hue},40%,92%)"/><stop offset="1" stop-color="#f4efdc"/>
</linearGradient></defs>
<rect width="320" height="200" fill="url(#bg)"/>
<circle cx="58" cy="52" r="20" fill="hsl(${meta.hue},65%,82%)" opacity=".55"/>
<path d="M0 168 h320" stroke="${K}" stroke-width="2" opacity=".25"/>
${meta.scene}
${groupPill(group)}
</svg>`;
}

/* ---------------------------------------------------------------------------
 * Product pack-shots
 *
 * SHAPES draws a stylised container/equipment silhouette centred on the
 * origin; productSvg composes one shape on a beige 800x520 canvas with a
 * caption plate. These are generic DEMO pack-shots — they depict no real
 * commercial product. The 22 legacy pack-shots generated by the earlier
 * art phase are kept on disk as-is and still referenced by the seed.
 * ------------------------------------------------------------------------- */
const S = {
  pouch: (h) => `
<path d="M-110 -150 h220 l-14 26 h-192 z" fill="hsl(${h},58%,42%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<rect x="-110" y="-124" width="220" height="274" rx="14" fill="hsl(${h},54%,60%)" stroke="${K}" stroke-width="6"/>
<rect x="-76" y="-84" width="152" height="120" rx="10" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<path d="M-40 -24 h80 M-40 4 h80 M-40 32 h56" stroke="${K}" stroke-width="5" opacity=".5" stroke-linecap="round"/>
<circle cx="0" cy="88" r="30" fill="hsl(${h},66%,46%)" stroke="${K}" stroke-width="5"/>
<path d="M-110 -124 h220" stroke="${K}" stroke-width="5"/>`,
  bottle: (h) => `
<rect x="-56" y="-186" width="112" height="52" rx="12" fill="hsl(${h},52%,44%)" stroke="${K}" stroke-width="6"/>
<rect x="-34" y="-134" width="68" height="26" fill="hsl(${h},58%,56%)" stroke="${K}" stroke-width="6"/>
<path d="M-34 -108 q-60 42 -60 122 v104 a28 28 0 0 0 28 28 h132 a28 28 0 0 0 28 -28 v-104 q0 -80 -60 -122 z" fill="hsl(${h},58%,62%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<rect x="-66" y="-52" width="132" height="104" rx="12" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<path d="M-32 0 h64 M0 -32 v64" stroke="${K}" stroke-width="6" stroke-linecap="round"/>`,
  sack: (h, letter = '') => `
<path d="M-124 -2 q-18 -190 20 -238 h208 q38 48 20 238 z" fill="hsl(${h},46%,64%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<path d="M-104 -218 q104 -34 208 0" fill="none" stroke="${K}" stroke-width="7"/>
<rect x="-74" y="-156" width="148" height="96" rx="12" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
${letter ? `<text x="0" y="-88" text-anchor="middle" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="${K}">${letter}</text>` : '<path d="M-40 -108 h80 M-40 -80 h80 M-40 -52 h52" stroke="' + K + '" stroke-width="5" opacity=".5" stroke-linecap="round"/>'}
<ellipse cx="0" cy="-4" rx="124" ry="18" fill="hsl(${h},44%,54%)" stroke="${K}" stroke-width="6"/>`,
  box: (h) => `
<path d="M-130 -140 h260 v250 a14 14 0 0 1 -14 14 h-232 a14 14 0 0 1 -14 -14 z" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<path d="M-130 -140 h260 l-24 -44 h-212 z" fill="hsl(${h},56%,50%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<path d="M0 -140 v250" stroke="${K}" stroke-width="5" opacity=".6"/>
<rect x="-104" y="-96" width="94" height="72" rx="10" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<path d="M-84 -68 h54 M-84 -48 h54" stroke="${K}" stroke-width="5" opacity=".5" stroke-linecap="round"/>
<circle cx="74" cy="-58" r="30" fill="hsl(${h},64%,46%)" stroke="${K}" stroke-width="5"/>`,
  jar: (h) => `
<rect x="-96" y="-204" width="192" height="46" rx="14" fill="hsl(${h},54%,46%)" stroke="${K}" stroke-width="6"/>
<path d="M-84 -158 h168 v178 a24 24 0 0 1 -24 24 h-120 a24 24 0 0 1 -24 -24 z" fill="hsl(${h},54%,66%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<rect x="-58" y="-116" width="116" height="88" rx="10" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<path d="M-30 -72 h60" stroke="${K}" stroke-width="5" opacity=".5" stroke-linecap="round"/>
<circle cx="0" cy="8" r="26" fill="hsl(${h},62%,50%)" stroke="${K}" stroke-width="5"/>`,
  card: (h) => `
<rect x="-130" y="-190" width="260" height="330" rx="16" fill="hsl(${h},84%,60%)" stroke="${K}" stroke-width="6"/>
<rect x="-130" y="-190" width="260" height="46" rx="16" fill="hsl(${h},80%,50%)"/>
<circle cx="0" cy="-167" r="12" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<circle cx="-64" cy="-80" r="13" fill="${K}" opacity=".75"/><circle cx="6" cy="-110" r="11" fill="${K}" opacity=".75"/>
<circle cx="66" cy="-64" r="13" fill="${K}" opacity=".75"/><circle cx="30" cy="-16" r="11" fill="${K}" opacity=".75"/>
<circle cx="-50" cy="10" r="10" fill="${K}" opacity=".75"/><circle cx="84" cy="-130" r="10" fill="${K}" opacity=".75"/>`,
  roll: (h) => `
<rect x="-150" y="-120" width="256" height="150" rx="10" fill="hsl(${h},52%,58%)" stroke="${K}" stroke-width="6"/>
<ellipse cx="106" cy="-45" rx="42" ry="75" fill="hsl(${h},56%,46%)" stroke="${K}" stroke-width="6"/>
<ellipse cx="106" cy="-45" rx="18" ry="34" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<ellipse cx="-150" cy="-45" rx="16" ry="75" fill="hsl(${h},56%,66%)" stroke="${K}" stroke-width="6"/>
<path d="M-150 -84 h256 M-150 -6 h256" stroke="#fff" stroke-width="5" opacity=".4"/>`,
  bag: (h) => `
<path d="M-104 -176 h208 l16 300 a16 16 0 0 1 -16 18 h-208 a16 16 0 0 1 -16 -18 z" fill="hsl(${h},48%,60%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<path d="M-104 -176 h208" stroke="${K}" stroke-width="8" stroke-dasharray="14 10"/>
<rect x="-72" y="-118" width="144" height="104" rx="12" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<circle cx="0" cy="-66" r="26" fill="hsl(${h},60%,48%)" stroke="${K}" stroke-width="5"/>
<path d="M-46 -32 h92" stroke="${K}" stroke-width="5" opacity=".5" stroke-linecap="round"/>`,
  device: (h) => `
<rect x="-150" y="-96" width="236" height="196" rx="26" fill="hsl(${h},52%,60%)" stroke="${K}" stroke-width="6"/>
<rect x="-118" y="-64" width="104" height="72" rx="12" fill="#fffbe9" stroke="${K}" stroke-width="5"/>
<path d="M-96 -34 h60 M-96 -12 h40" stroke="${K}" stroke-width="5" opacity=".5" stroke-linecap="round"/>
<circle cx="66" cy="-28" r="30" fill="#dfe8ea" stroke="${K}" stroke-width="6"/>
<circle cx="66" cy="-28" r="12" fill="hsl(${h},58%,48%)" stroke="${K}" stroke-width="5"/>
<circle cx="-92" cy="100" r="30" fill="#6b4a33" stroke="${K}" stroke-width="6"/>
<circle cx="52" cy="100" r="30" fill="#6b4a33" stroke="${K}" stroke-width="6"/>
<path d="M86 -96 l64 -46 v66" fill="hsl(${h},56%,50%)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
<path d="M150 -142 l58 22" stroke="${K}" stroke-width="7" stroke-linecap="round"/>`,
  sheet: (h) => `
<rect x="-150" y="-40" width="300" height="96" rx="18" fill="hsl(${h},54%,56%)" stroke="${K}" stroke-width="6"/>
<rect x="-140" y="-104" width="280" height="70" rx="16" fill="hsl(${h},58%,66%)" stroke="${K}" stroke-width="6"/>
<rect x="-130" y="-164" width="260" height="66" rx="16" fill="hsl(${h},62%,76%)" stroke="${K}" stroke-width="6"/>
<path d="M-150 -12 h300 M-140 -84 h280" stroke="#fff" stroke-width="5" opacity=".45"/>
<circle cx="-104" cy="18" r="12" fill="none" stroke="${K}" stroke-width="5"/>
<circle cx="104" cy="-74" r="12" fill="none" stroke="${K}" stroke-width="5"/>`,
};

/** Pack-shots for the products added by the seven-category restructure. */
const PRODUCT_ART = [
  // Seeds
  { file: 'flower-seeds.svg', caption: 'Marigold Flower Seeds', shape: 'pouch', hue: 335 },
  { file: 'forage-seeds.svg', caption: 'Berseem Fodder Seed', shape: 'pouch', hue: 100 },
  { file: 'mustard-seeds.svg', caption: 'Mustard Seeds', shape: 'pouch', hue: 50 },
  { file: 'jowar-seeds.svg', caption: 'Jowar (Sorghum) Seeds', shape: 'pouch', hue: 35 },
  { file: 'polyhouse-seeds.svg', caption: 'Polyhouse Capsicum Seeds', shape: 'pouch', hue: 150 },
  { file: 'exotic-seeds.svg', caption: 'Exotic Broccoli Seeds', shape: 'pouch', hue: 175 },
  { file: 'urban-garden-seeds.svg', caption: 'Urban Garden Seed Pack', shape: 'pouch', hue: 285 },
  // Crop Protection
  { file: 'bio-viricide.svg', caption: 'Bio Viricide', shape: 'bottle', hue: 265 },
  { file: 'bio-nematicide.svg', caption: 'Bio Nematicide', shape: 'bottle', hue: 150 },
  { file: 'sticky-traps.svg', caption: 'Sticky Trap Cards', shape: 'card', hue: 55 },
  { file: 'pheromone-lures.svg', caption: 'Pheromone Lure Capsules', shape: 'box', hue: 20 },
  { file: 'pheromone-traps.svg', caption: 'Funnel Pheromone Trap', shape: 'jar', hue: 160 },
  { file: 'solar-light-traps.svg', caption: 'Solar Light Trap 20 W', shape: 'device', hue: 215 },
  // Crop Nutrition
  { file: 'humic-acid.svg', caption: 'Humic Acid Granules', shape: 'sack', hue: 25, letter: 'HA' },
  { file: 'ph-balancer.svg', caption: 'Soil pH Balancer', shape: 'sack', hue: 50, letter: 'pH' },
  { file: 'growth-promoter.svg', caption: 'Growth Promoter Mix', shape: 'pouch', hue: 95 },
  { file: 'plant-enhancer.svg', caption: 'Plant Enhancer Spray', shape: 'bottle', hue: 165 },
  { file: 'bio-stimulant.svg', caption: 'Bio Stimulant Amino Mix', shape: 'bottle', hue: 190 },
  { file: 'yield-booster.svg', caption: 'Yield Booster PGR', shape: 'bottle', hue: 285 },
  { file: 'fruit-enhancer.svg', caption: 'Fruit Enhancer Spray', shape: 'bottle', hue: 15 },
  { file: 'flower-booster.svg', caption: 'Flower Booster Spray', shape: 'bottle', hue: 330 },
  // Equipments — implements
  { file: 'brush-cutter.svg', caption: 'Brush Cutter BC-25', shape: 'device', hue: 15 },
  { file: 'chaff-cutter.svg', caption: 'Chaff Cutter Mini', shape: 'device', hue: 205 },
  { file: 'solar-dryer.svg', caption: 'Solar Crop Dryer', shape: 'device', hue: 30 },
  { file: 'rice-mill.svg', caption: 'Domestic Rice Mill', shape: 'device', hue: 215 },
  { file: 'earth-auger.svg', caption: 'Earth Auger 2-Stroke', shape: 'device', hue: 105 },
  { file: 'power-reaper.svg', caption: 'Power Reaper R-12', shape: 'device', hue: 95 },
  { file: 'chain-saw.svg', caption: 'Chain Saw 16 inch', shape: 'device', hue: 5 },
  { file: 'sugarcane-machine.svg', caption: 'Sugarcane Machine HR-3', shape: 'device', hue: 45 },
  // Equipments — agriculture tools
  { file: 'fruit-harvester.svg', caption: 'Fruit Harvester Pole', shape: 'device', hue: 100 },
  { file: 'seed-drill.svg', caption: '4-Row Seed Drill', shape: 'device', hue: 135 },
  // Equipments — protection and covering
  { file: 'tarpaulin.svg', caption: 'Tarpaulin Sheet 6x8 m', shape: 'sheet', hue: 215 },
  { file: 'mulch-film.svg', caption: 'Mulch Film 500 micron', shape: 'roll', hue: 260 },
  { file: 'shade-net.svg', caption: 'Shade Net 50%', shape: 'roll', hue: 145 },
  { file: 'traps-lure-kit.svg', caption: 'Traps and Lure Kit', shape: 'box', hue: 55 },
  { file: 'field-torch.svg', caption: 'Rechargeable Field Torch', shape: 'device', hue: 45 },
  { file: 'crop-cover-net.svg', caption: 'Crop Cover Net', shape: 'sheet', hue: 110 },
  // Equipments — irrigation
  { file: 'hdpe-pipe.svg', caption: 'HDPE Pipe 50 mm', shape: 'roll', hue: 140 },
  { file: 'water-pump.svg', caption: '1 HP Water Pump', shape: 'device', hue: 200 },
  { file: 'rotary-sprinkler.svg', caption: 'Rotary Sprinkler', shape: 'device', hue: 95 },
  { file: 'drip-kit.svg', caption: 'Drip Kit for 100 Plants', shape: 'box', hue: 25 },
  // Animal Husbandry
  { file: 'cattle-feed.svg', caption: 'Cattle Feed Pellets', shape: 'bag', hue: 30 },
  { file: 'cattle-supplements.svg', caption: 'Cattle Mineral Mixture', shape: 'bag', hue: 205 },
  { file: 'milking-machine.svg', caption: 'Bucket Milking Machine', shape: 'device', hue: 195 },
  { file: 'milking-accessories.svg', caption: 'Milking Liner and Claw Kit', shape: 'box', hue: 215 },
  { file: 'calf-bottle.svg', caption: 'Calf Feeding Bottle 2 L', shape: 'bottle', hue: 25 },
  { file: 'poultry-supplements.svg', caption: 'Poultry Calcium Booster', shape: 'jar', hue: 45 },
  { file: 'poultry-equipment.svg', caption: 'Poultry Tube Feeder', shape: 'device', hue: 20 },
  // Tapas curated collection
  { file: 'tapas-nutrition.svg', caption: 'Tapas Nutrition Combo', shape: 'sack', hue: 95, letter: 'Mix' },
  { file: 'tapas-protection.svg', caption: 'Tapas Protection Kit', shape: 'bottle', hue: 15 },
  { file: 'tapas-implements.svg', caption: 'Tapas Blade Set', shape: 'box', hue: 35 },
  { file: 'tapas-lures.svg', caption: 'Tapas Trap and Lure Combo', shape: 'box', hue: 55 },
  { file: 'tapas-mulch.svg', caption: 'Tapas Mulching Sheet', shape: 'sheet', hue: 265 },
  { file: 'tapas-safety.svg', caption: 'Tapas Safety Kit', shape: 'box', hue: 205 },
  { file: 'tapas-sprayer.svg', caption: 'Tapas Sprayer 5 L', shape: 'device', hue: 115 },
];

/** Render one demo pack-shot (800x520, beige backdrop, caption plate). */
function productSvg({ caption, shape, hue, letter }) {
  const draw = S[shape];
  if (!draw) throw new Error(`Unknown pack-shot shape "${shape}" for ${caption}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="${caption} demo pack-shot">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${hue},36%,93%)"/><stop offset="1" stop-color="#f4efdc"/>
</linearGradient></defs>
<rect width="800" height="520" fill="url(#bg)"/>
<circle cx="120" cy="90" r="34" fill="hsl(${hue},60%,84%)" opacity=".6"/>
<circle cx="690" cy="430" r="46" fill="hsl(${hue},60%,84%)" opacity=".5"/>
<ellipse cx="400" cy="436" rx="200" ry="26" fill="${K}" opacity=".12"/>
<g transform="translate(400 268)">${draw(hue, letter)}</g>
<rect x="180" y="452" width="440" height="44" rx="22" fill="#234832"/>
<text x="400" y="481" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="21" font-weight="bold" fill="#fdfcf3">${caption}</text>
</svg>`;
}

/* ---------------------------------------------------------------------------
 * Main-category slider art — the two mains with no matching demo photo.
 * (The other five reuse existing photos in client/images/categories/.)
 * ------------------------------------------------------------------------- */
function mainSvg(hue, scene, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${label} demo illustration">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${hue},40%,92%)"/><stop offset="1" stop-color="#f4efdc"/>
</linearGradient></defs>
<rect width="320" height="200" fill="url(#bg)"/>
<circle cx="56" cy="50" r="20" fill="hsl(${hue},65%,82%)" opacity=".55"/>
<path d="M0 168 h320" stroke="${K}" stroke-width="2" opacity=".25"/>
${scene}
</svg>`;
}

const MAIN_ART = [
  {
    file: 'animal-husbandry.svg',
    label: 'Animal Husbandry',
    hue: 30,
    scene: `${sack(74, 168, 0.95, 30, 'Feed')}${feedBowl(148, 168, 0.8, 34)}${cow(224, 168, 1.05, 30)}${chicken(292, 168, 0.85, 35)}`,
  },
  {
    file: 'tapas.svg',
    label: 'Tapas',
    hue: 55,
    scene: `${sack(70, 168, 0.9, 95, 'Mix')}${bottle(140, 168, 0.85, 15)}${funnelTrap(212, 168, 0.95, 160)}${plant(282, 168, 0.75, 110, 3)}`,
  },
];

/* ---------------------------------------------------------------------------
 * main() — coverage check, then write every asset.
 * ------------------------------------------------------------------------- */
function main() {
  const allSubs = Object.values(taxonomy.SUBCATEGORIES).flat();
  const uniqueSubs = [...new Set(allSubs)];

  // 1. Every subcategory of the taxonomy must have a scene …
  const missing = uniqueSubs.filter((s) => !SUB_TILES[s]);
  if (missing.length) {
    throw new Error(`SUB_TILES is missing scenes for: ${missing.join(', ')}`);
  }
  //  … and every scene must belong to the taxonomy (no stale entries).
  const stale = Object.keys(SUB_TILES).filter((s) => !uniqueSubs.includes(s));
  if (stale.length) {
    throw new Error(`SUB_TILES has scenes for unknown subcategories: ${stale.join(', ')}`);
  }
  // 2. Pack-shot files must be unique and use the .svg extension.
  const seenFiles = new Set();
  for (const art of PRODUCT_ART) {
    if (seenFiles.has(art.file)) throw new Error(`Duplicate pack-shot entry: ${art.file}`);
    seenFiles.add(art.file);
    if (!art.file.endsWith('.svg')) throw new Error(`Pack-shot must be .svg: ${art.file}`);
  }

  fs.mkdirSync(SUB_DIR, { recursive: true });
  fs.mkdirSync(PROD_DIR, { recursive: true });
  fs.mkdirSync(CAT_DIR, { recursive: true });

  // 3. Subcategory tiles — one file per unique subcategory slug.
  const wantedTiles = new Set();
  let tilesWritten = 0;
  for (const name of uniqueSubs) {
    const file = `${slug(name)}.svg`;
    wantedTiles.add(file);
    fs.writeFileSync(path.join(SUB_DIR, file), subcategorySvg(name));
    tilesWritten += 1;
  }

  // 4. Stale tiles from earlier taxonomies are removed so nothing that
  //    references an old category name can linger on disk.
  let removed = 0;
  for (const file of fs.readdirSync(SUB_DIR)) {
    if (file.endsWith('.svg') && !wantedTiles.has(file)) {
      fs.unlinkSync(path.join(SUB_DIR, file));
      removed += 1;
    }
  }

  // 5. Demo pack-shots for the products introduced by the restructure.
  for (const art of PRODUCT_ART) {
    fs.writeFileSync(path.join(PROD_DIR, art.file), productSvg(art));
  }

  // 6. Main-category slider art (only the two without a matching photo).
  for (const art of MAIN_ART) {
    fs.writeFileSync(path.join(CAT_DIR, art.file), mainSvg(art.hue, art.scene, art.label));
  }

  console.log(`Subcategory tiles : ${tilesWritten} written, ${removed} stale removed`);
  console.log(`Pack-shots        : ${PRODUCT_ART.length} written`);
  console.log(`Main-category art : ${MAIN_ART.length} written (5 mains reuse photos)`);
}

if (require.main === module) main();
module.exports = { SUB_TILES, PRODUCT_ART, MAIN_ART };
