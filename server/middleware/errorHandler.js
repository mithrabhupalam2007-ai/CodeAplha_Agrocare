const ApiError = require('../utils/ApiError');

/** 404 for unknown API routes. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler.
 * Every failed request answers with a consistent JSON shape:
 *   { success: false, message: string, errors?: [...] }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Mongoose validation error -> 400 with the first field message.
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ') || 'Invalid input supplied.';
  }

  // Mongoose bad ObjectId -> 404 style "not found" instead of a crash.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 400;
    message = 'Invalid identifier supplied.';
  }

  // Duplicate key (unique index) -> surface a friendly message.
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
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
