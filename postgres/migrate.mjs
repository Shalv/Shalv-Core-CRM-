#!/usr/bin/env node
/**
 * Enact360 CRM - JSON snapshot -> normalized PostgreSQL migration.
 *
 * Reads a CRM state snapshot (the shape stored in crm_state_store.payload, the
 * local .crm_persisted_store.json, or backend/initial-store.json), creates the
 * relational schema, and loads every entity into its own table.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node migrate.mjs ./snapshot.json
 *   node migrate.mjs ./snapshot.json --dry-run
 *
 * Behaviour:
 *   - Idempotent: target tables are TRUNCATEd then reloaded in one transaction.
 *   - Lossless for payroll (each row keeps its full record in `data` jsonb).
 *   - Column types are read back from the database catalog, so values are
 *     coerced to match the DDL exactly (no hard-coded type list to drift).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const snapshotPath = args.find((a) => !a.startsWith('--')) || path.join(__dirname, 'snapshot.json');
const schemaPath = path.join(__dirname, 'schema.sql');

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------
const snake = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const asArray = (v) => (Array.isArray(v) ? v : []);

/** Map an object's own keys to snake_case column names. */
function mapRow(obj) {
  const out = {};
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) out[snake(k)] = v;
  return out;
}

// --------------------------------------------------------------------------
// coercion (applied per actual DB column type)
// --------------------------------------------------------------------------
function coerce(value, dataType) {
  if (value === undefined) return null;
  if (dataType === 'jsonb' || dataType === 'json') {
    if (value === null) return null;
    if (typeof value === 'string') {
      // Already-JSON text is kept as-is; a plain string is stored as a JSON string.
      try {
        JSON.parse(value);
        return value;
      } catch {
        return JSON.stringify(value);
      }
    }
    return JSON.stringify(value);
  }
  if (value === null) return null;
  switch (dataType) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const t = value.trim().toLowerCase();
        if (['true', 'yes', 'y', '1'].includes(t)) return true;
        if (['false', 'no', 'n', '0', ''].includes(t)) return false;
      }
      return null;
    case 'integer':
    case 'bigint':
    case 'smallint':
    case 'numeric':
    case 'real':
    case 'double precision': {
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      const t = String(value).replace(/[,\s₹]/g, '').trim();
      if (t === '') return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    }
    case 'date':
      return toDate(value);
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return toTimestamp(value);
    default:
      // text and everything else
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (isPlainObject(value) || Array.isArray(value)) return JSON.stringify(value);
      return null;
  }
}

function valueHasTime(v) {
  return typeof v === 'string' && /\d{1,2}:\d{2}/.test(v);
}

/** Return an ISO-8601 timestamp string, or null when unparseable. */
function toTimestamp(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString();
  const s = String(v).trim();
  if (!s) return null;
  // 'YYYY-MM-DD HH:MM' (space, no zone) -> parsed deterministically as UTC.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
  if (m) return `${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}.000Z`;
  if (valueHasTime(s)) {
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString();
  }
  const d = toDate(s);
  return d ? `${d}T00:00:00.000Z` : null;
}

/** Return an ISO 'YYYY-MM-DD' string, or null when unparseable. */
function toDate(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  if (!s) return null;
  // Fast path for plain ISO dates
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/yyyy
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

// --------------------------------------------------------------------------
// extraction: snapshot -> { tableName: [rows] }
// --------------------------------------------------------------------------
function buildRows(snapshot) {
  const d = snapshot || {};
  const slices = d.crmSlices || {};
  const out = {};
  const add = (table, rows) => {
    if (!rows || rows.length === 0) return;
    (out[table] ||= []).push(...rows);
  };

  // --- users ------------------------------------------------------------
  const users = asArray(d.users).length ? d.users : asArray(slices.users);
  add('users', users.map((u) => mapRow(u)));
  const userDocs = [];
  users.forEach((u) => {
    asArray(u?.documents).forEach((doc, i) => {
      userDocs.push({ ...mapRow(doc), user_id: u.id, sort_order: i });
    });
  });
  add('user_documents', userDocs);

  // --- company profile (merge company_setup + supplierCompany) ----------
  const cs = asArray(d.company_setup)[0] || {};
  const sup = slices.supplierCompany || {};
  const companyRows = [];
  if (Object.keys(sup).length) companyRows.push({
    source: 'supplier',
    name: sup.name, legal_name: sup.legalName, gstin: sup.gstin, pan: sup.pan, cin: sup.cin,
    state: sup.state, state_code: sup.stateCode, city: sup.city, pincode: sup.pincode, address: sup.address,
    email: sup.email, phone: sup.phone, website: sup.website, logo_url: sup.logoUrl,
    bank_name: sup.bankName, account_number: sup.accountNumber, ifsc_code: sup.ifscCode, branch: sup.branch,
    bank_details: sup.bankDetails, bank_accounts: sup.bankAccounts,
    ui_font_size: sup.uiFontSize, ui_theme: sup.uiTheme,
  });
  if (Object.keys(cs).length) companyRows.push({
    source: 'company_setup', legacy_id: cs.id ?? 1,
    name: cs.name, legal_name: cs.legal_name, gstin: cs.gstin, pan: cs.pan, cin: cs.cin,
    state: cs.state, state_code: cs.state_code, city: cs.city, pincode: cs.pincode, address: cs.address,
    email: cs.email, phone: cs.phone, website: cs.website, logo_url: cs.logo_url,
    bank_name: cs.bank_name, account_number: cs.bank_account_no, ifsc_code: cs.bank_ifsc, branch: cs.bank_branch,
  });
  add('company_profile', companyRows);

  // --- outlook configs --------------------------------------------------
  const oac = asArray(d.outlook_app_config)[0];
  if (oac) add('outlook_app_config', [{ ...mapRow(oac), id: oac.id ?? 1 }]);
  if (isPlainObject(slices.outlookEmailConfig))
    add('outlook_email_config', [{ ...mapRow(slices.outlookEmailConfig), id: 1 }]);

  // --- document counters ------------------------------------------------
  if (isPlainObject(d.documentCounters)) {
    add('document_counters',
      Object.entries(d.documentCounters).map(([k, v]) => ({ counter_key: k, value: v })));
  }

  // --- permissions ------------------------------------------------------
  const rolePerms = [];
  if (isPlainObject(slices.rolePermissions)) {
    for (const [role, mods] of Object.entries(slices.rolePermissions)) {
      if (!isPlainObject(mods)) continue;
      for (const [mod, perm] of Object.entries(mods)) {
        rolePerms.push({
          role, module: mod,
          can_view: perm?.view, can_create: perm?.create, can_edit: perm?.edit, can_delete: perm?.delete,
        });
      }
    }
  }
  add('role_permissions', rolePerms);
  const payrollPerms = [];
  const prp = d.payrollRolePermissions || slices.payrollRolePermissions;
  if (isPlainObject(prp)) {
    for (const [role, mods] of Object.entries(prp)) {
      if (!isPlainObject(mods)) continue;
      for (const [mod, perm] of Object.entries(mods)) {
        payrollPerms.push({
          role, module: mod,
          can_view: perm?.view, can_create: perm?.create, can_edit: perm?.edit, can_approve: perm?.approve,
        });
      }
    }
  }
  add('payroll_role_permissions', payrollPerms);

  // --- simple CRM collections ------------------------------------------
  const simple = {
    states: slices.states,
    tax_rates: slices.taxRates,
    payment_terms: slices.paymentTerms,
    products: slices.products,
    license_types: slices.licenseTypes,
    activities: slices.activities,
    notifications: slices.notifications,
    audit_logs: slices.auditLogs,
    amc_contracts: slices.amcContracts,
    customer_ledger_entries: slices.ledgerEntries,
    payment_receipts: slices.payments,
    payment_milestones: slices.milestones,
    support_change_requests: slices.changeRequests,
    customer_contacts: slices.contacts,
  };
  for (const [table, rows] of Object.entries(simple)) add(table, asArray(rows).map(mapRow));

  // --- parents with nested children ------------------------------------
  const children = [
    ['leads', slices.leads, 'lead_id', { timelineEvents: 'lead_timeline_events', linkedContacts: 'lead_linked_contacts' }],
    ['opportunities', slices.opportunities, 'opportunity_id', { remarks: 'opportunity_remarks', tasks: 'opportunity_tasks', attachments: 'opportunity_attachments' }],
    ['customers', slices.customers, 'customer_id', { addresses: 'customer_addresses' }],
    ['sales_orders', slices.orders, 'sales_order_id', { items: 'sales_order_items' }],
    ['purchase_orders', slices.purchaseOrders, 'purchase_order_id', { items: 'purchase_order_items' }],
    ['invoices', slices.invoices, 'invoice_id', { items: 'invoice_items' }],
    ['support_tickets', slices.supportTickets, 'ticket_id', { comments: 'support_ticket_comments' }],
  ];
  for (const [table, rows, fk, childMap] of children) {
    const list = asArray(rows);
    add(table, list.map(mapRow));
    for (const [key, childTable] of Object.entries(childMap)) {
      const childRows = [];
      list.forEach((parent) => {
        asArray(parent?.[key]).forEach((child, i) => {
          const row = { ...mapRow(child), [fk]: parent.id, sort_order: i };
          // `user` is a reserved word in PostgreSQL -> stored as user_name.
          if (row.user !== undefined && row.user_name === undefined) {
            row.user_name = row.user;
            delete row.user;
          }
          childRows.push(row);
        });
      });
      add(childTable, childRows);
    }
  }

  // --- payroll ----------------------------------------------------------
  const asJson = (v) => (v === undefined ? null : JSON.stringify(v));
  if (isPlainObject(d.payrollPolicy))
    add('payroll_policy', [{ ...mapRow(d.payrollPolicy), id: 1, data: asJson(d.payrollPolicy) }]);
  if (isPlainObject(d.payrollIntegrationConfig))
    add('payroll_integration_config', [{ ...mapRow(d.payrollIntegrationConfig), id: 1, data: asJson(d.payrollIntegrationConfig) }]);
  if (d.payrollOrgMasters != null)
    add('payroll_org_masters', [{ id: 1, data: asJson(d.payrollOrgMasters) }]);

  const dictTables = [
    ['payrollMasters', 'payroll_masters', 'id'],
    ['payrollAttendance', 'payroll_attendance', 'employee_id'],
    ['payrollStatutory', 'payroll_statutory', 'employee_id'],
  ];
  for (const [srcKey, table, keyCol] of dictTables) {
    const dict = d[srcKey];
    if (!isPlainObject(dict)) continue;
    const rows = Object.entries(dict).map(([k, rec]) => ({
      ...mapRow(rec), [keyCol]: k, data: asJson(rec),
    }));
    add(table, rows);
  }
  const dictListTables = [
    ['payrollLeaves', 'payroll_leaves'],
    ['payrollClaims', 'payroll_claims'],
  ];
  for (const [srcKey, table] of dictListTables) {
    const dict = d[srcKey];
    if (!isPlainObject(dict)) continue;
    const rows = [];
    for (const [empId, list] of Object.entries(dict)) {
      asArray(list).forEach((rec) => rows.push({ ...mapRow(rec), employee_id: empId, data: asJson(rec) }));
    }
    add(table, rows);
  }
  add('payroll_loans', asArray(d.payrollLoans).map((r) => ({ ...mapRow(r), data: asJson(r) })));

  const envelope = {
    payrollLocations: 'payroll_locations',
    payrollRegularization: 'payroll_regularization',
    payrollShifts: 'payroll_shifts',
    payrollShiftAssignments: 'payroll_shift_assignments',
    payrollShiftSwaps: 'payroll_shift_swaps',
    payrollHelpDesk: 'payroll_help_desk',
    payrollRuns: 'payroll_runs',
    payrollLifecycle: 'payroll_lifecycle',
    payrollAssets: 'payroll_assets',
    payrollAssetCategories: 'payroll_asset_categories',
    payrollAssetAllocations: 'payroll_asset_allocations',
    payrollJobOpenings: 'payroll_job_openings',
    payrollCandidates: 'payroll_candidates',
    payrollOnboarding: 'payroll_onboarding',
    payrollPerformance: 'payroll_performance',
    payrollTrainingPrograms: 'payroll_training_programs',
    payrollTrainingNominations: 'payroll_training_nominations',
    payrollUserPermissions: 'payroll_user_permissions',
    payrollDailyAttendance: 'payroll_daily_attendance',
  };
  for (const [srcKey, table] of Object.entries(envelope)) {
    add(table, asArray(d[srcKey]).map((r) => ({ ...mapRow(r), data: asJson(r) })));
  }

  // --- app settings -----------------------------------------------------
  const settings = [
    ['state_initialized', d.stateInitialized ?? false],
    ['updated_at', d.updatedAt ?? null],
    ['deleted_payroll_master_ids', d.deletedPayrollMasterIds ?? []],
    ['deleted_loan_ids', d.deletedLoanIds ?? []],
    ['milestone_templates', (d.crmSlices && d.crmSlices.milestoneTemplates) || []],
  ];
  add('app_settings', settings.map(([key, value]) => ({ key, value: JSON.stringify(value) })));

  return out;
}

// --------------------------------------------------------------------------
// writing
// --------------------------------------------------------------------------
async function main() {
  if (!fs.existsSync(snapshotPath)) {
    console.error(`Snapshot not found: ${snapshotPath}`);
    console.error('Provide a path to a CRM state JSON file, e.g. snapshot.json.');
    process.exit(2);
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const rowsByTable = buildRows(snapshot);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(2);
  }
  const ssl = /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(schemaSql);
  console.log('Schema applied (69 tables, idempotent).');

  // Read column types back from the catalog.
  const colRes = await client.query(
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns WHERE table_schema = 'public'`
  );
  const types = {};
  for (const r of colRes.rows) (types[r.table_name] ||= {})[r.column_name] = r.data_type;

  // Only touch tables that exist in the schema and have rows to write.
  const tables = Object.keys(rowsByTable).filter((t) => types[t]);
  const unknown = Object.keys(rowsByTable).filter((t) => !types[t]);
  if (unknown.length) console.warn('  (skipped tables not in schema):', unknown.join(', '));

  if (dryRun) {
    console.log('\n--dry-run: nothing written. Planned row counts:');
    for (const t of tables.sort()) console.log(`  ${t.padEnd(34)} ${rowsByTable[t].length}`);
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    await client.query(
      `TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
    );

    const summary = [];
    for (const table of tables) {
      const cols = Object.keys(types[table]);
      const rows = rowsByTable[table];
      let inserted = 0;
      const CHUNK = 400;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        // Determine the column set from the union of keys actually present,
        // intersected with real columns.
        const usedCols = cols.filter((c) => chunk.some((r) => r[c] !== undefined));
        if (usedCols.length === 0) continue;
        const values = [];
        const tuples = chunk.map((row) => {
          const ph = usedCols.map((c) => {
            values.push(coerce(row[c], types[table][c]));
            return `$${values.length}`;
          });
          return `(${ph.join(',')})`;
        });
        const sql = `INSERT INTO "${table}" (${usedCols.map((c) => `"${c}"`).join(',')}) VALUES ${tuples.join(',')}`;
        await client.query(sql, values);
        inserted += chunk.length;
      }
      summary.push([table, inserted]);
    }
    await client.query('COMMIT');
    console.log('\nMigration committed. Rows written:');
    let total = 0;
    for (const [t, n] of summary.sort((a, b) => b[1] - a[1])) {
      if (n === 0) continue;
      console.log(`  ${t.padEnd(34)} ${n}`);
      total += n;
    }
    console.log(`  ${'TOTAL'.padEnd(34)} ${total}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    await client.end();
    process.exit(1);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
