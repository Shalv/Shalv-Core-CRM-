import React, { useMemo, useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  AdminPolicyMaster,
  EmployeeSalaryMasterRecord,
  PAYSLIP_MONTHS,
  calculateEmployeePolicyPayroll,
  loadAllEmployeeLoans,
  loadEmployeeAttendance,
  loadEmployeeClaims,
  loadEmployeeLeaves,
} from './payrollTypes';
import {
  PayrollReportContext,
  PayrollReportEmployee,
  PayrollReportFilters,
  REPORT_CATALOGUE,
  REPORT_CATEGORIES,
  ReportResult,
  buildPayrollReport,
  getReportDefinition,
} from './payrollReports';
import {
  FileBarChart2,
  Search,
  Download,
  Printer,
  Filter,
  Users2,
  Table2,
} from 'lucide-react';

interface PayrollReportsSectionProps {
  employeeSalaryMasters: Record<string, EmployeeSalaryMasterRecord>;
  adminPolicyMaster: AdminPolicyMaster;
  setStatusBanner?: (msg: string | null) => void;
}

const deriveFinancialYear = (monthKey: string): string => {
  const [yStr, mStr] = (monthKey || '2026-09').split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  return m >= 4 ? `FY ${y}-${String(y + 1).slice(2)}` : `FY ${y - 1}-${String(y).slice(2)}`;
};

export const PayrollReportsSection: React.FC<PayrollReportsSectionProps> = ({
  employeeSalaryMasters,
  adminPolicyMaster,
  setStatusBanner,
}) => {
  const { users, customers, formatCurrency } = useCrm();

  const todayIso = new Date().toISOString().split('T')[0];
  const defaultHandover = users[0]?.name || 'Reporting Manager';
  const defaultCustomer = customers[0]?.name || 'Enterprise Client Visit';

  const [reportId, setReportId] = useState<string>('processing-status');
  const [reportSearch, setReportSearch] = useState('');

  const [filters, setFilters] = useState<PayrollReportFilters>(() => ({
    monthKey: todayIso.slice(0, 7),
    financialYear: deriveFinancialYear(todayIso.slice(0, 7)),
    department: 'all',
    employeeId: 'all',
    employmentType: 'all',
    costCentre: 'all',
    project: 'all',
    status: 'all',
  }));

  const allLoans = useMemo(() => loadAllEmployeeLoans(), []);

  // Build the per-employee payroll dataset the report engine consumes.
  const employees = useMemo<PayrollReportEmployee[]>(() => {
    const list: PayrollReportEmployee[] = [];
    const monthKey = filters.monthKey;

    Object.values(employeeSalaryMasters).forEach((m, idx) => {
      if (!m || !m.userId) return;
      const crmUser = users.find(
        (u) => u.id === m.userId || (m.email && u.email?.toLowerCase() === m.email?.toLowerCase())
      );
      const name = m.name || crmUser?.name || 'Employee';
      const department = m.department || crmUser?.department || 'Sales';
      const designation = m.designation || crmUser?.designation || m.role || 'Employee';
      const role = m.role || crmUser?.role || 'Sales Executive';
      const location = m.location || crmUser?.location || 'New Delhi HQ';
      const attendance = loadEmployeeAttendance(m.userId, location, todayIso, idx);
      const leaves = loadEmployeeLeaves(m.userId, name, defaultHandover, idx);
      const claims = loadEmployeeClaims(m.userId, name, defaultCustomer, idx);
      const loans = allLoans.filter((l) => l.employeeId === m.userId);

      const breakdown = calculateEmployeePolicyPayroll({
        monthKey,
        master: m,
        policy: adminPolicyMaster,
        attendance,
        leaves,
        claims,
        loansOverride: loans,
      });

      const ytdBreakdowns = PAYSLIP_MONTHS.map((pm) =>
        calculateEmployeePolicyPayroll({
          monthKey: pm.key,
          master: m,
          policy: adminPolicyMaster,
          attendance,
          leaves,
          claims,
          loansOverride: loans,
        })
      );

      list.push({
        id: m.userId,
        name,
        email: m.email || crmUser?.email || '',
        role,
        department,
        designation,
        location,
        reportingManager: m.reportingManager || crmUser?.reportingManager || '—',
        assignedTerritory: m.assignedTerritory || crmUser?.assignedTerritory || '',
        status: m.status || crmUser?.status || 'Active',
        employmentType: m.accessType === 'payroll_only' ? 'Payroll Only' : 'Permanent',
        master: m,
        attendance,
        leaves,
        claims,
        loans,
        breakdown,
        ytdBreakdowns,
      });
    });

    return list;
  }, [
    employeeSalaryMasters,
    users,
    allLoans,
    adminPolicyMaster,
    filters.monthKey,
    todayIso,
    defaultHandover,
    defaultCustomer,
  ]);

  const ctx = useMemo<PayrollReportContext>(
    () => ({
      monthKey: filters.monthKey,
      monthLabel: PAYSLIP_MONTHS.find((p) => p.key === filters.monthKey)?.label || filters.monthKey,
      financialYear: filters.financialYear,
      employees,
      policy: adminPolicyMaster,
    }),
    [filters.monthKey, filters.financialYear, employees, adminPolicyMaster]
  );

  const result = useMemo<ReportResult>(
    () => buildPayrollReport(ctx, reportId, filters),
    [ctx, reportId, filters]
  );

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );
  const projects = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => (e.assignedTerritory || '').trim()).filter(Boolean))
      ).sort(),
    [employees]
  );

  const filteredCatalogue = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return REPORT_CATALOGUE;
    return REPORT_CATALOGUE.filter(
      (r) => r.name.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q) || String(r.no).includes(q)
    );
  }, [reportSearch]);

  const setFilter = (patch: Partial<PayrollReportFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const formatCell = (value: string | number, type?: string): string => {
    if (type === 'currency') return formatCurrency(Number(value) || 0);
    if (type === 'number') return String(value);
    if (type === 'pct') return String(value);
    return String(value);
  };

  const handleExportCsv = () => {
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = result.columns.map((col) => esc(col.label)).join(',');
    const body = result.rows.map((row) => row.map(esc).join(','));
    const meta = [
      esc(`ENACT360 Payroll Report`),
      esc(`Report: No.${result.definition.no} - ${result.definition.name}`),
      esc(`Period: ${ctx.monthLabel} (${ctx.financialYear})`),
      '',
    ];
    const csv = [...meta, header, ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Report_${String(result.definition.no).padStart(2, '0')}_${result.definition.id}_${ctx.monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner?.(`Exported "${result.definition.name}" (${result.rows.length} rows).`);
  };

  const activeDef = getReportDefinition(reportId);

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <FileBarChart2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Payroll Reports Catalogue</h3>
            <p className="text-xs text-slate-500 font-medium">
              {REPORT_CATALOGUE.length} standard reports · generated from live payroll data
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Catalogue sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col lg:max-h-[720px]">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search reports…"
                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {REPORT_CATEGORIES.map((cat) => {
              const items = filteredCatalogue.filter((r) => r.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0">
                    {cat}
                  </div>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReportId(r.id)}
                      className={`w-full text-left px-3 py-2 border-b border-slate-50 transition ${
                        reportId === r.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-[10px] font-mono mt-0.5 px-1.5 py-0.5 rounded ${
                            reportId === r.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {String(r.no).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold leading-tight">{r.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Report canvas */}
        <div className="space-y-4 min-w-0">
          {activeDef && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span>No. {String(activeDef.no).padStart(2, '0')}</span>
                <span>·</span>
                <span>{activeDef.category}</span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{activeDef.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{activeDef.purpose}</p>

              {/* Filter bar */}
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                <Filter size={14} /> Common Filters
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Payroll Month</span>
                  <select
                    value={filters.monthKey}
                    onChange={(e) =>
                      setFilter({ monthKey: e.target.value, financialYear: deriveFinancialYear(e.target.value) })
                    }
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    {PAYSLIP_MONTHS.map((pm) => (
                      <option key={pm.key} value={pm.key}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Financial Year</span>
                  <input
                    value={filters.financialYear}
                    onChange={(e) => setFilter({ financialYear: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Department</span>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilter({ department: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Employee</span>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => setFilter({ employeeId: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.master.empCode})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Employment / Status</span>
                  <select
                    value={filters.employmentType}
                    onChange={(e) => setFilter({ employmentType: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="all">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Exit</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Payroll Only">Payroll Only</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Cost Centre</span>
                  <select
                    value={filters.costCentre}
                    onChange={(e) => setFilter({ costCentre: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="all">All Cost Centres</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Project / Territory</span>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilter({ project: e.target.value })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      setFilter({
                        department: 'all',
                        employeeId: 'all',
                        employmentType: 'all',
                        costCentre: 'all',
                        project: 'all',
                        status: 'all',
                      })
                    }
                    className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1.5"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.summary.map((tile) => (
              <div key={tile.label} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {tile.label}
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {/^-?[\d,]+$/.test(tile.value) ? formatCurrency(Number(tile.value.replace(/,/g, '')) || 0) : tile.value}
                </div>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Table2 size={15} />
                {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
                <span className="text-slate-300">·</span>
                <Users2 size={14} />
                {employees.length} employees in scope
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-700"
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>

            {result.columns.length === 0 || result.rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400 font-medium">
                No data for this report with the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {result.columns.map((col) => (
                        <th
                          key={col.label}
                          className={`px-3 py-2 font-bold text-slate-500 border-b border-slate-200 whitespace-nowrap ${
                            col.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`px-3 py-1.5 whitespace-nowrap text-slate-700 border-b border-slate-50 ${
                              result.columns[j]?.align === 'right'
                                ? 'text-right font-mono'
                                : 'text-left'
                            }`}
                          >
                            {formatCell(cell, result.columns[j]?.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.note && (
              <div className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100 bg-slate-50/50">
                {result.note}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
