/**
 * Verify the client taxonomy (client/js/taxonomy.js) exactly matches the
 * server taxonomy (server/utils/taxonomy.js). Run manually or from CI:
 *
 *   node server/scripts/checkTaxonomyParity.js
 *
 * Exits non-zero (and prints the differences) if the two drift apart.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const taxonomy = require('../utils/taxonomy');

const clientFile = path.join(__dirname, '..', '..', 'client', 'js', 'taxonomy.js');
const source = fs.readFileSync(clientFile, 'utf8');

// Evaluate the client file in a sandbox and grab the TAXONOMY global it defines.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${source}\nthis.__t = TAXONOMY;`, sandbox);
const client = sandbox.__t;

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`[parity] MISMATCH: ${msg}`);
};

// 1. Main category order + membership
if (JSON.stringify(client.MAIN) !== JSON.stringify(taxonomy.MAIN_CATEGORIES)) {
  fail(`main categories differ:\n  server: ${taxonomy.MAIN_CATEGORIES.join(' | ')}\n  client: ${client.MAIN.join(' | ')}`);
}

// 2. Heading sections + subcategory lists, in order, for every main category
for (const type of taxonomy.MAIN_CATEGORIES) {
  const serverGroups = taxonomy.CATEGORY_STRUCTURE[type];
  const clientGroups = client.STRUCTURE && client.STRUCTURE[type];
  if (!clientGroups) {
    fail(`client is missing STRUCTURE["${type}"]`);
    continue;
  }
  if (JSON.stringify(serverGroups) !== JSON.stringify(clientGroups)) {
    fail(`heading structure for "${type}" differs:\n  server: ${JSON.stringify(serverGroups)}\n  client: ${JSON.stringify(clientGroups)}`);
  }
  const serverSubs = taxonomy.SUBCATEGORIES[type];
  const clientSubs = client.SUBS[type];
  if (!clientSubs) {
    fail(`client is missing SUBS["${type}"]`);
    continue;
  }
  if (JSON.stringify(serverSubs) !== JSON.stringify(clientSubs)) {
    fail(`subcategories for "${type}" differ:\n  server: ${serverSubs.join(' | ')}\n  client: ${clientSubs.join(' | ')}`);
  }
}

// 3. Every subcategory tile art exists on disk
const artDir = path.join(__dirname, '..', '..', 'client', 'images', 'subcategories');
for (const subs of Object.values(taxonomy.SUBCATEGORIES)) {
  for (const sub of subs) {
    const file = path.join(
      artDir,
      `${sub
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}.svg`
    );
    if (!fs.existsSync(file)) fail(`missing subcategory art: ${path.basename(file)}`);
  }
}

// 4. Every main-category card image exists on disk
const catDir = path.join(__dirname, '..', '..', 'client', 'images', 'categories');
for (const [type, img] of Object.entries(client.MAIN_IMAGES || {})) {
  const file = path.join(catDir, img.replace('/images/categories/', ''));
  if (!fs.existsSync(file)) fail(`missing main-category art for "${type}": ${img}`);
}

if (failed) {
  console.error('[parity] FAILED — fix the lists above (server/utils/taxonomy.js is the source of truth).');
  process.exit(1);
}
console.log('[parity] OK — client and server taxonomies match, and all subcategory art exists.');
