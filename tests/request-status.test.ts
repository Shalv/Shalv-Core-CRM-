import { test } from 'node:test';
import assert from 'node:assert/strict';

const { REQUEST_TONE } = await import('../src/components/payroll/EssPersonalOverview');

const tone = (status: string) => REQUEST_TONE[status] || 'neutral';

test('an undecided request reads as pending', () => {
  assert.equal(tone('Pending Approval'), 'pending', 'leave awaiting a decision');
  assert.equal(tone('Under Verification'), 'pending', 'claim awaiting verification');
  assert.equal(tone('Pending'), 'pending', 'regularization / swap awaiting a decision');
  assert.equal(tone('Open'), 'pending', 'a help desk ticket');
});

test('an approved request reads as approved', () => {
  assert.equal(tone('Approved'), 'approved', 'leave');
  assert.equal(tone('Approved & Queued for Payroll'), 'approved', 'claim');
  assert.equal(tone('Resolved'), 'approved', 'ticket');
  assert.equal(tone('Paid in Payslip'), 'approved', 'claim paid');
});

test('a refused request reads as rejected', () => {
  assert.equal(tone('Rejected'), 'rejected');
  assert.equal(tone('Unauthorized Absence (LOP)'), 'rejected');
});

test('a withdrawn request is neither pending nor rejected', () => {
  assert.equal(tone('Cancelled'), 'neutral');
  assert.equal(tone('Closed'), 'neutral');
});

test('an unknown status never reads as approved or rejected', () => {
  assert.equal(tone('Something New'), 'neutral');
  assert.equal(tone(''), 'neutral');
});

test('every status an employee can actually see is mapped', () => {
  // The statuses produced across leave, claims, regularization, swaps and tickets.
  const produced = [
    'Pending Approval', 'Approved', 'Rejected', 'Cancelled', 'Unauthorized Absence (LOP)',
    'Under Verification', 'Approved & Queued for Payroll', 'Paid in Payslip',
    'Pending', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed',
  ];
  for (const s of produced) {
    assert.ok(REQUEST_TONE[s], `no tone mapped for "${s}" — it would fall back to neutral`);
  }
});
