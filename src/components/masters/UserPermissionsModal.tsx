import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  User,
  UserRole,
  CrmModuleKey,
  PermissionAction,
  RolePermissionsMap,
} from '../../types';
import { ALL_CRM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../../data/initialData';
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Building,
  FileSpreadsheet,
  CalendarCheck,
  Receipt,
  CreditCard,
  BookOpen,
  CalendarDays,
  BarChart3,
  Settings,
  Database,
  Lock,
  Unlock,
  LifeBuoy,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

const MODULE_ICONS: Record<CrmModuleKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  leads: UserCheck,
  opportunities: Briefcase,
  customers: Building,
  orders: FileSpreadsheet,
  purchases: FileSpreadsheet,
  support: LifeBuoy,
  milestones: CalendarCheck,
  invoices: Receipt,
  payments: CreditCard,
  ledger: BookOpen,
  activities: CalendarDays,
  reports: BarChart3,
  masters: Settings,
  database: Database,
};

export function getFallbackBaseRoleMap(
  role: string | undefined,
  rolePermissionsMap?: Record<string, RolePermissionsMap>
): RolePermissionsMap {
  if (role && rolePermissionsMap && rolePermissionsMap[role as UserRole]) {
    return rolePermissionsMap[role as UserRole];
  }
  if (role && DEFAULT_ROLE_PERMISSIONS[role as UserRole]) {
    return DEFAULT_ROLE_PERMISSIONS[role as UserRole];
  }
  if (role && /admin/i.test(role)) {
    return DEFAULT_ROLE_PERMISSIONS['Administrator'];
  }
  if (role && /(finance|account)/i.test(role)) {
    return DEFAULT_ROLE_PERMISSIONS['Finance Executive'];
  }
  if (role && /manager/i.test(role)) {
    return DEFAULT_ROLE_PERMISSIONS['Sales Manager'];
  }
  return DEFAULT_ROLE_PERMISSIONS['Sales Executive'];
}

interface UserPermissionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const {
    users,
    rolePermissions,
    updateUserCustomPermissions,
    currentUser,
  } = useCrm();

  const [perms, setPerms] = useState<RolePermissionsMap | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [isInheritedMode, setIsInheritedMode] = useState<boolean>(true);

  // Read latest active user from context
  const activeUser = (user?.id ? users.find((u) => u.id === user.id) : null) || user;

  // Initialize permissions only when modal opens or target user changes
  useEffect(() => {
    if (!isOpen || !activeUser) return;
    const baseRoleMap = getFallbackBaseRoleMap(activeUser.role, rolePermissions);
    const initialMap: RolePermissionsMap = { ...baseRoleMap };

    const custom = activeUser.customPermissions;
    if (custom && typeof custom === 'object' && Object.keys(custom).length > 0) {
      ALL_CRM_MODULES.forEach((m) => {
        if (custom[m.id]) {
          initialMap[m.id] = { ...initialMap[m.id], ...custom[m.id] };
        }
      });
      setIsInheritedMode(false);
    } else {
      setIsInheritedMode(true);
    }

    setPerms(initialMap);
  }, [isOpen, activeUser?.id]);

  if (!isOpen || !activeUser || !perms) return null;

  const baseRoleMap = getFallbackBaseRoleMap(activeUser.role, rolePermissions);

  // Check if a specific module's action differs from role default
  const isActionOverridden = (module: CrmModuleKey, action: PermissionAction): boolean => {
    const currentVal = perms[module]?.[action] ?? false;
    const baseVal = baseRoleMap[module]?.[action] ?? false;
    return currentVal !== baseVal;
  };

  // Check if a module has any override
  const isModuleOverridden = (module: CrmModuleKey): boolean => {
    return (
      isActionOverridden(module, 'view') ||
      isActionOverridden(module, 'create') ||
      isActionOverridden(module, 'edit') ||
      isActionOverridden(module, 'delete')
    );
  };

  // Total overrides count
  let totalOverrides = 0;
  ALL_CRM_MODULES.forEach((m) => {
    (['view', 'create', 'edit', 'delete'] as PermissionAction[]).forEach((act) => {
      if (isActionOverridden(m.id, act)) totalOverrides++;
    });
  });

  const handleToggle = (module: CrmModuleKey, action: PermissionAction) => {
    setPerms((prev) => {
      if (!prev) return prev;
      const currentVal = prev[module]?.[action] ?? false;
      const nextVal = !currentVal;
      const updatedMod = {
        ...prev[module],
        [action]: nextVal,
      };
      if (action === 'view' && !nextVal) {
        updatedMod.create = false;
        updatedMod.edit = false;
        updatedMod.delete = false;
      } else if (action !== 'view' && nextVal) {
        updatedMod.view = true;
      }
      const updated = {
        ...prev,
        [module]: updatedMod,
      };
      return updated;
    });
    setIsInheritedMode(false);
  };

  // Preset handlers
  const handleResetToRoleDefaults = () => {
    const base = getFallbackBaseRoleMap(activeUser.role, rolePermissions);
    setPerms({ ...base });
    setIsInheritedMode(true);
  };

  const handleGrantFullAccess = () => {
    setPerms((prev) => {
      if (!prev) return prev;
      const updated: RolePermissionsMap = { ...prev };
      ALL_CRM_MODULES.forEach((m) => {
        updated[m.id] = { view: true, create: true, edit: true, delete: true };
      });
      return updated;
    });
    setIsInheritedMode(false);
  };

  const handleSetReadOnly = () => {
    setPerms((prev) => {
      if (!prev) return prev;
      const updated: RolePermissionsMap = { ...prev };
      ALL_CRM_MODULES.forEach((m) => {
        updated[m.id] = { view: true, create: false, edit: false, delete: false };
      });
      return updated;
    });
    setIsInheritedMode(false);
  };

  const handleToggleAllColumn = (action: PermissionAction, enable: boolean) => {
    setPerms((prev) => {
      if (!prev) return prev;
      const updated: RolePermissionsMap = { ...prev };
      ALL_CRM_MODULES.forEach((m) => {
        updated[m.id] = {
          ...updated[m.id],
          [action]: enable,
          ...(action === 'view' && !enable ? { create: false, edit: false, delete: false } : {}),
          ...(action !== 'view' && enable ? { view: true } : {}),
        };
      });
      return updated;
    });
    setIsInheritedMode(false);
  };

  const handleSave = () => {
    if (!activeUser) return;
    if (isInheritedMode) {
      // Clear custom overrides to inherit from role
      updateUserCustomPermissions(activeUser.id, undefined);
    } else {
      updateUserCustomPermissions(activeUser.id, perms);
    }
    onClose();
  };

  // Filter modules
  const filteredModules = ALL_CRM_MODULES.filter((m) => {
    const matchesSection = sectionFilter === 'ALL' || m.section === sectionFilter;
    const matchesSearch =
      m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-start gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <UserAvatar
              name={activeUser.name}
              avatar={activeUser.avatar}
              className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-lg"
            />
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>User Rights Configuration</span>
                <span>·</span>
                <span>View, Create, Edit & Delete</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Permissions for {activeUser.name}
              </h3>
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-1">
                <span className="font-mono text-slate-200">{activeUser.email}</span>
                <span>·</span>
                <span>Base Role: <strong>{activeUser.role}</strong></span>
                <span>·</span>
                <span>{activeUser.department} Department</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip & Quick Presets */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Permission Source:</span>
              {isInheritedMode || totalOverrides === 0 ? (
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Inherited from Role ({activeUser.role})</span>
                </span>
              ) : (
                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Custom Overrides Active ({totalOverrides} custom rights)</span>
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetToRoleDefaults}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                title="Clear all user custom overrides and inherit standard role defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Inherit Role Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleGrantFullAccess}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                title="Grant all View, Create, Edit & Delete rights"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Control</span>
              </button>

              <button
                type="button"
                onClick={handleSetReadOnly}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                title="Allow View only; deny Create, Edit & Delete"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>View-Only (Read)</span>
              </button>
            </div>
          </div>

          {/* Column Quick Toggles Bar */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] font-bold text-slate-600">Quick Column Controls:</span>
            <div className="flex flex-wrap items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-blue-700 font-bold">View:</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('view', true)}
                  className="px-2 py-0.5 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('view', false)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  None
                </button>
              </div>

              {/* Create Toggle */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-emerald-700 font-bold">Create:</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('create', true)}
                  className="px-2 py-0.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('create', false)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  None
                </button>
              </div>

              {/* Edit Toggle */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-amber-700 font-bold">Edit:</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('edit', true)}
                  className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-bold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('edit', false)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  None
                </button>
              </div>

              {/* Delete Toggle */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-rose-700 font-bold">Delete:</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('delete', true)}
                  className="px-2 py-0.5 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-bold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumn('delete', false)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  None
                </button>
              </div>
            </div>
          </div>

          {/* Section filter tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5">
              {[
                'ALL',
                'Main',
                'Sales Engine',
                'Procurement',
                'Support & AMC',
                'Finance & Billing',
                'Management',
              ].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectionFilter(sec)}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap text-xs ${
                    sectionFilter === sec
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {sec === 'ALL' ? `All Modules (${ALL_CRM_MODULES.length})` : sec}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="table-modern w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-1/3">CRM Module</th>
                  <th className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>View (Read)</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Create (Add)</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit (Update)</span>
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete (Remove)</span>
                    </div>
                  </th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModules.map((m) => {
                  const Icon = MODULE_ICONS[m.id] || LayoutDashboard;
                  const modPerms = perms[m.id] || { view: false, create: false, edit: false, delete: false };
                  const isOverridden = isModuleOverridden(m.id);

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isOverridden ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Module Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{m.label}</span>
                              <span className="text-[9px] font-semibold text-slate-500">
                                · {m.section}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {m.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* View Right */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(m.id, 'view')}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            modPerms.view
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          } ${isActionOverridden(m.id, 'view') ? 'ring-2 ring-amber-400/50 font-extrabold' : ''}`}
                        >
                          {modPerms.view ? <Check className="w-3 h-3 text-blue-700" /> : <X className="w-3 h-3 text-slate-400" />}
                          <span>{modPerms.view ? 'Allowed' : 'Denied'}</span>
                        </button>
                      </td>

                      {/* Create Right */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(m.id, 'create')}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            modPerms.create
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          } ${isActionOverridden(m.id, 'create') ? 'ring-2 ring-amber-400/50 font-extrabold' : ''}`}
                        >
                          {modPerms.create ? <Check className="w-3 h-3 text-emerald-700" /> : <X className="w-3 h-3 text-slate-400" />}
                          <span>{modPerms.create ? 'Allowed' : 'Denied'}</span>
                        </button>
                      </td>

                      {/* Edit Right */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(m.id, 'edit')}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            modPerms.edit
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          } ${isActionOverridden(m.id, 'edit') ? 'ring-2 ring-amber-400/50 font-extrabold' : ''}`}
                        >
                          {modPerms.edit ? <Check className="w-3 h-3 text-amber-700" /> : <X className="w-3 h-3 text-slate-400" />}
                          <span>{modPerms.edit ? 'Allowed' : 'Denied'}</span>
                        </button>
                      </td>

                      {/* Delete Right */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(m.id, 'delete')}
                          className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            modPerms.delete
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          } ${isActionOverridden(m.id, 'delete') ? 'ring-2 ring-amber-400/50 font-extrabold' : ''}`}
                        >
                          {modPerms.delete ? <Check className="w-3 h-3 text-rose-700" /> : <X className="w-3 h-3 text-slate-400" />}
                          <span>{modPerms.delete ? 'Allowed' : 'Denied'}</span>
                        </button>
                      </td>

                      {/* Status Tag */}
                      <td className="p-3 text-right">
                        {isOverridden ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                            Customized
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Role Default
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {totalOverrides > 0 ? (
              <span>
                <strong>{totalOverrides} custom override(s)</strong> configured specifically for {activeUser.name}.
              </span>
            ) : (
              <span>Using default enterprise privileges for <strong>{activeUser.role}</strong>.</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save User Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
