import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  AmcContract,
  AmcContractType,
  AmcBillingCycle,
  AmcContractStatus,
  SupportTicket,
  SupportTicketCategory,
  SupportDepartment,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportChangeRequest,
  ChangeRequestStatus,
} from '../../types';
import {
  Headphones,
  ShieldCheck,
  GitPullRequest,
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
  ArrowUpRight,
  MessageSquare,
  Send,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  X,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  Check,
  Sliders,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

interface SupportAmcViewProps {
  initialItemId?: string;
  onNavigateToCustomer?: (customerId: string) => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
  onNavigateToPurchaseOrder?: (poId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
}

const TICKET_CATEGORIES: SupportTicketCategory[] = [
  'Bug / Defect',
  'Change Request (CR)',
  'New Report',
  'Customization',
  'Support Query',
  'Training',
  'Data Upload / Migration',
  'License / Access',
];

const SUPPORT_DEPARTMENTS: SupportDepartment[] = [
  'Technical Support',
  'Functional ERP',
  'Development / CR',
  'Finance & Billing',
  'QA & UAT',
];

const TICKET_STATUSES: SupportTicketStatus[] = [
  'Open',
  'Assigned',
  'In Progress',
  'Waiting on Customer',
  'Under UAT',
  'Resolved',
  'Closed',
  'Reopened',
];

const CR_STATUSES: ChangeRequestStatus[] = [
  'Draft',
  'Submitted for Approval',
  'Customer Approved',
  'In Development',
  'UAT Sign-off',
  'Completed',
  'Invoiced',
  'Rejected',
];

export const SupportAmcView: React.FC<SupportAmcViewProps> = ({
  initialItemId,
  onNavigateToCustomer,
  onNavigateToInvoice,
  onNavigateToPurchaseOrder,
  onNavigateToReport,
}) => {
  const {
    amcContracts,
    addAmcContract,
    updateAmcContract,
    deleteAmcContract,
    renewAmcContract,
    generateInvoiceFromAmcContract,
    supportTickets,
    addSupportTicket,
    updateSupportTicketStatus,
    deleteSupportTicket,
    addSupportTicketComment,
    logSupportTicketHours,
    importSupportTicketsBatch,
    createChangeRequestFromTicket,
    generateInvoiceFromTicket,
    changeRequests,
    addChangeRequest,
    updateChangeRequestStatus,
    deleteChangeRequest,
    generateInvoiceFromChangeRequest,
    licenseTypes,
    addLicenseType,
    generateLicenseInvoice,
    addPurchaseOrder,
    purchaseOrders,
    customers,
    contacts,
    users,
    invoices,
    supplierCompany,
    currentUser,
    formatCurrency,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'tickets' | 'amc' | 'cr' | 'licenses'>('tickets');
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'info' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => setBannerMessage(null), 4500);
  };

  // Deep link handling
  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [selectedContractId, setSelectedContractId] = useState<string>(amcContracts[0]?.id || '');
  const [selectedCrId, setSelectedCrId] = useState<string>(changeRequests[0]?.id || '');

  useEffect(() => {
    if (!initialItemId) return;
    if (initialItemId.startsWith('tkt-')) {
      setActiveTab('tickets');
      setSelectedTicketId(initialItemId);
    } else if (initialItemId.startsWith('amc-')) {
      setActiveTab('amc');
      setSelectedContractId(initialItemId);
    } else if (initialItemId.startsWith('cr-')) {
      setActiveTab('cr');
      setSelectedCrId(initialItemId);
    } else if (initialItemId === 'TAB:AMC') {
      setActiveTab('amc');
    } else if (initialItemId === 'TAB:CR') {
      setActiveTab('cr');
    } else if (initialItemId === 'TAB:LICENSES') {
      setActiveTab('licenses');
    }
  }, [initialItemId]);

  // ============================================================================
  // 1. SUPPORT TICKETS STATE & HANDLERS
  // ============================================================================
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [ticketDeptFilter, setTicketDeptFilter] = useState<string>('ALL');
  const [ticketCustomerFilter, setTicketCustomerFilter] = useState<string>('ALL');

  const filteredTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      const q = ticketSearch.toLowerCase();
      const matchesSearch =
        !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.moduleName.toLowerCase().includes(q) ||
        (t.contractNumber && t.contractNumber.toLowerCase().includes(q)) ||
        (t.changeRequestNumber && t.changeRequestNumber.toLowerCase().includes(q));
      const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
      const matchesDept = ticketDeptFilter === 'ALL' || t.department === ticketDeptFilter;
      const matchesCust = ticketCustomerFilter === 'ALL' || t.customerId === ticketCustomerFilter;
      return matchesSearch && matchesStatus && matchesDept && matchesCust;
    });
  }, [supportTickets, ticketSearch, ticketStatusFilter, ticketDeptFilter, ticketCustomerFilter]);

  const selectedTicket = useMemo(
    () => supportTickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || supportTickets[0],
    [supportTickets, selectedTicketId, filteredTickets]
  );

  // Log hours state
  const [hoursInput, setHoursInput] = useState<string>('2');
  const [hoursNote, setHoursNote] = useState<string>('');

  // Comment state
  const [commentText, setCommentText] = useState<string>('');
  const [commentIsInternal, setCommentIsInternal] = useState<boolean>(false);

  // Create Ticket Modal state
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [tktCustomerId, setTktCustomerId] = useState(customers[0]?.id || '');
  const [tktContractId, setTktContractId] = useState('');
  const [tktContactName, setTktContactName] = useState('');
  const [tktContactEmail, setTktContactEmail] = useState('');
  const [tktContactPhone, setTktContactPhone] = useState('');
  const [tktSolution, setTktSolution] = useState('MS D365 Business Central');
  const [tktModuleName, setTktModuleName] = useState('Finance & GST');
  const [tktCategory, setTktCategory] = useState<SupportTicketCategory>('Support Query');
  const [tktDepartment, setTktDepartment] = useState<SupportDepartment>('Functional ERP');
  const [tktPriority, setTktPriority] = useState<SupportTicketPriority>('High');
  const [tktSubject, setTktSubject] = useState('');
  const [tktDescription, setTktDescription] = useState('');
  const [tktAssignedToId, setTktAssignedToId] = useState(users[1]?.id || users[0]?.id || '');
  const [tktIsBillable, setTktIsBillable] = useState(false);
  const [tktEstimatedAmount, setTktEstimatedAmount] = useState<number>(0);

  useEffect(() => {
    const cust = customers.find((c) => c.id === tktCustomerId);
    const contract = amcContracts.find((a) => a.customerId === tktCustomerId);
    const primaryContact =
      contacts.find((cnt) => cnt.customerId === tktCustomerId && cnt.isPrimary) ||
      contacts.find((cnt) => cnt.customerId === tktCustomerId);

    if (cust) {
      setTktContactName(primaryContact?.name || cust.name);
      setTktContactEmail(primaryContact?.email || cust.email || '');
      setTktContactPhone(primaryContact?.mobile || cust.phone || '');
      setTktSolution(contract?.solution || cust.solution || 'MS D365 Business Central');
    }
    setTktContractId(contract?.id || '');
  }, [tktCustomerId, customers, amcContracts, contacts]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim()) return;
    const cust = customers.find((c) => c.id === tktCustomerId) || customers[0];
    const contract = amcContracts.find((a) => a.id === tktContractId);
    const assignee = users.find((u) => u.id === tktAssignedToId) || currentUser;
    const todayStr = new Date().toISOString().split('T')[0];

    const created = addSupportTicket({
      ticketDate: todayStr,
      customerId: cust.id,
      customerCode: cust.customerCode,
      customerName: cust.name,
      contactName: tktContactName,
      contactEmail: tktContactEmail,
      contactPhone: tktContactPhone,
      contractId: contract?.id,
      contractNumber: contract?.contractNumber,
      solution: tktSolution,
      moduleName: tktModuleName,
      category: tktCategory,
      department: tktDepartment,
      subject: tktSubject.trim(),
      description: tktDescription.trim() || tktSubject.trim(),
      priority: tktPriority,
      status: 'Open',
      assignedToId: assignee.id,
      assignedToName: assignee.name,
      slaStatus: 'Within SLA',
      responseDueAt: `${todayStr} 16:00`,
      resolutionDueAt: `${todayStr} 20:00`,
      hoursLogged: 0,
      isBillable: tktIsBillable || tktCategory === 'Change Request (CR)' || tktCategory === 'New Report',
      estimatedBillingAmount: tktEstimatedAmount > 0 ? tktEstimatedAmount : undefined,
      portalSource: 'Internal Desk',
    });

    setSelectedTicketId(created.id);
    setIsCreateTicketOpen(false);
    setTktSubject('');
    setTktDescription('');
    setTktEstimatedAmount(0);
    showBanner(`Support Ticket ${created.ticketNumber} created and routed to ${created.department}.`);
  };

  // Escalate Ticket to Change Request (CR) Modal
  const [isEscalateCrOpen, setIsEscalateCrOpen] = useState(false);
  const [crFromTktTitle, setCrFromTktTitle] = useState('');
  const [crFromTktModule, setCrFromTktModule] = useState('');
  const [crFromTktScope, setCrFromTktScope] = useState('');
  const [crFromTktHours, setCrFromTktHours] = useState<number>(16);
  const [crFromTktRate, setCrFromTktRate] = useState<number>(1500);

  const openEscalateCrModal = (ticket: SupportTicket) => {
    const contract = amcContracts.find((a) => a.id === ticket.contractId);
    setCrFromTktTitle(ticket.subject);
    setCrFromTktModule(ticket.moduleName);
    setCrFromTktScope(ticket.description);
    setCrFromTktHours(ticket.hoursLogged > 0 ? ticket.hoursLogged : 16);
    setCrFromTktRate(contract?.hourlyOverageRate || 1500);
    setIsEscalateCrOpen(true);
  };

  const handleConfirmEscalateToCr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const createdCr = createChangeRequestFromTicket({
      ticketId: selectedTicket.id,
      title: crFromTktTitle,
      moduleName: crFromTktModule,
      scopeDescription: crFromTktScope,
      estimatedHours: crFromTktHours,
      hourlyRate: crFromTktRate,
      requestedBy: selectedTicket.contactName,
      assignedDeveloperName: selectedTicket.assignedToName,
    });
    setIsEscalateCrOpen(false);
    if (createdCr) {
      showBanner(
        `Change Request ${createdCr.crNumber} (${formatCurrency(createdCr.totalAmount)} incl. GST) created and linked to ${selectedTicket.ticketNumber}!`
      );
    }
  };

  // Export Tickets CSV
  const handleExportTicketsCsv = () => {
    const headers = [
      'Ticket No',
      'Date',
      'Customer Code',
      'Customer Name',
      'AMC Contract',
      'Solution',
      'Module',
      'Category',
      'Department',
      'Subject',
      'Priority',
      'Status',
      'SLA',
      'Hours Logged',
      'Billable',
      'CR No',
      'Invoice No',
    ];
    const rows = filteredTickets.map((t) => [
      t.ticketNumber,
      t.ticketDate,
      t.customerCode,
      `"${t.customerName.replace(/"/g, '""')}"`,
      t.contractNumber || '',
      `"${t.solution}"`,
      `"${t.moduleName}"`,
      t.category,
      t.department,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.slaStatus,
      t.hoursLogged,
      t.isBillable ? 'Yes' : 'No',
      t.changeRequestNumber || '',
      t.linkedInvoiceNumber || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Support_Tickets_Register_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import handler
  const handleImportCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;
      const parsedRows: Array<Partial<SupportTicket>> = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        return {
          ticketDate: cols[1] || new Date().toISOString().split('T')[0],
          customerCode: cols[2] || 'TAJ01',
          customerName: cols[3] || 'Taj computer Solutions Pvt Ltd',
          solution: cols[5] || 'MS D365 Business Central',
          moduleName: cols[6] || 'General',
          category: (cols[7] as SupportTicketCategory) || 'Support Query',
          department: (cols[8] as SupportDepartment) || 'Functional ERP',
          subject: cols[9] || 'Imported Support Issue',
          priority: (cols[10] as SupportTicketPriority) || 'Medium',
          status: (cols[11] as SupportTicketStatus) || 'Open',
          hoursLogged: parseFloat(cols[13] || '0') || 0,
          isBillable: (cols[14] || '').toLowerCase() === 'yes',
        };
      });
      const count = importSupportTicketsBatch(parsedRows);
      showBanner(`Successfully imported ${count} support ticket(s) from Excel/CSV.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ============================================================================
  // 2. AMC CONTRACTS STATE & HANDLERS
  // ============================================================================
  const [isCreateAmcOpen, setIsCreateAmcOpen] = useState(false);
  const [amcCustomerId, setAmcCustomerId] = useState(customers[0]?.id || '');
  const [amcContractNo, setAmcContractNo] = useState('');
  const [amcSolution, setAmcSolution] = useState('MS D365 Business Central');
  const [amcProjectPhase, setAmcProjectPhase] = useState('Live Support');
  const [amcType, setAmcType] = useState<AmcContractType>('AMC');
  const [amcCycle, setAmcCycle] = useState<AmcBillingCycle>('Annual');
  const [amcStartDate, setAmcStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [amcEndDate, setAmcEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [amcIncludedHours, setAmcIncludedHours] = useState<number>(400);
  const [amcOverageRate, setAmcOverageRate] = useState<number>(1500);
  const [amcAnnualValue, setAmcAnnualValue] = useState<number>(300000);
  const [amcSlaTier, setAmcSlaTier] = useState<AmcContract['slaTier']>('Platinum (2h / 8h)');
  const [amcNotes, setAmcNotes] = useState('');

  const handleCreateAmc = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === amcCustomerId) || customers[0];
    const codePrefix = cust.customerCode.split('-')[0] || 'CUS';
    const contractNumber = amcContractNo.trim() || `${codePrefix}-AMC-2026-27`;
    const gstRate = 18;
    const totalValue = Math.round(amcAnnualValue * (1 + gstRate / 100));

    const created = addAmcContract({
      contractNumber,
      customerId: cust.id,
      customerCode: cust.customerCode,
      customerName: cust.name,
      customerGstin: cust.gstin,
      solution: amcSolution,
      projectPhase: amcProjectPhase,
      contractType: amcType,
      billingCycle: amcCycle,
      startDate: amcStartDate,
      endDate: amcEndDate,
      includedHours: amcIncludedHours,
      consumedHours: 0,
      hourlyOverageRate: amcOverageRate,
      annualValue: amcAnnualValue,
      gstRate,
      totalValue,
      slaTier: amcSlaTier,
      accountManagerId: cust.salesOwnerId || currentUser.id,
      accountManagerName: cust.salesOwnerName || currentUser.name,
      status: 'Active',
      notes: amcNotes,
    });

    setSelectedContractId(created.id);
    setIsCreateAmcOpen(false);
    setAmcContractNo('');
    setAmcNotes('');
    showBanner(`AMC Contract ${created.contractNumber} registered for ${created.customerName}.`);
  };

  // ============================================================================
  // 3. STANDALONE CHANGE REQUEST MODAL STATE
  // ============================================================================
  const [isCreateCrOpen, setIsCreateCrOpen] = useState(false);
  const [crCustomerId, setCrCustomerId] = useState(customers[0]?.id || '');
  const [crTicketId, setCrTicketId] = useState('');
  const [crTitle, setCrTitle] = useState('');
  const [crModule, setCrModule] = useState('Reports');
  const [crScope, setCrScope] = useState('');
  const [crHours, setCrHours] = useState<number>(20);
  const [crRate, setCrRate] = useState<number>(1500);
  const [crRequestedBy, setCrRequestedBy] = useState('');
  const [crDeveloper, setCrDeveloper] = useState('Rohan Verma');

  const handleCreateStandaloneCr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crTitle.trim()) return;
    const cust = customers.find((c) => c.id === crCustomerId) || customers[0];
    const contract = amcContracts.find((a) => a.customerId === cust.id);
    const linkedTkt = supportTickets.find((t) => t.id === crTicketId);

    const stateCode = cust.addresses?.[0]?.stateCode || '07';
    const isInterState = stateCode !== (supplierCompany.stateCode || '07');
    const taxableAmount = crHours * crRate;
    const gstRate = 18;
    const totalTax = Math.round((taxableAmount * gstRate) / 100);
    const cgstAmount = isInterState ? 0 : totalTax / 2;
    const sgstAmount = isInterState ? 0 : totalTax / 2;
    const igstAmount = isInterState ? totalTax : 0;
    const totalAmount = taxableAmount + totalTax;

    const created = addChangeRequest({
      ticketId: linkedTkt?.id,
      ticketNumber: linkedTkt?.ticketNumber,
      customerId: cust.id,
      customerCode: cust.customerCode,
      customerName: cust.name,
      customerGstin: cust.gstin,
      contractId: contract?.id,
      contractNumber: contract?.contractNumber,
      title: crTitle.trim(),
      moduleName: crModule,
      scopeDescription: crScope.trim() || crTitle.trim(),
      estimatedHours: crHours,
      hourlyRate: crRate,
      taxableAmount,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      status: 'Customer Approved',
      approvedByCustomerAt: new Date().toISOString().split('T')[0],
      requestedBy: crRequestedBy || cust.name,
      assignedDeveloperName: crDeveloper,
    });

    setSelectedCrId(created.id);
    setIsCreateCrOpen(false);
    setCrTitle('');
    setCrScope('');
    showBanner(`Change Request ${created.crNumber} (${formatCurrency(created.totalAmount)}) created.`);
  };

  // ============================================================================
  // 4. LICENSE PROVISIONING & BILLING STATE
  // ============================================================================
  const [isProvisionLicenseOpen, setIsProvisionLicenseOpen] = useState(false);
  const [licCustomerId, setLicCustomerId] = useState(customers[0]?.id || '');
  const [licInvoiceType, setLicInvoiceType] = useState<'Tax' | 'Proforma'>('Tax');
  const [licBillingCycle, setLicBillingCycle] = useState<'Yearly' | 'Monthly'>('Yearly');
  const [licRows, setLicRows] = useState<Array<{ licenseId: string; quantity: number }>>([
    { licenseId: licenseTypes[0]?.id || 'lic-1', quantity: 4 },
    { licenseId: licenseTypes[2]?.id || 'lic-3', quantity: 5 },
  ]);

  const handleGenerateLicenseBill = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = generateLicenseInvoice({
      customerId: licCustomerId,
      invoiceType: licInvoiceType,
      billingCycle: licBillingCycle,
      items: licRows,
    });
    setIsProvisionLicenseOpen(false);
    if (inv) {
      showBanner(
        `${inv.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated for ${inv.customerName} and merged into Invoices & GST!`
      );
    }
  };

  // KPI Metrics across Support & AMC
  const openTicketsCount = supportTickets.filter(
    (t) => t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;
  const withinSlaCount = supportTickets.filter((t) => t.slaStatus === 'Within SLA').length;
  const slaCompliancePercent =
    supportTickets.length > 0 ? Math.round((withinSlaCount / supportTickets.length) * 100) : 100;
  const activeAmcValue = amcContracts
    .filter((c) => c.status === 'Active' || c.status === 'Pending Renewal')
    .reduce((sum, c) => sum + c.totalValue, 0);
  const totalCrValue = changeRequests.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-800">{supplierCompany.name}</span>
            <span aria-hidden="true">·</span>
            <span>Enterprise Support & AMS</span>
            <span aria-hidden="true">·</span>
            <span>Integrated Financial Billing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Support Desk, AMC Contracts & Change Requests
          </h1>
        </div>

        {/* Sub-module Segmented Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'tickets'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span>Support Tickets ({supportTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('amc')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'amc'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>AMC Contracts ({amcContracts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cr')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'cr'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
            <span>Change Requests ({changeRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'licenses'
                ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>License Subscriptions ({licenseTypes.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Card KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Active Support Queue</span>
            <Headphones className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {openTicketsCount} Open · {supportTickets.length} Total
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            SLA Compliance: <strong className="text-emerald-700">{slaCompliancePercent}% Within SLA</strong>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Active AMC Portfolio (Incl. GST)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatCurrency(activeAmcValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {amcContracts.reduce((s, c) => s + c.consumedHours, 0)} /{' '}
            {amcContracts.reduce((s, c) => s + c.includedHours, 0)} support hours consumed
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Change Requests (CR) Pipeline</span>
            <GitPullRequest className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-violet-700">
            {formatCurrency(totalCrValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {changeRequests.filter((c) => c.status === 'Invoiced').length} Invoiced ·{' '}
            {changeRequests.filter((c) => c.status !== 'Invoiced').length} Active CRs
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Support & License Invoices</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrency(
              invoices
                .filter(
                  (i) =>
                    i.sourceType === 'AMC Renewal' ||
                    i.sourceType === 'Change Request' ||
                    i.sourceType === 'Ticket' ||
                    i.sourceType === 'License'
                )
                .reduce((s, i) => s + i.grandTotal, 0)
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Merged directly with Finance & Customer Ledger
          </p>
        </div>
      </div>

      {/* ============================================================================
          TAB 1: SUPPORT TICKETS DESK
         ============================================================================ */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search TKT-#, customer, subject, module, CR-#..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={ticketCustomerFilter}
                onChange={(e) => setTicketCustomerFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerCode})
                  </option>
                ))}
              </select>

              <select
                value={ticketDeptFilter}
                onChange={(e) => setTicketDeptFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Departments</option>
                {SUPPORT_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                {TICKET_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel/CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCsvFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportTicketsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateTicketOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Support Ticket</span>
              </button>
            </div>
          </div>

          {/* Master-Detail Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left List: Tickets */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredTickets.map((tkt) => {
                const isSelected = selectedTicket?.id === tkt.id;
                return (
                  <button
                    key={tkt.id}
                    type="button"
                    onClick={() => setSelectedTicketId(tkt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer block ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {tkt.ticketNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">· {tkt.category}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          tkt.status === 'Resolved' || tkt.status === 'Closed'
                            ? 'text-emerald-700'
                            : tkt.status === 'In Progress' || tkt.status === 'Under UAT'
                            ? 'text-indigo-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {tkt.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {tkt.subject}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                      <span className="truncate">{tkt.customerName}</span>
                      <span className="font-mono text-slate-500 shrink-0">{tkt.hoursLogged} hrs</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>
                        {tkt.department} · Priority: <strong className="text-slate-700">{tkt.priority}</strong>
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        {tkt.changeRequestNumber && (
                          <span className="text-violet-700 font-semibold">
                            {tkt.changeRequestNumber}
                          </span>
                        )}
                        {tkt.linkedInvoiceNumber && (
                          <span className="text-emerald-700 font-semibold">
                            {tkt.linkedInvoiceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Detail Deck */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {selectedTicket.ticketNumber}
                        </span>
                        <span>·</span>
                        <span>{selectedTicket.ticketDate}</span>
                        <span>·</span>
                        <span>{selectedTicket.portalSource}</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            selectedTicket.slaStatus === 'Within SLA'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {selectedTicket.slaStatus}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {selectedTicket.subject}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => {
                          const nextSt = e.target.value as SupportTicketStatus;
                          updateSupportTicketStatus(selectedTicket.id, nextSt);
                          showBanner(`Ticket ${selectedTicket.ticketNumber} status updated to ${nextSt}.`);
                        }}
                        className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 cursor-pointer"
                      >
                        {TICKET_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            Status: {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          deleteSupportTicket(selectedTicket.id);
                          showBanner(`Ticket ${selectedTicket.ticketNumber} deleted.`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer & Linked AMC Contract Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Customer & Contact
                      </div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{selectedTicket.customerName}</span>
                        {onNavigateToCustomer && (
                          <button
                            type="button"
                            onClick={() => onNavigateToCustomer(selectedTicket.customerId)}
                            className="text-indigo-600 hover:underline inline-flex items-center cursor-pointer"
                            title="Open Customer 360"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {selectedTicket.contactName} · {selectedTicket.contactPhone || selectedTicket.contactEmail}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        AMC Contract & Solution
                      </div>
                      <div className="font-semibold text-slate-900">
                        {selectedTicket.contractNumber || 'Standard Support'} · {selectedTicket.solution}
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        Module: <strong>{selectedTicket.moduleName}</strong> · Dept:{' '}
                        <strong>{selectedTicket.department}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Description & Resolution */}
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-slate-700">Issue / Requirement Description</div>
                    <p className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 text-slate-700 leading-relaxed">
                      {selectedTicket.description}
                    </p>
                    {selectedTicket.resolutionSummary && (
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900">
                        <span className="font-bold block mb-0.5">Resolution Summary:</span>
                        {selectedTicket.resolutionSummary}
                      </div>
                    )}
                  </div>

                  {/* Effort Hours Logger & Commercial / CR / Invoice Actions */}
                  <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Effort Tracking, Change Request (CR) & Financial Billing
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Hours Logged: <strong className="font-mono text-slate-900">{selectedTicket.hoursLogged} hrs</strong>
                          {selectedTicket.isBillable && (
                            <>
                              {' '}
                              · Billable Estimate:{' '}
                              <strong className="font-mono text-indigo-700">
                                {formatCurrency(selectedTicket.estimatedBillingAmount || selectedTicket.hoursLogged * 1500)}
                              </strong>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Log hours inline */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={hoursInput}
                          onChange={(e) => setHoursInput(e.target.value)}
                          className="w-16 px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg text-center"
                        />
                        <input
                          type="text"
                          value={hoursNote}
                          onChange={(e) => setHoursNote(e.target.value)}
                          placeholder="Work log note..."
                          className="w-36 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const h = parseFloat(hoursInput) || 0;
                            if (h <= 0) return;
                            logSupportTicketHours(selectedTicket.id, h, hoursNote);
                            setHoursNote('');
                            showBanner(
                              `Logged ${h} hours on ${selectedTicket.ticketNumber} and updated AMC Contract consumed hours.`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          + Log Hrs
                        </button>
                      </div>
                    </div>

                    {/* Linked CR & Linked Invoice or Action Buttons */}
                    <div className="pt-2 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {selectedTicket.changeRequestId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('cr');
                              setSelectedCrId(selectedTicket.changeRequestId!);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-900 font-semibold text-xs cursor-pointer hover:bg-violet-200"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            <span>Linked CR: {selectedTicket.changeRequestNumber}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEscalateCrModal(selectedTicket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            <span>Create Change Request (CR)</span>
                          </button>
                        )}

                        {selectedTicket.linkedInvoiceId ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToInvoice?.(selectedTicket.linkedInvoiceId!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-xs cursor-pointer hover:bg-emerald-200"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoice: {selectedTicket.linkedInvoiceNumber}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const inv = generateInvoiceFromTicket(selectedTicket.id, 'Proforma');
                                if (inv) {
                                  showBanner(
                                    `Proforma Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated for ${selectedTicket.ticketNumber}!`
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Raise Proforma Invoice</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const inv = generateInvoiceFromTicket(selectedTicket.id, 'Tax');
                                if (inv) {
                                  showBanner(
                                    `Tax Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated and posted to Customer Ledger!`
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Generate Tax Invoice</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversation & Internal Notes Thread */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Ticket Conversation & Engineering Thread ({selectedTicket.comments.length})</span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedTicket.comments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No comments logged yet on this ticket.
                        </p>
                      ) : (
                        selectedTicket.comments.map((cmt) => (
                          <div
                            key={cmt.id}
                            className={`p-3 rounded-xl border text-xs ${
                              cmt.isInternal
                                ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span className="font-semibold text-slate-900">
                                {cmt.authorName} · {cmt.authorRole}
                                {cmt.isInternal && (
                                  <span className="ml-2 text-amber-800 font-bold">[Internal Note]</span>
                                )}
                              </span>
                              <span className="font-mono">{cmt.createdAt}</span>
                            </div>
                            <p className="leading-relaxed">{cmt.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add customer update or internal technical note..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 px-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commentIsInternal}
                          onChange={(e) => setCommentIsInternal(e.target.checked)}
                        />
                        <span>Internal Note</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!commentText.trim()) return;
                          addSupportTicketComment(selectedTicket.id, {
                            authorId: currentUser.id,
                            authorName: currentUser.name,
                            authorRole: currentUser.role,
                            message: commentText.trim(),
                            isInternal: commentIsInternal,
                            department: selectedTicket.department,
                          });
                          setCommentText('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 2: AMC & SUPPORT CONTRACTS
         ============================================================================ */}
      {activeTab === 'amc' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Annual Maintenance Contracts (AMC) & Support Retainers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateAmcOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New AMC Contract</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {amcContracts.map((amc) => {
              const utilPct =
                amc.includedHours > 0
                  ? Math.min(100, Math.round((amc.consumedHours / amc.includedHours) * 100))
                  : 0;
              return (
                <div
                  key={amc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-sm text-indigo-700">
                        {amc.contractNumber}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-900">{amc.contractType}</span>
                      <span>·</span>
                      <span className="text-slate-600">{amc.solution}</span>
                      <span>·</span>
                      <span className="text-slate-600">Phase: {amc.projectPhase}</span>
                      <span>·</span>
                      <span
                        className={`font-bold ${
                          amc.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {amc.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{amc.customerName}</h3>
                      {amc.customerGstin && (
                        <span className="text-xs font-mono text-slate-500">
                          (GSTIN: {amc.customerGstin})
                        </span>
                      )}
                      {onNavigateToCustomer && (
                        <button
                          type="button"
                          onClick={() => onNavigateToCustomer(amc.customerId)}
                          className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Customer 360</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>
                        Period: <strong className="font-mono text-slate-800">{amc.startDate}</strong> to{' '}
                        <strong className="font-mono text-slate-800">{amc.endDate}</strong>
                      </span>
                      <span>
                        SLA Tier: <strong className="text-slate-800">{amc.slaTier}</strong>
                      </span>
                      <span>
                        Account Manager: <strong className="text-slate-800">{amc.accountManagerName}</strong>
                      </span>
                      <span>
                        Overage Rate: <strong className="font-mono text-slate-800">₹{amc.hourlyOverageRate}/hr</strong>
                      </span>
                    </div>

                    {/* Support Hours Progress Bar */}
                    <div className="max-w-md pt-1">
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>
                          Support Hours Consumed:{' '}
                          <strong className="font-mono text-slate-900">
                            {amc.consumedHours} / {amc.includedHours} hrs
                          </strong>
                        </span>
                        <span className="font-mono font-semibold">{utilPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            utilPct > 85 ? 'bg-rose-500' : utilPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Commercials & Financial Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-slate-500">
                        Annual Value: {formatCurrency(amc.annualValue)} + {amc.gstRate}% GST
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {formatCurrency(amc.totalValue)}
                      </div>
                      {amc.linkedInvoiceNumber && (
                        <button
                          type="button"
                          onClick={() => amc.linkedInvoiceId && onNavigateToInvoice?.(amc.linkedInvoiceId)}
                          className="text-xs font-mono font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Linked Invoice: {amc.linkedInvoiceNumber}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const inv = generateInvoiceFromAmcContract(amc.id, 'Proforma');
                          if (inv) {
                            showBanner(
                              `AMC Proforma Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) created for ${amc.contractNumber}!`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Generate Proforma
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const inv = generateInvoiceFromAmcContract(amc.id, 'Tax');
                          if (inv) {
                            showBanner(
                              `AMC Tax Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated and posted to Customer Ledger!`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Generate AMC Tax Invoice
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const { contract, invoice } = renewAmcContract(amc.id, 'Proforma');
                          showBanner(
                            `AMC ${contract.contractNumber} renewed (${contract.startDate} to ${contract.endDate})${
                              invoice ? ` with Renewal Proforma ${invoice.invoiceNumber}` : ''
                            }!`
                          );
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renew + Proforma</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 3: CHANGE REQUESTS (CR) & CUSTOMIZATIONS
         ============================================================================ */}
      {activeTab === 'cr' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Change Requests (CR) & Custom Development Billing
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateCrOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Change Request (CR)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {changeRequests.map((cr) => (
              <div
                key={cr.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-sm text-violet-700">{cr.crNumber}</span>
                    {cr.ticketNumber && (
                      <>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (cr.ticketId) {
                              setActiveTab('tickets');
                              setSelectedTicketId(cr.ticketId);
                            }
                          }}
                          className="font-mono text-indigo-600 hover:underline cursor-pointer"
                        >
                          Ticket: {cr.ticketNumber}
                        </button>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-semibold text-slate-800">Module: {cr.moduleName}</span>
                    <span>·</span>
                    <span
                      className={`font-bold ${
                        cr.status === 'Invoiced' || cr.status === 'Completed'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {cr.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{cr.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cr.scopeDescription}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span>
                      Customer: <strong className="text-slate-900">{cr.customerName}</strong>
                    </span>
                    <span>
                      Effort:{' '}
                      <strong className="font-mono text-slate-900">
                        {cr.estimatedHours} hrs × ₹{cr.hourlyRate}/hr
                      </strong>
                    </span>
                    <span>
                      Requested By: <strong className="text-slate-800">{cr.requestedBy}</strong>
                    </span>
                    <span>
                      Developer: <strong className="text-slate-800">{cr.assignedDeveloperName}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Commercials & Invoicing Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Taxable: {formatCurrency(cr.taxableAmount)} + GST ({cr.gstRate}%)
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {formatCurrency(cr.totalAmount)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {cr.proformaInvoiceNumber && (
                        <button
                          type="button"
                          onClick={() => cr.proformaInvoiceId && onNavigateToInvoice?.(cr.proformaInvoiceId)}
                          className="text-xs font-mono text-indigo-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Proforma: {cr.proformaInvoiceNumber}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                      {cr.taxInvoiceNumber && (
                        <button
                          type="button"
                          onClick={() => cr.taxInvoiceId && onNavigateToInvoice?.(cr.taxInvoiceId)}
                          className="text-xs font-mono font-semibold text-emerald-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Tax Inv: {cr.taxInvoiceNumber}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={cr.status}
                      onChange={(e) => {
                        const nextSt = e.target.value as ChangeRequestStatus;
                        updateChangeRequestStatus(cr.id, nextSt);
                        showBanner(`CR ${cr.crNumber} status updated to ${nextSt}.`);
                      }}
                      className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                    >
                      {CR_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    {!cr.proformaInvoiceId && (
                      <button
                        type="button"
                        onClick={() => {
                          const inv = generateInvoiceFromChangeRequest(cr.id, 'Proforma');
                          if (inv) {
                            showBanner(
                              `Proforma Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated for ${cr.crNumber}!`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Raise Proforma
                      </button>
                    )}

                    {!cr.taxInvoiceId && (
                      <button
                        type="button"
                        onClick={() => {
                          const inv = generateInvoiceFromChangeRequest(cr.id, 'Tax');
                          if (inv) {
                            showBanner(
                              `Tax Invoice ${inv.invoiceNumber} (${formatCurrency(inv.grandTotal)}) generated for ${cr.crNumber} and posted to Customer Ledger!`
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        {cr.proformaInvoiceId ? 'Convert to Tax Invoice' : 'Generate Tax Invoice'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================================
          TAB 4: LICENSE SUBSCRIPTIONS & BILLING
         ============================================================================ */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Microsoft & ERP License Catalog & Subscription Billing
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProvisionLicenseOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Provision & Invoice Licenses</span>
              </button>
            </div>
          </div>

          {/* License Catalog Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">License Code</th>
                  <th className="py-3 px-4">License Name & Description</th>
                  <th className="py-3 px-4 text-center font-mono">HSN / SAC</th>
                  <th className="py-3 px-4 text-right font-mono">Monthly Cost (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Yearly Cost (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {licenseTypes.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{lic.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{lic.name}</div>
                      <div className="text-[11px] text-slate-500">{lic.description}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{lic.hsnSac}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(lic.monthlyCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(lic.yearlyCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-700 font-semibold">{lic.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 1: CREATE SUPPORT TICKET
         ============================================================================ */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log New Support Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTicketOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={tktCustomerId}
                    onChange={(e) => setTktCustomerId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linked AMC Contract</label>
                  <select
                    value={tktContractId}
                    onChange={(e) => setTktContractId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">No Linked Contract (Ad-hoc)</option>
                    {amcContracts
                      .filter((a) => a.customerId === tktCustomerId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.contractNumber} ({a.solution})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={tktCategory}
                    onChange={(e) => setTktCategory(e.target.value as SupportTicketCategory)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Routing *</label>
                  <select
                    value={tktDepartment}
                    onChange={(e) => setTktDepartment(e.target.value as SupportDepartment)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {SUPPORT_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Module Name</label>
                  <input
                    type="text"
                    value={tktModuleName}
                    onChange={(e) => setTktModuleName(e.target.value)}
                    placeholder="e.g. Finance & GST, Reports, Inventory"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority & Assignee</label>
                  <div className="flex gap-2">
                    <select
                      value={tktPriority}
                      onChange={(e) => setTktPriority(e.target.value as SupportTicketPriority)}
                      className="w-1/2 p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <select
                      value={tktAssignedToId}
                      onChange={(e) => setTktAssignedToId(e.target.value)}
                      className="w-1/2 p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ticket Subject *</label>
                <input
                  type="text"
                  required
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  placeholder="Brief summary of the issue or change request..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={tktDescription}
                  onChange={(e) => setTktDescription(e.target.value)}
                  placeholder="Steps to reproduce, business requirement, or error details..."
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tktIsBillable}
                    onChange={(e) => setTktIsBillable(e.target.checked)}
                  />
                  <span>Mark as Billable Ticket / Change Request</span>
                </label>
                {tktIsBillable && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Estimated Fee (₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={tktEstimatedAmount}
                      onChange={(e) => setTktEstimatedAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 p-1.5 rounded border border-slate-300 bg-white font-mono text-right"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateTicketOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Create Support Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 2: ESCALATE TICKET TO CHANGE REQUEST (CR)
         ============================================================================ */}
      {isEscalateCrOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Convert {selectedTicket.ticketNumber} to Change Request (CR)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateCrOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEscalateToCr} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Change Request Title *</label>
                <input
                  type="text"
                  required
                  value={crFromTktTitle}
                  onChange={(e) => setCrFromTktTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Module</label>
                <input
                  type="text"
                  value={crFromTktModule}
                  onChange={(e) => setCrFromTktModule(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Scope</label>
                <textarea
                  rows={3}
                  value={crFromTktScope}
                  onChange={(e) => setCrFromTktScope(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Hours *</label>
                  <input
                    type="number"
                    min={1}
                    value={crFromTktHours}
                    onChange={(e) => setCrFromTktHours(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    min={100}
                    value={crFromTktRate}
                    onChange={(e) => setCrFromTktRate(parseFloat(e.target.value) || 1500)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">
                  Taxable: <strong>{formatCurrency(crFromTktHours * crFromTktRate)}</strong> + 18% GST
                </span>
                <span className="text-sm font-bold font-mono text-violet-700">
                  Total: {formatCurrency(Math.round(crFromTktHours * crFromTktRate * 1.18))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEscalateCrOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                >
                  Create Change Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 3: CREATE AMC CONTRACT
         ============================================================================ */}
      {isCreateAmcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New AMC / Support Contract</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAmcOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAmc} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={amcCustomerId}
                    onChange={(e) => setAmcCustomerId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contract Number</label>
                  <input
                    type="text"
                    value={amcContractNo}
                    onChange={(e) => setAmcContractNo(e.target.value)}
                    placeholder="Auto e.g. TAJ-AMC-2026-27"
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Solution *</label>
                  <input
                    type="text"
                    value={amcSolution}
                    onChange={(e) => setAmcSolution(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Phase</label>
                  <select
                    value={amcProjectPhase}
                    onChange={(e) => setAmcProjectPhase(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Live Support">Live Support</option>
                    <option value="Implementation">Implementation</option>
                    <option value="UAT">UAT</option>
                    <option value="Discovery">Discovery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={amcStartDate}
                    onChange={(e) => setAmcStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={amcEndDate}
                    onChange={(e) => setAmcEndDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Included Support Hours</label>
                  <input
                    type="number"
                    min={10}
                    value={amcIncludedHours}
                    onChange={(e) => setAmcIncludedHours(parseInt(e.target.value, 10) || 400)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Taxable Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={amcAnnualValue}
                    onChange={(e) => setAmcAnnualValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateAmcOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save AMC Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 4: CREATE STANDALONE CHANGE REQUEST
         ============================================================================ */}
      {isCreateCrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create Change Request (CR)</h3>
              <button
                type="button"
                onClick={() => setIsCreateCrOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStandaloneCr} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer *</label>
                <select
                  value={crCustomerId}
                  onChange={(e) => setCrCustomerId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Support Ticket (Optional)</label>
                <select
                  value={crTicketId}
                  onChange={(e) => setCrTicketId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">Standalone Change Request</option>
                  {supportTickets
                    .filter((t) => t.customerId === crCustomerId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ticketNumber} - {t.subject}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CR Title *</label>
                <input
                  type="text"
                  required
                  value={crTitle}
                  onChange={(e) => setCrTitle(e.target.value)}
                  placeholder="e.g. Custom Vendor Ageing Report"
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Module</label>
                  <input
                    type="text"
                    value={crModule}
                    onChange={(e) => setCrModule(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Developer</label>
                  <input
                    type="text"
                    value={crDeveloper}
                    onChange={(e) => setCrDeveloper(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={crScope}
                  onChange={(e) => setCrScope(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={crHours}
                    onChange={(e) => setCrHours(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    min={100}
                    value={crRate}
                    onChange={(e) => setCrRate(parseFloat(e.target.value) || 1500)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateCrOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Change Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL 5: PROVISION & INVOICE LICENSES
         ============================================================================ */}
      {isProvisionLicenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Provision & Invoice Software Licenses
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionLicenseOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateLicenseBill} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={licCustomerId}
                    onChange={(e) => setLicCustomerId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Cycle</label>
                  <select
                    value={licBillingCycle}
                    onChange={(e) => setLicBillingCycle(e.target.value as 'Yearly' | 'Monthly')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Yearly">Yearly Subscription</option>
                    <option value="Monthly">Monthly Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={licInvoiceType}
                    onChange={(e) => setLicInvoiceType(e.target.value as 'Tax' | 'Proforma')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Tax">Tax Invoice (CSINV-)</option>
                    <option value="Proforma">Proforma Invoice (CSPI-)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">License Line Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLicRows((prev) => [
                        ...prev,
                        { licenseId: licenseTypes[0]?.id || 'lic-1', quantity: 1 },
                      ])
                    }
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    + Add License
                  </button>
                </div>

                {licRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.licenseId}
                      onChange={(e) => {
                        const next = [...licRows];
                        next[idx].licenseId = e.target.value;
                        setLicRows(next);
                      }}
                      className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {licenseTypes.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({formatCurrency(licBillingCycle === 'Yearly' ? l.yearlyCost : l.monthlyCost)} /{' '}
                          {licBillingCycle})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => {
                        const next = [...licRows];
                        next[idx].quantity = parseInt(e.target.value, 10) || 1;
                        setLicRows(next);
                      }}
                      className="w-20 p-2 rounded-lg border border-slate-200 font-mono text-center"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProvisionLicenseOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Generate License Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
