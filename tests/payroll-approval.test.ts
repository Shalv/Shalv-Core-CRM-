import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  nextPayrollRunStatus,
  updatePayrollRun,
  reopenPayrollRun,
} = await import('../src/components/payroll/payrollTypes');

const run = (over: Record<string, any> = {}) =>
  ({
    id: '2026-10',
    month: '2026-10',
    status: 'Draft',
    paymentStatus: 'Unpaid',
    locked: false,
    headcount: 0,
    grossTotal: 0,
    netTotal: 0,
    lines: [],
    adjustments: [],
    history: [],
    ...over,
  }) as any;

/* ------------------------------------------------- the approval pipeline ---- */

test('the pipeline advances one step at a time and never skips', () => {
  assert.equal(nextPayrollRunStatus('Draft'), 'Calculated');
  assert.equal(nextPayrollRunStatus('Calculated'), 'Under Review');
  assert.equal(nextPayrollRunStatus('Under Review'), 'Approved');
  assert.equal(nextPayrollRunStatus('Approved'), 'Published');
  assert.equal(nextPayrollRunStatus('Published'), 'Paid');
});

test('a paid run is terminal — there is nothing after it', () => {
  assert.equal(nextPayrollRunStatus('Paid'), null);
});

test('approval cannot be reached from Draft or Calculated in one step', () => {
  assert.notEqual(nextPayrollRunStatus('Draft'), 'Approved');
  assert.notEqual(nextPayrollRunStatus('Calculated'), 'Approved');
});

/* ------------------------------------------------------------ the lock ---- */

test('an UNLOCKED run accepts a change and records it in the audit trail', () => {
  const next = updatePayrollRun([run()], '2026-10', { status: 'Calculated' }, 'Asha (Admin)', 'Status → Calculated');
  assert.equal(next[0].status, 'Calculated');
  assert.equal(next[0].history.length, 1);
  assert.equal(next[0].history[0].from, 'Draft');
  assert.equal(next[0].history[0].to, 'Calculated');
  assert.equal(next[0].history[0].by, 'Asha (Admin)');
});

test('a LOCKED run is read-only — the change is refused outright', () => {
  const locked = run({ status: 'Paid', paymentStatus: 'Paid', locked: true });
  const next = updatePayrollRun([locked], '2026-10', { status: 'Draft', netTotal: 999999 }, 'Someone', 'Tamper');
  assert.equal(next[0].status, 'Paid', 'status must not change on a locked run');
  assert.equal(next[0].netTotal, 0, 'amounts must not change on a locked run');
  assert.equal(next[0].history.length, 0, 'a refused change must not be audited as if it happened');
});

test('locking an unlocked run still works (the lock itself is allowed)', () => {
  const next = updatePayrollRun([run({ status: 'Approved' })], '2026-10', { locked: true }, 'Asha', 'Locked');
  assert.equal(next[0].locked, true);
  assert.equal(next[0].history.length, 1);
});

test('a change to a different run is untouched by another run being locked', () => {
  const list = [run({ id: '2026-09', locked: true, status: 'Paid' }), run({ id: '2026-10' })];
  const next = updatePayrollRun(list, '2026-10', { status: 'Calculated' }, 'Asha', 'Status → Calculated');
  assert.equal(next[0].status, 'Paid');
  assert.equal(next[1].status, 'Calculated');
});

/* ---------------------------------------------------------- reopening ---- */

test('reopening clears the lock and returns the run to Under Review', () => {
  const locked = run({ status: 'Paid', paymentStatus: 'Paid', locked: true, paidAt: '2026-11-01T00:00:00.000Z' });
  const next = reopenPayrollRun([locked], '2026-10', 'Asha (Admin)', 'Arrear to be added');
  assert.equal(next[0].locked, false);
  assert.equal(next[0].status, 'Under Review');
  assert.equal(next[0].reopenReason, 'Arrear to be added');
});

test('reopening a PAID run no longer shows "Under Review" beside "Payment: Paid"', () => {
  const locked = run({ status: 'Paid', paymentStatus: 'Paid', locked: true, paidAt: '2026-11-01T00:00:00.000Z' });
  const next = reopenPayrollRun([locked], '2026-10', 'Asha', 'Correction');
  assert.equal(next[0].paymentStatus, 'Unpaid', 'a reopened run is not settled');
});

test('the original payment date survives a reopening, in the audit trail', () => {
  const paidAt = '2026-11-01T00:00:00.000Z';
  const locked = run({ status: 'Paid', paymentStatus: 'Paid', locked: true, paidAt });
  const next = reopenPayrollRun([locked], '2026-10', 'Asha', 'Correction');
  const entry = next[0].history[next[0].history.length - 1];
  assert.match(entry.action, /Reopened — Correction/);
  assert.match(entry.action, /was paid on 2026-11-01/, 'the payment date is recorded, not lost');
  assert.equal(entry.from, 'Paid');
  assert.equal(entry.to, 'Under Review');
});

test('reopening an unpaid run leaves its payment status alone', () => {
  const approved = run({ status: 'Approved', paymentStatus: 'Unpaid', locked: true });
  const next = reopenPayrollRun([approved], '2026-10', 'Asha', 'Review again');
  assert.equal(next[0].paymentStatus, 'Unpaid');
  assert.doesNotMatch(next[0].history[0].action, /was paid on/);
});

test('reopening a run that is not locked still returns it to Under Review', () => {
  const next = reopenPayrollRun([run({ status: 'Approved' })], '2026-10', 'Asha', 'Reason');
  assert.equal(next[0].status, 'Under Review');
  assert.equal(next[0].locked, false);
});
