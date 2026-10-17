const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    type: {
      type: String,
      required: true,
      enum: ['Seeds', 'Pesticides', 'Fertilizers', 'Farming Essentials'],
      index: true,
    },
    image: { type: String, default: '' },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
