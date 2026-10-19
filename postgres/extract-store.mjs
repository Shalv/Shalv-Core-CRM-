#!/usr/bin/env node
/**
 * Enact360 CRM - locate and export the current CRM state.
 *
 * The application keeps its authoritative CRM data in one of three places:
 *   1. PostgreSQL  -> table crm_state_store, row id='app', column payload (JSON text)
 *   2. Local file  -> .crm_persisted_store.json  (dev / non-serverless runs)
 *   3. Seed file   -> backend/initial-store.json  (bundled defaults)
 *
 * This script pulls the newest available copy into ./snapshot.json so migrate.mjs
 * can load it into the relational schema.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node extract-store.mjs            # prefer Postgres
 *   node extract-store.mjs --file ./.crm_persisted_store.json     # from a file
 *   node extract-store.mjs --seed ../repos/.../backend/initial-store.json
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
const seedArg = args.includes('--seed') ? args[args.indexOf('--seed') + 1] : null;
const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'snapshot.json';

function writeSnapshot(obj, source) {
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2));
  const size = fs.statSync(outPath).size;
  console.log(`Wrote ${outPath} (${(size / 1024).toFixed(1)} KB) from ${source}`);
  const keys = Object.keys(obj);
  console.log(`Top-level keys: ${keys.length} -> ${keys.join(', ')}`);
}

async function fromFile(p, label) {
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  // .crm_persisted_store.json and initial-store.json share the same shape.
  writeSnapshot(raw, `${label} (${p})`);
}

async function main() {
  if (seedArg) return fromFile(seedArg, 'seed file');
  if (fileArg) return fromFile(fileArg, 'local store');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL set and no --file/--seed given.');
    console.error('Tip: your live data is in Postgres table crm_state_store (id=\'app\').');
    console.error('Set DATABASE_URL, or pass --file ./.crm_persisted_store.json');
    process.exit(2);
  }
  const ssl = /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });
  await client.connect();
  const res = await client.query("SELECT payload, updated_at FROM crm_state_store WHERE id = 'app'");
  if (res.rowCount === 0) {
    console.error("No row found in crm_state_store with id='app'.");
    console.error('The database may be empty (a fresh deploy seeds from backend/initial-store.json).');
    await client.end();
    process.exit(3);
  }
  const payload = res.rows[0].payload;
  const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
  console.log(`Found authoritative state in Postgres (updated_at=${res.rows[0].updated_at?.toISOString?.() ?? res.rows[0].updated_at}).`);
  await client.end();
  writeSnapshot(obj, 'Postgres crm_state_store');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
