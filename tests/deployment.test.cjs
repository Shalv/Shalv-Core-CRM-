const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawnSync}=require('node:child_process');
const output=path.resolve('.vercel/output');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'enact360-function-'));
fs.cpSync(path.join(output,'functions/api.func'),folder,{recursive:true});
const child=`
 const http=require('node:http');
 const fn=require('./index.cjs');
 const server=http.createServer((req,res)=>{Promise.resolve(fn(req,res)).catch(error=>{res.statusCode=599;res.end(String(error));});});
 server.listen(0,'127.0.0.1',async()=>{
  try{
   const response=await fetch('http://127.0.0.1:'+server.address().port+process.env.TEST_URL,{method:process.env.TEST_METHOD||'GET',headers:{'Content-Type':'application/json'},body:process.env.TEST_BODY||undefined});
   const body=await response.text();console.log(JSON.stringify({status:response.status,body,contentType:response.headers.get('content-type')}));
  }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
 });
`;
fs.writeFileSync(path.join(folder,'smoke.cjs'),child);
function call(overrides={}) {
 const result=spawnSync(process.execPath,['smoke.cjs'],{cwd:folder,encoding:'utf8',timeout:15000,env:{...process.env,NODE_ENV:'production',CRM_TEST_MODE:'false',VERCEL:'',AWS_LAMBDA_FUNCTION_NAME:'',DATABASE_URL:'',AUTH_SECRET:'',TEST_URL:'/api/state',...overrides}});
 assert.equal(result.status,0,result.stderr);const lines=result.stdout.trim().split('\n');return JSON.parse(lines.at(-1));
}
test('deployment contains exactly one function and declared Node 22 handler',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(output,'config.json')));
 const fnConfig=JSON.parse(fs.readFileSync(path.join(folder,'.vc-config.json')));
 assert.equal(config.version,3);assert.equal(fnConfig.runtime,'nodejs22.x');assert.equal(fnConfig.handler,'index.cjs');
 assert.deepEqual(fs.readdirSync(path.join(output,'functions')),['api.func']);
 assert.equal(fs.existsSync('api'),false);assert.ok(fs.existsSync(path.join(output,'static/index.html')));
 assert.equal(fs.existsSync(path.join(folder,'node_modules')),false);
});
test('isolated deployed artifact starts with no source files or node_modules; missing settings give JSON 503',()=>{
 const r=call();assert.equal(r.status,503);assert.match(r.contentType,/json/);assert.match(JSON.parse(r.body).message,/DATABASE_URL and AUTH_SECRET/);
});
test('unavailable PostgreSQL returns JSON 503 rather than a function crash',()=>{
 const r=call({DATABASE_URL:'postgresql://test:test@127.0.0.1:1/test',AUTH_SECRET:'deployment-test-secret',TEST_URL:'/api/auth/verify',TEST_METHOD:'POST',TEST_BODY:'{"identifier":"admin","password":"Admin@CoreEnact2026"}'});
 assert.equal(r.status,503);assert.equal(JSON.parse(r.body).success,false);assert.match(r.contentType,/json/);
});
test('rewrite routing restores the API path instead of serving the frontend or unknown endpoint',()=>{
 const r=call({CRM_TEST_MODE:'true',TEST_URL:'/api?__enact_path=%2Fapi%2Fauth%2Fverify',TEST_METHOD:'POST',TEST_BODY:'{"identifier":"missing-user","password":"wrong-password"}'});
 assert.equal(r.status,401);assert.equal(JSON.parse(r.body).authenticated,false);
});
test('malformed input returns JSON 400 without crashing the deployed handler',()=>{
 const r=call({TEST_URL:'/api/auth/verify',TEST_METHOD:'POST',TEST_BODY:'{invalid'});assert.equal(r.status,400);assert.equal(JSON.parse(r.body).success,false);
});
test('an initialization exception is caught at the deployed entry and reports JSON diagnostics',()=>{
 fs.renameSync(path.join(folder,'application.cjs'),path.join(folder,'application.saved.cjs'));
 try{const r=call();assert.equal(r.status,503);assert.equal(JSON.parse(r.body).code,'BACKEND_INITIALIZATION_FAILED');}finally{fs.renameSync(path.join(folder,'application.saved.cjs'),path.join(folder,'application.cjs'));}
});
after(()=>fs.rmSync(folder,{recursive:true,force:true}));
