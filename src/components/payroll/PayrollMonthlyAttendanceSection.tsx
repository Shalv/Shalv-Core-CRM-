import React, { useMemo, useState } from 'react';
import { localIsoDate } from '../../shared/geo';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react';
import {
  AdminPolicyMaster,
  AttendanceSession,
  LeaveRequestItem,
  loadEmployeeAttendance,
  saveEmployeeAttendance,
} from './payrollTypes';
import {
  AttendanceDayRecord,
  CellCode,
  DayStatus,
  daysInMonth,
  deriveDayRecord,
  mergeDayLog,
  resolveDay,
  summariseMonth,
  toIso,
} from './attendanceLog';

export interface MonthlyAttendanceEmployee {
  id: string;
  name: string;
  empCode: string;
  department: string;
  designation: string;
  location: string;
  status: string;
  attendance: AttendanceSession;
  leaves: LeaveRequestItem[];
}

interface Props {
  employees: MonthlyAttendanceEmployee[];
  policy: AdminPolicyMaster;
  departments: string[];
  onChanged: () => void;
  setStatusBanner: (msg: string | null) => void;
}

const CELL_STYLE: Record<CellCode, { label: string; cls: string; title: string }> = {
  P: { label: 'P', cls: 'bg-emerald-100 text-emerald-800', title: 'Present' },
  L: { label: 'L', cls: 'bg-amber-100 text-amber-800', title: 'Late' },
  HD: { label: 'HD', cls: 'bg-orange-100 text-orange-800', title: 'Half day' },
  A: { label: 'A', cls: 'bg-rose-100 text-rose-800', title: 'Absent' },
  LV: { label: 'LV', cls: 'bg-sky-100 text-sky-800', title: 'Approved leave' },
  H: { label: 'H', cls: 'bg-violet-100 text-violet-800', title: 'Holiday' },
  WO: { label: 'WO', cls: 'bg-slate-100 text-slate-500', title: 'Weekly off' },
  NR: { label: '–', cls: 'bg-white text-slate-400 border border-dashed border-slate-300', title: 'Not recorded' },
  FUT: { label: '', cls: 'bg-transparent text-slate-300', title: '' },
};

const STATUS_OPTIONS: DayStatus[] = ['Present', 'Late', 'Half Day', 'Absent', 'Leave', 'Holiday'];

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// <input type="time"> uses 24h "HH:MM"; the payroll engine stores "hh:mm AM/PM".
const to12h = (v: string): string | null => {
  if (!v) return null;
  const [hh, mm] = v.split(':').map(Number);
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`;
};
const to24h = (v?: string | null): string => {
  if (!v) return '';
  const m = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = Number(m[1]);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

export const PayrollMonthlyAttendanceSection: React.FC<Props> = ({
  employees,
  policy,
  departments,
  onChanged,
  setStatusBanner,
}) => {
  const todayIso = localIsoDate();
  const [monthKey, setMonthKey] = useState<string>(todayIso.slice(0, 7));
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<{
    emp: MonthlyAttendanceEmployee;
    iso: string;
    existing?: AttendanceDayRecord;
  } | null>(null);
  const [draft, setDraft] = useState<{
    status: DayStatus;
    inTime: string;
    outTime: string;
    note: string;
  }>({ status: 'Present', inTime: '', outTime: '', note: '' });

  const [y, m] = monthKey.split('-').map(Number);
  const dayCount = daysInMonth(monthKey);
  const isoDays = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => toIso(y, m, i + 1)),
    [y, m, dayCount]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => includeInactive || e.status !== 'Inactive')
      .filter((e) => dept === 'ALL' || e.department === dept)
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.empCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      )
      .map((e) => {
        // stored log (includes admin corrections) + anything on the in-memory session + today's punch
        const stored = loadEmployeeAttendance(e.id, e.location).dayLog;
        const log = mergeDayLog(stored, e.attendance);
        const days = isoDays.map((iso) => resolveDay(iso, log, e.leaves, policy, todayIso));
        return { emp: e, days, summary: summariseMonth(days) };
      })
      .sort((a, b) => a.emp.name.localeCompare(b.emp.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, search, dept, includeInactive, isoDays, policy, todayIso]);

  const totals = useMemo(() => {
    const t = { present: 0, late: 0, absent: 0, leave: 0, unmarked: 0, working: 0, attended: 0 };
    rows.forEach((r) => {
      t.present += r.summary.present;
      t.late += r.summary.late;
      t.absent += r.summary.absent;
      t.leave += r.summary.leave;
      t.unmarked += r.summary.unmarked;
      t.working += r.summary.workingDays;
      t.attended += r.summary.present + r.summary.late + r.summary.halfDay * 0.5;
    });
    return t;
  }, [rows]);

  const openEditor = (emp: MonthlyAttendanceEmployee, iso: string, rec?: AttendanceDayRecord) => {
    if (iso > todayIso) return;
    setEditing({ emp, iso, existing: rec });
    setDraft({
      status: rec?.status || 'Present',
      inTime: to24h(rec?.inTime),
      outTime: to24h(rec?.outTime),
      note: rec?.source === 'admin' ? rec.note || '' : '',
    });
  };

  const writeLog = (
    emp: MonthlyAttendanceEmployee,
    mutate: (log: Record<string, AttendanceDayRecord>) => void
  ) => {
    const session = loadEmployeeAttendance(emp.id, emp.location);
    const base = mergeDayLog(session.dayLog, emp.attendance);
    const next = { ...base };
    mutate(next);
    // explicit write: do not re-merge, otherwise a removed correction would come back
    saveEmployeeAttendance(emp.id, { ...session, dayLog: next }, true, { skipDayLogMerge: true });
    onChanged();
  };

  const handleSave = () => {
    if (!editing) return;
    const { emp, iso } = editing;
    const rec: AttendanceDayRecord = {
      date: iso,
      status: draft.status,
      inTime: to12h(draft.inTime),
      outTime: to12h(draft.outTime),
      note: draft.note.trim() || undefined,
      source: 'admin',
      updatedAt: new Date().toISOString(),
    };
    writeLog(emp, (log) => {
      log[iso] = rec;
    });
    setStatusBanner(`Attendance for ${emp.name} on ${iso} set to ${draft.status} (admin correction).`);
    setEditing(null);
  };

  const handleClear = () => {
    if (!editing) return;
    const { emp, iso } = editing;
    writeLog(emp, (log) => {
      delete log[iso];
      // fall back to the punch-derived record if the employee punched that day
      const derived = emp.attendance.date === iso ? deriveDayRecord(emp.attendance) : null;
      if (derived) log[iso] = derived;
    });
    setStatusBanner(`Removed admin correction for ${emp.name} on ${iso}.`);
    setEditing(null);
  };

  const handleExport = () => {
    const header = [
      'Emp Code',
      'Name',
      'Department',
      'Designation',
      ...isoDays.map((d) => d.slice(8)),
      'Present',
      'Late',
      'Half Day',
      'Absent',
      'Leave',
      'Week Off',
      'Unmarked',
      'Payable Days',
    ];
    const lines = rows.map((r) =>
      [
        r.emp.empCode,
        r.emp.name,
        r.emp.department,
        r.emp.designation,
        ...r.days.map((d) => CELL_STYLE[d.code].label.replace('–', '')),
        r.summary.present,
        r.summary.late,
        r.summary.halfDay,
        r.summary.absent,
        r.summary.leave,
        r.summary.weekOff,
        r.summary.unmarked,
        r.summary.payableDays,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const pct = totals.working ? Math.round((totals.attended / totals.working) * 100) : 0;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1f7e9e]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Monthly Attendance — Employee-wise</h3>
              <p className="text-[11px] text-slate-500">
                One row per employee, one column per day. Click any past day to correct it.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonthKey(shiftMonth(monthKey, -1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={monthKey}
              onChange={(e) => e.target.value && setMonthKey(e.target.value)}
              aria-label="Select month"
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
            />
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonthKey(shiftMonth(monthKey, 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, designation"
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg w-64 bg-slate-50 focus:bg-white"
            />
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            aria-label="Filter by department"
            className="border border-slate-200 rounded-lg px-2 py-1.5 font-semibold"
          >
            <option value="ALL">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Include inactive
          </label>
          <span className="ml-auto font-bold text-slate-700">{monthLabel(monthKey)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            ['Employees', rows.length],
            ['Attendance rate', `${pct}%`],
            ['Absent days', totals.absent],
            ['Leave days', totals.leave],
            ['Unmarked days', totals.unmarked],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">{k}</div>
              <div className="text-base font-extrabold text-slate-900">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          {(['P', 'L', 'HD', 'A', 'LV', 'H', 'WO', 'NR'] as CellCode[]).map((c) => (
            <span key={c} className="flex items-center gap-1">
              <span className={`inline-block w-6 text-center rounded py-0.5 ${CELL_STYLE[c].cls}`}>
                {CELL_STYLE[c].label}
              </span>
              <span className="text-slate-600 font-semibold">{CELL_STYLE[c].title}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-auto max-h-[70vh]">
        <table className="text-[11px] border-separate border-spacing-0 min-w-full">
          <thead>
            <tr className="text-slate-500">
              <th className="sticky left-0 top-0 z-30 bg-slate-50 border-b border-r border-slate-200 text-left px-3 py-2 min-w-[210px]">
                Employee
              </th>
              {isoDays.map((iso) => {
                const dow = new Date(y, m - 1, Number(iso.slice(8))).getDay();
                return (
                  <th
                    key={iso}
                    className={`sticky top-0 z-20 border-b border-slate-200 px-0.5 py-1 text-center min-w-[30px] ${
                      dow === 0 || dow === 6 ? 'bg-slate-100' : 'bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{iso.slice(8)}</div>
                    <div className="text-[9px] font-medium">{DOW[dow]}</div>
                  </th>
                );
              })}
              {['P', 'L', 'HD', 'A', 'LV', 'WO', '–', 'Pay days'].map((h) => (
                <th
                  key={h}
                  className="sticky top-0 z-20 bg-slate-50 border-b border-l border-slate-200 px-2 py-2 text-center whitespace-nowrap"
                  title={h === '–' ? 'Unmarked' : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={dayCount + 9} className="p-8 text-center text-slate-500">
                  No employees match these filters.
                </td>
              </tr>
            )}
            {rows.map(({ emp, days, summary }) => (
              <tr key={emp.id} className="hover:bg-slate-50/70">
                <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-200 px-3 py-1.5">
                  <div className="font-bold text-slate-900 truncate max-w-[190px]">{emp.name}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[190px]">
                    {emp.empCode} · {emp.department} · {emp.designation}
                  </div>
                </td>
                {days.map((d) => {
                  const st = CELL_STYLE[d.code];
                  const clickable = d.iso <= todayIso;
                  const tip = `${emp.name} · ${d.iso} · ${st.title}${
                    d.record?.inTime ? ` · in ${d.record.inTime}` : ''
                  }${d.record?.outTime ? ` · out ${d.record.outTime}` : ''}${
                    d.record?.source === 'admin' ? ' · admin corrected' : ''
                  }`;
                  return (
                    <td key={d.iso} className="border-b border-slate-100 p-0.5 text-center">
                      <button
                        type="button"
                        disabled={!clickable}
                        title={tip}
                        aria-label={tip}
                        onClick={() => openEditor(emp, d.iso, d.record)}
                        className={`w-7 h-6 rounded font-bold text-[10px] relative ${st.cls} ${
                          clickable ? 'cursor-pointer hover:ring-2 hover:ring-[#1f7e9e]' : 'cursor-default'
                        }`}
                      >
                        {st.label}
                        {d.record?.source === 'admin' && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#1f7e9e]" />
                        )}
                      </button>
                    </td>
                  );
                })}
                {[
                  summary.present,
                  summary.late,
                  summary.halfDay,
                  summary.absent,
                  summary.leave,
                  summary.weekOff,
                  summary.unmarked,
                  summary.payableDays,
                ].map((v, i) => (
                  <td
                    key={i}
                    className={`border-b border-l border-slate-200 px-2 text-center font-mono font-bold ${
                      i === 7 ? 'text-[#1f7e9e]' : i === 6 && v > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-200">
        Pay days are indicative: present + late + ½ × half-days + approved leave + weekly offs. Days marked “–” have no punch,
        leave or correction and need review before payroll is run. A dot marks an admin correction.
      </p>

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Correct attendance"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Correct attendance</h4>
                <p className="text-slate-500">
                  {editing.emp.name} · {editing.iso}
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as DayStatus })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-semibold"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">In time</label>
                <input
                  type="time"
                  value={draft.inTime}
                  onChange={(e) => setDraft({ ...draft, inTime: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Out time</label>
                <input
                  type="time"
                  value={draft.outTime}
                  onChange={(e) => setDraft({ ...draft, outTime: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason / note</label>
              <textarea
                rows={2}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="e.g. Missed punch, approved by manager"
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {editing.existing?.source === 'admin' ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-rose-600 font-semibold hover:underline cursor-pointer"
                >
                  Remove correction
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg bg-[#1f7e9e] text-white font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
