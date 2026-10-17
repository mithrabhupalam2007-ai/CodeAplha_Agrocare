/**
 * One-off helper: download agricultural photos from Wikimedia Commons
 * for the hero + category banners. Any term that fails falls back to a
 * locally generated SVG placeholder, so the site always renders.
 *
 *   node scripts/fetchPhotos.js
 */
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', '..', 'client', 'images');
const CAT_DIR = path.join(IMG_DIR, 'categories');
fs.mkdirSync(CAT_DIR, { recursive: true });

const WANTS = [
  { out: path.join(IMG_DIR, 'hero-field.jpg'), q: 'farmer green crop field agriculture' },
  { out: path.join(CAT_DIR, 'vegetable-seeds.jpg'), q: 'vegetable garden raised beds' },
  { out: path.join(CAT_DIR, 'fruit-seeds.jpg'), q: 'watermelon field farm' },
  { out: path.join(CAT_DIR, 'field-crop-seeds.jpg'), q: 'paddy rice field farmer' },
  { out: path.join(CAT_DIR, 'insecticides.jpg'), q: 'crop spraying farmer field' },
  { out: path.join(CAT_DIR, 'fungicides.jpg'), q: 'agricultural sprayer orchard' },
  { out: path.join(CAT_DIR, 'herbicides.jpg'), q: 'tractor ploughing field' },
  { out: path.join(CAT_DIR, 'fertilizers.jpg'), q: 'compost fertilizer soil hands' },
  { out: path.join(CAT_DIR, 'organic-bio.jpg'), q: 'neem leaves botanical green' },
  { out: path.join(CAT_DIR, 'farming-tools.jpg'), q: 'garden tools hoe spade' },
];

const FALLBACK_SVG = (label, hue) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue},45%,38%)"/><stop offset="1" stop-color="hsl(${hue},50%,24%)"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<g fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3">
<path d="M0 380 Q200 320 400 370 T800 350"/><path d="M0 430 Q200 380 400 420 T800 405"/>
<path d="M120 500 L200 330"/><path d="M400 500 L460 340"/><path d="M640 500 L700 350"/></g>
<circle cx="650" cy="110" r="52" fill="rgba(255,235,180,.85)"/>
<text x="40" y="80" font-family="Georgia,serif" font-size="42" fill="#fff" font-weight="bold">${label}</text>
</svg>`;

async function search(query) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + query)}` +
    '&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*';
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
  for (const { out, q } of WANTS) {
    const label = path.basename(out, '.jpg').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const hue = 90 + (label.length * 17) % 120;
    try {
      const url = await search(q);
      if (!url) throw new Error('no results');
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'AgroShieldDemo/1.0' } });
      if (!imgRes.ok) throw new Error(`download ${imgRes.status}`);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length < 5000) throw new Error('too small');
      fs.writeFileSync(out, buf);
      ok += 1;
      console.log(`ok   ${path.basename(out)} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      fs.writeFileSync(out.replace(/\.jpg$/, '.svg'), FALLBACK_SVG(label, hue));
      fallback += 1;
      console.log(`fallback-svg ${path.basename(out)} (${err.message})`);
    }
  }
  console.log(`done: ${ok} photos, ${fallback} svg fallbacks`);
}

run().catch((e) => {
  console.error('fetch failed:', e.message);
  process.exit(1);
});
