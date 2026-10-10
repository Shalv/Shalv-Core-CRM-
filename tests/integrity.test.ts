import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,payment,invoice,line,order} from './fixtures';
import {auditSnapshot,reconcileSnapshot,mergeSnapshots,findReferences,nextDocumentNumber,assignDocumentNumbers,validatePaymentLinks,validateInvoiceDocument,milestoneInvoiceItems,newRecordId} from '../src/shared/integrity';
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const cache=new Map<string,string>();
(globalThis as any).localStorage={getItem:(key:string)=>cache.get(key) ?? null,setItem:(key:string,value:string)=>cache.set(key,value)};

test('customer identity and document caches follow IDs, not names',()=>{
 const source=fixture();source.customers[0].name='Renamed Customer';
 const result=reconcileSnapshot(source);
 assert.equal(result.orders[0].customerName,'Renamed Customer');assert.equal(result.invoices[0].customerName,'Renamed Customer');
 assert.equal(result.invoices[0].customerId,'c1');assert.equal(auditSnapshot(result).length,0);
});
test('receipts, TDS, invoice/milestone/order balances and ledger stay consistent after add and delete',()=>{
 const base=reconcileSnapshot(fixture());
 const result=reconcileSnapshot({...base,payments:[payment('r1',20,{tdsDeducted:2}),payment('r2',30)]});
 assert.equal(result.invoices[0].paidAmount,50);assert.equal(result.invoices[0].balanceAmount,68);assert.equal(result.milestones[0].paidAmount,50);assert.equal(result.orders[0].paidAmount,50);
 assert.equal(result.payments[0].netReceived,18);assert.equal(result.ledgerEntries.at(-1).runningBalance,68);
 const deleted=reconcileSnapshot({...result,payments:[]});assert.equal(deleted.invoices[0].paidAmount,0);assert.equal(deleted.invoices[0].balanceAmount,118);assert.equal(deleted.ledgerEntries.at(-1).runningBalance,118);
 assert.equal(auditSnapshot(deleted).length,0);
});
test('converted proforma collections are allocated once and never double-post the invoice',()=>{
 const source=fixture();source.invoices=[{...invoice,id:'pi1',invoiceNumber:'CSPI-00001',invoiceType:'Proforma',status:'Converted',convertedToTaxInvoiceId:'i1'}, {...invoice,proformaInvoiceId:'pi1'}] as any;
 const base=reconcileSnapshot(source);const result=reconcileSnapshot({...base,payments:[payment('r1',20,{invoiceId:'pi1'})]});
 assert.equal(result.payments[0].invoiceId,'i1');assert.equal(result.invoices.find((i:any)=>i.id==='i1').paidAmount,20);
 assert.equal(result.ledgerEntries.filter((e:any)=>e.type==='INVOICE').length,1);assert.equal(result.ledgerEntries.at(-1).runningBalance,98);
});
test('existing opening collections are retained explicitly, not recreated after deleting a receipt',()=>{
 const source=fixture();source.invoices[0].paidAmount=20;
 const result=reconcileSnapshot(source);assert.equal(result.invoices[0].openingPaidAmount,20);assert.equal(result.ledgerEntries.at(-1).runningBalance,98);
 assert.deepEqual(reconcileSnapshot(result),result);
});
test('payments reject cross-customer, wrong order, invalid TDS, overpayment and cancelled invoice links',()=>{
 const source=fixture();assert.throws(()=>validatePaymentLinks(source,payment('r',20,{customerId:'c2'})),/customer/);
 assert.throws(()=>validatePaymentLinks(source,payment('r',20,{tdsDeducted:30})),/TDS/);
 assert.throws(()=>validatePaymentLinks(source,payment('r',119)),/exceeds/);
 assert.throws(()=>validatePaymentLinks({...source,invoices:[{...invoice,status:'Cancelled'}]},payment()),/cancelled/);
 assert.throws(()=>validatePaymentLinks(source,payment('r',20,{milestoneId:'missing'})),/no longer|does not belong/);
});
test('master and parent deletion guards find the complete dependency graph',()=>{
 const source=fixture();assert.ok(findReferences(source,'customers','c1').some(ref=>ref.startsWith('invoices')));
 assert.ok(findReferences(source,'orders','o1').some(ref=>ref.startsWith('milestones')));
 assert.ok(findReferences(source,'products','p1').some(ref=>ref.startsWith('orders')));
 assert.ok(auditSnapshot({...source,customers:[]}).some(i=>i.field==='customerId'));
});
test('independent edits merge; concurrent field edits and stale deletions conflict',()=>{
 const base=fixture(),local=clone(base),remote=clone(base);
 local.customers[0].name='Changed name';remote.customers[1].name='Other session';
 let result=mergeSnapshots(base,local,remote);assert.equal(result.conflicts.length,0);assert.equal(result.snapshot.customers[1].name,'Other session');
 remote.customers[0].name='Conflict';result=mergeSnapshots(base,local,remote);assert.ok(result.conflicts.length);
 assert.ok(mergeSnapshots(base,{...base,customers:[]},remote).conflicts.length);
 const removed={...base,customers:base.customers.slice(1)};assert.ok(mergeSnapshots(base,local,removed).conflicts.some(c=>c.includes('deleted')));
});
test('empty collections delete records and stale unchanged rows do not resurrect deletions',()=>{
 const base={products:[{id:'p1',name:'A'}]};assert.deepEqual(mergeSnapshots(base,{products:[]},base).snapshot.products,[]);
 assert.deepEqual(mergeSnapshots(base,base,{products:[]}).snapshot.products,[]);
});
test('independent simultaneous receipts recalculate derived totals from both payments',()=>{
 const base=reconcileSnapshot(fixture());const local=reconcileSnapshot({...base,payments:[payment('r1',20)]});const remote=reconcileSnapshot({...base,payments:[payment('r2',30)]});
 const merged=mergeSnapshots(base,local,remote);assert.deepEqual(merged.conflicts,[]);
 const result=reconcileSnapshot(merged.snapshot);assert.equal(result.invoices[0].paidAmount,50);assert.equal(result.ledgerEntries.at(-1).runningBalance,68);
 assert.ok(auditSnapshot(reconcileSnapshot({...base,payments:[payment('over',120)]})).some(i=>i.message.includes('exceed')));
});
test('document sequences are separate, do not reuse deleted numbers, and the server allocates across sessions',()=>{
 const tax=nextDocumentNumber('invoices',[invoice],'Tax');const pi=nextDocumentNumber('invoices',[],'Proforma');
 assert.equal(tax,'CSINV-00002');assert.equal(pi,'CSPI-00001');assert.equal(nextDocumentNumber('invoices',[],'Tax'),'CSINV-00003');
 const counters:Record<string,number>={};const first=assignDocumentNumbers({invoices:[invoice]},{invoices:[invoice,{...invoice,id:'new',invoiceNumber:invoice.invoiceNumber}]},counters);
 assert.equal(first.invoices[1].invoiceNumber,'CSINV-00002');
 const next=assignDocumentNumbers({invoices:[]},{invoices:[{...invoice,id:'next'}]},JSON.parse(JSON.stringify(counters)));assert.equal(next.invoices[0].invoiceNumber,'CSINV-00003');
 const ids=new Set(Array.from({length:1000},()=>newRecordId()));assert.equal(ids.size,1000);
});
test('mixed-rate and zero-rate milestone invoices retain line tax rates and exact amount',()=>{
 const mixed={...order,items:[line,{...line,id:'zero',gstRate:0,cgstAmount:0,sgstAmount:0,totalTax:0,lineTotal:100}],grandTotal:218};
 const items=milestoneInvoiceItems(mixed,{milestoneCode:'M1',description:'Advance',amount:109});
 assert.equal(items[0].gstRate,18);assert.equal(items[1].gstRate,0);assert.equal(items.reduce((n,i)=>n+i.lineTotal,0),109);
 validateInvoiceDocument({...invoice,items,subtotalTaxable:100,totalCgst:4.5,totalSgst:4.5,totalIgst:0,totalTax:9,grandTotal:109});
 assert.throws(()=>validateInvoiceDocument({...invoice,grandTotal:999}),/match/);
 assert.throws(()=>validateInvoiceDocument({...invoice,isInterState:true}),/place of supply/);
});
test('contract consumed hours reconcile from edited and deleted ticket records',()=>{
 const base=reconcileSnapshot({...fixture(),amcContracts:[{id:'amc1',customerId:'c1',includedHours:100,consumedHours:0,status:'Active',endDate:'2026-12-31'}]});
 const next=reconcileSnapshot({...base,supportTickets:[{id:'t1',customerId:'c1',contractId:'amc1',hoursLogged:5}]});assert.equal(next.amcContracts[0].consumedHours,5);
 const edited=reconcileSnapshot({...next,supportTickets:[{...next.supportTickets[0],hoursLogged:2}]});assert.equal(edited.amcContracts[0].consumedHours,2);
 assert.equal(reconcileSnapshot({...edited,supportTickets:[]}).amcContracts[0].consumedHours,0);
});
