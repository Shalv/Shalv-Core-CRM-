import { confirmSave } from '../../shared/confirm';
import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { StateMasterItem } from '../../types';
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Globe,
  Compass,
} from 'lucide-react';

interface StatesMasterTabProps {
  searchQuery: string;
}

export const StatesMasterTab: React.FC<StatesMasterTabProps> = ({ searchQuery }) => {
  const { states, addState, updateState, deleteState, canCreate, canEdit, canDelete } =
    useCrm();

  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    stateName: string;
    stateCode: string;
    country: string;
    zone: NonNullable<StateMasterItem['zone']>;
    isActive: boolean;
  }>({
    stateName: '',
    stateCode: '',
    country: 'India',
    zone: 'North',
    isActive: true,
  });

  const openAdd = () => {
    setEditingStateId(null);
    setForm({
      stateName: '',
      stateCode: '',
      country: 'India',
      zone: 'North',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (st: StateMasterItem) => {
    setEditingStateId(st.id);
    setForm({
      stateName: st.stateName,
      stateCode: st.stateCode,
      country: st.country || 'India',
      zone: st.zone || 'North',
      isActive: st.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    if (!confirmSave('record')) return;
    e.preventDefault();
    const formatted = {
      ...form,
      stateName: form.stateName.trim(),
      stateCode: form.stateCode.trim().padStart(2, '0'),
    };
    if (editingStateId) {
      updateState(editingStateId, formatted);
    } else {
      addState(formatted);
    }
    setIsModalOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredStates = states.filter((s) => {
    const matchesSearch =
      !q ||
      s.stateName.toLowerCase().includes(q) ||
      s.stateCode.includes(q) ||
      (s.zone || '').toLowerCase().includes(q);

    const matchesZone = zoneFilter === 'ALL' || s.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const activeCount = states.filter((s) => s.isActive !== false).length;
  const northCount = states.filter((s) => s.zone === 'North').length;
  const southCount = states.filter((s) => s.zone === 'South').length;
  const westCount = states.filter((s) => s.zone === 'West').length;

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total State Masters
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{states.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Northern Region
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950">{northCount}</span>
            <span className="text-[10px] font-mono text-slate-400">Delhi, HR, PB...</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Southern Region
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-950">{southCount}</span>
            <span className="text-[10px] font-mono text-slate-400">KA, TN, TS...</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Western Region
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-950">{westCount}</span>
            <span className="text-[10px] font-mono text-slate-400">MH, GJ, GA...</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>State Master & Statutory 2-Digit GST Codes</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Zones ({states.length})</option>
              <option value="North">North Zone</option>
              <option value="South">South Zone</option>
              <option value="West">West Zone</option>
              <option value="East">East Zone</option>
              <option value="Central">Central Zone</option>
              <option value="North-East">North-East Zone</option>
            </select>

            {canCreate('masters') && (
              <button
                type="button"
                onClick={openAdd}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add State Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* States Table */}
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">State / UT Name</th>
                <th className="py-3 px-4 font-mono">Statutory GST Code</th>
                <th className="py-3 px-4">Zone / Region</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No states found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {q || zoneFilter !== 'ALL'
                        ? 'Try clearing the search query or zone filter.'
                        : 'Add state master records for automated GST code resolution.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStates.map((st) => {
                  const isActive = st.isActive !== false;
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{st.stateName}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg text-xs">
                          {st.stateCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {st.zone || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{st.country || 'India'}</td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => updateState(st.id, { isActive: !isActive })}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canEdit('masters') && (
                            <button
                              type="button"
                              onClick={() => openEdit(st)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Edit State Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {states.length > 1 && canDelete('masters') && (
                            <button
                              type="button"
                              onClick={() => deleteState(st.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Delete State Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingStateId ? 'Edit State Entry' : 'Add State Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Auto-resolves GST state code for inter/intra-state tax routing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">State / UT Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telangana"
                  value={form.stateName}
                  onChange={(e) => setForm({ ...form, stateName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">2-Digit GST Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="36"
                    value={form.stateCode}
                    onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official GST numeric prefix</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone / Region</label>
                  <select
                    value={form.zone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        zone: e.target.value as NonNullable<StateMasterItem['zone']>,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                    <option value="Central">Central</option>
                    <option value="North-East">North-East</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Active Status</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingStateId ? 'Save Changes' : 'Add State'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
