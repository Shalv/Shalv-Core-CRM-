import React, { useMemo, useState } from 'react';
import { CalendarPlus, Plus, Trash2, Star, Check } from 'lucide-react';
import {
  PublicHoliday,
  PublicHolidayKind,
  PUBLIC_HOLIDAY_KINDS,
  DEFAULT_PUBLIC_HOLIDAYS,
} from './payrollTypes';

/**
 * Holiday master — the company holiday calendar the ESS attendance calendar reads.
 * Fixed-date national holidays are seeded; admins add the moveable festivals.
 */
export interface PayrollHolidayMasterProps {
  /** The AdminPolicyMaster that carries `publicHolidays`. */
  policy: any;
  onChangePolicy: (patch: { publicHolidays: PublicHoliday[] }) => void;
  setStatusBanner?: (message: string) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function PayrollHolidayMaster({ policy, onChangePolicy, setStatusBanner }: PayrollHolidayMasterProps) {
  const holidays: PublicHoliday[] = useMemo(
    () => (Array.isArray(policy?.publicHolidays) ? policy.publicHolidays : []),
    [policy]
  );

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [kind, setKind] = useState<PublicHolidayKind>('Public');

  const sorted = useMemo(
    () => [...holidays].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [holidays]
  );

  const upcoming = sorted.filter((h) => h.date >= todayIso());

  const add = () => {
    if (!name.trim()) {
      setStatusBanner?.('A holiday name is required.');
      return;
    }
    if (!date) {
      setStatusBanner?.('Choose the holiday date.');
      return;
    }
    if (holidays.some((h) => h.date === date)) {
      setStatusBanner?.(`A holiday already exists on ${date}. Remove it first.`);
      return;
    }
    const holiday: PublicHoliday = {
      id: `HOL-${Date.now().toString().slice(-5)}`,
      name: name.trim(),
      date,
      kind,
    };
    onChangePolicy({ publicHolidays: [...holidays, holiday] });
    setStatusBanner?.(`Holiday "${holiday.name}" added on ${holiday.date}.`);
    setName('');
  };

  const remove = (id: string) => {
    const target = holidays.find((h) => h.id === id);
    onChangePolicy({ publicHolidays: holidays.filter((h) => h.id !== id) });
    setStatusBanner?.(`Holiday "${target?.name || id}" removed.`);
  };

  const restoreDefaults = () => {
    const merged = [...holidays];
    for (const d of DEFAULT_PUBLIC_HOLIDAYS) {
      if (!merged.some((h) => h.date === d.date)) merged.push({ ...d });
    }
    onChangePolicy({ publicHolidays: merged });
    setStatusBanner?.('Fixed national holidays restored.');
  };

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><CalendarPlus className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Holiday master</h3>
              <p className="text-[11.5px] text-slate-500">
                The company holiday calendar. Every employee's attendance calendar reads this list.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="sh-badge sh-badge-neutral">{holidays.length} in calendar</span>
            <span className="sh-badge sh-badge-info">{upcoming.length} upcoming</span>
            <button type="button" className="sh-btn" onClick={restoreDefaults}>
              <Check className="w-3.5 h-3.5" /> Restore national holidays
            </button>
          </div>
        </div>

        <div className="sh-card-body grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-slate-100">
          <label className="block sm:col-span-2">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Holiday name</span>
            <input className="sh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali" />
          </label>
          <label className="block">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</span>
            <input type="date" className="sh-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kind</span>
            <select className="sh-input" value={kind} onChange={(e) => setKind(e.target.value as PublicHolidayKind)}>
              {PUBLIC_HOLIDAY_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <div className="sm:col-span-4">
            <button type="button" className="sh-btn sh-btn-primary" onClick={add}>
              <Plus className="w-3.5 h-3.5" /> Add holiday
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="sh-table w-full">
            <thead>
              <tr><th>Holiday</th><th>Date</th><th>Day</th><th>Kind</th><th>Status</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {sorted.map((h) => {
                const d = new Date(`${h.date}T00:00:00`);
                const isPast = h.date < todayIso();
                return (
                  <tr key={h.id}>
                    <td className="font-semibold text-slate-800">
                      <Star className="w-3.5 h-3.5 inline text-violet-500" /> {h.name}
                    </td>
                    <td>{h.date}</td>
                    <td>{Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                    <td>
                      <span className={`sh-badge ${h.kind === 'Public' ? 'sh-badge-purple' : h.kind === 'Optional' ? 'sh-badge-info' : 'sh-badge-neutral'}`}>
                        {h.kind}
                      </span>
                    </td>
                    <td>
                      <span className={`sh-badge ${isPast ? 'sh-badge-neutral' : 'sh-badge-success'}`}>
                        {isPast ? 'Past' : 'Upcoming'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button type="button" className="sh-btn" onClick={() => remove(h.id)} title="Remove holiday">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">
                  No holidays yet. Add one, or restore the fixed national holidays.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollHolidayMaster;
