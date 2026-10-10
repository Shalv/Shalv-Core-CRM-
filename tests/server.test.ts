import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fixture,payment,invoice} from './fixtures';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'crm-integrity-test-'));
process.env.CRM_STORE_PATH=path.join(folder,'store.json');process.env.CRM_TEST_MODE='true';process.env.DATABASE_URL='';
process.env.OUTLOOK_EMAIL_USER='';process.env.OUTLOOK_EMAIL_PASS='';process.env.OUTLOOK_CLIENT_SECRET='';
const {app}=await import('../server');
const copy=<T>(s:T):T=>JSON.parse(JSON.stringify(s));
async function call(method:string,url:string,body:any={},params:any={},query:any={}) {
 const layer=(app as any)._router.stack.find((l:any)=>l.route && (Array.isArray(l.route.path) ? l.route.path.includes(url) : l.route.path===url) && l.route.methods[method.toLowerCase()]);
 assert.ok(layer,`${method} ${url} exists`);
 let code=200,result:any;
 const res:any={status(n:number){code=n;return this;},json(value:any){result=value;return this;},send(value:any){result=value;return this;},type(){return this;}};
 await layer.route.stack[0].handle({body,params,query,protocol:'http',get:()=> 'localhost:3000'},res);
 return {code,body:copy(result)};
}
let snapshot:any;
test('canonical initialization preserves existing records and writes complete data atomically',async()=>{
 const remote=(await call('GET','/api/state')).body.snapshot;
 const seed={...fixture(),users:remote.users};
 const result=await call('POST','/api/state',{base:remote,snapshot:seed});
 assert.equal(result.code,200);snapshot=result.body.snapshot;
 const stored=JSON.parse(fs.readFileSync(process.env.CRM_STORE_PATH!,'utf8'));
 assert.equal(stored.crmSlices.invoices[0].id,'i1');assert.equal(stored.stateInitialized,true);
 assert.equal(result.body.issues.length,0);
});
test('API accepts independent changes but rejects a stale overwrite without partial changes',async()=>{
 const base=copy(snapshot),first=copy(base);first.customers[0].name='First update';
 const saved=await call('POST','/api/state',{base,snapshot:first});assert.equal(saved.code,200);
 const independent=copy(base);independent.customers[1].name='Independent update';
 const second=await call('POST','/api/state',{base,snapshot:independent});assert.equal(second.code,200);snapshot=second.body.snapshot;
 const conflicting=copy(base);conflicting.customers[0].name='Stale overwrite';conflicting.customers[1].name='Partial damage';
 const conflict=await call('POST','/api/state',{base,snapshot:conflicting});assert.equal(conflict.code,409);
 assert.equal((await call('GET','/api/state')).body.snapshot.customers[1].name,'Independent update');
});
test('API prevents deleting referenced customers and mismatched payment allocation',async()=>{
 let incoming=copy(snapshot);incoming.customers=incoming.customers.filter((c:any)=>c.id!=='c1');
 let result=await call('POST','/api/state',{base:snapshot,snapshot:incoming});assert.equal(result.code,422);
 incoming=copy(snapshot);incoming.payments=[payment('bad',20,{customerId:'c2'})];
 result=await call('POST','/api/state',{base:snapshot,snapshot:incoming});assert.equal(result.code,422);
 assert.equal((await call('GET','/api/state')).body.snapshot.payments.length,0);
});
test('server sequences handle duplicate client numbers independently for tax and proforma',async()=>{
 const incoming=copy(snapshot);incoming.invoices.push({...invoice,id:'new-tax',milestoneId:undefined,salesOrderId:undefined});incoming.invoices.push({...invoice,id:'new-pi',invoiceType:'Proforma',invoiceNumber:invoice.invoiceNumber,milestoneId:undefined,salesOrderId:undefined});
 const result=await call('POST','/api/state',{base:snapshot,snapshot:incoming});assert.equal(result.code,200);snapshot=result.body.snapshot;
 assert.equal(snapshot.invoices.find((i:any)=>i.id==='new-tax').invoiceNumber,'CSINV-00002');assert.equal(snapshot.invoices.find((i:any)=>i.id==='new-pi').invoiceNumber,'CSPI-00001');
});
test('simultaneous independent collections combine, with a failed overpayment rejected atomically',async()=>{
 const base=copy(snapshot),a=copy(base),b=copy(base);a.payments.push(payment('ra',20));b.payments.push(payment('rb',30));
 const first=await call('POST','/api/state',{base,snapshot:a});assert.equal(first.code,200);
 const second=await call('POST','/api/state',{base,snapshot:b});assert.equal(second.code,200);snapshot=second.body.snapshot;
 assert.equal(snapshot.invoices.find((i:any)=>i.id==='i1').paidAmount,50);
 const bad=copy(snapshot);bad.payments.push(payment('too-much',100));assert.equal((await call('POST','/api/state',{base:snapshot,snapshot:bad})).code,422);
});
test('payroll identity and employee requests are verified; concurrent approvals cannot overwrite',async()=>{
 const employee={userId:'employee-1',empCode:'EMP-001',name:'Employee',email:'employee@example.com',monthlyGross:30000,basicPct:50,hraPct:25,specialPct:25,tdsPct:0,pfAmount:0,profTax:0,lopDays:0,password:'test-password',accessType:'payroll_only'};
 assert.equal((await call('POST','/api/payroll/masters',{masters:{'employee-1':employee},patch:true,baseMasters:{}})).code,200);
 const other={...employee,userId:'employee-2',email:'other@example.com'};
 assert.equal((await call('POST','/api/payroll/masters',{masters:{'employee-2':other},patch:true})).code,400);
 const leave={id:'lv1',employeeId:'employee-1',startDate:'2026-10-01',endDate:'2026-10-01',days:1,status:'Pending Approval'};
 assert.equal((await call('POST','/api/payroll/ess/:empId',{leaves:[leave],base:{leaves:[]}},{empId:'employee-1'})).code,200);
 assert.equal((await call('POST','/api/payroll/ess/:empId',{leaves:[{...leave,status:'Approved'}],base:{leaves:[leave]}},{empId:'employee-1'})).code,200);
 assert.equal((await call('POST','/api/payroll/ess/:empId',{leaves:[{...leave,status:'Cancelled'}],base:{leaves:[leave]}},{empId:'employee-1'})).code,409);
 assert.equal((await call('POST','/api/payroll/ess/:empId',{leaves:[{...leave,employeeId:'someone-else'}]},{empId:'employee-1'})).code,400);
});
test('unconfigured email and an unverified OAuth callback cannot report success',async()=>{
 const result=await call('POST','/api/notifications/email',{to:'test@example.com',title:'Test only',message:'No actual email is sent by this test'});
 assert.equal(result.body.success,false);assert.equal(result.body.emailLog.status,'Failed');
 assert.equal((await call('GET','/auth/callback',{}, {},{code:'invalid'})).code,400);
 assert.equal((await call('GET','/api/auth/outlook/url')).code,503);
});
test('SQL mutations cannot bypass application relationship validation',async()=>{
 assert.equal((await call('POST','/api/database/query',{sql:'DELETE FROM customers'})).code,400);
 assert.equal((await call('POST','/api/database/query',{sql:'SELECT * FROM users; DELETE FROM customers'})).code,400);
});
after(()=>{fs.rmSync(folder,{recursive:true,force:true});});
