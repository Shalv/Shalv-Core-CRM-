# Changelog — robustness, correctness & AI revision

This revision hardens the live CRM, fixes concrete money-path and security defects found in an
audit, and adds a provider-agnostic AI assistant. Every change is additive or a targeted fix; no
existing API contract, data shape or user flow was removed. Verified with `tsc --noEmit`, the full
test suite (70 tests, all passing) and a production build.

> **Action required after deploying:** every account password was previously exposed (see Security
> #5). Rotate the admin password and any employee passwords, and set `AUTH_SECRET` and
> `ADMIN_PASSWORD` in the environment.

---

## 1. Security

1. **Removed the hardcoded admin-password backdoor.** `server.ts` used to accept a fixed list of
   plaintext passwords (`Coreenact@321#`, `CoreEnact@2026#`, `Admin@123`, `admin`, `Shalv@123`, …)
   for any Super Admin / Administrator account and then overwrite the stored hash with the seed —
   silently resetting a real admin's password. Authentication now succeeds only against the
   account's stored bcrypt hash, an explicitly configured `ADMIN_PASSWORD`, or the one-time
   `BOOTSTRAP_ADMIN_PASSWORD` reset flow. (File: `server.ts`, `handleAuthLogin`.)
2. **Removed the non-serverless authentication bypass.** In any runtime other than Vercel/Lambda
   (Render, local `npm start`/`npm run dev`, Docker) an anonymous request was executed as the first
   user — the Super Admin — allowing anyone to read the full dataset and create admin accounts. The
   middleware now rejects requests without a valid signed session with HTTP 401 in every runtime.
   (File: `server.ts`, `/api` middleware.)
3. **Closed the client-side mirror of the backdoor.** `CrmContext.tsx` re-implemented the same
   password list in the offline login fallback and could grant a tokenless "success" or push an
   attacker-chosen admin password to the server. The hardcoded list and the session fabrication are
   gone; the offline fallback now matches only passwords actually stored on the local record.
4. **Extended administrator authorisation.** The payroll policy, org-master and loan write routes
   were reachable by any authenticated employee (a Sales Executive could overwrite company payroll
   configuration and delete other employees' loans). They now require an administrator, as does
   `/api/sync/push` when it carries those payloads. (File: `server.ts`.)
5. **Removed exposed secrets from the repository.** Committed database dumps (`enact360_crm_.sql`,
   `postgres_dump.sql`, `support_AMS.sql` — in the root and, served publicly, in `public/`) contained
   real customer names, GSTINs, emails and phone numbers. The runtime store
   `.crm_persisted_store.json` contained bcrypt password hashes. All were removed and added to
   `.gitignore`. Because the hashes were public, **rotate all account passwords.**
6. **Login throttling.** Added an in-memory throttle on the auth endpoints (failed attempts only,
   keyed by IP + identifier). Each serverless instance keeps its own window, so this is a speed bump
   rather than a hard guarantee, but the endpoints previously had no limit at all.
7. **Security headers.** Added `X-Content-Type-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`
   and (in production) `Strict-Transport-Security`. No strict CSP is set, because a wrong CSP would
   break the SPA's inline bundle.

## 2. Money-path correctness

1. **Zero-rated (0%) GST was coerced to 18%.** A bare `gstRate || 18` treats the legitimate number 0
   as "missing", so exempt/zero-rated supplies were taxed at 18% and the tax invoice contradicted
   itself. Replaced with a `resolveGstRate()` helper that only falls back when the value is not a
   usable number. Applied across `CrmContext.tsx`, `InvoicesView.tsx` and `PurchaseOrdersView.tsx`
   (including the rate input, which previously turned a typed `0` into `18`).
2. **Milestone invoices collapsed mixed-rate orders to one blended rate.** Proforma and tax
   milestone invoices used a single blended tax ratio labelled with the first product's rate. They
   now use the existing (previously unused) `milestoneInvoiceItems()` helper, which preserves each
   line's own rate and absorbs rounding into the last line — so mixed and zero-rate orders produce
   correct per-line GST.
3. **The GST register included Proforma and cancelled invoices.** The "GSTR-1 ready" register and
   its KPIs summed every invoice. They now include only statutory Tax invoices that are not
   cancelled, matching the ledger. (File: `ReportsView.tsx`.)
4. **`amountInWords` dropped the crore segment at ₹100 crore and above** (e.g. ₹100 crore printed as
   "Rupees Crore Only"). Rewritten with recursive Indian-numbering grouping, so any amount renders
   correctly, and paise rounding is fixed. (File: `numberToWords.ts`.)
5. **Place of supply was mis-derived on invoices.** Invoice creation compared the raw
   `billingAddress.stateCode` (undefined for some imported customers → wrongly inter-state, i.e.
   IGST instead of CGST+SGST) and several generators used `addresses[0]` rather than the Billing
   address. Both now resolve the Billing address and fall back to the state name, matching the sales
   order path. (Files: `InvoicesView.tsx`, `CrmContext.tsx`.)
6. **The payment validation guard was never called.** `validatePaymentLinks()` existed but was dead
   code, so an overpayment, cross-customer allocation or payment against a cancelled/converted
   invoice showed a false success and only failed later on the server. It is now called at the top of
   `recordPayment`, before any state changes.

## 3. AI assistant (new)

A provider-agnostic AI layer, off by default and enabled purely through environment variables — no
provider is baked into the code and no key is ever committed.

- **Module** `backend/ai.ts`: one small, dependency-free client for **Google Gemini**, any
  **OpenAI-compatible** endpoint (OpenAI, Azure, OpenRouter, local Ollama/vLLM) or **Anthropic**.
  Configure with `AI_PROVIDER`, `AI_API_KEY`, and optionally `AI_MODEL` / `AI_BASE_URL`. Requests
  have a timeout and return a clean error instead of throwing.
- **Endpoints** (authenticated; return HTTP 503 with a clear message when AI is not configured):
  - `GET /api/ai/status` — whether AI is enabled, and which model.
  - `POST /api/ai/assistant` — a chat assistant grounded in a compact, live business summary
    (billed/collected/outstanding/overdue, pipeline, milestone status). Customer names are included
    only for roles that already see the whole book of business.
  - `POST /api/ai/insights` — 3–5 actionable collections/pipeline/receivables insights from the same
    metrics.
  - `POST /api/ai/draft` — drafts a follow-up / payment-reminder / introduction email.
- **UI** `src/components/ai/AiAssistantPanel.tsx`: a floating assistant panel mounted in the app
  shell, with Assistant / Insights / Draft tabs. It shows a friendly "AI is turned off" note when no
  key is configured, so the app behaves exactly as before with AI disabled.

Enable it by setting, e.g.:

```
AI_PROVIDER=gemini
AI_API_KEY=<your key>
# AI_MODEL=gemini-2.0-flash        # optional
# AI_BASE_URL=                     # optional, for Azure/OpenRouter/self-hosted
```

## 4. Verification

- `npx tsc --noEmit` — clean.
- `npm test` — **70 tests passing** (62 pre-existing + 8 new AI tests covering request shaping,
  response parsing for all three providers, error handling, and the graceful "not configured"
  behaviour).
- `npm run build` — production build succeeds.

## 5. Found but deliberately not changed (recommended follow-ups)

These were identified in the audit but left alone because changing them could affect the running
production system; they are safe to schedule as a separate change with testing:

- **Session token also returned in the response body / stored in `localStorage`**, which defeats the
  HttpOnly cookie and widens XSS impact. Moving to cookie-only auth is a client + server change.
- **Logout does not invalidate the token server-side** (stateless tokens with no revocation list).
- **`AUTH_SECRET` defaults to a per-process random value** when unset in non-serverless runtimes,
  which logs everyone out on restart and breaks multi-instance consistency. Make it fail fast instead.
- **Document numbers are still generated client-side from record counts** with magic offsets, so a
  printed number can differ from the server-assigned one; the PO number hardcodes FY `26/03`.
- **Offline rebase resurrects records another user deleted** and retries with `force: true`, which
  bypasses the server's conflict detection.
- **`/api/health` reports the database as connected** using an in-memory mock and hardcodes the
  Render host/db name; it cannot detect a real database outage.
- **`backend/initial-store.json`** still contains seeded user records with password hashes; replace
  it with a sanitised seed once credentials are rotated.
