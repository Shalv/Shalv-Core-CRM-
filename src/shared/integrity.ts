/** Shared by the browser and server. IDs, relationships and derived balances have one definition. */
export type Snapshot = Record<string, any>;
export type IntegrityIssue = { key: string; slice: string; id: string; field: string; message: string };
export const same = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

const PENDING_USER_PASSWORDS_KEY = 'crm_pending_user_passwords_v1';
const memoryPendingPasswords: Record<string, string> = {};

export function recordPendingUserPassword(userId: string, password?: string): void {
  if (!userId || !password?.trim()) return;
  const cleanId = String(userId).trim();
  const cleanPass = password.trim();
  memoryPendingPasswords[cleanId] = cleanPass;
  try {
    const raw = localStorage.getItem(PENDING_USER_PASSWORDS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[cleanId] = cleanPass;
    localStorage.setItem(PENDING_USER_PASSWORDS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getPendingUserPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PENDING_USER_PASSWORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...parsed, ...memoryPendingPasswords };
  } catch {
    return { ...memoryPendingPasswords };
  }
}
export const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
export const rows = (s: Snapshot, key: string): any[] => Array.isArray(s[key]) ? s[key] : [];
let idCounter = 0;
export const newRecordId = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2)}`;

export const DOCUMENTS: Record<string, { field: string; prefix: string }> = {
  leads: { field: 'leadNumber', prefix: 'LEAD' }, customers: { field: 'customerCode', prefix: 'CUS' },
  opportunities: { field: 'opportunityNumber', prefix: 'OPP' }, orders: { field: 'orderNumber', prefix: 'SO' },
  invoices: { field: 'invoiceNumber', prefix: 'CSINV' }, payments: { field: 'receiptNumber', prefix: 'REC' },
  purchaseOrders: { field: 'poNumber', prefix: 'PO' }, supportTickets: { field: 'ticketNumber', prefix: 'TKT' },
  changeRequests: { field: 'crNumber', prefix: 'CHG' },
};
const sequenceKey = (slice: string, row?: any) => slice === 'invoices' ? `invoices:${row?.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'}` : slice;
const suffix = (value: any) => Number(String(value || '').match(/(\d+)$/)?.[1] || 0);
export function nextDocumentNumber(slice: string, records: any[], invoiceType?: string): string {
  const key = sequenceKey(slice, { invoiceType });
  const filtered = slice === 'invoices' ? records.filter(r => sequenceKey(slice, r) === key) : records;
  const config = DOCUMENTS[slice];
  let last = filtered.reduce((max, row) => Math.max(max, suffix(row[config.field])), 0);
  try { last = Math.max(last, Number(localStorage.getItem(`crm_sequence_${key}`)) || 0); } catch { /* server / SSR */ }
  last++;
  try { localStorage.setItem(`crm_sequence_${key}`, String(last)); } catch { /* storage full */ }
  const prefix = slice === 'invoices' && invoiceType === 'Proforma' ? 'CSPI' : config.prefix;
  return `${prefix}-${String(last).padStart(5, '0')}`;
}
/** Server owns final numbers. High water marks survive deletion and restart. */
export function assignDocumentNumbers(before: Snapshot, next: Snapshot, counters: Record<string, number>): Snapshot {
  const out = { ...next };
  for (const [slice, config] of Object.entries(DOCUMENTS)) {
    const old = new Set(rows(before, slice).map(r => String(r.id)));
    for (const row of rows(before, slice)) {
      const key = sequenceKey(slice, row);
      counters[key] = Math.max(counters[key] || 0, suffix(row[config.field]));
    }
    out[slice] = rows(next, slice).map(row => {
      const key = sequenceKey(slice, row);
      if (old.has(String(row.id))) return row;
      counters[key] = (counters[key] || 0) + 1;
      const prefix = slice === 'invoices' && row.invoiceType === 'Proforma' ? 'CSPI' : config.prefix;
      return { ...row, [config.field]: `${prefix}-${String(counters[key]).padStart(5, '0')}` };
    });
  }
  return out;
}

export type Relation = { from: string; field: string; to: string; label?: string; required?: boolean; nested?: string };
export const RELATIONS: Relation[] = [
  { from:'leads',field:'leadOwnerId',to:'users',label:'leadOwnerName' },
  { from:'leads',field:'convertedCustomerId',to:'customers' },
  { from:'leads',field:'convertedOpportunityId',to:'opportunities',label:'convertedOpportunityNumber' },
  { from:'leads',field:'convertedSalesOrderId',to:'orders' },
  { from:'opportunities',field:'leadId',to:'leads',label:'leadNumber' },
  { from:'opportunities',field:'customerId',to:'customers',label:'customerName' },
  { from:'opportunities',field:'salesOwnerId',to:'users',label:'salesOwnerName' },
  { from:'opportunities',field:'convertedSalesOrderId',to:'orders',label:'convertedSalesOrderNumber' },
  { from:'customers',field:'salesOwnerId',to:'users',label:'salesOwnerName' },
  { from:'customers',field:'paymentTermsId',to:'paymentTerms',label:'paymentTermsName' },
  { from:'contacts',field:'customerId',to:'customers',label:'customerName',required:true },
  { from:'orders',field:'customerId',to:'customers',label:'customerName',required:true },
  { from:'orders',field:'contactId',to:'contacts',label:'contactName' },
  { from:'orders',field:'leadReferenceId',to:'leads',label:'leadReferenceNumber' },
  { from:'orders',field:'opportunityReferenceId',to:'opportunities',label:'opportunityReferenceNumber' },
  { from:'orders',field:'salespersonId',to:'users',label:'salespersonName' },
  { from:'orders',field:'paymentTermsId',to:'paymentTerms',label:'paymentTermsName' },
  { from:'orders',field:'productId',to:'products',nested:'items' },
  { from:'purchaseOrders',field:'productId',to:'products',nested:'items' },
  { from:'milestones',field:'customerId',to:'customers',label:'customerName',required:true },
  { from:'milestones',field:'salesOrderId',to:'orders',label:'salesOrderNumber',required:true },
  { from:'milestones',field:'invoiceId',to:'invoices',label:'invoiceNumber' },
  { from:'milestones',field:'proformaInvoiceId',to:'invoices',label:'proformaInvoiceNumber' },
  ...['invoices','payments','amcContracts','supportTickets','changeRequests','ledgerEntries'].map(from => ({from,field:'customerId',to:'customers',label:from==='ledgerEntries'?undefined:'customerName',required:true})),
  ...['invoices','payments'].flatMap(from => [
    {from,field:'salesOrderId',to:'orders',label:'salesOrderNumber'},
    {from,field:'milestoneId',to:'milestones',label:'milestoneCode'},
  ]),
  { from:'payments',field:'invoiceId',to:'invoices',label:'invoiceNumber' },
  { from:'invoices',field:'proformaInvoiceId',to:'invoices',label:'proformaInvoiceNumber' },
  { from:'invoices',field:'convertedToTaxInvoiceId',to:'invoices',label:'convertedToTaxInvoiceNumber' },
  { from:'invoices',field:'amcContractId',to:'amcContracts',label:'amcContractNumber' },
  { from:'invoices',field:'ticketId',to:'supportTickets',label:'ticketNumber' },
  { from:'invoices',field:'changeRequestId',to:'changeRequests',label:'changeRequestNumber' },
  ...['supportTickets','changeRequests'].map(from => ({from,field:'contractId',to:'amcContracts',label:'contractNumber'})),
  { from:'supportTickets',field:'assignedToId',to:'users',label:'assignedToName' },
  { from:'supportTickets',field:'changeRequestId',to:'changeRequests',label:'changeRequestNumber' },
  ...['supportTickets','amcContracts'].map(from => ({from,field:'linkedInvoiceId',to:'invoices',label:'linkedInvoiceNumber'})),
  { from:'amcContracts',field:'accountManagerId',to:'users',label:'accountManagerName' },
  { from:'changeRequests',field:'ticketId',to:'supportTickets',label:'ticketNumber' },
  { from:'changeRequests',field:'taxInvoiceId',to:'invoices',label:'taxInvoiceNumber' },
  { from:'changeRequests',field:'proformaInvoiceId',to:'invoices',label:'proformaInvoiceNumber' },
  { from:'ledgerEntries',field:'invoiceId',to:'invoices' },
  { from:'ledgerEntries',field:'paymentId',to:'payments' },
  { from:'activities',field:'customerId',to:'customers' },
  { from:'activities',field:'leadId',to:'leads' },
  { from:'activities',field:'opportunityId',to:'opportunities' },
];
export function findReferences(snapshot: Snapshot, target: string, id: string): string[] {
  const references: string[] = [];
  for (const relation of RELATIONS.filter(r => r.to === target)) {
    for (const row of rows(snapshot, relation.from)) {
      const entries = relation.nested ? row[relation.nested] || [] : [row];
      if (entries.some((entry:any) => String(entry[relation.field]) === String(id))) references.push(`${relation.from} ${row.id}`);
    }
  }
  return [...new Set(references)];
}
const targetLabel = (slice: string, row:any, field:string) => {
  if (slice === 'users' || slice === 'customers' || slice === 'paymentTerms') return row.name;
  if (slice === 'contacts') return row.name || row.contactName || row.firstName;
  if (slice === 'milestones') return row.milestoneCode;
  return row[DOCUMENTS[slice]?.field || field];
};
export function auditSnapshot(snapshot: Snapshot): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const issue = (slice:string,id:any,field:string,message:string) => issues.push({ key:`${slice}/${id}/${field}/${message}`,slice,id:String(id),field,message });
  for (const [slice, records] of Object.entries(snapshot)) {
    if (!Array.isArray(records)) continue;
    const seen = new Set<string>();
    const numbers = new Set<string>();
    for (const row of records) {
      if (!row || row.id === undefined || row.id === '') { issue(slice,'?', 'id','Missing record ID'); continue; }
      if (seen.has(String(row.id))) issue(slice,row.id,'id','Duplicate record ID');
      seen.add(String(row.id));
      const doc = DOCUMENTS[slice];
      if (doc && row[doc.field]) {
        const num = String(row[doc.field]).trim().toUpperCase();
        if (numbers.has(num)) issue(slice,row.id,doc.field,'Duplicate document number');
        numbers.add(num);
      }
      for (const field of ['amount','quantity','unitRate','grandTotal','monthlyGross','hoursLogged','estimatedHours','hourlyRate','includedHours','consumedHours','percentage','discountPercent','tdsDeducted']) {
        if (row[field] !== undefined && (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)) issue(slice,row.id,field,'Invalid negative or non-finite value');
      }
      if (row.discountPercent > 100 || row.percentage > 100) issue(slice,row.id,'percentage','Percentage exceeds 100');
      if (slice === 'payments' && (Number(row.amount) <= 0 || Number(row.tdsDeducted || 0) > Number(row.amount))) issue(slice,row.id,'amount','Invalid payment or TDS amount');
      if (slice==='invoices') {
        try { validateInvoiceDocument(row); } catch(error) {issue(slice,row.id,'items',(error as Error).message);}
        if (Number(row.paidAmount || 0)>Number(row.grandTotal || 0)+0.01) issue(slice,row.id,'paidAmount','Allocated payments exceed invoice total');
      }
      if (slice==='orders' && Array.isArray(row.items)) {
        if(row.items.some((i:any)=>!Number.isFinite(i.quantity) || i.quantity<=0 || !Number.isFinite(i.unitRate) || i.unitRate<0 || i.discountPercent<0 || i.discountPercent>100)) issue(slice,row.id,'items','Invalid order quantity, rate or discount');
        if(Math.abs(money(row.items.reduce((n:number,i:any)=>n+Number(i.lineTotal || 0),0))-Number(row.grandTotal || 0))>0.02) issue(slice,row.id,'grandTotal','Order total does not match line items');
      }
      if (row.startDate && row.endDate && row.endDate < row.startDate) issue(slice,row.id,'endDate','End date precedes start date');
      if (row.invoiceDate && row.dueDate && row.dueDate < row.invoiceDate) issue(slice,row.id,'dueDate','Due date precedes invoice date');
    }
  }
  const indexes = Object.fromEntries(Object.keys(snapshot).map(key => [key,new Map(rows(snapshot,key).map(r=>[String(r.id),r]))]));
  for (const rel of RELATIONS) for (const row of rows(snapshot,rel.from)) {
    for (const entry of rel.nested ? row[rel.nested] || [] : [row]) {
      const value = entry[rel.field];
      if (!value) { if (rel.required) issue(rel.from,row.id,rel.field,'Required connection is missing'); continue; }
      if (!indexes[rel.to]?.has(String(value))) { issue(rel.from,row.id,rel.field,`Missing ${rel.to} record ${value}`); continue; }
      const parent = indexes[rel.to].get(String(value));
      if (row.customerId && parent.customerId && String(row.customerId) !== String(parent.customerId)) issue(rel.from,row.id,rel.field,'Connected records belong to different customers');
      if (row.salesOrderId && parent.salesOrderId && String(row.salesOrderId) !== String(parent.salesOrderId)) issue(rel.from,row.id,rel.field,'Connected records belong to different orders');
    }
  }
  for (const order of rows(snapshot,'orders')) {
    const schedule = rows(snapshot,'milestones').filter(m=>m.salesOrderId === order.id && m.status !== 'Cancelled');
    if (schedule.length && (Math.abs(schedule.reduce((n,m)=>n+Number(m.percentage),0)-100)>0.01 || Math.abs(schedule.reduce((n,m)=>n+Number(m.amount),0)-Number(order.grandTotal))>0.02)) issue('orders',order.id,'milestones','Milestones do not match 100% of order total');
  }
  for (const slice of ['users','products','licenseTypes']) {
    for (const field of slice === 'users' ? ['email','username'] : ['code']) {
      const seen = new Set<string>();
      for (const row of rows(snapshot,slice)) {
        const value=String(row[field] || '').trim().toLowerCase();
        if (value && seen.has(value)) issue(slice,row.id,field,`Duplicate ${field}`);
        if (value) seen.add(value);
      }
    }
  }
  return issues;
}

/** Update display caches by immutable ID. Never guess a connection using a person's name. */
export function reconcileSnapshot(input: Snapshot, today = new Date().toISOString().slice(0,10)): Snapshot {
  const s:Snapshot = JSON.parse(JSON.stringify(input));
  if (Array.isArray(s.users)) s.users=s.users.map((user:any)=>({...user,accessScope:user.accessScope==='PAYROLL_ONLY' || user.accessScope==='payroll_only' || user.accessType==='payroll_only' ? 'payroll_only' : 'all'}));
  for (const rel of RELATIONS.filter(r=>r.label && !r.nested)) {
    const map=new Map(rows(s,rel.to).map(r=>[String(r.id),r]));
    s[rel.from] = rows(s,rel.from).map(row=> {
      const target=map.get(String(row[rel.field]));
      const label=target && targetLabel(rel.to,target,rel.label!);
      return label !== undefined ? {...row,[rel.label!]:label} : row;
    });
  }
  const customersById=new Map(rows(s,'customers').map(c=>[c.id,c]));
  for(const key of ['amcContracts','supportTickets','changeRequests']) s[key]=rows(s,key).map(row=>{
    const customer=customersById.get(row.customerId);
    return customer ? {...row,customerCode:customer.customerCode} : row;
  });
  // Stage/status alignment follows the saved stage, while Won/Closed orders remain linked.
  s.opportunities=rows(s,'opportunities').map(o=>({...o,status:o.stage==='Won'?'Won':o.stage==='Lost'?'Lost':o.stage==='Deferred'?'Deferred':'Open',probability:o.stage==='Won'?100:o.stage==='Lost'?0:Math.max(0,Math.min(100,Number(o.probability || 0)))}));
  const invMap = new Map(rows(s,'invoices').map(r=>[r.id,r]));
  const canonical = (id:string):any => {
    const invoice=invMap.get(id);
    if (invoice?.invoiceType === 'Proforma' && invoice.convertedToTaxInvoiceId && invMap.has(invoice.convertedToTaxInvoiceId)) return invMap.get(invoice.convertedToTaxInvoiceId);
    return invoice;
  };
  s.payments = rows(s,'payments').map(p=> {
    let invoice=p.invoiceId ? canonical(p.invoiceId) : undefined;
    if (!invoice && !p.invoiceId && p.milestoneId) invoice=rows(s,'invoices').find(i=>i.milestoneId === p.milestoneId && i.invoiceType !== 'Proforma' && i.status !== 'Cancelled');
    const linked=invoice ? {invoiceId:invoice.id,invoiceNumber:invoice.invoiceNumber,salesOrderId:invoice.salesOrderId || p.salesOrderId,milestoneId:invoice.milestoneId || p.milestoneId} : {};
    return {...p,...linked,amount:money(Number(p.amount)),tdsDeducted:money(Number(p.tdsDeducted || 0)),netReceived:money(Number(p.amount)-Number(p.tdsDeducted || 0))};
  });
  const sumPayments=(filter:(p:any)=>boolean)=>money(rows(s,'payments').filter(filter).reduce((n,p)=>n+Number(p.amount || 0),0));
  s.invoices=rows(s,'invoices').map(i=> {
    const target=canonical(i.id);
    const fromReceipts=sumPayments(p=>p.invoiceId === target?.id);
    const openingPaidAmount=i.openingPaidAmount ?? Math.max(0,money(Number(i.paidAmount || 0)-fromReceipts));
    const paidAmount=money(fromReceipts+Number(openingPaidAmount));
    const balanceAmount=Math.max(0,money(Number(i.grandTotal || 0)-paidAmount));
    const status=['Cancelled','Converted','Draft','Submitted','Approved'].includes(i.status) ? i.status : balanceAmount<=0 && i.grandTotal>0 ? 'Paid' : paidAmount>0 ? 'Partially Paid' : i.dueDate<today ? 'Overdue' : 'Issued';
    return {...i,openingPaidAmount,paidAmount,balanceAmount,status};
  });
  s.milestones=rows(s,'milestones').map(m=> {
    const tax=rows(s,'invoices').find(i=>i.milestoneId === m.id && i.invoiceType !== 'Proforma' && i.status !== 'Cancelled');
    const pi=rows(s,'invoices').find(i=>i.milestoneId === m.id && i.invoiceType === 'Proforma' && i.status !== 'Cancelled');
    const receiptTotal=sumPayments(p=>p.milestoneId===m.id || (p.invoiceId && rows(s,'invoices').some(i=>i.id===p.invoiceId && i.milestoneId===m.id)));
    const openingPaidAmount=m.openingPaidAmount ?? Math.max(0,money(Number(m.paidAmount || 0)-receiptTotal));
    const paidAmount=money(receiptTotal+Number(openingPaidAmount));
    const status=m.status==='Cancelled' ? m.status : paidAmount>=m.amount && m.amount>0 ? 'Paid' : paidAmount>0 ? 'Partially Paid' : m.dueDate<today ? 'Overdue' : tax || pi ? 'Due' : 'Upcoming';
    return {...m,openingPaidAmount,paidAmount,status,invoicedAmount:tax?.grandTotal || 0,invoiceId:tax?.id,invoiceNumber:tax?.invoiceNumber,proformaInvoiceId:pi?.id,proformaInvoiceNumber:pi?.invoiceNumber};
  });
  const receiptTotals=new Map<string,number>();
  const updatedReceipts=new Map<string,any>();
  for(const p of [...rows(s,'payments')].sort((a,b)=>String(a.paymentDate).localeCompare(String(b.paymentDate)) || String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)))) {
    const target=p.invoiceId ? rows(s,'invoices').find(i=>i.id===p.invoiceId) : p.milestoneId ? rows(s,'milestones').find(m=>m.id===p.milestoneId) : rows(s,'orders').find(o=>o.id===p.salesOrderId);
    const key=p.invoiceId ? `invoice/${p.invoiceId}` : p.milestoneId ? `milestone/${p.milestoneId}` : `order/${p.salesOrderId}`;
    const paid=money((receiptTotals.get(key) || 0)+p.amount);receiptTotals.set(key,paid);
    updatedReceipts.set(p.id,{...p,remainingBalance:target ? Math.max(0,money(Number(target.grandTotal ?? target.amount ?? 0)-Number(target.openingPaidAmount || 0)-paid)) : 0});
  }
  s.payments=rows(s,'payments').map(p=>updatedReceipts.get(p.id) || p);
  s.orders=rows(s,'orders').map(o=> {
    const paidAmount=sumPayments(p=>p.salesOrderId===o.id);
    const invoicedAmount=money(rows(s,'invoices').filter(i=>i.salesOrderId===o.id && i.invoiceType!=='Proforma' && i.status!=='Cancelled').reduce((n,i)=>n+Number(i.grandTotal),0));
    return {...o,paidAmount,invoicedAmount,remainingBalance:Math.max(0,money(o.grandTotal-paidAmount)),paymentStatus:paidAmount>=o.grandTotal && o.grandTotal>0 ? 'Paid' : paidAmount>0 ? 'Partially Paid' : 'Unpaid'};
  });
  s.amcContracts=rows(s,'amcContracts').map(c=> {
    const hours=rows(s,'supportTickets').filter(t=>t.contractId===c.id).reduce((n,t)=>n+Number(t.hoursLogged || 0),0);
    const openingConsumedHours=c.openingConsumedHours ?? Math.max(0,Number(c.consumedHours || 0)-hours);
    return {...c,openingConsumedHours,consumedHours:money(hours+Number(openingConsumedHours)),status:!['Draft','Cancelled'].includes(c.status) && c.endDate<today ? 'Expired' : c.status};
  });
  // Deterministic ledger from live documents and receipts. Retain manual opening/adjustment entries.
  const existing=rows(s,'ledgerEntries');
  const manual=existing.filter(e=>e.type!=='INVOICE' && e.type!=='PAYMENT' && !String(e.id).startsWith('ledger-opening-payment-'));
  const postings=[...manual];
  for(const i of rows(s,'invoices').filter(i=>i.invoiceType!=='Proforma' && !['Cancelled','Draft','Submitted'].includes(i.status))) {
    const prev=existing.find(e=>e.invoiceId===i.id && e.type==='INVOICE');
    postings.push({...prev,id:prev?.id || `ledger-invoice-${i.id}`,customerId:i.customerId,date:i.invoiceDate,type:'INVOICE',referenceNumber:i.invoiceNumber,description:prev?.description || `Invoice ${i.invoiceNumber}`,debit:money(i.grandTotal),credit:0,invoiceId:i.id});
  }
  for(const i of rows(s,'invoices').filter(i=>i.invoiceType!=='Proforma' && i.status!=='Cancelled' && Number(i.openingPaidAmount)>0)) {
    postings.push({id:`ledger-opening-payment-${i.id}`,customerId:i.customerId,date:i.invoiceDate,type:'OPENING_BALANCE',referenceNumber:i.invoiceNumber,description:'Migrated previously recorded collection (receipt detail not available)',debit:0,credit:money(i.openingPaidAmount),invoiceId:i.id});
  }
  for(const p of rows(s,'payments')) {
    const prev=existing.find(e=>e.paymentId===p.id && e.type==='PAYMENT');
    postings.push({...prev,id:prev?.id || `ledger-payment-${p.id}`,customerId:p.customerId,date:p.paymentDate,type:'PAYMENT',referenceNumber:p.receiptNumber,description:prev?.description || `Payment ${p.receiptNumber}`,debit:0,credit:money(p.amount),paymentId:p.id});
  }
  const balances=new Map<string,number>();
  s.ledgerEntries=postings.sort((a,b)=>String(a.date).localeCompare(String(b.date)) || (a.type==='INVOICE' ? 0 : 1)-(b.type==='INVOICE' ? 0 : 1) || String(a.id).localeCompare(String(b.id))).map(e=> {
    const balance=money((balances.get(e.customerId) || 0)+Number(e.debit || 0)-Number(e.credit || 0));
    balances.set(e.customerId,balance); return {...e,runningBalance:balance};
  });
  return s;
}

export function validatePaymentLinks(snapshot:Snapshot,p:any):void {
  const fail=(message:string)=>{throw new Error(message);};
  if (!Number.isFinite(p.amount) || p.amount<=0 || !Number.isFinite(p.tdsDeducted || 0) || (p.tdsDeducted || 0)<0 || (p.tdsDeducted || 0)>p.amount) fail('Payment must be positive, with TDS between zero and the payment amount.');
  for (const [field,slice] of [['invoiceId','invoices'],['milestoneId','milestones'],['salesOrderId','orders']]) {
    if (!p[field]) continue;
    const parent=rows(snapshot,slice).find(r=>r.id===p[field]);
    if (!parent) fail(`The selected ${slice} record no longer exists.`);
    if (parent.customerId!==p.customerId) fail('Payment and linked documents must belong to the same customer.');
    if (p.salesOrderId && parent.salesOrderId && parent.salesOrderId!==p.salesOrderId) fail('Payment invoice, milestone and order do not belong to the same order.');
    if (field==='invoiceId' && ['Cancelled','Converted','Draft'].includes(parent.status)) fail('Payment cannot be recorded against a cancelled, converted or draft invoice.');
    if (field==='invoiceId' && p.milestoneId && parent.milestoneId!==p.milestoneId) fail('Selected milestone does not belong to the invoice.');
    if (field==='invoiceId' && p.amount>money(parent.grandTotal-(parent.paidAmount || 0))+0.01) fail('Payment exceeds invoice balance. Record the excess as a separate on-account receipt.');
  }
}

/** Three-way merge. Missing rows are deletions, including empty arrays. Never resurrect stale deletes. */
export function mergeSnapshots(base:Snapshot,local:Snapshot,remote:Snapshot):{snapshot:Snapshot;conflicts:string[]} {
  const snapshot={...remote}; const conflicts:string[]=[];
  for(const key of Object.keys(local)) {
    if(same(base[key],local[key])) continue;
    if(Array.isArray(local[key])) {
      const b=new Map(rows(base,key).map(r=>[String(r.id),r]));
      const l=new Map(rows(local,key).map(r=>[String(r.id),r]));
      const r=new Map(rows(remote,key).map(r=>[String(r.id),r]));
      for(const id of new Set([...b.keys(),...l.keys()])) {
        const before=b.get(id), next=l.get(id), current=r.get(id);
        if(same(before,next)) continue;
        if(!next) {
          if(current && !same(current,before)) conflicts.push(`${key}/${id}: record changed before deletion`);
          else r.delete(id);
        } else if(!before) {
          if(current && !same(current,next)) conflicts.push(`${key}/${id}: conflicting new record`);
          else r.set(id,next);
        } else if(!current) conflicts.push(`${key}/${id}: record was deleted elsewhere`);
        else {
          const merged={...current};
          for(const field of new Set([...Object.keys(before),...Object.keys(next)])) {
            if(same(before[field],next[field])) continue;
            if(!same(current[field],before[field]) && !same(current[field],next[field]) && !['updatedAt','lastLoginAt','paidAmount','balanceAmount','remainingBalance','runningBalance','consumedHours','invoicedAmount','paymentStatus'].includes(field) && !(field==='status' && ['invoices','milestones'].includes(key) && ['Paid','Partially Paid','Issued','Overdue','Due','Upcoming'].includes(String(next[field])))) conflicts.push(`${key}/${id}/${field}: concurrent change`);
            else if(next[field]===undefined) delete merged[field];
            else merged[field]=next[field];
          }
          r.set(id,merged);
        }
      }
      snapshot[key]=[...r.values()];
    } else if(!same(remote[key],base[key]) && !same(remote[key],local[key])) conflicts.push(`${key}: concurrent change`);
    else snapshot[key]=local[key];
  }
  return {snapshot,conflicts};
}

export function validateInvoiceDocument(invoice:any):void {
  if(!invoice.customerId || !invoice.billingAddress?.stateCode) throw new Error('Select a customer with a complete billing address and state code.');
  if(!Array.isArray(invoice.items) || !invoice.items.length) throw new Error('Add at least one invoice item.');
  for(const item of invoice.items) {
    for(const field of ['quantity','unitRate','taxableAmount','gstRate','cgstAmount','sgstAmount','igstAmount','totalTax','lineTotal']) if(!Number.isFinite(item[field]) || item[field]<0) throw new Error(`Invoice item ${field} must be a valid non-negative number.`);
    if(item.quantity<=0 || item.gstRate>100) throw new Error('Invoice quantities must be positive and tax rates cannot exceed 100%.');
    if(Math.abs(money(item.cgstAmount+item.sgstAmount+item.igstAmount)-item.totalTax)>0.02 || Math.abs(money(item.taxableAmount+item.totalTax)-item.lineTotal)>0.02) throw new Error('Invoice item tax and total amounts do not match.');
    if(invoice.isInterState ? item.cgstAmount>0 || item.sgstAmount>0 : item.igstAmount>0) throw new Error('Invoice tax split does not match the place of supply.');
  }
  const totals={subtotalTaxable:0,totalCgst:0,totalSgst:0,totalIgst:0,totalTax:0,grandTotal:0};
  for(const item of invoice.items) {totals.subtotalTaxable+=item.taxableAmount;totals.totalCgst+=item.cgstAmount;totals.totalSgst+=item.sgstAmount;totals.totalIgst+=item.igstAmount;totals.totalTax+=item.totalTax;totals.grandTotal+=item.lineTotal;}
  for(const [field,total] of Object.entries(totals)) if(!Number.isFinite(invoice[field]) || Math.abs(money(total)-invoice[field])>0.02) throw new Error(`Invoice ${field} must match its line items.`);
  if(invoice.dueDate<invoice.invoiceDate) throw new Error('Invoice due date cannot precede its invoice date.');
}
/** Preserve each item's tax rate when billing a milestone on a mixed-tax order. */
export function milestoneInvoiceItems(order:any,milestone:any):any[] {
  if(!Number.isFinite(order.grandTotal) || order.grandTotal<=0) throw new Error('A milestone invoice requires a positive sales order total.');
  const ratio=milestone.amount/order.grandTotal;
  const items=order.items.map((item:any)=> {
    const taxableAmount=money(item.taxableAmount*ratio);
    const cgstAmount=money(item.cgstAmount*ratio),sgstAmount=money(item.sgstAmount*ratio),igstAmount=money(item.igstAmount*ratio);
    const totalTax=money(cgstAmount+sgstAmount+igstAmount);
    return {id:`milestone-line-${newRecordId()}`,productName:item.productName,description:`${milestone.milestoneCode}: ${milestone.description}`,hsnSac:item.hsnSac,uom:item.uom,quantity:item.quantity,unitRate:money(taxableAmount/item.quantity),taxableAmount,gstRate:item.gstRate,cgstAmount,sgstAmount,igstAmount,totalTax,lineTotal:money(taxableAmount+totalTax)};
  });
  if(!items.length) throw new Error('The sales order has no invoiceable items.');
  const residual=money(milestone.amount-items.reduce((n:number,i:any)=>n+i.lineTotal,0));
  const last=items[items.length-1]; last.taxableAmount=money(last.taxableAmount+residual);last.lineTotal=money(last.lineTotal+residual);last.unitRate=money(last.taxableAmount/last.quantity);
  return items;
}
