import React, { useMemo, useState } from 'react';
import {
  UserCog,
  Plus,
  Check,
  X,
  ShieldCheck,
  CalendarDays,
  BadgeCheck,
  LogOut,
  History,
} from 'lucide-react';
import {
  LifecycleEvent,
  LifecycleEventType,
  LifecycleStatus,
  LIFECYCLE_EVENT_TYPES,
  decideLifecycleEvent,
} from './payrollTypes';

/**
 * Employee lifecycle & exit.
 *
 * `mode="admin"`    — raise probation/confirmation/promotion/transfer/resignation/
 *                     termination/exit events, approve them and record full-and-final.
 * `mode="employee"` — see your own lifecycle timeline and raise a resignation.
 */
export interface PayrollLifecycleSectionProps {
  mode: 'admin' | 'employee';
  currentUserId: string;
  currentUserName: string;
  employees: {
    userId: string;
    name?: string;
    empCode?: string;
    department?: string;
    designation?: string;
    monthlyGross?: number;
  }[];
  events: LifecycleEvent[];
  onChange: (next: LifecycleEvent[]) => void;
  setStatusBanner?: (message: string) => void;
}

const statusChip: Record<LifecycleStatus, string> = {
  Pending: 'sh-badge sh-badge-warning',
  Approved: 'sh-badge sh-badge-primary',
  Rejected: 'sh-badge sh-badge-danger',
  Completed: 'sh-badge sh-badge-success',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const isExitLike = (t: LifecycleEventType) =>
  t === 'Resignation' || t === 'Termination' || t === 'Exit';

export function PayrollLifecycleSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  events,
  onChange,
  setStatusBanner,
}: PayrollLifecycleSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<LifecycleEventType>('Confirmation');
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [toDesignation, setToDesignation] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [toSalary, setToSalary] = useState('');
  const [noticeDays, setNoticeDays] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reason, setReason] = useState('');
  const [fnfAmount, setFnfAmount] = useState('');
  const [fnfNotes, setFnfNotes] = useState('');
  const [decideFor, setDecideFor] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const emp = (id: string) => employees.find((e) => e.userId === id);
  const empName = (id: string) => emp(id)?.name || id;

  const visible = useMemo(() => {
    const base = mode === 'employee' ? events.filter((e) => e.employeeId === currentUserId) : events;
    return [...base].sort((a, b) => (a.raisedAt < b.raisedAt ? 1 : -1));
  }, [mode, events, currentUserId]);

  const pendingCount = events.filter((e) => e.status === 'Pending').length;

  const reset = () => {
    setShowForm(false);
    setToDesignation(''); setToDepartment(''); setToSalary('');
    setNoticeDays(''); setLastWorkingDay(''); setReason('');
    setFnfAmount(''); setFnfNotes('');
  };

  const raise = () => {
    const targetId = mode === 'employee' ? currentUserId : employeeId;
    if (!targetId) { setStatusBanner?.('Choose an employee.'); return; }
    if (!effectiveDate) { setStatusBanner?.('An effective date is required.'); return; }
    const at = new Date().toISOString();
    const target = emp(targetId);
    const event: LifecycleEvent = {
      id: `LFC-${Date.now().toString().slice(-6)}`,
      employeeId: targetId,
      employeeName: target?.name || (mode === 'employee' ? currentUserName : targetId),
      type,
      effectiveDate,
      fromDesignation: target?.designation,
      toDesignation: toDesignation || undefined,
      fromDepartment: target?.department,
      toDepartment: toDepartment || undefined,
      fromSalary: target?.monthlyGross,
      toSalary: toSalary ? Number(toSalary) : undefined,
      noticePeriodDays: noticeDays ? Number(noticeDays) : undefined,
      lastWorkingDay: lastWorkingDay || undefined,
      reason: reason.trim() || undefined,
      fnfAmount: fnfAmount ? Number(fnfAmount) : undefined,
      fnfNotes: fnfNotes.trim() || undefined,
      status: 'Pending',
      raisedAt: at,
      raisedBy: currentUserName,
      history: [{ at, by: currentUserName, action: `${type} raised`, to: 'Pending' }],
    };
    onChange([event, ...events]);
    setStatusBanner?.(`${type} recorded for ${event.employeeName} — pending approval.`);
    reset();
  };

  const decide = (id: string, decision: LifecycleStatus) => {
    onChange(decideLifecycleEvent(events, id, decision, currentUserName, remarks));
    setStatusBanner?.(`Lifecycle event ${decision.toLowerCase()}.`);
    setDecideFor(null);
    setRemarks('');
  };

  const formBody = (
    <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-slate-100">
      {mode === 'admin' && (
        <label className="block sm:col-span-2">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Employee</span>
          <select className="sh-input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId} ({e.empCode || ''})</option>)}
          </select>
        </label>
      )}
      <label className="block">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Event</span>
        <select className="sh-input" value={type} onChange={(e) => setType(e.target.value as LifecycleEventType)}>
          {(mode === 'employee' ? (['Resignation'] as LifecycleEventType[]) : LIFECYCLE_EVENT_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Effective date</span>
        <input type="date" className="sh-input" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
      </label>

      {(type === 'Promotion' || type === 'Transfer') && (
        <>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">New designation</span>
            <input className="sh-input" value={toDesignation} onChange={(e) => setToDesignation(e.target.value)} placeholder="e.g. Senior Engineer" /></label>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">New department</span>
            <input className="sh-input" value={toDepartment} onChange={(e) => setToDepartment(e.target.value)} placeholder="e.g. Engineering" /></label>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">New monthly gross</span>
            <input type="number" className="sh-input" value={toSalary} onChange={(e) => setToSalary(e.target.value)} /></label>
        </>
      )}

      {isExitLike(type) && (
        <>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notice period (days)</span>
            <input type="number" className="sh-input" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} placeholder="e.g. 30" /></label>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Last working day</span>
            <input type="date" className="sh-input" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} /></label>
        </>
      )}

      {mode === 'admin' && type === 'Exit' && (
        <>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full &amp; final amount</span>
            <input type="number" className="sh-input" value={fnfAmount} onChange={(e) => setFnfAmount(e.target.value)} /></label>
          <label className="block sm:col-span-2"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">F&amp;F notes</span>
            <input className="sh-input" value={fnfNotes} onChange={(e) => setFnfNotes(e.target.value)} placeholder="Leave encashment, dues, recoveries" /></label>
        </>
      )}

      <label className="block sm:col-span-2 lg:col-span-3">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason / notes</span>
        <input className="sh-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Context for this change" />
      </label>
      <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
        <button type="button" className="sh-btn sh-btn-primary" onClick={raise}><Check className="w-3.5 h-3.5" /> Submit for approval</button>
        <button type="button" className="sh-btn" onClick={reset}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><UserCog className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">{mode === 'employee' ? 'My lifecycle' : 'Employee lifecycle & exit'}</h3>
              <p className="text-[11.5px] text-slate-500">
                {mode === 'employee'
                  ? 'Your probation, confirmation, promotions and exit record.'
                  : 'Probation, confirmation, promotion, transfer, resignation, termination and exit with full-and-final.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'admin' && <span className="sh-badge sh-badge-warning"><CalendarDays className="w-3 h-3" /> {pendingCount} pending</span>}
            <button type="button" className="sh-btn sh-btn-primary" onClick={() => setShowForm((s) => !s)}>
              {mode === 'employee' ? <><LogOut className="w-3.5 h-3.5" /> Raise resignation</> : <><Plus className="w-3.5 h-3.5" /> New event</>}
            </button>
          </div>
        </div>

        {showForm && formBody}

        <div className="overflow-x-auto mt-3">
          <table className="sh-table w-full">
            <thead>
              <tr>
                {mode === 'admin' && <th>Employee</th>}
                <th>Event</th>
                <th>Effective</th>
                <th>Change</th>
                <th>Notice / LWD</th>
                <th>F&amp;F</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <React.Fragment key={e.id}>
                  <tr>
                    {mode === 'admin' && (
                      <td>
                        <div className="font-semibold text-slate-800">{e.employeeName || empName(e.employeeId)}</div>
                        <div className="text-[11px] text-slate-500">{emp(e.employeeId)?.empCode || ''}</div>
                      </td>
                    )}
                    <td><span className="sh-badge sh-badge-info">{e.type}</span></td>
                    <td>{e.effectiveDate}</td>
                    <td className="text-[12px]">
                      {e.toDesignation || e.toDepartment || e.toSalary
                        ? <>
                            {e.toDesignation ? `${e.fromDesignation || '—'} → ${e.toDesignation}` : null}
                            {e.toDepartment ? ` · ${e.fromDepartment || '—'} → ${e.toDepartment}` : null}
                            {e.toSalary ? ` · ₹${e.toSalary.toLocaleString('en-IN')}` : null}
                          </>
                        : '—'}
                    </td>
                    <td className="text-[12px]">{e.noticePeriodDays ? `${e.noticePeriodDays}d` : '—'}{e.lastWorkingDay ? ` · LWD ${e.lastWorkingDay}` : ''}</td>
                    <td className="text-[12px]">{e.fnfAmount ? `₹${e.fnfAmount.toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      <span className={statusChip[e.status]}>{e.status}</span>
                      {e.decidedBy && e.status !== 'Pending' && <div className="text-[10.5px] text-slate-400 mt-0.5">by {e.decidedBy}</div>}
                    </td>
                    <td className="text-right">
                      {mode === 'admin' && e.status === 'Pending' && (
                        <button type="button" className="sh-btn sh-btn-soft" onClick={() => setDecideFor(decideFor === e.id ? null : e.id)}>
                          <ShieldCheck className="w-3.5 h-3.5" /> Decide
                        </button>
                      )}
                      {mode === 'admin' && e.status === 'Approved' && (
                        <button type="button" className="sh-btn sh-btn-soft" onClick={() => decide(e.id, 'Completed')}>
                          <BadgeCheck className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                    </td>
                  </tr>
                  {mode === 'admin' && decideFor === e.id && (
                    <tr><td colSpan={8} className="bg-slate-50">
                      <div className="flex flex-wrap items-center gap-2 py-1">
                        <input className="sh-input flex-1 min-w-[240px]" placeholder="Remarks (optional)" value={remarks} onChange={(ev) => setRemarks(ev.target.value)} />
                        <button type="button" className="sh-btn sh-btn-primary" onClick={() => decide(e.id, 'Approved')}><Check className="w-3.5 h-3.5" /> Approve</button>
                        <button type="button" className="sh-btn" onClick={() => decide(e.id, 'Rejected')}><X className="w-3.5 h-3.5" /> Reject</button>
                      </div>
                    </td></tr>
                  )}
                  {e.reason && (
                    <tr><td colSpan={mode === 'admin' ? 8 : 7} className="bg-white text-[11.5px] text-slate-500">Reason: {e.reason}</td></tr>
                  )}
                  {e.history && e.history.length > 0 && (
                    <tr><td colSpan={mode === 'admin' ? 8 : 7} className="bg-white">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-400">
                        {e.history.map((h, i) => <span key={i}><History className="w-3 h-3 inline" /> {new Date(h.at).toLocaleString('en-IN')} · {h.by} · {h.action}</span>)}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={mode === 'admin' ? 8 : 7} className="text-center py-8 text-slate-400">
                  {mode === 'employee' ? 'No lifecycle events recorded for you.' : 'No lifecycle events yet.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollLifecycleSection;
