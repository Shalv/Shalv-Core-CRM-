import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import express from 'express';
process.env.CRM_TEST_MODE='false';process.env.VERCEL='1';process.env.DATABASE_URL='postgresql://local:local@127.0.0.1:1/test';process.env.AUTH_SECRET='http-regression-test-secret';
let stored:any=null;
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
let adminCookie='';
test('serverless entry returns JSON; anonymous reads and writes are blocked',async()=>{
 const response=await call('/api/state');assert.equal(response.status,401);assert.match(response.headers.get('content-type')||'',/json/);
 assert.equal((await call('/api/users',{user:{id:'unauthorized',role:'Super Admin'}})).status,401);
});
test('server login rejects bad credentials and issues a working HttpOnly session',async()=>{
 assert.equal((await call('/api/auth/verify',{identifier:'admin',password:'wrong'})).status,401);
 assert.equal((await call('/api/auth/verify',{identifier:'admin',password:'password123'})).status,401);
 assert.equal((await call('/api/auth/verify',{identifier:'admin',password:''})).status,400);
 const response=await call('/api/auth/verify',{identifier:'admin',password:process.env.ADMIN_PASSWORD || 'Coreenact@321#'});assert.equal(response.status,200);
 assert.match(response.headers.get('set-cookie')||'',/HttpOnly/);adminCookie=(response.headers.get('set-cookie')||'').split(';')[0];
 const account=await response.json();assert.equal(account.user.passwordHash,undefined);
 assert.equal((await call('/api/state',undefined,adminCookie)).status,200);
 assert.equal((await (await call('/api/auth/session',undefined,adminCookie)).json()).user.username,'admin');
});
test('created account logs in; password change persists and ordinary users cannot change privileges',async()=>{
 const user={id:'test-http',name:'HTTP User',username:'http-user',email:'http@example.com',password:'First@123',role:'Sales Executive',status:'Active'};
 assert.equal((await call('/api/users',{user},adminCookie)).status,200);
 let response=await call('/api/auth/verify',{identifier:user.email,password:user.password});assert.equal(response.status,200);
 const cookie=(response.headers.get('set-cookie')||'').split(';')[0];
 assert.equal((await call('/api/users',{user:{...user,role:'Super Admin'}},cookie)).status,403);
 assert.equal((await call('/api/database/export',undefined,cookie)).status,403);
 response=await call('/api/auth/change-password',{userId:user.id,currentPassword:user.password,newPassword:'Changed@123',confirmPassword:'Changed@123'},cookie);assert.equal(response.status,200);
 assert.equal((await call('/api/auth/verify',{identifier:user.username,password:user.password})).status,401);
 assert.equal((await call('/api/auth/verify',{identifier:user.username,password:'Changed@123'})).status,200);
 assert.equal((await call('/api/auth/change-password',{userId:'usr-1',currentPassword:process.env.ADMIN_PASSWORD || 'Coreenact@321#',newPassword:'Wrong@123',confirmPassword:'Wrong@123'},cookie)).status,403);
});
test('employee created in Payroll Master logs into ESS portal with email and admin-set password, then changes password from profile for further login',async()=>{
 const empMaster={
  userId:'emp-ess-901',
  empCode:'EMP-901',
  name:'Neha Kulkarni',
  username:'neha.kulkarni',
  email:'neha.kulkarni@enact360.com',
  password:'AdminInit@2026',
  tempPassword:'AdminInit@2026',
  accessType:'payroll_only',
  role:'Sales Executive',
  department:'Sales',
  designation:'Account Manager',
  status:'Active',
  enrolledInPayroll:true,
  monthlyGross:72000
 };
 assert.equal((await call('/api/payroll/masters',{masters:{'emp-ess-901':empMaster},createCrmUsers:false},adminCookie)).status,200);
 const firstLogin=await call('/api/auth/verify',{identifier:'neha.kulkarni@enact360.com',password:'AdminInit@2026'});
 assert.equal(firstLogin.status,200);
 const empCookie=(firstLogin.headers.get('set-cookie')||'').split(';')[0];
 const changeRes=await call('/api/auth/change-password',{userId:'emp-ess-901',identifier:'neha.kulkarni@enact360.com',currentPassword:'AdminInit@2026',newPassword:'NehaPersonal@999',confirmPassword:'NehaPersonal@999'},empCookie);
 assert.equal(changeRes.status,200);
 const stateRes=await call('/api/state',undefined,adminCookie);
 const stateJson=await stateRes.json();
 assert.equal((await call('/api/state',{snapshot:stateJson.snapshot,force:true},adminCookie)).status,200);
 assert.equal((await call('/api/auth/verify',{identifier:'neha.kulkarni@enact360.com',password:'AdminInit@2026'})).status,401);
 assert.equal((await call('/api/auth/verify',{identifier:'neha.kulkarni@enact360.com',password:'NehaPersonal@999'})).status,200);
 assert.equal((await call('/api/auth/verify',{identifier:'EMP-901',password:'NehaPersonal@999'})).status,200);
 const crmLoginAttempt = await call('/api/auth/verify', { identifier: 'neha.kulkarni@enact360.com', password: 'NehaPersonal@999', portalMode: 'crm' });
 assert.equal(crmLoginAttempt.status, 403);
 const crmLoginJson = await crmLoginAttempt.json();
 assert.match(crmLoginJson.message, /Access Restricted/);
});
test('ESS updates permitted employee fields with audit trail, protects admin fields, and reflects in admin state', async () => {
 const adminLogin = await call('/api/auth/verify', { identifier: 'admin', password: 'Coreenact@321#' });
 assert.equal(adminLogin.status, 200);
 const adminData = await adminLogin.json();
 assert.equal(adminData.user.username, 'admin');
 assert.equal(adminData.user.mustChangePasswordOnFirstLogin || false, false);

 const empLogin = await call('/api/auth/verify', { identifier: 'EMP-901', password: 'NehaPersonal@999' });
 assert.equal(empLogin.status, 200);
 const empCookie = (empLogin.headers.get('set-cookie') || '').split(';')[0];

 const patchPayload = {
  profile: {
   personalEmail: 'neha.personal@gmail.com',
   phone: '+91 98765 43210',
   alternatePhone: '+91 98765 43211',
   currentAddress: 'Flat 402, Lotus Heights, Bengaluru',
   permanentAddress: '12, Shanti Nagar, Pune',
   city: 'Bengaluru',
   state: 'Karnataka',
   pinCode: '560001',
   emergencyContactName: 'Rohan Kulkarni',
   emergencyContactPhone: '+91 98765 00000',
   emergencyContactRelation: 'Spouse',
   highestQualification: 'B.Tech Computer Science',
   institute: 'Pune University',
   passingYear: '2020',
   documents: [{ id: 'doc-1', name: 'PAN Card Copy.pdf', type: 'PAN Card', uploadedAt: '2026-10-13T10:00:00.000Z' }],
   monthlyGross: 999999,
   role: 'Super Admin',
   status: 'Terminated',
  },
  statutory: {
   bankName: 'Axis Bank',
   bankAccountNo: '912345678901234',
   ifscCode: 'UTIB0000123',
   panNumber: 'ABCDE1234F',
   uanNumber: '100987654321',
   pfAccountNo: 'MH/PUN/0012345/000/0001234',
   taxRegime: 'New Tax Regime (Section 115BAC)',
  },
 };

 const updateRes = await call('/api/payroll/ess/emp-ess-901', patchPayload, empCookie);
 assert.equal(updateRes.status, 200);
 const updateJson = await updateRes.json();
 assert.equal(updateJson.success, true);

 assert.equal(updateJson.updatedEmployee.monthlyGross, 72000);
 assert.notEqual(updateJson.updatedEmployee.role, 'Super Admin');

 assert.equal(updateJson.updatedEmployee.personalEmail, 'neha.personal@gmail.com');
 assert.equal(updateJson.updatedEmployee.bankName, 'Axis Bank');
 assert.equal(updateJson.updatedEmployee.bankAccountNo, '912345678901234');
 assert.equal(updateJson.updatedEmployee.ifscCode, 'UTIB0000123');
 assert.equal(updateJson.updatedEmployee.highestQualification, 'B.Tech Computer Science');
 assert.equal(updateJson.updatedEmployee.emergencyContactName, 'Rohan Kulkarni');
 assert.equal(updateJson.updatedEmployee.documents?.length, 1);

 const adminMastersRes = await call('/api/payroll/masters', undefined, adminCookie);
 assert.equal(adminMastersRes.status, 200);
 const adminMastersJson = await adminMastersRes.json();
 const syncedRecord = adminMastersJson.masters?.['emp-ess-901'];
 assert.ok(syncedRecord);
 assert.equal(syncedRecord.personalEmail, 'neha.personal@gmail.com');
 assert.equal(syncedRecord.emergencyContactName, 'Rohan Kulkarni');
 assert.equal(syncedRecord.monthlyGross, 72000);

 const auditLogsRes = await call('/api/audit-logs', undefined, adminCookie);
 assert.equal(auditLogsRes.status, 200);
 const auditLogsJson = await auditLogsRes.json();
 const allLogs = auditLogsJson.logs || auditLogsJson.auditLogs || [];
 const empAudits = allLogs.filter((l: any) => (l.entityType === 'Employee' || l.entity_type === 'Employee') && (l.entityId === 'emp-ess-901' || l.entity_id === 'emp-ess-901' || l.empCode === 'EMP-901'));
 assert.ok(empAudits.length > 0);
 const personalEmailAudit = empAudits.find((l: any) => (l.fieldName || l.field_name) === 'personalEmail');
 assert.ok(personalEmailAudit);
 assert.equal(personalEmailAudit.newValue || personalEmailAudit.new_value, 'neha.personal@gmail.com');
 assert.ok(personalEmailAudit.timestamp || personalEmailAudit.created_at);
 assert.ok(personalEmailAudit.performedByName || personalEmailAudit.user_name);
});
after(async()=>{Pool.prototype.connect=originalConnect;await new Promise<void>((r,e)=>server.close(err=>err?e(err):r()));});
