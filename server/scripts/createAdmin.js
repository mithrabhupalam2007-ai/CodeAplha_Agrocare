/**
 * Create (or update) the administrator account from environment variables.
 *
 *   npm run create-admin
 *
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from server/.env.
 * Self-registration can NEVER create an admin — this script is the
 * only supported path, which keeps the role protected.
 */
require('dotenv').config();

const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/db');

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@agroshield.in').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'AgroShield Administrator';

  if (!password || password.length < 8) {
    console.error('[admin] ADMIN_PASSWORD must be at least 8 characters (set it in server/.env).');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.role = 'admin';
    existing.name = name;
    existing.password = password; // re-hashed by the pre-save hook
    await existing.save();
    console.log(`[admin] Updated existing account ${email} to the admin role.`);
  } else {
    await User.create({ name, email, phone: '9000000000', password, role: 'admin' });
    console.log(`[admin] Created administrator account: ${email}`);
  }

  console.log('[admin] Log in at /pages/login.html with these credentials.');
  await disconnectDB();
  process.exit(0);
}

createAdmin().catch(async (err) => {
  console.error('[admin] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
