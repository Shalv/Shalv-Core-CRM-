# Deploy this revision to Vercel

This package uses Vercel Build Output API v3. The build generates one Node 22 backend function with its dependencies bundled, plus the static frontend. There is no source `api/index.js` or `api/index.ts` in this revision. Do not copy those files from an older ZIP.

1. Replace your repository contents with this extracted package, including the new `vercel.json`, `package.json`, lockfile, `backend`, `scripts`, and `src`. The repository root must contain `package.json`. The build removes a legacy `api` folder automatically, but a clean replacement avoids obsolete files.
2. Keep `DATABASE_URL` and `AUTH_SECRET` set for Production in Vercel. Their exact values are in the private `.env` supplied in the ZIP. Import that file through Settings → Environment Variables if you have not already done so. Do not commit `.env` to Git.
3. Redeploy the new commit. `vercel.json` selects the custom build, Node 22, and `.vercel/output`; do not set the output directory to `dist` for this revision. The build log should say: `Vercel deployment output built: one bundled Node 22 function and static frontend.`
4. Visit `/api/health`. Connected storage should return JSON with `database: connected`. A JSON 503 points to missing environment variables or unavailable PostgreSQL. It does not mean data was saved in memory. Render must permit access from Vercel.
5. Sign in with `admin` or `admin@coreenact.com` using the password stored on the account. Hardcoded fallback passwords have been removed — only the account's stored bcrypt hash, or an explicitly configured `ADMIN_PASSWORD`, will authenticate. Set `ADMIN_PASSWORD` in `.env` to control the seeded default, and if you are locked out use the one-time `BOOTSTRAP_ADMIN_PASSWORD` reset flow at `/api/auth/admin-bootstrap`. The legacy default `password123` is disabled for all accounts. Password changes are made from the user profile card and saved as secure bcrypt hashes.

The function initializes inside a guarded request entry. Initialization exceptions return JSON with `BACKEND_INITIALIZATION_FAILED`, with the exception logged privately in Vercel Runtime Logs. Malformed JSON returns HTTP 400. Database failures return HTTP 503. These diagnostics make configuration failures visible; they do not simulate successful database access.

## Data

One PostgreSQL database stores the authoritative snapshot in `crm_state_store`, row `app`. An existing state row is preserved. An empty database is seeded from `backend/initial-store.json`, which contains the data from the uploaded package and is bundled privately into the backend. Runtime table APIs use projections of that snapshot. Do not run the old destructive SQL/seed scripts against an existing database.

The database page provides an authenticated administrator CRM JSON export. Use PostgreSQL backup tools for a full database/payroll backup.

## Local checks

Use Node 22.12 or newer within Node 22.x. Run `npm ci` and `npm run check`. Use `npm run dev` locally, or `npm run build` and `npm start` for local production mode. The private `.env` connects local development to the supplied Render database, so local modifications use that database too.

The ZIP includes a prebuilt `.vercel/output` for inspection. Git deployments regenerate it. If deploying with Vercel CLI, build in the linked project after setting the intended environment and use Vercel's prebuilt deployment workflow.

## Providers and limits

PostgreSQL credentials are configured in the private `.env`. Outlook, Google Maps, OAuth, and other provider integrations need their own credentials and provider setup. No deployment to your Vercel account is performed by creating this ZIP.

## Security hardening (this revision)

- Removed the hardcoded admin-password fallback list from both the server and the client. Only a stored bcrypt hash, the operator-set `ADMIN_PASSWORD`, or the one-time bootstrap key can authenticate.
- Removed the non-serverless authentication bypass that treated anonymous requests as the first (admin) user. Unauthenticated requests now return 401 in every runtime.
- Extended the administrator gate to the payroll policy, org-master and loan write routes and to `/api/sync/push` for those payloads.
- Added a login throttle (failed attempts only) and conservative security headers.
- Removed committed database dumps (`*.sql`) and the runtime store from the repository; both contained real customer PII and password hashes. **Rotate every account password** — the previously committed hashes were publicly exposed.

See CHANGELOG.md for the full change list and FIX_REPORT.md for prior verification. The generated function is tested independently of the source and node_modules, including failure cases. Actual Vercel/Render networking and acceptance testing remain necessary after deployment. Platform failures, unrelated repository contents, and unavailable providers cannot be guaranteed away by a ZIP.
