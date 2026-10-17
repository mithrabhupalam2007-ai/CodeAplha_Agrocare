const { parse } = require('cookie');

/** Minimal cookie parser (avoids an extra dependency). */
function cookieParser(req, res, next) {
  const raw = req.headers.cookie;
  req.cookies = raw ? parse(raw) : {};
  next();
}

module.exports = cookieParser;
