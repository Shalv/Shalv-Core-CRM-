import initialStore from './backend/initial-store.json' with { type: 'json' };
import { postgresStateMiddleware } from './backend/postgresState.ts';
import { aiChat, aiConfig, isAiConfigured } from './backend/ai.ts';
import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  assignDocumentNumbers,
  auditSnapshot,
  isRemovedPredefinedUser,
  mergeSnapshots,
  reconcileSnapshot,
  same,
  type Snapshot,
} from './src/shared/integrity.ts';

dotenv.config({quiet:true});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_TOKEN_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

export function isBcryptHash(value: unknown): value is string {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

const initialSeedHashCache = new Map<string, string>();

export function hashPassword(rawPassword: string, useSeedCache = false): string {
  const trimmed = String(rawPassword || '').trim();
  if (!trimmed) return '';
  if (isBcryptHash(trimmed)) return trimmed;
  if (useSeedCache && initialSeedHashCache.has(trimmed)) {
    return initialSeedHashCache.get(trimmed)!;
  }
  const hashed = bcrypt.hashSync(trimmed, 8);
  if (useSeedCache) {
    initialSeedHashCache.set(trimmed, hashed);
  }
  return hashed;
}

export function verifyPasswordHash(plainPassword: string, storedHash?: string): boolean {
  const plain = String(plainPassword || '').trim();
  const hash = String(storedHash || '').trim();
  if (!plain || !hash) return false;
  if (isBcryptHash(hash)) {
    return bcrypt.compareSync(plain, hash);
  }
  return plain === hash;
}

export function issueAuthToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({id:String(userId),expires:Date.now()+8*60*60*1000}), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAuthToken(token?: string | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.replace(/^Bearer\s+/i, '').trim();
  const parts = trimmed.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed.expires > Date.now() && typeof parsed.id === 'string' ? parsed.id : null;
  } catch {
    return null;
  }
}

export function sanitizeUserForClient<T extends Record<string, any> | null | undefined>(user: T): T {
  if (!user || typeof user !== 'object') return user;
  const clone: Record<string, any> = { ...user };
  delete clone.password;
  delete clone.tempPassword;
  delete clone.temp_password;
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.mustChangePasswordOnFirstLogin;
  delete clone.mustChangePassword;
  delete clone.forcePasswordReset;
  delete clone.firstLogin;
  return clone as T;
}

export function sanitizePayrollMasterForClient<T extends Record<string, any> | null | undefined>(master: T): T {
  if (!master || typeof master !== 'object') return master;
  const clone: Record<string, any> = { ...master };
  delete clone.password;
  delete clone.tempPassword;
  delete clone.temp_password;
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.mustChangePasswordOnFirstLogin;
  delete clone.mustChangePassword;
  delete clone.forcePasswordReset;
  delete clone.firstLogin;
  return clone as T;
}

export function sanitizePayrollMastersMapForClient(map: Record<string, any> | null | undefined): Record<string, any> {
  if (!map || typeof map !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v && typeof v === 'object') {
      out[k] = sanitizePayrollMasterForClient(v);
    }
  }
  return out;
}

const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'CoreEnact@2026#';
const DEFAULT_SEED_PASSWORD_HASH = hashPassword(ADMIN_DEFAULT_PASSWORD, true);
const LEGACY_ADMIN_PASSWORD = 'Admin@CoreEnact2026';

// Fixed seed for the usr-1 Super Admin used by the BOOTSTRAP_ADMIN_PASSWORD reset path,
// so "CoreEnact@2026#" works again even when ADMIN_PASSWORD overrides the live default.
const LEGACY_SEED_PASSWORD = 'CoreEnact@2026#';
const LEGACY_SEED_PASSWORD_HASH = hashPassword(LEGACY_SEED_PASSWORD, true);
const isAdminBootstrapEnabled = () => Boolean((process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim());
// Hash the Super Admin account is pinned to: the recovery seed while a bootstrap override
// is configured, otherwise the live ADMIN_PASSWORD seed.
const adminSeedHash = () => (isAdminBootstrapEnabled() ? LEGACY_SEED_PASSWORD_HASH : DEFAULT_SEED_PASSWORD_HASH);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Honor X-Forwarded-* headers set by Vercel's proxy so req.protocol/req.get('host')
// resolve to the real custom-domain origin (https://enact360.coreenact.com)
// instead of http://localhost inside the serverless function.
app.set('trust proxy', 1);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ---------------------------------------------------------------------------
// Security headers. Deliberately a conservative set — no strict Content-Security-Policy,
// because the SPA ships a large inline bundle and a wrong CSP would break it. These are the
// cheap, high-value ones that reduce XSS/clickjacking/mime-sniffing exposure.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (process.env.NODE_ENV === 'production' || isServerlessRuntime()) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

// ---------------------------------------------------------------------------
// Lightweight in-memory login throttle for the auth endpoints. Each serverless instance keeps
// its own window, so this is a speed bump rather than a hard guarantee — but it stops a single
// instance being used to brute-force passwords, which previously had no limit at all. Only
// FAILED attempts count, so normal successful sign-ins are never throttled.
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAILURES = 40;
const loginFailures = new Map<string, { count: number; first: number }>();
function loginThrottleKey(req: Request) {
  const body: any = req.body || {};
  const id = String(body.identifier || body.username || body.email || '').trim().toLowerCase();
  const fwd = (req.headers as any)?.['x-forwarded-for'];
  const ip = String((Array.isArray(fwd) ? fwd[0] : fwd) || (req as any).ip || '').split(',')[0].trim();
  return `${ip}|${id}`;
}
function isLoginThrottled(req: Request): boolean {
  if (isTestMode()) return false;
  const rec = loginFailures.get(loginThrottleKey(req));
  if (!rec) return false;
  if (Date.now() - rec.first > LOGIN_WINDOW_MS) { loginFailures.delete(loginThrottleKey(req)); return false; }
  return rec.count >= LOGIN_MAX_FAILURES;
}
function noteLoginFailure(req: Request) {
  if (isTestMode()) return;
  const key = loginThrottleKey(req);
  const now = Date.now();
  const rec = loginFailures.get(key);
  if (!rec || now - rec.first > LOGIN_WINDOW_MS) loginFailures.set(key, { count: 1, first: now });
  else rec.count += 1;
}
function clearLoginFailures(req: Request) {
  if (isTestMode()) return;
  loginFailures.delete(loginThrottleKey(req));
}

// Database connection with in-memory mock fallback for AI Studio environment
const MOCK_TABLES: Record<string, any[]> = {
  users: [
    {
      id: 'usr-1',
      name: 'Admin',
      username: 'admin',
      email: 'admin@coreenact.com',
      passwordHash: DEFAULT_SEED_PASSWORD_HASH,
      role: 'Super Admin',
      status: 'Active',
      department: 'Executive',
      designation: 'Managing Director / Super Admin',
      accessScope: 'all',
    },
  ],
  payroll_masters: [],
  leads: [
    { id: 'lead-1', lead_number: 'LEAD-2026-00001', company_name: 'Taj computer Solutions Pvt Ltd', contact_person: 'Sawan Pathak', mobile: '+91 72909 96601', email: 'sawankumar@tajcomputersolutions.com', status: 'Won', estimated_value: 1700000, created_at: '2026-09-01T10:00:00Z' },
    { id: 'lead-2', lead_number: 'LEAD-2026-00002', company_name: 'incite Gravity Pvt Ltd', contact_person: 'Srikant Jena', mobile: '8290090611', email: 'srikant@incitegravity.com', status: 'Won', estimated_value: 295000, created_at: '2026-09-05T10:00:00Z' },
    { id: 'lead-3', lead_number: 'LEAD-2026-00003', company_name: 'Build Storys Pvt Ltd', contact_person: 'Shruthi', mobile: '97403 82382', email: 'shruthi@buildstorys.com', status: 'Won', estimated_value: 1800000, created_at: '2026-09-12T10:00:00Z' },
    { id: 'lead-4', lead_number: 'LEAD-2026-00004', company_name: 'Eduvrse Pvt ltd', contact_person: 'Eshant Sharma', mobile: '9999100186', email: 'eshant.sharma@eduvrse.com', status: 'Won', estimated_value: 1200000, created_at: '2026-09-18T10:00:00Z' },
    { id: 'lead-5', lead_number: 'LEAD-2026-00005', company_name: 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD', contact_person: 'Jiten', mobile: '9878681000', email: 'jitengoyal@rrgg.in', status: 'Won', estimated_value: 1650000, created_at: '2026-09-22T10:00:00Z' },
  ],
  customers: [
    { id: 1, customer_code: 'CUST-2026-001', company_name: 'Taj computer Solutions Pvt Ltd', contact_name: 'Sawan Pathak', email: 'sawankumar@tajcomputersolutions.com', phone: '+91 72909 96601', state: 'Delhi', gstin: '07AAACT2727Q1ZW', status: 'Active' },
    { id: 2, customer_code: 'CUST-2026-002', company_name: 'incite Gravity Pvt Ltd', contact_name: 'Srikant Jena', email: 'srikant@incitegravity.com', phone: '8290090611', state: 'Haryana', gstin: '06AABCI1234F1Z5', status: 'Active' },
    { id: 3, customer_code: 'CUST-2026-003', company_name: 'Build Storys Pvt Ltd', contact_name: 'Shruthi', email: 'shruthi@buildstorys.com', phone: '97403 82382', state: 'Karnataka', gstin: '29AABCB5678G1Z2', status: 'Active' },
  ],
  customer_contacts: [],
  products: [
    { id: 'prod-1', code: 'D365-BC-ESS', name: 'MS D365 Business Central Essential', type: 'Service', uom: 'License', hsn_sac: '997331', gst_rate: 18, cost_price: 6655, selling_price: 79860 },
    { id: 'prod-2', code: 'D365-BC-DEV', name: 'MS D365 Business Central Device', type: 'Service', uom: 'License', hsn_sac: '997331', gst_rate: 18, cost_price: 3780, selling_price: 45360 },
    { id: 'prod-3', code: 'D365-BC-TEAM', name: 'MS D365 Business Central Team Member', type: 'Service', uom: 'License', hsn_sac: '997331', gst_rate: 18, cost_price: 665, selling_price: 7980 },
    { id: 'prod-5', code: 'SRV-ERP-IMP', name: 'Enterprise ERP Implementation Service', type: 'Service', uom: 'Mandays', hsn_sac: '998313', gst_rate: 18, cost_price: 1200000, selling_price: 1500000 },
  ],
  finance_invoices: [
    { id: 1, invoice_no: 'INV/2026-27/001', invoice_type: 'Tax Invoice', customer_name: 'Taj computer Solutions Pvt Ltd', invoice_date: '2026-09-05', due_date: '2026-10-05', subtotal: 1440678, grand_total: 1700000, amount_paid: 1700000, status: 'Paid' },
    { id: 2, invoice_no: 'INV/2026-27/002', invoice_type: 'Tax Invoice', customer_name: 'incite Gravity Pvt Ltd', invoice_date: '2026-09-10', due_date: '2026-10-10', subtotal: 250000, grand_total: 295000, amount_paid: 150000, status: 'Partially Paid' },
  ],
  finance_invoice_items: [],
  finance_payments: [
    { id: 1, invoice_id: 1, payment_date: '2026-09-15', amount: 1700000, payment_stage: 'Full Payment', payment_mode: 'NEFT', reference_no: 'UTR9988776655' },
  ],
  sales_orders: [
    { id: 1, order_no: 'SO-2026-0001', order_date: '2026-09-02', customer_name: 'Taj computer Solutions Pvt Ltd', currency: 'INR', status: 'Completed', subtotal: 1440678, grand_total: 1700000 },
  ],
  opportunities: [
    { id: 1, opportunity_no: 'OPP-2026-0001', customer_id: 1, title: 'Taj Computer Solutions - D365 Renewal', stage: 'Closed Won', status: 'Won', probability: 100, estimated_deal_value: 1700000 },
  ],
  opportunity_payment_milestones: [
    { id: 1, customer_id: 1, milestone_name: '100% Advance on Order', percentage: 100, milestone_amount: 1700000, status: 'Paid' },
  ],
  activities: [
    { id: 1, customer_id: 1, type: 'Meeting', subject: 'Kickoff & License Provisioning', due_at: '2026-09-03', status: 'Completed', priority: 'High' },
  ],
  company_setup: [
    { id: 1, name: 'Coreenact Solutions', legal_name: 'Coreenact Solutions', gstin: '07FRWPS7255E1Z3', pan: 'FRWPS7255E', city: 'New Delhi', state: 'Delhi', state_code: '07', logo_url: '', bank_name: 'Bank of Baroda', bank_account_no: '71000200001745', bank_ifsc: 'BARB0VJOKHL', bank_branch: 'Okhla Phase-3, New Delhi' },
  ],
  outlook_app_config: [
    {
      id: 1,
      display_name: process.env.OUTLOOK_APP_DISPLAY_NAME || 'Enact360',
      client_id: process.env.OUTLOOK_CLIENT_ID || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
      object_id: process.env.OUTLOOK_OBJECT_ID || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
      tenant_id: process.env.OUTLOOK_TENANT_ID || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
      supported_account_types: 'My organization only',
      redirect_uris: '1 web, 0 spa, 0 public client',
      managed_application: 'Enact360',
      state: 'Activated',
      smtp_host: process.env.OUTLOOK_SMTP_HOST || 'smtp.office365.com',
      smtp_port: Number(process.env.OUTLOOK_SMTP_PORT || 587),
      updated_at: new Date().toISOString(),
    },
  ],
  audit_logs: [],
  email_notifications: [],
  payroll_loans: [],
  payroll_policy: [],
  payroll_org_masters: [],
  payroll_attendance: [],
  payroll_leaves: [],
  payroll_claims: [],
  payroll_statutory: [],
  purchase_orders: [],
  amc_contracts: [],
  support_tickets: [],
  change_requests: [],
  license_types: [],
  customer_ledger: [],
};

// Comprehensive backend state store for all CRM, Masters, Payroll & ESS slices
const PERSISTED_CRM_STATE: Record<string, any> = {
  stateInitialized: false,
  documentCounters: {},
  payrollMasters: {},
  deletedPayrollMasterIds: [],
  payrollLoans: [],
  deletedLoanIds: [],
  payrollPolicy: null,
  payrollOrgMasters: null,
  payrollAttendance: {},
  payrollLeaves: {},
  payrollClaims: {},
  payrollStatutory: {},
  payrollIntegrationConfig: null,
  // Real-time HR collections (Phase 2-4). Persisted with the rest of the durable state
  // so they are captured server-side and shared across users and devices.
  payrollLocations: [],
  payrollRegularization: [],
  payrollShifts: [],
  payrollShiftAssignments: [],
  payrollShiftSwaps: [],
  payrollHelpDesk: [],
  payrollRuns: [],
  payrollLifecycle: [],
  payrollAssets: [],
  payrollAssetCategories: [],
  payrollAssetAllocations: [],
  payrollJobOpenings: [],
  payrollCandidates: [],
  payrollOnboarding: [],
  payrollPerformance: [],
  payrollTrainingPrograms: [],
  payrollTrainingNominations: [],
  crmSlices: {},
};

const getPersistedStorePath = () =>
  process.env.CRM_STORE_PATH
    ? path.resolve(process.env.CRM_STORE_PATH)
    : path.resolve(__dirname, '.crm_persisted_store.json');

function resolveRecordPasswordHash(record: any, existingRecord?: any, fallbackRecord?: any): string {
  const explicitPlain =
    typeof record?.password === 'string' && record.password.trim()
      ? record.password.trim()
      : typeof record?.tempPassword === 'string' && record.tempPassword.trim()
      ? record.tempPassword.trim()
      : typeof record?.temp_password === 'string' && record.temp_password.trim()
      ? record.temp_password.trim()
      : '';
  if (explicitPlain) {
    return hashPassword(explicitPlain);
  }
  const explicitHash =
    typeof record?.passwordHash === 'string' && record.passwordHash.trim()
      ? record.passwordHash.trim()
      : typeof record?.password_hash === 'string' && record.password_hash.trim()
      ? record.password_hash.trim()
      : '';
  const prevHash =
    existingRecord?.passwordHash ||
    existingRecord?.password_hash ||
    existingRecord?.password ||
    existingRecord?.tempPassword ||
    fallbackRecord?.passwordHash ||
    fallbackRecord?.password_hash ||
    fallbackRecord?.password ||
    fallbackRecord?.tempPassword ||
    '';
  const isPrimaryAdmin =
    String(record?.id || existingRecord?.id || fallbackRecord?.id) === 'usr-1' ||
    String(record?.username || existingRecord?.username || fallbackRecord?.username) === 'admin' ||
    String(record?.email || existingRecord?.email || fallbackRecord?.email).toLowerCase() === 'admin@coreenact.com';

  if (isPrimaryAdmin) {
    // While the bootstrap override is configured, the Super Admin stays pinned to the
    // recovery seed. relinkUsersAndPayrollMasters re-resolves this hash on every save, so
    // without this pin a forced seed would be silently rewritten to ADMIN_DEFAULT_PASSWORD.
    if (isAdminBootstrapEnabled()) {
      return LEGACY_SEED_PASSWORD_HASH;
    }
    if (!prevHash && !explicitHash) {
      return DEFAULT_SEED_PASSWORD_HASH;
    }
    const checkHash = (h: any) => {
      if (!h) return false;
      const s = String(h);
      return (
        verifyPasswordHash('password123', s) ||
        verifyPasswordHash(LEGACY_ADMIN_PASSWORD, s) ||
        verifyPasswordHash('Coreenact@321#', s) ||
        verifyPasswordHash('Coreenact@2026#', s) ||
        verifyPasswordHash('CoreEnact@2026#', s) ||
        verifyPasswordHash(ADMIN_DEFAULT_PASSWORD, s)
      );
    };
    if (checkHash(prevHash) || checkHash(explicitHash) || !prevHash) {
      return DEFAULT_SEED_PASSWORD_HASH;
    }
  }

  if (explicitHash) {
    const normalizedExplicit = hashPassword(explicitHash);
    if (normalizedExplicit === DEFAULT_SEED_PASSWORD_HASH && prevHash) {
      const normalizedPrev = hashPassword(String(prevHash));
      if (normalizedPrev !== DEFAULT_SEED_PASSWORD_HASH) {
        return normalizedPrev;
      }
    }
    return normalizedExplicit;
  }
  if (prevHash) {
    return hashPassword(String(prevHash));
  }
  return isPrimaryAdmin ? DEFAULT_SEED_PASSWORD_HASH : '';
}

function stripPlaintextAndResetFlags(obj: Record<string, any>): Record<string, any> {
  const clean = { ...obj };
  delete clean.password;
  delete clean.tempPassword;
  delete clean.temp_password;
  delete clean.password_hash;
  delete clean.mustChangePasswordOnFirstLogin;
  delete clean.mustChangePassword;
  delete clean.forcePasswordReset;
  delete clean.firstLogin;
  return clean;
}

export function hasActiveCustomOverrides(obj: any): boolean {
  return Boolean(obj && typeof obj === 'object' && Object.keys(obj).length > 0);
}

export function resolveEffectiveCustomPermissions(primary: any, secondary?: any): any {
  if (primary && typeof primary === 'object') {
    if (primary.customPermissions !== undefined) {
      if (primary.customPermissions === null) return null;
      return hasActiveCustomOverrides(primary.customPermissions)
        ? primary.customPermissions
        : null;
    }
    if (primary.custom_permissions !== undefined) {
      if (primary.custom_permissions === null) return null;
      return hasActiveCustomOverrides(primary.custom_permissions)
        ? primary.custom_permissions
        : null;
    }
  }
  if (secondary && typeof secondary === 'object') {
    if (secondary.customPermissions !== undefined) {
      if (secondary.customPermissions === null) return null;
      return hasActiveCustomOverrides(secondary.customPermissions)
        ? secondary.customPermissions
        : null;
    }
    if (secondary.custom_permissions !== undefined) {
      if (secondary.custom_permissions === null) return null;
      return hasActiveCustomOverrides(secondary.custom_permissions)
        ? secondary.custom_permissions
        : null;
    }
  }
  return null;
}

function relinkUsersAndPayrollMasters() {
  // Deduplicate users across both crmSlices.users and MOCK_TABLES.users by ID first, then email, then username
  const usersById = new Map<string, any>();
  const idByEmail = new Map<string, string>();
  const idByUsername = new Map<string, string>();
  const sliceUsers = Array.isArray(PERSISTED_CRM_STATE.crmSlices?.users)
    ? PERSISTED_CRM_STATE.crmSlices.users
    : [];

  // 1. Process authoritative MOCK_TABLES.users first
  for (const u of MOCK_TABLES.users || []) {
    if (!u || !u.id || isRemovedPredefinedUser(u)) continue;
    const rawId = String(u.id);
    const emailLower = u.email ? String(u.email).trim().toLowerCase() : '';
    const canonicalId = rawId;
    const resolvedHash = resolveRecordPasswordHash(u);
    const effectivePerms = resolveEffectiveCustomPermissions(u);
    const cleanUser = stripPlaintextAndResetFlags({
      ...u,
      id: canonicalId,
      username: u.username || (emailLower ? emailLower.split('@')[0] : 'user'),
      passwordHash: resolvedHash,
      customPermissions: effectivePerms,
      custom_permissions: effectivePerms,
    });
    usersById.set(canonicalId, cleanUser);
    if (emailLower) idByEmail.set(emailLower, canonicalId);
    if (cleanUser.username) idByUsername.set(String(cleanUser.username).trim().toLowerCase(), canonicalId);
  }

  // 2. Next, merge any incoming edits from sliceUsers (user edits from frontend take precedence)
  for (const u of sliceUsers) {
    if (!u || !u.id || isRemovedPredefinedUser(u)) continue;
    const rawId = String(u.id);
    const emailLower = u.email ? String(u.email).trim().toLowerCase() : '';
    const usernameLower = u.username ? String(u.username).trim().toLowerCase() : '';
    const canonicalId = usersById.has(rawId)
      ? rawId
      : (emailLower && idByEmail.get(emailLower)) ||
        (usernameLower && idByUsername.get(usernameLower)) ||
        rawId;
    const prev = usersById.get(canonicalId);
    if (prev) {
      // Incoming user edits from sliceUsers take precedence over previous base record!
      const effectivePerms = resolveEffectiveCustomPermissions(u, prev);
      const merged = stripPlaintextAndResetFlags({
        ...prev,
        ...u,
        customPermissions: effectivePerms,
        custom_permissions: effectivePerms,
      });
      usersById.set(canonicalId, merged);
    } else {
      const resolvedHash = resolveRecordPasswordHash(u);
      const effectivePerms = resolveEffectiveCustomPermissions(u);
      const cleanUser = stripPlaintextAndResetFlags({
        ...u,
        id: canonicalId,
        username: u.username || (emailLower ? emailLower.split('@')[0] : 'user'),
        passwordHash: resolvedHash,
        customPermissions: effectivePerms,
        custom_permissions: effectivePerms,
      });
      usersById.set(canonicalId, cleanUser);
      if (emailLower) idByEmail.set(emailLower, canonicalId);
      if (cleanUser.username) idByUsername.set(String(cleanUser.username).trim().toLowerCase(), canonicalId);
    }
  }
  MOCK_TABLES.users = Array.from(usersById.values());

  // Re-link payroll masters: match user by ID first, then email, then username, and ensure every enrolled payroll employee has a corresponding user entry
  const rawMastersObj = PERSISTED_CRM_STATE.payrollMasters || {};
  const relinkedMasters: Record<string, any> = {};
  for (const m of Object.values(rawMastersObj) as any[]) {
    if (!m || !m.userId || isRemovedPredefinedUser({ id: m.userId, email: m.email })) continue;
    const mId = String(m.userId);
    const mEmail = m.email ? String(m.email).trim().toLowerCase() : '';
    const mUsername = m.username ? String(m.username).trim().toLowerCase() : '';
    const matchedUser =
      (MOCK_TABLES.users || []).find((u) => u && String(u.id) === mId) ||
      (mEmail
        ? (MOCK_TABLES.users || []).find(
            (u) => u && u.email && String(u.email).trim().toLowerCase() === mEmail
          )
        : undefined) ||
      (mUsername
        ? (MOCK_TABLES.users || []).find(
            (u) => u && u.username && String(u.username).trim().toLowerCase() === mUsername
          )
        : undefined);
    const targetId = matchedUser ? String(matchedUser.id) : mId;
    const resolvedHash = resolveRecordPasswordHash(m, relinkedMasters[targetId], matchedUser);
    const effectiveStatus =
      m.status === 'Inactive' || m.status === 'Active'
        ? m.status
        : m.employmentStatus === 'Inactive' || m.employmentStatus === 'Active'
        ? m.employmentStatus
        : matchedUser?.status === 'Inactive' || matchedUser?.status === 'Active'
        ? matchedUser.status
        : 'Active';
    relinkedMasters[targetId] = stripPlaintextAndResetFlags({
      ...relinkedMasters[targetId],
      ...m,
      userId: targetId,
      status: effectiveStatus,
      passwordHash: resolvedHash,
    });
    if (matchedUser) {
      const uIdx = (MOCK_TABLES.users || []).findIndex((u) => u && String(u.id) === targetId);
      if (uIdx >= 0) {
        const currU = MOCK_TABLES.users[uIdx];
        const syncedHash = resolveRecordPasswordHash(m, currU, relinkedMasters[targetId]);
        const extFields = [
          'name', 'phone', 'location', 'avatar', 'gender', 'dateOfBirth', 'bloodGroup', 'maritalStatus',
          'alternatePhone', 'personalEmail', 'currentAddress', 'permanentAddress', 'city', 'state', 'pinCode',
          'bankName', 'bankAccountNo', 'ifscCode', 'panNumber', 'uanNumber', 'pfAccountNo', 'taxRegime',
          'accountHolderName', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
          'highestQualification', 'institute', 'passingYear', 'documents'
        ];
        const mergedExt: Record<string, any> = {};
        for (const f of extFields) {
          if (m[f] !== undefined) mergedExt[f] = m[f];
          else if (currU && currU[f] !== undefined) mergedExt[f] = currU[f];
        }
        MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
          ...currU,
          ...mergedExt,
          passwordHash: syncedHash,
          empCode: m.empCode || currU?.empCode,
          status: m.status || currU?.status || 'Active',
          ...(m.accessType !== undefined
            ? {
                accessType: m.accessType,
                accessScope:
                  m.accessType === 'payroll_only'
                    ? 'payroll_only'
                    : currU?.accessScope === 'payroll_only'
                    ? 'all'
                    : currU?.accessScope || 'all',
              }
            : {}),
        });
        relinkedMasters[targetId] = {
          ...relinkedMasters[targetId],
          ...mergedExt,
        };
        if (Array.isArray(PERSISTED_CRM_STATE.crmSlices?.users)) {
          const sliceIdx = PERSISTED_CRM_STATE.crmSlices.users.findIndex(
            (su: any) => su && String(su.id) === targetId
          );
          if (sliceIdx >= 0) {
            PERSISTED_CRM_STATE.crmSlices.users[sliceIdx] = {
              ...PERSISTED_CRM_STATE.crmSlices.users[sliceIdx],
              empCode: m.empCode || PERSISTED_CRM_STATE.crmSlices.users[sliceIdx].empCode,
              ...(m.accessType !== undefined
                ? {
                    accessType: m.accessType,
                    accessScope:
                      m.accessType === 'payroll_only'
                        ? 'payroll_only'
                        : PERSISTED_CRM_STATE.crmSlices.users[sliceIdx].accessScope || 'all',
                  }
                : {}),
            };
          }
        }
        relinkedMasters[targetId].passwordHash = syncedHash;
      }
    } else if (effectiveStatus !== 'Inactive') {
      MOCK_TABLES.users.push(
        stripPlaintextAndResetFlags({
          id: targetId,
          name: m.name || 'Employee',
          username: m.username || (m.email ? String(m.email).split('@')[0] : m.empCode || 'employee'),
          email: m.email || '',
          passwordHash: resolvedHash,
          accessScope: m.accessType === 'payroll_only' ? 'payroll_only' : 'all',
          accessType: m.accessType || 'payroll_only',
          empCode: m.empCode,
          phone: m.phone || '',
          role: m.role || 'Sales Executive',
          department: m.department || 'Operations',
          designation: m.designation || m.role || 'Employee',
          status: effectiveStatus,
          location: m.location || 'Mumbai HQ',
          created_at: new Date().toISOString(),
        })
      );
    }
  }
  PERSISTED_CRM_STATE.payrollMasters = relinkedMasters;
  MOCK_TABLES.payroll_masters = Object.values(relinkedMasters);
  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
  }
}

function syncMockTablesFromState() {
  // Mirror payroll slices into MOCK_TABLES for SQL Explorer & /api/database/status visibility
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === 'object') {
    MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters).filter(Boolean);
  }
  if (Array.isArray(PERSISTED_CRM_STATE.payrollLoans)) {
    MOCK_TABLES.payroll_loans = PERSISTED_CRM_STATE.payrollLoans;
  }
  if (PERSISTED_CRM_STATE.payrollPolicy) {
    MOCK_TABLES.payroll_policy = [PERSISTED_CRM_STATE.payrollPolicy];
  }
  if (PERSISTED_CRM_STATE.payrollOrgMasters) {
    MOCK_TABLES.payroll_org_masters = [PERSISTED_CRM_STATE.payrollOrgMasters];
  }
  if (PERSISTED_CRM_STATE.payrollAttendance && typeof PERSISTED_CRM_STATE.payrollAttendance === 'object') {
    MOCK_TABLES.payroll_attendance = Object.entries(PERSISTED_CRM_STATE.payrollAttendance).map(
      ([empId, att]: [string, any]) => ({ employee_id: empId, ...(att || {}) })
    );
  }
  if (PERSISTED_CRM_STATE.payrollLeaves && typeof PERSISTED_CRM_STATE.payrollLeaves === 'object') {
    const allLeaves: any[] = [];
    for (const [empId, list] of Object.entries(PERSISTED_CRM_STATE.payrollLeaves)) {
      if (Array.isArray(list)) {
        for (const item of list) {
          allLeaves.push({ employee_id: empId, ...item });
        }
      }
    }
    MOCK_TABLES.payroll_leaves = allLeaves;
  }
  if (PERSISTED_CRM_STATE.payrollClaims && typeof PERSISTED_CRM_STATE.payrollClaims === 'object') {
    const allClaims: any[] = [];
    for (const [empId, list] of Object.entries(PERSISTED_CRM_STATE.payrollClaims)) {
      if (Array.isArray(list)) {
        for (const item of list) {
          allClaims.push({ employee_id: empId, ...item });
        }
      }
    }
    MOCK_TABLES.payroll_claims = allClaims;
  }
  if (PERSISTED_CRM_STATE.payrollStatutory && typeof PERSISTED_CRM_STATE.payrollStatutory === 'object') {
    MOCK_TABLES.payroll_statutory = Object.entries(PERSISTED_CRM_STATE.payrollStatutory).map(
      ([empId, stat]: [string, any]) => ({ employee_id: empId, ...(stat || {}) })
    );
  }

  // Mirror CRM slices into MOCK_TABLES so every entry added/updated in UI is reflected in backend tables
  const slices = PERSISTED_CRM_STATE.crmSlices || {};
  if (Array.isArray(slices.leads)) {
    MOCK_TABLES.leads = slices.leads.map((l: any) => ({
      id: l.id,
      lead_number: l.leadNumber || l.lead_number || l.id,
      company_name: l.companyName || l.company_name || '',
      contact_person: l.contactPerson || l.contact_person || '',
      mobile: l.mobile || l.phone || '',
      email: l.email || '',
      status: l.status || 'New',
      estimated_value: l.estimatedValue ?? l.estimated_value ?? 0,
      created_at: l.createdAt || l.leadDate || l.created_at || new Date().toISOString(),
      ...l,
    }));
  }
  if (Array.isArray(slices.customers)) {
    MOCK_TABLES.customers = slices.customers.map((c: any) => ({
      id: c.id,
      customer_code: c.customerCode || c.customer_code || c.id,
      company_name: c.name || c.companyName || c.company_name || '',
      contact_name: c.contactPerson || c.contact_name || '',
      email: c.email || '',
      phone: c.phone || c.mobile || '',
      state: c.state || '',
      gstin: c.gstin || '',
      status: c.status || 'Active',
      ...c,
    }));
  }
  if (Array.isArray(slices.contacts)) {
    MOCK_TABLES.customer_contacts = slices.contacts;
  }
  if (Array.isArray(slices.products)) {
    MOCK_TABLES.products = slices.products.map((p: any) => ({
      id: p.id,
      code: p.code || p.sku || p.id,
      name: p.name || '',
      type: p.type || p.category || 'Service',
      uom: p.uom || p.unit || 'License',
      hsn_sac: p.hsnSac || p.hsn_sac || '',
      gst_rate: p.gstRate ?? p.taxRate ?? p.gst_rate ?? 18,
      cost_price: p.costPrice ?? p.cost_price ?? 0,
      selling_price: p.sellingPrice ?? p.price ?? p.selling_price ?? 0,
      ...p,
    }));
  }
  if (Array.isArray(slices.invoices)) {
    MOCK_TABLES.finance_invoices = slices.invoices.map((inv: any) => ({
      id: inv.id,
      invoice_no: inv.invoiceNumber || inv.invoice_no || inv.id,
      invoice_type: inv.type || inv.invoice_type || 'Tax Invoice',
      customer_name: inv.customerName || inv.customer_name || '',
      invoice_date: inv.date || inv.invoiceDate || inv.invoice_date || '',
      due_date: inv.dueDate || inv.due_date || '',
      subtotal: inv.subtotal ?? 0,
      grand_total: inv.totalAmount ?? inv.grandTotal ?? inv.grand_total ?? 0,
      amount_paid: inv.paidAmount ?? inv.amount_paid ?? 0,
      status: inv.status || 'Draft',
      ...inv,
    }));
  }
  if (Array.isArray(slices.payments)) {
    MOCK_TABLES.finance_payments = slices.payments.map((pay: any) => ({
      id: pay.id,
      invoice_id: pay.invoiceId || pay.invoice_id || '',
      payment_date: pay.date || pay.paymentDate || pay.payment_date || '',
      amount: pay.amount ?? 0,
      payment_stage: pay.stage || pay.payment_stage || 'Payment',
      payment_mode: pay.mode || pay.paymentMode || pay.payment_mode || 'NEFT',
      reference_no: pay.referenceNumber || pay.reference_no || '',
      ...pay,
    }));
  }
  if (Array.isArray(slices.orders)) {
    MOCK_TABLES.sales_orders = slices.orders.map((ord: any) => ({
      id: ord.id,
      order_no: ord.orderNumber || ord.order_no || ord.id,
      order_date: ord.date || ord.orderDate || ord.order_date || '',
      customer_name: ord.customerName || ord.customer_name || '',
      currency: ord.currency || 'INR',
      status: ord.status || 'Confirmed',
      subtotal: ord.subtotal ?? 0,
      grand_total: ord.totalAmount ?? ord.grand_total ?? 0,
      ...ord,
    }));
  }
  if (Array.isArray(slices.opportunities)) {
    MOCK_TABLES.opportunities = slices.opportunities.map((opp: any) => ({
      id: opp.id,
      opportunity_no: opp.opportunityNumber || opp.opportunity_no || opp.id,
      customer_id: opp.customerId || opp.customer_id || '',
      title: opp.title || opp.companyName || '',
      stage: opp.stage || 'Qualification',
      status: opp.status || 'Open',
      probability: opp.probability ?? 50,
      estimated_deal_value: opp.value ?? opp.estimatedValue ?? opp.estimated_deal_value ?? 0,
      ...opp,
    }));
  }
  if (Array.isArray(slices.milestones)) {
    MOCK_TABLES.opportunity_payment_milestones = slices.milestones;
  }
  if (Array.isArray(slices.activities)) {
    MOCK_TABLES.activities = slices.activities;
  }
  if (Array.isArray(slices.purchaseOrders)) {
    MOCK_TABLES.purchase_orders = slices.purchaseOrders;
  }
  if (Array.isArray(slices.amcContracts)) {
    MOCK_TABLES.amc_contracts = slices.amcContracts;
  }
  if (Array.isArray(slices.supportTickets)) {
    MOCK_TABLES.support_tickets = slices.supportTickets;
  }
  if (Array.isArray(slices.changeRequests)) {
    MOCK_TABLES.change_requests = slices.changeRequests;
  }
  if (Array.isArray(slices.licenseTypes)) {
    MOCK_TABLES.license_types = slices.licenseTypes;
  }
  if (Array.isArray(slices.ledgerEntries)) {
    MOCK_TABLES.customer_ledger = slices.ledgerEntries;
  }
  if (Array.isArray(slices.auditLogs)) {
    MOCK_TABLES.audit_logs = slices.auditLogs;
  }
}

function applyParsedStore(parsed: any) {
  if (!parsed || typeof parsed !== 'object') return;
  {
      if (typeof parsed?.stateInitialized === 'boolean') {
        PERSISTED_CRM_STATE.stateInitialized = parsed.stateInitialized;
      }
      if (parsed?.documentCounters && typeof parsed.documentCounters === 'object') {
        PERSISTED_CRM_STATE.documentCounters = parsed.documentCounters;
      }
      if (Array.isArray(parsed?.users) && parsed.users.length > 0) {
        const merged = new Map<string, any>();
        for (const u of MOCK_TABLES.users) {
          if (u && u.id) merged.set(String(u.id), u);
        }
        for (const u of parsed.users) {
          if (u && u.id) merged.set(String(u.id), { ...merged.get(String(u.id)), ...u });
        }
        MOCK_TABLES.users = Array.from(merged.values());
      }
      if (Array.isArray(parsed?.payroll_masters)) {
        MOCK_TABLES.payroll_masters = parsed.payroll_masters;
        for (const m of parsed.payroll_masters) {
          if (m && m.userId) {
            PERSISTED_CRM_STATE.payrollMasters[m.userId] = m;
          }
        }
      }
      if (parsed?.payrollMasters && typeof parsed.payrollMasters === 'object') {
        PERSISTED_CRM_STATE.payrollMasters = {
          ...PERSISTED_CRM_STATE.payrollMasters,
          ...parsed.payrollMasters,
        };
      }
      if (Array.isArray(parsed?.deletedPayrollMasterIds)) {
        PERSISTED_CRM_STATE.deletedPayrollMasterIds = parsed.deletedPayrollMasterIds;
        for (const id of parsed.deletedPayrollMasterIds) {
          delete PERSISTED_CRM_STATE.payrollMasters[id];
        }
      }
      if (Array.isArray(parsed?.deletedLoanIds)) {
        PERSISTED_CRM_STATE.deletedLoanIds = parsed.deletedLoanIds;
      }
      if (Array.isArray(parsed?.payrollLoans)) {
        const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
        PERSISTED_CRM_STATE.payrollLoans = parsed.payrollLoans.filter(
          (l: any) => l && l.id && !delSet.has(l.id)
        );
      }
      if (parsed?.payrollPolicy) {
        PERSISTED_CRM_STATE.payrollPolicy = parsed.payrollPolicy;
      }
      if (parsed?.payrollOrgMasters) {
        PERSISTED_CRM_STATE.payrollOrgMasters = parsed.payrollOrgMasters;
      }
      if (parsed?.payrollAttendance && typeof parsed.payrollAttendance === 'object') {
        PERSISTED_CRM_STATE.payrollAttendance = parsed.payrollAttendance;
      }
      if (parsed?.payrollLeaves && typeof parsed.payrollLeaves === 'object') {
        PERSISTED_CRM_STATE.payrollLeaves = parsed.payrollLeaves;
      }
      if (parsed?.payrollClaims && typeof parsed.payrollClaims === 'object') {
        PERSISTED_CRM_STATE.payrollClaims = parsed.payrollClaims;
      }
      if (parsed?.payrollStatutory && typeof parsed.payrollStatutory === 'object') {
        PERSISTED_CRM_STATE.payrollStatutory = parsed.payrollStatutory;
      }
      if (parsed?.payrollIntegrationConfig) {
        PERSISTED_CRM_STATE.payrollIntegrationConfig = parsed.payrollIntegrationConfig;
      }
      if (parsed?.crmSlices && typeof parsed.crmSlices === 'object') {
        PERSISTED_CRM_STATE.crmSlices = parsed.crmSlices;
      }
      if (Array.isArray(parsed?.company_setup) && parsed.company_setup.length > 0) {
        MOCK_TABLES.company_setup = parsed.company_setup;
      }
      if (Array.isArray(parsed?.outlook_app_config) && parsed.outlook_app_config.length > 0) {
        MOCK_TABLES.outlook_app_config = parsed.outlook_app_config;
      }
      relinkUsersAndPayrollMasters();
      syncMockTablesFromState();
    }
}

function loadPersistedStore() {
  try {
    const storePath = getPersistedStorePath();
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf-8');
      applyParsedStore(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
}

function isPrimaryAdminRecord(u: any): boolean {
  const role = String(u?.role || '').trim().toLowerCase();
  return (
    String(u?.id) === 'usr-1' ||
    String(u?.userId || '') === 'usr-1' ||
    String(u?.username || '').toLowerCase() === 'admin' ||
    String(u?.email || '').toLowerCase() === 'admin@coreenact.com' ||
    role === 'super admin'
  );
}

function hasPlaintextAdminCredential(u: any): boolean {
  return Boolean(u && (u.password || u.tempPassword || u.temp_password));
}

// Forces the usr-1 Super Admin passwordHash back to LEGACY_SEED_PASSWORD_HASH (so
// "CoreEnact@2026#" works again) across the in-memory tables, the persisted CRM state,
// and the on-disk store. Runs at startup and from the admin-bootstrap route whenever
// BOOTSTRAP_ADMIN_PASSWORD is configured.
function forceAdminBootstrapSeed(source: 'startup' | 'request'): boolean {
  let changed = false;
  const adminIdx = MOCK_TABLES.users.findIndex((u) => isPrimaryAdminRecord(u));
  if (adminIdx >= 0) {
    const admin = MOCK_TABLES.users[adminIdx];
    if (!admin.passwordHash || !verifyPasswordHash(LEGACY_SEED_PASSWORD, String(admin.passwordHash))) {
      changed = true;
    }
    MOCK_TABLES.users[adminIdx] = stripPlaintextAndResetFlags({
      ...admin,
      id: admin.id || 'usr-1',
      passwordHash: LEGACY_SEED_PASSWORD_HASH,
    });
  } else {
    // No Super Admin row survived the persisted store: recreate the recovery target.
    changed = true;
    MOCK_TABLES.users.push(
      stripPlaintextAndResetFlags({
        id: 'usr-1',
        name: 'Admin',
        username: 'admin',
        email: 'admin@coreenact.com',
        passwordHash: LEGACY_SEED_PASSWORD_HASH,
        role: 'Super Admin',
        status: 'Active',
        department: 'Executive',
        designation: 'Managing Director / Super Admin',
        accessScope: 'all',
      })
    );
  }

  // Pin any already-linked payroll master and strip plaintext admin passwords cached there.
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === 'object') {
    for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters)) {
      if (!m || typeof m !== 'object') continue;
      if (isPrimaryAdminRecord(m) || k === 'usr-1' || hasPlaintextAdminCredential(m)) {
        PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
          ...m,
          passwordHash: LEGACY_SEED_PASSWORD_HASH,
        });
        changed = true;
      }
    }
  }

  const sliceUsers = Array.isArray(PERSISTED_CRM_STATE.crmSlices?.users)
    ? PERSISTED_CRM_STATE.crmSlices.users
    : null;
  if (sliceUsers) {
    for (let i = 0; i < sliceUsers.length; i++) {
      const su = sliceUsers[i];
      if (su && (isPrimaryAdminRecord(su) || hasPlaintextAdminCredential(su))) {
        sliceUsers[i] = stripPlaintextAndResetFlags({
          ...su,
          passwordHash: LEGACY_SEED_PASSWORD_HASH,
        });
        changed = true;
      }
    }
  }

  if (changed || source === 'request') savePersistedStore();
  return changed;
}

// Set whenever the in-memory store changes; the response hook below flushes it to
// Postgres before the HTTP response is finished (required on Vercel, where the
// filesystem is read-only/ephemeral and a function may freeze right after replying).

function isServerlessRuntime() {
  return (
    process.env.CRM_SERVERLESS === 'true' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
  );
}

function savePersistedStore() {
  transactionWriter?.();
  if (!isTestMode() && isServerlessRuntime()) return;
  try {
    relinkUsersAndPayrollMasters();
    syncMockTablesFromState();
    const storePath = getPersistedStorePath();
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        {
          stateInitialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
          documentCounters: PERSISTED_CRM_STATE.documentCounters || {},
          users: MOCK_TABLES.users,
          payroll_masters: MOCK_TABLES.payroll_masters,
          payrollMasters: PERSISTED_CRM_STATE.payrollMasters,
          deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
          payrollLoans: PERSISTED_CRM_STATE.payrollLoans,
          deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
          payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy,
          payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters,
          payrollAttendance: PERSISTED_CRM_STATE.payrollAttendance,
          payrollLeaves: PERSISTED_CRM_STATE.payrollLeaves,
          payrollClaims: PERSISTED_CRM_STATE.payrollClaims,
          payrollStatutory: PERSISTED_CRM_STATE.payrollStatutory,
          payrollIntegrationConfig: PERSISTED_CRM_STATE.payrollIntegrationConfig,
          crmSlices: PERSISTED_CRM_STATE.crmSlices,
          company_setup: MOCK_TABLES.company_setup,
          outlook_app_config: MOCK_TABLES.outlook_app_config,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // ignore
  }
}

if (isTestMode()) loadPersistedStore();
else {
  applyParsedStore(initialStore);
  loadPersistedStore();
}

function runMockQuery(sql: string, _params: any[] = []) {
  const normalized = sql.trim().replace(/\s+/g, ' ');
  const upper = normalized.toUpperCase();

  if (upper.includes('SELECT NOW()')) {
    return {
      rows: [{ current_time: new Date().toISOString(), db: 'postgresqlcrm_go7i', usr: 'postgresqlcrm_go7i_user' }],
      rowCount: 1,
      fields: [{ name: 'current_time', dataTypeID: 1184 }, { name: 'db', dataTypeID: 25 }, { name: 'usr', dataTypeID: 25 }],
    };
  }

  if (upper.includes('INFORMATION_SCHEMA.TABLES')) {
    const rows = Object.keys(MOCK_TABLES).sort().map((table_name) => ({ table_name }));
    return { rows, rowCount: rows.length, fields: [{ name: 'table_name', dataTypeID: 25 }] };
  }

  const countMatch = normalized.match(/SELECT\s+COUNT\(\*\)\s+as\s+cnt\s+FROM\s+"?([a-zA-Z0-9_]+)"?/i);
  if (countMatch) {
    const tbl = countMatch[1].toLowerCase();
    const cnt = MOCK_TABLES[tbl]?.length ?? 0;
    return { rows: [{ cnt: String(cnt) }], rowCount: 1, fields: [{ name: 'cnt', dataTypeID: 20 }] };
  }

  const selectMatch = normalized.match(/SELECT\s+\*\s+FROM\s+"?([a-zA-Z0-9_]+)"?/i);
  if (selectMatch) {
    const tbl = selectMatch[1].toLowerCase();
    const rawRows = MOCK_TABLES[tbl] ? [...MOCK_TABLES[tbl]] : [];
    const rows =
      tbl === 'users'
        ? rawRows.map((r) => sanitizeUserForClient(r))
        : tbl === 'payroll_masters'
        ? rawRows.map((r) => sanitizePayrollMasterForClient(r))
        : rawRows;
    const fields = rows.length > 0 ? Object.keys(rows[0]).map((name) => ({ name, dataTypeID: 25 })) : [];
    return { rows, rowCount: rows.length, fields };
  }

  return { rows: [], rowCount: 0, fields: [] };
}

function isTestMode() { return process.env.CRM_TEST_MODE === 'true'; }
const getEffectiveDatabaseUrl = () => {
  const raw = (process.env.DATABASE_URL || '').trim();
  if (!raw) return '';
  if (!isServerlessRuntime() && !raw.includes('/cloudsql/') && !raw.includes('127.0.0.1') && !raw.includes('localhost')) {
    return '';
  }
  return raw;
};
const livePool = getEffectiveDatabaseUrl() ? new Pool({
  connectionString: getEffectiveDatabaseUrl(),
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000,
}) : null;
livePool?.on('error', () => console.error('PostgreSQL connection unavailable'));
// Legacy table APIs project the authoritative PostgreSQL snapshot. They never
// use independently written relational tables or silently fall back after errors.
const db = {
  query: async (sql: string, params: any[] = []) => runMockQuery(sql, params),
  connect: async () => ({ query: async (sql: string, params: any[] = []) => runMockQuery(sql, params), release() {} }),
};
let transactionWriter: (() => void) | null = null;

// When BOOTSTRAP_ADMIN_PASSWORD is configured, force the Super Admin back to the seed
// hash even if .crm_persisted_store.json already holds a different hash. Runs after
// livePool so the relational users table is realigned too.
if (isAdminBootstrapEnabled()) {
  forceAdminBootstrapSeed('startup');
  if (livePool) {
    livePool
      .query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 OR username = $3 OR email = $4',
        [LEGACY_SEED_PASSWORD_HASH, 'usr-1', 'admin', 'admin@coreenact.com']
      )
      .catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Durable store: the whole CRM/Payroll store (incl. ESS payroll masters
// and admin-set passwords) is persisted as a single JSON blob in Postgres so it
// survives Vercel's ephemeral filesystem / cold starts. Falls back to the local
// JSON file only in isolated regression tests.
// ---------------------------------------------------------------------------
const STATE_TABLE = 'crm_state_store';
const isDatabaseActive = () => Boolean(getEffectiveDatabaseUrl());

function buildPersistedStoreObject() {
  relinkUsersAndPayrollMasters();
  syncMockTablesFromState();
  return {
    stateInitialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
    documentCounters: PERSISTED_CRM_STATE.documentCounters || {},
    users: MOCK_TABLES.users,
    payroll_masters: MOCK_TABLES.payroll_masters,
    payrollMasters: PERSISTED_CRM_STATE.payrollMasters,
    deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
    payrollLoans: PERSISTED_CRM_STATE.payrollLoans,
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
    payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy,
    payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters,
    payrollAttendance: PERSISTED_CRM_STATE.payrollAttendance,
    payrollLeaves: PERSISTED_CRM_STATE.payrollLeaves,
    payrollClaims: PERSISTED_CRM_STATE.payrollClaims,
    payrollStatutory: PERSISTED_CRM_STATE.payrollStatutory,
    payrollIntegrationConfig: PERSISTED_CRM_STATE.payrollIntegrationConfig,
    payrollLocations: PERSISTED_CRM_STATE.payrollLocations || [],
    payrollRegularization: PERSISTED_CRM_STATE.payrollRegularization || [],
    payrollShifts: PERSISTED_CRM_STATE.payrollShifts || [],
    payrollShiftAssignments: PERSISTED_CRM_STATE.payrollShiftAssignments || [],
    payrollShiftSwaps: PERSISTED_CRM_STATE.payrollShiftSwaps || [],
    payrollHelpDesk: PERSISTED_CRM_STATE.payrollHelpDesk || [],
    payrollRuns: PERSISTED_CRM_STATE.payrollRuns || [],
    payrollLifecycle: PERSISTED_CRM_STATE.payrollLifecycle || [],
    payrollAssets: PERSISTED_CRM_STATE.payrollAssets || [],
    payrollAssetCategories: PERSISTED_CRM_STATE.payrollAssetCategories || [],
    payrollAssetAllocations: PERSISTED_CRM_STATE.payrollAssetAllocations || [],
    payrollJobOpenings: PERSISTED_CRM_STATE.payrollJobOpenings || [],
    payrollCandidates: PERSISTED_CRM_STATE.payrollCandidates || [],
    payrollOnboarding: PERSISTED_CRM_STATE.payrollOnboarding || [],
    payrollPerformance: PERSISTED_CRM_STATE.payrollPerformance || [],
    payrollTrainingPrograms: PERSISTED_CRM_STATE.payrollTrainingPrograms || [],
    payrollTrainingNominations: PERSISTED_CRM_STATE.payrollTrainingNominations || [],
    crmSlices: PERSISTED_CRM_STATE.crmSlices,
    company_setup: MOCK_TABLES.company_setup,
    outlook_app_config: MOCK_TABLES.outlook_app_config,
    updatedAt: new Date().toISOString(),
  };
}

async function flushStateToDatabase() {
  // The HTTP transaction owns persistence; explicit legacy flush calls only mark it.
  transactionWriter?.();
}

async function hydrateStoreFromDatabase() { return true; }

// Serialize shared legacy state and reload it under a cross-instance database lock.
app.use('/api', (req, res, next) => {
  if (isTestMode()) return next();
  if (!livePool || !process.env.AUTH_SECRET) {
    if (isServerlessRuntime()) {
      return res.status(503).json({success:false, message:'Configure DATABASE_URL and AUTH_SECRET on the server.'});
    }
    return next();
  }
  return durableMiddleware!(req, res, next);
});
const durableMiddleware = livePool ? postgresStateMiddleware(livePool, {
  capture: buildPersistedStoreObject,
  restore: (value) => {
    for (const key of Object.keys(PERSISTED_CRM_STATE)) delete PERSISTED_CRM_STATE[key];
    Object.assign(PERSISTED_CRM_STATE, {
      payrollMasters: {}, deletedPayrollMasterIds: [], deletedLoanIds: [],
      payrollLoans: [], crmSlices: {},
      payrollLocations: [], payrollRegularization: [], payrollShifts: [],
      payrollShiftAssignments: [], payrollShiftSwaps: [], payrollHelpDesk: [],
      payrollRuns: [], payrollLifecycle: [], payrollAssets: [],
      payrollAssetCategories: [], payrollAssetAllocations: [],
      payrollJobOpenings: [], payrollCandidates: [], payrollOnboarding: [],
      payrollPerformance: [], payrollTrainingPrograms: [], payrollTrainingNominations: [],
      ...value,
    });
    MOCK_TABLES.users = value.users || [];
    if (Array.isArray(MOCK_TABLES.users)) {
      for (const u of MOCK_TABLES.users) {
        if (u && (String(u.id) === 'usr-1' || String(u.username).toLowerCase() === 'admin' || String(u.email).toLowerCase() === 'admin@coreenact.com')) {
          if (!u.passwordHash || verifyPasswordHash('password123', u.passwordHash) || verifyPasswordHash(LEGACY_ADMIN_PASSWORD, u.passwordHash)) {
            u.passwordHash = DEFAULT_SEED_PASSWORD_HASH;
          }
        }
      }
    }
    if (PERSISTED_CRM_STATE.payrollMasters?.['usr-1']) {
      const pm = PERSISTED_CRM_STATE.payrollMasters['usr-1'];
      if (!pm.passwordHash || verifyPasswordHash('password123', pm.passwordHash) || verifyPasswordHash(LEGACY_ADMIN_PASSWORD, pm.passwordHash)) {
        pm.passwordHash = DEFAULT_SEED_PASSWORD_HASH;
      }
    }
    if (isAdminBootstrapEnabled()) forceAdminBootstrapSeed('startup');
    applyParsedStore(value);
  },
  setWriter: writer => { transactionWriter = writer; },
}) : null;

const pool = db;
export { app, db };
export default app;

// Helper: safe query
async function query(sql: string, params: any[] = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const duration = Date.now() - start;
  return { ...res, duration };
}

// ============================================================================
// Database & Health APIs
// ============================================================================

function sessionToken(req: Request) {
  return req.headers?.authorization || req.headers?.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('crm_session='))?.slice(12);
}
app.use('/api', (req, res, next) => {
  // /auth/admin-bootstrap is excluded on purpose: it is the lockout recovery path, so it must
  // stay reachable without a session and is gated solely by the BOOTSTRAP_ADMIN_PASSWORD key.
  if (
    isTestMode() ||
    ['/health','/auth/login','/auth/verify','/auth/logout','/auth/admin-bootstrap'].includes(req.path)
  )
    return next();
  const id = verifyAuthToken(sessionToken(req));
  let account = MOCK_TABLES.users.find(u => String(u.id) === id);
  if (!account && id === 'usr-1') {
    account = { id: 'usr-1', name: 'Admin', username: 'admin', email: 'admin@coreenact.com', passwordHash: DEFAULT_SEED_PASSWORD_HASH, role: 'Super Admin', status: 'Active' };
  }
  // SECURITY: there is deliberately no anonymous fallback here. A request without a valid,
  // signed session is rejected in every runtime. Previously a non-serverless runtime (Render,
  // local `npm start`/`npm run dev`, Docker) executed anonymous requests as the first user
  // (the Super Admin), which was a complete authentication bypass.
  if (!account || String(account.status).toLowerCase() === 'inactive') return res.status(401).json({success:false,message:'Please sign in again.'});
  (req as any).account = account;
  const admin = ['Super Admin','Administrator'].includes(account.role);
  const pathIsDatabase = req.path.startsWith('/database');
  const pathIsAdminWrite =
    req.path.startsWith('/users') ||
    req.path === '/notifications/email-config' ||
    req.path.startsWith('/payroll/masters') ||
    req.path.startsWith('/payroll/policy') ||
    req.path.startsWith('/payroll/org-masters') ||
    req.path.startsWith('/payroll/loans');
  if ((pathIsDatabase || (pathIsAdminWrite && req.method !== 'GET')) && !admin) return res.status(403).json({success:false,message:'Administrator permission required.'});
  if (isServerlessRuntime() && req.method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.get('host')) return res.status(403).json({success:false,message:'Request origin is not allowed.'});
  next();
});
app.get('/api/auth/session', (req,res) => res.json({success:true,user:sanitizeUserForClient((req as any).account)}));
app.get('/api/database/export', (_req,res) => {
  res.type('application/json').attachment('enact360-data.json').send(JSON.stringify(getCurrentSnapshot(),null,2));
});
app.post('/api/auth/logout', (_req, res) => {res.clearCookie('crm_session',{path:'/'});res.json({success:true});});

// 1. Health check & live database stats
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const activePool = livePool || db;
    const start = Date.now();
    const dbRes = await activePool.query('SELECT NOW() as current_time, current_database() as db, current_user as usr;');
    const latency = Date.now() - start;

    const tablesRes = await activePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    res.json({
      status: 'healthy',
      database: 'connected',
      target: 'Render PostgreSQL',
      host: 'dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com',
      databaseName: dbRes.rows[0]?.db || 'postgresqlcrm_go7i',
      databaseUser: dbRes.rows[0]?.usr || 'postgresqlcrm_go7i_user',
      serverTime: dbRes.rows[0]?.current_time,
      latencyMs: latency,
      tableCount: tablesRes.rows.length,
      tables: tablesRes.rows.map((r: any) => r.table_name),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message || 'Failed to connect to database',
    });
  }
});

// 2. Database status & table row counts
app.get('/api/database/status', async (_req: Request, res: Response) => {
  try {
    const activePool = livePool || db;
    const tablesRes = await activePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableStats = await Promise.all(
      tablesRes.rows.map(async (row: any) => {
        try {
          const countRes = await activePool.query(`SELECT COUNT(*) as cnt FROM "${row.table_name}"`);
          return {
            tableName: row.table_name,
            rowCount: parseInt(countRes.rows[0]?.cnt || '0', 10),
          };
        } catch {
          return { tableName: row.table_name, rowCount: 0 };
        }
      })
    );

    res.json({
      connected: true,
      database: 'postgresqlcrm_go7i',
      host: 'dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com',
      tables: tableStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Raw SQL Query runner (for PostgresDatabaseView)
app.post('/api/database/query', async (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL string is required' });
  }

  const stripped = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  const statements = stripped
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  if (statements.length !== 1) {
    return res.status(400).json({
      success: false,
      error: 'Only a single read-only SQL statement is allowed.',
    });
  }

  const singleStmt = statements[0];
  if (
    !/^(SELECT|WITH|SHOW|EXPLAIN)\b/i.test(singleStmt) ||
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|COPY)\b/i.test(singleStmt)
  ) {
    return res.status(400).json({
      success: false,
      error: 'SQL mutations are not allowed; use application APIs so relationship integrity is enforced.',
    });
  }

  try {
    if (!/^SELECT\s+\*\s+FROM\s+"?[a-z_]+"?\s*;?$/i.test(sql.trim()) && !/^SELECT\s+COUNT\(\*\)\s+as\s+cnt\s+FROM\s+"?[a-z_]+"?\s*;?$/i.test(sql.trim())) {
      return res.status(400).json({success:false,error:'Explorer supports SELECT * FROM table and SELECT COUNT(*) as cnt FROM table for application projections. Use psql for other database queries.'});
    }
    const result = await query(sql);
    res.json({
      success: true,
      rowCount: result.rowCount,
      durationMs: result.duration,
      fields: result.fields?.map((f: any) => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
      rows: result.rows,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

function getCurrentSnapshot(): Snapshot {
  relinkUsersAndPayrollMasters();
  const slices = PERSISTED_CRM_STATE.crmSlices || {};
  const rawSnapshot: Snapshot = {
    customers: Array.isArray(slices.customers) ? slices.customers : [],
    contacts: Array.isArray(slices.contacts) ? slices.contacts : [],
    leads: Array.isArray(slices.leads) ? slices.leads : [],
    opportunities: Array.isArray(slices.opportunities) ? slices.opportunities : [],
    orders: Array.isArray(slices.orders) ? slices.orders : [],
    milestones: Array.isArray(slices.milestones) ? slices.milestones : [],
    invoices: Array.isArray(slices.invoices) ? slices.invoices : [],
    payments: Array.isArray(slices.payments) ? slices.payments : [],
    purchaseOrders: Array.isArray(slices.purchaseOrders) ? slices.purchaseOrders : [],
    products: Array.isArray(slices.products) ? slices.products : [],
    taxRates: Array.isArray(slices.taxRates) ? slices.taxRates : [],
    states: Array.isArray(slices.states) ? slices.states : [],
    paymentTerms: Array.isArray(slices.paymentTerms) ? slices.paymentTerms : [],
    milestoneTemplates: Array.isArray(slices.milestoneTemplates) ? slices.milestoneTemplates : [],
    activities: Array.isArray(slices.activities) ? slices.activities : [],
    auditLogs: Array.isArray(slices.auditLogs) ? slices.auditLogs : [],
    notifications: Array.isArray(slices.notifications) ? slices.notifications : [],
    supportTickets: Array.isArray(slices.supportTickets) ? slices.supportTickets : [],
    amcContracts: Array.isArray(slices.amcContracts) ? slices.amcContracts : [],
    changeRequests: Array.isArray(slices.changeRequests) ? slices.changeRequests : [],
    licenseTypes: Array.isArray(slices.licenseTypes) ? slices.licenseTypes : [],
    ledgerEntries: Array.isArray(slices.ledgerEntries) ? slices.ledgerEntries : [],
    ...slices,
    users: (Array.isArray(MOCK_TABLES.users) ? MOCK_TABLES.users : []).filter(Boolean).map(sanitizeUserForClient),
  };
  return reconcileSnapshot(rawSnapshot);
}

function findAccountByIdentifier(rawIdentifier: string): { user: any | null; master: any | null } {
  const identifier = String(rawIdentifier || '').trim().toLowerCase();
  if (!identifier) return { user: null, master: null };
  const norm = (v: any) => String(v ?? '').trim().toLowerCase();
  const normCode = (v: string) => {
    const trimmed = String(v ?? '').trim();
    const m = trimmed.match(/^(?:emp[-_\s]*)?(\d+)$/i);
    return m ? `emp-${m[1].padStart(3, '0')}` : trimmed.toLowerCase();
  };
  const wantedCode = normCode(identifier);
  const cleanDigits = identifier.replace(/\D/g, '');

  const users: any[] = MOCK_TABLES.users || [];
  const masters: any[] = [
    ...Object.values(PERSISTED_CRM_STATE.payrollMasters || {}),
    ...(MOCK_TABLES.payroll_masters || []),
  ].filter(Boolean);

  const superAdminAliases = new Set([
    'shalv@coreenact.com',
    'shalv.sharma@coreenact.com',
    'shalvsharma89@gmail.com',
    'shalvpersonal@gmail.com',
    'info@coreenact.com',
    'infor@coreenact.com',
    'admin@coreenact.com',
    'coreenactsolutions@gmail.com',
    'coreenactsolutions',
    'coreenact',
    'admin@coreenactsolutions.com',
    'shalv',
    'shalv sharma',
    'admin',
    'superadmin',
    'administrator',
  ]);

  let user: any = null;
  let master: any = null;

  if (superAdminAliases.has(identifier)) {
    user =
      users.find((u) => String(u.id) === 'usr-1' || norm(u.username) === 'admin' || u.role === 'Super Admin') ||
      null;
    if (!user) {
      user = {
        id: 'usr-1',
        name: 'Admin',
        username: 'admin',
        email: 'admin@coreenact.com',
        passwordHash: adminSeedHash(),
        role: 'Super Admin',
        status: 'Active',
      };
    }
  }

  if (!user) {
    master =
      masters.find((m) => norm(m.email) === identifier) ||
      masters.find((m) => m.username && norm(m.username) === identifier) ||
      masters.find((m) => m.empCode && (norm(m.empCode) === identifier || normCode(String(m.empCode)) === wantedCode)) ||
      masters.find((m) => norm(m.userId) === identifier) ||
      masters.find((m) => norm(m.name) === identifier) ||
      masters.find((m) => m.email && norm(m.email).split('@')[0] === identifier) ||
      (cleanDigits.length >= 8
        ? masters.find((m) => m.phone && String(m.phone).replace(/\D/g, '') === cleanDigits)
        : null) ||
      null;

    user =
      users.find((u) => norm(u.email) === identifier) ||
      users.find((u) => norm(u.username) === identifier) ||
      users.find((u) => norm(u.id) === identifier) ||
      users.find((u) => u.empCode && (norm(u.empCode) === identifier || normCode(String(u.empCode)) === wantedCode)) ||
      users.find((u) => norm(u.name) === identifier) ||
      users.find((u) => u.email && norm(u.email).split('@')[0] === identifier) ||
      (cleanDigits.length >= 8
        ? users.find((u) => u.phone && String(u.phone).replace(/\D/g, '') === cleanDigits)
        : null) ||
      null;
  }

  if (!user && !master) {
    const idLocal = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    user =
      users.find((u) => {
        const uEmail = norm(u.email);
        const uLocal = uEmail ? uEmail.split('@')[0] : '';
        const uFirst = norm(u.name).split(/\s+/)[0];
        return (
          (uLocal && uLocal === idLocal) ||
          (uFirst && identifier === `${uFirst}@coreenact.com`) ||
          norm(u.name) === identifier
        );
      }) || null;
  }

  if (master && !user) {
    user =
      users.find((u) => String(u.id) === String(master.userId)) ||
      users.find((u) => master.email && norm(u.email) === norm(master.email)) ||
      users.find((u) => master.username && norm(u.username) === norm(master.username)) ||
      null;
  }
  if (user && !master) {
    master =
      masters.find((m) => String(m.userId) === String(user.id)) ||
      masters.find((m) => user.email && norm(m.email) === norm(user.email)) ||
      null;
  }
  return { user, master };
}

async function handleAuthLogin(req: Request, res: Response) {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();
    const identifier = String(
      req.body?.identifier ?? req.body?.email ?? req.body?.username ?? ''
    )
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? '').trim();
    const portalMode = req.body?.portalMode === 'payroll' ? 'payroll' : req.body?.portalMode === 'crm' ? 'crm' : undefined;
    // Password is strictly mandatory for login
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        message: 'Username/Email and password are required.',
      });
    }

    // SECURITY: block repeated failed sign-ins for this IP+identifier pair.
    if (isLoginThrottled(req)) {
      return res.status(429).json({
        success: false,
        authenticated: false,
        message: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
      });
    }

    // The hardcoded default password "password123" is strictly disabled for all users (both employee and admin)
    if (password === 'password123') {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'The default password "password123" is disabled and cannot be used to sign in.',
      });
    }

    const { user, master } = findAccountByIdentifier(identifier);
    if (!user && !master) {
      noteLoginFailure(req);
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'Invalid username/email or password.',
      });
    }

    const effectiveRole = user?.role || master?.role || 'Sales Executive';
    const isAdminAccount =
      ['Super Admin', 'Administrator'].includes(effectiveRole) ||
      String(user?.id || master?.userId || '') === 'usr-1';

    const isPayrollOnlyAccount =
      !isAdminAccount &&
      (user?.accessType === 'payroll_only' ||
        user?.accessScope === 'payroll_only' ||
        user?.accessScope === 'PAYROLL_ONLY' ||
        master?.accessType === 'payroll_only' ||
        (!user && Boolean(master)));

    const isCrmOnlyAccount =
      !isAdminAccount &&
      (user?.accessType === 'crm_only' ||
        master?.accessType === 'crm_only' ||
        master?.enrolledInPayroll === false);

    if (portalMode === 'crm' && isPayrollOnlyAccount) {
      return res.status(403).json({
        success: false,
        authenticated: false,
        message:
          'Access Restricted: Your account is authorized for the Payroll ESS Portal only. You cannot sign in to or access the CRM Workspace.',
      });
    }

    if (portalMode === 'payroll' && isCrmOnlyAccount) {
      return res.status(403).json({
        success: false,
        authenticated: false,
        message:
          'Access Restricted: Your account is not enrolled in the Payroll ESS Portal. Please use the CRM Workspace login.',
      });
    }

    const userInactive = Boolean(user && String(user.status || '').toLowerCase() === 'inactive');
    const masterInactive = Boolean(
      master &&
      (String(master.status || '').toLowerCase() === 'inactive' ||
        String(master.employmentStatus || '').toLowerCase() === 'inactive')
    );
    // In Payroll Portal mode, check the employee's payroll master status first (if enrolled in payroll)
    // so employees active in Payroll are not blocked just because CRM workspace access is deactivated.
    // In CRM Portal mode, check the CRM user status.
    const isInactiveForPortal =
      portalMode === 'payroll'
        ? (master ? masterInactive : (userInactive && user?.accessType !== 'payroll_only' && user?.accessScope !== 'payroll_only'))
        : portalMode === 'crm'
        ? userInactive
        : (userInactive || (masterInactive && !user));

    if (isInactiveForPortal) {
      return res.status(403).json({
        success: false,
        authenticated: false,
        message: 'Your account is inactive. Please contact the Administrator.',
      });
    }

    const storedHash =
      user?.passwordHash ||
      master?.passwordHash ||
      (master?.password ? hashPassword(master.password) : undefined) ||
      (user?.password ? hashPassword(user.password) : undefined) ||
      (user?.tempPassword ? hashPassword(user.tempPassword) : undefined) ||
      (master?.tempPassword ? hashPassword(master.tempPassword) : undefined) ||
      (isAdminAccount ? adminSeedHash() : undefined);
    // A bootstrap reset wins over any older hash still held by the loaded record.
    const bootstrapAdminPass =
      isAdminAccount && isAdminBootstrapEnabled() && verifyPasswordHash(password, LEGACY_SEED_PASSWORD_HASH);

    let passwordMatches = Boolean(storedHash && verifyPasswordHash(password, storedHash)) || Boolean(bootstrapAdminPass);

    if (!passwordMatches && isAdminAccount) {
      // SECURITY: the hardcoded admin-password alias list (Coreenact@321#, Admin@123, admin,
      // Shalv@123, …) has been removed. It let anyone who could read the public repo or the
      // deployment notes authenticate as Super Admin and also rewrote the stored hash to the
      // seed, silently resetting a real admin's password. An admin may still recover through
      // the operator-configured ADMIN_PASSWORD env value, or the one-time BOOTSTRAP_ADMIN_PASSWORD
      // reset flow; every other string must match the account's stored bcrypt hash.
      const cleanPass = String(password || '').trim();
      const configuredAdminPass = (process.env.ADMIN_PASSWORD || '').trim();
      const isRecognizedAdminPass = Boolean(configuredAdminPass) && cleanPass === configuredAdminPass;

      if (isRecognizedAdminPass) {
        passwordMatches = true;
        const newHash = adminSeedHash();
        if (user) {
          user.passwordHash = newHash;
          const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(user.id));
          if (uIdx >= 0) {
            MOCK_TABLES.users[uIdx].passwordHash = newHash;
          }
        }
        if (master) {
          master.passwordHash = newHash;
        }
        if (PERSISTED_CRM_STATE.payrollMasters && PERSISTED_CRM_STATE.payrollMasters['usr-1']) {
          PERSISTED_CRM_STATE.payrollMasters['usr-1'].passwordHash = newHash;
        }
        if (livePool) {
          livePool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 OR username = $3 OR email = $4',
            [newHash, 'usr-1', 'admin', 'admin@coreenact.com']
          ).catch(() => {});
        }
        savePersistedStore();
      }
    }

    if (!passwordMatches) {
      noteLoginFailure(req);
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'Invalid password. Please verify your credentials or contact your administrator.',
      });
    }

    // Successful sign-in clears any accumulated failures for this IP+identifier.
    clearLoginFailures(req);
    const nowIso = new Date().toISOString();
    const resolvedAccessScope: 'all' | 'payroll_only' =
      !isAdminAccount && (portalMode === 'payroll' || isPayrollOnlyAccount)
        ? 'payroll_only'
        : 'all';

    if (user) {
      const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(user.id));
      if (uIdx >= 0) {
        MOCK_TABLES.users[uIdx] = {
          ...MOCK_TABLES.users[uIdx],
          accessScope: resolvedAccessScope,
          lastLoginAt: nowIso,
        };
      }
    }

    const resolvedUser =
      user
        ? {
            ...user,
            accessScope: resolvedAccessScope,
            lastLoginAt: nowIso,
          }
        : master
        ? {
            id: master.userId,
            name: master.name || 'Employee',
            username:
              master.username ||
              (master.email ? String(master.email).split('@')[0] : master.empCode || 'employee'),
            email: master.email || '',
            accessScope: resolvedAccessScope,
            accessType: master.accessType || 'payroll_only',
            phone: master.phone || '',
            role: master.role || 'Sales Executive',
            department: master.department || 'Operations',
            designation: master.designation || master.role || 'Employee',
            status: master.status || master.employmentStatus || 'Active',
            location: master.location || 'Mumbai HQ',
            lastLoginAt: nowIso,
          }
        : null;

    savePersistedStore();
    await flushStateToDatabase();

    const sanitizedUser = sanitizeUserForClient(resolvedUser);
    const sanitizedMaster = master ? sanitizePayrollMasterForClient(master) : null;
    const token = issueAuthToken(String(sanitizedUser.id));

    res.cookie?.('crm_session', token, {httpOnly:true, secure:process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL), sameSite:'lax', maxAge:8*60*60*1000, path:'/'});
    return res.json({
      success: true,
      authenticated: true,
      token,
      user: sanitizedUser,
      payrollMaster: sanitizedMaster,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: err?.message || 'Authentication failed.',
    });
  }
}

app.post('/api/auth/login', handleAuthLogin);
app.post('/api/auth/verify', handleAuthLogin);

// Explicit admin reset path, gated by the BOOTSTRAP_ADMIN_PASSWORD env override.
// The env var must be set on the server and the matching value supplied in the request;
// without it this route is completely disabled and cannot be used to take over accounts.
app.post('/api/auth/admin-bootstrap', async (req: Request, res: Response) => {
  try {
    const envBootstrap = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();
    if (!envBootstrap) {
      return res.status(404).json({
        success: false,
        message: 'Admin bootstrap path is disabled. Set BOOTSTRAP_ADMIN_PASSWORD on the server to enable it.',
      });
    }
    const provided = String(req.body?.bootstrapPassword ?? '');
    const envBuf = Buffer.from(envBootstrap);
    const gotBuf = Buffer.from(provided);
    if (
      !provided ||
      gotBuf.length !== envBuf.length ||
      !crypto.timingSafeEqual(gotBuf, envBuf)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid bootstrap key. Provide the exact BOOTSTRAP_ADMIN_PASSWORD value.',
      });
    }
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();
    // Persists the pinned seed itself (source 'request' always saves).
    forceAdminBootstrapSeed('request');
    if (livePool) {
      livePool
        .query(
          'UPDATE users SET password_hash = $1 WHERE id = $2 OR username = $3 OR email = $4',
          [LEGACY_SEED_PASSWORD_HASH, 'usr-1', 'admin', 'admin@coreenact.com']
        )
        .catch(() => {});
    }
    await flushStateToDatabase();
    return res.json({
      success: true,
      message: `Super Admin password reset to the "${LEGACY_SEED_PASSWORD}" seed. Sign in as admin or admin@coreenact.com, then clear stale cached credentials on signed-in browsers.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Admin bootstrap failed.' });
  }
});

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();

    const rawAuthHeader =
      (req.headers?.authorization as string | undefined) ||
      (req.headers?.['x-auth-token'] as string | undefined) ||
      req.body?.authToken || sessionToken(req);
    const tokenUserId = rawAuthHeader ? verifyAuthToken(rawAuthHeader) : null;
    if (rawAuthHeader && !tokenUserId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session.',
      });
    }

    const requestedUserId = String(req.body?.userId ?? req.body?.identifier ?? '').trim();
    const actorUserId = String(
      tokenUserId || req.body?.actorUserId || req.headers?.['x-user-id'] || ''
    ).trim();

    const lookupId = requestedUserId || actorUserId;
    if (!lookupId) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is required.',
      });
    }

    const { user, master } = findAccountByIdentifier(lookupId);
    const resolvedTargetId = String(user?.id || master?.userId || requestedUserId);
    if (actorUserId && requestedUserId && actorUserId !== requestedUserId && actorUserId !== resolvedTargetId) {
      return res.status(403).json({
        success: false,
        message: 'Users can only change their own password.',
      });
    }

    if (!user && !master) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const isMasterActive = master && String(master.status || '').toLowerCase() !== 'inactive';
    if (
      !isMasterActive &&
      ((user && String(user.status || '').toLowerCase() === 'inactive') ||
        (!user && master && String(master.status || '').toLowerCase() === 'inactive'))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Inactive accounts cannot change passwords.',
      });
    }

    const currentPassword = String(req.body?.currentPassword ?? '').trim();
    const newPassword = String(req.body?.newPassword ?? '').trim();
    const confirmPasswordRaw = req.body?.confirmPassword ?? req.body?.confirmNewPassword;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required.',
      });
    }
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required.',
      });
    }
    if (confirmPasswordRaw !== undefined && String(confirmPasswordRaw).trim() !== newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const storedHash = user?.passwordHash || master?.passwordHash;
    if (!verifyPasswordHash(currentPassword, storedHash)) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const newHash = hashPassword(newPassword);
    const canonicalUserId = String(user?.id || master?.userId);

    const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === canonicalUserId);
    if (uIdx >= 0) {
      MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
        ...MOCK_TABLES.users[uIdx],
        passwordHash: newHash,
      });
    }

    if (
      PERSISTED_CRM_STATE.payrollMasters &&
      typeof PERSISTED_CRM_STATE.payrollMasters === 'object'
    ) {
      for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters) as Array<
        [string, any]
      >) {
        if (
          m &&
          (String(k) === canonicalUserId ||
            String(m.userId) === canonicalUserId ||
            (user?.email &&
              m.email &&
              String(m.email).trim().toLowerCase() === String(user.email).trim().toLowerCase()))
        ) {
          PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
            ...m,
            passwordHash: newHash,
          });
        }
      }
    }

    savePersistedStore();
    try {
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newHash, canonicalUserId]
      );
    } catch {
      // Stored in durable state
    }
    await flushStateToDatabase();

    const updatedUser =
      MOCK_TABLES.users.find((u) => String(u.id) === canonicalUserId) || user || master;
    return res.json({
      success: true,
      message: 'Password updated successfully.',
      user: sanitizeUserForClient(updatedUser),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to update password.',
    });
  }
});

app.post('/api/auth/profile', async (req: Request, res: Response) => {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();

    const actor = (req as any).account;
    const rawAuthHeader =
      (req.headers?.authorization as string | undefined) ||
      (req.headers?.['x-auth-token'] as string | undefined) ||
      req.body?.authToken ||
      sessionToken(req);
    const tokenUserId = rawAuthHeader ? verifyAuthToken(rawAuthHeader) : null;
    const requestedTargetId = String(req.body?.id || '').trim();
    const targetId = String(actor?.id || tokenUserId || requestedTargetId || '').trim();
    if (!targetId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === targetId);
    const curr = uIdx >= 0 ? MOCK_TABLES.users[uIdx] : actor;
    if (!curr) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const isAdminActor = ['Super Admin', 'Administrator'].includes(actor?.role || curr?.role);
    if (!isAdminActor && requestedTargetId && actor?.id && requestedTargetId !== String(actor.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access Restricted: You can only update your own profile.',
      });
    }

    const rawPassword = String(req.body?.password ?? req.body?.newPassword ?? '').trim();
    const nextPasswordHash = rawPassword
      ? hashPassword(rawPassword)
      : curr.passwordHash;

    const lockedToPayroll =
      !isAdminActor &&
      (curr.accessType === 'payroll_only' || curr.accessScope === 'payroll_only');

    const updatedRecord = stripPlaintextAndResetFlags({
      ...curr,
      name: req.body?.name !== undefined ? String(req.body.name).trim() : curr.name,
      username: req.body?.username !== undefined ? String(req.body.username).trim() : curr.username,
      email: req.body?.email !== undefined ? String(req.body.email).trim() : curr.email,
      phone: req.body?.phone !== undefined ? String(req.body.phone).trim() : curr.phone,
      designation: req.body?.designation !== undefined ? String(req.body.designation).trim() : curr.designation,
      location: req.body?.location !== undefined ? String(req.body.location).trim() : curr.location,
      avatar: req.body?.avatar !== undefined ? req.body.avatar : curr.avatar,
      accessScope: lockedToPayroll
        ? 'payroll_only'
        : req.body?.accessScope !== undefined
        ? req.body.accessScope
        : curr.accessScope,
      passwordHash: nextPasswordHash,
    });

    if (uIdx >= 0) {
      MOCK_TABLES.users[uIdx] = updatedRecord;
    } else {
      MOCK_TABLES.users.push(updatedRecord);
    }

    if (
      PERSISTED_CRM_STATE.payrollMasters &&
      typeof PERSISTED_CRM_STATE.payrollMasters === 'object'
    ) {
      for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters) as Array<[string, any]>) {
        if (
          m &&
          (String(k) === targetId ||
            String(m.userId) === targetId ||
            (curr.email &&
              m.email &&
              String(m.email).trim().toLowerCase() === String(curr.email).trim().toLowerCase()))
        ) {
          PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
            ...m,
            name: updatedRecord.name,
            username: updatedRecord.username,
            email: updatedRecord.email,
            phone: updatedRecord.phone,
            designation: updatedRecord.designation,
            location: updatedRecord.location,
            ...(req.body?.bankName !== undefined ? { bankName: String(req.body.bankName).trim() } : {}),
            ...(req.body?.bankAccountNo !== undefined ? { bankAccountNo: String(req.body.bankAccountNo).trim() } : {}),
            ...(req.body?.ifscCode !== undefined ? { ifscCode: String(req.body.ifscCode).trim() } : {}),
            ...(req.body?.panNumber !== undefined ? { panNumber: String(req.body.panNumber).trim() } : {}),
            ...(req.body?.uanNumber !== undefined ? { uanNumber: String(req.body.uanNumber).trim() } : {}),
            ...(req.body?.pfAccountNo !== undefined ? { pfAccountNo: String(req.body.pfAccountNo).trim() } : {}),
            ...(req.body?.taxRegime !== undefined ? { taxRegime: req.body.taxRegime } : {}),
            passwordHash: nextPasswordHash,
          });
        }
      }
      MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters);
    }

    if (
      req.body?.bankName !== undefined ||
      req.body?.bankAccountNo !== undefined ||
      req.body?.ifscCode !== undefined ||
      req.body?.panNumber !== undefined ||
      req.body?.uanNumber !== undefined ||
      req.body?.pfAccountNo !== undefined
    ) {
      PERSISTED_CRM_STATE.payrollStatutory[targetId] = {
        ...(PERSISTED_CRM_STATE.payrollStatutory[targetId] || {}),
        ...(req.body?.bankName !== undefined ? { bankName: String(req.body.bankName).trim() } : {}),
        ...(req.body?.bankAccountNo !== undefined ? { bankAccountNo: String(req.body.bankAccountNo).trim() } : {}),
        ...(req.body?.ifscCode !== undefined ? { ifscCode: String(req.body.ifscCode).trim() } : {}),
        ...(req.body?.panNumber !== undefined ? { panNumber: String(req.body.panNumber).trim() } : {}),
        ...(req.body?.uanNumber !== undefined ? { uanNumber: String(req.body.uanNumber).trim() } : {}),
        ...(req.body?.pfAccountNo !== undefined ? { pfAccountNo: String(req.body.pfAccountNo).trim() } : {}),
      };
    }

    if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
      PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
    }

    savePersistedStore();
    await flushStateToDatabase();
    return res.json({
      success: true,
      user: sanitizeUserForClient(updatedRecord),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to update profile.',
    });
  }
});

app.get('/api/state', async (_req: Request, res: Response) => {
  try {
    if (isDatabaseActive() && !PERSISTED_CRM_STATE.stateInitialized) {
      await hydrateStoreFromDatabase();
    }
    return res.json({
      success: true,
      initialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
      snapshot: getCurrentSnapshot(),
    });
  } catch (err: any) {
    console.error('Error in /api/state GET:', err);
    try {
      return res.json({
        success: true,
        initialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
        snapshot: getCurrentSnapshot(),
      });
    } catch {
      return res.json({
        success: true,
        initialized: false,
        snapshot: {
          users: (Array.isArray(MOCK_TABLES.users) ? MOCK_TABLES.users : []).filter(Boolean).map(sanitizeUserForClient),
          customers: [],
          contacts: [],
          leads: [],
          opportunities: [],
          orders: [],
          milestones: [],
          invoices: [],
          payments: [],
        },
      });
    }
  }
});

app.post('/api/state', async (req: Request, res: Response) => {
  try {
    const { base, snapshot: incoming, force } = req.body || {};
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ error: 'snapshot is required' });
    }

    // Capture any explicit passwords passed on incoming users or userPasswords map before sanitizing for three-way merge
    const explicitIncomingPasswordByUserId = new Map<string, string>();
    if (req.body?.userPasswords && typeof req.body.userPasswords === 'object') {
      for (const [uid, rawP] of Object.entries(req.body.userPasswords)) {
        if (uid && typeof rawP === 'string' && rawP.trim()) {
          explicitIncomingPasswordByUserId.set(String(uid), rawP.trim());
        }
      }
    }
    if (Array.isArray(incoming.users)) {
      for (const u of incoming.users) {
        if (u && u.id) {
          const rawP =
            (typeof u.password === 'string' && u.password.trim()) ||
            (typeof u.tempPassword === 'string' && u.tempPassword.trim()) ||
            (typeof u.passwordHash === 'string' && u.passwordHash.trim()) ||
            '';
          if (rawP) {
            explicitIncomingPasswordByUserId.set(String(u.id), rawP);
          }
        }
      }
    }

    const sanitizedIncoming: Snapshot = reconcileSnapshot({
      ...incoming,
      ...(Array.isArray(incoming.users)
        ? { users: incoming.users.filter((u: any) => !isRemovedPredefinedUser(u)).map(sanitizeUserForClient) }
        : {}),
    });
    const sanitizedBase: Snapshot | undefined =
      base && typeof base === 'object'
        ? reconcileSnapshot({
            ...base,
            ...(Array.isArray(base.users)
              ? { users: base.users.filter((u: any) => !isRemovedPredefinedUser(u)).map(sanitizeUserForClient) }
              : {}),
          })
        : undefined;

    const current = getCurrentSnapshot();
    const actor = (req as any).account;
    if (actor && !['Super Admin','Administrator'].includes(actor.role)) {
      const protectedUsers = (rows:any[]) => rows.map(u => {
        const copy={...u};
        const isSelf = String(u.id) === String(actor.id) || (actor.email && u.email && String(u.email).toLowerCase() === String(actor.email).toLowerCase());
        if (isSelf) {
          for (const key of ['name','username','email','avatar','phone','location','designation','accessScope','lastLoginAt','empCode','bankName','bankAccountNo','ifscCode','panNumber','uanNumber']) {
            delete copy[key];
          }
        }
        return copy;
      });
      const hasOtherUserPassword = Array.from(explicitIncomingPasswordByUserId.keys()).some(
        (uid) => String(uid) !== String(actor.id)
      );
      if (hasOtherUserPassword || !same(protectedUsers(sanitizedIncoming.users || []), protectedUsers(current.users || [])) || !same(sanitizedIncoming.rolePermissions, current.rolePermissions) || !same(sanitizedIncoming.payrollRolePermissions, current.payrollRolePermissions)) {
        return res.status(403).json({success:false,message:'User accounts and permissions require an administrator.'});
      }
    }

    let candidate: Snapshot = sanitizedIncoming;
    if (PERSISTED_CRM_STATE.stateInitialized && sanitizedBase && !force) {
      // Align users slice when /api/users or /api/payroll/masters already persisted the user before /api/state arrived
      const incomingUserMap = new Map<string, any>(
        (Array.isArray(sanitizedIncoming.users) ? sanitizedIncoming.users : [])
          .filter((u: any) => u && u.id)
          .map((u: any) => [String(u.id), u])
      );
      const currentForMerge: Snapshot = reconcileSnapshot({
        ...current,
        users: (Array.isArray(current.users) ? current.users : []).map((cu: any) => {
          const inc = cu?.id ? incomingUserMap.get(String(cu.id)) : undefined;
          return inc ? sanitizeUserForClient({ ...cu, ...inc, empCode: inc.empCode || cu.empCode }) : cu;
        }),
      });
      const incomingForMerge: Snapshot = reconcileSnapshot({
        ...sanitizedIncoming,
        users: (Array.isArray(sanitizedIncoming.users) ? sanitizedIncoming.users : []).map((inc: any) => {
          const cu = (Array.isArray(current.users) ? current.users : []).find(
            (r: any) => r && String(r.id) === String(inc?.id)
          );
          return cu ? sanitizeUserForClient({ ...cu, ...inc, empCode: inc.empCode || cu.empCode }) : inc;
        }),
      });
      const merged = mergeSnapshots(sanitizedBase, incomingForMerge, currentForMerge);
      if (merged.conflicts.length > 0) {
        return res.status(409).json({
          error: 'Conflict detected while merging state',
          message: 'Another change occurred during saving. Reload saved data before continuing.',
          conflicts: merged.conflicts,
          snapshot: current,
        });
      }
      candidate = merged.snapshot;
    }

    if (!PERSISTED_CRM_STATE.documentCounters || typeof PERSISTED_CRM_STATE.documentCounters !== 'object') {
      PERSISTED_CRM_STATE.documentCounters = {};
    }
    const countersCopy = { ...PERSISTED_CRM_STATE.documentCounters };
    const numbered = assignDocumentNumbers(
      PERSISTED_CRM_STATE.stateInitialized ? current : candidate,
      candidate,
      countersCopy
    );
    const canonical = reconcileSnapshot(numbered);
    const issues = auditSnapshot(canonical);

    if (issues.length > 0) {
      return res.status(422).json({
        error: issues[0]?.message || 'Validation failed',
        issues,
        snapshot: current,
      });
    }

    // Merge canonical.users with existing MOCK_TABLES.users (unless force is true or a user was explicitly deleted from base)
    const baseUserIds = new Set<string>(
      Array.isArray(sanitizedBase?.users) ? sanitizedBase.users.map((u: any) => String(u?.id || '')) : []
    );
    const canonicalUserIds = new Set<string>(
      Array.isArray(canonical.users) ? canonical.users.map((u: any) => String(u?.id || '')) : []
    );
    const deletedFromBaseIds = new Set<string>();
    for (const bid of baseUserIds) {
      if (bid && !canonicalUserIds.has(bid)) deletedFromBaseIds.add(bid);
    }

    if (Array.isArray(canonical.users) && canonical.users.length > 0) {
      const prevById = new Map<string, any>(
        MOCK_TABLES.users.map((u: any) => [String(u.id), u])
      );
      const updatedUsers = canonical.users.map((u: any) => {
        const uid = String(u.id);
        const prev = prevById.get(uid);
        const linkedMaster = PERSISTED_CRM_STATE.payrollMasters?.[uid];
        const explicitPass = explicitIncomingPasswordByUserId.get(uid);
        const passwordHash = explicitPass
          ? hashPassword(explicitPass)
          : resolveRecordPasswordHash(u, prev, linkedMaster);
        if (explicitPass && linkedMaster) {
          PERSISTED_CRM_STATE.payrollMasters[uid] = stripPlaintextAndResetFlags({
            ...linkedMaster,
            passwordHash,
          });
        }
        const effectivePerms = resolveEffectiveCustomPermissions(u, prev);
        return stripPlaintextAndResetFlags({
          ...prev,
          ...u,
          customPermissions: effectivePerms,
          custom_permissions: effectivePerms,
          passwordHash,
        });
      });
      if (!force) {
        for (const existingU of MOCK_TABLES.users) {
          if (!existingU || !existingU.id) continue;
          const eid = String(existingU.id);
          if (deletedFromBaseIds.has(eid)) continue;
          const eEmail = existingU.email ? String(existingU.email).trim().toLowerCase() : '';
          const alreadyIn = updatedUsers.some(
            (u: any) =>
              String(u.id) === eid ||
              (eEmail && u.email && String(u.email).trim().toLowerCase() === eEmail)
          );
          if (!alreadyIn) {
            updatedUsers.push(stripPlaintextAndResetFlags(existingU));
          }
        }
      }
      MOCK_TABLES.users = updatedUsers;
      canonical.users = updatedUsers.map(sanitizeUserForClient);
    }

    PERSISTED_CRM_STATE.documentCounters = countersCopy;
    PERSISTED_CRM_STATE.crmSlices = {
      ...PERSISTED_CRM_STATE.crmSlices,
      ...canonical,
      users: MOCK_TABLES.users.map(sanitizeUserForClient),
    };
    PERSISTED_CRM_STATE.stateInitialized = true;
    savePersistedStore();
    return res.json({
      success: true,
      initialized: true,
      snapshot: { ...canonical, users: MOCK_TABLES.users.map(sanitizeUserForClient) },
      issues: [],
    });
  } catch (err: any) {
    console.error('Error in /api/state POST:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to save application state',
    });
  }
});

// ============================================================================
// Entity CRUD Routes (Users, Leads, Customers, etc.)
// ============================================================================

// Helper to merge DB users with in-memory MOCK_TABLES.users so newly created users & passwords never get lost
function mergeUsersWithMemory(dbRows: any[]): any[] {
  const mergedMap = new Map<string, any>();
  const idByEmail = new Map<string, string>();
  for (const row of dbRows || []) {
    if (!row || !row.id) continue;
    const id = String(row.id);
    mergedMap.set(
      id,
      stripPlaintextAndResetFlags({
        ...row,
        id,
        passwordHash: resolveRecordPasswordHash(row),
      })
    );
    if (row.email) {
      idByEmail.set(String(row.email).trim().toLowerCase(), id);
    }
  }
  for (const memRow of MOCK_TABLES.users || []) {
    if (!memRow || !memRow.id) continue;
    const rawId = String(memRow.id);
    const emailLower = memRow.email ? String(memRow.email).trim().toLowerCase() : '';
    const targetId = mergedMap.has(rawId)
      ? rawId
      : (emailLower && idByEmail.get(emailLower)) || rawId;
    const existing = mergedMap.get(targetId);
    if (existing) {
      mergedMap.set(
        targetId,
        stripPlaintextAndResetFlags({
          ...existing,
          ...memRow,
          id: targetId,
          passwordHash: resolveRecordPasswordHash(memRow, existing),
        })
      );
    } else {
      mergedMap.set(
        targetId,
        stripPlaintextAndResetFlags({
          ...memRow,
          id: targetId,
          passwordHash: resolveRecordPasswordHash(memRow),
        })
      );
    }
    if (emailLower) {
      idByEmail.set(emailLower, targetId);
    }
  }
  return Array.from(mergedMap.values());
}

// USERS
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at ASC;');
    res.json({ users: mergeUsersWithMemory(result.rows).map(sanitizeUserForClient) });
  } catch (err: any) {
    res.json({ users: MOCK_TABLES.users.map(sanitizeUserForClient) });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  relinkUsersAndPayrollMasters();
  const u = req.body?.user && typeof req.body.user === 'object' ? req.body.user : req.body;
  if (!u || typeof u !== 'object') {
    return res.status(400).json({ success: false, message: 'User payload is required.' });
  }

  const rawPassword = String(u.password ?? u.tempPassword ?? '').trim();
  const rawConfirmPassword = u.confirmPassword !== undefined ? String(u.confirmPassword).trim() : undefined;
  if (rawConfirmPassword !== undefined && rawPassword !== rawConfirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and Confirm Password do not match.',
    });
  }

  const cleanEmail = u.email ? String(u.email).trim().toLowerCase() : '';
  const resolvedUsername = String(
    u.username || (cleanEmail ? cleanEmail.split('@')[0] : '')
  ).trim();
  const cleanUsername = resolvedUsername.toLowerCase();

  if (!cleanEmail && !cleanUsername) {
    return res.status(400).json({
      success: false,
      message: 'Username or Login Email is required.',
    });
  }

  const existingByIdIdx = u.id
    ? MOCK_TABLES.users.findIndex((row) => String(row.id) === String(u.id))
    : -1;

  // Prevent duplicate usernames or login emails across all other users
  const duplicateEmailUser = cleanEmail
    ? MOCK_TABLES.users.find(
        (row, idx) =>
          idx !== existingByIdIdx &&
          row.email &&
          String(row.email).trim().toLowerCase() === cleanEmail
      )
    : undefined;
  const duplicateUsernameUser = cleanUsername
    ? MOCK_TABLES.users.find(
        (row, idx) =>
          idx !== existingByIdIdx &&
          row.username &&
          String(row.username).trim().toLowerCase() === cleanUsername
      )
    : undefined;

  if (duplicateEmailUser) {
    return res.status(409).json({
      success: false,
      message: `A user with login email "${u.email}" already exists.`,
    });
  }
  if (duplicateUsernameUser) {
    return res.status(409).json({
      success: false,
      message: `A user with username "${resolvedUsername}" already exists.`,
    });
  }

  if (existingByIdIdx < 0 && !rawPassword && !u.passwordHash) {
    return res.status(400).json({
      success: false,
      message: 'Password is required when creating a user.',
    });
  }

  const id =
    existingByIdIdx >= 0
      ? String(MOCK_TABLES.users[existingByIdIdx].id)
      : u.id || `usr-${Date.now()}`;

  const existingUser = existingByIdIdx >= 0 ? MOCK_TABLES.users[existingByIdIdx] : undefined;
  const passwordHash = rawPassword
    ? hashPassword(rawPassword)
    : resolveRecordPasswordHash(u, existingUser);

  const newUserRow = stripPlaintextAndResetFlags({
    id,
    name: String(u.name || existingUser?.name || 'New User').trim(),
    username: resolvedUsername || existingUser?.username || 'user',
    email: String(u.email || existingUser?.email || '').trim(),
    empCode: u.empCode ?? existingUser?.empCode ?? '',
    passwordHash,
    accessScope: u.accessScope || (u.accessType === 'payroll_only' ? 'payroll_only' : 'all'),
    accessType: u.accessType || 'crm_and_payroll',
    phone: u.phone ?? existingUser?.phone ?? '',
    role: u.role || existingUser?.role || 'Sales Executive',
    department: u.department || existingUser?.department || 'Sales',
    designation: u.designation ?? existingUser?.designation ?? '',
    status: u.status === 'Inactive' ? 'Inactive' : 'Active',
    avatar: u.avatar ?? existingUser?.avatar ?? '',
    location: u.location ?? existingUser?.location ?? '',
    reportingManager: u.reportingManager ?? existingUser?.reportingManager ?? '',
    assignedTerritory: u.assignedTerritory ?? existingUser?.assignedTerritory ?? '',
    custom_permissions: hasActiveCustomOverrides(u.customPermissions)
      ? u.customPermissions
      : (hasActiveCustomOverrides(existingUser?.custom_permissions) ? existingUser.custom_permissions : {}),
    customPermissions: hasActiveCustomOverrides(u.customPermissions)
      ? u.customPermissions
      : (hasActiveCustomOverrides(existingUser?.customPermissions) ? existingUser.customPermissions : undefined),
    created_at: existingUser?.created_at || new Date().toISOString(),
  });

  if (existingByIdIdx >= 0) {
    MOCK_TABLES.users[existingByIdIdx] = {
      ...MOCK_TABLES.users[existingByIdIdx],
      ...newUserRow,
      id,
    };
  } else {
    MOCK_TABLES.users.push(newUserRow);
  }

  // Keep any linked Payroll Master record synchronized without creating duplicate accounts
  if (
    PERSISTED_CRM_STATE.payrollMasters &&
    typeof PERSISTED_CRM_STATE.payrollMasters === 'object' &&
    PERSISTED_CRM_STATE.payrollMasters[id]
  ) {
    PERSISTED_CRM_STATE.payrollMasters[id] = stripPlaintextAndResetFlags({
      ...PERSISTED_CRM_STATE.payrollMasters[id],
      userId: id,
      name: newUserRow.name,
      username: newUserRow.username,
      email: newUserRow.email,
      role: newUserRow.role,
      department: newUserRow.department,
      designation: newUserRow.designation,
      location: newUserRow.location,
      status: newUserRow.status,
      phone: newUserRow.phone,
      passwordHash,
    });
  }

  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
  }
  savePersistedStore();
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;').catch(() => {});
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_permissions TEXT;').catch(() => {});
    await query(
      `INSERT INTO users (id, name, username, email, password_hash, phone, role, department, designation, status, avatar, location, custom_permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         designation = EXCLUDED.designation,
         status = EXCLUDED.status,
         avatar = EXCLUDED.avatar,
         location = EXCLUDED.location,
         custom_permissions = EXCLUDED.custom_permissions,
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        newUserRow.name,
        newUserRow.username,
        newUserRow.email,
        passwordHash,
        newUserRow.phone,
        newUserRow.role,
        newUserRow.department,
        newUserRow.designation,
        newUserRow.status,
        newUserRow.avatar,
        newUserRow.location,
        JSON.stringify(u.customPermissions || {}),
      ]
    );
  } catch {
    // Kept safely in MOCK_TABLES.users
  }
  await flushStateToDatabase();
  const sanitized = sanitizeUserForClient(newUserRow);
  res.json({ success: true, id, user: sanitized });
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  relinkUsersAndPayrollMasters();
  const { id } = req.params;
  const u = req.body?.user && typeof req.body.user === 'object' ? req.body.user : req.body;
  if (!u || typeof u !== 'object') {
    return res.status(400).json({ success: false, message: 'User update payload is required.' });
  }

  const rawPassword = String(u.password ?? u.tempPassword ?? '').trim();
  const rawConfirmPassword = u.confirmPassword !== undefined ? String(u.confirmPassword).trim() : undefined;
  if (rawPassword && rawConfirmPassword !== undefined && rawPassword !== rawConfirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and Confirm Password do not match.',
    });
  }

  const byIdIdx = MOCK_TABLES.users.findIndex((row) => String(row.id) === String(id));
  const cleanEmail = u.email ? String(u.email).trim().toLowerCase() : '';
  const cleanUsername = u.username ? String(u.username).trim().toLowerCase() : '';

  // Prevent duplicate username or email against any other user
  if (cleanEmail) {
    const emailConflict = MOCK_TABLES.users.find(
      (row, idx) =>
        idx !== byIdIdx &&
        String(row.id) !== String(id) &&
        row.email &&
        String(row.email).trim().toLowerCase() === cleanEmail
    );
    if (emailConflict) {
      return res.status(409).json({
        success: false,
        message: `Login email "${u.email}" is already assigned to another user.`,
      });
    }
  }
  if (cleanUsername) {
    const usernameConflict = MOCK_TABLES.users.find(
      (row, idx) =>
        idx !== byIdIdx &&
        String(row.id) !== String(id) &&
        row.username &&
        String(row.username).trim().toLowerCase() === cleanUsername
    );
    if (usernameConflict) {
      return res.status(409).json({
        success: false,
        message: `Username "${u.username}" is already assigned to another user.`,
      });
    }
  }

  let updatedRecord: any;
  let previousEmailLower = '';
  if (byIdIdx >= 0) {
    const curr = MOCK_TABLES.users[byIdIdx];
    previousEmailLower = curr.email ? String(curr.email).trim().toLowerCase() : '';
    const nextPasswordHash = rawPassword
      ? hashPassword(rawPassword)
      : resolveRecordPasswordHash(u, curr);
    updatedRecord = stripPlaintextAndResetFlags({
      ...curr,
      name: u.name !== undefined ? String(u.name).trim() : curr.name,
      username: u.username !== undefined ? String(u.username).trim() : curr.username,
      email: u.email !== undefined ? String(u.email).trim() : curr.email,
      passwordHash: nextPasswordHash,
      accessScope: u.accessScope ?? curr.accessScope,
      accessType: u.accessType ?? curr.accessType,
      phone: u.phone ?? curr.phone,
      role: u.role ?? curr.role,
      department: u.department ?? curr.department,
      designation: u.designation ?? curr.designation,
      status: u.status ?? curr.status,
      avatar: u.avatar !== undefined ? u.avatar : curr.avatar,
      location: u.location ?? curr.location,
      reportingManager: u.reportingManager ?? curr.reportingManager,
      assignedTerritory: u.assignedTerritory ?? curr.assignedTerritory,
      custom_permissions:
        u.customPermissions !== undefined
          ? (hasActiveCustomOverrides(u.customPermissions) ? u.customPermissions : (u.customPermissions === null ? null : {}))
          : (u.custom_permissions !== undefined ? (hasActiveCustomOverrides(u.custom_permissions) ? u.custom_permissions : {}) : curr.custom_permissions),
      customPermissions:
        u.customPermissions !== undefined
          ? (hasActiveCustomOverrides(u.customPermissions) ? u.customPermissions : (u.customPermissions === null ? null : undefined))
          : (u.custom_permissions !== undefined ? (hasActiveCustomOverrides(u.custom_permissions) ? u.custom_permissions : undefined) : curr.customPermissions),
    });
    MOCK_TABLES.users[byIdIdx] = updatedRecord;
  } else {
    const nextPasswordHash = rawPassword
      ? hashPassword(rawPassword)
      : resolveRecordPasswordHash(u);
    updatedRecord = stripPlaintextAndResetFlags({
      id,
      name: String(u.name || 'User').trim(),
      username: String(u.username || u.email?.split('@')[0] || 'user').trim(),
      email: String(u.email || '').trim(),
      passwordHash: nextPasswordHash,
      accessScope: u.accessScope || 'all',
      accessType: u.accessType || 'crm_and_payroll',
      phone: u.phone || '',
      role: u.role || 'Sales Executive',
      department: u.department || 'Sales',
      designation: u.designation || '',
      status: u.status || 'Active',
      avatar: u.avatar || '',
      location: u.location || '',
      custom_permissions: hasActiveCustomOverrides(u.customPermissions) ? u.customPermissions : {},
      customPermissions: hasActiveCustomOverrides(u.customPermissions) ? u.customPermissions : undefined,
      created_at: new Date().toISOString(),
    });
    MOCK_TABLES.users.push(updatedRecord);
  }

  // Synchronize credentials and profile with any linked Payroll Master record
  if (
    PERSISTED_CRM_STATE.payrollMasters &&
    typeof PERSISTED_CRM_STATE.payrollMasters === 'object'
  ) {
    for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters) as Array<
      [string, any]
    >) {
      if (!m) continue;
      const mEmailLower = m.email ? String(m.email).trim().toLowerCase() : '';
      if (
        String(k) === String(id) ||
        String(m.userId) === String(id) ||
        (previousEmailLower && mEmailLower === previousEmailLower) ||
        (cleanEmail && mEmailLower === cleanEmail)
      ) {
        PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
          ...m,
          userId: String(id),
          name: updatedRecord.name,
          username: updatedRecord.username,
          email: updatedRecord.email,
          role: updatedRecord.role,
          department: updatedRecord.department,
          designation: updatedRecord.designation,
          location: updatedRecord.location,
          status: updatedRecord.status,
          phone: updatedRecord.phone,
          passwordHash: updatedRecord.passwordHash,
        });
      }
    }
  }

  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
  }
  savePersistedStore();
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;').catch(() => {});
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_permissions TEXT;').catch(() => {});
    await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         username = COALESCE($2, username),
         email = COALESCE($3, email),
         password_hash = COALESCE($4, password_hash),
         phone = COALESCE($5, phone),
         role = COALESCE($6, role),
         department = COALESCE($7, department),
         designation = COALESCE($8, designation),
         status = COALESCE($9, status),
         avatar = COALESCE($10, avatar),
         location = COALESCE($11, location),
         custom_permissions = $12,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $13`,
      [
        updatedRecord.name,
        updatedRecord.username,
        updatedRecord.email,
        updatedRecord.passwordHash,
        updatedRecord.phone,
        updatedRecord.role,
        updatedRecord.department,
        updatedRecord.designation,
        updatedRecord.status,
        updatedRecord.avatar,
        updatedRecord.location,
        hasActiveCustomOverrides(updatedRecord.customPermissions)
          ? JSON.stringify(updatedRecord.customPermissions)
          : null,
        id,
      ]
    );
  } catch {
    // Kept safely in MOCK_TABLES.users
  }
  await flushStateToDatabase();
  res.json({ success: true, id, user: sanitizeUserForClient(updatedRecord) });
});

// PAYROLL EMPLOYEE MASTERS & ESS BACKEND SYNC ROUTES
app.get('/api/payroll/masters', (req: Request, res: Response) => {
  const map: Record<string, any> = { ...(PERSISTED_CRM_STATE.payrollMasters || {}) };
  for (const item of MOCK_TABLES.payroll_masters) {
    if (item && item.userId) {
      map[item.userId] = item;
    }
  }
  const actor = (req as any).account;
  const isAdmin = !actor || ['Super Admin', 'Administrator'].includes(actor.role);
  if (!isAdmin && actor?.id) {
    const ownMap: Record<string, any> = {};
    const actorEmail = actor.email ? String(actor.email).trim().toLowerCase() : '';
    for (const [k, m] of Object.entries(map)) {
      if (!m) continue;
      const mEmail = m.email ? String(m.email).trim().toLowerCase() : '';
      if (
        String(k) === String(actor.id) ||
        String(m.userId) === String(actor.id) ||
        (actorEmail && mEmail === actorEmail)
      ) {
        ownMap[k] = m;
      }
    }
    return res.json({ success: true, masters: sanitizePayrollMastersMapForClient(ownMap) });
  }
  res.json({ success: true, masters: sanitizePayrollMastersMapForClient(map) });
});

app.post('/api/payroll/masters', async (req: Request, res: Response) => {
  const actor = (req as any).account;
  const rawMasters = req.body?.masters;
  const masters: Record<string, any> | undefined = Array.isArray(rawMasters)
    ? Object.fromEntries(
        rawMasters
          .filter((m) => m && m.userId)
          .map((m) => [String(m.userId), m])
      )
    : rawMasters;

  if (actor && !['Super Admin', 'Administrator'].includes(actor.role)) {
    const targetKeys = Object.keys(masters || {});
    const cleanActorEmail = actor.email ? String(actor.email).trim().toLowerCase() : '';
    const isSelfOnly =
      targetKeys.length > 0 &&
      targetKeys.every((k) => {
        const m = masters?.[k];
        return (
          String(k) === String(actor.id) ||
          (m && String(m.userId) === String(actor.id)) ||
          (cleanActorEmail && m && m.email && String(m.email).trim().toLowerCase() === cleanActorEmail)
        );
      });
    if (!isSelfOnly) {
      return res.status(403).json({ success: false, message: 'Administrator permission required.' });
    }
    // For non-admin self-update, preserve admin-configured compensation, tax deductions, and leave quotas
    const currentMasters = PERSISTED_CRM_STATE.payrollMasters || {};
    for (const [k, m] of Object.entries(masters || {})) {
      const existing =
        currentMasters[k] ||
        Object.values(currentMasters).find(
          (ex: any) =>
            ex &&
            (String(ex.userId) === String(actor.id) ||
              (cleanActorEmail && ex.email && String(ex.email).trim().toLowerCase() === cleanActorEmail))
        );
      if (existing) {
        masters[k] = {
          ...existing,
          ...(m.name ? { name: String(m.name).trim() } : {}),
          ...(m.phone !== undefined ? { phone: String(m.phone).trim() } : {}),
          ...(m.location !== undefined ? { location: String(m.location).trim() } : {}),
          ...(m.bankName !== undefined ? { bankName: String(m.bankName).trim() } : {}),
          ...(m.bankAccountNo !== undefined ? { bankAccountNo: String(m.bankAccountNo).trim() } : {}),
          ...(m.ifscCode !== undefined ? { ifscCode: String(m.ifscCode).trim() } : {}),
          ...(m.panNumber !== undefined ? { panNumber: String(m.panNumber).trim() } : {}),
          ...(m.uanNumber !== undefined ? { uanNumber: String(m.uanNumber).trim() } : {}),
          ...(m.pfAccountNo !== undefined ? { pfAccountNo: String(m.pfAccountNo).trim() } : {}),
          ...(m.taxRegime !== undefined ? { taxRegime: m.taxRegime } : {}),
        };
      }
    }
  }
  const deletedUserIds = Array.isArray(req.body?.deletedUserIds)
    ? (req.body.deletedUserIds as any[]).filter((id) => typeof id === 'string' && id)
    : [];
  const clearedUserIds = Array.isArray(req.body?.clearedUserIds)
    ? (req.body.clearedUserIds as any[]).filter((id) => typeof id === 'string' && id)
    : [];
  if (masters && typeof masters === 'object') {
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedPayrollMasterIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = [];
    }
    // Explicit re-enroll (create / promote flows) un-archives that employee's tombstone
    for (const id of clearedUserIds) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = (
        PERSISTED_CRM_STATE.deletedPayrollMasterIds as string[]
      ).filter((t) => t !== id);
    }
    const currentMasters: Record<string, any> = {
      ...(PERSISTED_CRM_STATE.payrollMasters || {}),
    };
    const isPatch = Boolean(req.body?.patch);
    const baseMasters = req.body?.baseMasters;

    if (baseMasters && typeof baseMasters === 'object') {
      for (const [k, nextVal] of Object.entries(masters)) {
        const baseVal = sanitizePayrollMasterForClient(baseMasters[k]);
        const currVal = sanitizePayrollMasterForClient(currentMasters[k]);
        const cleanNextVal = sanitizePayrollMasterForClient(nextVal as any);
        if (
          !same(baseVal, cleanNextVal) &&
          currVal !== undefined &&
          !same(currVal, baseVal) &&
          !same(currVal, cleanNextVal)
        ) {
          return res.status(409).json({
            success: false,
            message: `Concurrent change detected for payroll master ${k}`,
          });
        }
      }
    }

    // Upsert per userId (patch) or full snapshot; a stale snapshot from another tab
    // must never silently wipe employees it does not know about, so tombstones below
    // are the only sanctioned way a record is removed.
    const combined: Record<string, any> = isPatch
      ? { ...currentMasters, ...masters }
      : { ...masters };

    // Tombstone handling: honor explicit deletes and block stale re-pushes from
    // resurrecting an employee deleted on another device/tab.
    const tombstones = new Set<string>([
      ...(PERSISTED_CRM_STATE.deletedPayrollMasterIds as string[]),
      ...deletedUserIds,
    ]);
    for (const id of clearedUserIds) tombstones.delete(id);
    for (const id of deletedUserIds) delete combined[id];
    for (const key of Object.keys(combined)) {
      const uid = String((combined[key] && combined[key].userId) || key);
      if (tombstones.has(uid)) delete combined[key];
    }
    PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.from(tombstones);

    // Validate employee codes and emails are unique across combined masters. Only a record this
    // request actually changes may block the save: a duplicate that already sits between two
    // records nobody is editing must not wedge every future payroll write, because any 4xx here
    // rolls the whole transaction back - the caller would keep believing the employee was created
    // while the server never stored it, and the next sync pull silently drops it again.
    const incomingOwners = new Set<string>([
      ...Object.keys(masters),
      ...Object.values(masters).map((m: any) => String(m?.userId || '')),
    ]);
    const collisionIsOurs = (a: string, b: string) => incomingOwners.has(a) || incomingOwners.has(b);
    const seenCodes = new Map<string, string>();
    const seenEmails = new Map<string, string>();
    for (const m of Object.values(combined) as any[]) {
      if (!m || !m.userId) continue;
      const uid = String(m.userId);
      const rawCode = String(m.empCode || '').trim().toUpperCase();
      const numMatch = rawCode.match(/^EMP[-_\s]*(\d+)$/i);
      const normCode = numMatch ? `EMP-${numMatch[1].padStart(3, '0')}` : rawCode;
      if (normCode) {
        const existingOwner = seenCodes.get(normCode);
        if (existingOwner && existingOwner !== uid) {
          const ownerM = combined[existingOwner] || Object.values(combined).find((x: any) => x && String(x.userId) === existingOwner);
          const isSamePerson = ownerM && m.email && ownerM.email && String(m.email).trim().toLowerCase() === String(ownerM.email).trim().toLowerCase();
          if (!isSamePerson && collisionIsOurs(existingOwner, uid)) {
            return res.status(400).json({
              success: false,
              message: `Duplicate Employee Code ${normCode}`,
            });
          }
        } else {
          seenCodes.set(normCode, uid);
        }
      }
      const normEmail = String(m.email || '').trim().toLowerCase();
      if (normEmail) {
        const existingEmailOwner = seenEmails.get(normEmail);
        if (existingEmailOwner && existingEmailOwner !== uid) {
          if (collisionIsOurs(existingEmailOwner, uid)) {
            return res.status(400).json({
              success: false,
              message: `Duplicate Employee Email ${normEmail}`,
            });
          }
        } else {
          seenEmails.set(normEmail, uid);
        }
      }
    }

    const entries = Object.values(combined) as any[];
    const relinkedMap: Record<string, any> = {};

    // Match user by ID first, then email; if payroll record points at wrong ID, re-link it to the right user
    for (const m of entries) {
      if (!m || !m.userId) continue;
      const byIdIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(m.userId));
      const byEmailIdx =
        byIdIdx < 0 && m.email
          ? MOCK_TABLES.users.findIndex(
              (u) => u.email && u.email.toLowerCase() === String(m.email).toLowerCase()
            )
          : -1;
      const existingIdx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
      const canonicalUserId =
        existingIdx >= 0 ? String(MOCK_TABLES.users[existingIdx].id) : String(m.userId);
      const existingUser = existingIdx >= 0 ? MOCK_TABLES.users[existingIdx] : undefined;
      const existingMaster = currentMasters[canonicalUserId] || currentMasters[String(m.userId)];
      const passwordHash = resolveRecordPasswordHash(m, existingMaster, existingUser);
      const effectiveStatus =
        m.status === 'Inactive' || m.status === 'Active'
          ? m.status
          : m.employmentStatus === 'Inactive' || m.employmentStatus === 'Active'
          ? m.employmentStatus
          : existingUser?.status === 'Inactive' || existingUser?.status === 'Active'
          ? existingUser.status
          : 'Active';

      const normalizedMaster = stripPlaintextAndResetFlags({
        ...existingMaster,
        ...m,
        userId: canonicalUserId,
        status: effectiveStatus,
        passwordHash,
      });
      relinkedMap[canonicalUserId] = normalizedMaster;

      if (existingIdx >= 0) {
        const nextAccessType = m.accessType || MOCK_TABLES.users[existingIdx].accessType || 'crm_and_payroll';
        MOCK_TABLES.users[existingIdx] = stripPlaintextAndResetFlags({
          ...MOCK_TABLES.users[existingIdx],
          name: m.name || MOCK_TABLES.users[existingIdx].name,
          username: m.username || MOCK_TABLES.users[existingIdx].username,
          email: m.email || MOCK_TABLES.users[existingIdx].email,
          phone: m.phone !== undefined ? m.phone : MOCK_TABLES.users[existingIdx].phone,
          department: m.department || MOCK_TABLES.users[existingIdx].department,
          designation: m.designation || MOCK_TABLES.users[existingIdx].designation,
          role: m.role || MOCK_TABLES.users[existingIdx].role,
          location: m.location || MOCK_TABLES.users[existingIdx].location,
          status: effectiveStatus,
          passwordHash,
          empCode: normalizedMaster.empCode,
          gender: m.gender || MOCK_TABLES.users[existingIdx].gender,
          dateOfBirth: m.dateOfBirth || MOCK_TABLES.users[existingIdx].dateOfBirth,
          bloodGroup: m.bloodGroup || MOCK_TABLES.users[existingIdx].bloodGroup,
          maritalStatus: m.maritalStatus || MOCK_TABLES.users[existingIdx].maritalStatus,
          panNumber: m.panNumber || MOCK_TABLES.users[existingIdx].panNumber,
          bankName: m.bankName || MOCK_TABLES.users[existingIdx].bankName,
          bankAccountNo: m.bankAccountNo || MOCK_TABLES.users[existingIdx].bankAccountNo,
          ifscCode: m.ifscCode || MOCK_TABLES.users[existingIdx].ifscCode,
          uanNumber: m.uanNumber || MOCK_TABLES.users[existingIdx].uanNumber,
          pfAccountNo: m.pfAccountNo || MOCK_TABLES.users[existingIdx].pfAccountNo,
          taxRegime: m.taxRegime || MOCK_TABLES.users[existingIdx].taxRegime,
          accessType: nextAccessType,
          accessScope:
            nextAccessType === 'payroll_only'
              ? 'payroll_only'
              : MOCK_TABLES.users[existingIdx].accessScope || 'all',
        });
      } else {
        MOCK_TABLES.users.push(
          stripPlaintextAndResetFlags({
            id: canonicalUserId,
            name: m.name || 'Employee',
            username:
              m.username || (m.email ? m.email.split('@')[0] : normalizedMaster.empCode || 'employee'),
            email: m.email || '',
            passwordHash,
            accessScope: m.accessType === 'payroll_only' ? 'payroll_only' : 'all',
            accessType: m.accessType || 'payroll_only',
            empCode: normalizedMaster.empCode,
            phone: m.phone || '',
            role: m.role || 'Sales Executive',
            department: m.department || 'Operations',
            designation: m.designation || m.role || 'Employee',
            status: effectiveStatus,
            location: m.location || 'Mumbai HQ',
            gender: m.gender,
            dateOfBirth: m.dateOfBirth,
            bloodGroup: m.bloodGroup,
            maritalStatus: m.maritalStatus,
            panNumber: m.panNumber,
            bankName: m.bankName,
            bankAccountNo: m.bankAccountNo,
            ifscCode: m.ifscCode,
            uanNumber: m.uanNumber,
            pfAccountNo: m.pfAccountNo,
            taxRegime: m.taxRegime,
            created_at: new Date().toISOString(),
          })
        );
      }
    }
    PERSISTED_CRM_STATE.payrollMasters = relinkedMap;
    MOCK_TABLES.payroll_masters = Object.values(relinkedMap);
    if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
      PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
    }
    savePersistedStore();
  }
  await flushStateToDatabase();
  res.json({
    success: true,
    count: MOCK_TABLES.payroll_masters.length,
    masters: sanitizePayrollMastersMapForClient(PERSISTED_CRM_STATE.payrollMasters),
  });
});

// Remove one employee's payroll master (with tombstone) so syncs never resurrect it
app.delete('/api/payroll/masters/:id', async (req: Request, res: Response) => {
  const actor = (req as any).account;
  if (actor && !['Super Admin', 'Administrator'].includes(actor.role)) {
    return res.status(403).json({ success: false, message: 'Administrator permission required.' });
  }
  const { id } = req.params;
  const deleteCrmUser = req.query.deleteUser === 'true';
  if (id) {
    const existingMaster = PERSISTED_CRM_STATE.payrollMasters?.[id];
    delete PERSISTED_CRM_STATE.payrollMasters[id];
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedPayrollMasterIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = [];
    }
    if (!PERSISTED_CRM_STATE.deletedPayrollMasterIds.includes(id)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds.push(id);
    }
    MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters).filter(
      Boolean
    ) as any[];

    // If explicitly requested or if user was payroll_only, remove from users slice
    const cleanEmail = existingMaster?.email ? String(existingMaster.email).trim().toLowerCase() : '';
    const targetUser = (MOCK_TABLES.users || []).find(
      (u: any) =>
        String(u?.id) === String(id) ||
        (cleanEmail && u?.email && String(u.email).trim().toLowerCase() === cleanEmail)
    );
    const isPayrollOnly = targetUser && (targetUser.accessScope === 'payroll_only' || targetUser.accessType === 'payroll_only');

    if (deleteCrmUser || isPayrollOnly) {
      if (targetUser?.id) {
        const uId = String(targetUser.id);
        MOCK_TABLES.users = (MOCK_TABLES.users || []).filter((u: any) => String(u?.id) !== uId);
        if (Array.isArray(PERSISTED_CRM_STATE.crmSlices?.users)) {
          PERSISTED_CRM_STATE.crmSlices.users = PERSISTED_CRM_STATE.crmSlices.users.filter(
            (u: any) => String(u?.id) !== uId
          );
        }
        try {
          await query('DELETE FROM users WHERE id = $1', [uId]);
        } catch {}
      }
    }

    savePersistedStore();
  }
  await flushStateToDatabase();
  res.json({ success: true, id });
});

/* ---------------------------------------------------------------------------------
 * Real-time HR collections. These back the Location Master, attendance regularization
 * and WFH, shifts/rosters/swaps, the help desk, payroll runs and employee lifecycle.
 * Stored in the durable state so every write is captured server-side and visible to
 * all users and devices immediately.
 * --------------------------------------------------------------------------------- */
const PAYROLL_COLLECTION_KEYS: Record<string, string> = {
  locations: 'payrollLocations',
  regularization: 'payrollRegularization',
  shifts: 'payrollShifts',
  shiftAssignments: 'payrollShiftAssignments',
  shiftSwaps: 'payrollShiftSwaps',
  helpdesk: 'payrollHelpDesk',
  runs: 'payrollRuns',
  lifecycle: 'payrollLifecycle',
  assets: 'payrollAssets',
  assetCategories: 'payrollAssetCategories',
  assetAllocations: 'payrollAssetAllocations',
  jobOpenings: 'payrollJobOpenings',
  candidates: 'payrollCandidates',
  onboarding: 'payrollOnboarding',
  performance: 'payrollPerformance',
  trainingPrograms: 'payrollTrainingPrograms',
  trainingNominations: 'payrollTrainingNominations',
};
// Collections only an admin/HR user may write. Employees may read all of them.
const PAYROLL_ADMIN_ONLY_COLLECTIONS = ['locations', 'shifts', 'shiftAssignments', 'runs'];

const isAdminActor = (req: Request): boolean => {
  const actor = (req as any).account;
  return !actor || ['Super Admin', 'Administrator'].includes(actor.role);
};

app.get('/api/payroll/collections', (_req: Request, res: Response) => {
  const collections: Record<string, any> = {};
  for (const [key, stateKey] of Object.entries(PAYROLL_COLLECTION_KEYS)) {
    const value = PERSISTED_CRM_STATE[stateKey];
    collections[key] = Array.isArray(value) ? value : [];
  }
  res.json({ success: true, collections });
});

app.post('/api/payroll/collections/:key', (req: Request, res: Response) => {
  const key = String(req.params.key || '');
  const stateKey = PAYROLL_COLLECTION_KEYS[key];
  if (!stateKey) {
    return res.status(404).json({ success: false, message: 'Unknown collection' });
  }
  if (PAYROLL_ADMIN_ONLY_COLLECTIONS.includes(key) && !isAdminActor(req)) {
    return res.status(403).json({ success: false, message: 'Not permitted for this collection' });
  }
  const data = req.body?.data;
  if (!Array.isArray(data)) {
    return res.status(400).json({ success: false, message: 'data must be an array' });
  }
  PERSISTED_CRM_STATE[stateKey] = data;
  flushStateToDatabase();
  res.json({ success: true, key, count: data.length });
});

app.get('/api/payroll/loans', (req: Request, res: Response) => {
  const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
  const allLoans = (PERSISTED_CRM_STATE.payrollLoans || []).filter(
    (l: any) => l && l.id && !delSet.has(l.id)
  );
  const actor = (req as any).account;
  const isAdmin = !actor || ['Super Admin', 'Administrator'].includes(actor.role);
  const loans = isAdmin
    ? allLoans
    : allLoans.filter((l: any) => String(l.employeeId) === String(actor.id));
  res.json({
    success: true,
    loans,
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
  });
});

app.post('/api/payroll/loans', (req: Request, res: Response) => {
  const actor = (req as any).account;
  const isAdmin = !actor || ['Super Admin', 'Administrator'].includes(actor.role);
  const deletedLoanId = req.body?.deletedLoanId;
  if (deletedLoanId && typeof deletedLoanId === 'string') {
    const targetLoan = (PERSISTED_CRM_STATE.payrollLoans || []).find(
      (l: any) => l && l.id === deletedLoanId
    );
    if (isAdmin || !targetLoan || String(targetLoan.employeeId) === String(actor?.id)) {
      if (!Array.isArray(PERSISTED_CRM_STATE.deletedLoanIds)) {
        PERSISTED_CRM_STATE.deletedLoanIds = [];
      }
      if (!PERSISTED_CRM_STATE.deletedLoanIds.includes(deletedLoanId)) {
        PERSISTED_CRM_STATE.deletedLoanIds.push(deletedLoanId);
      }
    }
  }
  const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
  if (Array.isArray(req.body?.loans)) {
    if (isAdmin) {
      PERSISTED_CRM_STATE.payrollLoans = req.body.loans.filter(
        (l: any) => l && l.id && !delSet.has(l.id)
      );
    } else if (actor?.id) {
      const otherEmployeesLoans = (PERSISTED_CRM_STATE.payrollLoans || []).filter(
        (l: any) => l && l.id && !delSet.has(l.id) && String(l.employeeId) !== String(actor.id)
      );
      const ownSubmittedLoans = req.body.loans.filter(
        (l: any) => l && l.id && !delSet.has(l.id) && String(l.employeeId) === String(actor.id)
      );
      PERSISTED_CRM_STATE.payrollLoans = [...otherEmployeesLoans, ...ownSubmittedLoans];
    }
    savePersistedStore();
  }
  const visibleLoans = isAdmin
    ? PERSISTED_CRM_STATE.payrollLoans || []
    : (PERSISTED_CRM_STATE.payrollLoans || []).filter(
        (l: any) => String(l.employeeId) === String(actor?.id)
      );
  res.json({
    success: true,
    loans: visibleLoans,
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
  });
});

app.delete('/api/payroll/loans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (id) {
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedLoanIds)) {
      PERSISTED_CRM_STATE.deletedLoanIds = [];
    }
    if (!PERSISTED_CRM_STATE.deletedLoanIds.includes(id)) {
      PERSISTED_CRM_STATE.deletedLoanIds.push(id);
    }
    PERSISTED_CRM_STATE.payrollLoans = (PERSISTED_CRM_STATE.payrollLoans || []).filter(
      (l: any) => l && l.id !== id
    );
    savePersistedStore();
  }
  res.json({
    success: true,
    id,
    loans: PERSISTED_CRM_STATE.payrollLoans || [],
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
  });
});

app.get('/api/payroll/policy', (_req: Request, res: Response) => {
  res.json({ success: true, policy: PERSISTED_CRM_STATE.payrollPolicy || null });
});

app.post('/api/payroll/policy', (req: Request, res: Response) => {
  if (req.body?.policy && typeof req.body.policy === 'object') {
    PERSISTED_CRM_STATE.payrollPolicy = req.body.policy;
    savePersistedStore();
  }
  res.json({ success: true, policy: PERSISTED_CRM_STATE.payrollPolicy });
});

app.get('/api/payroll/org-masters', (_req: Request, res: Response) => {
  res.json({ success: true, orgMasters: PERSISTED_CRM_STATE.payrollOrgMasters || null });
});

app.post('/api/payroll/org-masters', (req: Request, res: Response) => {
  if (req.body?.orgMasters && typeof req.body.orgMasters === 'object') {
    PERSISTED_CRM_STATE.payrollOrgMasters = req.body.orgMasters;
    savePersistedStore();
  }
  res.json({ success: true, orgMasters: PERSISTED_CRM_STATE.payrollOrgMasters });
});

app.post('/api/payroll/ess/:empId', async (req: Request, res: Response) => {
  const { empId } = req.params;
  if (!empId) {
    return res.status(400).json({ success: false, error: 'empId is required' });
  }
  const actor = (req as any).account;
  const isAdmin = !actor || ['Super Admin', 'Administrator'].includes(actor.role);
  const isMatch =
    actor &&
    (String(empId) === String(actor.id) ||
      (actor.empCode && String(empId).toUpperCase() === String(actor.empCode).toUpperCase()));
  if (!isAdmin && !isMatch) {
    return res.status(403).json({
      success: false,
      message: 'Access Restricted: You can only view or update your own payroll ESS records.',
    });
  }
  const { attendance, leaves, claims, statutory, base } = req.body || {};

  // Verify employee identity on submitted leaves and claims
  if (Array.isArray(leaves)) {
    for (const lv of leaves) {
      if (lv && lv.employeeId && String(lv.employeeId) !== String(empId)) {
        return res.status(400).json({
          success: false,
          message: `Leave record employeeId ${lv.employeeId} does not match ${empId}`,
        });
      }
    }
    if (Array.isArray(base?.leaves)) {
      const currentLeaves: any[] = PERSISTED_CRM_STATE.payrollLeaves[empId] || [];
      const baseById = new Map(base.leaves.map((l: any) => [String(l.id), l]));
      const currById = new Map(currentLeaves.map((l: any) => [String(l.id), l]));
      for (const lv of leaves) {
        const id = String(lv.id);
        const b = baseById.get(id);
        const c = currById.get(id);
        if (!same(b, lv) && !same(c, b) && !same(c, lv)) {
          return res.status(409).json({
            success: false,
            message: `Concurrent leave modification detected for ${id}`,
          });
        }
      }
    }
  }

  if (Array.isArray(claims)) {
    for (const cl of claims) {
      if (cl && cl.employeeId && String(cl.employeeId) !== String(empId)) {
        return res.status(400).json({
          success: false,
          message: `Claim record employeeId ${cl.employeeId} does not match ${empId}`,
        });
      }
    }
    if (Array.isArray(base?.claims)) {
      const currentClaims: any[] = PERSISTED_CRM_STATE.payrollClaims[empId] || [];
      const baseById = new Map(base.claims.map((c: any) => [String(c.id), c]));
      const currById = new Map(currentClaims.map((c: any) => [String(c.id), c]));
      for (const cl of claims) {
        const id = String(cl.id);
        const b = baseById.get(id);
        const c = currById.get(id);
        if (!same(b, cl) && !same(c, b) && !same(c, cl)) {
          return res.status(409).json({
            success: false,
            message: `Concurrent claim modification detected for ${id}`,
          });
        }
      }
    }
  }

  if (attendance !== undefined) {
    PERSISTED_CRM_STATE.payrollAttendance[empId] = attendance;
  }
  if (leaves !== undefined) {
    PERSISTED_CRM_STATE.payrollLeaves[empId] = leaves;
  }
  if (claims !== undefined) {
    PERSISTED_CRM_STATE.payrollClaims[empId] = claims;
  }
  const PERMITTED_ESS_FIELDS = [
    'name',
    'phone',
    'alternatePhone',
    'personalEmail',
    'location',
    'avatar',
    'gender',
    'dateOfBirth',
    'bloodGroup',
    'maritalStatus',
    'currentAddress',
    'permanentAddress',
    'city',
    'state',
    'pinCode',
    'bankName',
    'bankAccountNo',
    'ifscCode',
    'panNumber',
    'uanNumber',
    'pfAccountNo',
    'taxRegime',
    'accountHolderName',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContactRelation',
    'highestQualification',
    'institute',
    'passingYear',
    'documents',
  ];

  // Collect incoming employee patch from body, profile, employeeInfo, statutory
  const incomingPatch: Record<string, any> = {};
  const sources = [
    req.body?.employeeInfo,
    req.body?.profile,
    req.body?.statutory,
    req.body,
  ];
  for (const src of sources) {
    if (src && typeof src === 'object') {
      for (const field of PERMITTED_ESS_FIELDS) {
        if (src[field] !== undefined) {
          incomingPatch[field] = src[field];
        }
      }
    }
  }

  // If actor is admin, allow admin fields; if non-admin, strictly keep salary, roles, and permissions protected
  if (isAdmin) {
    const adminFields = [
      'monthlyGross', 'basicPct', 'hraPct', 'specialPct', 'commissionPct',
      'pfAmount', 'profTax', 'tdsPct', 'lopDays', 'role', 'department',
      'designation', 'status', 'accessType', 'accessScope', 'empCode',
      'plQuota', 'clQuota', 'slQuota', 'compOffQuota', 'shiftTiming',
    ];
    for (const src of sources) {
      if (src && typeof src === 'object') {
        for (const field of adminFields) {
          if (src[field] !== undefined) {
            incomingPatch[field] = src[field];
          }
        }
      }
    }
  }

  const cleanActorEmail = actor?.email ? String(actor.email).trim().toLowerCase() : '';
  const cleanEmpId = String(empId).trim();

  // Find canonical target key in payrollMasters
  let targetMasterKey = Object.keys(PERSISTED_CRM_STATE.payrollMasters || {}).find((k) => {
    const m = PERSISTED_CRM_STATE.payrollMasters[k];
    if (!m) return false;
    return (
      String(k) === cleanEmpId ||
      String(m.userId) === cleanEmpId ||
      (m.empCode && String(m.empCode).toUpperCase() === cleanEmpId.toUpperCase()) ||
      (cleanActorEmail && m.email && String(m.email).trim().toLowerCase() === cleanActorEmail)
    );
  }) || cleanEmpId;

  const existingMaster = PERSISTED_CRM_STATE.payrollMasters[targetMasterKey] || {};
  const newAuditEntries: any[] = [];

  // Record audit history for every changed field
  for (const [key, val] of Object.entries(incomingPatch)) {
    const oldVal = existingMaster[key];
    const oldStr = typeof oldVal === 'object' && oldVal !== null ? JSON.stringify(oldVal) : String(oldVal ?? '');
    const newStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
    if (oldStr !== newStr) {
      const auditEntry = {
        id: `aud-emp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        entityType: 'Employee',
        entityId: String(targetMasterKey),
        employeeId: String(targetMasterKey),
        empCode: existingMaster.empCode || String(empId),
        entityNumber: existingMaster.empCode || String(empId),
        action: 'Updated',
        fieldName: key,
        oldValue: oldStr,
        newValue: newStr,
        description: `Employee ${key} updated from "${oldStr}" to "${newStr}"`,
        performedById: String(actor?.id || targetMasterKey),
        performedByName: String(actor?.name || 'Employee'),
        timestamp: new Date().toISOString(),
      };
      newAuditEntries.push(auditEntry);
      if (!Array.isArray(PERSISTED_CRM_STATE.crmSlices.auditLogs)) {
        PERSISTED_CRM_STATE.crmSlices.auditLogs = [];
      }
      const existingSliceIdx = PERSISTED_CRM_STATE.crmSlices.auditLogs.findIndex((l: any) => l && String(l.id) === String(auditEntry.id));
      if (existingSliceIdx >= 0) {
        PERSISTED_CRM_STATE.crmSlices.auditLogs[existingSliceIdx] = auditEntry;
      } else {
        PERSISTED_CRM_STATE.crmSlices.auditLogs.unshift(auditEntry);
      }
      const existingMockIdx = MOCK_TABLES.audit_logs.findIndex((l: any) => l && String(l.id) === String(auditEntry.id));
      if (existingMockIdx >= 0) {
        MOCK_TABLES.audit_logs[existingMockIdx] = auditEntry;
      } else {
        MOCK_TABLES.audit_logs.unshift(auditEntry);
      }
      if (PERSISTED_CRM_STATE.crmSlices.auditLogs.length > 500) {
        PERSISTED_CRM_STATE.crmSlices.auditLogs = PERSISTED_CRM_STATE.crmSlices.auditLogs.slice(0, 500);
      }
      if (MOCK_TABLES.audit_logs.length > 500) {
        MOCK_TABLES.audit_logs = MOCK_TABLES.audit_logs.slice(0, 500);
      }
      try {
        await query(
          `INSERT INTO audit_logs (id, action, entity_type, entity_id, field_name, old_value, new_value, user_name, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            auditEntry.id,
            auditEntry.action,
            auditEntry.entityType,
            auditEntry.entityId,
            auditEntry.fieldName,
            auditEntry.oldValue,
            auditEntry.newValue,
            auditEntry.performedByName,
            auditEntry.performedById,
          ]
        );
      } catch {
        // Persisted inside state store
      }
    }
  }

  // Update target master record
  PERSISTED_CRM_STATE.payrollMasters[targetMasterKey] = stripPlaintextAndResetFlags({
    ...existingMaster,
    ...incomingPatch,
    userId: existingMaster.userId || targetMasterKey,
  });
  MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters);

  // Update matching CRM user record
  MOCK_TABLES.users = MOCK_TABLES.users.map((u) => {
    const matches =
      String(u.id) === String(targetMasterKey) ||
      String(u.id) === cleanEmpId ||
      (cleanActorEmail && u.email && String(u.email).trim().toLowerCase() === cleanActorEmail) ||
      (u.empCode && String(u.empCode).toUpperCase() === cleanEmpId.toUpperCase());
    if (matches) {
      return stripPlaintextAndResetFlags({
        ...u,
        ...incomingPatch,
      });
    }
    return u;
  });

  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
  }

  savePersistedStore();
  await flushStateToDatabase();

  res.json({
    success: true,
    empId: targetMasterKey,
    updatedEmployee: sanitizePayrollMasterForClient(PERSISTED_CRM_STATE.payrollMasters[targetMasterKey]),
    auditLogs: newAuditEntries,
  });
});

app.post('/api/sync/push', async (req: Request, res: Response) => {
  const {
    users: pushedUsers,
    payrollMasters: pushedMasters,
    payrollLoans: pushedLoans,
    payrollPolicy: pushedPolicy,
    payrollOrgMasters: pushedOrgMasters,
    payrollAttendance: pushedAttendance,
    payrollLeaves: pushedLeaves,
    payrollClaims: pushedClaims,
    payrollStatutory: pushedStatutory,
    payrollIntegrationConfig: pushedIntegrationConfig,
    crmSlices: pushedCrmSlices,
    sliceKey,
    sliceValue,
    replaceUsers,
    replacePayrollMasters,
    deletedMasterUserIds,
  } = req.body || {};
  const actor=(req as any).account;
  if(actor && !['Super Admin','Administrator'].includes(actor.role) && (pushedUsers || pushedMasters || pushedCrmSlices || sliceKey === 'rolePermissions' || sliceKey === 'payrollRolePermissions' || replaceUsers || replacePayrollMasters || deletedMasterUserIds || pushedPolicy || pushedOrgMasters || pushedLoans || pushedIntegrationConfig)) {
    return res.status(403).json({success:false,message:'Administrator permission required.'});
  }
  if(pushedCrmSlices || sliceKey) {
    return res.status(409).json({success:false,message:'CRM records must use /api/state with a baseline snapshot.'});
  }

  if (Array.isArray(pushedUsers)) {
    if (replaceUsers) {
      const prevById = new Map<string, any>(
        MOCK_TABLES.users.map((u: any) => [String(u.id), u])
      );
      MOCK_TABLES.users = pushedUsers.map((u: any) =>
        stripPlaintextAndResetFlags({
          ...u,
          passwordHash: resolveRecordPasswordHash(u, prevById.get(String(u.id))),
        })
      );
    } else {
      for (const u of pushedUsers) {
        if (!u || !u.id) continue;
        const byIdIdx = MOCK_TABLES.users.findIndex((row) => String(row.id) === String(u.id));
        const byEmailIdx =
          byIdIdx < 0 && u.email
            ? MOCK_TABLES.users.findIndex(
                (row) => row.email && row.email.toLowerCase() === String(u.email).toLowerCase()
              )
            : -1;
        const idx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
        if (idx >= 0) {
          const prev = MOCK_TABLES.users[idx];
          MOCK_TABLES.users[idx] = stripPlaintextAndResetFlags({
            ...prev,
            ...u,
            id: prev.id,
            passwordHash: resolveRecordPasswordHash(u, prev),
          });
        } else {
          MOCK_TABLES.users.push(
            stripPlaintextAndResetFlags({
              ...u,
              passwordHash: resolveRecordPasswordHash(u),
            })
          );
        }
      }
    }
  }

  if (pushedMasters && typeof pushedMasters === 'object') {
    if (replacePayrollMasters) {
      // Explicit full replace (Clear All payroll data): reset tombstones too
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.isArray(deletedMasterUserIds)
        ? deletedMasterUserIds.filter((id: any) => typeof id === 'string' && id)
        : Object.keys(PERSISTED_CRM_STATE.payrollMasters || {});
      PERSISTED_CRM_STATE.payrollMasters = {};
      MOCK_TABLES.payroll_masters = [];
    }
    const existingMap = new Map<string, any>();
    if (!replacePayrollMasters) {
      for (const item of MOCK_TABLES.payroll_masters) {
        if (item && item.userId) existingMap.set(item.userId, item);
      }
    }
    const tombstones = new Set<string>([
      ...(PERSISTED_CRM_STATE.deletedPayrollMasterIds || []),
      ...(Array.isArray(deletedMasterUserIds) ? deletedMasterUserIds : []),
    ]);
    if (Array.isArray(deletedMasterUserIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.from(tombstones);
    }
    for (const m of Object.values(pushedMasters) as any[]) {
      if (!m || !m.userId || tombstones.has(m.userId)) continue;
      const byIdIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(m.userId));
      const byEmailIdx =
        byIdIdx < 0 && m.email
          ? MOCK_TABLES.users.findIndex(
              (u) => u.email && u.email.toLowerCase() === String(m.email).toLowerCase()
            )
          : -1;
      const uIdx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
      const canonicalId = uIdx >= 0 ? String(MOCK_TABLES.users[uIdx].id) : String(m.userId);
      if (canonicalId !== String(m.userId)) {
        existingMap.delete(String(m.userId));
      }
      const prevMaster = existingMap.get(canonicalId);
      const prevUser = uIdx >= 0 ? MOCK_TABLES.users[uIdx] : undefined;
      const passwordHash = resolveRecordPasswordHash(m, prevMaster, prevUser);
      const effectiveStatus =
        m.status === 'Inactive' || m.status === 'Active'
          ? m.status
          : m.employmentStatus === 'Inactive' || m.employmentStatus === 'Active'
          ? m.employmentStatus
          : prevUser?.status === 'Inactive' || prevUser?.status === 'Active'
          ? prevUser.status
          : 'Active';
      existingMap.set(
        canonicalId,
        stripPlaintextAndResetFlags({
          ...prevMaster,
          ...m,
          userId: canonicalId,
          status: effectiveStatus,
          passwordHash,
        })
      );
      if (uIdx >= 0) {
        MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
          ...MOCK_TABLES.users[uIdx],
          name: m.name || MOCK_TABLES.users[uIdx].name,
          email: m.email || MOCK_TABLES.users[uIdx].email,
          passwordHash,
          empCode: m.empCode,
        });
      } else {
        MOCK_TABLES.users.push(
          stripPlaintextAndResetFlags({
            id: canonicalId,
            name: m.name || 'Employee',
            username:
              m.username || (m.email ? m.email.split('@')[0] : m.empCode || 'employee'),
            email: m.email || '',
            passwordHash,
            accessScope: m.accessType === 'payroll_only' ? 'payroll_only' : 'all',
            accessType: m.accessType || 'payroll_only',
            empCode: m.empCode,
            phone: m.phone || '',
            role: m.role || 'Sales Executive',
            department: m.department || 'Operations',
            designation: m.designation || m.role || 'Employee',
            status: effectiveStatus,
            location: m.location || 'Mumbai HQ',
            created_at: new Date().toISOString(),
          })
        );
      }
    }
    MOCK_TABLES.payroll_masters = Array.from(existingMap.values());
    const nextMastersObj: Record<string, any> = {};
    for (const item of MOCK_TABLES.payroll_masters) {
      if (item && item.userId) nextMastersObj[item.userId] = item;
    }
    PERSISTED_CRM_STATE.payrollMasters = nextMastersObj;
  }

  if (Array.isArray(pushedLoans)) {
    const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
    const existingMap = new Map<string, any>();
    for (const ln of PERSISTED_CRM_STATE.payrollLoans || []) {
      if (ln && ln.id && !delSet.has(ln.id)) {
        existingMap.set(ln.id, ln);
      }
    }
    for (const ln of pushedLoans) {
      if (!ln || !ln.id || delSet.has(ln.id)) continue;
      const prev = existingMap.get(ln.id);
      if (!prev) {
        existingMap.set(ln.id, ln);
      } else {
        const prevAuditLen = Array.isArray(prev.auditTrail) ? prev.auditTrail.length : 0;
        const nextAuditLen = Array.isArray(ln.auditTrail) ? ln.auditTrail.length : 0;
        const prevUpdated = Number(prev.updatedAt || 0);
        const nextUpdated = Number(ln.updatedAt || 0);
        if (nextUpdated >= prevUpdated && nextAuditLen >= prevAuditLen) {
          existingMap.set(ln.id, ln);
        }
      }
    }
    PERSISTED_CRM_STATE.payrollLoans = Array.from(existingMap.values());
  }
  if (pushedPolicy && typeof pushedPolicy === 'object') {
    PERSISTED_CRM_STATE.payrollPolicy = pushedPolicy;
  }
  if (pushedOrgMasters && typeof pushedOrgMasters === 'object') {
    PERSISTED_CRM_STATE.payrollOrgMasters = pushedOrgMasters;
  }
  if (pushedAttendance && typeof pushedAttendance === 'object') {
    PERSISTED_CRM_STATE.payrollAttendance = {
      ...PERSISTED_CRM_STATE.payrollAttendance,
      ...pushedAttendance,
    };
  }
  if (pushedLeaves && typeof pushedLeaves === 'object') {
    PERSISTED_CRM_STATE.payrollLeaves = {
      ...PERSISTED_CRM_STATE.payrollLeaves,
      ...pushedLeaves,
    };
  }
  if (pushedClaims && typeof pushedClaims === 'object') {
    PERSISTED_CRM_STATE.payrollClaims = {
      ...PERSISTED_CRM_STATE.payrollClaims,
      ...pushedClaims,
    };
  }
  if (pushedStatutory && typeof pushedStatutory === 'object') {
    PERSISTED_CRM_STATE.payrollStatutory = {
      ...PERSISTED_CRM_STATE.payrollStatutory,
      ...pushedStatutory,
    };
  }
  if (pushedIntegrationConfig && typeof pushedIntegrationConfig === 'object') {
    PERSISTED_CRM_STATE.payrollIntegrationConfig = pushedIntegrationConfig;
  }
  if (pushedCrmSlices && typeof pushedCrmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices = {
      ...PERSISTED_CRM_STATE.crmSlices,
      ...pushedCrmSlices,
    };
  }
  if (typeof sliceKey === 'string' && sliceValue !== undefined) {
    PERSISTED_CRM_STATE.crmSlices[sliceKey] = sliceValue;
  }

  savePersistedStore();
  await flushStateToDatabase();
  const map: Record<string, any> = {};
  for (const item of MOCK_TABLES.payroll_masters) {
    if (item && item.userId) map[item.userId] = sanitizePayrollMasterForClient(item);
  }
  res.json({
    success: true,
    users: MOCK_TABLES.users.map(sanitizeUserForClient),
    payrollMasters: map,
    deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
  });
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedUser = MOCK_TABLES.users.find((row) => String(row.id) === String(id));
  MOCK_TABLES.users = MOCK_TABLES.users.filter((row) => String(row.id) !== String(id));

  // Deactivate payroll login for the deleted CRM user rather than leaving it active
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === 'object') {
    for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters) as Array<[string, any]>) {
      if (
        m &&
        (k === id ||
          m.userId === id ||
          (deletedUser?.email &&
            m.email &&
            String(m.email).toLowerCase() === String(deletedUser.email).toLowerCase()))
      ) {
        PERSISTED_CRM_STATE.payrollMasters[k] = {
          ...m,
          status: 'Inactive',
          syncedWithCrm: false,
        };
      }
    }
  }
  MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters || {});
  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === 'object') {
    PERSISTED_CRM_STATE.crmSlices = reconcileSnapshot({
      ...PERSISTED_CRM_STATE.crmSlices,
      users: MOCK_TABLES.users.map(sanitizeUserForClient),
    });
  }
  savePersistedStore();
  try {
    await query('DELETE FROM users WHERE id = $1', [id]);
  } catch {
    // Already removed from in-memory store
  }
  res.json({ success: true, id });
});

// COMPANY SETUP & BACKEND BRAND LOGO API
app.get('/api/company', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM company_setup LIMIT 1;');
    res.json({ company: result.rows[0] || MOCK_TABLES.company_setup[0] || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/company', async (req: Request, res: Response) => {
  const c = req.body;
  const current = MOCK_TABLES.company_setup[0] || { id: 1 };
  MOCK_TABLES.company_setup[0] = {
    ...current,
    name: c.name !== undefined ? c.name : current.name,
    legal_name: c.legalName !== undefined ? c.legalName : current.legal_name,
    gstin: c.gstin !== undefined ? c.gstin : current.gstin,
    pan: c.pan !== undefined ? c.pan : current.pan,
    city: c.city !== undefined ? c.city : current.city,
    state: c.state !== undefined ? c.state : current.state,
    state_code: c.stateCode !== undefined ? c.stateCode : current.state_code,
    address: c.address !== undefined ? c.address : current.address,
    pincode: c.pincode !== undefined ? c.pincode : current.pincode,
    phone: c.phone !== undefined ? c.phone : current.phone,
    email: c.email !== undefined ? c.email : current.email,
    website: c.website !== undefined ? c.website : current.website,
    logo_url: c.logoUrl !== undefined ? c.logoUrl : current.logo_url,
    bank_name: c.bankDetails?.bankName || c.bankName || current.bank_name,
    bank_account_no: c.bankDetails?.accountNumber || c.accountNumber || current.bank_account_no,
    bank_ifsc: c.bankDetails?.ifscCode || c.ifscCode || current.bank_ifsc,
    bank_branch: c.bankDetails?.branch || c.branch || current.bank_branch,
  };
  savePersistedStore();
  res.json({ success: true, company: MOCK_TABLES.company_setup[0] });
});

app.put('/api/company', async (req: Request, res: Response) => {
  const c = req.body;
  const current = MOCK_TABLES.company_setup[0] || { id: 1 };
  MOCK_TABLES.company_setup[0] = {
    ...current,
    name: c.name !== undefined ? c.name : current.name,
    legal_name: c.legalName !== undefined ? c.legalName : current.legal_name,
    gstin: c.gstin !== undefined ? c.gstin : current.gstin,
    pan: c.pan !== undefined ? c.pan : current.pan,
    city: c.city !== undefined ? c.city : current.city,
    state: c.state !== undefined ? c.state : current.state,
    state_code: c.stateCode !== undefined ? c.stateCode : current.state_code,
    address: c.address !== undefined ? c.address : current.address,
    pincode: c.pincode !== undefined ? c.pincode : current.pincode,
    phone: c.phone !== undefined ? c.phone : current.phone,
    email: c.email !== undefined ? c.email : current.email,
    website: c.website !== undefined ? c.website : current.website,
    logo_url: c.logoUrl !== undefined ? c.logoUrl : current.logo_url,
    bank_name: c.bankDetails?.bankName || c.bankName || current.bank_name,
    bank_account_no: c.bankDetails?.accountNumber || c.accountNumber || current.bank_account_no,
    bank_ifsc: c.bankDetails?.ifscCode || c.ifscCode || current.bank_ifsc,
    bank_branch: c.bankDetails?.branch || c.branch || current.bank_branch,
  };
  savePersistedStore();
  res.json({ success: true, company: MOCK_TABLES.company_setup[0] });
});

// LEADS
app.get('/api/leads', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM leads ORDER BY created_at DESC;');
    res.json({ leads: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', async (req: Request, res: Response) => {
  const l = req.body;
  const id = l.id || `lead-${Date.now()}`;
  try {
    await query(
      `INSERT INTO leads (
         id, lead_number, lead_date, company_name, contact_person, designation, mobile, email,
         website, address, city, state, state_code, country, pincode, lead_source, lead_type,
         industry, requirement, estimated_value, budget, expected_closing_date, rating, score,
         priority, status, lead_owner_id, lead_owner_name, is_converted, raw_data
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15, $16, $17,
         $18, $19, $20, $21, $22, $23, $24,
         $25, $26, $27, $28, $29, $30
       ) ON CONFLICT (id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         contact_person = EXCLUDED.contact_person,
         mobile = EXCLUDED.mobile,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         estimated_value = EXCLUDED.estimated_value,
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        l.leadNumber || `LEAD-${Date.now()}`,
        l.leadDate || null,
        l.companyName,
        l.contactPerson,
        l.designation || null,
        l.mobile,
        l.email || null,
        l.website || null,
        l.address || null,
        l.city || null,
        l.state || null,
        l.stateCode || null,
        l.country || 'India',
        l.pincode || null,
        l.leadSource || 'Website',
        l.leadType || 'Inbound',
        l.industry || null,
        l.requirement || null,
        l.estimatedValue || 0,
        l.budget || 0,
        l.expectedClosingDate || null,
        l.rating || 'Warm',
        l.score || 50,
        l.priority || 'Medium',
        l.status || 'New',
        l.leadOwnerId || null,
        l.leadOwnerName || null,
        Boolean(l.isConverted),
        JSON.stringify(l),
      ]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM leads WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMERS
app.get('/api/customers', async (_req: Request, res: Response) => {
  try {
    const custRes = await query('SELECT * FROM customers ORDER BY id ASC;');
    const contactsRes = await query('SELECT * FROM customer_contacts ORDER BY id ASC;');
    res.json({
      customers: custRes.rows,
      contacts: contactsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCTS
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY code ASC;');
    res.json({ products: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// INVOICES & PAYMENTS
app.get('/api/invoices', async (_req: Request, res: Response) => {
  try {
    const invRes = await query('SELECT * FROM finance_invoices ORDER BY id DESC;');
    const itemsRes = await query('SELECT * FROM finance_invoice_items ORDER BY id ASC;');
    res.json({
      invoices: invRes.rows,
      items: itemsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payments', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM finance_payments ORDER BY payment_date DESC;');
    res.json({ payments: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ORDERS & OPPORTUNITIES
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM sales_orders ORDER BY id DESC;');
    res.json({ orders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/opportunities', async (_req: Request, res: Response) => {
  try {
    const oppRes = await query('SELECT * FROM opportunities ORDER BY id DESC;');
    const milRes = await query('SELECT * FROM opportunity_payment_milestones ORDER BY id ASC;');
    res.json({
      opportunities: oppRes.rows,
      milestones: milRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ACTIVITIES
app.get('/api/activities', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM activities ORDER BY id DESC;');
    res.json({ activities: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AUDIT LOGS
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;');
    if (result.rows && result.rows.length > 0) {
      return res.json({ logs: result.rows });
    }
    const stateLogs = PERSISTED_CRM_STATE.crmSlices?.auditLogs || MOCK_TABLES.audit_logs || [];
    res.json({ logs: stateLogs });
  } catch (err: any) {
    const stateLogs = PERSISTED_CRM_STATE.crmSlices?.auditLogs || MOCK_TABLES.audit_logs || [];
    res.json({ logs: stateLogs });
  }
});

app.post('/api/audit-logs', async (req: Request, res: Response) => {
  const { action, entityType, entityId, details, userName, userId } = req.body;
  try {
    const id = `aud-${Date.now()}`;
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_name, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, action, entityType, entityId || null, details || '', userName || null, userId || null]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OUTLOOK EMAIL NOTIFICATIONS RELAY (Microsoft Entra ID Enact360 + Office 365 SMTP)
app.get('/api/notifications/email-config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: MOCK_TABLES.outlook_app_config[0],
  });
});

app.post('/api/notifications/email-config', (req: Request, res: Response) => {
  const body = req.body || {};
  const current = MOCK_TABLES.outlook_app_config[0] || {};
  const updated = {
    ...current,
    display_name: body.appDisplayName || body.display_name || current.display_name || 'Enact360',
    client_id:
      body.clientId ||
      body.client_id ||
      current.client_id ||
      'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
    object_id:
      body.objectId ||
      body.object_id ||
      current.object_id ||
      'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
    tenant_id:
      body.tenantId ||
      body.tenant_id ||
      current.tenant_id ||
      'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
    supported_account_types:
      body.supportedAccountTypes ||
      body.supported_account_types ||
      current.supported_account_types ||
      'My organization only',
    redirect_uris:
      body.redirectUriConfig ||
      body.redirect_uris ||
      current.redirect_uris ||
      '1 web, 0 spa, 0 public client',
    managed_application:
      body.managedApplication ||
      body.managed_application ||
      current.managed_application ||
      'Enact360',
    state: body.appState || body.state || current.state || 'Activated',
    outlook_email: body.outlookEmail || current.outlook_email || 'shalv.sharma@coreenact.com',
    cc_emails: body.ccEmails ?? current.cc_emails ?? '',
    smtp_host: body.smtpHost || current.smtp_host || 'smtp.office365.com',
    smtp_port: Number(body.smtpPort || current.smtp_port || 587),
    updated_at: new Date().toISOString(),
  };
  MOCK_TABLES.outlook_app_config[0] = updated;
  savePersistedStore();
  res.json({ success: true, config: updated });
});

app.get('/api/auth/outlook/url', (req: Request, res: Response) => {
  const clientId = (process.env.OUTLOOK_CLIENT_ID || '').trim();
  const tenantId = (process.env.OUTLOOK_TENANT_ID || '').trim();
  const clientSecret = (process.env.OUTLOOK_CLIENT_SECRET || '').trim();
  if (!clientId || !tenantId || !clientSecret) {
    return res.status(503).json({
      error: 'Microsoft Entra OAuth is not configured on the server.',
    });
  }
  const cfg = MOCK_TABLES.outlook_app_config[0] || {};
  const origin =
    (req.query.origin as string) ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `${req.protocol}://${req.get('host')}`);
  const redirectUri = `${origin.replace(/\/$/, '')}/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email offline_access https://graph.microsoft.com/Mail.Send',
  });
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({
    url,
    clientId,
    tenantId,
    objectId: cfg.object_id || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
    displayName: cfg.display_name || 'Enact360',
    redirectUri,
  });
});

app.get(['/auth/callback', '/auth/callback/'], (req: Request, res: Response) => {
  const code = String(req.query?.code || '').trim();
  const clientSecret = (process.env.OUTLOOK_CLIENT_SECRET || '').trim();
  if (!clientSecret || !code || code === 'invalid') {
    return res.status(400).json({
      success: false,
      error: 'Unverified OAuth callback or missing server OAuth configuration.',
    });
  }
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 24px; text-align: center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'microsoft_entra_enact360' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Enact360 Microsoft Outlook authentication completed. Closing window...</p>
      </body>
    </html>
  `);
});

app.get('/api/notifications/email-log', (_req: Request, res: Response) => {
  res.json({
    success: true,
    smtpConfigured: Boolean(process.env.OUTLOOK_EMAIL_USER && process.env.OUTLOOK_EMAIL_PASS),
    smtpHost: process.env.OUTLOOK_SMTP_HOST || 'smtp.office365.com',
    smtpPort: Number(process.env.OUTLOOK_SMTP_PORT || 587),
    appConfig: MOCK_TABLES.outlook_app_config[0],
    logs: MOCK_TABLES.email_notifications.slice(0, 100),
  });
});

app.post('/api/notifications/email', async (req: Request, res: Response) => {
  const {
    to,
    cc,
    subject,
    title,
    message,
    type = 'SYSTEM',
    senderName = process.env.OUTLOOK_FROM_NAME || 'Enact360 CRM',
    smtpHost = process.env.OUTLOOK_SMTP_HOST || 'smtp.office365.com',
    smtpPort = Number(process.env.OUTLOOK_SMTP_PORT || 587),
    appDisplayName = 'Enact360',
    clientId = 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
    objectId = 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
    tenantId = 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
  } = req.body || {};

  const recipient = (to || process.env.OUTLOOK_EMAIL_USER || 'shalv.sharma@coreenact.com').trim();
  const emailSubject = subject || `[${appDisplayName} CRM · ${type}] ${title || 'System Notification'}`;
  const sentAt = new Date().toISOString();

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(90deg, #0f172a 0%, #1f7e9e 100%); padding: 16px 22px; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #bae6fd; font-weight: 700;">
          ${appDisplayName} • Microsoft Outlook Notification • ${type}
        </div>
        <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800;">${title || emailSubject}</h2>
      </div>
      <div style="padding: 20px 22px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 14px 0;">${message || ''}</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #475569;">
          <div><strong>Recipient (Outlook):</strong> ${recipient}</div>
          ${cc ? `<div><strong>CC:</strong> ${cc}</div>` : ''}
          <div><strong>Entra App (Client ID):</strong> ${appDisplayName} (${clientId})</div>
          <div><strong>Directory (Tenant ID):</strong> ${tenantId}</div>
          <div><strong>Dispatched Via:</strong> ${smtpHost}:${smtpPort} (STARTTLS)</div>
          <div><strong>Timestamp:</strong> ${new Date(sentAt).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 12px 22px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Automated CRM Notification from <strong>${senderName}</strong> • Object ID: ${objectId}
      </div>
    </div>
  `;

  let deliveryMode: 'smtp' | 'unconfigured' = 'unconfigured';
  let smtpError: string | null = null;
  let sentSuccess = false;

  if (process.env.OUTLOOK_EMAIL_USER && process.env.OUTLOOK_EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: Number(smtpPort) === 465,
        requireTLS: true,
        auth: {
          user: process.env.OUTLOOK_EMAIL_USER,
          pass: process.env.OUTLOOK_EMAIL_PASS,
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: `"${senderName}" <${process.env.OUTLOOK_EMAIL_USER}>`,
        to: recipient,
        cc: cc || undefined,
        subject: emailSubject,
        text: `${title || emailSubject}\n\n${message || ''}`,
        html: htmlBody,
      });
      deliveryMode = 'smtp';
      sentSuccess = true;
    } catch (err: any) {
      smtpError = err?.message || 'SMTP connection failed';
    }
  } else {
    smtpError = 'OUTLOOK_EMAIL_USER and OUTLOOK_EMAIL_PASS are not configured on the server.';
  }

  const logEntry = {
    id: `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to: recipient,
    cc: cc || '',
    subject: emailSubject,
    title: title || emailSubject,
    message: message || '',
    type,
    smtpHost,
    smtpPort,
    deliveryMode,
    status: sentSuccess ? 'Sent via Outlook' : 'Failed',
    smtpError,
    sentAt,
  };

  MOCK_TABLES.email_notifications.unshift(logEntry);

  res.status(sentSuccess ? 200 : 503).json({
    success: sentSuccess,
    emailLog: logEntry,
  });
});

// ============================================================================
// Google Maps Platform Server-Side Geocoding & Reverse Geocoding Proxy Routes
// ============================================================================

const getGoogleMapsApiKey = (): string => {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
};

async function fetchWithRetry(url: string, maxAttempts = 3): Promise<globalThis.Response> {
  let lastRes: globalThis.Response | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url);
    lastRes = res;
    if (res.status !== 500 && res.status !== 503 && res.status !== 504) {
      return res;
    }
    const baseDelayMs = 500 * Math.pow(1.5, attempt - 1);
    const jitteredDelayMs = baseDelayMs * (Math.random() + 0.5);
    await new Promise((r) => setTimeout(r, jitteredDelayMs));
  }
  return lastRes!;
}

app.get('/api/maps/config', (_req: Request, res: Response) => {
  const apiKey = getGoogleMapsApiKey();
  res.json({
    apiKey,
    configured: Boolean(apiKey),
  });
});

const CITY_COORDINATES_LOOKUP: Array<{ keywords: string[]; lat: number; lng: number; address: string }> = [
  { keywords: ['mumbai', 'nariman', 'bandra', 'andheri', 'maharashtra'], lat: 18.9256, lng: 72.8242, address: 'Nariman Point, Mumbai, Maharashtra 400021, India' },
  { keywords: ['delhi', 'connaught', 'nehru place', 'okhla'], lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi, Delhi 110001, India' },
  { keywords: ['gurugram', 'gurgaon', 'cyber city'], lat: 28.495, lng: 77.0895, address: 'DLF Cyber City, Gurugram, Haryana 122002, India' },
  { keywords: ['noida', 'sector 62', 'sector 18'], lat: 28.628, lng: 77.3649, address: 'Sector 62, Noida, Uttar Pradesh 201309, India' },
  { keywords: ['bengaluru', 'bangalore', 'whitefield', 'koramangala', 'karnataka'], lat: 12.9716, lng: 77.5946, address: 'MG Road, Bengaluru, Karnataka 560001, India' },
  { keywords: ['pune', 'hinjewadi', 'kharadi'], lat: 18.5204, lng: 73.8567, address: 'Shivajinagar, Pune, Maharashtra 411005, India' },
  { keywords: ['hyderabad', 'hitec', 'gachibowli', 'telangana'], lat: 17.4435, lng: 78.3772, address: 'HITEC City, Hyderabad, Telangana 500081, India' },
  { keywords: ['chennai', 'guindy', 'omr', 'tamil nadu'], lat: 13.0827, lng: 80.2707, address: 'Anna Salai, Chennai, Tamil Nadu 600002, India' },
  { keywords: ['kolkata', 'salt lake', 'park street', 'west bengal'], lat: 22.5726, lng: 88.3639, address: 'Park Street, Kolkata, West Bengal 700016, India' },
  { keywords: ['ahmedabad', 'gift city', 'gujarat'], lat: 23.0225, lng: 72.5714, address: 'SG Highway, Ahmedabad, Gujarat 380054, India' },
  { keywords: ['jaipur', 'rajasthan'], lat: 26.9124, lng: 75.7873, address: 'C-Scheme, Jaipur, Rajasthan 302001, India' },
];

app.get('/api/maps/reverse-geocode', async (req: Request, res: Response) => {
  const lat = parseFloat(String(req.query.lat ?? ''));
  const lng = parseFloat(String(req.query.lng ?? ''));
  const apiKey = getGoogleMapsApiKey();

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      error: 'Valid lat and lng query parameters are required.',
    });
  }

  // 1. Try Google Maps Geocoding API if configured
  if (apiKey) {
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(
        apiKey
      )}&solution_id=gmp_mcp_codeassist_v1_aistudio`;

      const response = await fetchWithRetry(geocodeUrl, 2);
      if (response.ok) {
        const data: any = await response.json();
        if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
          const topResult = data.results[0];
          return res.json({
            status: 'OK',
            lat,
            lng,
            formattedAddress: topResult.formatted_address,
            placeId: topResult.place_id || '',
            plusCode:
              topResult.plus_code?.compound_code ||
              data.plus_code?.compound_code ||
              topResult.plus_code?.global_code ||
              data.plus_code?.global_code ||
              '',
            types: topResult.types || [],
          });
        }
      }
    } catch {
      // Fall through to free reverse geocoders
    }
  }

  // 2. Fallback to BigDataCloud Reverse Geocoding (no API key required)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdc: any = await bdcRes.json();
      const parts = [
        bdc.locality,
        bdc.city && bdc.city !== bdc.locality ? bdc.city : '',
        bdc.principalSubdivision,
        bdc.postcode,
        bdc.countryName,
      ].filter(Boolean);
      if (parts.length > 0) {
        return res.json({
          status: 'OK',
          lat,
          lng,
          formattedAddress: parts.join(', '),
          placeId: '',
          plusCode: '',
        });
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  // 3. Fallback to OpenStreetMap Nominatim Reverse Geocoding
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'Enact360-CRM-Payroll-ESS/1.0' },
    });
    if (nomRes.ok) {
      const nom: any = await nomRes.json();
      if (nom?.display_name) {
        return res.json({
          status: 'OK',
          lat,
          lng,
          formattedAddress: nom.display_name,
          placeId: String(nom.place_id || ''),
          plusCode: '',
        });
      }
    }
  } catch {
    // Fall through to coordinates format
  }

  return res.json({
    status: 'OK',
    lat,
    lng,
    formattedAddress: `Verified GPS Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    placeId: '',
    plusCode: '',
  });
});

app.get('/api/maps/geocode', async (req: Request, res: Response) => {
  const address = String(req.query.address ?? '').trim();
  const apiKey = getGoogleMapsApiKey();

  if (!address) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      error: 'Address query parameter is required.',
    });
  }

  // 1. Try Google Maps Geocoding API if configured
  if (apiKey) {
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${encodeURIComponent(apiKey)}&solution_id=gmp_mcp_codeassist_v1_aistudio`;

      const response = await fetchWithRetry(geocodeUrl, 2);
      if (response.ok) {
        const data: any = await response.json();
        if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
          const topResult = data.results[0];
          const loc = topResult.geometry?.location || { lat: 28.6139, lng: 77.209 };
          return res.json({
            status: 'OK',
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: topResult.formatted_address,
            placeId: topResult.place_id || '',
            plusCode:
              topResult.plus_code?.compound_code ||
              data.plus_code?.compound_code ||
              topResult.plus_code?.global_code ||
              data.plus_code?.global_code ||
              '',
          });
        }
      }
    } catch {
      // Fall through to Nominatim / city lookup
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim Search
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      address
    )}&limit=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'Enact360-CRM-Payroll-ESS/1.0' },
    });
    if (nomRes.ok) {
      const results: any = await nomRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const top = results[0];
        const parsedLat = parseFloat(top.lat);
        const parsedLng = parseFloat(top.lon);
        if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
          return res.json({
            status: 'OK',
            lat: parsedLat,
            lng: parsedLng,
            formattedAddress: top.display_name || address,
            placeId: String(top.place_id || ''),
            plusCode: '',
          });
        }
      }
    }
  } catch {
    // Fall through to city coordinates lookup
  }

  // 3. Deterministic Indian corporate hub lookup so geocoding never fails offline
  const lower = address.toLowerCase();
  const matched =
    CITY_COORDINATES_LOOKUP.find((c) => c.keywords.some((k) => lower.includes(k))) ||
    CITY_COORDINATES_LOOKUP[0];

  return res.json({
    status: 'OK',
    lat: matched.lat,
    lng: matched.lng,
    formattedAddress: address.length > 5 ? `${address} (${matched.address})` : matched.address,
    placeId: '',
    plusCode: '',
  });
});

// FULL STATE SYNC PULL
app.get('/api/sync/pull', async (req: Request, res: Response) => {
  try {
    const actor = (req as any).account;
    const isAdmin = !actor || ['Super Admin', 'Administrator'].includes(actor.role);
    const isPayrollRestricted =
      !isAdmin &&
      Boolean(
        actor?.accessScope === 'payroll_only' || actor?.accessType === 'payroll_only'
      );

    const [
      usersRes,
      leadsRes,
      custRes,
      contactsRes,
      prodRes,
      invRes,
      invItemsRes,
      payRes,
      orderRes,
      oppRes,
      milestoneRes,
      actRes,
      companyRes,
    ] = await Promise.all([
      query('SELECT * FROM users ORDER BY created_at ASC;'),
      query('SELECT * FROM leads ORDER BY created_at DESC;'),
      query('SELECT * FROM customers ORDER BY id ASC;'),
      query('SELECT * FROM customer_contacts ORDER BY id ASC;'),
      query('SELECT * FROM products ORDER BY code ASC;'),
      query('SELECT * FROM finance_invoices ORDER BY id DESC;'),
      query('SELECT * FROM finance_invoice_items ORDER BY id ASC;'),
      query('SELECT * FROM finance_payments ORDER BY payment_date DESC;'),
      query('SELECT * FROM sales_orders ORDER BY id DESC;'),
      query('SELECT * FROM opportunities ORDER BY id DESC;'),
      query('SELECT * FROM opportunity_payment_milestones ORDER BY id ASC;'),
      query('SELECT * FROM activities ORDER BY id DESC;'),
      query('SELECT * FROM company_setup LIMIT 1;'),
    ]);

    const payrollMastersMap: Record<string, any> = {
      ...(PERSISTED_CRM_STATE.payrollMasters || {}),
    };
    for (const item of MOCK_TABLES.payroll_masters) {
      if (item && item.userId) {
        payrollMastersMap[item.userId] = item;
      }
    }

    const allSanitizedUsers = mergeUsersWithMemory(usersRes.rows).map(sanitizeUserForClient);
    const allSanitizedMasters = sanitizePayrollMastersMapForClient(payrollMastersMap);

    // Non-admin employees only receive their own payroll master, attendance, leaves, claims, statutory, and loan records
    const visibleMasters = isAdmin
      ? allSanitizedMasters
      : Object.fromEntries(
          Object.entries(allSanitizedMasters).filter(([k, m]: [string, any]) => {
            if (!m || !actor?.id) return false;
            const actorEmail = actor.email ? String(actor.email).trim().toLowerCase() : '';
            const mEmail = m.email ? String(m.email).trim().toLowerCase() : '';
            return (
              String(k) === String(actor.id) ||
              String(m.userId) === String(actor.id) ||
              (actorEmail && mEmail === actorEmail)
            );
          })
        );

    const visibleLoans = isAdmin
      ? PERSISTED_CRM_STATE.payrollLoans || []
      : (PERSISTED_CRM_STATE.payrollLoans || []).filter(
          (l: any) => actor?.id && String(l?.employeeId) === String(actor.id)
        );

    const filterOwnSlice = (sliceObj: Record<string, any> | undefined) => {
      if (isAdmin) return sliceObj || {};
      if (!sliceObj || !actor?.id) return {};
      return sliceObj[actor.id] !== undefined ? { [actor.id]: sliceObj[actor.id] } : {};
    };

    res.json({
      success: true,
      data: {
        users: isPayrollRestricted
          ? allSanitizedUsers.filter((u: any) => String(u.id) === String(actor.id))
          : allSanitizedUsers,
        payrollMasters: visibleMasters,
        deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
        payrollLoans: visibleLoans,
        deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
        payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy || null,
        payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters || null,
        payrollAttendance: filterOwnSlice(PERSISTED_CRM_STATE.payrollAttendance),
        payrollLeaves: filterOwnSlice(PERSISTED_CRM_STATE.payrollLeaves),
        payrollClaims: filterOwnSlice(PERSISTED_CRM_STATE.payrollClaims),
        payrollStatutory: filterOwnSlice(PERSISTED_CRM_STATE.payrollStatutory),
        payrollIntegrationConfig: isAdmin
          ? PERSISTED_CRM_STATE.payrollIntegrationConfig || null
          : null,
        crmSlices: isPayrollRestricted ? {} : PERSISTED_CRM_STATE.crmSlices || {},
        leads: isPayrollRestricted ? [] : leadsRes.rows,
        customers: isPayrollRestricted ? [] : custRes.rows,
        contacts: isPayrollRestricted ? [] : contactsRes.rows,
        products: isPayrollRestricted ? [] : prodRes.rows,
        invoices: isPayrollRestricted ? [] : invRes.rows,
        invoiceItems: isPayrollRestricted ? [] : invItemsRes.rows,
        payments: isPayrollRestricted ? [] : payRes.rows,
        orders: isPayrollRestricted ? [] : orderRes.rows,
        opportunities: isPayrollRestricted ? [] : oppRes.rows,
        milestones: isPayrollRestricted ? [] : milestoneRes.rows,
        activities: isPayrollRestricted ? [] : actRes.rows,
        companySetup: companyRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// AI assistant, insights and drafting (provider-agnostic; cleanly disabled when no key)
// ============================================================================

function isPrivilegedActor(account: any): boolean {
  return ['Super Admin','Administrator','Sales Manager','Finance Manager','Management/Viewer'].includes(account?.role);
}

/** Compact, read-only summary of the business, used to ground AI answers in live data. */
function buildAiBusinessContext(account: any) {
  const s: any = getCurrentSnapshot();
  const today = new Date().toISOString().split('T')[0];
  const money = (n: any) => Math.round(Number(n) || 0);
  const isOpen = (status: any) => !['Cancelled','Completed','Closed'].includes(String(status));

  const invoices = Array.isArray(s.invoices) ? s.invoices : [];
  const taxInvoices = invoices.filter((i: any) => (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled');
  const payments = Array.isArray(s.payments) ? s.payments : [];
  const orders = Array.isArray(s.orders) ? s.orders : [];
  const milestones = Array.isArray(s.milestones) ? s.milestones : [];
  const leads = Array.isArray(s.leads) ? s.leads : [];
  const customers = Array.isArray(s.customers) ? s.customers : [];

  const overdue = taxInvoices.filter((i: any) => money(i.balanceAmount) > 0 && String(i.dueDate) < today);
  const totalBilled = taxInvoices.reduce((a: number, i: any) => a + money(i.grandTotal), 0);
  const totalCollected = payments.reduce((a: number, p: any) => a + money(p.amount), 0);
  const totalOutstanding = taxInvoices.reduce((a: number, i: any) => a + money(i.balanceAmount), 0);
  const overdueAmount = overdue.reduce((a: number, i: any) => a + money(i.balanceAmount), 0);
  const openOrders = orders.filter((o: any) => isOpen(o.status));
  const openPipeline = openOrders.reduce((a: number, o: any) => a + money(o.grandTotal), 0);
  const pendingMilestones = milestones.filter((m: any) => money(m.amount) - money(m.paidAmount) > 0).length;

  const byCustomer = new Map<string, number>();
  for (const i of overdue) {
    const key = i.customerName || i.customerId || 'Unknown';
    byCustomer.set(key, (byCustomer.get(key) || 0) + money(i.balanceAmount));
  }
  const topOverdue = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines = [
    `Reporting date: ${today}`,
    `Customers: ${customers.length}`,
    `Leads: ${leads.length}`,
    `Open sales orders: ${openOrders.length}`,
    `Open sales order value (INR): ${openPipeline}`,
    `Tax invoices: ${taxInvoices.length}`,
    `Total billed (tax invoices, INR): ${totalBilled}`,
    `Total collected (INR): ${totalCollected}`,
    `Total outstanding receivable (INR): ${totalOutstanding}`,
    `Overdue invoices: ${overdue.length}`,
    `Overdue receivable (INR): ${overdueAmount}`,
    `Milestones: ${milestones.length} (with pending balance: ${pendingMilestones})`,
  ];
  // Customer names only for roles that already see the whole book of business.
  if (isPrivilegedActor(account) && topOverdue.length) {
    lines.push('Top overdue customers (name: INR): ' + topOverdue.map(([n, v]) => `${n}: ${v}`).join('; '));
  }

  return {
    text: lines.join('\n'),
    metrics: {
      totalBilled, totalCollected, totalOutstanding, overdueAmount, overdueCount: overdue.length,
      openPipeline, customers: customers.length, leads: leads.length, taxInvoices: taxInvoices.length,
    },
  };
}

app.get('/api/ai/status', (_req: Request, res: Response) => {
  const c = aiConfig();
  res.json({ success: true, configured: isAiConfigured(), provider: c.provider || null, model: c.model || null });
});

app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ success: false, configured: false, message: 'AI is not configured on this server. Set AI_PROVIDER and AI_API_KEY to enable it.' });
  }
  const account = (req as any).account;
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = rawMessages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
  if (!messages.length) return res.status(400).json({ success: false, message: 'A message is required.' });

  const ctx = buildAiBusinessContext(account);
  const system =
    `You are the Enact360 CRM assistant for ${account?.name || 'a user'} (role: ${account?.role || 'unknown'}). ` +
    `Answer questions about leads, opportunities, customers, sales orders, invoices, GST, payments, collections and the customer ledger ` +
    `using ONLY the live business summary below. Be concise and practical. If the summary does not contain the answer, say so and ` +
    `suggest which screen to check. Never invent figures. Amounts are in Indian Rupees (INR).\n\nLIVE BUSINESS SUMMARY:\n${ctx.text}`;
  const result = await aiChat(system, messages as any, { maxTokens: 900 });
  if (!result.ok) return res.status(502).json({ success: false, configured: true, message: result.error || 'The AI provider is unavailable.' });
  res.json({ success: true, answer: result.text, provider: result.provider, model: result.model, metrics: ctx.metrics });
});

app.post('/api/ai/insights', async (req: Request, res: Response) => {
  const account = (req as any).account;
  const ctx = buildAiBusinessContext(account);
  if (!isAiConfigured()) {
    return res.status(503).json({ success: false, configured: false, message: 'AI is not configured on this server.', metrics: ctx.metrics });
  }
  const system =
    `You are a financial and sales analyst for a company using the Enact360 CRM. Using ONLY the metrics below, produce 3 to 5 short, ` +
    `specific, actionable insights or risks (collections, overdue receivables, pipeline, customer concentration). One sentence each, ` +
    `plain text, no preamble, no markdown. Amounts are INR.\n\nMETRICS:\n${ctx.text}`;
  const result = await aiChat(system, [{ role: 'user', content: 'Generate the insights.' }], { maxTokens: 700 });
  if (!result.ok) return res.status(502).json({ success: false, configured: true, metrics: ctx.metrics, message: result.error || 'The AI provider is unavailable.' });
  res.json({ success: true, insights: result.text, metrics: ctx.metrics, provider: result.provider, model: result.model });
});

app.post('/api/ai/draft', async (req: Request, res: Response) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ success: false, configured: false, message: 'AI is not configured on this server.' });
  }
  const account = (req as any).account;
  const kind = String(req.body?.kind || 'follow_up').slice(0, 40).replace(/[^a-z_ ]/gi, '');
  const about = String(req.body?.about || '').slice(0, 600);
  const recipient = String(req.body?.recipient || '').slice(0, 120);
  if (!about.trim() && !recipient.trim()) return res.status(400).json({ success: false, message: 'Provide a recipient or a short brief.' });

  const ctx = buildAiBusinessContext(account);
  const system =
    `You are a professional business-writing assistant for ${account?.name || 'a user'} at a company using the Enact360 CRM. ` +
    `Draft a concise, polite ${kind.replace(/_/g, ' ')} email. Return ONLY the email with a Subject line and body. ` +
    `Do not invent facts about the recipient.\n\nLIVE BUSINESS SUMMARY (context only):\n${ctx.text}`;
  const result = await aiChat(system, [{ role: 'user', content: `Recipient: ${recipient || '(unspecified)'}\nBrief: ${about || '(none provided)'}` }], { maxTokens: 700 });
  if (!result.ok) return res.status(502).json({ success: false, configured: true, message: result.error || 'The AI provider is unavailable.' });
  res.json({ success: true, draft: result.text, provider: result.provider, model: result.model });
});

app.use('/api', (_req, res) => res.status(404).json({success:false,message:'API endpoint not found.'}));
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Enact360 request failed:', error?.message || 'Unknown error');
  if (res.headersSent) return res.end();
  res.status(error?.status === 400 ? 400 : 500).json({success:false,message:error?.status === 400 ? 'Invalid request body.' : 'The server could not process this request. See Vercel Runtime Logs.'});
});

// ============================================================================
// Frontend Integration (Vite Middleware in Dev, Static in Production)
// ============================================================================

async function startServer() {
  // On serverless (Vercel/Lambda) we must never bind a port or serve statics:
  // the platform routes requests straight into the exported Express app handler
  // and serves the Vite build from its own CDN. Binding a port crashes the
  // function with FUNCTION_INVOCATION_FAILED.
  if (process.env.CRM_SERVERLESS === 'true' || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }

  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Enact360 Full-Stack Server running on http://0.0.0.0:${port}`);
    console.log(`Live PostgreSQL Target: Render (postgresqlcrm_go7i)`);
  });
}

// Resolves once the durable store has been hydrated from Postgres (or immediately
// in test mode). Serverless handlers await this so the first request never reads
// a half-loaded store.
export const serverReady: Promise<void> =
  process.env.CRM_TEST_MODE !== 'true'
    ? startServer().catch((err) => {
        console.error('Fatal server startup error:', err);
        if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
          process.exit(1);
        }
      })
    : Promise.resolve();
