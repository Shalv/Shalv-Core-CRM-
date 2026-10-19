import fs from 'node:fs';
import pg from 'pg';
import { saveSnapshotToDb, loadSnapshotFromDb } from '../../backend/relationalStore.ts';

const original = JSON.parse(fs.readFileSync(process.argv[2] || 'snapshot.json', 'utf8'));

const norm = (v: any): any => {
  // null, undefined, '' and [] are treated as the same "empty" value: the app
  // uses (x || []) for every list field, so they are interchangeable.
  if (v === undefined || v === null || v === '' ) return '__EMPTY__';
  if (Array.isArray(v) && v.length === 0) return '__EMPTY__';
  if (typeof v === 'number') return Math.round(v * 10000) / 10000;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?Z?$/.test(v)) {
    const iso = v.replace(' ', 'T');
    const d = new Date(/Z$/.test(iso) ? iso : iso + 'Z');
    if (!isNaN(d.getTime())) return d.toISOString().replace('.000Z', 'Z');
  }
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === 'object') {
    const o: any = {};
    for (const k of Object.keys(v).sort()) o[k] = norm(v[k]);
    return o;
  }
  return v;
};

function diff(a: any, b: any, path = '', out: string[] = []): string[] {
  const A = norm(a), B = norm(b);
  if (JSON.stringify(A) === JSON.stringify(B)) return out;
  if (A && B && typeof A === 'object' && typeof B === 'object' && !Array.isArray(A) && !Array.isArray(B)) {
    for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) diff(A[k], B[k], `${path}.${k}`, out);
  } else if (Array.isArray(A) && Array.isArray(B)) {
    if (A.length !== B.length) out.push(`${path}: length ${A.length} -> ${B.length}`);
    else A.forEach((_, i) => diff(A[i], B[i], `${path}[${i}]`, out));
  } else {
    out.push(`${path}: ${JSON.stringify(A)} -> ${JSON.stringify(B)}`);
  }
  return out;
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: /sslmode=disable/.test(process.env.DATABASE_URL || '') ? false : { rejectUnauthorized: false },
});
await client.connect();
await client.query(fs.readFileSync('schema.sql', 'utf8'));

await client.query('BEGIN');
const written = await saveSnapshotToDb(client as any, original);
await client.query('COMMIT');
console.log(`Wrote ${written} rows.`);

const loaded = await loadSnapshotFromDb(client as any);

const d = diff(original, loaded);
console.log(`\nRound-trip differences: ${d.length}`);
for (const line of d.slice(0, 40)) console.log('  ' + line);
if (d.length > 40) console.log(`  ... and ${d.length - 40} more`);

// structural sanity
const count = (o: any, k: string) => (Array.isArray(o.crmSlices?.[k]) ? o.crmSlices[k].length : (Array.isArray(o[k]) ? o[k].length : 0));
console.log('\nSanity:');
for (const k of ['leads', 'customers', 'invoices', 'opportunities', 'orders', 'supportTickets']) {
  console.log(`  ${k}: ${count(original, k)} -> ${count(loaded, k)}`);
}
console.log(`  users: ${original.users?.length} -> ${loaded.users?.length}`);
console.log(`  invoices[0].items: ${original.crmSlices.invoices[0].items.length} -> ${loaded.crmSlices.invoices[0].items?.length}`);
console.log(`  leads[0].leadNumber: ${original.crmSlices.leads[0].leadNumber} -> ${loaded.crmSlices.leads[0].leadNumber}`);
console.log(`  documentCounters.leads: ${original.documentCounters.leads} -> ${loaded.documentCounters.leads}`);
console.log(`  payrollPolicy.plQuota: ${original.payrollPolicy.plQuota} -> ${loaded.payrollPolicy?.plQuota}`);
console.log(`  company name: ${original.crmSlices.supplierCompany.name} -> ${loaded.crmSlices.supplierCompany?.name}`);

await client.end();
