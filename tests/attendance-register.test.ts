import { test } from 'node:test';
import assert from 'node:assert/strict';

const { dailyAttendanceId, upsertDailyAttendance, summariseAttendanceForDate } = await import(
  '../src/components/payroll/payrollTypes'
);

const DATE = '2026-10-17';
const punch = (over: Record<string, any> = {}) => ({
  employeeId: 'u1',
  employeeName: 'Asha',
  empCode: 'EMP-101',
  date: DATE,
  ...over,
});

/* ------------------------------------------------------- one record per day ---- */

test('the record id is employee + date, so there is exactly one per person per day', () => {
  assert.equal(dailyAttendanceId('u1', DATE), 'u1|2026-10-17');
  assert.notEqual(dailyAttendanceId('u1', DATE), dailyAttendanceId('u2', DATE));
  assert.notEqual(dailyAttendanceId('u1', DATE), dailyAttendanceId('u1', '2026-10-18'));
});

test('a punch in creates the day', () => {
  const list = upsertDailyAttendance([], punch({ punchInTime: '09:15 AM' }));
  assert.equal(list.length, 1);
  assert.equal(list[0].punchInTime, '09:15 AM');
  assert.equal(list[0].punchOutTime, undefined);
});

test('a punch out updates the SAME day and keeps the in time', () => {
  let list = upsertDailyAttendance([], punch({ punchInTime: '09:15 AM' }));
  list = upsertDailyAttendance(list, punch({ punchOutTime: '06:05 PM' }));
  assert.equal(list.length, 1, 'still one record for the day');
  assert.equal(list[0].punchInTime, '09:15 AM', 'the in time survives');
  assert.equal(list[0].punchOutTime, '06:05 PM');
});

test('punching in again does not wipe the out time', () => {
  let list = upsertDailyAttendance([], punch({ punchInTime: '09:15 AM', punchOutTime: '06:05 PM' }));
  list = upsertDailyAttendance(list, punch({ punchInTime: '09:20 AM' }));
  assert.equal(list[0].punchInTime, '09:20 AM');
  assert.equal(list[0].punchOutTime, '06:05 PM');
});

test('two employees on the same day are two records', () => {
  let list = upsertDailyAttendance([], punch({ punchInTime: '09:00 AM' }));
  list = upsertDailyAttendance(list, punch({ employeeId: 'u2', employeeName: 'Ravi', punchInTime: '10:00 AM' }));
  assert.equal(list.length, 2);
});

test('the same employee on two days is two records', () => {
  let list = upsertDailyAttendance([], punch({ punchInTime: '09:00 AM' }));
  list = upsertDailyAttendance(list, punch({ date: '2026-10-18', punchInTime: '09:10 AM' }));
  assert.equal(list.length, 2);
});

test('an admin punch on behalf records who did it', () => {
  const list = upsertDailyAttendance([], punch({ punchInTime: '09:00 AM', recordedByName: 'Shalv Sharma' }));
  assert.equal(list[0].recordedByName, 'Shalv Sharma');
});

/* ------------------------------------------------------ who is in and who is not ---- */

const employees = [
  { userId: 'u1', name: 'Asha', empCode: 'EMP-101' },
  { userId: 'u2', name: 'Ravi', empCode: 'EMP-102' },
  { userId: 'u3', name: 'Meera', empCode: 'EMP-103' },
  { userId: 'u4', name: 'Old Timer', status: 'Inactive' },
];

test('present, completed, on leave and not punched are told apart', () => {
  const records = [
    { id: `u1|${DATE}`, employeeId: 'u1', employeeName: 'Asha', date: DATE, punchInTime: '09:15 AM' },
    { id: `u2|${DATE}`, employeeId: 'u2', employeeName: 'Ravi', date: DATE, punchInTime: '09:05 AM', punchOutTime: '06:00 PM' },
  ];
  const leaves = [{ employeeId: 'u3', startDate: '2026-10-15', endDate: '2026-10-20', status: 'Approved' }];

  const s = summariseAttendanceForDate(records as any, employees, DATE, leaves as any);
  const byId = new Map(s.rows.map((r) => [r.employeeId, r.state]));

  assert.equal(byId.get('u1'), 'Present', 'punched in, not yet out');
  assert.equal(byId.get('u2'), 'Completed', 'punched in and out');
  assert.equal(byId.get('u3'), 'On leave', 'covered by an approved leave');
  assert.equal(s.present, 1);
  assert.equal(s.completed, 1);
  assert.equal(s.onLeave, 1);
  assert.equal(s.notPunched, 0);
});

test('someone with no record and no leave has not punched', () => {
  const s = summariseAttendanceForDate([], employees, DATE, []);
  assert.equal(s.notPunched, 3, 'the three active employees');
  assert.equal(s.present, 0);
});

test('a PENDING leave does not excuse anyone from punching', () => {
  const leaves = [{ employeeId: 'u3', startDate: DATE, endDate: DATE, status: 'Pending Approval' }];
  const s = summariseAttendanceForDate([], employees, DATE, leaves as any);
  const meera = s.rows.find((r) => r.employeeId === 'u3');
  assert.equal(meera?.state, 'Not punched', 'an undecided request is not a granted leave');
});

test('a leave on another day does not mark today', () => {
  const leaves = [{ employeeId: 'u3', startDate: '2026-10-01', endDate: '2026-10-05', status: 'Approved' }];
  const s = summariseAttendanceForDate([], employees, DATE, leaves as any);
  assert.equal(s.rows.find((r) => r.employeeId === 'u3')?.state, 'Not punched');
});

test('an inactive employee is not expected to punch', () => {
  const s = summariseAttendanceForDate([], employees, DATE, []);
  assert.equal(s.rows.some((r) => r.employeeId === 'u4'), false);
});

test("yesterday's record does not count for today", () => {
  const records = [{ id: 'u1|2026-10-16', employeeId: 'u1', date: '2026-10-16', punchInTime: '09:00 AM' }];
  const s = summariseAttendanceForDate(records as any, employees, DATE, []);
  assert.equal(s.rows.find((r) => r.employeeId === 'u1')?.state, 'Not punched');
});

test('the counts always add up to the workforce', () => {
  const records = [{ id: `u1|${DATE}`, employeeId: 'u1', date: DATE, punchInTime: '09:15 AM' }];
  const s = summariseAttendanceForDate(records as any, employees, DATE, []);
  assert.equal(s.present + s.completed + s.onLeave + s.notPunched, s.rows.length);
});

test('no employees, or a broken record, yields nothing rather than throwing', () => {
  assert.equal(summariseAttendanceForDate([], [], DATE, []).rows.length, 0);
  assert.equal(summariseAttendanceForDate([null as any, {} as any], employees, DATE, []).notPunched, 3);
});
