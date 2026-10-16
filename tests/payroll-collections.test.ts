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

async function call(method: string, url: string, body: any = {}, params: any = {}, query: any = {}) {
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
    { body, params, query, protocol: 'http', get: () => 'localhost:3000' },
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
