const Category = require('../models/Category');
const Product = require('../models/Product');
const Newsletter = require('../models/Newsletter');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const v = require('../utils/validators');

/** GET /api/categories — active categories with live product counts. */
const listCategories = asyncHandler(async (req, res) => {
  const taxonomy = require('../utils/taxonomy');
  const categories = await Category.find({ active: true }).sort({ type: 1, name: 1 }).lean();
  /* Subcategory names repeat across main categories ('Bio Insecticides' is
     sold under Crop Protection and Organic), so counts are resolved per
     {type, name} pair with the same membership rule the product listing
     uses (primary ownership OR additionalCategories). */
  const counts = await Promise.all(
    categories.map((c) =>
      Product.countDocuments({
        active: true,
        subcategory: { $in: taxonomy.subsFor(c.type, c.name) },
        $or: [{ primaryCategory: c.type }, { additionalCategories: c.type }],
      })
    )
  );

  res.json({
    success: true,
    categories: categories.map((c, i) => ({ ...c, productCount: counts[i] })),
  });
});

/**
 * POST /api/newsletter — subscribe to the newsletter list.
 * Duplicate subscriptions answer with a friendly (still truthful) message.
 */
const subscribe = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const err = v.email(email);
  if (err) throw new ApiError(400, err);

  try {
    await Newsletter.create({ email });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return res.json({ success: true, message: 'This email is already subscribed. Thank you!' });
  }

  res.status(201).json({ success: true, message: 'Subscribed! Farming tips are on the way.' });
});

module.exports = { listCategories, subscribe };
