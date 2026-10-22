/**
 * Category price bands (INR) for the demo catalogue.
 *
 * Every price SAVED through the API (product create/edit and the admin
 * quick-price editor) must fall inside the band of the product's primary
 * category, unless the administrator sends the explicit
 * `allowOutOfRangePrice: true` override — which stamps `priceExempt` on
 * the record so validation can report it as an owner-approved exception.
 *
 * Legacy demo products whose original seed prices fall outside a band are
 * marked `priceExempt` during seeding and kept as known exceptions.
 *
 * Shared with the browser through client/js/pricing.js (kept in parity by
 * `npm run check-taxonomy`).
 */
const PRICE_RANGES = {
  Seeds: { min: 500, max: 2000 },
  'Crop Protection': { min: 500, max: 1500 },
  'Crop Nutrition': { min: 500, max: 1000 },
  Equipments: { min: 1500, max: 5000 },
  'Animal Husbandry': { min: 1000, max: 3500 },
  Organic: { min: 500, max: 1500 },
  Tapas: { min: 500, max: 2000 },
};

/** Demo rating band — every stored rating lives here, in 0.1 steps. */
const DEMO_RATING = { min: 3.5, max: 4.5 };

const rangeFor = (category) => PRICE_RANGES[category] || null;

const inRange = (category, price) => {
  const r = rangeFor(category);
  return Boolean(r) && Number(price) >= r.min && Number(price) <= r.max;
};

/** Human-readable validation message, or null when the price is allowed. */
function priceRangeError(category, price) {
  const r = rangeFor(category);
  if (!r) return null; // unknown category — taxonomy validation reports it
  if (Number(price) >= r.min && Number(price) <= r.max) return null;
  return `Price ₹${price} is outside the allowed range ₹${r.min}–₹${r.max} for ${category}. `
    + 'Re-send with allowOutOfRangePrice=true to apply an authorized override.';
}

module.exports = { PRICE_RANGES, DEMO_RATING, rangeFor, inRange, priceRangeError };
