# Enact360 — fixed deployment package

## Vercel setup

1. Extract this ZIP and upload its contents to your Git repository. The root must contain `package.json`, `server.ts`, `api/index.ts`, `backend`, `src`, and `vercel.json`. Replace the old application files; remove old `api/index.js`, `api/[...path].js`, and `api/[...path].ts` if your repository still contains them.
2. In Vercel, choose Node 22.x, framework Vite, build command `npm run build`, and output directory `dist`.
3. In Vercel Settings → Environment Variables, import the included private `.env` file. It contains your Render **external** database URL with port 5432 and a generated `AUTH_SECRET`. Apply the values to Production. Uploading source to Git does not set Vercel environment variables. `.env` is ignored by Git and must not be committed.
4. Redeploy. Render must allow connections from your Vercel deployment. This package does not change Render networking or your existing hosted Vercel settings.
5. Open `/api/health`: expect JSON with `database: connected`. Sign in, then confirm `/api/state` returns saved application JSON. A 503 means database/configuration access failed; records are not silently saved to an in-memory fallback.

Keep one AUTH_SECRET value across deployments. Changing it invalidates existing sessions. Use a separate database for preview deployments if you enable previews.

## Login

For the bundled initial data, use username **admin** (or **admin@coreenact.com**) and password **password123**. If the existing PostgreSQL state has a changed password, that saved password takes precedence. Change the password from the profile card after deployment. New accounts use the password supplied by the administrator immediately; no first-login password-reset step is required. Passwords are stored as bcrypt hashes. Login requires server verification and uses an HttpOnly cookie with an eight-hour token expiry.

## Data and migration

The application uses one PostgreSQL database. Its authoritative application snapshot is stored in `crm_state_store`, row `app`; the server creates this table if needed. Existing rows in this table are preserved. If the row is absent, `backend/initial-store.json` seeds it using the data from your uploaded package. This seed file contains private business data and password hashes, and is server-only.

Legacy relational SQL tables are retained but are not a second source of application truth. Runtime table APIs and the SQL explorer use projections of the saved application snapshot. The explorer supports `SELECT * FROM table` and `SELECT COUNT(*) as cnt FROM table`; use psql for arbitrary database queries. Do not rerun the old destructive SQL/seed scripts against an existing database. An authenticated administrator can export the CRM snapshot through the database page as JSON. This export is not a complete PostgreSQL or payroll backup; use PostgreSQL backup tools for that purpose.

## Run locally

Use Node 22.12 or newer. Run `npm ci`, then `npm run dev`. The included `.env` connects to your Render database, so local changes use that database too. To serve production locally, run `npm run build`, then `npm start`. Run `npm run check` for TypeScript, regression tests, and the production frontend build.

## Other integrations

Only the PostgreSQL credentials were supplied. Outlook email/OAuth, Google Maps, and any other external provider need their own credentials and provider-side setup. Set the applicable keys from `.env.example` as server environment variables. This package cannot make those services functional using PostgreSQL credentials. Unconfigured email reports failure rather than claiming delivery.

## Verification and remaining live checks

TypeScript validation, the production build, and 33 automated checks passed. Tests cover linked financial records, separate document sequences, payroll calculations, sync conflicts/offline retries, concurrent database transactions, failed commits, deleted users, serverless HTTP routing, login, user creation, password changes, and basic access restrictions. Database connections in regression tests are simulated. Actual Render connectivity could not be confirmed from the editing environment because the database hostname could not be resolved. The hosted application has not been deployed or tested live.

After deploying, verify saving from two browser sessions, log out/in with a newly created user, change a password and retry the old/new passwords, and create representative sales, invoice/payment, support, and payroll records. These checks establish behavior in your actual hosting and provider environment; this package is not a guarantee that every possible business workflow is defect-free.
