import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Wallet,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  BadgeCheck,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import {
  loadEmployeeSalaryMasters,
  loadAdminPolicyMaster,
  EmployeeSalaryMasterRecord,
} from '../payroll/payrollTypes';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const { users, login, syncCredentialsFromServer, changeEmployeePassword, supplierCompany } = useCrm();

  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const linkedEmailParam = (urlParams.get('email') || '').trim();
  const linkedEmpCodeParam = (urlParams.get('emp') || '').trim();

  // Load enrolled payroll employees to display bound link metadata (without exposing any sensitive data)
  const payrollMasters = useMemo(() => {
    return loadEmployeeSalaryMasters(
      users,
      supplierCompany?.bankName || 'HDFC Bank Ltd',
      supplierCompany?.ifscCode || 'HDFC0001245'
    );
  }, [users, supplierCompany?.bankName, supplierCompany?.ifscCode]);

  const policyMaster = useMemo(() => loadAdminPolicyMaster(), []);

  // If the login link includes ?email=... or ?emp=..., bind the login strictly to that employee
  const linkedEmployeeRecord: EmployeeSalaryMasterRecord | null = useMemo(() => {
    const allRecords = Object.values(payrollMasters).filter(
      (m) => m && m.userId && m.enrolledInPayroll !== false
    );
    if (linkedEmailParam) {
      const clean = linkedEmailParam.toLowerCase();
      return (
        allRecords.find((m) => m.email && m.email.trim().toLowerCase() === clean) || null
      );
    }
    if (linkedEmpCodeParam) {
      const clean = linkedEmpCodeParam.toLowerCase();
      return (
        allRecords.find((m) => m.empCode && m.empCode.trim().toLowerCase() === clean) || null
      );
    }
    return null;
  }, [payrollMasters, linkedEmailParam, linkedEmpCodeParam]);

  const isLockedToInviteLink = Boolean(linkedEmailParam || linkedEmpCodeParam);

  const [identifier, setIdentifier] = useState<string>(
    () => linkedEmployeeRecord?.email || linkedEmailParam || linkedEmpCodeParam || ''
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // First-time password change state
  const [mustChangePasswordStep, setMustChangePasswordStep] = useState<boolean>(false);
  const [pendingUserEmail, setPendingUserEmail] = useState<string>('');
  const [pendingUserName, setPendingUserName] = useState<string>('');
  const [pendingEmpCode, setPendingEmpCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string>('');

  useEffect(() => {
    if (linkedEmployeeRecord?.email) {
      setIdentifier(linkedEmployeeRecord.email);
    } else if (linkedEmailParam) {
      setIdentifier(linkedEmailParam);
    } else if (linkedEmpCodeParam) {
      setIdentifier(linkedEmpCodeParam);
    }
  }, [linkedEmployeeRecord, linkedEmailParam, linkedEmpCodeParam]);

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordChangeSuccess('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Please enter your registered Payroll Email ID or Employee Code.');
      return;
    }
    if (!password) {
      setError('Please enter your Payroll password.');
      return;
    }

    let res = login(cleanInput, password, {
      portalMode: 'payroll',
    });

    if (!res.success && !/inactive/i.test(res.message || '')) {
      if (await syncCredentialsFromServer(cleanInput, password)) {
        res = login(cleanInput, password, { portalMode: 'payroll' });
      }
    }

    if (!res.success) {
      setError(
        res.message ||
          'Invalid Payroll credentials. Please check the Email ID and Password shared by your Payroll Administrator.'
      );
      return;
    }
  };

  const handleSetPermanentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.trim().length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Confirm password does not match your new password.');
      return;
    }

    const ok = changeEmployeePassword(pendingUserEmail, newPassword.trim());
    if (ok) {
      setPasswordChangeSuccess(
        'Permanent password activated! Signing you into your personal Payroll & ESS Portal...'
      );
      setTimeout(() => {
        setMustChangePasswordStep(false);
        login(pendingUserEmail, newPassword.trim(), {
          portalMode: 'payroll',
        });
      }, 400);
    } else {
      setError('Could not update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center px-4 py-8 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
      <div className="w-full max-w-md min-w-0">
        {/* Brand */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center justify-center bg-white rounded-xl px-5 py-2.5 shadow-sm border border-slate-200">
            <BrandLogo size="sm" variant="full" theme="light" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-5 text-center space-y-1.5 border-b border-slate-100 bg-slate-50/60">
            <div className="inline-flex items-center gap-1.5 text-[#1f7e9e] text-[11px] font-bold uppercase tracking-wider">
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span>Payroll &amp; ESS Portal</span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
              {mustChangePasswordStep ? 'Set Your Payroll Password' : 'Employee Sign In'}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mustChangePasswordStep
                ? 'Admin has set your login password. Create your own permanent password.'
                : 'Sign in with the payroll credentials from your administrator.'}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Bound Employee Invite Link Notice (When opened via ?portal=payroll&email=...) */}
            {isLockedToInviteLink && !mustChangePasswordStep && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1 text-xs min-w-0">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5 min-w-0 truncate">
                    <BadgeCheck className="w-4 h-4 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Dedicated Employee Login Link</span>
                  </span>
                  {linkedEmployeeRecord && (
                    <span className="font-mono font-bold text-[11px] text-teal-900 shrink-0">
                      {linkedEmployeeRecord.empCode}
                    </span>
                  )}
                </div>
                {linkedEmployeeRecord ? (
                  <div className="text-[11px] text-teal-900 space-y-0.5 min-w-0">
                    <div className="truncate">
                      Employee: <strong>{linkedEmployeeRecord.name}</strong> (
                      {linkedEmployeeRecord.designation || linkedEmployeeRecord.role})
                    </div>
                    <div className="text-teal-700 truncate">
                      Bound to <strong className="font-mono">{linkedEmployeeRecord.email}</strong>{' '}
                      (Own profile access only)
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-teal-800 truncate">
                    Bound to account:{' '}
                    <strong className="font-mono">
                      {linkedEmailParam || linkedEmpCodeParam}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed min-w-0 break-words">{error}</div>
              </div>
            )}

            {/* Success Alert */}
            {passwordChangeSuccess && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-semibold leading-relaxed min-w-0">{passwordChangeSuccess}</div>
              </div>
            )}

            {/* STEP 1: STANDARD CREDENTIAL SIGN IN */}
            {!mustChangePasswordStep ? (
              <form onSubmit={handlePayrollSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                    Email ID or Employee Code
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="employee@company.com or EMP-101"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-mono transition bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#1f7e9e] focus:outline-hidden"
                    />
                  </div>
                  {linkedEmailParam && (
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 whitespace-nowrap overflow-hidden">
                      <Lock className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">
                        Pre-filled from your personal login link
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1f7e9e] focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer whitespace-nowrap"
                >
                  <span>Sign In to My Payroll &amp; ESS Portal</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </form>
            ) : (
              /* STEP 2: FIRST-LOGIN PASSWORD CHANGE (optional) */
              <form onSubmit={handleSetPermanentPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="truncate">
                      Welcome, {pendingUserName} ({pendingEmpCode})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Admin has set your login password. You can set your own permanent password to
                    secure your payroll profile.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                    New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1f7e9e] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                    Confirm New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1f7e9e] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMustChangePasswordStep(false);
                      setError('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap min-w-0"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Save Password &amp; Sign In</span>
                  </button>
                </div>
              </form>
            )}

            {/* Switch back to Enterprise CRM Login */}
            {onSwitchToCrmLogin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs whitespace-nowrap">
                <span className="text-slate-500 text-[11px] truncate">
                  Enterprise CRM user?
                </span>
                <button
                  type="button"
                  onClick={onSwitchToCrmLogin}
                  className="text-[#1f7e9e] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer text-xs shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>CRM Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slim Footer */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
          <span className="truncate">
            {supplierCompany?.legalName || supplierCompany?.name || 'Coreenact Solutions'}
            {' · '}Personal access only
            {policyMaster.lastPublishedMonth ? ` · Cycle ${policyMaster.lastPublishedMonth}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
