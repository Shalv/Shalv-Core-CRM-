import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
  X,
  Navigation,
} from 'lucide-react';
import {
  PayrollLocation,
  PayrollLocationType,
  PAYROLL_LOCATION_TYPES,
  EmployeeSalaryMasterRecord,
} from './payrollTypes';
import { formatDistance } from '../../shared/geo';

/**
 * Location Master — the authoritative list of work locations used by location-based
 * attendance. Each location carries map coordinates and a permitted punch radius; an
 * employee assigned to a location has their punches validated against it.
 */
export interface PayrollLocationMasterProps {
  locations: PayrollLocation[];
  onChangeLocations: (next: PayrollLocation[]) => void;
  employees: EmployeeSalaryMasterRecord[];
  onAssignEmployee: (userId: string, locationId: string) => void;
  setStatusBanner?: (message: string) => void;
}

const emptyDraft = (): PayrollLocation => ({
  id: '',
  name: '',
  type: 'Office HQ',
  address: '',
  lat: 0,
  lng: 0,
  radiusMeters: 100,
  active: true,
  notes: '',
});

export function PayrollLocationMaster({
  locations,
  onChangeLocations,
  employees,
  onAssignEmployee,
  setStatusBanner,
}: PayrollLocationMasterProps) {
  const [draft, setDraft] = useState<PayrollLocation | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };
  const startEdit = (loc: PayrollLocation) => {
    setEditingId(loc.id);
    setDraft({ ...loc });
  };
  const cancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setStatusBanner?.('Location name is required.');
      return;
    }
    if (!Number.isFinite(draft.lat) || !Number.isFinite(draft.lng) || (draft.lat === 0 && draft.lng === 0)) {
      setStatusBanner?.('Valid latitude and longitude are required for a location.');
      return;
    }
    const radius = Number.isFinite(draft.radiusMeters) && draft.radiusMeters > 0 ? draft.radiusMeters : 100;
    if (editingId) {
      onChangeLocations(locations.map((l) => (l.id === editingId ? { ...draft, radiusMeters: radius } : l)));
      setStatusBanner?.(`Location "${draft.name}" updated.`);
    } else {
      const id = `LOC-${Date.now().toString().slice(-6)}`;
      onChangeLocations([...locations, { ...draft, id, radiusMeters: radius }]);
      setStatusBanner?.(`Location "${draft.name}" added.`);
    }
    cancel();
  };

  const remove = (loc: PayrollLocation) => {
    const assignedCount = employees.filter((e) => e.locationId === loc.id).length;
    if (assignedCount > 0) {
      setStatusBanner?.(
        `Cannot delete "${loc.name}" — ${assignedCount} employee(s) are assigned to it. Reassign them first.`
      );
      return;
    }
    onChangeLocations(locations.filter((l) => l.id !== loc.id));
    setStatusBanner?.(`Location "${loc.name}" removed.`);
  };

  const employeesAt = (locationId: string) => employees.filter((e) => e.locationId === locationId);

  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><MapPin className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Location Master</h3>
              <p className="text-[11.5px] text-slate-500">
                Work locations, map coordinates and permitted punch radius. Attendance is validated against the employee's assigned location.
              </p>
            </div>
          </div>
          <button type="button" className="sh-btn sh-btn-primary" onClick={startAdd}>
            <Plus className="w-3.5 h-3.5" /> Add location
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="sh-table w-full">
            <thead>
              <tr>
                <th>Location</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Radius</th>
                <th>Assigned</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="sh-avatar" style={{ background: '#f26522', width: 32, height: 32, borderRadius: 8 }}>
                        <Navigation className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{loc.name}</div>
                        {loc.address && <div className="text-[11px] text-slate-500 truncate">{loc.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="sh-badge sh-badge-neutral">{loc.type}</span></td>
                  <td className="font-mono text-[11.5px]">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</td>
                  <td>{formatDistance(loc.radiusMeters)}</td>
                  <td>{employeesAt(loc.id).length}</td>
                  <td>
                    <span className={`sh-badge ${loc.active ? 'sh-badge-success' : 'sh-badge-neutral'}`}>
                      {loc.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="sh-btn"
                        onClick={() => setAssignFor(assignFor === loc.id ? null : loc.id)}
                        title="Assign employees"
                      >
                        <Users className="w-3.5 h-3.5" /> Assign
                      </button>
                      <button type="button" className="sh-btn" onClick={() => startEdit(loc)} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="sh-btn" onClick={() => remove(loc)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No locations yet. Add one to start validating attendance by location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign employees to a location */}
      {assignFor && (
        <div className="sh-card">
          <div className="sh-card-header">
            <h3 className="sh-card-title">
              Assign employees — {locations.find((l) => l.id === assignFor)?.name}
            </h3>
            <button type="button" className="sh-btn" onClick={() => setAssignFor(null)}>
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead>
                <tr><th>Employee</th><th>Code</th><th>Department</th><th>Current location</th><th className="text-right">Action</th></tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const here = e.locationId === assignFor;
                  return (
                    <tr key={e.userId}>
                      <td className="font-semibold text-slate-800">{e.name || e.userId}</td>
                      <td>{e.empCode}</td>
                      <td>{e.department || '—'}</td>
                      <td>{locations.find((l) => l.id === e.locationId)?.name || 'Default'}</td>
                      <td className="text-right">
                        {here ? (
                          <span className="sh-badge sh-badge-success"><Check className="w-3 h-3" /> Assigned</span>
                        ) : (
                          <button
                            type="button"
                            className="sh-btn sh-btn-soft"
                            onClick={() => {
                              onAssignEmployee(e.userId, assignFor);
                              setStatusBanner?.(`${e.name || e.userId} assigned to ${locations.find((l) => l.id === assignFor)?.name}.`);
                            }}
                          >
                            Assign here
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No enrolled payroll employees.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / edit form */}
      {draft && (
        <div className="sh-card">
          <div className="sh-card-header">
            <h3 className="sh-card-title">{editingId ? 'Edit location' : 'Add location'}</h3>
            <button type="button" className="sh-btn" onClick={cancel}><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Name</span>
              <input className="sh-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Noida Branch" />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Type</span>
              <select
                className="sh-input"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as PayrollLocationType })}
              >
                {PAYROLL_LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Radius (metres)</span>
              <input
                className="sh-input"
                type="number"
                min={10}
                value={draft.radiusMeters}
                onChange={(e) => setDraft({ ...draft, radiusMeters: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Latitude</span>
              <input className="sh-input" type="number" step="0.0000001" value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Longitude</span>
              <input className="sh-input" type="number" step="0.0000001" value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</span>
              <select className="sh-input" value={draft.active ? 'yes' : 'no'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'yes' })}>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Address</span>
              <input className="sh-input" value={draft.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Street, city, state" />
            </label>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
              <button type="button" className="sh-btn sh-btn-primary" onClick={save}>
                <Check className="w-3.5 h-3.5" /> {editingId ? 'Save changes' : 'Add location'}
              </button>
              <button type="button" className="sh-btn" onClick={cancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollLocationMaster;
