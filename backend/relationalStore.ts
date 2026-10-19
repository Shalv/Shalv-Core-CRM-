/**
 * Enact360 CRM - relational store.
 *
 * Bridges the application's in-memory "snapshot" object to the normalized
 * PostgreSQL tables created by schema.sql. The runtime keeps using the same
 * snapshot shape everywhere; this module is the only thing that knows how the
 * snapshot maps onto the tables.
 *
 *   saveSnapshotToDb(client, snapshot)  - TRUNCATE + reload every table
 *   loadSnapshotFromDb(client)          - rebuild the snapshot from the tables
 *
 * Both run inside the caller's transaction. The whole-snapshot read/write model
 * matches the app's existing "serialize the shared state per request" contract;
 * it makes the tables the single source of truth without touching route code.
 */
import type { PoolClient } from 'pg';
import pg from 'pg';

// --------------------------------------------------------------------------
// Type parsers: make loaded values match the types the app already expects.
// (node-postgres returns NUMERIC and DATE as strings/Date by default.)
// --------------------------------------------------------------------------
const { types } = pg;
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));      // int8
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));      // numeric
types.setTypeParser(1082, (v) => v);                                        // date -> 'YYYY-MM-DD'
types.setTypeParser(1184, (v) => (v ? new Date(v).toISOString() : null));   // timestamptz -> ISO
types.setTypeParser(1114, (v) => (v ? new Date(v + 'Z').toISOString() : null)); // timestamp

type Row = Record<string, any>;
type RowsByTable = Record<string, Row[]>;

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------
const snake = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase();
const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const arr = (v: any) => (Array.isArray(v) ? v : []);
const json = (v: any) => (v === undefined ? null : JSON.stringify(v));
const unjson = (v: any) => (typeof v === 'string' ? safeParse(v) : v);
function safeParse(s: string) { try { return JSON.parse(s); } catch { return s; } }

function mapRow(obj: any): Row {
  const out: Row = {};
  if (!isObj(obj)) return out;
  for (const [k, v] of Object.entries(obj)) out[snake(k)] = v;
  return out;
}

// --------------------------------------------------------------------------
// snapshot -> rows  (mirror of migrate.mjs buildRows)
// --------------------------------------------------------------------------
export function buildRows(snapshot: any): RowsByTable {
  const d = snapshot || {};
  const s = d.crmSlices || {};
  const out: RowsByTable = {};
  const add = (t: string, rows: Row[]) => { if (rows?.length) (out[t] ||= []).push(...rows); };

  const users = arr(d.users).length ? d.users : arr(s.users);
  add('users', users.map(mapRow));
  const docs: Row[] = [];
  users.forEach((u: any) => arr(u?.documents).forEach((doc: any, i: number) =>
    docs.push({ ...mapRow(doc), user_id: u.id, sort_order: i })));
  add('user_documents', docs);

  const cs = arr(d.company_setup)[0] || {};
  const sup = s.supplierCompany || {};
  const companyRows: Row[] = [];
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

  const oac = arr(d.outlook_app_config)[0];
  if (oac) add('outlook_app_config', [{ ...mapRow(oac), id: oac.id ?? 1 }]);
  if (isObj(s.outlookEmailConfig)) add('outlook_email_config', [{ ...mapRow(s.outlookEmailConfig), id: 1 }]);

  if (isObj(d.documentCounters))
    add('document_counters', Object.entries(d.documentCounters).map(([k, v]) => ({ counter_key: k, value: v })));

  const perms: Row[] = [];
  if (isObj(s.rolePermissions)) for (const [role, mods] of Object.entries(s.rolePermissions)) {
    if (!isObj(mods)) continue;
    for (const [mod, p] of Object.entries(mods as any))
      perms.push({ role, module: mod, can_view: (p as any)?.view, can_create: (p as any)?.create, can_edit: (p as any)?.edit, can_delete: (p as any)?.delete });
  }
  add('role_permissions', perms);
  const pperms: Row[] = [];
  const prp = d.payrollRolePermissions || s.payrollRolePermissions;
  if (isObj(prp)) for (const [role, mods] of Object.entries(prp)) {
    if (!isObj(mods)) continue;
    for (const [mod, p] of Object.entries(mods as any))
      pperms.push({ role, module: mod, can_view: (p as any)?.view, can_create: (p as any)?.create, can_edit: (p as any)?.edit, can_approve: (p as any)?.approve });
  }
  add('payroll_role_permissions', pperms);

  const simple: Record<string, any> = {
    states: s.states, tax_rates: s.taxRates, payment_terms: s.paymentTerms, products: s.products,
    license_types: s.licenseTypes, activities: s.activities, notifications: s.notifications,
    audit_logs: s.auditLogs, amc_contracts: s.amcContracts, customer_ledger_entries: s.ledgerEntries,
    payment_receipts: s.payments, payment_milestones: s.milestones,
    support_change_requests: s.changeRequests, customer_contacts: s.contacts,
  };
  for (const [t, rows] of Object.entries(simple)) add(t, arr(rows).map(mapRow));

  const children: [string, any, string, Record<string, string>][] = [
    ['leads', s.leads, 'lead_id', { timelineEvents: 'lead_timeline_events', linkedContacts: 'lead_linked_contacts' }],
    ['opportunities', s.opportunities, 'opportunity_id', { remarks: 'opportunity_remarks', tasks: 'opportunity_tasks', attachments: 'opportunity_attachments' }],
    ['customers', s.customers, 'customer_id', { addresses: 'customer_addresses' }],
    ['sales_orders', s.orders, 'sales_order_id', { items: 'sales_order_items' }],
    ['purchase_orders', s.purchaseOrders, 'purchase_order_id', { items: 'purchase_order_items' }],
    ['invoices', s.invoices, 'invoice_id', { items: 'invoice_items' }],
    ['support_tickets', s.supportTickets, 'ticket_id', { comments: 'support_ticket_comments' }],
  ];
  for (const [t, rows, fk, childMap] of children) {
    const list = arr(rows);
    add(t, list.map(mapRow));
    for (const [key, childTable] of Object.entries(childMap)) {
      const cr: Row[] = [];
      list.forEach((parent: any) => arr(parent?.[key]).forEach((child: any, i: number) => {
        const row: Row = { ...mapRow(child), [fk]: parent.id, sort_order: i };
        if (row.user !== undefined && row.user_name === undefined) { row.user_name = row.user; delete row.user; }
        cr.push(row);
      }));
      add(childTable, cr);
    }
  }

  // payroll
  if (isObj(d.payrollPolicy)) add('payroll_policy', [{ ...mapRow(d.payrollPolicy), id: 1, data: json(d.payrollPolicy) }]);
  if (isObj(d.payrollIntegrationConfig)) add('payroll_integration_config', [{ ...mapRow(d.payrollIntegrationConfig), id: 1, data: json(d.payrollIntegrationConfig) }]);
  if (d.payrollOrgMasters != null) add('payroll_org_masters', [{ id: 1, data: json(d.payrollOrgMasters) }]);

  for (const [srcKey, table, keyCol] of [
    ['payrollMasters', 'payroll_masters', 'id'],
    ['payrollAttendance', 'payroll_attendance', 'employee_id'],
    ['payrollStatutory', 'payroll_statutory', 'employee_id'],
  ] as [string, string, string][]) {
    const dict = (d as any)[srcKey];
    if (!isObj(dict)) continue;
    add(table, Object.entries(dict).map(([k, rec]) => ({ ...mapRow(rec), [keyCol]: k, data: json(rec) })));
  }
  for (const [srcKey, table] of [['payrollLeaves', 'payroll_leaves'], ['payrollClaims', 'payroll_claims']] as [string, string][]) {
    const dict = (d as any)[srcKey];
    if (!isObj(dict)) continue;
    const rows: Row[] = [];
    for (const [empId, list] of Object.entries(dict)) arr(list).forEach((rec: any) => rows.push({ ...mapRow(rec), employee_id: empId, data: json(rec) }));
    add(table, rows);
  }
  add('payroll_loans', arr(d.payrollLoans).map((r: any) => ({ ...mapRow(r), data: json(r) })));

  const envelope: Record<string, string> = {
    payrollLocations: 'payroll_locations', payrollRegularization: 'payroll_regularization', payrollShifts: 'payroll_shifts',
    payrollShiftAssignments: 'payroll_shift_assignments', payrollShiftSwaps: 'payroll_shift_swaps', payrollHelpDesk: 'payroll_help_desk',
    payrollRuns: 'payroll_runs', payrollLifecycle: 'payroll_lifecycle', payrollAssets: 'payroll_assets',
    payrollAssetCategories: 'payroll_asset_categories', payrollAssetAllocations: 'payroll_asset_allocations', payrollJobOpenings: 'payroll_job_openings',
    payrollCandidates: 'payroll_candidates', payrollOnboarding: 'payroll_onboarding', payrollPerformance: 'payroll_performance',
    payrollTrainingPrograms: 'payroll_training_programs', payrollTrainingNominations: 'payroll_training_nominations',
    payrollUserPermissions: 'payroll_user_permissions', payrollDailyAttendance: 'payroll_daily_attendance',
  };
  for (const [srcKey, table] of Object.entries(envelope))
    add(table, arr((d as any)[srcKey]).map((r: any) => ({ ...mapRow(r), data: json(r) })));

  add('app_settings', [
    ['state_initialized', d.stateInitialized ?? false],
    ['updated_at', d.updatedAt ?? null],
    ['deleted_payroll_master_ids', d.deletedPayrollMasterIds ?? []],
    ['deleted_loan_ids', d.deletedLoanIds ?? []],
    ['milestone_templates', s.milestoneTemplates ?? []],
  ].map(([key, value]) => ({ key, value: JSON.stringify(value) })));

  return out;
}

// --------------------------------------------------------------------------
// write rows
// --------------------------------------------------------------------------
async function loadColumnTypes(client: PoolClient): Promise<Record<string, Record<string, string>>> {
  const res = await client.query(
    `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public'`);
  const tcols: Record<string, Record<string, string>> = {};
  for (const r of res.rows) (tcols[r.table_name] ||= {})[r.column_name] = r.data_type;
  return tcols;
}

async function loadPrimaryKeys(client: PoolClient): Promise<Record<string, string[]>> {
  const res = await client.query(
    `SELECT tc.table_name, kcu.column_name, kcu.ordinal_position
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.ordinal_position`);
  const pks: Record<string, string[]> = {};
  for (const r of res.rows) (pks[r.table_name] ||= []).push(r.column_name);
  return pks;
}

export async function writeRows(client: PoolClient, rowsByTable: RowsByTable): Promise<number> {
  const tcols = await loadColumnTypes(client);

  const tables = Object.keys(rowsByTable).filter((t) => tcols[t]);
  if (tables.length === 0) return 0;
  await client.query(`TRUNCATE ${tables.map((t) => `"${t}"`).join(',')} RESTART IDENTITY CASCADE`);

  let total = 0;
  for (const table of tables) {
    const cols = Object.keys(tcols[table]);
    const rows = rowsByTable[table];
    const CHUNK = 400;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const used = cols.filter((c) => chunk.some((r) => r[c] !== undefined));
      if (!used.length) continue;
      const values: any[] = [];
      const tuples = chunk.map((row) => `(${used.map((c) => { values.push(coerce(row[c], tcols[table][c])); return `$${values.length}`; }).join(',')})`);
      await client.query(`INSERT INTO "${table}" (${used.map((c) => `"${c}"`).join(',')}) VALUES ${tuples.join(',')}`, values);
      total += chunk.length;
    }
  }
  return total;
}

function coerce(value: any, dataType: string): any {
  if (value === undefined) return null;
  if (dataType === 'jsonb' || dataType === 'json') {
    if (value === null) return null;
    if (typeof value === 'string') { try { JSON.parse(value); return value; } catch { return JSON.stringify(value); } }
    return JSON.stringify(value);
  }
  if (value === null) return null;
  if (dataType === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const t = String(value).trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(t)) return true;
    if (['false', 'no', 'n', '0', ''].includes(t)) return false;
    return null;
  }
  if (['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision'].includes(dataType)) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const t = String(value).replace(/[,\s₹]/g, '').trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  if (dataType === 'date') return toDate(value);
  if (dataType === 'timestamp with time zone' || dataType === 'timestamp without time zone') return toTimestamp(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isObj(value) || Array.isArray(value)) return JSON.stringify(value);
  return null;
}

function toDate(v: any): string | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim(); if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function toTimestamp(v: any): string | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  const s = String(v).trim(); if (!s) return null;
  // 'YYYY-MM-DD HH:MM' (space, no zone) is parsed deterministically as UTC so the
  // stored instant does not depend on the server's local timezone.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
  if (m) return `${m[1]}T${m[2].length === 5 ? m[2] + ':00' : m[2]}.000Z`;
  if (/\d{1,2}:\d{2}/.test(s)) { const d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString(); }
  const d = toDate(s); return d ? `${d}T00:00:00.000Z` : null;
}

export async function saveSnapshotToDb(client: PoolClient, snapshot: any): Promise<number> {
  return writeRows(client, buildRows(snapshot));
}

// --------------------------------------------------------------------------
// row-level diff writer  (fine-grained per-row INSERT / UPDATE / DELETE)
// --------------------------------------------------------------------------
export type RowDiffCounts = { inserted: number; updated: number; deleted: number };

/** Stable key for a row from its primary-key columns, or null if incomplete. */
function keyOf(row: Row, pk: string[]): string | null {
  const parts: any[] = [];
  for (const c of pk) {
    const v = row[c];
    if (v === undefined || v === null) return null;
    parts.push(v);
  }
  return JSON.stringify(parts);
}

/** True when every shared column is equal after coercion to its DB type. */
function rowsEqual(a: Row, b: Row, typeMap: Record<string, string>): boolean {
  for (const c of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(coerce(a[c], typeMap[c] ?? 'text')) !== JSON.stringify(coerce(b[c], typeMap[c] ?? 'text'))) {
      return false;
    }
  }
  return true;
}

async function upsertRow(
  client: PoolClient, table: string, row: Row, typeMap: Record<string, string>, pk: string[]
): Promise<boolean> {
  if (pk.some((c) => row[c] === undefined || row[c] === null)) return false; // un-keyed row, cannot upsert
  const cols = Object.keys(typeMap).filter((c) => row[c] !== undefined);
  const values = cols.map((c) => coerce(row[c], typeMap[c]));
  const setCols = cols.filter((c) => !pk.includes(c));
  const conflict = pk.map((c) => `"${c}"`).join(',');
  let sql = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(',')}) ` +
            `VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) ` +
            `ON CONFLICT (${conflict}) `;
  sql += setCols.length
    ? `DO UPDATE SET ${setCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
    : `DO NOTHING`;
  await client.query('SAVEPOINT enact_upsert');
  try {
    await client.query(sql, values);
    await client.query('RELEASE SAVEPOINT enact_upsert');
    return true;
  } catch (err) {
    await client.query('ROLLBACK TO SAVEPOINT enact_upsert');
    console.warn(`[relational-store] upsert skipped for ${table}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function deleteRowsByKeys(client: PoolClient, table: string, pk: string[], keys: string[]): Promise<void> {
  const tuples = keys.map((k) => JSON.parse(k) as any[]);
  const params: any[] = [];
  const placeholders = tuples.map((t) => `(${t.map((v) => { params.push(v); return `$${params.length}`; }).join(',')})`);
  const cols = pk.map((c) => `"${c}"`).join(',');
  await client.query('SAVEPOINT enact_delete');
  try {
    await client.query(`DELETE FROM "${table}" WHERE (${cols}) IN (${placeholders.join(',')})`, params);
    await client.query('RELEASE SAVEPOINT enact_delete');
  } catch (err) {
    await client.query('ROLLBACK TO SAVEPOINT enact_delete');
    console.warn(`[relational-store] delete skipped for ${table}:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Apply only the rows that changed between two snapshots. Untouched rows are
 * never written, so existing row identity (and any DB-managed columns) survive.
 * Child tables are handled like any other table: a removed parent's children
 * disappear from the "after" snapshot and are deleted here.
 */
export async function applyRowDiff(client: PoolClient, before: RowsByTable, after: RowsByTable): Promise<RowDiffCounts> {
  const tcols = await loadColumnTypes(client);
  const pks = await loadPrimaryKeys(client);
  const counts: RowDiffCounts = { inserted: 0, updated: 0, deleted: 0 };

  const tables = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const table of tables) {
    const typeMap = tcols[table];
    const pk = pks[table];
    if (!typeMap || !pk) continue;

    const bmap = new Map<string, Row>();
    for (const r of before?.[table] || []) { const k = keyOf(r, pk); if (k) bmap.set(k, r); }
    const amap = new Map<string, Row>();
    for (const r of after?.[table] || []) { const k = keyOf(r, pk); if (k) amap.set(k, r); }

    for (const [k, row] of amap) {
      const prev = bmap.get(k);
      if (!prev) {
        if (await upsertRow(client, table, row, typeMap, pk)) counts.inserted++;
      } else if (!rowsEqual(prev, row, typeMap)) {
        await upsertRow(client, table, row, typeMap, pk);
        counts.updated++;
      }
    }

    const deleted = [...bmap.keys()].filter((k) => !amap.has(k));
    if (deleted.length) {
      await deleteRowsByKeys(client, table, pk, deleted);
      counts.deleted += deleted.length;
    }
  }
  return counts;
}

/** Convenience: diff the DB's current state against a snapshot and apply it. */
export async function syncSnapshotToDb(client: PoolClient, before: RowsByTable, snapshot: any): Promise<RowDiffCounts> {
  return applyRowDiff(client, before, buildRows(snapshot));
}

// --------------------------------------------------------------------------
// rows -> snapshot
// --------------------------------------------------------------------------
async function readRows(client: PoolClient, table: string, order = ''): Promise<Row[]> {
  await client.query('SAVEPOINT enact_read');
  try {
    const r = await client.query(`SELECT * FROM "${table}"${order ? ` ORDER BY ${order}` : ''}`);
    await client.query('RELEASE SAVEPOINT enact_read');
    return r.rows;
  } catch {
    await client.query('ROLLBACK TO SAVEPOINT enact_read');
    return [];
  }
}
function rowToCamel(row: Row, drop: string[] = []): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (drop.includes(k)) continue;
    out[camel(k)] = v;
  }
  return out;
}

export async function loadSnapshotFromDb(client: PoolClient): Promise<any> {
  const snap: any = { crmSlices: {} };
  const s = snap.crmSlices;

  let settingsRows: Row[] = [];
  await client.query('SAVEPOINT enact_settings');
  try {
    const settings = await client.query(`SELECT key, value FROM app_settings`);
    await client.query('RELEASE SAVEPOINT enact_settings');
    settingsRows = settings.rows;
  } catch {
    await client.query('ROLLBACK TO SAVEPOINT enact_settings');
  }
  const smap: Record<string, any> = {};
  for (const r of settingsRows) smap[r.key] = typeof r.value === 'string' ? safeParse(r.value) : r.value;
  snap.stateInitialized = smap.state_initialized ?? false;
  snap.updatedAt = smap.updated_at ?? new Date().toISOString();
  snap.deletedPayrollMasterIds = smap.deleted_payroll_master_ids ?? [];
  snap.deletedLoanIds = smap.deleted_loan_ids ?? [];
  s.milestoneTemplates = smap.milestone_templates ?? [];

  let countersRows: Row[] = [];
  await client.query('SAVEPOINT enact_counters');
  try {
    const counters = await client.query(`SELECT counter_key, value FROM document_counters`);
    await client.query('RELEASE SAVEPOINT enact_counters');
    countersRows = counters.rows;
  } catch {
    await client.query('ROLLBACK TO SAVEPOINT enact_counters');
  }
  snap.documentCounters = Object.fromEntries(countersRows.map((r) => [r.counter_key, r.value]));

  // users + documents
  const userDocs = await readRows(client, 'user_documents', 'sort_order');
  snap.users = (await readRows(client, 'users', '')).map((u) => {
    const row = rowToCamel(u);
    const docs = userDocs.filter((d) => d.user_id === u.id).map((d) => rowToCamel(d, ['user_id', 'sort_order']));
    if (docs.length) row.documents = docs;
    return row;
  });
  s.users = snap.users.map((u: any) => { const c = { ...u }; delete c.passwordHash; delete c.password; delete c.tempPassword; return c; });

  // company profile -> company_setup + supplierCompany
  const compRows = await readRows(client, 'company_profile', '');
  const comp = compRows.find((r) => r.source === 'supplier') || compRows[0];
  const csRow = compRows.find((r) => r.source === 'company_setup');
  if (csRow) {
    snap.company_setup = [{
      id: csRow.legacy_id ?? 1, name: csRow.name, legal_name: csRow.legal_name, gstin: csRow.gstin, pan: csRow.pan,
      city: csRow.city, state: csRow.state, state_code: csRow.state_code, logo_url: csRow.logo_url,
      bank_name: csRow.bank_name, bank_account_no: csRow.account_number, bank_ifsc: csRow.ifsc_code, bank_branch: csRow.branch,
    }];
  }
  if (comp) {
    s.supplierCompany = {
      name: comp.name, legalName: comp.legal_name, gstin: comp.gstin, pan: comp.pan, cin: comp.cin,
      state: comp.state, stateCode: comp.state_code, city: comp.city, pincode: comp.pincode, address: comp.address,
      email: comp.email, phone: comp.phone, website: comp.website, logoUrl: comp.logo_url,
      bankName: comp.bank_name, accountNumber: comp.account_number, ifscCode: comp.ifsc_code, branch: comp.branch,
      bankDetails: comp.bank_details, bankAccounts: comp.bank_accounts,
      uiFontSize: comp.ui_font_size, uiTheme: comp.ui_theme,
    };
  }

  const oac = (await readRows(client, 'outlook_app_config', ''))[0];
  if (oac) snap.outlook_app_config = [{ ...oac }]; // outlook_app_config keeps its original snake_case keys
  const oec = (await readRows(client, 'outlook_email_config', ''))[0];
  if (oec) s.outlookEmailConfig = rowToCamel(oec, ['id']);

  // permissions
  const rp = await readRows(client, 'role_permissions', '');
  const rmap: any = {};
  for (const r of rp) {
    (rmap[r.role] ||= {})[r.module] = { view: r.can_view, create: r.can_create, edit: r.can_edit, delete: r.can_delete };
  }
  s.rolePermissions = rmap;
  const prp = await readRows(client, 'payroll_role_permissions', '');
  if (prp.length) {
    const pmap: any = {};
    for (const r of prp) (pmap[r.role] ||= {})[r.module] = { view: r.can_view, create: r.can_create, edit: r.can_edit, approve: r.can_approve };
    snap.payrollRolePermissions = pmap;
  }

  // simple collections
  const simpleMap: Record<string, string> = {
    states: 'states', tax_rates: 'taxRates', payment_terms: 'paymentTerms', products: 'products',
    license_types: 'licenseTypes', activities: 'activities', notifications: 'notifications',
    audit_logs: 'auditLogs', amc_contracts: 'amcContracts', customer_ledger_entries: 'ledgerEntries',
    payment_receipts: 'payments', payment_milestones: 'milestones',
    support_change_requests: 'changeRequests', customer_contacts: 'contacts',
  };
  for (const [table, key] of Object.entries(simpleMap))
    s[key] = (await readRows(client, table, '')).map((r) => rowToCamel(r, ['sort_order']));

  // parents + children
  const childMap: Record<string, { table: string; fk: string; key: string; drop: string[] }[]> = {
    leads: [
      { table: 'lead_timeline_events', fk: 'lead_id', key: 'timelineEvents', drop: ['lead_id', 'sort_order', 'user_name'] },
      { table: 'lead_linked_contacts', fk: 'lead_id', key: 'linkedContacts', drop: ['sort_order'] },
    ],
    opportunities: [
      { table: 'opportunity_remarks', fk: 'opportunity_id', key: 'remarks', drop: ['opportunity_id', 'sort_order'] },
      { table: 'opportunity_tasks', fk: 'opportunity_id', key: 'tasks', drop: ['opportunity_id', 'sort_order'] },
      { table: 'opportunity_attachments', fk: 'opportunity_id', key: 'attachments', drop: ['opportunity_id', 'sort_order'] },
    ],
    customers: [{ table: 'customer_addresses', fk: 'customer_id', key: 'addresses', drop: ['customer_id', 'sort_order'] }],
    sales_orders: [{ table: 'sales_order_items', fk: 'sales_order_id', key: 'items', drop: ['sales_order_id', 'sort_order'] }],
    purchase_orders: [{ table: 'purchase_order_items', fk: 'purchase_order_id', key: 'items', drop: ['purchase_order_id', 'sort_order'] }],
    invoices: [{ table: 'invoice_items', fk: 'invoice_id', key: 'items', drop: ['invoice_id', 'sort_order'] }],
    support_tickets: [{ table: 'support_ticket_comments', fk: 'ticket_id', key: 'comments', drop: ['sort_order'] }],
  };
  const parentKeys: Record<string, string> = {
    leads: 'leads', opportunities: 'opportunities', customers: 'customers', sales_orders: 'orders',
    purchase_orders: 'purchaseOrders', invoices: 'invoices', support_tickets: 'supportTickets',
  };
  for (const [table, kids] of Object.entries(childMap)) {
    const parents = (await readRows(client, table, '')).map((r) => rowToCamel(r, ['sort_order']));
    for (const kid of kids) {
      const childRows = await readRows(client, kid.table, 'sort_order');
      for (const p of parents) {
        const list = childRows.filter((c) => c[kid.fk] === p.id).map((c) => {
          const row = rowToCamel(c, kid.drop);
          if (kid.table === 'lead_timeline_events' && c.user_name !== undefined) row.user = c.user_name;
          return row;
        });
        p[kid.key] = list;
      }
    }
    s[parentKeys[table]] = parents;
  }

  // payroll
  const pol = (await readRows(client, 'payroll_policy', ''))[0];
  if (pol) snap.payrollPolicy = pol.data ? unjson(pol.data) : rowToCamel(pol, ['id', 'data']);
  const pic = (await readRows(client, 'payroll_integration_config', ''))[0];
  if (pic) snap.payrollIntegrationConfig = pic.data ? unjson(pic.data) : rowToCamel(pic, ['id', 'data']);
  const pom = (await readRows(client, 'payroll_org_masters', ''))[0];
  if (pom) snap.payrollOrgMasters = unjson(pom.data);

  snap.payrollMasters = {};
  for (const r of await readRows(client, 'payroll_masters', '')) snap.payrollMasters[r.id] = r.data ? unjson(r.data) : rowToCamel(r, ['data']);
  snap.payrollAttendance = {};
  for (const r of await readRows(client, 'payroll_attendance', '')) snap.payrollAttendance[r.employee_id] = r.data ? unjson(r.data) : rowToCamel(r, ['employee_id', 'data']);
  snap.payrollStatutory = {};
  for (const r of await readRows(client, 'payroll_statutory', '')) snap.payrollStatutory[r.employee_id] = r.data ? unjson(r.data) : rowToCamel(r, ['employee_id', 'data']);

  snap.payrollLeaves = {};
  for (const r of await readRows(client, 'payroll_leaves', '')) (snap.payrollLeaves[r.employee_id] ||= []).push(r.data ? unjson(r.data) : rowToCamel(r, ['employee_id', 'data']));
  snap.payrollClaims = {};
  for (const r of await readRows(client, 'payroll_claims', '')) (snap.payrollClaims[r.employee_id] ||= []).push(r.data ? unjson(r.data) : rowToCamel(r, ['employee_id', 'data']));

  snap.payrollLoans = (await readRows(client, 'payroll_loans', '')).map((r) => (r.data ? unjson(r.data) : rowToCamel(r, ['data'])));

  const envelope: Record<string, string> = {
    payroll_locations: 'payrollLocations', payroll_regularization: 'payrollRegularization', payroll_shifts: 'payrollShifts',
    payroll_shift_assignments: 'payrollShiftAssignments', payroll_shift_swaps: 'payrollShiftSwaps', payroll_help_desk: 'payrollHelpDesk',
    payroll_runs: 'payrollRuns', payroll_lifecycle: 'payrollLifecycle', payroll_assets: 'payrollAssets',
    payroll_asset_categories: 'payrollAssetCategories', payroll_asset_allocations: 'payrollAssetAllocations', payroll_job_openings: 'payrollJobOpenings',
    payroll_candidates: 'payrollCandidates', payroll_onboarding: 'payrollOnboarding', payroll_performance: 'payrollPerformance',
    payroll_training_programs: 'payrollTrainingPrograms', payroll_training_nominations: 'payrollTrainingNominations',
    payroll_user_permissions: 'payrollUserPermissions', payroll_daily_attendance: 'payrollDailyAttendance',
  };
  for (const [table, key] of Object.entries(envelope))
    snap[key] = (await readRows(client, table, '')).map((r) => (r.data ? unjson(r.data) : rowToCamel(r, ['data'])));

  return snap;
}
