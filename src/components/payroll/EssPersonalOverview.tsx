import React from 'react';
import { EssAttendanceCalendar } from './EssAttendanceCalendar';
import { Sparkline, AreaLineChart, DonutChart, MiniBars } from './EssCharts';
import { WorkspaceIllustration } from './EssIllustration';
import {
  CalendarCheck,
  FileText,
  Receipt,
  Wallet,
  ShieldCheck,
  LogIn,
  LogOut,
  MapPin,
  Loader2,
  Download,
  CalendarDays,
  Clock,
  AlertTriangle,
  Timer,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Plus,
  TrendingUp,
  Target,
  Home,
  Building2,
  Briefcase,
} from 'lucide-react';

/**
 * Personal ESS overview for a non-admin employee.
 * Shows ONLY the signed-in employee's own information — never company-wide workforce,
 * other employees' records, or any admin data.
 */
export interface EssPersonalOverviewProps {
  employee?: any;
  attendance?: any;
  leaves?: any[];
  claims?: any[];
  onNavigate?: (tab: 'payslips' | 'leaves' | 'reimbursements' | 'profile' | 'attendance' | 'regularization' | 'helpdesk' | 'shifts' | 'lifecycle') => void;
  formatCurrency?: (n: number) => string;
  /** Attendance punch (self-service) — GPS + office geofence enforced by the caller. */
  isFetchingLocation?: boolean;
  onPunch?: () => void;
  /** Policy CS-HR-POL-001 master (timings, grace, lunch, statutory defaults). */
  policy?: any;
  /** The employee's resolved shift (hours, weekly offs). */
  shift?: { name?: string; startTime?: string; endTime?: string; graceMins?: number; weeklyOffs?: number[] } | null;
  /** Change the work mode for today's punch. */
  onWorkModeChange?: (mode: 'Office HQ' | 'Work From Home' | 'Client Site Visit') => void;
  onDownloadPayslip?: () => void;
  onNewClaim?: () => void;
  onFileRegularization?: () => void;
  /** Loss-of-pay days recorded against this employee for the current run. */
  lopDays?: number;
  /** Label of the month the payslip download refers to. */
  payslipMonth?: string;
  /** Office location label used by the geofence. */
  officeLabel?: string;
  /** Payroll runs — used to draw the employee's own salary trend (real, stored data). */
  payrollRuns?: any[];
}

const WORK_MODES: { id: 'Office HQ' | 'Work From Home' | 'Client Site Visit'; label: string; icon: React.ReactNode }[] = [
  { id: 'Office HQ', label: 'Office HQ', icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'Work From Home', label: 'Work From Home', icon: <Home className="w-3.5 h-3.5" /> },
  { id: 'Client Site Visit', label: 'Client Site', icon: <Briefcase className="w-3.5 h-3.5" /> },
];

/** Leave quotas under policy CS-HR-POL-001. */
const LEAVE_QUOTAS: { type: string; label: string; quota: number; period: string }[] = [
  { type: 'Monthly Leave (1/Month)', label: 'Paid Monthly Leave', quota: 1, period: 'per month' },
  { type: 'Casual Leave', label: 'Casual Leave (CL)', quota: 12, period: 'per year' },
  { type: 'Sick Leave', label: 'Sick Leave (SL)', quota: 12, period: 'per year' },
  { type: 'Privilege Leave', label: 'Privilege Leave (PL)', quota: 15, period: 'per year' },
];

const leaveDays = (l: any): number => {
  if (!l) return 0;
  if (typeof l.days === 'number') return l.days;
  if (typeof l.totalDays === 'number') return l.totalDays;
  if (l.startDate && l.endDate) {
    const a = new Date(l.startDate).getTime();
    const b = new Date(l.endDate).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b)) return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }
  return 1;
};

const isApproved = (l: any) => {
  const s = String(l?.status ?? '').toLowerCase();
  return s === 'approved' || s === 'accepted';
};

export function EssPersonalOverview({
  employee,
  attendance,
  leaves = [],
  claims = [],
  onNavigate,
  formatCurrency = (n) => String(n),
  isFetchingLocation = false,
  onPunch,
  policy,
  shift,
  onWorkModeChange,
  onDownloadPayslip,
  onNewClaim,
  onFileRegularization,
  lopDays = 0,
  payslipMonth,
  officeLabel,
  payrollRuns,
}: EssPersonalOverviewProps) {
  const name = employee?.name || 'Employee';
  const empCode = employee?.empCode || employee?.userId || '—';
  const designation = employee?.designation || employee?.role || '—';
  const department = employee?.department || '—';
  const location = employee?.location || employee?.assignedTerritory || '—';
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Salary privacy: monetary values are masked by default and revealed only on demand.
  const [showSalary, setShowSalary] = React.useState(false);
  const money = (n: number) => (showSalary ? formatCurrency(n) : '••••••');

  const isPunchedIn = Boolean(attendance?.punchedIn);
  const punchTime = attendance?.punchInTime || '—';
  const punchOutTime = attendance?.punchOutTime || null;
  const workMode = attendance?.workMode || 'Office HQ';
  const alreadyOut = Boolean(!isPunchedIn && attendance?.punchInTime && attendance?.punchOutTime);
  const nextPunchLabel = isPunchedIn ? 'Punch Out' : 'Punch In';

  // ---- pay -------------------------------------------------------------------
  const gross = Number(employee?.monthlyGross) || 0;
  const basicPct = Number(policy?.defaultBasicPct ?? 50) || 50;
  const pfCap = Number(policy?.defaultPfCapBasic ?? 1800) || 1800;
  const basic = (gross * basicPct) / 100;
  const pf = Math.min(Math.round(basic * 0.12), pfCap);
  const pt = Number(policy?.defaultProfTax ?? 200) || 0;
  const tds = Math.round((gross * (Number(policy?.defaultTdsPct ?? 0) || 0)) / 100);
  const incentive = Number(employee?.incentive) || 0;
  const deductions = pf + pt + tds;
  const netInHand = Math.max(0, gross + incentive - deductions);
  const deductionPct = gross + incentive > 0 ? Math.round((deductions / (gross + incentive)) * 100) : 0;

  // ---- leave -----------------------------------------------------------------
  const approvedLeaves = leaves.filter(isApproved);
  const takenBy = (type: string) =>
    approvedLeaves.filter((l) => l?.leaveType === type).reduce((s, l) => s + leaveDays(l), 0);
  const graceLimit = Number(policy?.graceLimitPerMonth ?? 3) || 0;
  const graceUsed = Number(attendance?.graceUsedThisMonth ?? 0) || 0;
  const lateCount = Number(attendance?.lateCountThisMonth ?? 0) || 0;

  // ---- shift -----------------------------------------------------------------
  const shiftStart = shift?.startTime || policy?.shiftStartTime || '09:30 AM';
  const shiftEnd = shift?.endTime || policy?.shiftEndTime || '06:00 PM';
  const shiftName = shift?.name || 'General Shift';
  const workingSaturdays = policy?.workingSaturdays || '1st, 3rd & 5th working; 2nd & 4th off';

  // ---- claims ----------------------------------------------------------------
  const myClaims = claims || [];
  const approvedClaims = myClaims.filter((c: any) => String(c?.status ?? '').toLowerCase() === 'approved');
  const inReviewClaims = myClaims.filter((c: any) => {
    const s = String(c?.status ?? '').toLowerCase();
    return s === 'pending' || s === 'in review' || s === 'submitted';
  });
  const approvedAmount = approvedClaims.reduce((s: number, c: any) => s + (Number(c?.amount) || 0), 0);

  const geofenceRadius = Number(policy?.geofenceRadiusMeters ?? 100) || 100;

  // ---- real series for the charts (never invented) -------------------------------
  const empKey = employee?.userId || employee?.id;

  /** The employee's own net pay per payroll run, oldest → newest. */
  const salarySeries = (Array.isArray(payrollRuns) ? payrollRuns : [])
    .map((r: any) => {
      const line = (r?.lines || []).find((l: any) => l?.employeeId === empKey);
      if (!line) return null;
      const label = String(r?.month || '').slice(5) || String(r?.month || '');
      return { label, net: Number(line.net) || 0 };
    })
    .filter(Boolean)
    .slice(-6) as { label: string; net: number }[];

  /** Punched days in the current month, from the punch history. */
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const punchedDates = new Set(
    (Array.isArray(attendance?.punchHistory) ? attendance.punchHistory : [])
      .map((r: any) => r?.date)
      .filter((d: string) => typeof d === 'string' && d.startsWith(monthPrefix))
  );

  /** Leave taken by type — drives the composition donut. */
  const leaveSegments = LEAVE_QUOTAS.map((q, i) => ({
    label: q.label,
    value: takenBy(q.type),
    color: ['#4a90e2', '#f5b942', '#f2726f', '#6d4bd1'][i % 4],
  })).filter((s) => s.value > 0);
  const totalLeaveTaken = leaveSegments.reduce((s, x) => s + x.value, 0);

  /** A short, honest activity feed from the employee's own records. */
  const activity = [
    ...(Array.isArray(attendance?.punchHistory) ? attendance.punchHistory : []).slice(0, 3).map((r: any) => ({
      at: `${r.date} ${r.time}`,
      title: r.action === 'PUNCH_IN' ? 'Punched in' : 'Punched out',
      detail: r.workMode ? `Work mode: ${r.workMode}` : '',
      tone: 'mint' as const,
    })),
    ...approvedLeaves.slice(0, 2).map((l: any) => ({
      at: l.startDate || '',
      title: `${l.leaveType || 'Leave'} approved`,
      detail: l.reason || 'Approved leave',
      tone: 'blue' as const,
    })),
    ...myClaims.slice(0, 2).map((c: any) => ({
      at: c.expenseDate || c.submittedAt || '',
      title: `Claim ${String(c.status || 'submitted').toLowerCase()}`,
      detail: c.description || c.category || 'Reimbursement',
      tone: 'peach' as const,
    })),
  ].slice(0, 6);

  const actions = [
    { label: 'Apply for leave', hint: 'Leave & WFH requests', icon: <CalendarCheck className="w-4.5 h-4.5" />, onClick: () => onNavigate?.('leaves') },
    { label: 'Download payslips', hint: 'Salary statements', icon: <Download className="w-4.5 h-4.5" />, onClick: () => (onDownloadPayslip ? onDownloadPayslip() : onNavigate?.('payslips')) },
    { label: 'Submit a claim', hint: 'Reimbursements & expenses', icon: <Receipt className="w-4.5 h-4.5" />, onClick: () => (onNewClaim ? onNewClaim() : onNavigate?.('reimbursements')) },
    { label: 'File regularization', hint: 'Missed punch or WFH', icon: <Timer className="w-4.5 h-4.5" />, onClick: () => (onFileRegularization ? onFileRegularization() : onNavigate?.('regularization')) },
  ];

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------- identity + punch terminal */}
      <section className="rounded-2xl bg-slate-900 text-white p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f26522] to-[#f37438] grid place-items-center text-lg font-extrabold shadow-lg shadow-orange-500/20">
                {initials || 'EM'}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  isPunchedIn ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                title={isPunchedIn ? 'Present — punched in' : 'Not punched in'}
              />
              {isPunchedIn && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-60" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-orange-300">My ESS Portal</div>
              <h2 className="text-xl font-extrabold leading-tight truncate">{name}</h2>
              <div className="text-[12px] text-slate-300 truncate">
                {designation} · {department}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-mono tabular-nums bg-slate-800 border border-slate-700 rounded px-2 py-0.5">
                  {empCode}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3 h-3" /> {location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1 text-slate-200">
              <ShieldCheck className="w-3 h-3" /> Self-service · only your own records
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border ${
                alreadyOut
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : isPunchedIn
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              {alreadyOut
                ? `Day complete · out at ${punchOutTime}`
                : isPunchedIn
                ? `Punched in at ${punchTime}`
                : 'Not punched in yet'}
            </span>
          </div>
        </div>

        {/* work mode selector */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Work mode</span>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {WORK_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={isPunchedIn || alreadyOut}
                onClick={() => onWorkModeChange?.(m.id)}
                title={isPunchedIn ? 'Work mode is fixed once you are punched in' : `Set work mode to ${m.id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition ${
                  workMode === m.id ? 'bg-[#f26522] text-white' : 'text-slate-300 hover:text-white'
                } ${isPunchedIn || alreadyOut ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* punch terminal */}
        <div className="mt-4 rounded-xl bg-slate-800 border border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-white">Attendance terminal</div>
            <div className="text-[11px] text-slate-300 inline-flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-orange-300" />
              GPS verified · {officeLabel || 'Office'} · {geofenceRadius} m radius
              {workMode !== 'Office HQ' && <span className="text-slate-400">· geofence not applied for {workMode}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onPunch}
            disabled={alreadyOut || isFetchingLocation}
            className={`px-5 py-3 rounded-xl text-[13px] font-extrabold inline-flex items-center gap-2 transition shadow-lg ${
              alreadyOut || isFetchingLocation
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                : isPunchedIn
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : 'bg-[#f26522] text-white hover:bg-[#d9520f] shadow-orange-500/25'
            }`}
            title={alreadyOut ? 'You have already punched out for today' : `${nextPunchLabel} with GPS location`}
          >
            {isFetchingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPunchedIn ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isFetchingLocation ? 'Getting location…' : alreadyOut ? 'Completed' : nextPunchLabel}
          </button>
        </div>
      </section>

      {/* --------------------------------------------------------------- KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            chip: 'ess-chip-blue',
            icon: <CalendarCheck className="w-4.5 h-4.5" />,
            title: 'Punched days',
            sub: 'This month',
            value: String(punchedDates.size),
            delta: null as string | null,
            spark: null as number[] | null,
          },
          {
            chip: 'ess-chip-mint',
            icon: <CalendarDays className="w-4.5 h-4.5" />,
            title: 'Leave remaining',
            sub: `${totalLeaveTaken} day(s) taken`,
            value: String(
              LEAVE_QUOTAS.reduce((s, q) => s + Math.max(0, q.quota - takenBy(q.type)), 0)
            ),
            delta: null,
            spark: null,
          },
          {
            chip: 'ess-chip-amber',
            icon: <Receipt className="w-4.5 h-4.5" />,
            title: 'Claims in review',
            sub: `${approvedClaims.length} approved`,
            value: String(inReviewClaims.length),
            delta: null,
            spark: null,
          },
          {
            chip: 'ess-chip-peach',
            icon: <Wallet className="w-4.5 h-4.5" />,
            title: 'Net take-home',
            sub: 'Current cycle',
            value: money(netInHand),
            delta: salarySeries.length >= 2 ? `${salarySeries[salarySeries.length - 1].net - salarySeries[salarySeries.length - 2].net >= 0 ? '+' : ''}${formatCurrency(salarySeries[salarySeries.length - 1].net - salarySeries[salarySeries.length - 2].net)}` : null,
            spark: salarySeries.length >= 2 ? salarySeries.map((s) => s.net) : null,
          },
        ].map((k) => (
          <div key={k.title} className="ess-card p-4">
            <div className="flex items-start justify-between gap-3">
              <span className={`ess-chip ${k.chip}`}>{k.icon}</span>
              {k.spark && <Sparkline points={k.spark} color="#f26522" width={80} height={32} />}
            </div>
            <div className="mt-3 ess-kpi-title">{k.title}</div>
            <div className="ess-kpi-sub">{k.sub}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="ess-kpi-value">{k.value}</span>
              {k.delta && (
                <span className={`ess-delta ${k.delta.startsWith('-') ? 'ess-delta-down' : 'ess-delta-up'}`}>
                  {k.delta.startsWith('-') ? '↓' : '↑'} {k.delta.replace('-', '')}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* ------------------------------------------------------- trend + donut */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ess-card lg:col-span-2">
          <div className="sh-card-header">
            <div>
              <h3 className="sh-card-title">My salary trend</h3>
              <p className="text-[11.5px] text-slate-500">
                Net payable per payroll run — from your own processed payroll records
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="ess-legend-dot" style={{ background: '#4a90e2' }} /> Net payable
              </span>
            </div>
          </div>
          <div className="sh-card-body">
            {salarySeries.length >= 2 ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[20px] font-extrabold text-slate-900">
                    {money(salarySeries[salarySeries.length - 1].net)}
                  </span>
                  <span className="text-[11.5px] text-slate-500">latest net payable</span>
                </div>
                <AreaLineChart
                  series={[{ name: 'Net payable', color: '#4a90e2', points: salarySeries.map((s) => s.net) }]}
                  labels={salarySeries.map((s) => s.label)}
                  markerIndex={salarySeries.length - 1}
                  markerLabel={showSalary ? formatCurrency(salarySeries[salarySeries.length - 1].net) : '••••••'}
                  height={196}
                />
              </>
            ) : (
              <div className="py-10 text-center text-[12px] text-slate-400">
                Your salary trend appears here once two or more payroll runs have been processed for you.
              </div>
            )}
          </div>
        </div>

        <div className="ess-card">
          <div className="sh-card-header">
            <div>
              <h3 className="sh-card-title">Leave taken</h3>
              <p className="text-[11.5px] text-slate-500">By type, this year</p>
            </div>
          </div>
          <div className="sh-card-body flex flex-col items-center">
            {totalLeaveTaken > 0 ? (
              <>
                <DonutChart
                  segments={leaveSegments}
                  size={158}
                  centerLabel={`${totalLeaveTaken}`}
                  centerSub="days taken"
                />
                <div className="mt-3 w-full space-y-1.5">
                  {leaveSegments.map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-[11.5px]">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="ess-legend-dot" style={{ background: s.color }} /> {s.label}
                      </span>
                      <span className="font-bold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-[12px] text-slate-400">No leave taken this year.</div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- pay + claims */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Wallet className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Net take-home pay</h3>
                <p className="text-[11.5px] text-slate-500">{payslipMonth || 'Current cycle'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="sh-btn"
                onClick={() => setShowSalary((s) => !s)}
                title={showSalary ? 'Hide salary amounts' : 'Show salary amounts'}
                aria-pressed={showSalary}
              >
                {showSalary ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showSalary ? 'Hide salary' : 'Show salary'}
              </button>
              <button
                type="button"
                className="sh-btn sh-btn-soft"
                onClick={() => (onDownloadPayslip ? onDownloadPayslip() : onNavigate?.('payslips'))}
              >
                <Download className="w-3.5 h-3.5" /> Payslip PDF
              </button>
            </div>
          </div>
          <div className="sh-card-body space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500">In hand</div>
                <div className="text-2xl font-extrabold text-slate-900">{money(netInHand)}</div>
              </div>
              <div className="text-right text-[11.5px] text-slate-500">
                <div>Gross {money(gross)}</div>
                {incentive > 0 && <div className="text-emerald-600">+ Incentive {money(incentive)}</div>}
              </div>
            </div>

            <div className="sh-progress"><span style={{ width: `${100 - deductionPct}%` }} /></div>
            <div className="flex justify-between text-[10.5px] text-slate-500">
              <span>In hand {100 - deductionPct}%</span>
              <span>Deductions {deductionPct}%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">PF</div>
                <div className="text-[12.5px] font-bold text-slate-800">{money(pf)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Prof. Tax</div>
                <div className="text-[12.5px] font-bold text-slate-800">{money(pt)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">TDS</div>
                <div className="text-[12.5px] font-bold text-slate-800">{money(tds)}</div>
              </div>
              <div className="rounded-lg bg-rose-50 px-2.5 py-2">
                <div className="text-[10px] uppercase font-bold text-rose-600">Total out</div>
                <div className="text-[12.5px] font-bold text-rose-700">{money(deductions)}</div>
              </div>
            </div>
            {lopDays > 0 && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lopDays} loss-of-pay day(s) recorded this cycle — pay is prorated accordingly.
              </div>
            )}
          </div>
        </div>

        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Receipt className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Claims &amp; reimbursements</h3>
                <p className="text-[11.5px] text-slate-500">Queued for the next payroll cycle</p>
              </div>
            </div>
            <button type="button" className="sh-btn sh-btn-primary" onClick={() => (onNewClaim ? onNewClaim() : onNavigate?.('reimbursements'))}>
              <Plus className="w-3.5 h-3.5" /> New claim
            </button>
          </div>
          <div className="sh-card-body grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Approved (payable)</div>
              <div className="text-[15px] font-extrabold text-emerald-800">{money(approvedAmount)}</div>
              <div className="text-[10.5px] text-emerald-700">{approvedClaims.length} claim(s)</div>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2.5">
              <div className="text-[10px] uppercase font-bold text-amber-700">In review</div>
              <div className="text-[15px] font-extrabold text-amber-800">{inReviewClaims.length}</div>
              <div className="text-[10.5px] text-amber-700">awaiting approval</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- leave + shift calendar */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><CalendarDays className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Leave balances</h3>
                <p className="text-[11.5px] text-slate-500">Policy CS-HR-POL-001</p>
              </div>
            </div>
          </div>
          <div className="sh-card-body space-y-3">
            {LEAVE_QUOTAS.map((q) => {
              const taken = takenBy(q.type);
              const remaining = Math.max(0, q.quota - taken);
              const pct = q.quota > 0 ? Math.min(100, Math.round((taken / q.quota) * 100)) : 0;
              return (
                <div key={q.type}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-semibold text-slate-700">{q.label}</span>
                    <span className="text-slate-500">
                      <b className="text-slate-800">{remaining}</b> left of {q.quota} {q.period}
                    </span>
                  </div>
                  <div className="sh-progress">
                    <span
                      style={{
                        width: `${pct}%`,
                        background: pct >= 90 ? '#e70d0d' : pct >= 60 ? '#ffc107' : '#03c95a',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-semibold text-slate-700">Grace instances</span>
                <span className="text-slate-500">
                  <b className="text-slate-800">{Math.max(0, graceLimit - graceUsed)}</b> of {graceLimit} left
                </span>
              </div>
              <div className="sh-progress">
                <span style={{ width: `${graceLimit ? Math.min(100, Math.round((graceUsed / graceLimit) * 100)) : 0}%`, background: '#1b84ff' }} />
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1">
                Up to {policy?.graceEndTime || '09:45 AM'} · late marks this month: {lateCount}
              </div>
            </div>
          </div>
        </div>

        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Clock className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Shift &amp; working calendar</h3>
                <p className="text-[11.5px] text-slate-500">{shiftName}</p>
              </div>
            </div>
          </div>
          <div className="sh-card-body space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-500">Shift hours</div>
                <div className="text-[13px] font-bold text-slate-800">{shiftStart} – {shiftEnd}</div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-500">Loss of pay</div>
                <div className={`text-[13px] font-bold ${lopDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {lopDays} day(s)
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-500">Working Saturdays</div>
              <div className="text-[12px] text-slate-700">{workingSaturdays}</div>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2.5 flex items-start gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Lunch window</div>
                <div className="text-[12px] text-slate-700">
                  {policy?.lunchWindow || '1:00 PM – 2:00 PM'} · max {policy?.lunchDurationMins ?? 60} mins
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- attendance calendar */}
      <EssAttendanceCalendar attendance={attendance} leaves={leaves} policy={policy} />

      {/* --------------------------------------------------------- action hub */}
      <section className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><Target className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Quick self-service</h3>
              <p className="text-[11.5px] text-slate-500">Everything you can do without raising a ticket</p>
            </div>
          </div>
        </div>
        <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-orange-200 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="icon-depth w-9 h-9 group-hover:bg-orange-50">{a.icon}</span>
                <TrendingUp className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-400" />
              </div>
              <div className="mt-2 text-[12.5px] font-bold text-slate-800">{a.label}</div>
              <div className="text-[11px] text-slate-500">{a.hint}</div>
            </button>
          ))}
        </div>
      </section>

      {/* --------------------------------------------- illustration + activity feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ess-card p-4 flex flex-col items-center justify-center text-center">
          <WorkspaceIllustration width={200} height={140} />
          <div className="mt-2 text-[13.5px] font-bold text-slate-800">Your workspace, in one place</div>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Punch, leave, payslips, claims and requests — all self-service, all yours.
          </p>
          <button
            type="button"
            className="sh-btn sh-btn-primary mt-3"
            onClick={() => (onDownloadPayslip ? onDownloadPayslip() : onNavigate?.('payslips'))}
          >
            <Download className="w-3.5 h-3.5" /> Get my latest payslip
          </button>
        </div>

        <div className="ess-card lg:col-span-2">
          <div className="sh-card-header">
            <div>
              <h3 className="sh-card-title">My activity</h3>
              <p className="text-[11.5px] text-slate-500">Your own punches, leaves and claims</p>
            </div>
          </div>
          <div className="sh-card-body">
            {activity.length > 0 ? (
              activity.map((a, i) => (
                <div key={`${a.at}-${i}`} className="ess-row">
                  <span
                    className={`ess-avatar`}
                    style={{
                      background:
                        a.tone === 'mint' ? '#0f9d58' : a.tone === 'blue' ? '#4a90e2' : '#e2641a',
                    }}
                  >
                    {a.tone === 'mint' ? <LogIn className="w-3.5 h-3.5" /> : a.tone === 'blue' ? <CalendarDays className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-slate-800">{a.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{a.detail}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{a.at}</span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[12px] text-slate-400">
                Nothing yet — your punches, leave and claims will show up here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- policy strip */}
      <section className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><FileText className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Policy {policy?.policyCode || 'CS-HR-POL-001'} compliance</h3>
              <p className="text-[11.5px] text-slate-500">
                Version {policy?.policyVersion || '1.0'} · what applies to your attendance
              </p>
            </div>
          </div>
        </div>
        <div className="sh-card-body grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Office timings</div>
            <div className="text-[12.5px] text-slate-700">
              Shift {shiftStart} – {shiftEnd}. Punches before the shift start are recorded at shift start unless authorised.
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Grace &amp; lunch</div>
            <div className="text-[12.5px] text-slate-700">
              Grace up to {policy?.graceEndTime || '09:45 AM'}, {graceLimit} instances a month. Lunch{' '}
              {policy?.lunchWindow || '1:00 PM – 2:00 PM'}, max {policy?.lunchDurationMins ?? 60} minutes.
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Late-cycle deductions</div>
            <div className="text-[12.5px] text-slate-700">
              The 4th and 8th late mark in a month are treated as half days. Working Saturdays: {workingSaturdays}.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EssPersonalOverview;
