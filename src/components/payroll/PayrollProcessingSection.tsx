import React, { useMemo, useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Send,
  BadgeCheck,
  Banknote,
  Download,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
} from 'lucide-react';
import {
  PayrollRun,
  PayrollRunStatus,
  PayrollRunLine,
  PayrollAdjustment,
  PayrollAdjustmentKind,
  PAYROLL_RUN_PIPELINE,
  PAYROLL_ADJUSTMENT_KINDS,
  nextPayrollRunStatus,
  updatePayrollRun,
  reopenPayrollRun,
  payrollVariance,
} from './payrollTypes';

/**
 * Payroll processing (Phase 3): an explicit pipeline with locking and controlled
 * reopening, arrears/recoveries adjustments, variance against the previous month,
 * payment export, and separate processing vs payment status.
 */
export interface PayrollProcessingSectionProps {
  employees: {
    userId: string;
    name?: string;
    empCode?: string;
    monthlyGross?: number;
    status?: string;
    enrolledInPayroll?: boolean;
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
  }[];
  runs: PayrollRun[];
  onChangeRuns: (next: PayrollRun[]) => void;
  currentUserName: string;
  formatCurrency: (n: number) => string;
  setStatusBanner?: (message: string) => void;
}

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const statusChip: Record<PayrollRunStatus, string> = {
  Draft: 'sh-badge sh-badge-neutral',
  Calculated: 'sh-badge sh-badge-info',
  'Under Review': 'sh-badge sh-badge-warning',
  Approved: 'sh-badge sh-badge-primary',
  Published: 'sh-badge sh-badge-success',
  Paid: 'sh-badge sh-badge-success',
};

export function PayrollProcessingSection({
  employees,
  runs,
  onChangeRuns,
  currentUserName,
  formatCurrency,
  setStatusBanner,
}: PayrollProcessingSectionProps) {
  const [month, setMonth] = useState(monthKey());
  const [adjustFor, setAdjustFor] = useState('');
  const [adjustKind, setAdjustKind] = useState<PayrollAdjustmentKind>('Arrear');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);

  const enrolled = useMemo(
    () => employees.filter((e) => e.enrolledInPayroll !== false && e.status !== 'Inactive'),
    [employees]
  );

  const current = runs.find((r) => r.month === month) || null;
  const previous = useMemo(() => {
    const before = runs
      .filter((r) => r.month < month)
      .sort((a, b) => (a.month < b.month ? 1 : -1));
    return before[0] || null;
  }, [runs, month]);

  const variance = useMemo(
    () => (current ? payrollVariance(current, previous) : null),
    [current, previous]
  );

  const adjustmentNet = (run: PayrollRun) =>
    run.adjustments.reduce(
      (s, a) => s + (a.kind === 'Recovery' ? -Math.abs(a.amount) : Math.abs(a.amount)),
      0
    );

  const createRun = () => {
    if (current) {
      setStatusBanner?.(`A payroll run for ${month} already exists.`);
      return;
    }
    const at = new Date().toISOString();
    onChangeRuns([
      {
        id: month,
        month,
        status: 'Draft',
        paymentStatus: 'Unpaid',
        locked: false,
        headcount: 0,
        grossTotal: 0,
        netTotal: 0,
        lines: [],
        adjustments: [],
        history: [{ at, by: currentUserName, action: 'Run created', to: 'Draft' }],
      },
      ...runs,
    ]);
    setStatusBanner?.(`Payroll run for ${month} created (Draft).`);
  };

  const calculate = () => {
    if (!current || current.locked) return;
    const lines: PayrollRunLine[] = enrolled.map((e) => ({
      employeeId: e.userId,
      employeeName: e.name || e.userId,
      empCode: e.empCode || '',
      gross: Number(e.monthlyGross) || 0,
      net: Number(e.monthlyGross) || 0,
    }));
    const gross = lines.reduce((s, l) => s + l.gross, 0);
    const net = gross + adjustmentNet(current);
    onChangeRuns(
      updatePayrollRun(
        runs,
        current.id,
        {
          lines,
          headcount: lines.length,
          grossTotal: gross,
          netTotal: net,
          status: 'Calculated',
          calculatedAt: new Date().toISOString(),
        },
        currentUserName,
        `Calculated ${lines.length} employees`
      )
    );
    setStatusBanner?.(`Payroll calculated for ${month}: ${lines.length} employees, gross ${formatCurrency(gross)}.`);
  };

  const advance = () => {
    if (!current || current.locked) return;
    const next = nextPayrollRunStatus(current.status);
    if (!next) return;
    const at = new Date().toISOString();
    const patch: Partial<PayrollRun> = { status: next };
    if (next === 'Approved') { patch.approvedBy = currentUserName; patch.approvedAt = at; }
    if (next === 'Published') { patch.publishedAt = at; }
    if (next === 'Paid') { patch.paidAt = at; patch.paymentStatus = 'Paid'; patch.locked = true; }
    onChangeRuns(updatePayrollRun(runs, current.id, patch, currentUserName, `Status → ${next}`));
    setStatusBanner?.(`Payroll run ${month}: ${next}${next === 'Paid' ? ' — locked' : ''}.`);
  };

  const toggleLock = () => {
    if (!current) return;
    if (current.locked) {
      setShowReopen(true);
      return;
    }
    onChangeRuns(updatePayrollRun(runs, current.id, { locked: true }, currentUserName, 'Locked'));
    setStatusBanner?.(`Payroll run ${month} locked.`);
  };

  const doReopen = () => {
    if (!current) return;
    if (!reopenReason.trim()) {
      setStatusBanner?.('A reason is required to reopen a locked payroll run.');
      return;
    }
    onChangeRuns(reopenPayrollRun(runs, current.id, currentUserName, reopenReason.trim()));
    setStatusBanner?.(`Payroll run ${month} reopened for review.`);
    setReopenReason('');
    setShowReopen(false);
  };

  const addAdjustment = () => {
    if (!current || current.locked) return;
    if (!adjustFor) { setStatusBanner?.('Choose an employee for the adjustment.'); return; }
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setStatusBanner?.('Enter a positive adjustment amount.'); return; }
    const at = new Date().toISOString();
    const emp = employees.find((e) => e.userId === adjustFor);
    const adj: PayrollAdjustment = {
      id: `ADJ-${Date.now().toString().slice(-5)}`,
      employeeId: adjustFor,
      employeeName: emp?.name,
      kind: adjustKind,
      amount,
      note: adjustNote.trim() || undefined,
      addedBy: currentUserName,
      addedAt: at,
    };
    const nextAdjustments = [...current.adjustments, adj];
    const net = current.grossTotal + nextAdjustments.reduce((s, a) => s + (a.kind === 'Recovery' ? -Math.abs(a.amount) : Math.abs(a.amount)), 0);
    onChangeRuns(
      updatePayrollRun(runs, current.id, { adjustments: nextAdjustments, netTotal: net }, currentUserName, `Added ${adjustKind} ${amount} for ${emp?.name || adjustFor}`)
    );
    setStatusBanner?.(`${adjustKind} of ${formatCurrency(amount)} added for ${emp?.name || adjustFor}.`);
    setAdjustFor(''); setAdjustAmount(''); setAdjustNote('');
  };

  const removeAdjustment = (id: string) => {
    if (!current || current.locked) return;
    const nextAdjustments = current.adjustments.filter((a) => a.id !== id);
    const net = current.grossTotal + nextAdjustments.reduce((s, a) => s + (a.kind === 'Recovery' ? -Math.abs(a.amount) : Math.abs(a.amount)), 0);
    onChangeRuns(updatePayrollRun(runs, current.id, { adjustments: nextAdjustments, netTotal: net }, currentUserName, 'Removed adjustment'));
  };

  const exportPayments = () => {
    if (!current) return;
    const header = ['Employee Code', 'Employee', 'Bank', 'Account Number', 'IFSC', 'Month', 'Net Payable', 'Payment Status'];
    const rows = current.lines.map((l) => {
      const e = employees.find((x) => x.userId === l.employeeId);
      const adj = current.adjustments.filter((a) => a.employeeId === l.employeeId)
        .reduce((s, a) => s + (a.kind === 'Recovery' ? -Math.abs(a.amount) : Math.abs(a.amount)), 0);
      return [l.empCode, l.employeeName, e?.bankName || '', e?.bankAccountNumber || '', e?.ifscCode || '', current.month, (l.net + adj).toFixed(2), current.paymentStatus];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Payments_${current.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner?.(`Payment export generated for ${month} (${rows.length} rows).`);
  };

  const fmtDelta = (d: number | null) => {
    if (d === null) return <span className="text-slate-400">—</span>;
    if (d === 0) return <span className="sh-badge sh-badge-neutral"><Minus className="w-3 h-3" /> 0</span>;
    const up = d > 0;
    return (
      <span className={`sh-badge ${up ? 'sh-badge-success' : 'sh-badge-danger'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {formatCurrency(Math.abs(d))}
      </span>
    );
  };

  const stageIndex = current ? PAYROLL_RUN_PIPELINE.indexOf(current.status) : -1;

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><PlayCircle className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Payroll processing</h3>
              <p className="text-[11.5px] text-slate-500">
                Attendance approval → calculation → review → approval → publication → payment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="month" className="sh-input max-w-[170px]" value={month} onChange={(e) => setMonth(e.target.value)} />
            {!current && <button type="button" className="sh-btn sh-btn-primary" onClick={createRun}><Plus className="w-3.5 h-3.5" /> Create run</button>}
          </div>
        </div>

        {current ? (
          <>
            {/* pipeline */}
            <div className="sh-card-body flex flex-wrap items-center gap-2 border-b border-slate-100">
              {PAYROLL_RUN_PIPELINE.map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`sh-badge ${i <= stageIndex ? 'sh-badge-primary' : 'sh-badge-neutral'}`}>
                    {i <= stageIndex && <CheckCircle2 className="w-3 h-3" />} {s}
                  </span>
                  {i < PAYROLL_RUN_PIPELINE.length - 1 && <span className="text-slate-300">→</span>}
                </React.Fragment>
              ))}
              <span className="ml-auto flex items-center gap-2">
                <span className="sh-badge sh-badge-neutral">Payment: {current.paymentStatus}</span>
                {current.locked && <span className="sh-badge sh-badge-danger"><Lock className="w-3 h-3" /> Locked</span>}
              </span>
            </div>

            <div className="sh-card-body flex flex-wrap items-center gap-2 border-b border-slate-100">
              {!current.locked && current.status !== 'Calculated' && current.status !== 'Paid' && (
                <button type="button" className="sh-btn sh-btn-primary" onClick={calculate}><PlayCircle className="w-3.5 h-3.5" /> Calculate</button>
              )}
              {!current.locked && nextPayrollRunStatus(current.status) && (
                <button type="button" className="sh-btn sh-btn-primary" onClick={advance}>
                  {current.status === 'Calculated' && <><Send className="w-3.5 h-3.5" /> Submit for review</>}
                  {current.status === 'Under Review' && <><BadgeCheck className="w-3.5 h-3.5" /> Approve</>}
                  {current.status === 'Approved' && <><BadgeCheck className="w-3.5 h-3.5" /> Publish payslips</>}
                  {current.status === 'Published' && <><Banknote className="w-3.5 h-3.5" /> Confirm payment</>}
                </button>
              )}
              {!current.locked && current.status === 'Calculated' && (
                <button type="button" className="sh-btn" onClick={calculate}>Recalculate</button>
              )}
              <button type="button" className="sh-btn" onClick={toggleLock}>
                {current.locked ? <><Unlock className="w-3.5 h-3.5" /> Reopen</> : <><Lock className="w-3.5 h-3.5" /> Lock run</>}
              </button>
              <button type="button" className="sh-btn" onClick={exportPayments}><Download className="w-3.5 h-3.5" /> Payment export</button>
              <span className="ml-auto text-[12px] text-slate-500">
                {current.headcount} employees · gross <b className="text-slate-800">{formatCurrency(current.grossTotal)}</b> · net payable <b className="text-slate-800">{formatCurrency(current.netTotal)}</b>
              </span>
            </div>

            {showReopen && (
              <div className="sh-card-body flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50">
                <input className="sh-input flex-1 min-w-[240px]" placeholder="Reason for reopening (recorded in history)" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
                <button type="button" className="sh-btn sh-btn-primary" onClick={doReopen}><Unlock className="w-3.5 h-3.5" /> Reopen run</button>
                <button type="button" className="sh-btn" onClick={() => setShowReopen(false)}>Cancel</button>
              </div>
            )}

            {/* adjustments */}
            <div className="sh-card-body border-b border-slate-100">
              <div className="text-[12px] font-bold text-slate-700 mb-2">Arrears, recoveries, incentives & overtime</div>
              {!current.locked && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <select className="sh-input max-w-[200px]" value={adjustFor} onChange={(e) => setAdjustFor(e.target.value)}>
                    <option value="">Employee…</option>
                    {enrolled.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
                  </select>
                  <select className="sh-input max-w-[150px]" value={adjustKind} onChange={(e) => setAdjustKind(e.target.value as PayrollAdjustmentKind)}>
                    {PAYROLL_ADJUSTMENT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <input type="number" className="sh-input max-w-[140px]" placeholder="Amount" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
                  <input className="sh-input flex-1 min-w-[180px]" placeholder="Note (optional)" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
                  <button type="button" className="sh-btn sh-btn-primary" onClick={addAdjustment}><Plus className="w-3.5 h-3.5" /> Add</button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="sh-table w-full">
                  <thead><tr><th>Employee</th><th>Kind</th><th>Amount</th><th>Note</th><th>Added by</th><th className="text-right">Action</th></tr></thead>
                  <tbody>
                    {current.adjustments.map((a) => (
                      <tr key={a.id}>
                        <td className="font-semibold text-slate-800">{a.employeeName || a.employeeId}</td>
                        <td><span className={`sh-badge ${a.kind === 'Recovery' ? 'sh-badge-danger' : 'sh-badge-info'}`}>{a.kind}</span></td>
                        <td>{a.kind === 'Recovery' ? '-' : '+'}{formatCurrency(a.amount)}</td>
                        <td>{a.note || '—'}</td>
                        <td>{a.addedBy}</td>
                        <td className="text-right">
                          {!current.locked && <button type="button" className="sh-btn" onClick={() => removeAdjustment(a.id)}><Trash2 className="w-3.5 h-3.5" /></button>}
                        </td>
                      </tr>
                    ))}
                    {current.adjustments.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-slate-400">No adjustments for this run.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* variance */}
            <div className="sh-card-body border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-slate-700">Variance vs previous month</div>
                {variance && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    Net change {fmtDelta(variance.netDelta)} · headcount {fmtDelta(variance.headcountDelta)}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="sh-table w-full">
                  <thead><tr><th>Employee</th><th>Code</th><th>This month</th><th>Previous</th><th>Delta</th></tr></thead>
                  <tbody>
                    {(variance?.rows || []).map((r) => (
                      <tr key={r.employeeId}>
                        <td className="font-semibold text-slate-800">{r.employeeName}</td>
                        <td>{r.empCode}</td>
                        <td>{formatCurrency(r.net)}</td>
                        <td>{r.prevNet === null ? <span className="sh-badge sh-badge-info">New</span> : formatCurrency(r.prevNet)}</td>
                        <td>{fmtDelta(r.delta)}</td>
                      </tr>
                    ))}
                    {(variance?.rows || []).length === 0 && <tr><td colSpan={5} className="text-center py-5 text-slate-400">Calculate the run to see variance.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* history */}
            <div className="sh-card-body">
              <div className="text-[12px] font-bold text-slate-700 mb-2 flex items-center gap-2"><History className="w-3.5 h-3.5" /> Change history</div>
              <div className="flex flex-col gap-1 text-[11.5px] text-slate-500">
                {[...current.history].reverse().map((h, i) => (
                  <div key={i}>{new Date(h.at).toLocaleString('en-IN')} · {h.by} · {h.action}{h.from && h.to ? ` (${h.from} → ${h.to})` : ''}</div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="sh-card-body text-center py-8 text-slate-400">
            No payroll run for {month}. Create one to start processing.
          </div>
        )}
      </div>
    </div>
  );
}

export default PayrollProcessingSection;
