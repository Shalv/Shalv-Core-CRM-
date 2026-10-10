import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Clock,
  ArrowUpRight,
  Filter,
  UserCheck,
  Briefcase,
  Building,
  FileSpreadsheet,
  CalendarCheck,
  Receipt,
  CreditCard,
  Search,
} from 'lucide-react';

interface AuditTrailMasterTabProps {
  searchQuery: string;
  onNavigate?: (module: string, itemId?: string) => void;
}

export const AuditTrailMasterTab: React.FC<AuditTrailMasterTabProps> = ({
  searchQuery,
  onNavigate,
}) => {
  const { auditLogs } = useCrm();
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const q = searchQuery.trim().toLowerCase();
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !q ||
      log.entityNumber.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.performedByName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Lead':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'Opportunity':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'Customer':
        return <Building className="w-3.5 h-3.5" />;
      case 'SalesOrder':
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case 'Milestone':
        return <CalendarCheck className="w-3.5 h-3.5" />;
      case 'Invoice':
        return <Receipt className="w-3.5 h-3.5" />;
      case 'Payment':
        return <CreditCard className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'Lead':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Opportunity':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Customer':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SalesOrder':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Milestone':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Invoice':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Payment':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Audit Entries
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{auditLogs.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Immutable Trace
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sales & Pipeline
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950">
              {auditLogs.filter((l) => l.entityType === 'Lead' || l.entityType === 'Opportunity').length}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Conversions
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Orders & Milestones
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-950">
              {auditLogs.filter((l) => l.entityType === 'SalesOrder' || l.entityType === 'Milestone').length}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Approvals
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Billing & Collections
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-950">
              {auditLogs.filter((l) => l.entityType === 'Invoice' || l.entityType === 'Payment').length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Postings
            </span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Action & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>System Compliance & Audit Trail Trace</span>
            </h3>
          </div>

          {/* Entity Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {['ALL', 'Lead', 'Opportunity', 'Customer', 'SalesOrder', 'Invoice', 'Payment'].map(
              (ent) => (
                <button
                  key={ent}
                  type="button"
                  onClick={() => setEntityFilter(ent)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    entityFilter === ent
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ent === 'SalesOrder' ? 'Orders' : ent === 'ALL' ? 'All Logs' : ent}
                </button>
              )
            )}
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">No audit records found</p>
              <p className="text-xs text-slate-400 mt-1">
                {q || entityFilter !== 'ALL'
                  ? 'Try clearing the search query or entity filter.'
                  : 'System activities will be logged automatically as records are created or updated.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const handleLogClick = () => {
                if (!onNavigate) return;
                if (log.entityType === 'Lead') onNavigate('leads', log.entityId);
                else if (log.entityType === 'Opportunity') onNavigate('opportunities', log.entityId);
                else if (log.entityType === 'Customer') onNavigate('customers', log.entityId);
                else if (log.entityType === 'SalesOrder') onNavigate('orders', log.entityId);
                else if (log.entityType === 'Milestone') onNavigate('milestones', log.entityNumber);
                else if (log.entityType === 'Invoice') onNavigate('invoices', log.entityId);
                else if (log.entityType === 'Payment') onNavigate('payments', log.entityNumber);
              };

              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={handleLogClick}
                  className="w-full text-left p-3.5 bg-slate-50/50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 hover:border-indigo-300 flex items-center justify-between text-xs transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl font-bold font-mono text-[10px] shrink-0 border flex items-center gap-1.5 ${getEntityColor(
                        log.entityType
                      )}`}
                    >
                      {getEntityIcon(log.entityType)}
                      <span>{log.entityType}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="group-hover:text-indigo-700 transition font-mono">
                          {log.entityNumber}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          {log.action}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 truncate">{log.description}</p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 shrink-0 pl-3">
                    <div className="font-semibold text-slate-700">{log.performedByName}</div>
                    <div className="font-mono text-slate-400 text-[10px]">
                      {log.timestamp.replace('T', ' ').slice(0, 16)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
