import React, { useMemo, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { CrmModuleKey, PermissionAction, RolePermissionsMap, UserRole } from '../../types';
import { ALL_CRM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../../data/initialData';
import { ShieldCheck, Search, RotateCcw, Users as UsersIcon, Filter, Lock } from 'lucide-react';

/**
 * User Permission Matrix — a grid of every user against every CRM module, with the
 * four actions (view / create / edit / delete) editable per user.
 *
 * Per-user permissions are the primary authority in `hasPermission`, so a toggle here
 * takes effect immediately for that user. Cells that differ from the user's role
 * default are marked as customised, and a row can be reset back to the role baseline.
 */

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];
const ACTION_LABEL: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};
const ACTION_SHORT: Record<PermissionAction, string> = {
  view: 'V',
  create: 'C',
  edit: 'E',
  delete: 'D',
};

/** Only the CRM modules belong here — payroll permissions are role-based and live
 *  in the Payroll Permissions tab. */
const CRM_MODULES = ALL_CRM_MODULES.filter(
  (m) => !String(m.id).startsWith('payroll') && m.section !== 'Payroll'
);

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

export interface UserPermissionsMatrixProps {
  initialUserId?: string;
}

export const UserPermissionsMatrix: React.FC<UserPermissionsMatrixProps> = ({ initialUserId }) => {
  const { users, rolePermissions, updateUserCustomPermissions, currentUser } = useCrm();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [onlyCustomised, setOnlyCustomised] = useState(false);
  const [showPayrollNote, setShowPayrollNote] = useState(true);

  const isSuperAdmin = currentUser.role === 'Super Admin';

  const effective = (user: any, module: CrmModuleKey, action: PermissionAction): boolean => {
    const custom = user.customPermissions?.[module]?.[action];
    if (custom !== undefined) return !!custom;
    const roleMap = rolePermissions[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role];
    return !!(roleMap?.[module]?.[action]);
  };

  const isCustomised = (user: any, module: CrmModuleKey, action: PermissionAction): boolean =>
    user.customPermissions?.[module]?.[action] !== undefined;

  const rowCustomised = (user: any): boolean =>
    !!user.customPermissions && Object.keys(user.customPermissions).length > 0;

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
  }, [users, query, roleFilter, onlyCustomised]);

  const toggle = (user: any, module: CrmModuleKey, action: PermissionAction) => {
    const current = effective(user, module, action);
    const next: Partial<RolePermissionsMap> = {
      ...(user.customPermissions || {}),
      [module]: {
        ...((user.customPermissions?.[module] as any) || {}),
        [action]: !current,
      } as any,
    };
    updateUserCustomPermissions(user.id, next);
  };

  const resetUser = (user: any) => {
    updateUserCustomPermissions(user.id, undefined);
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
      {/* header */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><ShieldCheck className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">User Permission Matrix</h3>
              <p className="text-[11.5px] text-slate-500">
                Per-user access across CRM modules. A per-user setting overrides the role baseline and applies immediately.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="sh-badge sh-badge-neutral"><UsersIcon className="w-3 h-3" /> {users.length} users</span>
            <span className="sh-badge sh-badge-warning">{customisedCount} customised</span>
          </div>
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

      {showPayrollNote && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-[12px] text-sky-900 flex items-start gap-2">
          <span>
            Payroll module access is role-based and managed in the <b>Payroll Permissions</b> tab; this matrix governs
            CRM workspace modules per user.
          </span>
          <button type="button" className="ml-auto text-sky-700 font-semibold" onClick={() => setShowPayrollNote(false)}>
            Dismiss
          </button>
        </div>
      )}

      {/* matrix */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2 border-b border-r border-slate-200 min-w-[210px]">
                  User
                </th>
                {CRM_MODULES.map((m) => (
                  <th
                    key={`${m.id}-${m.section}`}
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
                  {CRM_MODULES.map((m) => (
                    <td key={`${u.id}-${m.id}-${m.section}`} className="border-b border-slate-100 px-1 py-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        {ACTIONS.map((a) => {
                          const on = effective(u, m.id as CrmModuleKey, a);
                          const custom = isCustomised(u, m.id as CrmModuleKey, a);
                          return (
                            <button
                              key={a}
                              type="button"
                              title={`${m.label} · ${ACTION_LABEL[a]} — ${on ? 'allowed' : 'denied'}${custom ? ' (per-user override)' : ''}`}
                              onClick={() => toggle(u, m.id as CrmModuleKey, a)}
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
                              {ACTION_SHORT[a]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                  <td className="border-b border-l border-slate-100 px-3 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-[10.5px]"
                        title="Reset this user to their role defaults"
                        onClick={() => resetUser(u)}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={CRM_MODULES.length + 2} className="text-center py-10 text-slate-400 text-sm">
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
          <span className="ml-auto">V = View · C = Create · E = Edit · D = Delete</span>
        </div>
      </div>

      <div className="text-[11.5px] text-slate-500">
        Tip: use the <b>Reset</b> button on a row to clear every per-user override and return that user to their role baseline.
      </div>
    </div>
  );
};

export default UserPermissionsMatrix;
