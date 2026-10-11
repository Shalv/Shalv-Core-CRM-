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
