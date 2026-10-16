import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { PaymentMode, PaymentStage, Invoice } from '../../types';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Trash2,
  X,
  ArrowUpRight,
  Wallet,
  Landmark,
  Receipt,
} from 'lucide-react';

interface PaymentsViewProps {
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string, invoiceId?: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
  initialFilter?: string;
  /** Bumped on every ACTION: navigation so the create dialog reopens on repeat clicks. */
  actionNonce?: number;
  presetInvoice?: Invoice | null;
  onClosePreset?: () => void;
}

const PAYMENT_STAGES: PaymentStage[] = [
  'Advance',
  'Milestone',
  'Delivery',
  'UAT / Go-Live',
  'Final Settlement',
  'Retention',
  'On Account',
];

const PAYMENT_MODES: PaymentMode[] = [
  'NEFT/RTGS',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Cash',
  'Card',
  'Other',
];

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenTrace,
  onNavigateToInvoice,
  onNavigateToCustomer,
  onNavigateToReport,
  initialFilter,
  actionNonce,
  presetInvoice,
  onClosePreset,
}) => {
  const {
    payments,
    recordPayment,
    deletePayment,
    customers,
    orders,
    invoices,
    milestones,
    formatCurrency,
    supplierCompany,
  } = useCrm();

  // Build dynamic company bank & cash account options from Company Setup (supplierCompany)
  const companyBankOptions = useMemo(() => {
    const primaryBankName = (
      supplierCompany?.bankDetails?.bankName ||
      supplierCompany?.bankName ||
      'Bank of Baroda'
    ).trim();
    const primaryAccNo = (
      supplierCompany?.bankDetails?.accountNumber ||
      supplierCompany?.accountNumber ||
      '71000200001745'
    ).trim();
    const primaryIfsc = (
      supplierCompany?.bankDetails?.ifscCode ||
      supplierCompany?.ifscCode ||
      ''
    ).trim();
    const primaryLast4 = primaryAccNo.length >= 4 ? primaryAccNo.slice(-4) : primaryAccNo;
    const primaryValue = primaryLast4
      ? `${primaryBankName} - ${primaryLast4}`
      : primaryBankName;
    const primaryLabel = `${primaryBankName} — A/c: ${primaryAccNo}${
      primaryIfsc ? ` (${primaryIfsc})` : ''
    }`;

    const list: Array<{ value: string; label: string }> = [
      { value: primaryValue, label: primaryLabel },
    ];

    if (Array.isArray(supplierCompany?.bankAccounts)) {
      supplierCompany.bankAccounts.forEach((acc) => {
        if (!acc.bankName?.trim()) return;
        const bName = acc.bankName.trim();
        const bAccNo = (acc.accountNumber || '').trim();
        const bIfsc = (acc.ifscCode || '').trim();
        const last4 = bAccNo.length >= 4 ? bAccNo.slice(-4) : bAccNo;
        const val = last4 ? `${bName} - ${last4}` : bName;
        const lbl = `${bName} (${acc.accountType || 'Current A/c'}) — A/c: ${bAccNo}${
          bIfsc ? ` (${bIfsc})` : ''
        }`;
        if (!list.some((item) => item.value === val)) {
          list.push({ value: val, label: lbl });
        }
      });
    }

    list.push({
      value: 'Cash in Hand / Office Petty Cash',
      label: 'Cash in Hand / Office Petty Cash',
    });

    return list;
  }, [supplierCompany]);

  const primaryBankValue = companyBankOptions[0]?.value || 'Bank of Baroda - 1745';
  const utrBankCode = useMemo(() => {
    const ifsc = (
      supplierCompany?.bankDetails?.ifscCode ||
      supplierCompany?.ifscCode ||
      ''
    ).trim();
    if (ifsc.length >= 4) return ifsc.slice(0, 4).toUpperCase();
    const bName = (
      supplierCompany?.bankDetails?.bankName ||
      supplierCompany?.bankName ||
      'BANK'
    ).trim();
    return (
      bName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4) || 'BANK'
    );
  }, [supplierCompany]);

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(Boolean(presetInvoice));

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    presetInvoice ? presetInvoice.customerId : customers[0]?.id || ''
  );
  const [selectedOrderId, setSelectedOrderId] = useState(
    presetInvoice?.salesOrderId || ''
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    presetInvoice ? presetInvoice.id : ''
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    presetInvoice?.milestoneId || ''
  );
  const [paymentStage, setPaymentStage] = useState<PaymentStage>(
    presetInvoice?.paymentStage || 'Milestone'
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(
    presetInvoice ? presetInvoice.balanceAmount : 100000
  );
  const [tdsDeducted, setTdsDeducted] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('NEFT/RTGS');
  const [bankCashAccount, setBankCashAccount] = useState<string>(primaryBankValue);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Keep selected bank account synced with Company Setup bank options
  useEffect(() => {
    if (!companyBankOptions.some((opt) => opt.value === bankCashAccount)) {
      setBankCashAccount(primaryBankValue);
    }
  }, [companyBankOptions, bankCashAccount, primaryBankValue]);

  useEffect(() => {
    if (presetInvoice) {
      setSelectedCustomerId(presetInvoice.customerId);
      setSelectedOrderId(presetInvoice.salesOrderId || '');
      setSelectedInvoiceId(presetInvoice.id);
      setSelectedMilestoneId(presetInvoice.milestoneId || '');
      setPaymentStage(presetInvoice.paymentStage || 'Milestone');
      setPaymentAmount(presetInvoice.balanceAmount);
      setIsRecordModalOpen(true);
    }
  }, [presetInvoice]);

  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter === 'ACTION:CREATE') {
      setIsRecordModalOpen(true);
    } else if (initialFilter === 'ALL') {
      setStageFilter('ALL');
      setModeFilter('ALL');
      setSearchQuery('');
    } else {
      setSearchQuery(initialFilter);
    }
  }, [initialFilter, actionNonce]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  // Filtered dropdown options for selected customer
  const customerOrders = orders.filter((o) => o.customerId === selectedCustomerId);
  // Only invoices that can actually take a payment are offered. Draft invoices are excluded
  // to match validatePaymentLinks, which rejects them — previously they were selectable and
  // the payment then failed, which read as "record payment is broken".
  const customerUnpaidInvoices = invoices.filter(
    (i) =>
      i.customerId === selectedCustomerId &&
      i.status !== 'Cancelled' &&
      i.status !== 'Converted' &&
      i.status !== 'Draft' &&
      i.balanceAmount > 0 &&
      (!selectedOrderId || i.salesOrderId === selectedOrderId)
  );
  const customerMilestones = milestones.filter(
    (m) =>
      m.customerId === selectedCustomerId &&
      (!selectedOrderId || m.salesOrderId === selectedOrderId)
  );

  // Live remaining_balance preview in modal
  const activeInvoiceObj = invoices.find((i) => i.id === selectedInvoiceId);
  const activeMilestoneObj = milestones.find((m) => m.id === selectedMilestoneId);
  const referenceDueAmount = activeInvoiceObj
    ? activeInvoiceObj.balanceAmount
    : activeMilestoneObj
    ? Math.max(0, activeMilestoneObj.amount - activeMilestoneObj.paidAmount)
    : 0;
  const previewRemainingBalance = Math.max(0, referenceDueAmount - (paymentAmount || 0));

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.salesOrderNumber && p.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = modeFilter === 'ALL' || p.paymentMode === modeFilter;
    const matchesStage = stageFilter === 'ALL' || (p.paymentStage || 'Milestone') === stageFilter;
    return matchesSearch && matchesMode && matchesStage;
  });

  // Summary KPIs
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalNetReceived = payments.reduce((acc, p) => acc + p.netReceived, 0);
  const totalTds = payments.reduce((acc, p) => acc + (p.tdsDeducted || 0), 0);
  const totalOpenInvoiceBalance = invoices
    .filter((i) => (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled')
    .reduce((acc, i) => acc + i.balanceAmount, 0);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear, actionable validation instead of a silent no-op. Previously an unset customer or a
    // zero amount simply returned, so the button looked like it did nothing at all.
    if (!selectedCustomerId) {
      showFeedback('error', 'Select a customer before recording the payment.');
      return;
    }
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      showFeedback('error', 'Enter a payment amount greater than zero.');
      return;
    }
    if (!paymentDate) {
      showFeedback('error', 'Choose a payment date.');
      return;
    }
    if (!bankCashAccount) {
      showFeedback('error', 'Select the bank or cash account that received the money.');
      return;
    }

    let receipt;
    try {
      receipt = recordPayment({
        customerId: selectedCustomerId,
        salesOrderId: selectedOrderId || undefined,
        invoiceId: selectedInvoiceId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        paymentStage,
        amount: paymentAmount,
        tdsDeducted,
        paymentMode,
        bankCashAccount,
        transactionReference: transactionRef || `UTR-${Date.now().toString().slice(-6)}`,
        remarks,
        paymentDate,
      });
    } catch (err: any) {
      // Surface the reason — overpayment, cross-customer allocation, a cancelled/converted/draft
      // invoice — instead of letting the throw vanish and leave the modal looking broken.
      showFeedback('error', err?.message || 'The payment could not be recorded.');
      return;
    }

    setIsRecordModalOpen(false);
    onClosePreset?.();
    setTransactionRef('');
    setRemarks('');
    showFeedback(
      'success',
      `Payment ${receipt.receiptNumber} (${formatCurrency(receipt.amount)}) posted. Remaining balance: ${formatCurrency(
        receipt.remainingBalance ?? 0
      )}.`
    );
  };

  const handleDeletePayment = (paymentId: string) => {
    const res = deletePayment(paymentId);
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>Payments, Stages & Collections Hub</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const defCust = customers[0]?.id || '';
              setSelectedCustomerId(defCust);
              setSelectedOrderId('');
              setSelectedInvoiceId('');
              setSelectedMilestoneId('');
              setPaymentStage('Milestone');
              setPaymentAmount(100000);
              setTdsDeducted(0);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="break-words">{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards with Modern Icon Depth (All 4 clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setStageFilter('ALL');
            setModeFilter('ALL');
            setSearchQuery('');
          }}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            stageFilter === 'ALL' && modeFilter === 'ALL' && !searchQuery
              ? 'border-emerald-400 ring-2 ring-emerald-500/15 bg-emerald-50/30'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
              Gross Collections
            </span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 mt-1 truncate">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {payments.length} payment receipt(s) • Show All
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('collection_register')}
          className="text-left bg-white p-4 rounded-xl border hover:border-indigo-300 hover:bg-indigo-50/20 min-w-0 overflow-hidden transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Net Bank Credited
            </span>
            <div className="icon-depth icon-depth-sky w-7 h-7 shrink-0">
              <Landmark className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {formatCurrency(totalNetReceived)}
          </div>
          <span className="text-[11px] text-indigo-600 mt-0.5 block truncate">
            After TDS ({formatCurrency(totalTds)}) • Collection Report →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            const unpaidInv = invoices.find(
              (i) =>
                (i.invoiceType || 'Tax') === 'Tax' &&
                i.status !== 'Cancelled' &&
                i.status !== 'Converted' &&
                i.status !== 'Draft' &&
                i.balanceAmount > 0
            );
            if (unpaidInv) {
              setSelectedCustomerId(unpaidInv.customerId);
              setSelectedOrderId(unpaidInv.salesOrderId || '');
              setSelectedInvoiceId(unpaidInv.id);
              setSelectedMilestoneId(unpaidInv.milestoneId || '');
              setPaymentStage(unpaidInv.paymentStage || 'Milestone');
              setPaymentAmount(unpaidInv.balanceAmount);
              setIsRecordModalOpen(true);
            } else {
              onNavigateToReport?.('gst_tax_register');
            }
          }}
          className="text-left bg-white p-4 rounded-xl border hover:border-rose-300 hover:bg-rose-50/20 min-w-0 overflow-hidden transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block truncate">
              Remaining Balance (AR)
            </span>
            <div className="icon-depth icon-depth-rose w-7 h-7 shrink-0">
              <Wallet className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-rose-700 mt-1 truncate">
            {formatCurrency(totalOpenInvoiceBalance)}
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block truncate">
            Click to collect unpaid invoice →
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStageFilter(stageFilter === 'Milestone' ? 'ALL' : 'Milestone')}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            stageFilter === 'Milestone'
              ? 'border-indigo-400 ring-2 ring-indigo-500/15 bg-indigo-50/30'
              : 'hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block truncate">
              Milestone Linked
            </span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 mt-1 truncate">
            {payments.filter((p) => Boolean(p.milestoneId)).length} / {payments.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            Synced with CRM milestones • Click to filter
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search receipt #, customer, invoice #, UTR ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Payment Stages</option>
            {PAYMENT_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Payment Modes</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-slate-400 font-mono px-2">
            {filteredPayments.length} Receipts
          </span>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer & Order</th>
                <th className="p-3.5">Invoice & Milestone</th>
                <th className="p-3.5">Payment Stage</th>
                <th className="p-3.5">Mode & UTR Ref</th>
                <th className="p-3.5 text-right">Amount Paid</th>
                <th className="p-3.5 text-right">Remaining Bal</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                        {p.receiptNumber}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600">{p.paymentDate}</td>

                    <td className="p-3.5 max-w-[200px]">
                      <button
                        onClick={() => onNavigateToCustomer(p.customerId)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-left block truncate max-w-full"
                      >
                        {p.customerName}
                      </button>
                      {p.salesOrderNumber && (
                        <span className="text-[10px] font-mono text-amber-700 font-semibold block">
                          {p.salesOrderNumber}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.invoiceNumber ? (
                          <button
                            onClick={() => onNavigateToInvoice(p.invoiceId!)}
                            className="font-mono font-bold text-indigo-600 hover:underline"
                          >
                            {p.invoiceNumber}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">On Account</span>
                        )}
                        {p.milestoneCode && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px]">
                            {p.milestoneCode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.paymentStage || 'Milestone'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-slate-800 block">
                        {p.paymentMode}{' '}
                        <span className="font-mono text-slate-500 text-[11px]">
                          • {p.transactionReference}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {p.bankCashAccount &&
                        !['HDFC Current A/c - 1734', 'ICICI Current A/c - 8892', 'Kotak Corporate A/c - 4410'].includes(
                          p.bankCashAccount
                        )
                          ? p.bankCashAccount
                          : primaryBankValue}{' '}
                        {p.remarks ? `· ${p.remarks}` : ''}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono tabular-nums font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                      {(p.tdsDeducted || 0) > 0 && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          TDS: {formatCurrency(p.tdsDeducted || 0)}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-mono tabular-nums font-bold text-slate-700">
                      {formatCurrency(p.remainingBalance ?? 0)}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            onOpenTrace(undefined, p.customerId, p.salesOrderId, p.invoiceId)
                          }
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Trace Lifecycle Flow"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                          title="Delete Payment & Recalculate Balances"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL (Clean Light Theme) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block">
                  PAYMENT COLLECTION & RECONCILIATION
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  Record Customer Payment Receipt
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsRecordModalOpen(false);
                  onClosePreset?.();
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedOrderId('');
                      setSelectedInvoiceId('');
                      setSelectedMilestoneId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerCode} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sales Order (Optional)
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => {
                      setSelectedOrderId(e.target.value);
                      setSelectedInvoiceId('');
                      setSelectedMilestoneId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="">All Customer Orders</option>
                    {customerOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} ({formatCurrency(o.grandTotal)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Linked Invoice Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Link to Invoice (Tax / Proforma)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      setSelectedInvoiceId(invId);
                      const inv = invoices.find((i) => i.id === invId);
                      if (inv) {
                        setPaymentAmount(inv.balanceAmount);
                        if (inv.milestoneId) setSelectedMilestoneId(inv.milestoneId);
                        if (inv.salesOrderId) setSelectedOrderId(inv.salesOrderId);
                        if (inv.paymentStage) setPaymentStage(inv.paymentStage);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="">On Account / Unallocated</option>
                    {customerUnpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} ({inv.invoiceType || 'Tax'}) - Due:{' '}
                        {formatCurrency(inv.balanceAmount)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CRM Milestone Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    CRM Milestone
                  </label>
                  <select
                    value={selectedMilestoneId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedMilestoneId(mId);
                      const ms = milestones.find((m) => m.id === mId);
                      if (ms) {
                        const due = Math.max(0, ms.amount - ms.paidAmount);
                        if (due > 0) setPaymentAmount(due);
                        if (ms.invoiceId) setSelectedInvoiceId(ms.invoiceId);
                        else if (ms.proformaInvoiceId) setSelectedInvoiceId(ms.proformaInvoiceId);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="">No Specific Milestone</option>
                    {customerMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.salesOrderNumber} · {m.milestoneCode} ({m.percentage}%) - Bal:{' '}
                        {formatCurrency(Math.max(0, m.amount - m.paidAmount))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Payment Stage *
                  </label>
                  <select
                    value={paymentStage}
                    onChange={(e) => setPaymentStage(e.target.value as PaymentStage)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {PAYMENT_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as PaymentMode;
                      setPaymentMode(nextMode);
                      if (nextMode === 'Cash') {
                        setBankCashAccount('Cash in Hand / Office Petty Cash');
                      } else if (bankCashAccount === 'Cash in Hand / Office Petty Cash') {
                        setBankCashAccount(primaryBankValue);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Payment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">TDS Deducted (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tdsDeducted}
                    onChange={(e) => setTdsDeducted(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Remaining Balance
                  </label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-rose-700">
                    {formatCurrency(previewRemainingBalance)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Deposited To Bank / Cash A/c (From Company Setup)
                  </label>
                  <select
                    value={bankCashAccount}
                    onChange={(e) => setBankCashAccount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                  >
                    {companyBankOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                    Synced with Company Setup:{' '}
                    <strong className="font-mono">
                      {supplierCompany?.bankDetails?.bankName || supplierCompany?.bankName}
                    </strong>{' '}
                    ({supplierCompany?.bankDetails?.ifscCode || supplierCompany?.ifscCode})
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Transaction Ref / UTR / Cheque # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. UTR-${utrBankCode}-991823746`}
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Payment remarks or bank confirmation notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    onClosePreset?.();
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Post Payment & Recalculate Balances
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
