import React, { useMemo, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  UserRole,
  PayrollModuleKey,
  PayrollPermissionAction,
  PayrollModulePermission,
} from '../../types';
import { PAYROLL_MODULES } from '../../data/initialData';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  ShieldCheck,
  Eye,
  Plus,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Search,
  Download,
  Users,
  Wallet,
  CalendarCheck,
  CalendarDays,
  Receipt,
  CreditCard,
  BookOpen,
  BarChart3,
  Settings,
  PlugZap,
  LayoutDashboard,
  UserCheck,
  Lock,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

/* ---------------------------------------------------------------------------
 * Payroll (PayChakra) Permission Matrix
 * A role x payroll-module x action RBAC grid, mirroring the CRM
 * RolePermissionsMatrix. Roles are edited one at a time; a read-only
 * "all roles" overview sits underneath so the whole matrix is visible at once.
 * ------------------------------------------------------------------------- */

const PAYROLL_ROLES: { role: UserRole; title: string; badge: string; blurb: string }[] = [
  { role: 'Super Admin', title: 'Super Administrator', badge: 'bg-purple-100 text-purple-700 border-purple-300', blurb: 'Unrestricted governance of payroll, statutory and system configuration.' },
  { role: 'Administrator', title: 'Operations Admin', badge: 'bg-indigo-100 text-indigo-700 border-indigo-300', blurb: 'Full payroll operations administration and employee onboarding.' },
  { role: 'Sales Manager', title: 'Sales & BD Manager', badge: 'bg-sky-100 text-sky-700 border-sky-300', blurb: 'Team attendance, leave and reimbursement approvals; payroll visibility.' },
  { role: 'Sales Executive', title: 'Sales Executive', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', blurb: 'Self-service: own attendance, leave, claims and payslips.' },
  { role: 'Finance Manager', title: 'Finance Manager', badge: 'bg-amber-100 text-amber-700 border-amber-300', blurb: 'Owns the salary run, statutory computation, loans and payroll reporting.' },
  { role: 'Finance Executive', title: 'Finance Executive', badge: 'bg-orange-100 text-orange-700 border-orange-300', blurb: 'Prepares payroll, statutory and reports; approves are reserved for managers.' },
  { role: 'Management/Viewer', title: 'Management / Viewer', badge: 'bg-slate-100 text-slate-700 border-slate-300', blurb: 'Read-only access to payroll cost and reporting dashboards.' },
];

const MODULE_ICONS: Record<PayrollModuleKey, React.ComponentType<{ className?: string }>> = {
  payroll_overview: LayoutDashboard,
  employees: UserCheck,
  attendance: CalendarCheck,
  leaves: CalendarDays,
  reimbursements: Receipt,
  loans: CreditCard,
  payslips: Wallet,
  tax: BookOpen,
  reports: BarChart3,
  policy: Settings,
  integration: PlugZap,
};

const ACTIONS: { action: PayrollPermissionAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { action: 'view', label: 'View', icon: Eye },
  { action: 'create', label: 'Create', icon: Plus },
  { action: 'edit', label: 'Edit', icon: Edit3 },
  { action: 'approve', label: 'Approve', icon: CheckCircle2 },
];

const SECTIONS = ['Payroll Core', 'Payroll Operations', 'Payroll Admin'];

function emptyPerm(): PayrollModulePermission {
  return { view: false, create: false, edit: false, approve: false };
}

/** A compact access level for the read-only overview: None / View / Edit / Full. */
function accessLevel(p: PayrollModulePermission): { label: string; cls: string } {
  if (!p || (!p.view && !p.create && !p.edit && !p.approve)) return { label: 'None', cls: 'chip-neutral' };
  if (!p.create && !p.edit && !p.approve) return { label: 'View', cls: 'chip-info' };
  if (p.approve) return { label: 'Full', cls: 'chip-success' };
  return { label: 'Edit', cls: 'chip-accent' };
}

export function PayrollPermissionsMatrix({ searchQuery = '' }: { searchQuery?: string }) {
  const {
    payrollRolePermissions,
    updatePayrollRolePermission,
    resetPayrollRolePermissions,
    currentUser,
    users,
  } = useCrm();

  const [selectedRole, setSelectedRole] = useState<UserRole>('Administrator');
  const [query, setQuery] = useState(searchQuery);
  const [view, setView] = useState<'edit' | 'overview'>('edit');

  const isAdmin = ['Super Admin', 'Administrator'].includes(currentUser.role);

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAYROLL_MODULES;
    return PAYROLL_MODULES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.section.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [query]);

  const roleMap = payrollRolePermissions[selectedRole] || {};

  const grantCount = (role: UserRole): { granted: number; total: number } => {
    const map = payrollRolePermissions[role] || {};
    let granted = 0;
    for (const m of PAYROLL_MODULES) {
      const p = map[m.id];
      if (p) granted += ACTIONS.filter((a) => p[a.action]).length;
    }
    return { granted, total: PAYROLL_MODULES.length * ACTIONS.length };
  };

  const toggle = (module: PayrollModuleKey, action: PayrollPermissionAction) => {
    if (!isAdmin) return;
    const current = roleMap[module] || emptyPerm();
    updatePayrollRolePermission(selectedRole, module, action, !current[action]);
  };

  const exportCsv = () => {
    const header = ['Module', 'Section', ...ACTIONS.map((a) => a.label)];
    const rows = PAYROLL_MODULES.map((m) => {
      const p = payrollPermissionsFor(m.id);
      return [m.label, m.section, ...ACTIONS.map((a) => (p[a.action] ? 'Yes' : 'No'))];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Permissions_${String(selectedRole).replace(/[^a-z0-9]+/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const payrollPermissionsFor = (module: PayrollModuleKey): PayrollModulePermission =>
    (payrollRolePermissions[selectedRole] || {})[module] || emptyPerm();

  const payrollUsers = useMemo(() => {
    return crmVisibleUsers(users).filter(
      (u) =>
        u.accessType === 'payroll_only' ||
        u.accessType === 'crm_and_payroll' ||
        u.accessScope === 'payroll_only' ||
        (u as any).enrolledInPayroll
    );
  }, [users]);

  const selectedMeta = PAYROLL_ROLES.find((r) => r.role === selectedRole);
  const stats = grantCount(selectedRole);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="hero-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="icon-depth icon-depth-indigo w-9 h-9"><ShieldCheck className="w-4.5 h-4.5" /></span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Payroll Permission Matrix</h2>
                <p className="text-[12px] text-slate-500">
                  Role-based access control for every PayChakra payroll and ESS module.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip chip-accent"><Users className="w-3 h-3" /> {PAYROLL_ROLES.length} roles</span>
            <span className="chip chip-info">{PAYROLL_MODULES.length} modules</span>
            <span className="chip chip-neutral">{ACTIONS.length} actions</span>
            <button type="button" onClick={exportCsv} className="btn btn-outline px-3 py-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => resetPayrollRolePermissions()}
                className="btn btn-outline px-3 py-1.5 text-xs"
                title="Reset every role back to the shipped defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset all
              </button>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Lock className="w-3.5 h-3.5" /> You have read-only access. Only a Super Admin or Administrator can change payroll permissions.
          </div>
        )}
      </div>

      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {PAYROLL_ROLES.map((r) => {
          const active = r.role === selectedRole;
          const g = grantCount(r.role);
          return (
            <button
              key={r.role}
              type="button"
              onClick={() => setSelectedRole(r.role)}
              className={`text-left px-3.5 py-2.5 rounded-xl border transition min-w-[190px] ${
                active ? 'border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-500/15' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-slate-800 truncate">{r.title}</span>
                <span className={`chip ${active ? 'chip-accent' : 'chip-neutral'} !px-1.5 !py-0`}>{g.granted}/{g.total}</span>
              </div>
              <span className="text-[10.5px] text-slate-500 truncate block mt-0.5">{r.role}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payroll modules…"
              className="field pl-9 pr-3 py-1.5 text-xs w-64"
            />
          </div>
          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setView('edit')}
              className={`px-3 py-1.5 rounded-lg transition ${view === 'edit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
            >
              Edit role
            </button>
            <button
              type="button"
              onClick={() => setView('overview')}
              className={`px-3 py-1.5 rounded-lg transition ${view === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
            >
              All roles
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`chip ${selectedMeta?.badge || 'chip-neutral'}`}>{selectedMeta?.title || selectedRole}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => resetPayrollRolePermissions(selectedRole)}
              className="btn btn-outline px-3 py-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset this role
            </button>
          )}
        </div>
      </div>

      {selectedMeta && view === 'edit' && (
        <p className="text-[11.5px] text-slate-500 -mt-2">{selectedMeta.blurb} · <span className="font-semibold text-slate-700">{stats.granted} of {stats.total} grants enabled</span></p>
      )}

      {/* Edit-role matrix */}
      {view === 'edit' && (
        <div className="panel-depth overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-2.5">Payroll Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a.action} className="px-3 py-2.5 text-center w-[110px]">
                      <span className="inline-flex items-center gap-1"><a.icon className="w-3.5 h-3.5" /> {a.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((section) => {
                  const mods = filteredModules.filter((m) => m.section === section);
                  if (!mods.length) return null;
                  return (
                    <React.Fragment key={section}>
                      <tr>
                        <td colSpan={ACTIONS.length + 1} className="px-4 py-2 bg-slate-50/80 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                          {section}
                        </td>
                      </tr>
                      {mods.map((m) => {
                        const Icon = MODULE_ICONS[m.id];
                        const p = payrollPermissionsFor(m.id);
                        return (
                          <tr key={m.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="icon-depth icon-depth-indigo w-8 h-8 shrink-0"><Icon className="w-4 h-4" /></span>
                                <div className="min-w-0">
                                  <div className="text-[12.5px] font-bold text-slate-800 truncate">{m.label}</div>
                                  <div className="text-[11px] text-slate-500 truncate">{m.description}</div>
                                </div>
                              </div>
                            </td>
                            {ACTIONS.map((a) => {
                              const on = !!p[a.action];
                              return (
                                <td key={a.action} className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    disabled={!isAdmin}
                                    onClick={() => toggle(m.id, a.action)}
                                    aria-pressed={on}
                                    aria-label={`${a.label} ${m.label}`}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition ${
                                      on
                                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-[0_2px_6px_-2px_rgba(79,70,229,.5)]'
                                        : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'
                                    } ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                  >
                                    {on ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-3.5 h-0.5 rounded bg-slate-300" />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {!filteredModules.length && (
                  <tr>
                    <td colSpan={ACTIONS.length + 1} className="px-4 py-10 text-center text-slate-400 text-xs">
                      No payroll modules match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All-roles overview matrix */}
      {view === 'overview' && (
        <div className="panel-depth overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 sticky left-0 bg-[#f4f7fb]">Payroll Module</th>
                  {PAYROLL_ROLES.map((r) => (
                    <th key={r.role} className="px-3 py-2.5 text-center whitespace-nowrap">{r.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((m) => {
                  const Icon = MODULE_ICONS[m.id];
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{m.label}</span>
                        </span>
                      </td>
                      {PAYROLL_ROLES.map((r) => {
                        const lvl = accessLevel((payrollRolePermissions[r.role] || {})[m.id] || emptyPerm());
                        return (
                          <td key={r.role} className="px-3 py-2.5 text-center">
                            <span className={`chip ${lvl.cls}`}>{lvl.label}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-employee effective payroll access */}
      <div className="panel-depth overflow-hidden">
        <div className="panel-h flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-[13px] font-bold text-slate-800">Employee roster — effective payroll access</h3>
          </div>
          <span className="text-[11px] text-slate-500">{payrollUsers.length} payroll-enabled {payrollUsers.length === 1 ? 'user' : 'users'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Payroll scope</th>
                {PAYROLL_MODULES.map((m) => (
                  <th key={m.id} className="px-2 py-2.5 text-center whitespace-nowrap" title={m.label}>
                    {MODULE_ICONS[m.id] ? React.createElement(MODULE_ICONS[m.id], { className: 'w-3.5 h-3.5 mx-auto text-slate-400' }) : m.label.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrollUsers.map((u) => {
                const roleMapForUser = payrollRolePermissions[u.role] || {};
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2.5">
                        <UserAvatar name={u.name} avatar={u.avatar} className="w-7 h-7 rounded-lg text-[10px]" />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-800 truncate">{u.name}</span>
                          <span className="block text-[10.5px] text-slate-500 truncate">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`chip ${PAYROLL_ROLES.find((r) => r.role === u.role)?.badge || 'chip-neutral'}`}>{u.role}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`chip ${u.accessType === 'payroll_only' || u.accessScope === 'payroll_only' ? 'chip-warning' : 'chip-info'}`}>
                        {u.accessType === 'payroll_only' || u.accessScope === 'payroll_only' ? 'Payroll only' : 'CRM + Payroll'}
                      </span>
                    </td>
                    {PAYROLL_MODULES.map((m) => {
                      const p = roleMapForUser[m.id];
                      const on = !!(p && (p.view || p.create || p.edit || p.approve));
                      return (
                        <td key={m.id} className="px-2 py-2.5 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {!payrollUsers.length && (
                <tr>
                  <td colSpan={PAYROLL_MODULES.length + 3} className="px-4 py-10 text-center text-slate-400">
                    No payroll-enabled employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollPermissionsMatrix;
