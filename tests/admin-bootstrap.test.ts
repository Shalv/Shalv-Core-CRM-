import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Pool} from 'pg';
import express from 'express';

// The bootstrap reset only exists while BOOTSTRAP_ADMIN_PASSWORD is configured. The flag is
// read per call, so one server instance can cover both the disabled and enabled states.
const storePath=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'crm-bootstrap-')),'store.json');
process.env.CRM_TEST_MODE='false';
process.env.VERCEL='1';
process.env.DATABASE_URL='postgresql://local:local@127.0.0.1:1/test';
process.env.AUTH_SECRET='admin-bootstrap-regression-secret';
process.env.CRM_STORE_PATH=storePath;
delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
delete process.env.ADMIN_PASSWORD;

let stored:any=null;
const originalConnect=Pool.prototype.connect;
(Pool.prototype as any).connect=async()=>{
 let pending=stored;
 return {release(){},async query(sql:string,params:any[]=[]){
  if(sql.startsWith('INSERT INTO crm_state_store') && !pending) pending=params[0];
  if(sql.startsWith('SELECT payload'))return {rows:[{payload:pending}]};
  if(sql.startsWith('UPDATE crm_state_store'))pending=params[0];
  if(sql==='COMMIT')stored=pending;
  if(sql.startsWith('UPDATE users SET password_hash'))return {rows:[],rowCount:1};
  return {rows:[]};
 }};
};
const {default:handler}=await import('../backend/vercelHandler.ts');
const wrapper=express();wrapper.use((req,res,next)=>{Promise.resolve(handler(req,res)).catch(next);});
const server=wrapper.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
after(()=>{server.close();(Pool.prototype as any).connect=originalConnect;});
const origin=`http://127.0.0.1:${(server.address() as any).port}`;
async function call(pathname:string,body?:any,cookie?:string){
 const response=await fetch(origin+pathname,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 return {status:response.status,body:await response.json().catch(()=>null),cookie:(response.headers.get('set-cookie')||'').split(';')[0]};
}
const RECOVERY_KEY='Recovery#Key#2026';
const verify=(password:string,identifier='admin')=>call('/api/auth/verify',{identifier,password,portalMode:'crm'});

test('admin bootstrap path is fully disabled when BOOTSTRAP_ADMIN_PASSWORD is unset',async()=>{
 delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
 assert.equal((await call('/api/auth/admin-bootstrap')).status,404);
 assert.equal((await call('/api/auth/admin-bootstrap',{bootstrapPassword:'anything'})).status,404);
});

test('bootstrap requires the exact configured key before resetting anything',async()=>{
 process.env.BOOTSTRAP_ADMIN_PASSWORD=RECOVERY_KEY;
 assert.equal((await call('/api/auth/admin-bootstrap',{})).status,401);
 assert.equal((await call('/api/auth/admin-bootstrap',{bootstrapPassword:'Wrong#Key'})).status,401);
 const response=await call('/api/auth/admin-bootstrap',{bootstrapPassword:RECOVERY_KEY});
 assert.equal(response.status,200);
 assert.equal(response.body.success,true);
 assert.match(response.body.message,/CoreEnact@2026#/);
});

test('after a bootstrap reset the Super Admin signs in with the seed password',async()=>{
 process.env.BOOTSTRAP_ADMIN_PASSWORD=RECOVERY_KEY;
 assert.equal((await verify('CoreEnact@2026#')).status,200);
 assert.equal((await verify('CoreEnact@2026#','admin@coreenact.com')).status,200);
 assert.equal((await verify('password123')).status,401);
 assert.equal((await verify('TotallyOldWrong#999')).status,401);
});

test('the seeded hash survives password re-resolution for the admin account',async()=>{
 process.env.BOOTSTRAP_ADMIN_PASSWORD=RECOVERY_KEY;
 // Any admin write re-resolves hashes through relinkUsersAndPayrollMasters; the recovery
 // seed must not be rewritten to the ADMIN_PASSWORD seed behind the operator's back.
 const login=await verify('CoreEnact@2026#');
 const account=await call('/api/auth/session',undefined,login.cookie);
 assert.equal(account.status,200);
 assert.equal(account.body.user.username,'admin');
 assert.equal(account.body.user.passwordHash,undefined);
 const pushed=await call('/api/users',{user:{id:'usr-1',name:'Admin',username:'admin',email:'admin@coreenact.com',role:'Super Admin',status:'Active'}},login.cookie);
 assert.equal(pushed.status,200);
 assert.equal((await verify('CoreEnact@2026#')).status,200);
});

test('clearStaleAdminCredentialCache strips cached admin credentials per scope',async()=>{
 const values=new Map<string,string>();
 // Capture descriptors instead of reading globalThis.localStorage, which makes Node's
 // experimental localStorage getter emit a warning when merely accessed.
 const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const windowDescriptor=Object.getOwnPropertyDescriptor(globalThis,'window');
 Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)},configurable:true,writable:true});
 Object.defineProperty(globalThis,'window',{value:{localStorage:globalThis.localStorage,addEventListener(){},removeEventListener(){},dispatchEvent(){},location:{search:''},sessionStorage:{setItem(){},getItem:()=>null},setTimeout,clearTimeout,setInterval,clearInterval,CustomEvent:class{constructor(public type:string){}}},configurable:true,writable:true});
 const seedCache=()=>{
  values.set('crm_pending_user_passwords_v1',JSON.stringify({'usr-1':'Stale#Admin#999','usr-9':'Keep#Me#123'}));
  values.set('corecrm_v2_users',JSON.stringify([
   {id:'usr-1',username:'admin',email:'admin@coreenact.com',role:'Super Admin',password:'Stale#Admin#999'},
   {id:'usr-9',username:'ana',email:'ana@coreenact.com',role:'Sales Executive',password:'Keep#Me#123'},
  ]));
  values.set('crm_ess_admin_employee_masters',JSON.stringify({
   'usr-1':{userId:'usr-1',email:'admin@coreenact.com',name:'Admin',password:'Stale#Admin#999'},
   'usr-9':{userId:'usr-9',email:'ana@coreenact.com',name:'Ana',password:'Keep#Me#123'},
  }));
  values.set('corecrm_v2_current_user',JSON.stringify({id:'usr-1',username:'admin',role:'Super Admin'}));
  values.set('corecrm_v2_is_authenticated','true');
  values.set('crm_auth_token','stale-token');
 };
 const assertAdminCacheSanitized=()=>{
  const users=JSON.parse(values.get('corecrm_v2_users')!);
  assert.equal(users.find((u:any)=>u.id==='usr-1').password,undefined);
  assert.equal(users.find((u:any)=>u.id==='usr-9').password,'Keep#Me#123','non-admin cached passwords must survive');
  const masters=JSON.parse(values.get('crm_ess_admin_employee_masters')!);
  assert.equal(masters['usr-1'].password,undefined);
  assert.equal(masters['usr-9'].password,'Keep#Me#123','non-admin payroll masters must survive');
 };
 try{
  const {clearStaleAdminCredentialCache}=await import('../src/context/CrmContext');

  // A signed-in admin who just changed their own password keeps the session and the
  // pending entry; only cached plaintext is dropped.
  seedCache();
  const startup=clearStaleAdminCredentialCache('session-start');
  assert.equal(startup.cleared,true);
  assert.equal(startup.forceRelogin,false);
  assertAdminCacheSanitized();
  assert.equal(JSON.parse(values.get('crm_pending_user_passwords_v1')!)['usr-1'],'Stale#Admin#999');
  assert.equal(values.get('corecrm_v2_is_authenticated'),'true');
  assert.equal(values.get('crm_auth_token'),'stale-token');

  // From the login screen the stale admin entry and session are both forgotten.
  seedCache();
  const retry=clearStaleAdminCredentialCache('login-retry');
  assert.deepEqual(retry,{cleared:true,forceRelogin:true});
  assertAdminCacheSanitized();
  const pending=JSON.parse(values.get('crm_pending_user_passwords_v1')!);
  assert.equal(pending['usr-1'],undefined);
  assert.equal(pending['usr-9'],'Keep#Me#123','non-admin pending passwords must survive');
  assert.equal(values.has('corecrm_v2_current_user'),false);
  assert.equal(values.has('corecrm_v2_is_authenticated'),false);
  assert.equal(values.has('crm_auth_token'),false);

  // A second login-retry pass over an already-clean cache demands no relogin.
  assert.deepEqual(clearStaleAdminCredentialCache('login-retry'),{cleared:false,forceRelogin:false});
 }finally{
  if(storageDescriptor)Object.defineProperty(globalThis,'localStorage',storageDescriptor);else delete (globalThis as any).localStorage;
  if(windowDescriptor)Object.defineProperty(globalThis,'window',windowDescriptor);else delete (globalThis as any).window;
 }
});
