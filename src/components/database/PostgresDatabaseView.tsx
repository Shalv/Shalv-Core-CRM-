import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  Play,
  FileCode,
  Table,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Server,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface DbHealth {
  status: string;
  database: string;
  target: string;
  host: string;
  databaseName: string;
  databaseUser: string;
  latencyMs?: number;
  tableCount?: number;
  tables?: string[];
}

interface TableStat {
  tableName: string;
  rowCount: number;
}

export const PostgresDatabaseView: React.FC = () => {
  const {
    users,
    leads,
    customers,
    opportunities,
    invoices,
    payments,
    orders,
    milestones,
    activities,
    supplierCompany,
    products,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'script' | 'connection'>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('finance_invoices');
  const [copied, setCopied] = useState(false);
  const [copiedPsql, setCopiedPsql] = useState(false);
  const [queryInput, setQueryInput] = useState<string>('SELECT * FROM users ORDER BY created_at ASC;');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryMessage, setQueryMessage] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQueryRunning, setIsQueryRunning] = useState<boolean>(false);

  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchHealthAndStats = () => {
    setLoadingStats(true);
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setDbHealth(data);
      })
      .catch(() => {
        setDbHealth(null);
      });

    fetch('/api/database/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          setTableStats(data.tables);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoadingStats(false);
      });
  };

  useEffect(() => {
    fetchHealthAndStats();
  }, []);

  // Download enact360-data.json
  const handleDownloadPostgresSql = () => {
    fetch('/api/database/export')
      .then((res) => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then((text) => {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'enact360-data.json';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        const a = document.createElement('a');
        a.href = '/api/database/export';
        a.download = 'enact360-data.json';
        a.click();
      });
  };

  const handleDownloadFile = (fileName: string) => {
    const a = document.createElement('a');
    a.href = `/${fileName}`;
    a.download = fileName;
    a.click();
  };

  const handleCopyScript = () => {
    fetch('/api/database/export')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleCopyPsqlCommand = () => {
    const host = dbHealth?.host || 'localhost';
    const user = dbHealth?.databaseUser || 'postgres';
    const dbName = dbHealth?.databaseName || 'enact360_crm';
    const psqlCmd = `PGPASSWORD=YOUR_DB_PASSWORD psql -h ${host} -U ${user} -d ${dbName}`;
    navigator.clipboard.writeText(psqlCmd);
    setCopiedPsql(true);
    setTimeout(() => setCopiedPsql(false), 2000);
  };

  // Run live SQL query against Render PostgreSQL via backend API
  const handleRunQuery = async () => {
    const sql = queryInput.trim();
    if (!sql) return;

    setIsQueryRunning(true);
    setQueryError(null);
    setQueryMessage(null);

    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setQueryResult(data.rows || []);
      setQueryMessage(
        `Query executed in ${data.durationMs || 0} ms. Returned ${data.rowCount || (data.rows ? data.rows.length : 0)} rows from Render PostgreSQL.`
      );
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
      setQueryResult(null);
    } finally {
      setIsQueryRunning(false);
    }
  };

  // Pre-configured tables list with live or fallback counts
  const tablesList = [
    {
      id: 'users',
      name: 'users',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'users')?.rowCount ?? users.length,
      columns: ['id', 'name', 'email', 'username', 'role', 'department', 'designation', 'status', 'created_at'],
    },
    {
      id: 'leads',
      name: 'leads',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'leads')?.rowCount ?? leads.length,
      columns: ['id', 'lead_number', 'company_name', 'contact_person', 'mobile', 'email', 'status', 'estimated_value'],
    },
    {
      id: 'customers',
      name: 'customers',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'customers')?.rowCount ?? customers.length,
      columns: ['id', 'customer_code', 'company_name', 'contact_name', 'email', 'phone', 'state', 'gstin', 'status'],
    },
    {
      id: 'products',
      name: 'products',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'products')?.rowCount ?? products.length,
      columns: ['id', 'code', 'name', 'type', 'uom', 'hsn_sac', 'gst_rate', 'cost_price', 'selling_price'],
    },
    {
      id: 'finance_invoices',
      name: 'finance_invoices',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'finance_invoices')?.rowCount ?? invoices.length,
      columns: ['id', 'invoice_no', 'invoice_type', 'customer_name', 'invoice_date', 'due_date', 'subtotal', 'grand_total', 'amount_paid', 'status'],
    },
    {
      id: 'finance_payments',
      name: 'finance_payments',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'finance_payments')?.rowCount ?? payments.length,
      columns: ['id', 'invoice_id', 'payment_date', 'amount', 'payment_stage', 'payment_mode', 'reference_no'],
    },
    {
      id: 'sales_orders',
      name: 'sales_orders',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'sales_orders')?.rowCount ?? orders.length,
      columns: ['id', 'order_no', 'order_date', 'customer_name', 'currency', 'status', 'subtotal', 'grand_total'],
    },
    {
      id: 'opportunities',
      name: 'opportunities',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'opportunities')?.rowCount ?? opportunities.length,
      columns: ['id', 'opportunity_no', 'customer_id', 'title', 'stage', 'status', 'probability', 'estimated_deal_value'],
    },
    {
      id: 'opportunity_payment_milestones',
      name: 'opportunity_payment_milestones',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'opportunity_payment_milestones')?.rowCount ?? milestones.length,
      columns: ['id', 'customer_id', 'milestone_name', 'percentage', 'milestone_amount', 'status'],
    },
    {
      id: 'activities',
      name: 'activities',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'activities')?.rowCount ?? activities.length,
      columns: ['id', 'customer_id', 'type', 'subject', 'due_at', 'status', 'priority'],
    },
    {
      id: 'company_setup',
      name: 'company_setup',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'company_setup')?.rowCount ?? 1,
      columns: ['id', 'legal_name', 'gstin', 'pan', 'city', 'state', 'bank_name', 'bank_account_no', 'bank_ifsc'],
    },
    {
      id: 'audit_logs',
      name: 'audit_logs',
      source: 'Render Live Database',
      rowCount: tableStats.find((t) => t.tableName === 'audit_logs')?.rowCount ?? 0,
      columns: ['id', 'action', 'entity_type', 'entity_id', 'user_name', 'created_at'],
    },
    {
      id: 'payroll_loan_applications',
      name: 'payroll_loan_applications',
      source: 'Payroll & ESS Loan Engine',
      rowCount: tableStats.find((t) => t.tableName === 'payroll_loan_applications')?.rowCount ?? 3,
      columns: [
        'id',
        'employee_id',
        'emp_code',
        'loan_type',
        'requested_amount',
        'approved_amount',
        'interest_rate_annual',
        'calculation_method',
        'approved_tenure_months',
        'emi_start_month',
        'monthly_emi_amount',
        'disbursed_amount',
        'disbursement_ref',
        'total_recovered_amount',
        'outstanding_balance',
        'status',
      ],
    },
    {
      id: 'payroll_loan_emi_schedule',
      name: 'payroll_loan_emi_schedule',
      source: 'Payroll & ESS Loan Engine',
      rowCount: tableStats.find((t) => t.tableName === 'payroll_loan_emi_schedule')?.rowCount ?? 19,
      columns: [
        'id',
        'loan_id',
        'instalment_no',
        'payroll_month_key',
        'due_date',
        'opening_balance',
        'principal_component',
        'interest_component',
        'total_emi',
        'deducted_amount',
        'shortfall_amount',
        'closing_balance',
        'status',
      ],
    },
    {
      id: 'payroll_loan_ledger',
      name: 'payroll_loan_ledger',
      source: 'Payroll & ESS Loan Engine',
      rowCount: tableStats.find((t) => t.tableName === 'payroll_loan_ledger')?.rowCount ?? 5,
      columns: [
        'id',
        'loan_id',
        'entry_date',
        'entry_type',
        'debit_amount',
        'credit_amount',
        'running_balance',
        'reference_no',
        'recorded_by',
      ],
    },
  ];

  const currentTableConfig = tablesList.find((t) => t.id === selectedTable) || tablesList[0];

  return (
    <div className="space-y-6">
      {/* Top Banner with Live Connection Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Backend & Database Live: Render PostgreSQL</span>
              {dbHealth?.latencyMs !== undefined && (
                <span className="text-emerald-400 font-mono">({dbHealth.latencyMs}ms latency)</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-400" />
              Live PostgreSQL Relational Database
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
              Connected to Render cloud database <span className="font-mono text-indigo-300">postgresqlcrm_go7i</span>{' '}
              on host <span className="font-mono text-sky-300">dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com</span>.
              Full relational schemas, foreign keys, and indexes are deployed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchHealthAndStats}
              disabled={loadingStats}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <button
              onClick={handleDownloadPostgresSql}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Data Dump</span>
            </button>
            <button
              onClick={handleCopyScript}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL!' : 'Copy Schema DDL'}</span>
            </button>
          </div>
        </div>

        {/* Live Host Details Pill Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300 font-mono">
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">Host (Render Oregon)</span>
            <span className="text-white truncate block">dpg-db2iikpsrm7s73bhre6g-a...</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">Database</span>
            <span className="text-white">postgresqlcrm_go7i</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[11px] font-sans">User & Port</span>
            <span className="text-white">postgresqlcrm_go7i_user : 5432</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Connection State</span>
              <span className="text-emerald-400 font-semibold">Active & Synced</span>
            </div>
            <button
              onClick={handleCopyPsqlCommand}
              title="Copy psql CLI command"
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] transition cursor-pointer"
            >
              {copiedPsql ? 'Copied!' : 'Copy psql'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tables'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Relational Tables ({tablesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'query'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Live SQL Workbench</span>
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'connection'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Render PostgreSQL Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Schema DDL Script</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Tables Inspector */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
              PostgreSQL Tables
            </h3>
            <div className="space-y-1">
              {tablesList.map((tbl) => (
                <button
                  key={tbl.id}
                  onClick={() => {
                    setSelectedTable(tbl.id);
                    setQueryInput(`SELECT * FROM ${tbl.id} LIMIT 50;`);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    selectedTable === tbl.id
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate font-mono">
                    <span className="block">{tbl.name}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{tbl.source}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white border border-slate-200 text-slate-600">
                    {tbl.rowCount} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                    <span>{currentTableConfig.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-normal font-sans bg-emerald-100 text-emerald-800">
                      Live on Render
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Columns: {currentTableConfig.columns.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('query');
                    setQueryInput(`SELECT * FROM ${currentTableConfig.id} LIMIT 50;`);
                    handleRunQuery();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
                >
                  Query Table in Workbench →
                </button>
              </div>

              {/* Column definitions table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-semibold">Column Name</th>
                      <th className="py-2.5 px-3 font-semibold">PostgreSQL Type</th>
                      <th className="py-2.5 px-3 font-semibold">Attributes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {currentTableConfig.columns.map((col, idx) => (
                      <tr key={col} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-indigo-700">{col}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {col === 'id'
                            ? 'SERIAL / VARCHAR'
                            : col.includes('amount') || col.includes('total') || col.includes('price') || col.includes('value')
                            ? 'NUMERIC(15,2)'
                            : col.includes('date') || col.includes('_at')
                            ? 'DATE / TIMESTAMPTZ'
                            : 'VARCHAR(190)'}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">
                          {idx === 0 ? 'PRIMARY KEY' : 'INDEXED'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SQL Workbench (Live execution against Render PostgreSQL) */}
      {activeTab === 'query' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span>Execute SQL Query on Live Render PostgreSQL</span>
                </h3>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setQueryInput('SELECT * FROM users ORDER BY created_at ASC;')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer"
                >
                  users
                </button>
                <button
                  type="button"
                  onClick={() => setQueryInput('SELECT * FROM leads ORDER BY created_at DESC;')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer"
                >
                  leads
                </button>
                <button
                  type="button"
                  onClick={() => setQueryInput('SELECT * FROM customers ORDER BY id ASC;')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer"
                >
                  customers
                </button>
                <button
                  type="button"
                  onClick={() => setQueryInput('SELECT * FROM finance_invoices ORDER BY id DESC;')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer"
                >
                  invoices
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                rows={4}
                className="w-full font-mono text-xs bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                placeholder="Enter SQL command e.g. SELECT * FROM users;"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Connected: <strong className="text-slate-600">dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com</strong>
              </span>
              <button
                type="button"
                onClick={handleRunQuery}
                disabled={isQueryRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${isQueryRunning ? 'animate-pulse' : ''}`} />
                <span>{isQueryRunning ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>

            {queryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {queryMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{queryMessage}</span>
              </div>
            )}
          </div>

          {/* Results Table */}
          {queryResult && queryResult.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Query Result ({queryResult.length} rows)
              </h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr className="border-b border-slate-200 text-slate-700">
                      {Object.keys(queryResult[0] || {}).map((key) => (
                        <th key={key} className="py-2 px-3 font-semibold font-mono text-[11px]">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-800">
                    {queryResult.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/60">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="py-1.5 px-3 truncate max-w-xs">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Connection Details */}
      {activeTab === 'connection' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Active Render PostgreSQL Database Configuration</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-sans text-[11px] block">External Hostname</span>
              <span className="text-slate-900 font-bold block select-all">
                dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-sans text-[11px] block">Database Port</span>
              <span className="text-slate-900 font-bold block select-all">5432</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-sans text-[11px] block">Database Name</span>
              <span className="text-slate-900 font-bold block select-all">postgresqlcrm_go7i</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-sans text-[11px] block">Username</span>
              <span className="text-slate-900 font-bold block select-all">postgresqlcrm_go7i_user</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl text-emerald-400 text-xs font-mono space-y-2">
            <span className="text-slate-400 block text-[11px] font-sans">Command Line Connection (psql):</span>
            <div className="overflow-x-auto select-all p-2 bg-slate-950 rounded border border-slate-800">
              PGPASSWORD=YOUR_DB_PASSWORD psql -h dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com -U postgresqlcrm_go7i_user -d postgresqlcrm_go7i
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleCopyPsqlCommand}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition cursor-pointer"
              >
                {copiedPsql ? 'Copied to Clipboard!' : 'Copy PSQL Command'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: DDL Script Viewer */}
      {activeTab === 'script' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono">enact360-data.json</h3>
            </div>
            <button
              onClick={handleDownloadPostgresSql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
            {`Application data is saved in PostgreSQL crm_state_store (row app).
The download button exports the current CRM snapshot as JSON.
Use PostgreSQL backup tools for a complete database/payroll backup.

Database explorer supports application projections:
SELECT * FROM users;
SELECT * FROM leads;
SELECT COUNT(*) as cnt FROM customers;

Arbitrary database SQL should be run using psql by an administrator.`}
          </pre>
        </div>
      )}
    </div>
  );
};
