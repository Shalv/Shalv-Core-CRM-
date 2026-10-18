import { test } from 'node:test';
import assert from 'node:assert/strict';

const { isOnApprovedLeave, upsertDailyAttendance, dailyAttendanceId } = await import(
  '../src/components/payroll/payrollTypes'
);

const leave = (over: Record<string, any> = {}) => ({
  employeeId: 'u1',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  status: 'Approved',
  ...over,
});

/* --------------------------------------- who is on leave on a given day ---- */

test('an approved leave covering the day marks the employee on leave', () => {
  assert.equal(isOnApprovedLeave('u1', '2026-10-16', [leave()]), true);
});

test('the leave boundary days count', () => {
  assert.equal(isOnApprovedLeave('u1', '2026-10-15', [leave()]), true, 'first day');
  assert.equal(isOnApprovedLeave('u1', '2026-10-18', [leave()]), true, 'last day');
});

test('a day outside the leave does not', () => {
  assert.equal(isOnApprovedLeave('u1', '2026-10-14', [leave()]), false);
  assert.equal(isOnApprovedLeave('u1', '2026-10-19', [leave()]), false);
});

test('a single-day leave marks only that day', () => {
  const l = leave({ startDate: '2026-10-16', endDate: undefined });
  assert.equal(isOnApprovedLeave('u1', '2026-10-16', [l]), true);
  assert.equal(isOnApprovedLeave('u1', '2026-10-17', [l]), false);
});

test('only an APPROVED leave excuses the day', () => {
  for (const status of ['Pending Approval', 'Rejected', 'Cancelled', 'Unauthorized Absence (LOP)']) {
    assert.equal(isOnApprovedLeave('u1', '2026-10-16', [leave({ status })]), false, status);
  }
});

test("another employee's leave does not apply", () => {
  assert.equal(isOnApprovedLeave('u2', '2026-10-16', [leave()]), false);
});

test('no leaves, or a broken record, is not on leave', () => {
  assert.equal(isOnApprovedLeave('u1', '2026-10-16', []), false);
  assert.equal(isOnApprovedLeave('u1', '2026-10-16', [null as any, {} as any]), false);
  assert.equal(isOnApprovedLeave('u1', '2026-10-16', undefined as any), false);
});

/* ----------------------------------------- one record per person per day ---- */

test('the register keys a record to a person AND a date', () => {
  assert.equal(dailyAttendanceId('u1', '2026-10-18'), 'u1|2026-10-18');
  assert.notEqual(dailyAttendanceId('u1', '2026-10-18'), dailyAttendanceId('u1', '2026-10-17'));
});

test('punches on different days are different records, so the date selector has data to show', () => {
  let list = upsertDailyAttendance([], { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-16', punchInTime: '09:10 AM' });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-17', punchInTime: '09:25 AM' });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchInTime: '09:05 AM' });
  assert.equal(list.length, 3);
  assert.deepEqual([...new Set(list.map((r) => r.date))].sort(), ['2026-10-16', '2026-10-17', '2026-10-18']);
});

/* --------------------------------------------------- punch coordinates ---- */

test('the punch coordinates are stored, so the map link opens the real place', () => {
  const list = upsertDailyAttendance([], {
    employeeId: 'u1',
    employeeName: 'Asha',
    date: '2026-10-18',
    punchInTime: '09:10 AM',
    locationName: 'SRS Tower, Sector 31, Faridabad',
    locationLat: 28.4457691,
    locationLng: 77.3082054,
  });
  assert.equal(list[0].locationLat, 28.4457691);
  assert.equal(list[0].locationLng, 77.3082054);
  assert.equal(list[0].locationName, 'SRS Tower, Sector 31, Faridabad');
});

test('a punch out does not wipe the coordinates recorded at punch in', () => {
  let list = upsertDailyAttendance([], {
    employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18',
    punchInTime: '09:10 AM', locationLat: 28.4457691, locationLng: 77.3082054,
  });
  list = upsertDailyAttendance(list, { employeeId: 'u1', employeeName: 'Asha', date: '2026-10-18', punchOutTime: '06:00 PM' });
  assert.equal(list[0].locationLat, 28.4457691, 'the in-location survives the punch out');
  assert.equal(list[0].punchOutTime, '06:00 PM');
});
