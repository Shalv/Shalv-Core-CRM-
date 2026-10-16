import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  Check,
  X,
  ShieldCheck,
  Clock,
  Search,
  Ban,
} from 'lucide-react';
import {
  RegularizationRequest,
  RegularizationType,
  RegularizationStatus,
  REGULARIZATION_TYPES,
  decideRegularization,
} from './payrollTypes';

/**
 * Attendance regularization & WFH / field-duty requests.
 *
 * `mode="employee"` — the employee raises a request and tracks their own.
 * `mode="approver"` — a manager/admin reviews the queue and decides.
 * Both modes read the same request list, so a decision updates both portals.
 */
export interface PayrollRegularizationSectionProps {
  mode: 'employee' | 'approver';
  currentUserId: string;
  currentUserName: string;
  employees: { userId: string; name?: string; empCode?: string; department?: string }[];
  requests: RegularizationRequest[];
  onChange: (next: RegularizationRequest[]) => void;
  setStatusBanner?: (message: string) => void;
}

const statusChip: Record<RegularizationStatus, string> = {
  Pending: 'sh-badge sh-badge-warning',
  Approved: 'sh-badge sh-badge-success',
  Rejected: 'sh-badge sh-badge-danger',
  Cancelled: 'sh-badge sh-badge-neutral',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function PayrollRegularizationSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  requests,
  onChange,
  setStatusBanner,
}: PayrollRegularizationSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState<RegularizationType>('Missed Punch');
  const [requestedIn, setRequestedIn] = useState('');
  const [requestedOut, setRequestedOut] = useState('');
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [decideFor, setDecideFor] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const empName = (id: string) =>
    employees.find((e) => e.userId === id)?.name || id;

  const visible = useMemo(() => {
    const base = mode === 'employee' ? requests.filter((r) => r.employeeId === currentUserId) : requests;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter(
          (r) =>
            empName(r.employeeId).toLowerCase().includes(q) ||
            r.type.toLowerCase().includes(q) ||
            r.status.toLowerCase().includes(q) ||
            r.date.includes(q)
        )
      : base;
    return [...filtered].sort((a, b) => (a.raisedAt < b.raisedAt ? 1 : -1));
  }, [mode, requests, currentUserId, query, employees]);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  const submit = () => {
    if (!reason.trim()) {
      setStatusBanner?.('A reason is required for a regularization request.');
      return;
    }
    if (!date) {
      setStatusBanner?.('Please choose the attendance date.');
      return;
    }
    const at = new Date().toISOString();
    const req: RegularizationRequest = {
      id: `REG-${Date.now().toString().slice(-6)}`,
      employeeId: currentUserId,
      employeeName: currentUserName,
      date,
      type,
      requestedIn: requestedIn || undefined,
      requestedOut: requestedOut || undefined,
      reason: reason.trim(),
      status: 'Pending',
      raisedAt: at,
      raisedBy: currentUserName,
      history: [{ at, by: currentUserName, action: 'Raised', to: 'Pending' }],
    };
    onChange([req, ...requests]);
    setStatusBanner?.(`Regularization request for ${date} submitted for approval.`);
    setShowForm(false);
    setReason('');
    setRequestedIn('');
    setRequestedOut('');
  };

  const decide = (id: string, decision: RegularizationStatus) => {
    onChange(decideRegularization(requests, id, decision, currentUserName, remarks));
    setStatusBanner?.(`Request ${decision.toLowerCase()}.`);
    setDecideFor(null);
    setRemarks('');
  };

  const cancelOwn = (id: string) => {
    onChange(decideRegularization(requests, id, 'Cancelled', currentUserName, 'Cancelled by employee'));
    setStatusBanner?.('Request cancelled.');
  };

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><CalendarClock className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">
                {mode === 'employee' ? 'Attendance regularization & WFH' : 'Regularization approvals'}
              </h3>
              <p className="text-[11.5px] text-slate-500">
                {mode === 'employee'
                  ? 'Correct a missed punch, request work-from-home, field duty or overtime. Approved requests update your attendance.'
                  : 'Review and decide employee regularization, work-from-home, field-duty and overtime requests.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'approver' && (
              <span className="sh-badge sh-badge-warning"><Clock className="w-3 h-3" /> {pendingCount} pending</span>
            )}
            {mode === 'employee' && (
              <button type="button" className="sh-btn sh-btn-primary" onClick={() => setShowForm((s) => !s)}>
                <Plus className="w-3.5 h-3.5" /> New request
              </button>
            )}
          </div>
        </div>

        {mode === 'employee' && showForm && (
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-slate-100">
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Attendance date</span>
              <input type="date" className="sh-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Request type</span>
              <select className="sh-input" value={type} onChange={(e) => setType(e.target.value as RegularizationType)}>
                {REGULARIZATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">In time (optional)</span>
              <input className="sh-input" placeholder="09:30 AM" value={requestedIn} onChange={(e) => setRequestedIn(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Out time (optional)</span>
              <input className="sh-input" placeholder="06:00 PM" value={requestedOut} onChange={(e) => setRequestedOut(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason</span>
              <input className="sh-input" placeholder="Why this attendance needs correcting" value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
              <button type="button" className="sh-btn sh-btn-primary" onClick={submit}>
                <Check className="w-3.5 h-3.5" /> Submit request
              </button>
              <button type="button" className="sh-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="px-4 pt-3">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="sh-input pl-9"
              placeholder={mode === 'employee' ? 'Search my requests…' : 'Search by employee, type or status…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="sh-table w-full">
            <thead>
              <tr>
                {mode === 'approver' && <th>Employee</th>}
                <th>Date</th>
                <th>Type</th>
                <th>Requested</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <React.Fragment key={r.id}>
                  <tr>
                    {mode === 'approver' && (
                      <td>
                        <div className="font-semibold text-slate-800">{empName(r.employeeId)}</div>
                        <div className="text-[11px] text-slate-500">
                          {employees.find((e) => e.userId === r.employeeId)?.empCode || ''}
                        </div>
                      </td>
                    )}
                    <td>{r.date}</td>
                    <td><span className="sh-badge sh-badge-info">{r.type}</span></td>
                    <td className="text-[12px]">{r.requestedIn || '—'} → {r.requestedOut || '—'}</td>
                    <td className="max-w-[240px] truncate" title={r.reason}>{r.reason}</td>
                    <td>
                      <span className={statusChip[r.status]}>{r.status}</span>
                      {r.decidedBy && r.status !== 'Pending' && (
                        <div className="text-[10.5px] text-slate-400 mt-0.5">by {r.decidedBy}</div>
                      )}
                    </td>
                    <td className="text-right">
                      {mode === 'approver' && r.status === 'Pending' && (
                        <button
                          type="button"
                          className="sh-btn sh-btn-soft"
                          onClick={() => setDecideFor(decideFor === r.id ? null : r.id)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Decide
                        </button>
                      )}
                      {mode === 'employee' && r.status === 'Pending' && (
                        <button type="button" className="sh-btn" onClick={() => cancelOwn(r.id)}>
                          <Ban className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                  {mode === 'approver' && decideFor === r.id && (
                    <tr>
                      <td colSpan={7} className="bg-slate-50">
                        <div className="flex flex-wrap items-center gap-2 py-1">
                          <input
                            className="sh-input flex-1 min-w-[240px]"
                            placeholder="Remarks (optional)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                          <button type="button" className="sh-btn sh-btn-primary" onClick={() => decide(r.id, 'Approved')}>
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button type="button" className="sh-btn" onClick={() => decide(r.id, 'Rejected')}>
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button type="button" className="sh-btn" onClick={() => { setDecideFor(null); setRemarks(''); }}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {r.history && r.history.length > 0 && (
                    <tr>
                      <td colSpan={mode === 'approver' ? 7 : 6} className="bg-white">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 py-0.5 text-[10.5px] text-slate-400">
                          {r.history.map((h, i) => (
                            <span key={i}>{new Date(h.at).toLocaleString('en-IN')} · {h.by} · {h.action}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={mode === 'approver' ? 7 : 6} className="text-center py-8 text-slate-400">
                    {mode === 'employee' ? 'You have no regularization requests yet.' : 'No requests to review.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollRegularizationSection;
