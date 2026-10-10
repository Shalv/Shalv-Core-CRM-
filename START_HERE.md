# Enact360 Vercel / Render connection fix

See DEPLOYMENT.md for the current deployment instructions, changes and validation limits.

Validation: TypeScript check, 29 regression tests and production build pass. Live Render connectivity was not verified; this environment could not resolve the external hostname.

Use npm ci, npm run build, and npm start for local production. For Vercel, deploy the full source folder with vercel.json and set DATABASE_URL in the Vercel environment.
