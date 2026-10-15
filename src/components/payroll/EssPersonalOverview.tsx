import React from 'react';
import {
  User,
  CalendarCheck,
  FileText,
  Receipt,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { StatTile } from '../ui/StatTile';

/**
 * Personal ESS overview for a non-admin employee.
 * Shows ONLY the signed-in employee's own information — never company-wide workforce,
 * other employees' records, or any admin data. Replaces the admin workforce dashboard
 * for self-service users.
 */
export interface EssPersonalOverviewProps {
  employee?: any;
  attendance?: any;
  leaves?: any[];
  claims?: any[];
  onNavigate?: (tab: 'payslips' | 'leaves' | 'reimbursements' | 'profile' | 'attendance') => void;
  formatCurrency?: (n: number) => string;
}

function sumLeaveBalance(balance: any): number {
  if (balance == null) return 0;
  if (typeof balance === 'number') return balance;
  if (typeof balance === 'object') {
    return Object.values(balance as Record<string, unknown>).reduce<number>((s, v) => s + (Number(v) || 0), 0);
  }
  return 0;
}

export function EssPersonalOverview({
  employee,
  attendance,
  leaves = [],
  claims = [],
  onNavigate,
  formatCurrency = (n) => String(n),
}: EssPersonalOverviewProps) {
  const name = employee?.name || 'Employee';
  const empCode = employee?.empCode || employee?.userId || '—';
  const designation = employee?.designation || employee?.role || '—';
  const department = employee?.department || '—';
  const monthlyGross = Number(employee?.monthlyGross) || 0;
  const leaveTotal = sumLeaveBalance(employee?.leaveBalance);

  const pendingLeaves = leaves.filter((l: any) => String(l?.status || '').toLowerCase().includes('pending')).length;
  const approvedLeaves = leaves.filter((l: any) => String(l?.status || '').toLowerCase().includes('approved')).length;
  const pendingClaims = claims.filter((c: any) => {
    const s = String(c?.status || '').toLowerCase();
    return s.includes('verif') || s.includes('pending') || s.includes('submitted');
  }).length;
  const approvedClaims = claims.filter((c: any) => String(c?.status || '').toLowerCase().includes('approved')).length;

  const isPunchedIn = Boolean(attendance?.punchedIn);
  const punchTime = attendance?.punchInTime || '—';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Personal hero — the employee's own identity only */}
      <section className="hero-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white grid place-items-center text-lg font-extrabold shadow-lg shadow-teal-500/25 shrink-0">
              {(name.split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase() || '').join('')) || 'E'}
            </div>
            <div className="min-w-0">
              <div className="eyebrow text-teal-700">My ESS Portal</div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight truncate">{name}</h2>
              <p className="text-[12px] text-slate-500 truncate">
                {empCode} · {designation} · {department}
              </p>
            </div>
          </div>
          <span className="chip chip-info inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Self-service · only your own records
          </span>
        </div>
      </section>

      {/* The employee's own key figures */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Monthly Gross"
          value={formatCurrency(monthlyGross)}
          sub="Your salary structure"
          tone="emerald"
          icon={<Wallet className="w-4.5 h-4.5" />}
        />
        <StatTile
          label="Leave Balance"
          value={`${leaveTotal} days`}
          sub={`${approvedLeaves} approved · ${pendingLeaves} pending`}
          tone="sky"
          icon={<FileText className="w-4.5 h-4.5" />}
        />
        <StatTile
          label="Attendance Today"
          value={isPunchedIn ? 'Punched in' : 'Not punched in'}
          sub={isPunchedIn ? `Since ${punchTime}` : 'Use Attendance to clock in'}
          tone="indigo"
          icon={<CalendarCheck className="w-4.5 h-4.5" />}
        />
        <StatTile
          label="My Claims"
          value={String(pendingClaims)}
          sub={`Pending · ${approvedClaims} approved`}
          tone="amber"
          icon={<Receipt className="w-4.5 h-4.5" />}
        />
      </section>

      {/* Self-service quick actions */}
      <section className="panel-depth p-4">
        <h3 className="text-[13px] font-bold text-slate-800 mb-3">My self-service</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'payslips', label: 'My Payslips', desc: 'View & download your salary slips', icon: Wallet },
            { key: 'leaves', label: 'My Leaves', desc: 'Apply for leave and track approvals', icon: FileText },
            { key: 'reimbursements', label: 'My Claims', desc: 'Submit expense claims and reimbursements', icon: Receipt },
            { key: 'profile', label: 'My Profile', desc: 'Your details, bank and documents', icon: User },
          ].map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => onNavigate?.(a.key as any)}
              className="text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="icon-depth icon-depth-indigo w-8 h-8"><a.icon className="w-4 h-4" /></span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition" />
              </div>
              <div className="mt-2 text-[12.5px] font-bold text-slate-800">{a.label}</div>
              <div className="text-[11px] text-slate-500">{a.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default EssPersonalOverview;
