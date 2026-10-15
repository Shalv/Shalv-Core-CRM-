import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { resolveGstRate } from '../../shared/gst';
import { Invoice, InvoiceType, PaymentStage, InvoiceItem } from '../../types';
import {
  Receipt,
  Search,
  CreditCard,
  Printer,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Share2,
  RefreshCw,
  Ban,
  Trash2,
  Edit3,
  FileText,
  CalendarCheck,
  ExternalLink,
  Check,
  X,
  ArrowUpRight,
  Download,
  FileDown,
  Sliders,
  Loader2,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { amountInWords } from '../../utils/numberToWords';
import { jsPDF } from 'jspdf';
import { InvoiceDocumentTemplate } from './InvoiceDocumentTemplate';
import {
  getInlineBrandLogoHtml,
  drawPdfBrandEmblem,
  exportElementToPortraitPdf,
  triggerStandalonePrint,
} from '../../utils/documentBranding';

interface InvoicesViewProps {
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string, invoiceId?: string) => void;
  onOpenRecordPaymentForInvoice: (invoice: Invoice) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
  onNavigateToSupport?: (targetId: string) => void;
  initialInvoiceId?: string;
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

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenTrace,
  onOpenRecordPaymentForInvoice,
  onNavigateToCustomer,
  onNavigateToReport,
  onNavigateToSupport,
  initialInvoiceId,
}) => {
  const {
    invoices,
    customers,
    orders,
    milestones,
    products,
    payments,
    amcContracts,
    supportTickets,
    changeRequests,
    licenseTypes,
    createInvoiceDirect,
    updateInvoice,
    convertProformaToTaxInvoice,
    markInvoiceShared,
    cancelInvoice,
    deleteProformaInvoice,
    deleteTaxInvoice,
    deletePayment,
    formatCurrency,
    supplierCompany,
    getStateCode,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Tax' | 'Proforma'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialInvoiceId || invoices[0]?.id || ''
  );

  // Feedback banner
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Print & PDF Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [printCopyType, setPrintCopyType] = useState<string>('Original for Recipient');
  const [includeBankDetails, setIncludeBankDetails] = useState<boolean>(true);
  const [includeSignatory, setIncludeSignatory] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeGstTable, setIncludeGstTable] = useState<boolean>(true);
  const [templateTheme, setTemplateTheme] = useState<'modern' | 'corporate' | 'minimal'>('modern');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfTargetInvoice, setPdfTargetInvoice] = useState<Invoice | null>(null);
  const printableSheetRef = useRef<HTMLDivElement>(null);
  const hiddenCaptureRef = useRef<HTMLDivElement>(null);

  // Ensure dedicated print root container exists on body for isolated browser printing
  useEffect(() => {
    let el = document.getElementById('crm-invoice-print-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'crm-invoice-print-root';
      document.body.appendChild(el);
    }
  }, []);

  // Create / Edit Proforma & Tax Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formInvoiceNumber, setFormInvoiceNumber] = useState<string>('');
  const [docType, setDocType] = useState<InvoiceType>('Tax');
  const [formSourceType, setFormSourceType] = useState<
    'Sales Order' | 'AMC Renewal' | 'Change Request' | 'Ticket' | 'License' | 'Manual'
  >('Sales Order');
  const [formCustomerId, setFormCustomerId] = useState<string>(customers[0]?.id || '');
  const [formOrderId, setFormOrderId] = useState<string>('');
  const [formMilestoneId, setFormMilestoneId] = useState<string>('');
  const [formAmcId, setFormAmcId] = useState<string>('');
  const [formChangeRequestId, setFormChangeRequestId] = useState<string>('');
  const [formTicketId, setFormTicketId] = useState<string>('');
  const [formLicenseTypeId, setFormLicenseTypeId] = useState<string>('');
  const [formServicePeriodStart, setFormServicePeriodStart] = useState<string>('');
  const [formServicePeriodEnd, setFormServicePeriodEnd] = useState<string>('');
  const [formPaymentStage, setFormPaymentStage] = useState<PaymentStage>('Milestone');
  const [formPoNumber, setFormPoNumber] = useState<string>('');
  const [formPoDate, setFormPoDate] = useState<string>('');
  const [formInvoiceDate, setFormInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formDueDate, setFormDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formNotes, setFormNotes] = useState<string>('');
  const [formItems, setFormItems] = useState<
    Array<{
      productId: string;
      productName: string;
      description: string;
      hsnSac: string;
      uom: string;
      quantity: number;
      unitRate: number;
      gstRate: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || 'Consulting Service',
      description: products[0]?.description || '',
      hsnSac: products[0]?.hsnSac || '998313',
      uom: products[0]?.uom || 'Lot',
      quantity: 1,
      unitRate: products[0]?.sellingPrice || 100000,
      gstRate: resolveGstRate(products[0]?.gstRate),
    },
  ]);

  // Cancel Invoice Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!initialInvoiceId) return;
    if (initialInvoiceId === 'FILTER:TAX') {
      setTypeFilter('Tax');
      setStatusFilter('ALL');
    } else if (initialInvoiceId === 'FILTER:PROFORMA') {
      setTypeFilter('Proforma');
      setStatusFilter('ALL');
    } else if (initialInvoiceId === 'FILTER:UNPAID') {
      setTypeFilter('Tax');
      setStatusFilter('Issued');
    } else if (initialInvoiceId === 'FILTER:OVERDUE') {
      setTypeFilter('Tax');
      setStatusFilter('Overdue');
    } else {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredInvoices = invoices.filter((i) => {
    const invType = i.invoiceType || 'Tax';
    const matchesType = typeFilter === 'ALL' || invType === typeFilter;

    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.salesOrderNumber && i.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.amcContractNumber && i.amcContractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.changeRequestNumber && i.changeRequestNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.ticketNumber && i.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.milestoneCode && i.milestoneCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.poNumber && i.poNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const isOverdue = i.status !== 'Paid' && i.status !== 'Cancelled' && i.status !== 'Converted' && i.balanceAmount > 0 && i.dueDate < today;
    const effectiveStatus = isOverdue ? 'Overdue' : i.status;
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

    const effectiveSource =
      i.sourceType ||
      (i.amcContractId ? 'AMC Renewal' : i.changeRequestId ? 'Change Request' : i.ticketId ? 'Ticket' : i.salesOrderId ? 'Sales Order' : 'Manual');
    const matchesSource =
      sourceFilter === 'ALL' ||
      effectiveSource === sourceFilter ||
      (sourceFilter === 'Sales Order' && (effectiveSource === 'Sales Order' || effectiveSource === 'Milestone'));

    return matchesType && matchesSearch && matchesStatus && matchesSource;
  });

  const selectedInvoice =
    filteredInvoices.find((i) => i.id === selectedInvoiceId) ||
    invoices.find((i) => i.id === selectedInvoiceId) ||
    filteredInvoices[0] ||
    invoices[0];

  // Top KPI Metrics
  const activeTaxInvoices = invoices.filter(
    (i) => (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled'
  );
  const activeProformaInvoices = invoices.filter(
    (i) => i.invoiceType === 'Proforma' && i.status !== 'Cancelled' && i.status !== 'Converted'
  );

  const totalTaxInvoiced = activeTaxInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalProformaPipeline = activeProformaInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalCollectedOnInvoices = activeTaxInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalRemainingBalance = activeTaxInvoices.reduce((acc, i) => acc + i.balanceAmount, 0);
  const sharedCount = invoices.filter((i) => i.isShared && i.status !== 'Cancelled').length;

  // Helper to reliably find all payment receipts linked to an invoice
  const getInvoicePayments = (inv?: Invoice | null) => {
    if (!inv) return [];
    return payments.filter(
      (p) =>
        (p.invoiceId && p.invoiceId === inv.id) ||
        (p.invoiceNumber && p.invoiceNumber === inv.invoiceNumber) ||
        (inv.proformaInvoiceId && p.invoiceId === inv.proformaInvoiceId) ||
        (inv.milestoneId && p.milestoneId && p.milestoneId === inv.milestoneId)
    );
  };

  // Payments linked to selected invoice
  const invoicePayments = getInvoicePayments(selectedInvoice);

  // Handle Order / Milestone / AMC / CR / Ticket / License selection in Create Invoice Modal
  const customerOrders = orders.filter((o) => o.customerId === formCustomerId);
  const orderMilestones = milestones.filter((m) => m.salesOrderId === formOrderId);
  const customerAmcContracts = amcContracts.filter((a) => a.customerId === formCustomerId);
  const customerChangeRequests = changeRequests.filter((cr) => cr.customerId === formCustomerId);
  const customerSupportTickets = supportTickets.filter((t) => t.customerId === formCustomerId);

  const handleAmcPick = (amcId: string) => {
    setFormAmcId(amcId);
    const amc = amcContracts.find((a) => a.id === amcId);
    if (amc) {
      setFormPaymentStage('On Account');
      setFormServicePeriodStart(amc.startDate);
      setFormServicePeriodEnd(amc.endDate);
      setFormItems([
        {
          productId: products[2]?.id || products[0]?.id || '',
          productName: `AMC Renewal (${amc.contractNumber}) - ${amc.contractType}`,
          description: `Annual Maintenance & Support Contract (${amc.billingCycle}) | Service Period: ${amc.startDate} to ${amc.endDate}`,
          hsnSac: '998313',
          uom: 'Year',
          quantity: 1,
          unitRate: amc.annualValue,
          gstRate: 18,
        },
      ]);
      setFormNotes(`AMC Contract Renewal for ${amc.contractNumber} (${amc.startDate} to ${amc.endDate})`);
    }
  };

  const handleChangeRequestPick = (crId: string) => {
    setFormChangeRequestId(crId);
    const cr = changeRequests.find((c) => c.id === crId);
    if (cr) {
      setFormPaymentStage('Milestone');
      setFormItems([
        {
          productId: products[1]?.id || products[0]?.id || '',
          productName: `Change Request (${cr.crNumber}): ${cr.title}`,
          description: `${cr.moduleName} customization (${cr.estimatedHours} hrs @ ₹${cr.hourlyRate}/hr)`,
          hsnSac: '998314',
          uom: 'Hours',
          quantity: cr.estimatedHours || 1,
          unitRate: cr.hourlyRate || cr.totalAmount,
          gstRate: 18,
        },
      ]);
      setFormNotes(`Change Request Billing for ${cr.crNumber}: ${cr.title}`);
    }
  };

  const handleSupportTicketPick = (tId: string) => {
    setFormTicketId(tId);
    const tk = supportTickets.find((t) => t.id === tId);
    if (tk) {
      setFormPaymentStage('Final Settlement');
      setFormItems([
        {
          productId: products[1]?.id || products[0]?.id || '',
          productName: `Billable Support Ticket (${tk.ticketNumber}): ${tk.subject}`,
          description: `${tk.category} resolution for ${tk.moduleName}`,
          hsnSac: '998313',
          uom: 'Service',
          quantity: 1,
          unitRate: tk.estimatedBillingAmount || 15000,
          gstRate: 18,
        },
      ]);
      setFormNotes(`Billable Support Ticket ${tk.ticketNumber}: ${tk.subject}`);
    }
  };

  const handleLicensePick = (licId: string) => {
    setFormLicenseTypeId(licId);
    const lic = licenseTypes.find((l) => l.id === licId);
    if (lic) {
      setFormPaymentStage('Advance');
      setFormItems([
        {
          productId: lic.id,
          productName: `${lic.code} - ${lic.name} (Annual Subscription)`,
          description: `${lic.description} (12 Months Subscription @ ₹${lic.monthlyCost}/user/mo)`,
          hsnSac: lic.hsnSac || '997331',
          uom: 'Users',
          quantity: 5,
          unitRate: lic.yearlyCost,
          gstRate: 18,
        },
      ]);
      setFormNotes(`D365 License Subscription Billing — ${lic.name}`);
    }
  };

  const handleMilestonePick = (mId: string) => {
    setFormMilestoneId(mId);
    const ms = milestones.find((m) => m.id === mId);
    const ord = orders.find((o) => o.id === formOrderId);
    if (ms && ord) {
      const gstRate = resolveGstRate(ord.items[0]?.gstRate);
      const taxable = Math.round(ms.amount / (1 + gstRate / 100));
      setFormDueDate(ms.dueDate || formDueDate);
      setFormPaymentStage(
        ms.milestoneCode === 'M1'
          ? 'Advance'
          : ms.milestoneCode === 'M2'
          ? 'Delivery'
          : ms.milestoneCode === 'M3'
          ? 'UAT / Go-Live'
          : 'Final Settlement'
      );
      setFormItems([
        {
          productId: ord.items[0]?.productId || products[0]?.id || '',
          productName: `${ord.items[0]?.productName || 'Project Milestone'} - ${ms.milestoneCode} (${ms.percentage}%)`,
          description: `${ms.milestoneCode}: ${ms.description}`,
          hsnSac: ord.items[0]?.hsnSac || '998313',
          uom: 'Lot',
          quantity: 1,
          unitRate: taxable,
          gstRate,
        },
      ]);
    }
  };

  const handleOpenCreateModal = (type: InvoiceType) => {
    setEditingInvoice(null);
    setFormInvoiceNumber('');
    setDocType(type);
    setFormSourceType('Sales Order');
    setFormCustomerId(customers[0]?.id || '');
    setFormOrderId('');
    setFormMilestoneId('');
    setFormAmcId('');
    setFormChangeRequestId('');
    setFormTicketId('');
    setFormLicenseTypeId('');
    setFormServicePeriodStart('');
    setFormServicePeriodEnd('');
    setFormPaymentStage('Milestone');
    setFormPoNumber('');
    setFormPoDate('');
    setFormInvoiceDate(new Date().toISOString().split('T')[0]);
    setFormDueDate(
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setFormNotes('');
    setFormItems([
      {
        productId: products[0]?.id || '',
        productName: products[0]?.name || 'Consulting Service',
        description: products[0]?.description || '',
        hsnSac: products[0]?.hsnSac || '998313',
        uom: products[0]?.uom || 'Lot',
        quantity: 1,
        unitRate: products[0]?.sellingPrice || 100000,
        gstRate: resolveGstRate(products[0]?.gstRate),
      },
    ]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormInvoiceNumber(inv.invoiceNumber);
    setDocType(inv.invoiceType || 'Tax');

    const resolvedSource:
      | 'Sales Order'
      | 'AMC Renewal'
      | 'Change Request'
      | 'Ticket'
      | 'License'
      | 'Manual' =
      inv.sourceType === 'Milestone' || inv.sourceType === 'Sales Order'
        ? 'Sales Order'
        : inv.sourceType === 'AMC Renewal'
        ? 'AMC Renewal'
        : inv.sourceType === 'Change Request'
        ? 'Change Request'
        : inv.sourceType === 'Ticket'
        ? 'Ticket'
        : inv.sourceType === 'License'
        ? 'License'
        : inv.amcContractId
        ? 'AMC Renewal'
        : inv.changeRequestId
        ? 'Change Request'
        : inv.ticketId
        ? 'Ticket'
        : inv.salesOrderId
        ? 'Sales Order'
        : 'Manual';

    setFormSourceType(resolvedSource);
    setFormCustomerId(inv.customerId);
    setFormOrderId(inv.salesOrderId || '');
    setFormMilestoneId(inv.milestoneId || '');
    setFormAmcId(inv.amcContractId || '');
    setFormChangeRequestId(inv.changeRequestId || '');
    setFormTicketId(inv.ticketId || '');
    setFormLicenseTypeId('');
    setFormServicePeriodStart(inv.servicePeriodStart || '');
    setFormServicePeriodEnd(inv.servicePeriodEnd || '');
    setFormPaymentStage(inv.paymentStage || 'Milestone');
    setFormPoNumber(inv.poNumber || '');
    setFormPoDate(inv.poDate || '');
    setFormInvoiceDate(inv.invoiceDate);
    setFormDueDate(inv.dueDate);
    setFormNotes(inv.notes || '');
    setFormItems(
      inv.items && inv.items.length > 0
        ? inv.items.map((it) => ({
            productId: it.productId || '',
            productName: it.productName,
            description: it.description || '',
            hsnSac: it.hsnSac || '998313',
            uom: it.uom || 'Lot',
            quantity: it.quantity,
            unitRate: it.unitRate,
            gstRate: it.gstRate,
          }))
        : [
            {
              productId: products[0]?.id || '',
              productName: products[0]?.name || 'Consulting Service',
              description: products[0]?.description || '',
              hsnSac: products[0]?.hsnSac || '998313',
              uom: products[0]?.uom || 'Lot',
              quantity: 1,
              unitRate: inv.subtotalTaxable || 100000,
              gstRate: 18,
            },
          ]
    );
    setIsCreateModalOpen(true);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === formCustomerId);
    if (!customer) return;

    const selectedOrd = orders.find((o) => o.id === formOrderId);
    const selectedMs = milestones.find((m) => m.id === formMilestoneId);
    const selectedAmc = amcContracts.find((a) => a.id === formAmcId);
    const selectedCr = changeRequests.find((c) => c.id === formChangeRequestId);
    const selectedTicket = supportTickets.find((t) => t.id === formTicketId);

    const billingAddress =
      selectedOrd?.billingAddress ||
      customer.addresses.find((a) => a.type === 'Billing') ||
      customer.addresses[0] ||
      editingInvoice?.billingAddress;
    const shippingAddress =
      selectedOrd?.shippingAddress ||
      customer.addresses.find((a) => a.type === 'Shipping') ||
      billingAddress;

    const isInterState = (billingAddress.stateCode || getStateCode(billingAddress.state)) !== supplierCompany.stateCode;

    let subtotalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const builtItems: InvoiceItem[] = formItems.map((it, idx) => {
      const taxable = Math.round(it.quantity * it.unitRate);
      const totalItemTax = Math.round((taxable * it.gstRate) / 100);
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = totalItemTax;
      } else {
        cgst = Math.round(totalItemTax / 2);
        sgst = totalItemTax - cgst;
      }

      subtotalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      return {
        id: editingInvoice?.items?.[idx]?.id || `invi-new-${Date.now()}-${idx}`,
        productId: it.productId,
        productName: it.productName,
        description: it.description,
        hsnSac: it.hsnSac,
        uom: it.uom,
        quantity: it.quantity,
        unitRate: it.unitRate,
        taxableAmount: taxable,
        gstRate: it.gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalTax: totalItemTax,
        lineTotal: taxable + totalItemTax,
      };
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const grandTotal = subtotalTaxable + totalTax;

    if (editingInvoice) {
      const res = updateInvoice(editingInvoice.id, {
        invoiceNumber: formInvoiceNumber.trim() || editingInvoice.invoiceNumber,
        invoiceType: docType,
        invoiceDate: formInvoiceDate,
        dueDate: formDueDate,
        customerId: customer.id,
        customerName: customer.name,
        customerGstin: customer.gstin,
        billingAddress,
        shippingAddress,
        sourceType: formSourceType,
        salesOrderId: formSourceType === 'Sales Order' ? selectedOrd?.id : undefined,
        salesOrderNumber: formSourceType === 'Sales Order' ? selectedOrd?.orderNumber : undefined,
        milestoneId: formSourceType === 'Sales Order' ? selectedMs?.id : undefined,
        milestoneCode: formSourceType === 'Sales Order' ? selectedMs?.milestoneCode : undefined,
        amcContractId: formSourceType === 'AMC Renewal' ? selectedAmc?.id : undefined,
        amcContractNumber:
          formSourceType === 'AMC Renewal' ? selectedAmc?.contractNumber : undefined,
        changeRequestId: formSourceType === 'Change Request' ? selectedCr?.id : undefined,
        changeRequestNumber:
          formSourceType === 'Change Request' ? selectedCr?.crNumber : undefined,
        ticketId: formSourceType === 'Ticket' ? selectedTicket?.id : undefined,
        ticketNumber: formSourceType === 'Ticket' ? selectedTicket?.ticketNumber : undefined,
        servicePeriodStart: formServicePeriodStart || undefined,
        servicePeriodEnd: formServicePeriodEnd || undefined,
        paymentStage: formPaymentStage,
        poNumber: formPoNumber || undefined,
        poDate: formPoDate || undefined,
        isInterState,
        paymentTermsName:
          selectedOrd?.paymentTermsName ||
          customer.paymentTermsName ||
          editingInvoice.paymentTermsName,
        subtotalTaxable,
        totalCgst,
        totalSgst,
        totalIgst,
        totalTax,
        grandTotal,
        items: builtItems,
        notes:
          formNotes ||
          `${docType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice issued for ${customer.name}${
            selectedMs ? ` (${selectedMs.milestoneCode})` : ''
          }`,
      });

      setIsCreateModalOpen(false);
      setEditingInvoice(null);
      if (res.success && res.invoice) {
        setSelectedInvoiceId(res.invoice.id);
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
      return;
    }

    const created = createInvoiceDirect({
      invoiceType: docType,
      invoiceDate: formInvoiceDate,
      dueDate: formDueDate,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      billingAddress,
      shippingAddress,
      sourceType: formSourceType,
      salesOrderId: formSourceType === 'Sales Order' ? selectedOrd?.id : undefined,
      salesOrderNumber: formSourceType === 'Sales Order' ? selectedOrd?.orderNumber : undefined,
      milestoneId: formSourceType === 'Sales Order' ? selectedMs?.id : undefined,
      milestoneCode: formSourceType === 'Sales Order' ? selectedMs?.milestoneCode : undefined,
      amcContractId: formSourceType === 'AMC Renewal' ? selectedAmc?.id : undefined,
      amcContractNumber: formSourceType === 'AMC Renewal' ? selectedAmc?.contractNumber : undefined,
      changeRequestId: formSourceType === 'Change Request' ? selectedCr?.id : undefined,
      changeRequestNumber: formSourceType === 'Change Request' ? selectedCr?.crNumber : undefined,
      ticketId: formSourceType === 'Ticket' ? selectedTicket?.id : undefined,
      ticketNumber: formSourceType === 'Ticket' ? selectedTicket?.ticketNumber : undefined,
      servicePeriodStart: formServicePeriodStart || undefined,
      servicePeriodEnd: formServicePeriodEnd || undefined,
      paymentStage: formPaymentStage,
      poNumber: formPoNumber || undefined,
      poDate: formPoDate || undefined,
      isShared: false,
      isInterState,
      paymentTermsName: selectedOrd?.paymentTermsName || customer.paymentTermsName,
      subtotalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      grandTotal,
      status: 'Issued',
      items: builtItems,
      notes:
        formNotes ||
        `${docType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice issued for ${customer.name}${
          selectedMs ? ` (${selectedMs.milestoneCode})` : ''
        }`,
    });

    setIsCreateModalOpen(false);
    setSelectedInvoiceId(created.id);
    setInvoiceToPrint(created);
    setIsPrintModalOpen(true);
    showFeedback(
      'success',
      `${docType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice ${created.invoiceNumber} created successfully! Print options and PDF preview are now open.`
    );
  };

  const handleMarkShared = (inv: Invoice) => {
    markInvoiceShared(inv.id);
    showFeedback('success', `${inv.invoiceNumber} marked as shared with ${inv.customerName}.`);
  };

  const handleConvertProforma = (inv: Invoice) => {
    const taxInv = convertProformaToTaxInvoice(inv.id);
    if (taxInv) {
      setSelectedInvoiceId(taxInv.id);
      setInvoiceToPrint(taxInv);
      setIsPrintModalOpen(true);
      showFeedback(
        'success',
        `Proforma ${inv.invoiceNumber} converted to GST Tax Invoice ${taxInv.invoiceNumber}!`
      );
    }
  };

  const handleCancelInvoiceConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const res = cancelInvoice(selectedInvoice.id, cancelReason);
    setIsCancelModalOpen(false);
    setCancelReason('');
    showFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleDeleteInvoice = (inv: Invoice) => {
    const res =
      inv.invoiceType === 'Proforma'
        ? deleteProformaInvoice(inv.id)
        : deleteTaxInvoice(inv.id);
    if (res.success) {
      const remaining = invoices.filter((i) => i.id !== inv.id);
      setSelectedInvoiceId(remaining[0]?.id || '');
      showFeedback('success', res.message);
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleOpenPrintModal = (inv?: Invoice) => {
    const target = inv || invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
    if (target) {
      setInvoiceToPrint(target);
      setIsPrintModalOpen(true);
    }
  };

  const generatePrintableInvoiceHtml = (
    inv: Invoice,
    options: {
      copyType: string;
      includeBankDetails: boolean;
      includeSignatory: boolean;
      includeNotes: boolean;
    }
  ) => {
    const amountInWordsText = amountInWords(inv.grandTotal);
    const docTitle = inv.invoiceType === 'Proforma' ? 'PROFORMA INVOICE' : 'TAX INVOICE';
    const logoHtml = getInlineBrandLogoHtml(supplierCompany, 44);
    const isPaid = inv.status === 'Paid' || inv.balanceAmount <= 0;
    const isPartiallyPaid = inv.paidAmount > 0 && inv.balanceAmount > 0;
    const isOverdue =
      inv.status === 'Overdue' ||
      (inv.balanceAmount > 0 && new Date(inv.dueDate) < new Date());

    const statusLabel = isPaid
      ? 'PAID IN FULL'
      : isPartiallyPaid
      ? 'PARTIALLY PAID'
      : isOverdue
      ? 'PAYMENT OVERDUE'
      : 'PAYMENT DUE';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${inv.invoiceType === 'Proforma' ? 'Proforma_Invoice' : 'Tax_Invoice'}_${inv.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait !important;
      margin: 10mm 12mm !important;
    }
    @media print {
      @page {
        size: A4 portrait !important;
        margin: 10mm 12mm !important;
      }
      html, body {
        width: 100% !important;
        margin: 0 auto !important;
        background: #ffffff !important;
      }
      .invoice-box {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.45;
    }
    .invoice-box {
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .brand-bar {
      height: 6px;
      background: linear-gradient(90deg, #1e40af 0%, #2563eb 50%, #06b6d4 100%);
    }
    .sheet-inner {
      padding: 20px 22px;
    }
    .top-badges {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .badge-primary {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
    }
    .badge-copy {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-left: 6px;
    }
    .badge-status {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 6px;
      background: ${isPaid ? '#ecfdf5' : isOverdue ? '#fef2f2' : '#fffbeb'};
      color: ${isPaid ? '#047857' : isOverdue ? '#b91c1c' : '#b45309'};
      border: 1px solid ${isPaid ? '#6ee7b7' : isOverdue ? '#fecaca' : '#fde68a'};
    }
    .header-table {
      width: 100%;
      border-bottom: 1px solid #e2e8f0;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .header-table td {
      padding-bottom: 14px;
      vertical-align: top;
    }
    .company-name {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .company-tagline {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1d4ed8;
      margin-top: 2px;
    }
    .company-sub {
      font-size: 10px;
      color: #475569;
      line-height: 1.4;
      margin-top: 6px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .party-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      height: 100%;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1d4ed8;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .party-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 14px;
    }
    .items-table th {
      background: #f1f5f9;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      padding: 7px 6px;
      border-bottom: 1.5px solid #94a3b8;
      border-right: 1px solid #cbd5e1;
      text-align: left;
    }
    .items-table th:last-child {
      border-right: none;
    }
    .items-table td {
      padding: 7px 6px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: top;
      font-size: 10px;
      word-break: break-word;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .mono {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-variant-numeric: tabular-nums;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .totals-table td {
      vertical-align: top;
    }
    .totals-summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .totals-summary-table td {
      padding: 4px 6px;
    }
    .totals-summary-table tr.grand-total {
      font-weight: 800;
      font-size: 11.5px;
      border-top: 2px solid #0f172a;
      background: #eff6ff;
    }
    .bank-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
      font-size: 9.5px;
    }
    .signatory-table {
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid #cbd5e1;
    }
    .signatory-table td {
      padding-top: 12px;
      vertical-align: bottom;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="brand-bar"></div>
    <div class="sheet-inner">
      <div class="top-badges">
        <div>
          <span class="badge-primary">${docTitle}</span>
          <span class="badge-copy">${options.copyType}</span>
        </div>
        <div>
          <span class="badge-status">${statusLabel}</span>
        </div>
      </div>

      <!-- Header -->
      <table class="header-table">
        <tr>
          <td style="width: 58%; padding-right: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${logoHtml}
              <div>
                <h1 class="company-name">${supplierCompany.legalName || supplierCompany.name}</h1>
                <div class="company-tagline">Enterprise ERP, Cloud & Technology Solutions</div>
              </div>
            </div>
            <div class="company-sub">
              ${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}
            </div>
            <table style="width: 100%; font-size: 9.5px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-top: 6px;">
              <tr>
                <td style="padding: 2px 6px;">GSTIN: <strong class="mono">${supplierCompany.gstin}</strong></td>
                <td style="padding: 2px 6px;">PAN: <strong class="mono">${supplierCompany.pan}</strong></td>
              </tr>
              <tr>
                <td style="padding: 2px 6px;">State: <strong>${supplierCompany.state} (${supplierCompany.stateCode})</strong></td>
                <td style="padding: 2px 6px;">Phone: <strong class="mono">${supplierCompany.phone}</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 2px 6px;">Email: <strong class="mono">${supplierCompany.email}</strong> ${supplierCompany.website ? `| Web: <strong>${supplierCompany.website}</strong>` : ''}</td>
              </tr>
            </table>
          </td>
          <td style="width: 42%;">
            <div class="meta-card">
              <div style="text-align: right; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Invoice Number</div>
                <div class="mono" style="font-size: 14px; font-weight: 800; color: #1d4ed8; margin-top: 2px;">${inv.invoiceNumber}</div>
              </div>
              <table style="width: 100%; font-size: 10px;">
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Invoice Date:</td>
                  <td class="text-right mono" style="font-weight: 700;">${inv.invoiceDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Due Date:</td>
                  <td class="text-right mono" style="font-weight: 700; color: #b91c1c;">${inv.dueDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Place of Supply:</td>
                  <td class="text-right" style="font-weight: 700;">${inv.billingAddress.state} (${inv.billingAddress.stateCode})</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 2px 0;">Reverse Charge:</td>
                  <td class="text-right" style="font-weight: 700;">No (Regular)</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Billed To & Reference Meta -->
      <table class="meta-table">
        <tr>
          <td style="width: 50%; padding-right: 7px; vertical-align: top;">
            <div class="party-card">
              <div class="section-title">Billed To (Client Details)</div>
              <div class="party-title">${inv.customerName}</div>
              <div style="color: #475569; font-size: 10px; margin-bottom: 6px;">
                ${inv.billingAddress.addressLine1}${inv.billingAddress.addressLine2 ? `, ${inv.billingAddress.addressLine2}` : ''}<br>
                ${inv.billingAddress.city}, ${inv.billingAddress.state} - ${inv.billingAddress.pincode}
              </div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 9.5px; color: #334155;">
                GSTIN: <strong class="mono">${inv.customerGstin || 'Unregistered'}</strong> | State: <strong>${inv.billingAddress.state} (${inv.billingAddress.stateCode})</strong>
              </div>
            </div>
          </td>
          <td style="width: 50%; padding-left: 7px; vertical-align: top;">
            <div class="party-card">
              <div class="section-title">Order & Milestone Reference</div>
              <div style="font-size: 10px; line-height: 1.5;">
                <div>Sales Order / Source Ref: <strong class="mono">${inv.salesOrderNumber || inv.amcContractNumber || inv.changeRequestNumber || inv.ticketNumber || 'Direct Invoice'}</strong></div>
                <div>Milestone / Category: <strong class="mono" style="color: #1d4ed8;">${inv.milestoneCode || inv.sourceType || 'Standard Billing'}</strong></div>
                ${inv.poNumber ? `<div>Client PO Ref: <strong class="mono">${inv.poNumber}</strong></div>` : ''}
                <div>Payment Stage: <strong>${inv.paymentStage || 'Standard'}</strong> | Terms: <strong>${inv.paymentTermsName}</strong></div>
                ${inv.proformaInvoiceNumber ? `<div>Converted From: <strong class="mono">${inv.proformaInvoiceNumber}</strong></div>` : ''}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 4%;">#</th>
            <th style="width: 28%;">Description of Goods / Services</th>
            <th class="text-center" style="width: 9%;">HSN/SAC</th>
            <th class="text-center" style="width: 8%;">Qty</th>
            <th class="text-right" style="width: 12%;">Rate (₹)</th>
            <th class="text-right" style="width: 13%;">Taxable (₹)</th>
            <th class="text-center" style="width: 6%;">GST %</th>
            <th class="text-right" style="width: 9%;">Tax (₹)</th>
            <th class="text-right" style="width: 11%;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items
            .map(
              (it, idx) => `
            <tr>
              <td class="text-center mono" style="color: #64748b;">${idx + 1}</td>
              <td>
                <strong style="color: #0f172a;">${it.productName}</strong>
                ${it.description ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${it.description}</div>` : ''}
              </td>
              <td class="text-center mono">${it.hsnSac || '998313'}</td>
              <td class="text-center mono"><strong>${it.quantity}</strong> <span style="font-size: 8.5px; color: #64748b;">${it.uom || ''}</span></td>
              <td class="text-right mono">${formatCurrency(it.unitRate)}</td>
              <td class="text-right mono" style="font-weight: 600;">${formatCurrency(it.taxableAmount)}</td>
              <td class="text-center mono">${it.gstRate}%</td>
              <td class="text-right mono" style="color: #1d4ed8;">${formatCurrency(it.totalTax)}</td>
              <td class="text-right mono" style="font-weight: 700; color: #0f172a;">${formatCurrency(it.lineTotal)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- GST Tax Analysis Breakdown Table -->
      <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 6px;">
          <span>Statutory GST & HSN/SAC Tax Analysis Breakdown</span>
          <span style="color: #1d4ed8; font-weight: 700;">Supply Type: ${inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;" class="mono">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; color: #475569; font-weight: 700;">
              <th style="padding: 4px 6px; text-align: left;">HSN / SAC</th>
              <th style="padding: 4px 6px; text-align: right;">Taxable Value (₹)</th>
              ${
                !inv.isInterState
                  ? `
                <th style="padding: 4px 6px; text-align: center;">CGST %</th>
                <th style="padding: 4px 6px; text-align: right;">CGST Amt (₹)</th>
                <th style="padding: 4px 6px; text-align: center;">SGST %</th>
                <th style="padding: 4px 6px; text-align: right;">SGST Amt (₹)</th>
              `
                  : `
                <th style="padding: 4px 6px; text-align: center;">IGST %</th>
                <th style="padding: 4px 6px; text-align: right;">IGST Amt (₹)</th>
              `
              }
              <th style="padding: 4px 6px; text-align: right; color: #0f172a;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const gstMap: Record<
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
              inv.items.forEach((it) => {
                const k = `${it.hsnSac || '998313'}_${it.gstRate}`;
                if (!gstMap[k]) {
                  gstMap[k] = {
                    hsnSac: it.hsnSac || '998313',
                    taxableAmount: 0,
                    gstRate: it.gstRate,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 0,
                    totalTax: 0,
                  };
                }
                gstMap[k].taxableAmount += it.taxableAmount;
                gstMap[k].cgstAmount += it.cgstAmount;
                gstMap[k].sgstAmount += it.sgstAmount;
                gstMap[k].igstAmount += it.igstAmount;
                gstMap[k].totalTax += it.totalTax;
              });
              return Object.values(gstMap)
                .map(
                  (g) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 4px 6px; text-align: left; font-weight: 700; color: #334155;">${g.hsnSac}</td>
                  <td style="padding: 4px 6px; text-align: right;">${formatCurrency(g.taxableAmount)}</td>
                  ${
                    !inv.isInterState
                      ? `
                    <td style="padding: 4px 6px; text-align: center;">${g.gstRate / 2}%</td>
                    <td style="padding: 4px 6px; text-align: right;">${formatCurrency(g.cgstAmount)}</td>
                    <td style="padding: 4px 6px; text-align: center;">${g.gstRate / 2}%</td>
                    <td style="padding: 4px 6px; text-align: right;">${formatCurrency(g.sgstAmount)}</td>
                  `
                      : `
                    <td style="padding: 4px 6px; text-align: center;">${g.gstRate}%</td>
                    <td style="padding: 4px 6px; text-align: right;">${formatCurrency(g.igstAmount)}</td>
                  `
                  }
                  <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #1d4ed8;">${formatCurrency(g.totalTax)}</td>
                </tr>
              `
                )
                .join('');
            })()}
          </tbody>
        </table>
      </div>

      <!-- Totals & Bank Section -->
      <table class="totals-table">
        <tr>
          <td style="width: 56%; padding-right: 12px;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px;">
              <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1e40af;">Amount Chargeable in Words</div>
              <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; margin-top: 2px;">${amountInWordsText}</div>
            </div>

            ${
              options.includeBankDetails
                ? `
              <div class="bank-box">
                <div style="font-weight: 800; color: #1e293b; margin-bottom: 3px; text-transform: uppercase; font-size: 9px;">Bank Payment & Remittance Details</div>
                <div>Bank: <strong>${supplierCompany.bankDetails.bankName}</strong> | A/C Name: <strong>${supplierCompany.bankDetails.accountName}</strong></div>
                <div>Account No: <strong class="mono">${supplierCompany.bankDetails.accountNumber}</strong> | IFSC: <strong class="mono">${supplierCompany.bankDetails.ifscCode}</strong></div>
                <div style="color: #64748b;">Branch: ${supplierCompany.bankDetails.branch}</div>
              </div>
            `
                : ''
            }

            ${
              options.includeNotes && inv.notes
                ? `
              <div style="margin-top: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; font-size: 9.5px; color: #334155; word-break: break-word; line-height: 1.4;">
                <strong style="color: #92400e; text-transform: uppercase; font-size: 9px;">Terms & Remarks:</strong><br>${inv.notes}
              </div>
            `
                : ''
            }
          </td>
          <td style="width: 44%;">
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px;">
              <table class="totals-summary-table">
                <tr>
                  <td>Taxable Subtotal:</td>
                  <td class="text-right mono" style="font-weight: 600;">${formatCurrency(inv.subtotalTaxable)}</td>
                </tr>
                ${
                  inv.isInterState
                    ? `
                  <tr>
                    <td>Integrated GST (IGST):</td>
                    <td class="text-right mono">${formatCurrency(inv.totalIgst)}</td>
                  </tr>
                `
                    : `
                  <tr>
                    <td>Central GST (CGST):</td>
                    <td class="text-right mono">${formatCurrency(inv.totalCgst)}</td>
                  </tr>
                  <tr>
                    <td>State GST (SGST):</td>
                    <td class="text-right mono">${formatCurrency(inv.totalSgst)}</td>
                  </tr>
                `
                }
                <tr class="grand-total">
                  <td style="padding: 7px 6px;">Total Invoice Amount:</td>
                  <td class="text-right mono" style="padding: 7px 6px; font-size: 12px; color: #1d4ed8;">${formatCurrency(inv.grandTotal)}</td>
                </tr>
                <tr>
                  <td style="color: #047857;">Amount Received / Paid:</td>
                  <td class="text-right mono" style="color: #047857; font-weight: 700;">${formatCurrency(inv.paidAmount)}</td>
                </tr>
                <tr style="border-top: 1px dashed #cbd5e1; font-weight: 700;">
                  <td style="color: ${inv.balanceAmount > 0 ? '#b91c1c' : '#047857'};">Balance Remaining Due:</td>
                  <td class="text-right mono" style="color: ${inv.balanceAmount > 0 ? '#b91c1c' : '#047857'};">${formatCurrency(inv.balanceAmount)}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
      </table>

      <!-- Declaration & Authorized Signatory -->
      <table class="signatory-table">
        <tr>
          <td style="width: 58%;">
            <div style="font-size: 9.5px; color: #64748b; line-height: 1.4;">
              <strong style="color: #334155; text-transform: uppercase;">Statutory Declaration:</strong><br>
              We declare that this invoice shows the actual price of the goods or services described and that all particulars are true and correct.<br>
              <span style="font-size: 9px; color: #94a3b8;">* Computer-generated invoice issued by ${supplierCompany.legalName || supplierCompany.name} in accordance with GST Rules.</span>
            </div>
          </td>
          <td style="width: 42%; text-align: right;">
            ${
              options.includeSignatory
                ? `
              <div style="font-size: 10.5px; font-weight: 800; color: #0f172a;">
                For ${supplierCompany.legalName || supplierCompany.name}
              </div>
              <div style="margin: 8px 0;">
                <span style="display: inline-block; padding: 4px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #1d4ed8; font-size: 9px; font-weight: 700;">
                  ✓ Digitally Verified · Coreenact Authority
                </span>
              </div>
              <div style="border-top: 1px solid #475569; display: inline-block; min-width: 175px; padding-top: 4px; font-size: 10px; font-weight: 700; color: #334155; text-align: center;">
                Authorized Signatory
              </div>
            `
                : ''
            }
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
  };

  const handleExecutePrint = () => {
    const target = invoiceToPrint || selectedInvoice;
    if (!target) return;

    const printHtml = generatePrintableInvoiceHtml(target, {
      copyType: printCopyType,
      includeBankDetails,
      includeSignatory,
      includeNotes,
    });

    triggerStandalonePrint(printHtml);
  };

  // Generate crisp, authentic vector A4 Portrait PDF directly using jsPDF (Zero overlapping columns)
  const generateInvoicePdfDoc = (
    inv: Invoice,
    options: {
      copyType: string;
      includeBankDetails: boolean;
      includeSignatory: boolean;
      includeNotes: boolean;
    }
  ) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const left = 12;
    const right = 198;
    const contentWidth = right - left; // 186mm
    const midX = 105; // 12 + 186/2
    let y = 12;

    const docTitle = inv.invoiceType === 'Proforma' ? 'PROFORMA INVOICE' : 'TAX INVOICE';
    const isPaid = inv.status === 'Paid' || inv.balanceAmount <= 0;
    const isPartiallyPaid = inv.paidAmount > 0 && inv.balanceAmount > 0;
    const isOverdue =
      inv.status === 'Overdue' ||
      (inv.balanceAmount > 0 && new Date(inv.dueDate) < new Date());

    const formatNum = (amt: number): string =>
      Number(amt || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });

    const formatPdfCur = (amt: number): string => 'Rs. ' + formatNum(amt);

    // Top Brand Accent Bar
    doc.setFillColor(30, 64, 175);
    doc.rect(left, y, contentWidth, 2, 'F');
    y += 2;

    // --- Header Section ---
    drawPdfBrandEmblem(doc, left + 4, y + 3.5, 11, supplierCompany);

    // Company Name
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierCompany.legalName || supplierCompany.name, left + 18, y + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('ENTERPRISE ERP, CLOUD & TECHNOLOGY SOLUTIONS', left + 18, y + 12);

    // Document Title on right
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text(docTitle, right - 4, y + 7.5, { align: 'right' });
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`(${options.copyType})`, right - 4, y + 11.5, { align: 'right' });

    // Status Badge on right
    if (isPaid) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(110, 231, 183);
      doc.roundedRect(right - 34, y + 13, 30, 4.5, 1, 1, 'FD');
      doc.setFontSize(6.5);
      doc.setTextColor(4, 120, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID IN FULL', right - 19, y + 16.2, { align: 'center' });
    } else if (isPartiallyPaid) {
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(253, 224, 71);
      doc.roundedRect(right - 36, y + 13, 32, 4.5, 1, 1, 'FD');
      doc.setFontSize(6.5);
      doc.setTextColor(161, 98, 7);
      doc.setFont('helvetica', 'bold');
      doc.text('PARTIALLY PAID', right - 20, y + 16.2, { align: 'center' });
    } else if (isOverdue) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(right - 36, y + 13, 32, 4.5, 1, 1, 'FD');
      doc.setFontSize(6.5);
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT OVERDUE', right - 20, y + 16.2, { align: 'center' });
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(right - 34, y + 13, 30, 4.5, 1, 1, 'FD');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DUE', right - 19, y + 16.2, { align: 'center' });
    }

    // Company details (Left, wrapped to 102mm max width)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(71, 85, 105);
    const fullCompanyAddr = `${supplierCompany.address}, ${supplierCompany.city}, ${supplierCompany.state} - ${supplierCompany.pincode}`;
    const addrLines = doc.splitTextToSize(fullCompanyAddr, 102);
    doc.text(addrLines, left + 4, y + 18);
    const addrOffset = addrLines.length * 3.5;

    doc.text(
      `GSTIN: ${supplierCompany.gstin}   |   PAN: ${supplierCompany.pan}   |   State: ${supplierCompany.state} (${supplierCompany.stateCode})`,
      left + 4,
      y + 18 + addrOffset
    );
    doc.text(
      `Email: ${supplierCompany.email}   |   Phone: ${supplierCompany.phone}`,
      left + 4,
      y + 21.8 + addrOffset
    );

    // Invoice meta on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Invoice No: ${inv.invoiceNumber}`, right - 4, y + 21.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice Date: ${inv.invoiceDate}`, right - 4, y + 25.5, { align: 'right' });
    doc.setTextColor(
      inv.balanceAmount > 0 ? 185 : 71,
      inv.balanceAmount > 0 ? 28 : 85,
      inv.balanceAmount > 0 ? 28 : 105
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Due Date: ${inv.dueDate}`, right - 4, y + 29.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Place of Supply: ${inv.billingAddress.state} (${inv.billingAddress.stateCode})`,
      right - 4,
      y + 33,
      { align: 'right' }
    );

    y += Math.max(36, 25 + addrOffset);
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, right, y);

    // --- Billed To & Order Reference Section ---
    doc.line(midX, y, midX, y + 27);

    // Left: Billed To
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('BILLED TO (CLIENT DETAILS)', left + 4, y + 4.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(inv.customerName, 85)[0] || inv.customerName, left + 4, y + 9);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const clientAddrLines = doc
      .splitTextToSize(
        `${inv.billingAddress.addressLine1}, ${inv.billingAddress.city} - ${inv.billingAddress.pincode}`,
        85
      )
      .slice(0, 2);
    doc.text(clientAddrLines, left + 4, y + 13);
    doc.text(
      `GSTIN: ${inv.customerGstin || 'Unregistered'}  |  State: ${inv.billingAddress.state} (${inv.billingAddress.stateCode})`,
      left + 4,
      y + 22
    );

    // Right: Order Reference
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('ORDER & MILESTONE REFERENCE', midX + 4, y + 4.5);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Sales Order / Ref: ${inv.salesOrderNumber || inv.amcContractNumber || inv.changeRequestNumber || inv.ticketNumber || 'Direct Invoice'}`,
      midX + 4,
      y + 9
    );
    doc.text(`Milestone / Category: ${inv.milestoneCode || inv.sourceType || 'Standard'}`, midX + 4, y + 13.2);
    doc.text(`Payment Stage: ${inv.paymentStage || 'Standard'}`, midX + 4, y + 17.4);
    doc.text(`Payment Terms: ${inv.paymentTermsName}`, midX + 4, y + 21.6);
    if (inv.poNumber) {
      doc.text(
        `Client PO: ${inv.poNumber} ${inv.poDate ? `(${inv.poDate})` : ''}`,
        midX + 4,
        y + 25.5
      );
    }

    y += 27;
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, right, y);

    // --- Items Table Header (Non-overlapping calibrated column boundaries) ---
    // Col boundaries: 12 | 20 | 78 | 93 | 107 | 128 | 150 | 161 | 179 | 198
    const colX = [12, 20, 78, 93, 107, 128, 150, 161, 179, 198];

    doc.setFillColor(241, 245, 249);
    doc.rect(left, y, contentWidth, 7, 'F');
    doc.line(left, y + 7, right, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(15, 23, 42);

    doc.text('#', 16, y + 4.6, { align: 'center' });
    doc.text('ITEM DESCRIPTION', 21.5, y + 4.6);
    doc.text('HSN/SAC', 85.5, y + 4.6, { align: 'center' });
    doc.text('QTY', 100, y + 4.6, { align: 'center' });
    doc.text('RATE (INR)', 126.5, y + 4.6, { align: 'right' });
    doc.text('TAXABLE (INR)', 148.5, y + 4.6, { align: 'right' });
    doc.text('GST%', 155.5, y + 4.6, { align: 'center' });
    doc.text('TAX (INR)', 177.5, y + 4.6, { align: 'right' });
    doc.text('TOTAL (INR)', 196.5, y + 4.6, { align: 'right' });

    y += 7;

    // --- Items Rows ---
    inv.items.forEach((item, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      const titleLines = doc.splitTextToSize(item.productName, 54);
      const descLines = item.description
        ? doc.splitTextToSize(item.description, 54).slice(0, 2)
        : [];
      const rowHeight = Math.max(7.5, titleLines.length * 3.5 + descLines.length * 3 + 2.5);

      const rowY = y + 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(String(idx + 1), 16, rowY, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(titleLines, 21.5, rowY);

      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(100, 116, 139);
        doc.text(descLines, 21.5, rowY + titleLines.length * 3.4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(item.hsnSac || '998313', 85.5, rowY, { align: 'center' });
      doc.text(`${item.quantity} ${item.uom || ''}`, 100, rowY, { align: 'center' });
      doc.text(formatNum(item.unitRate), 126.5, rowY, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatNum(item.taxableAmount), 148.5, rowY, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.gstRate}%`, 155.5, rowY, { align: 'center' });

      doc.setTextColor(29, 78, 216);
      doc.text(formatNum(item.totalTax), 177.5, rowY, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatNum(item.lineTotal), 196.5, rowY, { align: 'right' });

      // Vertical column dividers
      doc.setDrawColor(226, 232, 240);
      for (let i = 1; i < colX.length - 1; i++) {
        doc.line(colX[i], y - (idx === 0 ? 7 : 0), colX[i], y + rowHeight);
      }

      y += rowHeight;
      doc.line(left, y, right, y);
    });

    const tableMinY = 132;
    if (y < tableMinY) {
      y = tableMinY;
      doc.setDrawColor(203, 213, 225);
      doc.line(left, y, right, y);
    }

    // Group items by HSN/SAC for GST Tax Analysis Breakdown
    const gstMap: Record<
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

    inv.items.forEach((it) => {
      const k = `${it.hsnSac || '998313'}_${it.gstRate}`;
      if (!gstMap[k]) {
        gstMap[k] = {
          hsnSac: it.hsnSac || '998313',
          taxableAmount: 0,
          gstRate: it.gstRate,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
        };
      }
      gstMap[k].taxableAmount += it.taxableAmount;
      gstMap[k].cgstAmount += it.cgstAmount;
      gstMap[k].sgstAmount += it.sgstAmount;
      gstMap[k].igstAmount += it.igstAmount;
      gstMap[k].totalTax += it.totalTax;
    });

    const gstList = Object.values(gstMap);

    // --- GST Tax Analysis Breakdown Table ---
    doc.setFillColor(248, 250, 252);
    doc.rect(left, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text('STATUTORY GST & HSN/SAC TAX BREAKDOWN', left + 4, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      inv.isInterState ? 'Supply Type: Inter-State (IGST)' : 'Supply Type: Intra-State (CGST + SGST)',
      right - 4,
      y + 3.8,
      { align: 'right' }
    );

    y += 5.5;
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, right, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    if (!inv.isInterState) {
      doc.text('HSN / SAC', 16, y + 3.8);
      doc.text('Taxable Value (Rs.)', 70, y + 3.8, { align: 'right' });
      doc.text('CGST %', 84, y + 3.8, { align: 'center' });
      doc.text('CGST Amt (Rs.)', 116, y + 3.8, { align: 'right' });
      doc.text('SGST %', 130, y + 3.8, { align: 'center' });
      doc.text('SGST Amt (Rs.)', 162, y + 3.8, { align: 'right' });
      doc.text('Total Tax (Rs.)', 196, y + 3.8, { align: 'right' });
    } else {
      doc.text('HSN / SAC', 16, y + 3.8);
      doc.text('Taxable Value (Rs.)', 90, y + 3.8, { align: 'right' });
      doc.text('IGST %', 115, y + 3.8, { align: 'center' });
      doc.text('IGST Amt (Rs.)', 158, y + 3.8, { align: 'right' });
      doc.text('Total Tax (Rs.)', 196, y + 3.8, { align: 'right' });
    }

    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, right, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    gstList.forEach((g) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(g.hsnSac, 16, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      if (!inv.isInterState) {
        doc.text(formatPdfCur(g.taxableAmount), 70, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate / 2}%`, 84, y + 3.8, { align: 'center' });
        doc.text(formatPdfCur(g.cgstAmount), 116, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate / 2}%`, 130, y + 3.8, { align: 'center' });
        doc.text(formatPdfCur(g.sgstAmount), 162, y + 3.8, { align: 'right' });
      } else {
        doc.text(formatPdfCur(g.taxableAmount), 90, y + 3.8, { align: 'right' });
        doc.text(`${g.gstRate}%`, 115, y + 3.8, { align: 'center' });
        doc.text(formatPdfCur(g.igstAmount), 158, y + 3.8, { align: 'right' });
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(formatPdfCur(g.totalTax), 196, y + 3.8, { align: 'right' });

      y += 5.2;
      doc.line(left, y, right, y);
    });

    // --- Totals & Remittance Section ---
    doc.setDrawColor(203, 213, 225);
    doc.line(midX + 4, y, midX + 4, y + 54);

    const maxLeftWidth = midX - left;

    // Left: Words & Bank
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('AMOUNT CHARGEABLE IN WORDS:', left + 4, y + 4.5);

    doc.setFontSize(7.4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const words = amountInWords(inv.grandTotal);
    const splitWords = doc.splitTextToSize(words, maxLeftWidth - 4);
    doc.text(splitWords, left + 4, y + 8.5);

    if (options.includeBankDetails) {
      const bankY = y + 17;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(left + 3, bankY, maxLeftWidth - 2, 22, 1.5, 1.5, 'FD');

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('BANK PAYMENT & REMITTANCE DETAILS', left + 5, bankY + 4);

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Bank: ${supplierCompany.bankDetails.bankName}  |  A/C Name: ${supplierCompany.bankDetails.accountName}`,
        left + 5,
        bankY + 8
      );
      doc.text(
        `A/C No: ${supplierCompany.bankDetails.accountNumber}   |   IFSC: ${supplierCompany.bankDetails.ifscCode}`,
        left + 5,
        bankY + 12.5
      );
      doc.text(`Branch: ${supplierCompany.bankDetails.branch}`, left + 5, bankY + 17);
    }

    if (options.includeNotes && inv.notes) {
      doc.setFontSize(6.6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(`Notes: ${inv.notes}`, maxLeftWidth - 4).slice(0, 3);
      doc.text(splitNotes, left + 4, y + 44);
    }

    // Right: Calculation Summary
    let sumY = y + 5;
    doc.setFontSize(7.4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    doc.text('Taxable Subtotal:', midX + 8, sumY);
    doc.text(formatPdfCur(inv.subtotalTaxable), right - 4, sumY, { align: 'right' });

    if (inv.isInterState) {
      sumY += 4.5;
      doc.text('Integrated GST (IGST):', midX + 8, sumY);
      doc.text(formatPdfCur(inv.totalIgst), right - 4, sumY, { align: 'right' });
    } else {
      sumY += 4.5;
      doc.text('Central GST (CGST):', midX + 8, sumY);
      doc.text(formatPdfCur(inv.totalCgst), right - 4, sumY, { align: 'right' });
      sumY += 4.5;
      doc.text('State GST (SGST):', midX + 8, sumY);
      doc.text(formatPdfCur(inv.totalSgst), right - 4, sumY, { align: 'right' });
    }

    sumY += 5.5;
    doc.setFillColor(239, 246, 255);
    doc.rect(midX + 4, sumY - 3.8, right - (midX + 4), 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 78, 216);
    doc.text('Total Invoice Amount:', midX + 8, sumY + 1);
    doc.text(formatPdfCur(inv.grandTotal), right - 4, sumY + 1, { align: 'right' });

    sumY += 7.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(4, 120, 87);
    doc.text('Amount Received / Paid:', midX + 8, sumY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPdfCur(inv.paidAmount), right - 4, sumY, { align: 'right' });

    sumY += 5.5;
    doc.setTextColor(
      inv.balanceAmount > 0 ? 185 : 4,
      inv.balanceAmount > 0 ? 28 : 120,
      inv.balanceAmount > 0 ? 28 : 87
    );
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Remaining Due:', midX + 8, sumY);
    doc.text(formatPdfCur(inv.balanceAmount), right - 4, sumY, { align: 'right' });

    y += 54;
    doc.setDrawColor(203, 213, 225);
    doc.line(left, y, right, y);

    // --- Declaration & Authorized Signatory Section ---
    const footerHeight = 25;
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('STATUTORY DECLARATION:', left + 4, y + 5);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'We declare that this invoice shows the actual price of the goods or services',
      left + 4,
      y + 9
    );
    doc.text('described and that all particulars are true and correct.', left + 4, y + 13);
    doc.text(
      `* Computer-generated tax invoice issued by ${supplierCompany.legalName || supplierCompany.name}.`,
      left + 4,
      y + 17
    );

    if (options.includeSignatory) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `For ${supplierCompany.legalName || supplierCompany.name}`,
        right - 4,
        y + 5,
        { align: 'right' }
      );

      // Digital seal badge
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(right - 48, y + 7, 44, 4.5, 1, 1, 'FD');
      doc.setFontSize(6.2);
      doc.setTextColor(29, 78, 216);
      doc.setFont('helvetica', 'bold');
      doc.text('Digitally Verified - Coreenact', right - 26, y + 10.2, { align: 'center' });

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(right - 48, y + 18, right - 4, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text('Authorized Signatory', right - 26, y + 21.5, { align: 'center' });
    }

    const finalHeight = y + footerHeight - 12;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.rect(left, 12, contentWidth, finalHeight, 'S');

    return doc;
  };

  // Modern High-Resolution PDF generation using html2canvas + jsPDF with proper 10mm A4 margins & vector fallback
  const handleDownloadPdf = async (invOverride?: Invoice, forceVector = false) => {
    const target = invOverride || invoiceToPrint || selectedInvoice;
    if (!target) return;

    setIsGeneratingPdf(true);
    setPdfTargetInvoice(target);

    const docPrefix = target.invoiceType === 'Proforma' ? 'Proforma_Invoice' : 'Tax_Invoice';
    const fileName = `${docPrefix}_${target.invoiceNumber.replace(/\//g, '_')}.pdf`;

    // 1. If explicit vector mode requested, run optimized vector generator directly
    if (forceVector) {
      try {
        const pdf = generateInvoicePdfDoc(target, {
          copyType: printCopyType,
          includeBankDetails,
          includeSignatory,
          includeNotes,
        });
        pdf.save(fileName);
        showFeedback('success', `Vector PDF downloaded successfully (${fileName})!`);
      } catch (err) {
        console.error('Vector PDF error:', err);
        showFeedback('error', 'Failed to generate Vector PDF.');
      } finally {
        setIsGeneratingPdf(false);
      }
      return;
    }

    // 2. High-Resolution Visual PDF via html2canvas with 10mm A4 portrait margins
    try {
      let captureEl: HTMLElement | null = null;
      if (isPrintModalOpen && printableSheetRef.current && invoiceToPrint?.id === target.id) {
        captureEl = printableSheetRef.current;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        captureEl = hiddenCaptureRef.current;
      }

      if (!captureEl) {
        throw new Error('Capture element container not ready');
      }

      await exportElementToPortraitPdf(captureEl, fileName);
      showFeedback(
        'success',
        `High-Resolution Invoice PDF downloaded (${fileName})!`
      );
    } catch (err) {
      console.warn('Canvas PDF export failed, falling back to clean Vector PDF', err);
      try {
        const pdf = generateInvoicePdfDoc(target, {
          copyType: printCopyType,
          includeBankDetails,
          includeSignatory,
          includeNotes,
        });
        pdf.save(fileName);
        showFeedback(
          'success',
          `Invoice downloaded in Vector PDF format (${fileName})!`
        );
      } catch (fallbackErr) {
        console.error('All PDF generation failed:', fallbackErr);
        handleExecutePrint();
        showFeedback(
          'error',
          'PDF generation issue encountered. Print dialog has been opened (select Save as PDF).'
        );
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadInvoiceDocument = () => {
    const target = invoiceToPrint || selectedInvoice;
    if (!target) return;

    setIsDownloading(true);
    const printHtml = generatePrintableInvoiceHtml(target, {
      copyType: printCopyType,
      includeBankDetails,
      includeSignatory,
      includeNotes,
    });

    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const docName = `${target.invoiceType === 'Proforma' ? 'Proforma_Invoice' : 'Tax_Invoice'}_${target.invoiceNumber}`;
    link.download = `${docName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloading(false);

    showFeedback(
      'success',
      `Invoice archive saved as "${link.download}"!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Proforma & GST Tax Invoicing Hub</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenCreateModal('Proforma')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>New Proforma (PI)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal('Tax')}
            className="flex items-center gap-1.5 px-3.5 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Operation Feedback Banner */}
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

      {/* Finance KPI Summary Strip (All 5 tiles clickable with Modern Icon Depth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setTypeFilter('Tax');
            setStatusFilter('ALL');
          }}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            typeFilter === 'Tax' && statusFilter === 'ALL'
              ? 'border-indigo-400 ring-2 ring-indigo-500/15 bg-indigo-50/30'
              : 'hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              Tax Invoices Issued
            </span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {formatCurrency(totalTaxInvoiced)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {activeTaxInvoices.length} active GST invoice(s) • Click to filter
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTypeFilter('Proforma');
            setStatusFilter('ALL');
          }}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            typeFilter === 'Proforma'
              ? 'border-amber-400 ring-2 ring-amber-500/15 bg-amber-50/30'
              : 'hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block truncate">
              Proforma Pipeline (PI)
            </span>
            <div className="icon-depth icon-depth-amber w-7 h-7 shrink-0">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-amber-700 mt-1 truncate">
            {formatCurrency(totalProformaPipeline)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {activeProformaInvoices.length} open proforma(s) • Click to filter
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTypeFilter('Tax');
            setStatusFilter('Paid');
          }}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            statusFilter === 'Paid'
              ? 'border-emerald-400 ring-2 ring-emerald-500/15 bg-emerald-50/30'
              : 'hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block truncate">
              Total Collected
            </span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 mt-1 truncate">
            {formatCurrency(totalCollectedOnInvoices)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            Reconciled against invoices • Filter Paid
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTypeFilter('Tax');
            setStatusFilter('Overdue');
          }}
          className={`text-left bg-white p-4 rounded-xl border min-w-0 overflow-hidden transition group cursor-pointer card-depth ${
            statusFilter === 'Overdue'
              ? 'border-rose-400 ring-2 ring-rose-500/15 bg-rose-50/30'
              : 'hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block truncate">
              Remaining Balance
            </span>
            <div className="icon-depth icon-depth-rose w-7 h-7 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-rose-700 mt-1 truncate">
            {formatCurrency(totalRemainingBalance)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            Net unpaid receivables • Filter Overdue
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('gst_tax_register')}
          className="text-left bg-white p-4 rounded-xl border hover:border-indigo-300 hover:bg-indigo-50/20 min-w-0 overflow-hidden transition group cursor-pointer card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block truncate">
              Shared With Client
            </span>
            <div className="icon-depth icon-depth-sky w-7 h-7 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 mt-1 truncate">
            {sharedCount} / {invoices.filter((i) => i.status !== 'Cancelled').length}
          </div>
          <span className="text-[11px] text-indigo-600 mt-0.5 block truncate">
            Open GST Tax Register Report →
          </span>
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Invoice Register List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2.5">
            {/* Document Type Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer whitespace-nowrap truncate ${
                  typeFilter === 'ALL'
                    ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('Tax')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer whitespace-nowrap truncate ${
                  typeFilter === 'Tax'
                    ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax (INV)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('Proforma')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer whitespace-nowrap truncate ${
                  typeFilter === 'Proforma'
                    ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proforma (PI)
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Invoice #, Customer, SO #, Milestone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Issued">Issued</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Converted">Converted (PI)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-indigo-700 font-semibold"
                >
                  <option value="ALL">All Sources</option>
                  <option value="Sales Order">Sales Orders & Milestones</option>
                  <option value="AMC Renewal">AMC Renewals</option>
                  <option value="Change Request">Change Requests (CR)</option>
                  <option value="Ticket">Support Tickets</option>
                  <option value="License">License Subscriptions</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {filteredInvoices.length} shown
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              const isProforma = inv.invoiceType === 'Proforma';
              const isOverdue =
                inv.status !== 'Paid' &&
                inv.status !== 'Cancelled' &&
                inv.status !== 'Converted' &&
                inv.balanceAmount > 0 &&
                inv.dueDate < today;
              const displayStatus = isOverdue ? 'Overdue' : inv.status;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start justify-between text-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isProforma
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {inv.invoiceNumber}
                        </span>
                        {inv.isShared && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                            title={`Shared ${inv.sharedAt || ''}`}
                          >
                            Shared
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          displayStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : displayStatus === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : displayStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : displayStatus === 'Converted'
                            ? 'bg-indigo-100 text-indigo-800'
                            : displayStatus === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug truncate">
                      {inv.customerName}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                      <span>Due: {inv.dueDate}</span>
                      {inv.milestoneCode && (
                        <span className="font-mono text-indigo-600 font-semibold">
                          • {inv.milestoneCode}
                        </span>
                      )}
                      {inv.amcContractNumber && (
                        <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                          AMC: {inv.amcContractNumber}
                        </span>
                      )}
                      {inv.changeRequestNumber && (
                        <span className="font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                          CR: {inv.changeRequestNumber}
                        </span>
                      )}
                      {inv.ticketNumber && (
                        <span className="font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                          TKT: {inv.ticketNumber}
                        </span>
                      )}
                      {inv.sourceType === 'License' && (
                        <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                          License
                        </span>
                      )}
                      {inv.paymentStage && (
                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                          {inv.paymentStage}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-[11px] font-mono tabular-nums">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 truncate">
                          Tot: {formatCurrency(inv.grandTotal)}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span
                          className={`font-bold truncate ${
                            inv.status === 'Cancelled'
                              ? 'text-slate-400'
                              : inv.balanceAmount > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          Bal: {formatCurrency(inv.balanceAmount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditInvoice(inv)}
                          className="p-1 rounded-md hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                          title={
                            inv.invoiceType === 'Proforma'
                              ? 'Edit Proforma Invoice'
                              : 'Edit Tax Invoice'
                          }
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPrintModal(inv)}
                          className="p-1 rounded-md hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                          title="Print Invoice / Save as PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={isGeneratingPdf}
                          className="p-1 rounded-md hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                          title="Download Portrait PDF directly"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title={
                            inv.invoiceType === 'Proforma'
                              ? 'Delete Proforma Invoice'
                              : 'Delete Tax Invoice'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Tax / Proforma Invoice Sheet & Operations */}
        {selectedInvoice ? (
          <div className="lg:col-span-8 space-y-4 min-w-0">
            {/* Finance Operations Bar ($op actions mapped cleanly) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                    selectedInvoice.invoiceType === 'Proforma'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {selectedInvoice.invoiceType === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedInvoice.invoiceNumber}
                </span>
                {selectedInvoice.paymentStage && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    Stage: {selectedInvoice.paymentStage}
                  </span>
                )}
                {selectedInvoice.amcContractNumber && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToSupport?.(`AMC:${selectedInvoice.amcContractId || ''}`)
                    }
                    className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                    title="Open Linked AMC Contract in Support & AMC Desk"
                  >
                    <span>AMC: {selectedInvoice.amcContractNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedInvoice.changeRequestNumber && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToSupport?.(`CR:${selectedInvoice.changeRequestId || ''}`)
                    }
                    className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                    title="Open Linked Change Request in Support & AMC Desk"
                  >
                    <span>CR: {selectedInvoice.changeRequestNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedInvoice.ticketNumber && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToSupport?.(`TICKET:${selectedInvoice.ticketId || ''}`)
                    }
                    className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                    title="Open Linked Support Ticket in Support & AMC Desk"
                  >
                    <span>Ticket: {selectedInvoice.ticketNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedInvoice.isShared ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Shared {selectedInvoice.sharedAt ? `(${selectedInvoice.sharedAt})` : ''}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                    Not Shared Yet
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* mark_shared operation */}
                {!selectedInvoice.isShared && selectedInvoice.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleMarkShared(selectedInvoice)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition"
                    title="Mark Invoice as Shared with Client"
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mark Shared</span>
                  </button>
                )}

                {/* Convert Proforma -> Tax Invoice */}
                {selectedInvoice.invoiceType === 'Proforma' &&
                  selectedInvoice.status !== 'Converted' &&
                  selectedInvoice.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleConvertProforma(selectedInvoice)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Convert to Tax Invoice</span>
                    </button>
                  )}

                {/* Record Payment */}
                {selectedInvoice.status !== 'Cancelled' &&
                  selectedInvoice.status !== 'Converted' &&
                  selectedInvoice.balanceAmount > 0 && (
                    <button
                      onClick={() => onOpenRecordPaymentForInvoice(selectedInvoice)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}

                {/* Edit Invoice (allowed before and after payment record entry) */}
                <button
                  onClick={() => handleOpenEditInvoice(selectedInvoice)}
                  className="px-2.5 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title={
                    selectedInvoice.invoiceType === 'Proforma'
                      ? 'Edit Proforma Invoice (even after payment entry)'
                      : 'Edit Tax Invoice (even after payment entry)'
                  }
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() =>
                    onOpenTrace(
                      undefined,
                      selectedInvoice.customerId,
                      selectedInvoice.salesOrderId,
                      selectedInvoice.id
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Trace</span>
                </button>

                <button
                  onClick={() => handleOpenPrintModal(selectedInvoice)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print & PDF Options</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title="Download Portrait PDF directly"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>

                {/* cancel_invoice operation */}
                {selectedInvoice.status !== 'Cancelled' && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 font-semibold rounded-lg flex items-center gap-1 transition"
                    title="Cancel Invoice"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}

                {/* delete_proforma / delete_tax_invoice operation */}
                <button
                  onClick={() => handleDeleteInvoice(selectedInvoice)}
                  className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title={
                    selectedInvoice.invoiceType === 'Proforma'
                      ? 'Delete Proforma Invoice'
                      : 'Delete Tax Invoice'
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Invoice Document Template */}
            <InvoiceDocumentTemplate
              invoice={selectedInvoice}
              supplierCompany={supplierCompany}
              copyType="Original for Recipient"
              includeBankDetails={true}
              includeSignatory={true}
              includeNotes={true}
              includeGstTable={true}
              templateTheme={templateTheme}
              onNavigateToCustomer={onNavigateToCustomer}
            />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-slate-800 text-xs">

              {/* Linked Payment Receipts Breakdown */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Linked Payment Receipts ({invoicePayments.length})</span>
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditInvoice(selectedInvoice)}
                      className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit {selectedInvoice.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice</span>
                    </button>
                    {selectedInvoice.balanceAmount > 0 &&
                      selectedInvoice.status !== 'Cancelled' && (
                        <button
                          onClick={() => onOpenRecordPaymentForInvoice(selectedInvoice)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          + Add Payment Receipt
                        </button>
                      )}
                  </div>
                </div>

                {invoicePayments.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-[11px] text-center">
                    No payments recorded against this invoice yet. Remaining balance:{' '}
                    <strong className="font-mono text-slate-700">
                      {formatCurrency(selectedInvoice.balanceAmount)}
                    </strong>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Receipt #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Payment Stage</th>
                          <th className="p-2.5">Mode & Reference</th>
                          <th className="p-2.5 text-right">Amount</th>
                          <th className="p-2.5 text-right">Remaining Balance</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoicePayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              {p.receiptNumber}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{p.paymentDate}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {p.paymentStage || 'Milestone'}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-medium text-slate-800">{p.paymentMode}</span>
                              <span className="text-slate-400 font-mono ml-1.5">
                                ({p.transactionReference})
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-semibold text-slate-700">
                              {formatCurrency(p.remainingBalance ?? 0)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const res = deletePayment(p.id);
                                  showFeedback(res.success ? 'success' : 'error', res.message);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title={`Delete payment receipt ${p.receiptNumber}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* CREATE / EDIT PROFORMA OR TAX INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block">
                  {editingInvoice ? 'EDIT & RECONCILE INVOICE' : 'FINANCE & BILLING WORKFLOW'}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {editingInvoice
                    ? `Edit ${docType === 'Proforma' ? 'Proforma Invoice (PI)' : 'GST Tax Invoice (INV)'} — ${editingInvoice.invoiceNumber}`
                    : `Create ${docType === 'Proforma' ? 'Proforma Invoice (PI)' : 'GST Tax Invoice (INV)'}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateInvoiceSubmit}
              className="p-6 space-y-4 text-xs max-h-[78vh] overflow-y-auto"
            >
              {editingInvoice && (editingInvoice.paidAmount > 0 || getInvoicePayments(editingInvoice).length > 0) && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-900">
                  <div>
                    <span className="font-bold block">
                      Payment Record(s) Linked ({getInvoicePayments(editingInvoice).length} Receipt(s))
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Amount already received:{' '}
                      <strong className="font-mono">{formatCurrency(editingInvoice.paidAmount)}</strong>.
                      Saving changes will automatically recalculate the remaining balance, invoice status, and customer ledger.
                    </span>
                  </div>
                </div>
              )}

              {editingInvoice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Invoice / Document Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-indigo-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg p-2 w-full flex justify-between items-center">
                      <span>Recorded Payments:</span>
                      <strong className="font-mono text-emerald-700">
                        {formatCurrency(editingInvoice.paidAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as InvoiceType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="Tax">GST Tax Invoice (INV)</option>
                    <option value="Proforma">Proforma Invoice (PI)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Source *</label>
                  <select
                    value={formSourceType}
                    onChange={(e) => {
                      setFormSourceType(e.target.value as any);
                      setFormOrderId('');
                      setFormMilestoneId('');
                      setFormAmcId('');
                      setFormChangeRequestId('');
                      setFormTicketId('');
                      setFormLicenseTypeId('');
                    }}
                    className="w-full bg-indigo-50/60 border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-900"
                  >
                    <option value="Sales Order">Sales Order / Milestone</option>
                    <option value="AMC Renewal">AMC Contract Renewal</option>
                    <option value="Change Request">Change Request (CR)</option>
                    <option value="Ticket">Billable Support Ticket</option>
                    <option value="License">D365 License Subscription</option>
                    <option value="Manual">Direct / Manual Billing</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer *</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => {
                      setFormCustomerId(e.target.value);
                      setFormOrderId('');
                      setFormMilestoneId('');
                      setFormAmcId('');
                      setFormChangeRequestId('');
                      setFormTicketId('');
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
                    Payment Stage *
                  </label>
                  <select
                    value={formPaymentStage}
                    onChange={(e) => setFormPaymentStage(e.target.value as PaymentStage)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {PAYMENT_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formSourceType === 'Sales Order' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Link Sales Order (Optional)
                    </label>
                    <select
                      value={formOrderId}
                      onChange={(e) => {
                        setFormOrderId(e.target.value);
                        setFormMilestoneId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="">Direct Billing (No Sales Order)</option>
                      {customerOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} — {formatCurrency(o.grandTotal)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      CRM Milestone
                    </label>
                    <select
                      value={formMilestoneId}
                      onChange={(e) => handleMilestonePick(e.target.value)}
                      disabled={!formOrderId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs disabled:opacity-50"
                    >
                      <option value="">Select Order Milestone...</option>
                      {orderMilestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.milestoneCode} ({m.percentage}%) - {m.description} [{formatCurrency(m.amount)}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formSourceType === 'AMC Renewal' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="font-bold text-emerald-900 block mb-1">
                      Select AMC Contract *
                    </label>
                    <select
                      value={formAmcId}
                      onChange={(e) => handleAmcPick(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs font-semibold"
                    >
                      <option value="">Choose AMC Contract...</option>
                      {customerAmcContracts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.contractNumber} ({a.contractType}) — {formatCurrency(a.annualValue)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-emerald-900 block mb-1">
                      Service Period Start
                    </label>
                    <input
                      type="date"
                      value={formServicePeriodStart}
                      onChange={(e) => setFormServicePeriodStart(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-emerald-900 block mb-1">
                      Service Period End
                    </label>
                    <input
                      type="date"
                      value={formServicePeriodEnd}
                      onChange={(e) => setFormServicePeriodEnd(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {formSourceType === 'Change Request' && (
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl">
                  <label className="font-bold text-purple-900 block mb-1">
                    Select Change Request (CR) *
                  </label>
                  <select
                    value={formChangeRequestId}
                    onChange={(e) => handleChangeRequestPick(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="">Choose Change Request...</option>
                    {customerChangeRequests.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.crNumber} — {cr.title} ({cr.estimatedHours} hrs / {formatCurrency(cr.totalAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formSourceType === 'Ticket' && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <label className="font-bold text-amber-900 block mb-1">
                    Select Support Ticket *
                  </label>
                  <select
                    value={formTicketId}
                    onChange={(e) => handleSupportTicketPick(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="">Choose Support Ticket...</option>
                    {customerSupportTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ticketNumber} — {t.subject} ({t.isBillable ? formatCurrency(t.estimatedBillingAmount || 0) : 'Standard'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formSourceType === 'License' && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                  <label className="font-bold text-blue-900 block mb-1">
                    Select D365 License Subscription Tier *
                  </label>
                  <select
                    value={formLicenseTypeId}
                    onChange={(e) => handleLicensePick(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="">Choose License SKU...</option>
                    {licenseTypes.map((lic) => (
                      <option key={lic.id} value={lic.id}>
                        {lic.code} — {lic.name} (₹{lic.monthlyCost}/user/mo | HSN {lic.hsnSac})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={formInvoiceDate}
                    onChange={(e) => setFormInvoiceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer PO #</label>
                  <input
                    type="text"
                    placeholder="e.g. PO/2026/104"
                    value={formPoNumber}
                    onChange={(e) => setFormPoNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PO Date</label>
                  <input
                    type="date"
                    value={formPoDate}
                    onChange={(e) => setFormPoDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Invoice Line Items
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormItems((prev) => [
                        ...prev,
                        {
                          productId: products[0]?.id || '',
                          productName: products[0]?.name || 'Service Item',
                          description: products[0]?.description || '',
                          hsnSac: products[0]?.hsnSac || '998313',
                          uom: 'Lot',
                          quantity: 1,
                          unitRate: products[0]?.sellingPrice || 50000,
                          gstRate: 18,
                        },
                      ])
                    }
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    + Add Line Item
                  </button>
                </div>

                {formItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                  >
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Description / Item
                      </label>
                      <input
                        type="text"
                        required
                        value={it.productName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, productName: val } : row))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        HSN/SAC
                      </label>
                      <input
                        type="text"
                        value={it.hsnSac}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, hsnSac: val } : row))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, quantity: val } : row))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        Taxable Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={it.unitRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, unitRate: val } : row))
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between gap-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          GST %
                        </label>
                        <select
                          value={it.gstRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormItems((prev) =>
                              prev.map((row, i) => (i === idx ? { ...row, gstRate: val } : row))
                            );
                          }}
                          className="bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={5}>5%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Remittance instructions or milestone deliverables notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingInvoice
                    ? `Save Changes to ${docType === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'}`
                    : `Issue ${docType === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL INVOICE MODAL */}
      {isCancelModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">
                Cancel {selectedInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCancelInvoiceConfirm} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Cancelling this invoice will reverse its unpaid balance from the customer ledger and
                unlink the CRM milestone so it can be re-billed.
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for invoice cancellation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== INVOICE PRINT & PDF OPTIONS MODAL ===================== */}
      {isPrintModalOpen && invoiceToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
            {/* Modal Top Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>
                      {invoiceToPrint.invoiceType === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'} Print & PDF Hub
                    </span>
                    <span className="font-mono text-indigo-300 text-sm font-semibold">
                      {invoiceToPrint.invoiceNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Client: <strong>{invoiceToPrint.customerName}</strong> • Grand Total:{' '}
                    <strong className="font-mono text-emerald-300">{formatCurrency(invoiceToPrint.grandTotal)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(invoiceToPrint || selectedInvoice)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Download Portrait PDF directly to your device"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isGeneratingPdf ? 'Generating PDF…' : 'Download PDF (Portrait)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecutePrint}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Print invoice or select 'Save as PDF' in the destination dropdown"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInvoiceDocument}
                  disabled={isDownloading}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Download standalone HTML archive file"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">HTML Archive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Options Toolbar */}
            <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-3.5">
                {/* Template Theme Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Theme:</span>
                  <select
                    value={templateTheme}
                    onChange={(e) => setTemplateTheme(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="modern">Modern Indigo</option>
                    <option value="corporate">Corporate Slate</option>
                    <option value="minimal">Clean Minimal</option>
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                {/* Copy Type Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Copy:</span>
                  </span>
                  <select
                    value={printCopyType}
                    onChange={(e) => setPrintCopyType(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Original for Recipient">Original for Recipient</option>
                    <option value="Duplicate for Supplier">Duplicate for Supplier</option>
                    <option value="Triplicate for Transporter">Triplicate for Transporter</option>
                    <option value="Customer Copy">Customer Copy</option>
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeGstTable}
                    onChange={(e) => setIncludeGstTable(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>GST Analysis</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeBankDetails}
                    onChange={(e) => setIncludeBankDetails(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Bank Remittance</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeSignatory}
                    onChange={(e) => setIncludeSignatory(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Signatory & Seal</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Terms & Notes</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[11px] flex items-center gap-1">
                  <span>📄 Format: A4 Portrait</span>
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable Live A4 Invoice Sheet Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70">
              <div
                ref={printableSheetRef}
                id="printable-invoice-sheet"
                className="max-w-4xl mx-auto"
              >
                <InvoiceDocumentTemplate
                  invoice={invoiceToPrint}
                  supplierCompany={supplierCompany}
                  copyType={printCopyType}
                  includeBankDetails={includeBankDetails}
                  includeSignatory={includeSignatory}
                  includeNotes={includeNotes}
                  includeGstTable={includeGstTable}
                  templateTheme={templateTheme}
                  isPrintMode={false}
                />
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <span className="text-[11px] text-slate-500">
                Tip: <strong>"Download PDF"</strong> generates a crisp vector/canvas portrait PDF. You can also click <strong>"Print Invoice"</strong> for direct printer output.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadInvoiceDocument}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Download standalone HTML file"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>HTML Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(invoiceToPrint || selectedInvoice, true)}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Download pure vector PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vector PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(invoiceToPrint || selectedInvoice, false)}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF (High-Res)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden high-res capture container for table-row PDF downloads */}
      <div
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '820px',
          overflow: 'hidden',
          background: '#ffffff',
          pointerEvents: 'none',
        }}
      >
        <div ref={hiddenCaptureRef} style={{ width: '800px', background: '#ffffff', padding: 0 }}>
          {pdfTargetInvoice && (
            <InvoiceDocumentTemplate
              invoice={pdfTargetInvoice}
              supplierCompany={supplierCompany}
              copyType={printCopyType}
              includeBankDetails={includeBankDetails}
              includeSignatory={includeSignatory}
              includeNotes={includeNotes}
              includeGstTable={includeGstTable}
              isPrintMode={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
