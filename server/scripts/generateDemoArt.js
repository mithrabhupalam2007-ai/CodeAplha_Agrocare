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

/* Per-subcategory scene: every one of the 28 tiles gets its OWN literal,
   recognisable illustration (seed types, product forms, pest subjects) so no
   two subcategories share a generic image. `hue` tints the scene accents.
   Scenes draw inside the 320x200 tile keeping x in [30,290], y in [12,175]
   (the group pill sits top-right). */
const SUB_TILES = {
  // ---------------- Seeds ----------------
  'Vegetable Seeds': {
    hue: 95,
    scene: `
<rect x="48" y="52" width="92" height="112" rx="8" fill="hsl(95,45%,88%)" stroke="#234832" stroke-width="3.5"/>
<rect x="48" y="52" width="92" height="26" rx="8" fill="#234832" opacity=".85"/>
<rect x="60" y="90" width="68" height="54" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<path d="M94 104 L86 126 h16 z" fill="hsl(22,75%,55%)" stroke="#234832" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M94 104 v-8 M94 96 l-7 -6 M94 96 l7 -6" stroke="hsl(110,45%,38%)" stroke-width="3" stroke-linecap="round"/>
<path d="M0 0 V-26" stroke="#234832" stroke-width="3.5"/>
<path d="M186 150 C 170 150 164 136 168 126 C 180 128 185 140 186 150 Z" fill="hsl(95,48%,44%)"/>
<path d="M186 144 C 202 142 208 130 204 120 C 192 122 187 134 186 144 Z" fill="hsl(95,58%,37%)" opacity=".9"/>
<g transform="translate(232 146)"><path d="M0 0 V-30" stroke="#234832" stroke-width="3.5"/><path d="M0 -16 C -16 -16 -22 -30 -18 -40 C -6 -38 -1 -26 0 -16 Z" fill="hsl(95,48%,44%)"/><path d="M0 -22 C 16 -24 22 -36 18 -46 C 6 -44 1 -32 0 -22 Z" fill="hsl(95,58%,37%)" opacity=".9"/></g>
<g transform="translate(278 152)"><path d="M0 0 V-24" stroke="#234832" stroke-width="3.5"/><path d="M0 -12 C -14 -12 -20 -24 -16 -32 C -6 -30 -1 -20 0 -12 Z" fill="hsl(95,48%,44%)"/></g>`,
  },
  'Cereal and Grain Seeds': {
    hue: 45,
    scene: `
${[92, 162, 232]
      .map(
        (x, i) => `<g transform="translate(${x} 168) scale(${1 - i * 0.06})">
<path d="M0 0 V-86" stroke="#234832" stroke-width="3.5" stroke-linecap="round"/>
${[0, 1, 2, 3, 4]
          .map(
            (k) =>
              `<ellipse cx="-9" cy="${-20 - k * 14}" rx="6" ry="9.5" transform="rotate(-24 -9 ${-20 - k * 14})" fill="hsl(45,62%,60%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="9" cy="${-28 - k * 14}" rx="6" ry="9.5" transform="rotate(24 9 ${-28 - k * 14})" fill="hsl(45,62%,60%)" stroke="#234832" stroke-width="2.5"/>`
          )
          .join('')}
<path d="M0 -86 L-8 -106 M0 -86 L0 -110 M0 -86 L8 -106" stroke="#234832" stroke-width="2.5" stroke-linecap="round"/>
</g>`
      )
      .join('')}
<ellipse cx="62" cy="176" rx="6" ry="4.5" fill="hsl(45,60%,56%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="140" cy="182" rx="6" ry="4.5" fill="hsl(45,60%,56%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="206" cy="178" rx="6" ry="4.5" fill="hsl(45,60%,56%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="272" cy="182" rx="6" ry="4.5" fill="hsl(45,60%,56%)" stroke="#234832" stroke-width="2"/>`,
  },
  'Pulse and Legume Seeds': {
    hue: 25,
    scene: `
<path d="M58 92 Q150 56 254 84 Q162 134 58 92 Z" fill="hsl(88,42%,62%)" stroke="#234832" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="96" cy="93" r="12" fill="hsl(25,55%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="132" cy="87" r="12" fill="hsl(25,55%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="168" cy="85" r="12" fill="hsl(25,55%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="204" cy="87" r="12" fill="hsl(25,55%,62%)" stroke="#234832" stroke-width="2.5"/>
<path d="M64 146 c 12 -16 34 -12 36 4 c 2 16 -16 24 -30 14 c -9 -7 -11 -13 -6 -18 z" fill="hsl(28,55%,58%)" stroke="#234832" stroke-width="2.5"/>
<path d="M150 154 c 12 -16 34 -12 36 4 c 2 16 -16 24 -30 14 c -9 -7 -11 -13 -6 -18 z" fill="hsl(30,55%,55%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="242" cy="146" rx="10" ry="7" fill="hsl(35,55%,55%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="266" cy="158" rx="10" ry="7" fill="hsl(35,55%,55%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="238" cy="166" rx="10" ry="7" fill="hsl(35,55%,55%)" stroke="#234832" stroke-width="2.5"/>`,
  },
  'Oilseed Seeds': {
    hue: 40,
    scene: `
<g transform="translate(112 96)">
${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-50" rx="9" ry="17" transform="rotate(${i * 30})" fill="hsl(46,75%,58%)" stroke="#234832" stroke-width="2.5"/>`).join('')}
<circle r="36" fill="hsl(34,52%,42%)" stroke="#234832" stroke-width="3.5"/>
<circle cx="-14" cy="-10" r="3.5" fill="#234832" opacity=".7"/><circle cx="0" cy="-16" r="3.5" fill="#234832" opacity=".7"/><circle cx="14" cy="-8" r="3.5" fill="#234832" opacity=".7"/>
<circle cx="-8" cy="6" r="3.5" fill="#234832" opacity=".7"/><circle cx="8" cy="4" r="3.5" fill="#234832" opacity=".7"/><circle cx="0" cy="16" r="3.5" fill="#234832" opacity=".7"/>
<path d="M0 36 V72" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 56 C 18 54 26 42 22 32 C 8 34 1 46 0 56 Z" fill="hsl(110,42%,42%)"/>
</g>
<ellipse cx="212" cy="84" rx="7" ry="5" transform="rotate(20 212 84)" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="244" cy="102" rx="7" ry="5" transform="rotate(-14 244 102)" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="272" cy="82" rx="7" ry="5" transform="rotate(34 272 82)" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="224" cy="126" rx="7" ry="5" transform="rotate(-30 224 126)" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="258" cy="140" rx="6" ry="4.5" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>
<ellipse cx="282" cy="118" rx="6" ry="4.5" fill="hsl(45,62%,52%)" stroke="#234832" stroke-width="2"/>`,
  },
  'Fruit and Melon Seeds': {
    hue: 5,
    scene: `
<circle cx="72" cy="118" r="32" fill="hsl(95,45%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M72 88 q -10 30 0 60 M52 94 q -8 24 0 48 M92 94 q 8 24 0 48" stroke="hsl(125,40%,34%)" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M114 158 A66 66 0 0 1 250 158" fill="none" stroke="hsl(115,42%,36%)" stroke-width="13" stroke-linecap="round"/>
<path d="M122 156 A58 58 0 0 1 242 156 Z" fill="hsl(5,72%,66%)" stroke="#234832" stroke-width="3"/>
<ellipse cx="156" cy="134" rx="4" ry="6" transform="rotate(-18 156 134)" fill="#3a2b20"/>
<ellipse cx="184" cy="120" rx="4" ry="6" fill="#3a2b20"/>
<ellipse cx="212" cy="132" rx="4" ry="6" transform="rotate(18 212 132)" fill="#3a2b20"/>
<ellipse cx="172" cy="146" rx="4" ry="6" fill="#3a2b20"/>
<ellipse cx="204" cy="148" rx="4" ry="6" fill="#3a2b20"/>`,
  },
  'Fibre and Commercial Crop Seeds': {
    hue: 160,
    scene: `
<path d="M52 170 Q118 122 172 112 Q234 100 276 58" stroke="#234832" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<path d="M126 130 C 148 112 176 114 190 132 C 168 148 140 146 126 130 Z" fill="hsl(160,42%,44%)" stroke="#234832" stroke-width="3"/>
<path d="M198 92 C 214 74 240 72 254 84 C 240 102 214 104 198 92 Z" fill="hsl(160,42%,44%)" stroke="#234832" stroke-width="3"/>
<g transform="translate(122 118)">
<circle cx="-11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<circle cx="11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<circle cx="0" cy="-10" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<path d="M0 14 l-11 16 M0 14 l11 16 M0 14 v18" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
</g>
<g transform="translate(208 92) scale(.9)">
<circle cx="-11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<circle cx="11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<circle cx="0" cy="-10" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3"/>
<path d="M0 14 l-11 16 M0 14 l11 16 M0 14 v18" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
</g>
<g transform="translate(272 56) scale(.75)">
<circle cx="-11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3.5"/>
<circle cx="11" cy="2" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3.5"/>
<circle cx="0" cy="-10" r="13" fill="#fffdf2" stroke="#234832" stroke-width="3.5"/>
<path d="M0 14 l-11 16 M0 14 l11 16 M0 14 v18" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
</g>`,
  },
  'Hybrid Seeds': {
    hue: 265,
    scene: `
<rect x="44" y="58" width="86" height="106" rx="8" fill="hsl(265,35%,90%)" stroke="#234832" stroke-width="3.5"/>
<rect x="44" y="58" width="86" height="24" rx="8" fill="#234832" opacity=".85"/>
<rect x="56" y="94" width="62" height="50" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<path d="M87 132 V112 M87 118 C 75 118 71 108 74 100 C 84 102 87 110 87 118 Z M87 112 C 99 112 103 102 100 94 C 90 96 87 104 87 112 Z" fill="hsl(265,55%,52%)" stroke="hsl(265,55%,52%)" stroke-width="3" stroke-linecap="round"/>
<circle cx="176" cy="78" r="19" fill="#234832"/>
<path d="M176 68 v20 M166 78 h20" stroke="#f3ead6" stroke-width="4.5" stroke-linecap="round"/>
<g transform="translate(248 162)"><path d="M0 0 V-56" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -30 C -20 -30 -27 -44 -23 -54 C -9 -52 -1 -40 0 -30 Z" fill="hsl(110,45%,42%)"/>
<path d="M0 -38 C 20 -40 27 -54 23 -64 C 9 -62 1 -50 0 -38 Z" fill="hsl(110,52%,36%)"/>
<path d="M0 -56 C -14 -60 -16 -72 -10 -78 C -2 -72 0 -64 0 -56 Z" fill="hsl(110,45%,42%)"/>
</g>
<path d="M212 52 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="hsl(265,65%,60%)"/>
<path d="M276 74 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 z" fill="hsl(265,65%,60%)"/>`,
  },
  'Organic and Traditional Seeds': {
    hue: 120,
    scene: `
<path d="M96 96 C 88 140 102 166 132 166 C 162 166 176 140 168 96 Z" fill="hsl(18,46%,58%)" stroke="#234832" stroke-width="3.5"/>
<rect x="86" y="82" width="92" height="20" rx="10" fill="hsl(18,52%,48%)" stroke="#234832" stroke-width="3.5"/>
<path d="M104 120 h56" stroke="#234832" stroke-width="2.5" opacity=".5"/>
<circle cx="188" cy="96" r="6" fill="hsl(45,58%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="208" cy="110" r="6" fill="hsl(45,58%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="224" cy="126" r="6" fill="hsl(45,58%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="196" cy="128" r="5" fill="hsl(45,58%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="214" cy="146" r="5" fill="hsl(45,58%,55%)" stroke="#234832" stroke-width="2"/>
<g transform="translate(258 164)">
<path d="M0 0 V-52" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -28 C -18 -28 -25 -40 -21 -50 C -9 -48 -1 -38 0 -28 Z" fill="hsl(120,45%,42%)"/>
<path d="M0 -36 C 18 -38 25 -50 21 -60 C 9 -58 1 -48 0 -36 Z" fill="hsl(120,52%,36%)"/>
<path d="M0 -52 C -12 -56 -14 -66 -8 -72 C -1 -67 0 -60 0 -52 Z" fill="hsl(120,45%,42%)"/>
</g>`,
  },

  // ---------------- Pesticides (illustrative demo products) ----------------
  Insecticides: {
    hue: 210,
    scene: `
<g transform="translate(96 160)"><path d="M0 0 V-44" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -22 C -20 -22 -27 -36 -23 -46 C -9 -44 -1 -32 0 -22 Z" fill="hsl(110,45%,42%)"/>
<path d="M0 -32 C 20 -34 27 -48 23 -58 C 9 -56 1 -44 0 -32 Z" fill="hsl(110,52%,36%)"/>
</g>
<rect x="196" y="76" width="62" height="96" rx="10" fill="hsl(210,55%,54%)" stroke="#234832" stroke-width="3.5"/>
<rect x="214" y="62" width="26" height="16" rx="3" fill="#234832"/>
<rect x="208" y="44" width="36" height="16" rx="5" fill="#234832"/>
<path d="M244 50 h16" stroke="#234832" stroke-width="5" stroke-linecap="round"/>
<rect x="206" y="98" width="42" height="44" rx="5" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<path d="M227 106 l11 4 v9 c0 7 -5 13 -11 15 c-6 -2 -11 -8 -11 -15 v-9 z" fill="hsl(210,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="176" cy="66" r="4" fill="hsl(210,75%,58%)" opacity=".9"/>
<circle cx="158" cy="56" r="3.5" fill="hsl(210,75%,58%)" opacity=".85"/>
<circle cx="142" cy="62" r="3" fill="hsl(210,75%,58%)" opacity=".8"/>
<circle cx="166" cy="80" r="3" fill="hsl(210,75%,58%)" opacity=".8"/>
<circle cx="150" cy="86" r="2.5" fill="hsl(210,75%,58%)" opacity=".75"/>`,
  },
  'Herbicides (Weed Killers)': {
    hue: 145,
    scene: `
<g transform="translate(112 158)">
<path d="M0 0 C -6 -34 -4 -52 6 -66" stroke="hsl(100,45%,38%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M0 0 C -18 -26 -28 -40 -40 -48" stroke="hsl(100,45%,38%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M0 0 C 12 -30 24 -44 38 -52" stroke="hsl(100,45%,38%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M0 0 C -10 -40 -6 -58 2 -72" stroke="hsl(100,50%,32%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M0 0 C 20 -22 34 -32 50 -36" stroke="hsl(100,50%,32%)" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>
<path d="M66 74 L158 158 M158 74 L66 158" stroke="hsl(4,68%,50%)" stroke-width="8" stroke-linecap="round"/>
<g transform="translate(240 158)"><path d="M0 0 V-40" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -20 C -18 -20 -25 -32 -21 -42 C -9 -40 -1 -30 0 -20 Z" fill="hsl(145,48%,40%)"/>
<path d="M0 -28 C 18 -30 25 -42 21 -52 C 9 -50 1 -40 0 -28 Z" fill="hsl(145,55%,34%)"/>
</g>
<circle cx="196" cy="62" r="3.5" fill="hsl(145,70%,48%)" opacity=".9"/>
<circle cx="212" cy="50" r="3" fill="hsl(145,70%,48%)" opacity=".85"/>
<circle cx="184" cy="46" r="2.5" fill="hsl(145,70%,48%)" opacity=".8"/>`,
  },
  Fungicides: {
    hue: 280,
    scene: `
<rect x="66" y="66" width="60" height="104" rx="12" fill="hsl(280,48%,56%)" stroke="#234832" stroke-width="3.5"/>
<rect x="84" y="50" width="24" height="18" rx="3" fill="#234832"/>
<rect x="76" y="92" width="40" height="46" rx="5" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<circle cx="96" cy="112" r="7" fill="hsl(280,55%,62%)" stroke="#234832" stroke-width="2"/>
<path d="M88 126 h16" stroke="#234832" stroke-width="2.5" stroke-linecap="round"/>
<path d="M156 148 C 168 96 216 66 276 66 C 272 124 236 158 178 156 C 166 155 158 153 156 148 Z" fill="hsl(118,45%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M170 146 C 204 120 240 96 270 76" stroke="#234832" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M226 84 l9 8 16 -19" stroke="#f3ead6" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M234 70 l18 -4 18 12 v16 c0 12 -9 22 -18 26 c-10 -4 -18 -14 -18 -26 v-16 z" fill="#234832" opacity=".92" transform="translate(-8 6) scale(.62) translate(150 60)"/>`,
  },
  Bactericides: {
    hue: 195,
    scene: `
<rect x="60" y="70" width="82" height="100" rx="14" fill="hsl(195,50%,52%)" stroke="#234832" stroke-width="3.5"/>
<rect x="82" y="54" width="38" height="18" rx="4" fill="#234832"/>
<path d="M142 92 c 26 0 26 40 0 40" stroke="#234832" stroke-width="7" fill="none"/>
<rect x="72" y="96" width="58" height="50" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<rect x="86" y="110" width="30" height="13" rx="6.5" transform="rotate(-30 101 116)" fill="hsl(350,60%,60%)"/>
<rect x="86" y="110" width="15" height="13" rx="6.5" transform="rotate(-30 101 116)" fill="hsl(195,60%,50%)"/>
<path d="M166 150 C 176 96 224 62 284 62 C 280 116 246 152 190 154 C 176 154 168 154 166 150 Z" fill="#f7f4e6" stroke="#234832" stroke-width="3.5"/>
<path d="M180 146 C 212 120 246 96 276 74" stroke="#234832" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="204" y="92" width="26" height="10" rx="5" transform="rotate(-24 217 97)" fill="hsl(195,65%,48%)" stroke="#234832" stroke-width="2"/>
<rect x="238" y="108" width="26" height="10" rx="5" transform="rotate(16 251 113)" fill="hsl(195,65%,48%)" stroke="#234832" stroke-width="2"/>
<rect x="212" y="124" width="22" height="9" rx="4.5" transform="rotate(-8 223 128)" fill="hsl(195,65%,48%)" stroke="#234832" stroke-width="2"/>`,
  },
  Nematicides: {
    hue: 15,
    scene: `
<rect x="36" y="112" width="248" height="64" fill="hsl(24,36%,52%)" opacity=".55"/>
<path d="M36 112 H284" stroke="#234832" stroke-width="3.5"/>
<g transform="translate(160 112)">
<path d="M0 0 V-52" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -26 C -18 -26 -25 -38 -21 -48 C -9 -46 -1 -36 0 -26 Z" fill="hsl(110,45%,42%)"/>
<path d="M0 -36 C 18 -38 25 -50 21 -60 C 9 -58 1 -48 0 -36 Z" fill="hsl(110,52%,36%)"/>
<path d="M0 4 C -8 22 -20 34 -40 44 M0 4 C 8 24 22 36 44 44 M0 4 V56" stroke="#234832" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</g>
<path d="M74 142 q 9 -9 18 0 q 9 9 18 0 q 9 -9 18 0" stroke="hsl(15,70%,52%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M180 152 q 9 -9 18 0 q 9 9 18 0 q 9 -9 18 0" stroke="hsl(15,70%,52%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M84 122 l24 24 M108 122 l-24 24" stroke="hsl(4,65%,48%)" stroke-width="5" stroke-linecap="round"/>
<circle cx="252" cy="146" r="11" fill="hsl(15,70%,62%)" stroke="#234832" stroke-width="2.5"/>
<path d="M247 141 l10 10 M257 141 l-10 10" stroke="hsl(4,65%,48%)" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  'Acaricides (Mite Killers)': {
    hue: 330,
    scene: `
<path d="M54 164 C 66 108 128 76 208 78 C 204 140 160 172 96 170 C 74 169 58 168 54 164 Z" fill="hsl(118,44%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M70 162 C 112 132 158 106 200 88" stroke="#234832" stroke-width="3" fill="none" stroke-linecap="round"/>
<g transform="translate(150 76)">
<circle r="30" fill="hsl(330,35%,72%)" stroke="#234832" stroke-width="3.5"/>
<circle cx="-12" cy="-8" r="3.5" fill="#234832" opacity=".55"/><circle cx="6" cy="-12" r="3.5" fill="#234832" opacity=".55"/><circle cx="12" cy="6" r="3.5" fill="#234832" opacity=".55"/><circle cx="-6" cy="12" r="3.5" fill="#234832" opacity=".55"/>
<path d="M-26 -14 L-44 -26 M-29 -4 L-50 -6 M-27 8 L-46 18 M-20 22 L-32 36" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
<path d="M26 -14 L44 -26 M29 -4 L50 -6 M27 8 L46 18 M20 22 L32 36" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
<path d="M-8 -28 L-14 -42 M8 -28 L14 -42" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
</g>
<path d="M112 38 L190 114 M190 38 L112 114" stroke="hsl(4,68%,50%)" stroke-width="7" stroke-linecap="round"/>
<rect x="246" y="118" width="30" height="52" rx="7" fill="hsl(330,55%,58%)" stroke="#234832" stroke-width="3"/>
<rect x="254" y="108" width="14" height="12" rx="2" fill="#234832"/>
<circle cx="238" cy="64" r="3.5" fill="hsl(330,70%,58%)" opacity=".9"/>
<circle cx="252" cy="52" r="3" fill="hsl(330,70%,58%)" opacity=".85"/>`,
  },
  'Rodenticides (Rat Killers)': {
    hue: 240,
    scene: `
<rect x="42" y="98" width="136" height="72" rx="8" fill="hsl(240,45%,58%)" stroke="#234832" stroke-width="3.5"/>
<path d="M42 120 H178" stroke="#234832" stroke-width="3"/>
<circle cx="74" cy="142" r="14" fill="#234832"/>
<rect x="120" y="106" width="44" height="8" rx="4" fill="#234832" opacity=".6"/>
<g transform="translate(236 142)">
<ellipse rx="36" ry="21" fill="hsl(225,12%,62%)" stroke="#234832" stroke-width="3.5"/>
<circle cx="30" cy="-14" r="14" fill="hsl(225,12%,62%)" stroke="#234832" stroke-width="3.5"/>
<circle cx="24" cy="-26" r="6.5" fill="hsl(225,12%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="35" cy="-16" r="2.5" fill="#234832"/>
<path d="M-34 6 q -26 14 -58 4" stroke="#234832" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M44 -12 h12 M44 -8 h12" stroke="#234832" stroke-width="2" stroke-linecap="round"/>
</g>
<rect x="192" y="176" width="22" height="9" rx="4.5" fill="hsl(240,55%,66%)" stroke="#234832" stroke-width="2"/>
<rect x="222" y="178" width="22" height="9" rx="4.5" fill="hsl(240,55%,66%)" stroke="#234832" stroke-width="2"/>
<rect x="252" y="176" width="22" height="9" rx="4.5" fill="hsl(240,55%,66%)" stroke="#234832" stroke-width="2"/>`,
  },
  'Molluscicides (Snail and Slug Killers)': {
    hue: 80,
    scene: `
<path d="M46 168 C 60 128 122 106 210 112 C 254 116 276 130 282 146 C 244 176 150 184 84 178 C 62 176 50 173 46 168 Z" fill="hsl(105,45%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M64 168 C 120 148 180 134 246 132" stroke="#234832" stroke-width="2.5" fill="none" opacity=".6"/>
<g transform="translate(148 116)">
<circle r="34" fill="hsl(36,48%,60%)" stroke="#234832" stroke-width="3.5"/>
<circle r="22" fill="none" stroke="#234832" stroke-width="3"/>
<circle r="11" fill="none" stroke="#234832" stroke-width="3"/>
<circle r="3" fill="#234832"/>
</g>
<path d="M118 142 C 112 162 128 174 154 172 L 196 166 C 208 162 208 150 198 146 Z" fill="hsl(45,55%,62%)" stroke="#234832" stroke-width="3.5"/>
<path d="M196 146 V126 M186 146 V130" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
<circle cx="196" cy="122" r="3.5" fill="#234832"/><circle cx="186" cy="126" r="3.5" fill="#234832"/>
<path d="M232 168 C 226 158 236 150 254 152 C 272 154 280 162 274 168 Z" fill="hsl(45,52%,58%)" stroke="#234832" stroke-width="3"/>
<rect x="66" y="84" width="22" height="9" rx="4.5" fill="hsl(80,55%,58%)" stroke="#234832" stroke-width="2"/>
<rect x="96" y="74" width="22" height="9" rx="4.5" fill="hsl(80,55%,58%)" stroke="#234832" stroke-width="2"/>`,
  },
  'Bio-Pesticides': {
    hue: 110,
    scene: `
<path d="M118 40 h30 v34 L196 146 a12 12 0 0 1 -10 18 H74 a12 12 0 0 1 -10 -18 L118 74 Z" fill="#fdfcf3" stroke="#234832" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M96 126 L168 126 L196 146 a12 12 0 0 1 -10 18 H74 a12 12 0 0 1 -10 -18 Z" fill="hsl(110,50%,58%)" opacity=".9"/>
<path d="M112 40 h42" stroke="#234832" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="112" cy="142" r="6" fill="#fdfcf3" opacity=".9"/>
<circle cx="134" cy="132" r="5" fill="#fdfcf3" opacity=".9"/>
<circle cx="124" cy="154" r="4" fill="#fdfcf3" opacity=".9"/>
<g transform="translate(236 74)">
<circle r="16" fill="hsl(110,52%,60%)" stroke="#234832" stroke-width="3"/>
<circle cx="-5" cy="-4" r="3" fill="#234832" opacity=".6"/><circle cx="5" cy="3" r="3" fill="#234832" opacity=".6"/>
<path d="M0 -16 v-8 M0 16 v8 M-16 0 h-8 M16 0 h8" stroke="#234832" stroke-width="3" stroke-linecap="round"/>
</g>
<g transform="translate(266 118) scale(.75)">
<circle r="16" fill="hsl(110,52%,60%)" stroke="#234832" stroke-width="3.5"/>
<circle cx="-5" cy="-4" r="3.5" fill="#234832" opacity=".6"/><circle cx="5" cy="3" r="3.5" fill="#234832" opacity=".6"/>
<path d="M0 -16 v-9 M0 16 v9 M-16 0 h-9 M16 0 h9" stroke="#234832" stroke-width="3.5" stroke-linecap="round"/>
</g>
<g transform="translate(228 138) scale(.6)">
<circle r="16" fill="hsl(110,52%,60%)" stroke="#234832" stroke-width="4.5"/>
<path d="M0 -16 v-10 M0 16 v10 M-16 0 h-10 M16 0 h10" stroke="#234832" stroke-width="5" stroke-linecap="round"/>
</g>
<path d="M244 158 C 252 148 266 146 276 152 C 270 164 256 168 244 158 Z" fill="hsl(110,45%,45%)" stroke="#234832" stroke-width="2.5"/>`,
  },
  'Seed Treatment Pesticides': {
    hue: 175,
    scene: `
<rect x="238" y="66" width="56" height="98" rx="7" fill="hsl(175,50%,55%)" stroke="#234832" stroke-width="3.5"/>
<rect x="238" y="66" width="56" height="20" rx="7" fill="#234832" opacity=".85"/>
<rect x="246" y="96" width="40" height="40" rx="5" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<circle cx="258" cy="110" r="4.5" fill="hsl(345,60%,62%)" stroke="#234832" stroke-width="1.5"/>
<circle cx="272" cy="120" r="4.5" fill="hsl(345,60%,62%)" stroke="#234832" stroke-width="1.5"/>
<path d="M76 122 a74 42 0 0 0 148 0 Z" fill="hsl(175,30%,62%)" stroke="#234832" stroke-width="3.5"/>
<path d="M64 122 h172" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="112" cy="110" rx="13" ry="10" fill="hsl(345,62%,66%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="144" cy="100" rx="13" ry="10" fill="hsl(345,62%,66%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="176" cy="106" rx="13" ry="10" fill="hsl(345,62%,66%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="146" cy="116" rx="13" ry="10" fill="hsl(345,62%,66%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="208" cy="114" rx="12" ry="9" fill="hsl(45,50%,72%)" stroke="#234832" stroke-width="2.5"/>
<ellipse cx="86" cy="116" rx="12" ry="9" fill="hsl(45,50%,72%)" stroke="#234832" stroke-width="2.5"/>
<path d="M96 44 c 10 12 16 20 16 27 a16 16 0 0 1 -32 0 c0 -7 6 -15 16 -27 z" fill="hsl(345,62%,70%)" stroke="#234832" stroke-width="2.5"/>`,
  },

  // ---------------- Fertilizers ----------------
  'Organic Fertilizers': {
    hue: 90,
    scene: `
<path d="M56 164 Q100 88 160 88 Q222 88 266 164 Z" fill="hsl(30,38%,50%)" stroke="#234832" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M78 150 Q118 112 160 110" stroke="hsl(30,30%,38%)" stroke-width="3" fill="none" opacity=".7"/>
<path d="M104 134 C 116 122 134 122 144 132 C 132 144 114 144 104 134 Z" fill="hsl(95,46%,44%)" stroke="#234832" stroke-width="2.5"/>
<path d="M166 116 C 178 104 196 104 206 114 C 194 126 176 126 166 116 Z" fill="hsl(95,46%,44%)" stroke="#234832" stroke-width="2.5"/>
<path d="M132 152 q 16 -18 40 -10" stroke="hsl(45,72%,54%)" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M186 148 q 14 -14 34 -8" stroke="hsl(20,60%,52%)" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M96 160 h44" stroke="hsl(30,30%,36%)" stroke-width="5" stroke-linecap="round" opacity=".8"/>
<path d="M198 158 q 9 -8 18 0 q 9 8 18 0" stroke="hsl(8,55%,55%)" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M160 88 C 156 72 164 60 178 58 C 180 72 172 84 160 88 Z" fill="hsl(95,46%,44%)" stroke="#234832" stroke-width="2.5"/>
<path d="M160 88 C 144 84 136 72 140 60 C 154 62 160 74 160 88 Z" fill="hsl(95,52%,38%)" stroke="#234832" stroke-width="2.5"/>`,
  },
  'Chemical Fertilizers': {
    hue: 205,
    scene: `
<rect x="94" y="50" width="132" height="118" rx="12" fill="hsl(205,50%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M94 74 h132" stroke="#234832" stroke-width="3"/>
<path d="M104 50 q 16 12 32 0 q 16 12 32 0 q 16 12 32 0" fill="hsl(205,55%,42%)" stroke="hsl(205,55%,42%)" stroke-width="4" stroke-linecap="round"/>
<rect x="114" y="88" width="92" height="54" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<circle cx="134" cy="115" r="6" fill="hsl(205,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="154" cy="108" r="6" fill="hsl(205,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="174" cy="115" r="6" fill="hsl(205,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="148" cy="126" r="6" fill="hsl(205,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="168" cy="130" r="6" fill="hsl(205,60%,50%)" stroke="#234832" stroke-width="2"/>
<circle cx="246" cy="152" r="7" fill="hsl(205,58%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="266" cy="164" r="7" fill="hsl(205,58%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="248" cy="172" r="6" fill="hsl(205,58%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="74" cy="156" r="7" fill="hsl(205,58%,62%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="60" cy="170" r="6" fill="hsl(205,58%,62%)" stroke="#234832" stroke-width="2.5"/>`,
  },
  Biofertilizers: {
    hue: 130,
    scene: `
<rect x="36" y="118" width="248" height="58" fill="hsl(24,36%,52%)" opacity=".5"/>
<path d="M36 118 H284" stroke="#234832" stroke-width="3.5"/>
<g transform="translate(160 118)">
<path d="M0 0 V-56" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<path d="M0 -28 C -20 -28 -27 -40 -23 -50 C -9 -48 -1 -38 0 -28 Z" fill="hsl(130,45%,42%)"/>
<path d="M0 -38 C 20 -40 27 -52 23 -62 C 9 -60 1 -50 0 -38 Z" fill="hsl(130,52%,36%)"/>
<path d="M0 4 C -8 24 -22 36 -44 44 M0 4 C 8 26 24 38 46 44 M0 4 V52" stroke="#234832" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</g>
<circle cx="132" cy="142" r="8" fill="hsl(130,52%,50%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="186" cy="138" r="8" fill="hsl(130,52%,50%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="160" cy="150" r="7" fill="hsl(130,52%,50%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="114" cy="156" r="7" fill="hsl(130,52%,50%)" stroke="#234832" stroke-width="2.5"/>
<circle cx="206" cy="154" r="7" fill="hsl(130,52%,50%)" stroke="#234832" stroke-width="2.5"/>
<rect x="52" y="64" width="44" height="46" rx="8" fill="hsl(130,45%,62%)" stroke="#234832" stroke-width="3"/>
<rect x="62" y="52" width="24" height="14" rx="3" fill="#234832"/>
<circle cx="74" cy="88" r="9" fill="#fdfcf3" stroke="#234832" stroke-width="2.5"/>
<circle cx="254" cy="70" r="20" fill="#234832"/>
<path d="M245 70 l6 7 12 -14" stroke="#f3ead6" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'Nitrogen Fertilizers': { hue: 220, scene: '' },
  'Phosphorus Fertilizers': { hue: 30, scene: '' },
  'Potassium Fertilizers': { hue: 345, scene: '' },
  'NPK Fertilizers': { hue: 255, scene: '' },
  'Micronutrient Fertilizers': {
    hue: 50,
    scene: `
<rect x="112" y="58" width="96" height="108" rx="9" fill="hsl(50,55%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M112 82 h96" stroke="#234832" stroke-width="3"/>
<path d="M124 58 q 12 10 24 0 q 12 10 24 0 q 12 10 24 0" fill="hsl(50,60%,44%)" stroke="hsl(50,60%,44%)" stroke-width="4" stroke-linecap="round"/>
<rect x="126" y="96" width="68" height="52" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<circle cx="160" cy="122" r="14" fill="none" stroke="#234832" stroke-width="2.5"/>
<circle cx="146" cy="134" r="8" fill="none" stroke="#234832" stroke-width="2.5"/>
<circle cx="176" cy="134" r="8" fill="none" stroke="#234832" stroke-width="2.5"/>
<circle cx="72" cy="84" r="19" fill="#fdfcf3" stroke="#234832" stroke-width="3"/>
<text x="72" y="89" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="bold" fill="#234832">Zn</text>
<circle cx="66" cy="136" r="19" fill="#fdfcf3" stroke="#234832" stroke-width="3"/>
<text x="66" y="141" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="bold" fill="#234832">Fe</text>
<circle cx="256" cy="96" r="19" fill="#fdfcf3" stroke="#234832" stroke-width="3"/>
<text x="256" y="101" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="bold" fill="#234832">B</text>
<circle cx="240" cy="142" r="5" fill="hsl(50,65%,52%)" stroke="#234832" stroke-width="2"/>
<circle cx="264" cy="156" r="5" fill="hsl(50,65%,52%)" stroke="#234832" stroke-width="2"/>
<circle cx="248" cy="168" r="4" fill="hsl(50,65%,52%)" stroke="#234832" stroke-width="2"/>`,
  },
  'Water-Soluble Fertilizers': {
    hue: 190,
    scene: `
<path d="M132 54 L142 158 a10 10 0 0 0 10 8 h44 a10 10 0 0 0 10 -8 L216 54 Z" fill="#ffffff" fill-opacity=".55" stroke="#234832" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M142 104 L148 156 a10 10 0 0 0 10 8 h36 a10 10 0 0 0 10 -8 L206 104 Z" fill="hsl(190,58%,74%)"/>
<path d="M132 54 h84" stroke="#234832" stroke-width="4" stroke-linecap="round"/>
<circle cx="164" cy="136" r="6" fill="#ffffff" opacity=".95"/>
<circle cx="184" cy="122" r="5" fill="#ffffff" opacity=".95"/>
<circle cx="172" cy="110" r="4" fill="#ffffff" opacity=".95"/>
<circle cx="190" cy="94" r="4.5" fill="#ffffff" opacity=".9"/>
<circle cx="158" cy="150" r="5" fill="#ffffff" opacity=".95"/>
<circle cx="176" cy="70" r="4" fill="hsl(190,60%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="150" cy="84" r="4" fill="hsl(190,60%,55%)" stroke="#234832" stroke-width="2"/>
<circle cx="196" cy="40" r="4" fill="hsl(190,60%,55%)" stroke="#234832" stroke-width="2"/>
<path d="M74 74 c 12 15 19 24 19 32 a19 19 0 0 1 -38 0 c0 -8 7 -17 19 -32 z" fill="hsl(190,62%,58%)" stroke="#234832" stroke-width="3"/>
<path d="M244 96 c 10 12 15 19 15 26 a15 15 0 0 1 -30 0 c0 -7 5 -14 15 -26 z" fill="hsl(190,62%,58%)" stroke="#234832" stroke-width="3"/>`,
  },
  'Slow-Release Fertilizers': {
    hue: 100,
    scene: `
<g transform="translate(112 92)">
<circle r="26" fill="hsl(100,45%,54%)" stroke="#234832" stroke-width="3.5"/>
<circle r="14" fill="hsl(45,55%,74%)" stroke="#234832" stroke-width="2.5"/>
</g>
<g transform="translate(174 74)">
<circle r="22" fill="hsl(100,45%,54%)" stroke="#234832" stroke-width="3.5"/>
<circle r="12" fill="hsl(45,55%,74%)" stroke="#234832" stroke-width="2.5"/>
</g>
<g transform="translate(234 96)">
<circle r="24" fill="hsl(100,45%,54%)" stroke="#234832" stroke-width="3.5"/>
<circle r="13" fill="hsl(45,55%,74%)" stroke="#234832" stroke-width="2.5"/>
</g>
<g transform="translate(140 146)">
<circle r="20" fill="hsl(100,45%,54%)" stroke="#234832" stroke-width="3.5"/>
<circle r="11" fill="hsl(45,55%,74%)" stroke="#234832" stroke-width="2.5"/>
</g>
<g transform="translate(198 142)">
<circle r="23" fill="hsl(100,45%,54%)" stroke="#234832" stroke-width="3.5"/>
<circle r="12.5" fill="hsl(45,55%,74%)" stroke="#234832" stroke-width="2.5"/>
</g>
<circle cx="262" cy="146" r="22" fill="#fffbe9" stroke="#234832" stroke-width="3.5"/>
<path d="M262 146 V132 M262 146 l11 6" stroke="#234832" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="262" cy="146" r="3" fill="#234832"/>`,
  },
};

/** Nitrogen / Phosphorus / Potassium / NPK — a consistent sack family where
    the letter and hue identify each nutrient (drawn after the map above). */
function nutrientSack(letter, hue, letterSize) {
  const granules = [
    [246, 152],
    [266, 164],
    [248, 172],
    [74, 156],
    [60, 170],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="7" fill="hsl(${hue},58%,62%)" stroke="#234832" stroke-width="2.5"/>`
    )
    .join('');
  return `
<rect x="94" y="50" width="132" height="118" rx="12" fill="hsl(${hue},50%,56%)" stroke="#234832" stroke-width="3.5"/>
<path d="M94 74 h132" stroke="#234832" stroke-width="3"/>
<path d="M104 50 q 16 12 32 0 q 16 12 32 0 q 16 12 32 0" fill="hsl(${hue},55%,42%)" stroke="hsl(${hue},55%,42%)" stroke-width="4" stroke-linecap="round"/>
<rect x="114" y="86" width="92" height="58" rx="6" fill="#fffbe9" stroke="#234832" stroke-width="2.5"/>
<text x="160" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="${letterSize}" font-weight="bold" fill="#234832">${letter}</text>
${granules}`;
}
SUB_TILES['Nitrogen Fertilizers'].scene = nutrientSack('N', 220, 46);
SUB_TILES['Phosphorus Fertilizers'].scene = nutrientSack('P', 30, 46);
SUB_TILES['Potassium Fertilizers'].scene = nutrientSack('K', 345, 46);
SUB_TILES['NPK Fertilizers'].scene = nutrientSack('NPK', 255, 27);

/** Small forest-green group pill (Seeds / Pesticides / Fertilizers) in the
    top-right corner — keeps the 28 tiles visually cohesive without making
    them share the same artwork. */
function groupPill(group) {
  const w = group.length * 7.4 + 22;
  const x = 302 - w;
  return `<rect x="${x}" y="14" width="${w}" height="23" rx="11.5" fill="#234832" opacity=".92"/>
<text x="${x + w / 2}" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#f3ead6" letter-spacing=".4">${group}</text>`;
}

function subcategorySvg(name) {
  const tile = SUB_TILES[name];
  if (!tile || !tile.scene) throw new Error(`Missing scene config for subcategory: ${name}`);
  const { hue } = tile;
  const group = taxonomy.MAIN_CATEGORIES.find((t) => taxonomy.SUBCATEGORIES[t].includes(name));
  if (!group) throw new Error(`Subcategory not found in taxonomy: ${name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${name} demo illustration">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(90,25%,95%)"/><stop offset="1" stop-color="hsl(45,40%,91%)"/></linearGradient></defs>
<rect width="320" height="200" rx="18" fill="url(#bg)"/>
<path d="M0 170 Q160 144 320 170 V200 H0 Z" fill="hsl(${hue},38%,86%)" opacity=".6"/>
<g>${tile.scene}</g>
${groupPill(group)}
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
  // Safety goggles — wide lens + head strap
  goggles: (h) => `
<rect x="188" y="272" width="70" height="34" rx="10" fill="hsl(${h},50%,38%)"/>
<rect x="542" y="272" width="70" height="34" rx="10" fill="hsl(${h},50%,38%)"/>
<rect x="236" y="216" width="328" height="176" rx="76" fill="hsl(${h},55%,47%)"/>
<rect x="262" y="244" width="276" height="120" rx="52" fill="hsl(${h},60%,86%)" opacity=".85"/>
<path d="M300 350 L360 262 M346 358 L406 262" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity=".7"/>
<path d="M400 392 q 14 22 30 0" fill="hsl(${h},55%,47%)" stroke="none"/>`,
  // Watering can — body, arched handle, spout with rose head
  wateringcan: (h) => `
<path d="M334 232 C 344 168 456 168 466 232" fill="none" stroke="hsl(${h},50%,36%)" stroke-width="16" stroke-linecap="round"/>
<path d="M310 238 H490 L474 418 H326 Z" fill="hsl(${h},55%,47%)" stroke="hsl(${h},55%,38%)" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="400" cy="238" rx="92" ry="17" fill="hsl(${h},60%,38%)"/>
<path d="M314 306 L318 348 L198 292 L208 254 Z" fill="hsl(${h},55%,47%)" stroke="hsl(${h},55%,38%)" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="196" cy="272" rx="28" ry="20" transform="rotate(-26 196 272)" fill="hsl(${h},60%,38%)"/>
<circle cx="168" cy="308" r="7" fill="hsl(${h},65%,58%)" opacity=".85"/>
<circle cx="150" cy="332" r="6" fill="hsl(${h},65%,58%)" opacity=".8"/>
<circle cx="176" cy="344" r="5" fill="hsl(${h},65%,58%)" opacity=".75"/>`,
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
  // Farming Essentials (demo equipment pack-shots)
  { file: 'safety-goggles.svg', caption: 'Safety Goggles', shape: 'goggles', hue: 205 },
  { file: 'watering-can.svg', caption: 'Watering Can 5 L', shape: 'wateringcan', hue: 115 },
  { file: 'measuring-set.svg', caption: 'Garden Measuring Set', shape: 'box', hue: 45 },
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
      if (!SUB_TILES[sub]) throw new Error(`Missing scene config for subcategory: ${sub} (${type})`);
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
