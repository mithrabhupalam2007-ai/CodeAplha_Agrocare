const mongoose = require('mongoose');

/**
 * Product model for seeds, pesticides, fertilizers and farming essentials.
 *
 * NOTE ON PESTICIDE DATA: labelInfo / usage fields are populated from
 * clearly-labelled DEMO data during development. Before any real sale,
 * replace them with verified product label text and registration details
 * required under Indian law.
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 140 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 4000 },
    category: { type: String, required: [true, 'Category is required'], trim: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'],
      index: true,
    },
    brand: { type: String, required: [true, 'Brand / manufacturer is required'], trim: true, maxlength: 100 },
    /** URL/SEO friendly identifier generated from the name. */
    slug: { type: String, trim: true, index: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    /** Optional original (MRP) price — a discount is only shown when mrp > price. */
    mrp: { type: Number, min: [0, 'MRP cannot be negative'], default: null },
    packSize: { type: String, required: [true, 'Pack size is required'], trim: true, maxlength: 40 },
    image: { type: String, required: [true, 'Product image is required'], trim: true },
    images: [{ type: String, trim: true }],
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number',
      },
    },
    /** Crops / intended uses — only for demo products marked as such. */
    crops: [{ type: String, trim: true }],
    /** Seed-specific details (only for type = Seeds). */
    seedInfo: {
      variety: { type: String, trim: true, default: '' },
      cropType: { type: String, trim: true, default: '' },
      germinationPercent: { type: Number, min: 0, max: 100, default: null },
      sowingInstructions: { type: String, trim: true, maxlength: 1200, default: '' },
      daysToGerminate: { type: String, trim: true, default: '' },
    },
    /** Pesticide label / registration details (demo data unless verified). */
    labelInfo: {
      composition: { type: String, trim: true, default: '' },
      registrationNo: { type: String, trim: true, default: '' },
      labelInstructions: { type: String, trim: true, maxlength: 2000, default: '' },
      safetyPrecautions: { type: String, trim: true, maxlength: 2000, default: '' },
      storage: { type: String, trim: true, maxlength: 800, default: '' },
      disposal: { type: String, trim: true, maxlength: 800, default: '' },
    },
    /** Technical specifications as label/value pairs. */
    specifications: [
      {
        _id: false,
        label: { type: String, trim: true, maxlength: 80 },
        value: { type: String, trim: true, maxlength: 300 },
      },
    ],
    /** Batch / expiry tracking where applicable. */
    batch: {
      batchNumber: { type: String, trim: true, default: '' },
      expiryDate: { type: Date, default: null },
    },
    /** True while the product record uses clearly-labelled demo data. */
    isDemoData: { type: Boolean, default: true },
    /** Admin switch to hide a listing without deleting history. */
    active: { type: Boolean, default: true, index: true },
    /**
     * Manual availability override: when true the product is shown as
     * "Out of Stock" for customers even if stockQuantity > 0.
     * Rule: available = active AND stockQuantity > 0 AND !manualOutOfStock
     */
    manualOutOfStock: { type: Boolean, default: false, index: true },
    /** Merchandising flag powering the "Newly Released Products" section. */
    isNewRelease: { type: Boolean, default: false, index: true },
    /** Release date used to sort the New Releases section (falls back to createdAt). */
    releaseDate: { type: Date, default: null },
    /** Simple merchandising flags used by the home page. */
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    seasonal: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ active: 1, stockQuantity: 1 });
productSchema.index({ active: 1, isNewRelease: 1, releaseDate: -1 });

/**
 * Central availability rule used everywhere (API responses + checkout):
 * a product can only be bought when it is active, has stock and is not
 * manually blocked by an administrator.
 */
productSchema.statics.isPurchasable = function (product) {
  return Boolean(product.active && product.stockQuantity > 0 && !product.manualOutOfStock);
};

module.exports = mongoose.model('Product', productSchema);
