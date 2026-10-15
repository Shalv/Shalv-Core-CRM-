import React, { useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Wallet,
  Receipt,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Clock,
  BookOpen,
  Plus,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface FinanceExecutiveDashboardProps {
  onNavigate: (module: string, itemId?: string) => void;
  onOpenRecordPayment: () => void;
  horizonStartDate?: string;
}

export const FinanceExecutiveDashboard: React.FC<FinanceExecutiveDashboardProps> = ({
  onNavigate,
  onOpenRecordPayment,
  horizonStartDate,
}) => {
  const {
    invoices,
    payments,
    milestones,
    customers,
    formatCurrency,
    currentUser,
    canCreate,
    canView,
  } = useCrm();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Time-filtered datasets
  const filteredInvoices = useMemo(() => {
    if (!horizonStartDate) return invoices;
    return invoices.filter((i) => (i.invoiceDate || i.createdAt || '') >= horizonStartDate);
  }, [invoices, horizonStartDate]);

  const filteredPayments = useMemo(() => {
    if (!horizonStartDate) return payments;
    return payments.filter((p) => (p.paymentDate || p.createdAt || '') >= horizonStartDate);
  }, [payments, horizonStartDate]);

  // Tax vs Proforma invoices
  const taxInvoices = useMemo(
    () => filteredInvoices.filter((i) => (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled'),
    [filteredInvoices]
  );

  const totalInvoiced = taxInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTaxable = taxInvoices.reduce((sum, i) => sum + (i.subtotalTaxable || 0), 0);
  const totalGst = Math.max(0, totalInvoiced - totalTaxable);
  const totalCgst = taxInvoices.reduce((sum, i) => sum + (i.totalCgst || 0), 0);
  const totalSgst = taxInvoices.reduce((sum, i) => sum + (i.totalSgst || 0), 0);
  const totalIgst = taxInvoices.reduce((sum, i) => sum + (i.totalIgst || 0), 0);

  // Collections & Receivables
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
  const realizationPct = totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 100)) : 100;

  // Overdue Invoices
  const overdueInvoices = useMemo(() => {
    return taxInvoices
      .filter((i) => i.balanceAmount > 0 && i.dueDate < todayStr && i.status !== 'Cancelled')
      .sort((a, b) => (b.balanceAmount || 0) - (a.balanceAmount || 0));
  }, [taxInvoices, todayStr]);

  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

  // Pending Invoices
  const pendingInvoices = useMemo(() => {
    return taxInvoices.filter((i) => i.balanceAmount > 0 && i.status !== 'Cancelled');
  }, [taxInvoices]);

  // Milestones Due for Billing
  const milestonesDue = useMemo(() => {
    return milestones.filter((m) => ['Due', 'Upcoming'].includes(m.status));
  }, [milestones]);

  // Top Customer Outstanding Balances
  const customerBalances = useMemo(() => {
    return customers
      .map((c) => {
        const custInvoices = invoices.filter(
          (i) => i.customerId === c.id && (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled'
        );
        const custPayments = payments.filter((p) => p.customerId === c.id);
        const billed = custInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
        const received = custPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = Math.max(0, billed - received);
        return {
          customer: c,
          billed,
          received,
          balance,
        };
      })
      .filter((item) => item.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [customers, invoices, payments]);

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Gross Billed Revenue */}
        <button
          type="button"
          onClick={() => onNavigate('invoices')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Tax Invoiced</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {formatCurrency(totalInvoiced)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 font-medium">
              Taxable: <span className="font-mono">{formatCurrency(totalTaxable)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{taxInvoices.length} Tax Invoices</span>
            <span className="text-[11px] text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 font-medium">
              Invoices <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 2: Realized Collections */}
        <button
          type="button"
          onClick={() => onNavigate('payments')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Realized Collections</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {formatCurrency(totalCollected)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Realization Rate: <strong className="text-emerald-700">{realizationPct}%</strong>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filteredPayments.length} Receipts</span>
            <span className="text-[11px] text-slate-400 group-hover:text-emerald-600 flex items-center gap-0.5 font-medium">
              Receipts <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 3: Overdue Receivables */}
        <button
          type="button"
          onClick={() => onNavigate('invoices')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Receivables</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-rose-700">
              {formatCurrency(overdueTotal)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Total Outstanding: <span className="font-mono">{formatCurrency(totalOutstanding)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-rose-600 font-semibold">{overdueInvoices.length} Overdue</span>
            <span className="text-[11px] text-slate-400 group-hover:text-rose-600 flex items-center gap-0.5 font-medium">
              Aging <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 4: GST Output Tax Liability */}
        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GST Output Liability</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {formatCurrency(totalGst)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              IGST: {formatCurrency(totalIgst)} · C+S: {formatCurrency(totalCgst + totalSgst)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ready for GSTR-1 &amp; 3B</span>
            <span className="text-[11px] text-slate-400 group-hover:text-purple-600 flex items-center gap-0.5 font-medium">
              Reports <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>
      </div>

      {/* Main Grid: Overdue Invoices Aging Table + Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: High-Priority Overdue & Unpaid Invoices */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Overdue &amp; Pending Invoices Watchlist</span>
              </h3>
              <p className="text-xs text-slate-500">
                Action required for payment follow-up and ledger reconciliation
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-[#1f7e9e] hover:underline flex items-center gap-1"
            >
              View Invoices ({pendingInvoices.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
              All customer invoices are fully settled!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">Invoice / Customer</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Balance Due</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInvoices.slice(0, 5).map((inv) => {
                    const isOverdue = inv.dueDate < todayStr;
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => onNavigate('invoices', inv.id)}
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {inv.customerName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {inv.invoiceNumber} · GSTIN: {inv.customerGstin || 'Unregistered'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.dueDate} {isOverdue && '(Overdue)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-700">
                          {formatCurrency(inv.balanceAmount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {canCreate('payments') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRecordPayment();
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition whitespace-nowrap"
                            >
                              Collect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Milestone Billing Schedule */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1f7e9e]" />
                  <span>Milestones Billing Queue</span>
                </h4>
                <p className="text-xs text-slate-500">Upcoming deliverables ready to bill</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('milestones')}
                className="text-xs font-semibold text-[#1f7e9e] hover:underline"
              >
                All Milestones →
              </button>
            </div>

            {milestonesDue.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No milestones currently pending billing.
              </div>
            ) : (
              <div className="space-y-2.5">
                {milestonesDue.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-xs truncate">
                        {m.description || m.milestoneCode}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SO: {m.salesOrderNumber} · Due: {m.dueDate || 'Upon Delivery'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(m.amount)}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {milestonesDue.length} milestones pending bill generation
            </span>
            <button
              type="button"
              onClick={() => onNavigate('milestones')}
              className="text-[#1f7e9e] font-semibold hover:underline flex items-center gap-1"
            >
              Open Milestone Manager <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Receipts Log + Top Receivables by Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 Cols: Recent Payment Receipts Log */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Recent Payment Collections Log</span>
              </h4>
              <p className="text-xs text-slate-500">Latest realized funds into company accounts</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-[#1f7e9e] hover:underline"
            >
              View Journal →
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredPayments.slice(0, 4).map((pay) => (
              <div
                key={pay.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition bg-slate-50/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-xs truncate">
                    {pay.customerName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {pay.transactionReference || pay.receiptNumber} · {pay.paymentDate}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-emerald-700">
                    +{formatCurrency(pay.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500">{pay.paymentMode}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: Customer Ledger Outstanding Watchlist */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Customer Ledger &amp; AR Watchlist</span>
              </h4>
              <p className="text-xs text-slate-500">Accounts with highest outstanding balances</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ledger')}
              className="text-xs font-semibold text-[#1f7e9e] hover:underline"
            >
              Customer Ledger →
            </button>
          </div>

          <div className="space-y-2.5">
            {customerBalances.slice(0, 4).map((item) => (
              <div
                key={item.customer.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/60 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-xs truncate">
                    {item.customer.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Credit Limit: {formatCurrency(item.customer.creditLimit || 0)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-xs text-rose-700">
                    {formatCurrency(item.balance)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('ledger', item.customer.id)}
                    className="text-[10px] font-semibold text-[#1f7e9e] hover:underline"
                  >
                    Statement →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
