const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUSES } = require('../models/Order');
const { decorate, decorateAll } = require('./productController');
const taxonomy = require('../utils/taxonomy');
const v = require('../utils/validators');

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

/**
 * GET /api/admin/dashboard
 * Real numbers aggregated from the Order/Product/User collections.
 */
const dashboard = asyncHandler(async (req, res) => {
  const [totalProducts, activeProducts, inStockProducts, outOfStockProducts, newReleases, totalCustomers, totalUsers, totalOrders, revenueAgg, statusAgg, lowStock, recentOrdersRaw, monthlySales, topProducts] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ active: true }),
      // available = active AND stock > 0 AND not manually blocked
      Product.countDocuments({ active: true, stockQuantity: { $gt: 0 }, manualOutOfStock: { $ne: true } }),
      Product.countDocuments({ active: true, $or: [{ stockQuantity: 0 }, { manualOutOfStock: true }] }),
      Product.countDocuments({ active: true, isNewRelease: true }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Product.find({ active: true, manualOutOfStock: { $ne: true }, stockQuantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } })
        .sort({ stockQuantity: 1 })
        .limit(20)
        .lean(),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email').lean(),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $ne: 'Cancelled' },
            createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            units: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { units: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const revenue = revenueAgg[0] ? Math.round(revenueAgg[0].revenue * 100) / 100 : 0;
  const paidOrders = revenueAgg[0] ? revenueAgg[0].count : 0;

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  for (const row of statusAgg) statusCounts[row._id] = row.count;

  res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      inStockProducts,
      outOfStockProducts,
      newReleases,
      totalCustomers,
      totalUsers,
      totalOrders,
      paidOrders,
      revenue,
      averageOrderValue: paidOrders ? Math.round((revenue / paidOrders) * 100) / 100 : 0,
      statusCounts,
      lowStockCount: lowStock.length,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
    lowStock,
    recentOrders: recentOrdersRaw,
    monthlySales,
    topProducts,
  });
});

/** GET /api/admin/products — product list for the dashboard (includes inactive items). */
const listProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = {};

  if (q.status === 'active') filter.active = true;
  else if (q.status === 'inactive') filter.active = false;
  else if (q.status === 'instock') {
    filter.active = true;
    filter.stockQuantity = { $gt: 0 };
    filter.manualOutOfStock = { $ne: true };
  } else if (q.status === 'outofstock') {
    filter.active = true;
    filter.$or = [{ stockQuantity: 0 }, { manualOutOfStock: true }];
  } else if (q.status === 'newrelease') {
    filter.active = true;
    filter.isNewRelease = true;
  }

  if (q.category && String(q.category).trim()) filter.subcategory = String(q.category).trim();
  if (q.primaryCategory && String(q.primaryCategory).trim()) filter.primaryCategory = String(q.primaryCategory).trim();
  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(String(q.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { subcategory: rx }];
  }

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(q.limit, 10) || 12));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products: decorateAll(products),
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

/** GET /api/admin/products/out-of-stock — auto (qty 0) AND manual blocks. */
const listOutOfStock = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { active: true, $or: [{ stockQuantity: 0 }, { manualOutOfStock: true }] };
  const and = [];

  if (q.reason === 'manual') {
    delete filter.$or;
    filter.manualOutOfStock = true;
  } else if (q.reason === 'quantity') {
    delete filter.$or;
    filter.stockQuantity = 0;
    filter.manualOutOfStock = { $ne: true };
  }
  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(String(q.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ name: rx }, { brand: rx }, { subcategory: rx }] });
  }
  if (and.length) filter.$and = and;

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(q.limit, 10) || 12));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ manualOutOfStock: -1, stockQuantity: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products: decorateAll(products),
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

function requireValidId(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid product id.');
}

/** GET /api/admin/products/:id — full product record, even when inactive. */
const getProductAdmin = asyncHandler(async (req, res) => {
  requireValidId(req);
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json({ success: true, product: decorate(product) });
});

/** PATCH /api/admin/products/:id/price — change the selling price (and optional MRP). */
const updatePrice = asyncHandler(async (req, res) => {
  requireValidId(req);
  const { price, mrp } = req.body || {};
  const set = {};

  if (price !== undefined) {
    const p = Number(price);
    if (Number.isNaN(p) || p < 0) throw new ApiError(400, 'Price must be a non-negative number.');
    set.price = Math.round(p * 100) / 100;
  }
  if (mrp !== undefined) {
    if (mrp === null || mrp === '') set.mrp = null;
    else {
      const m = Number(mrp);
      if (Number.isNaN(m) || m < 0) throw new ApiError(400, 'MRP must be a non-negative number.');
      set.mrp = Math.round(m * 100) / 100;
    }
  }
  if (!Object.keys(set).length) throw new ApiError(400, 'Supply a price and/or mrp value.');

  const product = await Product.findByIdAndUpdate(req.params.id, { $set: set }, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json({ success: true, message: `Price updated for "${product.name}".`, product: decorate(product) });
});

/** PATCH /api/admin/products/:id/stock — restock / adjust quantity. */
const updateStock = asyncHandler(async (req, res) => {
  requireValidId(req);
  const body = req.body || {};
  const stock = Number(body.stockQuantity);
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError(400, 'Stock quantity must be a whole number of 0 or more.');
  }

  // A manual block can optionally be cleared together with the restock, which
  // restores availability once active && stock > 0.
  const set = { stockQuantity: stock };
  if (body.clearManualOutOfStock === true) set.manualOutOfStock = false;

  const product = await Product.findByIdAndUpdate(req.params.id, { $set: set }, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  res.json({ success: true, message: `Stock updated to ${stock} for "${product.name}".`, product: decorate(product) });
});

/** PATCH /api/admin/products/:id/availability — active flag + manual out-of-stock + new release. */
const updateAvailability = asyncHandler(async (req, res) => {
  requireValidId(req);
  const body = req.body || {};
  const set = {};
  if (body.active !== undefined) set.active = Boolean(body.active);
  if (body.manualOutOfStock !== undefined) set.manualOutOfStock = Boolean(body.manualOutOfStock);
  if (body.isNewRelease !== undefined) {
    set.isNewRelease = Boolean(body.isNewRelease);
    if (set.isNewRelease && !body.releaseDate) set.releaseDate = new Date();
  }
  if (body.releaseDate !== undefined) {
    if (body.releaseDate === null || body.releaseDate === '') set.releaseDate = null;
    else {
      const d = new Date(body.releaseDate);
      if (Number.isNaN(d.getTime())) throw new ApiError(400, 'Release date must be a valid date.');
      set.releaseDate = d;
    }
  }
  if (!Object.keys(set).length) {
    throw new ApiError(400, 'Supply active, manualOutOfStock, isNewRelease and/or releaseDate.');
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { $set: set }, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found.');

  const state = product.active && product.stockQuantity > 0 && !product.manualOutOfStock ? 'available' : 'unavailable';
  res.json({ success: true, message: `"${product.name}" is now ${state}.`, product: decorate(product) });
});

/** GET /api/admin/orders — full order list with filters + pagination. */
const listOrders = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = {};

  if (q.status && ORDER_STATUSES.includes(q.status)) filter.orderStatus = q.status;
  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(String(q.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderId: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }];
  }

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 15));

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    orders,
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
 * PATCH /api/admin/orders/:id
 * Update order status (and optionally payment status).
 * Cancelling from the admin side returns the units to stock.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid order id.');

  const { orderStatus, paymentStatus, note } = req.body || {};
  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new ApiError(400, `Order status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const previous = order.orderStatus;
  if (previous !== orderStatus) {
    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      at: new Date(),
      note: (typeof note === 'string' && note.trim() ? note.trim().slice(0, 200) : `Updated by admin (was ${previous})`),
    });

    // Admin-side cancellation gives the stock back.
    if (orderStatus === 'Cancelled' && previous !== 'Cancelled') {
      await Promise.all(
        order.items.map((item) =>
          Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } })
        )
      );
    }
  }

  if (paymentStatus !== undefined) {
    if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      throw new ApiError(400, 'Invalid payment status.');
    }
    order.paymentStatus = paymentStatus;
  }

  await order.save();
  res.json({ success: true, message: `Order marked as ${orderStatus}.`, order });
});

/** GET /api/admin/customers — registered customers with order counts. */
const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [customers, total, orderCounts] = await Promise.all([
    User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email phone address createdAt')
      .lean(),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
    ]),
  ]);

  const statsById = new Map(orderCounts.map((c) => [c._id.toString(), c]));

  res.json({
    success: true,
    customers: customers.map((c) => ({
      ...c,
      orders: statsById.get(c._id.toString())?.orders || 0,
      totalSpent: Math.round((statsById.get(c._id.toString())?.spent || 0) * 100) / 100,
    })),
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

/** GET /api/admin/categories */
const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ type: 1, name: 1 }).lean();
  res.json({ success: true, categories });
});

/** POST /api/admin/categories — only taxonomy subcategories can exist. */
const createCategory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  v.assertValid({
    name: v.requiredString(name, 'Category name', { min: 2, max: 80 }),
    description: body.description !== undefined
      ? v.requiredString(body.description, 'Description', { min: 0, max: 400 })
      : null,
  });
  if (!taxonomy.isMainCategory(body.type)) {
    throw new ApiError(400, `Type must be one of: ${taxonomy.MAIN_CATEGORIES.join(', ')}`);
  }

  // The (main category, subcategory) pair must exist in the store taxonomy —
  // no parallel category system can be created next to it.
  const pair = taxonomy.validatePair({ primaryCategory: body.type, subcategory: name });
  if (pair.error) throw new ApiError(400, pair.error);

  if (await Category.exists({ name: pair.subcategory, type: pair.primaryCategory })) {
    throw new ApiError(409, `"${pair.subcategory}" already exists under ${pair.primaryCategory}.`);
  }

  const category = await Category.create({
    name: pair.subcategory,
    type: pair.primaryCategory,
    heading: pair.heading,
    image: typeof body.image === 'string' ? body.image.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
  });

  res.status(201).json({ success: true, message: 'Category created.', category });
});

/** PATCH /api/admin/categories/:id */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid category id.');

  const current = await Category.findById(id);
  if (!current) throw new ApiError(404, 'Category not found.');

  const data = {};
  if (req.body.name !== undefined) {
    const err = v.requiredString(req.body.name, 'Category name', { min: 2, max: 80 });
    if (err) throw new ApiError(400, err);
    data.name = String(req.body.name).trim();
  }
  if (req.body.type !== undefined) data.type = String(req.body.type).trim();

  if (data.name !== undefined || data.type !== undefined) {
    // Renaming/moving must still resolve to a real taxonomy pair.
    const pair = taxonomy.validatePair({
      primaryCategory: data.type !== undefined ? data.type : current.type,
      subcategory: data.name !== undefined ? data.name : current.name,
    });
    if (pair.error) throw new ApiError(400, pair.error);
    data.name = pair.subcategory;
    data.type = pair.primaryCategory;
    data.heading = pair.heading;
    const clash = await Category.exists({ _id: { $ne: id }, name: data.name, type: data.type });
    if (clash) throw new ApiError(409, `"${data.name}" already exists under ${data.type}.`);
  }

  if (req.body.description !== undefined) data.description = String(req.body.description).trim().slice(0, 400);
  if (req.body.image !== undefined) data.image = String(req.body.image).trim().slice(0, 300);
  if (req.body.active !== undefined) data.active = Boolean(req.body.active);

  const category = await Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found.');

  res.json({ success: true, message: 'Category updated.', category });
});

/** DELETE /api/admin/categories/:id — blocked while products still use it. */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid category id.');

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const inUse = await Product.countDocuments({ subcategory: category.name, active: true });
  if (inUse > 0) {
    throw new ApiError(409, `Cannot delete: ${inUse} active product(s) still use this category.`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = {
  dashboard,
  listProducts,
  getProductAdmin,
  listOutOfStock,
  updatePrice,
  updateStock,
  updateAvailability,
  listOrders,
  updateOrderStatus,
  listCustomers,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
