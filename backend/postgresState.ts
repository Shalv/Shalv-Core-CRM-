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
let schemaPromise: Promise<void> | null = null;
function ensureSchema(client: PoolClient): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = client
      .query(RUNTIME_SCHEMA)
      .then(() => undefined)
      .catch((err) => { schemaPromise = null; throw err; });
  }
  return schemaPromise;
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
      const fail = () => {
        res.statusCode = 503;
        res.removeHeader('Content-Length');
        res.removeHeader('ETag');
        res.removeHeader('Set-Cookie');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        originalEnd(JSON.stringify({
          success: false,
          message: 'Saved data storage is unavailable. Check the Vercel DATABASE_URL setting and Render database access. No changes were committed.',
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
            // Fine-grained: write only the rows that changed during this request.
            if (dirty) await applyRowDiff(client!, beforeRows, buildRows(hooks.capture()));
            await client!.query('COMMIT');
          }
          if (!aborted) (originalEnd as any)(...args);
        } catch (err) {
          console.error('[relational-store] state commit failed:', err instanceof Error ? err.stack || err.message : err);
          try { await client?.query('ROLLBACK'); } catch {}
          if (before) hooks.restore(before);
          if (!aborted && !res.headersSent) fail();
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

        const loaded = await loadSnapshotFromDb(client);
        before = hooks.capture();
        // Baseline for the row-level diff = exactly what the database held.
        beforeRows = buildRows(loaded && loaded.stateInitialized ? loaded : {});
        if (loaded && Array.isArray(loaded.users) && typeof loaded.stateInitialized === 'boolean' && loaded.stateInitialized) {
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
        fail();
      }
    })();
  };
}
