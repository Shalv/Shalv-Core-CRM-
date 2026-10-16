import React, { useMemo, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  CrmModuleKey,
  PermissionAction,
  PayrollModuleKey,
  PayrollPermissionAction,
  RolePermissionsMap,
  PayrollPermissionsMap,
  UserRole,
} from '../../types';
import {
  ALL_CRM_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  PAYROLL_MODULES,
  DEFAULT_PAYROLL_ROLE_PERMISSIONS,
} from '../../data/initialData';
import { ShieldCheck, Search, RotateCcw, Users as UsersIcon, Filter, Lock } from 'lucide-react';

/**
 * User Permission Matrix — every user against every module, with per-user overrides.
 *
 * Two scopes:
 *   CRM     — the 15 CRM workspace modules (view / create / edit / delete)
 *   Payroll — the PayChakra payroll modules (view / create / edit / approve)
 *
 * In both scopes a per-user setting is the primary authority, so a toggle here takes
 * effect immediately for that user. Cells that differ from the role baseline are marked.
 */

const CRM_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];
const PAYROLL_ACTIONS: PayrollPermissionAction[] = ['view', 'create', 'edit', 'approve'];

const LABEL: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
};
const SHORT: Record<string, string> = {
  view: 'V',
  create: 'C',
  edit: 'E',
  delete: 'D',
  approve: 'A',
};

const CRM_MODULES = ALL_CRM_MODULES;

const roleOptions: (UserRole | 'ALL')[] = [
  'ALL',
  'Super Admin',
  'Administrator',
  'Sales Manager',
  'Sales Executive',
  'Finance Manager',
  'Finance Executive',
  'Management/Viewer',
];

type Scope = 'crm' | 'payroll';

export interface UserPermissionsMatrixProps {
  initialUserId?: string;
}

export const UserPermissionsMatrix: React.FC<UserPermissionsMatrixProps> = ({ initialUserId }) => {
  const {
    users,
    rolePermissions,
    updateUserCustomPermissions,
    payrollRolePermissions,
    userPayrollPermissions,
    updateUserPayrollPermissions,
    currentUser,
  } = useCrm();

  const [scope, setScope] = useState<Scope>('crm');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [onlyCustomised, setOnlyCustomised] = useState(false);

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const modules: { id: string; label: string }[] = scope === 'crm' ? CRM_MODULES : PAYROLL_MODULES;
  const actions: string[] = scope === 'crm' ? CRM_ACTIONS : PAYROLL_ACTIONS;

  /** Effective permission for a user on a module/action in the active scope. */
  const effective = (user: any, module: string, action: string): boolean => {
    if (scope === 'crm') {
      const custom = user.customPermissions?.[module as CrmModuleKey]?.[action as PermissionAction];
      if (custom !== undefined) return !!custom;
      const roleMap = rolePermissions[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role];
      return !!(roleMap?.[module as CrmModuleKey]?.[action as PermissionAction]);
    }
    const custom = userPayrollPermissions[user.id]?.[module as PayrollModuleKey]?.[action as PayrollPermissionAction];
    if (custom !== undefined) return !!custom;
    const roleMap = payrollRolePermissions[user.role] || DEFAULT_PAYROLL_ROLE_PERMISSIONS[user.role];
    return !!(roleMap?.[module as PayrollModuleKey]?.[action as PayrollPermissionAction]);
  };

  const isCustomised = (user: any, module: string, action: string): boolean => {
    if (scope === 'crm') {
      return user.customPermissions?.[module as CrmModuleKey]?.[action as PermissionAction] !== undefined;
    }
    return userPayrollPermissions[user.id]?.[module as PayrollModuleKey]?.[action as PayrollPermissionAction] !== undefined;
  };

  const rowCustomised = (user: any): boolean => {
    if (scope === 'crm') {
      return !!user.customPermissions && Object.keys(user.customPermissions).length > 0;
    }
    return !!userPayrollPermissions[user.id] && Object.keys(userPayrollPermissions[user.id] || {}).length > 0;
  };

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => (roleFilter === 'ALL' ? true : u.role === roleFilter))
      .filter((u) => (onlyCustomised ? rowCustomised(u) : true))
      .filter((u) =>
        q
          ? (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, query, roleFilter, onlyCustomised, scope, userPayrollPermissions]);

  const toggle = (user: any, module: string, action: string) => {
    const next = !effective(user, module, action);
    if (scope === 'crm') {
      const perms: Partial<RolePermissionsMap> = {
        ...(user.customPermissions || {}),
        [module]: {
          ...((user.customPermissions?.[module as CrmModuleKey] as any) || {}),
          [action]: next,
        } as any,
      };
      updateUserCustomPermissions(user.id, perms);
      return;
    }
    const current = userPayrollPermissions[user.id] || {};
    const perms: Partial<PayrollPermissionsMap> = {
      ...current,
      [module]: {
        ...((current[module as PayrollModuleKey] as any) || {}),
        [action]: next,
      } as any,
    };
    updateUserPayrollPermissions(user.id, perms);
  };

  const resetUser = (user: any) => {
    if (scope === 'crm') updateUserCustomPermissions(user.id, undefined);
    else updateUserPayrollPermissions(user.id, undefined);
  };

  const customisedCount = users.filter(rowCustomised).length;

  if (!isSuperAdmin && currentUser.role !== 'Administrator') {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
          <div>
            <div className="font-bold text-slate-800">Not permitted</div>
            <div className="text-sm text-slate-500">
              Only a Super Admin or Administrator can view and edit the user permission matrix.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><ShieldCheck className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">User Permission Matrix</h3>
              <p className="text-[11.5px] text-slate-500">
                Per-user access. A per-user setting overrides the role baseline and applies immediately.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="sh-badge sh-badge-neutral"><UsersIcon className="w-3 h-3" /> {users.length} users</span>
            <span className="sh-badge sh-badge-warning">{customisedCount} customised</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {(['crm', 'payroll'] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition ${
                  scope === s ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'crm' ? 'CRM Modules' : 'Payroll Modules'}
              </button>
            ))}
          </div>
          <span className="text-[11.5px] text-slate-500">
            {scope === 'crm'
              ? 'Actions: View · Create · Edit · Delete'
              : 'Actions: View · Create · Edit · Approve'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field w-full pl-9"
              placeholder="Search users by name, email or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select className="field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}>
              {roleOptions.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All roles' : r}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer">
            <input type="checkbox" checked={onlyCustomised} onChange={(e) => setOnlyCustomised(e.target.checked)} />
            Only customised
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2 border-b border-r border-slate-200 min-w-[210px]">
                  User
                </th>
                {modules.map((m) => (
                  <th
                    key={`${scope}-${m.id}`}
                    className="bg-slate-50 text-center text-[10px] font-bold text-slate-600 px-1.5 py-2 border-b border-slate-200 align-bottom"
                    style={{ minWidth: 46 }}
                    title={m.label}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="whitespace-nowrap [writing-mode:vertical-rl] rotate-180 max-h-[110px] overflow-hidden">{m.label}</span>
                    </div>
                  </th>
                ))}
                <th className="bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2 border-b border-l border-slate-200">
                  Reset
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 border-b border-r border-slate-100">
                    <div className="font-semibold text-[12.5px] text-slate-800 truncate max-w-[190px]" title={u.name}>
                      {u.name || u.username || u.email}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10.5px] text-slate-500">{u.role}</span>
                      {rowCustomised(u) && (
                        <span className="sh-badge sh-badge-warning !text-[9px] !px-1.5 !py-0">custom</span>
                      )}
                    </div>
                  </td>
                  {modules.map((m) => (
                    <td key={`${u.id}-${scope}-${m.id}`} className="border-b border-slate-100 px-1 py-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        {actions.map((a) => {
                          const on = effective(u, m.id, a);
                          const custom = isCustomised(u, m.id, a);
                          return (
                            <button
                              key={a}
                              type="button"
                              title={`${m.label} · ${LABEL[a]} — ${on ? 'allowed' : 'denied'}${custom ? ' (per-user override)' : ''}`}
                              onClick={() => toggle(u, m.id, a)}
                              className={`w-6 h-[17px] rounded-[4px] text-[9.5px] font-bold leading-none transition-colors ${
                                on
                                  ? custom
                                    ? 'bg-amber-400 text-amber-950'
                                    : 'bg-emerald-500 text-white'
                                  : custom
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {SHORT[a]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                  <td className="border-b border-l border-slate-100 px-3 py-1.5 text-center">
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-[10.5px]"
                      title="Reset this user to their role defaults for this scope"
                      onClick={() => resetUser(u)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={modules.length + 2} className="text-center py-10 text-slate-400 text-sm">
                    No users match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-emerald-500 inline-block" /> Allowed (role default)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-amber-400 inline-block" /> Allowed (per-user override)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-rose-200 inline-block" /> Denied (per-user override)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-slate-100 inline-block" /> Denied</span>
          <span className="ml-auto">
            {actions.map((a) => `${SHORT[a]} = ${LABEL[a]}`).join(' · ')}
          </span>
        </div>
      </div>

      <div className="text-[11.5px] text-slate-500">
        Tip: <b>Reset</b> clears every per-user override for the active scope and returns that user to their role baseline.
        Role baselines themselves are edited in the <b>User-Wise Permissions</b> and <b>Payroll Permission Matrix</b> tabs.
      </div>
    </div>
  );
};

export default UserPermissionsMatrix;
