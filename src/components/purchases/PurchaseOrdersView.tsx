import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { resolveGstRate } from '../../shared/gst';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  CalendarCheck,
  Trash2,
  FileText,
  Printer,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  X,
  Truck,
  Building2,
  Clock,
  ShieldCheck,
  Send,
  Check,
  Edit,
  DollarSign,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  Eye,
  Sliders,
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../../types';
import { PurchaseOrderDocumentTemplate } from './PurchaseOrderDocumentTemplate';
import {
  exportElementToPortraitPdf,
  generatePrintablePurchaseOrderHtml,
  generatePurchaseOrderVectorPdf,
  triggerStandalonePrint,
} from '../../utils/documentBranding';

interface PurchaseOrdersViewProps {
  onNavigateToCustomer?: (customerId: string) => void;
  initialPoId?: string;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  onNavigateToCustomer,
  initialPoId,
}) => {
  const {
    purchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
    customers,
    contacts,
    products,
    paymentTerms,
    supplierCompany,
    formatCurrency,
    currentUser,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPoId, setSelectedPoId] = useState<string>(
    initialPoId || purchaseOrders[0]?.id || ''
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printCopyType, setPrintCopyType] = useState('Original for Supplier');
  const [poShowTaxSummary, setPoShowTaxSummary] = useState(true);
  const [poShowBankDetails, setPoShowBankDetails] = useState(true);
  const [poShowSignature, setPoShowSignature] = useState(true);
  const [detailTab, setDetailTab] = useState<'deck' | 'preview'>('deck');
  const [isGeneratingPoPdf, setIsGeneratingPoPdf] = useState(false);
  const hiddenPoCaptureRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation state
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State
  const [formVendorType, setFormVendorType] = useState<'customer' | 'custom'>('customer');
  const [formSelectedCustomerId, setFormSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [formVendorName, setFormVendorName] = useState('');
  const [formVendorGstin, setFormVendorGstin] = useState('');
  const [formVendorPan, setFormVendorPan] = useState('');
  const [formVendorAddress, setFormVendorAddress] = useState('');
  const [formVendorCity, setFormVendorCity] = useState('');
  const [formVendorState, setFormVendorState] = useState('');
  const [formVendorStateCode, setFormVendorStateCode] = useState('');
  const [formVendorPhone, setFormVendorPhone] = useState('');
  const [formVendorEmail, setFormVendorEmail] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formIsSameAsCustomer, setFormIsSameAsCustomer] = useState(true);

  const [formPoDate, setFormPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpectedDate, setFormExpectedDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formRefQuote, setFormRefQuote] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState(paymentTerms[0]?.name || '30 Days');
  const [formPlaceOfSupply, setFormPlaceOfSupply] = useState('Delhi');
  const [formPlaceOfSupplyCode, setFormPlaceOfSupplyCode] = useState('07');
  const [formNotes, setFormNotes] = useState('');
  const [formTerms, setFormTerms] = useState(
    '1. Goods/services must be delivered according to stated specifications.\n2. Invoices must quote this Purchase Order number.\n3. Statutory GST compliance and e-invoicing required where applicable.'
  );

  // Line items state
  const [formItems, setFormItems] = useState<
    Array<{
      productId: string;
      productName: string;
      description: string;
      hsnSac: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      gstRate: number;
    }>
  >([
    {
      productId: products[0]?.id || 'prod-1',
      productName: products[0]?.name || 'Standard Product',
      description: products[0]?.description || '',
      hsnSac: products[0]?.hsnSac || '998313',
      unit: products[0]?.uom || 'Each',
      quantity: 1,
      unitPrice: products[0]?.costPrice || 5000,
      discountPercent: 0,
      gstRate: resolveGstRate(products[0]?.gstRate),
    },
  ]);

  // Pre-fill vendor from customer selection
  useEffect(() => {
    if (formVendorType === 'customer' && formSelectedCustomerId) {
      const c = customers.find((cust) => cust.id === formSelectedCustomerId);
      if (c) {
        const defaultAddr = c.addresses?.find((a) => a.isDefault) || c.addresses?.[0];
        const primaryContact = contacts.find((cnt) => cnt.customerId === c.id && cnt.isPrimary) || contacts.find((cnt) => cnt.customerId === c.id);
        setFormVendorName(c.name);
        setFormVendorGstin(c.gstin || '');
        setFormVendorPan(c.pan || '');
        setFormVendorAddress(
          defaultAddr
            ? `${defaultAddr.addressLine1}${defaultAddr.addressLine2 ? ', ' + defaultAddr.addressLine2 : ''}`
            : ''
        );
        setFormVendorCity(defaultAddr?.city || '');
        setFormVendorState(defaultAddr?.state || '');
        setFormVendorStateCode(defaultAddr?.stateCode || '07');
        setFormVendorPhone(c.phone || '');
        setFormVendorEmail(c.email || '');
        setFormContactPerson(primaryContact?.name || '');
        setFormIsSameAsCustomer(true);
      }
    }
  }, [formVendorType, formSelectedCustomerId, customers]);

  // Initial PO deep-link
  useEffect(() => {
    if (!initialPoId) return;
    if (initialPoId === 'ACTION:CREATE') {
      handleOpenCreate();
    } else {
      setSelectedPoId(initialPoId);
    }
  }, [initialPoId]);

  const selectedPo = useMemo(() => {
    return purchaseOrders.find((p) => p.id === selectedPoId) || purchaseOrders[0];
  }, [purchaseOrders, selectedPoId]);

  // Filtered list
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        (po.contactPerson && po.contactPerson.toLowerCase().includes(q)) ||
        (po.referenceQuotationNo && po.referenceQuotationNo.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  // KPI Calculations
  const totalPoCount = purchaseOrders.length;
  const committedPoValue = purchaseOrders
    .filter((po) => po.status !== 'Cancelled')
    .reduce((sum, po) => sum + po.grandTotal, 0);

  const pendingApprovalCount = purchaseOrders.filter(
    (po) => po.status === 'Pending Approval' || po.status === 'Draft'
  ).length;

  const dualEntityVendorsCount = purchaseOrders.filter(
    (po) => po.isSameAsCustomer
  ).length;

  // Handle open create modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormVendorType('customer');
    if (customers[0]) {
      setFormSelectedCustomerId(customers[0].id);
    }
    setFormPoDate(new Date().toISOString().split('T')[0]);
    setFormExpectedDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormRefQuote('');
    setFormPaymentTerms(paymentTerms[0]?.name || '30 Days');
    setFormNotes('');
    setFormItems([
      {
        productId: products[0]?.id || 'prod-1',
        productName: products[0]?.name || 'Standard Product',
        description: products[0]?.description || '',
        hsnSac: products[0]?.hsnSac || '998313',
        unit: products[0]?.uom || 'Each',
        quantity: 1,
        unitPrice: products[0]?.costPrice || 5000,
        discountPercent: 0,
        gstRate: resolveGstRate(products[0]?.gstRate),
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // Add Item in form
  const handleAddItem = () => {
    const prod = products[0];
    setFormItems((prev) => [
      ...prev,
      {
        productId: prod?.id || 'prod-custom',
        productName: prod?.name || 'Item Name',
        description: prod?.description || '',
        hsnSac: prod?.hsnSac || '998313',
        unit: prod?.uom || 'Each',
        quantity: 1,
        unitPrice: prod?.costPrice || 1000,
        discountPercent: 0,
        gstRate: resolveGstRate(prod?.gstRate),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setFormItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          item.productName = prod.name;
          item.description = prod.description;
          item.hsnSac = prod.hsnSac || '998313';
          item.unit = prod.uom || 'Each';
          item.unitPrice = prod.costPrice || 0;
          item.gstRate = resolveGstRate(prod.gstRate);
        }
      }
      next[index] = item;
      return next;
    });
  };

  // Calculate live totals for the modal
  const calculatedItems = useMemo(() => {
    const isInterState = formVendorStateCode !== (supplierCompany.stateCode || '07');

    return formItems.map((item, idx) => {
      const gross = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = (gross * (item.discountPercent || 0)) / 100;
      const taxable = Math.max(0, gross - discount);
      const gstRate = resolveGstRate(item.gstRate);
      const taxAmt = (taxable * gstRate) / 100;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = taxAmt;
      } else {
        cgst = taxAmt / 2;
        sgst = taxAmt / 2;
      }

      return {
        id: `poi-${idx}-${Date.now()}`,
        productId: item.productId,
        productCode: products.find((p) => p.id === item.productId)?.code || 'ITEM',
        productName: item.productName,
        description: item.description,
        hsnSac: item.hsnSac,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxableAmount: taxable,
        gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalTax: taxAmt,
        lineTotal: taxable + taxAmt,
      };
    });
  }, [formItems, formVendorStateCode, supplierCompany, products]);

  const formSubtotal = calculatedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const formTaxable = calculatedItems.reduce((sum, it) => sum + it.taxableAmount, 0);
  const formTotalDiscount = formSubtotal - formTaxable;
  const formCgst = calculatedItems.reduce((sum, it) => sum + it.cgstAmount, 0);
  const formSgst = calculatedItems.reduce((sum, it) => sum + it.sgstAmount, 0);
  const formIgst = calculatedItems.reduce((sum, it) => sum + it.igstAmount, 0);
  const formTotalTax = calculatedItems.reduce((sum, it) => sum + it.totalTax, 0);
  const formGrandTotal = formTaxable + formTotalTax;

  // Handle Save PO
  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendorName.trim()) {
      setSuccessBanner('Please enter or select a vendor name before saving.');
      return;
    }

    const newPoData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      poNumber: `CS/PO/26/03/${String(purchaseOrders.length + 1).padStart(5, '0')}`,
      poDate: formPoDate,
      expectedDeliveryDate: formExpectedDate,
      vendorId: formVendorType === 'customer' ? formSelectedCustomerId : `ven-${Date.now()}`,
      vendorName: formVendorName.trim(),
      vendorGstin: formVendorGstin.trim(),
      vendorPan: formVendorPan.trim(),
      vendorAddress: formVendorAddress.trim(),
      vendorCity: formVendorCity.trim(),
      vendorState: formVendorState.trim(),
      vendorStateCode: formVendorStateCode.trim(),
      vendorPincode: '',
      vendorPhone: formVendorPhone.trim(),
      vendorEmail: formVendorEmail.trim(),
      contactPerson: formContactPerson.trim(),
      isSameAsCustomer: formIsSameAsCustomer,
      linkedCustomerId: formIsSameAsCustomer ? formSelectedCustomerId : undefined,
      referenceQuotationNo: formRefQuote.trim(),
      paymentTerms: formPaymentTerms,
      placeOfSupply: formPlaceOfSupply,
      placeOfSupplyCode: formPlaceOfSupplyCode,
      shippingAddress: `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`,
      items: calculatedItems,
      subtotal: formSubtotal,
      totalDiscount: formTotalDiscount,
      taxableAmount: formTaxable,
      cgstAmount: formCgst,
      sgstAmount: formSgst,
      igstAmount: formIgst,
      totalTax: formTotalTax,
      grandTotal: formGrandTotal,
      status: 'Pending Approval',
      termsAndConditions: formTerms,
      notes: formNotes,
    };

    const saved = addPurchaseOrder(newPoData);
    setSelectedPoId(saved.id);
    setIsCreateModalOpen(false);
    setSuccessBanner(`Purchase Order ${saved.poNumber} created successfully!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Status progression action
  const handleAdvanceStatus = (newStatus: PurchaseOrderStatus) => {
    if (!selectedPo) return;
    updatePurchaseOrderStatus(selectedPo.id, newStatus);
    setSuccessBanner(`PO ${selectedPo.poNumber} status updated to "${newStatus}"`);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  // Delete Action
  const handleDeleteConfirm = () => {
    if (!poToDelete) return;
    deletePurchaseOrder(poToDelete.id);
    setIsDeleteModalOpen(false);
    setPoToDelete(null);
    setSuccessBanner('Purchase Order deleted successfully.');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Print / Save as PDF Handler (Standalone A4 Portrait Print Engine)
  const handleExecutePoPrint = (po: PurchaseOrder) => {
    const html = generatePrintablePurchaseOrderHtml(po, supplierCompany, {
      copyType: printCopyType,
      includeGstTable: poShowTaxSummary,
      includeBankDetails: poShowBankDetails,
      includeSignatory: poShowSignature,
      includeNotes: true,
    });
    triggerStandalonePrint(html);
  };

  // Direct PDF Download Handler (High-Fidelity A4 Portrait with 10mm Margins)
  const handleDownloadPoPdf = async (po: PurchaseOrder) => {
    if (isGeneratingPoPdf) return;
    setIsGeneratingPoPdf(true);
    const safeFileName = `${po.poNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    try {
      const targetEl =
        hiddenPoCaptureRef.current || document.getElementById('printable-po-sheet');
      if (targetEl) {
        await exportElementToPortraitPdf(targetEl, safeFileName);
      } else {
        const doc = generatePurchaseOrderVectorPdf(po, supplierCompany, {
          copyType: printCopyType,
          includeGstTable: poShowTaxSummary,
          includeBankDetails: poShowBankDetails,
          includeSignatory: poShowSignature,
          includeNotes: true,
        });
        doc.save(safeFileName);
      }
      setSuccessBanner(`Purchase Order PDF (${safeFileName}) downloaded with official branding.`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      console.error('PO PDF capture fallback:', err);
      try {
        const doc = generatePurchaseOrderVectorPdf(po, supplierCompany, {
          copyType: printCopyType,
          includeGstTable: poShowTaxSummary,
          includeBankDetails: poShowBankDetails,
          includeSignatory: poShowSignature,
          includeNotes: true,
        });
        doc.save(safeFileName);
      } catch (e2) {
        console.error('Fallback vector PO PDF failed:', e2);
      }
    } finally {
      setIsGeneratingPoPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-800">{supplierCompany.name}</span>
            <span aria-hidden="true">·</span>
            <span>Procurement & Vendor Orders</span>
            <span aria-hidden="true">·</span>
            <span>Purchase Order</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Purchase Orders & Procurement
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPI Summary Bar with Modern Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 card-depth flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-600">Total Purchase Orders</span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {totalPoCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            All registered procurement contracts
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 card-depth flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-600">Committed PO Value</span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatCurrency(committedPoValue)}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Approved & active vendor commitments
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 card-depth flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-600">Pending Approval</span>
            <div className="icon-depth icon-depth-amber w-7 h-7 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700">
            {pendingApprovalCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Awaiting manager or executive sign-off
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 card-depth flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-600">Dual-Entity (Customer & Vendor)</span>
            <div className="icon-depth icon-depth-sky w-7 h-7 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-700">
            {dualEntityVendorsCount} POs
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Vendors linked directly to Customer Master
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search PO #, vendor name, quote ref, contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter: Responsive Dropdown for Mobile / Button Strip for Desktop */}
        <div className="w-full sm:w-auto">
          <div className="block sm:hidden w-full">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter Purchase Orders by Status"
              className="w-full header-dropdown-select bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              {[
                'ALL',
                'Draft',
                'Pending Approval',
                'Approved',
                'Issued to Vendor',
                'Received / Completed',
              ].map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL' ? 'All PO Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-1 text-xs">
            {[
              'ALL',
              'Draft',
              'Pending Approval',
              'Approved',
              'Issued to Vendor',
              'Received / Completed',
            ].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
                  statusFilter === st
                    ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: PO List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>Purchase Orders ({filteredOrders.length})</span>
            <span>Sorted by Date</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <span>No purchase orders found</span>
              </div>
            ) : (
              filteredOrders.map((po) => {
                const isSelected = selectedPo?.id === po.id;
                return (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => setSelectedPoId(po.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer block ${
                      isSelected
                        ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          po.status === 'Approved' || po.status === 'Received / Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'Issued to Vendor'
                            ? 'bg-sky-100 text-sky-800'
                            : po.status === 'Pending Approval'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {po.vendorName}
                    </div>

                    {po.isSameAsCustomer && (
                      <div className="text-[10px] text-indigo-700 font-medium mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Customer & Vendor Entity</span>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">{po.poDate}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(po.grandTotal)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected PO Control Deck & Details */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPo ? (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              {/* Header & Main Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {selectedPo.poNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        selectedPo.status === 'Approved' || selectedPo.status === 'Received / Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedPo.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedPo.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Created on {selectedPo.poDate} · Delivery Target: {selectedPo.expectedDeliveryDate || 'N/A'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Switcher: Order Details vs Branded A4 Preview */}
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDetailTab('deck')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        detailTab === 'deck'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Order Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('preview')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                        detailTab === 'preview'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Branded A4 Preview</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save as PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPoPdf(selectedPo)}
                    disabled={isGeneratingPoPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPoPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                  </button>

                  {selectedPo.status === 'Pending Approval' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus('Approved')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve PO</span>
                    </button>
                  )}

                  {selectedPo.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus('Issued to Vendor')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mark Issued</span>
                    </button>
                  )}

                  {selectedPo.status === 'Issued to Vendor' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus('Received / Completed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Received / Complete</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPoToDelete(selectedPo);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Purchase Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Switch: Order Details vs Live Branded A4 Purchase Order Document */}
              {detailTab === 'preview' ? (
                <div className="p-3 sm:p-5 bg-slate-100/90 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        Official Branded Purchase Order Sheet
                      </span>
                      <span className="text-slate-400">·</span>
                      <span>A4 Portrait (10mm Safe Margins)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={printCopyType}
                        onChange={(e) => setPrintCopyType(e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                      >
                        <option value="Original for Supplier">Original for Supplier</option>
                        <option value="Duplicate for Accounts">Duplicate for Accounts</option>
                        <option value="Triplicate for Warehouse / GRN">Triplicate for Warehouse / GRN</option>
                        <option value="Office Copy">Office Copy</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleExecutePoPrint(selectedPo)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Print / Save as PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPoPdf(selectedPo)}
                        disabled={isGeneratingPoPdf}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <PurchaseOrderDocumentTemplate
                      purchaseOrder={selectedPo}
                      supplierCompany={supplierCompany}
                      copyType={printCopyType}
                      includeGstTable={poShowTaxSummary}
                      includeBankDetails={poShowBankDetails}
                      includeSignatory={poShowSignature}
                      onNavigateToCustomer={onNavigateToCustomer}
                    />
                  </div>
                </div>
              ) : (
                <>
              {/* Vendor Information Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Vendor & Supplier Details
                  </span>
                  {selectedPo.isSameAsCustomer && selectedPo.linkedCustomerId && onNavigateToCustomer && (
                    <button
                      type="button"
                      onClick={() => onNavigateToCustomer(selectedPo.linkedCustomerId!)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Customer 360 Profile</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedPo.vendorName}</h3>
                    <p className="text-slate-600 text-[11px] mt-0.5">{selectedPo.vendorAddress}</p>
                  </div>
                  <div className="text-right sm:text-right shrink-0 font-mono text-[11px] text-slate-700">
                    <div>GSTIN: {selectedPo.vendorGstin || 'Unregistered'}</div>
                    <div>State: {selectedPo.vendorState} ({selectedPo.vendorStateCode})</div>
                  </div>
                </div>

                {selectedPo.contactPerson && (
                  <div className="pt-2 border-t border-slate-200/60 text-slate-600 flex flex-wrap gap-4 text-[11px]">
                    <span>Contact: <strong className="text-slate-800">{selectedPo.contactPerson}</strong></span>
                    {selectedPo.vendorPhone && <span>Phone: <strong className="text-slate-800">{selectedPo.vendorPhone}</strong></span>}
                    {selectedPo.vendorEmail && <span>Email: <strong className="text-slate-800">{selectedPo.vendorEmail}</strong></span>}
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs">Purchased Items & Deliverables</span>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-2 text-center font-mono">HSN/SAC</th>
                        <th className="py-2.5 px-2 text-center font-mono">Qty</th>
                        <th className="py-2.5 px-2 text-right font-mono">Rate (₹)</th>
                        <th className="py-2.5 px-2 text-right font-mono">Taxable (₹)</th>
                        <th className="py-2.5 px-2 text-center">GST</th>
                        <th className="py-2.5 px-3 text-right font-mono">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPo.items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{it.productName}</div>
                            {it.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">{it.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">{it.hsnSac}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-900">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                            {formatCurrency(it.taxableAmount)}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                            {it.gstRate}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                      Payment Terms & Destination
                    </span>
                    <p className="text-slate-800">
                      Payment Terms: <span className="font-semibold">{selectedPo.paymentTerms || '30 Days'}</span>
                    </p>
                    <p className="text-slate-800 mt-1">
                      Place of Supply: <span className="font-semibold">{selectedPo.placeOfSupply} ({selectedPo.placeOfSupplyCode})</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatCurrency(selectedPo.subtotal)}</span>
                  </div>
                  {selectedPo.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">- {formatCurrency(selectedPo.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                    <span>Taxable Value:</span>
                    <span className="font-mono">{formatCurrency(selectedPo.taxableAmount)}</span>
                  </div>
                  {selectedPo.cgstAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>CGST:</span>
                      <span className="font-mono">{formatCurrency(selectedPo.cgstAmount)}</span>
                    </div>
                  )}
                  {selectedPo.sgstAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>SGST:</span>
                      <span className="font-mono">{formatCurrency(selectedPo.sgstAmount)}</span>
                    </div>
                  )}
                  {selectedPo.igstAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span className="font-mono">{formatCurrency(selectedPo.igstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-300">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-indigo-700">
                      {formatCurrency(selectedPo.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>Select a purchase order to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Create / Edit Purchase Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Purchase Order' : 'Create New Purchase Order'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="space-y-5">
              {/* Vendor Selection Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Vendor / Supplier (Customer or Vendor may be the same)
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="vendorType"
                        checked={formVendorType === 'customer'}
                        onChange={() => setFormVendorType('customer')}
                        className="text-indigo-600"
                      />
                      <span>Select from Customer Master (Dual Entity)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="vendorType"
                        checked={formVendorType === 'custom'}
                        onChange={() => {
                          setFormVendorType('custom');
                          setFormIsSameAsCustomer(false);
                        }}
                        className="text-indigo-600"
                      />
                      <span>Custom Vendor</span>
                    </label>
                  </div>
                </div>

                {formVendorType === 'customer' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Choose Customer / Vendor Entity
                    </label>
                    <select
                      value={formSelectedCustomerId}
                      onChange={(e) => setFormSelectedCustomerId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {customers.map((c) => {
                        const addr = c.addresses?.[0];
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} ({addr?.state || 'India'} · GSTIN: {c.gstin || 'None'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Vendor Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formVendorName}
                        onChange={(e) => setFormVendorName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Vendor GSTIN</label>
                      <input
                        type="text"
                        value={formVendorGstin}
                        onChange={(e) => setFormVendorGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">State & State Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formVendorState}
                          onChange={(e) => setFormVendorState(e.target.value)}
                          placeholder="Delhi"
                          className="w-2/3 p-2 rounded-lg border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          value={formVendorStateCode}
                          onChange={(e) => setFormVendorStateCode(e.target.value)}
                          placeholder="07"
                          className="w-1/3 p-2 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Phone / Mobile</label>
                      <input
                        type="text"
                        value={formVendorPhone}
                        onChange={(e) => setFormVendorPhone(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PO Date</label>
                  <input
                    type="date"
                    required
                    value={formPoDate}
                    onChange={(e) => setFormPoDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ref Quotation #</label>
                  <input
                    type="text"
                    value={formRefQuote}
                    onChange={(e) => setFormRefQuote(e.target.value)}
                    placeholder="e.g. QT-2026-09"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="100% Advance">100% Advance</option>
                    <option value="50% Advance, 50% Delivery">50% Advance, 50% Delivery</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Items Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Purchased Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Product / Service</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-200 bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">HSN/SAC</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Unit Rate (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono text-right"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-0.5">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', resolveGstRate(parseFloat(e.target.value)))}
                          className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={formItems.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Preview */}
                <div className="flex justify-end p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                  <div className="text-right space-y-1">
                    <div>Taxable: <strong className="font-mono">{formatCurrency(formTaxable)}</strong></div>
                    <div>Tax: <strong className="font-mono">{formatCurrency(formTotalTax)}</strong></div>
                    <div className="text-sm font-bold text-indigo-700">
                      Total: <strong className="font-mono">{formatCurrency(formGrandTotal)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Delivery instructions, inspection criteria, etc."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                >
                  Save & Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Purchase Order Print & PDF Hub Modal */}
      {isPrintModalOpen && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[94vh]">
            {/* Top Modal Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      Purchase Order — {selectedPo.poNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-medium border border-indigo-400/20">
                      Official Branded A4 Sheet
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Calibrated 10mm A4 margins · Official Corporate Branding · Zero text overlap or overflow
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Copy selector */}
                <select
                  value={printCopyType}
                  onChange={(e) => setPrintCopyType(e.target.value)}
                  className="text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Original for Supplier">Original for Supplier</option>
                  <option value="Duplicate for Accounts">Duplicate for Accounts</option>
                  <option value="Triplicate for Warehouse / GRN">Triplicate for Warehouse / GRN</option>
                  <option value="Office Copy">Office Copy</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleExecutePoPrint(selectedPo)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print / Save as PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPoPdf(selectedPo)}
                  disabled={isGeneratingPoPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPoPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Section Visibility Bar */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-slate-700">Include on Document:</span>
                <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={poShowTaxSummary}
                    onChange={(e) => setPoShowTaxSummary(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>HSN / GST Breakdown Schedule</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={poShowBankDetails}
                    onChange={(e) => setPoShowBankDetails(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Payment & Billing Instructions</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={poShowSignature}
                    onChange={(e) => setPoShowSignature(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Vendor Acceptance & Authorised Signatory</span>
                </label>
              </div>
              <span className="text-[11px] text-slate-500">
                Branding synced with Company Profile ({supplierCompany.name})
              </span>
            </div>

            {/* Render Document Template */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/75">
              <PurchaseOrderDocumentTemplate
                purchaseOrder={selectedPo}
                supplierCompany={supplierCompany}
                copyType={printCopyType}
                includeGstTable={poShowTaxSummary}
                includeBankDetails={poShowBankDetails}
                includeSignatory={poShowSignature}
                onNavigateToCustomer={onNavigateToCustomer}
              />
            </div>
          </div>
        </div>
      )}

      {/* Offscreen High-Resolution Capture Sheet for Direct PDF Export */}
      {selectedPo && (
        <div
          aria-hidden="true"
          className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 overflow-hidden"
        >
          <div ref={hiddenPoCaptureRef} className="w-[794px] bg-white">
            <PurchaseOrderDocumentTemplate
              purchaseOrder={selectedPo}
              supplierCompany={supplierCompany}
              copyType={printCopyType}
              includeGstTable={poShowTaxSummary}
              includeBankDetails={poShowBankDetails}
              includeSignatory={poShowSignature}
              isPrintMode={true}
              id="printable-po-capture-sheet"
            />
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {isDeleteModalOpen && poToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Purchase Order?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="font-mono text-slate-800">{poToDelete.poNumber}</strong>?
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove the purchase order record for vendor <strong>{poToDelete.vendorName}</strong>. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
