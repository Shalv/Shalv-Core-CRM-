import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import React,{useState} from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {useApplicationSync} from '../src/context/useApplicationSync';
import {reconcileSnapshot,mergeSnapshots} from '../src/shared/integrity';
import {fixture} from './fixtures';
const values=new Map<string,string>();
const events=new EventTarget();
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
(globalThis as any).localStorage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
(globalThis as any).window={setTimeout,clearTimeout,setInterval,clearInterval,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),confirm:()=>true};
let instance:any,view:any,change:any,server:any,calls:any[],failure=0;
const wait=async(ms=300)=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,ms));});
function Harness(){const [snapshot,setSnapshot]=useState<any>({...fixture(),customers:[{id:'stale',name:'Cached wrong customer'}]});change=setSnapshot;view={snapshot,...useApplicationSync(snapshot,setSnapshot)};return null;}
async function mount(){values.clear();server=reconcileSnapshot(fixture());calls=[];failure=0;
 (globalThis as any).fetch=async(url:string,init:any)=>{calls.push({url,init});if(failure===503)throw new Error('Offline');if(init?.method==='POST'){if(failure===409)return {ok:false,status:409,json:async()=>({message:'Concurrent edit'})};const body=JSON.parse(init.body);server=reconcileSnapshot(mergeSnapshots(body.base,body.snapshot,server).snapshot);return {ok:true,status:200,json:async()=>({success:true,snapshot:server,issues:[]})};}return {ok:true,status:200,json:async()=>({snapshot:server,issues:[]})};};
 await act(async()=>{instance=TestRenderer.create(<Harness/>);});
}
afterEach(async()=>{if(instance)await act(async()=>instance.unmount());instance=null;});
test('startup hydrates authoritative records before any write, including empty collections',async()=>{await mount();await wait();assert.equal(view.ready,true);assert.equal(view.snapshot.customers[0].id,'c1');assert.equal(calls.filter(c=>c.init?.method==='POST').length,0);server={...server,contacts:[]};await act(async()=>{events.dispatchEvent(new Event('focus'));});assert.deepEqual(view.snapshot.contacts,[]);});
test('offline edits remain queued and save on reconnection with all linked data',async()=>{await mount();failure=503;await act(async()=>change((s:any)=>({...s,customers:s.customers.map((c:any)=>c.id==='c1'?{...c,name:'Locally edited'}:c)})));await wait();assert.equal(view.status.state,'offline');assert.ok(values.get('crm_pending_transaction_v2'));assert.equal(server.customers[0].name,'Customer 1');failure=0;await act(async()=>{events.dispatchEvent(new Event('online'));});assert.equal(server.customers[0].name,'Locally edited');assert.equal(server.invoices[0].customerName,'Locally edited');assert.equal(values.has('crm_pending_transaction_v2'),false);});
test('conflicting writes stop and retain local changes until the user reloads saved data',async()=>{await mount();failure=409;await act(async()=>change((s:any)=>({...s,customers:s.customers.map((c:any)=>({...c,name:'Unsaved conflict'}))})));await wait();assert.equal(view.status.state,'conflict');assert.equal(view.snapshot.customers[0].name,'Unsaved conflict');const count=calls.length;await act(async()=>{events.dispatchEvent(new Event('focus'));});assert.equal(calls.length,count);failure=0;await act(async()=>view.reloadSaved());assert.equal(view.snapshot.customers[0].name,'Customer 1');assert.equal(values.has('crm_pending_transaction_v2'),false);});
test('static-only hosting is identified without unlocking editing or writing cached data',async()=>{
 values.clear();calls=[];
 (globalThis as any).fetch=async()=>({ok:true,status:200,headers:{get:()=> 'text/html'},json:async()=>{throw new Error('Unexpected HTML');}});
 await act(async()=>{instance=TestRenderer.create(<Harness/>);});
 assert.equal(view.ready,false);assert.equal(view.status.state,'offline');assert.match(view.status.message,/only the frontend/);assert.equal(values.has('crm_pending_transaction_v2'),false);
});
test('incompatible API data remains blocked with a specific diagnosis',async()=>{
 values.clear();
 (globalThis as any).fetch=async()=>({ok:true,status:200,json:async()=>({success:true,data:[]})});
 await act(async()=>{instance=TestRenderer.create(<Harness/>);});
 assert.equal(view.ready,false);assert.match(view.status.message,/invalid saved-data response/);
});
