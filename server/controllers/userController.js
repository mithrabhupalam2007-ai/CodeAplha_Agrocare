const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { decorateAll } = require('./productController');
const v = require('../utils/validators');

/** GET /api/users/profile */
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

/** PATCH /api/users/profile — update name, phone and saved address. */
const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const user = req.user;

  if (body.name !== undefined) {
    const err = v.requiredString(body.name, 'Full name', { min: 2, max: 80 });
    if (err) throw new ApiError(400, err);
    user.name = String(body.name).trim();
  }
  if (body.phone !== undefined) {
    const err = v.phone(body.phone);
    if (err) throw new ApiError(400, err);
    user.phone = String(body.phone).trim();
  }
  if (body.address !== undefined) {
    const a = body.address || {};
    v.assertValid({
      line1: v.requiredString(a.line1, 'Address line', { min: 3, max: 120 }),
      city: v.requiredString(a.city, 'City', { min: 2, max: 60 }),
      state: v.requiredString(a.state, 'State', { min: 2, max: 60 }),
      pincode: v.pincode(a.pincode),
    });
    user.address = {
      line1: String(a.line1).trim(),
      line2: typeof a.line2 === 'string' ? a.line2.trim() : '',
      city: String(a.city).trim(),
      state: String(a.state).trim(),
      pincode: String(a.pincode).trim(),
    };
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated.', user: user.toSafeJSON() });
});

/** GET /api/users/wishlist — populated with currently active products. */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { active: true },
    select:
      'name price mrp packSize image images primaryCategory heading subcategory additionalCategories stockQuantity manualOutOfStock active rating reviewCount brand',
  });
  // Products removed from the catalogue (e.g. retired demo listings) leave
  // nulls behind — drop them so the wishlist never crashes and never shows
  // placeholders. The stored id stays on the user until it is explicitly
  // removed from the wishlist page.
  const items = decorateAll(user.wishlist.filter(Boolean).map((p) => p.toObject()));
  res.json({ success: true, wishlist: items });
});

/** POST /api/users/wishlist/:productId */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findOne({ _id: productId, active: true }).select('_id');
  if (!product) throw new ApiError(404, 'Product not found.');

  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: product._id } });
  res.json({ success: true, message: 'Added to wishlist.' });
});

/** DELETE /api/users/wishlist/:productId */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
  res.json({ success: true, message: 'Removed from wishlist.' });
});

module.exports = {
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
