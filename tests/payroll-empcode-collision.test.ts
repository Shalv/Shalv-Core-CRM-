import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import express from 'express';

// A payroll master save that returns 4xx rolls the whole state transaction back, so an employee
// blocked by a duplicate code never reaches the server while the CRM user created alongside it
// does - the reported "shows in CRM user master, not in payroll". These tests pin two things:
// a duplicate that already exists between records nobody is editing must NOT wedge every future
// save, and a duplicate introduced by the current request must still be rejected.
process.env.CRM_TEST_MODE='false';process.env.VERCEL='1';process.env.DATABASE_URL='postgresql://local:local@127.0.0.1:1/test';process.env.AUTH_SECRET='payroll-collision-test-secret';

const master=(userId:string,empCode:string,email:string,name:string)=>({
  userId,empCode,email,name,username:email.split('@')[0],role:'Sales Executive',department:'Sales',
  designation:'Executive',status:'Active',accessType:'payroll_only',enrolledInPayroll:true,monthlyGross:60000,
});

// emp-a and emp-b share EMP-101: a collision that exists in stored data, not one being written now.
const seed={
  stateInitialized:true,documentCounters:{},
  users:[
    {id:'usr-1',name:'Shalv Sharma',username:'admin',email:'admin@coreenact.com',role:'Super Admin',status:'Active',accessScope:'all'},
    {id:'emp-a',name:'Collision A',username:'collision.a',email:'collision.a@example.com',role:'Sales Executive',status:'Active',empCode:'EMP-101'},
    {id:'emp-b',name:'Collision B',username:'collision.b',email:'collision.b@example.com',role:'Sales Executive',status:'Active',empCode:'EMP-101'},
  ],
  payrollMasters:{'emp-a':master('emp-a','EMP-101','collision.a@example.com','Collision A'),'emp-b':master('emp-b','EMP-101','collision.b@example.com','Collision B')},
  deletedPayrollMasterIds:[],payrollLoans:[],deletedLoanIds:[],crmSlices:{},
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
assert.equal(login.status,200,'admin must sign in to drive payroll master writes');
const adminCookie=(login.headers.get('set-cookie')||'').split(';')[0];
const masters=async()=>Object.keys(((await (await call('/api/payroll/masters',undefined,adminCookie)).json()).masters)||{});

test('a pre-existing duplicate employee code does not block saving a new, unique employee',async()=>{
 const response=await call('/api/payroll/masters',{masters:{'emp-fresh':master('emp-fresh','EMP-102','fresh@example.com','Fresh Hire')},patch:true,deletedUserIds:[],clearedUserIds:['emp-fresh']},adminCookie);
 const body=await response.json();
 assert.equal(response.status,200,JSON.stringify(body));
 assert.equal(body.success,true);
 const keys=await masters();
 assert.ok(keys.includes('emp-fresh'),'new employee payroll record must be stored');
 assert.ok(keys.includes('emp-a')&&keys.includes('emp-b'),'untouched records must survive');
});

test('a duplicate code introduced by the current request is still rejected',async()=>{
 const response=await call('/api/payroll/masters',{masters:{'emp-clash':master('emp-clash','EMP-102','clash@example.com','Clashing Hire')},patch:true,deletedUserIds:[],clearedUserIds:['emp-clash']},adminCookie);
 const body=await response.json();
 assert.equal(response.status,400);
 assert.match(body.message,/Duplicate Employee Code EMP-102/);
 assert.ok(!(await masters()).includes('emp-clash'),'rejected record must not be stored');
});

test('a duplicate email introduced by the current request is still rejected',async()=>{
 const response=await call('/api/payroll/masters',{masters:{'emp-mail':master('emp-mail','EMP-130','fresh@example.com','Duplicate Mailer')},patch:true,deletedUserIds:[],clearedUserIds:['emp-mail']},adminCookie);
 const body=await response.json();
 assert.equal(response.status,400);
 assert.match(body.message,/Duplicate Employee Email fresh@example.com/);
});

test('saving a superseded record by email tombstones the previous owner instead of colliding',async()=>{
 const reEnroll=master('emp-fresh','EMP-102','fresh@example.com','Fresh Hire Renamed');
 const response=await call('/api/payroll/masters',{masters:{'emp-fresh':reEnroll},patch:true,deletedUserIds:[],clearedUserIds:['emp-fresh']},adminCookie);
 assert.equal(response.status,200);
 const storedMasters:any=(await (await call('/api/payroll/masters',undefined,adminCookie)).json()).masters;
 assert.equal(storedMasters['emp-fresh'].name,'Fresh Hire Renamed');
});

test('cleanup closes the test server',async()=>{
 Pool.prototype.connect=originalConnect;
 await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
});
