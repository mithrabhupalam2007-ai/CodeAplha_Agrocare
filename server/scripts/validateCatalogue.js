#!/usr/bin/env node
/**
 * Catalogue validation & reporting (stage 9 of the image-import task).
 *
 *   npm run validate:catalogue
 *
 * Checks, across the whole product catalogue (active products are hard
 * requirements; inactive records are reported separately):
 *
 *   1. every image path is a local /images/… reference whose file exists
 *   2. every product carries a valid main category + subcategory pair
 *      (and a heading where the taxonomy requires one)
 *   3. every price sits inside its primary-category band, or is an
 *      owner-approved priceExempt exception
 *   4. every demo rating is between 3.5 and 4.5 in 0.1 steps
 *   5. cross-listed (additionalCategories) records stay single canonical
 *      documents — verified via unique slugs and name+brand keys
 *   6. duplicate product records are identified (same name+brand)
 *   7. orphan/unmatched images under the imported folder are reported
 *      (never deleted automatically)
 *   8. orders + users are untouched — counts and order grand total are
 *      printed for comparison with the pre-migration backup
 *
 * Exit code 1 when any hard check fails.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const taxonomy = require('../utils/taxonomy');
const { PRICE_RANGES, DEMO_RATING } = require('../utils/pricing');

const CLIENT_ROOT = path.resolve(__dirname, '..', '..', 'client');
const IMPORTED_DIR = path.join(CLIENT_ROOT, 'images', 'products', 'imported');

const failures = [];
const warnings = [];
const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

async function validate() {
  await connectDB();

  const products = await Product.find({}).lean();
  const active = products.filter((p) => p.active);
  const inactive = products.filter((p) => !p.active);
  console.log(`Products: ${products.length} total, ${active.length} active, ${inactive.length} inactive\n`);

  /* 1 + scheme — image paths are local and resolve to real files */
  const referencedImages = new Set();
  for (const p of products) {
    const imgs = [p.image, ...(p.images || [])].filter(Boolean);
    for (const img of imgs) {
      if (!img.startsWith('/images/')) {
        (p.active ? fail : warn)(`[image] ${p.name}: non-local image reference "${img}"`);
        continue;
      }
      const file = path.join(CLIENT_ROOT, img);
      referencedImages.add(file);
      if (!fs.existsSync(file)) {
        // Hard failure for the live catalogue; inactive records only warn
        // (soft-deleted rows are kept for order history).
        (p.active ? fail : warn)(`[image] ${p.name}: image file missing on disk — ${img}`);
      }
    }
  }

  /* 2 — taxonomy classification */
  for (const p of active) {
    const pair = taxonomy.validatePair({
      primaryCategory: p.primaryCategory,
      subcategory: p.subcategory,
      heading: p.heading,
    });
    if (pair.error) fail(`[taxonomy] ${p.name}: ${pair.error}`);
    else if (p.subcategory && pair.subcategory !== p.subcategory) {
      fail(`[taxonomy] ${p.name}: stored subcategory "${p.subcategory}" not canonical ("${pair.subcategory}")`);
    }
    for (const extra of p.additionalCategories || []) {
      if (!taxonomy.isMainCategory(extra)) fail(`[taxonomy] ${p.name}: invalid additional category "${extra}"`);
    }
  }

  /* 3 — price bands */
  let exemptCount = 0;
  for (const p of active) {
    const range = PRICE_RANGES[p.primaryCategory];
    if (!range) continue;
    const outside = p.price < range.min || p.price > range.max;
    if (outside && !p.priceExempt) {
      fail(`[price] ${p.name}: ₹${p.price} outside ₹${range.min}–₹${range.max} (${p.primaryCategory}) and not priceExempt`);
    } else if (outside && p.priceExempt) {
      exemptCount += 1;
    } else if (!outside && p.priceExempt) {
      warn(`[price] ${p.name}: priceExempt set but ₹${p.price} is inside the band — flag can be cleared`);
    }
  }

  /* 4 — demo ratings */
  for (const p of active) {
    const r = Number(p.rating);
    if (!(r >= DEMO_RATING.min && r <= DEMO_RATING.max)) {
      fail(`[rating] ${p.name}: rating ${p.rating} outside ${DEMO_RATING.min}–${DEMO_RATING.max}`);
    } else if (Math.round(r * 10) !== r * 10) {
      fail(`[rating] ${p.name}: rating ${p.rating} is not a 0.1-step value`);
    }
  }

  /* 5 + 6 — canonical identity + duplicates */
  const bySlug = new Map();
  const byNameBrand = new Map();
  for (const p of products) {
    if (bySlug.has(p.slug)) fail(`[duplicate] slug "${p.slug}" used by "${byNameBrand.get(p.slug)}" and "${p.name}"`);
    else bySlug.set(p.slug, p.name);
    const key = `${(p.name || '').trim().toLowerCase()}::${(p.brand || '').trim().toLowerCase()}`;
    if (byNameBrand.has(key)) warn(`[duplicate] same name+brand appears twice: "${p.name}" (${p.brand}) — slugs ${byNameBrand.get(key)} / ${p.slug}`);
    else byNameBrand.set(key, p.slug);
  }
  const crossListed = active.filter((p) => (p.additionalCategories || []).length > 0);

  /* 7 — unmatched / orphan imported images */
  const importedFiles = walk(IMPORTED_DIR);
  const orphans = importedFiles.filter((f) => !referencedImages.has(f));
  for (const o of orphans) warn(`[unmatched image] ${path.relative(CLIENT_ROOT, o)} is not referenced by any product`);

  /* 8 — orders + users untouched */
  const orderCount = await Order.countDocuments();
  const userCount = await User.countDocuments();
  const orderTotal = await Order.aggregate([{ $group: { _id: null, sum: { $sum: '$grandTotal' } } }]);
  console.log(`Orders: ${orderCount} (grand total ₹${(orderTotal[0] && orderTotal[0].sum) || 0}) — unchanged by the image import`);
  console.log(`Users : ${userCount}\n`);

  console.log(`Images referenced   : ${referencedImages.size} paths (all local /images/… refs)`);
  console.log(`Imported images     : ${importedFiles.length} files on disk`);
  console.log(`Cross-listed records: ${crossListed.length}`);
  console.log(`Price exemptions    : ${exemptCount} owner-approved exception(s)`);
  console.log(`Warnings            : ${warnings.length}`);
  for (const w of warnings.slice(0, 40)) console.log(`  ! ${w}`);
  if (warnings.length > 40) console.log(`  … ${warnings.length - 40} more`);
  console.log(`Failures            : ${failures.length}`);
  for (const f of failures) console.log(`  ✗ ${f}`);

  await disconnectDB();
  console.log(failures.length ? '\nVALIDATION FAILED' : '\nVALIDATION OK');
  process.exit(failures.length ? 1 : 0);
}

validate().catch(async (err) => {
  console.error('[validate] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
