import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Users,
  Calendar,
  FileText,
  IndianRupee,
  Receipt,
  BarChart2,
  Settings,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  KeyRound,
  ArrowRightLeft,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Landmark,
  UserPlus,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export type PayChakraTab =
  | 'overview'
  | 'employees'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'expenses'
  | 'reports'
  | 'administration'
  | 'profile';

interface PayChakraHeaderProps {
  activeTab: PayChakraTab;
  onSelectTab: (tab: PayChakraTab, subTab?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSwitchToCrm?: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenRunPayroll?: () => void;
  onOpenAddEmployee?: () => void;
  notificationsCount?: number;
}

export const PayChakraHeader: React.FC<PayChakraHeaderProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onSwitchToCrm,
  onSignOut,
  onOpenProfile,
  onOpenRunPayroll,
  onOpenAddEmployee,
  notificationsCount = 0,
}) => {
  const { currentUser } = useCrm();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials = React.useMemo(() => {
    if (!currentUser?.name) return 'SS';
    const parts = currentUser.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser?.name]);

  return (
    <header className="w-full shrink-0 select-none z-30 sticky top-0">
      {/* 1. TOP NAVY BRAND & GLOBAL UTILITY BAR */}
      <div className="w-full bg-[#0d1829] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-slate-800">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="PayChakra - Workforce Overview"
          >
            {/* Stylized PayChakra Spiral Chakra Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="2.5" strokeDasharray="32 10" className="text-teal-200" />
                <path
                  d="M18 9C13.0294 9 9 13.0294 9 18C9 22.9706 13.0294 27 18 27C21.5 27 24.5 25 26 22"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="18" r="4.5" fill="white" />
                <circle cx="23" cy="13" r="2" fill="#38bdf8" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-lg tracking-tight flex items-center gap-1">
                PayChakra
              </span>
              <span className="text-slate-400 text-[10.5px] font-medium tracking-wide">
                Payroll &amp; HRMS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employees, reports, policies..."
              className="w-full bg-[#1e293b]/90 hover:bg-[#1e293b] focus:bg-[#1e293b] border border-slate-700/80 focus:border-teal-500 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Notification Bell & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-[#0d1829]" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Notifications</span>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-semibold text-xs text-slate-900">Shift Started</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Shift active at 09:30 AM · Faridabad HQ
                    </p>
                    <span className="text-[10px] text-slate-400">15 Oct 2026</span>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-xs text-slate-900">Payroll Cycle Ready</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      October 2026 salary inputs reviewed (4 of 4 employees)
                    </p>
                    <span className="text-[10px] text-slate-400">Current cycle</span>
                  </div>
                  <div className="px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-xs text-slate-900">Policy CS-HR-POL-001</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Standard working Saturday rules verified
                    </p>
                    <span className="text-[10px] text-slate-400">Version 1.0</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Trigger */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/10 shrink-0">
                {userInitials}
              </div>
              <span className="hidden sm:inline font-semibold text-xs text-white max-w-[120px] truncate">
                {currentUser?.name || 'Shalv Sharma'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900">{currentUser?.name || 'Shalv Sharma'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser?.email}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {currentUser?.role || 'Super Admin'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {currentUser?.empCode || 'EMP-107'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>My Profile &amp; Password</span>
                  </button>

                  {onSwitchToCrm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSwitchToCrm();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                      <span>Switch to CRM Workspace</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TAB BAR (White bar with clean icons & dropdowns) */}
      <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none" ref={navDropdownRef}>
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Tab 1: Overview */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'overview' ? 'text-teal-600' : 'text-slate-500'}`} />
            <span>Overview</span>
          </button>

          {/* Tab 2: Employees with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onSelectTab('employees');
                setOpenDropdown((prev) => (prev === 'employees' ? null : 'employees'));
              }}
              className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'employees' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span>Employees</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {openDropdown === 'employees' && (
              <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('employees', 'directory');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span>Employee Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    if (onOpenAddEmployee) onOpenAddEmployee();
                    else onSelectTab('employees', 'add_employee');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Add New Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('employees', 'masters');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-teal-600" />
                  <span>Manage Users &amp; Salary Master</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('employees', 'org_structure');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Org Structure &amp; Departments</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 3: Attendance */}
          <button
            type="button"
            onClick={() => onSelectTab('attendance')}
            className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'attendance' ? 'text-teal-600' : 'text-slate-500'}`} />
            <span>Attendance</span>
          </button>

          {/* Tab 4: Leave Management */}
          <button
            type="button"
            onClick={() => onSelectTab('leaves')}
            className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaves'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'leaves' ? 'text-teal-600' : 'text-slate-500'}`} />
            <span>Leave Management</span>
          </button>

          {/* Tab 5: Payroll with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onSelectTab('payroll');
                setOpenDropdown((prev) => (prev === 'payroll' ? null : 'payroll'));
              }}
              className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'payroll'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <IndianRupee className={`w-4 h-4 ${activeTab === 'payroll' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span>Payroll</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {openDropdown === 'payroll' && (
              <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    if (onOpenRunPayroll) onOpenRunPayroll();
                    else onSelectTab('payroll', 'run_payroll');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
                  <span>Run Payroll / Process</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('payroll', 'payslips');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Payslips &amp; Salary Structure</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('payroll', 'loans');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Landmark className="w-3.5 h-3.5 text-teal-600" />
                  <span>Loan Management &amp; Advances</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('payroll', 'tax');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tax &amp; Statutory (80C / PAN)</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 6: Expenses */}
          <button
            type="button"
            onClick={() => onSelectTab('expenses')}
            className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Receipt className={`w-4 h-4 ${activeTab === 'expenses' ? 'text-teal-600' : 'text-slate-500'}`} />
            <span>Expenses</span>
          </button>

          {/* Tab 7: Reports */}
          <button
            type="button"
            onClick={() => onSelectTab('reports')}
            className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart2 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-teal-600' : 'text-slate-500'}`} />
            <span>Reports</span>
          </button>

          {/* Tab 8: Administration with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onSelectTab('administration');
                setOpenDropdown((prev) => (prev === 'administration' ? null : 'administration'));
              }}
              className={`py-3.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'administration'
                  ? 'border-teal-600 text-teal-700 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'administration' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span>Administration</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {openDropdown === 'administration' && (
              <div className="absolute right-0 mt-1 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('administration', 'policies');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Company HR &amp; Shift Policies</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('administration', 'integrations');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Payroll Integrations (Keka / Greytip)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onSelectTab('administration', 'audit');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Audit Trail &amp; Activity Log</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
