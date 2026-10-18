import { test } from 'node:test';
import assert from 'node:assert/strict';

const { resolveLeaveEntitlements, DEFAULT_LEAVE_ENTITLEMENTS, DEFAULT_ADMIN_POLICY_MASTER } = await import(
  '../src/components/payroll/payrollTypes'
);

/* ------------------------------------------- the master is the source of truth ---- */

test('the entitlements come from the policy master, not the screen', () => {
  const policy = {
    leaveEntitlements: [
      { type: 'Casual Leave', label: 'CL', quota: 18, period: 'per year' },
      { type: 'Sick Leave', label: 'SL', quota: 6, period: 'per year' },
    ],
  };
  const out = resolveLeaveEntitlements(policy as any);
  assert.equal(out.length, 2);
  assert.equal(out[0].quota, 18, 'the master value is used, not a default');
  assert.equal(out[1].quota, 6);
});

test('changing the master changes what the employee dashboard would show', () => {
  const before = resolveLeaveEntitlements({ leaveEntitlements: [{ type: 'Casual Leave', label: 'CL', quota: 12, period: 'per year' }] } as any);
  const after = resolveLeaveEntitlements({ leaveEntitlements: [{ type: 'Casual Leave', label: 'CL', quota: 20, period: 'per year' }] } as any);
  assert.equal(before[0].quota, 12);
  assert.equal(after[0].quota, 20);
});

test('the default policy ships with entitlements, so nothing is invented on screen', () => {
  const out = resolveLeaveEntitlements(DEFAULT_ADMIN_POLICY_MASTER as any);
  assert.ok(out.length > 0, 'the master carries the entitlements');
  assert.equal(out.find((e) => e.type === 'Casual Leave')?.quota, 12);
});

/* ------------------------------------------------------------- fallbacks ---- */

test('an empty or missing master falls back to the company defaults', () => {
  assert.deepEqual(resolveLeaveEntitlements({ leaveEntitlements: [] } as any), DEFAULT_LEAVE_ENTITLEMENTS);
  assert.deepEqual(resolveLeaveEntitlements({} as any), DEFAULT_LEAVE_ENTITLEMENTS);
  assert.deepEqual(resolveLeaveEntitlements(undefined), DEFAULT_LEAVE_ENTITLEMENTS);
  assert.deepEqual(resolveLeaveEntitlements(null), DEFAULT_LEAVE_ENTITLEMENTS);
});

test('a master that is not an array is ignored rather than throwing', () => {
  assert.deepEqual(resolveLeaveEntitlements({ leaveEntitlements: 'nonsense' } as any), DEFAULT_LEAVE_ENTITLEMENTS);
});

/* ------------------------------------------------------------ sanitising ---- */

test('an entry with no leave type is dropped', () => {
  const out = resolveLeaveEntitlements({
    leaveEntitlements: [{ label: 'Nameless', quota: 5 }, { type: 'Casual Leave', quota: 12 }],
  } as any);
  assert.equal(out.length, 1);
  assert.equal(out[0].type, 'Casual Leave');
});

test('a label falls back to the type, and a bad quota to zero', () => {
  const out = resolveLeaveEntitlements({
    leaveEntitlements: [{ type: 'Comp-Off', quota: 'not a number', period: 'as earned' }],
  } as any);
  assert.equal(out[0].label, 'Comp-Off', 'label defaults to the type');
  assert.equal(out[0].quota, 0, 'an unparseable quota becomes zero rather than NaN');
});

test('a negative quota is clamped to zero and the period has a default', () => {
  const out = resolveLeaveEntitlements({ leaveEntitlements: [{ type: 'Casual Leave', quota: -5 }] } as any);
  assert.equal(out[0].quota, 0);
  assert.equal(out[0].period, 'per year');
});

test('a null entry does not crash the resolution', () => {
  const out = resolveLeaveEntitlements({ leaveEntitlements: [null, { type: 'Casual Leave', quota: 12 }] } as any);
  assert.equal(out.length, 1);
});

/* ------------------------------------------------------------------ shape ---- */

test('every resolved entitlement has a type, a label, a quota and a period', () => {
  for (const e of resolveLeaveEntitlements(DEFAULT_ADMIN_POLICY_MASTER as any)) {
    assert.equal(typeof e.type, 'string');
    assert.ok(e.type.length > 0);
    assert.equal(typeof e.label, 'string');
    assert.equal(typeof e.quota, 'number');
    assert.ok(Number.isFinite(e.quota) && e.quota >= 0);
    assert.equal(typeof e.period, 'string');
  }
});
