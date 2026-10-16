import { confirmSave } from '../../shared/confirm';
import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
  OpportunityTaskStatus,
} from '../../types';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  Kanban,
  Table as TableIcon,
  Calendar,
  User,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquarePlus,
  ListTodo,
  Paperclip,
  Layers,
  ArrowRight,
  ExternalLink,
  X,
  TrendingUp,
  Sparkles,
  CheckSquare,
  PauseCircle,
  FileText,
  Send,
} from 'lucide-react';

interface OpportunitiesViewProps {
  initialOpportunityId?: string;
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string, invoiceId?: string, opportunityId?: string) => void;
  onNavigateToLead: (leadId: string) => void;
  onNavigateToCustomer: (customerId: string) => void;
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToReport?: (reportTab: string) => void;
}

const OPPORTUNITY_STAGES: OpportunityStage[] = [
  'Qualification',
  'Requirement Analysis',
  'Demo / Presentation',
  'Proposal Submitted',
  'Negotiation',
  'Commercial Discussion',
  'Decision Pending',
  'Won',
  'Lost',
];

const OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  'Open',
  'In Progress',
  'On Hold',
  'Won',
  'Lost',
  'Cancelled',
];

const TASK_STATUSES: OpportunityTaskStatus[] = [
  'Pending',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  initialOpportunityId,
  onOpenTrace,
  onNavigateToLead,
  onNavigateToCustomer,
  onNavigateToOrder,
  onNavigateToReport,
}) => {
  const {
    opportunities,
    leads,
    customers,
    products,
    users,
    states,
    paymentTerms,
    currentUser,
    addOpportunity,
    updateOpportunityStageAndStatus,
    updateOpportunity,
    addOpportunityRemark,
    addOpportunityTask,
    updateOpportunityTaskStatus,
    addOpportunityAttachment,
    convertOpportunityToSalesOrder,
    formatCurrency,
    getStateCode,
  } = useCrm();

  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // Selected Opportunity for Deep Inspector Modal
  const [selectedOppId, setSelectedOppId] = useState<string | null>(
    initialOpportunityId && !initialOpportunityId.includes(':') ? initialOpportunityId : null
  );

  useEffect(() => {
    if (!initialOpportunityId) return;
    if (initialOpportunityId === 'FILTER:OPEN') {
      setSelectedOppId(null);
      setStageFilter('ALL');
      setStatusFilter('ALL');
    } else if (initialOpportunityId.startsWith('STAGE:')) {
      setSelectedOppId(null);
      setStageFilter(initialOpportunityId.slice(6));
    } else if (initialOpportunityId.startsWith('STATUS:')) {
      setSelectedOppId(null);
      setStatusFilter(initialOpportunityId.slice(7));
    } else {
      setSelectedOppId(initialOpportunityId);
    }
  }, [initialOpportunityId]);

  // Quick inline remark inputs keyed by opportunity ID
  const [inlineRemarkText, setInlineRemarkText] = useState<Record<string, string>>({});

  // Quick Add Task Modal State
  const [taskModalOppId, setTaskModalOppId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser.id);
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newTaskReminder, setNewTaskReminder] = useState('');

  // Create Opportunity Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeadIdForNew, setSelectedLeadIdForNew] = useState<string>('');
  const [newOppName, setNewOppName] = useState('');
  const [newOppCustomerName, setNewOppCustomerName] = useState('');
  const [newOppCustomerId, setNewOppCustomerId] = useState('');
  const [newOppContactPerson, setNewOppContactPerson] = useState('');
  const [newOppContactMobile, setNewOppContactMobile] = useState('');
  const [newOppContactEmail, setNewOppContactEmail] = useState('');
  const [newOppState, setNewOppState] = useState('Delhi');
  const [newOppOwnerId, setNewOppOwnerId] = useState(currentUser.id);
  const [newOppCloseDate, setNewOppCloseDate] = useState(
    new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]
  );
  const [newOppValue, setNewOppValue] = useState<number>(500000);
  const [newOppProbability, setNewOppProbability] = useState<number>(40);
  const [newOppStage, setNewOppStage] = useState<OpportunityStage>('Qualification');
  const [newOppStatus, setNewOppStatus] = useState<OpportunityStatus>('Open');
  const [newOppNextFollowUp, setNewOppNextFollowUp] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [newOppRemark, setNewOppRemark] = useState('');
  const [newOppProducts, setNewOppProducts] = useState<string[]>(['prod-01']);

  // Convert to Sales Order Modal State
  const [convertModalOpp, setConvertModalOpp] = useState<Opportunity | null>(null);
  const [convCustomerType, setConvCustomerType] = useState<'Enterprise' | 'SME' | 'Government' | 'Startup'>('Enterprise');
  const [convGstin, setConvGstin] = useState('');
  const [convPan, setConvPan] = useState('');
  const [convPaymentTermsId, setConvPaymentTermsId] = useState(paymentTerms[0]?.id || 'pt-1');
  const [convCreditLimit, setConvCreditLimit] = useState(2000000);
  const [convDeliveryDate, setConvDeliveryDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [convOrderItems, setConvOrderItems] = useState<
    Array<{ productId: string; quantity: number; discountPercent: number }>
  >([]);
  const [convMilestoneSplit, setConvMilestoneSplit] = useState<string>('30,40,20,10');
  const [convRemarks, setConvRemarks] = useState('');

  // Filter Opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.opportunityNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.opportunityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.leadNumber && opp.leadNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStage = stageFilter === 'ALL' || opp.stage === stageFilter;
    const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;
    const matchesOwner = ownerFilter === 'ALL' || opp.salesOwnerId === ownerFilter;

    return matchesSearch && matchesStage && matchesStatus && matchesOwner;
  });

  // KPI Metrics for Opportunity Pipeline
  const openOpps = opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost');
  const totalPipelineValue = openOpps.reduce((sum, o) => sum + o.estimatedDealValue, 0);
  const weightedPipelineValue = openOpps.reduce(
    (sum, o) => sum + Math.round((o.estimatedDealValue * o.probability) / 100),
    0
  );
  const onHoldOpps = opportunities.filter((o) => o.status === 'On Hold');
  const wonOpps = opportunities.filter((o) => o.stage === 'Won');
  const pendingTasksCount = opportunities.reduce(
    (sum, o) => sum + o.tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length,
    0
  );

  // Pre-fill when Lead is chosen in Create Opportunity Modal
  const handleSelectLeadForNewOpp = (leadId: string) => {
    setSelectedLeadIdForNew(leadId);
    const foundLead = leads.find((l) => l.id === leadId);
    if (foundLead) {
      setNewOppName(`${foundLead.companyName} - ${foundLead.requirement.slice(0, 42)}`);
      setNewOppCustomerName(foundLead.companyName);
      setNewOppCustomerId(foundLead.convertedCustomerId || '');
      setNewOppContactPerson(foundLead.contactPerson);
      setNewOppContactMobile(foundLead.mobile);
      setNewOppContactEmail(foundLead.email);
      setNewOppState(foundLead.state);
      setNewOppOwnerId(foundLead.leadOwnerId);
      setNewOppCloseDate(foundLead.expectedClosingDate);
      setNewOppValue(foundLead.estimatedValue);
      setNewOppProducts(foundLead.productInterestIds.length > 0 ? foundLead.productInterestIds : ['prod-01']);
      setNewOppRemark(foundLead.remarks || `Created from Lead ${foundLead.leadNumber}`);
    }
  };

  const handleCreateOpportunitySubmit = (e: React.FormEvent) => {
    if (!confirmSave('opportunity')) return;
    e.preventDefault();
    if (!newOppName.trim() || !newOppCustomerName.trim()) return;

    addOpportunity({
      opportunityName: newOppName.trim(),
      leadId: selectedLeadIdForNew || undefined,
      customerId: newOppCustomerId || undefined,
      customerName: newOppCustomerName.trim(),
      contactPerson: newOppContactPerson.trim() || 'Primary Contact',
      contactMobile: newOppContactMobile.trim() || '+91 98000 00000',
      contactEmail: newOppContactEmail.trim() || 'contact@company.in',
      state: newOppState,
      salesOwnerId: newOppOwnerId,
      expectedClosingDate: newOppCloseDate,
      estimatedDealValue: Number(newOppValue) || 0,
      probability: Number(newOppProbability) || 40,
      stage: newOppStage,
      status: newOppStatus,
      initialRemark: newOppRemark.trim() || 'Opportunity initialized for commercial evaluation.',
      nextFollowUp: newOppNextFollowUp,
      productInterestIds: newOppProducts,
    });

    setIsCreateModalOpen(false);
    setSelectedLeadIdForNew('');
    setNewOppName('');
    setNewOppCustomerName('');
    setNewOppRemark('');
  };

  const handleOpenAddTaskModal = (oppId: string) => {
    const opp = opportunities.find((o) => o.id === oppId);
    setTaskModalOppId(oppId);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAssignee(opp?.salesOwnerId || currentUser.id);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    if (!confirmSave('task')) return;
    e.preventDefault();
    if (!taskModalOppId || !newTaskTitle.trim()) return;

    addOpportunityTask(taskModalOppId, {
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      assignedToId: newTaskAssignee,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      reminder: newTaskReminder || undefined,
    });

    setTaskModalOppId(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleOpenConvertModal = (opp: Opportunity) => {
    setConvertModalOpp(opp);
    const existingCust = opp.customerId ? customers.find((c) => c.id === opp.customerId) : undefined;
    setConvGstin(existingCust?.gstin || '');
    setConvPan(existingCust?.pan || '');
    setConvPaymentTermsId(existingCust?.paymentTermsId || paymentTerms[0]?.id || 'pt-1');
    setConvCreditLimit(existingCust?.creditLimit || 2000000);
    setConvRemarks(`Sales Order against Won Opportunity ${opp.opportunityNumber} (${opp.opportunityName})`);

    const initialItems =
      opp.productInterestIds.length > 0
        ? opp.productInterestIds.map((pid) => ({
            productId: pid,
            quantity: 1,
            discountPercent: 0,
          }))
        : [{ productId: products[0]?.id || 'prod-01', quantity: 1, discountPercent: 0 }];
    setConvOrderItems(initialItems);
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalOpp || convOrderItems.length === 0) return;

    const splitArr = convMilestoneSplit
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    const sumPct = splitArr.reduce((a, b) => a + b, 0);
    const validPercentages = Math.abs(sumPct - 100) < 0.01 ? splitArr : [30, 40, 20, 10];

    const result = convertOpportunityToSalesOrder({
      opportunityId: convertModalOpp.id,
      existingCustomerId: convertModalOpp.customerId,
      newCustomerData: convertModalOpp.customerId
        ? undefined
        : {
            name: convertModalOpp.customerName,
            customerType: convCustomerType,
            gstin: convGstin || undefined,
            pan: convPan || undefined,
            paymentTermsId: convPaymentTermsId,
            creditLimit: convCreditLimit,
          },
      paymentTermsId: convPaymentTermsId,
      deliveryDate: convDeliveryDate,
      items: convOrderItems,
      milestonePercentages: validPercentages,
      remarks: convRemarks,
    });

    setConvertModalOpp(null);
    onNavigateToOrder(result.salesOrder.id);
  };

  const getStageBadgeStyle = (stage: OpportunityStage) => {
    switch (stage) {
      case 'Qualification':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Requirement Analysis':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Demo / Presentation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Proposal Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Negotiation':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Commercial Discussion':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Decision Pending':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'Won':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getStatusBadgeStyle = (status: OpportunityStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'On Hold':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Won':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Cancelled':
        return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  const selectedOpportunity = selectedOppId
    ? opportunities.find((o) => o.id === selectedOppId) || null
    : null;

  // Render an individual comprehensive Opportunity Card matching the user's spec
  const renderOpportunityCard = (opp: Opportunity, isFullModal = false) => {
    const remarkInput = inlineRemarkText[opp.id] || '';
    const oppProducts = products.filter((p) => opp.productInterestIds.includes(p.id));
    const weightedValue = Math.round((opp.estimatedDealValue * opp.probability) / 100);

    return (
      <div
        key={opp.id}
        className={`bg-white rounded-xl border transition-all ${
          opp.status === 'On Hold'
            ? 'border-amber-300 shadow-sm'
            : opp.stage === 'Won'
            ? 'border-emerald-300 shadow-sm'
            : 'border-slate-200/90 shadow-sm hover:border-slate-300'
        } flex flex-col overflow-hidden`}
      >
        {/* Card Header Bar */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-indigo-700">
              {opp.opportunityNumber}
            </span>
            {opp.leadNumber && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <button
                  onClick={() => onNavigateToLead(opp.leadId!)}
                  className="text-xs font-mono text-slate-600 hover:text-indigo-600 flex items-center gap-1 underline decoration-slate-300 underline-offset-2 truncate"
                  title="View Originating Lead"
                >
                  <span>From {opp.leadNumber}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                onOpenTrace(
                  opp.leadId,
                  opp.customerId,
                  opp.convertedSalesOrderId,
                  undefined,
                  opp.id
                )
              }
              className="text-xs text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Trace Flow</span>
            </button>
            {!isFullModal && (
              <button
                onClick={() => setSelectedOppId(opp.id)}
                className="text-xs text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Full Card</span>
              </button>
            )}
          </div>
        </div>

        {/* Deal Title & Core Snapshot */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-snug break-words">
                {opp.opportunityName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 flex items-center gap-1 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {opp.customerId ? (
                    <button
                      onClick={() => onNavigateToCustomer(opp.customerId!)}
                      className="hover:text-indigo-600 hover:underline truncate"
                    >
                      {opp.customerName}
                    </button>
                  ) : (
                    <span className="truncate">{opp.customerName}</span>
                  )}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">Contact: {opp.contactPerson}</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">
                  {opp.state} (GST Code: <strong className="font-mono tabular-nums">{opp.stateCode}</strong>)
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 min-w-0">
              <div className="text-xs text-slate-500">Estimated Deal Value</div>
              <div
                className="text-lg font-bold font-mono tabular-nums text-slate-900 truncate"
                title={formatCurrency(opp.estimatedDealValue)}
              >
                {formatCurrency(opp.estimatedDealValue)}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 truncate">
                Weighted ({opp.probability}%): {formatCurrency(weightedValue)}
              </div>
            </div>
          </div>

          {/* Interactive Stage & Status Controls (Separate Stage vs Status as requested) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
            <div className="min-w-0">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 truncate">
                Pipeline Stage
              </label>
              <select
                value={opp.stage}
                onChange={(e) =>
                  updateOpportunityStageAndStatus(
                    opp.id,
                    e.target.value as OpportunityStage,
                    opp.status
                  )
                }
                className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded border ${getStageBadgeStyle(
                  opp.stage
                )} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {OPPORTUNITY_STAGES.map((st) => (
                  <option key={st} value={st} className="bg-white text-slate-800">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 truncate">
                Deal Status (Separate from Stage)
              </label>
              <select
                value={opp.status}
                onChange={(e) =>
                  updateOpportunityStageAndStatus(
                    opp.id,
                    opp.stage,
                    e.target.value as OpportunityStatus,
                    opp.probability
                  )
                }
                className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded border ${getStatusBadgeStyle(
                  opp.status
                )} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {OPPORTUNITY_STATUSES.map((stat) => (
                  <option key={stat} value={stat} className="bg-white text-slate-800">
                    {stat}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 truncate">
                Win Probability ({opp.probability}%)
              </label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={opp.probability}
                  onChange={(e) =>
                    updateOpportunityStageAndStatus(
                      opp.id,
                      opp.stage,
                      opp.status,
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="font-mono tabular-nums text-xs font-bold text-indigo-700 w-9 text-right shrink-0">
                  {opp.probability}%
                </span>
              </div>
            </div>
          </div>

          {/* Notice if Stage is active but Status is On Hold */}
          {opp.status === 'On Hold' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Opportunity is at <strong>{opp.stage}</strong> stage, but currently marked{' '}
                <strong>On Hold</strong>.
              </span>
            </div>
          )}

          {/* Key Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="bg-slate-50/70 p-2.5 rounded border border-slate-100 min-w-0 overflow-hidden">
              <div className="text-slate-400 text-[11px] truncate">Sales Owner</div>
              <div className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1 min-w-0">
                <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{opp.salesOwnerName}</span>
              </div>
            </div>
            <div className="bg-slate-50/70 p-2.5 rounded border border-slate-100 min-w-0 overflow-hidden">
              <div className="text-slate-400 text-[11px] truncate">Expected Closing</div>
              <div className="font-mono tabular-nums font-semibold text-slate-800 mt-0.5 flex items-center gap-1 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{opp.expectedClosingDate}</span>
              </div>
            </div>
            <div className="bg-slate-50/70 p-2.5 rounded border border-slate-100 min-w-0 overflow-hidden">
              <div className="text-slate-400 text-[11px] truncate">Next Follow-up</div>
              <div className="font-mono tabular-nums font-semibold text-indigo-700 mt-0.5 truncate">
                {opp.nextFollowUp || 'Not scheduled'}
              </div>
            </div>
            <div className="bg-slate-50/70 p-2.5 rounded border border-slate-100 min-w-0 overflow-hidden">
              <div className="text-slate-400 text-[11px] truncate">Products / Scope</div>
              <div className="font-semibold text-slate-800 mt-0.5 truncate" title={oppProducts.map((p) => p.name).join(', ')}>
                {oppProducts.length > 0
                  ? oppProducts.map((p) => p.name).join(', ')
                  : 'Standard ERP Suite'}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Body: Remarks Timeline & Opportunity Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1">
          {/* Left: Opportunity Remarks & Chronological Timeline */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                  <MessageSquarePlus className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Opportunity Remarks & Timeline ({opp.remarks.length})</span>
                </h4>
                <span className="text-[11px] text-slate-400 shrink-0">Chronological Log</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {opp.remarks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No commercial updates recorded yet.
                  </p>
                ) : (
                  opp.remarks.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1 min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 truncate">{rem.userName}</span>
                        <span className="font-mono tabular-nums shrink-0">
                          {rem.date} · {rem.time}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed break-words">{rem.remark}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Add Remark Input */}
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add remark (e.g. Customer requested revised commercial proposal)..."
                  value={remarkInput}
                  onChange={(e) =>
                    setInlineRemarkText((prev) => ({ ...prev, [opp.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && remarkInput.trim()) {
                      addOpportunityRemark(opp.id, remarkInput);
                      setInlineRemarkText((prev) => ({ ...prev, [opp.id]: '' }));
                    }
                  }}
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (remarkInput.trim()) {
                      addOpportunityRemark(opp.id, remarkInput);
                      setInlineRemarkText((prev) => ({ ...prev, [opp.id]: '' }));
                    }
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 shrink-0 transition whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Dedicated Opportunity Tasks Section */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                  <ListTodo className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Opportunity Tasks ({opp.tasks.length})</span>
                </h4>
                <button
                  onClick={() => handleOpenAddTaskModal(opp.id)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Add Task</span>
                </button>
              </div>

              {opp.tasks.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-500">No tasks scheduled for this deal.</p>
                  <button
                    onClick={() => handleOpenAddTaskModal(opp.id)}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Create First Follow-up Task
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-modern w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                        <th className="py-1.5 pr-2 font-semibold">Task</th>
                        <th className="py-1.5 px-2 font-semibold">Owner</th>
                        <th className="py-1.5 px-2 font-semibold">Due</th>
                        <th className="py-1.5 pl-2 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {opp.tasks.map((task) => (
                        <tr key={task.id} className="group hover:bg-slate-50/80">
                          <td className="py-2 pr-2">
                            <div
                              className={`font-medium break-words ${
                                task.status === 'Completed'
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Priority: {task.priority}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                            {task.assignedToName.split(' ')[0]}
                          </td>
                          <td className="py-2 px-2 font-mono tabular-nums text-[11px] text-slate-600 whitespace-nowrap">
                            {task.dueDate}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                updateOpportunityTaskStatus(
                                  opp.id,
                                  task.id,
                                  e.target.value as OpportunityTaskStatus
                                )
                              }
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                task.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : task.status === 'In Progress'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : task.status === 'Cancelled'
                                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {TASK_STATUSES.map((ts) => (
                                <option key={ts} value={ts}>
                                  {ts}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attachments Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-slate-400 flex items-center gap-1 shrink-0">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Files ({opp.attachments.length}):</span>
                </span>
                {opp.attachments.map((att) => (
                  <span
                    key={att.id}
                    className="text-[11px] font-mono text-slate-600 underline decoration-slate-300 truncate max-w-[180px]"
                    title={att.fileName}
                  >
                    {att.fileName}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const defaultName = `${opp.customerName.replace(/\s+/g, '_')}_Commercial_Quote_v${
                    opp.attachments.length + 1
                  }.pdf`;
                  addOpportunityAttachment(opp.id, defaultName, '1.4 MB');
                }}
                className="text-[11px] text-indigo-600 hover:underline font-medium whitespace-nowrap shrink-0"
              >
                + Attach Proposal PDF
              </button>
            </div>
          </div>
        </div>

        {/* Card Action Footer */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddTaskModal(opp.id)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Add Task</span>
            </button>
            {opp.stage !== 'Won' && !opp.isConvertedToOrder && (
              <button
                type="button"
                onClick={() => updateOpportunityStageAndStatus(opp.id, 'Won', 'Won', 100)}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Mark Deal Won</span>
              </button>
            )}
          </div>

          <div>
            {opp.isConvertedToOrder && opp.convertedSalesOrderId ? (
              <button
                type="button"
                onClick={() => onNavigateToOrder(opp.convertedSalesOrderId!)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>View Order {opp.convertedSalesOrderNumber}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenConvertModal(opp)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition whitespace-nowrap ${
                  opp.stage === 'Won'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Convert to Sales Order</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600 shrink-0" />
            <span className="truncate">Opportunity Management & Deal Desk</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Opportunity Card</span>
          </button>
        </div>
      </div>

      {/* Clickable KPI Strip with Modern Icon Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => {
            setStageFilter('ALL');
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            stageFilter === 'ALL' && statusFilter === 'ALL'
              ? 'bg-indigo-50/40 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Active Pipeline Deals</span>
            <div className="icon-depth icon-depth-slate w-7 h-7 shrink-0">
              <Briefcase className="w-3.5 h-3.5 text-slate-700" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 truncate">
            {openOpps.length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 truncate font-medium">
            Out of {opportunities.length} total · Show All →
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStageFilter('ALL');
            setStatusFilter('In Progress');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === 'In Progress'
              ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Open Pipeline Value</span>
            <div className="icon-depth icon-depth-indigo w-7 h-7 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-1 truncate"
            title={formatCurrency(totalPipelineValue)}
          >
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">Filter Active In-Progress →</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToReport?.('funnel')}
          className="text-left p-4 rounded-xl border border-slate-200/80 hover:bg-indigo-50/30 hover:border-indigo-300 transition cursor-pointer min-w-0 overflow-hidden card-depth"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Weighted Forecast</span>
            <div className="icon-depth icon-depth-cyan w-7 h-7 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 truncate"
            title={formatCurrency(weightedPipelineValue)}
          >
            {formatCurrency(weightedPipelineValue)}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1 truncate">
            Open Funnel Forecast Report →
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'On Hold' ? 'ALL' : 'On Hold');
            setStageFilter('ALL');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            statusFilter === 'On Hold'
              ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Deals On Hold</span>
            <div className="icon-depth icon-depth-amber w-7 h-7 shrink-0">
              <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1 truncate">
            {onHoldOpps.length}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 truncate">
            Filter On Hold Deals →
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setStageFilter(stageFilter === 'Won' ? 'ALL' : 'Won');
            setStatusFilter('ALL');
          }}
          className={`text-left p-4 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden card-depth ${
            stageFilter === 'Won'
              ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold block truncate">Won &amp; Open Tasks</span>
            <div className="icon-depth icon-depth-emerald w-7 h-7 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-1 truncate">
            {wonOpps.length} Won · {pendingTasksCount} Tasks
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 truncate">
            Filter Won Deals →
          </div>
        </button>
      </div>

      {/* Filter & View Switcher Bar — Zero Header Scrolling via Responsive Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search OPP#, deal name, customer, lead ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Pipeline Stages</option>
            {OPPORTUNITY_STAGES.map((st) => (
              <option key={st} value={st}>
                Stage: {st}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            {OPPORTUNITY_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="ALL">All Sales Owners</option>
            {users
              .filter((u) => u.department === 'Sales' || u.role === 'Super Admin')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  Owner: {u.name}
                </option>
              ))}
          </select>
        </div>

        {/* View Mode Switcher: Mobile Dropdown Selector + Desktop Flex Tabs (Zero Scrolling) */}
        <div className="w-full lg:w-auto">
          {/* Mobile / Compact Dropdown */}
          <div className="block md:hidden w-full">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              aria-label="Select Opportunity View Mode"
              className="w-full header-dropdown-select bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
            >
              <option value="cards">🗂️ Opportunity Cards View</option>
              <option value="kanban">📊 Stage Kanban Board</option>
              <option value="table">📋 List Register Table</option>
            </select>
          </div>

          {/* Desktop View Buttons */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'cards'
                  ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>Opportunity Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'kanban'
                  ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 shrink-0" />
              <span>Stage Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'table'
                  ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 shrink-0" />
              <span>List Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: OPPORTUNITY CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-6">
          {filteredOpportunities.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No opportunities match your filter</p>
              <p className="text-xs text-slate-500">
                Try clearing filters or convert a qualified lead into a new Opportunity Card.
              </p>
            </div>
          ) : (
            filteredOpportunities.map((opp) => renderOpportunityCard(opp))
          )}
        </div>
      )}

      {/* VIEW 2: STAGE KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {OPPORTUNITY_STAGES.map((stage) => {
            const stageOpps = filteredOpportunities.filter((o) => o.stage === stage);
            const stageTotal = stageOpps.reduce((sum, o) => sum + o.estimatedDealValue, 0);

            return (
              <div
                key={stage}
                className="w-80 shrink-0 bg-slate-200/60 rounded-xl p-3 flex flex-col max-h-[75vh]"
              >
                <div className="px-2 py-1.5 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{stage}</h3>
                    <div className="text-[11px] font-mono text-slate-500">
                      {stageOpps.length} deals · {formatCurrency(stageTotal)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-sm hover:border-indigo-300 transition space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-indigo-600">
                            {opp.opportunityNumber}
                          </span>
                          <span className="font-mono text-slate-500">{opp.probability}% Prob</span>
                        </div>

                        <button
                          onClick={() => setSelectedOppId(opp.id)}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 text-left line-clamp-2"
                        >
                          {opp.opportunityName}
                        </button>

                        <div className="text-[11px] text-slate-600 font-medium">
                          {opp.customerName} · {opp.contactPerson}
                        </div>

                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900 pt-0.5">
                          {formatCurrency(opp.estimatedDealValue)}
                        </div>
                      </div>

                      {/* Quick Stage & Status Switchers inside Kanban card */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="text-slate-400">Status:</span>
                          <select
                            value={opp.status}
                            onChange={(e) =>
                              updateOpportunityStageAndStatus(
                                opp.id,
                                opp.stage,
                                e.target.value as OpportunityStatus,
                                opp.probability
                              )
                            }
                            className="text-[11px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                          >
                            {OPPORTUNITY_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        {opp.remarks[0] && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded line-clamp-2">
                            "{opp.remarks[0].remark}"
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">
                            Tasks: {opp.tasks.filter((t) => t.status === 'Completed').length}/
                            {opp.tasks.length}
                          </span>
                          <button
                            onClick={() => setSelectedOppId(opp.id)}
                            className="text-[11px] font-semibold text-indigo-600 hover:underline"
                          >
                            Open Card →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: LIST / TABLE REGISTER VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Opportunity #</th>
                  <th className="py-3 px-4">Opportunity & Customer</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Deal Value</th>
                  <th className="py-3 px-4 text-center">Prob %</th>
                  <th className="py-3 px-4">Tasks & Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOppId(opp.id)}
                        className="font-mono font-bold text-indigo-600 hover:underline"
                      >
                        {opp.opportunityNumber}
                      </button>
                      {opp.leadNumber && (
                        <div className="text-[11px] font-mono text-slate-400">
                          Ref: {opp.leadNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{opp.opportunityName}</div>
                      <div className="text-slate-500">
                        {opp.customerName} · {opp.contactPerson} ({opp.stateCode})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={opp.stage}
                        onChange={(e) =>
                          updateOpportunityStageAndStatus(
                            opp.id,
                            e.target.value as OpportunityStage,
                            opp.status
                          )
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded border ${getStageBadgeStyle(
                          opp.stage
                        )}`}
                      >
                        {OPPORTUNITY_STAGES.map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-800">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={opp.status}
                        onChange={(e) =>
                          updateOpportunityStageAndStatus(
                            opp.id,
                            opp.stage,
                            e.target.value as OpportunityStatus,
                            opp.probability
                          )
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusBadgeStyle(
                          opp.status
                        )}`}
                      >
                        {OPPORTUNITY_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-800">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {formatCurrency(opp.estimatedDealValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                      {opp.probability}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">
                        {opp.tasks.filter((t) => t.status === 'Pending').length} Pending Tasks
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Follow-up: {opp.nextFollowUp || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedOppId(opp.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        Card
                      </button>
                      {opp.isConvertedToOrder && opp.convertedSalesOrderId ? (
                        <button
                          onClick={() => onNavigateToOrder(opp.convertedSalesOrderId!)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                        >
                          {opp.convertedSalesOrderNumber}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenConvertModal(opp)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                        >
                          Convert to SO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: FULL OPPORTUNITY CARD INSPECTOR */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Opportunity Card Snapshot — {selectedOpportunity.opportunityNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOppId(null)}
                className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderOpportunityCard(selectedOpportunity, true)}
          </div>
        </div>
      )}

      {/* MODAL 2: ADD OPPORTUNITY TASK MODAL */}
      {taskModalOppId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-600" />
                <span>Add Opportunity Task</span>
              </h3>
              <button
                onClick={() => setTaskModalOppId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Send revised proposal / Follow up with CFO"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specific deliverables or agenda items..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {crmVisibleUsers(users).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reminder Date</label>
                  <input
                    type="date"
                    value={newTaskReminder}
                    onChange={(e) => setNewTaskReminder(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskModalOppId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW OPPORTUNITY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Opportunity Card</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunitySubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100">
                <label className="block font-semibold text-indigo-950 mb-1">
                  Auto-Populate from Qualified Lead (Optional)
                </label>
                <select
                  value={selectedLeadIdForNew}
                  onChange={(e) => handleSelectLeadForNewOpp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-slate-800"
                >
                  <option value="">-- Manual Entry / Select a Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.leadNumber} — {l.companyName} ({formatCurrency(l.estimatedValue)}) [{l.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Opportunity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Multi-Plant ERP Rollout & Cloud Hosting"
                    value={newOppName}
                    onChange={(e) => setNewOppName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOppCustomerName}
                    onChange={(e) => setNewOppCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State (Auto GST Code: {getStateCode(newOppState)})
                  </label>
                  <select
                    value={newOppState}
                    onChange={(e) => setNewOppState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.stateName}>
                        {s.stateName} ({s.stateCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={newOppContactPerson}
                    onChange={(e) => setNewOppContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Mobile</label>
                  <input
                    type="text"
                    value={newOppContactMobile}
                    onChange={(e) => setNewOppContactMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Deal Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newOppValue}
                    onChange={(e) => setNewOppValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Closing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newOppCloseDate}
                    onChange={(e) => setNewOppCloseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={newOppStage}
                    onChange={(e) => setNewOppStage(e.target.value as OpportunityStage)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {OPPORTUNITY_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newOppStatus}
                    onChange={(e) => setNewOppStatus(e.target.value as OpportunityStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {OPPORTUNITY_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Owner</label>
                  <select
                    value={newOppOwnerId}
                    onChange={(e) => setNewOppOwnerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {crmVisibleUsers(users).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Follow-up</label>
                  <input
                    type="date"
                    value={newOppNextFollowUp}
                    onChange={(e) => setNewOppNextFollowUp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Timeline Remark
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Requirement analysis completed; demo scheduled with technical team."
                    value={newOppRemark}
                    onChange={(e) => setNewOppRemark(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Create Opportunity Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONVERT OPPORTUNITY TO SALES ORDER MODAL */}
      {convertModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-indigo-600">
                  {convertModalOpp.opportunityNumber}{' '}
                  {convertModalOpp.leadNumber ? `(From ${convertModalOpp.leadNumber})` : ''} → SALES ORDER
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Convert Won Opportunity to Sales Order & Milestone Schedule
                </h3>
              </div>
              <button
                onClick={() => setConvertModalOpp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-slate-400 text-[11px]">Customer</div>
                  <div className="font-bold text-slate-900">{convertModalOpp.customerName}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Billing State & GST Code</div>
                  <div className="font-bold text-slate-900">
                    {convertModalOpp.state} ({convertModalOpp.stateCode}) —{' '}
                    {convertModalOpp.stateCode === '07' ? 'CGST + SGST' : 'IGST'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Sales Owner</div>
                  <div className="font-bold text-slate-900">{convertModalOpp.salesOwnerName}</div>
                </div>
              </div>

              {!convertModalOpp.customerId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer Segment
                    </label>
                    <select
                      value={convCustomerType}
                      onChange={(e) => setConvCustomerType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 bg-white"
                    >
                      <option value="Enterprise">Enterprise</option>
                      <option value="SME">SME</option>
                      <option value="Government">Government</option>
                      <option value="Startup">Startup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer GSTIN
                    </label>
                    <input
                      type="text"
                      placeholder={`${convertModalOpp.stateCode}AAACP1234A1Z5`}
                      value={convGstin}
                      onChange={(e) => setConvGstin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      value={convCreditLimit}
                      onChange={(e) => setConvCreditLimit(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Order Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Sales Order Line Items (Auto-populated from Opportunity)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setConvOrderItems((prev) => [
                        ...prev,
                        { productId: products[0].id, quantity: 1, discountPercent: 0 },
                      ])
                    }
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                {convOrderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          setConvOrderItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, productId: e.target.value } : row
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} ({formatCurrency(p.sellingPrice)} + {p.gstRate}% GST)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setConvOrderItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, quantity: Number(e.target.value) } : row
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white font-mono"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={item.discountPercent}
                        onChange={(e) =>
                          setConvOrderItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, discountPercent: Number(e.target.value) } : row
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white font-mono"
                        placeholder="Disc %"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {convOrderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setConvOrderItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={convPaymentTermsId}
                    onChange={(e) => setConvPaymentTermsId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {paymentTerms.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Milestone Split % (Must = 100%)
                  </label>
                  <input
                    type="text"
                    value={convMilestoneSplit}
                    onChange={(e) => setConvMilestoneSplit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono"
                    placeholder="30,40,20,10"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={convDeliveryDate}
                    onChange={(e) => setConvDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertModalOpp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Generate Sales Order & Milestones</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
