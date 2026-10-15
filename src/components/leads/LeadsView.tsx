import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  Lead,
  LeadStatus,
  LeadRating,
  LeadSourceType,
  LeadPriority,
  LeadTimelineEvent,
  Customer,
  OpportunityStage,
} from '../../types';
import {
  UserCheck,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  UserPlus,
  History,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Target,
  Flame,
  Trophy,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface LeadsViewProps {
  initialFilter?: string;
  onOpenTrace: (leadId: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToOpportunity?: (opportunityId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
}

const LEAD_STAGES: LeadStatus[] = [
  'New',
  'Contact',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const LEAD_SOURCES: LeadSourceType[] = [
  'Website',
  'Referral',
  'Microsoft',
  'LinkedIn',
  'Partner',
  'Event',
  'Outbound',
  'Expo/Event',
  'Cold Call',
  'Other',
];

const LEAD_INDUSTRIES = [
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Healthcare',
  'Services',
  'Trading',
  'Real Estate',
  'Logistics',
  'Engineering & Construction',
  'Other',
];

const LEAD_RATINGS: LeadRating[] = ['Hot', 'Warm', 'Cold'];

export const LeadsView: React.FC<LeadsViewProps> = ({
  initialFilter,
  onOpenTrace,
  onNavigateToCustomer,
  onNavigateToOpportunity,
  onNavigateToOrder,
  onNavigateToReport,
}) => {
  const {
    leads,
    activities,
    addLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    addLeadTimelineEvent,
    createContactFromLead,
    qualifyLeadToOpportunity,
    importLeadsBatch,
    convertLead,
    states,
    getStateCode,
    products,
    paymentTerms,
    users,
    customers,
    formatCurrency,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Add / Edit Lead Modal State (#leadModal)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  // Lead History / Timeline Modal State (#leadHistoryModal)
  const [historyLeadId, setHistoryLeadId] = useState<string | null>(null);
  const [timelineEntryType, setTimelineEntryType] =
    useState<LeadTimelineEvent['type']>('Remark');
  const [timelineConversationAt, setTimelineConversationAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [timelineFollowUpAt, setTimelineFollowUpAt] = useState<string>('');
  const [timelineRemarks, setTimelineRemarks] = useState<string>('');

  // Create Contact from Lead Modal State (#leadContactModal)
  const [contactModalLead, setContactModalLead] = useState<Lead | null>(null);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    source: 'Lead',
    mailingAddress: '',
  });

  // Bulk Import Leads Modal State (#leadImportModal)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState<string | null>(null);

  // Lead Conversion Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [conversionType, setConversionType] = useState<'NEW_CUSTOMER' | 'EXISTING_CUSTOMER'>(
    'NEW_CUSTOMER'
  );
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [newCustomerGroup, setNewCustomerGroup] =
    useState<Customer['customerType']>('Enterprise');
  const [newCustomerGstin, setNewCustomerGstin] = useState('');
  const [newCustomerPaymentTerm, setNewCustomerPaymentTerm] = useState(
    paymentTerms[0]?.id || ''
  );
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState(1000000);
  const [createOpportunityOnConvert, setCreateOpportunityOnConvert] = useState(true);
  const [opportunityStageOnConvert, setOpportunityStageOnConvert] =
    useState<OpportunityStage>('Requirement Analysis');
  const [createOrderImmediately, setCreateOrderImmediately] = useState(false);

  // Lead Form State matching all fields in the PHP reference code
  const getDefaultFormData = () => ({
    companyName: '',
    industry: 'Manufacturing',
    primaryProductId: products[0]?.id || '',
    productInterestIds: products[0] ? [products[0].id] : ([] as string[]),
    contactPerson: '',
    designation: '',
    email: '',
    mobile: '',
    createPrimaryContact: true,
    contactFirstName: '',
    contactLastName: '',
    contactDepartment: '',
    contactMobile: '',
    contactLinkedin: '',
    website: '',
    leadSource: 'Website' as LeadSourceType,
    leadType: 'Inbound' as Lead['leadType'],
    status: 'New' as LeadStatus,
    rating: 'Warm' as LeadRating,
    score: 50,
    leadOwnerId: users[0]?.id || '',
    estimatedValue: 500000,
    budget: 500000,
    expectedGoLive: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    expectedClosingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    country: 'India',
    state: states[6]?.stateName || 'Delhi',
    stateCode: '07',
    city: 'New Delhi',
    pincode: '110020',
    address: '',
    requirement: '',
    remarks: '',
    priority: 'Medium' as LeadPriority,
  });

  const [formData, setFormData] = useState(getDefaultFormData);

  // State change handler that automatically sets GST State Code
  const handleStateChange = (stateName: string) => {
    const code = getStateCode(stateName);
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      stateCode: code,
    }));
  };

  // Auto-populate First & Last Name when Contact Person changes
  const handleContactPersonChange = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] || '';
    const last = parts.slice(1).join(' ') || '';
    setFormData((prev) => ({
      ...prev,
      contactPerson: fullName,
      contactFirstName: first,
      contactLastName: last,
    }));
  };

  // Duplicate Check logic (when adding a new lead)
  const duplicateMatch =
    !editingLeadId &&
    leads.find(
      (l) =>
        formData.companyName.trim() &&
        l.companyName.toLowerCase().trim() === formData.companyName.toLowerCase().trim()
    );

  // Open Add Lead modal
  const handleOpenAddLead = () => {
    setEditingLeadId(null);
    setFormData(getDefaultFormData());
    setIsLeadModalOpen(true);
  };

  // Open Edit Lead modal (clicking a company or Edit icon in the table)
  const handleOpenEditLead = (lead: Lead) => {
    const parts = (lead.contactPerson || '').trim().split(/\s+/);
    setEditingLeadId(lead.id);
    setFormData({
      companyName: lead.companyName,
      industry: lead.industry || 'Manufacturing',
      primaryProductId: lead.primaryProductId || lead.productInterestIds[0] || '',
      productInterestIds:
        lead.productInterestIds.length > 0
          ? lead.productInterestIds
          : lead.primaryProductId
          ? [lead.primaryProductId]
          : [],
      contactPerson: lead.contactPerson,
      designation: lead.designation || '',
      email: lead.email || '',
      mobile: lead.mobile || '',
      createPrimaryContact: lead.createPrimaryContact ?? true,
      contactFirstName: lead.contactFirstName || parts[0] || '',
      contactLastName: lead.contactLastName || parts.slice(1).join(' ') || '',
      contactDepartment: lead.contactDepartment || '',
      contactMobile: lead.contactMobile || lead.mobile || '',
      contactLinkedin: lead.contactLinkedin || '',
      website: lead.website || '',
      leadSource: lead.leadSource || 'Website',
      leadType: lead.leadType || 'Inbound',
      status: lead.status || 'New',
      rating: lead.rating || 'Warm',
      score: lead.score ?? 50,
      leadOwnerId: lead.leadOwnerId || users[0]?.id || '',
      estimatedValue: lead.estimatedValue || 0,
      budget: lead.budget ?? lead.estimatedValue ?? 0,
      expectedGoLive: lead.expectedGoLive || lead.expectedClosingDate || '',
      expectedClosingDate: lead.expectedClosingDate || lead.expectedGoLive || '',
      country: lead.country || 'India',
      state: lead.state || 'Delhi',
      stateCode: lead.stateCode || getStateCode(lead.state || 'Delhi'),
      city: lead.city || '',
      pincode: lead.pincode || '',
      address: lead.address || '',
      requirement: lead.requirement || '',
      remarks: lead.remarks || '',
      priority: lead.priority || 'Medium',
    });
    setIsLeadModalOpen(true);
  };

  // Save Lead (Add or Edit)
  const handleSaveLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = users.find((u) => u.id === formData.leadOwnerId);
    const ownerName = owner ? owner.name : 'Unassigned';
    const today = new Date().toISOString().split('T')[0];
    const mergedProductIds = Array.from(
      new Set([
        ...(formData.primaryProductId ? [formData.primaryProductId] : []),
        ...formData.productInterestIds,
      ])
    );

    if (editingLeadId) {
      updateLead(editingLeadId, {
        ...formData,
        productInterestIds: mergedProductIds,
        expectedClosingDate: formData.expectedGoLive || formData.expectedClosingDate,
        leadOwnerName: ownerName,
        stateCode: getStateCode(formData.state),
      });
    } else {
      addLead({
        ...formData,
        productInterestIds: mergedProductIds,
        expectedClosingDate: formData.expectedGoLive || formData.expectedClosingDate,
        leadDate: today,
        leadOwnerName: ownerName,
        stateCode: getStateCode(formData.state),
      });
    }

    setIsLeadModalOpen(false);
    setEditingLeadId(null);
  };

  // Open Create Contact Modal (#leadContactModal)
  const handleOpenCreateContact = (lead: Lead) => {
    const parts = (lead.contactPerson || '').trim().split(/\s+/);
    const first = lead.contactFirstName || parts.shift() || '';
    const last = lead.contactLastName || parts.join(' ') || '-';

    setContactModalLead(lead);
    setContactForm({
      firstName: first,
      lastName: last,
      title: lead.designation || '',
      department: lead.contactDepartment || '',
      email: lead.email || '',
      phone: lead.mobile || '',
      mobile: lead.contactMobile || lead.mobile || '',
      source: 'Lead',
      mailingAddress: lead.address || `${lead.city}, ${lead.state} - ${lead.pincode}`,
    });
  };

  const handleCreateContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalLead) return;
    createContactFromLead(contactModalLead.id, contactForm);
    setContactModalLead(null);
  };

  // Open Lead History / Timeline Modal (#leadHistoryModal)
  const handleOpenHistoryModal = (leadId: string) => {
    setHistoryLeadId(leadId);
    setTimelineEntryType('Remark');
    setTimelineConversationAt(new Date().toISOString().slice(0, 16));
    setTimelineFollowUpAt('');
    setTimelineRemarks('');
  };

  const handleAddTimelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyLeadId || !timelineRemarks.trim()) return;

    addLeadTimelineEvent(historyLeadId, {
      type: timelineEntryType,
      conversationAt: timelineConversationAt,
      followUpAt: timelineFollowUpAt || undefined,
      remarks: timelineRemarks.trim(),
    });

    setTimelineRemarks('');
    setTimelineFollowUpAt('');
  };

  // 1-Click Qualify Action (from PHP reference: "Qualify this lead and convert it into an opportunity?")
  const handleQualifyLead = (lead: Lead) => {
    const createdOpp = qualifyLeadToOpportunity(lead.id);
    if (createdOpp && onNavigateToOpportunity) {
      onNavigateToOpportunity(createdOpp.id);
    }
  };

  // Sample CSV Template Download
  const handleDownloadSampleCsv = () => {
    const headers = [
      'company_name',
      'contact_name',
      'phone',
      'email',
      'industry',
      'designation',
      'website',
      'address',
      'state',
      'source',
      'status',
      'rating',
      'score',
      'estimated_value',
      'budget',
      'expected_go_live',
      'requirement',
      'remarks',
    ];
    const sampleRow1 = [
      'Sterling Precision Engineering Ltd',
      'Rakesh Verma',
      '+91 98111 22334',
      'rakesh@sterlingprecision.in',
      'Manufacturing',
      'VP Operations',
      'https://sterlingprecision.in',
      'Plot 42, Okhla Phase 3',
      'Delhi',
      'Website',
      'New',
      'Hot',
      '82',
      '950000',
      '1000000',
      '2026-11-15',
      'ERP production planning, BOM and GST billing integration',
      'Requested product walkthrough this week',
    ];
    const sampleRow2 = [
      'Vanguard MedTech & Diagnostics',
      'Dr. Meera Krishnan',
      '+91 98450 99887',
      'meera@vanguardmed.org',
      'Healthcare',
      'Director IT',
      'https://vanguardmed.org',
      'Whitefield Tech Park',
      'Karnataka',
      'LinkedIn',
      'Contacted',
      'Warm',
      '68',
      '620000',
      '700000',
      '2026-12-01',
      'Multi-branch inventory and milestone invoicing',
      'Initial discovery call completed',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'lead-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse uploaded CSV file in Bulk Import Modal
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setCsvImportStatus('CSV file must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedRows: Array<Partial<Lead>> = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const rowMap: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowMap[h] = cols[idx] || '';
        });

        if (rowMap.company_name && rowMap.contact_name && rowMap.phone) {
          parsedRows.push({
            companyName: rowMap.company_name,
            contactPerson: rowMap.contact_name,
            mobile: rowMap.phone,
            email: rowMap.email || '',
            industry: rowMap.industry || 'Manufacturing',
            designation: rowMap.designation || '',
            website: rowMap.website || '',
            address: rowMap.address || '',
            state: rowMap.state || 'Delhi',
            leadSource: (rowMap.source as LeadSourceType) || 'Website',
            status: (rowMap.status as LeadStatus) || 'New',
            rating: (rowMap.rating as LeadRating) || 'Warm',
            score: Number(rowMap.score) || 50,
            estimatedValue: Number(rowMap.estimated_value) || 0,
            budget: Number(rowMap.budget) || 0,
            expectedGoLive: rowMap.expected_go_live || '',
            requirement: rowMap.requirement || '',
            remarks: rowMap.remarks || '',
          });
        }
      }

      const importedCount = importLeadsBatch(parsedRows);
      setCsvImportStatus(`Successfully imported ${importedCount} lead(s) into the register.`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setCsvImportStatus(null);
      }, 1200);
    };
    reader.readAsText(file);
  };

  // Helper to resolve primary product display (`product_code — product_name`)
  const getLeadProductDisplay = (lead: Lead): string => {
    const pid = lead.primaryProductId || lead.productInterestIds[0];
    if (!pid) return 'Not selected';
    const prod = products.find((p) => p.id === pid);
    if (!prod) return 'Not selected';
    return `${prod.code ? `${prod.code} — ` : ''}${prod.name}`;
  };

  // Helper to resolve Next Activity display (`type · DD MMM hh:mm A`)
  const getLeadNextActivityDisplay = (lead: Lead): string => {
    if (lead.nextActivity) return lead.nextActivity;
    const scheduled = activities
      .filter((a) => a.leadId === lead.id && a.status === 'Pending')
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!scheduled) return 'Not scheduled';
    return `${scheduled.activityType} · ${scheduled.date}${
      scheduled.time ? ` ${scheduled.time}` : ''
    }`;
  };

  // Helper to get initials of company name
  const getInitials = (name: string): string => {
    return (name || 'LD')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
  };

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.leadNumber.toLowerCase().includes(q) ||
      l.companyName.toLowerCase().includes(q) ||
      l.contactPerson.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.mobile.toLowerCase().includes(q);

    const matchesStatus = !statusFilter || l.status === statusFilter;
    const matchesSource = !sourceFilter || l.leadSource === sourceFilter;
    const matchesRating = !ratingFilter || (l.rating || 'Warm') === ratingFilter;
    const matchesOwner = !ownerFilter || l.leadOwnerId === ownerFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesRating && matchesOwner;
  });

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'Lead Number',
      'Date',
      'Company Name',
      'Contact Person',
      'Phone',
      'Email',
      'Product',
      'Source',
      'Stage',
      'Rating',
      'Score',
      'Est Value',
      'Budget',
      'Expected Go-Live',
      'State',
      'State Code',
      'Lead Owner',
    ];
    const rows = filteredLeads.map((l) => [
      l.leadNumber,
      l.leadDate,
      `"${l.companyName}"`,
      `"${l.contactPerson}"`,
      l.mobile,
      l.email,
      `"${getLeadProductDisplay(l)}"`,
      l.leadSource,
      l.status,
      l.rating || 'Warm',
      l.score ?? 50,
      l.estimatedValue,
      l.budget ?? l.estimatedValue,
      l.expectedGoLive || l.expectedClosingDate,
      l.state,
      l.stateCode,
      `"${l.leadOwnerName}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Enact360_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenConvert = (lead: Lead) => {
    setConvertingLead(lead);
    const stCode = lead.stateCode || '07';
    setNewCustomerGstin(`${stCode}AAACA0000P1Z1`);
    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    try {
      const orderItems =
        convertingLead.productInterestIds.length > 0
          ? convertingLead.productInterestIds.map((pId) => ({
              productId: pId,
              quantity: 1,
              discountPercent: 0,
            }))
          : [{ productId: products[0].id, quantity: 1, discountPercent: 0 }];

      const result = convertLead({
        leadId: convertingLead.id,
        existingCustomerId:
          conversionType === 'EXISTING_CUSTOMER' ? selectedExistingCustomerId : undefined,
        newCustomerData:
          conversionType === 'NEW_CUSTOMER'
            ? {
                name: convertingLead.companyName,
                customerType: newCustomerGroup,
                gstin: newCustomerGstin,
                email: convertingLead.email,
                phone: convertingLead.mobile,
                website: convertingLead.website,
                industry: convertingLead.industry,
                paymentTermsId: newCustomerPaymentTerm,
                creditLimit: newCustomerCreditLimit,
              }
            : undefined,
        createOpportunity: createOpportunityOnConvert,
        opportunityName: `${convertingLead.companyName} - ${convertingLead.requirement.slice(0, 42)}`,
        opportunityStage: opportunityStageOnConvert,
        createOrderImmediately,
        orderItems: createOrderImmediately ? orderItems : undefined,
      });

      setIsConvertModalOpen(false);
      setConvertingLead(null);
      if (selectedLead && selectedLead.id === convertingLead.id) {
        setSelectedLead(null);
      }
      if (result.opportunity && onNavigateToOpportunity && !result.salesOrder) {
        onNavigateToOpportunity(result.opportunity.id);
      } else if (result.salesOrder) {
        onNavigateToOrder(result.salesOrder.id);
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
    }
  };

  const historyLead = historyLeadId ? leads.find((l) => l.id === historyLeadId) || null : null;

  // Respond to initialFilter deep-links from Dashboard / Reports / Navbar
  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter === 'ACTION:CREATE') {
      handleOpenAddLead();
    } else if (initialFilter === 'ALL') {
      setStatusFilter('');
      setSourceFilter('');
      setRatingFilter('');
      setOwnerFilter('');
      setSearchQuery('');
    } else if (initialFilter.startsWith('STAGE:')) {
      setStatusFilter(initialFilter.slice(6));
      setSourceFilter('');
    } else if (initialFilter.startsWith('SOURCE:')) {
      setSourceFilter(initialFilter.slice(7));
      setStatusFilter('');
    } else if (initialFilter.startsWith('RATING:')) {
      setRatingFilter(initialFilter.slice(7));
    } else {
      const targetLead = leads.find((l) => l.id === initialFilter);
      if (targetLead) {
        handleOpenEditLead(targetLead);
      }
    }
  }, [initialFilter]);

  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;
  const qualifiedLeadsCount = leads.filter((l) => l.status === 'Qualified').length;
  const hotLeadsCount = leads.filter((l) => (l.rating || 'Warm') === 'Hot').length;
  const wonLeadsCount = leads.filter((l) => l.status === 'Won').length;
  const totalEstimatedPipeline = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const getRatingStyle = (rating?: LeadRating) => {
    switch (rating) {
      case 'Hot':
        return 'text-rose-700 font-bold';
      case 'Cold':
        return 'text-sky-700 font-semibold';
      default:
        return 'text-amber-700 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Head matching reference code */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 truncate">
            <UserCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            <span className="truncate">Leads</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Toggle */}
          <div className="flex bg-slate-100/90 border border-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'table'
                  ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Register</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 shrink-0" />
              <span>Kanban</span>
            </button>
          </div>

          {canCreate('leads') && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Import Leads</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>

          {canCreate('leads') && (
            <button
              type="button"
              onClick={handleOpenAddLead}
              className="flex items-center gap-1.5 px-4 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Clickable KPI Summary Tiles with Modern Icon Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('');
            setSourceFilter('');
            setRatingFilter('');
            setOwnerFilter('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === '' && ratingFilter === '' && sourceFilter === ''
              ? 'bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">All Leads</span>
            <div className="icon-depth icon-depth-slate w-7 h-7 shrink-0">
              <Users className="w-3.5 h-3.5 text-slate-700" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {totalLeadsCount}
          </div>
          <span className="text-[11px] text-indigo-600 mt-1 block truncate font-medium">
            Click to show all →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'New' ? '' : 'New');
            setRatingFilter('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === 'New'
              ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">New Inquiries</span>
            <div className="icon-depth icon-depth-sky w-7 h-7 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-600 mt-1 truncate">
            {newLeadsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            Filter Stage: New →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'Qualified' ? '' : 'Qualified');
            setRatingFilter('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === 'Qualified'
              ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Qualified Leads</span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-1 truncate">
            {qualifiedLeadsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            Ready for Opportunity →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRatingFilter(ratingFilter === 'Hot' ? '' : 'Hot');
            setStatusFilter('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            ratingFilter === 'Hot'
              ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Hot Priority Leads</span>
            <div className="icon-depth icon-depth-rose w-7 h-7 shrink-0">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1 truncate">
            {hotLeadsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            Filter Rating: Hot →
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'Won' ? '' : 'Won');
            setRatingFilter('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === 'Won'
              ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Converted / Won</span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1 truncate">
            {wonLeadsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            Filter Stage: Won →
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('funnel')}
          className="text-left p-4 rounded-xl border border-slate-200/90 hover:bg-indigo-50/30 hover:border-indigo-300 transition cursor-pointer min-w-0 overflow-hidden card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Est. Lead Pipeline</span>
            <div className="icon-depth icon-depth-amber w-7 h-7 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div
            className="text-base sm:text-lg font-bold font-mono tabular-nums text-indigo-600 mt-1 truncate"
            title={formatCurrency(totalEstimatedPipeline)}
          >
            {formatCurrency(totalEstimatedPipeline)}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block truncate">
            Open Funnel Report →
          </span>
        </button>
      </div>

      {/* Filter Toolbar matching reference code */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search company, contact, email, phone or lead number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium"
        >
          <option value="">All stages</option>
          {LEAD_STAGES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium"
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium"
        >
          <option value="">All ratings</option>
          {LEAD_RATINGS.map((r) => (
            <option key={r} value={r}>
              Rating: {r}
            </option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium"
        >
          <option value="">All owners</option>
          {crmVisibleUsers(users).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {(searchQuery !== '' ||
          statusFilter !== '' ||
          sourceFilter !== '' ||
          ratingFilter !== '' ||
          ownerFilter !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setSourceFilter('');
              setRatingFilter('');
              setOwnerFilter('');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* VIEW 1: TABLE PANEL matching PHP reference columns & actions */}
      {viewMode === 'table' && (
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {filteredLeads.length.toLocaleString()} lead{filteredLeads.length === 1 ? '' : 's'}
            </span>
            <span>Click a company to edit lead card</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Company & Contact</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Next Activity</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4">
                      <EmptyState
                        compact
                        illustration="leads"
                        title="No leads match these filters"
                        message="Try clearing the search or widening the date range."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const rating = lead.rating || 'Warm';
                    const score = lead.score ?? 50;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                        {/* 1. Company & Contact */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLead(lead)}
                            className="flex items-start gap-2.5 text-left group cursor-pointer"
                          >
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition">
                              {getInitials(lead.companyName)}
                            </span>
                            <div>
                              <strong className="font-bold text-slate-900 group-hover:text-indigo-600 block leading-snug">
                                {lead.companyName}
                              </strong>
                              <small className="text-[11px] text-slate-500 block">
                                {lead.contactPerson} ·{' '}
                                <span className="font-mono text-indigo-600">{lead.leadNumber}</span>
                              </small>
                              <small className="text-[10px] text-slate-400 font-mono block">
                                {lead.state} (GST: {lead.stateCode})
                                {lead.linkedContacts && lead.linkedContacts.length > 0
                                  ? ` · ${lead.linkedContacts.length} Contact(s)`
                                  : ''}
                              </small>
                            </div>
                          </button>
                        </td>

                        {/* 2. Product */}
                        <td className="py-3.5 px-4 text-slate-700 max-w-[200px]">
                          <div className="truncate font-medium" title={getLeadProductDisplay(lead)}>
                            {getLeadProductDisplay(lead)}
                          </div>
                          {lead.expectedGoLive && (
                            <div className="text-[10px] font-mono text-slate-400">
                              Go-Live: {lead.expectedGoLive}
                            </div>
                          )}
                        </td>

                        {/* 3. Source */}
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {lead.leadSource}
                        </td>

                        {/* 4. Stage */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{lead.status}</span>
                          {lead.convertedOpportunityNumber && (
                            <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                              → {lead.convertedOpportunityNumber}
                            </div>
                          )}
                        </td>

                        {/* 5. Rating & Score */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={getRatingStyle(rating)}>{rating}</span>
                          <div className="text-[10px] font-mono text-slate-400">
                            Score: {score}/100
                          </div>
                        </td>

                        {/* 6. Value & Budget */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <b className="text-slate-900 block">
                            {formatCurrency(lead.estimatedValue)}
                          </b>
                          {lead.budget ? (
                            <span className="text-[10px] text-slate-400">
                              Budget: {formatCurrency(lead.budget)}
                            </span>
                          ) : null}
                        </td>

                        {/* 7. Owner */}
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {lead.leadOwnerName || 'Unassigned'}
                        </td>

                        {/* 8. Next Activity */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <span className="font-mono text-[11px]">
                            {getLeadNextActivityDisplay(lead)}
                          </span>
                        </td>

                        {/* 9. Actions matching PHP reference */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-[240px]">
                            <button
                              type="button"
                              onClick={() => handleOpenHistoryModal(lead.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] whitespace-nowrap transition cursor-pointer"
                            >
                              View History
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenCreateContact(lead)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px] whitespace-nowrap transition cursor-pointer"
                            >
                              Create Contact
                            </button>

                            {lead.convertedOpportunityId && onNavigateToOpportunity ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateToOpportunity(lead.convertedOpportunityId!)
                                }
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono font-semibold rounded text-[11px] transition cursor-pointer"
                              >
                                {lead.convertedOpportunityNumber || 'View Opp'}
                              </button>
                            ) : (
                              lead.status !== 'Unqualified' &&
                              lead.status !== 'Lost' &&
                              canEdit('leads') && (
                                <button
                                  type="button"
                                  onClick={() => handleQualifyLead(lead)}
                                  className="px-2.5 py-1 bg-[#0f766e] hover:bg-teal-800 text-white font-semibold rounded text-[11px] transition cursor-pointer"
                                  title="Qualify this lead and convert it into an opportunity"
                                >
                                  Qualify
                                </button>
                              )
                            )}

                            {canEdit('leads') && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditLead(lead)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Edit Lead"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenTrace(lead.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Trace Lifecycle"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            {canDelete('leads') && (
                              <button
                                type="button"
                                onClick={() => deleteLead(lead.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW 2: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_STAGES.map((status) => {
            const columnLeads = filteredLeads.filter((l) => l.status === status);
            const columnTotal = columnLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

            return (
              <div
                key={status}
                className="bg-slate-200/60 rounded-xl p-3 border border-slate-200 flex flex-col w-72 shrink-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-slate-800">
                    {status} ({columnLeads.length})
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mb-3">
                  {formatCurrency(columnTotal)}
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => (canEdit('leads') ? handleOpenEditLead(lead) : onOpenTrace(lead.id))}
                      title={canEdit('leads') ? 'Click to Edit Lead' : 'Click to Trace Lead (Read-Only)'}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-indigo-400 transition cursor-pointer text-xs space-y-2 min-w-0 overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-[10px] text-indigo-600 font-bold truncate">
                          {lead.leadNumber}
                        </span>
                        <span className={`text-[10px] shrink-0 ${getRatingStyle(lead.rating)}`}>
                          {lead.rating || 'Warm'} · {lead.score ?? 50}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 leading-tight truncate">
                          {lead.companyName}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate">{lead.contactPerson}</div>
                      </div>

                      <div className="text-[11px] text-slate-600 truncate">
                        {getLeadProductDisplay(lead)}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-mono text-[10px] truncate">
                          {lead.stateCode} {lead.state}
                        </span>
                        <span className="font-bold font-mono tabular-nums text-slate-900 shrink-0">
                          {formatCurrency(lead.estimatedValue)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(lead.id)}
                          className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded"
                        >
                          History
                        </button>
                        {!lead.isConverted && lead.status !== 'Unqualified' && (
                          <button
                            type="button"
                            onClick={() => handleQualifyLead(lead)}
                            className="flex-1 py-1 bg-[#0f766e] hover:bg-teal-800 text-white text-[10px] font-semibold rounded"
                          >
                            Qualify →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ADD / EDIT LEAD MODAL (#leadModal from reference code)
         ===================================================================== */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  {editingLeadId ? 'Edit Lead Card' : 'Add Lead'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveLeadSubmit}
              className="p-6 max-h-[82vh] overflow-y-auto space-y-5 text-xs"
            >
              {/* Duplicate Alert */}
              {duplicateMatch && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Potential Duplicate Found:</strong> A lead for "
                    {duplicateMatch.companyName}" ({duplicateMatch.leadNumber}) already exists.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name * */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Bharat Heavy Electricals Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {LEAD_INDUSTRIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product * (Full width with subtext as in reference code) */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Product *</label>
                  <select
                    required
                    value={formData.primaryProductId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryProductId: e.target.value,
                        productInterestIds: e.target.value ? [e.target.value] : [],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code ? `${product.code} — ` : ''}
                        {product.name} ({formatCurrency(product.sellingPrice)})
                      </option>
                    ))}
                  </select>
                  <small className="text-[11px] text-slate-400 block mt-1">
                    Products are maintained in the Products master.
                  </small>
                </div>

                {/* Contact Person * */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => handleContactPersonChange(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. VP IT / Head Procurement"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* Phone * */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 98100 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* =========================================================
                    PRIMARY CONTACT CARD SECTION (from PHP reference code)
                   ========================================================= */}
                <div className="sm:col-span-2 pt-3 mt-1 border-t border-slate-200">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Primary contact card
                  </div>
                </div>

                <label className="sm:col-span-2 flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.createPrimaryContact}
                    onChange={(e) =>
                      setFormData({ ...formData, createPrimaryContact: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Create and link this person in Contacts when the lead is saved</span>
                </label>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="Auto from contact person"
                    value={formData.contactFirstName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactFirstName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Auto from contact person"
                    value={formData.contactLastName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactLastName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. IT / Finance / Operations"
                    value={formData.contactDepartment}
                    onChange={(e) =>
                      setFormData({ ...formData, contactDepartment: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="Direct mobile number"
                    value={formData.contactMobile}
                    onChange={(e) => setFormData({ ...formData, contactMobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.contactLinkedin}
                    onChange={(e) =>
                      setFormData({ ...formData, contactLinkedin: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* =========================================================
                    COMMERCIAL & QUALIFICATION FIELDS (from reference code)
                   ========================================================= */}
                <div className="sm:col-span-2 pt-3 mt-1 border-t border-slate-200">
                  <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Qualification, Scoring & Commercials
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Website</label>
                  <input
                    type="url"
                    placeholder="https://"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) =>
                      setFormData({ ...formData, leadSource: e.target.value as LeadSourceType })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {LEAD_SOURCES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stage</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as LeadStatus })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {LEAD_STAGES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: e.target.value as LeadRating })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Lead Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner</label>
                  <select
                    value={formData.leadOwnerId}
                    onChange={(e) => setFormData({ ...formData, leadOwnerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {crmVisibleUsers(users).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Estimated Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.estimatedValue}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedValue: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Go-Live</label>
                  <input
                    type="date"
                    value={formData.expectedGoLive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedGoLive: e.target.value,
                        expectedClosingDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    State (Auto GST Code: {formData.stateCode})
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.stateName}>
                        {s.stateName} ({s.stateCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address, industrial area, city, pincode..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Requirement</label>
                  <textarea
                    rows={3}
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                    placeholder="Current system, modules, pain points, integrations and expected outcome"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: LEAD HISTORY / TIMELINE MODAL (#leadHistoryModal)
         ===================================================================== */}
      {historyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-[780px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Head */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 block">
                  Lead Timeline
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Lead History</h2>
              </div>
              <button
                type="button"
                onClick={() => setHistoryLeadId(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Summary Bar matching .history-summary */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-6 text-xs">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Lead</span>
                <b className="text-sm font-mono text-slate-900 mt-0.5">{historyLead.leadNumber}</b>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Company</span>
                <b className="text-sm text-slate-900 mt-0.5">{historyLead.companyName}</b>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Contact</span>
                <b className="text-sm text-slate-900 mt-0.5">{historyLead.contactPerson}</b>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Current status</span>
                <b className="text-sm text-indigo-700 mt-0.5">{historyLead.status}</b>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Owner</span>
                <b className="text-sm text-slate-900 mt-0.5">
                  {historyLead.leadOwnerName || 'Unassigned'}
                </b>
              </div>
            </div>

            {/* Timeline Entry Form matching .timeline-entry-form */}
            <form
              onSubmit={handleAddTimelineSubmit}
              className="px-6 py-4 border-b border-slate-200 bg-white space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Conversation type</span>
                  <select
                    value={timelineEntryType}
                    onChange={(e) =>
                      setTimelineEntryType(e.target.value as LeadTimelineEvent['type'])
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Remark">Remark</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Status Update">Status Update</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Conversation date *</span>
                  <input
                    type="datetime-local"
                    required
                    value={timelineConversationAt}
                    onChange={(e) => setTimelineConversationAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Next follow-up date</span>
                  <input
                    type="datetime-local"
                    value={timelineFollowUpAt}
                    onChange={(e) => setTimelineFollowUpAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-bold text-slate-700 block mb-1">Follow-up remarks *</span>
                <textarea
                  rows={3}
                  required
                  value={timelineRemarks}
                  onChange={(e) => setTimelineRemarks(e.target.value)}
                  placeholder="Record the customer conversation, outcome and next action"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </label>

              <div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Add to Timeline
                </button>
              </div>
            </form>

            {/* Chronological History Event List matching .lead-history-list & .lead-history-event */}
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              {!historyLead.timelineEvents || historyLead.timelineEvents.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No follow-ups or updates have been recorded yet.
                </p>
              ) : (
                <div className="space-y-0">
                  {historyLead.timelineEvents.map((item, idx) => (
                    <article
                      key={item.id}
                      className="relative py-4 pl-9 border-b border-slate-100 last:border-b-0"
                    >
                      {/* Timeline Dot */}
                      <span className="absolute left-2 top-5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                      {/* Vertical Line */}
                      {idx < (historyLead.timelineEvents?.length || 0) - 1 && (
                        <span className="absolute left-[12px] top-8 -bottom-2 w-0.5 bg-slate-200" />
                      )}

                      <header className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold text-slate-900">
                          {item.type} · {item.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {item.status}
                        </span>
                      </header>
                      <p className="text-xs text-slate-600 my-1.5 leading-relaxed">{item.detail}</p>
                      <small className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.date).toLocaleString()} · {item.user}
                      </small>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: CREATE CONTACT FROM LEAD MODAL (#leadContactModal)
         ===================================================================== */}
      {contactModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Create Contact — {contactModalLead.companyName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setContactModalLead(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContactSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">First Name *</span>
                  <input
                    type="text"
                    required
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, firstName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Last Name *</span>
                  <input
                    type="text"
                    required
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Job Title</span>
                  <input
                    type="text"
                    value={contactForm.title}
                    onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Department</span>
                  <input
                    type="text"
                    value={contactForm.department}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, department: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Email</span>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Phone</span>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Mobile</span>
                  <input
                    type="text"
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Source</span>
                  <input
                    type="text"
                    value={contactForm.source}
                    onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="font-bold text-slate-700 block mb-1">Mailing Address</span>
                  <textarea
                    rows={2}
                    value={contactForm.mailingAddress}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, mailingAddress: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setContactModalLead(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Create & Link Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: BULK IMPORT LEADS MODAL (#leadImportModal)
         ===================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bulk Import Leads</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">CSV File *</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:font-semibold"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
                <p>
                  Required columns: <b>company_name</b>, <b>contact_name</b>, <b>phone</b>.
                </p>
                <p>
                  Optional columns: email, industry, designation, website, address, state, source,
                  status, rating, score, estimated_value, budget, expected_go_live (YYYY-MM-DD),
                  requirement, remarks.
                </p>
                <p className="pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download sample CSV template</span>
                  </button>
                </p>
              </div>

              {csvImportStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold">
                  {csvImportStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: FULL LEAD CONVERSION MODAL
         ===================================================================== */}
      {isConvertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 text-slate-900 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-900">
                    Convert Lead to Opportunity & Customer
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Customer Target:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      conversionType === 'NEW_CUSTOMER'
                        ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conversionType"
                      checked={conversionType === 'NEW_CUSTOMER'}
                      onChange={() => setConversionType('NEW_CUSTOMER')}
                      className="mr-2"
                    />
                    Create New Customer
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      conversionType === 'EXISTING_CUSTOMER'
                        ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conversionType"
                      checked={conversionType === 'EXISTING_CUSTOMER'}
                      onChange={() => setConversionType('EXISTING_CUSTOMER')}
                      className="mr-2"
                    />
                    Link to Existing Customer
                  </label>
                </div>
              </div>

              {conversionType === 'EXISTING_CUSTOMER' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Select Existing Customer *
                  </label>
                  <select
                    value={selectedExistingCustomerId}
                    onChange={(e) => setSelectedExistingCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerCode} - {c.name} ({c.addresses[0]?.state})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800">
                    Auto-populated Customer Master Details
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1">Customer Type</label>
                      <select
                        value={newCustomerGroup}
                        onChange={(e) => setNewCustomerGroup(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                      >
                        <option value="Enterprise">Enterprise</option>
                        <option value="SME">SME</option>
                        <option value="Government">Government</option>
                        <option value="Startup">Startup</option>
                        <option value="International">International</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={newCustomerGstin}
                        onChange={(e) => setNewCustomerGstin(e.target.value)}
                        placeholder="e.g. 07AAACA1234F1Z5"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Payment Terms</label>
                      <select
                        value={newCustomerPaymentTerm}
                        onChange={(e) => setNewCustomerPaymentTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                      >
                        {paymentTerms.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        step="100000"
                        value={newCustomerCreditLimit}
                        onChange={(e) => setNewCustomerCreditLimit(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Opportunity Card Generation */}
              <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={createOpportunityOnConvert}
                    onChange={(e) => setCreateOpportunityOnConvert(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Create Opportunity Card (Lead → Qualification → Opportunity)</span>
                </label>
                {createOpportunityOnConvert && (
                  <div className="pl-6">
                    <label className="text-[11px] font-semibold text-indigo-900 block mb-1">
                      Initial Opportunity Stage:
                    </label>
                    <select
                      value={opportunityStageOnConvert}
                      onChange={(e) =>
                        setOpportunityStageOnConvert(e.target.value as OpportunityStage)
                      }
                      className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="Qualification">Qualification (20%)</option>
                      <option value="Requirement Analysis">Requirement Analysis (35%)</option>
                      <option value="Demo / Presentation">Demo / Presentation (50%)</option>
                      <option value="Proposal Submitted">Proposal Submitted (65%)</option>
                      <option value="Negotiation">Negotiation (80%)</option>
                      <option value="Commercial Discussion">Commercial Discussion (85%)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition"
                >
                  Confirm Lead Conversion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
