const mongoose = require('mongoose');

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_METHODS = ['cod', 'demo'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    /** Snapshot of the product at purchase time (name, price never change later). */
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    packSize: { type: String, default: '' },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
      },
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true, match: [/^\d{6}$/, 'PIN code must be 6 digits'] },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharges: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Placed', index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
