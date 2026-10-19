#!/usr/bin/env node
/**
 * Enact360 CRM - ensure the admin account.
 *
 * Guarantees that an administrator can sign in with a known email + password,
 * even if the stored hash was changed. It upserts the admin user into BOTH the
 * normalized `users` table and the legacy `crm_state_store` blob, and keeps the
 * linked payroll master in step.
 *
 * Defaults:  admin@coreenact.com  /  CoreEnact@2026#
 *
 * Usage:
 *   DATABASE_URL=postgres://... node ensure-admin.mjs
 *   DATABASE_URL=postgres://... node ensure-admin.mjs --email you@x.com --password 'Secret123'
 *   DATABASE_URL=postgres://... node ensure-admin.mjs --dry-run
 *
 * Idempotent: safe to re-run. Prints what it changed.
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const EMAIL = opt('--email', 'admin@coreenact.com').trim();
const PASSWORD = opt('--password', 'CoreEnact@2026#');
const DRY = args.includes('--dry-run');

const ADMIN_ID = 'usr-1';
const ADMIN_NAME = 'Admin';
const ADMIN_USERNAME = 'admin';
const ADMIN_ROLE = 'Super Admin';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL is not set.'); process.exit(2); }
  const ssl = /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });
  await client.connect();

  // Same cost as the server's hashPassword().
  const hash = bcrypt.hashSync(PASSWORD, 8);
  console.log(`Target admin: ${ADMIN_USERNAME} / ${EMAIL}  (id ${ADMIN_ID}, role ${ADMIN_ROLE})`);
  console.log(`Password: ${'*'.repeat(PASSWORD.length)} (${PASSWORD.length} chars) -> bcrypt hash ${hash.slice(0, 20)}...`);
  if (DRY) console.log('DRY RUN — nothing written.');

  const hasTable = async (t) =>
    (await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`, [t])).rowCount > 0;

  await client.query('BEGIN');
  try {
    // 1. Normalized users table
    if (await hasTable('users')) {
      await client.query(
        `INSERT INTO users (id, name, username, email, role, department, status, password_hash, access_scope, access_type)
         VALUES ($1,$2,$3,$4,$5,$6,'Active',$7,NULL,NULL)
         ON CONFLICT (id) DO UPDATE SET
           name=EXCLUDED.name, username=EXCLUDED.username, email=EXCLUDED.email,
           role=EXCLUDED.role, department=EXCLUDED.department, status='Active',
           password_hash=EXCLUDED.password_hash`,
        [ADMIN_ID, ADMIN_NAME, ADMIN_USERNAME, EMAIL, ADMIN_ROLE, 'Executive', hash]
      );
      console.log('users table: admin upserted.');
    } else {
      console.log('users table: not present (schema not applied) — skipping.');
    }

    // 2. Payroll master linked to the admin (keeps CRM + payroll passwords in step)
    if (await hasTable('payroll_masters')) {
      const pm = await client.query(`SELECT id FROM payroll_masters WHERE id=$1 OR user_id=$1 LIMIT 1`, [ADMIN_ID]);
      if (pm.rowCount > 0) {
        await client.query(
          `UPDATE payroll_masters
              SET status='Active',
                  data = jsonb_set(jsonb_set(coalesce(data,'{}'::jsonb), '{passwordHash}', to_jsonb($2::text)), '{status}', to_jsonb('Active'::text))
            WHERE id=$1 OR user_id=$1`,
          [ADMIN_ID, hash]
        );
        console.log('payroll_masters: admin password synced.');
      }
    }

    // 3. Legacy JSON blob
    if (await hasTable('crm_state_store')) {
      const row = (await client.query(`SELECT payload FROM crm_state_store WHERE id='app' FOR UPDATE`)).rows[0];
      if (row) {
        const obj = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        const apply = (u) => ({
          ...u, id: ADMIN_ID, name: ADMIN_NAME, username: ADMIN_USERNAME, email: EMAIL,
          role: ADMIN_ROLE, department: u.department || 'Executive', status: 'Active',
          passwordHash: hash,
        });
        const users = Array.isArray(obj.users) ? obj.users : [];
        const idx = users.findIndex((u) => String(u?.id) === ADMIN_ID || String(u?.username).toLowerCase() === ADMIN_USERNAME);
        if (idx >= 0) users[idx] = apply(users[idx]); else users.unshift(apply({}));
        obj.users = users;

        if (obj.crmSlices && Array.isArray(obj.crmSlices.users)) {
          const cu = obj.crmSlices.users;
          const ci = cu.findIndex((u) => String(u?.id) === ADMIN_ID);
          const sanitized = { id: ADMIN_ID, name: ADMIN_NAME, username: ADMIN_USERNAME, email: EMAIL, role: ADMIN_ROLE, department: 'Executive', status: 'Active' };
          if (ci >= 0) cu[ci] = { ...cu[ci], ...sanitized }; else cu.unshift(sanitized);
        }
        if (obj.payrollMasters && obj.payrollMasters[ADMIN_ID]) {
          obj.payrollMasters[ADMIN_ID] = { ...obj.payrollMasters[ADMIN_ID], passwordHash: hash, status: 'Active' };
        }
        await client.query(`UPDATE crm_state_store SET payload=$1, updated_at=NOW() WHERE id='app'`, [JSON.stringify(obj)]);
        console.log('crm_state_store blob: admin synced.');
      } else {
        console.log('crm_state_store: no app row — skipping.');
      }
    }

    if (DRY) { await client.query('ROLLBACK'); console.log('\nDry run complete (rolled back).'); }
    else { await client.query('COMMIT'); console.log('\nDone. Sign in with ' + EMAIL + ' and the password above.'); }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed, rolled back:', err.message);
    await client.end();
    process.exit(1);
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
