const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const v = require('../utils/validators');

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
  rating: { rating: -1, reviewCount: -1 },
  featured: { featured: -1, rating: -1 },
};

/**
 * GET /api/products
 * Supports search, category/type/price/stock/crop filters, sorting
 * and pagination. Only active products are visible to customers.
 */
const listProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { active: true };

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
  if (q.inStock === 'true') filter.stockQuantity = { $gt: 0 };
  if (q.inStock === 'false') filter.stockQuantity = 0;
  if (q.featured === 'true') filter.featured = true;
  if (q.bestseller === 'true') filter.bestseller = true;
  if (q.seasonal === 'true') filter.seasonal = true;

  const sort = SORT_OPTIONS[q.sort] || SORT_OPTIONS.featured;

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(q.limit, 10) || 12));

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products: items,
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

  const related = await Product.find({
    active: true,
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ rating: -1 })
    .limit(4)
    .lean();

  res.json({ success: true, product, related });
});

/** Validate + normalize a product payload shared by create/update. */
function parseProductBody(body, { partial = false } = {}) {
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
  strField('category', 'Category', { min: 2, max: 80 });
  strField('brand', 'Brand / manufacturer', { min: 2, max: 100 });
  strField('packSize', 'Pack size', { min: 1, max: 40 });
  strField('image', 'Product image', { min: 3, max: 300 });

  if (body.description !== undefined) {
    const err = v.requiredString(body.description, 'Description', { min: 10, max: 4000 });
    if (err) errors.description = err;
    else out.description = String(body.description).trim();
  }

  if (body.type !== undefined) {
    const allowed = ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'];
    if (!allowed.includes(body.type)) errors.type = `Type must be one of: ${allowed.join(', ')}`;
    else out.type = body.type;
  } else if (!partial) {
    errors.type = 'Product type is required';
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) errors.price = 'Price must be a non-negative number';
    else out.price = Math.round(price * 100) / 100;
  } else if (!partial) {
    errors.price = 'Price is required';
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

  for (const flag of ['featured', 'bestseller', 'seasonal', 'active', 'isDemoData']) {
    if (body[flag] !== undefined) out[flag] = Boolean(body[flag]);
  }

  v.assertValid(errors);
  return out;
}

/** POST /api/products (admin) */
const createProduct = asyncHandler(async (req, res) => {
  const data = parseProductBody(req.body);
  const product = await Product.create(data);
  res.status(201).json({ success: true, message: 'Product created.', product });
});

/** PATCH /api/products/:id (admin) */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id.');

  const data = parseProductBody(req.body, { partial: true });
  if (Object.keys(data).length === 0) throw new ApiError(400, 'No valid fields supplied for update.');

  const product = await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  res.json({ success: true, message: 'Product updated.', product });
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
  createProduct,
  updateProduct,
  deleteProduct,
};
