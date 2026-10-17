const Category = require('../models/Category');
const Product = require('../models/Product');
const Newsletter = require('../models/Newsletter');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const v = require('../utils/validators');

/** GET /api/categories — active categories with live product counts. */
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ type: 1, name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  res.json({
    success: true,
    categories: categories.map((c) => ({
      ...c,
      productCount: countMap.get(c.name.toLowerCase()) || 0,
    })),
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
