import fs from 'node:fs';
import pg from 'pg';
import { postgresStateMiddleware } from '../../backend/postgresState.ts';
import { applyRowDiff } from '../../backend/relationalStore.ts';

const seed = JSON.parse(fs.readFileSync('snapshot.json', 'utf8'));
let STATE: any = seed;
let writer: (() => void) | null = null;
const hooks = { capture: () => STATE, restore: (s: any) => { STATE = s; }, setWriter: (w: any) => { writer = w; } };

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false, max: 4 });
const mw = postgresStateMiddleware(pool as any, hooks as any);
const q = async (sql: string, p?: any[]) => (await pool.query(sql, p)).rows;

function fakeRes() {
  const res: any = { statusCode: 200, headersSent: false, writableFinished: false,
    setHeader() {}, removeHeader() {}, once() {},
    end(...a: any[]) { this.writableFinished = true; this.headersSent = true; this._resolve(a); return this; } };
  res._p = new Promise((r) => (res._resolve = r));
  return res;
}
async function call(mutator: ((s: any) => void) | null, status = 200) {
  const res = fakeRes();
  await new Promise<void>((resolve) => { mw({} as any, res, () => { if (mutator) mutator(STATE); res.statusCode = status; resolve(); }); });
  res.end('ok');
  await res._p;
}

const out: string[] = [];
await call(null);
out.push(`req1 seed: leads=${(await q('SELECT count(*) c FROM leads'))[0].c}`);

// A row that exists ONLY in the database (not produced by the app) must survive a
// later write. Under the old truncate+reload it would have been destroyed.
await pool.query(`INSERT INTO leads (id, lead_number, company_name) VALUES ('ext-1','EXT-1','External Row')`);

await call((s) => { s.crmSlices.leads.push({ id: 'lead-new', leadNumber: 'LEAD-NEW', companyName: 'Roundtrip Co', status: 'New' }); writer?.(); });
out.push(`req2 insert: leads=${(await q('SELECT count(*) c FROM leads'))[0].c} (67 seed +1 ext +1 new = 69), extSurvived=${(await q("SELECT count(*) c FROM leads WHERE id='ext-1'"))[0].c === 1}`);

await call((s) => { const l = s.crmSlices.leads.find((x: any) => x.id === 'lead-new'); l.companyName = 'Renamed Co'; writer?.(); });
out.push(`req3 update: lead-new companyName='${(await q("SELECT company_name FROM leads WHERE id='lead-new'"))[0].company_name}'`);

await call((s) => { s.crmSlices.leads = s.crmSlices.leads.filter((x: any) => x.id !== 'lead-new'); writer?.(); });
out.push(`req4 delete: leads=${(await q('SELECT count(*) c FROM leads'))[0].c}, lead-newPresent=${(await q("SELECT count(*) c FROM leads WHERE id='lead-new'"))[0].c === 1}`);

await call((s) => { s.crmSlices.leads.push({ id: 'lead-bad', leadNumber: 'LEAD-BAD' }); writer?.(); }, 400);
out.push(`req5 (400) rollback: leads=${(await q('SELECT count(*) c FROM leads'))[0].c} (unchanged)`);

// direct diff unit check
await pool.query("DELETE FROM leads WHERE id IN ('d-a','d-b','d-c')");
const before = { leads: [{ id: 'd-a', lead_number: 'D-A', company_name: 'A' }, { id: 'd-b', lead_number: 'D-B', company_name: 'B' }] };
const after = { leads: [{ id: 'd-a', lead_number: 'D-A', company_name: 'A2' }, { id: 'd-c', lead_number: 'D-C', company_name: 'C' }] };
const c = await applyRowDiff(pool as any, before, after);
out.push(`applyRowDiff: inserted=${c.inserted} updated=${c.updated} deleted=${c.deleted} (expect 1/1/1)`);
out.push(`  d-a=${JSON.stringify((await q("SELECT company_name FROM leads WHERE id='d-a'"))[0])} d-b=${(await q("SELECT count(*) c FROM leads WHERE id='d-b'"))[0].c} d-c=${(await q("SELECT count(*) c FROM leads WHERE id='d-c'"))[0].c}`);

// hydrate from DB
STATE = {};
await call(null);
out.push(`hydrate: leads=${STATE.crmSlices?.leads?.length}, users=${STATE.users?.length}, extStillThere=${STATE.crmSlices.leads.some((l: any) => l.id === 'ext-1')}`);

console.log(out.join('\n'));
await pool.end();
