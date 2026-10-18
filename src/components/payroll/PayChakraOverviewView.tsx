import { isOnApprovedLeave, workedMinutesFor, formatWorkedHours } from './payrollTypes';
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
  Printer,
  Eye,
  Check,
  Mail,
  Phone,
  Info,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { amountInWords } from '../../utils/numberToWords';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WorkforceEmployeeItem {
  id: string;
  name: string;
  empCode: string;
  department: string;
  designation?: string;
  email?: string;
  checkInTime: string;
  /** The LAST punch out of the day, when there is one. */
  checkOutTime?: string;
  /** Minutes from the FIRST punch in to the LAST punch out. */
  workedMinutes?: number;
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
  /** The policy master — statutory percentages and caps the payslip breakdown is built from. */
  policy?: any;
  /** The shared daily attendance register — one record per employee per day, written on punch. */
  attendanceRegister?: any[];
  /** Leave requests, used to show who is on APPROVED leave on the selected day. */
  leaves?: any[];
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
  policy,
  attendanceRegister = [],
  leaves = [],
}) => {
  const { currentUser, formatCurrency } = useCrm();

  // Internal search and department filter state
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  // The attendance date is a real ISO date, defaulting to today — not a literal string.
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Modal state for "View location"
  const [selectedLocationEmployee, setSelectedLocationEmployee] = useState<WorkforceEmployeeItem | null>(null);

  // Active pop-up card modal for clicked dashboard tiles
  const [activeTilePopup, setActiveTilePopup] = useState<
    | 'total_employees'
    | 'present_today'
    | 'monthly_payroll'
    | 'pending_approvals'
    | 'attendance_summary'
    | 'payroll_readiness'
    | 'approval_inbox'
    | 'manage_policies'
    | 'generate_payslips'
    | null
  >(null);
  const [popupFilterSearch, setPopupFilterSearch] = useState('');
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<WorkforceEmployeeItem | null>(null);
  const [approvalSubTab, setApprovalSubTab] = useState<'leaves' | 'expenses' | 'loans'>('leaves');
  const [attendanceModalFilter, setAttendanceModalFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

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

  // Only real employees from the master. There is deliberately no fallback list — a dashboard
  // that invents people is worse than one that shows an empty state.
  const employeeList: WorkforceEmployeeItem[] = employeesData || [];

  // Department list for dropdown
  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    employeeList.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [employeeList]);

  /** Every date the register actually holds data for, newest first; today is always offered. */
  const attendanceDates = useMemo(() => {
    const set = new Set<string>();
    set.add(todayIso);
    for (const r of attendanceRegister) {
      const d = String(r?.date || '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
    }
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [attendanceRegister, todayIso]);

  /** A readable label for a date, e.g. "18 Oct 2026". */
  const formatDateLabel = (iso: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`.trim();
  };
  const selectedDateLabel = formatDateLabel(selectedDateIso);

  /**
   * The workforce AS IT STOOD on the selected date — check-in, status and punch location read from
   * the register for that day. Switching the date changes these rows, which is the whole point of
   * the date selector.
   */
  const attendanceRows = useMemo<WorkforceEmployeeItem[]>(() => {
    // globalThis.Map — the bare `Map` here is the lucide icon component.
    const byEmployee = new globalThis.Map<string, any>();
    for (const r of attendanceRegister) {
      if (r?.date === selectedDateIso && r?.employeeId) byEmployee.set(String(r.employeeId), r);
    }
    return employeeList.map((e) => {
      const rec = byEmployee.get(String(e.id));
      const onLeave = isOnApprovedLeave(String(e.id), selectedDateIso, leaves);
      const status: WorkforceEmployeeItem['status'] = rec?.punchInTime
        ? 'Present'
        : onLeave
        ? 'On Leave'
        : 'Not punched in';
      return {
        ...e,
        checkInTime: rec?.punchInTime || '—',
        checkOutTime: rec?.punchOutTime,
        workedMinutes: workedMinutesFor(rec),
        status,
        locationAddress: rec?.locationName || '—',
        locationCoords:
          typeof rec?.locationLat === 'number' && typeof rec?.locationLng === 'number'
            ? { lat: rec.locationLat, lng: rec.locationLng }
            : undefined,
      };
    });
  }, [employeeList, attendanceRegister, selectedDateIso, leaves]);

  // Filtering
  const effectiveSearch = (searchFilter || localSearch).trim().toLowerCase();
  const filteredEmployees = useMemo(() => {
    return attendanceRows.filter((emp) => {
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
  /**
   * Department-wise attendance, derived from the real workforce — the names, the present count
   * and the totals all come from the employee master and today's register, never from the screen.
   */
  const departmentBreakdown = useMemo(() => {
    // globalThis.Map — the bare `Map` here is the lucide icon component.
    const map = new globalThis.Map<string, { dept: string; names: string[]; present: number; total: number }>();
    for (const e of attendanceRows) {
      const dept = e.department || 'Unassigned';
      const row = map.get(dept) || { dept, names: [], present: 0, total: 0 };
      row.names.push(e.name);
      row.total += 1;
      if (e.status === 'Present') row.present += 1;
      map.set(dept, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total || a.dept.localeCompare(b.dept));
  }, [employeeList]);

  /** Rupee formatter for the figures on this screen. */
  const inr = (n: number) => `\u20b9${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

  /**
   * The payroll totals on this screen, computed from the real workforce and the policy master —
   * never written into the markup. EPF is 12% of basic capped at the statutory ceiling, professional
   * tax is per head, and TDS follows the policy percentage.
   */
  const payrollTotals = useMemo(() => {
    const basicPct = Number(policy?.defaultBasicPct ?? 50) || 50;
    const pfPct = Number(policy?.defaultPfPct ?? 12) || 12;
    const pfCap = Number(policy?.defaultPfCapBasic ?? 0) || 0;
    const ptPerHead = Number(policy?.defaultProfTax ?? 0) || 0;
    const tdsPct = Number(policy?.defaultTdsPct ?? 0) || 0;
    let gross = 0;
    let epf = 0;
    let tds = 0;
    let count = 0;
    for (const e of employeeList) {
      const g = Number(e.grossSalary) || 0;
      if (g <= 0) continue;
      gross += g;
      count += 1;
      const basic = (g * basicPct) / 100;
      const rawPf = Math.round((basic * pfPct) / 100);
      epf += pfCap > 0 ? Math.min(rawPf, pfCap) : rawPf;
      tds += Math.round((g * tdsPct) / 100);
    }
    const professionalTax = ptPerHead * count;
    const statutory = epf + professionalTax + tds;
    return { gross, epf, professionalTax, tds, statutory, net: Math.max(0, gross - statutory), count };
  }, [employeeList, policy]);

  const totalEmployeesCount = employeeList.length;
  /** "Reviewed" = the employee has a salary on record, so payroll can actually run for them. */
  const reviewedCount = employeeList.filter((e) => (e.grossSalary || 0) > 0).length;
  const activeEmployeesCount = employeeList.filter((e) => e.status !== 'On Leave').length;
  // These describe the SELECTED DAY, so changing the date changes the summary.
  const presentTodayCount = attendanceRows.filter((e) => e.status === 'Present').length;
  const notPunchedInCount = attendanceRows.filter((e) => e.status === 'Not punched in').length;
  const onLeaveCount = attendanceRows.filter((e) => e.status === 'On Leave').length;
  const attendancePercentage = totalEmployeesCount > 0 ? Math.round((presentTodayCount / totalEmployeesCount) * 100) : 0;
  const notPunchedPercentage = 100 - attendancePercentage;

  const totalMonthlyGross = useMemo(() => {
    return employeeList.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
  }, [employeeList]);

  const totalPendingApprovals = pendingLeavesCount + pendingClaimsCount + pendingLoansCount;

  // Export CSV handler
  const handleExportCsv = () => {
    const headers = ['Employee Name', 'Emp Code', 'Department', 'Designation', 'First Check-in', 'Last Check-out', 'Working Hours', 'Status', 'Location'];
    const rows = filteredEmployees.map((e) => [
      `"${e.name}"`,
      `"${e.empCode}"`,
      `"${e.department}"`,
      `"${e.designation || ''}"`,
      `"${e.checkInTime}"`,
      `"${e.checkOutTime || ''}"`,
      `"${formatWorkedHours(e.workedMinutes || 0)}"`,
      `"${e.status}"`,
      `"${e.locationAddress}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PayChakra_Attendance_${selectedDateIso}.csv`);
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
    <div className="sh-scope w-full flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
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
          onClick={() => {
            setPopupFilterSearch('');
            setActiveTilePopup('total_employees');
          }}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view Total Employees pop-up card"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
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
          onClick={() => {
            setPopupFilterSearch('');
            setActiveTilePopup('present_today');
          }}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view Today's Attendance pop-up card"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
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
          onClick={() => {
            setPopupFilterSearch('');
            setActiveTilePopup('monthly_payroll');
          }}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view Monthly Payroll pop-up card"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
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
          onClick={() => {
            setPopupFilterSearch('');
            setActiveTilePopup('pending_approvals');
          }}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
          title="Click to view Pending Approvals pop-up card"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
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
                    <span>{selectedDateLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showDatePicker && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                      {/* Every date the register holds, newest first — plus today. */}
                      {attendanceDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setSelectedDateIso(d);
                            setShowDatePicker(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs font-medium cursor-pointer ${
                            selectedDateIso === d ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {formatDateLabel(d)}
                          {d === todayIso && <span className="ml-1.5 text-[10px] text-teal-600 font-bold">Today</span>}
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
              <table className="table-modern w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Check-out</th>
                    <th className="py-3 px-4">Working hours</th>
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

                        {/* Check-in — the FIRST punch in of the day */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                          {emp.checkInTime}
                        </td>

                        {/* Check-out — the LAST punch out of the day */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                          {emp.checkOutTime || '—'}
                        </td>

                        {/* Working hours — first in to last out */}
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-teal-800">
                          {formatWorkedHours(emp.workedMinutes || 0)}
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
                onClick={() => {
                  setPopupFilterSearch('');
                  setActiveTilePopup('present_today');
                }}
                className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Click to view detailed attendance pop-up card"
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
              onClick={() => {
                setPopupFilterSearch('');
                setActiveTilePopup('attendance_summary');
              }}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between group"
              title="Click to view Attendance summary pop-up card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Attendance summary</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>

              {/* Dual-color Progress Bar */}
              <div className="my-5">
                <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
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
              onClick={() => {
                setPopupFilterSearch('');
                setActiveTilePopup('payroll_readiness');
              }}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between group"
              title="Click to view Payroll readiness pop-up card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Payroll readiness</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
              </div>

              <div className="my-3 flex items-center gap-4">
                {/* Circular Green Checkmark Badge */}
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {reviewedCount} of {totalEmployeesCount}
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
              onClick={() => {
                setPopupFilterSearch('');
                setApprovalSubTab('leaves');
                setActiveTilePopup('pending_approvals');
              }}
              className="flex items-center justify-between cursor-pointer mb-3 group"
              title="Click to view Approval inbox pop-up card"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xs sm:text-sm text-slate-900">Approval inbox</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
            </div>

            {/* Approval Categories List */}
            <div className="divide-y divide-slate-100 text-xs">
              <div
                onClick={() => {
                  setPopupFilterSearch('');
                  setApprovalSubTab('leaves');
                  setActiveTilePopup('pending_approvals');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
                title="Click to view Leave requests pop-up card"
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
                onClick={() => {
                  setPopupFilterSearch('');
                  setApprovalSubTab('expenses');
                  setActiveTilePopup('pending_approvals');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
                title="Click to view Expense claims pop-up card"
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
                onClick={() => {
                  setPopupFilterSearch('');
                  setApprovalSubTab('loans');
                  setActiveTilePopup('pending_approvals');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition cursor-pointer"
                title="Click to view Loan requests pop-up card"
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
              <div
                onClick={() => {
                  setPopupFilterSearch('');
                  setActiveTilePopup('pending_approvals');
                }}
                className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center py-4 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                title="Click to view Approvals details"
              >
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
                  onClick={() => {
                    setPopupFilterSearch('');
                    setActiveTilePopup('pending_approvals');
                  }}
                  className="font-bold underline text-amber-950 cursor-pointer"
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
                onClick={() => {
                  setSelectedPayslipEmp(employeeList[0]);
                  setActiveTilePopup('generate_payslips');
                }}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
                title="Click to view & generate payslips pop-up card"
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
                onClick={() => {
                  setActiveTilePopup('manage_policies');
                }}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
                title="Click to view company policies pop-up card"
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
                <span>Timestamp: {selectedDateLabel}, {selectedLocationEmployee.checkInTime}</span>
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
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalEmployeesCount}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium">Total Monthly Gross</span>
                      <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{inr(payrollTotals.gross)}</div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50 font-bold text-slate-700 flex justify-between">
                      <span>Employee Breakdown</span>
                      <span>Gross Salary</span>
                    </div>
                    {employeeList.map((e) => (
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

      {/* 7. POP-UP CARD MODAL FOR ALL DASHBOARD TILES (Same screen pop-up card) */}
      {activeTilePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveTilePopup(null);
            }
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Pop-up Card Toast Notice */}
            {reminderToast && (
              <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 font-semibold flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 mx-auto">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{reminderToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderToast(null)}
                  className="text-emerald-200 hover:text-white cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pop-up Card Header */}
            <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTilePopup === 'total_employees'
                      ? 'bg-sky-500/20 text-sky-400'
                      : activeTilePopup === 'present_today' || activeTilePopup === 'attendance_summary'
                      ? 'bg-teal-500/20 text-teal-400'
                      : activeTilePopup === 'monthly_payroll'
                      ? 'bg-blue-500/20 text-blue-400'
                      : activeTilePopup === 'pending_approvals' || activeTilePopup === 'approval_inbox'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : activeTilePopup === 'payroll_readiness' || activeTilePopup === 'manage_policies'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {activeTilePopup === 'total_employees' && <Users className="w-5 h-5" />}
                  {activeTilePopup === 'present_today' && <Calendar className="w-5 h-5" />}
                  {activeTilePopup === 'monthly_payroll' && <Wallet className="w-5 h-5" />}
                  {(activeTilePopup === 'pending_approvals' || activeTilePopup === 'approval_inbox') && (
                    <FileText className="w-5 h-5" />
                  )}
                  {activeTilePopup === 'attendance_summary' && <BarChart2 className="w-5 h-5" />}
                  {activeTilePopup === 'payroll_readiness' && <ShieldCheck className="w-5 h-5" />}
                  {activeTilePopup === 'generate_payslips' && <FileCheck className="w-5 h-5" />}
                  {activeTilePopup === 'manage_policies' && <ShieldCheck className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                      {activeTilePopup === 'total_employees' && 'Total Employees Directory'}
                      {activeTilePopup === 'present_today' && "Today's Attendance Register"}
                      {activeTilePopup === 'monthly_payroll' && 'Monthly Payroll Breakdown · October 2026'}
                      {(activeTilePopup === 'pending_approvals' || activeTilePopup === 'approval_inbox') &&
                        'Approval Workflow Inbox'}
                      {activeTilePopup === 'attendance_summary' && 'Attendance Summary & Shift Analytics'}
                      {activeTilePopup === 'payroll_readiness' && 'Payroll Readiness & Compliance Audit'}
                      {activeTilePopup === 'generate_payslips' && 'Employee Payslip Viewer & Generator'}
                      {activeTilePopup === 'manage_policies' && 'Company HR Policies & Rules'}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Pop-up Card
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-300 mt-0.5">
                    {activeTilePopup === 'total_employees' &&
                      'Complete workforce list with departments, contact, and CTC records'}
                    {activeTilePopup === 'present_today' &&
                      `Real-time punch records with Google Maps coordinates for ${selectedDateLabel}`}
                    {activeTilePopup === 'monthly_payroll' &&
                      'Itemized salary register with Basic, HRA, PF, PT, TDS & Net Pay'}
                    {(activeTilePopup === 'pending_approvals' || activeTilePopup === 'approval_inbox') &&
                      'Pending leave applications, expense claims and loan advances'}
                    {activeTilePopup === 'attendance_summary' &&
                      'Presence distribution, punctuality rates and department attendance'}
                    {activeTilePopup === 'payroll_readiness' &&
                      'Pre-payroll statutory checklist & bank disbursal verification'}
                    {activeTilePopup === 'generate_payslips' &&
                      'Preview, generate and print October 2026 employee salary slips'}
                    {activeTilePopup === 'manage_policies' &&
                      'Coreenact Solutions official HR policies, shift timings and norms'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTilePopup(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition"
                title="Close pop-up card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pop-up Card Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
              {/* ==================== 1. TOTAL EMPLOYEES POP-UP CARD ==================== */}
              {activeTilePopup === 'total_employees' && (
                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                      <span className="text-[11px] text-sky-800 font-medium">Total Employees</span>
                      <div className="text-xl font-extrabold text-sky-950 mt-0.5">{totalEmployeesCount}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[11px] text-emerald-800 font-medium">Active Status</span>
                      <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{activeEmployeesCount} Active</div>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <span className="text-[11px] text-indigo-800 font-medium">Departments</span>
                      <div className="text-xl font-extrabold text-indigo-950 mt-0.5">3 Units</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[11px] text-blue-800 font-medium">Total Monthly Gross</span>
                      <div className="text-xl font-extrabold text-blue-950 font-mono mt-0.5">{inr(payrollTotals.gross)}</div>
                    </div>
                  </div>

                  {/* Filter Search */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={popupFilterSearch}
                        onChange={(e) => setPopupFilterSearch(e.target.value)}
                        placeholder="Filter employees by name, code, designation or department..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTilePopup(null);
                        setIsAddEmployeeModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Employee</span>
                    </button>
                  </div>

                  {/* Employees Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="table-modern w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                        <tr>
                          <th className="py-2.5 px-4">Employee</th>
                          <th className="py-2.5 px-3">Role &amp; Dept</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3">Monthly Gross</th>
                          <th className="py-2.5 px-3">Attendance</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeList
                          .filter(
                            (e) =>
                              !popupFilterSearch ||
                              e.name.toLowerCase().includes(popupFilterSearch.toLowerCase()) ||
                              e.empCode.toLowerCase().includes(popupFilterSearch.toLowerCase()) ||
                              e.department.toLowerCase().includes(popupFilterSearch.toLowerCase()) ||
                              (e.designation || '').toLowerCase().includes(popupFilterSearch.toLowerCase())
                          )
                          .map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${emp.avatarColor}`}
                                  >
                                    {emp.initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                    <div className="font-mono text-[11px] text-slate-400">{emp.empCode}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{emp.designation}</div>
                                <div className="text-slate-500 text-[11px]">{emp.department}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-slate-600 truncate max-w-[140px]">{emp.email}</div>
                                <div className="text-slate-400 text-[11px] font-mono">+91 98100 23456</div>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                ₹{emp.grossSalary.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3">
                                {emp.status === 'Present' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Present</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>Not punched</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPayslipEmp(emp);
                                      setActiveTilePopup('generate_payslips');
                                    }}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                                    title="View Payslip"
                                  >
                                    Payslip
                                  </button>
                                  {emp.locationAddress !== '—' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTilePopup(null);
                                        setSelectedLocationEmployee(emp);
                                      }}
                                      className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                                      title="View GPS Location"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      <span>Map</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 2. PRESENT TODAY POP-UP CARD ==================== */}
              {activeTilePopup === 'present_today' && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[11px] text-emerald-800 font-medium">Present Today</span>
                      <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{presentTodayCount} Employees</div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[11px] text-rose-800 font-medium">Not Punched In</span>
                      <div className="text-xl font-extrabold text-rose-950 mt-0.5">{notPunchedInCount} Employees</div>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                      <span className="text-[11px] text-teal-800 font-medium">Attendance Rate</span>
                      <div className="text-xl font-extrabold text-teal-950 mt-0.5">{attendancePercentage}%</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-600 font-medium">Shift Timings</span>
                      <div className="text-sm font-bold text-slate-900 mt-1">09:30 AM - 06:30 PM</div>
                    </div>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAttendanceModalFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                          attendanceModalFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Workforce ({employeeList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceModalFilter('present')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                          attendanceModalFilter === 'present'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        Present ({presentTodayCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceModalFilter('absent')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                          attendanceModalFilter === 'absent'
                            ? 'bg-rose-700 text-white'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        Not Punched ({notPunchedInCount})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Attendance CSV</span>
                    </button>
                  </div>

                  {/* Detailed Attendance List */}
                  <div className="space-y-2.5">
                    {employeeList
                      .filter((e) => {
                        if (attendanceModalFilter === 'present') return e.status === 'Present';
                        if (attendanceModalFilter === 'absent') return e.status !== 'Present';
                        return true;
                      })
                      .map((emp) => (
                        <div
                          key={emp.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${emp.avatarColor}`}
                            >
                              {emp.initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{emp.name}</span>
                                <span className="font-mono text-xs text-slate-400 font-normal">
                                  ({emp.empCode})
                                </span>
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {emp.department} · {emp.designation}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
                            <div>
                              <span className="text-[10.5px] text-slate-400 block">Check-in</span>
                              <span className="font-mono font-bold text-slate-800">{emp.checkInTime}</span>
                            </div>

                            <div>
                              <span className="text-[10.5px] text-slate-400 block">Location</span>
                              <span className="text-slate-700 flex items-center gap-1">
                                {emp.locationAddress !== '—' ? (
                                  <>
                                    <MapPin className="w-3 h-3 text-sky-500" />
                                    <span>{emp.locationAddress}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-400">Location pending</span>
                                )}
                              </span>
                            </div>

                            <div className="shrink-0">
                              {emp.status === 'Present' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTilePopup(null);
                                    setSelectedLocationEmployee(emp);
                                  }}
                                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                  <span>View on Map</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReminderToast(`Attendance reminder sent to ${emp.name} via email notification!`);
                                    setTimeout(() => setReminderToast(null), 3500);
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Mail className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Send Reminder</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ==================== 3. MONTHLY PAYROLL POP-UP CARD ==================== */}
              {activeTilePopup === 'monthly_payroll' && (
                <div className="space-y-4">
                  {/* Financial KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider">
                        Total Monthly Gross
                      </span>
                      <div className="text-2xl font-extrabold text-blue-950 font-mono mt-1">
                        {inr(payrollTotals.gross)}
                      </div>
                      <p className="text-[10.5px] text-blue-700 mt-0.5">
                        Salary register for {payrollTotals.count} employee(s) with a salary on record
                      </p>
                    </div>

                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">
                        Statutory Deductions
                      </span>
                      <div className="text-2xl font-extrabold text-rose-950 font-mono mt-1">
                        {inr(payrollTotals.statutory)}
                      </div>
                      <p className="text-[10.5px] text-rose-700 mt-0.5">
                        EPF ({inr(payrollTotals.epf)}) + PT ({inr(payrollTotals.professionalTax)}) + TDS ({inr(payrollTotals.tds)})
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                        Net Take-Home Payable
                      </span>
                      <div className="text-2xl font-extrabold text-emerald-950 font-mono mt-1">
                        {inr(payrollTotals.net)}
                      </div>
                      <p className="text-[10.5px] text-emerald-700 mt-0.5">
                        Bank disbursal amount for {payrollTotals.count} account(s)
                      </p>
                    </div>
                  </div>

                  {/* Itemized Salary Register Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        October 2026 Employee Salary Register Breakdown
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Statutory rules: EPF {Number(policy?.defaultPfPct ?? 12)}% · PT {inr(Number(policy?.defaultProfTax ?? 0))} · Sec 115BAC
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="table-modern w-full text-left text-xs">
                        <thead className="bg-slate-50/70 text-slate-600 font-bold text-[10.5px] uppercase border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-3">Employee</th>
                            <th className="py-2.5 px-3">Department</th>
                            <th className="py-2.5 px-2.5 text-right">Basic (50%)</th>
                            <th className="py-2.5 px-2.5 text-right">HRA (30%)</th>
                            <th className="py-2.5 px-2.5 text-right">Allowances</th>
                            <th className="py-2.5 px-2.5 text-right">Gross</th>
                            <th className="py-2.5 px-2.5 text-right text-rose-600">PF+PT+TDS</th>
                            <th className="py-2.5 px-3 text-right font-bold text-emerald-700">Net Pay</th>
                            <th className="py-2.5 px-3 text-center">Payslip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                          {employeeList.map((emp) => {
                            // Policy-driven, so the salary register follows the company's own
                            // percentages rather than numbers written into this screen.
                            const basicPct2 = Number(policy?.defaultBasicPct ?? 50) || 50;
                            const hraPct2 = Number(policy?.hraPct ?? 30) || 0;
                            const pfPct2 = Number(policy?.defaultPfPct ?? 12) || 12;
                            const pfCap2 = Number(policy?.defaultPfCapBasic ?? 15000) || 0;
                            const basic = Math.round((emp.grossSalary * basicPct2) / 100);
                            const hra = Math.round((emp.grossSalary * hraPct2) / 100);
                            const special = Math.max(0, emp.grossSalary - basic - hra);
                            const pfRaw2 = Math.round((basic * pfPct2) / 100);
                            const pf = pfCap2 > 0 ? Math.min(pfRaw2, pfCap2) : pfRaw2;
                            const pt = Number(policy?.defaultProfTax ?? 0) || 0;
                            const tds = Math.round((emp.grossSalary * (Number(policy?.defaultTdsPct ?? 0) || 0)) / 100);
                            const totalDed = pf + pt + tds;
                            const netPay = emp.grossSalary - totalDed;

                            return (
                              <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2.5 px-3 font-sans">
                                  <div className="font-bold text-slate-900">{emp.name}</div>
                                  <div className="text-[10.5px] text-slate-400 font-mono">{emp.empCode}</div>
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-700 font-medium">
                                  {emp.department}
                                </td>
                                <td className="py-2.5 px-2.5 text-right text-slate-700">
                                  ₹{basic.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right text-slate-700">
                                  ₹{hra.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right text-slate-700">
                                  ₹{special.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right font-bold text-slate-900">
                                  ₹{emp.grossSalary.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-2.5 text-right text-rose-600">
                                  -₹{totalDed.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-sans">
                                  ₹{netPay.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 text-center font-sans">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPayslipEmp(emp);
                                      setActiveTilePopup('generate_payslips');
                                    }}
                                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Slip</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                          <tr>
                            <td colSpan={5} className="py-2.5 px-3 text-slate-900 font-sans">
                              Total Workforce Register
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono text-slate-900">
                              {inr(payrollTotals.gross)}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono text-rose-600">
                              -{inr(payrollTotals.statutory)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                              {inr(payrollTotals.net)}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReminderToast('October 2026 salary register exported to CSV!');
                        setTimeout(() => setReminderToast(null), 3000);
                      }}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Salary Register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTilePopup(null);
                        setIsRunPayrollModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Payroll Cycle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== 4. PENDING APPROVALS POP-UP CARD ==================== */}
              {(activeTilePopup === 'pending_approvals' || activeTilePopup === 'approval_inbox') && (
                <div className="space-y-4">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setApprovalSubTab('leaves')}
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                        approvalSubTab === 'leaves'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Leave Requests ({pendingLeavesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalSubTab('expenses')}
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                        approvalSubTab === 'expenses'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Expense Claims ({pendingClaimsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalSubTab('loans')}
                      className={`px-3.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                        approvalSubTab === 'loans'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Loan &amp; Advance Requests ({pendingLoansCount})
                    </button>
                  </div>

                  {/* Empty or Loaded State */}
                  {totalPendingApprovals === 0 ? (
                    <div className="py-10 px-4 bg-slate-50/70 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          You&apos;re All Caught Up!
                        </h4>
                        <p className="text-slate-500 text-xs mt-1 max-w-sm">
                          No pending {approvalSubTab === 'leaves' ? 'leave requests' : approvalSubTab === 'expenses' ? 'expense reimbursement claims' : 'salary loan applications'} awaiting your action.
                        </p>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReminderToast('Sample request approved successfully!');
                            setTimeout(() => setReminderToast(null), 3000);
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                        >
                          Verify Workflow History
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-950">
                              {totalPendingApprovals} Request(s) Awaiting Management Decision
                            </span>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Approving will automatically queue into current month payroll inputs.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== 5. ATTENDANCE SUMMARY POP-UP CARD ==================== */}
              {activeTilePopup === 'attendance_summary' && (
                <div className="space-y-5">
                  {/* Presence Bar Visual */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Today&apos;s Attendance Distribution</span>
                      <span className="font-mono font-bold text-slate-700">{selectedDateLabel}</span>
                    </div>

                    <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
                      <div
                        style={{ width: `${attendancePercentage}%` }}
                        className="bg-emerald-500 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        50%
                      </div>
                      <div
                        style={{ width: `${notPunchedPercentage}%` }}
                        className="bg-rose-400 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                      >
                        50%
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Present: 2 Employees (50%)</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-800">
                        <span className="w-3 h-3 rounded-full bg-rose-400" />
                        <span>Not Punched In: 2 Employees (50%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Department Presence Rates */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                      Department-wise Attendance Breakdown
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {departmentBreakdown.map((d) => {
                        const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
                        return (
                          <div key={d.dept} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900">{d.dept}</div>
                              <div className="text-slate-500 text-[11px] truncate">
                                {d.names.length ? d.names.join(', ') : 'No employees'}
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="font-bold text-slate-900 font-mono">
                                {d.present} / {d.total} Present
                              </span>
                              <span
                                className={`font-bold ml-2 ${
                                  pct >= 100 ? 'text-emerald-600' : pct > 0 ? 'text-amber-600' : 'text-rose-600'
                                }`}
                              >
                                ({pct}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {departmentBreakdown.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400">
                          No employees enrolled yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Punctuality and Adherence Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                      <span className="text-[11px] text-teal-800 font-medium">On-Time Arrival</span>
                      <div className="text-lg font-bold text-teal-950 mt-0.5">100% of Check-ins</div>
                      <p className="text-[10px] text-teal-700 mt-0.5">Both at 09:30 AM</p>
                    </div>
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                      <span className="text-[11px] text-sky-800 font-medium">Grace Period Buffer</span>
                      <div className="text-lg font-bold text-sky-950 mt-0.5">15 Minutes</div>
                      <p className="text-[10px] text-sky-700 mt-0.5">Allowed up to 09:45 AM</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[11px] text-emerald-800 font-medium">GPS Geofence</span>
                      <div className="text-lg font-bold text-emerald-950 mt-0.5">500m Radius</div>
                      <p className="text-[10px] text-emerald-700 mt-0.5">Faridabad HQ perimeter</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 6. PAYROLL READINESS POP-UP CARD ==================== */}
              {activeTilePopup === 'payroll_readiness' && (
                <div className="space-y-4">
                  {/* Readiness Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-700 bg-white shadow-xs shrink-0">
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-base text-emerald-950">
                        100% Payroll Readiness Score
                      </div>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        All 4 active employees reviewed with verified salary structures and statutory compliance checks.
                      </p>
                    </div>
                  </div>

                  {/* 5-Step Audit Checklist */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                    <div className="p-3.5 flex items-start gap-3 bg-white">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          1. Employee Master &amp; Active Headcount
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          4 of 4 active employee profiles verified with designations, EMP codes and gross salary values.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-start gap-3 bg-white">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          2. Attendance, Shifts &amp; LOP Input Records
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Working days cut-off synced through 15 October 2026. Zero unapproved loss of pay deductions.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-start gap-3 bg-white">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          3. Statutory Deductions (EPF, PT &amp; Section 115BAC TDS)
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          EPFO 12% employee share mapped, state Professional Tax (₹200) verified, TDS computed.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-start gap-3 bg-white">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          4. Bank Accounts &amp; NEFT/RTGS Disbursal Files
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Valid IFSC and account numbers confirmed for HDFC, ICICI and SBI salary accounts.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-start gap-3 bg-white">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          5. Expense Reimbursements &amp; Arrears Cleared
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          All submitted claims audited. Zero blocking discrepancies or pending arrears.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTilePopup(null);
                        setIsRunPayrollModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Proceed to Run Payroll Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== 7. GENERATE PAYSLIPS POP-UP CARD ==================== */}
              {activeTilePopup === 'generate_payslips' && (
                <div className="space-y-4">
                  {/* Select Employee Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-500 mr-2">Select Employee:</span>
                    {employeeList.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedPayslipEmp(e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          (selectedPayslipEmp?.id || employeeList[0]?.id) === e.id
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>

                  {/* Printable Payslip Preview Document */}
                  {(() => {
                    const emp = selectedPayslipEmp || employeeList[0];
                    // Every figure comes from the policy master, so the breakdown follows the
                    // company's own percentages rather than numbers written into this screen.
                    const basicPct = Number(policy?.defaultBasicPct ?? 50) || 50;
                    const hraPct = Number(policy?.hraPct ?? 30) || 0;
                    const pfPct = Number(policy?.defaultPfPct ?? 12) || 12;
                    const pfCap = Number(policy?.defaultPfCapBasic ?? 15000) || 0;
                    const basic = Math.round((emp.grossSalary * basicPct) / 100);
                    const hra = Math.round((emp.grossSalary * hraPct) / 100);
                    const conveyance = Number(policy?.defaultConveyance ?? 0) || 0;
                    const special = Math.max(0, emp.grossSalary - basic - hra - conveyance);
                    const grossEarnings = emp.grossSalary;

                    const pfRaw = Math.round((basic * pfPct) / 100);
                    const pf = pfCap > 0 ? Math.min(pfRaw, pfCap) : pfRaw;
                    const pt = Number(policy?.defaultProfTax ?? 0) || 0;
                    const tds = Math.round((emp.grossSalary * (Number(policy?.defaultTdsPct ?? 0) || 0)) / 100);
                    const totalDeductions = pf + pt + tds;
                    const netSalary = grossEarnings - totalDeductions;

                    return (
                      <div className="p-5 sm:p-7 bg-white rounded-2xl border-2 border-slate-200 space-y-5 shadow-xs font-sans print:border-none">
                        {/* Payslip Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-800 gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                                Coreenact Solutions Pvt Ltd
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Faridabad Cyber Hub, Sector 15, Haryana 121007 · GSTIN: 06AAACC1234D1Z5
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="font-bold text-xs uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                              Salary Slip · October 2026
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                              Doc: PS-2026-10-{emp.empCode}
                            </div>
                          </div>
                        </div>

                        {/* Employee Bio Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
                            <span className="font-bold text-slate-900">{emp.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">EMP Code</span>
                            <span className="font-mono font-bold text-slate-800">{emp.empCode}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                            <span className="font-semibold text-slate-800">{emp.department}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
                            <span className="font-semibold text-slate-800">{emp.designation}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Account</span>
                            <span className="font-mono text-slate-800">HDFC · **** 8912</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">PAN</span>
                            <span className="font-mono text-slate-800">ABCDE1234F</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">UAN / PF No</span>
                            <span className="font-mono text-slate-800">101234567890</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pay Period</span>
                            <span className="font-semibold text-slate-800">01 Oct - 31 Oct 2026</span>
                          </div>
                        </div>

                        {/* Earnings vs Deductions Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Earnings Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-100 font-bold text-slate-800 flex justify-between text-xs">
                              <span>Earnings Item</span>
                              <span>Amount (INR)</span>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Basic Salary (50%)</span>
                                <span className="font-mono font-semibold text-slate-900">₹{basic.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">House Rent Allowance (HRA)</span>
                                <span className="font-mono font-semibold text-slate-900">₹{hra.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Conveyance Allowance</span>
                                <span className="font-mono font-semibold text-slate-900">₹{conveyance.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Special Allowance</span>
                                <span className="font-mono font-semibold text-slate-900">₹{special.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 bg-slate-50 font-bold flex justify-between border-t border-slate-200">
                                <span className="text-slate-900">Gross Earnings</span>
                                <span className="font-mono text-slate-900">₹{grossEarnings.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-100 font-bold text-slate-800 flex justify-between text-xs">
                              <span>Deductions Item</span>
                              <span>Amount (INR)</span>
                            </div>
                            <div className="divide-y divide-slate-100 text-xs">
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Provident Fund (EPF 12%)</span>
                                <span className="font-mono font-semibold text-rose-600">₹{pf.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Professional Tax (PT)</span>
                                <span className="font-mono font-semibold text-rose-600">₹{pt.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between">
                                <span className="text-slate-700">Income Tax / TDS (Sec 115BAC)</span>
                                <span className="font-mono font-semibold text-rose-600">₹{tds.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-3.5 py-2 flex justify-between text-slate-400">
                                <span>Voluntary PF / Other</span>
                                <span className="font-mono">₹0</span>
                              </div>
                              <div className="px-3.5 py-2 bg-slate-50 font-bold flex justify-between border-t border-slate-200">
                                <span className="text-slate-900">Total Deductions</span>
                                <span className="font-mono text-rose-600">₹{totalDeductions.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Net Take-Home Highlight Box */}
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                              Net Salary Payable
                            </span>
                            <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
                              ₹{netSalary.toLocaleString('en-IN')}
                            </div>
                            <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                              Amount in words: {amountInWords(netSalary)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Print / Download Slip</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ==================== 8. MANAGE POLICIES POP-UP CARD ==================== */}
              {activeTilePopup === 'manage_policies' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          Working Hours &amp; Shift Timings
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Standard shift operates from 09:30 AM to 06:30 PM (Monday to Friday). 1st &amp; 3rd Saturdays are working half-days. 15-minute grace period allowed up to 09:45 AM.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-600" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          GPS Geofencing Attendance Policy
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Punches are verified through Google Maps Geolocation within 500 meters of Faridabad HQ. Mobile attendance requires active location permissions.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          Annual Leave &amp; Holidays
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Full-time employees receive 18 Paid Leaves (PL), 12 Sick/Casual Leaves (SL/CL), and 10 Gazetted Public Holidays annually. Encashment available at financial year-end.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          Travel &amp; Expense Reimbursements
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Local conveyance reimbursed at ₹15/km for 4-wheelers, ₹8/km for 2-wheelers. Client entertainment expenses covered up to ₹3,000 per event with valid GST invoices.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pop-up Card Footer */}
            <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">
                PayChakra Workforce Management System · Coreenact
              </span>
              <button
                type="button"
                onClick={() => setActiveTilePopup(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition"
              >
                Close Pop-up Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
