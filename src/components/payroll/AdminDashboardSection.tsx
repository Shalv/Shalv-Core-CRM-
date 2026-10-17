import React, { useMemo, useState } from 'react';
import {
  Users,
  CalendarOff,
  UserPlus,
  FileText,
  Download,
  Briefcase,
  Cake,
  Star,
  ChevronRight,
  Building2,
  Wallet,
  ClipboardList,
  BadgeCheck,
  Check,
  X,
} from 'lucide-react';
import { Sparkline, DonutChart } from './EssCharts';
import {
  ClipartCalendar,
  ClipartLeave,
  ClipartMoney,
  ClipartPayslip,
  ClipartClaim,
  ClipartClock,
} from './EssClipart';

/**
 * Admin HR dashboard — the workforce view for an admin/HR user.
 *
 * Every figure is derived from the records already in the app (employees, leave, payroll
 * runs, requests, recruitment, lifecycle). Nothing is invented; where a series has no
 * data yet the card says so rather than showing a made-up number.
 */
export interface AdminDashboardSectionProps {
  employees: any[];
  leaves: any[];
  claims: any[];
  regularization: any[];
  swaps: any[];
  tickets: any[];
  lifecycle: any[];
  jobOpenings: any[];
  candidates: any[];
  payrollRuns: any[];
  locations: any[];
  policy: any;
  formatCurrency: (n: number) => string;
  onNavigate?: (target: string) => void;
  /** Decide a leave request. */
  onDecideLeave?: (id: string, decision: 'Approved' | 'Rejected') => void;
  /** Decide an expense claim. */
  onDecideClaim?: (id: string, decision: 'Approved' | 'Rejected') => void;
  /** Decide a punch regularization. */
  onDecideRegularization?: (id: string, decision: 'Approved' | 'Rejected') => void;
  /** Decide a shift swap. */
  onDecideSwap?: (id: string, decision: 'Approved' | 'Rejected') => void;
  /** Decide a help desk ticket. */
  onDecideTicket?: (id: string, decision: 'Resolved' | 'Closed') => void;
  /** Where each request type's full list lives, so the dashboard can link to it. */
  requestTargets?: Record<string, string>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const initials = (name?: string) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const palette = ['#4a6cf7', '#03c95a', '#f5b942', '#f2726f', '#6d4bd1', '#00bcd4'];

export const AdminDashboardSection: React.FC<AdminDashboardSectionProps> = ({
  employees = [],
  leaves = [],
  claims = [],
  regularization = [],
  swaps = [],
  tickets = [],
  lifecycle = [],
  jobOpenings = [],
  candidates = [],
  payrollRuns = [],
  locations = [],
  policy,
  formatCurrency,
  onNavigate,
  onDecideLeave,
  onDecideClaim,
  onDecideRegularization,
  onDecideSwap,
  onDecideTicket,
  requestTargets,
}) => {
  // Which request type the queue is filtered to. 'all' shows everything.
  const [kindFilter, setKindFilter] = useState<string>('all');
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const monthPrefix = todayIso.slice(0, 7);

  /* ------------------------------------------------------------------ figures ---- */
  const active = employees.filter((e) => String(e?.status || 'Active') !== 'Inactive');

  const onLeaveToday = leaves.filter((l) => {
    if (!l?.startDate) return false;
    const st = String(l.status || '').toLowerCase();
    if (st === 'rejected' || st === 'cancelled') return false;
    const end = l.endDate || l.startDate;
    return l.startDate <= todayIso && todayIso <= end;
  });

  const newJoiners = active.filter((e) => String(e?.dateOfJoining || e?.joiningDate || '').startsWith(monthPrefix));

  /** Workforce by department — a real breakdown from the employee records. */
  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of active) {
      const d = e?.department || 'Unassigned';
      map.set(d, (map.get(d) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [active]);

  const deptSegments = byDept.map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
  const deptTotal = deptSegments.reduce((s, x) => s + x.value, 0);

  /**
   * Everything waiting on an admin/HR decision, across every request type — leave and expense
   * claims included. Each row carries the id and kind it came from so the Approve/Reject buttons
   * can be dispatched back to the right store.
   */
  const pending = [
    ...leaves.filter((l) => l?.status === 'Pending Approval').map((l) => ({
      id: l.id,
      kind: 'leave',
      type: 'Leave request',
      who: l.employeeName || l.employeeId,
      date: l.appliedOn || l.startDate || '',
      status: 'Pending',
      detail: `${l.leaveType || 'Leave'} · ${l.days}d`,
    })),
    ...claims.filter((c) => c?.status === 'Under Verification').map((c) => ({
      id: c.id,
      kind: 'claim',
      type: 'Expense claim',
      who: c.employeeName || c.employeeId,
      date: c.expenseDate || '',
      status: 'Pending',
      detail: `${c.category || 'Expense'} · ${formatCurrency(Number(c.amount) || 0)}`,
    })),
    ...regularization.filter((r) => r.status === 'Pending').map((r) => ({
      id: r.id,
      kind: 'regularization',
      type: 'Punch regularization',
      who: r.employeeName || r.employeeId,
      date: r.date,
      status: 'Pending',
      detail: r.type,
    })),
    ...swaps.filter((s) => s.status === 'Pending').map((s) => ({
      id: s.id,
      kind: 'swap',
      type: 'Shift swap',
      who: s.requesterName || s.requesterId,
      date: s.date,
      status: 'Pending',
      detail: 'Swap request',
    })),
    ...tickets.filter((t) => ['Open', 'In Progress', 'Escalated'].includes(String(t.status))).map((t) => ({
      id: t.id,
      kind: 'ticket',
      type: 'Help desk',
      who: t.employeeName || t.employeeId,
      date: String(t.raisedAt || '').slice(0, 10),
      status: t.status,
      detail: t.category,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  /** Send a decision back to the store the row came from. */
  const decide = (row: { id: string; kind: string }, approve: boolean) => {
    if (row.kind === 'leave') onDecideLeave?.(row.id, approve ? 'Approved' : 'Rejected');
    else if (row.kind === 'claim') onDecideClaim?.(row.id, approve ? 'Approved' : 'Rejected');
    else if (row.kind === 'regularization')
      onDecideRegularization?.(row.id, approve ? 'Approved' : 'Rejected');
    else if (row.kind === 'swap') onDecideSwap?.(row.id, approve ? 'Approved' : 'Rejected');
    else if (row.kind === 'ticket') onDecideTicket?.(row.id, approve ? 'Resolved' : 'Closed');
  };

  /** Only offer the buttons when the caller wired up a handler for that kind. */
  const canDecide = (row: { kind: string }) =>
    (row.kind === 'leave' && Boolean(onDecideLeave)) ||
    (row.kind === 'claim' && Boolean(onDecideClaim)) ||
    (row.kind === 'regularization' && Boolean(onDecideRegularization)) ||
    (row.kind === 'swap' && Boolean(onDecideSwap)) ||
    (row.kind === 'ticket' && Boolean(onDecideTicket));

  /** Every request type, its pending count and the label shown on its button. */
  const REQUEST_KINDS: { kind: string; label: string; icon: React.ReactNode }[] = [
    { kind: 'leave', label: 'Leave', icon: <CalendarOff className="w-3.5 h-3.5" /> },
    { kind: 'claim', label: 'Expense claims', icon: <Wallet className="w-3.5 h-3.5" /> },
    { kind: 'regularization', label: 'Regularization', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { kind: 'swap', label: 'Shift swaps', icon: <Users className="w-3.5 h-3.5" /> },
    { kind: 'ticket', label: 'Help desk', icon: <Briefcase className="w-3.5 h-3.5" /> },
  ];
  const countFor = (kind: string) => pending.filter((r) => r.kind === kind).length;
  const visibleRequests = kindFilter === 'all' ? pending : pending.filter((r) => r.kind === kindFilter);
  const activeTarget = kindFilter !== 'all' ? requestTargets?.[kindFilter] : undefined;

  /** The latest payroll run — processing and payment status. */
  const latestRun = [...payrollRuns].sort((a, b) => (a.month < b.month ? 1 : -1))[0];

  /** Events for the current month: public holidays + the pay date. */
  const monthHolidays = (Array.isArray(policy?.publicHolidays) ? policy.publicHolidays : []).filter((h: any) =>
    String(h?.date || '').startsWith(monthPrefix)
  );
  const payDate = latestRun ? `${latestRun.month}-28` : null;

  const leaveDaysThisMonth = new Set(
    leaves
      .filter((l) => l?.startDate && String(l.startDate).startsWith(monthPrefix))
      .map((l) => l.startDate)
  );

  /** Birthdays and work anniversaries in the current month. */
  const mIdx = now.getMonth() + 1;
  const birthdays = active.filter((e) => Number(String(e?.dateOfBirth || '').slice(5, 7)) === mIdx);
  const anniversaries = active.filter((e) => Number(String(e?.dateOfJoining || '').slice(5, 7)) === mIdx);

  const openJobs = jobOpenings.filter((j) => String(j?.status) === 'Open');
  const openSeats = openJobs.reduce((s, j) => s + (Number(j?.openings) || 0), 0);
  const pipeline = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((stage) => ({
    stage,
    count: candidates.filter((c) => String(c?.stage) === stage).length,
  }));

  /** Small real sparkline: headcount of joiners per month over the last 6 months. */
  const joinerSeries = useMemo(() => {
    const out: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push(active.filter((e) => String(e?.dateOfJoining || e?.joiningDate || '').startsWith(p)).length);
    }
    return out;
  }, [active]);

  /* ------------------------------------------------------------------ calendar ---- */
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7; // Monday-first grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isoOf = (d: number) => `${monthPrefix}-${String(d).padStart(2, '0')}`;
  const holidayOn = (d: number) => monthHolidays.find((h: any) => h.date === isoOf(d));
  const isPayDate = (d: number) => Boolean(payDate && payDate === isoOf(d));
  const leaveOn = (d: number) => leaveDaysThisMonth.has(isoOf(d));

  const kpi = [
    {
      clipart: <ClipartCalendar size={38} />,
      title: 'Total employees',
      sub: `${active.length} active`,
      value: String(active.length),
      delta: joinerSeries.some((v) => v > 0) ? `+${joinerSeries[joinerSeries.length - 1]}` : null,
      spark: joinerSeries.some((v) => v > 0) ? joinerSeries : null,
      tone: 'up',
      target: 'employees',
      hint: 'Open the employee master',
    },
    {
      clipart: <ClipartLeave size={38} />,
      title: 'On leave today',
      sub: `${leaves.length} request(s) on record`,
      value: String(onLeaveToday.length),
      delta: null,
      spark: null,
      tone: 'down',
      target: 'admin-leaves',
      hint: 'Open the leave applications queue',
    },
    {
      clipart: <ClipartMoney size={38} />,
      title: 'New joiners',
      sub: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      value: String(newJoiners.length),
      delta: newJoiners.length ? `+${newJoiners.length}` : null,
      spark: null,
      tone: 'up',
      target: 'employees',
      hint: 'Open the employee master',
    },
  ];

  return (
    <div className="space-y-4">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900">Welcome back 👋</h2>
          <p className="text-[12px] text-slate-500">Admin profile · workforce overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="sh-badge sh-badge-neutral">{pending.length} awaiting your decision</span>
          <span className="sh-badge sh-badge-info">{openSeats} open seat(s)</span>
        </div>
      </div>

      {/* KPI row + workforce donut */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpi.map((k) => (
          <button
            key={k.title}
            type="button"
            onClick={() => onNavigate?.(k.target)}
            title={k.hint}
            className="ess-card p-4 text-left w-full hover:border-[#1e4d5c]/30 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="ess-clipart">{k.clipart}</span>
              {k.spark && <Sparkline points={k.spark} color="#4a6cf7" width={80} height={32} />}
            </div>
            <div className="mt-3 ess-kpi-title">{k.title}</div>
            <div className="ess-kpi-sub">{k.sub}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="ess-kpi-value">{k.value}</span>
              {k.delta && (
                <span className={`ess-delta ${k.tone === 'down' ? 'ess-delta-down' : 'ess-delta-up'}`}>
                  {k.tone === 'down' ? '↓' : '↑'} {k.delta}
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onNavigate?.('employees')}
          title="Open the employee master"
          className="ess-card p-4 text-left w-full hover:border-[#1e4d5c]/30 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="ess-clipart"><ClipartPayslip size={38} /></span>
            <span className="ess-kpi-sub">Workforce</span>
          </div>
          {deptTotal > 0 ? (
            <div className="flex items-center gap-3 mt-2">
              <DonutChart segments={deptSegments} size={104} thickness={16} centerLabel={String(deptTotal)} centerSub="people" />
              <div className="min-w-0 space-y-1">
                {deptSegments.slice(0, 3).map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="ess-legend-dot" style={{ background: s.color }} />
                    <span className="truncate">{s.label}</span>
                    <span className="font-bold text-slate-800 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-[11.5px] text-slate-400">No employees enrolled yet.</div>
          )}
        </button>
      </section>

      {/* payroll + requests + calendar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* payroll status */}
        <div className="ess-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="ess-clipart ess-clipart-sm"><ClipartPayslip size={32} /></span>
              <div>
                <h3 className="sh-card-title">Payroll</h3>
                <p className="text-[11.5px] text-slate-500">{latestRun ? latestRun.month : 'No run yet'}</p>
              </div>
            </div>
            {latestRun && (
              <span className={`sh-badge ${latestRun.status === 'Paid' ? 'sh-badge-success' : latestRun.status === 'Approved' || latestRun.status === 'Published' ? 'sh-badge-info' : 'sh-badge-neutral'}`}>
                {latestRun.status}
              </span>
            )}
          </div>
          <div className="sh-card-body">
            {latestRun ? (
              <>
                <div className="ess-kpi-sub">Net payable</div>
                <div className="ess-kpi-value">{formatCurrency(latestRun.netTotal || 0)}</div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="ess-kpi-sub">Headcount</div>
                    <div className="font-bold text-slate-800">{latestRun.headcount || 0}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="ess-kpi-sub">Working days</div>
                    <div className="font-bold text-slate-800">{latestRun.workingDays || '—'}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="ess-kpi-sub">Payment</div>
                    <div className="font-bold text-slate-800">{latestRun.paymentStatus || 'Unpaid'}</div>
                  </div>
                </div>
                <button type="button" className="sh-btn sh-btn-primary mt-3 w-full justify-center" onClick={() => onNavigate?.('payroll')}>
                  <Wallet className="w-3.5 h-3.5" /> Open payroll processing
                </button>
              </>
            ) : (
              <div className="py-8 text-center text-[12px] text-slate-400">
                No payroll run has been processed yet.
              </div>
            )}
          </div>
        </div>

        {/* requests awaiting decision */}
        <div className="ess-card lg:col-span-2">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="ess-clipart ess-clipart-sm"><ClipartClaim size={32} /></span>
              <div>
                <h3 className="sh-card-title">Requests</h3>
                <p className="text-[11.5px] text-slate-500">Waiting on an admin or HR decision</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTarget && onNavigate && (
                <button type="button" className="sh-btn" onClick={() => onNavigate(activeTarget)}>
                  Open the full list <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* One button per request type, with its live count. Clicking filters the queue below —
              so every request an employee raises is reachable from the dashboard itself. */}
          <div className="sh-card-body flex flex-wrap items-center gap-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={`sh-btn ${kindFilter === 'all' ? 'sh-btn-primary' : ''}`}
            >
              All requests
              <span className="ml-1.5 rounded-full bg-black/10 px-1.5 text-[10.5px] font-bold">
                {pending.length}
              </span>
            </button>
            {REQUEST_KINDS.map((k) => {
              const n = countFor(k.kind);
              const active = kindFilter === k.kind;
              return (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => setKindFilter(active ? 'all' : k.kind)}
                  className={`sh-btn ${active ? 'sh-btn-primary' : ''} ${n === 0 ? 'opacity-60' : ''}`}
                  title={
                    n === 0
                      ? `No ${k.label.toLowerCase()} awaiting a decision`
                      : `${n} ${k.label.toLowerCase()} awaiting a decision`
                  }
                >
                  {k.icon}
                  {k.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 text-[10.5px] font-bold ${
                      n > 0 ? 'bg-[#f5b942] text-[#7a5200]' : 'bg-black/10'
                    }`}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Request type</th><th>Employee</th><th>Detail</th><th>Status</th><th>Date</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {visibleRequests.slice(0, 8).map((r, i) => (
                  <tr key={`${r.kind}-${r.id}-${i}`}>
                    <td className="font-semibold text-slate-800">{r.type}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="ess-avatar" style={{ background: '#4a6cf7', width: 26, height: 26, fontSize: 9 }}>
                          {initials(r.who)}
                        </span>
                        <span className="truncate">{r.who}</span>
                      </span>
                    </td>
                    <td className="text-slate-500">{r.detail}</td>
                    <td>
                      <span className={`sh-badge ${r.status === 'Pending' ? 'sh-badge-warning' : r.status === 'Escalated' ? 'sh-badge-danger' : 'sh-badge-info'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-slate-500">{r.date || '—'}</td>
                    <td className="text-right">
                      {canDecide(r) ? (
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="sh-btn sh-btn-primary"
                            title={`Approve this ${r.type.toLowerCase()}`}
                            onClick={() => decide(r, true)}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            className="sh-btn"
                            title={`Reject this ${r.type.toLowerCase()}`}
                            onClick={() => decide(r, false)}
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleRequests.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">
                    {pending.length === 0
                      ? 'Nothing waiting — every request is decided.'
                      : `No ${kindFilter === 'all' ? '' : REQUEST_KINDS.find((k) => k.kind === kindFilter)?.label.toLowerCase() || ''} requests awaiting a decision.`}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* events calendar + birthdays + recruitment */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="ess-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="ess-clipart ess-clipart-sm"><ClipartCalendar size={32} /></span>
              <div>
                <h3 className="sh-card-title">Events</h3>
                <p className="text-[11.5px] text-slate-500">{MONTHS[now.getMonth()]} {now.getFullYear()}</p>
              </div>
            </div>
          </div>
          <div className="sh-card-body">
            <div className="grid grid-cols-7 gap-1 text-center">
              {WD.map((d) => (
                <div key={d} className="text-[10px] font-bold uppercase text-slate-400 py-1">{d}</div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`e${i}`} />;
                const hol = holidayOn(d);
                const pay = isPayDate(d);
                const lv = leaveOn(d);
                const isToday = isoOf(d) === todayIso;
                return (
                  <div
                    key={d}
                    title={`${isoOf(d)}${hol ? ` · ${hol.name}` : ''}${pay ? ' · pay date' : ''}${lv ? ' · leave' : ''}`}
                    className={`aspect-square rounded-lg grid place-items-center text-[11.5px] font-semibold ${
                      isToday
                        ? 'bg-[#f26522] text-white'
                        : hol
                        ? 'bg-violet-100 text-violet-800'
                        : pay
                        ? 'bg-emerald-100 text-emerald-800'
                        : lv
                        ? 'bg-rose-50 text-rose-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[10.5px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="ess-legend-dot" style={{ background: '#6d4bd1' }} /> Holiday</span>
              <span className="flex items-center gap-1.5"><span className="ess-legend-dot" style={{ background: '#03c95a' }} /> Pay date</span>
              <span className="flex items-center gap-1.5"><span className="ess-legend-dot" style={{ background: '#f2726f' }} /> Leave</span>
            </div>
            {monthHolidays.length > 0 && (
              <div className="mt-2 space-y-1">
                {monthHolidays.map((h: any) => (
                  <div key={h.date} className="flex items-center gap-2 text-[11.5px] text-violet-800">
                    <Star className="w-3 h-3" /> {h.date.slice(8, 10)} {MONTHS[now.getMonth()]} — {h.name}
                    {h.kind !== 'Public' ? ' (RH)' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ess-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="ess-clipart ess-clipart-sm"><ClipartClock size={32} /></span>
              <div>
                <h3 className="sh-card-title">Birthdays &amp; anniversaries</h3>
                <p className="text-[11.5px] text-slate-500">{MONTHS[now.getMonth()]} {now.getFullYear()}</p>
              </div>
            </div>
          </div>
          <div className="sh-card-body">
            {[...birthdays.map((e) => ({ e, kind: 'Birthday' })), ...anniversaries.map((e) => ({ e, kind: 'Work anniversary' }))]
              .slice(0, 6)
              .map(({ e, kind }, i) => (
                <button
                  key={`${e.userId}-${kind}`}
                  type="button"
                  onClick={() => onNavigate?.('employees')}
                  title="Open the employee master"
                  className="ess-row w-full text-left cursor-pointer hover:bg-slate-50 rounded-lg px-1"
                >
                  <span className="ess-avatar" style={{ background: palette[i % palette.length] }}>{initials(e.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold text-slate-800 truncate">{e.name || e.userId}</div>
                    <div className="text-[11px] text-slate-500 truncate">{kind} · {e.designation || e.department || '—'}</div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {String((kind === 'Birthday' ? e.dateOfBirth : e.dateOfJoining) || '').slice(8, 10) || '—'}
                  </span>
                </button>
              ))}
            {birthdays.length === 0 && anniversaries.length === 0 && (
              <div className="py-8 text-center text-[12px] text-slate-400">Nothing this month.</div>
            )}
          </div>
        </div>

        <div className="ess-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="ess-clipart ess-clipart-sm"><ClipartMoney size={32} /></span>
              <div>
                <h3 className="sh-card-title">Open roles</h3>
                <p className="text-[11.5px] text-slate-500">{openJobs.length} opening(s) · {openSeats} seat(s)</p>
              </div>
            </div>
            <button type="button" className="sh-btn" onClick={() => onNavigate?.('recruitment')}>
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Job title</th><th>Seats</th><th>Department</th></tr></thead>
              <tbody>
                {openJobs.slice(0, 5).map((j: any) => (
                  <tr
                    key={j.id}
                    onClick={() => onNavigate?.('recruitment')}
                    title="Open recruitment"
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="font-semibold text-slate-800">{j.title}</td>
                    <td>{j.openings || 0}</td>
                    <td className="text-slate-500">{j.department || '—'}</td>
                  </tr>
                ))}
                {openJobs.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-400">No open roles right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {candidates.length > 0 && (
            <div className="sh-card-body border-t border-slate-100">
              <div className="ess-kpi-sub mb-2">Candidate pipeline</div>
              <div className="flex items-center gap-2 flex-wrap">
                {pipeline.map((p) => (
                  <span key={p.stage} className={`sh-badge ${p.count > 0 ? 'sh-badge-info' : 'sh-badge-neutral'}`}>
                    {p.stage} {p.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* team */}
      <section className="ess-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="ess-clipart ess-clipart-sm"><ClipartCalendar size={32} /></span>
            <div>
              <h3 className="sh-card-title">My team</h3>
              <p className="text-[11.5px] text-slate-500">{active.length} employee(s) on record</p>
            </div>
          </div>
          <button type="button" className="sh-btn" onClick={() => onNavigate?.('employees')}>
            Employee master <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="sh-table w-full">
            <thead><tr><th>Full name</th><th>Department</th><th>Designation</th><th>Contact</th></tr></thead>
            <tbody>
              {active.slice(0, 8).map((e, i) => (
                <tr
                  key={e.userId}
                  onClick={() => onNavigate?.('employees')}
                  title="Open the employee master"
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="ess-avatar" style={{ background: palette[i % palette.length] }}>{initials(e.name)}</span>
                      <span className="font-semibold text-slate-800 truncate">{e.name || e.userId}</span>
                    </span>
                  </td>
                  <td className="text-slate-500">{e.department || '—'}</td>
                  <td className="text-slate-500">{e.designation || '—'}</td>
                  <td className="text-slate-500">{e.email || e.phone || '—'}</td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">No employees enrolled yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardSection;
