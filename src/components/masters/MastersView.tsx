import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { User } from '../../types';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  Settings,
  ShieldCheck,
  Package,
  Building2,
  Users,
  Search,
  X,
  Clock,
  Percent,
  CreditCard,
  MapPin,
  Building,
  Shield,
  Layers,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { RolePermissionsMatrix } from './RolePermissionsMatrix';
import { UserPermissionsModal } from './UserPermissionsModal';
import { UsersMasterTab } from './UsersMasterTab';
import { StatesMasterTab } from './StatesMasterTab';
import { ProductsMasterTab } from './ProductsMasterTab';
import { TaxRatesMasterTab } from './TaxRatesMasterTab';
import { PaymentTermsMasterTab } from './PaymentTermsMasterTab';
import { CustomersContactsMasterTab } from './CustomersContactsMasterTab';
import { OrganizationMasterTab } from './OrganizationMasterTab';
import { AuditTrailMasterTab } from './AuditTrailMasterTab';
import { DataImportMasterTab } from './DataImportMasterTab';

export type MasterTab =
  | 'users'
  | 'permissions'
  | 'states'
  | 'products'
  | 'tax_rates'
  | 'payment_terms'
  | 'customers_contacts'
  | 'company'
  | 'audit'
  | 'data_import';

export type MasterCategory = 'access' | 'commercial' | 'organization';

interface MastersViewProps {
  initialTab?: string;
  onNavigate?: (module: string, itemId?: string) => void;
}

export const MastersView: React.FC<MastersViewProps> = ({
  initialTab,
  onNavigate,
}) => {
  const {
    users,
    states,
    products,
    taxRates,
    paymentTerms,
    customers,
    contacts,
    auditLogs,
    currentUser,
  } = useCrm();

  // Master tab badges report CRM profiles, not Payroll-Only employees.
  const crmUsers = crmVisibleUsers(users);

  const [activeTab, setActiveTab] = useState<MasterTab>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-User Permissions Configuration Modal
  const [userForPermissionsModal, setUserForPermissionsModal] = useState<User | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  useEffect(() => {
    if (
      initialTab === 'users' ||
      initialTab === 'permissions' ||
      initialTab === 'states' ||
      initialTab === 'products' ||
      initialTab === 'tax_rates' ||
      initialTab === 'payment_terms' ||
      initialTab === 'customers_contacts' ||
      initialTab === 'company' ||
      initialTab === 'audit' ||
      initialTab === 'data_import'
    ) {
      setActiveTab(initialTab as MasterTab);
    }
  }, [initialTab]);

  const getCategoryForTab = (tab: MasterTab): MasterCategory => {
    if (tab === 'users' || tab === 'permissions' || tab === 'audit') return 'access';
    if (tab === 'products' || tab === 'tax_rates' || tab === 'payment_terms' || tab === 'states')
      return 'commercial';
    return 'organization';
  };

  const [activeCategory, setActiveCategory] = useState<MasterCategory>(() =>
    getCategoryForTab(activeTab)
  );

  useEffect(() => {
    setActiveCategory(getCategoryForTab(activeTab));
  }, [activeTab]);

  const handleSelectCategory = (cat: MasterCategory) => {
    setActiveCategory(cat);
    if (getCategoryForTab(activeTab) !== cat) {
      if (cat === 'access') setActiveTab('users');
      else if (cat === 'commercial') setActiveTab('products');
      else setActiveTab('customers_contacts');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Settings className="w-4 h-4" />
            <span>Enterprise System Administration</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">
              {activeCategory === 'access'
                ? 'Access & Security'
                : activeCategory === 'commercial'
                ? 'Commercial & Tax'
                : 'Directory & Organization'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Centralized Masters & Governance Console
          </h2>
        </div>

        {/* Global Master Search Input & Direct Branding / CSV Import Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {(currentUser.role === 'Super Admin' || currentUser.role === 'Administrator') && (
            <button
              type="button"
              onClick={() => setActiveTab('data_import')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'data_import'
                  ? 'sidebar-tab-active-depth text-slate-900'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Bulk CSV Data Import</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'company'
                ? 'sidebar-tab-active-depth text-slate-900'
                : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Company Setup & Brand Logo</span>
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records in active master..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categorized Navigation Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* Category Domain Selector (3 Clean Cards) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Administrative Domain
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap truncate">
              Logged in as:{' '}
              <strong className="text-slate-900 font-semibold">{currentUser.role}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Domain 1: Access & Security */}
            <button
              type="button"
              onClick={() => handleSelectCategory('access')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer min-w-0 ${
                activeCategory === 'access'
                  ? 'sidebar-tab-active-depth'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 card-depth'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  activeCategory === 'access'
                    ? 'sidebar-tab-icon-depth'
                    : 'icon-depth icon-depth-indigo'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-bold truncate whitespace-nowrap ${
                      activeCategory === 'access' ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    Access & Security
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-700 whitespace-nowrap shrink-0">
                    3 Masters
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate whitespace-nowrap">
                  {crmUsers.length} Users, RBAC Matrix & Audit Trail
                </p>
              </div>
            </button>

            {/* Domain 2: Commercial & Tax */}
            <button
              type="button"
              onClick={() => handleSelectCategory('commercial')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer min-w-0 ${
                activeCategory === 'commercial'
                  ? 'sidebar-tab-active-depth'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 card-depth'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  activeCategory === 'commercial'
                    ? 'sidebar-tab-icon-depth'
                    : 'icon-depth icon-depth-emerald'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-bold truncate whitespace-nowrap ${
                      activeCategory === 'commercial' ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    Commercial & Tax
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-700 whitespace-nowrap shrink-0">
                    4 Masters
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate whitespace-nowrap">
                  {products.length} Products, {taxRates.length} Tax Slabs, {states.length} States
                </p>
              </div>
            </button>

            {/* Domain 3: Directory & Organization */}
            <button
              type="button"
              onClick={() => handleSelectCategory('organization')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer min-w-0 ${
                activeCategory === 'organization'
                  ? 'sidebar-tab-active-depth'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 card-depth'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  activeCategory === 'organization'
                    ? 'sidebar-tab-icon-depth'
                    : 'icon-depth icon-depth-sky'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-bold truncate whitespace-nowrap ${
                      activeCategory === 'organization' ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    Directory & Legal
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-700 whitespace-nowrap shrink-0">
                    2 Masters
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate whitespace-nowrap">
                  {customers.length} Clients, Contacts & Company Profile
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Pills Strip & Quick Jump Dropdown — Zero Header Scrolling */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          {/* Responsive Dropdown Selector for all sizes / extended tables: NEVER scroll header */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">
                Active Master Table:
              </span>
              <div className="relative flex-1 max-w-md">
                <select
                  value={activeTab}
                  onChange={(e) => {
                    const nextTab = e.target.value as MasterTab;
                    setActiveTab(nextTab);
                    setActiveCategory(getCategoryForTab(nextTab));
                  }}
                  aria-label="Select Master Table"
                  className="w-full header-dropdown-select bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition"
                >
                  <optgroup label="Access & Security">
                    <option value="users">👤 Users & Login Profiles ({crmUsers.length})</option>
                    <option value="permissions">🛡️ User-Wise Permissions (RBAC Matrix)</option>
                    <option value="audit">🕒 Audit Trail Log ({auditLogs.length})</option>
                  </optgroup>
                  <optgroup label="Commercial & Tax">
                    <option value="products">📦 Products & Services ({products.length})</option>
                    <option value="tax_rates">📊 Tax Rates & GST Slabs ({taxRates.length})</option>
                    <option value="payment_terms">💳 Payment Terms ({paymentTerms.length})</option>
                    <option value="states">🗺️ State Master / GST Codes ({states.length})</option>
                  </optgroup>
                  <optgroup label="Directory & Organization">
                    <option value="customers_contacts">🏢 Customers & Contacts Directory</option>
                    <option value="company">🏛️ Organization Legal Profile</option>
                    <option value="data_import">📥 Bulk CSV Data Import</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
              Active Category: <strong className="text-slate-800">{activeCategory.toUpperCase()}</strong>
            </div>
          </div>

          {/* Sub-Tabs for active category: flex-wrap without overflow-x-auto scrolling */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-1">
            {activeCategory === 'access' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'users'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Users & Login Profiles</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'users'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {crmUsers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('permissions')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'permissions'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">User-Wise Permissions (RBAC)</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                      activeTab === 'permissions'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    Matrix
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'audit'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Audit Trail</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'audit'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('data_import')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'data_import'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Bulk CSV Import (Employees / Customers / Leads)</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                      activeTab === 'data_import'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    CSV
                  </span>
                </button>
              </>
            )}

            {activeCategory === 'commercial' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'products'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Products & Services</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'products'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tax_rates')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'tax_rates'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Percent className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Tax Rates & GST</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'tax_rates'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {taxRates.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('payment_terms')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'payment_terms'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Payment Terms</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'payment_terms'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {paymentTerms.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('states')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'states'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">State Master (GST Codes)</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'states'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {states.length}
                  </span>
                </button>
              </>
            )}

            {activeCategory === 'organization' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('customers_contacts')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'customers_contacts'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Customers & Contacts</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      activeTab === 'customers_contacts'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {customers.length} / {contacts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('company')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'company'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Organization Legal Profile</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                      activeTab === 'company'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Verified
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('data_import')}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'data_import'
                      ? 'sidebar-tab-active-depth text-slate-900'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Bulk CSV Import (Employees / Customers / Leads)</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                      activeTab === 'data_import'
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    CSV
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Direct Jump Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400">Quick Jump:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as MasterTab)}
              className="bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
            >
              <optgroup label="Access & Security">
                <option value="users">Users &amp; Login Profiles ({crmUsers.length})</option>
                <option value="permissions">User-Wise Permissions (RBAC)</option>
                <option value="audit">Audit Trail ({auditLogs.length})</option>
              </optgroup>
              <optgroup label="Commercial & Tax">
                <option value="products">Products & Services ({products.length})</option>
                <option value="tax_rates">Tax Rates & GST ({taxRates.length})</option>
                <option value="payment_terms">Payment Terms ({paymentTerms.length})</option>
                <option value="states">State Master ({states.length})</option>
              </optgroup>
              <optgroup label="Directory & Organization">
                <option value="customers_contacts">
                  Customers & Contacts ({customers.length} / {contacts.length})
                </option>
                <option value="company">Organization Legal Profile</option>
                <option value="data_import">Bulk CSV Data Import (Employees / Customers / Leads)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'users' && (
        <UsersMasterTab
          searchQuery={searchQuery}
          onOpenPermissionsMatrix={() => setActiveTab('permissions')}
          onConfigureUserPermissions={(u) => {
            setUserForPermissionsModal(u);
            setIsPermissionsModalOpen(true);
          }}
        />
      )}

      {activeTab === 'permissions' && (
        <RolePermissionsMatrix initialUserId={userForPermissionsModal?.id} />
      )}

      {activeTab === 'states' && <StatesMasterTab searchQuery={searchQuery} />}

      {activeTab === 'products' && <ProductsMasterTab searchQuery={searchQuery} />}

      {activeTab === 'tax_rates' && <TaxRatesMasterTab searchQuery={searchQuery} />}

      {activeTab === 'payment_terms' && <PaymentTermsMasterTab searchQuery={searchQuery} />}

      {activeTab === 'customers_contacts' && (
        <CustomersContactsMasterTab searchQuery={searchQuery} />
      )}

      {activeTab === 'company' && <OrganizationMasterTab />}

      {activeTab === 'audit' && (
        <AuditTrailMasterTab searchQuery={searchQuery} onNavigate={onNavigate} />
      )}

      {activeTab === 'data_import' && (
        <DataImportMasterTab
          onNavigateTab={(tab) => setActiveTab(tab)}
          onNavigateModule={onNavigate}
        />
      )}

      {/* User-Specific Permissions Modal */}
      <UserPermissionsModal
        user={userForPermissionsModal}
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setUserForPermissionsModal(null);
        }}
      />
    </div>
  );
};
