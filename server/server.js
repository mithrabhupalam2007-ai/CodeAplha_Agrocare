/**
 * AgroShield API server
 * Express + MongoDB REST API. Also serves the static frontend in client/.
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');

const { connectDB, disconnectDB } = require('./config/db');
const cookieParser = require('./middleware/cookieParser');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const miscRoutes = require('./routes/miscRoutes');

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

function createApp() {
  const app = express();

  app.set('trust proxy', 1); // accurate client IPs behind a proxy (for rate limiting)

  // Security hardening
  app.use(
    helmet({
      contentSecurityPolicy: false, // the frontend is plain HTML/CSS/JS served by us
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS for trusted frontend origins (e.g. VS Code Live Server on :5500).
  // In development any localhost/127.0.0.1 port is accepted so the site also
  // works when opened through a local dev server; production should rely on
  // the explicit CLIENT_ORIGIN allow-list.
  const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin))) {
          return callback(null, true);
        }
        callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser);

  // Strip MongoDB operators out of anything a client sends.
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') req.body = mongoSanitize(req.body);
    next();
  });

  // ---------- Login wall for the shopping pages ----------
  // Defence in depth: even if someone requests an HTML page directly, the
  // server refuses to hand it out without a valid signed session (the JWT is
  // httpOnly cookie or an Authorization header). Static assets (css/js/images)
  // and the public pages (selection, logins, register) are never blocked.
  const { verifyToken } = require('./utils/token');
  const LOGIN_PAGE = '/';
  const PROTECTED_PAGES = [
    '/pages/home.html',
    '/pages/products.html',
    '/pages/product-details.html',
    '/pages/cart.html',
    '/pages/checkout.html',
    '/pages/order-confirmation.html',
    '/pages/account.html',
    '/pages/wishlist.html',
  ];
  const ADMIN_PAGES = ['/pages/admin.html'];

  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const page = req.path;
    if (!PROTECTED_PAGES.includes(page) && !ADMIN_PAGES.includes(page)) return next();

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : (req.cookies && req.cookies.agroshield_token) || '';

    if (!token) return res.redirect(`${LOGIN_PAGE}?next=${encodeURIComponent(page)}`);

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.redirect(`${LOGIN_PAGE}?next=${encodeURIComponent(page)}`);
    }

    // The role claim is signed by this server, so it is trustworthy here.
    if (ADMIN_PAGES.includes(page) && payload.role !== 'admin') {
      return res.redirect('/pages/admin-login.html');
    }

    return next();
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(`[api] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // ---------- API ----------
  app.get('/api/health', (req, res) =>
    res.json({ success: true, status: 'ok', service: 'agroshield-api', time: new Date().toISOString() })
  );
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', miscRoutes);
  app.use('/api', notFound);

  // ---------- Static frontend ----------
  app.use(express.static(CLIENT_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIR, 'index.html'));
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function main() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me_to_a_long_random_secret') {
    console.warn('[warn] JWT_SECRET is not set. Copy server/.env.example to server/.env and set a real secret.');
  }

  await connectDB();
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[server] AgroShield running at http://localhost:${PORT}`);
    console.log(`[server] Frontend : http://localhost:${PORT}/`);
    console.log(`[server] API      : http://localhost:${PORT}/api/health`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Failed to start:', err.stack || err.message);
  process.exit(1);
});

module.exports = { createApp };
