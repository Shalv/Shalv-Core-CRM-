import {useEffect,useRef,useState} from 'react';
import {Snapshot, same, mergeSnapshots, reconcileSnapshot, auditSnapshot, IntegrityIssue, getPendingUserPasswords} from '../shared/integrity';
export type SyncStatus = {state:'connecting'|'saved'|'saving'|'offline'|'conflict'; message:string; issues:IntegrityIssue[]};
async function readState(response: Response) {
  if (!response.ok) throw new Error(`Application API returned HTTP ${response.status}. Check that the full application server is running.`);
  if (response.headers?.get('content-type')?.includes('text/html')) throw new Error('This address serves only the frontend. Start the full application server with npm run dev or npm start.');
  let data: any;
  try { data = await response.json(); } catch { throw new Error('The application API did not return JSON. Check the server and /api routing.'); }
  if (!data.snapshot || typeof data.snapshot !== 'object' || Array.isArray(data.snapshot) || !Array.isArray(data.snapshot.users)) throw new Error('The application API returned an invalid saved-data response. Check that the frontend and server use the same application version.');
  return data;
}
const PENDING_KEY='crm_pending_transaction_v2';
function authHeaders(extra?: Record<string, string>): Record<string, string> | undefined {
  let token: string | null = null;
  try { token = localStorage.getItem('crm_auth_token'); } catch { /* ignore */ }
  if (!token && !extra) return undefined;
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Rebase local user modifications (additions, deletions, field edits) onto the latest remote server snapshot */
export function rebaseLocalChanges(base: Snapshot | null, local: Snapshot, remote: Snapshot): Snapshot {
  if (!base) return { ...remote, ...local };
  const rebased: Snapshot = { ...remote };
  for (const key of Object.keys(local)) {
    const localVal = local[key];
    const baseVal = base[key];
    const remoteVal = remote[key];

    if (Array.isArray(localVal)) {
      const bMap = new Map((Array.isArray(baseVal) ? baseVal : []).map((r: any) => [String(r?.id), r]));
      const lMap = new Map(localVal.map((r: any) => [String(r?.id), r]));
      const rMap = new Map((Array.isArray(remoteVal) ? remoteVal : []).map((r: any) => [String(r?.id), r]));

      // 1. User additions: records in local that were not in base -> keep in rMap
      for (const [id, nextRec] of lMap.entries()) {
        if (!bMap.has(id)) {
          rMap.set(id, nextRec);
        }
      }

      // 2. User deletions: records in base that were deleted in local -> remove from rMap
      for (const id of bMap.keys()) {
        if (!lMap.has(id)) {
          rMap.delete(id);
        }
      }

      // 3. User modifications: apply local field edits onto remote records
      for (const [id, nextRec] of lMap.entries()) {
        if (bMap.has(id)) {
          const prevRec = bMap.get(id);
          const currentRemoteRec = rMap.get(id);
          if (currentRemoteRec) {
            const mergedRec = { ...currentRemoteRec };
            for (const f of Object.keys(nextRec)) {
              if (!same(nextRec[f], prevRec?.[f])) {
                mergedRec[f] = nextRec[f];
              }
            }
            rMap.set(id, mergedRec);
          } else {
            // Deleted on remote while local user edited it -> preserve user edit
            rMap.set(id, nextRec);
          }
        }
      }

      rebased[key] = Array.from(rMap.values());
    } else if (typeof localVal === 'object' && localVal !== null) {
      const bObj = (baseVal && typeof baseVal === 'object') ? baseVal : {};
      const rObj = (remoteVal && typeof remoteVal === 'object') ? remoteVal : {};
      const mergedObj = { ...rObj };
      for (const prop of Object.keys(localVal)) {
        if (!same(localVal[prop], bObj[prop])) {
          mergedObj[prop] = localVal[prop];
        }
      }
      rebased[key] = mergedObj;
    } else {
      if (!same(localVal, baseVal)) {
        rebased[key] = localVal;
      } else {
        rebased[key] = remoteVal ?? localVal;
      }
    }
  }
  return rebased;
}

/** One coherent transaction for all CRM slices. Server data loads before any background write. */
export function useApplicationSync(snapshot:Snapshot, apply:(snapshot:Snapshot)=>void, enabled=true) {
  const enabledRef=useRef(enabled); enabledRef.current=enabled;
  const latest=useRef(snapshot); latest.current=snapshot;
  const applyRef=useRef(apply); applyRef.current=apply;
  const base=useRef<Snapshot | null>(null);
  const busy=useRef(false); const stopped=useRef(false);
  const blocked=useRef(false);
  const lastConflictSnapshot=useRef<Snapshot | null>(null);
  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState<SyncStatus>({state:'connecting',message:'Loading saved application data…',issues:[]});
  const tickRef=useRef<()=>Promise<void>>(async()=>{});
  const hydrate=(value:Snapshot)=>{ latest.current=value; applyRef.current(value); };
  tickRef.current=async()=> {
    if(!enabledRef.current || busy.current || blocked.current || stopped.current) return;
    busy.current=true;
    try {
      if(!base.current) {
        const hdrs=authHeaders();
        const response=await (hdrs ? fetch('/api/state',{headers:hdrs}) : fetch('/api/state'));
        const data=await readState(response);
        const remote=data.snapshot as Snapshot;
        let local:Snapshot;
        if(data.initialized===false) {
          // Existing server credentials and user identities always remain authoritative.
          local=reconcileSnapshot({...remote,...latest.current,users:remote.users});
        } else {
          local=reconcileSnapshot({...latest.current,...remote});
        }
        let baseline=remote;
        const pending=localStorage.getItem(PENDING_KEY);
        if(pending) {
          try {
            const saved=JSON.parse(pending);
            const cleanBase=reconcileSnapshot(saved.base);
            const cleanSnap=reconcileSnapshot(saved.snapshot);
            const snapIssues=auditSnapshot(cleanSnap);
            const result=mergeSnapshots(cleanBase,cleanSnap,remote);
            if(result.conflicts.length || snapIssues.length) {
              localStorage.removeItem(PENDING_KEY);
            } else {
              local=reconcileSnapshot({...local,...result.snapshot});
            }
          } catch {
            localStorage.removeItem(PENDING_KEY);
          }
        }
        base.current=baseline;
        hydrate(local); setReady(true);
        if(!blocked.current) setStatus({state:'saved',message:'Saved data loaded',issues:data.issues || []});
        return;
      }
      const outgoing=reconcileSnapshot(latest.current);
      if(!same(outgoing,latest.current)) hydrate(outgoing);
      if(!same(base.current,outgoing)) {
        // Persist the exact baseline too, so reopening cannot overwrite intervening changes.
        localStorage.setItem(PENDING_KEY,JSON.stringify({base:base.current,snapshot:outgoing}));
        setStatus(s=>({...s,state:'saving',message:'Saving linked records…'}));
        const userPasswords=getPendingUserPasswords();
        const response=await fetch('/api/state',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({base:base.current,snapshot:outgoing,...(Object.keys(userPasswords).length ? {userPasswords} : {})})});
        const result=await response.json();
        if(response.status===409 && result?.snapshot && typeof result.snapshot === 'object' && Array.isArray(result?.conflicts) && result.conflicts.length > 0) {
          try {
            // Rebase local additions, deletions and field edits onto latest server snapshot
            const rebased = reconcileSnapshot(rebaseLocalChanges(base.current, outgoing, result.snapshot));
            base.current = reconcileSnapshot(result.snapshot);
            hydrate(rebased);
            localStorage.setItem(PENDING_KEY, JSON.stringify({ base: base.current, snapshot: rebased }));
            const retryRes = await fetch('/api/state', {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({
                base: base.current,
                snapshot: rebased,
                force: true,
                ...(Object.keys(userPasswords).length ? { userPasswords } : {}),
              }),
            });
            const retryData = await retryRes.json();
            if (retryRes.ok && retryData.success) {
              base.current = retryData.snapshot;
              hydrate(reconcileSnapshot(retryData.snapshot));
              localStorage.removeItem(PENDING_KEY);
              setStatus({ state: 'saved', message: 'All linked records saved', issues: retryData.issues || [] });
              return;
            }
          } catch {
            // fallback to conflict status
          }
        }
        if(response.status===409 || response.status===422) {
          blocked.current=true;
          lastConflictSnapshot.current=outgoing;
          setStatus({state:'conflict',message:result.message || result.error || 'Another change occurred during saving. Reload saved data before continuing.',issues:result.issues || []});
          return;
        }
        if(!response.ok || !result.success) throw new Error(result.message || 'Save failed');
        base.current=result.snapshot;
        if(same(outgoing,latest.current)) {
          hydrate(reconcileSnapshot(result.snapshot));
          localStorage.removeItem(PENDING_KEY);
          setStatus({state:'saved',message:'All linked records saved',issues:result.issues || []});
        } else {
          // The user made subsequent edits while this save was in flight. Apply user's newer changes on top of server baseline and queue next tick
          const changesDuringSave=mergeSnapshots(outgoing,latest.current,result.snapshot);
          const nextSnap = reconcileSnapshot(changesDuringSave.conflicts.length ? { ...result.snapshot, ...latest.current } : changesDuringSave.snapshot);
          hydrate(nextSnap);
          localStorage.setItem(PENDING_KEY,JSON.stringify({base:base.current,snapshot:latest.current}));
          setStatus({state:'saved',message:'All linked records saved',issues:result.issues || []});
        }
      } else {
        const hdrs=authHeaders();
        const response=await (hdrs ? fetch('/api/state',{headers:hdrs}) : fetch('/api/state'));
        const result=await readState(response);
        // Apply incoming changes together, including deletions and genuinely empty arrays.
        if(same(latest.current,base.current)) {
          base.current=result.snapshot; hydrate(result.snapshot);
          localStorage.removeItem(PENDING_KEY);
        }
        setStatus({state:'saved',message:'All linked records saved',issues:result.issues || []});
      }
    } catch(error) {
      setStatus(s=>({...s,state:'offline',message:base.current ? 'Connection unavailable. Changes remain queued; reconnect to save.' : `Saved data could not load. ${error instanceof Error && error.message !== 'Failed to fetch' ? error.message : 'The application server could not be reached. Start it with npm run dev, or npm run build followed by npm start.'} Editing will unlock after saved data loads.`}));
    } finally { busy.current=false; }
  };
  useEffect(()=> {
    if (!enabled) {base.current=null; setReady(false); return;}
    void tickRef.current();
  }, [enabled]);
  useEffect(()=> {
    stopped.current=false;
    void tickRef.current();
    const timer=window.setInterval(()=>void tickRef.current(),5000);
    const onOnline=()=>void tickRef.current();
    const onBeforeUnload=(event:BeforeUnloadEvent)=> {
      if(base.current && !same(latest.current,base.current)) {
        localStorage.setItem(PENDING_KEY,JSON.stringify({base:base.current,snapshot:latest.current}));
        event.preventDefault(); event.returnValue='';
      }
    };
    window.addEventListener('online',onOnline); window.addEventListener('focus',onOnline);
    window.addEventListener('beforeunload',onBeforeUnload);
    return ()=>{stopped.current=true;window.clearInterval(timer);window.removeEventListener('online',onOnline);window.removeEventListener('focus',onOnline);window.removeEventListener('beforeunload',onBeforeUnload);};
  },[]);
  useEffect(()=> {
    if(!ready || !base.current || same(snapshot,base.current)) return;
    if(blocked.current) {
      if(lastConflictSnapshot.current && same(snapshot,lastConflictSnapshot.current)) {
        return;
      }
      blocked.current=false;
      lastConflictSnapshot.current=null;
    }
    localStorage.setItem(PENDING_KEY,JSON.stringify({base:base.current,snapshot}));
    const timer=window.setTimeout(()=>void tickRef.current(),200);
    return ()=>window.clearTimeout(timer);
  },[snapshot,ready]);
  const reloadSaved=async()=> {
    busy.current=false;
    blocked.current=false;
    lastConflictSnapshot.current=null;
    base.current=null;
    localStorage.removeItem(PENDING_KEY);
    await tickRef.current();
  };
  return {
    ready,
    status,
    retry: () => {
      blocked.current = false;
      lastConflictSnapshot.current = null;
      void tickRef.current();
    },
    reloadSaved,
  };
}
