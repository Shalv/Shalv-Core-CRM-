import React, { useMemo, useState } from 'react';
import { History, Search, ShieldCheck } from 'lucide-react';
import type {
  PayrollRun,
  RegularizationRequest,
  ShiftSwapRequest,
  HelpDeskTicket,
  LifecycleEvent,
} from './payrollTypes';

/**
 * Payroll audit trail — every recorded change across payroll runs, attendance
 * regularization, shift swaps, help desk tickets and employee lifecycle, in one
 * chronological log with who / when / what.
 */
export interface PayrollAuditTrailSectionProps {
  runs: PayrollRun[];
  regularization: RegularizationRequest[];
  swaps: ShiftSwapRequest[];
  tickets: HelpDeskTicket[];
  lifecycle: LifecycleEvent[];
}

interface AuditRow {
  at: string;
  by: string;
  action: string;
  entity: string;
  entityLabel: string;
  from?: string;
  to?: string;
}

export function PayrollAuditTrailSection({
  runs,
  regularization,
  swaps,
  tickets,
  lifecycle,
}: PayrollAuditTrailSectionProps) {
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('All');

  const rows = useMemo<AuditRow[]>(() => {
    const out: AuditRow[] = [];
    const push = (
      entityName: string,
      label: string,
      history: { at: string; by: string; action: string; from?: string; to?: string }[] | undefined
    ) => {
      for (const h of history || []) {
        out.push({ at: h.at, by: h.by, action: h.action, entity: entityName, entityLabel: label, from: h.from, to: h.to });
      }
    };
    runs.forEach((r) => push('Payroll Run', r.month, r.history));
    regularization.forEach((r) => push('Regularization', `${r.type} · ${r.date} · ${r.employeeName || r.employeeId}`, r.history));
    swaps.forEach((s) => push('Shift Swap', `${s.requesterName || s.requesterId} → ${s.targetName || s.targetId} · ${s.date}`, s.history));
    tickets.forEach((t) => push('Help Desk', `${t.id} · ${t.subject}`, t.history));
    lifecycle.forEach((e) => push('Lifecycle', `${e.type} · ${e.employeeName || e.employeeId}`, e.history));
    return out.sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [runs, regularization, swaps, tickets, lifecycle]);

  const entities = ['All', 'Payroll Run', 'Regularization', 'Shift Swap', 'Help Desk', 'Lifecycle'];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (entity === 'All' ? true : r.entity === entity))
      .filter((r) =>
        q
          ? r.action.toLowerCase().includes(q) ||
            r.by.toLowerCase().includes(q) ||
            r.entity.toLowerCase().includes(q) ||
            r.entityLabel.toLowerCase().includes(q)
          : true
      );
  }, [rows, query, entity]);

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><History className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Audit trail &amp; activity log</h3>
              <p className="text-[11.5px] text-slate-500">
                Every recorded change across payroll, attendance, shifts, help desk and lifecycle — with who, when and what.
              </p>
            </div>
          </div>
          <span className="sh-badge sh-badge-neutral"><ShieldCheck className="w-3 h-3" /> {rows.length} entries</span>
        </div>

        <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="sh-input pl-9" placeholder="Search by action, user or record…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="sh-input max-w-[190px]" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {entities.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="sh-table w-full">
            <thead>
              <tr><th>When</th><th>By</th><th>Area</th><th>Record</th><th>Action</th><th>Change</th></tr>
            </thead>
            <tbody>
              {visible.slice(0, 300).map((r, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">{new Date(r.at).toLocaleString('en-IN')}</td>
                  <td className="font-semibold text-slate-800">{r.by}</td>
                  <td><span className="sh-badge sh-badge-neutral">{r.entity}</span></td>
                  <td className="max-w-[260px] truncate" title={r.entityLabel}>{r.entityLabel}</td>
                  <td>{r.action}</td>
                  <td className="text-[11.5px] text-slate-500">{r.from && r.to ? `${r.from} → ${r.to}` : '—'}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No audit entries match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {visible.length > 300 && (
          <div className="px-4 py-2 text-[11px] text-slate-400">Showing the 300 most recent of {visible.length} entries.</div>
        )}
      </div>
    </div>
  );
}

export default PayrollAuditTrailSection;
