/**
 * Category price bands (INR) — browser mirror of server/utils/pricing.js.
 *
 * The backend is always the source of truth; this copy only powers admin
 * form hints (allowed min–max under the price field) and inline
 * explanations. `npm run check-taxonomy` verifies the two stay identical.
 */
window.PRICING = {
  PRICE_RANGES: {
    Seeds: { min: 500, max: 2000 },
    'Crop Protection': { min: 500, max: 1500 },
    'Crop Nutrition': { min: 500, max: 1000 },
    Equipments: { min: 1500, max: 5000 },
    'Animal Husbandry': { min: 1000, max: 3500 },
    Organic: { min: 500, max: 1500 },
    Tapas: { min: 500, max: 2000 },
  },
  DEMO_RATING: { min: 3.5, max: 4.5 },

  rangeFor(category) {
    return this.PRICE_RANGES[category] || null;
  },

  /** "₹500 – ₹1,500" hint text, or '' for unknown categories. */
  rangeLabel(category) {
    const r = this.rangeFor(category);
    if (!r) return '';
    return `Allowed ₹${r.min.toLocaleString('en-IN')} – ₹${r.max.toLocaleString('en-IN')}`;
  },

  inRange(category, price) {
    const r = this.rangeFor(category);
    return Boolean(r) && Number(price) >= r.min && Number(price) <= r.max;
  },
};
