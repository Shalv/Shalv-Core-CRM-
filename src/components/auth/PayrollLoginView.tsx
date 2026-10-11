import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Wallet,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Building2,
  UserCheck,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { loadAdminPolicyMaster } from '../payroll/payrollTypes';

interface PayrollLoginViewProps {
  onSwitchToCrmLogin?: () => void;
}

export const PayrollLoginView: React.FC<PayrollLoginViewProps> = ({ onSwitchToCrmLogin }) => {
  const { login, syncCredentialsFromServer, supplierCompany } = useCrm();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const policyMaster = useMemo(() => loadAdminPolicyMaster(), []);

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Please enter your Employee Code (e.g. EMP-001) or registered work email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const verified = await syncCredentialsFromServer(cleanInput, password);
      const res = verified ? login(cleanInput, password, {portalMode:'payroll'}) : {success:false, message:'Sign-in failed. Check your credentials and server connection.'};

      if (!res.success) {
        setError(
          res.message ||
            'Invalid Employee Code or password. Please verify your credentials or check with your HR Administrator.'
        );
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center px-4 py-8 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
      <div className="w-full max-w-md min-w-0">
        {/* Brand */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center justify-center bg-white rounded-xl px-5 py-2.5 shadow-lg border border-slate-700">
            <BrandLogo size="sm" variant="full" theme="light" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-0">
          {/* Top Switcher Tab between CRM and Payroll */}
          {onSwitchToCrmLogin && (
            <div className="p-3 bg-slate-100 border-b border-slate-200">
              <div className="p-1 bg-slate-200/80 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSwitchToCrmLogin}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/70 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enterprise CRM</span>
                </button>
                <button
                  type="button"
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs border border-slate-200 flex items-center justify-center gap-1.5 cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>Employee Payroll</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">ESS</span>
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="px-6 pt-5 pb-4 text-center space-y-1 border-b border-slate-100 bg-teal-50/40">
            <div className="inline-flex items-center gap-1.5 text-[#1f7e9e] text-[11px] font-bold uppercase tracking-wider">
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span>Dedicated Employee Portal</span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
              Employee Payroll &amp; ESS Sign In
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Separate login portal for employees to view monthly payslips, track attendance records, leave balances, and salary structure.
            </p>
          </div>

          <div className="p-6 space-y-4">
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

            <form onSubmit={handlePayrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                  Employee Code or Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. EMP-001 or employee@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-mono transition bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#1f7e9e] focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your assigned Employee Code (e.g. EMP-001) or official email registered in Payroll.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap truncate">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Default: password123</span>
                </div>
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
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer whitespace-nowrap disabled:opacity-70"
              >
                <span>{loading ? 'Signing In…' : 'Sign In to Payroll & ESS Portal'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {/* Quick Demo Employee Logins */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Quick Demo Access
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('EMP-001');
                      setPassword('password123');
                      setError('');
                    }}
                    className="text-[11px] font-medium text-slate-600 hover:text-[#1f7e9e] py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>EMP-001 (Sales Lead)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('EMP-003');
                      setPassword('password123');
                      setError('');
                    }}
                    className="text-[11px] font-medium text-slate-600 hover:text-[#1f7e9e] py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>EMP-003 (Rajesh Kumar)</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Switch back to Enterprise CRM Login */}
            {onSwitchToCrmLogin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs whitespace-nowrap">
                <span className="text-slate-500 text-[11px]">
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
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">
            {supplierCompany?.legalName || supplierCompany?.name || 'Coreenact Solutions'}
            {' · '}Dedicated Employee Payroll Portal
            {policyMaster.lastPublishedMonth ? ` · Cycle ${policyMaster.lastPublishedMonth}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayrollLoginView;
