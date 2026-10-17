const crypto = require('crypto');

/**
 * Generate a readable, unique order id, e.g. AS-20261017-4F7K2Q.
 * Collision-safe: callers should retry once on a duplicate key error.
 */
function generateOrderId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `AS-${y}${m}${d}-${suffix}`;
}

module.exports = { generateOrderId };
