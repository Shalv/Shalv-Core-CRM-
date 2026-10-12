/** Durable sequential writes for payroll/ESS. Failed saves are visible and retryable. */
type Write = {url:string; init:RequestInit; keys:string[]};
const KEY='crm_payroll_pending_writes_v2';
let active=false; let timer:ReturnType<typeof setTimeout> | undefined;
let paused=false;
const read=():Write[]=>{try{return JSON.parse(localStorage.getItem(KEY) || '[]');}catch{return [];}};
const store=(writes:Write[])=>localStorage.setItem(KEY,JSON.stringify(writes));
const publish=(state:string,message:string)=>window.dispatchEvent(new CustomEvent('crm-payroll-sync-status',{detail:{state,message}}));
export const pendingPayrollKeys=():Set<string>=>new Set(read().flatMap(w=>w.keys));
export const hasPendingPayrollWrites=()=>read().length>0;
export const discardPendingPayrollWrites=()=>{store([]);clearTimeout(timer);paused=false;publish('saved','Saved payroll data will reload.');window.dispatchEvent(new CustomEvent('crm-payroll-refresh'));};
export function payrollFetch(url:string,init:RequestInit):Promise<any> {
  const body=typeof init.body==='string'?JSON.parse(init.body):{};
  const keys:string[]=[];
  if(url==='/api/payroll/masters') keys.push('crm_ess_admin_employee_masters');
  if(url==='/api/payroll/policy') keys.push('crm_ess_admin_policy_master');
  if(url==='/api/payroll/org-masters') keys.push('crm_payroll_org_masters');
  if(url.includes('/api/payroll/loans')) keys.push('crm_ess_employee_loans');
  if(url.includes('/api/payroll/ess/')) {
    const id=decodeURIComponent(url.split('/').pop()!);
    for(const field of ['attendance','leaves','claims','statutory']) if(body[field]!==undefined) keys.push(`crm_ess_${id}_${field}`);
  }
  const writes=read(); writes.push({url,init,keys}); store(writes);
  publish('saving','Saving payroll changes…'); void flushPayrollWrites();
  return Promise.resolve({ok:true,queued:true});
}
export async function flushPayrollWrites():Promise<void> {
  if(active || paused) return;
  active=true;
  try {
    while(read().length) {
      const write=read()[0];
      let token:string|null=null;
      try{token=localStorage.getItem('crm_auth_token');}catch{/* ignore */}
      const initHeaders=token ? {...(write.init?.headers as Record<string,string> || {}),Authorization:`Bearer ${token}`} : write.init?.headers;
      const response=await fetch(write.url,initHeaders ? {...write.init,headers:initHeaders} : write.init);
      const result=await response.json();
      if(response.status===409 || response.status===400 || response.status===404 || response.status===422) {
        paused=true;publish('conflict',result.message || 'Payroll changes conflict with saved data. Load saved payroll data before continuing.');return;
      }
      if(!response.ok || !result.success) throw new Error('Payroll save failed');
      const writes=read(); writes.shift(); store(writes);
    }
    clearTimeout(timer);
    publish('saved','Payroll changes saved');window.dispatchEvent(new CustomEvent('crm-payroll-refresh'));
  } catch {
    publish('offline','Payroll changes are queued. They will save when the connection is restored.');
    clearTimeout(timer);timer=setTimeout(()=>void flushPayrollWrites(),5000);
  } finally {active=false;}
}
if(typeof window!=='undefined') {
  window.addEventListener('online',()=>void flushPayrollWrites());
  window.addEventListener('beforeunload',(e)=>{if(hasPendingPayrollWrites()){e.preventDefault();e.returnValue='';}});
  void flushPayrollWrites();
}
