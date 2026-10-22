#!/usr/bin/env node
/**
 * Non-destructive safety net: dumps every collection to
 * server/backups/<timestamp>/ as JSON before catalogue migrations.
 * The folder is git-ignored — backups stay local.
 *
 *   npm run backup
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const OUT_ROOT = path.resolve(__dirname, '..', 'backups');

async function backup() {
  await connectDB();
  const db = mongoose.connection.db;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(OUT_ROOT, stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  let total = 0;
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 1));
    console.log(`[backup] ${name}: ${docs.length} documents`);
    total += docs.length;
  }
  console.log(`[backup] Wrote ${total} documents to ${outDir}`);

  await disconnectDB();
  process.exit(0);
}

backup().catch(async (err) => {
  console.error('[backup] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
