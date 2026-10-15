import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { PaymentMilestone } from '../../types';
import {
  CalendarCheck,
  Search,
  Receipt,
  CheckCircle2,
  Layers,
  ExternalLink,
  Edit3,
  FileText,
  RefreshCw,
  Check,
  X,
  ArrowUpRight,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface MilestonesViewProps {
  initialFilter?: string;
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string, invoiceId?: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  initialFilter,
  onOpenTrace,
  onNavigateToInvoice,
  onNavigateToOrder,
  onNavigateToReport,
}) => {
  const {
    milestones,
    orders,
    generateProformaFromMilestone,
    generateInvoiceFromMilestone,
    updateOrderMilestones,
    formatCurrency,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Milestone Schedule Revision Modal
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingMilestones, setEditingMilestones] = useState<PaymentMilestone[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter === 'ALL') {
      setStatusFilter('ALL');
      setSearchQuery('');
    } else if (initialFilter === 'FILTER:OVERDUE') {
      setStatusFilter('Overdue');
    } else if (initialFilter === 'FILTER:UNBILLED' || initialFilter === 'FILTER:UPCOMING') {
      setStatusFilter('Upcoming');
    } else if (initialFilter === 'FILTER:PAID') {
      setStatusFilter('Paid');
    } else {
      setStatusFilter('ALL');
      setSearchQuery(initialFilter);
    }
  }, [initialFilter]);

  const filteredMilestones = milestones.filter((m) => {
    const matchesSearch =
      m.milestoneCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.proformaInvoiceNumber &&
        m.proformaInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.invoiceNumber && m.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const isOverdue = m.status !== 'Paid' && m.dueDate < today;
    const effectiveStatus = isOverdue ? 'Overdue' : m.status;
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGenerateProforma = (milestoneId: string) => {
    const pi = generateProformaFromMilestone(milestoneId);
    if (pi) {
      setBannerMessage(
        `Proforma Invoice ${pi.invoiceNumber} generated for ${formatCurrency(pi.grandTotal)}.`
      );
      onNavigateToInvoice(pi.id);
    }
  };

  const handleGenerateInvoice = (milestoneId: string) => {
    const inv = generateInvoiceFromMilestone(milestoneId);
    if (inv) {
      setBannerMessage(
        `GST Tax Invoice ${inv.invoiceNumber} generated for ${formatCurrency(inv.grandTotal)}.`
      );
      onNavigateToInvoice(inv.id);
    }
  };

  const handleOpenEditSchedule = (orderId: string) => {
    const orderM = milestones.filter((m) => m.salesOrderId === orderId);
    setEditingOrderId(orderId);
    setEditingMilestones(JSON.parse(JSON.stringify(orderM)));
  };

  const currentEditOrder = orders.find((o) => o.id === editingOrderId);
  const editTotalPct = editingMilestones.reduce((acc, m) => acc + Number(m.percentage || 0), 0);
  const editTotalAmt = editingMilestones.reduce((acc, m) => acc + Number(m.amount || 0), 0);
  const isPctValid = Math.abs(editTotalPct - 100) < 0.01;
  const isAmtValid = currentEditOrder
    ? Math.abs(editTotalAmt - currentEditOrder.grandTotal) < 1.0
    : false;

  const handleSaveRevisedSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderId || !currentEditOrder) return;
    if (!isPctValid || !isAmtValid) return;

    const success = updateOrderMilestones(editingOrderId, editingMilestones);
    if (success) {
      setEditingOrderId(null);
      setBannerMessage(
        `Milestone schedule updated for ${currentEditOrder.orderNumber} (100% validated).`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>CRM Payment Milestones & Billing</span>
          </h2>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clickable KPI Strip with Modern Icon Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer card-depth ${
            statusFilter === 'ALL' && !searchQuery
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/15'
              : 'hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              All Milestones
            </span>
            <div className="icon-depth icon-depth-slate w-6 h-6 shrink-0">
              <CalendarCheck className="w-3.5 h-3.5 text-slate-700" />
            </div>
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {formatCurrency(milestones.reduce((s, m) => s + m.amount, 0))}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {milestones.length} scheduled stage(s)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Overdue')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer card-depth ${
            statusFilter === 'Overdue'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/15'
              : 'hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Overdue Milestones
            </span>
            <div className="icon-depth icon-depth-rose w-6 h-6 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-rose-700 mt-1 truncate">
            {milestones.filter((m) => m.status !== 'Paid' && m.dueDate < today).length} Overdue
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">
            Click to filter past due
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Upcoming')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer card-depth ${
            statusFilter === 'Upcoming'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/15'
              : 'hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Upcoming / Unbilled
            </span>
            <div className="icon-depth icon-depth-amber w-6 h-6 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-amber-800 mt-1 truncate">
            {milestones.filter((m) => !m.invoiceId).length} Unbilled
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            Ready for PI / Tax Invoice
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Paid')}
          className={`text-left p-3.5 rounded-xl border transition group cursor-pointer card-depth ${
            statusFilter === 'Paid'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/15'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Paid Milestones
            </span>
            <div className="icon-depth icon-depth-emerald w-6 h-6 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-base font-extrabold font-mono tabular-nums text-emerald-800 mt-1 truncate">
            {formatCurrency(milestones.reduce((s, m) => s + m.paidAmount, 0))}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            {milestones.filter((m) => m.status === 'Paid').length} settled stage(s)
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('gst_tax_register')}
          className="text-left p-3.5 rounded-xl border bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Billing &amp; Tax Report
            </span>
            <div className="icon-depth icon-depth-sky w-6 h-6 shrink-0">
              <Receipt className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-base font-extrabold text-indigo-900 mt-1 truncate">
            GST Register
          </div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">
            Open Tax Register →
          </span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search milestone, customer, SO #, PI #, INV #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Milestone Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Due">Due</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>

          <span className="text-[11px] text-slate-400 font-mono px-2">
            Showing {filteredMilestones.length} of {milestones.length}
          </span>
        </div>
      </div>

      {/* Milestones Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5">Milestone</th>
                <th className="p-3.5">Customer & Sales Order</th>
                <th className="p-3.5">Description & Deliverables</th>
                <th className="p-3.5 text-right">Percent</th>
                <th className="p-3.5 text-right">Amount & Balance</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Proforma / Tax Invoice</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No milestones match current filter.
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((m) => {
                  const isOverdue = m.status !== 'Paid' && m.dueDate < today;
                  const displayStatus = isOverdue ? 'Overdue' : m.status;
                  const remainingBal = Math.max(0, m.amount - m.paidAmount);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {m.milestoneCode}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{m.customerName}</div>
                        <button
                          onClick={() => onNavigateToOrder(m.salesOrderId)}
                          className="font-mono text-amber-700 hover:underline text-[11px] font-semibold flex items-center gap-1 mt-0.5"
                        >
                          <span>{m.salesOrderNumber}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <span className="text-slate-800 font-medium block truncate">
                          {m.description}
                        </span>
                        {m.remarks && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {m.remarks}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-slate-700">{m.percentage}%</span>
                      </td>

                      <td className="p-3.5 text-right font-mono tabular-nums">
                        <span className="font-extrabold text-slate-900 block">
                          {formatCurrency(m.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold block ${
                            remainingBal > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {remainingBal > 0
                            ? `Rem: ${formatCurrency(remainingBal)}`
                            : 'Fully Paid'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono font-medium ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {m.dueDate}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            displayStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : displayStatus === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : displayStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>

                      <td className="p-3.5 space-y-1">
                        {m.proformaInvoiceNumber && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onNavigateToInvoice(m.proformaInvoiceId!)}
                              className="font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded hover:underline font-bold text-[10px]"
                            >
                              {m.proformaInvoiceNumber}
                            </button>
                          </div>
                        )}
                        {m.invoiceNumber ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onNavigateToInvoice(m.invoiceId!)}
                              className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded hover:underline font-bold text-[10px]"
                            >
                              {m.invoiceNumber}
                            </button>
                            {m.isShared && (
                              <span
                                className="text-[10px] text-emerald-600 font-semibold flex items-center"
                                title="Shared with client"
                              >
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        ) : !m.proformaInvoiceNumber ? (
                          <span className="text-[11px] text-slate-400 italic">Unbilled</span>
                        ) : null}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {!m.proformaInvoiceId && !m.invoiceId && (
                            <button
                              onClick={() => handleGenerateProforma(m.id)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg text-[11px] transition flex items-center gap-1"
                              title="Generate Proforma Invoice (PI)"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Proforma</span>
                            </button>
                          )}

                          {!m.invoiceId ? (
                            <button
                              onClick={() => handleGenerateInvoice(m.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[11px] shadow-2xs transition flex items-center gap-1"
                              title={
                                m.proformaInvoiceId
                                  ? 'Convert Proforma to GST Tax Invoice'
                                  : 'Generate GST Tax Invoice'
                              }
                            >
                              {m.proformaInvoiceId ? (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Convert to Tax</span>
                                </>
                              ) : (
                                <>
                                  <Receipt className="w-3 h-3" />
                                  <span>Tax Invoice</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigateToInvoice(m.invoiceId!)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition"
                            >
                              View Invoice
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditSchedule(m.salesOrderId)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit Milestones for this Order"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              onOpenTrace(
                                undefined,
                                m.customerId,
                                m.salesOrderId,
                                m.invoiceId || m.proformaInvoiceId
                              )
                            }
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Trace Lifecycle Graph"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVISE MILESTONES MODAL */}
      {editingOrderId && currentEditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Revise Milestone Schedule - {currentEditOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Grand Total:{' '}
                  <strong className="font-mono tabular-nums text-slate-800">
                    {formatCurrency(currentEditOrder.grandTotal)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setEditingOrderId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRevisedSchedule} className="p-6 space-y-4 text-xs">
              {/* Validation Status Realtime Callout */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isPctValid && isAmtValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div>
                  <span className="font-bold">Validation Status:</span>
                  <span className="ml-1">
                    Sum Percent: <strong>{editTotalPct}%</strong> (Required: 100%) | Sum Amount:{' '}
                    <strong>{formatCurrency(editTotalAmt)}</strong>
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    isPctValid && isAmtValid
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {isPctValid && isAmtValid ? '✓ Valid (100%)' : '⚠ Validation Failed'}
                </span>
              </div>

              {/* Editable rows */}
              <div className="space-y-3">
                {editingMilestones.map((milestone, idx) => (
                  <div
                    key={milestone.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-2 font-mono font-bold text-indigo-700">
                      {milestone.milestoneCode}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingMilestones((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, description: val } : m))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={milestone.percentage}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const amt = Math.round((currentEditOrder.grandTotal * pct) / 100);
                            setEditingMilestones((prev) =>
                              prev.map((m, i) =>
                                i === idx ? { ...m, percentage: pct, amount: amt } : m
                              )
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold text-right font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => {
                          const amt = Number(e.target.value);
                          setEditingMilestones((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, amount: amt } : m))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold text-right font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => {
                          const dt = e.target.value;
                          setEditingMilestones((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, dueDate: dt } : m))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingOrderId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isPctValid || !isAmtValid}
                  className={`px-5 py-2 font-bold rounded-lg shadow-xs transition ${
                    isPctValid && isAmtValid
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Save Validated Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
