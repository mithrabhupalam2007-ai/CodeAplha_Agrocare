const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 120, default: '' },
    line2: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    state: { type: String, trim: true, maxlength: 60, default: '' },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, 'PIN code must be 6 digits'],
      default: '',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    address: { type: addressSchema, default: () => ({}) },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

/** Hash the password whenever it is created or changed. */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

/** Compare a candidate password with the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Strip fields that must never leave the API. */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    address: this.address,
    wishlist: this.wishlist,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
