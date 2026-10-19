#!/usr/bin/env node
/**
 * Enact360 CRM - repair a database that has stale tables from an older revision.
 *
 * An earlier version of this app created relational tables with a different shape
 * (e.g. `sales_orders.order_no` instead of `order_number`). Because the current
 * schema uses `CREATE TABLE IF NOT EXISTS`, those stale tables are left in place
 * and the new indexes fail on the missing columns.
 *
 * This script finds every table that the current schema expects but that is
 * missing expected columns (i.e. a stale table), reports it, and - with --confirm -
 * drops it so the app can recreate it correctly on the next request.
 *
 * Your real data lives in the crm_state_store blob, not in these tables, so
 * dropping them loses nothing; run postgres/migrate.mjs afterwards to load it.
 *
 *   DATABASE_URL=postgres://... node repair-schema.mjs            # preview
 *   DATABASE_URL=postgres://... node repair-schema.mjs --confirm  # drop stale tables
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const confirm = process.argv.includes('--confirm');

// --- expected shape, parsed from schema.sql ---------------------------------
const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const expected = {};
for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
  const cols = new Set();
  for (const line of m[2].split('\n')) {
    const mm = line.match(/^\s*([a-z_0-9]+)\s+[A-Z]/);
    if (mm) cols.add(mm[1]);
  }
  expected[m[1]] = cols;
}
console.log(`Schema expects ${Object.keys(expected).length} tables.`);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL is not set.'); process.exit(2); }
  const ssl = /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });
  await client.connect();

  const dbCols = {};
  const r = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`);
  for (const row of r.rows) (dbCols[row.table_name] ||= new Set()).add(row.column_name);

  const stale = [];
  for (const table of Object.keys(expected)) {
    if (!dbCols[table]) continue; // doesn't exist yet -> the app will create it
    const missing = [...expected[table]].filter((c) => !dbCols[table].has(c));
    if (missing.length) stale.push({ table, missing });
  }

  const extra = Object.keys(dbCols).filter((t) => !expected[t]);

  if (stale.length === 0) {
    console.log('\nNo stale tables found - the schema matches. Nothing to repair.');
  } else {
    console.log('\nStale tables (exist but do not match the current schema):');
    for (const s of stale) {
      console.log(`  ${s.table.padEnd(28)} missing ${s.missing.length} column(s): ${s.missing.slice(0, 6).join(', ')}${s.missing.length > 6 ? ', ...' : ''}`);
    }
  }
  if (extra.length) {
    console.log('\nOther tables not managed by this schema (left untouched):');
    console.log('  ' + extra.join(', '));
  }

  if (stale.length === 0) { await client.end(); return; }

  if (!confirm) {
    console.log('\nDRY RUN - nothing dropped. Re-run with --confirm to drop the stale tables.');
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    for (const s of stale) {
      await client.query(`DROP TABLE IF EXISTS "${s.table}" CASCADE`);
      console.log(`  dropped ${s.table}`);
    }
    await client.query('COMMIT');
    console.log('\nDone. Reload the app - it will recreate these tables correctly.');
    console.log('Then load your data:  node migrate.mjs snapshot.json');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Repair failed, rolled back:', err.message);
    await client.end();
    process.exit(1);
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
