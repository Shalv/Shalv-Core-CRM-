import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  DEFAULT_PUBLIC_HOLIDAYS,
  DEFAULT_ADMIN_POLICY_MASTER,
  resolveHoliday,
  isPaidHoliday,
} = await import('../src/components/payroll/payrollTypes');
const { resolveDay, summariseMonth } = await import('../src/components/payroll/attendanceLog');

const POLICY = { ...DEFAULT_ADMIN_POLICY_MASTER };
const TODAY = '2026-12-31';

test('the supplied 2026 holiday calendar is loaded in full', () => {
  assert.equal(DEFAULT_PUBLIC_HOLIDAYS.length, 23);
  const dates = DEFAULT_PUBLIC_HOLIDAYS.map((h) => h.date);
  assert.equal(new Set(dates).size, 23, 'no duplicate dates');
  // Restricted holidays are marked as such.
  const restricted = DEFAULT_PUBLIC_HOLIDAYS.filter((h) => h.kind === 'Restricted');
  assert.equal(restricted.length, 6);
});

test('the calendar carries the expected key holidays', () => {
  const byDate = new Map(DEFAULT_PUBLIC_HOLIDAYS.map((h) => [h.date, h]));
  assert.equal(byDate.get('2026-01-26')?.name, 'Republic Day');
  assert.equal(byDate.get('2026-08-15')?.name, 'Independence Day');
  assert.equal(byDate.get('2026-10-02')?.name, 'Mahatma Gandhi\u2019s Birthday');
  assert.equal(byDate.get('2026-11-08')?.name, 'Diwali (Deepavali)');
  assert.equal(byDate.get('2026-12-25')?.name, 'Christmas Day');
  assert.equal(byDate.get('2026-08-17')?.kind, 'Restricted');
});

test('resolveHoliday finds a holiday by date and returns nothing on a normal day', () => {
  assert.equal(resolveHoliday(POLICY, '2026-01-26')?.name, 'Republic Day');
  assert.equal(resolveHoliday(POLICY, '2026-01-27'), undefined);
});

test('a public holiday resolves as a holiday day, not an absence', () => {
  const day = resolveDay('2026-01-26', {}, [], POLICY, TODAY);
  assert.equal(day.code, 'H');
});

test('a holiday still reads as a holiday when it falls on a Sunday', () => {
  // Diwali falls on Sunday 08 Nov 2026.
  const day = resolveDay('2026-11-08', {}, [], POLICY, TODAY);
  assert.equal(day.code, 'H');
});

test('a normal Sunday resolves as a week off', () => {
  // 04 Jan 2026 is a Sunday with no holiday on it.
  const day = resolveDay('2026-01-04', {}, [], POLICY, TODAY);
  assert.equal(day.code, 'WO');
});

test('a future date is not resolved as a holiday', () => {
  const day = resolveDay('2027-01-26', {}, [], POLICY, '2026-12-31');
  assert.equal(day.code, 'FUT');
});

test('a restricted (RH) holiday is NOT treated as a company-wide day off', () => {
  // Nag Panchami, Monday 17 Aug 2026, is marked (RH) in the supplied list.
  assert.equal(resolveHoliday(POLICY, '2026-08-17')?.kind, 'Restricted');
  const day = resolveDay('2026-08-17', {}, [], POLICY, TODAY);
  assert.notEqual(day.code, 'H', 'a restricted holiday must not read as a day off');
  assert.equal(day.code, 'NR', 'it stays an ordinary working day');
});

test('only public holidays count as paid days off', () => {
  assert.equal(isPaidHoliday(POLICY, '2026-01-26'), true, 'Republic Day is a paid day off');
  assert.equal(isPaidHoliday(POLICY, '2026-08-17'), false, 'Nag Panchami (RH) is not');
  assert.equal(isPaidHoliday(POLICY, '2026-01-27'), false, 'an ordinary day is not');
});

test('a holiday is paid and excluded from working days, so it never causes loss of pay', () => {
  // A one-week window containing Republic Day (Mon 26 Jan 2026).
  const dates = ['2026-01-25', '2026-01-26', '2026-01-27'];
  const days = dates.map((d) => resolveDay(d, {}, [], POLICY, TODAY));
  const summary = summariseMonth(days);

  assert.equal(summary.holiday, 1, 'Republic Day counted as a holiday');
  assert.equal(summary.absent, 0, 'a holiday is never an absence');
  assert.equal(summary.weekOff, 1, '25 Jan is a Sunday week off');

  // Payable days include the week off and the holiday (both paid); working days
  // exclude both, leaving only Tue 27 Jan as a working day.
  assert.equal(summary.payableDays, 2, 'the week off and the holiday are both paid');
  assert.equal(summary.workingDays, 1, 'only 27 Jan is a working day in this window');
});
