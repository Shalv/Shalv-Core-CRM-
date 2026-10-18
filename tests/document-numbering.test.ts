import { test } from 'node:test';
import assert from 'node:assert/strict';

const { nextClaimNumber, nextClaimId } = await import('../src/components/payroll/payrollTypes');

const YEAR = new Date().getFullYear();

/* --------------------------------------------------- no more duplicate numbers ---- */

test('the first claim is numbered from one, not at random', () => {
  assert.equal(nextClaimNumber([]), `CLM-${YEAR}-001`);
  assert.equal(nextClaimId([]), 'EXP-0001');
});

test('the next number follows the highest one already issued', () => {
  const existing = [{ claimNo: `CLM-${YEAR}-001` }, { claimNo: `CLM-${YEAR}-004` }, { claimNo: `CLM-${YEAR}-002` }];
  assert.equal(nextClaimNumber(existing), `CLM-${YEAR}-005`, 'not 003 — it must not reuse an issued number');
});

test('ids follow the same rule', () => {
  assert.equal(nextClaimId([{ id: 'EXP-0001' }, { id: 'EXP-0009' }]), 'EXP-0010');
});

test('numbers keep incrementing, so no two claims can ever collide', () => {
  let claims: { claimNo?: string; id?: string }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 25; i += 1) {
    const no = nextClaimNumber(claims);
    const id = nextClaimId(claims);
    assert.equal(seen.has(no), false, `${no} was issued twice`);
    seen.add(no);
    claims = [...claims, { claimNo: no, id }];
  }
  assert.equal(seen.size, 25);
});

test('the sequence survives numbers from a previous year', () => {
  const existing = [{ claimNo: 'CLM-2025-099' }, { claimNo: `CLM-${YEAR}-003` }];
  assert.equal(nextClaimNumber(existing), `CLM-${YEAR}-004`);
});

test('a missing, malformed or broken record is ignored rather than breaking the sequence', () => {
  assert.equal(nextClaimNumber([{}, { claimNo: 'nonsense' }, null as any]), `CLM-${YEAR}-001`);
  assert.equal(nextClaimId([{}, { id: 'EXP-abc' }]), 'EXP-0001');
  assert.equal(nextClaimNumber(undefined as any), `CLM-${YEAR}-001`);
});

test('the numbers are zero-padded so they sort correctly as text', () => {
  assert.equal(nextClaimNumber([]).endsWith('001'), true);
  assert.equal(nextClaimId([]).endsWith('0001'), true);
});
