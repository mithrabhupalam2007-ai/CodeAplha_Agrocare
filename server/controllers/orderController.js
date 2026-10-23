const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateOrderId } = require('../utils/orderId');
const { calculateDeliveryCharges } = require('../utils/delivery');
const v = require('../utils/validators');

/**
 * POST /api/orders  (authenticated checkout)
 *
 * Prices and totals sent by the browser are IGNORED. The server:
 *  1. validates the customer + delivery address,
 *  2. reloads every product and its current price from MongoDB,
 *  3. verifies stock with an atomic conditional decrement (no overselling),
 *  4. computes subtotal / delivery / total itself,
 *  5. writes the order with snapshots, then
 *  6. restocks automatically if anything fails afterwards.
 * Duplicate submissions (double click / retry) that reuse the same
 * clientRequestId are collapsed into the first order — the extra stock that
 * was taken is returned before the existing order is handed back.
 */
const createOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const addr = body.shippingAddress || {};

  v.assertValid({
    fullName: v.requiredString(addr.fullName, 'Full name', { min: 2, max: 80 }),
    phone: v.phone(addr.phone),
    line1: v.requiredString(addr.line1, 'Address line', { min: 3, max: 120 }),
    city: v.requiredString(addr.city, 'City', { min: 2, max: 60 }),
    state: v.requiredString(addr.state, 'State', { min: 2, max: 60 }),
    pincode: v.pincode(addr.pincode),
  });

  const paymentMethod = body.paymentMethod;
  if (!['cod', 'demo'].includes(paymentMethod)) {
    throw new ApiError(400, 'Please choose a valid payment method (Cash on Delivery or Demo Payment).');
  }

  // Optional idempotency key generated once per checkout page load. Repeated
  // submissions of the SAME checkout (double click, network retry) reuse it and
  // collapse into one order; a fresh checkout gets a fresh key.
  const clientRequestId =
    typeof body.clientRequestId === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(body.clientRequestId.trim())
      ? body.clientRequestId.trim()
      : undefined;

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }

  // Merge duplicate lines and validate each entry's shape.
  const wanted = new Map();
  for (const item of body.items) {
    const id = item && item.product;
    const qty = Number(item && item.quantity);
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      throw new ApiError(400, 'Cart contains an invalid product. Please refresh and try again.');
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      throw new ApiError(400, 'Each cart quantity must be between 1 and 999.');
    }
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const ids = [...wanted.keys()];
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  // Validate availability before touching inventory.
  const decremented = [];
  const items = [];

  for (const [id, qty] of wanted) {
    const product = byId.get(id);
    if (!product) throw new ApiError(400, 'One or more products in your cart are no longer available.');
    // Same availability rule as the storefront: active AND stock > 0 AND
    // not manually blocked by an administrator.
    if (product.manualOutOfStock) {
      throw new ApiError(409, `"${product.name}" is currently unavailable. Please remove it from your cart.`);
    }
    if (product.stockQuantity < qty) {
      throw new ApiError(
        409,
        `Only ${product.stockQuantity} unit(s) of "${product.name}" are in stock. Please reduce the quantity.`
      );
    }
    items.push({ product, qty });
  }

  try {
    // Atomic conditional decrement: only succeeds while stock is sufficient
    // and the product is still purchasable, so two simultaneous checkouts can
    // never oversell the same unit.
    for (const { product, qty } of items) {
      const result = await Product.findOneAndUpdate(
        { _id: product._id, active: true, manualOutOfStock: { $ne: true }, stockQuantity: { $gte: qty } },
        { $inc: { stockQuantity: -qty } },
        { new: true }
      );
      if (!result) {
        throw new ApiError(409, `"${product.name}" sold out while you were checking out. Please adjust your cart.`);
      }
      decremented.push({ id: product._id, qty });
    }

    const subtotal = items.reduce((sum, { product, qty }) => sum + product.price * qty, 0);
    const { deliveryCharges } = calculateDeliveryCharges(subtotal);
    const total = Math.round((subtotal + deliveryCharges) * 100) / 100;

    const shippingAddress = {
      fullName: String(addr.fullName).trim(),
      phone: String(addr.phone).trim(),
      line1: String(addr.line1).trim(),
      line2: typeof addr.line2 === 'string' ? addr.line2.trim() : '',
      city: String(addr.city).trim(),
      state: String(addr.state).trim(),
      pincode: String(addr.pincode).trim(),
    };

    let order;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await Order.create({
          orderId: generateOrderId(),
          clientRequestId,
          user: req.user._id,
          items: items.map(({ product, qty }) => ({
            product: product._id,
            name: product.name,
            price: product.price,
            packSize: product.packSize,
            image: product.image,
            quantity: qty,
            lineTotal: Math.round(product.price * qty * 100) / 100,
          })),
          shippingAddress,
          subtotal: Math.round(subtotal * 100) / 100,
          deliveryCharges,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
          orderStatus: 'Placed',
          statusHistory: [{ status: 'Placed', at: new Date(), note: 'Order placed by customer' }],
        });
        break;
      } catch (err) {
        const duplicateKey =
          err.code === 11000 && err.keyPattern && err.keyPattern.clientRequestId;
        if (duplicateKey && clientRequestId) {
          // The same checkout was already submitted earlier: give this
          // request's stock back, then hand the caller the existing order.
          await Promise.all(
            decremented.map(({ id, qty }) => Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } }))
          );
          decremented.length = 0; // outer catch must not restock twice
          const existing = await Order.findOne({ user: req.user._id, clientRequestId }).lean();
          if (existing) {
            return res.json({
              success: true,
              alreadyPlaced: true,
              message: 'This checkout was already placed — showing the existing order.',
              order: existing,
              cartItemIds: existing.items.map((it) => it.product.toString()),
            });
          }
          throw new ApiError(409, 'This checkout was already submitted. Please check My Orders.');
        }
        if (err.code === 11000 && attempt < 2) continue; // order id collision -> retry
        throw err;
      }
    }
    if (!order) throw new ApiError(500, 'Could not allocate an order id. Please try again.');

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
      cartItemIds: items.map(({ product }) => product._id.toString()),
    });
  } catch (err) {
    // Compensate: return every unit we took out of stock before failing.
    await Promise.all(
      decremented.map(({ id, qty }) => Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } }))
    );
    throw err;
  }
});

/** GET /api/orders/my — only the caller's own orders (newest first). */
const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
});

/** GET /api/orders/:id — owner or admin only; other customers get 403. */
const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const key = mongoose.isValidObjectId(id) ? { _id: id } : { orderId: id };
  const order = await Order.findOne(key);
  if (!order) throw new ApiError(404, 'Order not found.');

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not allowed to view this order.');
  }

  res.json({ success: true, order });
});

/** Valid transitions a customer may trigger. */
const CUSTOMER_CANCELLABLE = ['Placed', 'Confirmed'];

/**
 * PATCH /api/orders/:id/cancel
 * Customers may cancel only while the order is still Placed/Confirmed;
 * stock is returned to inventory when the cancel succeeds.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid order id.');

  const order = await Order.findOne({ _id: id });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not allowed to modify this order.');
  }
  if (!CUSTOMER_CANCELLABLE.includes(order.orderStatus)) {
    throw new ApiError(400, `This order can no longer be cancelled (status: ${order.orderStatus}).`);
  }

  order.orderStatus = 'Cancelled';
  order.statusHistory.push({
    status: 'Cancelled',
    at: new Date(),
    note: `Cancelled by customer${req.body && req.body.reason ? ` — ${String(req.body.reason).slice(0, 200)}` : ''}`,
  });

  // Return units to stock atomically, then persist the status change.
  await Promise.all(
    order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } }))
  );
  await order.save();

  res.json({ success: true, message: 'Order cancelled and stock restored.', order });
});

module.exports = { createOrder, listMyOrders, getOrder, cancelOrder };
