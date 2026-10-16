import { test } from 'node:test';
import assert from 'node:assert/strict';

// Pure attendance-linked pay maths — no DOM or store needed.
const { prorateForLop, DEFAULT_RUN_WORKING_DAYS } = await import(
  '../src/components/payroll/payrollTypes'
);

test('no loss of pay pays the full gross', () => {
  const { payableDays, net } = prorateForLop(26000, 26, 0);
  assert.equal(payableDays, 26);
  assert.equal(net, 26000);
});

test('one LOP day removes one day of pay', () => {
  const { payableDays, net } = prorateForLop(26000, 26, 1);
  assert.equal(payableDays, 25);
  assert.equal(net, 25000);
});

test('LOP is prorated, not rounded away', () => {
  const { net } = prorateForLop(50000, 22, 3);
  assert.equal(net, Math.round((50000 * 19) / 22));
  assert.equal(net, 43182);
});

test('a full month of LOP pays nothing', () => {
  const { payableDays, net } = prorateForLop(30000, 26, 26);
  assert.equal(payableDays, 0);
  assert.equal(net, 0);
});

test('LOP beyond the working days is clamped', () => {
  const { payableDays, net } = prorateForLop(30000, 26, 99);
  assert.equal(payableDays, 0);
  assert.equal(net, 0);
});

test('negative LOP is ignored', () => {
  const { payableDays, net } = prorateForLop(30000, 26, -5);
  assert.equal(payableDays, 26);
  assert.equal(net, 30000);
});

test('a zero working-day month falls back to the default', () => {
  const { payableDays, net } = prorateForLop(26000, 0, 0);
  assert.equal(payableDays, DEFAULT_RUN_WORKING_DAYS);
  assert.equal(net, 26000);
});
