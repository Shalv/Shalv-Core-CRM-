import React from 'react';
import {
  PayrollIntegrationConfig,
  SyncLogEntry,
  PROVIDER_PRESETS,
} from './payrollTypes';
import {
  CheckCircle2,
  Download,
  RefreshCw,
  Link2,
  ExternalLink,
} from 'lucide-react';

interface PayrollIntegrationSectionProps {
  integrationConfig: PayrollIntegrationConfig;
  setIntegrationConfig: React.Dispatch<React.SetStateAction<PayrollIntegrationConfig>>;
  syncLogs: SyncLogEntry[];
  showPayloadInspector: boolean;
  setShowPayloadInspector: React.Dispatch<React.SetStateAction<boolean>>;
  baseMonthlyGross: number;
  handleFetchFromPayroll: () => void;
  handlePushToPayroll: () => void;
  handleSyncPayrollNow: () => void;
  handleDownloadPushBatchJson: () => void;
  buildOutboundPushPayload: () => Record<string, unknown>;
  setStatusBanner: (msg: string | null) => void;
}

export const PayrollIntegrationSection: React.FC<PayrollIntegrationSectionProps> = ({
  integrationConfig,
  setIntegrationConfig,
  syncLogs,
  showPayloadInspector,
  setShowPayloadInspector,
  baseMonthlyGross,
  handleFetchFromPayroll,
  handlePushToPayroll,
  handleSyncPayrollNow,
  handleDownloadPushBatchJson,
  buildOutboundPushPayload,
  setStatusBanner,
}) => {
  const isLinked = Boolean(
    integrationConfig.portalUrl.trim() ||
      integrationConfig.fetchApiEndpoint.trim() ||
      integrationConfig.pushWebhookEndpoint.trim()
  );

  return (
    <div className="space-y-4">
      {/* Dual Mode Selector Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          onClick={() =>
            setIntegrationConfig({
              ...integrationConfig,
              operationMode: 'hybrid_bidirectional',
            })
          }
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            integrationConfig.operationMode === 'hybrid_bidirectional'
              ? 'border-[#1f7e9e] bg-sky-50/50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1f7e9e]">
              01. Bi-Directional Integration (Fetch + Push)
            </span>
            {integrationConfig.operationMode === 'hybrid_bidirectional' && (
              <CheckCircle2 className="w-4 h-4 text-[#1f7e9e] shrink-0" />
            )}
          </div>
          <h4 className="font-bold text-sm text-slate-900 mt-1">
            Connect Your External Payroll (Fetch &amp; Push)
          </h4>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            <strong>FETCH (Pull):</strong> Pulls employee salary structure, published payslips, tax TDS, and leave balances from your Payroll software.{' '}
            <strong>PUSH (Send):</strong> Pushes daily CRM Attendance, Leaves, Reimbursements, and Sales Order Incentives back to Payroll.
          </p>
        </div>

        <div
          onClick={() =>
            setIntegrationConfig({
              ...integrationConfig,
              operationMode: 'standalone_builtin',
            })
          }
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            integrationConfig.operationMode === 'standalone_builtin'
              ? 'border-[#1f7e9e] bg-sky-50/50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              02. Built-in Standalone Payroll Engine
            </span>
            {integrationConfig.operationMode === 'standalone_builtin' && (
              <CheckCircle2 className="w-4 h-4 text-[#1f7e9e] shrink-0" />
            )}
          </div>
          <h4 className="font-bold text-sm text-slate-900 mt-1">
            Use Built-in CRM Payroll &amp; ESS Directly
          </h4>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            Works as a complete standalone Payroll &amp; ESS system inside the CRM without needing any external software. Automatically generates monthly Payslips, calculates PF/TDS/Net Pay, and manages Attendance, Leaves &amp; Claims in-app.
          </p>
        </div>
      </div>

      {/* Quick Action Bar: FETCH from Payroll & PUSH to Payroll */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <h4 className="font-bold text-sm truncate">
              Two-Way Payroll Data Bridge ({integrationConfig.providerLabel})
            </h4>
          </div>
          <div className="text-slate-300 text-xs mt-0.5 flex items-center gap-2 whitespace-nowrap overflow-x-auto">
            <span>
              Last Fetched:{' '}
              <strong className="text-sky-300">
                {integrationConfig.lastFetchedAt || integrationConfig.lastSyncedAt}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Last Pushed:{' '}
              <strong className="text-emerald-300">
                {integrationConfig.lastPushedAt || integrationConfig.lastSyncedAt}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={handleFetchFromPayroll}
            className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fetch from Payroll (Pull)</span>
          </button>

          <button
            type="button"
            onClick={handlePushToPayroll}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Push to Payroll (Send)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPayloadInspector(!showPayloadInspector)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg cursor-pointer transition"
          >
            {showPayloadInspector ? 'Hide API Payload' : 'Inspect JSON Payload'}
          </button>

          <button
            type="button"
            onClick={handleDownloadPushBatchJson}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Payroll Batch</span>
          </button>
        </div>
      </div>

      {/* Live JSON Payload Inspector */}
      {showPayloadInspector && (
        <div className="bg-slate-950 text-emerald-300 rounded-xl p-4 border border-slate-800 font-mono text-[11px] overflow-x-auto">
          <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800 whitespace-nowrap">
            <span>
              LIVE OUTBOUND PUSH PAYLOAD (POST →{' '}
              {integrationConfig.pushWebhookEndpoint || 'Custom Webhook'})
            </span>
            <span className="text-sky-400">Content-Type: application/json</span>
          </div>
          <pre className="leading-relaxed">
            {JSON.stringify(buildOutboundPushPayload(), null, 2)}
          </pre>
        </div>
      )}

      {/* Connector & Endpoint Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Link Your External Payroll Application (Optional — No Hard-Coded Links)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your own Payroll Portal link and optional REST API endpoints whenever you want to link an external payroll system. Leave blank to run purely on the inbuilt ESS engine.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            {isLinked && (
              <button
                type="button"
                onClick={() => {
                  setIntegrationConfig({
                    ...integrationConfig,
                    portalUrl: '',
                    fetchApiEndpoint: '',
                    pushWebhookEndpoint: '',
                    apiTenantKey: '',
                    operationMode: 'standalone_builtin',
                    launchMode: 'integrated_ess',
                    providerLabel: 'Inbuilt CRM Payroll & ESS',
                  });
                  setStatusBanner(
                    'External payroll link removed. Running on Inbuilt Standalone Payroll & ESS Engine.'
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer transition"
              >
                Unlink External Payroll
              </button>
            )}
            <span className="text-xs font-semibold text-slate-600">
              {isLinked
                ? `Linked · Last Synced: ${integrationConfig.lastSyncedAt}`
                : 'Not Linked (Inbuilt Mode)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              Payroll Application / Provider Name
            </label>
            <div className="flex gap-2">
              <select
                value={integrationConfig.provider}
                onChange={(e) => {
                  const provider = e.target.value as PayrollIntegrationConfig['provider'];
                  const preset = PROVIDER_PRESETS[provider];
                  setIntegrationConfig({
                    ...integrationConfig,
                    provider,
                    providerLabel: preset.label,
                  });
                }}
                className="w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="custom">Custom / Any Payroll</option>
                <option value="keka">Keka Payroll</option>
                <option value="zoho_payroll">Zoho Payroll</option>
                <option value="greythr">greytHR ESS</option>
                <option value="darwinbox">Darwinbox HRMS</option>
                <option value="razorpayx">RazorpayX Payroll</option>
                <option value="sap_sf">SAP SuccessFactors</option>
              </select>
              <input
                type="text"
                value={integrationConfig.providerLabel}
                onChange={(e) =>
                  setIntegrationConfig({
                    ...integrationConfig,
                    providerLabel: e.target.value,
                  })
                }
                placeholder="Custom Payroll Name"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              ESS Launch Experience Mode
            </label>
            <select
              value={integrationConfig.launchMode}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  launchMode: e.target.value as PayrollIntegrationConfig['launchMode'],
                })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
            >
              <option value="integrated_ess">
                Native CRM ESS Workspace + Optional External Link
              </option>
              <option value="embedded_iframe">
                Embed Linked External Payroll URL Inside CRM Modal (iFrame)
              </option>
              <option value="new_tab">
                Launch Linked External Payroll Directly in New Browser Tab
              </option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              External Payroll Portal Link (Optional — Enter Your Own URL to Link)
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="url"
                value={integrationConfig.portalUrl}
                onChange={(e) =>
                  setIntegrationConfig({ ...integrationConfig, portalUrl: e.target.value })
                }
                placeholder="Paste your external payroll portal link here (optional — no hard-coded link)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-[#1f7e9e]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!integrationConfig.portalUrl.trim()) {
                    setStatusBanner('Please enter a valid External Payroll Portal URL to link.');
                    return;
                  }
                  setIntegrationConfig({
                    ...integrationConfig,
                    operationMode: 'hybrid_bidirectional',
                  });
                  setStatusBanner(
                    `External Payroll Portal linked successfully: ${integrationConfig.portalUrl.trim()}`
                  );
                }}
                className="px-4 py-2 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Payroll URL</span>
              </button>
              {integrationConfig.portalUrl.trim() && (
                <a
                  href={integrationConfig.portalUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              FETCH API Link (Optional GET Endpoint — Pull Salary &amp; Balances)
            </label>
            <input
              type="url"
              value={integrationConfig.fetchApiEndpoint}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  fetchApiEndpoint: e.target.value,
                })
              }
              placeholder="Enter GET API URL if linking external payroll fetch (optional)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              PUSH Webhook Link (Optional POST Endpoint — Send Attendance &amp; Claims)
            </label>
            <input
              type="url"
              value={integrationConfig.pushWebhookEndpoint}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  pushWebhookEndpoint: e.target.value,
                })
              }
              placeholder="Enter POST Webhook URL if pushing data to external payroll (optional)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
              API Bearer Token / SSO Key (Optional) &amp; Fetched Gross Salary Override (₹)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={integrationConfig.apiTenantKey}
                onChange={(e) =>
                  setIntegrationConfig({
                    ...integrationConfig,
                    apiTenantKey: e.target.value,
                  })
                }
                placeholder="Paste API Token / SSO Key (optional)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800"
              />
              <input
                type="number"
                value={integrationConfig.fetchedGrossSalaryOverride || ''}
                onChange={(e) =>
                  setIntegrationConfig({
                    ...integrationConfig,
                    fetchedGrossSalaryOverride: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder={`Gross ₹ (${baseMonthlyGross})`}
                className="w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-700"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 cursor-pointer">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 whitespace-nowrap truncate">
                Push CRM Sales Incentives
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Sync closed Sales Order commissions
              </div>
            </div>
            <input
              type="checkbox"
              checked={integrationConfig.syncCrmIncentives}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  syncCrmIncentives: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-[#1f7e9e] shrink-0"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 cursor-pointer">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 whitespace-nowrap truncate">
                Push Expense Reimbursements
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Sync approved travel &amp; client claims
              </div>
            </div>
            <input
              type="checkbox"
              checked={integrationConfig.syncReimbursements}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  syncReimbursements: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-[#1f7e9e] shrink-0"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 cursor-pointer">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 whitespace-nowrap truncate">
                Push Attendance &amp; Leave Logs
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Sync daily Punch-In/Out &amp; Leave requests
              </div>
            </div>
            <input
              type="checkbox"
              checked={integrationConfig.autoPushAttendanceAndLeaves}
              onChange={(e) =>
                setIntegrationConfig({
                  ...integrationConfig,
                  autoPushAttendanceAndLeaves: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-[#1f7e9e] shrink-0"
            />
          </label>
        </div>

        {/* Recent Bi-Directional Sync Log */}
        <div className="border-t border-slate-200 pt-3.5">
          <h4 className="font-bold text-slate-900 mb-2">
            Recent Bi-Directional Sync Log (Fetch &amp; Push History)
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs whitespace-nowrap overflow-x-auto"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-bold text-[10px] uppercase shrink-0 ${
                      log.direction.startsWith('FETCH') ? 'text-sky-700' : 'text-emerald-700'
                    }`}
                  >
                    {log.direction}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-800 truncate">{log.summary}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSyncPayrollNow}
            className="px-4 py-2 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg shadow-xs whitespace-nowrap cursor-pointer"
          >
            Save Configuration &amp; Run Two-Way Sync (Fetch + Push)
          </button>
        </div>
      </div>
    </div>
  );
};
