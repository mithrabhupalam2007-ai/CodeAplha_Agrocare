const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

/** Sign a JWT containing only the identifiers we need. */
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Verify a JWT and return its payload, or throw a 401 ApiError. */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Session expired or invalid. Please log in again.');
  }
}

module.exports = { signToken, verifyToken };
