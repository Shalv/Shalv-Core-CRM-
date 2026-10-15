import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ProductMasterItem, ProductType } from '../../types';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  X,
  TrendingUp,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProductsMasterTabProps {
  searchQuery: string;
}

export const ProductsMasterTab: React.FC<ProductsMasterTabProps> = ({ searchQuery }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    formatCurrency,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'Service' as ProductType,
    category: 'Consulting',
    subcategory: 'ERP Core',
    description: '',
    uom: 'Mandays',
    hsnSac: '998313',
    gstRate: 18,
    costPrice: 50000,
    sellingPrice: 150000,
    discountDefault: 0,
    isActive: true,
  });

  const openAdd = () => {
    setEditingProdId(null);
    setForm({
      code: `SRV-${String(products.length + 1).padStart(2, '0')}`,
      name: '',
      type: 'Service',
      category: 'Implementation & Consulting',
      subcategory: 'ERP Core',
      description: '',
      uom: 'Mandays',
      hsnSac: '998313',
      gstRate: 18,
      costPrice: 50000,
      sellingPrice: 150000,
      discountDefault: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: ProductMasterItem) => {
    setEditingProdId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      type: p.type,
      category: p.category,
      subcategory: p.subcategory || '',
      description: p.description,
      uom: p.uom,
      hsnSac: p.hsnSac,
      gstRate: p.gstRate,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      discountDefault: p.discountDefault || 0,
      isActive: p.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProdId) {
      updateProduct(editingProdId, form);
    } else {
      addProduct(form);
    }
    setIsModalOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !q ||
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.hsnSac.includes(q) ||
      p.description.toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = products.filter((p) => p.isActive).length;
  const servicesCount = products.filter((p) => p.type === 'Service').length;
  const subsCount = products.filter((p) => p.type === 'Subscription').length;
  const totalCatalogVal = products.reduce((acc, p) => acc + (p.sellingPrice || 0), 0);
  const avgSellingPrice = products.length > 0 ? totalCatalogVal / products.length : 0;

  const getTypeBadgeStyle = (type: ProductType) => {
    switch (type) {
      case 'Service':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Subscription':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Product':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  // Margin calculation helper
  const calcMargin = (selling: number, cost: number) => {
    if (!selling || selling <= 0) return 0;
    return Math.round(((selling - cost) / selling) * 100);
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Catalog Items
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{products.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            ERP Services
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950">{servicesCount}</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              SAC 998313
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Subscriptions / SaaS
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-purple-950">{subsCount}</span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Recurring ARR
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Avg Selling Rate
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {formatCurrency(avgSellingPrice)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">Catalog Mean</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Products, Services & Subscriptions Master</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Types ({products.length})</option>
              <option value="Service">Services</option>
              <option value="Subscription">Subscriptions</option>
              <option value="Product">Products / Goods</option>
            </select>

            {canCreate('masters') && (
              <button
                type="button"
                onClick={openAdd}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item SKU / Code</th>
                <th className="py-3 px-4">Name & Description</th>
                <th className="py-3 px-4">Type & Category</th>
                <th className="py-3 px-4 font-mono">HSN / SAC</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price & Margin</th>
                <th className="py-3 px-4 text-right">GST %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No items found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {q || typeFilter !== 'ALL'
                        ? 'Try clearing the search query or type filter.'
                        : 'Create your first product or service in the master catalog.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = calcMargin(p.sellingPrice, p.costPrice);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{p.code}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                          {p.description}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg border font-semibold text-[10px] inline-block ${getTypeBadgeStyle(
                            p.type
                          )}`}
                        >
                          {p.type}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.category}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{p.hsnSac}</td>

                      <td className="py-3.5 px-4 text-slate-600">{p.uom}</td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-extrabold text-slate-900 block">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                        {margin > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            +{margin}% margin
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {p.gstRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => updateProduct(p.id, { isActive: !p.isActive })}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {p.isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canEdit('masters') && (
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete('masters') && (
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Delete Product"
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

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingProdId ? 'Edit Product / Service' : 'Add Product / Service'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure pricing, statutory HSN/SAC code, and GST slab.
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Product / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ERP Solution Implementation"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Service">Service</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Product">Product / Goods</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mandays, Nos, User/Mo"
                    value={form.uom}
                    onChange={(e) => setForm({ ...form, uom: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed deliverables or scope of work..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN / SAC *</label>
                  <input
                    type="text"
                    required
                    value={form.hsnSac}
                    onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Rate % *</label>
                  <select
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Profit preview badge */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Estimated Gross Profit Margin:{' '}
                  <strong className="text-indigo-800">
                    {calcMargin(form.sellingPrice, form.costPrice)}%
                  </strong>
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Unit Gross: {formatCurrency(form.sellingPrice - form.costPrice)}
                </span>
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
                  {editingProdId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
