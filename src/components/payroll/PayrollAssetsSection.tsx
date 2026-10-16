import React, { useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Undo2,
  Boxes,
  ClipboardCheck,
  Wrench,
  Search,
} from 'lucide-react';
import {
  Asset,
  AssetCategory,
  AssetAllocation,
  AssetStatus,
  ASSET_STATUSES,
  currentHolder,
} from './payrollTypes';

/**
 * Assets — categories, an asset register, allocation to employees with acknowledgement
 * and return, and issue reporting against an allocation.
 *
 * `mode="admin"`    — manage the register, allocate, accept returns, resolve issues.
 * `mode="employee"` — see your assets, acknowledge receipt and report an issue.
 */
export interface PayrollAssetsSectionProps {
  mode: 'admin' | 'employee';
  currentUserId: string;
  currentUserName: string;
  employees: { userId: string; name?: string; empCode?: string; department?: string }[];
  categories: AssetCategory[];
  onChangeCategories: (next: AssetCategory[]) => void;
  assets: Asset[];
  onChangeAssets: (next: Asset[]) => void;
  allocations: AssetAllocation[];
  onChangeAllocations: (next: AssetAllocation[]) => void;
  setStatusBanner?: (message: string) => void;
}

const statusChip: Record<AssetStatus, string> = {
  Available: 'sh-badge sh-badge-success',
  Allocated: 'sh-badge sh-badge-info',
  'Under Repair': 'sh-badge sh-badge-warning',
  Retired: 'sh-badge sh-badge-neutral',
  Lost: 'sh-badge sh-badge-danger',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function PayrollAssetsSection({
  mode,
  currentUserId,
  currentUserName,
  employees,
  categories,
  onChangeCategories,
  assets,
  onChangeAssets,
  allocations,
  onChangeAllocations,
  setStatusBanner,
}: PayrollAssetsSectionProps) {
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [cost, setCost] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [allocAsset, setAllocAsset] = useState('');
  const [allocEmployee, setAllocEmployee] = useState('');
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('');
  const [issueFor, setIssueFor] = useState<string | null>(null);
  const [issueText, setIssueText] = useState('');
  const [resolveFor, setResolveFor] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AssetStatus>('All');

  const empName = (id: string) => employees.find((e) => e.userId === id)?.name || id;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name || '—';

  const myAllocations = useMemo(
    () => allocations.filter((a) => a.employeeId === currentUserId && !a.returnedAt),
    [allocations, currentUserId]
  );

  const visibleAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets
      .filter((a) => (statusFilter === 'All' ? true : a.status === statusFilter))
      .filter((a) =>
        q
          ? a.id.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            catName(a.categoryId).toLowerCase().includes(q) ||
            (a.serialNo || '').toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [assets, query, statusFilter, categories]);

  const openIssues = allocations.filter((a) => a.issue && !a.issue.resolvedAt);
  const availableCount = assets.filter((a) => a.status === 'Available').length;

  const addAsset = () => {
    if (!tag.trim() || !name.trim()) {
      setStatusBanner?.('Asset tag and name are required.');
      return;
    }
    if (assets.some((a) => a.id.toLowerCase() === tag.trim().toLowerCase())) {
      setStatusBanner?.(`Asset tag "${tag}" already exists.`);
      return;
    }
    const asset: Asset = {
      id: tag.trim(),
      name: name.trim(),
      categoryId: categoryId || categories[0]?.id || '',
      serialNo: serialNo.trim() || undefined,
      purchaseDate: todayIso(),
      cost: cost ? Number(cost) : undefined,
      status: 'Available',
    };
    onChangeAssets([...assets, asset]);
    setStatusBanner?.(`Asset ${asset.id} added to the register.`);
    setShowAssetForm(false);
    setTag(''); setName(''); setSerialNo(''); setCost('');
  };

  const removeAsset = (asset: Asset) => {
    const holder = currentHolder(allocations, asset.id);
    if (holder) {
      setStatusBanner?.(`Cannot delete ${asset.id} — it is allocated to ${holder.employeeName || holder.employeeId}.`);
      return;
    }
    onChangeAssets(assets.filter((a) => a.id !== asset.id));
    setStatusBanner?.(`Asset ${asset.id} removed.`);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    const cat: AssetCategory = { id: `CAT-${Date.now().toString().slice(-5)}`, name: newCategory.trim() };
    onChangeCategories([...categories, cat]);
    setStatusBanner?.(`Category "${cat.name}" added.`);
    setNewCategory('');
    setShowCategoryForm(false);
  };

  const allocate = () => {
    if (!allocAsset || !allocEmployee) {
      setStatusBanner?.('Choose an available asset and an employee.');
      return;
    }
    const asset = assets.find((a) => a.id === allocAsset);
    if (!asset || asset.status === 'Allocated') {
      setStatusBanner?.('That asset is not available for allocation.');
      return;
    }
    const at = new Date().toISOString();
    onChangeAllocations([
      {
        id: `ALC-${Date.now().toString().slice(-6)}`,
        assetId: allocAsset,
        employeeId: allocEmployee,
        employeeName: empName(allocEmployee),
        allocatedAt: at,
        allocatedBy: currentUserName,
      },
      ...allocations,
    ]);
    onChangeAssets(assets.map((a) => (a.id === allocAsset ? { ...a, status: 'Allocated' as AssetStatus } : a)));
    setStatusBanner?.(`${allocAsset} allocated to ${empName(allocEmployee)} — awaiting acknowledgement.`);
    setAllocAsset('');
    setAllocEmployee('');
  };

  const acceptReturn = (allocationId: string) => {
    const alloc = allocations.find((a) => a.id === allocationId);
    if (!alloc) return;
    const at = new Date().toISOString();
    onChangeAllocations(
      allocations.map((a) =>
        a.id === allocationId ? { ...a, returnedAt: at, returnCondition: returnCondition.trim() || undefined } : a
      )
    );
    onChangeAssets(assets.map((a) => (a.id === alloc.assetId ? { ...a, status: 'Available' as AssetStatus } : a)));
    setStatusBanner?.(`${alloc.assetId} returned to the pool.`);
    setReturnFor(null);
    setReturnCondition('');
  };

  const acknowledge = (allocationId: string) => {
    const at = new Date().toISOString();
    onChangeAllocations(allocations.map((a) => (a.id === allocationId ? { ...a, acknowledgedAt: at } : a)));
    setStatusBanner?.('Asset receipt acknowledged.');
  };

  const reportIssue = (allocationId: string) => {
    if (!issueText.trim()) {
      setStatusBanner?.('Describe the issue before reporting it.');
      return;
    }
    const at = new Date().toISOString();
    onChangeAllocations(
      allocations.map((a) =>
        a.id === allocationId
          ? { ...a, issue: { reportedAt: at, reportedBy: currentUserName, description: issueText.trim() } }
          : a
      )
    );
    const alloc = allocations.find((a) => a.id === allocationId);
    if (alloc) {
      onChangeAssets(assets.map((x) => (x.id === alloc.assetId ? { ...x, status: 'Under Repair' as AssetStatus } : x)));
    }
    setStatusBanner?.('Issue reported — the asset is marked under repair.');
    setIssueFor(null);
    setIssueText('');
  };

  const resolveIssue = (allocationId: string) => {
    const at = new Date().toISOString();
    const alloc = allocations.find((a) => a.id === allocationId);
    onChangeAllocations(
      allocations.map((a) =>
        a.id === allocationId && a.issue
          ? { ...a, issue: { ...a.issue, resolvedAt: at, resolution: resolution.trim() || 'Resolved' } }
          : a
      )
    );
    if (alloc) {
      onChangeAssets(assets.map((x) => (x.id === alloc.assetId ? { ...x, status: 'Allocated' as AssetStatus } : x)));
    }
    setStatusBanner?.('Issue resolved.');
    setResolveFor(null);
    setResolution('');
  };

  /* ------------------------------------------------------------- employee ---- */
  if (mode === 'employee') {
    return (
      <div className="space-y-4">
        <div className="sh-card">
          <div className="sh-card-header">
            <div className="flex items-center gap-2.5">
              <span className="icon-depth w-9 h-9"><Package className="w-4.5 h-4.5" /></span>
              <div>
                <h3 className="sh-card-title">My assets</h3>
                <p className="text-[11.5px] text-slate-500">
                  Company assets issued to you. Acknowledge receipt and report any issue.
                </p>
              </div>
            </div>
            <span className="sh-badge sh-badge-neutral">{myAllocations.length} held</span>
          </div>
          <div className="overflow-x-auto">
            <table className="sh-table w-full">
              <thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th>Issued</th><th>Acknowledged</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {myAllocations.map((a) => {
                  const asset = assets.find((x) => x.id === a.assetId);
                  return (
                    <React.Fragment key={a.id}>
                      <tr>
                        <td className="font-semibold text-slate-800">{asset?.name || a.assetId}<div className="text-[11px] text-slate-500">{a.assetId}</div></td>
                        <td>{asset ? catName(asset.categoryId) : '—'}</td>
                        <td>{asset?.serialNo || '—'}</td>
                        <td>{new Date(a.allocatedAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          {a.acknowledgedAt
                            ? <span className="sh-badge sh-badge-success"><Check className="w-3 h-3" /> Yes</span>
                            : <span className="sh-badge sh-badge-warning">Pending</span>}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!a.acknowledgedAt && (
                              <button type="button" className="sh-btn sh-btn-primary" onClick={() => acknowledge(a.id)}>
                                <ClipboardCheck className="w-3.5 h-3.5" /> Acknowledge
                              </button>
                            )}
                            <button type="button" className="sh-btn" onClick={() => setIssueFor(issueFor === a.id ? null : a.id)}>
                              <Wrench className="w-3.5 h-3.5" /> Report issue
                            </button>
                          </div>
                        </td>
                      </tr>
                      {a.issue && (
                        <tr><td colSpan={6} className="bg-slate-50 text-[12px]">
                          <b>Issue:</b> {a.issue.description}
                          {a.issue.resolvedAt ? ` — resolved: ${a.issue.resolution}` : ' — open'}
                        </td></tr>
                      )}
                      {issueFor === a.id && (
                        <tr><td colSpan={6} className="bg-slate-50">
                          <div className="flex flex-wrap items-center gap-2 py-1">
                            <input className="sh-input flex-1 min-w-[240px]" placeholder="Describe the problem" value={issueText} onChange={(e) => setIssueText(e.target.value)} />
                            <button type="button" className="sh-btn sh-btn-primary" onClick={() => reportIssue(a.id)}><Check className="w-3.5 h-3.5" /> Submit</button>
                            <button type="button" className="sh-btn" onClick={() => { setIssueFor(null); setIssueText(''); }}>Cancel</button>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {myAllocations.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">No assets are currently issued to you.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- admin ---- */
  return (
    <div className="space-y-4">
      <div className="sh-card">
        <div className="sh-card-header">
          <div className="flex items-center gap-2.5">
            <span className="icon-depth w-9 h-9"><Boxes className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="sh-card-title">Asset register</h3>
              <p className="text-[11.5px] text-slate-500">
                Categories, assets, allocation with acknowledgement and return, and issue resolution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="sh-badge sh-badge-success">{availableCount} available</span>
            {openIssues.length > 0 && <span className="sh-badge sh-badge-danger"><AlertTriangle className="w-3 h-3" /> {openIssues.length} open issue(s)</span>}
            <button type="button" className="sh-btn" onClick={() => setShowCategoryForm((s) => !s)}><Plus className="w-3.5 h-3.5" /> Category</button>
            <button type="button" className="sh-btn sh-btn-primary" onClick={() => setShowAssetForm((s) => !s)}><Plus className="w-3.5 h-3.5" /> Add asset</button>
          </div>
        </div>

        {showCategoryForm && (
          <div className="sh-card-body flex flex-wrap items-center gap-2 border-b border-slate-100">
            <input className="sh-input max-w-[240px]" placeholder="New category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button type="button" className="sh-btn sh-btn-primary" onClick={addCategory}><Check className="w-3.5 h-3.5" /> Add</button>
            <span className="text-[11.5px] text-slate-500">Existing: {categories.map((c) => c.name).join(', ')}</span>
          </div>
        )}

        {showAssetForm && (
          <div className="sh-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-slate-100">
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Asset tag</span>
              <input className="sh-input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. AST-0001" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Name</span>
              <input className="sh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dell Latitude 5440" /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</span>
              <select className="sh-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Serial no.</span>
              <input className="sh-input" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} /></label>
            <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Cost</span>
              <input type="number" className="sh-input" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
            <div className="flex items-end gap-2">
              <button type="button" className="sh-btn sh-btn-primary" onClick={addAsset}><Check className="w-3.5 h-3.5" /> Add to register</button>
              <button type="button" className="sh-btn" onClick={() => setShowAssetForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="sh-card-body grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100">
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Allocate asset</span>
            <select className="sh-input" value={allocAsset} onChange={(e) => setAllocAsset(e.target.value)}>
              <option value="">Available asset…</option>
              {assets.filter((a) => a.status === 'Available').map((a) => <option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}
            </select></label>
          <label className="block"><span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">To employee</span>
            <select className="sh-input" value={allocEmployee} onChange={(e) => setAllocEmployee(e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.userId} value={e.userId}>{e.name || e.userId}</option>)}
            </select></label>
          <div className="flex items-end">
            <button type="button" className="sh-btn sh-btn-primary" onClick={allocate}><Check className="w-3.5 h-3.5" /> Allocate</button>
          </div>
        </div>

        <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="sh-input pl-9" placeholder="Search assets…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="sh-input max-w-[170px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | AssetStatus)}>
            {['All', ...ASSET_STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="sh-table w-full">
            <thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th>Status</th><th>Held by</th><th>Ack.</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {visibleAssets.map((a) => {
                const holder = currentHolder(allocations, a.id);
                return (
                  <React.Fragment key={a.id}>
                    <tr>
                      <td><div className="font-semibold text-slate-800">{a.name}</div><div className="text-[11px] text-slate-500">{a.id}</div></td>
                      <td>{catName(a.categoryId)}</td>
                      <td>{a.serialNo || '—'}</td>
                      <td><span className={statusChip[a.status]}>{a.status}</span></td>
                      <td>{holder ? (holder.employeeName || empName(holder.employeeId)) : '—'}</td>
                      <td>{holder?.acknowledgedAt ? <span className="sh-badge sh-badge-success">Yes</span> : holder ? <span className="sh-badge sh-badge-warning">Pending</span> : '—'}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {holder && (
                            <button type="button" className="sh-btn" onClick={() => setReturnFor(returnFor === holder.id ? null : holder.id)}>
                              <Undo2 className="w-3.5 h-3.5" /> Return
                            </button>
                          )}
                          <button type="button" className="sh-btn" onClick={() => removeAsset(a)}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                    {holder && returnFor === holder.id && (
                      <tr><td colSpan={7} className="bg-slate-50">
                        <div className="flex flex-wrap items-center gap-2 py-1">
                          <input className="sh-input flex-1 min-w-[240px]" placeholder="Return condition (e.g. good, minor wear)" value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} />
                          <button type="button" className="sh-btn sh-btn-primary" onClick={() => acceptReturn(holder.id)}><Check className="w-3.5 h-3.5" /> Accept return</button>
                          <button type="button" className="sh-btn" onClick={() => { setReturnFor(null); setReturnCondition(''); }}>Cancel</button>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
              {visibleAssets.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No assets match. Add one to the register.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* open issues */}
      <div className="sh-card">
        <div className="sh-card-header">
          <h3 className="sh-card-title">Asset issues</h3>
          <span className="sh-badge sh-badge-danger"><Wrench className="w-3 h-3" /> {openIssues.length} open</span>
        </div>
        <div className="overflow-x-auto">
          <table className="sh-table w-full">
            <thead><tr><th>Asset</th><th>Reported by</th><th>Reported</th><th>Issue</th><th>Status</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {allocations.filter((a) => a.issue).map((a) => (
                <React.Fragment key={`issue-${a.id}`}>
                  <tr>
                    <td className="font-semibold text-slate-800">{a.assetId}</td>
                    <td>{a.employeeName || empName(a.employeeId)}</td>
                    <td>{a.issue ? new Date(a.issue.reportedAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="max-w-[280px] truncate">{a.issue?.description}</td>
                    <td>
                      {a.issue?.resolvedAt
                        ? <span className="sh-badge sh-badge-success">Resolved</span>
                        : <span className="sh-badge sh-badge-warning">Open</span>}
                    </td>
                    <td className="text-right">
                      {a.issue && !a.issue.resolvedAt && (
                        <button type="button" className="sh-btn sh-btn-soft" onClick={() => setResolveFor(resolveFor === a.id ? null : a.id)}>
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                  {resolveFor === a.id && (
                    <tr><td colSpan={6} className="bg-slate-50">
                      <div className="flex flex-wrap items-center gap-2 py-1">
                        <input className="sh-input flex-1 min-w-[240px]" placeholder="Resolution notes" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                        <button type="button" className="sh-btn sh-btn-primary" onClick={() => resolveIssue(a.id)}><Check className="w-3.5 h-3.5" /> Mark resolved</button>
                        <button type="button" className="sh-btn" onClick={() => { setResolveFor(null); setResolution(''); }}>Cancel</button>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
              {allocations.filter((a) => a.issue).length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No asset issues reported.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayrollAssetsSection;
