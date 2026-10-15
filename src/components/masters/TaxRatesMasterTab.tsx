import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { TaxRateMasterItem } from '../../types';
import {
  Percent,
  Plus,
  Edit3,
  Trash2,
  X,
  Split,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

interface TaxRatesMasterTabProps {
  searchQuery: string;
}

export const TaxRatesMasterTab: React.FC<TaxRatesMasterTabProps> = ({ searchQuery }) => {
  const {
    taxRates,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    code: string;
    gstRate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    defaultHsnSac: string;
    applicableTo: 'Service' | 'Product' | 'Both';
    description: string;
    isActive: boolean;
  }>({
    name: 'Standard GST 18%',
    code: 'GST-18',
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    defaultHsnSac: '998313',
    applicableTo: 'Both',
    description: 'Standard Goods & Services Tax rate for ERP & IT implementation services',
    isActive: true,
  });

  const openAdd = () => {
    setEditingTaxId(null);
    setForm({
      name: 'GST 18%',
      code: `GST-${taxRates.length + 1}`,
      gstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      defaultHsnSac: '998313',
      applicableTo: 'Both',
      description: 'Standard IT services tax slab',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (t: TaxRateMasterItem) => {
    setEditingTaxId(t.id);
    setForm({
      name: t.name,
      code: t.code,
      gstRate: t.gstRate,
      cgstRate: t.cgstRate,
      sgstRate: t.sgstRate,
      igstRate: t.igstRate,
      defaultHsnSac: t.defaultHsnSac || '',
      applicableTo: t.applicableTo || 'Both',
      description: t.description || '',
      isActive: t.isActive,
    });
    setIsModalOpen(true);
  };

  const handleRateChange = (newRate: number) => {
    const half = newRate / 2;
    setForm((prev) => ({
      ...prev,
      gstRate: newRate,
      cgstRate: half,
      sgstRate: half,
      igstRate: newRate,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTaxId) {
      updateTaxRate(editingTaxId, form);
    } else {
      addTaxRate(form);
    }
    setIsModalOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredTaxRates = taxRates.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      String(t.gstRate).includes(q) ||
      (t.description || '').toLowerCase().includes(q)
  );

  const activeCount = taxRates.filter((t) => t.isActive).length;

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Tax Slabs
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{taxRates.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Standard Slab
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950 font-mono">18% GST</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              9% CGST + 9% SGST
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Interstate Routing
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-950">IGST</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Auto Place of Supply
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Exempt / Zero Rated
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-teal-950 font-mono">0% GST</span>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Exports & SEZ
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-600" />
              <span>Tax Rates & GST Statutory Slabs Master</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreate('masters') && (
              <button
                type="button"
                onClick={openAdd}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tax Slab</span>
              </button>
            )}
          </div>
        </div>

        {/* Tax Rates Table */}
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-mono">Tax Code</th>
                <th className="py-3 px-4">Tax Slab Name & Scope</th>
                <th className="py-3 px-4 text-center font-mono">Total GST %</th>
                <th className="py-3 px-4 text-center">Intra-State Split</th>
                <th className="py-3 px-4 text-center">Inter-State (IGST)</th>
                <th className="py-3 px-4 font-mono">Default HSN/SAC</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTaxRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Percent className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No tax slabs found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {q ? 'No records match your query.' : 'Configure your standard GST tax slabs.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTaxRates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{t.code}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{t.name}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                        {t.description || 'Statutory GST Slab'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-xs">
                        {t.gstRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px]">
                        CGST {t.cgstRate}% + SGST {t.sgstRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg text-[11px]">
                        IGST {t.igstRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {t.defaultHsnSac || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => updateTaxRate(t.id, { isActive: !t.isActive })}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {t.isActive ? '● Active' : '○ Inactive'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canEdit('masters') && (
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Edit Tax Slab"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete('masters') && (
                          <button
                            type="button"
                            onClick={() => deleteTaxRate(t.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Delete Tax Slab"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingTaxId ? 'Edit Tax Slab' : 'Add Tax Slab'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure total GST and intra/inter-state tax allocations.
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default HSN / SAC</label>
                  <input
                    type="text"
                    value={form.defaultHsnSac}
                    onChange={(e) => setForm({ ...form, defaultHsnSac: e.target.value })}
                    placeholder="998313"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Slab Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard GST 18%"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Rate configuration with auto-split */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Total GST Rate % *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={form.gstRate}
                      onChange={(e) => handleRateChange(Number(e.target.value))}
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-extrabold text-indigo-700"
                    />
                    <div className="flex gap-1.5">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleRateChange(rate)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                            form.gstRate === rate
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auto split breakdown */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-bold text-emerald-900 block text-[11px]">
                      Intra-State Supply (Same State)
                    </span>
                    <div className="mt-1 flex items-center justify-between font-mono text-emerald-800 font-bold">
                      <span>CGST: {form.cgstRate}%</span>
                      <span>+</span>
                      <span>SGST: {form.sgstRate}%</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5">
                    <span className="font-bold text-indigo-900 block text-[11px]">
                      Inter-State Supply (Different State)
                    </span>
                    <div className="mt-1 font-mono text-indigo-800 font-bold text-center">
                      IGST: {form.igstRate}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Statutory explanation or scope of applicability..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
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
                  {editingTaxId ? 'Save Changes' : 'Create Slab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
