import { test } from 'node:test';
import assert from 'node:assert/strict';

const { roundRupees, money, validatePaymentLinks } = await import('../src/shared/integrity');
const { confirmSave, confirmDelete } = await import('../src/shared/confirm');

/* ------------------------------------------------------------- rounding off ---- */

test('a decimal payment amount rounds off to whole rupees', () => {
  assert.equal(roundRupees(100.5), 101);
  assert.equal(roundRupees(100.4), 100);
  assert.equal(roundRupees(100.49), 100);
  assert.equal(roundRupees(99.5), 100);
  assert.equal(roundRupees(0.49), 0);
  assert.equal(roundRupees(0.5), 1);
});

test('whole amounts and floats are left clean', () => {
  assert.equal(roundRupees(25000), 25000);
  // The classic float artefact must not survive rounding.
  assert.equal(roundRupees(0.1 + 0.2), 0);
  assert.equal(roundRupees(1234.999999999), 1235);
});

test('rounding never produces NaN or a negative artefact', () => {
  assert.equal(roundRupees('not a number'), 0);
  assert.equal(roundRupees(undefined), 0);
  assert.equal(roundRupees(null), 0);
  assert.equal(roundRupees(NaN), 0);
  assert.equal(roundRupees(Infinity), 0);
});

test('roundRupees is stable — rounding an already-rounded value changes nothing', () => {
  for (const v of [0, 1, 99, 100.5, 25000.75, 1000000.4]) {
    assert.equal(roundRupees(roundRupees(v)), roundRupees(v));
  }
});

test('money still keeps paise for balances, while roundRupees drops them', () => {
  assert.equal(money(100.5), 100.5);
  assert.equal(roundRupees(100.5), 101);
});

/* ------------------------------------------- the rounded amount passes checks ---- */

const snapshot = {
  invoices: [{ id: 'inv1', customerId: 'c1', status: 'Issued', grandTotal: 1000, paidAmount: 0, balanceAmount: 1000 }],
  milestones: [],
  orders: [],
} as any;

test('a rounded amount equal to the invoice balance is accepted', () => {
  assert.doesNotThrow(() =>
    validatePaymentLinks(snapshot, {
      amount: roundRupees(1000),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

test('a decimal that rounds down to the balance is accepted', () => {
  // 1000.4 rounds to 1000, which is exactly the balance — this used to be able to trip the check.
  assert.doesNotThrow(() =>
    validatePaymentLinks(snapshot, {
      amount: roundRupees(1000.4),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

test('a genuine overpayment is still rejected', () => {
  assert.throws(() =>
    validatePaymentLinks(snapshot, {
      amount: roundRupees(1001),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

/* ------------------------------------------------------- save confirmation ---- */

test('the save confirmation never blocks outside a browser (tests, SSR)', () => {
  assert.equal(confirmSave('customer'), true);
  assert.equal(confirmSave('payment receipt'), true);
  assert.equal(confirmDelete('payment receipt'), true);
});

test('the save confirmation asks a question naming the record', () => {
  const calls: string[] = [];
  (globalThis as any).window = {
    confirm: (m: string) => {
      calls.push(m);
      return true;
    },
  };
  try {
    assert.equal(confirmSave('sales order'), true);
    assert.equal(confirmDelete('invoice'), true);
    assert.equal(calls.length, 2);
    assert.match(calls[0], /Save this sales order\?/);
    assert.match(calls[1], /Delete this invoice\?/);
    assert.match(calls[1], /cannot be undone/i);
  } finally {
    delete (globalThis as any).window;
  }
});

test('declining the confirmation stops the save', () => {
  (globalThis as any).window = { confirm: () => false };
  try {
    assert.equal(confirmSave('customer'), false);
    assert.equal(confirmDelete('customer'), false);
  } finally {
    delete (globalThis as any).window;
  }
});
