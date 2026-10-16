import { test } from 'node:test';
import assert from 'node:assert/strict';

const { money, roundRupees, validatePaymentLinks } = await import('../src/shared/integrity');
const { confirmSave, confirmDelete } = await import('../src/shared/confirm');

/* ------------------------------------------- decimals are allowed and kept ---- */

test('a decimal payment amount is kept, not rounded away', () => {
  assert.equal(money(100.5), 100.5);
  assert.equal(money(100.25), 100.25);
  assert.equal(money(0.5), 0.5);
  assert.equal(money(99999.99), 99999.99);
});

test('decimals are tidied to two places (paise), never to a whole rupee', () => {
  assert.equal(money(100.555), 100.56);
  assert.equal(money(100.554), 100.55);
  assert.equal(money(100.5), 100.5);
  // The classic float artefact is cleaned up, but the paise survive.
  assert.equal(money(0.1 + 0.2), 0.3);
  assert.equal(money(1.005), 1.01);
});

test('a decimal is still positive, so a sub-rupee amount saves', () => {
  // 0.50 used to round to 0 and be refused; it must be accepted now.
  assert.ok(money(0.5) > 0);
  assert.equal(money(0.5), 0.5);
});

test('whole amounts are unchanged', () => {
  assert.equal(money(25000), 25000);
  assert.equal(money(0), 0);
});

test('money is stable — tidying an already-tidy value changes nothing', () => {
  for (const v of [0, 1, 99, 100.5, 25000.75, 1000000.4, 0.01]) {
    assert.equal(money(money(v)), money(v));
  }
});

test('a non-numeric or zero amount is rejected rather than saved', () => {
  // money() does not itself sanitise (it is used for balances elsewhere), so the guarantee lives
  // in the validator: a NaN or zero amount can never be written.
  assert.throws(() =>
    validatePaymentLinks(snapshot, { amount: Number('x'), tdsDeducted: 0, customerId: 'c1', invoiceId: 'inv1' })
  );
  assert.throws(() =>
    validatePaymentLinks(snapshot, { amount: 0, tdsDeducted: 0, customerId: 'c1', invoiceId: 'inv1' })
  );
});

/* ------------------------------------------- the decimal amount passes checks ---- */

const snapshot = {
  invoices: [{ id: 'inv1', customerId: 'c1', status: 'Issued', grandTotal: 1000.5, paidAmount: 0, balanceAmount: 1000.5 }],
  milestones: [],
  orders: [],
} as any;

test('a decimal amount equal to the invoice balance is accepted', () => {
  assert.doesNotThrow(() =>
    validatePaymentLinks(snapshot, {
      amount: money(1000.5),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

test('a part payment with paise is accepted', () => {
  assert.doesNotThrow(() =>
    validatePaymentLinks(snapshot, {
      amount: money(333.33),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

test('a genuine overpayment is still rejected', () => {
  assert.throws(() =>
    validatePaymentLinks(snapshot, {
      amount: money(1001),
      tdsDeducted: 0,
      customerId: 'c1',
      invoiceId: 'inv1',
    })
  );
});

/* --------------------------------------------- whole-rupee rounding is available ---- */

test('roundRupees is still available for callers that want whole rupees', () => {
  assert.equal(roundRupees(100.5), 101);
  assert.equal(roundRupees(100.4), 100);
  assert.equal(roundRupees('not a number'), 0);
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
