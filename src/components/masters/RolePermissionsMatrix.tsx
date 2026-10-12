import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  UserRole,
  CrmModuleKey,
  PermissionAction,
  User,
  RolePermissionsMap,
} from '../../types';
import { ALL_CRM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../../data/initialData';
import {
  ShieldCheck,
  Shield,
  Eye,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Users,
  Search,
  Check,
  X,
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
  LayoutDashboard,
  LifeBuoy,
  Copy,
  LogIn,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

const MODULE_ICONS: Record<CrmModuleKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  leads: UserCheck,
  opportunities: Briefcase,
  customers: Building,
  orders: FileSpreadsheet,
  purchases: ShoppingBag,
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

const ALL_ROLES: {
  role: UserRole;
  title: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  description: string;
}[] = [
  {
    role: 'Super Admin',
    title: 'Super Administrator',
    badgeColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    borderColor: 'border-purple-300',
    description: 'Unrestricted master governance across all CRM, finance, and system masters.',
  },
  {
    role: 'Administrator',
    title: 'Operations Admin',
    badgeColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    description: 'System administration, customer setups, operations and commercial oversight.',
  },
  {
    role: 'Sales Manager',
    title: 'Sales & BD Manager',
    badgeColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    borderColor: 'border-blue-300',
    description: 'Full sales pipeline ownership, team lead, order generation, and customer 360.',
  },
  {
    role: 'Sales Executive',
    title: 'Sales Account Executive',
    badgeColor: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    borderColor: 'border-sky-300',
    description: 'Frontline lead qualification, pipeline updates, order drafts; destructive actions blocked.',
  },
  {
    role: 'Finance Manager',
    title: 'Head of Billing & AR',
    badgeColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    description: 'Contract approval, GST invoices, collection receipts, ledger adjustments.',
  },
  {
    role: 'Finance Executive',
    title: 'Billing & Accounts Officer',
    badgeColor: 'text-teal-700',
    badgeBg: 'bg-teal-100',
    borderColor: 'border-teal-300',
    description: 'Generates tax invoices, records customer payments; deletion rights disabled.',
  },
  {
    role: 'Management/Viewer',
    title: 'Executive / Auditor',
    badgeColor: 'text-slate-700',
    badgeBg: 'bg-slate-200',
    borderColor: 'border-slate-300',
    description: 'Read-only visibility for executive analytics, customer review, and financial audit.',
  },
];

interface RolePermissionsMatrixProps {
  initialUserId?: string;
}

export const RolePermissionsMatrix: React.FC<RolePermissionsMatrixProps> = ({
  initialUserId,
}) => {
  const {
    currentUser,
    users,
    rolePermissions,
    updateRolePermission,
    resetRolePermissions,
    updateUserCustomPermissions,
    loginAsUser,
  } = useCrm();

  // Primary mode is User-Wise Permissions ('user'), with optional 'role' template mode
  const [matrixMode, setMatrixMode] = useState<'user' | 'role'>('user');

  // Selected User for User-Wise Permissions Matrix
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialUserId || users.find((u) => u.role !== 'Super Admin')?.id || users[0]?.id || ''
  );
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Selected Role for Role Template Mode
  const [selectedRole, setSelectedRole] = useState<UserRole>('Sales Executive');

  // Module filter & search
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialUserId && users.some((u) => u.id === initialUserId)) {
      setSelectedUserId(initialUserId);
      setMatrixMode('user');
    }
  }, [initialUserId, users]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Helper to resolve a user's effective permissions map (User-Wise Permissions + Role Baseline fallback)
  const getEffectiveUserPermissionsMap = (user: User): RolePermissionsMap => {
    const baseRoleMap =
      rolePermissions[user.role] ||
      DEFAULT_ROLE_PERMISSIONS[user.role] ||
      DEFAULT_ROLE_PERMISSIONS['Sales Executive'];
    const merged: RolePermissionsMap = { ...baseRoleMap };

    ALL_CRM_MODULES.forEach((m) => {
      const baseMod = baseRoleMap[m.id] || {
        view: true,
        create: false,
        edit: false,
        delete: false,
      };
      const userMod = user.customPermissions?.[m.id];
      merged[m.id] = {
        view: userMod?.view !== undefined ? userMod.view : baseMod.view,
        create: userMod?.create !== undefined ? userMod.create : baseMod.create,
        edit: userMod?.edit !== undefined ? userMod.edit : baseMod.edit,
        delete: userMod?.delete !== undefined ? userMod.delete : baseMod.delete,
      };
    });
    return merged;
  };

  const activeUserMap: RolePermissionsMap = selectedUser
    ? getEffectiveUserPermissionsMap(selectedUser)
    : DEFAULT_ROLE_PERMISSIONS['Sales Executive'];

  const currentRoleMap: RolePermissionsMap =
    rolePermissions[selectedRole] ||
    DEFAULT_ROLE_PERMISSIONS[selectedRole] ||
    DEFAULT_ROLE_PERMISSIONS['Sales Executive'];

  const activeMatrixMap = matrixMode === 'user' ? activeUserMap : currentRoleMap;

  // Check if a user's module permission differs from their base role default
  const isUserActionOverridden = (
    user: User,
    module: CrmModuleKey,
    action: PermissionAction
  ): boolean => {
    const baseRoleMap =
      rolePermissions[user.role] ||
      DEFAULT_ROLE_PERMISSIONS[user.role] ||
      DEFAULT_ROLE_PERMISSIONS['Sales Executive'];
    const baseVal = baseRoleMap?.[module]?.[action] ?? false;
    const effVal = activeUserMap?.[module]?.[action] ?? false;
    return effVal !== baseVal;
  };

  // Filtered users in selector strip
  const filteredUsersList = users.filter((u) => {
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const q = userSearchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  // Module sections
  const moduleSections = [
    'ALL',
    'Main',
    'Sales Engine',
    'Procurement',
    'Support & AMC',
    'Finance & Billing',
    'Management',
  ];

  // Filter modules
  const filteredModules = ALL_CRM_MODULES.filter((m) => {
    const matchesSection = activeSectionFilter === 'ALL' || m.section === activeSectionFilter;
    const matchesSearch =
      m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.section.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  // Toggle single permission in User-Wise mode or Role mode
  const handleToggle = (module: CrmModuleKey, action: PermissionAction) => {
    if (matrixMode === 'user' && selectedUser) {
      const currentMap = getEffectiveUserPermissionsMap(selectedUser);
      const currentVal = currentMap[module]?.[action] ?? false;
      const nextVal = !currentVal;

      const updatedMod = {
        ...currentMap[module],
        [action]: nextVal,
      };
      if (action === 'view' && !nextVal) {
        updatedMod.create = false;
        updatedMod.edit = false;
        updatedMod.delete = false;
      } else if (action !== 'view' && nextVal) {
        updatedMod.view = true;
      }

      const nextMap: RolePermissionsMap = {
        ...currentMap,
        [module]: updatedMod,
      };

      updateUserCustomPermissions(selectedUser.id, nextMap);
      showNotification(
        `User Permission Updated: ${selectedUser.name} → ${module.toUpperCase()} (${action.toUpperCase()}): ${
          nextVal ? 'Allowed' : 'Denied'
        }`
      );
      return;
    }

    // Role template mode
    if (selectedRole === 'Super Admin') {
      showNotification(
        'Super Admin role template maintains full master access across all functions by default.'
      );
      return;
    }
    const currentVal = currentRoleMap[module]?.[action] ?? false;
    updateRolePermission(selectedRole, module, action, !currentVal);
    showNotification(
      `Role Template Updated: ${selectedRole} → ${module} (${action.toUpperCase()}): ${
        !currentVal ? 'Granted' : 'Revoked'
      }`
    );
  };

  // Toggle entire column (View / Create / Edit / Delete)
  const handleToggleColumn = (action: PermissionAction, enable: boolean) => {
    if (matrixMode === 'user' && selectedUser) {
      const currentMap = getEffectiveUserPermissionsMap(selectedUser);
      const nextMap: RolePermissionsMap = { ...currentMap };
      ALL_CRM_MODULES.forEach((m) => {
        nextMap[m.id] = {
          ...nextMap[m.id],
          [action]: enable,
          ...(action !== 'view' && enable ? { view: true } : {}),
        };
      });
      updateUserCustomPermissions(selectedUser.id, nextMap);
      showNotification(
        `${enable ? 'Granted' : 'Revoked'} all ${action.toUpperCase()} permissions for user ${
          selectedUser.name
        }.`
      );
      return;
    }

    if (selectedRole === 'Super Admin') {
      showNotification('Super Admin role maintains master privileges across all functions.');
      return;
    }
    ALL_CRM_MODULES.forEach((m) => {
      updateRolePermission(selectedRole, m.id, action, enable);
    });
    showNotification(
      `${enable ? 'Granted' : 'Revoked'} ${action.toUpperCase()} rights for all modules in ${selectedRole}.`
    );
  };

  // Toggle all 4 actions for a single module row
  const handleToggleModuleRow = (module: CrmModuleKey, enableAll: boolean) => {
    if (matrixMode === 'user' && selectedUser) {
      const currentMap = getEffectiveUserPermissionsMap(selectedUser);
      const nextMap: RolePermissionsMap = {
        ...currentMap,
        [module]: {
          view: enableAll,
          create: enableAll,
          edit: enableAll,
          delete: enableAll,
        },
      };
      updateUserCustomPermissions(selectedUser.id, nextMap);
      showNotification(
        `${enableAll ? 'Granted Full Control' : 'Revoked Access'} on ${module.toUpperCase()} for ${
          selectedUser.name
        }.`
      );
      return;
    }

    if (selectedRole === 'Super Admin') return;
    (['view', 'create', 'edit', 'delete'] as PermissionAction[]).forEach((act) => {
      updateRolePermission(selectedRole, module, act, enableAll);
    });
  };

  // User-Wise Presets
  const handleGrantAll = () => {
    if (matrixMode === 'user' && selectedUser) {
      const nextMap: RolePermissionsMap = { ...activeUserMap };
      ALL_CRM_MODULES.forEach((m) => {
        nextMap[m.id] = { view: true, create: true, edit: true, delete: true };
      });
      updateUserCustomPermissions(selectedUser.id, nextMap);
      showNotification(`Granted Full Control across all ${ALL_CRM_MODULES.length} modules to ${selectedUser.name}.`);
      return;
    }

    ALL_CRM_MODULES.forEach((m) => {
      updateRolePermission(selectedRole, m.id, 'view', true);
      updateRolePermission(selectedRole, m.id, 'create', true);
      updateRolePermission(selectedRole, m.id, 'edit', true);
      updateRolePermission(selectedRole, m.id, 'delete', true);
    });
    showNotification(`Granted Full View, Create, Edit & Delete rights to ${selectedRole}.`);
  };

  const handleSetReadOnly = () => {
    if (matrixMode === 'user' && selectedUser) {
      const nextMap: RolePermissionsMap = { ...activeUserMap };
      ALL_CRM_MODULES.forEach((m) => {
        nextMap[m.id] = { view: true, create: false, edit: false, delete: false };
      });
      updateUserCustomPermissions(selectedUser.id, nextMap);
      showNotification(`Configured ${selectedUser.name} with Read-Only (View Only) permissions.`);
      return;
    }

    ALL_CRM_MODULES.forEach((m) => {
      updateRolePermission(selectedRole, m.id, 'view', true);
      updateRolePermission(selectedRole, m.id, 'create', false);
      updateRolePermission(selectedRole, m.id, 'edit', false);
      updateRolePermission(selectedRole, m.id, 'delete', false);
    });
    showNotification(`Configured ${selectedRole} as Read-Only (View permissions only).`);
  };

  const handleResetDefaults = () => {
    if (matrixMode === 'user' && selectedUser) {
      const baseRoleMap =
        rolePermissions[selectedUser.role] || DEFAULT_ROLE_PERMISSIONS[selectedUser.role];
      updateUserCustomPermissions(selectedUser.id, { ...baseRoleMap });
      showNotification(
        `Reset ${selectedUser.name}'s user-wise permissions to standard ${selectedUser.role} baseline.`
      );
      return;
    }

    resetRolePermissions(selectedRole);
    showNotification(`Reset ${selectedRole} permissions to recommended enterprise defaults.`);
  };

  const handleApplyRoleTemplateToUser = (roleToApply: UserRole) => {
    if (!selectedUser) return;
    const templateMap = rolePermissions[roleToApply] || DEFAULT_ROLE_PERMISSIONS[roleToApply];
    const cloned: RolePermissionsMap = { ...templateMap };
    ALL_CRM_MODULES.forEach((m) => {
      cloned[m.id] = { ...(templateMap[m.id] || { view: true, create: false, edit: false, delete: false }) };
    });
    updateUserCustomPermissions(selectedUser.id, cloned);
    showNotification(`Applied "${roleToApply}" permission template to user ${selectedUser.name}.`);
  };

  const handleCopyPermissionsFromUser = (sourceUserId: string) => {
    if (!selectedUser || !sourceUserId) return;
    const sourceUser = users.find((u) => u.id === sourceUserId);
    if (!sourceUser) return;
    const sourceMap = getEffectiveUserPermissionsMap(sourceUser);
    updateUserCustomPermissions(selectedUser.id, { ...sourceMap });
    showNotification(
      `Copied all user-wise permissions from ${sourceUser.name} to ${selectedUser.name}.`
    );
  };

  const totalModulesCount = ALL_CRM_MODULES.length;
  const viewCount = ALL_CRM_MODULES.filter((m) => activeMatrixMap[m.id]?.view).length;
  const createCount = ALL_CRM_MODULES.filter((m) => activeMatrixMap[m.id]?.create).length;
  const editCount = ALL_CRM_MODULES.filter((m) => activeMatrixMap[m.id]?.edit).length;
  const deleteCount = ALL_CRM_MODULES.filter((m) => activeMatrixMap[m.id]?.delete).length;

  const getModuleAccessSummary = (perms?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  }) => {
    if (!perms || !perms.view) {
      return { label: 'No Access', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (perms.create && perms.edit && perms.delete) {
      return { label: 'Full Control', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (perms.create || perms.edit) {
      return { label: 'Read & Write', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: 'View Only', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                User-Wise Enterprise Access Governance
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Role-Based Access Control (RBAC) & User-Wise Rights Matrix
            </h2>
          </div>

          {/* Mode Switcher: User-Wise Permissions (Primary) vs Role Default Templates */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="inline-flex items-center p-1 bg-slate-950/80 border border-white/15 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMatrixMode('user')}
                className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  matrixMode === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User-Wise Permissions ({users.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMatrixMode('role')}
                className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  matrixMode === 'role'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Role Templates (7)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================
          SELECTOR STRIP: USER-WISE SELECTOR (PRIMARY) OR ROLE TEMPLATE SELECTOR
         ============================================================================ */}
      {matrixMode === 'user' ? (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Select User to Configure User-Wise Permissions</span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user name, email, role..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700"
              >
                <option value="ALL">All Roles ({users.length})</option>
                {ALL_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredUsersList.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const isCurrentSession = currentUser.id === u.id;
              const uPerms = getEffectiveUserPermissionsMap(u);
              const uAllowedViews = ALL_CRM_MODULES.filter((m) => uPerms[m.id]?.view).length;
              const hasCustomRules =
                !!u.customPermissions && Object.keys(u.customPermissions).length > 0;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 min-w-0 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        name={u.name}
                        avatar={u.avatar}
                        className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {u.name}
                          </span>
                          {isCurrentSession && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 truncate">
                      {u.role}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasCustomRules ? (
                        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          User-Wise Active
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono font-semibold">
                          {uAllowedViews}/{totalModulesCount} Modules
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Select Default Role Template to Configure:</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Currently Active Profile: <strong>{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {ALL_ROLES.map((r) => {
              const isSelected = selectedRole === r.role;
              const count = users.filter((u) => u.role === r.role).length;

              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setSelectedRole(r.role)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer min-w-0 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-sm ring-2 ring-indigo-600/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.badgeBg} ${r.badgeColor} truncate`}
                      >
                        {r.role}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {count} {count === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{r.title}</h4>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {r.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================================
          MAIN RIGHTS MATRIX CONTAINER (USER-WISE OR ROLE TEMPLATE)
         ============================================================================ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Matrix Header & Quick Presets */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {matrixMode === 'user' && selectedUser ? (
            <div className="flex items-center gap-3.5 min-w-0">
              <UserAvatar
                name={selectedUser.name}
                avatar={selectedUser.avatar}
                className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold text-sm shrink-0"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    User-Wise Rights Matrix:{' '}
                    <span className="text-indigo-600">{selectedUser.name}</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedUser.role}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ({selectedUser.email})
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle any module permission below for <strong>{selectedUser.name}</strong>. Changes
                  are saved and enforced immediately across the application.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Role Template Matrix for{' '}
                    <span className="text-indigo-600 font-mono">{selectedRole}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure baseline permissions for the {selectedRole} role template.
                </p>
              </div>
            </div>
          )}

          {/* Action Presets & Copy / Apply Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {matrixMode === 'user' && selectedUser && (
              <>
                {/* Apply Role Preset Dropdown */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplyRoleTemplateToUser(e.target.value as UserRole);
                      e.target.value = '';
                    }
                  }}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  <option value="">Apply Role Preset...</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      Apply {r.role} Rules
                    </option>
                  ))}
                </select>

                {/* Copy Permissions From Another User */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleCopyPermissionsFromUser(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  <option value="">Copy From User...</option>
                  {users
                    .filter((u) => u.id !== selectedUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        Copy from {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </>
            )}

            <button
              type="button"
              onClick={handleGrantAll}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Grant all 4 rights across all modules"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Grant Full Access</span>
            </button>

            <button
              type="button"
              onClick={handleSetReadOnly}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Set to View only; disable Create, Edit & Delete"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Set Read-Only</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Reset permissions to standard role defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Role Default</span>
            </button>

            {currentUser.role === 'Super Admin' &&
              matrixMode === 'user' &&
              selectedUser &&
              currentUser.id !== selectedUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    loginAsUser(selectedUser.id);
                    showNotification(
                      `Switched active login session to ${selectedUser.name} (${selectedUser.role}).`
                    );
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title={`Switch session to ${selectedUser.name} to test their user-wise permissions`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Test as {selectedUser.name.split(' ')[0]}</span>
                </button>
              )}
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Section filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {moduleSections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSectionFilter(sec)}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  activeSectionFilter === sec
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {sec === 'ALL' ? `All Modules (${totalModulesCount})` : sec}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search module or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Rights Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 block">
                View Rights (Read)
              </span>
              <span className="text-sm font-extrabold text-blue-900">
                {viewCount} / {totalModulesCount} Modules
              </span>
            </div>
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Create Rights (Add)
              </span>
              <span className="text-sm font-extrabold text-emerald-900">
                {createCount} / {totalModulesCount} Modules
              </span>
            </div>
            <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block">
                Edit Rights (Modify/Approve)
              </span>
              <span className="text-sm font-extrabold text-amber-900">
                {editCount} / {totalModulesCount} Modules
              </span>
            </div>
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 block">
                Delete Rights (Remove)
              </span>
              <span className="text-sm font-extrabold text-rose-900">
                {deleteCount} / {totalModulesCount} Modules
              </span>
            </div>
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
        </div>

        {/* Main Permissions Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/3">CRM Module & Purpose</th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View (Read)</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('view', true)}
                      className="text-[9px] bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('view', false)}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Create (Add)</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('create', true)}
                      className="text-[9px] bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('create', false)}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit (Update)</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('edit', true)}
                      className="text-[9px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('edit', false)}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </th>
                <th className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete (Remove)</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('delete', true)}
                      className="text-[9px] bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleColumn('delete', false)}
                      className="text-[9px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </th>
                <th className="p-3 text-right">Row Quick Action & Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.map((m) => {
                const Icon = MODULE_ICONS[m.id] || LayoutDashboard;
                const perms = activeMatrixMap[m.id] || {
                  view: false,
                  create: false,
                  edit: false,
                  delete: false,
                };
                const summary = getModuleAccessSummary(perms);
                const allEnabled = perms.view && perms.create && perms.edit && perms.delete;

                const isViewCustom =
                  matrixMode === 'user' &&
                  selectedUser &&
                  isUserActionOverridden(selectedUser, m.id, 'view');
                const isCreateCustom =
                  matrixMode === 'user' &&
                  selectedUser &&
                  isUserActionOverridden(selectedUser, m.id, 'create');
                const isEditCustom =
                  matrixMode === 'user' &&
                  selectedUser &&
                  isUserActionOverridden(selectedUser, m.id, 'edit');
                const isDeleteCustom =
                  matrixMode === 'user' &&
                  selectedUser &&
                  isUserActionOverridden(selectedUser, m.id, 'delete');

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    {/* Module Info */}
                    <td className="p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900">{m.label}</span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {m.section}
                            </span>
                            {(isViewCustom || isCreateCustom || isEditCustom || isDeleteCustom) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                User Custom
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* View Right */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(m.id, 'view')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          perms.view
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${isViewCustom ? 'ring-2 ring-amber-400/60' : ''}`}
                      >
                        {perms.view ? (
                          <Check className="w-3 h-3 text-blue-700" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{perms.view ? 'Allowed' : 'Denied'}</span>
                      </button>
                    </td>

                    {/* Create Right */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(m.id, 'create')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          perms.create
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${isCreateCustom ? 'ring-2 ring-amber-400/60' : ''}`}
                      >
                        {perms.create ? (
                          <Check className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{perms.create ? 'Allowed' : 'Denied'}</span>
                      </button>
                    </td>

                    {/* Edit Right */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(m.id, 'edit')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          perms.edit
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${isEditCustom ? 'ring-2 ring-amber-400/60' : ''}`}
                      >
                        {perms.edit ? (
                          <Check className="w-3 h-3 text-amber-700" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{perms.edit ? 'Allowed' : 'Denied'}</span>
                      </button>
                    </td>

                    {/* Delete Right */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(m.id, 'delete')}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          perms.delete
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${isDeleteCustom ? 'ring-2 ring-amber-400/60' : ''}`}
                      >
                        {perms.delete ? (
                          <Check className="w-3 h-3 text-rose-700" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{perms.delete ? 'Allowed' : 'Denied'}</span>
                      </button>
                    </td>

                    {/* Access Level & Quick Row Toggle */}
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleModuleRow(m.id, !allEnabled)}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          {allEnabled ? 'Clear Row' : 'Grant All'}
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${summary.color}`}
                        >
                          {summary.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
