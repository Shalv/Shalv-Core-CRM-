# Remove demo data — show only saved data + masters

The app shipped with sample records in three places. All three are now handled so
that, going forward, the screens show only **data you actually save** plus your
**master data**.

## What is kept vs cleared

**Kept (masters / configuration):**
users, roles & permissions, states, tax rates, payment terms, products, license
types, customers, contacts, company profile (organization), payroll policy &
integration config, outlook config.

**Cleared (transactional / demo):**
leads, opportunities, sales orders, purchase orders, payment milestones,
invoices, payments, customer ledger entries, activities, notifications, audit
logs, AMC contracts, support tickets, change requests.

After this change a fresh install shows an empty pipeline / no invoices / no
tickets until you create them — with your masters already in place.

## The three places demo data lived, and what changed

| Place | File(s) | Change |
|---|---|---|
| **Client mock** | `src/data/leadsData.ts`, `src/data/initialData.ts`, `src/data/supportAmcData.ts` | the `INITIAL_*` transactional arrays are now `[]`; masters are untouched |
| **Server seed** | `backend/initial-store.json` | transactional `crmSlices` emptied; document counters for those entities reset to 0; masters kept |
| **Browser cache** | `src/context/CrmContext.tsx` | data-slice `localStorage` keys bumped `corecrm_v2_*` → `corecrm_v3_*` so stale cached mock is dropped (auth keys left on v2, so nobody is logged out) |

Also: the admin "Reset Demo Data" button in `src/components/layout/Navbar.tsx`
is relabelled to **"Reset CRM data (keeps masters)"** — it now clears
transactional data and keeps masters.

## Apply it

Two options:

1. **Drop-in files.** Replace these files in your repo with the copies under
   `remove-demo-data/`:
   - `src/data/leadsData.ts`
   - `src/data/initialData.ts`
   - `src/data/supportAmcData.ts`
   - `src/context/CrmContext.tsx`
   - `src/components/layout/Navbar.tsx`
   - `backend/initial-store.json`

2. **Patch.** Apply `remove-demo-data/demo-data-removal.patch` from the repo root
   (covers the five `src/` files):

   ```bash
   git apply remove-demo-data/demo-data-removal.patch
   ```

Then rebuild (`npm run build`) and redeploy.

## Clear the demo data already in your live database

The seed change only affects fresh installs. Your live database still holds the
demo rows, so run the purge script. It clears the transactional tables **and**
the legacy `crm_state_store` blob's transactional slices, and leaves masters
alone.

```bash
# always back up first
pg_dump "$DATABASE_URL" -Fc -f enact360-backup-$(date +%F).dump

# preview (deletes nothing)
DATABASE_URL=postgres://... node purge-demo-data.mjs

# execute
DATABASE_URL=postgres://... node purge-demo-data.mjs --confirm
```

Verify:

```sql
SELECT count(*) FROM leads;      -- 0
SELECT count(*) FROM invoices;   -- 0
SELECT count(*) FROM customers;  -- your master customers, intact
```

## Notes

- The demo `customers`, `contacts` and `products` are **kept** because they are
  master data (the Masters section). To clear those too, delete them from the
  Masters screens, or extend `TRANSACTIONAL_TABLES` / `TRANSACTIONAL_SLICES` in
  `purge-demo-data.mjs`.
- Sample **CSV import templates** (Masters → Data Import, and the leads "download
  sample CSV") are left in place — they are import aids, not records, and never
  appear in your data lists.
- `src/data/featured_leads.json` is unused by the app and can be ignored.
