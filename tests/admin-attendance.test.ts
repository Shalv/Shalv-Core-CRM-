import { test } from 'node:test';
import assert from 'node:assert/strict';

const { approvedLeaveDaysInMonth, isNonWorkingDay, DEFAULT_ADMIN_POLICY_MASTER } = await import(
  '../src/components/payroll/payrollTypes'
);

const POLICY = { ...DEFAULT_ADMIN_POLICY_MASTER } as any;
const leave = (start: string, end: string, status = 'Approved') => ({ startDate: start, endDate: end, status });

/* -------------------------------------- a leave is expanded across its whole span ---- */

test('a single-day leave marks exactly one day', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-05')], '2026-10');
  assert.deepEqual([...days], ['2026-10-05']);
});

test('a multi-day leave marks EVERY day in its span, not just the start', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-08')], '2026-10');
  assert.deepEqual([...days].sort(), ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']);
});

test('a leave with no end date is treated as a single day', () => {
  const days = approvedLeaveDaysInMonth([{ startDate: '2026-10-05', status: 'Approved' }], '2026-10');
  assert.deepEqual([...days], ['2026-10-05']);
});

/* ----------------------------------------------- only a GRANTED leave marks days ---- */

test('a pending leave marks nothing', () => {
  assert.equal(approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-08', 'Pending Approval')], '2026-10').size, 0);
});

test('a rejected leave marks nothing', () => {
  assert.equal(approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-08', 'Rejected')], '2026-10').size, 0);
});

test('a cancelled leave marks nothing', () => {
  assert.equal(approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-08', 'Cancelled')], '2026-10').size, 0);
});

test('an unauthorised absence is not treated as leave', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-10-05', '2026-10-05', 'Unauthorized Absence (LOP)')], '2026-10');
  assert.equal(days.size, 0);
});

/* --------------------------------------------------------- clipping to the month ---- */

test('a leave that starts in the previous month is clipped to the 1st', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-09-28', '2026-10-03')], '2026-10');
  assert.deepEqual([...days].sort(), ['2026-10-01', '2026-10-02', '2026-10-03']);
});

test('a leave that runs past month end is clipped to the last day', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-10-30', '2026-11-04')], '2026-10');
  assert.deepEqual([...days].sort(), ['2026-10-30', '2026-10-31']);
});

test('a leave entirely in another month marks nothing', () => {
  assert.equal(approvedLeaveDaysInMonth([leave('2026-09-10', '2026-09-12')], '2026-10').size, 0);
  assert.equal(approvedLeaveDaysInMonth([leave('2026-11-10', '2026-11-12')], '2026-10').size, 0);
});

/* ------------------------------------------------------------------- shapes ---- */

test('overlapping leaves do not double count', () => {
  const days = approvedLeaveDaysInMonth(
    [leave('2026-10-05', '2026-10-08'), leave('2026-10-06', '2026-10-10')],
    '2026-10'
  );
  assert.equal(days.size, 6, '5th to 10th inclusive');
});

test('no leaves, or a broken record, yields nothing rather than throwing', () => {
  assert.equal(approvedLeaveDaysInMonth([], '2026-10').size, 0);
  assert.equal(approvedLeaveDaysInMonth([{} as any, null as any], '2026-10').size, 0);
  assert.equal(approvedLeaveDaysInMonth(undefined as any, '2026-10').size, 0);
});

test('a February leave stays inside February', () => {
  const days = approvedLeaveDaysInMonth([leave('2026-02-25', '2026-03-02')], '2026-02');
  assert.deepEqual([...days].sort(), ['2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28']);
});

/* --------------------------------------------- weekly offs on the admin calendar ---- */

test('the weekly-off rule the admin calendar shades by', () => {
  assert.equal(isNonWorkingDay('2026-10-04', POLICY), true, 'Sunday');
  assert.equal(isNonWorkingDay('2026-10-10', POLICY), true, '2nd Saturday');
  assert.equal(isNonWorkingDay('2026-10-03', POLICY), false, '1st Saturday is working');
  assert.equal(isNonWorkingDay('2026-10-02', POLICY), true, 'Gandhi Jayanti');
  assert.equal(isNonWorkingDay('2026-10-16', POLICY), false, 'a working Friday');
});
