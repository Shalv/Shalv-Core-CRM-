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
            {/* Official PayChakra Brand Logo from Picture 1.png */}
            <div className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform drop-shadow-sm flex items-center justify-center">
              <svg className="w-10 h-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pchk-swirl-cyan" x1="25" y1="110" x2="120" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="45%" stopColor="#00A0FF" />
                    <stop offset="100%" stopColor="#0052FF" />
                  </linearGradient>
                  <linearGradient id="pchk-swirl-pink" x1="100" y1="20" x2="175" y2="105" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="35%" stopColor="#7C3AED" />
                    <stop offset="70%" stopColor="#D946EF" />
                    <stop offset="100%" stopColor="#FF007A" />
                  </linearGradient>
                  <linearGradient id="pchk-swirl-magenta" x1="170" y1="90" x2="90" y2="175" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF1493" />
                    <stop offset="40%" stopColor="#E11D48" />
                    <stop offset="75%" stopColor="#C026D3" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="pchk-swirl-purple" x1="110" y1="175" x2="20" y2="85" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6D28D9" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#00D4FF" />
                  </linearGradient>
                  <linearGradient id="pchk-employee" x1="65" y1="65" x2="125" y2="140" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="40%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="pchk-coin" x1="105" y1="105" x2="142" y2="145" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF2A85" />
                    <stop offset="55%" stopColor="#E11D48" />
                    <stop offset="100%" stopColor="#9F1239" />
                  </linearGradient>
                  <linearGradient id="pchk-node-top" x1="85" y1="0" x2="115" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D2FF" />
                    <stop offset="100%" stopColor="#0066FF" />
                  </linearGradient>
                  <linearGradient id="pchk-node-right" x1="160" y1="80" x2="188" y2="112" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF4081" />
                    <stop offset="100%" stopColor="#E11D48" />
                  </linearGradient>
                  <linearGradient id="pchk-node-bottom" x1="80" y1="155" x2="115" y2="190" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#C026D3" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="pchk-node-left" x1="0" y1="80" x2="30" y2="112" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00F5FF" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
                <g id="chakra-emblem">
                  <path d="M 32 108 C 16 80, 24 45, 52 25 C 72 10, 94 8, 114 12 C 86 16, 60 30, 48 54 C 36 78, 42 102, 54 120 C 44 118, 37 114, 32 108 Z" fill="url(#pchk-swirl-cyan)" />
                  <path d="M 98 14 C 132 12, 164 28, 178 58 C 188 78, 185 102, 176 122 C 174 94, 160 70, 136 56 C 112 42, 88 46, 70 56 C 76 44, 86 28, 98 14 Z" fill="url(#pchk-swirl-pink)" />
                  <path d="M 174 92 C 188 122, 178 156, 150 174 C 130 188, 106 189, 86 184 C 114 180, 138 166, 150 142 C 162 118, 156 94, 144 76 C 154 78, 166 84, 174 92 Z" fill="url(#pchk-swirl-magenta)" />
                  <path d="M 106 184 C 70 186, 38 170, 24 140 C 14 120, 16 96, 26 76 C 28 104, 42 128, 66 142 C 90 156, 114 152, 132 142 C 126 154, 116 170, 106 184 Z" fill="url(#pchk-swirl-purple)" />

                  <circle cx="106" cy="18" r="14.5" fill="url(#pchk-node-top)" />
                  <circle cx="180" cy="98" r="14.5" fill="url(#pchk-node-right)" />
                  <circle cx="102" cy="178" r="14.5" fill="url(#pchk-node-bottom)" />
                  <circle cx="24" cy="98" r="14.5" fill="url(#pchk-node-left)" />

                  <circle cx="98" cy="74" r="17.5" fill="url(#pchk-employee)" />
                  <path d="M 68 136 C 66 116, 80 102, 98 102 C 116 102, 130 116, 128 136 C 124 140, 72 140, 68 136 Z" fill="url(#pchk-employee)" />

                  <circle cx="124" cy="128" r="18.5" fill="url(#pchk-coin)" stroke="#ffffff" strokeWidth="2.5" />
                  <g transform="translate(116, 117)" stroke="#ffffff" fill="#ffffff">
                    <line x1="1" y1="3" x2="14" y2="3" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="1" y1="7.2" x2="11.5" y2="7.2" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 4 3 L 4 12 C 7 12, 11 11, 11 7.2 C 11 4, 8 3, 4 3 Z" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="4.5" y1="12" x2="13.5" y2="20.5" strokeWidth="2.4" strokeLinecap="round" />
                  </g>
                </g>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-xl tracking-tight flex items-center">
                <span className="text-white">Pay</span>
                <span className="bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  Chakra
                </span>
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

      {/* 2. SUB-NAVIGATION TAB BAR (Responsive dropdown for small screens, clean desktop navigation) */}
      <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between" ref={navDropdownRef}>
        {/* Mobile / Tablet Dropdown Selector — Zero Header Scrolling */}
        <div className="block xl:hidden w-full py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Active Section:</span>
            <select
              value={activeTab}
              onChange={(e) => onSelectTab(e.target.value as PayChakraTab)}
              aria-label="Select Payroll Section"
              className="w-full header-dropdown-select bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer transition"
            >
              <option value="overview">🏠 Overview Dashboard</option>
              <option value="employees">👥 Employees Directory & Masters</option>
              <option value="attendance">📅 Attendance & Clock In/Out</option>
              <option value="leaves">📄 Leave Management & Approvals</option>
              <option value="payroll">💰 Monthly Payroll & Salary Slips</option>
              <option value="expenses">🧾 Expense Claims & Reimbursements</option>
              <option value="reports">📊 Reports & Analytics</option>
              <option value="administration">⚙️ Administration & HR Policies</option>
            </select>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-1 sm:gap-2">
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
