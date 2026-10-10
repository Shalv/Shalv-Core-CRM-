import React from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  X,
  ArrowRight,
  UserCheck,
  Briefcase,
  Building,
  FileSpreadsheet,
  CalendarCheck,
  Receipt,
  CreditCard,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface LifecycleTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // can provide any of these starting anchors:
  leadId?: string;
  customerId?: string;
  orderId?: string;
  invoiceId?: string;
  opportunityId?: string;
  onNavigateToModule?: (module: string, itemId?: string) => void;
}

export const LifecycleTraceModal: React.FC<LifecycleTraceModalProps> = ({
  isOpen,
  onClose,
  leadId,
  customerId,
  orderId,
  invoiceId,
  opportunityId,
  onNavigateToModule,
}) => {
  const {
    leads,
    opportunities,
    customers,
    orders,
    milestones,
    invoices,
    payments,
    formatCurrency,
  } = useCrm();

  if (!isOpen) return null;

  // Resolve connected graph across all 7 stages
  let activeLead = leadId ? leads.find((l) => l.id === leadId) : undefined;
  let activeOpportunity = opportunityId
    ? opportunities.find((o) => o.id === opportunityId)
    : undefined;
  let activeCustomer = customerId ? customers.find((c) => c.id === customerId) : undefined;
  let activeOrder = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const activeInvoice = invoiceId ? invoices.find((i) => i.id === invoiceId) : undefined;

  // If start is invoice, resolve order, customer
  if (activeInvoice && !activeOrder && activeInvoice.salesOrderId) {
    activeOrder = orders.find((o) => o.id === activeInvoice.salesOrderId);
  }
  if (activeInvoice && !activeCustomer) {
    activeCustomer = customers.find((c) => c.id === activeInvoice.customerId);
  }

  // If start is order, resolve opportunity, customer, lead
  if (activeOrder && !activeCustomer) {
    activeCustomer = customers.find((c) => c.id === activeOrder!.customerId);
  }
  if (activeOrder && !activeOpportunity && activeOrder.opportunityReferenceId) {
    activeOpportunity = opportunities.find((o) => o.id === activeOrder!.opportunityReferenceId);
  }
  if (activeOrder && !activeLead && activeOrder.leadReferenceId) {
    activeLead = leads.find((l) => l.id === activeOrder!.leadReferenceId);
  }

  // If start is opportunity, resolve lead, customer, order
  if (activeOpportunity && !activeLead && activeOpportunity.leadId) {
    activeLead = leads.find((l) => l.id === activeOpportunity!.leadId);
  }
  if (activeOpportunity && !activeCustomer && activeOpportunity.customerId) {
    activeCustomer = customers.find((c) => c.id === activeOpportunity!.customerId);
  }
  if (activeOpportunity && !activeOrder && activeOpportunity.convertedSalesOrderId) {
    activeOrder = orders.find((o) => o.id === activeOpportunity!.convertedSalesOrderId);
  }

  // If start is customer, resolve lead and orders
  if (activeCustomer && !activeLead && activeCustomer.fromLeadId) {
    activeLead = leads.find((l) => l.id === activeCustomer!.fromLeadId);
  }

  // If start is lead, resolve opportunity, customer, order
  if (activeLead && !activeOpportunity) {
    activeOpportunity = opportunities.find(
      (o) => o.id === activeLead!.convertedOpportunityId || o.leadId === activeLead!.id
    );
  }
  if (activeLead && !activeCustomer && activeLead.convertedCustomerId) {
    activeCustomer = customers.find((c) => c.id === activeLead!.convertedCustomerId);
  }
  if (activeLead && !activeOrder && activeLead.convertedSalesOrderId) {
    activeOrder = orders.find((o) => o.id === activeLead!.convertedSalesOrderId);
  }

  // Fallback opportunity lookup by customer or order
  if (!activeOpportunity && activeOrder) {
    activeOpportunity = opportunities.find((o) => o.convertedSalesOrderId === activeOrder!.id);
  }
  if (!activeOpportunity && activeCustomer) {
    activeOpportunity = opportunities.find((o) => o.customerId === activeCustomer!.id);
  }

  // Resolve child orders if not yet set
  const relatedOrders = activeCustomer
    ? orders.filter((o) => o.customerId === activeCustomer!.id)
    : [];
  if (!activeOrder && relatedOrders.length > 0) {
    activeOrder = relatedOrders[0];
  }

  // Related milestones for the order
  const orderMilestones = activeOrder
    ? milestones.filter((m) => m.salesOrderId === activeOrder!.id)
    : [];

  // Related invoices
  const orderInvoices = activeOrder
    ? invoices.filter((i) => i.salesOrderId === activeOrder!.id)
    : activeCustomer
    ? invoices.filter((i) => i.customerId === activeCustomer!.id)
    : [];

  // Related payments
  const relatedPayments = activeCustomer
    ? payments.filter((p) => p.customerId === activeCustomer!.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-600 rounded-lg shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">End-to-End Lifecycle Traceability</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Breadcrumb Flow visual */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-600">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  activeLead
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1. Lead</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  activeOpportunity
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>2. Opportunity</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  activeCustomer
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>3. Customer</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  activeOrder
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>4. Sales Order</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  orderMilestones.length > 0
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>5. Milestones</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  orderInvoices.length > 0
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>6. Invoice</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  relatedPayments.length > 0
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>7. Payment & Ledger</span>
              </div>
            </div>
          </div>

          {/* Node 1: Lead Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h4 className="font-semibold text-slate-800 text-sm">1. Origination: Lead</h4>
                {activeLead ? (
                  <span className="text-xs bg-blue-100 text-blue-700 font-mono px-2 py-0.5 rounded font-semibold">
                    {activeLead.leadNumber}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Direct Deal / No Lead Reference</span>
                )}
              </div>
              {activeLead && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                    activeLead.status === 'Won'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Status: {activeLead.status}
                </span>
              )}
            </div>

            {activeLead ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Company:</span>
                  <span className="font-semibold text-slate-800">{activeLead.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact:</span>
                  <span className="font-medium text-slate-700">
                    {activeLead.contactPerson} ({activeLead.mobile})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">State / Code:</span>
                  <span className="font-medium text-slate-700">
                    {activeLead.state} (Code: {activeLead.stateCode})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Est. Value:</span>
                  <span className="font-semibold text-indigo-700">
                    {formatCurrency(activeLead.estimatedValue)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                This transaction was initiated directly at Opportunity / Customer level.
              </p>
            )}
          </div>

          {/* Node 2: Opportunity Management */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                <h4 className="font-semibold text-slate-800 text-sm">
                  2. Opportunity Card & Deal Evaluation
                </h4>
                {activeOpportunity && (
                  <span className="text-xs bg-violet-100 text-violet-800 font-mono px-2 py-0.5 rounded font-semibold">
                    {activeOpportunity.opportunityNumber}
                  </span>
                )}
              </div>
              {activeOpportunity && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToModule?.('opportunities', activeOpportunity!.id);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  Open Opportunity Card <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeOpportunity ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">Opportunity Name:</span>
                    <span className="font-semibold text-slate-800">
                      {activeOpportunity.opportunityName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stage & Status:</span>
                    <span className="font-semibold text-indigo-700">
                      {activeOpportunity.stage} ({activeOpportunity.status})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Deal Value & Prob:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(activeOpportunity.estimatedDealValue)} ({activeOpportunity.probability}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Timeline & Tasks:</span>
                    <span className="font-medium text-slate-700">
                      {activeOpportunity.remarks.length} Remarks · {activeOpportunity.tasks.length} Tasks
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No opportunity card linked yet.</p>
            )}
          </div>

          {/* Node 3: Customer Master */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h4 className="font-semibold text-slate-800 text-sm">
                  3. Customer Master & Addresses
                </h4>
                {activeCustomer && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded font-semibold">
                    {activeCustomer.customerCode}
                  </span>
                )}
              </div>
              {activeCustomer && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToModule?.('customers', activeCustomer!.id);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  View 360 <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeCustomer ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Customer Name:</span>
                  <span className="font-semibold text-slate-800">{activeCustomer.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">GSTIN / State:</span>
                  <span className="font-mono text-slate-700">
                    {activeCustomer.gstin || 'Unregistered'} (
                    {activeCustomer.addresses[0]?.state} - {activeCustomer.addresses[0]?.stateCode})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Terms:</span>
                  <span className="font-medium text-slate-700">
                    {activeCustomer.paymentTermsName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Credit Limit:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(activeCustomer.creditLimit)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No customer linked yet.</p>
            )}
          </div>

          {/* Node 4: Sales Order */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="font-semibold text-slate-800 text-sm">4. Sales Order</h4>
                {activeOrder && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-semibold">
                    {activeOrder.orderNumber}
                  </span>
                )}
              </div>
              {activeOrder && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                    activeOrder.status === 'Approved' ||
                    activeOrder.status === 'In Progress' ||
                    activeOrder.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {activeOrder.status}
                </span>
              )}
            </div>

            {activeOrder ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">Order Date:</span>
                    <span className="font-medium text-slate-700">{activeOrder.orderDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tax Regime:</span>
                    <span className="font-medium text-slate-700">
                      {activeOrder.isInterState
                        ? 'Inter-state (IGST)'
                        : 'Intra-state (CGST + SGST)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tax Amount:</span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(activeOrder.totalTax)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Grand Total:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(activeOrder.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="text-xs">
                  <span className="text-slate-500 font-medium">Order Items:</span>
                  <div className="mt-1 space-y-1">
                    {activeOrder.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex justify-between items-center bg-white border border-slate-100 px-2.5 py-1 rounded"
                      >
                        <span className="text-slate-700 font-medium">
                          {it.productName} ({it.quantity} {it.uom})
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(it.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No sales order placed yet.</p>
            )}
          </div>

          {/* Node 5: Milestones */}
          {activeOrder && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    5. Payment Milestone Schedule (100% Validated)
                  </h4>
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">
                    {orderMilestones.length} Milestones
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-100 rounded-lg">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">%</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Linked Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderMilestones.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-purple-700">{m.milestoneCode}</td>
                        <td className="p-2 text-slate-700">{m.description}</td>
                        <td className="p-2 text-right font-medium">{m.percentage}%</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(m.amount)}</td>
                        <td className="p-2 text-slate-600">{m.dueDate}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : m.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700'
                                : m.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px] text-indigo-600">
                          {m.invoiceNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Node 6 & 7: Invoices & Payments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoices List */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <h4 className="font-semibold text-slate-800 text-sm">
                  6. Generated Invoices ({orderInvoices.length})
                </h4>
              </div>
              {orderInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No invoices issued yet.</p>
              ) : (
                <div className="space-y-2">
                  {orderInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-indigo-700">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total: {formatCurrency(inv.grandTotal)}</span>
                        <span className="text-rose-600 font-semibold">
                          Bal: {formatCurrency(inv.balanceAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments List */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="font-semibold text-slate-800 text-sm">
                  7. Payment Receipts & Collections ({relatedPayments.length})
                </h4>
              </div>
              {relatedPayments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments collected yet.</p>
              ) : (
                <div className="space-y-2">
                  {relatedPayments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-800">
                          {pmt.receiptNumber}
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(pmt.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>
                          Mode: {pmt.paymentMode} ({pmt.paymentDate})
                        </span>
                        <span className="font-mono">{pmt.transactionReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Unbroken Lead → Opportunity → Order → Invoice → Ledger Lineage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
