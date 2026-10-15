import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Building,
  FileSpreadsheet,
  CalendarCheck,
  Receipt,
  CreditCard,
  BookOpen,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  X,
  Lock,
  ChevronDown,
  ChevronRight,
  LifeBuoy,
  ShoppingBag,
  Pin,
  PinOff,
  PanelLeftClose,
  Wallet,
  Clock,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BrandLogo } from '../common/BrandLogo';
import { UserAvatar } from '../common/UserAvatar';
import { EssTabKey } from '../payroll/payrollTypes';

interface SidebarProps {
  currentModule: string;
  activeReportTab?: string;
  onSelectModule: (module: string, itemId?: string) => void;
  isOpen?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onHideSidebar?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  activeReportTab = 'lead_register',
  onSelectModule,
  isOpen = false,
  isPinned = true,
  onTogglePin,
  onHideSidebar,
  onClose,
}) => {
  const {
    currentUser,
    logout,
    canView,
  } = useCrm();

  const [reportsDropdownOpen, setReportsDropdownOpen] = useState<boolean>(currentModule === 'reports');
  const [essDropdownOpen, setEssDropdownOpen] = useState<boolean>(false);

  const openEssPortal = (tab: EssTabKey = 'overview') => {
    window.dispatchEvent(
      new CustomEvent('open-payroll-ess-portal', { detail: { tab } })
    );
    if (!isPinned) {
      onClose?.();
    } else if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  useEffect(() => {
    if (currentModule === 'reports') {
      setReportsDropdownOpen(true);
    }
  }, [currentModule]);

  const moduleReportDropdownItems: {
    group: string;
    items: {
      reportKey: string;
      moduleKey: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[];
  }[] = [
    {
      group: 'Sales Engine',
      items: [
        {
          reportKey: 'lead_register',
          moduleKey: 'leads',
          label: 'Lead Management Report',
          icon: UserCheck,
        },
        {
          reportKey: 'opportunity_register',
          moduleKey: 'opportunities',
          label: 'Opportunity Deal Report',
          icon: Briefcase,
        },
        {
          reportKey: 'customer_register',
          moduleKey: 'customers',
          label: 'Customer Master 360 Report',
          icon: Building,
        },
        {
          reportKey: 'sales_register',
          moduleKey: 'orders',
          label: 'Sales Orders Report',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      group: 'Support, AMC & Procurement',
      items: [
        {
          reportKey: 'support_register',
          moduleKey: 'support',
          label: 'Support & AMC Report',
          icon: LifeBuoy,
        },
        {
          reportKey: 'purchase_register',
          moduleKey: 'purchases',
          label: 'Purchase Orders Report',
          icon: ShoppingBag,
        },
      ],
    },
    {
      group: 'Finance & Billing',
      items: [
        {
          reportKey: 'milestone_register',
          moduleKey: 'milestones',
          label: 'Payment Milestones Report',
          icon: CalendarCheck,
        },
        {
          reportKey: 'gst_tax_register',
          moduleKey: 'invoices',
          label: 'Invoices & GST Report',
          icon: Receipt,
        },
        {
          reportKey: 'collection_register',
          moduleKey: 'payments',
          label: 'Payments & Collections Report',
          icon: CreditCard,
        },
        {
          reportKey: 'ledger_aging_register',
          moduleKey: 'ledger',
          label: 'Customer Ledger & AR Report',
          icon: BookOpen,
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          reportKey: 'activity_register',
          moduleKey: 'activities',
          label: 'Activities & Follow-ups Report',
          icon: CalendarDays,
        },
      ],
    },
  ];

  const permittedReportGroups = moduleReportDropdownItems
    .map((group) => ({
      ...group,
      items: group.items.filter((rep) => canView(rep.moduleKey as any)),
    }))
    .filter((group) => group.items.length > 0);

  const firstPermittedReportKey =
    permittedReportGroups[0]?.items[0]?.reportKey || 'lead_register';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'Main',
    },
    {
      id: 'leads',
      label: 'Lead Management',
      icon: UserCheck,
      section: 'Sales Engine',
    },
    {
      id: 'opportunities',
      label: 'Opportunity Management',
      icon: Briefcase,
      section: 'Sales Engine',
    },
    {
      id: 'customers',
      label: 'Customer Master 360',
      icon: Building,
      section: 'Sales Engine',
    },
    {
      id: 'orders',
      label: 'Sales Orders',
      icon: FileSpreadsheet,
      section: 'Sales Engine',
    },
    {
      id: 'support',
      label: 'Support & AMC Desk',
      icon: LifeBuoy,
      section: 'Support & Operations',
    },
    {
      id: 'purchases',
      label: 'Purchase Orders',
      icon: ShoppingBag,
      section: 'Support & Operations',
    },
    {
      id: 'milestones',
      label: 'Payment Milestones',
      icon: CalendarCheck,
      section: 'Finance & Billing',
    },
    {
      id: 'invoices',
      label: 'Invoices & GST',
      icon: Receipt,
      section: 'Finance & Billing',
    },
    {
      id: 'payments',
      label: 'Payments & Collections',
      icon: CreditCard,
      section: 'Finance & Billing',
    },
    {
      id: 'ledger',
      label: 'Customer Ledger & AR',
      icon: BookOpen,
      section: 'Finance & Billing',
    },
    {
      id: 'activities',
      label: 'Activities & Follow-ups',
      icon: CalendarDays,
      section: 'Management',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      section: 'Management',
    },
    {
      id: 'masters',
      label: 'Masters & Administration',
      icon: Settings,
      section: 'Management',
    },
  ];

  const permittedNavItems = navItems.filter((item) => {
    if (!canView(item.id as any)) return false;
    if (item.id === 'reports' && permittedReportGroups.length === 0) return false;
    return true;
  });

  const firstPermittedModuleId = permittedNavItems[0]?.id || 'dashboard';

  const sections = ['Main', 'Sales Engine', 'Support & Operations', 'Finance & Billing', 'Management'];

  const handleSelect = (id: string, itemId?: string) => {
    onSelectModule(id, itemId);
    if (!isPinned) {
      onClose?.();
    } else if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Overlay Backdrop when Sidebar is open in unpinned mode or on mobile/tablet */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs ${
            isPinned ? 'lg:hidden' : ''
          }`}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 max-w-[85vw] sm:w-68 xl:w-72 bg-white/95 backdrop-blur-xl text-slate-700 flex flex-col shrink-0 border-r border-slate-200/80 shadow-[0_0_50px_-28px_rgba(15,23,42,0.45)] transition-transform duration-200 ease-in-out ${
          isPinned ? 'lg:static lg:translate-x-0' : ''
        } ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        {/* Top Brand Header displaying logo uploaded from Company Setup + Pin / Hide Controls */}
        <div className="px-3.5 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-1.5 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <BrandLogo
              variant="full"
              size="md"
              onClick={() => handleSelect(firstPermittedModuleId)}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                className={`hidden lg:inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isPinned
                    ? 'sidebar-tab-active-depth'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={
                  isPinned
                    ? 'Sidebar Pinned (Click to Unpin / Auto-Hide)'
                    : 'Sidebar Unpinned (Click to Pin Sidebar Open)'
                }
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onHideSidebar) {
                  onHideSidebar();
                } else {
                  onClose?.();
                }
              }}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Hide Sidebar"
              aria-label="Hide navigation sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden space-y-5">
          {/* Employee Self-Service (ESS) Portal Section in Employee/User Sidebar */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate whitespace-nowrap">
              Employee Self-Service (ESS)
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEssPortal('overview')}
                  title="Open Payroll & ESS Portal (Attendance, Leaves & Policy CS-HR-POL-001)"
                  className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 bg-gradient-to-r from-[#1f7e9e]/12 to-sky-50 hover:from-[#1f7e9e]/20 hover:to-sky-100/80 text-slate-900 border border-[#1f7e9e]/25 min-w-0 whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[#1f7e9e] text-white">
                      <Wallet className="w-3.5 h-3.5 shrink-0" />
                    </span>
                    <span className="truncate whitespace-nowrap">ESS Portal &amp; Payroll</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#1f7e9e] text-white text-[9px] font-bold shrink-0">
                    Open
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEssDropdownOpen((prev) => !prev)}
                  title="Toggle ESS Portal Sections"
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer shrink-0"
                >
                  {essDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#1f7e9e]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#1f7e9e]" />
                  )}
                </button>
              </div>

              {essDropdownOpen && (
                <div className="ml-3 pl-2.5 border-l-2 border-[#1f7e9e]/30 space-y-1 py-1">
                  <button
                    type="button"
                    onClick={() => openEssPortal('overview')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Attendance &amp; Punch (9:30–6:00)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEssPortal('leaves')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Leaves &amp; Policy CS-HR-POL-001</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEssPortal('payslips')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Salary &amp; Monthly Payslips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEssPortal('reimbursements')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Expense Reimbursements</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEssPortal('tax')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                    <span className="truncate">Tax Declarations &amp; Form 16</span>
                  </button>
                  {(currentUser.role === 'Super Admin' ||
                    currentUser.role === 'Administrator' ||
                    canView('masters')) && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEssPortal('admin_dashboard')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition cursor-pointer text-left"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Admin Dashboard &amp; GPS Reports</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEssPortal('admin_master')}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 transition cursor-pointer text-left"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Admin Policy &amp; Salary Master</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {sections.map((section) => {
            const itemsInSection = permittedNavItems.filter((item) => item.section === section);
            if (itemsInSection.length === 0) return null;

            return (
              <div key={section} className="space-y-1">
                <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate whitespace-nowrap">
                  {section}
                </div>
                {itemsInSection.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;

                  // Render Reports as a collapsible Drop-Down List View with allocated module-wise reports
                  if (item.id === 'reports') {
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpen = !reportsDropdownOpen;
                            setReportsDropdownOpen(nextOpen);
                            if (currentModule !== 'reports') {
                              const validActiveTab = permittedReportGroups.some((g) =>
                                g.items.some((r) => r.reportKey === activeReportTab)
                              )
                                ? activeReportTab
                                : firstPermittedReportKey;
                              onSelectModule('reports', validActiveTab);
                            }
                          }}
                          title="Toggle Module-Wise Reports Dropdown"
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group min-w-0 whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'sidebar-tab-active-depth font-bold'
                              : 'text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                                isActive ? 'sidebar-tab-icon-depth' : 'bg-[#1f7e9e]/10'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0 text-[#1f7e9e] transition" />
                            </span>
                            <span className="truncate whitespace-nowrap">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {reportsDropdownOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 transition text-[#1f7e9e]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 transition text-[#1f7e9e]" />
                            )}
                          </div>
                        </button>

                        {/* Module-Wise Reports Drop-Down List View */}
                        {reportsDropdownOpen && (
                          <div className="ml-3 pl-2.5 border-l-2 border-slate-200 space-y-2 py-1">
                            {permittedReportGroups.map((group) => (
                              <div key={group.group} className="space-y-0.5">
                                <div className="px-2.5 pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate whitespace-nowrap">
                                  {group.group}
                                </div>
                                {group.items.map((rep) => {
                                  const RepIcon = rep.icon;
                                  const isRepActive =
                                    currentModule === 'reports' &&
                                    (activeReportTab || firstPermittedReportKey) === rep.reportKey;

                                  return (
                                    <button
                                      key={rep.reportKey}
                                      type="button"
                                      onClick={() => handleSelect('reports', rep.reportKey)}
                                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 min-w-0 whitespace-nowrap cursor-pointer ${
                                        isRepActive
                                          ? 'sidebar-subtab-active-depth font-bold'
                                          : 'text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <RepIcon className="w-3.5 h-3.5 shrink-0 text-[#1f7e9e]" />
                                        <span className="truncate whitespace-nowrap">{rep.label}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      title={item.label}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group min-w-0 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'sidebar-tab-active-depth font-bold'
                          : 'text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isActive ? 'sidebar-tab-icon-depth' : 'bg-[#1f7e9e]/10'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-[#1f7e9e] transition" />
                        </span>
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Active User Login Profile & ESS Portal Quick Button in sidebar footer */}
        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-600 bg-slate-50/70 space-y-2">
          <button
            type="button"
            onClick={() => openEssPortal('overview')}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-[#1f7e9e]/30 text-[#1f7e9e] font-bold text-[11px] flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">My ESS Portal (9:30 AM – 6:00 PM)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#1f7e9e]/10 rounded font-semibold shrink-0">
              ESS
            </span>
          </button>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs"
              />
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-600 font-semibold truncate">{currentUser.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
