const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

/** Pull the raw bearer token from the Authorization header or auth cookie. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies && req.cookies.agroshield_token) return req.cookies.agroshield_token;
  return null;
}

/**
 * Require a valid JWT. Attaches `req.user` (without the password hash).
 * Works with httpOnly cookies (same origin) and bearer tokens (Live Server).
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'You must be logged in to access this resource.');

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account not found. Please log in again.');

  req.user = user;
  next();
});

/** Allow the request only when the authenticated user is an admin. */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'You must be logged in to access this resource.');
  if (req.user.role !== 'admin') throw new ApiError(403, 'Administrator access required.');
  next();
});

/** Attach req.user when a valid token exists, but never reject the request. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (user) req.user = user;
    } catch (err) {
      // Ignore invalid tokens on optional routes — request proceeds anonymously.
    }
  }
  next();
});

module.exports = { protect, requireAdmin, optionalAuth };
