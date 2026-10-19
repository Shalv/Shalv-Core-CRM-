#!/usr/bin/env node
/**
 * Enact360 CRM - remove demo/transactional data from a live database.
 *
 * Keeps master data (users, states, products, tax rates, payment terms,
 * customers, contacts, company profile, license types, roles, payroll config)
 * and clears the transactional records that ship as sample data.
 *
 * It clears BOTH places the app may be reading from:
 *   - the normalized tables (leads, invoices, ... created by schema.sql)
 *   - the legacy JSON blob in crm_state_store (id='app'), if it exists
 *
 * Destructive: dry-run by default. Add --confirm to actually delete.
 *
 *   DATABASE_URL=postgres://... node purge-demo-data.mjs            # preview
 *   DATABASE_URL=postgres://... node purge-demo-data.mjs --confirm  # execute
 */
import pg from 'pg';

const TRANSACTIONAL_TABLES = [
  // child tables first (no FK cascade in the schema)
  'lead_timeline_events', 'lead_linked_contacts',
  'opportunity_remarks', 'opportunity_tasks', 'opportunity_attachments',
  'sales_order_items', 'purchase_order_items', 'invoice_items', 'support_ticket_comments',
  // parents / standalone
  'leads', 'opportunities', 'sales_orders', 'purchase_orders', 'payment_milestones',
  'invoices', 'payment_receipts', 'customer_ledger_entries', 'activities',
  'notifications', 'audit_logs', 'amc_contracts', 'support_tickets', 'support_change_requests',
];

// crmSlices keys that correspond to the tables above
const TRANSACTIONAL_SLICES = [
  'leads', 'opportunities', 'orders', 'purchaseOrders', 'milestones', 'invoices',
  'payments', 'ledgerEntries', 'activities', 'notifications', 'auditLogs',
  'amcContracts', 'supportTickets', 'changeRequests',
];

const confirm = process.argv.includes('--confirm');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL is not set.'); process.exit(2); }
  const ssl = /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });
  await client.connect();

  // Which of the transactional tables actually exist?
  const ex = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)`,
    [TRANSACTIONAL_TABLES]
  );
  const present = ex.rows.map((r) => r.table_name);

  console.log('Transactional tables found:');
  const counts = {};
  for (const t of present) {
    const c = (await client.query(`SELECT count(*) c FROM "${t}"`)).rows[0].c;
    counts[t] = c;
    if (Number(c) > 0) console.log(`  ${t.padEnd(30)} ${c}`);
  }
  if (present.length === 0) console.log('  (none — schema not applied yet)');

  // Blob check
  let blobRows = 0;
  const hasStore = (await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='crm_state_store'`
  )).rowCount > 0;
  if (hasStore) {
    blobRows = (await client.query("SELECT count(*) c FROM crm_state_store WHERE id='app'")).rows[0].c;
    console.log(`Legacy blob row present: ${Number(blobRows) === 1 ? 'yes' : 'no'}`);
  }

  if (!confirm) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --confirm to purge.');
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    if (present.length) {
      await client.query(`TRUNCATE ${present.map((t) => `"${t}"`).join(',')}`);
      console.log(`\nTruncated ${present.length} transactional tables.`);
    }
    if (hasStore && Number(blobRows) > 0) {
      const row = (await client.query("SELECT payload FROM crm_state_store WHERE id='app' FOR UPDATE")).rows[0];
      if (row) {
        const obj = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        if (obj && obj.crmSlices) {
          for (const k of TRANSACTIONAL_SLICES) if (k in obj.crmSlices) obj.crmSlices[k] = [];
        }
        await client.query("UPDATE crm_state_store SET payload=$1, updated_at=NOW() WHERE id='app'", [JSON.stringify(obj)]);
        console.log('Cleared transactional slices in the legacy blob.');
      }
    }
    await client.query('COMMIT');
    console.log('Done. Master data was left untouched.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Purge failed, rolled back:', err.message);
    await client.end();
    process.exit(1);
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
