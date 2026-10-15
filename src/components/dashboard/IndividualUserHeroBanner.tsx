import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Wallet,
  FileSpreadsheet,
  Plus,
  CreditCard,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Award,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { crmVisibleUsers } from '../../shared/userScope';
import { UserRole } from '../../types';

export type DashboardPerspectiveKey =
  | 'overview'
  | 'my_sales'
  | 'team_sales'
  | 'my_finance'
  | 'admin_hr'
  | 'sales'
  | 'finance';

export type DashboardHorizonKey = 'all' | 'month' | 'quarter';

interface IndividualUserHeroBannerProps {
  currentPerspective: DashboardPerspectiveKey;
  onSelectPerspective: (perspective: DashboardPerspectiveKey) => void;
  horizon: DashboardHorizonKey;
  onSelectHorizon: (horizon: DashboardHorizonKey) => void;
  onOpenCreateLead: () => void;
  onOpenCreateOrder: () => void;
  onOpenRecordPayment: () => void;
  onOpenPermissionsModal: () => void;
}

export const IndividualUserHeroBanner: React.FC<IndividualUserHeroBannerProps> = ({
  currentPerspective,
  onSelectPerspective,
  horizon,
  onSelectHorizon,
  onOpenCreateLead,
  onOpenCreateOrder,
  onOpenRecordPayment,
  onOpenPermissionsModal,
}) => {
  const {
    currentUser,
    users,
    loginAsUser,
    supplierCompany,
    canView,
    canCreate,
  } = useCrm();

  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  const hasSalesAccess = canView('leads') || canView('opportunities');
  const hasFinanceAccess = canView('invoices') || canView('payments') || canView('ledger');
  const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Administrator';
  const isSalesExec = currentUser.role === 'Sales Executive';
  const isSalesMgr = currentUser.role === 'Sales Manager';
  const isFinanceRole =
    currentUser.role === 'Finance Manager' || currentUser.role === 'Finance Executive';

  const handleOpenEssPortal = () => {
    window.dispatchEvent(
      new CustomEvent('open-payroll-ess-portal', { detail: { tab: 'overview' } })
    );
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Administrator':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Sales Manager':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Sales Executive':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Finance Manager':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Finance Executive':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Management/Viewer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl dashboard-blur-glass text-slate-900 p-5 sm:p-7 shadow-xs">
      {/* Background refractive orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-10 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Section: Company & Prominent User Identity linked */}
        <div className="space-y-3 max-w-3xl">
          {/* Top Line: Company + Location + Date */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#1f7e9e]/12 border border-[#1f7e9e]/25">
              <Building2 className="w-3.5 h-3.5 text-[#1f7e9e]" />
            </span>
            <span className="font-bold tracking-wide text-[#1f7e9e]">
              {supplierCompany?.name || 'Coreenact Solutions Pvt Ltd'}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">
              {currentUser.location ? `${currentUser.location} HQ` : 'HQ'}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* User Identity Box with Linked Login and Credentials */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative shrink-0 flex items-center justify-center">
              <UserAvatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                className="w-12 h-12 rounded-2xl text-base ring-2 ring-[#1f7e9e]/30 shadow-xs"
              />
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                title="Online & Authenticated"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
                  {currentUser.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  {currentUser.role}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {currentUser.department} Dept
                </span>
              </div>

              {/* Linked Credentials Detail */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200/60">
                  <span className="text-slate-400 font-sans">Login:</span>
                  <strong className="text-slate-900 font-semibold">
                    @{currentUser.username || currentUser.email.split('@')[0]}
                  </strong>
                </span>
                <span className="text-slate-600 truncate max-w-[220px]">
                  {currentUser.email}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  ID: {currentUser.id}
                </span>
              </div>
            </div>

            {/* Switch User Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsUserSwitcherOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer shadow-2xs whitespace-nowrap"
                title="Switch active user to experience individual dashboard"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#1f7e9e]" />
                <span>Switch User</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isUserSwitcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserSwitcherOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                      <p className="font-bold text-slate-800">Test Individual Dashboards</p>
                      <p className="text-[11px] text-slate-500">
                        Switch persona to see role-tailored workspace
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {crmVisibleUsers(users).map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              loginAsUser(u.id);
                              setIsUserSwitcherOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50/80 text-blue-900 font-semibold border border-blue-200/60'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <UserAvatar
                              name={u.name}
                              avatar={u.avatar}
                              className="w-7 h-7 rounded-lg text-[10px] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900 leading-tight">
                                {u.name}
                              </p>
                              <p className="truncate text-[10px] text-slate-500">
                                {u.role} · @{u.username || u.email.split('@')[0]}
                              </p>
                            </div>
                            {isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Action Buttons for Logged-In User (Respects Permissions) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {canCreate('leads') && (
              <button
                type="button"
                onClick={onOpenCreateLead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl sidebar-tab-active-depth transition cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#1f7e9e]" />
                <span>New Lead</span>
              </button>
            )}

            {canCreate('orders') && (
              <button
                type="button"
                onClick={onOpenCreateOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1f7e9e]" />
                <span>Create Sales Order</span>
              </button>
            )}

            {canCreate('payments') && (
              <button
                type="button"
                onClick={onOpenRecordPayment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition cursor-pointer whitespace-nowrap"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#1f7e9e]" />
                <span>Record Payment</span>
              </button>
            )}

            {/* Direct Links to User ESS Portal & Granted Permissions */}
            <button
              type="button"
              onClick={handleOpenEssPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title="Open Employee Self-Service Salary Slip & Attendance"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>My ESS Portal (Salary & Slip)</span>
            </button>

            <button
              type="button"
              onClick={onOpenPermissionsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer whitespace-nowrap"
              title="View Granted Permissions for this login"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>My Rights Breakdown</span>
            </button>
          </div>
        </div>

        {/* Right Section: Time Horizon & Quick Individual Status Card */}
        <div className="flex flex-col sm:items-end justify-between gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-2xs shrink-0 lg:max-w-xs w-full lg:w-auto">
          <div className="w-full flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">Active Workspace:</span>
            <span className="text-xs font-bold text-[#1f7e9e] font-mono">
              {currentPerspective === 'my_sales'
                ? 'My Sales Rep Desk'
                : currentPerspective === 'team_sales'
                ? 'Sales Management Desk'
                : currentPerspective === 'my_finance'
                ? 'Finance & Billing Desk'
                : currentPerspective === 'admin_hr'
                ? 'Admin HR & Attendance'
                : 'Executive 360°'}
            </span>
          </div>

          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Time Horizon:</span>
            <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => onSelectHorizon('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  horizon === 'all'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onSelectHorizon('month')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  horizon === 'month'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onSelectHorizon('quarter')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  horizon === 'quarter'
                    ? 'bg-white font-bold text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quarter
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Role Rights Active
            </span>
            <span className="font-semibold text-slate-700">
              {isAdmin
                ? 'Full 15 Modules'
                : isSalesExec
                ? 'Sales Engine Only'
                : isFinanceRole
                ? 'Finance & AR Only'
                : 'Custom Matrix'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Role-Based Perspective Tabs Navigation — Zero Header Scrolling via Responsive Dropdown List */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Mobile / Compact Dropdown List Selector: No horizontal scrolling! */}
        <div className="block lg:hidden w-full sm:w-auto">
          <label htmlFor="dashboard-workspace-select" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Active Workspace Perspective
          </label>
          <div className="relative">
            <select
              id="dashboard-workspace-select"
              value={currentPerspective}
              onChange={(e) => onSelectPerspective(e.target.value as DashboardPerspectiveKey)}
              className="w-full header-dropdown-select bg-white/95 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-[#1f7e9e]/30 focus:border-[#1f7e9e] cursor-pointer"
            >
              {(isAdmin || (hasSalesAccess && hasFinanceAccess) || currentUser.role === 'Management/Viewer') && (
                <option value="overview">✨ Executive 360°</option>
              )}
              {hasSalesAccess && (
                <option value="my_sales">
                  💼 {isSalesExec ? 'My Sales Workspace' : 'Sales Rep View'}
                </option>
              )}
              {(isSalesMgr || isAdmin) && hasSalesAccess && (
                <option value="team_sales">🏆 Sales Team Leaderboard</option>
              )}
              {hasFinanceAccess && (
                <option value="my_finance">
                  💳 {isFinanceRole ? 'Finance & Collections Desk' : 'Finance & GST Command'}
                </option>
              )}
              {isAdmin && (
                <option value="admin_hr">👤 Admin HR &amp; GPS Attendance</option>
              )}
            </select>
          </div>
        </div>

        {/* Desktop Viewport Tabs (Flex-wrap without overflow-x-auto scrolling) */}
        <div className="hidden lg:inline-flex flex-wrap items-center p-1 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs rounded-xl text-xs font-medium text-slate-600 gap-1">
          {/* Executive 360 Tab */}
          {(isAdmin || (hasSalesAccess && hasFinanceAccess) || currentUser.role === 'Management/Viewer') && (
            <button
              type="button"
              onClick={() => onSelectPerspective('overview')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentPerspective === 'overview'
                  ? 'sidebar-tab-active-depth font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="icon-depth icon-depth-sky w-5 h-5 rounded-md">
                <Sparkles className="w-3 h-3 text-[#1f7e9e]" />
              </div>
              <span>Executive 360°</span>
            </button>
          )}

          {/* Individual Sales Rep Workspace */}
          {hasSalesAccess && (
            <button
              type="button"
              onClick={() => onSelectPerspective('my_sales')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentPerspective === 'my_sales'
                  ? 'sidebar-tab-active-depth font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="icon-depth icon-depth-indigo w-5 h-5 rounded-md">
                <Briefcase className="w-3 h-3 text-indigo-600" />
              </div>
              <span>
                {isSalesExec ? 'My Sales Workspace' : 'Sales Rep View'}
              </span>
            </button>
          )}

          {/* Sales Management & Team Leaderboard Tab */}
          {(isSalesMgr || isAdmin) && hasSalesAccess && (
            <button
              type="button"
              onClick={() => onSelectPerspective('team_sales')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentPerspective === 'team_sales'
                  ? 'sidebar-tab-active-depth font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="icon-depth icon-depth-cyan w-5 h-5 rounded-md">
                <Award className="w-3 h-3 text-cyan-600" />
              </div>
              <span>Sales Team Leaderboard</span>
            </button>
          )}

          {/* Finance & Invoicing Desk Tab */}
          {hasFinanceAccess && (
            <button
              type="button"
              onClick={() => onSelectPerspective('my_finance')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentPerspective === 'my_finance'
                  ? 'sidebar-tab-active-depth font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="icon-depth icon-depth-emerald w-5 h-5 rounded-md">
                <Wallet className="w-3 h-3 text-emerald-600" />
              </div>
              <span>
                {isFinanceRole ? 'Finance & Collections Desk' : 'Finance & GST Command'}
              </span>
            </button>
          )}

          {/* Admin Employee & Attendance Tab */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectPerspective('admin_hr')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentPerspective === 'admin_hr'
                  ? 'sidebar-tab-active-depth font-bold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="icon-depth icon-depth-purple w-5 h-5 rounded-md">
                <UserCheck className="w-3 h-3 text-purple-600" />
              </div>
              <span>Admin HR &amp; GPS Attendance</span>
            </button>
          )}
        </div>

        {/* Status pill showing which login ID is actively linked to this session */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">
            Logged in as <strong className="text-slate-800">{currentUser.name}</strong> (@
            {currentUser.username || currentUser.email.split('@')[0]})
          </span>
        </div>
      </div>
    </div>
  );
};
