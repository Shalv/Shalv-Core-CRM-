import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-payroll-collections-test-'));
process.env.CRM_STORE_PATH = path.join(folder, 'store.json');
process.env.CRM_TEST_MODE = 'true';
process.env.DATABASE_URL = '';

const { app } = await import('../server');

const copy = <T>(s: T): T => JSON.parse(JSON.stringify(s));

async function call(method: string, url: string, body: any = {}, params: any = {}, query: any = {}, actor: any = undefined) {
  const layer = (app as any)._router.stack.find(
    (l: any) =>
      l.route &&
      (Array.isArray(l.route.path) ? l.route.path.includes(url) : l.route.path === url) &&
      l.route.methods[method.toLowerCase()]
  );
  assert.ok(layer, `${method} ${url} exists`);
  let code = 200;
  let result: any;
  const res: any = {
    status(n: number) { code = n; return this; },
    json(value: any) { result = value; return this; },
    send(value: any) { result = value; return this; },
    type() { return this; },
  };
  await layer.route.stack[0].handle(
    { body, params, query, protocol: 'http', get: () => 'localhost:3000', account: actor },
    res
  );
  return { code, body: copy(result) };
}

const ALL_KEYS = [
  'locations',
  'regularization',
  'shifts',
  'shiftAssignments',
  'shiftSwaps',
  'helpdesk',
  'runs',
  'lifecycle',
  'assets',
  'assetCategories',
  'assetAllocations',
  'jobOpenings',
  'candidates',
  'onboarding',
  'performance',
  'trainingPrograms',
  'trainingNominations',
];

test('payroll collections endpoint exposes every real-time HR collection as an array', async () => {
  const res = await call('GET', '/api/payroll/collections');
  assert.equal(res.code, 200);
  assert.equal(res.body.success, true);
  for (const key of ALL_KEYS) {
    assert.ok(Array.isArray(res.body.collections[key]), `${key} is an array`);
  }
});

test('a collection written to the server is read back (captured server-side, not just in the browser)', async () => {
  const ticket = { id: 'TKT-9001', subject: 'Laptop not booting', status: 'Open' };
  const write = await call('POST', '/api/payroll/collections/:key', { data: [ticket] }, { key: 'helpdesk' });
  assert.equal(write.code, 200);
  assert.equal(write.body.success, true);
  assert.equal(write.body.count, 1);

  const read = await call('GET', '/api/payroll/collections');
  assert.equal(read.body.collections.helpdesk.length, 1);
  assert.equal(read.body.collections.helpdesk[0].id, 'TKT-9001');
});

test('an unknown collection is rejected', async () => {
  const res = await call('POST', '/api/payroll/collections/:key', { data: [] }, { key: 'not-a-collection' });
  assert.equal(res.code, 404);
  assert.equal(res.body.success, false);
});

test('a non-array payload is rejected', async () => {
  const res = await call('POST', '/api/payroll/collections/:key', { data: { nope: true } }, { key: 'shifts' });
  assert.equal(res.code, 400);
  assert.equal(res.body.success, false);
});

/* ---------------------------------------------- record-level authorisation ---- */

const EMP_A = { id: 'usr-a', role: 'Sales Executive' };
const EMP_B = { id: 'usr-b', role: 'Sales Executive' };
const ADMIN = { id: 'usr-1', role: 'Super Admin' };

const readHelpdesk = async () =>
  (await call('GET', '/api/payroll/collections')).body.collections.helpdesk as any[];

test('an employee cannot write an admin-only collection', async () => {
  const res = await call(
    'POST',
    '/api/payroll/collections/:key',
    { data: [{ id: 'SHIFT-X' }] },
    { key: 'shifts' },
    {},
    EMP_A
  );
  assert.equal(res.code, 403);
  assert.equal(res.body.success, false);
});

test('an employee may write their own record in an owner-scoped collection', async () => {
  const res = await call(
    'POST',
    '/api/payroll/collections/:key',
    { data: [{ id: 'TKT-A', employeeId: 'usr-a', subject: 'My ticket' }] },
    { key: 'helpdesk' },
    {},
    EMP_A
  );
  assert.equal(res.code, 200);
  assert.equal(res.body.scoped, true);
  assert.equal(res.body.ownedCount, 1);
  const rows = await readHelpdesk();
  assert.ok(rows.some((r) => r.id === 'TKT-A'), 'own record stored');
});

test('an employee cannot create or alter another employee\'s record', async () => {
  // admin seeds a record owned by usr-b
  await call(
    'POST',
    '/api/payroll/collections/:key',
    { data: [{ id: 'TKT-B', employeeId: 'usr-b', subject: 'B ticket' }] },
    { key: 'helpdesk' },
    {},
    ADMIN
  );
  // usr-a attempts to overwrite the whole collection, including usr-b's record
  const res = await call(
    'POST',
    '/api/payroll/collections/:key',
    {
      data: [
        { id: 'TKT-A2', employeeId: 'usr-a', subject: 'Mine' },
        { id: 'TKT-B', employeeId: 'usr-b', subject: 'TAMPERED' },
      ],
    },
    { key: 'helpdesk' },
    {},
    EMP_A
  );
  assert.equal(res.code, 200);
  assert.equal(res.body.rejectedCount, 1, 'the foreign record was rejected');
  const rows = await readHelpdesk();
  const bRecord = rows.find((r) => r.id === 'TKT-B');
  assert.ok(bRecord, "usr-b's record still present");
  assert.equal(bRecord.subject, 'B ticket', "usr-b's record was not altered");
  assert.ok(rows.some((r) => r.id === 'TKT-A2'), "usr-a's own record was stored");
});

test('an admin may replace an owner-scoped collection in full', async () => {
  const res = await call(
    'POST',
    '/api/payroll/collections/:key',
    { data: [{ id: 'TKT-ONLY', employeeId: 'usr-b', subject: 'Admin set' }] },
    { key: 'helpdesk' },
    {},
    ADMIN
  );
  assert.equal(res.code, 200);
  assert.equal(res.body.scoped, undefined);
  const rows = await readHelpdesk();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'TKT-ONLY');
});
