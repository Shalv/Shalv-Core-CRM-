# Verified changes

- One Vercel function entry, explicit TypeScript server import, and no duplicate catch-all API entry.
- Removed embedded PostgreSQL credentials from server source and the browser database screen. Credentials are in ignored server `.env` configuration. Removed Vite injection of a server Gemini key.
- Replaced silent database failures and detached writes with a PostgreSQL transaction for each API request. A cross-instance advisory lock plus in-process queue prevents shared-state requests from interleaving. A successful response is released only after commit; failed writes return 503 and restore prior state.
- Reused the existing `crm_state_store` row to preserve deployed snapshot data; the uploaded snapshot seeds an empty database. Runtime APIs project that authoritative state rather than reading independent stale relational records.
- Removed duplicate CRM autosave and startup uploads that could overwrite newer records with stale browser caches. Canonical three-way sync handles CRM writes. Server snapshots replace user lists, including deletions. Payroll caches refresh from saved data after authentication.
- Login always verifies credentials at the server. Added HttpOnly sessions, expiry, server session validation, authenticated API access, and administrator restrictions for accounts and database tools. Password changes verify the current password and the session identity.
- Removed public SQL downloads containing private data. Added an authenticated administrator JSON export. SQL explorer intentionally supports a limited read-only application projection query format.
- Added HTTP integration and storage transaction tests, generated a dependency lockfile, and documented required live checks and unconfigured external integrations.

Validation: TypeScript, production build, 33 tests pass. The live Render connection attempt failed during DNS resolution; no live database writes or deployment were performed. Tests simulate database transactions and do not certify provider availability. Fine-grained business permissions, every UI path, and external integrations still require acceptance testing in the deployed environment.

## Sign-in follow-up

The live /api/health endpoint returned HTTP 500 FUNCTION_INVOCATION_FAILED. This establishes a runtime crash but does not reveal its exception. This revision bundles the serverless backend into api/index.js, removes relative backend imports from the deployed entry, and displays API diagnostics on the login screen. Vercel Runtime Logs are still needed to identify any remaining deployed exception.

## Deployment revision 1.0.2

- Replaced root API file discovery with Vercel Build Output API v3: exactly one `api.func` backend and a separate static frontend.
- The build deletes old `api` source entries, preventing `index.js`/`index.ts` endpoint collisions in generated output.
- Bundled Express, PostgreSQL client, mail library, bcrypt, server code, and initial data into a CommonJS runtime file. No application-relative TypeScript/JSON imports or runtime node_modules are needed by the function. Optional pg-native and development-only Vite remain unused in serverless operation.
- Added a small guarded function entry; it sets serverless mode before loading application code and catches initialization exceptions. These return structured JSON 503 with an actionable log reference rather than an unhandled import exception.
- Added JSON handling for request-parser errors and unknown API endpoints.
- Added six tests against the actual generated deployment artifact in a temporary directory with no source or node_modules. They check Node 22 function configuration, missing configuration, PostgreSQL connection failure, malformed input, and missing application module.

Validation: 33 application regression checks and six generated-function tests pass. The generated-function tests also pass under Node 22.23.3. Production frontend/backend builds and TypeScript checks pass. These tests do not deploy to Vercel or verify the supplied live Render database. The specific live runtime exception has not been provided, so no guarantee is made about unknown hosting errors.

The rewrite-path test also passed under Node 22.23.3. A disposable local PostgreSQL integration attempt could not run because the environment disallows the required non-root process; no live Render data was modified.
