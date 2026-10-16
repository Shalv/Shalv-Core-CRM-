import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Repeat,
  Clock,
} from 'lucide-react';
import {
  ShiftDefinition,
  ShiftAssignment,
  ShiftSwapRequest,
  WEEKDAYS,
  resolveEmployeeShift,
  decideShiftSwap,
} from './payrollTypes';

/**
 * Shifts, rosters and shift-swap requests.
 *
 * `mode="admin"` — manage shift definitions, allocate employees, decide swaps.
 * `mode="employee"` — view my shift / weekly offs and request a swap.
 */
export interface PayrollShiftRosterSectionProps {
  mode: 'admin' | 'employee';
  currentUserId: string;
  currentUserName: string;
  employees: { userId: string; name?: string; empCode?: string; department?: string }[];
  shifts: ShiftDefinition[];
  onChangeShifts: (next: ShiftDefinition[]) => void;
  assignments: ShiftAssignment[];
  onChangeAssignments: (next: ShiftAssignment[]) => void;
  swaps: ShiftSwapRequest[];
  onChangeSwaps: (next: ShiftSwapRequest[]) => void;
  setStatusBanner?: (message: string) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyShift = (): ShiftDefinition => ({
  id: '',
  name: '',
  code: '',
  startTime: '09:30 AM',
  endTime: '06:00 PM',
  breakMins: 60,
  graceMins: 15,
  weeklyOffs: [0, 6],
  overnight: false,
  active: true,
});

const offsLabel = (offs: number[]) =>
  offs.length ? offs.map((d) => WEEKDAYS[d]).join(', ') : 'None';

export function PayrollShiftRosterSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  shifts,
  onChangeShifts,
  assignments,
  onChangeAssignments,
  swaps,
  onChangeSwaps,
  setStatusBanner,
}: PayrollShiftRosterSectionProps) {
  const [draft, setDraft] = useState<ShiftDefinition | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState('');
  const [assignShift, setAssignShift] = useState('');
  const [assignFrom, setAssignFrom] = useState(todayIso());
  const [swapTarget, setSwapTarget] = useState('');
  const [swapDate, setSwapDate] = useState(todayIso());
  const [swapReason, setSwapReason] = useState('');
  const [decideFor, setDecideFor] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const myShift = useMemo(
    () => resolveEmployeeShift(shifts, assignments, currentUserId),
    [shifts, assignments, currentUserId]
  );
  const mySwaps = useMemo(() => swaps.filter((s) => s.requesterId === currentUserId), [swaps, currentUserId]);
  const pendingSwaps = swaps.filter((s) => s.status === 'Pending').length;

  const empName = (id: string) => employees.find((e) => e.userId === id)?.name || id;

  const saveShift = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.code.trim()) {
      setStatusBanner?.('Shift name and code are required.');
      return;
    }
    if (editingId) {
      onChangeShifts(shifts.map((s) => (s.id === editingId ? { ...draft } : s)));
      setStatusBanner?.(`Shift "${draft.name}" updated.`);
    } else {
      onChangeShifts([...shifts, { ...draft, id: `SHIFT-${Date.now().toString().slice(-5)}` }]);
      setStatusBanner?.(`Shift "${draft.name}" created.`);
    }
    setDraft(null);
    setEditingId(null);
  };

  const removeShift = (s: ShiftDefinition) => {
    const inUse = assignments.filter((a) => a.shiftId === s.id).length;
    if (inUse > 0) {
      setStatusBanner?.(`Cannot delete "${s.name}" — ${inUse} employee(s) are allocated to it.`);
      return;
    }
    onChangeShifts(shifts.filter((x) => x.id !== s.id));
    setStatusBanner?.(`Shift "${s.name}" removed.`);
  };

  const allocate = () => {
    if (!assignFor || !assignShift) {
      setStatusBanner?.('Choose an employee and a shift to allocate.');
      return;
    }
    onChangeAssignments([
      ...assignments.filter((a) => a.employeeId !== assignFor),
      { employeeId: assignFor, shiftId: assignShift, effectiveFrom: assignFrom },
    ]);
    setStatusBanner?.(`${empName(assignFor)} allocated to ${shifts.find((s) => s.id === assignShift)?.name}.`);
  };

  const raiseSwap = () => {
    if (!swapTarget) {
      setStatusBanner?.('Choose the colleague you want to swap with.');
      return;
    }
    if (!swapReason.trim()) {
      setStatusBanner?.('A reason is required for a shift swap request.');
      return;
    }
    const at = new Date().toISOString();
    onChangeSwaps([
      {
        id: `SWAP-${Date.now().toString().slice(-5)}`,
        requesterId: currentUserId,
        requesterName: currentUserName,
        targetId: swapTarget,
        targetName: empName(swapTarget),
        date: swapDate,
        reason: swapReason.trim(),
        status: 'Pending',
        raisedAt: at,
        history: [{ at, by: currentUserName, action: 'Raised', to: 'Pending' }],
      },
      ...swaps,
    ]);
    setStatusBanner?.('Shift swap request submitted for approval.');
    setSwapTarget('');
    setSwapReason('');
  };

  const decide = (id: string, decision: 'Approved' | 'Rejected') => {
    onChangeSwaps(decideShiftSwap(swaps, id, decision, currentUserName, remarks));
    setStatusBanner?.(`Swap request ${decision.toLowerCase()}.`);
    setDecideFor(null);
    setRemarks('');
  };

  return (
    <div className="space-y-4">
      {/* Employee: my shift */}
      {mode === 'employee' && (
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Clock className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">My shift</h3>
                <p className="text-[11.5px] text-slate-500">Your allocated shift and weekly offs.</p>
              </div>
            </div>
            <span className="sh-badge sh-badge-primary">{myShift.code}</span>
          </div>
          <div className="sh-card-body grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
            <div><div className="text-[10.5px] uppercase font-bold text-slate-500">Shift</div><div className="font-semibold text-slate-800">{myShift.name}</div></div>
            <div><div className="text-[10.5px] uppercase font-bold text-slate-500">Hours</div><div className="font-semibold text-slate-800">{myShift.startTime} – {myShift.endTime}</div></div>
            <div><div className="text-[10.5px] uppercase font-bold text-slate-500">Weekly offs</div><div className="font-semibold text-slate-800">{offsLabel(myShift.weeklyOffs)}</div></div>
            <div><div className="text-[10.5px] uppercase font-bold text-slate-500">Grace</div><div className="font-semibold text-slate-800">{myShift.graceMins} mins</div></div>
          </div>
        </div>
      )}

      {/* Employee: request a swap */}
      {mode === 'employee' && (
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Repeat className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Shift swap requests</h3>
                <p className="text-[11.5px] text-slate-500">Request a swap with a colleague; an approver decides.</p>
              </div>
            </div>
          </div>
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-slate-100">
            <label className="block sm:col-span-2">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Swap with</span>
              <select className="sh-input" value={swapTarget} onChange={(e) => setSwapTarget(e.target.value)}>
                <option value="">Select colleague…</option>
                {employees.filter((e) => e.userId !== currentUserId).map((e) => (
                  <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</span>
              <input type="date" className="sh-input" value={swapDate} onChange={(e) => setSwapDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reason</span>
              <input className="sh-input" value={swapReason} onChange={(e) => setSwapReason(e.target.value)} placeholder="Why you need the swap" />
            </label>
            <div className="sm:col-span-4">
              <button type="button" className="sh-btn sh-btn-primary" onClick={raiseSwap}>
                <Repeat className="w-3.5 h-3.5" /> Request swap
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Date</th><th>With</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {mySwaps.map((s) => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td>{s.targetName || empName(s.targetId)}</td>
                    <td className="max-w-[260px] truncate">{s.reason}</td>
                    <td><span className={`sh-badge ${s.status === 'Approved' ? 'sh-badge-success' : s.status === 'Rejected' ? 'sh-badge-danger' : 'sh-badge-warning'}`}>{s.status}</span></td>
                  </tr>
                ))}
                {mySwaps.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400">No swap requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin: shift master */}
      {mode === 'admin' && (
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><CalendarDays className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">Shift master</h3>
                <p className="text-[11.5px] text-slate-500">Shift timings, break, grace, weekly offs and overnight rules.</p>
              </div>
            </div>
            <button type="button" className="sh-btn sh-btn-primary" onClick={() => { setEditingId(null); setDraft(emptyShift()); }}>
              <Plus className="w-3.5 h-3.5" /> Add shift
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Shift</th><th>Code</th><th>Hours</th><th>Break</th><th>Grace</th><th>Weekly offs</th><th>Type</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-slate-800">{s.name}</td>
                    <td><span className="sh-badge sh-badge-neutral">{s.code}</span></td>
                    <td>{s.startTime} – {s.endTime}</td>
                    <td>{s.breakMins}m</td>
                    <td>{s.graceMins}m</td>
                    <td>{offsLabel(s.weeklyOffs)}</td>
                    <td>{s.overnight ? <span className="sh-badge sh-badge-purple">Overnight</span> : <span className="sh-badge sh-badge-info">Day</span>}</td>
                    <td><span className={`sh-badge ${s.active ? 'sh-badge-success' : 'sh-badge-neutral'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" className="sh-btn" onClick={() => { setEditingId(s.id); setDraft({ ...s }); }}><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" className="sh-btn" onClick={() => removeShift(s)}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'admin' && draft && (
        <div className="sh-card">
          <div className="sh-card-header">
            <h3 className="sh-card-title">{editingId ? 'Edit shift' : 'Add shift'}</h3>
            <button type="button" className="sh-btn" onClick={() => { setDraft(null); setEditingId(null); }}><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Name</span>
              <input className="sh-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Evening Shift" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Code</span>
              <input className="sh-input" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="EVE" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Start time</span>
              <input className="sh-input" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} placeholder="02:00 PM" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">End time</span>
              <input className="sh-input" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} placeholder="10:00 PM" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Break (mins)</span>
              <input type="number" className="sh-input" value={draft.breakMins} onChange={(e) => setDraft({ ...draft, breakMins: Number(e.target.value) })} /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Grace (mins)</span>
              <input type="number" className="sh-input" value={draft.graceMins} onChange={(e) => setDraft({ ...draft, graceMins: Number(e.target.value) })} /></label>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Weekly offs</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => {
                  const on = draft.weeklyOffs.includes(i);
                  return (
                    <button key={d} type="button"
                      className={`sh-btn ${on ? 'sh-btn-soft' : ''}`}
                      onClick={() => setDraft({ ...draft, weeklyOffs: on ? draft.weeklyOffs.filter((x) => x !== i) : [...draft.weeklyOffs, i] })}>
                      {on ? <Check className="w-3 h-3" /> : null} {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Overnight</span>
              <select className="sh-input" value={draft.overnight ? 'yes' : 'no'} onChange={(e) => setDraft({ ...draft, overnight: e.target.value === 'yes' })}>
                <option value="no">No</option><option value="yes">Yes (crosses midnight)</option>
              </select></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</span>
              <select className="sh-input" value={draft.active ? 'yes' : 'no'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'yes' })}>
                <option value="yes">Active</option><option value="no">Inactive</option>
              </select></label>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="button" className="sh-btn sh-btn-primary" onClick={saveShift}><Check className="w-3.5 h-3.5" /> {editingId ? 'Save changes' : 'Create shift'}</button>
              <button type="button" className="sh-btn" onClick={() => { setDraft(null); setEditingId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: allocate employees */}
      {mode === 'admin' && (
        <div className="sh-card">
          <div className="sh-card-header">
            <h3 className="sh-card-title">Shift allocation</h3>
            <span className="sh-badge sh-badge-neutral">{assignments.length} allocated</span>
          </div>
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-slate-100">
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Employee</span>
              <select className="sh-input" value={assignFor} onChange={(e) => setAssignFor(e.target.value)}>
                <option value="">Select employee…</option>
                {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
              </select></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Shift</span>
              <select className="sh-input" value={assignShift} onChange={(e) => setAssignShift(e.target.value)}>
                <option value="">Select shift…</option>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Effective from</span>
              <input type="date" className="sh-input" value={assignFrom} onChange={(e) => setAssignFrom(e.target.value)} /></label>
            <div className="flex items-end"><button type="button" className="sh-btn sh-btn-primary" onClick={allocate}><Check className="w-3.5 h-3.5" /> Allocate</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Employee</th><th>Code</th><th>Current shift</th><th>Effective from</th></tr></thead>
              <tbody>
                {employees.map((e) => {
                  const a = assignments.filter((x) => x.employeeId === e.userId).sort((x, y) => (x.effectiveFrom < y.effectiveFrom ? 1 : -1))[0];
                  const s = resolveEmployeeShift(shifts, assignments, e.userId);
                  return (
                    <tr key={e.userId}>
                      <td className="font-semibold text-slate-800">{e.name || e.userId}</td>
                      <td>{e.empCode || '—'}</td>
                      <td>{s.name} <span className="text-slate-400">({s.startTime}–{s.endTime})</span></td>
                      <td>{a?.effectiveFrom || 'Default'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin: swap approvals */}
      {mode === 'admin' && (
        <div className="sh-card">
          <div className="sh-card-header">
            <h3 className="sh-card-title">Shift swap approvals</h3>
            <span className="sh-badge sh-badge-warning"><Clock className="w-3 h-3" /> {pendingSwaps} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Requested by</th><th>Swap with</th><th>Date</th><th>Reason</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {swaps.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td className="font-semibold text-slate-800">{s.requesterName || empName(s.requesterId)}</td>
                      <td>{s.targetName || empName(s.targetId)}</td>
                      <td>{s.date}</td>
                      <td className="max-w-[240px] truncate">{s.reason}</td>
                      <td><span className={`sh-badge ${s.status === 'Approved' ? 'sh-badge-success' : s.status === 'Rejected' ? 'sh-badge-danger' : 'sh-badge-warning'}`}>{s.status}</span></td>
                      <td className="text-right">
                        {s.status === 'Pending' && (
                          <button type="button" className="sh-btn sh-btn-soft" onClick={() => setDecideFor(decideFor === s.id ? null : s.id)}>
                            <ShieldCheck className="w-3.5 h-3.5" /> Decide
                          </button>
                        )}
                      </td>
                    </tr>
                    {decideFor === s.id && (
                      <tr><td colSpan={6} className="bg-slate-50">
                        <div className="flex flex-wrap items-center gap-2 py-1">
                          <input className="sh-input flex-1 min-w-[240px]" placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                          <button type="button" className="sh-btn sh-btn-primary" onClick={() => decide(s.id, 'Approved')}><Check className="w-3.5 h-3.5" /> Approve</button>
                          <button type="button" className="sh-btn" onClick={() => decide(s.id, 'Rejected')}><X className="w-3.5 h-3.5" /> Reject</button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {swaps.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-400">No swap requests.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollShiftRosterSection;
