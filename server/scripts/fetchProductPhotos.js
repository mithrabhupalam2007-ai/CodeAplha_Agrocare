/**
 * One-off helper: download a photo for every demo product from
 * Wikimedia Commons, falling back to a generated pack-shot SVG so the
 * catalogue never shows a broken image.
 *
 *   node scripts/fetchProductPhotos.js
 */
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', '..', 'client', 'images', 'products');
fs.mkdirSync(IMG_DIR, { recursive: true });

/** image file name (slug) -> commons search terms (in order of preference) */
const WANTS = [
  ['tomato-hybrid-seed.jpg', ['tomato seeds', 'tomato fruit plant']],
  ['chilli-seed.jpg', ['chilli seeds red', 'red chilli pepper dried']],
  ['okra-seed.jpg', ['okra seeds', 'okra bhindi vegetable']],
  ['spinach-seed.jpg', ['spinach seeds', 'spinach leaves bunch']],
  ['cucumber-seed.jpg', ['cucumber seeds', 'cucumber vegetable']],
  ['watermelon-seed.jpg', ['watermelon seeds', 'watermelon fruit cut']],
  ['muskmelon-seed.jpg', ['muskmelon seeds', 'cantaloupe melon whole']],
  ['papaya-seed.jpg', ['papaya seeds', 'papaya fruit cut']],
  ['strawberry-seed.jpg', ['strawberry seeds', 'strawberry fruit']],
  ['cotton-seed.jpg', ['cotton seeds', 'cotton boll plant']],
  ['paddy-seed.jpg', ['paddy rice seeds', 'rice grains paddy']],
  ['wheat-seed.jpg', ['wheat grains seeds', 'wheat ears field']],
  ['maize-seed.jpg', ['maize seeds corn', 'corn kernels yellow']],
  ['groundnut-seed.jpg', ['groundnut seeds', 'peanuts shelled']],
  ['insecticide-shield.jpg', ['pesticide bottle spray', 'agricultural chemical bottle']],
  ['leaf-guard-spray.jpg', ['knapsack sprayer spraying', 'garden sprayer bottle']],
  ['beat-bug.jpg', ['insecticide spray bottle', 'plant protection spray']],
  ['fungal-shield.jpg', ['fungicide powder', 'agricultural chemicals']],
  ['blight-guard.jpg', ['plant spray bottle agriculture', 'sprayer bottle white']],
  ['weedout-field.jpg', ['herbicide spray bottle', 'agriculture chemical container']],
  ['orchard-cleaner.jpg', ['glyphosate bottle', 'garden chemical spray']],
  ['vermicompost.jpg', ['vermicompost', 'organic compost soil']],
  ['npk-granules.jpg', ['npk fertilizer granules', 'fertilizer granules']],
  ['micronutrient-zinc.jpg', ['zinc fertilizer powder', 'micronutrient fertilizer']],
  ['seagrow-liquid.jpg', ['seaweed extract bottle', 'liquid fertilizer bottle']],
  ['neem-oil.jpg', ['neem oil', 'neem leaves azadirachta']],
  ['trichoderma.jpg', ['trichoderma', 'fungal culture plate']],
  ['botanical-guard.jpg', ['botanical pesticide', 'plant extract bottle']],
  ['garden-hoe.jpg', ['garden hoe tool', 'hoe farming tool']],
  ['knapsack-sprayer.jpg', ['knapsack sprayer', 'backpack sprayer farmer']],
  ['safety-gloves.jpg', ['work gloves', 'gardening gloves']],
  ['respirator-mask.jpg', ['respirator mask', 'dust mask']],
  ['pruning-shears.jpg', ['pruning shears', 'secateurs']],
  ['weed-cutter.jpg', ['sickle tool', 'weeding sickle']],
];

const PACK_SVG = (label, kind, hue) => {
  const shapes = {
    bottle: `<rect x="330" y="210" width="140" height="230" rx="18" fill="hsl(${hue},55%,42%)"/><rect x="365" y="150" width="70" height="70" rx="8" fill="hsl(${hue},50%,32%)"/><rect x="350" y="260" width="100" height="90" rx="6" fill="#fff" opacity=".92"/><text x="400" y="312" text-anchor="middle" font-size="20" font-weight="bold" fill="hsl(${hue},60%,28%)">DEMO</text>`,
    packet: `<rect x="300" y="170" width="200" height="270" rx="12" fill="hsl(${hue},55%,46%)"/><rect x="300" y="170" width="200" height="60" rx="12" fill="hsl(${hue},60%,34%)"/><rect x="320" y="255" width="160" height="120" rx="8" fill="#fdfbe8"/><circle cx="400" cy="315" r="34" fill="hsl(${hue},50%,55%)" opacity=".6"/>`,
    sack: `<path d="M310 200 Q400 160 490 200 L475 430 Q400 455 325 430 Z" fill="hsl(${hue},45%,50%)"/><rect x="330" y="260" width="140" height="90" rx="6" fill="#fff" opacity=".9"/>`,
    tool: `<rect x="290" y="380" width="220" height="26" rx="13" fill="hsl(30,45%,45%)"/><rect x="385" y="180" width="30" height="210" rx="10" fill="hsl(${hue},30%,55%)"/><path d="M330 170 h140 a20 20 0 0 1 0 40 h-140 a20 20 0 0 1 0-40Z" fill="hsl(${hue},55%,40%)"/>`,
  };
  const body = shapes[kind] || shapes.packet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(90,30%,93%)"/><stop offset="1" stop-color="hsl(90,25%,86%)"/></linearGradient>
<ellipse cx="400" cy="462" rx="180" ry="22" fill="rgba(0,0,0,.12)"/></defs>
<rect width="800" height="520" fill="url(#bg)"/>${body}
<text x="400" y="495" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#2f4a26">${label}</text>
</svg>`;
};

const kindFor = (slug, q) => {
  if (/hoe|shears|cutter|sprayer|mask|gloves/.test(slug)) return 'tool';
  if (/oil|bottle|spray|guard|weedout|cleaner|beat-bug|seagrow/.test(slug)) return 'bottle';
  if (/compost|granules|npk|fungal|trichoderma|micronutrient|sack/.test(slug)) return 'sack';
  return 'packet';
};

async function search(query) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + query)}` +
    '&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=900&format=json&origin=*';
  const res = await fetch(url, { headers: { 'User-Agent': 'AgroShieldDemo/1.0 (internship project)' } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const pages = Object.values((json.query && json.query.pages) || {});
  const hit = pages
    .map((p) => p.imageinfo && p.imageinfo[0])
    .find((ii) => ii && ii.thumburl && /jpeg|png/.test(ii.mime || ''));
  return hit ? hit.thumburl : null;
}

async function run() {
  let ok = 0;
  let fallback = 0;
  for (const [file, terms] of WANTS) {
    const out = path.join(IMG_DIR, file);
    const slug = file.replace(/\.jpg$/, '');
    let done = false;
    for (const q of terms) {
      if (done) break;
      try {
        const url = await search(q);
        if (!url) continue;
        const imgRes = await fetch(url, { headers: { 'User-Agent': 'AgroShieldDemo/1.0' } });
        if (!imgRes.ok) continue;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 4000) continue;
        fs.writeFileSync(out, buf);
        done = true;
        ok += 1;
        console.log(`ok   ${file} <- "${q}"`);
      } catch (err) {
        // try the next term
      }
    }
    if (!done) {
      const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const hue = (slug.length * 37) % 360;
      fs.writeFileSync(out.replace(/\.jpg$/, '.svg'), PACK_SVG(label, kindFor(slug), hue));
      fallback += 1;
      console.log(`svg  ${file} (no photo found)`);
    }
  }
  console.log(`done: ${ok} photos, ${fallback} svg pack-shots`);
}

run().catch((e) => {
  console.error('fetch failed:', e.message);
  process.exit(1);
});
