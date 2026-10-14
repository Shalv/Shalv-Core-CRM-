import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPayrollOnlyUser, crmVisibleUsers } from '../src/shared/userScope';

// A "Payroll Only" employee must never surface inside CRM lists, pickers or counters, yet their
// record has to stay in the CRM `users` slice because login and /api/sync key identity there.
// These tests pin both halves of that contract.
const admin = { id: 'usr-1', name: 'Shalv Sharma', role: 'Super Admin', accessScope: 'all' } as any;
const payrollByType = { id: 'usr-2', name: 'Rohan Mehta', role: 'Sales Executive', accessType: 'payroll_only', accessScope: 'payroll_only' } as any;
const payrollByLegacyScope = { id: 'usr-3', name: 'Legacy Caps', role: 'Finance Executive', accessScope: 'PAYROLL_ONLY' } as any;
const payrollByTypeOnly = { id: 'usr-4', name: 'Type Only', role: 'Finance Executive', accessType: 'payroll_only' } as any;
const crmAndPayroll = { id: 'usr-5', name: 'Both Systems', role: 'Sales Manager', accessType: 'crm_and_payroll' } as any;
const noScopeAtAll = { id: 'usr-6', name: 'Untagged', role: 'Administrator' } as any;

test('payroll-only is detected from accessType, accessScope and the legacy uppercase scope', () => {
  assert.equal(isPayrollOnlyUser(payrollByType), true);
  assert.equal(isPayrollOnlyUser(payrollByTypeOnly), true);
  assert.equal(isPayrollOnlyUser(payrollByLegacyScope), true);
});

test('CRM and dual-scope profiles are not payroll-only', () => {
  assert.equal(isPayrollOnlyUser(admin), false);
  assert.equal(isPayrollOnlyUser(crmAndPayroll), false);
  // A user created before the scope selector existed defaults to a normal CRM profile.
  assert.equal(isPayrollOnlyUser(noScopeAtAll), false);
  assert.equal(isPayrollOnlyUser(undefined), false);
  assert.equal(isPayrollOnlyUser(null), false);
});

test('crmVisibleUsers drops payroll-only records from every CRM projection', () => {
  const users = [admin, payrollByType, payrollByLegacyScope, payrollByTypeOnly, crmAndPayroll, noScopeAtAll];
  assert.deepEqual(
    crmVisibleUsers(users).map((u) => u.id),
    ['usr-1', 'usr-5', 'usr-6'],
    'only CRM-visible profiles remain, in original order'
  );
});

test('the projection never mutates the source list, so payroll login keeps its identity record', () => {
  const users = [admin, payrollByType];
  const visible = crmVisibleUsers(users);
  assert.equal(users.length, 2, 'raw users slice keeps the payroll-only record for ESS sign-in');
  assert.ok(users.some((u) => u.id === 'usr-2'));
  assert.equal(visible.length, 1);
  assert.notEqual(visible, users, 'a new array is returned, not the context state filtered in place');
});

test('crmVisibleUsers tolerates empty and sparse input from a not-yet-synced client', () => {
  assert.deepEqual(crmVisibleUsers(undefined), []);
  assert.deepEqual(crmVisibleUsers([]), []);
  assert.deepEqual(crmVisibleUsers([null, admin, undefined] as any), [admin]);
});
