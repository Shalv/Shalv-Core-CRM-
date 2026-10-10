import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { PaymentTermItem } from '../../types';
import {
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  X,
  Clock,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';

interface PaymentTermsMasterTabProps {
  searchQuery: string;
}

export const PaymentTermsMasterTab: React.FC<PaymentTermsMasterTabProps> = ({
  searchQuery,
}) => {
  const {
    paymentTerms,
    addPaymentTerm,
    updatePaymentTerm,
    deletePaymentTerm,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    code: string;
    name: string;
    creditDays: number;
    description: string;
    defaultMilestones: string;
    isActive: boolean;
  }>({
    code: 'NET-30',
    name: 'Net 30 Days',
    creditDays: 30,
    description: 'Payment due 30 days after invoice issuance',
    defaultMilestones: '30-40-30',
    isActive: true,
  });

  const openAdd = () => {
    setEditingTermId(null);
    setForm({
      code: `TERM-${paymentTerms.length + 1}`,
      name: 'Custom Payment Term',
      creditDays: 15,
      description: 'Payment due in 15 days',
      defaultMilestones: '50-50',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (pt: PaymentTermItem) => {
    setEditingTermId(pt.id);
    setForm({
      code: pt.code,
      name: pt.name,
      creditDays: pt.creditDays,
      description: pt.description,
      defaultMilestones: pt.defaultMilestones || '100',
      isActive: pt.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTermId) {
      updatePaymentTerm(editingTermId, form);
    } else {
      addPaymentTerm(form);
    }
    setIsModalOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredTerms = paymentTerms.filter(
    (pt) =>
      !q ||
      pt.name.toLowerCase().includes(q) ||
      pt.code.toLowerCase().includes(q) ||
      pt.description.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Payment Terms
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{paymentTerms.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Commercial Slabs
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Advance Milestone
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950 font-mono">100% Adv</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Immediate Due
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Standard Enterprise
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-950 font-mono">Net 30</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              30 Days Credit
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Extended Credit
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-teal-950 font-mono">Net 60</span>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Government / MNC
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Commercial Payment Terms & Milestone Credit Windows</span>
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
                <span>Add Payment Term</span>
              </button>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="p-4 sm:p-5">
          {filteredTerms.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">No payment terms found</p>
              <p className="text-xs text-slate-400 mt-1">
                {q ? 'No records match your query.' : 'Configure your standard commercial payment terms.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTerms.map((pt) => (
                <div
                  key={pt.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition bg-slate-50/40 flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{pt.name}</span>
                        <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                          {pt.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEdit('masters') && (
                          <button
                            type="button"
                            onClick={() => openEdit(pt)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Edit Payment Term"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {paymentTerms.length > 1 && canDelete('masters') && (
                          <button
                            type="button"
                            onClick={() => deletePaymentTerm(pt.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Delete Payment Term"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{pt.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg">
                      {pt.creditDays === 0 ? 'Immediate Due' : `${pt.creditDays} Days Credit`}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Split: {pt.defaultMilestones || '100'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Term Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingTermId ? 'Edit Payment Term' : 'Add Payment Term'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure credit days and default milestone percentage.
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
                  <label className="font-bold text-slate-700 block mb-1">Term Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Window (Days) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.creditDays}
                    onChange={(e) => setForm({ ...form, creditDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Term Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Net 30 Days"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Default Milestone Split (%)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30-40-30 or 50-50 or 100"
                  value={form.defaultMilestones}
                  onChange={(e) => setForm({ ...form, defaultMilestones: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used as automated milestone percentage template on Sales Orders.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Commercial terms explanation..."
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
                  {editingTermId ? 'Save Changes' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
