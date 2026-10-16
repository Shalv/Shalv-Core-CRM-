import React from 'react';
import { LogIn, LogOut, MapPin, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';

/**
 * Admin / HR "punch on behalf" control.
 *
 * Lets an administrator or HR user record attendance for any enrolled employee.
 * It is rendered only for admin/HR sessions; ordinary employees stay locked to
 * their own records. The punch itself runs through the same GPS + office-geofence
 * flow as a self punch, so an out-of-geofence punch is still blocked.
 */
export interface AdminPunchOnBehalfEmployee {
  userId: string;
  name: string;
  empCode?: string;
  department?: string;
  designation?: string;
}

export interface AdminPunchOnBehalfProps {
  employees: AdminPunchOnBehalfEmployee[];
  selectedUserId: string;
  onSelectEmployee: (userId: string) => void;
  isPunchedIn: boolean;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  workMode?: string;
  isFetchingLocation?: boolean;
  onPunch: () => void;
}

export function AdminPunchOnBehalf({
  employees,
  selectedUserId,
  onSelectEmployee,
  isPunchedIn,
  punchInTime,
  punchOutTime,
  workMode,
  isFetchingLocation = false,
  onPunch,
}: AdminPunchOnBehalfProps) {
  const selected = employees.find((e) => e.userId === selectedUserId) || null;
  const alreadyOut = Boolean(!isPunchedIn && punchInTime && punchOutTime);
  const nextAction = isPunchedIn ? 'Punch Out' : 'Punch In';
  const blocked = !selected || alreadyOut;

  return (
    <div className="panel-depth m-3 sm:m-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="icon-depth icon-depth-indigo w-9 h-9">
            <UserCheck className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-extrabold text-slate-900 leading-tight">
              Punch on behalf of an employee
            </h3>
            <p className="text-[11.5px] text-slate-500">
              Admin &amp; HR can record attendance for any employee. The office geofence still applies.
            </p>
          </div>
        </div>
        <span className="chip chip-accent inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Admin / HR only
        </span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Employee
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => onSelectEmployee(e.target.value)}
            aria-label="Select employee to punch for"
            className="w-full field px-3 py-2 text-xs font-semibold"
          >
            {employees.length === 0 && <option value="">No enrolled payroll employees</option>}
            {employees.map((e) => (
              <option key={e.userId} value={e.userId}>
                {e.name}
                {e.empCode ? ` (${e.empCode})` : ''}
                {e.department ? ` · ${e.department}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Status today
          </span>
          <div className="flex items-center gap-2 flex-wrap text-[12px]">
            {alreadyOut ? (
              <span className="chip chip-success">Completed · {punchOutTime}</span>
            ) : isPunchedIn ? (
              <span className="chip chip-info">Punched in · {punchInTime}</span>
            ) : (
              <span className="chip chip-neutral">Not punched in</span>
            )}
            {workMode && <span className="chip chip-neutral">{workMode}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={onPunch}
          disabled={blocked || isFetchingLocation}
          className={`btn px-4 py-2 text-xs inline-flex items-center gap-2 ${
            blocked || isFetchingLocation
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : isPunchedIn
              ? 'btn-outline'
              : 'btn-primary'
          }`}
          title={blocked ? 'Select an employee whose attendance is still open' : `${nextAction} with GPS location`}
        >
          {isFetchingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPunchedIn ? (
            <LogOut className="w-3.5 h-3.5" />
          ) : (
            <LogIn className="w-3.5 h-3.5" />
          )}
          {isFetchingLocation ? 'Getting location…' : nextAction}
          {!blocked && !isFetchingLocation && <MapPin className="w-3 h-3 opacity-70" />}
        </button>
      </div>

      {alreadyOut && selected && (
        <p className="mt-2.5 text-[11px] text-slate-500">
          {selected.name} has already punched out for today — this day's attendance is complete.
        </p>
      )}
    </div>
  );
}

export default AdminPunchOnBehalf;
