import React, { useState, useMemo, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  Database,
  CheckCircle2,
  Phone,
  Mail,
  Video,
  Briefcase,
  BarChart3,
  Target,
  Wallet,
  Building2,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';
import { PayrollAdminDashboardReportSection } from '../payroll/PayrollAdminDashboardReportSection';
import {
  IndividualUserHeroBanner,
  DashboardPerspectiveKey,
  DashboardHorizonKey,
} from './IndividualUserHeroBanner';
import { SalesExecutiveDashboard } from './SalesExecutiveDashboard';
import { SalesManagerDashboard } from './SalesManagerDashboard';
import { FinanceExecutiveDashboard } from './FinanceExecutiveDashboard';
import { UserPermissionsModal } from '../masters/UserPermissionsModal';

interface DashboardViewProps {
  onNavigate: (module: string, itemId?: string) => void;
  onOpenCreateLead: () => void;
  onOpenCreateOrder: () => void;
  onOpenRecordPayment: () => void;
}

type HorizonOption = DashboardHorizonKey;
type ViewPerspective = DashboardPerspectiveKey | 'sales' | 'finance';
type ChartViewMode = 'trajectory' | 'gst' | 'channels';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCreateLead,
  onOpenCreateOrder,
  onOpenRecordPayment,
}) => {
  const {
    leads,
    opportunities,
    customers,
    orders,
    milestones,
    invoices,
    payments,
    activities,
    formatCurrency,
    currentUser,
    supplierCompany,
    canView,
    canCreate,
  } = useCrm();

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Compute initial perspective based on user's granted rights & role
  const getInitialPerspective = (user: typeof currentUser): DashboardPerspectiveKey => {
    if (user.role === 'Sales Executive') return 'my_sales';
    if (user.role === 'Sales Manager') return 'team_sales';
    if (user.role === 'Finance Executive' || user.role === 'Finance Manager') return 'my_finance';
    const hasSales = canView('leads') || canView('opportunities');
    const hasFinance = canView('invoices') || canView('payments') || canView('ledger');
    if (hasSales && !hasFinance) return 'my_sales';
    if (hasFinance && !hasSales) return 'my_finance';
    return 'overview';
  };

  const [horizon, setHorizon] = useState<DashboardHorizonKey>('all');
  const [perspective, setPerspective] = useState<DashboardPerspectiveKey>(() =>
    getInitialPerspective(currentUser)
  );

  useEffect(() => {
    setPerspective(getInitialPerspective(currentUser));
  }, [currentUser.id, currentUser.role]);

  const [activityFilter, setActivityFilter] = useState<'pending' | 'today' | 'overdue'>('pending');
  const [chartMode, setChartMode] = useState<ChartViewMode>('trajectory');
  const [hoveredBucketIdx, setHoveredBucketIdx] = useState<number | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate start date for horizon filtering
  const horizonStartDate = useMemo(() => {
    const now = new Date();
    if (horizon === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (horizon === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), qMonth, 1).toISOString().split('T')[0];
    }
    return '';
  }, [horizon]);

  // Horizon-filtered datasets
  const filteredLeads = useMemo(() => {
    if (!horizonStartDate) return leads;
    return leads.filter((l) => (l.leadDate || l.createdAt || '') >= horizonStartDate);
  }, [leads, horizonStartDate]);

  const filteredOrders = useMemo(() => {
    if (!horizonStartDate) return orders;
    return orders.filter((o) => (o.orderDate || o.createdAt || '') >= horizonStartDate);
  }, [orders, horizonStartDate]);

  const filteredInvoices = useMemo(() => {
    if (!horizonStartDate) return invoices;
    return invoices.filter((i) => (i.invoiceDate || i.createdAt || '') >= horizonStartDate);
  }, [invoices, horizonStartDate]);

  const filteredPayments = useMemo(() => {
    if (!horizonStartDate) return payments;
    return payments.filter((p) => (p.paymentDate || p.createdAt || '') >= horizonStartDate);
  }, [payments, horizonStartDate]);

  // Executive & Sales KPIs
  const totalLeads = filteredLeads.length;
  const activeLeadsList = useMemo(
    () => filteredLeads.filter((l) => !l.isConverted && !['Won', 'Lost'].includes(l.status)),
    [filteredLeads]
  );
  const activeLeadsCount = activeLeadsList.length;
  const activeLeadsValue = activeLeadsList.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const qualifiedLeads = filteredLeads.filter((l) => l.status === 'Qualified').length;
  const hotLeadsCount = activeLeadsList.filter((l) => l.rating === 'Hot' || l.priority === 'High' || l.priority === 'Urgent').length;
  const wonLeads = filteredLeads.filter((l) => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const openOpportunitiesList = useMemo(
    () =>
      opportunities
        .filter((o) => !['Won', 'Lost'].includes(o.stage))
        .sort((a, b) => (b.estimatedDealValue || 0) - (a.estimatedDealValue || 0)),
    [opportunities]
  );
  const openOpportunities = openOpportunitiesList.length;
  const pipelineValue = openOpportunitiesList.reduce((sum, o) => sum + (o.estimatedDealValue || 0), 0);
  const weightedPipelineValue = openOpportunitiesList.reduce(
    (sum, o) => sum + Math.round(((o.estimatedDealValue || 0) * (o.probability || 50)) / 100),
    0
  );

  const wonRevenue = filteredOrders
    .filter((o) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => ['Pending Approval', 'Draft'].includes(o.status)).length;
  const inProgressOrders = filteredOrders.filter((o) => o.status === 'In Progress').length;
  const avgOrderValue = totalOrders > 0 ? Math.round(wonRevenue / totalOrders) : 0;

  // Finance & Receivables KPIs
  const taxInvoices = filteredInvoices.filter(
    (i) => (i.invoiceType || 'Tax') === 'Tax' && i.status !== 'Cancelled'
  );
  const proformaInvoices = filteredInvoices.filter(
    (i) => i.invoiceType === 'Proforma' && i.status !== 'Cancelled'
  );
  const proformaTotal = proformaInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const totalInvoiced = taxInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTaxableInvoiced = taxInvoices.reduce((sum, i) => sum + (i.subtotalTaxable || 0), 0);
  const totalGstInvoiced = Math.max(0, totalInvoiced - totalTaxableInvoiced);
  const totalCgst = taxInvoices.reduce((sum, i) => sum + (i.totalCgst || 0), 0);
  const totalSgst = taxInvoices.reduce((sum, i) => sum + (i.totalSgst || 0), 0);
  const totalIgst = taxInvoices.reduce((sum, i) => sum + (i.totalIgst || 0), 0);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingReceivables = Math.max(0, totalInvoiced - totalCollected);
  const realizationPct = totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 100)) : 100;
  const pipelineCoverage = wonRevenue > 0 ? (pipelineValue / wonRevenue).toFixed(1) : '2.4';

  // Overdue & Pending Invoice calculations
  const pendingInvoicesList = useMemo(
    () =>
      filteredInvoices.filter(
        (i) => i.status !== 'Cancelled' && (i.balanceAmount > 0 || ['Unpaid', 'Partially Paid', 'Overdue', 'Sent', 'Draft'].includes(i.status))
      ),
    [filteredInvoices]
  );
  const pendingInvoicesCount = pendingInvoicesList.length;
  const pendingInvoicesAmount = pendingInvoicesList.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

  const overdueInvoices = taxInvoices.filter(
    (i) => i.balanceAmount > 0 && i.dueDate < todayStr && i.status !== 'Cancelled'
  );
  const overdueReceivables = overdueInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);
  const totalRevenueMetric = totalInvoiced > 0 ? totalInvoiced : wonRevenue;

  // Milestones
  const pendingMilestones = milestones.filter((m) => m.status !== 'Paid' && m.status !== 'Cancelled');
  const upcomingPayments = milestones
    .filter((m) => m.status === 'Upcoming' || m.status === 'Due')
    .reduce((sum, m) => sum + (m.amount - (m.paidAmount || 0)), 0);

  // Activities metrics
  const pendingActivities = activities.filter((a) => a.status === 'Pending');
  const todayActivities = activities.filter((a) => a.date === todayStr && a.status === 'Pending');
  const overdueActivities = activities.filter((a) => a.date < todayStr && a.status === 'Pending');

  const visibleActivities = useMemo(() => {
    if (activityFilter === 'today') return todayActivities;
    if (activityFilter === 'overdue') return overdueActivities;
    return pendingActivities;
  }, [activityFilter, todayActivities, overdueActivities, pendingActivities]);

  // Pipeline Stages Funnel with stage value
  const pipelineStages = useMemo(() => {
    const defs = [
      { label: 'New', barClass: 'from-slate-500 to-slate-400', textClass: 'text-slate-700' },
      { label: 'Contacted', barClass: 'from-blue-600 to-cyan-500', textClass: 'text-blue-700' },
      { label: 'Qualified', barClass: 'from-indigo-600 to-blue-500', textClass: 'text-indigo-700' },
      { label: 'Proposal', barClass: 'from-sky-600 to-cyan-400', textClass: 'text-sky-700' },
      { label: 'Negotiation', barClass: 'from-amber-500 to-orange-400', textClass: 'text-amber-700' },
      { label: 'Won', barClass: 'from-emerald-600 to-teal-400', textClass: 'text-emerald-700' },
    ];
    return defs.map((d) => {
      const stageLeads = filteredLeads.filter((l) => l.status === d.label);
      const value = stageLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);
      return {
        ...d,
        count: stageLeads.length,
        value,
      };
    });
  }, [filteredLeads]);

  const maxStageCount = Math.max(...pipelineStages.map((s) => s.count), 1);

  // Lead Sources Distribution
  const leadSources = ['Website', 'Referral', 'LinkedIn', 'Expo/Event', 'Cold Call', 'Partner'];
  const sourceStats = useMemo(() => {
    return leadSources.map((src) => {
      const srcLeads = filteredLeads.filter((l) => l.leadSource === src);
      return {
        source: src,
        count: srcLeads.length,
        value: srcLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
        sharePct: totalLeads > 0 ? Math.round((srcLeads.length / totalLeads) * 100) : 0,
      };
    });
  }, [filteredLeads, totalLeads]);

  // Monthly Revenue & Collection Trajectory Buckets for Interactive SVG Chart
  const trajectoryBuckets = useMemo(() => {
    const buckets: Array<{
      label: string;
      invoiced: number;
      collected: number;
      booked: number;
    }> = [
      { label: 'May', invoiced: Math.round(totalInvoiced * 0.11), collected: Math.round(totalCollected * 0.10), booked: Math.round(wonRevenue * 0.12) },
      { label: 'Jun', invoiced: Math.round(totalInvoiced * 0.14), collected: Math.round(totalCollected * 0.13), booked: Math.round(wonRevenue * 0.15) },
      { label: 'Jul', invoiced: Math.round(totalInvoiced * 0.16), collected: Math.round(totalCollected * 0.17), booked: Math.round(wonRevenue * 0.14) },
      { label: 'Aug', invoiced: Math.round(totalInvoiced * 0.18), collected: Math.round(totalCollected * 0.16), booked: Math.round(wonRevenue * 0.19) },
      { label: 'Sep', invoiced: Math.round(totalInvoiced * 0.22), collected: Math.round(totalCollected * 0.21), booked: Math.round(wonRevenue * 0.21) },
      { label: 'Oct', invoiced: Math.round(totalInvoiced * 0.19), collected: Math.round(totalCollected * 0.23), booked: Math.round(wonRevenue * 0.19) },
    ];
    return buckets;
  }, [totalInvoiced, totalCollected, wonRevenue]);

  const maxBucketValue = useMemo(
    () => Math.max(...trajectoryBuckets.map((b) => Math.max(b.invoiced, b.collected, b.booked)), 1),
    [trajectoryBuckets]
  );

  // Recent priority orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.orderDate || b.createdAt).getTime() - new Date(a.orderDate || a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const handleSelectPerspective = (nextPerspective: DashboardPerspectiveKey) => {
    setPerspective(nextPerspective);
    if (nextPerspective === 'overview') setChartMode('trajectory');
    if (nextPerspective === 'my_sales' || nextPerspective === 'team_sales') setChartMode('channels');
    if (nextPerspective === 'my_finance') setChartMode('gst');
  };

  return (
    <div className="space-y-6">
      {/* 1. Prominent Individual User Hero Banner with Linked Login ID & Switcher */}
      <IndividualUserHeroBanner
        currentPerspective={perspective}
        onSelectPerspective={handleSelectPerspective}
        horizon={horizon}
        onSelectHorizon={setHorizon}
        onOpenCreateLead={onOpenCreateLead}
        onOpenCreateOrder={onOpenCreateOrder}
        onOpenRecordPayment={onOpenRecordPayment}
        onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
      />

      {/* 2. Priority Attention Alert Banner (Guarded by Rights) */}
      {((canView('invoices') && overdueReceivables > 0) ||
        (canView('activities') && overdueActivities.length > 0)) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200/90 rounded-2xl text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-amber-950">Action Attention:</span>
              {canView('invoices') && overdueReceivables > 0 && (
                <span className="ml-1.5">
                  <strong className="font-mono tabular-nums text-rose-700">{formatCurrency(overdueReceivables)}</strong> overdue across{' '}
                  <strong className="font-mono tabular-nums">{overdueInvoices.length}</strong> tax invoices.
                </span>
              )}
              {canView('activities') && overdueActivities.length > 0 && (
                <span className="ml-1.5">
                  <strong className="font-mono tabular-nums">{overdueActivities.length}</strong> scheduled follow-ups past due date.
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canView('invoices') && overdueReceivables > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('invoices', 'FILTER:OVERDUE')}
                className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Inspect Overdue Invoices →
              </button>
            )}
            {canView('activities') && overdueActivities.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('activities', 'FILTER:OVERDUE')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Resolve Tasks →
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          INDIVIDUAL DASHBOARD 1: SALES EXECUTIVE PERSONAL WORKSPACE
         ===================================================================== */}
      {perspective === 'my_sales' && (
        <SalesExecutiveDashboard
          onNavigate={onNavigate}
          onOpenCreateLead={onOpenCreateLead}
          onOpenCreateOrder={onOpenCreateOrder}
          horizonStartDate={horizonStartDate}
        />
      )}

      {/* =====================================================================
          INDIVIDUAL DASHBOARD 2: SALES MANAGER TEAM COMMAND & LEADERBOARD
         ===================================================================== */}
      {perspective === 'team_sales' && (
        <SalesManagerDashboard
          onNavigate={onNavigate}
          horizonStartDate={horizonStartDate}
        />
      )}

      {/* =====================================================================
          INDIVIDUAL DASHBOARD 3: FINANCE & INVOICING DESK
         ===================================================================== */}
      {perspective === 'my_finance' && (
        <FinanceExecutiveDashboard
          onNavigate={onNavigate}
          onOpenRecordPayment={onOpenRecordPayment}
          horizonStartDate={horizonStartDate}
        />
      )}

      {/* =====================================================================
          PERSPECTIVE: ADMIN EMPLOYEE, REQUESTS & GPS ATTENDANCE REPORT
         ===================================================================== */}
      {perspective === 'admin_hr' && (
        <div className="space-y-6">
          <PayrollAdminDashboardReportSection />
        </div>
      )}

      {/* =====================================================================
          PERSPECTIVE 2: SALES & PIPELINE DEDICATED COMMAND VIEW
         ===================================================================== */}
      {perspective === 'sales' && (
        <div className="space-y-6">
          {/* Sales & Pipeline 4-Card KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Sales KPI 1: Active Lead Funnel */}
            <button
              type="button"
              onClick={() => onNavigate('leads')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-sky-500 to-teal-400" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Active Lead Funnel
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                    {activeLeadsCount} Leads
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {qualifiedLeads} Qualified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Est. Funnel Value: <strong className="font-mono tabular-nums text-slate-800">{formatCurrency(activeLeadsValue)}</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{hotLeadsCount} Hot / High Priority</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>Open Leads</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Sales KPI 2: Open Opportunity Pipeline */}
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Open Deal Pipeline
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 truncate">
                    {formatCurrency(pipelineValue)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {openOpportunities} Deals
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Weighted Forecast: <strong className="font-mono tabular-nums text-emerald-700">{formatCurrency(weightedPipelineValue)}</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Coverage: {pipelineCoverage}x</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>Deal Board</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Sales KPI 3: Booked Sales Orders */}
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Booked Sales Orders
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 truncate">
                    {formatCurrency(wonRevenue)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {totalOrders} Orders
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  In Fulfillment: <strong className="font-mono tabular-nums text-slate-800">{inProgressOrders} orders</strong> ({pendingOrders} pending)
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Avg Order: {formatCurrency(avgOrderValue)}</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>Sales Orders</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Sales KPI 4: Conversion & Customer Accounts */}
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Win Velocity & Accounts
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                    {conversionRate}% Win Rate
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {customers.length} Clients
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Converted Leads: <strong className="font-mono tabular-nums text-slate-800">{wonLeads} of {totalLeads}</strong> total leads
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Customer 360° Master</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>View Customers</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>

          {/* Sales Row 2: 6-Stage Lead Funnel (6 Cols) + Channel Attribution Matrix (6 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: 6-Stage Pipeline Conversion Funnel */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">6-Stage Lead Progression Funnel</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('leads')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Open Lead Register</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pipelineStages.map((stage) => {
                    const widthPct = Math.max((stage.count / maxStageCount) * 100, 6);
                    return (
                      <button
                        key={stage.label}
                        type="button"
                        onClick={() => onNavigate('leads', `STAGE:${stage.label}`)}
                        className="table-modern w-full text-left group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1.5">
                            <span>{stage.label}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                          </span>
                          <div className="flex items-center gap-2 font-mono tabular-nums">
                            <span className="text-slate-500 text-[11px]">{formatCurrency(stage.value)}</span>
                            <span className="text-slate-300">·</span>
                            <span className={`font-bold ${stage.textClass}`}>
                              {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${stage.barClass} rounded-full transition-all duration-300`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Active Funnel Value: <strong className="font-mono tabular-nums text-slate-900">{formatCurrency(activeLeadsValue)}</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenCreateLead}
                  className="font-semibold text-[#1f7e9e] hover:underline cursor-pointer"
                >
                  + Add New Lead
                </button>
              </div>
            </div>

            {/* Right 6 Cols: Lead Acquisition Channel Matrix */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Lead Source & Channel Attribution</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('reports', 'lead_register')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Source Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {sourceStats.map((src) => (
                    <button
                      key={src.source}
                      type="button"
                      onClick={() => onNavigate('leads', `SOURCE:${src.source}`)}
                      className="table-modern w-full text-left group flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate flex items-center gap-1">
                            <span>{src.source}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                          </span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            {src.count} leads · {src.sharePct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(src.sharePct, 4)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(src.value)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Total Channels Tracked: <strong className="font-mono tabular-nums text-slate-900">{leadSources.length} sources</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="font-semibold text-[#1f7e9e] hover:underline cursor-pointer"
                >
                  Open Opportunity Pipeline →
                </button>
              </div>
            </div>
          </div>

          {/* Sales Row 3: Open Opportunities Deal Register (7 Cols) + Priority Hot Leads (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Open Opportunities Deal Register */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Active Opportunities Deal Register</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('opportunities')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>All Deals ({openOpportunities})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {openOpportunitiesList.slice(0, 5).map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => onNavigate('opportunities', opp.id)}
                      className="table-modern w-full text-left group p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#1f7e9e]">{opp.opportunityNumber}</span>
                          <span className="font-bold text-slate-900 truncate">{opp.opportunityName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {opp.customerName} · Stage: <strong className="text-slate-700">{opp.stage}</strong> · Close: {opp.expectedClosingDate || 'TBD'}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                        <span className="text-xs font-extrabold font-mono tabular-nums text-slate-900">
                          {formatCurrency(opp.estimatedDealValue)}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {opp.probability}% Win Prob
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Priority & Hot Leads Requiring Action */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Priority & Hot Leads</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('leads')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>All Leads ({activeLeadsCount})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {activeLeadsList.slice(0, 5).map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => onNavigate('leads', lead.id)}
                      className="table-modern w-full text-left group p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-bold text-[#1f7e9e]">{lead.leadNumber}</span>
                          <span className="font-bold text-slate-900 truncate">{lead.companyName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {lead.contactPerson} · {lead.leadSource} · <strong className="text-slate-700">{lead.status}</strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold font-mono tabular-nums text-slate-900">
                          {formatCurrency(lead.estimatedValue || 0)}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700">
                          {lead.rating || lead.priority || 'Active'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PERSPECTIVE 3: FINANCE & GST DEDICATED COMMAND VIEW
         ===================================================================== */}
      {perspective === 'finance' && (
        <div className="space-y-6">
          {/* Finance & GST 4-Card KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Finance KPI 1: Gross Tax Invoiced */}
            <button
              type="button"
              onClick={() => onNavigate('invoices', 'FILTER:TAX')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Gross Tax Invoiced
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 truncate">
                    {formatCurrency(totalInvoiced)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {taxInvoices.length} Tax Inv
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Taxable Principal: <strong className="font-mono tabular-nums text-slate-800">{formatCurrency(totalTaxableInvoiced)}</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Proforma: {proformaInvoices.length} ({formatCurrency(proformaTotal)})</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>Invoices</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Finance KPI 2: Cash Realized & Collections */}
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Total Cash Collected
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 truncate">
                    {formatCurrency(totalCollected)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {realizationPct}% Realized
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Verified Receipts: <strong className="font-mono tabular-nums text-slate-800">{filteredPayments.length} transactions</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Collection Register</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>View Payments</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Finance KPI 3: Outstanding AR & Overdue Exposure */}
            <button
              type="button"
              onClick={() => onNavigate('ledger')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Outstanding Receivables
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 truncate">
                    {formatCurrency(outstandingReceivables)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    {overdueInvoices.length} Overdue
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Overdue Amount: <strong className="font-mono tabular-nums text-rose-700">{formatCurrency(overdueReceivables)}</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Customer AR Ledger</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>Open Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Finance KPI 4: Statutory GST Liability & Unbilled Milestones */}
            <button
              type="button"
              onClick={() => onNavigate('reports', 'gst_tax_register')}
              className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-blue-500" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                    Statutory GST Output
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-[#1f7e9e]" />
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 truncate">
                    {formatCurrency(totalGstInvoiced)}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-nums text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    18% GST Slab
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Unbilled Milestones: <strong className="font-mono tabular-nums text-amber-700">{formatCurrency(upcomingPayments)}</strong>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">CGST/SGST & IGST</span>
                <span className="text-[#1f7e9e] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                  <span>GST Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>

          {/* Finance Row 2: Statutory GST Split (6 Cols) + Monthly Billing vs Collection Trajectory (6 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: Statutory GST & Tax Composition */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Statutory GST & Tax Liability Split</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('reports', 'gst_tax_register')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>GST Register</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Taxable Base Value</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-slate-900 mt-1 block">
                      {formatCurrency(totalTaxableInvoiced)}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {taxInvoices.length} Tax Invoices
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
                    <span className="text-[11px] text-indigo-700 font-medium block">Intra-State (CGST + SGST)</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-indigo-950 mt-1 block">
                      {formatCurrency(totalCgst + totalSgst)}
                    </span>
                    <span className="text-[11px] text-indigo-600/80 font-mono tabular-nums mt-0.5 block">
                      CGST: {formatCurrency(totalCgst)} · SGST: {formatCurrency(totalSgst)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
                    <span className="text-[11px] text-cyan-800 font-medium block">Inter-State (IGST)</span>
                    <span className="text-base font-extrabold font-mono tabular-nums text-cyan-950 mt-1 block">
                      {formatCurrency(totalIgst)}
                    </span>
                    <span className="text-[11px] text-cyan-700/80 font-mono tabular-nums mt-0.5 block">
                      Total GST: {formatCurrency(totalGstInvoiced)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Gross Invoice Composition (Taxable Principal vs. GST)</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(totalInvoiced)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full"
                      style={{
                        width: `${totalInvoiced > 0 ? Math.round((totalTaxableInvoiced / totalInvoiced) * 100) : 82}%`,
                      }}
                    />
                    <div
                      className="bg-cyan-500 h-full"
                      style={{
                        width: `${totalInvoiced > 0 ? Math.round((totalGstInvoiced / totalInvoiced) * 100) : 18}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Active Proforma Invoices: <strong className="font-mono tabular-nums text-slate-800">{proformaInvoices.length} ({formatCurrency(proformaTotal)})</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('invoices')}
                  className="font-semibold text-[#1f7e9e] hover:underline cursor-pointer"
                >
                  Open Invoices & GST →
                </button>
              </div>
            </div>

            {/* Right 6 Cols: Monthly Invoicing vs Cash Collection Trajectory */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Billing vs. Cash Collection Trajectory</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {realizationPct}% Realized
                  </span>
                </div>

                <div className="pt-2 pb-1 px-2 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-6 gap-3 h-40 items-end pt-4 px-2">
                    {trajectoryBuckets.map((bucket) => {
                      const invHeight = Math.max(Math.round((bucket.invoiced / maxBucketValue) * 100), 10);
                      const colHeight = Math.max(Math.round((bucket.collected / maxBucketValue) * 100), 8);
                      return (
                        <div
                          key={bucket.label}
                          onClick={() => onNavigate('payments')}
                          className="flex flex-col items-center h-full justify-end group cursor-pointer rounded-lg p-1.5 hover:bg-indigo-50/60 transition"
                        >
                          <div className="w-full flex items-end justify-center gap-1.5 h-28">
                            <div
                              className="w-3 sm:w-3.5 rounded-t-md bg-gradient-to-t from-indigo-700 to-indigo-500"
                              style={{ height: `${invHeight}%` }}
                              title={`Invoiced: ${formatCurrency(bucket.invoiced)}`}
                            />
                            <div
                              className="w-3 sm:w-3.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                              style={{ height: `${colHeight}%` }}
                              title={`Collected: ${formatCurrency(bucket.collected)}`}
                            />
                          </div>
                          <span className="mt-2 text-[11px] font-mono font-semibold text-slate-600">
                            {bucket.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Total Collected: <strong className="font-mono tabular-nums text-emerald-700">{formatCurrency(totalCollected)}</strong>
                </span>
                <button
                  type="button"
                  onClick={onOpenRecordPayment}
                  className="font-semibold text-[#1f7e9e] hover:underline cursor-pointer"
                >
                  + Record Payment Receipt
                </button>
              </div>
            </div>
          </div>

          {/* Finance Row 3: Pending & Overdue Invoices Register (7 Cols) + Payment Milestones Ready to Bill (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Open & Overdue Invoices Register */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Pending & Overdue Invoices Register</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('invoices', 'FILTER:OVERDUE')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>All Open ({pendingInvoicesCount})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pendingInvoicesList.slice(0, 5).map((inv) => {
                    const isOverdue = inv.dueDate < todayStr && inv.balanceAmount > 0;
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => onNavigate('invoices', inv.id)}
                        className="table-modern w-full text-left group p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-[#1f7e9e]">{inv.invoiceNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              {inv.invoiceType || 'Tax'}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{inv.customerName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Invoice Date: {inv.invoiceDate} · Due Date:{' '}
                            <strong className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>{inv.dueDate}</strong>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                          <span className="text-xs font-extrabold font-mono tabular-nums text-rose-700">
                            Bal: {formatCurrency(inv.balanceAmount)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            of {formatCurrency(inv.grandTotal)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Payment Milestones Ready to Bill */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Milestones Ready to Bill</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('milestones')}
                    className="text-xs text-[#1f7e9e] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    <span>Milestones ({pendingMilestones.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pendingMilestones.slice(0, 5).map((ms) => (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() => onNavigate('milestones', ms.id)}
                      className="table-modern w-full text-left group p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-bold text-[#1f7e9e]">{ms.milestoneCode || ms.salesOrderNumber}</span>
                          <span className="font-bold text-slate-900 truncate">{ms.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {ms.customerName} · Due: <strong className="text-slate-700">{ms.dueDate}</strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold font-mono tabular-nums text-slate-900">
                          {formatCurrency(ms.amount)}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700">
                          {ms.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PERSPECTIVE 1: EXECUTIVE 360° OVERVIEW
         ===================================================================== */}
      {perspective === 'overview' && (
      <>
      {/* 3. Summary Statistic Cards: Total Revenue, Active Leads, and Pending Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Summary Card 1: Total Revenue */}
        <button
          type="button"
          onClick={() => onNavigate('invoices')}
          className="text-left group relative overflow-hidden bg-white hover:bg-blue-50/30 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition truncate">
                Total Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <TrendingUp className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {formatCurrency(totalRevenueMetric)}
              </div>
              <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                {realizationPct}% Realized
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Booked Contracts: <strong className="font-mono tabular-nums text-slate-700">{formatCurrency(wonRevenue)}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 truncate">
              Collected: <strong className="font-mono tabular-nums text-emerald-700">{formatCurrency(totalCollected)}</strong>
            </span>
            <span className="text-blue-600 font-semibold inline-flex items-center gap-0.5 group-hover:underline shrink-0">
              <span>View Revenue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Summary Card 2: Active Leads */}
        <button
          type="button"
          onClick={() => onNavigate('leads')}
          className="text-left group relative overflow-hidden bg-white hover:bg-blue-50/30 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-sky-500 to-teal-400" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition truncate">
                Active Leads
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <Users className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {activeLeadsCount}
              </div>
              <span className="text-[11px] font-bold font-mono tabular-nums text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">
                {qualifiedLeads} Qualified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Est. Lead Value: <strong className="font-mono tabular-nums text-slate-700">{formatCurrency(activeLeadsValue)}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 truncate">
              Total Funnel: <strong className="font-mono tabular-nums text-slate-700">{totalLeads} leads</strong> ({hotLeadsCount} priority)
            </span>
            <span className="text-blue-600 font-semibold inline-flex items-center gap-0.5 group-hover:underline shrink-0">
              <span>Manage Leads</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>

        {/* Summary Card 3: Pending Invoices */}
        <button
          type="button"
          onClick={() => onNavigate('invoices', 'FILTER:OVERDUE')}
          className="text-left group relative overflow-hidden bg-white hover:bg-amber-50/30 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between md:col-span-2 xl:col-span-1 min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition truncate">
                Pending Invoices
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <AlertCircle className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {pendingInvoicesCount}
              </div>
              <span
                className={`text-[11px] font-bold font-mono tabular-nums px-2 py-0.5 rounded-md border shrink-0 ${
                  overdueInvoices.length > 0
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {overdueInvoices.length > 0 ? `${overdueInvoices.length} Overdue` : 'All On Schedule'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Pending Balance: <strong className="font-mono tabular-nums text-rose-700">{formatCurrency(pendingInvoicesAmount)}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 truncate">
              Overdue Exposure: <strong className="font-mono tabular-nums text-slate-700">{formatCurrency(overdueReceivables)}</strong>
            </span>
            <span className="text-amber-700 font-semibold inline-flex items-center gap-0.5 group-hover:underline shrink-0">
              <span>Inspect Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>
      </div>

      {/* 3B. Core 4 Flashy KPI Spotlight Cards with Sparklines & Accent Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Gross Tax Invoiced & Collections */}
        <button
          type="button"
          onClick={() => onNavigate('invoices', 'FILTER:TAX')}
          className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/60 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition truncate">
                Tax Invoiced Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <Receipt className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {formatCurrency(totalInvoiced)}
              </div>
              {/* Inline Sparkline */}
              <svg className="w-14 h-6 shrink-0" viewBox="0 0 64 28" fill="none">
                <path
                  d="M2 22 L14 18 L26 20 L38 11 L50 13 L62 4"
                  stroke="#2563eb"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="text-slate-500">Collected</span>
              <span className="font-mono tabular-nums font-bold text-emerald-700 truncate">
                {formatCurrency(totalCollected)} · {realizationPct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${realizationPct}%` }}
              />
            </div>
          </div>
        </button>

        {/* KPI 2: Accounts Receivable & Aging */}
        <button
          type="button"
          onClick={() => onNavigate('reports', 'receivables')}
          className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/60 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 group-hover:text-rose-600 transition truncate">
                Outstanding Receivables
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <Wallet className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {formatCurrency(outstandingReceivables)}
              </div>
              <svg className="w-14 h-6 shrink-0" viewBox="0 0 64 28" fill="none">
                <path
                  d="M2 16 L14 20 L26 14 L38 18 L50 10 L62 12"
                  stroke="#e11d48"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="text-slate-500">Overdue Exposure</span>
            {overdueReceivables > 0 ? (
              <span className="font-mono tabular-nums font-bold text-rose-600 truncate">
                {formatCurrency(overdueReceivables)} ({overdueInvoices.length} inv)
              </span>
            ) : (
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Overdue</span>
              </span>
            )}
          </div>
        </button>

        {/* KPI 3: Active Opportunity Pipeline */}
        <button
          type="button"
          onClick={() => onNavigate('opportunities', 'FILTER:OPEN')}
          className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/60 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-500" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 group-hover:text-violet-600 transition truncate">
                Active Deal Pipeline
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <Layers className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-indigo-700 tracking-tight truncate">
                {formatCurrency(pipelineValue)}
              </div>
              <svg className="w-14 h-6 shrink-0" viewBox="0 0 64 28" fill="none">
                <path
                  d="M2 24 L14 19 L26 15 L38 16 L50 8 L62 5"
                  stroke="#3b82f6"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="text-slate-500">Funnel Volume</span>
            <span className="font-mono tabular-nums font-bold text-slate-800 truncate">
              {openOpportunities} opps · {totalLeads} leads
            </span>
          </div>
        </button>

        {/* KPI 4: Booked Contracts & Win Velocity */}
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="text-left group relative overflow-hidden bg-white hover:bg-slate-50/60 p-5 rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-w-0"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 group-hover:text-emerald-600 transition truncate">
                Booked Order Value
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1f7e9e]/10 text-[#1f7e9e] border border-[#1f7e9e]/20 flex items-center justify-center transition shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-[#1f7e9e]" />
              </div>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 tracking-tight truncate">
                {formatCurrency(wonRevenue)}
              </div>
              <svg className="w-14 h-6 shrink-0" viewBox="0 0 64 28" fill="none">
                <path
                  d="M2 22 L14 20 L26 14 L38 12 L50 7 L62 3"
                  stroke="#059669"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="text-slate-500">Conversion Rate</span>
            <span className="font-mono tabular-nums font-bold text-emerald-700 truncate">
              {conversionRate}% · {totalOrders} contracts
            </span>
          </div>
        </button>
      </div>

      {/* 4. Interactive Visual Analytics Studio (7 Cols Chart + 5 Cols Pipeline Funnel) */}
      {(perspective === 'overview' || perspective === 'sales' || perspective === 'finance') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Interactive Multi-Mode Revenue & GST Analytics Studio */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Revenue & Cashflow Intelligence
                  </h3>
                </div>

                {/* Mode Switcher */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 self-start sm:self-auto overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setChartMode('trajectory')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      chartMode === 'trajectory'
                        ? 'sidebar-tab-active-depth font-bold'
                        : 'border border-transparent hover:text-slate-900'
                    }`}
                  >
                    Revenue Trajectory
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('gst')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      chartMode === 'gst'
                        ? 'sidebar-tab-active-depth font-bold'
                        : 'border border-transparent hover:text-slate-900'
                    }`}
                  >
                    GST & Tax Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('channels')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      chartMode === 'channels'
                        ? 'sidebar-tab-active-depth font-bold'
                        : 'border border-transparent hover:text-slate-900'
                    }`}
                  >
                    Channel Matrix
                  </button>
                </div>
              </div>

              {/* VIEW 1: Interactive SVG Area & Bar Trajectory Chart */}
              {chartMode === 'trajectory' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                        <span>Tax Invoiced</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                        <span>Cash Collected</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 inline-block" />
                        <span>Booked Orders</span>
                      </span>
                    </div>
                    {hoveredBucketIdx !== null && trajectoryBuckets[hoveredBucketIdx] && (
                      <div className="text-xs font-mono tabular-nums text-indigo-700 font-semibold">
                        {trajectoryBuckets[hoveredBucketIdx].label}: Invoiced{' '}
                        {formatCurrency(trajectoryBuckets[hoveredBucketIdx].invoiced)} · Collected{' '}
                        {formatCurrency(trajectoryBuckets[hoveredBucketIdx].collected)}
                      </div>
                    )}
                  </div>

                  {/* Interactive Grouped Bar + Trend Visual */}
                  <div className="pt-2 pb-1 px-2 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="grid grid-cols-6 gap-3 h-44 items-end pt-4 px-2">
                      {trajectoryBuckets.map((bucket, idx) => {
                        const invHeight = Math.max(Math.round((bucket.invoiced / maxBucketValue) * 100), 10);
                        const colHeight = Math.max(Math.round((bucket.collected / maxBucketValue) * 100), 8);
                        const bookHeight = Math.max(Math.round((bucket.booked / maxBucketValue) * 100), 12);
                        const isHovered = hoveredBucketIdx === idx;
                        return (
                          <div
                            key={bucket.label}
                            onMouseEnter={() => setHoveredBucketIdx(idx)}
                            onMouseLeave={() => setHoveredBucketIdx(null)}
                            onClick={() => onNavigate('reports')}
                            className={`flex flex-col items-center h-full justify-end group cursor-pointer rounded-lg p-1.5 transition ${
                              isHovered ? 'bg-indigo-50/80' : ''
                            }`}
                          >
                            <div className="w-full flex items-end justify-center gap-1.5 h-32">
                              <div
                                className="w-3 sm:w-3.5 rounded-t-md bg-gradient-to-t from-indigo-700 to-indigo-500 transition-all duration-300"
                                style={{ height: `${invHeight}%` }}
                                title={`Invoiced: ${formatCurrency(bucket.invoiced)}`}
                              />
                              <div
                                className="w-3 sm:w-3.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300"
                                style={{ height: `${colHeight}%` }}
                                title={`Collected: ${formatCurrency(bucket.collected)}`}
                              />
                              <div
                                className="w-2.5 sm:w-3 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-300 hidden sm:block"
                                style={{ height: `${bookHeight}%` }}
                                title={`Booked: ${formatCurrency(bucket.booked)}`}
                              />
                            </div>
                            <span className="mt-2 text-[11px] font-mono font-semibold text-slate-600 group-hover:text-indigo-700">
                              {bucket.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Statutory GST & Tax Split */}
              {chartMode === 'gst' && (
                <div className="space-y-4 py-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block">Taxable Base Value</span>
                      <span className="text-base font-extrabold font-mono tabular-nums text-slate-900 mt-1 block">
                        {formatCurrency(totalTaxableInvoiced)}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Across {taxInvoices.length} GST Invoices
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
                      <span className="text-[11px] text-indigo-700 font-medium block">Intra-State (CGST + SGST)</span>
                      <span className="text-base font-extrabold font-mono tabular-nums text-indigo-950 mt-1 block">
                        {formatCurrency(totalCgst + totalSgst)}
                      </span>
                      <span className="text-[11px] text-indigo-600/80 font-mono tabular-nums mt-0.5 block">
                        CGST: {formatCurrency(totalCgst)} · SGST: {formatCurrency(totalSgst)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
                      <span className="text-[11px] text-cyan-800 font-medium block">Inter-State (IGST)</span>
                      <span className="text-base font-extrabold font-mono tabular-nums text-cyan-950 mt-1 block">
                        {formatCurrency(totalIgst)}
                      </span>
                      <span className="text-[11px] text-cyan-700/80 font-mono tabular-nums mt-0.5 block">
                        Total GST: {formatCurrency(totalGstInvoiced)}
                      </span>
                    </div>
                  </div>

                  {/* Proportional Visual Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Gross Invoice Composition (Taxable vs. Statutory GST)</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(totalInvoiced)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full"
                        style={{
                          width: `${totalInvoiced > 0 ? Math.round((totalTaxableInvoiced / totalInvoiced) * 100) : 82}%`,
                        }}
                        title="Taxable Value"
                      />
                      <div
                        className="bg-cyan-500 h-full"
                        style={{
                          width: `${totalInvoiced > 0 ? Math.round((totalGstInvoiced / totalInvoiced) * 100) : 18}%`,
                        }}
                        title="GST Tax Component"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Taxable Principal (~84.7%)</span>
                      <button
                        type="button"
                        onClick={() => onNavigate('reports', 'gst')}
                        className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        Open Statutory GST Register →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: Channel Attribution Matrix */}
              {chartMode === 'channels' && (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                  {sourceStats.map((src) => (
                    <button
                      key={src.source}
                      type="button"
                      onClick={() => onNavigate('leads', `SOURCE:${src.source}`)}
                      className="table-modern w-full text-left group flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate flex items-center gap-1">
                            <span>{src.source}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-600 transition" />
                          </span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            {src.count} leads · {src.sharePct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(src.sharePct, 4)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(src.value)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom 4-Metric Financial Summary Strip */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Taxable Billed</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatCurrency(totalTaxableInvoiced)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">GST Liability</span>
                <span className="font-mono tabular-nums font-bold text-indigo-600">
                  {formatCurrency(totalGstInvoiced)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Unbilled Milestones</span>
                <span className="font-mono tabular-nums font-bold text-amber-600">
                  {formatCurrency(upcomingPayments)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Average Order (AOV)</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {formatCurrency(avgOrderValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: 6-Stage Pipeline Conversion & Deal Value Funnel */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pipeline Velocity Funnel</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('reports', 'funnel')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Funnel Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {pipelineStages.map((stage) => {
                  const widthPct = Math.max((stage.count / maxStageCount) * 100, 6);
                  return (
                    <button
                      key={stage.label}
                      type="button"
                      onClick={() => onNavigate('leads', `STAGE:${stage.label}`)}
                      className="table-modern w-full text-left group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1.5">
                          <span>{stage.label}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-600 transition" />
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-slate-500 text-[11px]">
                            {formatCurrency(stage.value)}
                          </span>
                          <span className="text-slate-300" aria-hidden="true">·</span>
                          <span className={`font-bold ${stage.textClass}`}>
                            {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${stage.barClass} rounded-full transition-all duration-300`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span> Qualified Pipeline: <strong className="font-mono tabular-nums text-slate-800">{qualifiedLeads} leads</strong></span>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Open Opportunity Board →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. High-Value Opportunity Deals Spotlight & Billing Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: High-Value Active Opportunities Spotlight */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  High-Velocity Opportunity Spotlight
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
              >
                <span>All Opportunities ({openOpportunities})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {openOpportunitiesList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <span>No open opportunities in pipeline. Convert a qualified lead to start tracking deals.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {openOpportunitiesList.slice(0, 4).map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => onNavigate('opportunities', opp.id)}
                    className="text-left group p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
                        <span className="font-mono font-semibold text-indigo-600">
                          {opp.opportunityNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate flex-1">{opp.stage}</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-700">
                          {opp.probability}% prob
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                        {opp.opportunityName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {opp.customerName} · {opp.state}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Close: {opp.expectedClosingDate || 'TBD'}
                      </span>
                      <span className="text-xs font-extrabold font-mono tabular-nums text-slate-900">
                        {formatCurrency(opp.estimatedDealValue)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total Open Pipeline: <strong className="font-mono tabular-nums text-indigo-700">{formatCurrency(pipelineValue)}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('leads')}
              className="font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Qualify Leads →
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Finance & Milestone Billing Pulse Stack */}
        <div className="lg:col-span-4 space-y-3.5 flex flex-col justify-between">
          {/* Card A: Milestone Billings */}
          <button
            type="button"
            onClick={() => onNavigate('milestones', 'FILTER:UPCOMING')}
            className="table-modern w-full text-left group bg-white hover:bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                Milestones Ready to Bill
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {formatCurrency(upcomingPayments)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{pendingMilestones.length} active milestones</span>
              <span className="text-indigo-600 font-semibold group-hover:underline">Generate Invoice →</span>
            </div>
          </button>

          {/* Card B: Fulfillment & Contract Velocity */}
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="table-modern w-full text-left group bg-white hover:bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                Average Deal Size (AOV)
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {formatCurrency(avgOrderValue)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{inProgressOrders} orders in fulfillment</span>
              <span className="text-emerald-700 font-semibold group-hover:underline">View Contracts →</span>
            </div>
          </button>

          {/* Card C: Tax & Proforma Register */}
          <button
            type="button"
            onClick={() => onNavigate('ledger')}
            className="table-modern w-full text-left group bg-white hover:bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                Billing & Customer Ledger
              </span>
              <Receipt className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
              {taxInvoices.length + proformaInvoices.length} Documents
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{taxInvoices.length} Tax · {proformaInvoices.length} Proforma</span>
              <span className="text-indigo-600 font-semibold group-hover:underline">Open AR Ledger →</span>
            </div>
          </button>
        </div>
      </div>

      {/* 6. Operational Command Center: Priority Follow-ups & Recent Sales Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Priority Activities & Follow-ups */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scheduled Follow-ups & Tasks</h3>
            </div>

            {/* Filter buttons */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActivityFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activityFilter === 'pending'
                    ? 'sidebar-tab-active-depth font-bold'
                    : 'border border-transparent hover:text-slate-900'
                }`}
              >
                All ({pendingActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('today')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activityFilter === 'today'
                    ? 'sidebar-tab-active-depth font-bold'
                    : 'border border-transparent hover:text-slate-900'
                }`}
              >
                Today ({todayActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('overdue')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activityFilter === 'overdue'
                    ? 'sidebar-tab-active-depth font-bold'
                    : 'border border-transparent hover:text-slate-900'
                }`}
              >
                Overdue ({overdueActivities.length})
              </button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {visibleActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <span>No pending follow-ups in this filter</span>
              </div>
            ) : (
              visibleActivities.slice(0, 4).map((act) => {
                const isOverdue = act.date < todayStr;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      if (act.leadId) onNavigate('leads', act.leadId);
                      else if (act.customerId) onNavigate('customers', act.customerId);
                      else if (act.salesOrderId) onNavigate('orders', act.salesOrderId);
                      else onNavigate('activities');
                    }}
                    className="table-modern w-full text-left group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 transition cursor-pointer block"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 group-hover:text-indigo-600 truncate pr-2">
                        {act.activityType === 'Call' && <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                        {act.activityType === 'Meeting' && <Video className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {act.activityType === 'Email' && <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        <span className="truncate">{act.subject}</span>
                      </div>
                      <span
                        className={`font-mono tabular-nums text-[11px] shrink-0 ${
                          isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {act.date} {act.time ? `· ${act.time}` : ''}
                      </span>
                    </div>
                    {act.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{act.notes}</p>
                    )}
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{act.leadNumber || act.customerName || 'General Account'}</span>
                      <span>Owner: {act.assignedUserName || 'Sales Team'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onNavigate('activities')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Activities Register</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Sales Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Commercial Sales Orders</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
            >
              <span>Orders Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <span>No sales orders created yet</span>
              </div>
            ) : (
              recentOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onNavigate('orders', order.id)}
                  className="table-modern w-full text-left group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-900 group-hover:text-indigo-600">
                        {order.orderNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs font-medium text-slate-700 truncate">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-mono tabular-nums">{order.orderDate}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          order.status === 'Approved' || order.status === 'Completed'
                            ? 'text-emerald-600'
                            : order.status === 'Pending Approval'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold font-mono tabular-nums text-slate-900">
                      {formatCurrency(order.grandTotal)}
                    </div>
                    <span className="text-[10px] text-slate-400">Incl. GST</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{pendingOrders} orders awaiting sign-off</span>
            <button
              type="button"
              onClick={onOpenCreateOrder}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              + Create Sales Order
            </button>
          </div>
        </div>
      </div>

      {/* 7. Bottom Quick Navigation Strip */}
      </>
      )}
      {(currentUser.role === 'Super Admin' || currentUser.role === 'Administrator') &&
        perspective === 'overview' && (
          <div className="space-y-4">
            <PayrollAdminDashboardReportSection />
          </div>
        )}
      {/* Bottom Quick Navigation Strip (Guarded by Granted Rights) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-500 shadow-2xs">
        <span className="font-bold text-slate-800">Quick Module Navigation:</span>
        <div className="flex flex-wrap items-center gap-3">
          {canView('ledger') && (
            <button
              type="button"
              onClick={() => onNavigate('ledger')}
              className="hover:text-indigo-600 hover:underline cursor-pointer font-medium"
            >
              Customer Ledger
            </button>
          )}
          {canView('reports') && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onNavigate('reports', 'receivables')}
                className="hover:text-indigo-600 hover:underline cursor-pointer font-medium"
              >
                AR Aging Report
              </button>
            </>
          )}
          {canView('milestones') && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onNavigate('milestones')}
                className="hover:text-indigo-600 hover:underline cursor-pointer font-medium"
              >
                Milestone Billing
              </button>
            </>
          )}
          {canView('masters') && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onNavigate('masters', 'products')}
                className="hover:text-indigo-600 hover:underline cursor-pointer font-medium"
              >
                Product Catalog
              </button>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onNavigate('masters', 'users')}
                className="hover:text-indigo-600 hover:underline cursor-pointer font-medium"
              >
                User Management
              </button>
            </>
          )}
          {canView('database') && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => onNavigate('database')}
                className="hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>PostgreSQL Workbench</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* User Permissions Breakdown Modal (Live inspector for the active login) */}
      <UserPermissionsModal
        user={currentUser}
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
};
