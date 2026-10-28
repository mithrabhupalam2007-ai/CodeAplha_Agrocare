#!/usr/bin/env node
/**
 * One-time catalogue importer (stage 1-6 of the image-import task).
 *
 * Scans the repository-root `images/` folder (the material supplied by the
 * shop owner — it stays untracked and is never moved, renamed or deleted),
 * classifies every image into the seven-category taxonomy and emits:
 *
 *   - server/data/importedProducts.json — committed; `npm run seed` reads it
 *     so the import is reproducible without the source folder
 *   - client/images/products/imported/* — copied image files (originals kept)
 *
 * Rules:
 *   - images are de-duplicated by content hash, then by normalised product
 *     name within the same main category (first copy wins, folder priority
 *     decides, webp/jpeg/avif preferred over converted jxl)
 *   - JPEG XL has no browser support: those 17 files are rendered to PNG
 *     through macOS Quick Look (qlmanage); originals stay untouched
 *   - prices are deterministic whole-rupee values inside the primary
 *     category band; ratings are deterministic 3.5-4.5 in 0.1 steps
 *   - anything unclassifiable lands in the unmatched report instead of
 *     being guessed into a category
 *
 * Run: node server/scripts/importImages.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const taxonomy = require('../utils/taxonomy');
const { PRICE_RANGES } = require('../utils/pricing');

const ROOT = path.resolve(__dirname, '..', '..', 'images');
const OUT_JSON = path.resolve(__dirname, '..', 'data', 'importedProducts.json');
const OUT_IMG = path.resolve(__dirname, '..', '..', 'client', 'images', 'products', 'imported');
const TMP = path.join(require('os').tmpdir(), 'agro-jxl');

if (!fs.existsSync(ROOT)) {
  console.error(`Source folder not found: ${ROOT}`);
  process.exit(1);
}
fs.mkdirSync(OUT_IMG, { recursive: true });
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

/* ------------------------------------------------------------------ *
 * Folder → taxonomy mapping. Keys are matched case-insensitively.
 * `mixed` folders are classified per file-name instead.
 * ------------------------------------------------------------------ */
const CP = 'Crop Protection';
const CN = 'Crop Nutrition';
const AH = 'Animal Husbandry';
const ORG = 'Organic';

const FOLDER_MAP = {
  'crop protection': { mixed: 'CP' },
  'crop nutrition': { mixed: 'CN' },
  mulch: { special: 'mulch' },

  insecticides: { cat: CP, sub: 'Insecticides' },
  herbicides: { cat: CP, sub: 'Herbicides' },
  fungicides: { cat: CP, sub: 'Fungicides' },
  bactericides: { cat: CP, sub: 'Bactericides' },
  'bio insecticides': { cat: CP, sub: 'Bio Insecticides', addl: [ORG] },
  'bio fungicides': { cat: CP, sub: 'Bio Fungicides', addl: [ORG] },
  'bio viricides': { cat: CP, sub: 'Bio Viricides', addl: [ORG] },
  'bio nematicides': { cat: CP, sub: 'Bio Nematicides', addl: [ORG] },
  'pheromone lures': { cat: CP, sub: 'Pheromone Lures' },
  'pheromone traps': { cat: CP, sub: 'Pheromone Traps' },
  'sticky traps': { cat: CP, sub: 'Sticky Traps' },
  'solar light traps': { cat: CP, sub: 'Solar Light Traps' },
  'traps and lures': { mixed: 'CP' },
  'traps and lure': { mixed: 'CP' },

  'chemical fertilizers': { cat: CN, sub: 'Chemical Fertilizers' },
  'micro nutrients': { cat: CN, sub: 'Micro Nutrients' },
  'humic acids': { cat: CN, sub: 'Humic Acids' },
  'ph balancers': { cat: CN, sub: 'pH Balancers' },
  'flower boosters': { cat: CN, sub: 'Flower Boosters' },
  'plant enhancers': { cat: CN, sub: 'Plant Enhancers' },
  'yield boosters': { cat: CN, sub: 'Yield Boosters' },
  'plant growth promoters': { cat: CN, sub: 'Plain Growth Promoters' },
  'bio stimulants': { cat: CN, sub: 'Bio Stimulants', addl: [ORG] },
  'bio:organic fertilizers': { cat: CN, sub: 'Bio/Organic Fertilizers', addl: [ORG] },
  'fruit enhancers': { cat: CN, sub: 'Fruit Enhancers' },

  'vegetable seeds': { cat: 'Seeds', sub: 'Vegetable Seeds' },
  'flower seeds': { cat: 'Seeds', sub: 'Flower Seeds' },
  forages: { cat: 'Seeds', sub: 'Forages' },
  'maize:corn': { cat: 'Seeds', sub: 'Maize/Corn' },
  'fruit seeds': { cat: 'Seeds', sub: 'Fruit Seeds' },
  mustard: { cat: 'Seeds', sub: 'Mustard' },
  paddy: { cat: 'Seeds', sub: 'Paddy' },
  jowar: { cat: 'Seeds', sub: 'Jowar' },
  cotton: { cat: 'Seeds', sub: 'Cotton' },
  exotics: { cat: 'Seeds', sub: 'Exotics' },
  polyhouse: { cat: 'Seeds', sub: 'Polyhouse' },
  'urban garden': { cat: 'Seeds', sub: 'Urban Garden' },

  'brush cutter': { cat: 'Equipments', sub: 'Brush Cutter' },
  'weeder:tiller': { cat: 'Equipments', sub: 'Weeder/Tiller' },
  sprayers: { cat: 'Equipments', sub: 'Sprayers' },
  'chaff cutter and parts': { cat: 'Equipments', sub: 'Chaff Cutter and Parts' },
  'earth augers': { cat: 'Equipments', sub: 'Earth Augers' },
  'chain saw': { cat: 'Equipments', sub: 'Chain Saw' },
  'fruit harvester:plucker': { cat: 'Equipments', sub: 'Fruit Harvester/Plucker' },
  'safety kit': { cat: 'Equipments', sub: 'Safety Kit' },
  'torch:lantern': { cat: 'Equipments', sub: 'Torch/Lantern' },
  'water pump': { cat: 'Equipments', sub: 'Water Pump' },
  pipe: { cat: 'Equipments', sub: 'Pipe' },
  sprinkler: { cat: 'Equipments', sub: 'Sprinkler' },
  'seeder:transplanter': { cat: 'Equipments', sub: 'Seeder/Transplanter' },
  'power reaper': { cat: 'Equipments', sub: 'Power Reaper' },
  'sugarcane machine': { cat: 'Equipments', sub: 'Sugarcane Machine' },
  'rice mill': { cat: 'Equipments', sub: 'Rice Mill' },
  'solar dryer': { cat: 'Equipments', sub: 'Solar Dryer' },
  'crop cover': { cat: 'Equipments', sub: 'Crop Cover' },
  'shade net': { cat: 'Equipments', sub: 'Shade Net' },
  'tripal:tarpauline': { cat: 'Equipments', sub: 'Tarpaulin' },
  'nursery inputs': { cat: 'Equipments', sub: 'Nursery Inputs', classifier: 'nursery' },
  'garden tools': { cat: 'Equipments', sub: 'Garden Tools' },
  'drip kit': { cat: 'Equipments', sub: 'Drip Kit' },

  'cattle feed': { cat: AH, sub: 'Cattle Feed' },
  'cattle supplements': { cat: AH, sub: 'Cattle Supplements' },
  'poultry equipment': { cat: AH, sub: 'Poultry Equipment' },
  'poultry supplements': { cat: AH, sub: 'Poultry Supplements' },
  'calf feeding bottle': { cat: AH, sub: 'Calf Feeding Bottle' },
  'milking machine': { cat: AH, sub: 'Milking Machine', classifier: 'milking' },
  'milking machine accessories': { cat: AH, sub: 'Milking Machine Accessories', classifier: 'milking' },

  'farm implements': { cat: 'Tapas', sub: 'Farm Implements' },
  'mulching sheet': { cat: 'Tapas', sub: 'Mulching Sheet' },
};

/* Catch-all folders: lower priority so specific folders win duplicates. */
const FOLDER_PRIORITY = (folderKey) => {
  if (['urban garden', 'crop protection', 'traps and lures', 'traps and lure', 'crop nutrition', 'nursery inputs', 'milking machine'].includes(folderKey)) return 50;
  if (['mulch'].includes(folderKey)) return 40;
  return 10;
};

/* Per-file classifiers for mixed folders. Order matters: bio before
 * chemical, traps/lures before generic pest control. */
const CP_RULES = [
  { sub: 'Bio Fungicides', addl: [ORG], re: /bio[\s-]?fungicid|trichoderma|bacillus subtilis|pseudomonas|verticillium|sporothrix|bio[\s-]?jodi|alderm|nisarga|sparsha|downy raze|biowrap/i },
  { sub: 'Bio Viricides', addl: [ORG], re: /bio[\s-]?viricid|virus control|anti[\s-]?virus|viro[\s]|\bviro\b|\bviru\b|v[\s-]?bind|viroid/i },
  { sub: 'Bio Nematicides', addl: [ORG], re: /bio[\s-]?nematicid|nema[\s-]?cure|nematode|paecilomyces|perfectnemat/i },
  { sub: 'Bio Insecticides', addl: [ORG], re: /bio[\s-]?(insecticid|pesticid)|neem[\s-]?oil|azadirachtin|nimbecidine|beauveria|heterorhabditis|metarhizium|\bepn\b|thrips raze|bio[\s-]?metaz|almid|magic protector|almite|pecilia/i },
  { sub: 'Bactericides', re: /bactericid|streptomycin|copper oxychloride|blitox|crystocycline|tagmycin|kmycin/i },
  { sub: 'Sticky Traps', re: /sticky trap|sticky sheet/i },
  { sub: 'Solar Light Traps', re: /solar light|light trap/i },
  { sub: 'Pheromone Lures', re: /\blure/i },
  { sub: 'Pheromone Traps', re: /\btrap/i },
  { sub: 'Fungicides', re: /fungicid|thiophanate|mancozeb|carbendazim|trifloxystrobin|tebuconazole|difenoconazole|propineb|metalaxyl|azoxystrobin|hexaconazole|ziram|fosetyl|antracol|nativo|\bscore\b|\bsaaf\b|\broko\b|\bm45\b|custodia|ridomil|azobol/i },
  { sub: 'Herbicides', re: /herbicid|glyphosate|2,4-?d\b|pendimethalin|bispyribac|metribuzin|quizalofop|pretilachlor|atrazine|oxyfluorfen|pyrazosulfuron|weedmar|weed control|weed killer|roundup|glycel|glyfosil|hitweed|foost|katal|barrier|\bdost\b|nominee|chempa|targa|craze|found up|oxyflou|oxyfou/i },
  { sub: 'Insecticides', re: /insecticid|imidacloprid|chlorpyrifos|chlorpyriphos|dimethoate|thiamethoxam|fipronil|deltamethrin|acetamiprid|chlorantraniliprole|flubendiamide|carbosulfan|pymetrozine|cyfluthrin|exyma|imidor|advice 70|\bchess\b|\bdecis\b|marshal|lesenta|solomon|target super|\bameen\b|azodifen|verito|pyramid|amit\b|attack insecticide/i },
];

const CN_RULES = [
  { sub: 'Humic Acids', re: /humic|fulvic/i },
  { sub: 'Micro Nutrients', re: /micronutrient|micro[\s-]?nutrient|zinc|boron|iron/i },
  { sub: 'Bio/Organic Fertilizers', addl: [ORG], re: /fertilizer|biofertilizer|\bvam\b|mycorrhiz|compost/i },
  { sub: 'Yield Boosters', re: /yield|booster/i },
  { sub: 'Bio Stimulants', addl: [ORG], re: /stimulant|growth regulator|amino|inject/i },
  { sub: 'Plant Enhancers', re: /./ },
];

const NURSERY_RULES = [
  { sub: 'Crop Cover', cat: 'Equipments', re: /crop cover|fruit protection|fruit tubing/i },
];

const MILKING_RULES = [
  { sub: 'Milking Machine Accessories', cat: AH, re: /vacuum tube|milk tube|\bliner\b|claw|inflation|\bfilter\b|nozzle|pulse|\bgear\b/i },
  { sub: 'Milking Machine', cat: AH, re: /milking machine/i },
];

/* The Tapas brand line: a "| TAPAS"-tagged listing belongs to the Tapas
 * storefront regardless of the folder it was downloaded into. */
function tapasSubFor(name) {
  if (/trap|lure|sticky/i.test(name)) return 'Traps and Lures';
  if (/sprayer|spray\b/i.test(name)) return 'Sprayers';
  if (/mulching/i.test(name)) return 'Mulching Sheet';
  if (/safety|goggle|glove/i.test(name)) return 'Safety Kit';
  if (/implement|hole mak|blade|trowel/i.test(name)) return 'Farm Implements';
  if (/nutrition|fertilizer|humic|\bvam\b|growth|booster|stimulant|inject/i.test(name)) return 'Crop Nutrition';
  return 'Crop Protection';
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
const hash = (s) => crypto.createHash('md5').update(s).digest();
const fileHash = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');

const STOP_BRAND = /^(yellow|blue|white|red|green|black|silver|golden|gold|hybrid|manual|automatic|battery|operated|rechargeable|domestic|stainless|steel|high|effective|round|deep|non|eco|powerful|organic|natural|traditional|exotic|the|jumbo|multi|multi-cut|special|regular|premium|super|advanced|original|imported)$/i;
const KNOWN_BRANDS = [
  'ANAND AGRO', 'Dr. Bacto’s', "Dr. Bacto's", 'Dr. Bactos', 'KN Biosciences', 'T. Stanes', 'Rain Biotech',
  'Radhe Agri Center', 'Pioneer Agro', 'Meenakshi Agro', 'MEENAKSHI AGRO', 'Century Biocare', 'Gaiagen',
  'Chipku', 'Chipchip', 'Barrix', 'BARRIX', 'Multiplex', 'Katyayani', 'KATYAYANI', 'Dhanuka', 'Hifield',
  'Sumitomo', 'Syngenta', 'Bayer', 'BASF', 'UPL', 'FMC', 'Sakata', 'Eureka', 'Foragen', 'Jumbo',
  'Vibrant', 'Zeal', 'ZEAL', 'EBS', 'Vedant', 'VEDANT', 'Vedanta', 'Siddhi', 'KISAN', 'Anil', 'ANIL',
  'Neptune', 'Tapas', 'TAPAS', 'Vetmantra', 'VETMANTRA', 'Otlas', 'OTLA', 'Geolife', 'Katyayani',
  'AgroShield', 'BioAgro', 'FarmGuard', 'GreenField', 'WeedOut', 'ChemLure', 'SafeKill',
  'Almid', 'Amruth', 'Anant', 'Areva', 'Blitox', 'Contaf', 'Contsap', 'Cuman', 'Decis', 'Exponus',
  'Exylon', 'Fame', 'Fib-Sol', 'FIB-SOL', 'HumiQ', 'Kaybee', 'Kemicides', 'Lysorus', 'Magic',
  'Nativo', 'Nominee', 'Pioneer', 'Predator', 'Ridomil', 'Roko', 'Solomon', 'Suntech', 'SUSTHIRA',
  'Tagmycin', 'Targa', 'Tafgor', 'Topper', 'Vibrant', 'WAVAR', 'VC', 'VM Cropcare', 'VIRU', 'ANNADATA',
  'ECOMILK', 'ECOWEALTH', 'NG', 'PASHU SVASTH', 'TIBERIUS', 'Apollo', 'Red Jewel', 'Sakata',
];

function brandFor(cleanName) {
  const upper = cleanName.toUpperCase();
  for (const b of KNOWN_BRANDS) {
    if (upper.startsWith(b.toUpperCase())) return b;
  }
  const first = cleanName.split(/[\s:-]/)[0];
  if (first && first.length >= 3 && !STOP_BRAND.test(first) && !/\d/.test(first)) {
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return 'AgroShield Select';
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      if (/^[A-Z0-9,.\-/%]+$/.test(w) && w.length > 1) return w; // acronyms / codes
      if (/\d/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function cleanFileName(base) {
  let s = base;
  const tagMatch = s.match(/\s*\|\s*(TAPAS|IMPLEMENTS)\s*$/i);
  const tag = tagMatch ? tagMatch[1].toUpperCase() : null;
  if (tagMatch) s = s.slice(0, tagMatch.index);
  s = s.replace(/\s+/g, ' ').trim();
  // Strip trailing duplicate counters / scraped rating junk ("tomato seed1",
  // "… FUNGICIDES  5.00 3 Reviews", "… SP)  5.00 .").
  for (let i = 0; i < 3; i += 1) {
    const next = s.replace(/[\s._%,-]*(?:\d+(?:\.\d+)?\s*(?:%|reviews?)?|reviews?)[\s._%,-]*$/i, '').trim();
    if (next === s || !next) break;
    s = next;
  }
  s = s.replace(/[\s._,-]+$/, '').replace(/^[\s._,-]+/, '').replace(/\s+/g, ' ').trim();
  return { name: s, tag };
}

function packSizeFor(name) {
  let m = name.match(/pack of (\d+)/i);
  if (m) return `Pack of ${m[1]}`;
  m = name.match(/(\d+(?:\.\d+)?)\s*(ml|l|ltr|ltrs|litres?|liters?)\b/i);
  if (m) {
    const unit = /^(l|ltr|ltrs|litre|litres|liter|liters)$/i.test(m[2]) ? 'L' : 'ml';
    return `${m[1]} ${unit}`;
  }
  m = name.match(/(\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?)\b/i);
  if (m) return `${m[1]} kg`;
  m = name.match(/(\d+(?:\.\d+)?)\s*(gms?|grams?|g)\b/i);
  if (m) return `${m[1]} g`;
  return 'Standard pack';
}

/* Deterministic demo values — stable across re-runs. */
function demoValues(name, category) {
  const h = hash(name);
  const range = PRICE_RANGES[category];
  const step = 5;
  const slots = Math.floor((range.max - range.min) / step);
  const price = range.min + (h[0] + h[1] * 256) % (slots + 1) * step;
  const mrpOn = h[2] % 10 < 3;
  const mrp = mrpOn ? Math.round((price * (1.1 + (h[3] % 20) / 100)) / 10) * 10 : null;
  const rating = (35 + h[4] % 11) / 10;
  const stockQuantity = 20 + (h[5] + h[6] * 256) % 181;
  return { price, mrp: mrp && mrp > price ? mrp : null, rating, stockQuantity };
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'product';
}

function classify(folderKey, cleanName, tag) {
  const map = FOLDER_MAP[folderKey];
  if (!map) return { error: `no mapping for folder "${folderKey}"` };

  if (map.special === 'mulch') {
    if (/hole mak/i.test(cleanName)) return { cat: 'Tapas', sub: 'Farm Implements' };
    if (/leaf blower|vacuum/i.test(cleanName)) return { error: 'no fitting subcategory (leaf blower)' };
    return { cat: 'Equipments', sub: 'Mulch' };
  }

  let mapping;
  if (map.mixed === 'CP') {
    const rule = CP_RULES.find((r) => r.re.test(cleanName));
    if (!rule) return { error: 'unclassified crop-protection type' };
    mapping = { cat: CP, sub: rule.sub, addl: rule.addl };
  } else if (map.mixed === 'CN') {
    const rule = CN_RULES.find((r) => r.re.test(cleanName));
    mapping = { cat: CN, sub: rule.sub, addl: rule.addl };
  } else if (map.classifier === 'nursery') {
    const rule = NURSERY_RULES.find((r) => r.re.test(cleanName));
    mapping = rule || { cat: map.cat, sub: map.sub, addl: map.addl };
  } else if (map.classifier === 'milking') {
    const rule = MILKING_RULES.find((r) => r.re.test(cleanName));
    mapping = rule || { cat: map.cat, sub: map.sub, addl: map.addl };
  } else {
    mapping = { cat: map.cat, sub: map.sub, addl: map.addl };
  }

  // The TAPAS brand line wins over the download folder.
  if (tag === 'TAPAS') {
    mapping = { cat: 'Tapas', sub: tapasSubFor(cleanName) };
  } else if (tag === 'IMPLEMENTS' && map.special === 'mulch') {
    mapping = { cat: 'Tapas', sub: 'Farm Implements' };
  }
  return mapping;
}

/* ------------------------------------------------------------------ *
 * Walk → dedupe → classify → emit
 * ------------------------------------------------------------------ */
const IMAGE_EXT = new Set(['.webp', '.avif', '.jpeg', '.jpg', '.png']);
const JXL_EXT = new Set(['.jxl']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const unmatched = [];
const converted = [];
const merges = [];
const brandFallbacks = [];

// Sort: folder priority first, then non-jxl before jxl, then path — so the
// "best" copy of a duplicated image decides the category mapping.
const prepared = files
  .map((full) => {
    const rel = path.relative(ROOT, full);
    const folderKey = rel.includes(path.sep) ? rel.split(path.sep)[0].toLowerCase() : '';
    const ext = path.extname(full).toLowerCase();
    return {
      full,
      rel,
      folderKey,
      ext,
      priority: FOLDER_PRIORITY(folderKey),
      jxl: JXL_EXT.has(ext),
    };
  })
  .sort((a, b) => a.priority - b.priority || Number(a.jxl) - Number(b.jxl) || a.rel.localeCompare(b.rel));

const byHash = new Map();
for (const f of prepared) {
  if (!IMAGE_EXT.has(f.ext) && !JXL_EXT.has(f.ext)) {
    unmatched.push({ file: f.rel, reason: f.ext ? `unsupported file type "${f.ext}"` : 'file has no image extension' });
    continue;
  }
  const md5 = fileHash(f.full);
  if (byHash.has(md5)) {
    merges.push({ file: f.rel, reason: 'identical copy', kept: byHash.get(md5).rel });
    continue;
  }
  byHash.set(md5, f);
}

const products = [];
const seenSlugs = new Map();
const seenNames = new Map(); // name+category → slug (name-based duplicate merge)

for (const f of byHash.values()) {
  const base = path.basename(f.full, f.ext);
  const { name: cleanName, tag } = cleanFileName(base);
  const mapping = classify(f.folderKey, cleanName, tag);
  if (mapping.error) {
    unmatched.push({ file: f.rel, reason: mapping.error });
    continue;
  }
  const pair = taxonomy.validatePair({ primaryCategory: mapping.cat, subcategory: mapping.sub });
  if (pair.error) {
    unmatched.push({ file: f.rel, reason: `taxonomy rejected ${mapping.cat} > ${mapping.sub}: ${pair.error}` });
    continue;
  }

  const nameKey = `${pair.primaryCategory}::${cleanName.toLowerCase()}`;
  if (seenNames.has(nameKey)) {
    merges.push({ file: f.rel, reason: 'same product name in same category', kept: seenNames.get(nameKey) });
    continue;
  }

  const name = titleCase(cleanName).slice(0, 140);
  let slug = slugify(name);
  if (seenSlugs.has(slug)) {
    let n = 2;
    while (seenSlugs.has(`${slug}-${n}`)) n += 1;
    merges.push({ file: f.rel, reason: 'slug collision', kept: seenSlugs.get(slug) });
    slug = `${slug}-${n}`;
  }

  const brand = brandFor(cleanName);
  if (brand === 'AgroShield Select') brandFallbacks.push(f.rel);

  // Copy the image (convert jxl through Quick Look first).
  let outExt = f.ext === '.jpg' ? '.jpeg' : f.ext;
  const dest = path.join(OUT_IMG, `${slug}${outExt}`);
  if (f.jxl) {
    fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(TMP, { recursive: true });
    try {
      execFileSync('qlmanage', ['-t', '-s', '1024', '-o', TMP, f.full], { stdio: 'ignore' });
      const produced = fs.readdirSync(TMP)[0];
      if (!produced) throw new Error('no output');
      outExt = '.png';
      fs.copyFileSync(path.join(TMP, produced), path.join(OUT_IMG, `${slug}.png`));
      converted.push(f.rel);
    } catch (e) {
      unmatched.push({ file: f.rel, reason: `jxl conversion failed (${e.message})` });
      continue;
    }
  } else {
    fs.copyFileSync(f.full, dest);
  }

  const values = demoValues(`${pair.primaryCategory}/${cleanName.toLowerCase()}`, pair.primaryCategory);
  const image = `/images/products/imported/${slug}${outExt}`;
  const description = `${name} — ${brand}. Product details derived from the supplier catalogue image filename; demo listing, verify pack size, label and price before real sale.`;

  const record = {
    name,
    brand,
    slug,
    description,
    packSize: packSizeFor(cleanName),
    price: values.price,
    mrp: values.mrp,
    rating: values.rating,
    stockQuantity: values.stockQuantity,
    image,
    primaryCategory: pair.primaryCategory,
    subcategory: pair.subcategory,
    additionalCategories: pair.additionalCategories,
    isDemoData: false, // the import carries the owner's real catalogue — not demo listings
  };
  products.push(record);
  seenSlugs.set(slug, name);
  seenNames.set(nameKey, slug);
}

products.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(OUT_JSON, `${JSON.stringify(products, null, 1)}\n`);

/* Report */
const perCat = {};
for (const p of products) {
  const k = `${p.primaryCategory} > ${p.subcategory}`;
  perCat[k] = (perCat[k] || 0) + 1;
}
console.log(`Files scanned        : ${files.length}`);
console.log(`Unique images kept   : ${byHash.size}`);
console.log(`Products emitted     : ${products.length}`);
console.log(`Duplicate merges     : ${merges.length}`);
console.log(`jxl converted → png  : ${converted.length}`);
console.log(`Brand fallbacks      : ${brandFallbacks.length}`);
console.log(`Unmatched            : ${unmatched.length}`);
console.log('--- per category/subcategory ---');
for (const k of Object.keys(perCat).sort()) console.log(`  ${perCat[k].toString().padStart(3)}  ${k}`);
if (unmatched.length) {
  console.log('--- unmatched images (review, not imported) ---');
  for (const u of unmatched) console.log(`  ${u.file}  [${u.reason}]`);
}
const conflicts = products.filter((p) => p.additionalCategories && p.additionalCategories.length)
  .filter((p) => p.additionalCategories.some((c) => {
    const r = PRICE_RANGES[c];
    return r && (p.price < r.min || p.price > r.max);
  }));
console.log(`--- price conflicts for cross-listed products: ${conflicts.length} ---`);
for (const c of conflicts.slice(0, 20)) console.log(`  ${c.name} (${c.primaryCategory} ₹${c.price} listed in ${c.additionalCategories.join(', ')})`);
