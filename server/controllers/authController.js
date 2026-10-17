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
 *
 * Accepts either an email address or a username (the account's full name)
 * through `identifier`, plus plain `email` for backwards compatibility.
 * The role used for authorisation always comes from the DATABASE record —
 * any role-like field sent by the client is ignored.
 */
const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const rawId =
    (typeof body.identifier === 'string' && body.identifier.trim()) ||
    (typeof body.email === 'string' && body.email.trim()) ||
    '';
  const rawPassword = typeof body.password === 'string' ? body.password : '';

  v.assertValid({
    identifier: v.requiredString(rawId, 'Email or username', { min: 3, max: 120 }),
    password: v.requiredString(rawPassword, 'Password'),
  });

  const genericError = new ApiError(401, 'Invalid credentials. Please check your email/username and password.');

  // Development-only diagnostic log (identities are masked, passwords never logged).
  const logLoginFailure = (reason) => {
    if (process.env.NODE_ENV === 'production') return;
    const shown = rawId.includes('@')
      ? rawId.trim().toLowerCase().replace(/^(.{2}).*(@.+)$/, '$1***$2')
      : `username "${rawId.trim()}"`;
    console.log(`[auth] login failed (${reason}) for ${shown}`);
  };

  let user = null;
  if (rawId.includes('@')) {
    // Email login — normalised exactly like registration (trim + lowercase).
    const err = v.email(rawId);
    if (err) throw new ApiError(400, err);
    user = await User.findOne({ email: rawId.trim().toLowerCase() }).select('+password');
    if (!user) {
      logLoginFailure('unknown email');
      throw genericError;
    }
  } else {
    // Username login: exact, case-insensitive full-name match.
    // Only accepted when the match is unambiguous (limit 2 -> length must be 1).
    const esc = rawId.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await User.find({ name: new RegExp(`^${esc}$`, 'i') })
      .select('+password')
      .limit(2);
    if (matches.length !== 1) {
      logLoginFailure(matches.length === 0 ? 'unknown username' : 'ambiguous username');
      throw genericError;
    }
    user = matches[0];
  }

  // Never call comparePassword() on a null user or without a stored hash —
  // either case is treated as invalid credentials, not as a server error.
  if (!user || !user.password) {
    logLoginFailure('missing password hash');
    throw genericError;
  }

  const matches = await user.comparePassword(rawPassword);
  if (!matches) {
    logLoginFailure('wrong password');
    throw genericError;
  }

  // Optional UX guard used by the Admin Login page: `loginAs: 'admin'` may only
  // RESTRICT access (admins can still log in through the user login), it never
  // grants it. Authorisation for admin APIs/pages always relies on the role in
  // the database record.
  if (body.loginAs === 'admin' && user.role !== 'admin') {
    logLoginFailure('non-admin account on admin login');
    throw new ApiError(403, 'This account does not have administrator access. Please use "Login as User" instead.');
  }

  const token = signToken(user);
  setAuthCookie(res, token);

  // role comes from the database record, never from the request body.
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
