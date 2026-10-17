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
 * Creates a customer account from name, email, phone and address — there is
 * no password step (email-only demo auth) and no way to self-register as an
 * administrator; the role is ALWAYS customer.
 */
const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const address = body.address && typeof body.address === 'object' ? body.address : {};

  // Email-only signup: name, email, phone and delivery address — no password
  // (a leftover password field in the request is simply ignored).
  v.assertValid({
    name: v.requiredString(name, 'Full name', { min: 2, max: 80 }),
    email: v.email(rawEmail),
    phone: v.phone(rawPhone),
    addressLine1: v.requiredString(address.line1, 'Address line', { min: 3, max: 120 }),
    city: v.requiredString(address.city, 'City', { min: 2, max: 60 }),
    state: v.requiredString(address.state, 'State', { min: 2, max: 60 }),
    pincode: v.pincode(address.pincode),
  });

  const existing = await User.findOne({ email: rawEmail }).lean();
  if (existing) throw new ApiError(409, 'An account with this email address already exists. Please log in.');

  const user = await User.create({
    name,
    email: rawEmail,
    phone: rawPhone,
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
 * POST /api/auth/login — EMAIL-ONLY LOGIN (development demo mode).
 *
 * SECURITY NOTICE: knowing an email address is the ONLY check here — email
 * alone does not prove the person owns that mailbox. This simplified,
 * low-security mode is acceptable for local development/demo use ONLY.
 * Do NOT deploy it on a publicly accessible site or protect real
 * administrator accounts with it. Before production, add real verification
 * (one-time emailed code, magic login link, or password authentication).
 *
 * Flow: validate email format -> look up the account in MongoDB ->
 * verify its role (admin page requires role 'admin', user page requires
 * role 'customer') -> issue a signed, expiring session (JWT cookie).
 *
 * The role used for authorisation ALWAYS comes from the DATABASE record —
 * `loginAs` may only RESTRICT access on the admin page; it can never grant
 * admin rights, and any role-like field sent by the client is ignored.
 */
const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const rawEmail =
    (typeof body.email === 'string' && body.email.trim()) ||
    (typeof body.identifier === 'string' && body.identifier.trim()) ||
    '';
  const isAdminLogin = body.loginAs === 'admin';

  const emailErr = v.email(rawEmail);
  if (emailErr) throw new ApiError(400, emailErr);
  const email = rawEmail.toLowerCase();

  // Development-only diagnostic log (address is masked, no secrets logged).
  const logLoginFailure = (reason) => {
    if (process.env.NODE_ENV === 'production') return;
    const shown = email.replace(/^(.{2}).*(@.+)$/, '$1***$2');
    console.log(`[auth] ${isAdminLogin ? 'admin' : 'user'} login failed (${reason}) for ${shown}`);
  };

  const user = await User.findOne({ email });
  if (!user) {
    logLoginFailure('unregistered email');
    throw new ApiError(
      404,
      isAdminLogin
        ? 'No account is registered with this email address. Please check the email or contact the store owner.'
        : 'This email address is not registered. Please create an account first.'
    );
  }

  // --- role checks, server-side, against the database record ---
  if (isAdminLogin && user.role !== 'admin') {
    logLoginFailure('customer account on admin login');
    throw new ApiError(403, 'This account does not have administrator access. Please use "Login as User" instead.');
  }
  if (!isAdminLogin && user.role !== 'customer') {
    logLoginFailure('admin account on user login');
    throw new ApiError(403, 'This is an administrator account. Please sign in from the Admin Login page.');
  }

  const token = signToken(user); // signed + expiring (JWT_EXPIRES_IN, default 7d)
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
