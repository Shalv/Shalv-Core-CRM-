import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  Building2,
  Users,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Receipt,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';

export interface LoginViewProps {
  onSwitchToPayrollLogin?: () => void;
}

const ADMIN_SIGNIN_IDENTIFIERS = new Set([
  'admin',
  'admin@coreenact.com',
  'superadmin',
  'administrator',
  'shalv',
  'shalv sharma',
  'shalv@coreenact.com',
  'shalv.sharma@coreenact.com',
  'shalvsharma89@gmail.com',
  'shalvpersonal@gmail.com',
  'coreenactsolutions@gmail.com',
  'coreenactsolutions',
  'coreenact',
  'admin@coreenactsolutions.com',
  'info@coreenact.com',
  'infor@coreenact.com',
  'emp-101',
  'emp101',
  'emp-001',
  'emp001',
]);

export const LoginView: React.FC<LoginViewProps> = ({ onSwitchToPayrollLogin }) => {
  const {
    users,
    addUser,
    login,
    syncCredentialsFromServer,
    clearStaleAdminCredentialCache,
    changeEmployeePassword,
    supplierCompany,
  } = useCrm();

  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return 'admin@coreenact.com';
    const e = new URLSearchParams(window.location.search).get('email');
    return e ? decodeURIComponent(e) : 'admin@coreenact.com';
  });

  const [password, setPassword] = useState('CoreEnact@2026#');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // First-login password change state
  const [firstLoginTarget, setFirstLoginTarget] = useState<{
    email: string;
    name: string;
    tempPass: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdChangeError, setPwdChangeError] = useState<string | null>(null);

  const companyName = supplierCompany?.name || 'Coreenact Solutions';

  const fillAdminCredentials = () => {
    setEmail('admin@coreenact.com');
    setPassword('CoreEnact@2026#');
    setErrors({});
    setInfoNotice('Default administrator credentials filled (admin@coreenact.com). Click "Sign in to CRM Workspace" to continue.');
  };

  const quickOneClickAdminLogin = async () => {
    setEmail('admin@coreenact.com');
    setPassword('CoreEnact@2026#');
    await executeLogin('admin@coreenact.com', 'CoreEnact@2026#');
  };

  const validate = (emailVal: string, passwordVal: string) => {
    const errs: Record<string, string> = {};
    if (!emailVal.trim()) {
      errs.email = 'Enter your work email, username, or Employee Code.';
    }
    if (!passwordVal) {
      errs.password = 'Enter your password.';
    } else if (passwordVal === 'password123') {
      errs.password = 'The default password "password123" is disabled. Please enter your secure password.';
    }
    return errs;
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setInfoNotice(null);
    const errs = validate(loginEmail, loginPass);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('loading');

    // Initial setup if no users exist in database
    if (users.length === 0) {
      const cleanEmail = loginEmail.trim().toLowerCase();
      addUser({
        name:
          cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
          'Super Admin',
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        password: loginPass.trim(),
        tempPassword: loginPass.trim(),
        role: 'Super Admin',
        department: 'Executive',
        designation: 'Managing Director / Super Admin',
        status: 'Active',
      });
      const res = login(cleanEmail, loginPass.trim(), { portalMode: 'crm' });
      if (res.success) {
        setStatus('done');
        return;
      }
    }

    const cleanEmail = loginEmail.trim();
    const cleanPassword = loginPass.trim();

    const isAdminSigninAttempt = ADMIN_SIGNIN_IDENTIFIERS.has(cleanEmail.toLowerCase());
    const healStaleAdminCache = (): boolean => {
      if (!isAdminSigninAttempt) return false;
      const { cleared } = clearStaleAdminCredentialCache('login-retry');
      if (cleared) {
        setInfoNotice(
          'Stale cached admin credentials were reset. Please sign in again with the seeded admin password.'
        );
      }
      return cleared;
    };

    let res: { success: boolean; message?: string; mustChangePassword?: boolean; user?: any };
    try {
      const verified = await syncCredentialsFromServer(cleanEmail, cleanPassword, 'crm');
      res = verified
        ? login(cleanEmail, cleanPassword, { portalMode: 'crm' })
        : login(cleanEmail, cleanPassword, { portalMode: 'crm' });
    } catch (error) {
      const failure = error instanceof Error ? error.message : 'Sign-in failed.';
      setStatus('idle');
      healStaleAdminCache();
      if (failure.toLowerCase().includes('user') || failure.toLowerCase().includes('identifier') || failure.toLowerCase().includes('account') || failure.toLowerCase().includes('email')) {
        setErrors({ email: failure });
      } else {
        setErrors({ password: failure });
      }
      return;
    }

    if (!res.success) {
      setStatus('idle');
      if (healStaleAdminCache()) {
        setErrors({});
        return;
      }
      if (res.message?.includes('user') || res.message?.includes('account') || res.message?.includes('email')) {
        setErrors({ email: res.message });
      } else {
        setErrors({ password: res.message || 'Invalid username, email, or password.' });
      }
      return;
    }

    if (res.mustChangePassword && res.user) {
      setStatus('idle');
      setFirstLoginTarget({
        email: res.user.email,
        name: res.user.name,
        tempPass: cleanPassword,
      });
      return;
    }

    setStatus('done');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleSaveNewPassword = (ev: React.FormEvent) => {
    ev.preventDefault();
    setPwdChangeError(null);
    if (!newPassword || newPassword.length < 4) {
      setPwdChangeError('New password must contain at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdChangeError('Passwords do not match. Please verify.');
      return;
    }
    if (firstLoginTarget) {
      setStatus('loading');
      changeEmployeePassword(firstLoginTarget.email, newPassword);
      const res = login(firstLoginTarget.email, newPassword);
      if (res.success) {
        setStatus('done');
      } else {
        setStatus('idle');
        setPwdChangeError(res.message || 'Failed to authenticate with new password.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/70 text-slate-900 flex flex-col justify-between font-sans selection:bg-indigo-100 selection:text-indigo-900 antialiased">
      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Wordmark & Organization */}
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" size="md" showTagline={false} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                  Enact 360
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  CRM
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 leading-tight truncate">
                {companyName} · Enterprise CRM
              </span>
            </div>
          </div>

          {/* Right Action: Quick switch to Payroll / ESS Portal */}
          {onSwitchToPayrollLogin && (
            <button
              type="button"
              onClick={onSwitchToPayrollLogin}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">PayChakra Payroll & ESS</span>
              <span className="sm:hidden">Payroll</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Head, Overview & Domain Highlights */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 w-fit">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Enterprise Commercial & Sales Engine</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
                Unified commercial velocity, from{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600">
                  first lead to GST receipt.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
                A single source of truth for qualified pipeline, milestone contracts, GST invoicing, collections, and real-time customer receivables ledger.
              </p>
            </div>

            {/* 3 Clean Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  01. Deal Pipeline
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  End-to-end lead stages, probability scoring, and automated quotations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  02. Milestone Billing
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Independent Tax Invoice & Proforma sequences with automated GST splits.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  03. Receivables Ledger
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Real-time reconciliation, TDS deductions tracking, and payment aging.
                </p>
              </div>
            </div>

            {/* Trust and Compliance Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit AES Encryption</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Role-Based Access Control</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>GST Statutory Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Authentication Panel */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              {/* Portal Mode Segmented Switcher */}
              {onSwitchToPayrollLogin && (
                <div className="mb-6 p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200/80">
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enterprise CRM</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToPayrollLogin}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>PayChakra Portal</span>
                  </button>
                </div>
              )}

              {firstLoginTarget ? (
                /* First Sign-in Mandatory Password Setup */
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>First Login · Password Setup</span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
                    Set Permanent Password
                  </h2>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Welcome, <strong className="text-slate-800">{firstLoginTarget.name}</strong>. Please set a new secure password to proceed to your workspace.
                  </p>

                  {pwdChangeError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{pwdChangeError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveNewPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 4 characters"
                          className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {status === 'loading' ? 'Saving password…' : 'Save & Open Workspace'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFirstLoginTarget(null)}
                      className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer text-center"
                    >
                      Cancel and return to sign in
                    </button>
                  </form>
                </div>
              ) : (
                /* Standard CRM Sign-in */
                <div>
                  {/* Card Head with Logo & Title */}
                  <div className="mb-5 text-left">
                    <div className="flex items-center gap-2.5 mb-2">
                      <BrandLogo variant="mark" size="sm" showTagline={false} />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                        Enact 360 Workspace
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Sign in to CRM
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your authorized administrator or user credentials to continue.
                    </p>
                  </div>

                  {/* Informational Notice */}
                  {infoNotice && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-start gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                      <span className="leading-relaxed">{infoNotice}</span>
                    </div>
                  )}

                  {/* Errors */}
                  {errors.password && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{errors.password}</span>
                    </div>
                  )}

                  {/* 1-Click Quick Admin Demo Sign In */}
                  <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-100 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Administrator Account</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono truncate">
                        admin@coreenact.com
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={fillAdminCredentials}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition shadow-2xs cursor-pointer"
                        title="Fill fields with admin credentials"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={quickOneClickAdminLogin}
                        disabled={status === 'loading'}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-60"
                        title="Sign in immediately with default administrator credentials"
                      >
                        <Check className="w-3 h-3" />
                        <span>1-Click Sign In</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={submit} className="space-y-4">
                    {/* Identifier Field */}
                    <div>
                      <label htmlFor="crm-identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Work Email or Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="crm-identifier"
                          type="text"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors({ ...errors, email: '' });
                          }}
                          placeholder="admin@coreenact.com"
                          className={`w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition ${
                            errors.email ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="crm-password" className="text-xs font-semibold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setInfoNotice(
                              'Default administrator credentials are admin@coreenact.com / CoreEnact@2026#. You can manage user credentials in Masters > Users.'
                            )
                          }
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          Need credentials?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="crm-password"
                          type={show ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors({ ...errors, password: '' });
                          }}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShow(!show)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={show ? 'Hide password' : 'Show password'}
                        >
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me row */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Remember me on this browser</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {status === 'loading' && <span>Authenticating…</span>}
                      {status === 'done' && <span>Signed in! Opening workspace…</span>}
                      {status === 'idle' && (
                        <>
                          <span>Sign in to CRM Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Secondary Payroll Portal link */}
                  {onSwitchToPayrollLogin && (
                    <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                      <p className="text-xs text-slate-500">
                        Looking for Employee Self-Service or Attendance?{' '}
                        <button
                          type="button"
                          onClick={onSwitchToPayrollLogin}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-2 cursor-pointer"
                        >
                          Switch to PayChakra Portal
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white px-4 sm:px-8 lg:px-12 py-3.5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>
            © {new Date().getFullYear()} {companyName} · Enact 360 Enterprise CRM
          </span>
          <div className="flex items-center gap-3 text-slate-500">
            <span>GST & Tax Compliant</span>
            <span>·</span>
            <span>Role-Based Access</span>
            <span>·</span>
            <span>ISO Security Aligned</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginView;
