import type { AttendanceSession, AdminPolicyMaster, LeaveRequestItem } from './payrollTypes';

/**
 * Daily attendance log. It lives INSIDE the employee's AttendanceSession (`dayLog`),
 * so it travels through the existing local-storage + server sync with no extra plumbing.
 */

export type DayStatus = 'Present' | 'Late' | 'Half Day' | 'Absent' | 'Leave' | 'Holiday';

export interface AttendanceDayRecord {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  inTime?: string | null;
  outTime?: string | null;
  workMode?: string;
  note?: string;
  /** 'punch' = derived from the employee's punches, 'admin' = manual correction by an admin (never overwritten by punches) */
  source: 'punch' | 'admin';
  updatedAt: string;
}

export type AttendanceDayLog = Record<string, AttendanceDayRecord>;

export type CellCode = 'P' | 'L' | 'HD' | 'A' | 'LV' | 'H' | 'WO' | 'NR' | 'FUT';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const toIso = (y: number, m: number, d: number): string =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export const daysInMonth = (monthKey: string): number => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/** Map the policy engine's status for a punched session to a log status. */
export const deriveDayRecord = (session: AttendanceSession): AttendanceDayRecord | null => {
  if (!session?.date || !DATE_RE.test(session.date)) return null;
  const ps = session.policyStatus;
  if (!session.punchInTime && (!ps || ps === 'Awaiting Punch-In')) return null;

  let status: DayStatus = 'Present';
  if (ps === 'Late') status = 'Late';
  else if (ps === 'Half Day') status = 'Half Day';
  else if (ps === 'Absent') status = 'Absent';

  return {
    date: session.date,
    status,
    inTime: session.punchInTime ?? null,
    outTime: session.punchOutTime ?? null,
    workMode: session.workMode,
    note: session.policyRemarks,
    source: 'punch',
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Merge logs: stored first, incoming on top; today's derived punch record is added
 * unless an admin has manually corrected that date.
 */
export const mergeDayLog = (
  stored: AttendanceDayLog | undefined,
  incoming: AttendanceSession
): AttendanceDayLog => {
  const out: AttendanceDayLog = { ...(stored || {}) };
  const incomingLog = (incoming.dayLog || {}) as AttendanceDayLog;
  for (const [k, v] of Object.entries(incomingLog)) {
    if (out[k]?.source === 'admin' && v.source !== 'admin') continue;
    out[k] = v;
  }
  const derived = deriveDayRecord(incoming);
  if (derived && out[derived.date]?.source !== 'admin') {
    const prev = out[derived.date];
    const same =
      prev &&
      prev.status === derived.status &&
      prev.inTime === derived.inTime &&
      prev.outTime === derived.outTime &&
      prev.workMode === derived.workMode &&
      prev.note === derived.note;
    // keep the old timestamp when nothing changed so saves stay idempotent
    out[derived.date] = same ? prev : derived;
  }
  return out;
};

export const isWeekOff = (iso: string, policy?: Partial<AdminPolicyMaster>): boolean => {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 0) return policy?.sundaysOff !== false;
  if (dow === 6) {
    const nth = Math.ceil(d / 7);
    const offs = policy?.holidaySaturdayNumbers ?? [2, 4];
    return offs.includes(nth);
  }
  return false;
};

const FULL_DAY_LEAVE_TYPES = new Set([
  'Privilege Leave',
  'Casual Leave',
  'Sick Leave',
  'Comp-Off',
  'Monthly Leave (1/Month)',
]);

export const leaveCoverage = (iso: string, leaves: LeaveRequestItem[]): 'full' | 'half' | null => {
  let found: 'full' | 'half' | null = null;
  for (const lv of leaves || []) {
    if (lv.status !== 'Approved') continue;
    if (!DATE_RE.test(lv.startDate || '') || !DATE_RE.test(lv.endDate || '')) continue;
    if (iso < lv.startDate || iso > lv.endDate) continue;
    if (FULL_DAY_LEAVE_TYPES.has(lv.leaveType) && lv.dayType === 'Full Day') return 'full';
    if (lv.dayType === 'First Half' || lv.dayType === 'Second Half' || lv.leaveType === 'Half Day Approval')
      found = 'half';
    else if (FULL_DAY_LEAVE_TYPES.has(lv.leaveType)) return 'full';
  }
  return found;
};

export interface ResolvedDay {
  iso: string;
  day: number;
  code: CellCode;
  record?: AttendanceDayRecord;
}

export const resolveDay = (
  iso: string,
  log: AttendanceDayLog,
  leaves: LeaveRequestItem[],
  policy: Partial<AdminPolicyMaster> | undefined,
  todayIso: string
): ResolvedDay => {
  const day = Number(iso.slice(8, 10));
  const rec = log[iso];
  if (rec) {
    const code: CellCode =
      rec.status === 'Present'
        ? 'P'
        : rec.status === 'Late'
        ? 'L'
        : rec.status === 'Half Day'
        ? 'HD'
        : rec.status === 'Absent'
        ? 'A'
        : rec.status === 'Leave'
        ? 'LV'
        : 'H';
    return { iso, day, code, record: rec };
  }
  if (iso > todayIso) return { iso, day, code: 'FUT' };
  if (isWeekOff(iso, policy)) return { iso, day, code: 'WO' };
  const cov = leaveCoverage(iso, leaves);
  if (cov === 'full') return { iso, day, code: 'LV' };
  if (cov === 'half') return { iso, day, code: 'HD' };
  return { iso, day, code: 'NR' };
};

export interface MonthSummary {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  leave: number;
  weekOff: number;
  holiday: number;
  unmarked: number;
  /** Indicative payable days = present + late + 0.5*half-day + leave + week-off + holiday */
  payableDays: number;
  /** Working days elapsed so far in the month (excludes week-offs/holidays/future) */
  workingDays: number;
}

export const summariseMonth = (days: ResolvedDay[]): MonthSummary => {
  const s: MonthSummary = {
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    leave: 0,
    weekOff: 0,
    holiday: 0,
    unmarked: 0,
    payableDays: 0,
    workingDays: 0,
  };
  for (const d of days) {
    switch (d.code) {
      case 'P': s.present++; break;
      case 'L': s.late++; break;
      case 'HD': s.halfDay++; break;
      case 'A': s.absent++; break;
      case 'LV': s.leave++; break;
      case 'WO': s.weekOff++; break;
      case 'H': s.holiday++; break;
      case 'NR': s.unmarked++; break;
      default: break;
    }
    if (d.code !== 'FUT' && d.code !== 'WO' && d.code !== 'H') s.workingDays++;
  }
  s.payableDays = s.present + s.late + s.halfDay * 0.5 + s.leave + s.weekOff + s.holiday;
  return s;
};

