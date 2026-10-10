import React, { useState, useEffect } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeadsView } from './components/leads/LeadsView';
import { OpportunitiesView } from './components/opportunities/OpportunitiesView';
import { CustomersView } from './components/customers/CustomersView';
import { SalesOrdersView } from './components/orders/SalesOrdersView';
import { PurchaseOrdersView } from './components/purchases/PurchaseOrdersView';
import { SupportAmcView } from './components/support/SupportAmcView';
import { MilestonesView } from './components/milestones/MilestonesView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { PaymentsView } from './components/payments/PaymentsView';
import { CustomerLedgerView } from './components/ledger/CustomerLedgerView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { ReportsView } from './components/reports/ReportsView';
import { MastersView } from './components/masters/MastersView';
import { PostgresDatabaseView } from './components/database/PostgresDatabaseView';
import { LoginView } from './components/auth/LoginView';
import { LifecycleTraceModal } from './components/common/LifecycleTraceModal';
import { AccessRestrictedView } from './components/common/AccessRestrictedView';
import { PayrollEssPortalModal } from './components/payroll/PayrollEssPortalModal';
import { Invoice, CrmModuleKey } from './types';
import { ALL_CRM_MODULES } from './data/initialData';

function MainAppContent() {
  const { isAuthenticated, canView, currentUser, rolePermissions, logout } = useCrm();

  // Helper to read initial navigation from URL or localStorage so page refresh or back/forward stays on last section
  const initialNav = React.useMemo(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlModule = urlParams.get('module');
      const urlItem = urlParams.get('item') || undefined;
      if (urlModule) {
        return { module: urlModule, itemId: urlItem };
      }
      const saved = localStorage.getItem('crm_last_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.module) {
          return { module: parsed.module, itemId: parsed.itemId };
        }
      }
    } catch {
      /* ignore */
    }
    return { module: 'dashboard', itemId: undefined };
  }, []);

  const [currentModule, setCurrentModule] = useState<string>(initialNav.module);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crm_sidebar_pinned') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canView(currentModule as CrmModuleKey)) {
      const firstPermitted = ALL_CRM_MODULES.find((m) => canView(m.id));
      if (firstPermitted && firstPermitted.id !== currentModule) {
        setCurrentModule((prev) => (prev === firstPermitted.id ? prev : firstPermitted.id));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentModule, currentUser, rolePermissions]);

  const handleTogglePinSidebar = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('crm_sidebar_pinned', String(next));
      } catch {
        /* ignore */
      }
      if (next) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
      return next;
    });
  };

  const handleHideSidebar = () => {
    setIsSidebarPinned(false);
    setSidebarOpen(false);
    try {
      localStorage.setItem('crm_sidebar_pinned', 'false');
    } catch {
      /* ignore */
    }
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      if (isSidebarPinned) {
        handleHideSidebar();
      } else {
        setSidebarOpen((prev) => !prev);
      }
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  // Deep linking item IDs & filter keys
  const [activeLeadId, setActiveLeadId] = useState<string | undefined>(
    initialNav.module === 'leads' ? initialNav.itemId : undefined
  );
  const [activeOpportunityId, setActiveOpportunityId] = useState<string | undefined>(
    initialNav.module === 'opportunities' ? initialNav.itemId : undefined
  );
  const [activeCustomerId, setActiveCustomerId] = useState<string | undefined>(
    initialNav.module === 'customers' || initialNav.module === 'ledger' ? initialNav.itemId : undefined
  );
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>(
    initialNav.module === 'orders' ? initialNav.itemId : undefined
  );
  const [activePurchaseOrderId, setActivePurchaseOrderId] = useState<string | undefined>(
    initialNav.module === 'purchases' ? initialNav.itemId : undefined
  );
  const [activeSupportTarget, setActiveSupportTarget] = useState<string | undefined>(
    initialNav.module === 'support' ? initialNav.itemId : undefined
  );
  const [activeMilestoneFilter, setActiveMilestoneFilter] = useState<string | undefined>(
    initialNav.module === 'milestones' ? initialNav.itemId : undefined
  );
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | undefined>(
    initialNav.module === 'invoices' ? initialNav.itemId : undefined
  );
  const [activePaymentFilter, setActivePaymentFilter] = useState<string | undefined>(
    initialNav.module === 'payments' ? initialNav.itemId : undefined
  );
  const [activeActivityFilter, setActiveActivityFilter] = useState<string | undefined>(
    initialNav.module === 'activities' ? initialNav.itemId : undefined
  );
  const [activeReportTab, setActiveReportTab] = useState<string | undefined>(
    initialNav.module === 'reports' ? initialNav.itemId : undefined
  );
  const [activeMasterTab, setActiveMasterTab] = useState<string | undefined>(
    initialNav.module === 'masters' ? initialNav.itemId : undefined
  );

  // Core navigation handler that synchronizes browser history and query state
  const applyNavigation = (module: string, itemId?: string, isPopState = false) => {
    setCurrentModule(module);
    if (module === 'customers') setActiveCustomerId(itemId);
    if (module === 'opportunities') setActiveOpportunityId(itemId);
    if (module === 'orders') setActiveOrderId(itemId);
    if (module === 'purchases') setActivePurchaseOrderId(itemId);
    if (module === 'support') setActiveSupportTarget(itemId);
    if (module === 'milestones') setActiveMilestoneFilter(itemId);
    if (module === 'invoices') setActiveInvoiceId(itemId);
    if (module === 'payments') setActivePaymentFilter(itemId);
    if (module === 'leads') setActiveLeadId(itemId);
    if (module === 'ledger' && itemId) setActiveCustomerId(itemId);
    if (module === 'activities') setActiveActivityFilter(itemId);
    if (module === 'reports') setActiveReportTab(itemId);
    if (module === 'masters') setActiveMasterTab(itemId);

    try {
      localStorage.setItem('crm_last_nav_state', JSON.stringify({ module, itemId }));
      if (!isPopState) {
        const params = new URLSearchParams(window.location.search);
        params.set('module', module);
        if (itemId) {
          params.set('item', itemId);
        } else {
          params.delete('item');
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ module, itemId }, '', newUrl);
      }
    } catch {
      /* ignore */
    }
  };

  const handleNavigate = (module: string, itemId?: string) => {
    applyNavigation(module, itemId, false);
  };

  // Synchronize browser backward & forward button events
  useEffect(() => {
    // Replace initial state so popstate has a clean starting state
    const params = new URLSearchParams(window.location.search);
    params.set('module', currentModule);
    if (initialNav.itemId) params.set('item', initialNav.itemId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ module: currentModule, itemId: initialNav.itemId }, '', newUrl);

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.module) {
        applyNavigation(state.module, state.itemId, true);
      } else {
        const urlP = new URLSearchParams(window.location.search);
        const mod = urlP.get('module') || 'dashboard';
        const itm = urlP.get('item') || undefined;
        applyNavigation(mod, itm, true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Traceability Modal state
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceLeadId, setTraceLeadId] = useState<string | undefined>();
  const [traceOpportunityId, setTraceOpportunityId] = useState<string | undefined>();
  const [traceCustomerId, setTraceCustomerId] = useState<string | undefined>();
  const [traceOrderId, setTraceOrderId] = useState<string | undefined>();
  const [traceInvoiceId, setTraceInvoiceId] = useState<string | undefined>();

  // Payment preset invoice
  const [presetPaymentInvoice, setPresetPaymentInvoice] = useState<Invoice | null>(null);

  const handleOpenTrace = (
    leadId?: string,
    customerId?: string,
    orderId?: string,
    invoiceId?: string,
    opportunityId?: string
  ) => {
    setTraceLeadId(leadId);
    setTraceCustomerId(customerId);
    setTraceOrderId(orderId);
    setTraceInvoiceId(invoiceId);
    setTraceOpportunityId(opportunityId);
    setIsTraceModalOpen(true);
  };

  const handleOpenRecordPaymentForInvoice = (invoice: Invoice) => {
    setPresetPaymentInvoice(invoice);
    setCurrentModule('payments');
  };

  useEffect(() => {
    const handleOpenPayrollLogin = (ev: Event) => {
      const customEv = ev as CustomEvent<{ email?: string; empCode?: string }>;
      try {
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('portal', 'payroll');
        if (customEv.detail?.email) {
          url.searchParams.set('email', customEv.detail.email);
        }
        if (customEv.detail?.empCode) {
          url.searchParams.set('emp', customEv.detail.empCode);
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
      logout();
    };
    window.addEventListener('crm-open-payroll-login', handleOpenPayrollLogin);
    return () => window.removeEventListener('crm-open-payroll-login', handleOpenPayrollLogin);
  }, [logout]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Dedicated full-page view for employees who ONLY have access to payroll (or logged in via Payroll Login Link)
  if (currentUser.accessScope === 'payroll_only') {
    const handlePayrollPortalSignOut = () => {
      try {
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('portal', 'payroll');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
      logout();
    };
    return (
      <PayrollEssPortalModal
        isOpen={true}
        onClose={handlePayrollPortalSignOut}
        asDedicatedPage={true}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentModule={currentModule}
        activeReportTab={activeReportTab}
        onSelectModule={(mod, itemId) => handleNavigate(mod, itemId)}
        isOpen={sidebarOpen}
        isPinned={isSidebarPinned}
        onTogglePin={handleTogglePinSidebar}
        onHideSidebar={handleHideSidebar}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenCreateLead={() => handleNavigate('leads', 'ACTION:CREATE')}
          onOpenCreateOrder={() => handleNavigate('orders', 'ACTION:CREATE')}
          onOpenRecordPayment={() => handleNavigate('payments', 'ACTION:CREATE')}
          onOpenScheduleActivity={() => handleNavigate('activities', 'ACTION:CREATE')}
          onNavigate={handleNavigate}
          onToggleSidebar={handleToggleSidebar}
          isSidebarPinned={isSidebarPinned}
          isSidebarOpen={sidebarOpen}
        />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 xl:p-8">
          <div className="max-w-[1680px] w-full mx-auto min-w-0">
            {!canView(currentModule as CrmModuleKey) ? (
              <AccessRestrictedView
                moduleKey={currentModule}
                onNavigate={handleNavigate}
              />
            ) : (
              <>
                {currentModule === 'dashboard' && (
                  <DashboardView
                    onNavigate={handleNavigate}
                    onOpenCreateLead={() => handleNavigate('leads', 'ACTION:CREATE')}
                    onOpenCreateOrder={() => handleNavigate('orders', 'ACTION:CREATE')}
                    onOpenRecordPayment={() => handleNavigate('payments', 'ACTION:CREATE')}
                  />
                )}

            {currentModule === 'leads' && (
              <LeadsView
                initialFilter={activeLeadId}
                onOpenTrace={(lId) => handleOpenTrace(lId)}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToOpportunity={(oppId) => handleNavigate('opportunities', oppId)}
                onNavigateToOrder={(oId) => handleNavigate('orders', oId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'opportunities' && (
              <OpportunitiesView
                initialOpportunityId={activeOpportunityId}
                onOpenTrace={handleOpenTrace}
                onNavigateToLead={(lId) => handleNavigate('leads', lId)}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToOrder={(oId) => handleNavigate('orders', oId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'customers' && (
              <CustomersView
                initialCustomerId={activeCustomerId}
                onOpenTrace={handleOpenTrace}
                onNavigateToOrder={(oId) => handleNavigate('orders', oId)}
                onNavigateToInvoice={(iId) => handleNavigate('invoices', iId)}
                onNavigateToPayment={(pId) => handleNavigate('payments', pId)}
              />
            )}

            {currentModule === 'orders' && (
              <SalesOrdersView
                initialOrderId={activeOrderId}
                onOpenTrace={handleOpenTrace}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToInvoice={(iId) => handleNavigate('invoices', iId)}
                onNavigateToMilestones={(filter) => handleNavigate('milestones', filter)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'support' && (
              <SupportAmcView
                initialItemId={activeSupportTarget}
                onNavigateToCustomer={(cId: string) => handleNavigate('customers', cId)}
                onNavigateToInvoice={(iId: string) => handleNavigate('invoices', iId)}
                onNavigateToPurchaseOrder={(poId: string) => handleNavigate('purchases', poId)}
                onNavigateToReport={(tab: string) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'purchases' && (
              <PurchaseOrdersView
                initialPoId={activePurchaseOrderId}
                onNavigateToCustomer={(cId: string) => handleNavigate('customers', cId)}
              />
            )}

            {currentModule === 'milestones' && (
              <MilestonesView
                initialFilter={activeMilestoneFilter}
                onOpenTrace={handleOpenTrace}
                onNavigateToInvoice={(iId) => handleNavigate('invoices', iId)}
                onNavigateToOrder={(oId) => handleNavigate('orders', oId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'invoices' && (
              <InvoicesView
                initialInvoiceId={activeInvoiceId}
                onOpenTrace={handleOpenTrace}
                onOpenRecordPaymentForInvoice={handleOpenRecordPaymentForInvoice}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
                onNavigateToSupport={(target) => handleNavigate('support', target)}
              />
            )}

            {currentModule === 'payments' && (
              <PaymentsView
                presetInvoice={presetPaymentInvoice}
                initialFilter={activePaymentFilter}
                onClosePreset={() => setPresetPaymentInvoice(null)}
                onOpenTrace={handleOpenTrace}
                onNavigateToInvoice={(iId) => handleNavigate('invoices', iId)}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'ledger' && (
              <CustomerLedgerView
                initialCustomerId={activeCustomerId}
                onOpenTrace={handleOpenTrace}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToInvoice={(iId) => handleNavigate('invoices', iId)}
                onNavigateToReport={(tab) => handleNavigate('reports', tab)}
              />
            )}

            {currentModule === 'activities' && (
              <ActivitiesView
                initialFilter={activeActivityFilter}
                onNavigateToLead={(lId) => handleNavigate('leads', lId)}
                onNavigateToCustomer={(cId) => handleNavigate('customers', cId)}
                onNavigateToOrder={(oId) => handleNavigate('orders', oId)}
              />
            )}

            {currentModule === 'reports' && (
              <ReportsView
                initialReportTab={activeReportTab}
                onNavigate={handleNavigate}
              />
            )}

            {currentModule === 'masters' && (
              <MastersView
                initialTab={activeMasterTab}
                onNavigate={handleNavigate}
              />
            )}

            {currentModule === 'database' && (
              <PostgresDatabaseView />
            )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Lifecycle Traceability Graph Modal */}
      <LifecycleTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        leadId={traceLeadId}
        opportunityId={traceOpportunityId}
        customerId={traceCustomerId}
        orderId={traceOrderId}
        invoiceId={traceInvoiceId}
        onNavigateToModule={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  return (
    <CrmProvider>
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <MainAppContent />
    </CrmProvider>
  );
}
