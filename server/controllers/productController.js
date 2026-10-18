const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const v = require('../utils/validators');
const taxonomy = require('../utils/taxonomy');

/** Escape user input before embedding it in a RegExp. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  newest: { createdAt: -1 },
  release: { releaseDate: -1, createdAt: -1 },
  rating: { rating: -1, reviewCount: -1 },
  featured: { featured: -1, rating: -1 },
};

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

/**
 * Decorate a lean product document with the fields every client page needs:
 * - `available`     — the single source of truth for "can this be bought?"
 * - `stockStatus`   — 'in' | 'low' | 'out' (manual blocks included)
 * - `discountPercent` — only set when a genuine discount (mrp > price) exists
 *
 * Rule: available = active AND stockQuantity > 0 AND manualOutOfStock === false
 */
function decorate(p) {
  // Accept both lean plain objects and full mongoose documents.
  const src = p && typeof p.toObject === 'function' ? p.toObject() : p;
  const out = { ...src };
  out.available = Boolean(src.active && src.stockQuantity > 0 && !src.manualOutOfStock);
  if (!src.active) out.stockStatus = 'unavailable';
  else if (src.manualOutOfStock || src.stockQuantity <= 0) out.stockStatus = 'out';
  else if (src.stockQuantity <= LOW_STOCK_THRESHOLD) out.stockStatus = 'low';
  else out.stockStatus = 'in';
  if (Number(src.mrp) > Number(src.price) && Number(src.price) > 0) {
    out.discountPercent = Math.round(((src.mrp - src.price) / src.mrp) * 100);
  } else {
    out.discountPercent = 0;
  }
  return out;
}

/** Decorate an array of lean product docs. */
const decorateAll = (items) => items.map(decorate);

/** Build a URL slug from a product name (best effort, called on create). */
async function buildSlug(name) {
  const base =
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'product';
  let slug = base;
  for (let i = 2; i < 50; i += 1) {
    const clash = await Product.exists({ slug });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * GET /api/products
 * Supports search, category/type/price/stock/crop filters, sorting
 * and pagination. Only active products are visible to customers.
 */
const listProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { active: true };

  /* Taxonomy guard: a {type, category} pair that cannot exist in the store
     (e.g. a seed subcategory under Pesticides) is a client error — report
     it instead of silently returning an empty page. `category` alone keeps
     its historic cross-type filter meaning, so it is only validated when
     paired with a type. */
  if (q.type && String(q.type).trim()) {
    const type = String(q.type).trim();
    if (!taxonomy.MAIN_CATEGORIES.includes(type)) {
      throw new ApiError(400, `Category must be one of: ${taxonomy.MAIN_CATEGORIES.join(', ')}.`);
    }
    if (q.category !== undefined && String(q.category).trim()) {
      const pair = taxonomy.validatePair({ type, category: q.category });
      if (pair.error) throw new ApiError(400, pair.error);
    }
  }

  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(escapeRegex(String(q.search).trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (q.category && String(q.category).trim()) {
    filter.category = new RegExp(`^${escapeRegex(String(q.category).trim())}$`, 'i');
  }
  if (q.type && String(q.type).trim()) {
    filter.type = new RegExp(`^${escapeRegex(String(q.type).trim())}$`, 'i');
  }
  if (q.crop && String(q.crop).trim()) {
    filter.crops = new RegExp(escapeRegex(String(q.crop).trim()), 'i');
  }
  if (q.minPrice !== undefined && q.minPrice !== '') {
    const min = Number(q.minPrice);
    if (Number.isNaN(min)) throw new ApiError(400, 'minPrice must be a number.');
    filter.price = { ...(filter.price || {}), $gte: min };
  }
  if (q.maxPrice !== undefined && q.maxPrice !== '') {
    const max = Number(q.maxPrice);
    if (Number.isNaN(max)) throw new ApiError(400, 'maxPrice must be a number.');
    filter.price = { ...(filter.price || {}), $lte: max };
  }
  if (q.inStock === 'true') {
    filter.stockQuantity = { $gt: 0 };
    filter.manualOutOfStock = { $ne: true };
  }
  if (q.inStock === 'false') {
    filter.$or = [{ stockQuantity: 0 }, { manualOutOfStock: true }];
  }
  if (q.featured === 'true') filter.featured = true;
  if (q.bestseller === 'true') filter.bestseller = true;
  if (q.seasonal === 'true') filter.isSeasonal = true;
  if (q.newRelease === 'true') filter.isNewRelease = true;

  /* Randomized category selections: shuffle=true returns a fresh random
     sample (no duplicates) of up to `limit` matching products. The client
     pages then show them in small batches ("Load More") without re-querying,
     so a single selection never repeats a product. */
  if (q.shuffle === 'true') {
    const size = Math.min(60, Math.max(1, parseInt(q.limit, 10) || 12));
    const [items, total] = await Promise.all([
      Product.aggregate([{ $match: filter }, { $sample: { size } }]),
      Product.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      products: decorateAll(items),
      pagination: { page: 1, limit: size, total, totalPages: 1, hasNext: false, hasPrev: false },
    });
  }

  const sort = SORT_OPTIONS[q.sort] || SORT_OPTIONS.featured;

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(q.limit, 10) || 12));

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products: decorateAll(items),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

/**
 * GET /api/products/:id
 * Full product detail plus related products from the same category.
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id.');

  const product = await Product.findOne({ _id: id, active: true }).lean();
  if (!product) throw new ApiError(404, 'Product not found.');

  const related = await relatedQuery(product, 4);

  res.json({ success: true, product: decorate(product), related: decorateAll(related) });
});

/** Shared query for related products: same category first, then popular actives. */
async function relatedQuery(product, limit) {
  const sameCategory = await Product.find({
    active: true,
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ rating: -1 })
    .limit(limit)
    .lean();

  if (sameCategory.length >= Math.min(3, limit)) return sameCategory;

  // Not enough siblings — top up with other active products.
  const topUp = await Product.find({
    active: true,
    _id: { $ne: product._id, $nin: sameCategory.map((p) => p._id) },
  })
    .sort({ rating: -1 })
    .limit(limit - sameCategory.length)
    .lean();

  return [...sameCategory, ...topUp];
}

/**
 * GET /api/products/:id/related
 * Dedicated endpoint for the "You May Also Like" carousel (never includes
 * the current product itself).
 */
const getRelated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id.');

  const product = await Product.findById(id).lean();
  if (!product) throw new ApiError(404, 'Product not found.');

  const limit = Math.min(12, Math.max(4, parseInt(req.query.limit, 10) || 8));
  const related = await relatedQuery(product, limit);
  res.json({ success: true, related: decorateAll(related) });
});

/**
 * GET /api/products/new-releases
 * Products flagged as newly released by an administrator, newest first.
 * Falls back to the newest active products when nothing is flagged yet,
 * so the home section always reflects real database data.
 */
const newReleases = asyncHandler(async (req, res) => {
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 8));

  let items = await Product.find({ active: true, isNewRelease: true })
    .sort({ releaseDate: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (!items.length) {
    items = await Product.find({ active: true }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  res.json({ success: true, products: decorateAll(items) });
});

/**
 * GET /api/products/seasonal
 * Products an administrator marked as seasonal (isSeasonal + seasonalNote),
 * most recently released first. When nothing has been configured yet the
 * response flags `demoFallback` so the home page can show a friendly note
 * alongside clearly-labelled popular picks — no invented seasonality.
 */
const seasonalProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 8));

  let items = await Product.find({ active: true, isSeasonal: true })
    .sort({ releaseDate: -1, createdAt: -1, rating: -1 })
    .limit(limit)
    .lean();

  const demoFallback = items.length === 0;
  if (demoFallback) {
    items = await Product.find({ active: true, $or: [{ featured: true }, { bestseller: true }] })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(limit)
      .lean();
  }

  res.json({ success: true, products: decorateAll(items), demoFallback });
});

/** Validate + normalize a product payload shared by create/update. */
function parseProductBody(body, { partial = false, existing = {} } = {}) {
  const out = {};
  const errors = {};

  const strField = (key, label, opts) => {
    if (body[key] === undefined) {
      if (!partial) errors[key] = `${label} is required`;
      return;
    }
    const err = v.requiredString(body[key], label, opts);
    if (err) errors[key] = err;
    else out[key] = String(body[key]).trim();
  };

  strField('name', 'Product name', { min: 3, max: 140 });
  strField('brand', 'Brand / manufacturer', { min: 2, max: 100 });
  strField('packSize', 'Pack size', { min: 1, max: 40 });
  strField('image', 'Product image', { min: 3, max: 300 });

  /* --- main category + subcategory, validated against the store taxonomy ---
     A pesticide can never be saved under a seed subcategory: the pair is
     checked in server/utils/taxonomy.js. `existing` supports partial updates
     that change only one half of the pair. */
  if (body.type !== undefined) {
    const type = String(body.type).trim();
    if (!taxonomy.MAIN_CATEGORIES.includes(type)) {
      errors.type = `Category must be one of: ${taxonomy.MAIN_CATEGORIES.join(', ')}`;
    } else {
      out.type = type;
    }
  } else if (!partial) {
    errors.type = 'Product category (type) is required';
  }

  const touchesCategory = !partial || body.category !== undefined || body.type !== undefined;
  if (touchesCategory && !errors.type) {
    const pair = taxonomy.validatePair({
      type: body.type !== undefined ? String(body.type).trim() : undefined,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      existing,
    });
    if (pair.error) {
      errors.category = pair.error;
    } else {
      out.category = pair.category;
      if (pair.type) out.type = pair.type;
    }
  } else if (partial && body.category !== undefined && !String(body.category).trim()) {
    errors.category = 'Subcategory cannot be empty — pick one from the list.';
  }

  if (body.description !== undefined) {
    const err = v.requiredString(body.description, 'Description', { min: 10, max: 4000 });
    if (err) errors.description = err;
    else out.description = String(body.description).trim();
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) errors.price = 'Price must be a non-negative number';
    else out.price = Math.round(price * 100) / 100;
  } else if (!partial) {
    errors.price = 'Price is required';
  }

  if (body.mrp !== undefined && body.mrp !== null && body.mrp !== '') {
    const mrp = Number(body.mrp);
    if (Number.isNaN(mrp) || mrp < 0) errors.mrp = 'MRP must be a non-negative number';
    else out.mrp = Math.round(mrp * 100) / 100;
  } else if (body.mrp === null || body.mrp === '') {
    out.mrp = null; // allow clearing the original price
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) errors.images = 'Images must be an array of paths';
    else {
      out.images = body.images
        .filter((i) => typeof i === 'string' && i.trim())
        .map((i) => i.trim().slice(0, 300))
        .slice(0, 6);
    }
  }

  if (body.releaseDate !== undefined && body.releaseDate !== null && body.releaseDate !== '') {
    const d = new Date(body.releaseDate);
    if (Number.isNaN(d.getTime())) errors.releaseDate = 'Release date must be a valid date';
    else out.releaseDate = d;
  } else if (body.releaseDate === null || body.releaseDate === '') {
    out.releaseDate = null;
  }

  if (body.stockQuantity !== undefined) {
    const stock = Number(body.stockQuantity);
    if (!Number.isInteger(stock) || stock < 0) errors.stockQuantity = 'Stock quantity must be a whole number ≥ 0';
    else out.stockQuantity = stock;
  } else if (!partial) {
    errors.stockQuantity = 'Stock quantity is required';
  }

  if (Array.isArray(body.crops)) {
    out.crops = body.crops.filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim()).slice(0, 30);
  }

  if (body.specifications !== undefined) {
    if (!Array.isArray(body.specifications)) errors.specifications = 'Specifications must be an array';
    else {
      out.specifications = body.specifications
        .filter((s) => s && typeof s === 'object' && s.label && s.value)
        .map((s) => ({ label: String(s.label).slice(0, 80), value: String(s.value).slice(0, 300) }))
        .slice(0, 30);
    }
  }

  const nestedStringObj = (key, fields) => {
    if (body[key] === undefined) return;
    if (body[key] !== null && typeof body[key] !== 'object') {
      errors[key] = `${key} must be an object`;
      return;
    }
    const src = body[key] || {};
    const dest = {};
    for (const [field, opts] of Object.entries(fields)) {
      if (src[field] === undefined || src[field] === null || src[field] === '') continue;
      const val = String(src[field]).trim();
      if (opts.max && val.length > opts.max) {
        errors[`${key}.${field}`] = `${key}.${field} is too long`;
        continue;
      }
      dest[field] = val;
    }
    if (Object.keys(dest).length) out[key] = dest;
  };

  nestedStringObj('seedInfo', {
    variety: { max: 100 },
    cropType: { max: 60 },
    germinationPercent: { max: 10 },
    sowingInstructions: { max: 1200 },
    daysToGerminate: { max: 40 },
  });
  nestedStringObj('labelInfo', {
    composition: { max: 300 },
    registrationNo: { max: 100 },
    labelInstructions: { max: 2000 },
    safetyPrecautions: { max: 2000 },
    storage: { max: 800 },
    disposal: { max: 800 },
  });

  if (body.batch && typeof body.batch === 'object') {
    const batch = {};
    if (body.batch.batchNumber) batch.batchNumber = String(body.batch.batchNumber).trim().slice(0, 60);
    if (body.batch.expiryDate) {
      const d = new Date(body.batch.expiryDate);
      if (Number.isNaN(d.getTime())) errors['batch.expiryDate'] = 'Expiry date must be a valid date';
      else batch.expiryDate = d;
    }
    if (Object.keys(batch).length) out.batch = batch;
  }

  if (body.seasonalNote !== undefined && body.seasonalNote !== null) {
    const note = String(body.seasonalNote).trim();
    if (note.length > 140) errors.seasonalNote = 'Seasonal note is too long (max 140 characters)';
    else out.seasonalNote = note;
  }

  for (const flag of ['featured', 'bestseller', 'isSeasonal', 'active', 'isDemoData', 'isNewRelease', 'manualOutOfStock']) {
    if (body[flag] !== undefined) out[flag] = Boolean(body[flag]);
  }

  v.assertValid(errors);
  return out;
}

/** POST /api/products (admin) */
const createProduct = asyncHandler(async (req, res) => {
  const data = parseProductBody(req.body);
  data.slug = await buildSlug(data.name);
  if (data.isNewRelease && !data.releaseDate) data.releaseDate = new Date();
  const product = await Product.create(data);
  res.status(201).json({ success: true, message: 'Product created.', product });
});

/** PATCH /api/products/:id (admin) */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id.');

  // The stored record validates half-updates (e.g. only the subcategory).
  const existing = await Product.findById(id).lean();
  if (!existing) throw new ApiError(404, 'Product not found.');

  const data = parseProductBody(req.body, { partial: true, existing });
  if (Object.keys(data).length === 0) throw new ApiError(400, 'No valid fields supplied for update.');

  // Turning on the new-release flag without a date stamps it as "now".
  if (data.isNewRelease === true && !data.releaseDate) data.releaseDate = new Date();

  const product = await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  res.json({ success: true, message: 'Product updated.', product: decorate(product) });
});

/**
 * DELETE /api/products/:id (admin)
 * Default is a safe soft-delete (active=false) so historical orders keep
 * working. Pass ?permanent=true to remove the record entirely.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id.');

  if (req.query.permanent === 'true') {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Product not found.');
    return res.json({ success: true, message: 'Product permanently removed.' });
  }

  const product = await Product.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  res.json({ success: true, message: 'Product deactivated and hidden from the store.' });
});

module.exports = {
  listProducts,
  getProduct,
  getRelated,
  newReleases,
  seasonalProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  decorate,
  decorateAll,
};
