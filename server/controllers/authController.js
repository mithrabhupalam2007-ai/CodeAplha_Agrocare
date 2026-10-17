const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');
const v = require('../utils/validators');

const COOKIE_NAME = 'agroshield_token';

/** Attach the JWT as an httpOnly cookie (inaccessible to frontend JS). */
function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', path: '/' });
}

/**
 * POST /api/auth/register
 * Creates a customer account. The role is ALWAYS customer —
 * there is no way to self-register as an administrator.
 */
const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const address = body.address && typeof body.address === 'object' ? body.address : {};

  v.assertValid({
    name: v.requiredString(name, 'Full name', { min: 2, max: 80 }),
    email: v.email(rawEmail),
    phone: v.phone(rawPhone),
    password: v.password(body.password),
    addressLine1: v.requiredString(address.line1, 'Address line', { min: 3, max: 120 }),
    city: v.requiredString(address.city, 'City', { min: 2, max: 60 }),
    state: v.requiredString(address.state, 'State', { min: 2, max: 60 }),
    pincode: v.pincode(address.pincode),
  });

  if (body.password !== body.confirmPassword) {
    throw new ApiError(400, 'Passwords do not match.');
  }

  const existing = await User.findOne({ email: rawEmail }).lean();
  if (existing) throw new ApiError(409, 'An account with this email address already exists. Please log in.');

  const user = await User.create({
    name,
    email: rawEmail,
    phone: rawPhone,
    password: body.password, // hashed by the pre-save hook, never stored plain
    role: 'customer', // explicit — cannot be overridden by the request body
    address: {
      line1: String(address.line1).trim(),
      line2: typeof address.line2 === 'string' ? address.line2.trim() : '',
      city: String(address.city).trim(),
      state: String(address.state).trim(),
      pincode: String(address.pincode).trim(),
    },
  });

  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token, // used by cross-origin dev setups (Live Server); cookie is the default
    user: user.toSafeJSON(),
  });
});

/**
 * POST /api/auth/login
 * Verifies credentials and starts a session.
 */
const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawPassword = typeof body.password === 'string' ? body.password : '';

  v.assertValid({
    email: v.email(rawEmail),
    password: v.requiredString(rawPassword, 'Password'),
  });

  // password has select:false, so ask for it explicitly for the comparison only.
  const user = await User.findOne({ email: rawEmail }).select('+password');
  const genericError = new ApiError(401, 'Invalid email address or password.');

  if (!user) throw genericError;

  const matches = await user.comparePassword(rawPassword);
  if (!matches) throw genericError;

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: user.toSafeJSON(),
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (protect middleware runs first).
 */
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie. Safe to call even if already logged out.
 */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = { register, login, me, logout, setAuthCookie, clearAuthCookie };
