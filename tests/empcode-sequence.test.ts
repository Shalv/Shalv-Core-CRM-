import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getNextAvailableEmpCode, collectExistingEmpCodes, normalizeEmpCode} from '../src/components/payroll/payrollTypes.ts';

// payrollTypes reads localStorage when no master set is supplied; stub it so the allocator's
// fallback path runs the same way it would in a browser with an empty cache.
const store = new Map<string, string>();
(globalThis as any).localStorage = {getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => {store.delete(k);}};

// Employee codes are allocated entirely in the browser - the server only normalizes and enforces
// uniqueness on whatever it is given. The allocator used to read payroll masters only, so a number
// already assigned to a CRM user (a person enrolled in CRM but not yet in payroll, or the reverse)
// was invisible: the "next" code could reissue a used number, or a not-yet-loaded cache restarted
// the whole sequence. These tests pin that the sequence accounts for codes held on BOTH collections.

const master = (userId: string, empCode: string) => ({userId, empCode} as any);

test('the next code continues from the highest number across masters and users together', () => {
  const masters = {'e-1': master('e-1', 'EMP-101'), 'e-2': master('e-2', 'EMP-102')};
  // Shivam holds EMP-103 on his CRM user record but has no payroll master yet.
  const users = [{id: 'u-1', empCode: 'EMP-103'}, {id: 'u-2'}];
  const next = getNextAvailableEmpCode(masters, collectExistingEmpCodes(users));
  assert.equal(next, 'EMP-104', 'a number already on a user must not be reissued');
});

test('collectExistingEmpCodes reads both arrays and id-keyed records and skips blanks', () => {
  const codes = collectExistingEmpCodes(
    [{id: 'a', empCode: 'EMP-101'}, {id: 'b', empCode: ''}, {id: 'c'}],
    {'x': master('x', 'EMP-200'), 'y': undefined},
    null
  );
  assert.deepEqual(new Set(codes), new Set(['EMP-101', 'EMP-200']));
});

test('an empty workspace starts at the documented EMP-101 sequence', () => {
  assert.equal(getNextAvailableEmpCode({}, []), 'EMP-101');
  assert.equal(getNextAvailableEmpCode(undefined, collectExistingEmpCodes([])), 'EMP-101');
});

test('masters with only low legacy numbers still do not go backwards', () => {
  // Legacy synthetic codes EMP-001..EMP-007 must not make the next code collide with an existing 1xx.
  const masters = {'e-1': master('e-1', 'EMP-007'), 'e-2': master('e-2', 'EMP-008')};
  assert.equal(getNextAvailableEmpCode(masters, []), 'EMP-101');
});

test('the highest number wins no matter which collection it came from', () => {
  const masters = {'e-1': master('e-1', 'EMP-150')};
  const users = [{id: 'u-9', empCode: 'EMP-173'}];
  assert.equal(getNextAvailableEmpCode(masters, collectExistingEmpCodes(users)), 'EMP-174');
});

test('codes are zero-padded to at least three digits and normalized form is respected', () => {
  const masters = {'e-1': master('e-1', normalizeEmpCode('emp-9'))}; // EMP-009
  assert.equal(masters['e-1'].empCode, 'EMP-009');
  assert.equal(getNextAvailableEmpCode(masters, ['EMP-109']), 'EMP-110');
});
