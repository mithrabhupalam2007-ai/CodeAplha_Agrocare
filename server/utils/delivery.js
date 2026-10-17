/**
 * Delivery charge rules.
 * - Free delivery on orders of DELIVERY_FREE_THRESHOLD or more.
 * - A flat charge below that amount.
 * Keep these in sync with the checkout page copy.
 */
const FREE_DELIVERY_THRESHOLD = Number(process.env.FREE_DELIVERY_THRESHOLD) || 499;
const FLAT_DELIVERY_CHARGE = Number(process.env.FLAT_DELIVERY_CHARGE) || 49;

function calculateDeliveryCharges(subtotal) {
  if (subtotal <= 0) return { deliveryCharges: 0, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD };
  const deliveryCharges = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_CHARGE;
  return { deliveryCharges, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD };
}

module.exports = {
  calculateDeliveryCharges,
  FREE_DELIVERY_THRESHOLD,
  FLAT_DELIVERY_CHARGE,
};
