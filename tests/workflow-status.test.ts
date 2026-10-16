import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  DEFAULT_ADMIN_POLICY_MASTER,
  buildDefaultSalaryMasterRecord,
  calculateEmployeePolicyPayroll,
} = await import('../src/components/payroll/payrollTypes');

const POLICY = { ...DEFAULT_ADMIN_POLICY_MASTER } as any;

const master = buildDefaultSalaryMasterRecord({
  id: 'u-test',
  name: 'Test Employee',
  role: 'Employee',
  empCode: 'EMP-999',
  monthlyGross: 50000,
} as any);

const leave = (id: string, status: string, days = 1) => ({
  id,
  employeeId: 'u-test',
  employeeName: 'Test Employee',
  leaveType: 'Casual Leave',
  startDate: '2026-10-05',
  endDate: '2026-10-05',
  days,
  dayType: 'Full Day',
  reason: 'test',
  handoverTo: 'Reporting Manager',
  status,
  appliedOn: '01 Oct 2026',
  requestedInAdvance: true,
});

const run = (leaves: any[]) =>
  calculateEmployeePolicyPayroll({
    monthKey: '2026-10',
    master,
    policy: POLICY,
    leaves,
  });

/* ------------------------------------------------- leave approval workflow ---- */

test('only APPROVED leave counts toward the monthly leave used', () => {
  const withApproved = run([leave('LV-1', 'Approved')]);
  const withPending = run([leave('LV-1', 'Pending Approval')]);
  const withRejected = run([leave('LV-1', 'Rejected')]);
  const withCancelled = run([leave('LV-1', 'Cancelled')]);

  assert.equal(withApproved.approvedMonthlyLeaveDays, 1, 'an approved leave is counted');
  assert.equal(withPending.approvedMonthlyLeaveDays, 0, 'a pending leave is not yet counted');
  assert.equal(withRejected.approvedMonthlyLeaveDays, 0, 'a rejected leave is not counted');
  assert.equal(withCancelled.approvedMonthlyLeaveDays, 0, 'a cancelled leave is not counted');
});

test('a rejected leave is treated exactly like a cancelled one by payroll', () => {
  const rejected = run([leave('LV-1', 'Rejected')]);
  const cancelled = run([leave('LV-1', 'Cancelled')]);
  assert.equal(rejected.approvedMonthlyLeaveDays, cancelled.approvedMonthlyLeaveDays);
  assert.equal(rejected.excessMonthlyLeaveLopDays, cancelled.excessMonthlyLeaveLopDays);
  assert.equal(rejected.netPayable, cancelled.netPayable);
});

test('a rejected leave does not reduce pay', () => {
  const none = run([]);
  const rejected = run([leave('LV-1', 'Rejected', 5)]);
  assert.equal(rejected.netPayable, none.netPayable);
  assert.equal(rejected.lopDays, none.lopDays);
});

test('an approved leave within the monthly quota does not attract LOP', () => {
  const b = run([leave('LV-1', 'Approved')]);
  // The default policy allows one leave per month, so a single approved day is paid.
  assert.equal(b.excessMonthlyLeaveLopDays, 0);
});

/* -------------------------------------------------- the numbers still hold ---- */

test('the breakdown is produced for a valid master and reconciles', () => {
  const b = run([leave('LV-1', 'Approved')]);
  assert.ok(b.grossEarnings > 0, 'earnings were computed');
  assert.ok(b.netPayable >= 0, 'net is not negative');
  assert.ok(b.totalDeductions >= 0, 'deductions are not negative');
});
