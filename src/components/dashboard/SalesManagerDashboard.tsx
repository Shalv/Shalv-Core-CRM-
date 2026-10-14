import React, { useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Users,
  Award,
  TrendingUp,
  Target,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { crmVisibleUsers } from '../../shared/userScope';

interface SalesManagerDashboardProps {
  onNavigate: (module: string, itemId?: string) => void;
  horizonStartDate?: string;
}

export const SalesManagerDashboard: React.FC<SalesManagerDashboardProps> = ({
  onNavigate,
  horizonStartDate,
}) => {
  const {
    leads,
    opportunities,
    orders,
    activities,
    users,
    formatCurrency,
  } = useCrm();

  // Time-filtered datasets
  const filteredLeads = useMemo(() => {
    if (!horizonStartDate) return leads;
    return leads.filter((l) => (l.leadDate || l.createdAt || '') >= horizonStartDate);
  }, [leads, horizonStartDate]);

  const filteredOrders = useMemo(() => {
    if (!horizonStartDate) return orders;
    return orders.filter((o) => (o.orderDate || o.createdAt || '') >= horizonStartDate);
  }, [orders, horizonStartDate]);

  // Sales team members (Department === 'Sales' or has leads/opps assigned)
  const salesTeamMembers = useMemo(() => {
    // Payroll-Only employees are excluded: they own no CRM pipeline, so counting them here would
    // put a payroll-only person on the sales leaderboard with zero deals.
    const list = crmVisibleUsers(users).filter(
      (u) =>
        u.department === 'Sales' ||
        u.role.includes('Sales') ||
        u.role === 'Super Admin'
    );
    return list;
  }, [users]);

  // Build Leaderboard stats per sales rep
  const repLeaderboard = useMemo(() => {
    return salesTeamMembers.map((rep) => {
      const repLeads = filteredLeads.filter(
        (l) =>
          l.leadOwnerId === rep.id ||
          l.leadOwnerName?.toLowerCase() === rep.name.toLowerCase()
      );
      const repOpps = opportunities.filter(
        (o) =>
          (o.salesOwnerId === rep.id ||
            o.salesOwnerName?.toLowerCase() === rep.name.toLowerCase()) &&
          !['Won', 'Lost'].includes(o.stage)
      );
      const repOrders = filteredOrders.filter(
        (o) =>
          (o.salespersonId === rep.id ||
            o.salespersonName?.toLowerCase() === rep.name.toLowerCase()) &&
          o.status !== 'Cancelled' &&
          o.status !== 'Rejected'
      );
      const repActivities = activities.filter(
        (a) =>
          (a.assignedUserId === rep.id ||
            a.assignedUserName?.toLowerCase() === rep.name.toLowerCase()) &&
          a.status !== 'Completed' &&
          a.status !== 'Cancelled'
      );

      const wonRevenue = repOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      const pipelineValue = repOpps.reduce((sum, o) => sum + (o.estimatedDealValue || 0), 0);
      const wonLeadsCount = repLeads.filter((l) => l.status === 'Won').length;
      const winRate = repLeads.length > 0 ? Math.round((wonLeadsCount / repLeads.length) * 100) : 0;

      return {
        user: rep,
        totalLeads: repLeads.length,
        pipelineValue,
        wonRevenue,
        winRate,
        pendingActivitiesCount: repActivities.length,
      };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue || b.pipelineValue - a.pipelineValue);
  }, [salesTeamMembers, filteredLeads, opportunities, filteredOrders, activities]);

  // Team summary KPIs
  const totalTeamPipeline = opportunities
    .filter((o) => !['Won', 'Lost'].includes(o.stage))
    .reduce((sum, o) => sum + (o.estimatedDealValue || 0), 0);

  const totalTeamWon = filteredOrders
    .filter((o) => o.status !== 'Cancelled' && o.status !== 'Rejected')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingApprovalOrders = useMemo(() => {
    return filteredOrders.filter((o) => ['Pending Approval', 'Draft'].includes(o.status));
  }, [filteredOrders]);

  // Lead Source conversion efficiency
  const sourceStats = useMemo(() => {
    const sources = ['Website', 'Referral', 'LinkedIn', 'Expo/Event', 'Outbound', 'Cold Call'];
    return sources.map((src) => {
      const srcLeads = filteredLeads.filter((l) => l.leadSource === src);
      const won = srcLeads.filter((l) => l.status === 'Won').length;
      return {
        source: src,
        count: srcLeads.length,
        won,
        winRate: srcLeads.length > 0 ? Math.round((won / srcLeads.length) * 100) : 0,
      };
    }).filter((s) => s.count > 0);
  }, [filteredLeads]);

  return (
    <div className="space-y-6">
      {/* Sales Manager Team Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Sales Floor Pipeline</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-[#1f7e9e]">
            {formatCurrency(totalTeamPipeline)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Across all active sales executives</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Team Booked Revenue</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-emerald-700">
            {formatCurrency(totalTeamWon)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{filteredOrders.length} confirmed contracts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Orders Pending Approval</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-amber-700">
            {pendingApprovalOrders.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Awaiting manager review</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Active Sales Force</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-slate-900">
            {salesTeamMembers.length} Reps
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Full team active</div>
        </div>
      </div>

      {/* Sales Team Performance Leaderboard */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#1f7e9e]" />
              <span>Sales Executive Performance Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500">
              Individual quota attainment, deal velocity, and follow-up discipline
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Ranked by Closed Revenue &amp; Pipeline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3">Sales Executive</th>
                <th className="py-2.5 px-3">Role &amp; Location</th>
                <th className="py-2.5 px-3">Assigned Leads</th>
                <th className="py-2.5 px-3">Active Pipeline</th>
                <th className="py-2.5 px-3">Closed Revenue</th>
                <th className="py-2.5 px-3">Win Rate</th>
                <th className="py-2.5 px-3">Pending Follow-ups</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repLeaderboard.map((item, idx) => (
                <tr key={item.user.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-slate-100 text-slate-600">
                        #{idx + 1}
                      </span>
                      <UserAvatar
                        name={item.user.name}
                        avatar={item.user.avatar}
                        className="w-8 h-8 rounded-lg text-xs"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.user.name}</div>
                        <div className="text-[10px] text-slate-400">
                          @{item.user.username || item.user.email.split('@')[0]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{item.user.role}</div>
                    <div className="text-[10px] text-slate-400">{item.user.location || 'HQ'}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {item.totalLeads} Leads
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#1f7e9e]">
                    {formatCurrency(item.pipelineValue)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {formatCurrency(item.wonRevenue)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.winRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.pendingActivitiesCount > 0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.pendingActivitiesCount} Tasks
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onNavigate('opportunities')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      View Deals
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Orders Needing Approval + Acquisition Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Orders Pending Approval */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1f7e9e]" />
                <span>Orders Requiring Approval &amp; Review</span>
              </h4>
              <p className="text-xs text-slate-500">Draft and unconfirmed sales contracts</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#1f7e9e] hover:underline flex items-center gap-1"
            >
              All Orders <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingApprovalOrders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
              All sales orders are confirmed and approved!
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovalOrders.slice(0, 4).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {ord.customerName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {ord.orderNumber} · Rep: {ord.salespersonName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      {formatCurrency(ord.grandTotal)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('orders', ord.id)}
                      className="text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Acquisition Source Conversion */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#1f7e9e]" />
              <span>Channel Lead Conversion</span>
            </h4>
            <p className="text-xs text-slate-500">Which acquisition sources close best</p>
          </div>

          <div className="space-y-3">
            {sourceStats.map((src) => (
              <div key={src.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700">{src.source}</span>
                  <span className="font-mono text-slate-600">
                    {src.won} won / {src.count} leads ({src.winRate}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${src.winRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
