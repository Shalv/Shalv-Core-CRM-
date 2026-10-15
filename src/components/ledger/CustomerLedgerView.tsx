import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  BookOpen,
  Search,
  Download,
  Clock,
  ArrowUpRight,
  Calendar,
  FilterX,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  DateRangePicker,
  DateRange,
  isDateInRange,
  formatDisplayDate,
} from '../common/DateRangePicker';

interface CustomerLedgerViewProps {
  initialCustomerId?: string;
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string, invoiceId?: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  initialCustomerId,
  onOpenTrace,
  onNavigateToCustomer,
  onNavigateToInvoice,
  onNavigateToReport,
}) => {
  const {
    customers,
    ledgerEntries,
    invoices,
    payments,
    getCustomerBalance,
    formatCurrency,
  } = useCrm();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [viewTab, setViewTab] = useState<'statement' | 'aging'>('statement');

  useEffect(() => {
    if (!initialCustomerId) return;
    if (initialCustomerId === 'TAB:AGING') {
      setViewTab('aging');
    } else if (initialCustomerId === 'TAB:STATEMENT') {
      setViewTab('statement');
    } else {
      setSelectedCustomerId(initialCustomerId);
      setViewTab('statement');
    }
  }, [initialCustomerId]);

  const today = new Date();

  // Filter entries by Customer, Date Range, and Search Query
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      const cust = customers.find((c) => c.id === entry.customerId);
      const matchesCustomer = selectedCustomerId === 'ALL' || entry.customerId === selectedCustomerId;
      const matchesDate = isDateInRange(entry.date, dateRange);
      const matchesSearch =
        !searchQuery ||
        entry.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCustomer && matchesDate && matchesSearch;
    });
  }, [ledgerEntries, customers, selectedCustomerId, dateRange, searchQuery]);

  // Period movement metrics for the filtered date range
  const periodDebits = useMemo(() => {
    return filteredEntries.reduce((acc, e) => acc + (e.debit || 0), 0);
  }, [filteredEntries]);

  const periodCredits = useMemo(() => {
    return filteredEntries.reduce((acc, e) => acc + (e.credit || 0), 0);
  }, [filteredEntries]);

  const netPeriodMovement = periodDebits - periodCredits;

  const hasActiveFilters = Boolean(
    selectedCustomerId !== 'ALL' ||
    searchQuery ||
    dateRange.startDate ||
    dateRange.endDate
  );

  // Calculate Aging Buckets for all customers
  const customerAgingData = useMemo(() => {
    return customers.map((cust) => {
      const custInvoices = invoices.filter((i) => i.customerId === cust.id && i.balanceAmount > 0 && i.status !== 'Cancelled');
      const custBal = getCustomerBalance(cust.id);

      let currentNotDue = 0;
      let days1To30 = 0;
      let days31To60 = 0;
      let days61To90 = 0;
      let days90Plus = 0;

      custInvoices.forEach((inv) => {
        const dueDate = new Date(inv.dueDate);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          currentNotDue += inv.balanceAmount;
        } else if (diffDays <= 30) {
          days1To30 += inv.balanceAmount;
        } else if (diffDays <= 60) {
          days31To60 += inv.balanceAmount;
        } else if (diffDays <= 90) {
          days61To90 += inv.balanceAmount;
        } else {
          days90Plus += inv.balanceAmount;
        }
      });

      return {
        customer: cust,
        totalOutstanding: custBal.outstanding,
        creditLimit: custBal.creditLimit,
        availableCredit: custBal.availableCredit,
        currentNotDue,
        days1To30,
        days31To60,
        days61To90,
        days90Plus,
        overdueTotal: days1To30 + days31To60 + days61To90 + days90Plus,
      };
    });
  }, [customers, invoices, getCustomerBalance, today]);

  // Total summary
  const totalReceivables = customerAgingData.reduce((acc, c) => acc + c.totalOutstanding, 0);
  const totalOverdue = customerAgingData.reduce((acc, c) => acc + c.overdueTotal, 0);

  // Export to CSV with date range and filter metadata
  const handleExportStatement = () => {
    const headers = ['Date', 'Customer', 'Type', 'Reference #', 'Description', 'Debit', 'Credit', 'Running Balance'];
    const rows = filteredEntries.map((e) => {
      const cust = customers.find((c) => c.id === e.customerId);
      return [
        e.date,
        `"${cust?.name || ''}"`,
        e.type,
        e.referenceNumber,
        `"${e.description.replace(/"/g, '""')}"`,
        e.debit,
        e.credit,
        e.runningBalance,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    const dateTag = dateRange.startDate || dateRange.endDate
      ? `_${dateRange.startDate || 'start'}_to_${dateRange.endDate || 'latest'}`
      : `_${today.toISOString().split('T')[0]}`;
    link.setAttribute('download', `Customer_Ledger_Statement${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Customer Ledger & Receivables Aging (AR)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportStatement}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Receivables Summary Badges with Modern Icon Depth (All 4 clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setViewTab('statement');
            setSelectedCustomerId('ALL');
          }}
          className={`text-left bg-white p-4 rounded-xl border transition group cursor-pointer card-depth ${
            viewTab === 'statement' && selectedCustomerId === 'ALL'
              ? 'border-indigo-400 ring-2 ring-indigo-500/15 bg-indigo-50/20'
              : 'hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Total Outstanding AR</span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <Wallet className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {formatCurrency(totalReceivables)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">View Full Ledger Statement →</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('aging')}
          className={`text-left bg-white p-4 rounded-xl border transition group cursor-pointer card-depth ${
            viewTab === 'aging'
              ? 'border-rose-400 ring-2 ring-rose-500/15 bg-rose-50/40'
              : 'border-rose-200 bg-rose-50/20 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-rose-600 text-[11px] font-bold uppercase tracking-wider block">Total Overdue Amount</span>
            <div className="icon-depth icon-depth-rose w-7 h-7 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-rose-700 mt-1 truncate">
            {formatCurrency(totalOverdue)}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Open 0–90+ Aging Schedule →</span>
        </button>

        <button
          type="button"
          onClick={() => setViewTab('aging')}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Current (Not Yet Due)</span>
            <div className="icon-depth icon-depth-sky w-7 h-7 shrink-0">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-indigo-600 mt-1 truncate">
            {formatCurrency(customerAgingData.reduce((acc, c) => acc + c.currentNotDue, 0))}
          </div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">Within payment terms • Inspect →</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('gst_tax_register')}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Accounts with Balances</span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {customerAgingData.filter((c) => c.totalOutstanding > 0).length} of {customers.length}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Open GST Tax Register →</span>
        </button>
      </div>

      {/* View Selector Tabs — Zero Header Scrolling via Responsive Dropdown List */}
      <div>
        {/* Mobile / Tablet Dropdown Selector */}
        <div className="block sm:hidden w-full">
          <select
            value={viewTab}
            onChange={(e) => setViewTab(e.target.value as any)}
            aria-label="Select Ledger View"
            className="w-full header-dropdown-select bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="statement">📖 Ledger Statement Register</option>
            <option value="aging">🕒 Receivables Aging Schedule (0-90+ Days)</option>
          </select>
        </div>

        {/* Desktop View Selector Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => setViewTab('statement')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              viewTab === 'statement'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Ledger Statement Register</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('aging')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              viewTab === 'aging'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Receivables Aging Schedule (0-90+ Days)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Ledger Statement */}
      {viewTab === 'statement' && (
        <div className="space-y-4">
          {/* Filters Bar with DateRangePicker, Customer Selector, and Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <div className="flex flex-1 items-center gap-2.5 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search reference # or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Customer Selector */}
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customerCode} - {c.name}</option>
                ))}
              </select>

              {/* Reusable Date Range Picker */}
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="All Time"
                align="right"
              />

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId('ALL');
                    setDateRange({ startDate: '', endDate: '' });
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                  title="Reset all filters"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <span className="text-[11px] text-slate-400 font-medium px-1.5">
                {filteredEntries.length} Postings
              </span>
            </div>
          </div>

          {/* Active Date Filter Strip & Period Summary */}
          {(dateRange.startDate || dateRange.endDate) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Selected Period:</span>
                </span>
                <span className="font-semibold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {dateRange.startDate && dateRange.endDate
                    ? `${formatDisplayDate(dateRange.startDate)} – ${formatDisplayDate(dateRange.endDate)}`
                    : dateRange.startDate
                    ? `From ${formatDisplayDate(dateRange.startDate)} onwards`
                    : `Up to ${formatDisplayDate(dateRange.endDate)}`}
                </span>
                <div className="flex items-center gap-3 ml-2 text-[11px]">
                  <span className="text-slate-600">
                    Debits (Invoices): <strong className="text-rose-700 font-mono">{formatCurrency(periodDebits)}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Credits (Receipts): <strong className="text-emerald-700 font-mono">{formatCurrency(periodCredits)}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Net Movement:{' '}
                    <strong className={`font-mono ${netPeriodMovement >= 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                      {formatCurrency(netPeriodMovement)}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer shrink-0"
              >
                Clear Date Filter
              </button>
            </div>
          )}

          {/* Statement Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">Posting Date</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Document Ref #</th>
                    <th className="p-3.5">Transaction Description</th>
                    <th className="p-3.5 text-right text-rose-700">Debit (Invoice)</th>
                    <th className="p-3.5 text-right text-emerald-700">Credit (Payment)</th>
                    <th className="p-3.5 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="text-slate-500 font-medium text-xs">
                            No ledger postings found for the selected date range or search criteria.
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId('ALL');
                                setDateRange({ startDate: '', endDate: '' });
                                setSearchQuery('');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Clear All Filters</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const cust = customers.find((c) => c.id === entry.customerId);

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono text-slate-600">{entry.date}</td>
                          <td className="p-3.5">
                            <button
                              onClick={() => onNavigateToCustomer(entry.customerId)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left"
                            >
                              {cust?.name || 'Customer'}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                entry.type === 'INVOICE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {(() => {
                              const matchedInv = invoices.find(
                                (i) => i.invoiceNumber === entry.referenceNumber
                              );
                              if (matchedInv) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToInvoice(matchedInv.id)}
                                    className="font-mono font-bold text-indigo-700 hover:underline flex items-center gap-1"
                                  >
                                    <span>{entry.referenceNumber}</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                );
                              }
                              return (
                                <span className="font-mono font-bold text-indigo-700">
                                  {entry.referenceNumber}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3.5 text-slate-700">{entry.description}</td>
                          <td className="p-3.5 text-right font-medium text-rose-600">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                          </td>
                          <td className="p-3.5 text-right font-medium text-emerald-600">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Receivables Aging Breakdown */}
      {viewTab === 'aging' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer-wise Receivables Aging Analysis</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">As of {today.toISOString().split('T')[0]}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Total Outstanding</th>
                  <th className="p-3 text-right text-emerald-700">Not Due</th>
                  <th className="p-3 text-right text-amber-600">1 - 30 Days</th>
                  <th className="p-3 text-right text-orange-600">31 - 60 Days</th>
                  <th className="p-3 text-right text-rose-600">61 - 90 Days</th>
                  <th className="p-3 text-right text-rose-800">90+ Days</th>
                  <th className="p-3 text-right font-black">Total Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerAgingData.map((row) => (
                  <tr key={row.customer.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <button
                        onClick={() => onNavigateToCustomer(row.customer.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-left block"
                      >
                        {row.customer.name}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">{row.customer.customerCode}</span>
                    </td>
                    <td className="p-3 text-right text-slate-600">{formatCurrency(row.creditLimit)}</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(row.totalOutstanding)}</td>
                    <td className="p-3 text-right text-emerald-700 font-medium">
                      {row.currentNotDue > 0 ? formatCurrency(row.currentNotDue) : '—'}
                    </td>
                    <td className="p-3 text-right text-amber-600 font-medium">
                      {row.days1To30 > 0 ? formatCurrency(row.days1To30) : '—'}
                    </td>
                    <td className="p-3 text-right text-orange-600 font-medium">
                      {row.days31To60 > 0 ? formatCurrency(row.days31To60) : '—'}
                    </td>
                    <td className="p-3 text-right text-rose-600 font-medium">
                      {row.days61To90 > 0 ? formatCurrency(row.days61To90) : '—'}
                    </td>
                    <td className="p-3 text-right text-rose-800 font-bold">
                      {row.days90Plus > 0 ? formatCurrency(row.days90Plus) : '—'}
                    </td>
                    <td className="p-3 text-right font-extrabold text-rose-700">
                      {row.overdueTotal > 0 ? formatCurrency(row.overdueTotal) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
