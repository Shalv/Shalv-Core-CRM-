# Enact360 consolidated ERP application

This package contains one application, one frontend, one API and one shared saved-state store for the existing modules.

| Area | Included modules |
| --- | --- |
| Sales | Leads, opportunities, customers, contacts, sales orders, activities |
| Billing and collections | Milestones, proforma and tax invoices, GST, receipts, TDS, customer ledger |
| Purchasing | Purchase orders and product masters |
| Employee operations | Employee creation and identity, salary structures, attendance, leave, reimbursements, employee loans, payroll and employee self service |
| Services | Support tickets, AMC contracts, change requests, service invoicing |
| Administration | Company setup, master data, role permissions, audit history, reports, provider configuration |

## Deploy this complete folder to Vercel

1. Use the folder containing `package.json`, `api/index.ts` and `vercel.json` as the Vercel project root.
2. Configure the Vercel Production environment variable `DATABASE_URL` with Render's TLS-enabled **External Database URL**. Keep credentials in environment variables.
3. Set `APP_URL` to `https://enact360.coreenact.com`.
4. Use the configured build command `npm run build` and output directory `dist`. Deploy the entire project, including `api`, `backend`, `src` and `server.ts`.
5. Confirm `/api/state` returns JSON. A 404 indicates missing API deployment/routing; a 503 indicates missing database configuration or inaccessible storage. Reconnect only after correcting the reported cause.

The API creates the additive `enact360_application_state` table. Saves are committed in PostgreSQL before the application reports success. Render must permit the connection, and the database account needs permission to create that table. Configure a separate database for preview deployments.

For Microsoft Outlook, configure the server's client ID, tenant ID and secret, and register `https://enact360.coreenact.com/auth/callback` as the web redirect URI. Authorization state and tokens are stored privately with application state; they are excluded from CRM/payroll data responses.

## Local use

Use Node 22.12 or newer. Run `npm ci`, then `npm run dev`. The prebuilt frontend is also included; `npm start` serves the production frontend and API. Run `npm run build` after source changes. Set `DATABASE_URL` locally if the local application should use PostgreSQL; otherwise local file persistence is available.

## Preserve existing records

Back up existing database records and retain browser caches and existing complete application stores. See README for migration before initializing the new state row. Unverified cached data does not unlock employee/salary editing before the authoritative state loads. Ambiguous legacy references are presented for review rather than remapped to guessed IDs.

## Validation

34 regression checks, TypeScript validation and the production frontend build pass. Tests cover identity and salary arithmetic, connected records, concurrent saves, offline retry, tax and receipt allocation, cold instances, failed commits, Vercel routing and OAuth persistence. Database protocol and Microsoft provider responses are simulated in the regression tests; actual Render and Microsoft access require the deployment's configured credentials.

Source integration: based on repository main commit `5a802a974a0ef7e2ac6e15a086ad0350bfb972a9`, retaining its UI and attendance changes while restoring durable PostgreSQL storage and correcting reviewed Outlook routing/persistence issues. This ZIP is the complete application package; deploying it is a separate step.
