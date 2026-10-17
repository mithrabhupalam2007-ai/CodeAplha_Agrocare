const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUSES } = require('../models/Order');
const v = require('../utils/validators');

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;

/**
 * GET /api/admin/dashboard
 * Real numbers aggregated from the Order/Product/User collections.
 */
const dashboard = asyncHandler(async (req, res) => {
  const [totalProducts, activeProducts, inStockProducts, outOfStockProducts, totalCustomers, totalUsers, totalOrders, revenueAgg, statusAgg, lowStock, recentOrdersRaw, monthlySales, topProducts] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ active: true }),
      Product.countDocuments({ active: true, stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ active: true, stockQuantity: 0 }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Product.find({ active: true, stockQuantity: { $lte: LOW_STOCK_THRESHOLD } })
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
  } else if (q.status === 'outofstock') {
    filter.active = true;
    filter.stockQuantity = 0;
  }

  if (q.category && String(q.category).trim()) filter.category = String(q.category).trim();
  if (q.search && String(q.search).trim()) {
    const rx = new RegExp(String(q.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
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
    products,
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

/** POST /api/admin/categories */
const createCategory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const allowedTypes = ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'];

  v.assertValid({
    name: v.requiredString(name, 'Category name', { min: 2, max: 80 }),
    description: body.description !== undefined
      ? v.requiredString(body.description, 'Description', { min: 0, max: 400 })
      : null,
  });
  if (!allowedTypes.includes(body.type)) {
    throw new ApiError(400, `Type must be one of: ${allowedTypes.join(', ')}`);
  }

  const category = await Category.create({
    name,
    type: body.type,
    image: typeof body.image === 'string' ? body.image.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
  });

  res.status(201).json({ success: true, message: 'Category created.', category });
});

/** PATCH /api/admin/categories/:id */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid category id.');

  const allowedTypes = ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'];
  const data = {};
  if (req.body.name !== undefined) {
    const err = v.requiredString(req.body.name, 'Category name', { min: 2, max: 80 });
    if (err) throw new ApiError(400, err);
    data.name = String(req.body.name).trim();
  }
  if (req.body.type !== undefined) {
    if (!allowedTypes.includes(req.body.type)) throw new ApiError(400, `Type must be one of: ${allowedTypes.join(', ')}`);
    data.type = req.body.type;
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

  const inUse = await Product.countDocuments({ category: category.name, active: true });
  if (inUse > 0) {
    throw new ApiError(409, `Cannot delete: ${inUse} active product(s) still use this category.`);
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = {
  dashboard,
  listProducts,
  listOrders,
  updateOrderStatus,
  listCustomers,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
