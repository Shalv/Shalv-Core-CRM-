import { test } from 'node:test';
import assert from 'node:assert/strict';

const { parseClockTime, workedMinutesFor, formatWorkedHours, upsertDailyAttendance } = await import(
  '../src/components/payroll/payrollTypes'
);

/* --------------------------------------------------------- clock parsing ---- */

test('a 12-hour clock time parses to minutes past midnight', () => {
  assert.equal(parseClockTime('09:15 AM'), 9 * 60 + 15);
  assert.equal(parseClockTime('12:00 PM'), 12 * 60, 'noon is 12:00, not 00:00');
  assert.equal(parseClockTime('12:30 AM'), 30, 'midnight is 00:30');
  assert.equal(parseClockTime('06:05 PM'), 18 * 60 + 5);
});

test('an unparseable time is null rather than a wrong number', () => {
  for (const bad of ['—', '', undefined, 'nonsense', '25:00', '09:15', '9.15 AM']) {
    assert.equal(parseClockTime(bad as any), null, String(bad));
  }
});

/* --------------------------------------------------------- worked hours ---- */

test('the working day runs from the first punch in to the last punch out', () => {
  assert.equal(workedMinutesFor({ punchInTime: '09:15 AM', punchOutTime: '06:05 PM' }), 8 * 60 + 50);
});

test('a half-finished day reports no hours', () => {
  assert.equal(workedMinutesFor({ punchInTime: '09:15 AM' }), 0, 'still in');
  assert.equal(workedMinutesFor({ punchOutTime: '06:05 PM' }), 0, 'never punched in');
  assert.equal(workedMinutesFor({}), 0);
  assert.equal(workedMinutesFor(null), 0);
  assert.equal(workedMinutesFor(undefined), 0);
});

test('a short day is measured accurately', () => {
  assert.equal(workedMinutesFor({ punchInTime: '09:30 AM', punchOutTime: '01:00 PM' }), 210);
});

test('a punch out before the punch in never reports negative hours', () => {
  assert.equal(workedMinutesFor({ punchInTime: '06:00 PM', punchOutTime: '09:00 AM' }), 0);
});

test('hours are shown as "8h 50m"', () => {
  assert.equal(formatWorkedHours(530), '8h 50m');
  assert.equal(formatWorkedHours(60), '1h 00m');
  assert.equal(formatWorkedHours(5), '0h 05m');
  assert.equal(formatWorkedHours(0), '—', 'no hours reads as a dash, not "0h 00m"');
  assert.equal(formatWorkedHours(-10), '—');
});

/* ------------------------------------- the register enforces the same rule ---- */

test('a full day of punches gives the right hours end to end', () => {
  let list = upsertDailyAttendance([], {
    employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchInTime: '09:15 AM',
  });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchOutTime: '01:00 PM' });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchInTime: '02:00 PM' });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchOutTime: '06:05 PM' });

  assert.equal(list.length, 1, 'still one record for the day');
  assert.equal(list[0].punchInTime, '09:15 AM', 'the FIRST punch in');
  assert.equal(list[0].punchOutTime, '06:05 PM', 'the LAST punch out');
  assert.equal(workedMinutesFor(list[0]), 8 * 60 + 50, '09:15 to 18:05');
});
