import { test } from 'node:test';
import assert from 'node:assert/strict';

const cache = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => cache.get(k) ?? null,
  setItem: (k: string, v: string) => cache.set(k, v),
  removeItem: (k: string) => cache.delete(k),
};
import { getDeletedPayrollMasterIds, recordDeletedPayrollMasterIds } from '../src/components/payroll/payrollTypes';

test('payroll master deletion tombstones prevent resurrection', () => {
  const testId = 'test-emp-del-1';
  recordDeletedPayrollMasterIds([testId]);
  const deleted = getDeletedPayrollMasterIds();
  assert.ok(deleted.includes(testId), 'deleted master id is recorded in tombstones');
});
