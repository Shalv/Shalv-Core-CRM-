# Enact360 CRM / ERP

Complete corrected source package with Vercel frontend/API routing and a PostgreSQL-backed application snapshot. Start with **START_HERE.md** for deployment, credentials, migration behavior, and validation limits.

The private `.env` contains the database credentials supplied for this request and a generated server session secret. Import it into Vercel Environment Variables; do not commit it to Git. Provider credentials for email, OAuth, and maps must be supplied separately.

Run `npm ci` and `npm run check`. Tests use simulated database responses, not the live Render database.
