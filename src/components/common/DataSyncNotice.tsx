import React,{useState} from 'react';
import {SyncStatus} from '../../context/useApplicationSync';
export function DataSyncNotice({status,retry,reload,showIssues}:{status:SyncStatus;retry:()=>void;reload:()=>Promise<void>;showIssues:boolean}) {
  const [open,setOpen]=useState(false);
  const problematic=['offline','conflict'].includes(status.state);
  const count=showIssues ? status.issues.length : 0;
  // Never show "Saving linked records…" or routine background saving notices on screen
  if (status.state==='saved' || status.state==='saving' || status.message?.includes('Saving linked records') || status.message?.includes('Saving')) {
    if (!problematic && !count) return null;
  }
  if (!problematic && !count) return null;
  return <aside aria-live="polite" className={`fixed bottom-4 right-4 z-[99999] max-w-xl rounded-xl border p-3 shadow-lg ${problematic || count ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-blue-200 bg-white text-slate-700'}`}>
    <div className="text-xs font-semibold">{status.message}</div>
    <div className="mt-2 flex gap-3 text-xs">
      {status.state==='offline' && <button className="underline" onClick={retry}>Retry connection</button>}
      {status.state==='conflict' && <button className="underline" onClick={()=>void reload()}>Load saved data</button>}
      {count>0 && <button className="underline" onClick={()=>setOpen(!open)}>{count} records need review</button>}
    </div>
    {open && count>0 && <div className="mt-3 max-h-60 overflow-auto text-xs"><p className="mb-2">These links were already inconsistent in saved data. Open the listed records and correct or reassign them.</p><table className="w-full text-left"><thead><tr><th>Module</th><th>Record</th><th>Issue</th></tr></thead><tbody>{status.issues.map((i,index)=><tr key={`${i.key}-${index}`} className="border-t border-amber-200"><td className="py-1 pr-2">{i.slice}</td><td className="pr-2">{i.id}</td><td>{i.field}: {i.message}</td></tr>)}</tbody></table></div>}
  </aside>;
}
