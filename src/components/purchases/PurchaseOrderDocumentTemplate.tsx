import React from 'react';
import { PurchaseOrder, CompanyProfileMaster } from '../../types';
import { amountInWords } from '../../utils/numberToWords';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export interface PurchaseOrderDocumentTemplateProps {
  purchaseOrder: PurchaseOrder;
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

export const PurchaseOrderDocumentTemplate: React.FC<PurchaseOrderDocumentTemplateProps> = ({
  purchaseOrder,
  supplierCompany,
  copyType = 'Original for Supplier',
  includeBankDetails = true,
  includeSignatory = true,
  includeNotes = true,
  includeGstTable = true,
  templateTheme = 'modern',
  isPrintMode = false,
  id,
  onNavigateToCustomer,
}) => {
  const isApproved =
    purchaseOrder.status === 'Approved' ||
    purchaseOrder.status === 'Issued to Vendor' ||
    purchaseOrder.status === 'Received / Completed';

  const isInterState =
    purchaseOrder.igstAmount > 0 ||
    Boolean(
      purchaseOrder.vendorStateCode &&
        purchaseOrder.vendorStateCode !== (supplierCompany.stateCode || '07')
    );

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

  purchaseOrder.items.forEach((it) => {
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
    supplierCompany.state
      ? `${supplierCompany.state} - ${supplierCompany.pincode}`
      : supplierCompany.pincode,
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
              PURCHASE ORDER
            </span>
            <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md">
              {copyType}
            </span>
          </div>

          <div>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{purchaseOrder.status.toUpperCase()}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{purchaseOrder.status.toUpperCase()}</span>
              </span>
            )}
          </div>
        </div>

        {/* ===================== ROW 2: COMPANY BRANDING (BUYER) & PO METADATA ===================== */}
        <div className="grid grid-cols-12 gap-5 items-stretch pb-5 mb-5 border-b border-slate-200">
          {/* Buyer Company Identity (Left 7 cols) */}
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
                    Buyer & Authorized Procurement Authority
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
                <span className="text-slate-500">Contact: </span>
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

          {/* Purchase Order Metadata Card (Right 5 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-5' : 'col-span-12 md:col-span-5'
            } bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 min-w-0`}
          >
            <div className="text-right border-b border-slate-200 pb-2.5">
              <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider block">
                Purchase Order Number
              </span>
              <span className="text-base font-extrabold font-mono text-indigo-700 tracking-tight block mt-0.5 break-all">
                {purchaseOrder.poNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-left text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  PO Date
                </span>
                <strong className="font-mono text-slate-900 font-bold block mt-0.5">
                  {purchaseOrder.poDate}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Expected Delivery
                </span>
                <strong className="font-mono text-indigo-700 font-bold block mt-0.5">
                  {purchaseOrder.expectedDeliveryDate || 'Immediate'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Payment Terms
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5 break-words">
                  {purchaseOrder.paymentTerms || '30 Days Net'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                  Place of Supply
                </span>
                <strong className="text-slate-900 font-bold block mt-0.5 break-words">
                  {purchaseOrder.placeOfSupply} ({purchaseOrder.placeOfSupplyCode})
                </strong>
              </div>
              {purchaseOrder.referenceQuotationNo && (
                <div className="col-span-2 pt-1 border-t border-slate-200/70">
                  <span className="text-slate-500 text-[9.5px] uppercase font-bold tracking-wider block">
                    Vendor Quotation Reference
                  </span>
                  <strong className="font-mono text-slate-900 font-bold block mt-0.5 break-words">
                    {purchaseOrder.referenceQuotationNo}
                  </strong>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
              <span>Currency: INR (₹)</span>
              <span>Supply: {isInterState ? 'IGST (Inter-State)' : 'CGST + SGST'}</span>
            </div>
          </div>
        </div>

        {/* ===================== ROW 3: VENDOR (BILL FROM) & DELIVERY DESTINATION (SHIP TO) ===================== */}
        <div
          className={`grid ${
            isPrintMode ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
          } gap-4 mb-5`}
        >
          {/* Card 1: Vendor / Supplier (Bill From) */}
          <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between min-w-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider">
                    Vendor / Supplier (Bill From)
                  </span>
                </div>
                {purchaseOrder.isSameAsCustomer && (
                  <span
                    onClick={() => {
                      if (purchaseOrder.linkedCustomerId && onNavigateToCustomer && !isPrintMode) {
                        onNavigateToCustomer(purchaseOrder.linkedCustomerId);
                      }
                    }}
                    className={`text-[9.5px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold ${
                      !isPrintMode && onNavigateToCustomer ? 'cursor-pointer hover:underline' : ''
                    }`}
                  >
                    Customer & Vendor Entity
                  </span>
                )}
              </div>

              <div className="font-extrabold text-slate-900 text-xs break-words">
                {purchaseOrder.vendorName}
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                {purchaseOrder.vendorAddress}
                {purchaseOrder.vendorCity ? `, ${purchaseOrder.vendorCity}` : ''}
                {purchaseOrder.vendorState ? `, ${purchaseOrder.vendorState}` : ''}
                {purchaseOrder.vendorPincode ? ` - ${purchaseOrder.vendorPincode}` : ''}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10.5px] text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <div className="break-words">
                  <span className="text-slate-500">GSTIN: </span>
                  <strong className="font-mono text-slate-900 font-bold">
                    {purchaseOrder.vendorGstin || 'Unregistered'}
                  </strong>
                </div>
                <div className="break-words text-right">
                  <span className="text-slate-500">State: </span>
                  <strong className="text-slate-900 font-bold">
                    {purchaseOrder.vendorState || '—'} ({purchaseOrder.vendorStateCode || '—'})
                  </strong>
                </div>
              </div>
              {(purchaseOrder.contactPerson || purchaseOrder.vendorPhone || purchaseOrder.vendorEmail) && (
                <div className="pt-1 border-t border-slate-200/60 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600 break-words">
                  {purchaseOrder.contactPerson && (
                    <span>
                      Attn: <strong className="text-slate-900">{purchaseOrder.contactPerson}</strong>
                    </span>
                  )}
                  {purchaseOrder.vendorPhone && (
                    <span className="font-mono">{purchaseOrder.vendorPhone}</span>
                  )}
                  {purchaseOrder.vendorEmail && (
                    <span className="font-mono text-indigo-700">{purchaseOrder.vendorEmail}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Delivery & Shipping Destination (Ship To) */}
          <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between min-w-0">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider">
                  Delivery & Shipping Destination (Ship To)
                </span>
              </div>

              <div className="font-extrabold text-slate-900 text-xs break-words">
                {supplierCompany.legalName || supplierCompany.name} — Receiving Facility
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                {purchaseOrder.shippingAddress || fullCompanyAddress}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10.5px] text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <div className="break-words">
                  <span className="text-slate-500">Buyer GSTIN: </span>
                  <strong className="font-mono text-slate-900 font-bold">
                    {supplierCompany.gstin}
                  </strong>
                </div>
                <div className="break-words text-right">
                  <span className="text-slate-500">State: </span>
                  <strong className="text-slate-900 font-bold">
                    {supplierCompany.state} ({supplierCompany.stateCode})
                  </strong>
                </div>
              </div>
              <div className="pt-1 border-t border-slate-200/60 flex flex-wrap justify-between gap-2 text-[10px] text-slate-600">
                <span>
                  Receiving Desk: <strong className="text-slate-900">Central ERP & Stores</strong>
                </span>
                <span className="font-mono">{supplierCompany.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== ROW 4: ITEMIZED PURCHASE TABLE (ZERO OVERLAP) ===================== */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 bg-white">
          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left border-collapse text-[10.5px] leading-snug">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-extrabold border-b border-slate-300 divide-x divide-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-[4%]">#</th>
                  <th className="py-2.5 px-2.5 text-left w-[28%]">
                    Item Description & Specifications
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
                {purchaseOrder.items.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="divide-x divide-slate-200 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-500 align-top">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-2.5 align-top break-words">
                      <div className="font-bold text-slate-900 leading-snug break-words">
                        {item.productName}
                      </div>
                      {item.description && (
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">
                          {item.description}
                        </div>
                      )}
                      {item.productCode && (
                        <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                          SKU: {item.productCode}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 align-top">
                      {item.hsnSac || '998313'}
                    </td>
                    <td className="py-2.5 px-1.5 text-center align-top">
                      <div className="font-mono font-bold text-slate-900">{item.quantity}</div>
                      <div className="text-[9.5px] text-slate-500">{item.unit || 'Each'}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-800 align-top">
                      {formatCur(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-slate-900 align-top">
                      {formatCur(item.taxableAmount)}
                    </td>
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 align-top">
                      {item.gstRate}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-indigo-700 font-semibold align-top">
                      {formatCur(item.totalTax)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900 align-top">
                      {formatCur(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== ROW 5: STATUTORY GST & HSN/SAC TAX BREAKDOWN ===================== */}
        {includeGstTable && gstBreakdownList.length > 0 && (
          <div className="mb-5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                Statutory GST & HSN/SAC Tax Analysis Breakdown
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                Supply Type: {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] text-left border-collapse border border-slate-200 bg-white">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 divide-x divide-slate-200 font-bold text-slate-700 text-[10px]">
                    <th className="py-1.5 px-2.5 text-left">HSN / SAC</th>
                    <th className="py-1.5 px-2.5 text-right">Taxable Value (₹)</th>
                    {!isInterState ? (
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
                      {!isInterState ? (
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

        {/* ===================== ROW 6: TOTALS, AMOUNT IN WORDS, BANK & TERMS ===================== */}
        <div className="grid grid-cols-12 gap-5 mb-5 items-start">
          {/* Left 7 cols */}
          <div
            className={`${
              isPrintMode ? 'col-span-7' : 'col-span-12 md:col-span-7'
            } space-y-3 min-w-0`}
          >
            {/* Amount in Words */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
              <span className="text-[9.5px] uppercase font-extrabold text-indigo-700 block tracking-wider mb-0.5">
                Total Purchase Order Value in Words
              </span>
              <div className="font-bold text-slate-900 text-[11.5px] leading-snug break-words">
                {amountInWords(purchaseOrder.grandTotal)}
              </div>
            </div>

            {/* Buyer Bank & Settlement Details */}
            {includeBankDetails && (
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Buyer Bank & Settlement Coordinates</span>
                  </span>
                  <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    NEFT / RTGS / Corporate A/C
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

            {/* Terms & Conditions & Special Instructions */}
            {includeNotes && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/90 text-[10.5px] text-slate-700 leading-relaxed space-y-1.5">
                <div>
                  <strong className="text-amber-900 block font-extrabold uppercase text-[9.5px] tracking-wider mb-0.5">
                    Terms & Conditions / Procurement Instructions:
                  </strong>
                  <p className="break-words whitespace-pre-line">
                    {purchaseOrder.termsAndConditions ||
                      '1. Deliveries must strictly adhere to specifications mentioned.\n2. Vendor tax invoices must quote this Purchase Order number.\n3. Defective items or unapproved scope deviations will be returned at supplier cost.'}
                  </p>
                </div>
                {purchaseOrder.notes && (
                  <div className="pt-1.5 border-t border-amber-200/80">
                    <strong className="text-amber-900 font-bold">Special Delivery Notes: </strong>
                    <span className="break-words">{purchaseOrder.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 5 cols: Financial Totals Summary */}
          <div
            className={`${
              isPrintMode ? 'col-span-5' : 'col-span-12 md:col-span-5'
            } bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] min-w-0`}
          >
            <div className="flex justify-between items-center gap-2 text-slate-700">
              <span className="font-medium">Subtotal (Gross Value):</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                {formatCur(purchaseOrder.subtotal)}
              </span>
            </div>

            {purchaseOrder.totalDiscount > 0 && (
              <div className="flex justify-between items-center gap-2 text-emerald-700">
                <span className="font-medium">Vendor Discount:</span>
                <span className="font-semibold font-mono tabular-nums">
                  - {formatCur(purchaseOrder.totalDiscount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-2 text-slate-800 pt-1.5 border-t border-slate-200">
              <span className="font-bold">Net Taxable Value:</span>
              <span className="font-bold font-mono tabular-nums">
                {formatCur(purchaseOrder.taxableAmount)}
              </span>
            </div>

            {purchaseOrder.cgstAmount > 0 && (
              <div className="flex justify-between items-center gap-2 text-indigo-700">
                <span className="font-medium">Central GST (CGST):</span>
                <span className="font-semibold font-mono tabular-nums">
                  {formatCur(purchaseOrder.cgstAmount)}
                </span>
              </div>
            )}

            {purchaseOrder.sgstAmount > 0 && (
              <div className="flex justify-between items-center gap-2 text-indigo-700">
                <span className="font-medium">State GST (SGST):</span>
                <span className="font-semibold font-mono tabular-nums">
                  {formatCur(purchaseOrder.sgstAmount)}
                </span>
              </div>
            )}

            {purchaseOrder.igstAmount > 0 && (
              <div className="flex justify-between items-center gap-2 text-indigo-700">
                <span className="font-medium">Integrated GST (IGST):</span>
                <span className="font-semibold font-mono tabular-nums">
                  {formatCur(purchaseOrder.igstAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-2 text-slate-600 pt-1 border-t border-slate-200">
              <span className="font-medium">Total GST Amount:</span>
              <span className="font-semibold font-mono tabular-nums">
                {formatCur(purchaseOrder.totalTax)}
              </span>
            </div>

            {/* Grand Total Banner */}
            <div className="flex justify-between items-center gap-2 text-xs font-extrabold text-slate-900 py-2.5 px-3 bg-indigo-50/90 rounded-lg border border-indigo-200 mt-1">
              <span>Grand Total (PO Value):</span>
              <span className="font-mono tabular-nums font-black text-indigo-700 text-sm">
                {formatCur(purchaseOrder.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ===================== ROW 7: STATUTORY DECLARATION & SIGNATORY ===================== */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-5 items-end">
          {/* Declaration on Left (7 cols) */}
          <div
            className={`${
              isPrintMode ? 'col-span-7' : 'col-span-12 md:col-span-7'
            } space-y-1 min-w-0`}
          >
            <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              Commercial & Statutory Declaration:
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed break-words">
              This Purchase Order constitutes an official procurement commitment by{' '}
              <strong>{supplierCompany.legalName || supplierCompany.name}</strong>. Please reference
              PO Number <strong className="font-mono">{purchaseOrder.poNumber}</strong> on all
              delivery challans and GST tax invoices.
            </p>
            <div className="text-[9.5px] text-slate-400 pt-0.5">
              * Computer-generated Purchase Order valid for commercial and GST input tax credit
              reconciliation.
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

              <div className="inline-block border-t border-slate-400 pt-1 min-w-[175px] text-center">
                <div className="font-bold text-slate-800 text-[10.5px]">
                  {purchaseOrder.approvedByName || 'Authorized Procurement Signatory'}
                </div>
                <div className="text-[9.5px] text-slate-500">
                  {isApproved
                    ? `Approved on ${
                        purchaseOrder.approvedAt
                          ? purchaseOrder.approvedAt.split('T')[0]
                          : purchaseOrder.poDate
                      }`
                    : 'Pending Final Authorization'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
