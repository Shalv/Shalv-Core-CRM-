import React from 'react';
import { Invoice, CompanyProfileMaster } from '../../types';
import { amountInWords } from '../../utils/numberToWords';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Tag,
  AlertCircle,
} from 'lucide-react';

export interface InvoiceDocumentTemplateProps {
  invoice: Invoice;
  supplierCompany: CompanyProfileMaster;
  copyType?: string;
  includeBankDetails?: boolean;
  includeSignatory?: boolean;
  includeNotes?: boolean;
  includeGstTable?: boolean;
  templateTheme?: 'modern' | 'corporate' | 'minimal';
  isPrintMode?: boolean;
  id?: string;
  onNavigateToCustomer?: (customerId: string) => void;
}

export const InvoiceDocumentTemplate: React.FC<InvoiceDocumentTemplateProps> = ({
  invoice,
  supplierCompany,
  copyType = 'Original for Recipient',
  includeBankDetails = true,
  includeSignatory = true,
  includeNotes = true,
  includeGstTable = true,
  templateTheme = 'modern',
  isPrintMode = false,
  id,
  onNavigateToCustomer,
}) => {
  const isProforma = invoice.invoiceType === 'Proforma';
  const docTitle = isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE';
  const isPaid = invoice.status === 'Paid' || invoice.balanceAmount <= 0;
  const isPartiallyPaid = invoice.paidAmount > 0 && invoice.balanceAmount > 0;
  const isOverdue =
    invoice.status === 'Overdue' ||
    (invoice.balanceAmount > 0 && new Date(invoice.dueDate) < new Date());

  const formatCur = (amount: number): string => {
    return (
      '₹' +
      Number(amount || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })
    );
  };

  // Group items by HSN/SAC for statutory GST Analysis Breakdown
  const gstBreakdownMap: Record<
    string,
    {
      hsnSac: string;
      taxableAmount: number;
      gstRate: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }
  > = {};

  invoice.items.forEach((it) => {
    const key = `${it.hsnSac || '998313'}_${it.gstRate}`;
    if (!gstBreakdownMap[key]) {
      gstBreakdownMap[key] = {
        hsnSac: it.hsnSac || '998313',
        taxableAmount: 0,
        gstRate: it.gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }
    gstBreakdownMap[key].taxableAmount += it.taxableAmount;
    gstBreakdownMap[key].cgstAmount += it.cgstAmount;
    gstBreakdownMap[key].sgstAmount += it.sgstAmount;
    gstBreakdownMap[key].igstAmount += it.igstAmount;
    gstBreakdownMap[key].totalTax += it.totalTax;
  });

  const gstBreakdownList = Object.values(gstBreakdownMap);

  const accentBarClass =
    templateTheme === 'corporate'
      ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800'
      : templateTheme === 'minimal'
      ? 'bg-slate-800'
      : 'bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500';

  const fullCompanyAddress = [
    supplierCompany.address,
    supplierCompany.city,
    supplierCompany.state ? `${supplierCompany.state} - ${supplierCompany.pincode}` : supplierCompany.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      id={id}
      className={`crm-document-sheet mx-auto bg-white text-slate-800 text-[11px] leading-relaxed transition-all overflow-hidden ${
        isPrintMode
          ? 'w-[794px] shadow-none border border-slate-300 rounded-xl'
          : 'max-w-4xl rounded-2xl shadow-lg border border-slate-200/90'
      }`}
      style={{
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Corporate Brand Accent Bar */}
      <div className={`h-2 w-full ${accentBarClass}`} />

      {/* Main Sheet Inner Padding (Proper Professional Document Margins) */}
      <div className={isPrintMode ? 'p-7' : 'p-5 sm:p-7 md:p-8'}>
        {/* ===================== ROW 1: TOP CLASSIFICATION & STATUS BAR ===================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-md border border-indigo-600 bg-indigo-50/70 text-indigo-700">
              {docTitle}
            </span>
            <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md">
              {copyType}
            </span>
          </div>

          <div>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>PAID IN FULL</span>
              </span>
            ) : isPartiallyPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>PARTIALLY PAID</span>
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>PAYMENT OVERDUE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-slate-50 text-slate-700 border border-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>PAYMENT DUE</span>
              </span>
            )}
          </div>
        </div>

        {/* ===================== ROW 2: COMPANY BRANDING & INVOICE METADATA ===================== */}
        <div className="grid grid-cols-12 gap-5 items-stretch pb-5 mb-5 border-b border-slate-200">
          {/* Company Identity (Left 7 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-7' : 'col-span-12 md:col-span-7'
            } flex flex-col justify-between space-y-2.5 min-w-0`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {supplierCompany.logoUrl ? (
                  <img
                    src={supplierCompany.logoUrl}
                    alt={supplierCompany.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto max-w-[150px] rounded-xl object-contain border border-slate-200 p-1 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 128 128"
                      className="w-9 h-9"
                      fill="none"
                    >
                      <path
                        d="M46 20 C66 10, 96 18, 108 34 C113 41, 108 50, 98 49 C85 48, 72 38, 52 36 Z"
                        fill="#93c5fd"
                        opacity="0.85"
                      />
                      <path
                        d="M16 42 C14 64, 16 88, 30 104 C42 116, 58 114, 66 104 C50 96, 42 78, 42 56 C42 40, 48 26, 58 16 C38 16, 18 26, 16 42 Z"
                        fill="#ffffff"
                      />
                      <path
                        d="M16 52 C16 30, 38 10, 66 10 C82 10, 96 16, 104 26 C90 20, 72 20, 56 30 C42 38, 34 54, 30 70 C20 66, 16 59, 16 52 Z"
                        fill="#67e8f9"
                      />
                      <path
                        d="M48 114 C70 120, 98 110, 110 92 C114 85, 110 76, 102 78 C92 80, 82 96, 62 104 Z"
                        fill="#38bdf8"
                      />
                      <path
                        d="M20 78 C24 98, 42 116, 66 116 C84 116, 98 104, 106 88 C109 81, 103 74, 94 76 C80 80, 68 94, 50 94 C36 94, 26 86, 20 78 Z"
                        fill="#e0f2fe"
                      />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight break-words">
                    {supplierCompany.legalName || supplierCompany.name}
                  </h1>
                  <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mt-0.5">
                    Enterprise ERP, Cloud & Technology Solutions
                  </p>
                </div>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed break-words pt-0.5">
                {fullCompanyAddress}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
              <div className="break-words">
                <span className="text-slate-500">GSTIN: </span>
                <strong className="font-mono text-slate-900 font-bold">
                  {supplierCompany.gstin}
                </strong>
              </div>
              <div className="break-words">
                <span className="text-slate-500">PAN: </span>
                <strong className="font-mono text-slate-900 font-bold">
                  {supplierCompany.pan}
                </strong>
              </div>
              <div className="break-words">
                <span className="text-slate-500">State: </span>
                <strong className="text-slate-900 font-bold">
                  {supplierCompany.state} ({supplierCompany.stateCode})
                </strong>
              </div>
              <div className="break-words">
                <span className="text-slate-500">Phone: </span>
                <strong className="font-mono text-slate-800">{supplierCompany.phone}</strong>
              </div>
              <div className="col-span-2 break-words pt-0.5 border-t border-slate-200/60">
                <span className="text-slate-500">Email: </span>
                <span className="font-mono text-slate-800">{supplierCompany.email}</span>
                {supplierCompany.website && (
                  <>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">Web: </span>
                    <span className="font-mono text-indigo-700">{supplierCompany.website}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Meta Card (Right 5 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-5' : 'col-span-12 md:col-span-5'
            } bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 min-w-0`}
          >
            <div className="text-right border-b border-slate-200 pb-2.5">
              <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider block">
                {isProforma ? 'Proforma Invoice No.' : 'Tax Invoice Number'}
              </span>
              <span className="text-base font-extrabold font-mono text-indigo-700 tracking-tight block mt-0.5 break-all">
                {invoice.invoiceNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-left text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Invoice Date
                </span>
                <strong className="font-mono text-slate-900 font-bold block mt-0.5">
                  {invoice.invoiceDate}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Due Date
                </span>
                <strong
                  className={`font-mono font-bold block mt-0.5 ${
                    invoice.balanceAmount > 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}
                >
                  {invoice.dueDate}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Place of Supply
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5 break-words">
                  {invoice.billingAddress.state} ({invoice.billingAddress.stateCode})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Reverse Charge
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5">No (Regular)</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
              <span>Currency: INR (₹)</span>
              <span>Tax Regime: {invoice.isInterState ? 'IGST' : 'CGST + SGST'}</span>
            </div>
          </div>
        </div>

        {/* ===================== ROW 3: BILLED TO & ORDER REFERENCE CARDS ===================== */}
        <div
          className={`grid ${
            isPrintMode ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
          } gap-4 mb-5`}
        >
          {/* Card 1: Billed To (Client Details) */}
          <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider">
                  Billed To (Recipient / Client Details)
                </span>
              </div>

              {onNavigateToCustomer && !isPrintMode ? (
                <button
                  type="button"
                  onClick={() => onNavigateToCustomer(invoice.customerId)}
                  className="text-left font-extrabold text-slate-900 hover:text-indigo-600 text-xs block w-full cursor-pointer transition break-words"
                >
                  {invoice.customerName}
                </button>
              ) : (
                <div className="font-extrabold text-slate-900 text-xs break-words">
                  {invoice.customerName}
                </div>
              )}

              <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                {invoice.billingAddress.addressLine1}
                {invoice.billingAddress.addressLine2
                  ? `, ${invoice.billingAddress.addressLine2}`
                  : ''}
                <br />
                {invoice.billingAddress.city}
                {invoice.billingAddress.state ? `, ${invoice.billingAddress.state}` : ''} -{' '}
                {invoice.billingAddress.pincode}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[10.5px] text-slate-700">
              <div className="break-words">
                <span className="text-slate-500">GSTIN: </span>
                <strong className="font-mono text-slate-900 font-bold">
                  {invoice.customerGstin || 'Unregistered'}
                </strong>
              </div>
              <div className="break-words text-right">
                <span className="text-slate-500">State: </span>
                <strong className="text-slate-900 font-bold">
                  {invoice.billingAddress.state} ({invoice.billingAddress.stateCode})
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Order & Reference Details */}
          <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 min-w-0">
            <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider">
                Order, Milestone & Contract Reference
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <div className="min-w-0">
                <span className="text-slate-500 text-[10px] block">Sales Order / Source Ref:</span>
                <strong className="font-mono text-slate-900 font-bold block mt-0.5 break-words">
                  {invoice.salesOrderNumber ||
                    invoice.amcContractNumber ||
                    invoice.changeRequestNumber ||
                    invoice.ticketNumber ||
                    invoice.sourceType ||
                    'Direct Invoice'}
                </strong>
              </div>
              <div className="min-w-0">
                <span className="text-slate-500 text-[10px] block">CRM Milestone / Category:</span>
                <strong className="font-mono text-indigo-700 font-bold block mt-0.5 break-words">
                  {invoice.milestoneCode || invoice.sourceType || 'Standard Billing'}
                </strong>
              </div>
              <div className="min-w-0">
                <span className="text-slate-500 text-[10px] block">Payment Stage:</span>
                <strong className="text-slate-900 font-semibold block mt-0.5 break-words">
                  {invoice.paymentStage || 'Standard'}
                </strong>
              </div>
              <div className="min-w-0">
                <span className="text-slate-500 text-[10px] block">Payment Terms:</span>
                <strong className="text-slate-900 font-bold block mt-0.5 break-words">
                  {invoice.paymentTermsName}
                </strong>
              </div>

              {(invoice.servicePeriodStart || invoice.servicePeriodEnd) && (
                <div className="col-span-2 pt-1.5 border-t border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">AMC / Service Period:</span>
                  <strong className="font-mono text-emerald-700 font-bold">
                    {invoice.servicePeriodStart || '—'} to {invoice.servicePeriodEnd || '—'}
                  </strong>
                </div>
              )}

              {invoice.poNumber && (
                <div className="col-span-2 pt-1.5 border-t border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">Client PO Reference:</span>
                  <strong className="font-mono text-slate-900 font-bold break-words">
                    {invoice.poNumber} {invoice.poDate ? `(Dated: ${invoice.poDate})` : ''}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================== ROW 4: ITEMIZED TABLE (ZERO OVERLAP & ZERO OVERFLOW) ===================== */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10.5px] leading-snug">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-extrabold border-b border-slate-300 divide-x divide-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-[4%]">#</th>
                  <th className="py-2.5 px-2.5 text-left w-[28%]">
                    Description of Goods / Services
                  </th>
                  <th className="py-2.5 px-2 text-center w-[9%]">HSN/SAC</th>
                  <th className="py-2.5 px-1.5 text-center w-[8%]">Qty</th>
                  <th className="py-2.5 px-2 text-right w-[12%]">Rate (₹)</th>
                  <th className="py-2.5 px-2 text-right w-[13%]">Taxable (₹)</th>
                  <th className="py-2.5 px-1.5 text-center w-[6%]">GST %</th>
                  <th className="py-2.5 px-2 text-right w-[9%]">Tax (₹)</th>
                  <th className="py-2.5 px-2.5 text-right w-[11%]">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {invoice.items.map((it, idx) => (
                  <tr
                    key={it.id || idx}
                    className="divide-x divide-slate-200 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-500 align-top">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2.5 align-top break-words">
                      <div className="font-bold text-slate-900 leading-snug break-words">
                        {it.productName}
                      </div>
                      {it.description && (
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">
                          {it.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 align-top">
                      {it.hsnSac || '998313'}
                    </td>
                    <td className="py-2.5 px-1.5 text-center align-top">
                      <div className="font-mono font-bold text-slate-900">{it.quantity}</div>
                      <div className="text-[9.5px] text-slate-500">{it.uom || 'Unit'}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-800 align-top">
                      {formatCur(it.unitRate)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-slate-900 align-top">
                      {formatCur(it.taxableAmount)}
                    </td>
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 align-top">
                      {it.gstRate}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-indigo-700 font-semibold align-top">
                      {formatCur(it.totalTax)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900 align-top">
                      {formatCur(it.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== ROW 5: GST TAX ANALYSIS BREAKDOWN TABLE ===================== */}
        {includeGstTable && gstBreakdownList.length > 0 && (
          <div className="mb-5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                Statutory GST & HSN/SAC Tax Analysis Breakdown
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                Supply Type:{' '}
                {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] text-left border-collapse border border-slate-200 bg-white">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 divide-x divide-slate-200 font-bold text-slate-700 text-[10px]">
                    <th className="py-1.5 px-2.5 text-left">HSN / SAC</th>
                    <th className="py-1.5 px-2.5 text-right">Taxable Value (₹)</th>
                    {!invoice.isInterState ? (
                      <>
                        <th className="py-1.5 px-2 text-center">CGST %</th>
                        <th className="py-1.5 px-2.5 text-right">CGST Amt (₹)</th>
                        <th className="py-1.5 px-2 text-center">SGST %</th>
                        <th className="py-1.5 px-2.5 text-right">SGST Amt (₹)</th>
                      </>
                    ) : (
                      <>
                        <th className="py-1.5 px-2 text-center">IGST %</th>
                        <th className="py-1.5 px-2.5 text-right">IGST Amt (₹)</th>
                      </>
                    )}
                    <th className="py-1.5 px-2.5 text-right font-extrabold text-slate-900">
                      Total Tax (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[10.5px]">
                  {gstBreakdownList.map((g, idx) => (
                    <tr key={idx} className="divide-x divide-slate-200">
                      <td className="py-1.5 px-2.5 font-bold text-slate-800">{g.hsnSac}</td>
                      <td className="py-1.5 px-2.5 text-right text-slate-800 tabular-nums">
                        {formatCur(g.taxableAmount)}
                      </td>
                      {!invoice.isInterState ? (
                        <>
                          <td className="py-1.5 px-2 text-center text-slate-600">
                            {g.gstRate / 2}%
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-800 tabular-nums">
                            {formatCur(g.cgstAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-600">
                            {g.gstRate / 2}%
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-800 tabular-nums">
                            {formatCur(g.sgstAmount)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-1.5 px-2 text-center text-slate-600">{g.gstRate}%</td>
                          <td className="py-1.5 px-2.5 text-right text-slate-800 tabular-nums">
                            {formatCur(g.igstAmount)}
                          </td>
                        </>
                      )}
                      <td className="py-1.5 px-2.5 text-right font-bold text-indigo-700 tabular-nums">
                        {formatCur(g.totalTax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== ROW 6: TOTALS & REMITTANCE SECTION ===================== */}
        <div className="grid grid-cols-12 gap-5 mb-5 items-start">
          {/* Left Side: Words, Bank Details, Remarks (7 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-7' : 'col-span-12 md:col-span-7'
            } space-y-3 min-w-0`}
          >
            {/* Amount in Words */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
              <span className="text-[9.5px] uppercase font-extrabold text-indigo-700 block tracking-wider mb-0.5">
                Amount Chargeable in Words
              </span>
              <div className="font-bold text-slate-900 text-[11.5px] leading-snug break-words">
                {amountInWords(invoice.grandTotal)}
              </div>
            </div>

            {/* Bank Payment Details */}
            {includeBankDetails && (
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Bank Payment & Remittance Details</span>
                  </span>
                  <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    NEFT / RTGS / IMPS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px] text-slate-700">
                  <div className="break-words">
                    <span className="text-slate-500">Bank: </span>
                    <strong className="text-slate-900 font-bold">
                      {supplierCompany.bankDetails.bankName}
                    </strong>
                  </div>
                  <div className="break-words">
                    <span className="text-slate-500">A/C Name: </span>
                    <strong className="text-slate-900 font-bold">
                      {supplierCompany.bankDetails.accountName}
                    </strong>
                  </div>
                  <div className="break-words">
                    <span className="text-slate-500">A/C No: </span>
                    <strong className="font-mono text-slate-900 font-bold">
                      {supplierCompany.bankDetails.accountNumber}
                    </strong>
                  </div>
                  <div className="break-words">
                    <span className="text-slate-500">IFSC: </span>
                    <strong className="font-mono text-slate-900 font-bold">
                      {supplierCompany.bankDetails.ifscCode}
                    </strong>
                  </div>
                  <div className="col-span-2 text-slate-600 text-[10px] break-words">
                    <span className="text-slate-500">Branch: </span>
                    {supplierCompany.bankDetails.branch}
                  </div>
                </div>
              </div>
            )}

            {/* Terms & Remarks Box */}
            {includeNotes && invoice.notes && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/90 text-[10.5px] text-slate-700 leading-relaxed">
                <strong className="text-amber-900 block font-extrabold uppercase text-[9.5px] tracking-wider mb-0.5">
                  Terms & Remarks:
                </strong>
                <p className="break-words whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Right Side: Totals Summary Box (5 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-5' : 'col-span-12 md:col-span-5'
            } bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] min-w-0`}
          >
            <div className="flex justify-between items-center gap-2 text-slate-700">
              <span className="font-medium">Taxable Subtotal:</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                {formatCur(invoice.subtotalTaxable)}
              </span>
            </div>

            {invoice.isInterState ? (
              <div className="flex justify-between items-center gap-2 text-indigo-700">
                <span className="font-medium">Integrated GST (IGST):</span>
                <span className="font-semibold font-mono tabular-nums">
                  {formatCur(invoice.totalIgst)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center gap-2 text-indigo-700">
                  <span className="font-medium">Central GST (CGST):</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCur(invoice.totalCgst)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 text-indigo-700">
                  <span className="font-medium">State GST (SGST):</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCur(invoice.totalSgst)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center gap-2 text-slate-600 pt-1 border-t border-slate-200">
              <span className="font-medium">Total GST Amount:</span>
              <span className="font-semibold font-mono tabular-nums">
                {formatCur(invoice.totalTax)}
              </span>
            </div>

            {/* Grand Total Banner */}
            <div className="flex justify-between items-center gap-2 text-xs font-extrabold text-slate-900 py-2.5 px-3 bg-indigo-50/90 rounded-lg border border-indigo-200">
              <span>Total Invoice Amount:</span>
              <span className="font-mono tabular-nums font-black text-indigo-700 text-sm">
                {formatCur(invoice.grandTotal)}
              </span>
            </div>

            {/* Amount Received */}
            <div className="flex justify-between items-center gap-2 text-emerald-700 text-[11px] pt-1">
              <span className="font-medium">Amount Received / Paid:</span>
              <span className="font-bold font-mono tabular-nums">
                {formatCur(invoice.paidAmount)}
              </span>
            </div>

            {/* Balance Remaining Due */}
            <div
              className={`flex justify-between items-center gap-2 text-xs font-bold pt-2 border-t border-dashed border-slate-300 ${
                invoice.balanceAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              <span>Balance Remaining Due:</span>
              <span className="font-black font-mono tabular-nums">
                {formatCur(invoice.balanceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ===================== ROW 7: STATUTORY DECLARATION & SIGNATORY ===================== */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-5 items-end">
          {/* Statutory Declaration on Left (7 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-7' : 'col-span-12 md:col-span-7'
            } space-y-1 min-w-0`}
          >
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              Statutory Declaration:
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed break-words">
              We declare that this invoice shows the actual price of the goods or services described
              and that all particulars are true and correct. Subject to {supplierCompany.city || 'New Delhi'} jurisdiction.
            </p>
            <div className="text-[9.5px] text-slate-400 pt-0.5">
              * Computer-generated {isProforma ? 'proforma' : 'tax'} invoice issued by {supplierCompany.legalName || supplierCompany.name} in accordance with GST Rules.
            </div>
          </div>

          {/* Authorized Signatory on Right (5 cols) */}
          {includeSignatory && (
            <div
              className={`${
                isPrintMode ? 'col-span-5' : 'col-span-12 md:col-span-5'
              } text-right space-y-2 min-w-0`}
            >
              <div className="text-[11px] font-extrabold text-slate-900">
                For {supplierCompany.legalName || supplierCompany.name}
              </div>

              {/* Official Digital Seal & Verification Box */}
              <div className="py-1 flex justify-end">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-[10px] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold leading-tight">Digitally Verified</div>
                    <div className="text-[9px] text-indigo-600">Coreenact Authority</div>
                  </div>
                </div>
              </div>

              <div className="inline-block border-t border-slate-400 pt-1 min-w-[170px] text-center">
                <div className="font-bold text-slate-800 text-[10.5px]">Authorized Signatory</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
