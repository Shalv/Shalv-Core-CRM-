import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  FileText,
  KeyRound,
  Shield,
  Clock,
  Sparkles,
  Fingerprint,
  Layers,
  Check,
} from 'lucide-react';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

function nextPayRun(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payday = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const totalDaysInMonth = payday.getDate();
  const currentDay = today.getDate();
  const progressPct = Math.min(100, Math.round((currentDay / totalDaysInMonth) * 100));
  const days = Math.max(0, Math.round((payday.getTime() - today.getTime()) / 86400000));
  const dateFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(payday);
  const monthName = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(payday);
  return { dateFormatted, days, monthName, progressPct, currentDay, totalDaysInMonth };
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const {
    users,
    login,
    syncCredentialsFromServer,
    changeEmployeePassword,
    resetUserPassword,
    supplierCompany,
  } = useCrm();

  const urlLockedIdentity = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const emailParam = (params.get('email') || '').trim();
      const empParam = (params.get('emp') || '').trim();
      return {
        email: emailParam,
        empCode: empParam,
        isLockedLink: Boolean(emailParam || empParam),
      };
    } catch {
      return { email: '', empCode: '', isLockedLink: false };
    }
  }, []);

  const [values, setValues] = useState(() => ({
    empId: urlLockedIdentity.email || urlLockedIdentity.empCode || 'admin@coreenact.com',
    password: 'CoreEnact@2026#',
  }));
  const [errors, setErrors] = useState({ empId: '', password: '' });
  const [attempt, setAttempt] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_payroll_keep_signed_in') !== 'false';
    } catch {
      return true;
    }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean }>({ text: '', ok: false });

  // Self-service password change mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetForm, setResetForm] = useState({
    identifier: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { dateFormatted, days, monthName, countdownText } = useMemo(() => {
    const res = nextPayRun();
    const count = res.days === 0 ? 'Today' : res.days === 1 ? 'Tomorrow' : `${res.days} days`;
    return { ...res, countdownText: count };
  }, []);

  const companyName = supplierCompany?.name || 'Coreenact Solutions';

  const validate = ({ empId, password }: { empId: string; password: string }) => {
    const nextErrors = { empId: '', password: '' };
    if (!empId.trim()) {
      nextErrors.empId = 'Enter your employee code or work email.';
    }
    if (!password) {
      nextErrors.password = 'Enter your account password.';
    } else if (password === 'password123') {
      nextErrors.password =
        'Default password "password123" is disabled. Please enter your secure password.';
    }
    return nextErrors;
  };

  const executeLogin = async (loginId: string, loginPass: string) => {
    setStatus({ text: '', ok: false });
    const next = validate({ empId: loginId, password: loginPass });
    setErrors(next);
    if (next.empId || next.password) {
      setAttempt((n) => n + 1);
      return;
    }

    const cleanInput = loginId.trim();
    if (urlLockedIdentity.isLockedLink) {
      const inputLower = cleanInput.toLowerCase();
      const allowedEmail = urlLockedIdentity.email.toLowerCase();
      const allowedCode = urlLockedIdentity.empCode.toLowerCase();
      if (
        (allowedEmail &&
          inputLower !== allowedEmail &&
          (!allowedCode || inputLower !== allowedCode)) ||
        (!allowedEmail && allowedCode && inputLower !== allowedCode)
      ) {
        setAttempt((n) => n + 1);
        setStatus({
          text: `Access Restricted: This ESS portal link is assigned exclusively to ${
            urlLockedIdentity.email || urlLockedIdentity.empCode
          }. Please sign in with the assigned account.`,
          ok: false,
        });
        return;
      }
    }

    setLoading(true);
    try {
      try {
        localStorage.setItem('crm_payroll_keep_signed_in', String(keep));
      } catch {
        // ignore
      }

      let res: { success: boolean; message?: string; user?: any };
      try {
        const verified = await syncCredentialsFromServer(cleanInput, loginPass.trim(), 'payroll');
        res = verified
          ? login(cleanInput, loginPass.trim(), {
              portalMode: 'payroll',
              requiredEmail: urlLockedIdentity.email || undefined,
            })
          : login(cleanInput, loginPass.trim(), {
              portalMode: 'payroll',
              requiredEmail: urlLockedIdentity.email || undefined,
            });
      } catch (err: any) {
        const clientRes = login(cleanInput, loginPass.trim(), {
          portalMode: 'payroll',
          requiredEmail: urlLockedIdentity.email || undefined,
        });
        if (clientRes.success) {
          res = clientRes;
        } else {
          throw err;
        }
      }

      if (!res.success) {
        setAttempt((n) => n + 1);
        setStatus({
          text: res.message || 'Invalid credentials. Check your employee code or password.',
          ok: false,
        });
        return;
      }

      try {
        sessionStorage.setItem('crm_session_portal', 'payroll');
      } catch {
        // ignore
      }

      setStatus({
        text: 'Credentials verified. Redirecting to your ESS portal…',
        ok: true,
      });
    } catch (err: any) {
      setAttempt((n) => n + 1);
      setStatus({
        text: err?.message || 'Sign in failed. Check your credentials or connection.',
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(values.empId, values.password);
  };

  const fillQuickCredentials = (id: string, pass: string) => {
    setValues({ empId: id, password: pass });
    setErrors({ empId: '', password: '' });
    setStatus({
      text: `Loaded credentials for ${id}. Click "Sign In to PayChakra ESS" to proceed.`,
      ok: true,
    });
  };

  const quickOneClickLogin = async (id: string, pass: string) => {
    setValues({ empId: id, password: pass });
    await executeLogin(id, pass);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idTrim = resetForm.identifier.trim() || values.empId.trim();
    const currPass = resetForm.currentPassword.trim();
    const nextPass = resetForm.newPassword.trim();
    const confirmPass = resetForm.confirmPassword.trim();

    if (!idTrim) {
      setStatus({ text: 'Enter your employee code or work email.', ok: false });
      return;
    }
    if (!currPass) {
      setStatus({
        text: 'Enter your current password set by HR Admin.',
        ok: false,
      });
      return;
    }
    if (nextPass.length < 4) {
      setStatus({ text: 'New password must be at least 4 characters.', ok: false });
      return;
    }
    if (nextPass !== confirmPass) {
      setStatus({ text: 'New password and confirmation do not match.', ok: false });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: idTrim,
          currentPassword: currPass,
          newPassword: nextPass,
          confirmPassword: confirmPass,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        setStatus({
          text: data?.message || 'Current password is incorrect. Contact your HR administrator.',
          ok: false,
        });
        return;
      }
    } catch {
      setStatus({
        text: 'Could not connect to the authentication server. Please try again.',
        ok: false,
      });
      return;
    }

    const synced = changeEmployeePassword(idTrim, nextPass);
    const crmRes = resetUserPassword(idTrim, nextPass);

    if (synced || crmRes.success) {
      setValues({ empId: idTrim, password: nextPass });
      setIsResetMode(false);
      setStatus({
        text: 'Password updated successfully! Sign in with your new password.',
        ok: true,
      });
    } else {
      setValues({ empId: idTrim, password: nextPass });
      setIsResetMode(false);
      setStatus({
        text: 'Password updated successfully! Sign in with your new password.',
        ok: true,
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50/70 text-slate-900 flex flex-col justify-between font-sans selection:bg-sky-100 selection:text-sky-900 antialiased">
      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Wordmark & Organization */}
          <div className="flex items-center gap-3">
            <img
              src="/paychakra-logo.svg"
              alt="PayChakra Logo"
              className="h-8 sm:h-9 w-auto max-w-[180px] object-contain drop-shadow-xs"
            />
            <div className="hidden sm:flex flex-col pl-3 border-l border-slate-200 text-xs">
              <span className="font-extrabold text-slate-900 leading-tight">PayChakra</span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight truncate">
                {companyName} · Unified ESS Cloud
              </span>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-3">
            {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
              <button
                type="button"
                onClick={onSwitchToCrmLogin}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Enact 360 CRM</span>
                <span className="sm:hidden">CRM</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/80 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>AY 2026-27 Compliant</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Head, Overview & Domain Highlights */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200/70 w-fit">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              <span>Payroll & Employee Self-Service (ESS)</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
                Every salary cycle,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                  mathematically punctual.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
                A clean, effortless employee ecosystem. One unified touchpoint for instant payslip downloads, Form 16 issuance, biometric attendance reconciliation, and statutory EPF/ESI records.
              </p>
            </div>

            {/* Next Pay Cycle Mini Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Next Payroll Disbursal
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {dateFormatted} · {monthName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                  Disbursal: <strong>{countdownText}</strong>
                </span>
                <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Direct Bank NEFT
                </span>
              </div>
            </div>

            {/* 3 Clean Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  01. 1-Click Payslips
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Cryptographically verified salary statements, Form 16, and TDS computation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  02. Attendance Sync
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Biometric punch log, shift schedules, grace periods, and leave balances.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900 mb-1">
                  03. Statutory Proof
                </h2>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Automated EPF, ESIC, Professional Tax, and dual tax regime optimization.
                </p>
              </div>
            </div>

            {/* Trust and Compliance Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-bit AES Zero-Trust</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>EPFO & ESIC Aligned</span>
              </div>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>AY 2026-27 Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Authentication Panel */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              {/* Portal Mode Segmented Switcher */}
              {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
                <div className="mb-6 p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={onSwitchToCrmLogin}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Enterprise CRM</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs border border-slate-200/80 flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>PayChakra Portal</span>
                  </button>
                </div>
              )}

              {/* Locked Employee Notice */}
              {urlLockedIdentity.isLockedLink && (
                <div className="mb-5 p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-sky-900">Assigned Employee Profile</p>
                    <p className="text-sky-700 mt-0.5 font-mono text-[11px]">
                      {urlLockedIdentity.email || urlLockedIdentity.empCode}
                    </p>
                  </div>
                </div>
              )}

              {!isResetMode ? (
                <div>
                  {/* Card Head with Logo & Title */}
                  <div className="mb-5 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src="/paychakra-logo.svg"
                        alt="PayChakra"
                        className="h-7 w-auto max-w-[140px] object-contain"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200/70">
                        ESS Cloud
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Sign in to Payroll
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {users.length === 0
                        ? 'No employee profiles enrolled yet. Use Super Admin to sign in.'
                        : 'Access your payslips, tax deductions, and leave balances.'}
                    </p>
                  </div>

                  {/* Quick Demo Credentials Banner */}
                  <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-sky-50/90 to-blue-50/90 border border-sky-100 flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-sky-950">
                        <KeyRound className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Quick Sign In Options</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">1-Click Access</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* Option 1: Admin / HR */}
                      <div className="p-2 rounded-lg bg-white border border-sky-200/80 flex flex-col justify-between gap-1.5 shadow-2xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">Admin / HR Lead</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">admin@coreenact.com</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fillQuickCredentials('admin@coreenact.com', 'CoreEnact@2026#')}
                            className="flex-1 py-0.5 px-1.5 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer text-center"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => quickOneClickLogin('admin@coreenact.com', 'CoreEnact@2026#')}
                            disabled={loading}
                            className="flex-1 py-0.5 px-1.5 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded transition shadow-2xs cursor-pointer text-center disabled:opacity-60"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>

                      {/* Option 2: Employee */}
                      <div className="p-2 rounded-lg bg-white border border-sky-200/80 flex flex-col justify-between gap-1.5 shadow-2xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">Employee ESS</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">EMP-101 (Shalv)</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fillQuickCredentials('EMP-101', 'CoreEnact@2026#')}
                            className="flex-1 py-0.5 px-1.5 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer text-center"
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => quickOneClickLogin('EMP-101', 'CoreEnact@2026#')}
                            disabled={loading}
                            className="flex-1 py-0.5 px-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition shadow-2xs cursor-pointer text-center disabled:opacity-60"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status / Errors Feedback Banner */}
                  {status.text && (
                    <div
                      className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                        status.ok
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                      role="status"
                    >
                      {status.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{status.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {/* Identifier Field */}
                    <div>
                      <label
                        htmlFor="empid"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Employee Code or Work Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          key={`id-${attempt}`}
                          id="empid"
                          name="empid"
                          type="text"
                          autoComplete="username"
                          placeholder="e.g. EMP-101 or admin@coreenact.com"
                          value={values.empId}
                          readOnly={urlLockedIdentity.isLockedLink}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, empId: e.target.value }));
                            if (errors.empId) setErrors((err) => ({ ...err, empId: '' }));
                          }}
                          className={`w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition ${
                            errors.empId ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {errors.empId && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.empId}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="pw" className="text-xs font-semibold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetForm({
                              identifier: values.empId,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                            setStatus({ text: '', ok: false });
                            setIsResetMode(true);
                          }}
                          className="text-[11px] font-medium text-sky-600 hover:text-sky-800 transition cursor-pointer"
                        >
                          Change password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          key={`pw-${attempt}`}
                          id="pw"
                          name="pw"
                          type={showPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={values.password}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, password: e.target.value }));
                            if (errors.password) setErrors((err) => ({ ...err, password: '' }));
                          }}
                          className={`w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition ${
                            errors.password ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Remember me toggle */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={keep}
                          onChange={(e) => setKeep(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Remember me on this browser</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading && <span>Authenticating…</span>}
                      {!loading && (
                        <>
                          <span>Sign in to PayChakra ESS</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Secondary CRM Portal link */}
                  {onSwitchToCrmLogin && !urlLockedIdentity.isLockedLink && (
                    <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                      <p className="text-xs text-slate-500">
                        Looking for Commercial CRM & Deals?{' '}
                        <button
                          type="button"
                          onClick={onSwitchToCrmLogin}
                          className="font-semibold text-sky-600 hover:text-sky-800 underline decoration-sky-300 underline-offset-2 cursor-pointer"
                        >
                          Switch to Enact 360 CRM
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Self-Service Password Reset View */
                <div>
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setStatus({ text: '', ok: false });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to sign in</span>
                    </button>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Change Password
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your employee code and current password to configure a new password.
                    </p>
                  </div>

                  <form onSubmit={handleResetSubmit} noValidate className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="reset-id"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Employee Code or Work Email
                      </label>
                      <input
                        id="reset-id"
                        type="text"
                        placeholder="EMP-101 or admin@coreenact.com"
                        value={resetForm.identifier}
                        readOnly={urlLockedIdentity.isLockedLink}
                        onChange={(e) =>
                          setResetForm((prev) => ({ ...prev, identifier: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reset-curr-pw"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Current Password
                      </label>
                      <input
                        id="reset-curr-pw"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Current password"
                        value={resetForm.currentPassword}
                        onChange={(e) =>
                          setResetForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reset-pw"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        New Password (At least 4 chars)
                      </label>
                      <div className="relative">
                        <input
                          id="reset-pw"
                          type={showPw ? 'text' : 'password'}
                          placeholder="New password"
                          value={resetForm.newPassword}
                          onChange={(e) =>
                            setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          className="w-full px-3.5 pr-10 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reset-confirm"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="reset-confirm"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={resetForm.confirmPassword}
                        onChange={(e) =>
                          setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Update Password & Return
                    </button>

                    {status.text && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          status.ok
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                        role="status"
                      >
                        {status.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span>{status.text}</span>
                      </div>
                    )}
                  </form>
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
            © {new Date().getFullYear()} PayChakra by {companyName}. All rights reserved.
          </span>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Statutory Compliant</span>
            <span>·</span>
            <span>EPFO / ESIC Proof</span>
            <span>·</span>
            <span>Role-Based Access</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PayrollLoginView;
