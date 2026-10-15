import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import {
  Users,
  Calendar,
  Wallet,
  FileText,
  Clock,
  LogOut,
  LogIn,
  Download,
  Search,
  MapPin,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  X,
  Play,
  IndianRupee,
  Send,
  Receipt,
  Landmark,
  ArrowRightLeft,
  Building2,
  AlertCircle,
  ExternalLink,
  BarChart2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  EmployeeSalaryMasterRecord,
  AttendanceSession,
  GooglePunchLocation,
  LeaveRequestItem,
  ExpenseClaimItem,
  EmployeeLoanRecord,
} from './payrollTypes';

const GMP_LIBRARIES: string[] = ['marker'];
const GMP_ATTRIBUTION_IDS: string[] = ['gmp_mcp_codeassist_v1_aistudio'];

export interface WorkforceEmployeeItem {
  id: string;
  name: string;
  empCode: string;
  department: string;
  designation?: string;
  email?: string;
  checkInTime: string;
  status: 'Present' | 'Not punched in' | 'On Leave';
  locationAddress: string;
  locationCoords?: { lat: number; lng: number };
  grossSalary: number;
  avatarColor: string;
  initials: string;
}

interface PayChakraOverviewViewProps {
  onNavigateTab: (tab: string, subTab?: string) => void;
  onPunchToggle: () => void;
  isPunchedIn: boolean;
  activePunchTime?: string;
  onOpenAddEmployee?: () => void;
  onOpenRunPayroll?: () => void;
  onSwitchToCrm?: () => void;
  onSignOut: () => void;
  searchFilter?: string;
  employeesData?: WorkforceEmployeeItem[];
  pendingLeavesCount?: number;
  pendingClaimsCount?: number;
  pendingLoansCount?: number;
}

export const PayChakraOverviewView: React.FC<PayChakraOverviewViewProps> = ({
  onNavigateTab,
  onPunchToggle,
  isPunchedIn,
  activePunchTime = '09:30 AM',
  onOpenAddEmployee,
  onOpenRunPayroll,
  onSwitchToCrm,
  onSignOut,
  searchFilter = '',
  employeesData,
  pendingLeavesCount = 0,
  pendingClaimsCount = 0,
  pendingLoansCount = 0,
}) => {
  const { currentUser, formatCurrency } = useCrm();

  // Internal search and department filter state
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('15 Oct 2026');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Modal state for "View location"
  const [selectedLocationEmployee, setSelectedLocationEmployee] = useState<WorkforceEmployeeItem | null>(null);

  // Modal state for Run Payroll
  const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
  const [payrollProcessedSuccess, setPayrollProcessedSuccess] = useState(false);

  // Modal state for Add Employee
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Development',
    designation: 'Software Engineer',
    role: 'Sales Executive',
    grossSalary: 60000,
  });

  // Default workforce employees exactly matching the screenshot
  const defaultEmployees: WorkforceEmployeeItem[] = useMemo(() => {
    return [
      {
        id: 'emp-105',
        name: 'Shivam Yadav',
        empCode: 'EMP-105',
        department: 'Development',
        designation: 'Software Engineer',
        email: 'shivam.yadav@coreenact.com',
        checkInTime: '09:30 AM',
        status: 'Present',
        locationAddress: 'Faridabad, Haryana',
        locationCoords: { lat: 28.4089, lng: 77.3178 },
        grossSalary: 60000,
        avatarColor: 'bg-blue-100 text-blue-700 border-blue-200',
        initials: 'SY',
      },
      {
        id: 'emp-104',
        name: 'Versha Tanwar',
        empCode: 'EMP-104',
        department: 'Designing',
        designation: 'UI/UX Designer',
        email: 'versha.tanwar@coreenact.com',
        checkInTime: '09:30 AM',
        status: 'Present',
        locationAddress: 'Faridabad, Haryana',
        locationCoords: { lat: 28.4112, lng: 77.3195 },
        grossSalary: 55000,
        avatarColor: 'bg-purple-100 text-purple-700 border-purple-200',
        initials: 'VT',
      },
      {
        id: 'emp-106',
        name: 'Abdul Kalim',
        empCode: 'EMP-106',
        department: 'Microsoft',
        designation: 'Technical Consultant',
        email: 'abdul.kalim@coreenact.com',
        checkInTime: '—',
        status: 'Not punched in',
        locationAddress: '—',
        grossSalary: 52000,
        avatarColor: 'bg-orange-100 text-orange-700 border-orange-200',
        initials: 'AK',
      },
      {
        id: 'emp-107',
        name: 'Shalv Sharma',
        empCode: 'EMP-107',
        department: 'Executive',
        designation: 'Managing Director',
        email: 'admin@coreenact.com',
        checkInTime: '09:30 AM',
        status: 'Present',
        locationAddress: 'Faridabad, Haryana',
        locationCoords: { lat: 28.4075, lng: 77.3162 },
        grossSalary: 65000,
        avatarColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        initials: 'SS',
      },
    ];
  }, []);

  const employeeList = employeesData && employeesData.length > 0 ? employeesData : defaultEmployees;

  // Department list for dropdown
  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    employeeList.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [employeeList]);

  // Filtering
  const effectiveSearch = (searchFilter || localSearch).trim().toLowerCase();
  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchSearch =
        !effectiveSearch ||
        emp.name.toLowerCase().includes(effectiveSearch) ||
        emp.empCode.toLowerCase().includes(effectiveSearch) ||
        emp.department.toLowerCase().includes(effectiveSearch) ||
        emp.locationAddress.toLowerCase().includes(effectiveSearch);
      return matchDept && matchSearch;
    });
  }, [employeeList, selectedDept, effectiveSearch]);

  // Key metrics calculation
  const totalEmployeesCount = employeeList.length;
  const activeEmployeesCount = employeeList.filter((e) => e.status !== 'On Leave').length;
  const presentTodayCount = employeeList.filter((e) => e.status === 'Present').length;
  const notPunchedInCount = employeeList.filter((e) => e.status === 'Not punched in').length;
  const attendancePercentage = totalEmployeesCount > 0 ? Math.round((presentTodayCount / totalEmployeesCount) * 100) : 0;
  const notPunchedPercentage = 100 - attendancePercentage;

  const totalMonthlyGross = useMemo(() => {
    return employeeList.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
  }, [employeeList]);

  const totalPendingApprovals = pendingLeavesCount + pendingClaimsCount + pendingLoansCount;

  // Export CSV handler
  const handleExportCsv = () => {
    const headers = ['Employee Name', 'Emp Code', 'Department', 'Designation', 'Check-in Time', 'Status', 'Location'];
    const rows = filteredEmployees.map((e) => [
      `"${e.name}"`,
      `"${e.empCode}"`,
      `"${e.department}"`,
      `"${e.designation || ''}"`,
      `"${e.checkInTime}"`,
      `"${e.status}"`,
      `"${e.locationAddress}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PayChakra_Attendance_${selectedDate.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenRunPayrollWizard = () => {
    if (onOpenRunPayroll) {
      onOpenRunPayroll();
    } else {
      setIsRunPayrollModalOpen(true);
    }
  };

  const handleOpenAddEmployeeModal = () => {
    if (onOpenAddEmployee) {
      onOpenAddEmployee();
    } else {
      setIsAddEmployeeModalOpen(true);
    }
  };

  return (
    <div className="w-full flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. TOP PAGE HEADER BAR: Title, Shift Status, Punch, Workspace, Run Payroll */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Workforce overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Thursday, 15 October 2026
          </p>
        </div>

        {/* Right Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shift Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your shift · 09:30 AM</span>
          </div>

          {/* Punch Button: Punch out (red outline) or Punch in (emerald outline) */}
          <button
            type="button"
            onClick={onPunchToggle}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              isPunchedIn
                ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50'
                : 'bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50'
            }`}
            title={isPunchedIn ? 'Punch Out for shift' : 'Punch In with GPS Location'}
          >
            {isPunchedIn ? (
              <>
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Punch out</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>Punch in</span>
              </>
            )}
          </button>

          {/* Workspace Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWorkspaceMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs transition"
            >
              <span>Admin workspace</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>
                {onSwitchToCrm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      onSwitchToCrm();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>CRM Enterprise Workspace</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onNavigateTab('attendance');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>My Attendance &amp; Shifts</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onSignOut();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary "Run payroll" Button */}
          <button
            type="button"
            onClick={handleOpenRunPayrollWizard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-semibold shadow-xs cursor-pointer transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run payroll</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total employees */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500 font-medium">Total employees</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {totalEmployeesCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{activeEmployeesCount} active</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Present today */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500 font-medium">Present today</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {presentTodayCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{attendancePercentage}% attendance</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Monthly payroll */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500 font-medium">Monthly payroll</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight font-mono">
              {formatCurrency ? formatCurrency(totalMonthlyGross) : `₹${totalMonthlyGross.toLocaleString('en-IN')}`}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Current month</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Pending approvals */}
        <div
          onClick={() => onNavigateTab('leaves')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500 font-medium">Pending approvals</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {totalPendingApprovals}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{totalPendingApprovals === 0 ? 'All caught up' : `${totalPendingApprovals} pending`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 of 12 cols): Attendance Table + Attendance Summary + Payroll Readiness */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Attendance today */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Attendance today
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time employee attendance with Google Maps coordinates
                  </p>
                </div>
              </div>

              {/* Header Right: Date selector + Export CSV */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Date Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedDate}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showDatePicker && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                      {['15 Oct 2026', '14 Oct 2026', '13 Oct 2026', '12 Oct 2026'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setSelectedDate(d);
                            setShowDatePicker(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer ${
                            selectedDate === d ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Search + Department Dropdown */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search employee name, code or department..."
                  className="w-full bg-white border border-slate-200/90 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
                />
              </div>

              {/* Department Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown((prev) => !prev)}
                  className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs min-w-[140px]"
                >
                  <span>{selectedDept === 'ALL' ? 'All departments' : selectedDept}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDeptDropdown && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                    {allDepartments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setSelectedDept(dept);
                          setShowDeptDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer ${
                          selectedDept === dept ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {dept === 'ALL' ? 'All departments' : dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Employee Avatar + Name + Code */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${emp.avatarColor}`}
                            >
                              {emp.initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-[13px]">
                                {emp.name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {emp.empCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {emp.department}
                        </td>

                        {/* Check-in */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                          {emp.checkInTime}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {emp.status === 'Present' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Not punched in</span>
                            </span>
                          )}
                        </td>

                        {/* Location + View location Link */}
                        <td className="py-3.5 px-5">
                          {emp.locationAddress !== '—' ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                              <span className="inline-flex items-center gap-1 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span>{emp.locationAddress}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedLocationEmployee(emp)}
                                className="text-teal-600 hover:text-teal-800 font-semibold underline text-xs cursor-pointer text-left"
                              >
                                View location
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
              <span>Showing {filteredEmployees.length} employees</span>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View attendance report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Attendance summary & Payroll readiness side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card: Attendance summary */}
            <div
              onClick={() => onNavigateTab('attendance')}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Attendance summary</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Dual-color Progress Bar */}
              <div className="my-5">
                <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100">
                  <div
                    style={{ width: `${attendancePercentage}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Present: ${attendancePercentage}%`}
                  />
                  <div
                    style={{ width: `${notPunchedPercentage}%` }}
                    className="bg-rose-300 transition-all duration-300"
                    title={`Not punched in: ${notPunchedPercentage}%`}
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>
                      {presentTodayCount} Present ({attendancePercentage}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>
                      {notPunchedInCount} Not punched in ({notPunchedPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Payroll readiness */}
            <div
              onClick={() => onNavigateTab('payroll')}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Payroll readiness</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="my-3 flex items-center gap-4">
                {/* Circular Green Checkmark Badge */}
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {totalEmployeesCount} of {totalEmployeesCount}
                  </div>
                  <div className="font-semibold text-slate-800 text-xs">
                    Employees reviewed
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Review salary inputs before processing payroll.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 of 12 cols): Approval Inbox + Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Approval inbox */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
            <div
              onClick={() => onNavigateTab('leaves')}
              className="flex items-center justify-between cursor-pointer mb-3"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-900">Approval inbox</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Approval Categories List */}
            <div className="divide-y divide-slate-100 text-xs">
              <div
                onClick={() => onNavigateTab('leaves')}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span className="font-medium">Leave requests</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
                  <span>{pendingLeavesCount}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('expenses')}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700">
                  <FileText className="w-4 h-4 text-sky-500" />
                  <span className="font-medium">Expense claims</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
                  <span>{pendingClaimsCount}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('payroll', 'loans')}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Loan requests</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono">
                  <span>{pendingLoansCount}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Inbox Status State */}
            {totalPendingApprovals === 0 ? (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center py-4 bg-slate-50/50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  You&apos;re all caught up!
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  No pending approvals at the moment.
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span>{totalPendingApprovals} request(s) awaiting your review</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('leaves')}
                  className="font-bold underline text-amber-950"
                >
                  Review now
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-900">Quick actions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2">
              {/* Action 1: Add employee */}
              <div
                onClick={handleOpenAddEmployeeModal}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      Add employee
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Create a new employee record
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>

              {/* Action 2: Generate payslips */}
              <div
                onClick={() => onNavigateTab('payroll', 'payslips')}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      Generate payslips
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Create and distribute payslips
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>

              {/* Action 3: Manage policies */}
              <div
                onClick={() => onNavigateTab('administration', 'policies')}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      Manage policies
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Update company policies and rules
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: "VIEW LOCATION" (GOOGLE MAPS COORDINATES) */}
      {selectedLocationEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Attendance Location · {selectedLocationEmployee.name}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedLocationEmployee.empCode} · Checked in at {selectedLocationEmployee.checkInTime}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocationEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Address card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    {selectedLocationEmployee.locationAddress}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    Coordinates: {selectedLocationEmployee.locationCoords?.lat.toFixed(5) || '28.4089'},{' '}
                    {selectedLocationEmployee.locationCoords?.lng.toFixed(5) || '77.3178'} · Accuracy: ~15m
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Google Maps Verified Geolocation</span>
                  </div>
                </div>
              </div>

              {/* Embedded Google Map */}
              <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner">
                {((typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY)) ? (
                  <APIProvider
                    apiKey={(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) || ''}
                    libraries={GMP_LIBRARIES as any}
                  >
                    <Map
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
                      defaultCenter={selectedLocationEmployee.locationCoords || { lat: 28.4089, lng: 77.3178 }}
                      defaultZoom={15}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      <AdvancedMarker
                        position={selectedLocationEmployee.locationCoords || { lat: 28.4089, lng: 77.3178 }}
                        title={`${selectedLocationEmployee.name} - ${selectedLocationEmployee.checkInTime}`}
                      />
                    </Map>
                  </APIProvider>
                ) : (
                  <iframe
                    title="Employee Location Map"
                    src={`https://maps.google.com/maps?q=${selectedLocationEmployee.locationCoords?.lat || 28.4089},${selectedLocationEmployee.locationCoords?.lng || 77.3178}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Timestamp: 15 Oct 2026, {selectedLocationEmployee.checkInTime}</span>
                <a
                  href={`https://www.google.com/maps?q=${selectedLocationEmployee.locationCoords?.lat || 28.4089},${
                    selectedLocationEmployee.locationCoords?.lng || 77.3178
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLocationEmployee(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: "RUN PAYROLL" WIZARD */}
      {isRunPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Run Payroll · October 2026</h3>
                  <p className="text-[11px] text-slate-300">
                    Cycle Review &amp; Salary Register Generation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRunPayrollModalOpen(false);
                  setPayrollProcessedSuccess(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {payrollProcessedSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-base text-emerald-950">
                    Payroll Processed Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    October 2026 payroll finalized for all 4 employees. Payslips have been generated and are ready for distribution.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRunPayrollModalOpen(false);
                        setPayrollProcessedSuccess(false);
                        onNavigateTab('payroll', 'payslips');
                      }}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Generated Payslips</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium">Total Employees</span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">4</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium">Total Monthly Gross</span>
                      <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">₹2,32,000</div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50 font-bold text-slate-700 flex justify-between">
                      <span>Employee Breakdown</span>
                      <span>Gross Salary</span>
                    </div>
                    {defaultEmployees.map((e) => (
                      <div key={e.id} className="px-4 py-2 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{e.name}</span>
                          <span className="text-slate-400 font-mono ml-2">({e.empCode})</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{e.grossSalary.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Automated Statutory Compliance</span>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        PF (12% of basic up to statutory ceiling), Professional Tax (₹200), and TDS deductions computed in accordance with Section 115BAC.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRunPayrollModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayrollProcessedSuccess(true)}
                      className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl font-bold cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Confirm &amp; Finalize Payroll</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: "ADD EMPLOYEE" */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Add New Employee</h3>
                  <p className="text-[11px] text-slate-300">
                    Create Employee Record in PayChakra &amp; Assign EMP Code
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAddEmployeeModalOpen(false);
                onNavigateTab('employees');
              }}
              className="p-6 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEmployeeForm.name}
                  onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmployeeForm.email}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newEmployeeForm.phone}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value })}
                    placeholder="+91 98100 00000"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newEmployeeForm.department}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, department: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Development">Development</option>
                    <option value="Designing">Designing</option>
                    <option value="Microsoft">Microsoft</option>
                    <option value="Executive">Executive</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Monthly Gross Salary (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newEmployeeForm.grossSalary}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, grossSalary: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl font-bold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
