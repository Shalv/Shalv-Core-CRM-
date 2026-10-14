import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import express from 'express';
import {reconcileSnapshot,auditSnapshot} from '../src/shared/integrity.ts';

// Admins were shown "These links were already inconsistent in saved data ... id: Duplicate record ID"
// for every audit entry produced by an employee edit. One field change wrote the SAME entry twice:
// syncMockTablesFromState() aliased MOCK_TABLES.audit_logs onto PERSISTED_CRM_STATE.crmSlices.auditLogs,
// so unshifting into "both" collections unshifted twice into one array. These tests pin the single
// write path and the repair of already-duplicated saved data.
process.env.CRM_TEST_MODE='false';process.env.VERCEL='1';process.env.DATABASE_URL='postgresql://local:local@127.0.0.1:1/test';process.env.AUTH_SECRET='audit-duplicate-test-secret';

const master=(userId:string,empCode:string,email:string,name:string)=>({
  userId,empCode,email,name,username:email.split('@')[0],phone:'+91 90000 00000',role:'Sales Executive',
  department:'Sales',designation:'Executive',status:'Active',accessType:'crm_and_payroll',enrolledInPayroll:true,monthlyGross:60000,
});

const seed={
  stateInitialized:true,documentCounters:{},
  users:[
    {id:'usr-1',name:'Shalv Sharma',username:'admin',email:'admin@coreenact.com',role:'Super Admin',status:'Active',accessScope:'all'},
    {id:'emp-1',name:'Audit Target',username:'audit.target',email:'audit.target@example.com',role:'Sales Executive',status:'Active',phone:'+91 90000 00000'},
  ],
  payrollMasters:{'emp-1':master('emp-1','EMP-140','audit.target@example.com','Audit Target')},
  deletedPayrollMasterIds:[],payrollLoans:[],deletedLoanIds:[],payrollLeaves:{},payrollClaims:{},
  payrollAttendance:{},payrollStatutory:{},payrollPolicy:{},payrollOrgMasters:{},payrollIntegrationConfig:{},
  crmSlices:{auditLogs:[{id:'aud-seed-1',action:'Created',entityType:'Payment',entityId:'pay-1',timestamp:'2026-01-01T00:00:00.000Z'}]},
};

let stored:any=JSON.stringify(seed);
const originalConnect=Pool.prototype.connect;
(Pool.prototype as any).connect=async()=>{
 let pending=stored;
 return {release(){},async query(sql:string,params:any[]=[]){
  if(sql.startsWith('INSERT INTO crm_state_store') && !pending) pending=params[0];
  if(sql.startsWith('SELECT payload'))return {rows:[{payload:pending}]};
  if(sql.startsWith('UPDATE crm_state_store'))pending=params[0];
  if(sql==='COMMIT')stored=pending;
  return {rows:[]};
 }};
};
const {default:handler}=await import('../backend/vercelHandler.ts');
const wrapper=express();wrapper.use((req,res,next)=>{Promise.resolve(handler(req,res)).catch(next);});
const server=wrapper.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
const origin=`http://127.0.0.1:${(server.address() as any).port}`;
async function call(path:string,body?:any,cookie?:string){return fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});}
const login=await call('/api/auth/verify',{identifier:'admin',password:process.env.ADMIN_PASSWORD || 'CoreEnact@2026#',portalMode:'crm'});
assert.equal(login.status,200,'admin must sign in to update employee ESS records');
const adminCookie=(login.headers.get('set-cookie')||'').split(';')[0];

const auditLogs=async()=>((await (await call('/api/audit-logs',undefined,adminCookie)).json()).logs)||[];
const duplicatedIds=(logs:any[])=>{const seen=new Set<string>();const dupes=new Set<string>();for(const l of logs){if(!l||l.id===undefined)continue;if(seen.has(String(l.id)))dupes.add(String(l.id));seen.add(String(l.id));}return [...dupes];};

test('one changed employee field produces exactly one audit entry, never the same id twice',async()=>{
 const before=await auditLogs();
 const response=await call('/api/payroll/ess/emp-1',{phone:'+91 98888 77777'},adminCookie);
 assert.equal(response.status,200,JSON.stringify(await response.json().catch(()=>({}))));
 const after=await auditLogs();
 const phoneEdits=after.filter((l:any)=>l.fieldName==='phone');
 assert.equal(phoneEdits.length,1,'a single field change must add a single audit row');
 assert.equal(duplicatedIds(after).length,0,`no audit id may repeat: ${JSON.stringify(duplicatedIds(after))}`);
 assert.ok(after.length>before.length,'the edit must still be recorded');
});

test('a second edit to the same field keeps every audit id unique',async()=>{
 await call('/api/payroll/ess/emp-1',{phone:'+91 77777 66666'},adminCookie);
 const logs=await auditLogs();
 const phoneEdits=logs.filter((l:any)=>l.fieldName==='phone');
 assert.equal(phoneEdits.length,2,'both edits are kept as separate audit rows');
 assert.equal(new Set(phoneEdits.map((l:any)=>String(l.id))).size,2,'successive edits cannot share an id');
 assert.equal(duplicatedIds(logs).length,0,`no audit id may repeat: ${JSON.stringify(duplicatedIds(logs))}`);
});

test('reconcileSnapshot collapses a record stored twice under one id',()=>{
 const row={id:'aud-emp-1',action:'Updated',entityType:'Employee',entityId:'emp-1',fieldName:'phone',newValue:'+91 90000 00001'};
 const snapshot:any={users:[{id:'usr-1',name:'Admin',email:'admin@coreenact.com',role:'Super Admin',status:'Active'}],auditLogs:[row,{...row},{...row,id:'aud-other',fieldName:'location'}]};
 const fixed=reconcileSnapshot(snapshot);
 assert.equal(fixed.auditLogs.length,2,'the exact repeat is removed, the distinct row survives');
 assert.deepEqual(duplicatedIds(fixed.auditLogs),[]);
 assert.equal(auditSnapshot(fixed).filter((i)=>i.message==='Duplicate record ID').length,0,'the notice must clear after reconciliation');
});

test('rows that share an id but differ in content are kept and still reported',()=>{
 const snapshot:any={
  users:[{id:'usr-1',name:'Admin',email:'admin@coreenact.com',role:'Super Admin',status:'Active'}],
  auditLogs:[
   {id:'aud-clash',action:'Updated',entityId:'emp-1',newValue:'A'},
   {id:'aud-clash',action:'Updated',entityId:'emp-1',newValue:'B'},
  ],
 };
 const fixed=reconcileSnapshot(snapshot);
 assert.equal(fixed.auditLogs.length,2,'a differing same-id row is somebody else edit, not a repeat');
 const flags=auditSnapshot(fixed).filter((i)=>i.message==='Duplicate record ID');
 assert.equal(flags.length,1,'and the auditor must keep flagging it for review');
});

test('cleanup closes the test server',async()=>{
 Pool.prototype.connect=originalConnect;
 await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
});
