import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  DEFAULT_ADMIN_POLICY_MASTER,
  isNonWorkingDay,
  workingDaysElapsedInMonth,
  proratePayrollToDate,
} = await import('../src/components/payroll/payrollTypes');

const POLICY = { ...DEFAULT_ADMIN_POLICY_MASTER } as any;

/* ------------------------------------------------------- what counts as a working day ---- */

test('a Sunday is not a working day', () => {
  // 04 Oct 2026 is a Sunday.
  assert.equal(isNonWorkingDay('2026-10-04', POLICY), true);
});

test('the 2nd and 4th Saturdays are off, the others are working', () => {
  // Oct 2026 Saturdays: 3rd (1st), 10th (2nd), 17th (3rd), 24th (4th), 31st (5th).
  assert.equal(isNonWorkingDay('2026-10-03', POLICY), false, '1st Saturday is a working day');
  assert.equal(isNonWorkingDay('2026-10-10', POLICY), true, '2nd Saturday is off');
  assert.equal(isNonWorkingDay('2026-10-17', POLICY), false, '3rd Saturday is a working day');
  assert.equal(isNonWorkingDay('2026-10-24', POLICY), true, '4th Saturday is off');
});

test('a public holiday is not a working day', () => {
  assert.equal(isNonWorkingDay('2026-10-02', POLICY), true, 'Gandhi Jayanti');
  assert.equal(isNonWorkingDay('2026-10-20', POLICY), true, 'Dussehra');
});

test('an ordinary weekday is a working day', () => {
  assert.equal(isNonWorkingDay('2026-10-01', POLICY), false, 'Thursday');
  assert.equal(isNonWorkingDay('2026-10-16', POLICY), false, 'Friday');
});

/* --------------------------------------------- working days elapsed in the month ---- */

test('October 2026 to the 16th: 12 of 23 working days elapsed', () => {
  const p = workingDaysElapsedInMonth('2026-10', '2026-10-16', POLICY);
  // 31 days - 4 Sundays (4,11,18,25) - 2 off-Saturdays (10,24) - 2 public holidays (2,20) = 23
  assert.equal(p.total, 23);
  // 1..16 = 16 days - Sundays (4,11) - off-Saturday (10) - holiday (2) = 12
  assert.equal(p.elapsed, 12);
  assert.ok(Math.abs(p.fraction - 12 / 23) < 1e-9);
});

test('a month in the past is fully elapsed, a future month not at all', () => {
  assert.equal(workingDaysElapsedInMonth('2026-09', '2026-10-16', POLICY).fraction, 1);
  assert.equal(workingDaysElapsedInMonth('2026-11', '2026-10-16', POLICY).fraction, 0);
});

test('the last day of the month is fully elapsed', () => {
  const p = workingDaysElapsedInMonth('2026-10', '2026-10-31', POLICY);
  assert.equal(p.elapsed, p.total);
  assert.equal(p.fraction, 1);
});

test('the fraction never exceeds 1', () => {
  for (const today of ['2026-10-01', '2026-10-16', '2026-10-31', '2027-01-05']) {
    const p = workingDaysElapsedInMonth('2026-10', today, POLICY);
    assert.ok(p.fraction >= 0 && p.fraction <= 1, `fraction out of range for ${today}`);
    assert.ok(p.elapsed <= p.total);
  }
});

/* ----------------------------------------------------- prorating the breakdown ---- */

const breakdown = {
  adjustedGross: 50000,
  basic: 25000,
  hra: 10000,
  specialAllowance: 12000,
  conveyance: 3000,
  incentive: 5000,
  grossEarnings: 55000,
  pfDeduction: 1800,
  professionalTax: 200,
  incomeTaxTds: 4000,
  loanRecovery: 3000,
  advanceRecovery: 0,
  otherDeductions: 500,
  approvedReimbursements: 2000,
  totalDeductions: 9500,
  netPayable: 47500,
} as any;

test('at a full month the prorated figures equal the full-month figures', () => {
  const p = proratePayrollToDate(breakdown, 1);
  assert.equal(p.grossEarnings, 55000);
  assert.equal(p.totalDeductions, 9500);
  assert.equal(p.netPayable, 47500);
});

test('at the start of the month nothing has accrued', () => {
  const p = proratePayrollToDate(breakdown, 0);
  assert.equal(p.grossEarnings, 0);
  assert.equal(p.totalDeductions, 0);
  assert.equal(p.netPayable, 0);
});

test('the prorated parts always reconcile to the prorated net', () => {
  for (const f of [0, 0.1, 0.5, 12 / 23, 0.99, 1]) {
    const p = proratePayrollToDate(breakdown, f);
    const parts =
      p.pfDeduction + p.professionalTax + p.incomeTaxTds + p.loanRecovery + p.advanceRecovery + p.otherDeductions;
    assert.equal(p.totalDeductions, parts, `deductions do not reconcile at ${f}`);
    assert.equal(
      p.netPayable,
      Math.max(0, p.grossEarnings + p.approvedReimbursements - p.totalDeductions),
      `net does not reconcile at ${f}`
    );
  }
});

test('a half month is roughly half the pay, and never negative', () => {
  const p = proratePayrollToDate(breakdown, 0.5);
  assert.equal(p.grossEarnings, 27500);
  assert.equal(p.netPayable, Math.max(0, p.grossEarnings + p.approvedReimbursements - p.totalDeductions));
  assert.ok(p.netPayable >= 0);
});

test('an out-of-range fraction is clamped', () => {
  assert.equal(proratePayrollToDate(breakdown, 2).netPayable, 47500);
  assert.equal(proratePayrollToDate(breakdown, -1).netPayable, 0);
  assert.equal(proratePayrollToDate(breakdown, Number('x')).netPayable, 0);
});
