const ApiError = require('../utils/ApiError');

/** 404 for unknown API routes. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** MongoDB/Mongoose connectivity failures (as opposed to bad input). */
function isDbConnectionError(err) {
  return (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    (err.name === 'MongooseError' &&
      /buffering|timed out|initial connection|connection/i.test(err.message || '')) ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNREFUSED'
  );
}

/**
 * Global error handler.
 * Every failed request answers with a consistent JSON shape:
 *   { success: false, message: string, errors?: [...] }
 *
 * Rules:
 * - 4xx messages are user-facing and safe to return as-is.
 * - 5xx responses NEVER leak internal details (stack traces, database or
 *   mongoose messages) — clients get a friendly generic message while the
 *   real error is logged server-side for developers.
 * - Database connectivity problems are reported as 503 "try again later",
 *   clearly separated from invalid credentials.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let internal = status >= 500; // may be downgraded to a specific 4xx/503 below

  // Mongoose validation error -> 400 with the first field message.
  if (err.name === 'ValidationError') {
    status = 400;
    internal = false;
    message =
      Object.values(err.errors)
        .map((e) => e.message)
        .join('. ') || 'Invalid input supplied.';
  }

  // Mongoose bad ObjectId -> 400 "invalid identifier" instead of a crash.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 400;
    internal = false;
    message = 'Invalid identifier supplied.';
  }

  // Duplicate key (unique index) -> surface a friendly message.
  if (err.code === 11000) {
    status = 409;
    internal = false;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  }

  // Database unreachable / connection lost / query buffering timed out.
  // Infrastructure problem, NOT bad credentials -> 503 + clear message.
  if (internal && isDbConnectionError(err)) {
    status = 503;
    internal = false;
    message = 'We could not reach the database right now. Please try again in a moment.';
  }

  // Anything still 5xx: log the real error for developers.
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  }
  // Unknown 5xx problems never expose internals to the client (503 keeps its
  // specific "database unreachable" message set above).
  if (internal) {
    message = 'Something went wrong on our end. Please try again in a moment.';
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.name === 'ValidationError'
      ? { errors: Object.values(err.errors || {}).map((e) => e.message) }
      : {}),
  });
}

module.exports = { notFound, errorHandler };
