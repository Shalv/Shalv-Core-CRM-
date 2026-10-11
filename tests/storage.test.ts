import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {postgresStateMiddleware} from '../backend/postgresState';
const clone=(v:any)=>JSON.parse(JSON.stringify(v));
function database() {
 let stored:any={stateInitialized:true,users:[{id:'admin'}],counter:0};
 let lock=Promise.resolve();let failCommit=false;
 return {get value(){return clone(stored);},fail(){failCommit=true;},async connect(){
   let releaseLock:()=>void=()=>{},pending:any;
   return {release(){},async query(sql:string,params:any[]=[]){
    if(sql.includes('pg_advisory')) {const previous=lock;lock=new Promise<void>(r=>releaseLock=r);await previous;pending=clone(stored);}
    if(sql.startsWith('SELECT payload'))return {rows:[{payload:JSON.stringify(pending)}]};
    if(sql.startsWith('UPDATE crm_state_store'))pending=JSON.parse(params[0]);
    if(sql==='COMMIT'){if(failCommit){failCommit=false;throw new Error('connection failed');}stored=clone(pending);releaseLock();}
    if(sql==='ROLLBACK')releaseLock();
    return {rows:[]};
   }};
 }};
}
async function instance(db:any) {
 let state:any={stateInitialized:true,users:[],counter:0},writer:(()=>void)|null=null;
 const app=express();
 app.use(postgresStateMiddleware(db,{capture:()=>clone(state),restore:s=>state=clone(s),setWriter:w=>writer=w}));
 app.get('/value',(_req,res)=>res.json(state));
 app.post('/increment',(_req,res)=>{state.counter++;writer?.();res.json(state);});
 app.post('/reject',(_req,res)=>{state.counter=999;writer?.();res.status(422).json({success:false});});
 app.post('/delete',(_req,res)=>{state.users=[];writer?.();res.json(state);});
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const port=(server.address() as any).port;
 return {call:(path:string,method='GET')=>fetch(`http://127.0.0.1:${port}${path}`,{method}),close:()=>new Promise<void>((r,e)=>server.close(err=>err?e(err):r()))};
}
test('independent instances reload under database lock and cannot lose concurrent writes',async()=>{
 const db=database(),a=await instance(db),b=await instance(db);
 try{const rs=await Promise.all(Array.from({length:10},(_,i)=>(i%2?a:b).call('/increment','POST')));assert.ok(rs.every(r=>r.status===200));assert.equal(db.value.counter,10);assert.equal((await (await a.call('/value')).json()).counter,10);}finally{await a.close();await b.close();}
});
test('failed commits return 503 and rollback both saved and in-process state',async()=>{
 const db=database(),a=await instance(db);
 try{db.fail();const r=await a.call('/increment','POST');assert.equal(r.status,503);assert.equal((await r.json()).success,false);assert.equal(db.value.counter,0);assert.equal((await (await a.call('/value')).json()).counter,0);assert.equal((await a.call('/increment','POST')).status,200);}finally{await a.close();}
});
test('rejected requests rollback; deleted users stay deleted across instances',async()=>{
 const db=database(),a=await instance(db),b=await instance(db);
 try{assert.equal((await a.call('/reject','POST')).status,422);assert.equal(db.value.counter,0);await a.call('/delete','POST');assert.deepEqual((await (await b.call('/value')).json()).users,[]);}finally{await a.close();await b.close();}
});
