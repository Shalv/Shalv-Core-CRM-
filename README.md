# Enact360 — Vercel deployment revision

Read START_HERE.md. This revision generates Vercel Build Output API v3 with one self-contained Node 22 function. It removes the old source API folder during the build, avoids missing relative imports/runtime dependencies, and catches initialization exceptions inside a request boundary.

The private `.env` contains the supplied PostgreSQL configuration and generated AUTH_SECRET. Set those two values in Vercel Production environment variables. Do not commit `.env` to Git.

Run `npm ci` and `npm run check` with Node 22.x. The build output is `.vercel/output`, not `dist`. Tests cover isolated function startup and controlled failure responses in addition to application regression checks.
