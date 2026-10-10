# Deploy Enact360 to Vercel with Render PostgreSQL

1. Extract this ZIP. Upload the contents of the project folder to GitHub, including api/index.ts, backend/, server.ts, vercel.json, package.json and package-lock.json. Replace the old files rather than adding another api/index.js alongside api/index.ts. Remove any old api/index.js or api/[...path].ts from the repository. Do not upload node_modules or a .env file.
2. In Vercel, select the folder containing package.json as the Root Directory. Use framework Vite, build command npm run build, output directory dist, and Node 24 (or a compatible Node 22 release).
3. In Vercel Settings > Environment Variables, set DATABASE_URL to the full Render External Database URL. Its hostname must be dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com, database postgresqlcrm_go7i, username postgresqlcrm_go7i_user and port 5432. Copy the password from Render. The backend enables SSL. Do not use the short internal hostname on Vercel. Do not use a VITE_ prefix for this secret.
4. Set APP_URL=https://enact360.coreenact.com. Enable the variables for Production; use a separate database for Preview environments.
5. Redeploy after saving the environment variables. Existing deployments do not receive new values automatically.
6. Open https://enact360.coreenact.com/api/health. A successful response must show status healthy and database connected. This endpoint now performs real queries and no longer reports mock storage as connected.
7. Open https://enact360.coreenact.com/api/state. It must return JSON containing snapshot. A 503 indicates missing DATABASE_URL or a database connection/storage failure. A 404 or HTML response indicates routing or project-root configuration errors.
8. Test one edit, reload, and verify it from another browser before using live records.

The supplied screenshot already shows an inbound source of 0.0.0.0/0. The corrected package does not change Render or Vercel account settings. API routing is provided by vercel.json. Only one Vercel API entry point is present.

Persistence now serializes requests within an instance and uses a PostgreSQL transaction and advisory lock across instances. It creates enact360_application_state without deleting existing tables. If the new row is absent and crm_state_store has a saved app payload, that payload is imported once. Writes report success only after commit; failed commits return 503. Existing legacy SQL tables remain present, but the application JSON state is the authoritative CRM/payroll store. SQL Explorer can therefore differ from application state.

The database password is deliberately absent from source, .env.example and this document. Change the password shared in chat and update DATABASE_URL before deploying.

Validation: TypeScript check, regression tests and production build are run locally. Direct live Render connectivity could not be verified because the execution environment returned EAI_AGAIN for the Render hostname. No production deployment or live database mutation was performed.

This work addresses deployment, connection handling, transaction persistence and the discovered frontend crash. It is not a full audit of all ERP business workflows or authentication.
