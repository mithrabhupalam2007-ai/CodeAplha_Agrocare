const mongoose = require('mongoose');
const { MAIN_CATEGORIES } = require('../utils/taxonomy');

/**
 * Category catalogue — one document per subcategory of the seven main
 * categories (e.g. { type: 'Seeds', name: 'Vegetable Seeds' }).
 *
 * NOTE: subcategory names are only unique WITHIN a main category
 * ('Bio Insecticides' exists under both 'Crop Protection' and 'Organic'),
 * so uniqueness is a compound { name, type } pair.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    /** Main category this subcategory belongs to (one of the seven). */
    type: { type: String, required: true, enum: MAIN_CATEGORIES, index: true },
    /** Heading section inside the main category ('' for Tapas). */
    heading: { type: String, trim: true, default: '', maxlength: 80 },
    image: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
