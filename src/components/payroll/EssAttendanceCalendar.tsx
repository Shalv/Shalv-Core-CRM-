import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut, Plane } from 'lucide-react';

/**
 * ESS attendance calendar.
 *
 * A month grid where every day shows the employee's own punches (in / out times) and
 * any leave taken that day — so the month reads at a glance. Only the signed-in
 * employee's data is ever passed in.
 */
export interface EssAttendanceCalendarProps {
  /** Today's session — carries `punchHistory` (date, action, time) for previous days. */
  attendance?: any;
  /** The employee's own leave requests. */
  leaves?: any[];
  /** Policy CS-HR-POL-001 master (week-off / working-Saturday rules). */
  policy?: any;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const shortLeave = (type?: string): string => {
  const t = String(type || '').toLowerCase();
  if (t.includes('casual')) return 'CL';
  if (t.includes('sick')) return 'SL';
  if (t.includes('privilege')) return 'PL';
  if (t.includes('comp')) return 'CO';
  if (t.includes('monthly')) return 'ML';
  if (t.includes('half')) return 'HD';
  if (t.includes('work from home') || t === 'wfh') return 'WFH';
  if (t.includes('leave')) return 'LV';
  return 'LV';
};

const leaveTone = (type?: string): string => {
  const t = String(type || '').toLowerCase();
  if (t.includes('sick')) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (t.includes('casual')) return 'bg-sky-100 text-sky-700 border-sky-200';
  if (t.includes('privilege')) return 'bg-violet-100 text-violet-700 border-violet-200';
  if (t.includes('work from home') || t === 'wfh') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};

export function EssAttendanceCalendar({ attendance, leaves = [], policy }: EssAttendanceCalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  /** date -> { in, out } from the punch history (plus today's live session). */
  const punchesByDate = useMemo(() => {
    const map: Record<string, { in?: string; out?: string }> = {};
    const history: any[] = Array.isArray(attendance?.punchHistory) ? attendance.punchHistory : [];
    for (const rec of history) {
      const d = rec?.date;
      if (!d) continue;
      const entry = map[d] || (map[d] = {});
      if (rec.action === 'PUNCH_IN' && !entry.in) entry.in = rec.time;
      if (rec.action === 'PUNCH_OUT') entry.out = rec.time;
    }
    // Fold in today's live session so it shows even before the history is written.
    const t = attendance?.date;
    if (t) {
      const entry = map[t] || (map[t] = {});
      if (attendance?.punchInTime) entry.in = attendance.punchInTime;
      if (attendance?.punchOutTime) entry.out = attendance.punchOutTime;
    }
    return map;
  }, [attendance]);

  /** date -> leave type, expanding each request across its date range. */
  const leaveByDate = useMemo(() => {
    const map: Record<string, string> = {};
    for (const l of leaves) {
      if (!l) continue;
      const status = String(l.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'rejected') continue;
      const start = l.startDate;
      if (!start) continue;
      const end = l.endDate || start;
      const a = new Date(start).getTime();
      const b = new Date(end).getTime();
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      for (let t = a; t <= b; t += 86400000) {
        const d = new Date(t);
        map[iso(d.getFullYear(), d.getMonth(), d.getDate())] = l.leaveType || 'Leave';
      }
    }
    return map;
  }, [leaves]);

  const firstDay = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const leading = firstDay.getDay();

  const cells: (string | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(cursor.y, cursor.m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const isWeekOff = (dateIso: string) => {
    const day = new Date(`${dateIso}T00:00:00`).getDay();
    if (day === 0) return true;
    if (day === 6) {
      // Working Saturdays: the 1st, 3rd and 5th of the month are working days.
      const nth = Math.ceil(Number(dateIso.slice(8, 10)) / 7);
      const working = [1, 3, 5];
      return !working.includes(nth);
    }
    return false;
  };

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const m = c.m + delta;
      if (m < 0) return { y: c.y - 1, m: 11 };
      if (m > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m };
    });
  };

  const monthPunchDays = Object.keys(punchesByDate).filter((d) =>
    d.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`)
  ).length;
  const monthLeaveDays = Object.keys(leaveByDate).filter((d) =>
    d.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`)
  ).length;

  return (
    <section className="sh-card">
      <div className="sh-card-header">
        <div className="flex items-center gap-2.5">
          <span className="icon-depth w-9 h-9"><CalendarDays className="w-4.5 h-4.5" /></span>
          <div>
            <h3 className="sh-card-title">My attendance calendar</h3>
            <p className="text-[11.5px] text-slate-500">
              Punches and leave, day by day · {monthPunchDays} punched day(s), {monthLeaveDays} leave day(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className="sh-btn" onClick={() => shiftMonth(-1)} title="Previous month">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12.5px] font-bold text-slate-800 min-w-[130px] text-center">
            {MONTH_LABELS[cursor.m]} {cursor.y}
          </span>
          <button type="button" className="sh-btn" onClick={() => shiftMonth(1)} title="Next month">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="sh-card-body">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((dateIso, i) => {
            if (!dateIso) return <div key={`empty-${i}`} className="min-h-[74px] rounded-lg bg-transparent" />;
            const p = punchesByDate[dateIso];
            const leaveType = leaveByDate[dateIso];
            const off = isWeekOff(dateIso);
            const isToday = dateIso === todayIso;
            const dayNum = Number(dateIso.slice(8, 10));

            return (
              <div
                key={dateIso}
                className={`min-h-[74px] rounded-lg border p-1.5 flex flex-col gap-1 ${
                  isToday
                    ? 'border-[#f26522] bg-orange-50/60'
                    : off
                    ? 'border-slate-100 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
                title={`${dateIso}${p?.in ? ` · in ${p.in}` : ''}${p?.out ? ` · out ${p.out}` : ''}${leaveType ? ` · ${leaveType}` : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11.5px] font-bold ${off ? 'text-slate-400' : 'text-slate-700'}`}>
                    {dayNum}
                  </span>
                  {off && !leaveType && !p && (
                    <span className="text-[9px] font-bold uppercase text-slate-400">Off</span>
                  )}
                </div>

                {p?.in && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 leading-none">
                    <LogIn className="w-2.5 h-2.5" /> {p.in}
                  </div>
                )}
                {p?.out && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-none">
                    <LogOut className="w-2.5 h-2.5" /> {p.out}
                  </div>
                )}

                {leaveType && (
                  <div className={`mt-auto inline-flex items-center gap-1 self-start rounded border px-1.5 py-0.5 text-[9.5px] font-bold ${leaveTone(leaveType)}`}>
                    <Plane className="w-2.5 h-2.5" /> {shortLeave(leaveType)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-emerald-100 border border-emerald-200 inline-block" /> Punched in / out
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-rose-100 border border-rose-200 inline-block" /> Sick leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-sky-100 border border-sky-200 inline-block" /> Casual leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-violet-100 border border-violet-200 inline-block" /> Privilege leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-slate-50 border border-slate-200 inline-block" /> Week off
          </span>
          <span className="ml-auto">
            Working Saturdays: {policy?.workingSaturdays || '1st, 3rd & 5th working; 2nd & 4th off'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default EssAttendanceCalendar;
