# Enact360 CRM — migrate to PostgreSQL (normalized tables)

This package moves Enact360 off its single-JSON-blob storage and onto a proper
relational PostgreSQL schema, and wires the backend to read and write those
tables. Everything here has been run end-to-end against a real PostgreSQL 15.

---

## 1. Where your data lives today

The app keeps its authoritative CRM state in **one of three places**. Find out
which before you migrate:

| Source | Where | How to read it |
|---|---|---|
| **PostgreSQL** (production) | table `crm_state_store`, row `id='app'`, column `payload` (a JSON string) | `node extract-store.mjs` with `DATABASE_URL` set |
| **Local file** (dev) | `.crm_persisted_store.json` in the app root | `node extract-store.mjs --file ./.crm_persisted_store.json` |
| **Seed** (fallback) | `backend/initial-store.json` | `node extract-store.mjs --seed ./backend/initial-store.json` |

`extract-store.mjs` writes the current state to `snapshot.json` — the input for
the migration.

> If you are on the deployed Vercel + Render setup, your real data is almost
> certainly in **Postgres** (`crm_state_store`). Point `DATABASE_URL` at the
> Render database and run the extractor.

---

## 2. What the new schema is

`schema.sql` creates **69 tables** (idempotent — safe to re-run):

- **Core CRM** — `users`, `leads`, `opportunities`, `customers`, `sales_orders`,
  `purchase_orders`, `payment_milestones`, `invoices`, `payment_receipts`,
  `customer_ledger_entries`, `activities`, `notifications`, `audit_logs`,
  `amc_contracts`, `support_tickets`, `support_change_requests`.
- **Masters** — `states`, `tax_rates`, `payment_terms`, `products`, `license_types`.
- **Child tables** (one row per line/entry, keyed to the parent) — line items for
  orders / invoices / purchase orders, customer addresses, customer contacts,
  lead timeline events & linked contacts, opportunity remarks / tasks /
  attachments, support-ticket comments, user documents.
- **Permissions** — `role_permissions`, `payroll_role_permissions`.
- **Config & settings** — `company_profile`, `outlook_app_config`,
  `outlook_email_config`, `document_counters`, `app_settings`.
- **Payroll / ESS** — `payroll_masters`, `payroll_loans`, `payroll_attendance`,
  `payroll_leaves`, `payroll_claims`, `payroll_statutory`, `payroll_policy`,
  `payroll_integration_config`, `payroll_org_masters`, plus envelope tables for
  the large, still-evolving sub-modules (locations, regularization, shifts,
  assets, recruitment, onboarding, performance, training, payroll runs, …).

### Design decisions worth knowing

- **Ids are `TEXT`** — the app uses string ids (`lead-1`, `usr-1`).
- **Money and rates are `NUMERIC(18,4)`**; booleans are real `BOOLEAN`; dates are
  `DATE` and timestamps are `TIMESTAMPTZ`.
- **Datetimes are normalized to ISO-8601 (UTC).** Some fields in the app are
  stored as `"YYYY-MM-DD HH:MM"` (no timezone); these are parsed deterministically
  as UTC so the instant never shifts with the server's timezone.
- **Payroll sub-collections keep a full `data JSONB` copy** of each record
  alongside a few typed key columns. They are large and still changing; this is
  lossless and lets you query the common fields while the shape settles.
- **Two company records are preserved.** The app holds both a `company_setup`
  row and a `supplierCompany` profile (they can differ). They are stored as two
  rows in `company_profile` distinguished by a `source` column, and rebuilt
  exactly on load.

---

## 3. Migrate (one-time)

Requirements: **Node 22.x** and a reachable PostgreSQL, with `pg` installed
(it already is — it is a dependency of the app).

```bash
# 1. Back up first. Always.
pg_dump "$DATABASE_URL" -Fc -f enact360-backup-$(date +%F).dump

# 2. Pull the current state out of wherever it lives.
DATABASE_URL=postgres://... node extract-store.mjs          # -> snapshot.json

# 3. Dry-run: see planned row counts, write nothing.
DATABASE_URL=postgres://... node migrate.mjs snapshot.json --dry-run

# 4. Load it into the normalized tables.
DATABASE_URL=postgres://... node migrate.mjs snapshot.json
```

`migrate.mjs` applies `schema.sql`, then in **one transaction** truncates the
target tables and reloads every entity. It is idempotent — re-running it is
safe and produces the same result. On any error it rolls back completely.

Verify a few counts afterwards:

```sql
SELECT count(*) FROM leads;
SELECT lead_number, company_name, estimated_value FROM leads ORDER BY estimated_value DESC LIMIT 5;
SELECT invoice_number, grand_total, balance_amount FROM invoices;
```

---

## 4. Wire the runtime to the tables

So the app *reads and writes* the tables instead of the blob, add/replace three
files in the repository:

| Action | File | Notes |
|---|---|---|
| **replace** | `backend/postgresState.ts` | now hydrates/flushes the normalized tables instead of the JSON blob |
| **add** | `backend/relationalStore.ts` | the snapshot ⇄ tables mapping (read + write) |
| **add** | `backend/schema.ts` | the DDL bundled as a string (no file read at runtime) |

No other file changes. `server.ts` imports the middleware with the same
signature (`capture` / `restore` / `setWriter`), so the rest of the app — and the
`/api` contract — is untouched. The middleware keeps the exact same guarantees as
before: one transaction per request, a cross-instance advisory lock, and a
response sent only after the state has committed.

On the first request against a fresh (empty) relational store, the app's
in-memory seed (loaded from `backend/initial-store.json`) is written out, so a
brand-new database bootstraps itself.

`relationalStore.ts` also exposes `saveSnapshotToDb` / `loadSnapshotFromDb` if you
later want route-level code to read and write single tables directly.

### How writes work now — fine-grained, per row

A state-changing request no longer rewrites everything. The middleware captures
the database's state at the start of the request and the in-memory state at the
end, and `applyRowDiff` writes **only the rows that actually changed**:

- new rows are `INSERT`ed (upserted on their primary key),
- changed rows are `UPDATE`d,
- removed rows are `DELETE`d — including a deleted parent's child rows.

Untouched rows are never written, so row identity is preserved and rows that
exist only in the database (added by a report, a trigger, or another tool) are
**not** clobbered. There is no `TRUNCATE` on the hot path. All of it happens in
the request's single transaction under the same advisory lock, and a response is
still sent only after the state has committed.

`applyRowDiff(before, after)` and `syncSnapshotToDb(...)` are exported, and
`saveSnapshotToDb(...)` (the one-shot truncate + reload) remains available for
bulk loads.

### Trade-offs

- **Read cost.** Each request still reads ~40 small tables to hydrate the shared
  in-memory state the app is built around; only the *write* side is now
  fine-grained. Fine at CRM scale; add a short-lived cache in front if a single
  hot table ever matters.
- **Diff granularity** is per row, not per column — a changed row is rewritten in
  full. That is the right unit here and keeps the writer simple and safe.
- **Datetime normalization** (see above) — the only visible data change is
  format, not value.

---

## 5. Rollback

Nothing destructive happens to `crm_state_store` — the migration only creates new
tables and writes to them. To roll back the runtime, restore the original
`backend/postgresState.ts`; the blob is still there and still current. The new
tables can be dropped if you want:

```sql
-- only if you decide not to keep them
DROP TABLE IF EXISTS leads, customers, invoices, ... CASCADE;
```

---

## 6. Remove demo data (show only saved data + masters)

The app shipped with sample records in the client, the server seed, and the
browser cache. All three are cleaned so the screens show only data you actually
save, plus your master data. See **`remove-demo-data/DEMO_DATA.md`** for the
detail; in short:

- `src/data/*.ts` transactional `INITIAL_*` arrays emptied (masters kept),
- `backend/initial-store.json` transactional slices emptied, counters reset,
- `CrmContext.tsx` cache keys bumped so stale browser mock is dropped,
- `purge-demo-data.mjs` clears the demo rows already in your live database
  (both the normalized tables and the legacy blob), leaving masters intact.

```bash
DATABASE_URL=postgres://... node purge-demo-data.mjs            # preview
DATABASE_URL=postgres://... node purge-demo-data.mjs --confirm  # execute
```

---

## 7. Contents

```
schema.sql                     the full DDL (69 tables)
gen_schema.py                  regenerates schema.sql + backend/schema.ts
migrate.mjs                    one-way JSON snapshot -> PostgreSQL
extract-store.mjs              finds and exports the current state
purge-demo-data.mjs            clears demo rows from a live database
ensure-admin.mjs               guarantees a known admin login (upserts the admin)
backend/relationalStore.ts     snapshot <-> tables (read, write, row-diff)
backend/schema.ts              bundled DDL string
backend/postgresState.ts       runtime middleware (replaces the existing file)
remove-demo-data/              files + patch to strip demo data from the app
tests/                         the tests used to verify all of the above
```

## 8. Admin sign-in

The seed ships an administrator — **`admin` / `admin@coreenact.com`**, role Super
Admin, status Active — whose stored bcrypt hash is the built-in default password
`CoreEnact@2026#`. On a fresh install you can sign in with those credentials
immediately (the email is also a recognised admin identifier in the login screen).

Two things can change that on a live database: the admin password was changed in
the app, or `ADMIN_PASSWORD` is set to a different value. To guarantee a known
admin login, either:

- set `ADMIN_PASSWORD=CoreEnact@2026#` in the environment (Vercel → Settings →
  Environment Variables, and `.env`). The server accepts the configured
  `ADMIN_PASSWORD` for the admin account and re-writes the stored hash; or
- run the reset script, which upserts the admin into the `users` table **and** the
  legacy blob (and keeps the linked payroll master in step):

```bash
DATABASE_URL=postgres://... node ensure-admin.mjs                  # admin@coreenact.com / CoreEnact@2026#
DATABASE_URL=postgres://... node ensure-admin.mjs --dry-run        # preview
DATABASE_URL=postgres://... node ensure-admin.mjs --email you@x.com --password 'YourPass'
```

This deliberately does **not** reintroduce a hardcoded password fallback — that
was removed for security (it let anyone reading the repo authenticate as Super
Admin). The script writes a real bcrypt hash, exactly as changing the password in
the UI would.

---

## 9. Security note (from the repo's own START_HERE.md)

Earlier revisions of this project committed database dumps that contained real
customer PII and password hashes. If that has not already been actioned,
**rotate every account password** and confirm no `*.sql` dumps or runtime store
files remain in git history.
