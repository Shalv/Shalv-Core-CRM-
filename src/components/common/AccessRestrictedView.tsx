import React from 'react';
import { useCrm } from '../../context/CrmContext';
import { CrmModuleKey } from '../../types';
import { ALL_CRM_MODULES } from '../../data/initialData';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  ShieldAlert,
  ArrowLeft,
  Settings,
  Users,
  EyeOff,
  Check,
  X,
  LogIn,
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface AccessRestrictedViewProps {
  moduleKey: string;
  onNavigate: (module: string, itemId?: string) => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  moduleKey,
  onNavigate,
}) => {
  const {
    currentUser,
    users,
    loginAsUser,
    rolePermissions,
    hasPermission,
  } = useCrm();

  const moduleInfo = ALL_CRM_MODULES.find((m) => m.id === moduleKey) || {
    id: moduleKey as CrmModuleKey,
    label: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
    section: 'CRM System',
    description: 'This module is protected by enterprise security rules.',
  };

  const typedKey = moduleKey as CrmModuleKey;
  const viewAllowed = hasPermission(typedKey, 'view');
  const createAllowed = hasPermission(typedKey, 'create');
  const editAllowed = hasPermission(typedKey, 'edit');
  const deleteAllowed = hasPermission(typedKey, 'delete');

  // CRM profiles only - a Payroll-Only employee never holds CRM access, so listing them as an
  // alternative to ask for access would send the admin to someone who cannot grant it.
  const otherUsers = crmVisibleUsers(users).filter(
    (u) => u.id !== currentUser.id && u.status !== 'Inactive'
  );

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <span>Access Restricted</span>
                <span>·</span>
                <span>Role-Based Security Policy</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                View Permission Required for {moduleInfo.label}
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-xl">
                Your currently logged-in account does not possess read/view privileges for this section of the CRM.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* User Account Context */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold text-xs"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{currentUser.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                Role: {currentUser.role}
              </span>
              <span className="text-slate-500 text-[11px]">
                {currentUser.department} Dept
              </span>
            </div>
          </div>

          {/* Module Rights Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Your Current Rights for {moduleInfo.label}:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">View (Read)</span>
                  <X className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-[11px] text-rose-700 font-bold">
                  {viewAllowed ? 'Allowed' : 'Denied'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${createAllowed ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Create (Add)</span>
                  {createAllowed ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
                </div>
                <div className={`text-[11px] font-bold ${createAllowed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {createAllowed ? 'Allowed' : 'Denied'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${editAllowed ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Edit (Update)</span>
                  {editAllowed ? <Check className="w-4 h-4 text-amber-600" /> : <X className="w-4 h-4 text-slate-400" />}
                </div>
                <div className={`text-[11px] font-bold ${editAllowed ? 'text-amber-700' : 'text-slate-500'}`}>
                  {editAllowed ? 'Allowed' : 'Denied'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${deleteAllowed ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Delete (Remove)</span>
                  {deleteAllowed ? <Check className="w-4 h-4 text-rose-600" /> : <X className="w-4 h-4 text-slate-400" />}
                </div>
                <div className={`text-[11px] font-bold ${deleteAllowed ? 'text-rose-700' : 'text-slate-500'}`}>
                  {deleteAllowed ? 'Allowed' : 'Denied'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Role Testing Switcher (Super Admin Only) */}
          {currentUser.role === 'Super Admin' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>Switch Session to Test Authorized Profiles:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {otherUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => loginAsUser(u.id)}
                    className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{u.name}</div>
                      <div className="text-[10px] text-indigo-600 font-semibold truncate">{u.role}</div>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                      Switch →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            {(currentUser.role === 'Super Admin' || currentUser.role === 'Administrator') && (
              <button
                type="button"
                onClick={() => onNavigate('masters', 'permissions')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Settings className="w-4 h-4" />
                <span>Configure Permissions in Masters</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
