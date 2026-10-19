import type { RequestHandler } from 'express';
import type { Pool, PoolClient } from 'pg';
import { loadSnapshotFromDb, buildRows, applyRowDiff } from './relationalStore.ts';
import { SCHEMA_SQL } from './schema.ts';

type Hooks = { capture: () => any; restore: (state: any) => void; setWriter: (writer: (() => void) | null) => void };

/**
 * Relational durable store.
 *
 * Same contract as the previous single-JSON-blob middleware: each /api request
 * runs inside one transaction, under a cross-instance advisory lock, with the
 * shared in-memory state hydrated before the handler runs and flushed before the
 * response is sent. The difference is *where* the state lives: instead of one row
 * in crm_state_store, the snapshot is read from and written to the normalized
 * tables created by schema.sql.
 *
 * A response is sent only after its state transaction has committed.
 */

// The DDL is idempotent (CREATE TABLE/INDEX IF NOT EXISTS). Apply it once per
// process; every later request skips straight to the data.
//
// schema.sql wraps the DDL in BEGIN;/COMMIT; for standalone use. The runtime runs
// it INSIDE the request's transaction, where that inner COMMIT would end the
// transaction early and release the advisory lock - so those two lines are
// stripped from the runtime copy here.
const RUNTIME_SCHEMA = SCHEMA_SQL.replace(/^\s*(?:BEGIN|COMMIT);\s*$/gm, '');
let schemaApplied = false;

async function ensureSchema(client: PoolClient): Promise<void> {
  if (schemaApplied) return;
  await client.query('SAVEPOINT enact_schema_check');
  try {
    const res = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_settings'"
    );
    await client.query('RELEASE SAVEPOINT enact_schema_check');
    if (res.rows.length > 0) {
      schemaApplied = true;
      return;
    }
  } catch {
    try { await client.query('ROLLBACK TO SAVEPOINT enact_schema_check'); } catch {}
  }

  await applySchema(client);
  schemaApplied = true;
}

/**
 * Apply the DDL statement by statement. Each statement runs in its own savepoint,
 * preventing any single failed statement from aborting the parent transaction.
 */
async function applySchema(client: PoolClient): Promise<void> {
  const statements = RUNTIME_SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await client.query('SAVEPOINT enact_stmt');
    try {
      await client.query(stmt);
      await client.query('RELEASE SAVEPOINT enact_stmt');
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT enact_stmt');
      console.warn('[relational-store] skipped schema statement:', err instanceof Error ? err.message : err);
    }
  }
}

/** Turn a raw database error into a short, non-sensitive hint the operator can act on. */
function classifyDbError(err: unknown): string {
  const e = err as any;
  const code = String(e?.code || '');
  const msg = String(e?.message || e || '');
  if (code === 'ENOTFOUND' || /getaddrinfo|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return 'The database host could not be resolved. DATABASE_URL is most likely Render\'s INTERNAL hostname - use the External connection string.';
  }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|Connection terminated|timeout/i.test(msg)) {
    return 'The database refused or timed out the connection. Check that the Render database is running and reachable from Vercel.';
  }
  if (code === '28P01' || code === '28000' || /password authentication failed|role .* does not exist/i.test(msg)) {
    return 'The database rejected the credentials. The password in DATABASE_URL is stale - copy a fresh URL from Render.';
  }
  if (/pg_hba|SSL|self.signed|certificate|no encryption/i.test(msg)) {
    return 'The connection was rejected over SSL. Remove PGSSLMODE=disable - Render requires SSL.';
  }
  if (code === '42501' || /permission denied/i.test(msg)) {
    return 'The database user is not allowed to create tables. Run postgres/migrate.mjs as the database owner.';
  }
  if (code === '3D000' || /database .* does not exist/i.test(msg)) {
    return 'The database named in DATABASE_URL does not exist on that server.';
  }
  if (code === '53300' || /too many clients/i.test(msg)) {
    return 'The database has too many open connections. Reduce concurrency or raise the Render connection limit.';
  }
  return `The database reported ${code || 'an error'}${msg ? `: ${msg.slice(0, 140)}` : ''}.`;
}

export function postgresStateMiddleware(pool: Pick<Pool, 'connect'>, hooks: Hooks): RequestHandler {
  let tail: Promise<void> = Promise.resolve();
  return (req, res, next) => {
    const previous = tail;
    let unlock!: () => void;
    tail = new Promise<void>((resolve) => { unlock = resolve; });
    void (async () => {
      await previous;
      let client: PoolClient | undefined;
      let before: any;
      let beforeRows: Record<string, any[]> = {};
      let dirty = false;
      let completed = false;
      const originalEnd = res.end.bind(res);
      const fail = (err?: unknown) => {
        res.statusCode = 503;
        res.removeHeader('Content-Length');
        res.removeHeader('ETag');
        res.removeHeader('Set-Cookie');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        const hint = err ? classifyDbError(err) : '';
        originalEnd(JSON.stringify({
          success: false,
          message: 'Saved data storage is unavailable. ' + (hint ? hint + ' ' : '') + 'No changes were committed.',
        }));
      };
      const finish = async (args: any[], aborted = false) => {
        if (completed) return;
        completed = true;
        try {
          if (aborted || res.statusCode >= 400) {
            await client!.query('ROLLBACK');
            hooks.restore(before);
          } else {
            if (dirty) {
              await applyRowDiff(client!, beforeRows, buildRows(hooks.capture()));
              await client!.query('SAVEPOINT update_legacy_state');
              try {
                const tableCheck = await client!.query(
                  "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_state_store'"
                );
                if (tableCheck.rows.length > 0) {
                  await client!.query('UPDATE crm_state_store SET payload = $1 WHERE id = 1', [JSON.stringify(hooks.capture())]);
                }
                await client!.query('RELEASE SAVEPOINT update_legacy_state');
              } catch {
                try { await client!.query('ROLLBACK TO SAVEPOINT update_legacy_state'); } catch {}
              }
            }
            await client!.query('COMMIT');
          }
          if (!aborted) (originalEnd as any)(...args);
        } catch (err) {
          console.error('[relational-store] state commit failed:', err instanceof Error ? err.stack || err.message : err);
          try { await client?.query('ROLLBACK'); } catch {}
          if (before) hooks.restore(before);
          if (!aborted && !res.headersSent) fail(err);
        } finally {
          hooks.setWriter(null);
          client?.release();
          unlock();
        }
      };
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query("SET LOCAL statement_timeout = '20s'");
        await client.query('SELECT pg_advisory_xact_lock(360026)');
        await ensureSchema(client);

        let loaded = await loadSnapshotFromDb(client);
        if (!loaded || !loaded.stateInitialized || (!loaded.users?.length && !Object.keys(loaded.payrollMasters || {}).length)) {
          await client.query('SAVEPOINT legacy_crm_state_check');
          try {
            const tableCheck = await client.query(
              "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_state_store'"
            );
            if (tableCheck.rows.length > 0) {
              const legacyRes = await client.query('SELECT payload FROM crm_state_store WHERE id = 1 LIMIT 1');
              if (legacyRes?.rows?.[0]?.payload) {
                const rawPayload = legacyRes.rows[0].payload;
                const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
                if (parsed && typeof parsed === 'object') {
                  loaded = { ...loaded, ...parsed };
                }
              }
            }
            await client.query('RELEASE SAVEPOINT legacy_crm_state_check');
          } catch {
            try { await client.query('ROLLBACK TO SAVEPOINT legacy_crm_state_check'); } catch {}
          }
        }
        before = hooks.capture();
        // Baseline for the row-level diff = exactly what the database held.
        beforeRows = buildRows(loaded && loaded.stateInitialized ? loaded : {});
        if (loaded && (Array.isArray(loaded.users) || loaded.payrollMasters) && typeof loaded.stateInitialized === 'boolean' && loaded.stateInitialized) {
          hooks.restore(loaded);
        } else {
          // Fresh relational store: the in-memory state was seeded from
          // backend/initial-store.json at boot, so persist that on this request.
          dirty = true;
        }
        hooks.setWriter(() => { dirty = true; });

        res.end = ((...args: any[]) => { void finish(args); return res; }) as any;
        res.once('close', () => { if (!res.writableFinished) void finish([], true); });
        next();
      } catch (err) {
        // Surface the real cause (DB unreachable, schema/permission error, ...) in the runtime logs.
        console.error('[relational-store] request store failed:', err instanceof Error ? err.stack || err.message : err);
        try { await client?.query('ROLLBACK'); } catch {}
        if (before) hooks.restore(before);
        hooks.setWriter(null);
        client?.release();
        unlock();
        fail(err);
      }
    })();
  };
}
