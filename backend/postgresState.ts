import type {RequestHandler} from 'express';
import type {Pool, PoolClient} from 'pg';

type Hooks = {capture:()=>any; restore:(state:any)=>void; setWriter:(writer:(()=>void)|null)=>void};
/** Serialize each process's shared legacy state and lock the database across processes.
 * A response is sent only after its state transaction has committed. */
export function postgresStateMiddleware(pool: Pick<Pool,'connect'>, hooks: Hooks): RequestHandler {
  let tail: Promise<void> = Promise.resolve();
  return (req,res,next)=> {
    const previous=tail;
    let unlock!:()=>void;
    tail=new Promise<void>(resolve=>{unlock=resolve;});
    void (async()=>{
      await previous;
      let client: PoolClient | undefined, before:any, dirty=false, completed=false;
      const originalEnd=res.end.bind(res);
      const fail=()=> {
        res.statusCode=503; res.removeHeader('Content-Length'); res.setHeader('Content-Type','application/json; charset=utf-8');
        originalEnd(JSON.stringify({success:false,message:'Saved data storage is unavailable. Check the Vercel DATABASE_URL setting and Render database access. No changes were committed.'}));
      };
      const finish=async(args:any[],aborted=false)=>{
        if(completed)return;completed=true;
        try {
          if(aborted || res.statusCode>=400) {
            await client!.query('ROLLBACK'); hooks.restore(before);
          } else {
            if(dirty) await client!.query('UPDATE enact360_application_state SET payload=$1::jsonb, updated_at=NOW() WHERE id=1',[JSON.stringify(hooks.capture())]);
            await client!.query('COMMIT');
          }
          if(!aborted)(originalEnd as any)(...args);
        } catch {
          try{await client?.query('ROLLBACK');}catch{}
          if(before)hooks.restore(before);
          if(!aborted && !res.headersSent)fail();
        } finally {hooks.setWriter(null);client?.release();unlock();}
      };
      try {
        client=await pool.connect();
        await client.query('BEGIN');
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query('SELECT pg_advisory_xact_lock(360026)');
        await client.query('CREATE TABLE IF NOT EXISTS enact360_application_state (id INTEGER PRIMARY KEY CHECK (id=1), payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
        await client.query('INSERT INTO enact360_application_state (id,payload) VALUES (1,$1::jsonb) ON CONFLICT (id) DO NOTHING',[JSON.stringify(hooks.capture())]);
        const loaded=await client.query('SELECT payload FROM enact360_application_state WHERE id=1 FOR UPDATE');
        before=loaded.rows[0]?.payload;
        if(!before?.state || !before?.tables || typeof before.stateInitialized!=='boolean')throw new Error('Invalid application store');
        hooks.restore(before);hooks.setWriter(()=>{dirty=true;});
        res.end=((...args:any[])=>{void finish(args);return res;}) as any;
        res.once('close',()=>{if(!res.writableFinished)void finish([],true);});
        next();
      }catch {
        try{await client?.query('ROLLBACK');}catch{}
        if(before)hooks.restore(before);
        hooks.setWriter(null);client?.release();unlock();fail();
      }
    })();
  };
}
