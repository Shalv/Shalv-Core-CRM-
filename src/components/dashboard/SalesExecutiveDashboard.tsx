import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Briefcase,
  Target,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  Users,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  Flame,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';
import { Lead, Opportunity, Activity } from '../../types';

interface SalesExecutiveDashboardProps {
  onNavigate: (module: string, itemId?: string) => void;
  onOpenCreateLead: () => void;
  onOpenCreateOrder: () => void;
  horizonStartDate?: string;
}

export const SalesExecutiveDashboard: React.FC<SalesExecutiveDashboardProps> = ({
  onNavigate,
  onOpenCreateLead,
  onOpenCreateOrder,
  horizonStartDate,
}) => {
  const {
    leads,
    opportunities,
    orders,
    activities,
    currentUser,
    formatCurrency,
    updateActivityStatus,
    canCreate,
  } = useCrm();

  const [scope, setScope] = useState<'my_records' | 'all_accessible'>('my_records');
  const [activityTab, setActivityTab] = useState<'today' | 'pending' | 'overdue'>('today');
  const [completingActId, setCompletingActId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter datasets by time horizon first
  const timeFilteredLeads = useMemo(() => {
    if (!horizonStartDate) return leads;
    return leads.filter((l) => (l.leadDate || l.createdAt || '') >= horizonStartDate);
  }, [leads, horizonStartDate]);

  const timeFilteredOrders = useMemo(() => {
    if (!horizonStartDate) return orders;
    return orders.filter((o) => (o.orderDate || o.createdAt || '') >= horizonStartDate);
  }, [orders, horizonStartDate]);

  // Scope filter: My Records vs All Accessible
  const scopedLeads = useMemo(() => {
    if (scope === 'all_accessible') return timeFilteredLeads;
    return timeFilteredLeads.filter(
      (l) =>
        l.leadOwnerId === currentUser.id ||
        l.leadOwnerName?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [timeFilteredLeads, scope, currentUser]);

  const scopedOpportunities = useMemo(() => {
    if (scope === 'all_accessible') return opportunities;
    return opportunities.filter(
      (o) =>
        o.salesOwnerId === currentUser.id ||
        o.salesOwnerName?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [opportunities, scope, currentUser]);

  const scopedOrders = useMemo(() => {
    if (scope === 'all_accessible') return timeFilteredOrders;
    return timeFilteredOrders.filter(
      (o) =>
        o.salespersonId === currentUser.id ||
        o.salespersonName?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [timeFilteredOrders, scope, currentUser]);

  const scopedActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.assignedUserId === currentUser.id ||
        a.assignedUserName?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [activities, currentUser]);

  // KPIs
  const totalLeads = scopedLeads.length;
  const activeLeadsList = useMemo(
    () => scopedLeads.filter((l) => !l.isConverted && !['Won', 'Lost'].includes(l.status)),
    [scopedLeads]
  );
  const activeLeadsCount = activeLeadsList.length;
  const activeLeadsValue = activeLeadsList.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const hotLeadsCount = activeLeadsList.filter(
    (l) => l.rating === 'Hot' || l.priority === 'High' || l.priority === 'Urgent'
  ).length;

  const wonLeadsCount = scopedLeads.filter((l) => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeadsCount / totalLeads) * 100) : 0;

  const openOppsList = useMemo(
    () =>
      scopedOpportunities
        .filter((o) => !['Won', 'Lost'].includes(o.stage))
        .sort((a, b) => (b.estimatedDealValue || 0) - (a.estimatedDealValue || 0)),
    [scopedOpportunities]
  );
  const openOppsCount = openOppsList.length;
  const pipelineValue = openOppsList.reduce((sum, o) => sum + (o.estimatedDealValue || 0), 0);
  const weightedPipeline = openOppsList.reduce(
    (sum, o) => sum + Math.round(((o.estimatedDealValue || 0) * (o.probability || 50)) / 100),
    0
  );

  const wonRevenue = scopedOrders
    .filter((o) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Individual Monthly Quota Target
  const monthlyQuotaTarget = 1500000; // ₹15,00,000 monthly target
  const quotaAchievedPct = Math.min(100, Math.round((wonRevenue / monthlyQuotaTarget) * 100));

  // Activities filter
  const todayActivities = scopedActivities.filter(
    (a) => a.date === todayStr && a.status !== 'Completed' && a.status !== 'Cancelled'
  );
  const overdueActivities = scopedActivities.filter(
    (a) => a.date < todayStr && a.status !== 'Completed' && a.status !== 'Cancelled'
  );
  const pendingActivities = scopedActivities.filter(
    (a) => a.status !== 'Completed' && a.status !== 'Cancelled'
  );

  const visibleActivities = useMemo(() => {
    if (activityTab === 'today') return todayActivities;
    if (activityTab === 'overdue') return overdueActivities;
    return pendingActivities;
  }, [activityTab, todayActivities, overdueActivities, pendingActivities]);

  // Stage by stage pipeline funnel
  const pipelineStages = useMemo(() => {
    const stages = [
      { name: 'Qualification', color: 'bg-blue-500' },
      { name: 'Requirement Analysis', color: 'bg-indigo-500' },
      { name: 'Demo / Presentation', color: 'bg-purple-500' },
      { name: 'Proposal Submitted', color: 'bg-amber-500' },
      { name: 'Negotiation', color: 'bg-orange-500' },
      { name: 'Won', color: 'bg-emerald-500' },
    ];
    return stages.map((s) => {
      const opps = scopedOpportunities.filter((o) => o.stage === s.name);
      return {
        ...s,
        count: opps.length,
        value: opps.reduce((sum, o) => sum + (o.estimatedDealValue || 0), 0),
      };
    });
  }, [scopedOpportunities]);

  const maxStageCount = Math.max(...pipelineStages.map((s) => s.count), 1);

  const handleCompleteActivity = (id: string) => {
    updateActivityStatus(id, 'Completed', completionNote || 'Completed on schedule');
    setCompletingActId(null);
    setCompletionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Scope Switcher Banner: My Assigned Portfolio vs Team View */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Personal Sales Command Center
            </h2>
            <p className="text-xs text-slate-500">
              Tailored specifically for <strong className="text-slate-800">{currentUser.name}</strong> (@
              {currentUser.username || currentUser.email.split('@')[0]})
            </p>
          </div>
        </div>

        {/* Portfolio View Scope Switcher */}
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setScope('my_records')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              scope === 'my_records'
                ? 'bg-white text-blue-700 font-bold shadow-2xs border border-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>My Assigned Portfolio ({scopedLeads.length} Leads)</span>
          </button>
          <button
            type="button"
            onClick={() => setScope('all_accessible')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              scope === 'all_accessible'
                ? 'bg-white text-blue-700 font-bold shadow-2xs border border-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>All Sales Floor ({timeFilteredLeads.length} Leads)</span>
          </button>
        </div>
      </div>

      {/* 4 Personal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Active Leads Funnel */}
        <button
          type="button"
          onClick={() => onNavigate('leads')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {scope === 'my_records' ? 'My Active Leads' : 'All Active Leads'}
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {activeLeadsCount}
            </div>
            <div className="text-xs font-semibold text-blue-700 mt-0.5">
              Est. {formatCurrency(activeLeadsValue)}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {hotLeadsCount} Hot Priority
            </span>
            <span className="text-[11px] text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 font-medium">
              View <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 2: Deal Pipeline */}
        <button
          type="button"
          onClick={() => onNavigate('opportunities')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {scope === 'my_records' ? 'My Open Pipeline' : 'Open Deal Pipeline'}
            </span>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-[#1f7e9e]">
              {formatCurrency(pipelineValue)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 font-medium">
              Weighted: <span className="font-mono font-semibold">{formatCurrency(weightedPipeline)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{openOppsCount} Active Deals</span>
            <span className="text-[11px] text-slate-400 group-hover:text-[#1f7e9e] flex items-center gap-0.5 font-medium">
              Pipeline <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 3: Won Revenue & Quota Progress */}
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="text-left bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {scope === 'my_records' ? 'My Closed Revenue' : 'Total Closed Revenue'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {formatCurrency(wonRevenue)}
            </div>
            {/* Monthly Quota Target Bar */}
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Quota Progress:</span>
                <span className="font-bold text-emerald-700">{quotaAchievedPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${quotaAchievedPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{scopedOrders.length} Orders Signed</span>
            <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 flex items-center gap-0.5 font-medium">
              Orders <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>

        {/* KPI 4: Win Rate & Conversion Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Win Rate &amp; Velocity</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Target className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {conversionRate}%
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {wonLeadsCount} won out of {totalLeads} total leads
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-700 font-semibold">High Momentum</span>
            <span className="text-[11px] text-slate-400">{pendingActivities.length} pending followups</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 7 Cols (My Today Follow-ups & Activities) + Right 5 Cols (Pipeline Funnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: My Actionable Follow-up Checklist */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#1f7e9e]" />
                  <span>My Follow-ups &amp; Action Items</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tasks assigned directly to your user account
                </p>
              </div>

              {/* Activity Tab Filter */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setActivityTab('today')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activityTab === 'today'
                      ? 'bg-white text-blue-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Today ({todayActivities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab('pending')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activityTab === 'pending'
                      ? 'bg-white text-blue-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  All ({pendingActivities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab('overdue')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    activityTab === 'overdue'
                      ? 'bg-white text-rose-700 font-bold shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Overdue ({overdueActivities.length})
                </button>
              </div>
            </div>

            {/* Activities List */}
            {visibleActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400">No pending follow-ups in this view.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleActivities.map((act) => {
                  const isToday = act.date === todayStr;
                  const isOverdue = act.date < todayStr;
                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 transition bg-slate-50/60 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              act.activityType === 'Call'
                                ? 'bg-emerald-100 text-emerald-800'
                                : act.activityType === 'Meeting'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {act.activityType}
                          </span>
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {act.subject}
                          </span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-100 text-rose-700">
                              Overdue
                            </span>
                          )}
                          {isToday && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          {act.contactPerson && (
                            <span className="font-medium text-slate-700">
                              Contact: {act.contactPerson}
                            </span>
                          )}
                          {act.customerName && (
                            <span className="text-slate-500">· {act.customerName}</span>
                          )}
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {act.date} {act.time || ''}
                          </span>
                        </div>

                        {act.notes && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1 italic">
                            "{act.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {completingActId === act.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={completionNote}
                              onChange={(e) => setCompletionNote(e.target.value)}
                              placeholder="Notes (optional)..."
                              className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-32"
                            />
                            <button
                              type="button"
                              onClick={() => handleCompleteActivity(act.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompletingActId(null)}
                              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCompletingActId(act.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                            title="Mark as completed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {visibleActivities.length} personal follow-ups
            </span>
            <button
              type="button"
              onClick={() => onNavigate('activities')}
              className="text-[#1f7e9e] font-semibold hover:underline flex items-center gap-1"
            >
              Open Activity Calendar <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Cols: My Active Pipeline Funnel (Stage by Stage) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1f7e9e]" />
                  <span>My Deal Funnel by Stage</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Stage distribution for your active opportunities
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                {scopedOpportunities.length} Deals
              </span>
            </div>

            <div className="space-y-3">
              {pipelineStages.map((stage) => {
                const widthPct = Math.max(12, Math.round((stage.count / maxStageCount) * 100));
                return (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 truncate">{stage.name}</span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-900">{stage.count}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-semibold">
                          {formatCurrency(stage.value)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                        style={{ width: `${stage.count > 0 ? widthPct : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Total Pipeline: <strong className="text-slate-800">{formatCurrency(pipelineValue)}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-[#1f7e9e] font-semibold hover:underline flex items-center gap-1"
            >
              Manage Deals <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Priority Open Opportunities Table */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1f7e9e]" />
              <span>My Priority Deals &amp; Opportunities</span>
            </h3>
            <p className="text-xs text-slate-500">
              Active sales deals owned by your user login
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('opportunities')}
            className="text-xs font-semibold text-[#1f7e9e] hover:underline flex items-center gap-1"
          >
            View All ({scopedOpportunities.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {openOppsList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No active open opportunities found for this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Opportunity Name</th>
                  <th className="py-2.5 px-3">Customer / Account</th>
                  <th className="py-2.5 px-3">Deal Value</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Win Prob.</th>
                  <th className="py-2.5 px-3">Expected Close</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openOppsList.slice(0, 5).map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => onNavigate('opportunities', opp.id)}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {opp.opportunityName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {opp.opportunityNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {opp.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1f7e9e]">
                      {formatCurrency(opp.estimatedDealValue)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {opp.stage}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${opp.probability || 50}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {opp.probability || 50}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {opp.expectedClosingDate || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('opportunities', opp.id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Recent Leads Table */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1f7e9e]" />
              <span>My Assigned Inbound &amp; Outbound Leads</span>
            </h3>
            <p className="text-xs text-slate-500">
              Leads linked to your user profile ({currentUser.name})
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="text-xs font-semibold text-[#1f7e9e] hover:underline flex items-center gap-1"
          >
            View All ({scopedLeads.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {scopedLeads.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No leads currently assigned to your account. Click "New Lead" to add one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Company / Contact</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Est. Value</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedLeads.slice(0, 5).map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => onNavigate('leads', lead.id)}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {lead.companyName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {lead.contactPerson} · {lead.mobile}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 line-clamp-1 max-w-[200px]">
                      {lead.requirement}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.rating === 'Hot'
                            ? 'bg-rose-100 text-rose-800'
                            : lead.rating === 'Warm'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.rating || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('leads', lead.id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        Open
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
  );
};
