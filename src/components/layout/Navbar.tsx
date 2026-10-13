import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Bell,
  Search,
  Plus,
  RotateCcw,
  User,
  ShieldCheck,
  Check,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  UserCheck,
  Calendar,
  LogOut,
  Settings,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Menu,
  Camera,
  Upload,
  Trash2,
  Send,
  ExternalLink,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { UserRole } from '../../types';
import { UserAvatar, isImageAvatar, optimizeProfileImageFile } from '../common/UserAvatar';
import { PayrollEssPortalModal, EssTabKey } from '../payroll/PayrollEssPortalModal';

interface NavbarProps {
  onOpenCreateLead: () => void;
  onOpenCreateOrder: () => void;
  onOpenRecordPayment: () => void;
  onOpenScheduleActivity: () => void;
  onNavigate: (module: string, itemId?: string) => void;
  onToggleSidebar?: () => void;
  isSidebarPinned?: boolean;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateLead,
  onOpenCreateOrder,
  onOpenRecordPayment,
  onOpenScheduleActivity,
  onNavigate,
  onToggleSidebar,
  isSidebarPinned = true,
  isSidebarOpen = false,
}) => {
  const {
    currentUser,
    loginAsUser,
    logout,
    updateCurrentUserProfile,
    changeEmployeePassword,
    users,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    outlookEmailConfig,
    updateOutlookEmailConfig,
    sendNotificationToOutlookEmail,
    sendTestOutlookEmail,
    sendAllNotificationsToOutlook,
    resetAllToSampleData,
    leads,
    opportunities,
    customers,
    orders,
    invoices,
    canView,
    canCreate,
  } = useCrm();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [isPayrollEssOpen, setIsPayrollEssOpen] = useState(false);
  const [payrollInitialTab, setPayrollInitialTab] = useState<EssTabKey>('overview');

  useEffect(() => {
    const handleOpenEss = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: EssTabKey }>;
      setPayrollInitialTab(customEvent.detail?.tab || 'overview');
      setIsPayrollEssOpen(true);
    };
    window.addEventListener('open-payroll-ess-portal', handleOpenEss);
    return () => {
      window.removeEventListener('open-payroll-ess-portal', handleOpenEss);
    };
  }, []);
  const profilePhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    username: currentUser.username || '',
    email: currentUser.email,
    phone: currentUser.phone || '',
    designation: currentUser.designation || '',
    location: currentUser.location || '',
    password: '',
    department: currentUser.department,
    role: currentUser.role,
    avatar: currentUser.avatar || '',
  });

  // Keep profile form state in sync whenever currentUser changes (e.g. updated by Admin)
  useEffect(() => {
    setProfileForm({
      name: currentUser.name || '',
      username: currentUser.username || currentUser.email?.split('@')[0] || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      designation: currentUser.designation || currentUser.role || '',
      location: currentUser.location || '',
      password: '',
      department: currentUser.department,
      role: currentUser.role,
      avatar: currentUser.avatar || '',
    });
  }, [currentUser]);

  const openProfileModal = () => {
    setProfileForm({
      name: currentUser.name,
      username: currentUser.username || currentUser.email.split('@')[0],
      email: currentUser.email,
      phone: currentUser.phone || '+91 98100 00000',
      designation: currentUser.designation || currentUser.role,
      location: currentUser.location || 'New Delhi HQ',
      password: '',
      department: currentUser.department,
      role: currentUser.role,
      avatar: currentUser.avatar || '',
    });
    setShowUserMenu(false);
    setIsProfileModalOpen(true);
  };

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    optimizeProfileImageFile(file, (dataUrl) => {
      setProfileForm((prev) => ({ ...prev, avatar: dataUrl }));
      updateCurrentUserProfile({ avatar: dataUrl });
    });
    e.target.value = '';
  };

  const handleRemoveProfilePhoto = () => {
    setProfileForm((prev) => ({ ...prev, avatar: '' }));
    updateCurrentUserProfile({ avatar: '' });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const { password, ...restProfile } = profileForm;
    const trimmedPassword = password.trim();
    updateCurrentUserProfile({
      ...restProfile,
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
    });
    if (trimmedPassword) {
      changeEmployeePassword(currentUser.id || currentUser.email, trimmedPassword);
    }
    window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
    setIsProfileModalOpen(false);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOutlookModalOpen, setIsOutlookModalOpen] = useState(false);
  const [outlookStatusBanner, setOutlookStatusBanner] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Search matches (filtered by module view permissions)
  const matchedLeads =
    searchQuery.trim() && canView('leads')
      ? leads
          .filter(
            (l) =>
              l.leadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
      : [];

  const matchedOpportunities =
    searchQuery.trim() && canView('opportunities')
      ? opportunities
          .filter(
            (o) =>
              o.opportunityNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.opportunityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
      : [];

  const matchedCustomers =
    searchQuery.trim() && canView('customers')
      ? customers
          .filter(
            (c) =>
              c.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
      : [];

  const matchedOrders =
    searchQuery.trim() && canView('orders')
      ? orders
          .filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
      : [];

  const matchedInvoices =
    searchQuery.trim() && canView('invoices')
      ? invoices
          .filter(
            (i) =>
              i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.customerName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 3)
      : [];

  const hasSearchResults =
    matchedLeads.length > 0 ||
    matchedOpportunities.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedOrders.length > 0 ||
    matchedInvoices.length > 0;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Show compact menu icon button only when sidebar is hidden/closed */}
        {onToggleSidebar && !isSidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`${
              isSidebarPinned ? 'lg:hidden ' : 'inline-flex '
            }items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shrink-0`}
            title="Open Navigation Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads, customers, orders, invoices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchQuery.trim() && (
            <div
              className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs max-h-80 overflow-y-auto"
              onMouseLeave={() => setShowSearchResults(false)}
            >
              {!hasSearchResults ? (
                <div className="p-3 text-center text-slate-400">No matching records found.</div>
              ) : (
                <div className="space-y-2">
                  {matchedLeads.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Leads</div>
                      {matchedLeads.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            onNavigate('leads', l.id);
                          }}
                          className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-indigo-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{l.companyName}</span>
                          <span className="font-mono text-indigo-600 text-[10px]">{l.leadNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedOpportunities.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Opportunities</div>
                      {matchedOpportunities.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            onNavigate('opportunities', o.id);
                          }}
                          className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-indigo-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 truncate pr-2">{o.opportunityName}</span>
                          <span className="font-mono text-violet-600 text-[10px] shrink-0">{o.opportunityNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedCustomers.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Customers</div>
                      {matchedCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            onNavigate('customers', c.id);
                          }}
                          className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-indigo-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{c.name}</span>
                          <span className="font-mono text-indigo-600 text-[10px]">{c.customerCode}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedOrders.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Sales Orders</div>
                      {matchedOrders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            onNavigate('orders', o.id);
                          }}
                          className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-indigo-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{o.customerName}</span>
                          <span className="font-mono text-amber-600 text-[10px]">{o.orderNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedInvoices.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5">Invoices</div>
                      {matchedInvoices.map((i) => (
                        <div
                          key={i.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            onNavigate('invoices', i.id);
                          }}
                          className="flex justify-between items-center px-2 py-1.5 rounded hover:bg-indigo-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{i.customerName}</span>
                          <span className="font-mono text-emerald-600 text-[10px]">{i.invoiceNumber}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Create Dropdown */}
          {(canCreate('leads') ||
            canCreate('orders') ||
            canCreate('payments') ||
            canCreate('activities')) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                className="flex items-center gap-1.5 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">New Transaction</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </button>

              {showQuickMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                  onMouseLeave={() => setShowQuickMenu(false)}
                >
                  {canCreate('leads') && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenCreateLead();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Create Lead</span>
                    </button>
                  )}
                  {canCreate('orders') && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenCreateOrder();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      <span>New Sales Order</span>
                    </button>
                  )}
                  {canCreate('payments') && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenRecordPayment();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Record Payment</span>
                    </button>
                  )}
                  {canCreate('activities') && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenScheduleActivity();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                    >
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Log / Schedule Activity</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notifications Button (Configured with Outlook Email Routing) */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title={`Notifications • Outlook Email Routing (${outlookEmailConfig.outlookEmail})`}
            >
              <Bell className="w-4 h-4 text-[#1f7e9e]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#1f7e9e]" />
                    <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        setIsOutlookModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-[#1f7e9e] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Mail className="w-3 h-3 text-[#1f7e9e]" />
                      <span>Outlook Setup</span>
                    </button>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Outlook Email Routing Strip */}
                <div className="px-3.5 py-2 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                      <Mail className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                      <span>
                        Outlook Email Routing:{' '}
                        <span
                          className={
                            outlookEmailConfig.enabled ? 'text-emerald-700' : 'text-amber-700'
                          }
                        >
                          {outlookEmailConfig.enabled ? 'Active (All Modules)' : 'Paused'}
                        </span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      To: {outlookEmailConfig.outlookEmail}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const count = await sendAllNotificationsToOutlook();
                      setOutlookStatusBanner(
                        `Dispatched ${count} notification(s) to Outlook (${outlookEmailConfig.outlookEmail}).`
                      );
                      setTimeout(() => setOutlookStatusBanner(null), 4000);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-[10px] shrink-0 flex items-center gap-1 transition cursor-pointer"
                    title="Forward all notifications to Outlook email"
                  >
                    <Send className="w-3 h-3" />
                    <span>Email All</span>
                  </button>
                </div>

                {outlookStatusBanner && (
                  <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{outlookStatusBanner}</span>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 hover:bg-slate-50 transition ${
                          !n.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.linkType) {
                              setShowNotifications(false);
                              onNavigate(
                                n.linkType === 'order'
                                  ? 'orders'
                                  : n.linkType === 'opportunity'
                                  ? 'opportunities'
                                  : n.linkType === 'invoice'
                                  ? 'invoices'
                                  : n.linkType === 'milestone'
                                  ? 'milestones'
                                  : n.linkType === 'payment'
                                  ? 'payments'
                                  : n.linkType === 'customer'
                                  ? 'customers'
                                  : n.linkType === 'support'
                                  ? 'support'
                                  : n.linkType === 'masters'
                                  ? 'masters'
                                  : 'leads',
                                n.linkId
                              );
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-800 mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-tight">{n.message}</p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <Mail className="w-2.5 h-2.5 text-[#1f7e9e]" />
                            <span>
                              {n.emailStatus || 'Skipped'} •{' '}
                              {n.emailRecipient || outlookEmailConfig.outlookEmail}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendNotificationToOutlookEmail(n, true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1f7e9e] hover:underline shrink-0 cursor-pointer"
                            title="Open or send this notification in Microsoft Outlook"
                          >
                            <ExternalLink className="w-3 h-3 text-[#1f7e9e]" />
                            <span>Open in Outlook</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data button — Hidden for employee logins; only available to root Super Admin */}
          {currentUser.role === 'Super Admin' &&
            currentUser.id === 'usr-1' &&
            currentUser.accessScope !== 'payroll_only' &&
            currentUser.accessType !== 'payroll_only' && (
              <button
                onClick={() => {
                  if (confirm('Reset all CRM data to pristine initial demo state?')) {
                    resetAllToSampleData();
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Reset to Sample Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

          {/* User Profile & Login/Logout Switcher */}
          <div className="relative border-l border-slate-200 pl-2 sm:pl-3 flex items-center gap-1.5">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition text-left"
            >
              <UserAvatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">{currentUser.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-[340px] sm:w-[360px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 text-xs"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                {/* Current User Profile Header */}
                <div className="p-4 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <UserAvatar
                        name={currentUser.name}
                        avatar={currentUser.avatar}
                        className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm ring-2 ring-white shadow-sm"
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                        title="Active Session"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        {currentUser.email}
                      </div>
                      <div className="text-xs mt-1 truncate">
                        <span className="font-semibold text-[#1f7e9e]">{currentUser.role}</span>
                        <span aria-hidden="true" className="mx-1.5 text-slate-300">
                          ·
                        </span>
                        <span className="text-slate-600 font-medium">{currentUser.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Row */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <button
                      type="button"
                      onClick={openProfileModal}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 whitespace-nowrap shadow-2xs transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                      <span>My Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="px-3 py-2 bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Payroll Application / ESS Portal Button in User Profile Card */}
                  <div className="mt-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setPayrollInitialTab('overview');
                        setIsPayrollEssOpen(true);
                      }}
                      className="w-full px-3 py-2.5 bg-gradient-to-r from-[#1f7e9e]/10 to-sky-50 hover:from-[#1f7e9e]/20 hover:to-sky-100/80 text-slate-900 border border-[#1f7e9e]/30 rounded-xl font-bold text-xs flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Wallet className="w-4 h-4 text-[#1f7e9e] shrink-0" />
                        <span className="truncate">Payroll (ESS Portal)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#1f7e9e] text-white text-[10px] font-bold shrink-0">
                        Open ESS
                      </span>
                    </button>

                    {(currentUser.role === 'Super Admin' ||
                      currentUser.role === 'Administrator' ||
                      canView('masters')) && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setPayrollInitialTab('admin_dashboard');
                            setIsPayrollEssOpen(true);
                          }}
                          className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Admin Dashboard &amp; GPS Reports</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-bold shrink-0">
                            Attendance &amp; Info
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setPayrollInitialTab('admin_master');
                            setIsPayrollEssOpen(true);
                          }}
                          className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Admin Payroll &amp; ESS Master</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold shrink-0">
                            Admin Control
                          </span>
                        </button>
                      </>
                    )}

                    {canView('masters') && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('masters', 'permissions');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 rounded-xl font-semibold text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                          <span className="truncate">Role Permissions Matrix (RBAC)</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 shrink-0">View</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Switch User Section (Super Admin Only) */}
                {currentUser.role === 'Super Admin' && (
                  <>
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        Switch User Login Profile
                      </span>
                      {canView('masters') && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('masters');
                          }}
                          className="text-[11px] text-[#1f7e9e] hover:underline font-semibold shrink-0 cursor-pointer"
                        >
                          Edit Users
                        </button>
                      )}
                    </div>

                    {/* User Switcher List */}
                    <div className="py-1 max-h-64 overflow-y-auto divide-y divide-slate-100/80">
                      {users.map((u) => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={u.status === 'Inactive'}
                            onClick={() => {
                              loginAsUser(u.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition cursor-pointer ${
                              isCurrent ? 'bg-sky-50/40' : ''
                            } ${u.status === 'Inactive' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <UserAvatar
                                name={u.name}
                                avatar={u.avatar}
                                className="w-9 h-9 rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-xs truncate">
                                  {u.name}
                                  {u.status === 'Inactive' && (
                                    <span className="text-[10px] font-medium text-slate-400 ml-1.5">
                                      · Inactive
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] truncate mt-0.5">
                                  <span className="font-semibold text-[#1f7e9e]">{u.role}</span>
                                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                                    ·
                                  </span>
                                  <span className="text-slate-500">{u.department}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-4 h-4 text-[#1f7e9e] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* MY LOGIN PROFILE MODAL (Rendered outside backdrop-blur header so fixed positioning centers in viewport) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={profileForm.name || currentUser.name}
                  avatar={profileForm.avatar || currentUser.avatar}
                  className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold text-sm ring-2 ring-white/20 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    My Login Profile &amp; Credentials
                  </h3>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    Update your profile picture, contact details, role, and login password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="p-6 space-y-4 text-xs overflow-y-auto flex-1"
            >
              {/* User Profile Picture Upload Studio */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="relative group cursor-pointer shrink-0"
                    title="Click to upload profile picture"
                  >
                    <UserAvatar
                      name={profileForm.name || currentUser.name}
                      avatar={profileForm.avatar}
                      className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-base border-2 border-white shadow-sm"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs">Profile Picture</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Upload a photo (PNG, JPG, WebP) for your user profile across the CRM.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                    onChange={handleProfilePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#1f7e9e]" />
                    <span>{isImageAvatar(profileForm.avatar) ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {isImageAvatar(profileForm.avatar) && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePhoto}
                      className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
                      title="Remove profile photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Office Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={profileForm.role}
                    disabled={currentUser.role !== 'Super Admin'}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as UserRole })}
                    className={`w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e] ${
                      currentUser.role !== 'Super Admin' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Finance Executive">Finance Executive</option>
                    <option value="Management/Viewer">Management/Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value as any })}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Login Password (Optional)</label>
                  <div className="relative">
                    <input
                      type={showProfilePassword ? 'text' : 'password'}
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 pr-14 text-xs font-mono font-bold text-[#1f7e9e] outline-none focus:ring-2 focus:ring-[#1f7e9e]/20 focus:border-[#1f7e9e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer select-none"
                    >
                      {showProfilePassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Enter a new password and click Save to update your password for further logins.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsPayrollEssOpen(true);
                    }}
                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-[#1f7e9e] font-bold rounded-xl border border-sky-200 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>Payroll (ESS Portal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      logout();
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-semibold rounded-xl shadow-sm whitespace-nowrap transition cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUTLOOK EMAIL NOTIFICATION CONFIGURATION MODAL */}
      {isOutlookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1f7e9e]/20 border border-[#1f7e9e]/40 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#1f7e9e]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Microsoft Outlook Email Notification Center</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {outlookEmailConfig.enabled ? 'All Alerts Active' : 'Paused'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Route all CRM notifications (Leads, Orders, Invoices, Payments, Milestones &amp; Support) directly to your Outlook inbox.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOutlookModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {outlookStatusBanner && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{outlookStatusBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOutlookStatusBanner(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Master Enable Toggle */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Forward All CRM Notifications to Microsoft Outlook</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Automatically dispatches real-time email alerts via Office 365 / Outlook SMTP ({outlookEmailConfig.smtpHost}:{outlookEmailConfig.smtpPort}) whenever any CRM event occurs.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={outlookEmailConfig.enabled}
                    onChange={(e) =>
                      updateOutlookEmailConfig({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#1f7e9e]"
                  />
                  <span className="font-bold text-slate-900">
                    {outlookEmailConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Outlook Account & Server Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Your Outlook Email Address (Recipient / Account) *
                  </label>
                  <input
                    type="email"
                    value={outlookEmailConfig.outlookEmail}
                    onChange={(e) =>
                      updateOutlookEmailConfig({ outlookEmail: e.target.value })
                    }
                    placeholder="you@outlook.com or name@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    CC Email Address(es) (Optional)
                  </label>
                  <input
                    type="text"
                    value={outlookEmailConfig.ccEmails}
                    onChange={(e) =>
                      updateOutlookEmailConfig({ ccEmails: e.target.value })
                    }
                    placeholder="finance@company.com, sales@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Outlook Provider Preset
                  </label>
                  <select
                    value={outlookEmailConfig.serverType}
                    onChange={(e) => {
                      const serverType = e.target.value as 'office365' | 'outlook_personal';
                      updateOutlookEmailConfig({
                        serverType,
                        smtpHost:
                          serverType === 'office365'
                            ? 'smtp.office365.com'
                            : 'smtp-mail.outlook.com',
                        smtpPort: 587,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="office365">
                      Microsoft 365 / Office 365 Business (smtp.office365.com:587)
                    </option>
                    <option value="outlook_personal">
                      Outlook.com / Hotmail / Live (smtp-mail.outlook.com:587)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    SMTP Host &amp; Port (STARTTLS)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={outlookEmailConfig.smtpHost}
                      onChange={(e) =>
                        updateOutlookEmailConfig({ smtpHost: e.target.value })
                      }
                      className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <input
                      type="number"
                      value={outlookEmailConfig.smtpPort}
                      onChange={(e) =>
                        updateOutlookEmailConfig({ smtpPort: Number(e.target.value) })
                      }
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#1f7e9e]"
                    />
                  </div>
                </div>
              </div>

              {/* Microsoft Entra ID (Azure App Registration) Essentials */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      Essentials — Microsoft Entra App Registration ({outlookEmailConfig.appDisplayName || 'Enact360'})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {outlookEmailConfig.appState || 'Activated'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Managed application: <strong className="text-slate-800">{outlookEmailConfig.managedApplication || 'Enact360'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={outlookEmailConfig.appDisplayName || 'Enact360'}
                      onChange={(e) =>
                        updateOutlookEmailConfig({
                          appDisplayName: e.target.value,
                          managedApplication: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Supported account types
                    </label>
                    <input
                      type="text"
                      value={outlookEmailConfig.supportedAccountTypes || 'My organization only'}
                      onChange={(e) =>
                        updateOutlookEmailConfig({ supportedAccountTypes: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Application (client) ID
                    </label>
                    <input
                      type="text"
                      value={
                        outlookEmailConfig.clientId || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a'
                      }
                      onChange={(e) => updateOutlookEmailConfig({ clientId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Object ID
                    </label>
                    <input
                      type="text"
                      value={
                        outlookEmailConfig.objectId || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f'
                      }
                      onChange={(e) => updateOutlookEmailConfig({ objectId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Directory (tenant) ID
                    </label>
                    <input
                      type="text"
                      value={
                        outlookEmailConfig.tenantId || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733'
                      }
                      onChange={(e) => updateOutlookEmailConfig({ tenantId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Redirect URIs
                    </label>
                    <input
                      type="text"
                      value={
                        outlookEmailConfig.redirectUriConfig || '1 web, 0 spa, 0 public client'
                      }
                      onChange={(e) =>
                        updateOutlookEmailConfig({ redirectUriConfig: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700"
                    />
                  </div>
                </div>
              </div>

              {/* Per-Module Notification Triggers */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Configured CRM Modules Routing to Outlook Email
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateOutlookEmailConfig({
                        enabled: true,
                        notifyOnLead: true,
                        notifyOnOpportunity: true,
                        notifyOnOrder: true,
                        notifyOnInvoice: true,
                        notifyOnPayment: true,
                        notifyOnMilestone: true,
                        notifyOnSupport: true,
                        notifyOnActivity: true,
                        notifyOnUser: true,
                      })
                    }
                    className="text-[11px] font-bold text-[#1f7e9e] hover:underline cursor-pointer"
                  >
                    Enable All Modules
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'notifyOnLead', label: 'Lead Management Alerts' },
                    { key: 'notifyOnOpportunity', label: 'Opportunity Pipeline' },
                    { key: 'notifyOnOrder', label: 'Sales & Purchase Orders' },
                    { key: 'notifyOnInvoice', label: 'Tax & Proforma Invoices' },
                    { key: 'notifyOnPayment', label: 'Payments & Collections' },
                    { key: 'notifyOnMilestone', label: 'Payment Milestones' },
                    { key: 'notifyOnSupport', label: 'Support & AMC Desk' },
                    { key: 'notifyOnActivity', label: 'Activities & Follow-ups' },
                    { key: 'notifyOnUser', label: 'Users & Access Alerts' },
                  ].map((mod) => (
                    <label
                      key={mod.key}
                      className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-[#1f7e9e]/50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean((outlookEmailConfig as any)[mod.key])}
                        onChange={(e) =>
                          updateOutlookEmailConfig({ [mod.key]: e.target.checked } as any)
                        }
                        className="rounded text-[#1f7e9e]"
                      />
                      <span className="font-semibold text-slate-700 text-[11px]">
                        {mod.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSendingTestEmail}
                    onClick={async () => {
                      setIsSendingTestEmail(true);
                      const res = await sendTestOutlookEmail(outlookEmailConfig.outlookEmail);
                      setIsSendingTestEmail(false);
                      setOutlookStatusBanner(
                        `Test notification email sent to Outlook (${res.recipient})!`
                      );
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSendingTestEmail ? 'Sending to Outlook…' : 'Send Test Email to Outlook'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const count = await sendAllNotificationsToOutlook();
                      setOutlookStatusBanner(
                        `Synced all ${count} CRM notification(s) to Outlook (${outlookEmailConfig.outlookEmail})!`
                      );
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition cursor-pointer"
                  >
                    Sync All ({notifications.length}) Notifications
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateOutlookEmailConfig({
                      ...outlookEmailConfig,
                      appDisplayName: outlookEmailConfig.appDisplayName || 'Enact360',
                      clientId:
                        outlookEmailConfig.clientId || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
                      objectId:
                        outlookEmailConfig.objectId || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
                      tenantId:
                        outlookEmailConfig.tenantId || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
                      supportedAccountTypes:
                        outlookEmailConfig.supportedAccountTypes || 'My organization only',
                      redirectUriConfig:
                        outlookEmailConfig.redirectUriConfig || '1 web, 0 spa, 0 public client',
                      managedApplication: outlookEmailConfig.managedApplication || 'Enact360',
                      appState: 'Activated',
                    });
                    setIsOutlookModalOpen(false);
                  }}
                  className="px-5 py-2 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save &amp; Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PAYROLL & EMPLOYEE SELF-SERVICE (ESS) PORTAL MODAL */}
      <PayrollEssPortalModal
        isOpen={isPayrollEssOpen}
        onClose={() => setIsPayrollEssOpen(false)}
        initialTab={payrollInitialTab}
      />
    </>
  );
};
