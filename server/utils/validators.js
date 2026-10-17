const ApiError = require('./ApiError');

/**
 * Small dependency-free input validators.
 * Each helper returns an error message string, or null when valid.
 */

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

function requiredString(value, label, { min = 1, max = 500 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) return `${label} is required`;
  const len = value.trim().length;
  if (len < min) return `${label} must be at least ${min} characters`;
  if (len > max) return `${label} must be at most ${max} characters`;
  return null;
}

function email(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return 'Email address is required';
  if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address';
  if (value.trim().length > 120) return 'Email address is too long';
  return null;
}

function phone(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return 'Phone number is required';
  if (!PHONE_RE.test(value.trim())) return 'Please enter a valid 10-digit Indian mobile number';
  return null;
}

function pincode(value) {
  if (typeof value !== 'string' || !PINCODE_RE.test(value.trim())) return 'PIN code must be 6 digits';
  return null;
}

function password(value) {
  if (typeof value !== 'string' || value.length === 0) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 72) return 'Password must be at most 72 characters';
  if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter';
  if (!/\d/.test(value)) return 'Password must contain at least one number';
  return null;
}

function positiveNumber(value, label) {
  if (typeof value !== 'number' || Number.isNaN(value)) return `${label} must be a number`;
  if (value < 0) return `${label} cannot be negative`;
  return null;
}

/**
 * Run a map of { field: errorMessage|null } and throw a 400 with the
 * first failure, or return the trimmed/normalized body.
 */
function assertValid(errors) {
  const first = Object.values(errors).find((msg) => msg !== null && msg !== undefined);
  if (first) throw new ApiError(400, first);
}

module.exports = {
  requiredString,
  email,
  phone,
  pincode,
  password,
  positiveNumber,
  assertValid,
};
