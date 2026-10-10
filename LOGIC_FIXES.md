# Application logic fixes

This update uses immutable record IDs and a single server-backed CRM transaction so connected records load and save together. Payroll changes use a durable ordered queue with conflict checks. New installations no longer seed example customers, invoices, payments, support records or claims; existing saved records are retained.

## Changes

- Employee login and salary masters match by exact user ID, employee code, username or email. Unknown logins cannot create employees or fabricate salary information. Authentication waits for saved CRM and payroll data.
- Salary calculations use entered salary components, calendar-month attendance, scoped leave and approved reimbursements. Zero salary remains zero. Claims require verification; submission does not approve them.
- Saved data loads before writes begin. Offline changes retain their baseline and retry after reconnection. Concurrent changes to different records merge; conflicting edits are shown for resolution rather than silently overwriting another session.
- Document numbers use persistent independent sequences. Tax invoices and proformas have separate sequences; IDs no longer depend on small random ranges.
- Customer, order, invoice, milestone and receipt links are checked together. Cross-customer allocation, invalid amounts, overpayment and deletion of referenced parents are rejected.
- Collections, TDS, milestone totals, order balances and customer ledger entries reconcile from receipts. Proforma conversion avoids duplicate collections. Historical opening collections are explicit.
- Milestone invoices preserve each product's tax rate, including mixed and zero-rate lines. Lead/opportunity conversion can create a customer and its order in the same action.
- Support invoices require an entered amount or actual logged hours at a configured contract rate. Change-request tax billing requires customer approval. Repeated invoice generation returns the existing active document.
- Email and external payroll requests report success only after a successful provider response. Microsoft connection requires a validated OAuth callback; missing configuration produces an error.
- File writes are atomic; persistence failures restore in-memory committed data. An unreadable existing store stops startup instead of silently replacing it. Legacy CRM write routes and SQL mutations cannot bypass the transaction's relationship checks.

## Run and verify

Use Node 22.12 or newer. Run `npm ci`, copy `.env.example` to `.env`, configure required providers, and run `npm run dev`. For production, run `npm run build`, then `NODE_ENV=production npm start`.

Application data is stored in `.crm_persisted_store.json` by default. Set `CRM_STORE_PATH` to a durable writable location and back it up before upgrading. Keep the existing store when replacing application code.

Checks completed: `npm run lint`, `npm test` (26 passing tests, including payroll checks), and `npm run build`. Coverage includes linked records, concurrent transactions, document numbers, tax allocation, employee identity, conflicting approvals, startup hydration, offline retry and integration failure responses. The build has a bundle-size warning; it completes successfully.

Existing ambiguous or broken references are shown to administrators in the data-integrity notice for review; they are not mapped to a guessed employee or customer. Live email, Microsoft OAuth and external payroll provider success paths require the deployment's actual credentials and were not exercised in this workspace. This is a source-code correction package, not a deployment.

## Saved-data connection follow-up

Development uses the Node tsx loader rather than the tsx CLI, avoiding its IPC startup failure. Preview and start now serve both the production frontend and API. Static HTML responses and incompatible state responses show explicit connection diagnoses without enabling unsafe writes. The full production server was exercised over HTTP: `/api/state` returned JSON with users, `/api/missing` returned JSON 404, and `/` returned the frontend.

## Vercel / Render connection correction

Added an explicit Vercel API function and API-first routing. On Vercel, saved state now requires PostgreSQL through `DATABASE_URL`; local file storage is never used. A shared transaction lock prevents two instances from overwriting each other's memory snapshots. Success responses wait for commits, while failed writes and rejected changes restore the prior state. Existing SQL tables remain intact. Regression checks use an injected database protocol test double and real HTTP requests to exercise cold instances, concurrent requests and rollback; a live Render connection cannot be verified without the deployment's environment configuration.
