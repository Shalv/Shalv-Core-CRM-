import React, { useMemo, useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Clock,
} from 'lucide-react';
import {
  HelpDeskTicket,
  HelpDeskCategory,
  HelpDeskPriority,
  HelpDeskStatus,
  HELP_DESK_CATEGORIES,
  HELP_DESK_PRIORITIES,
  HELP_DESK_SLA_HOURS,
  updateHelpDeskTicket,
} from './payrollTypes';

/**
 * Employee help desk.
 *
 * `mode="employee"` — raise a ticket and track your own.
 * `mode="agent"`    — triage the queue: assign, prioritise, escalate, resolve.
 */
export interface PayrollHelpDeskSectionProps {
  mode: 'employee' | 'agent';
  currentUserId: string;
  currentUserName: string;
  employees: { userId: string; name?: string; empCode?: string; department?: string }[];
  tickets: HelpDeskTicket[];
  onChange: (next: HelpDeskTicket[]) => void;
  setStatusBanner?: (message: string) => void;
}

const statusChip: Record<HelpDeskStatus, string> = {
  Open: 'sh-badge sh-badge-info',
  'In Progress': 'sh-badge sh-badge-primary',
  Escalated: 'sh-badge sh-badge-warning',
  Resolved: 'sh-badge sh-badge-success',
  Closed: 'sh-badge sh-badge-neutral',
};

const priorityChip: Record<HelpDeskPriority, string> = {
  Low: 'sh-badge sh-badge-neutral',
  Medium: 'sh-badge sh-badge-info',
  High: 'sh-badge sh-badge-warning',
  Critical: 'sh-badge sh-badge-danger',
};

const slaDue = (raisedAt: string, priority: HelpDeskPriority) =>
  new Date(new Date(raisedAt).getTime() + HELP_DESK_SLA_HOURS[priority] * 3600_000).toISOString();

const isOverdue = (t: HelpDeskTicket) =>
  !!t.slaDueAt &&
  t.status !== 'Resolved' &&
  t.status !== 'Closed' &&
  new Date(t.slaDueAt).getTime() < Date.now();

export function PayrollHelpDeskSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  tickets,
  onChange,
  setStatusBanner,
}: PayrollHelpDeskSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HelpDeskCategory>('IT');
  const [priority, setPriority] = useState<HelpDeskPriority>('Medium');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | HelpDeskStatus>('All');
  const [open, setOpen] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [assignTo, setAssignTo] = useState('');

  const empName = (id: string) => employees.find((e) => e.userId === id)?.name || id;

  const visible = useMemo(() => {
    const base = mode === 'employee' ? tickets.filter((t) => t.employeeId === currentUserId) : tickets;
    const q = query.trim().toLowerCase();
    return base
      .filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter))
      .filter((t) =>
        q
          ? t.subject.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            empName(t.employeeId).toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [mode, tickets, currentUserId, query, statusFilter, employees]);

  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Escalated').length;

  const raise = () => {
    if (!subject.trim() || !description.trim()) {
      setStatusBanner?.('Subject and description are required to raise a ticket.');
      return;
    }
    const at = new Date().toISOString();
    const ticket: HelpDeskTicket = {
      id: `TKT-${Date.now().toString().slice(-6)}`,
      employeeId: currentUserId,
      employeeName: currentUserName,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'Open',
      raisedAt: at,
      updatedAt: at,
      slaDueAt: slaDue(at, priority),
      history: [{ at, by: currentUserName, action: 'Raised', to: 'Open' }],
    };
    onChange([ticket, ...tickets]);
    setStatusBanner?.(`Ticket ${ticket.id} raised — response target ${HELP_DESK_SLA_HOURS[priority]}h.`);
    setShowForm(false);
    setSubject('');
    setDescription('');
  };

  const apply = (id: string, patch: Partial<HelpDeskTicket>, action: string) => {
    onChange(updateHelpDeskTicket(tickets, id, patch, currentUserName, action));
    setStatusBanner?.(`${id}: ${action}.`);
  };

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><LifeBuoy className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">{mode === 'employee' ? 'Help desk' : 'Help desk queue'}</h3>
              <p className="text-[11.5px] text-slate-500">
                {mode === 'employee'
                  ? 'Raise a ticket for IT, HR, payroll or facilities and track its resolution.'
                  : 'Assign, prioritise, escalate and resolve employee tickets.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'agent' && (
              <span className="sh-badge sh-badge-warning"><Clock className="w-3 h-3" /> {openCount} open</span>
            )}
            {mode === 'employee' && (
              <button type="button" className="sh-btn sh-btn-primary" onClick={() => setShowForm((s) => !s)}>
                <Plus className="w-3.5 h-3.5" /> New ticket
              </button>
            )}
          </div>
        </div>

        {mode === 'employee' && showForm && (
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100">
            <label className="block sm:col-span-2">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Subject</span>
              <input className="sh-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</span>
              <select className="sh-input" value={category} onChange={(e) => setCategory(e.target.value as HelpDeskCategory)}>
                {HELP_DESK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Priority</span>
              <select className="sh-input" value={priority} onChange={(e) => setPriority(e.target.value as HelpDeskPriority)}>
                {HELP_DESK_PRIORITIES.map((p) => <option key={p} value={p}>{p} ({HELP_DESK_SLA_HOURS[p]}h)</option>)}
              </select>
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</span>
              <textarea className="sh-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, and what you need" />
            </label>
            <div className="sm:col-span-3 flex gap-2">
              <button type="button" className="sh-btn sh-btn-primary" onClick={raise}><Check className="w-3.5 h-3.5" /> Raise ticket</button>
              <button type="button" className="sh-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="sh-input pl-9" placeholder={mode === 'employee' ? 'Search my tickets…' : 'Search tickets, employees…'} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {mode === 'agent' && (
            <select className="sh-input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | HelpDeskStatus)}>
              {['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="sh-table w-full">
            <thead>
              <tr>
                <th>Ticket</th>
                {mode === 'agent' && <th>Raised by</th>}
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>SLA</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <React.Fragment key={t.id}>
                  <tr>
                    <td>
                      <div className="font-semibold text-slate-800">{t.subject}</div>
                      <div className="text-[11px] text-slate-500">{t.id} · updated {new Date(t.updatedAt).toLocaleDateString('en-IN')}</div>
                    </td>
                    {mode === 'agent' && <td>{t.employeeName || empName(t.employeeId)}</td>}
                    <td><span className="sh-badge sh-badge-neutral">{t.category}</span></td>
                    <td><span className={priorityChip[t.priority]}>{t.priority}</span></td>
                    <td><span className={statusChip[t.status]}>{t.status}</span></td>
                    <td>{t.assignedTo || '—'}</td>
                    <td>
                      {isOverdue(t)
                        ? <span className="sh-badge sh-badge-danger"><AlertTriangle className="w-3 h-3" /> Overdue</span>
                        : t.slaDueAt
                        ? <span className="text-[11.5px] text-slate-500">due {new Date(t.slaDueAt).toLocaleString('en-IN')}</span>
                        : '—'}
                    </td>
                    <td className="text-right">
                      <button type="button" className="sh-btn" onClick={() => setOpen(open === t.id ? null : t.id)}>
                        {open === t.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {open === t.id && (
                    <tr>
                      <td colSpan={mode === 'agent' ? 8 : 7} className="bg-slate-50">
                        <div className="space-y-2 py-1">
                          <div className="text-[12.5px]"><span className="font-semibold text-slate-700">Description:</span> {t.description}</div>
                          {t.resolution && (
                            <div className="text-[12.5px]"><span className="font-semibold text-slate-700">Resolution:</span> {t.resolution}</div>
                          )}
                          {mode === 'agent' && t.status !== 'Resolved' && t.status !== 'Closed' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <select className="sh-input max-w-[190px]" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                                <option value="">Assign to…</option>
                                {employees.map((e) => <option key={e.userId} value={e.name || e.userId}>{e.name || e.userId}</option>)}
                              </select>
                              <button type="button" className="sh-btn" disabled={!assignTo}
                                onClick={() => { apply(t.id, { assignedTo: assignTo, status: t.status === 'Open' ? 'In Progress' : t.status }, `Assigned to ${assignTo}`); setAssignTo(''); }}>
                                <UserCheck className="w-3.5 h-3.5" /> Assign
                              </button>
                              <select className="sh-input max-w-[150px]" value={t.priority} onChange={(e) => apply(t.id, { priority: e.target.value as HelpDeskPriority }, `Priority → ${e.target.value}`)}>
                                {HELP_DESK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                              </select>
                              {t.status !== 'Escalated' && (
                                <button type="button" className="sh-btn" onClick={() => apply(t.id, { status: 'Escalated' }, 'Escalated')}>
                                  <AlertTriangle className="w-3.5 h-3.5" /> Escalate
                                </button>
                              )}
                              <input className="sh-input flex-1 min-w-[220px]" placeholder="Resolution notes" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                              <button type="button" className="sh-btn sh-btn-primary" disabled={!resolution.trim()}
                                onClick={() => { apply(t.id, { status: 'Resolved', resolution: resolution.trim() }, 'Resolved'); setResolution(''); }}>
                                <ShieldCheck className="w-3.5 h-3.5" /> Resolve
                              </button>
                              <button type="button" className="sh-btn" onClick={() => apply(t.id, { status: 'Closed' }, 'Closed')}>
                                <X className="w-3.5 h-3.5" /> Close
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-400">
                            {t.history.map((h, i) => (
                              <span key={i}>{new Date(h.at).toLocaleString('en-IN')} · {h.by} · {h.action}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={mode === 'agent' ? 8 : 7} className="text-center py-8 text-slate-400">
                  {mode === 'employee' ? 'You have no tickets yet.' : 'No tickets match the filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollHelpDeskSection;
