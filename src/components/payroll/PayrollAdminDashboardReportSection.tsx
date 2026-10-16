import React, { useState, useMemo, useEffect } from 'react';
import { localIsoDate } from '../../shared/geo';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useCrm } from '../../context/CrmContext';
import { User, UserRole } from '../../types';
import {
  AdminPolicyMaster,
  EmployeeSalaryMasterRecord,
  LeaveRequestItem,
  ExpenseClaimItem,
  AttendanceSession,
  AttendancePunchRecord,
  buildDefaultSalaryMasterRecord,
  loadEmployeeSalaryMasters,
  saveEmployeeSalaryMasters,
  loadEmployeeAttendance,
  saveEmployeeAttendance,
  loadEmployeeLeaves,
  saveEmployeeLeaves,
  loadEmployeeClaims,
  saveEmployeeClaims,
  COREENACT_HR_POLICY_CS_001,
  DEFAULT_ADMIN_POLICY_MASTER,
  loadAdminPolicyMaster,
  saveAdminPolicyMaster,
  evaluateAttendancePolicy,
  calculateEmployeePolicyPayroll,
  PAYROLL_DATA_SYNC_EVENT,
  PAYROLL_MASTERS_SYNC_EVENT,
  PAYROLL_LOANS_SYNC_EVENT,
  loadAllEmployeeLoans,
  rejectEmployeeLoan,
  deleteEmployeeLoan,
  EmployeeLoanRecord,
} from './payrollTypes';
import {
  Users,
  MapPin,
  Calendar,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  Search,
  Navigation,
  ShieldCheck,
  Building2,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Wallet,
  Landmark,
  Ban,
  Trash2,
} from 'lucide-react';

const GMP_LIBRARIES: string[] = ['marker'];
const GMP_ATTRIBUTION_IDS: string[] = ['gmp_mcp_codeassist_v1_aistudio'];

interface PayrollAdminDashboardReportSectionProps {
  selectedAdminUserId?: string;
  setSelectedAdminUserId?: (id: string) => void;
  adminPolicyMaster?: AdminPolicyMaster;
  setAdminPolicyMaster?: React.Dispatch<React.SetStateAction<AdminPolicyMaster>>;
  employeeSalaryMasters?: Record<string, EmployeeSalaryMasterRecord>;
  setEmployeeSalaryMasters?: React.Dispatch<
    React.SetStateAction<Record<string, EmployeeSalaryMasterRecord>>
  >;
  activeEmployeeId?: string;
  activeAttendance?: AttendanceSession;
  activeLeaves?: LeaveRequestItem[];
  setActiveLeaves?: React.Dispatch<React.SetStateAction<LeaveRequestItem[]>>;
  activeClaims?: ExpenseClaimItem[];
  setActiveClaims?: React.Dispatch<React.SetStateAction<ExpenseClaimItem[]>>;
  mapsApiKey?: string;
  setStatusBanner?: (msg: string | null) => void;
  onJumpToManageEmployee?: (empId: string) => void;
  onJumpToLoansModule?: () => void;
}

const DEFAULT_POLICY_MASTER: AdminPolicyMaster = {
  policyCode: COREENACT_HR_POLICY_CS_001.code,
  policyVersion: COREENACT_HR_POLICY_CS_001.version,
  plQuota: 12,
  clQuota: 6,
  slQuota: 6,
  compOffQuota: 4,
  monthlyLeaveLimit: 1,
  shiftStartTime: '09:30 AM',
  shiftEndTime: '06:00 PM',
  earlyArrivalCutoff: '09:00 AM',
  graceEndTime: '09:45 AM',
  gracePeriodMins: 15,
  monthlyGraceLimit: 3,
  lateCycleHalfDayNth: 4,
  dailyBreakWindow: '01:00 PM - 02:00 PM',
  maxBreakDurationMins: 60,
  weeklyHolidaySaturdays: '2nd and 4th Saturdays + All Sundays',
  workingSaturdays: '1st, 3rd and 5th Saturdays',
  payDisbursementDay: 'Last Working Day of Month',
  defaultBasicPct: 50,
  defaultHraPct: 25,
  defaultSpecialPct: 18,
  defaultSalesCommissionPct: 1.5,
  defaultPfCapBasic: 15000,
  defaultProfTax: 200,
  defaultTdsPct: 8.5,
  lastPublishedMonth: 'September 2026',
};

export const PayrollAdminDashboardReportSection: React.FC<
  PayrollAdminDashboardReportSectionProps
> = ({
  selectedAdminUserId: propSelectedAdminUserId,
  setSelectedAdminUserId: propSetSelectedAdminUserId,
  adminPolicyMaster: propAdminPolicyMaster,
  setAdminPolicyMaster: propSetAdminPolicyMaster,
  employeeSalaryMasters: propEmployeeSalaryMasters,
  setEmployeeSalaryMasters: propSetEmployeeSalaryMasters,
  activeEmployeeId,
  activeAttendance,
  activeLeaves,
  setActiveLeaves,
  activeClaims,
  setActiveClaims,
  mapsApiKey: propMapsApiKey,
  setStatusBanner: propSetStatusBanner,
  onJumpToManageEmployee,
  onJumpToLoansModule,
}) => {
  const { currentUser, users, customers, supplierCompany, formatCurrency } = useCrm();

  const [localSelectedUserId, setLocalSelectedUserId] = useState<string>(
    propSelectedAdminUserId || currentUser.id
  );
  const selectedAdminUserId = propSelectedAdminUserId || localSelectedUserId;
  const setSelectedAdminUserId = propSetSelectedAdminUserId || setLocalSelectedUserId;

  const [localBanner, setLocalBanner] = useState<string | null>(null);
  const setStatusBanner = (msg: string | null) => {
    if (propSetStatusBanner) {
      propSetStatusBanner(msg);
    } else {
      setLocalBanner(msg);
    }
  };

  const [localMapsApiKey, setLocalMapsApiKey] = useState<string>(
    () => propMapsApiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const mapsApiKey = propMapsApiKey || localMapsApiKey;

  useEffect(() => {
    if (mapsApiKey) return;
    let cancelled = false;
    fetch('/api/maps/config')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.apiKey) {
          setLocalMapsApiKey((prev) => prev || data.apiKey);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [mapsApiKey]);

  const [localSalaryMasters, setLocalSalaryMasters] = useState<
    Record<string, EmployeeSalaryMasterRecord>
  >(() =>
    loadEmployeeSalaryMasters(
      users,
      supplierCompany?.bankName || 'HDFC Bank Ltd',
      supplierCompany?.ifscCode || 'HDFC0001245'
    )
  );
  const [localPolicyMaster, setLocalPolicyMaster] = useState<AdminPolicyMaster>(() =>
    loadAdminPolicyMaster()
  );

  const employeeSalaryMasters = propEmployeeSalaryMasters || localSalaryMasters;
  const adminPolicyMaster = propAdminPolicyMaster || localPolicyMaster || DEFAULT_POLICY_MASTER;

  const updatePolicyMaster = (nextPolicy: AdminPolicyMaster) => {
    if (propSetAdminPolicyMaster) {
      propSetAdminPolicyMaster(nextPolicy);
    }
    setLocalPolicyMaster(nextPolicy);
    saveAdminPolicyMaster(nextPolicy, true);
  };

  const [showPolicyEditor, setShowPolicyEditor] = useState<boolean>(false);
  const [editingAttEmpId, setEditingAttEmpId] = useState<string | null>(null);
  const [editingAttDraft, setEditingAttDraft] = useState<{
    punchInTime: string;
    punchOutTime: string;
    graceUsedThisMonth: number;
    lateCountThisMonth: number;
    breakDurationMins: number;
    hasPriorApproval: boolean;
    managementAuthorizedEarly: boolean;
  } | null>(null);

  const [reportSectionFilter, setReportSectionFilter] = useState<
    'all' | 'attendance_gps' | 'requests' | 'loans_report' | 'employee_info'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [requestTypeFilter, setRequestTypeFilter] = useState<
    'ALL' | 'PENDING' | 'LEAVES' | 'CLAIMS'
  >('ALL');
  const [focusedMapEmpId, setFocusedMapEmpId] = useState<string>(selectedAdminUserId);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const handleSync = () => {
      if (!propEmployeeSalaryMasters) {
        setLocalSalaryMasters(
          loadEmployeeSalaryMasters(
            users,
            supplierCompany?.bankName || 'HDFC Bank Ltd',
            supplierCompany?.ifscCode || 'HDFC0001245'
          )
        );
      }
      if (!propAdminPolicyMaster) {
        setLocalPolicyMaster(loadAdminPolicyMaster());
      }
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener(PAYROLL_DATA_SYNC_EVENT, handleSync);
    window.addEventListener(PAYROLL_MASTERS_SYNC_EVENT, handleSync);
    window.addEventListener(PAYROLL_LOANS_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener(PAYROLL_DATA_SYNC_EVENT, handleSync);
      window.removeEventListener(PAYROLL_MASTERS_SYNC_EVENT, handleSync);
      window.removeEventListener(PAYROLL_LOANS_SYNC_EVENT, handleSync);
    };
  }, [
    propEmployeeSalaryMasters,
    propAdminPolicyMaster,
    users,
    supplierCompany?.bankName,
    supplierCompany?.ifscCode,
  ]);

  const todayIso = localIsoDate();

  // Build complete unified employee list (CRM + Payroll and Payroll-Only)
  const allEmployees = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: UserRole;
      department: User['department'];
      designation: string;
      location: string;
      reportingManager: string;
      assignedTerritory: string;
      status: 'Active' | 'Inactive';
      inCrm: boolean;
      inPayroll: boolean;
      master: EmployeeSalaryMasterRecord;
      attendance: AttendanceSession;
      leaves: LeaveRequestItem[];
      claims: ExpenseClaimItem[];
    }> = [];

    const defaultHandover = users[0]?.name || 'Reporting Manager';
    const defaultCustomer = customers[0]?.name || 'Enterprise Client Visit';

    Object.values(employeeSalaryMasters).forEach((m, idx) => {
      const crmUser = users.find(
        (u) => u.id === m.userId || (m.email && u.email?.toLowerCase() === m.email?.toLowerCase())
      );
      const empName = m.name || crmUser?.name || 'Employee';
      const empLoc = m.location || crmUser?.location || 'New Delhi HQ';
      const attendance =
        m.userId === activeEmployeeId && activeAttendance
          ? activeAttendance
          : loadEmployeeAttendance(m.userId, empLoc, todayIso, idx);
      const empLeaves =
        m.userId === activeEmployeeId && activeLeaves
          ? activeLeaves.map((l) => ({ ...l, employeeId: m.userId, employeeName: empName }))
          : loadEmployeeLeaves(m.userId, empName, defaultHandover, idx);
      const empClaims =
        m.userId === activeEmployeeId && activeClaims
          ? activeClaims.map((c) => ({ ...c, employeeId: m.userId, employeeName: empName }))
          : loadEmployeeClaims(m.userId, empName, defaultCustomer, idx);

      list.push({
        id: m.userId,
        name: empName,
        email: m.email || crmUser?.email || '',
        phone: m.phone || crmUser?.phone || '+91 98109 98290',
        role: (m.role || crmUser?.role || 'Sales Executive') as UserRole,
        department: (m.department || crmUser?.department || 'Sales') as User['department'],
        designation: m.designation || crmUser?.designation || m.role || 'Employee',
        location: empLoc,
        reportingManager: m.reportingManager || crmUser?.reportingManager || defaultHandover,
        assignedTerritory: m.assignedTerritory || crmUser?.assignedTerritory || 'Pan-India',
        status: m.status || crmUser?.status || 'Active',
        inCrm: Boolean(crmUser && m.accessType !== 'payroll_only'),
        inPayroll: true,
        master: m,
        attendance,
        leaves: empLeaves,
        claims: empClaims,
      });
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    users,
    customers,
    employeeSalaryMasters,
    supplierCompany,
    activeEmployeeId,
    activeAttendance,
    activeLeaves,
    activeClaims,
    todayIso,
  ]);

  const q = searchQuery.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const matchDept = deptFilter === 'ALL' || emp.department === deptFilter;
      const matchQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.master.empCode.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.location.toLowerCase().includes(q) ||
        (emp.attendance.punchInLocation?.formattedAddress || '').toLowerCase().includes(q);
      return matchDept && matchQuery;
    });
  }, [allEmployees, deptFilter, q]);

  // All Leave Requests across all employees
  const allLeaveRequests = useMemo(() => {
    const items: Array<
      LeaveRequestItem & {
        empId: string;
        empName: string;
        empCode: string;
        department: string;
        role: string;
      }
    > = [];
    filteredEmployees.forEach((emp) => {
      emp.leaves.forEach((lv) => {
        items.push({
          ...lv,
          empId: emp.id,
          empName: emp.name,
          empCode: emp.master.empCode,
          department: emp.department,
          role: emp.role,
        });
      });
    });
    return items;
  }, [filteredEmployees]);

  // All Expense / Reimbursement Claims across all employees
  const allExpenseClaims = useMemo(() => {
    const items: Array<
      ExpenseClaimItem & {
        empId: string;
        empName: string;
        empCode: string;
        department: string;
        role: string;
      }
    > = [];
    filteredEmployees.forEach((emp) => {
      emp.claims.forEach((cl) => {
        items.push({
          ...cl,
          empId: emp.id,
          empName: emp.name,
          empCode: emp.master.empCode,
          department: emp.department,
          role: emp.role,
        });
      });
    });
    return items;
  }, [filteredEmployees]);

  // All Punch-In / Punch-Out Audit Log entries with Google Coordinates
  const allPunchCoordinateLogs = useMemo(() => {
    const logs: Array<
      AttendancePunchRecord & {
        empId: string;
        empName: string;
        empCode: string;
        department: string;
        role: string;
      }
    > = [];

    filteredEmployees.forEach((emp) => {
      const history = emp.attendance.punchHistory || [];
      if (history.length > 0) {
        history.forEach((rec) => {
          logs.push({
            ...rec,
            empId: emp.id,
            empName: emp.name,
            empCode: emp.master.empCode,
            department: emp.department,
            role: emp.role,
          });
        });
      } else {
        if (emp.attendance.punchInLocation && emp.attendance.punchInTime) {
          logs.push({
            id: `IN-${emp.id}`,
            date: emp.attendance.date || todayIso,
            action: 'PUNCH_IN',
            time: emp.attendance.punchInTime,
            workMode: emp.attendance.workMode,
            location: emp.attendance.punchInLocation,
            empId: emp.id,
            empName: emp.name,
            empCode: emp.master.empCode,
            department: emp.department,
            role: emp.role,
          });
        }
        if (emp.attendance.punchOutLocation && emp.attendance.punchOutTime) {
          logs.push({
            id: `OUT-${emp.id}`,
            date: emp.attendance.date || todayIso,
            action: 'PUNCH_OUT',
            time: emp.attendance.punchOutTime,
            workMode: emp.attendance.workMode,
            location: emp.attendance.punchOutLocation,
            empId: emp.id,
            empName: emp.name,
            empCode: emp.master.empCode,
            department: emp.department,
            role: emp.role,
          });
        }
      }
    });

    return logs;
  }, [filteredEmployees, todayIso]);

  // Dashboard Summary Metrics
  const dashboardStats = useMemo(() => {
    const totalEmployees = allEmployees.length;
    const activeEmployees = allEmployees.filter((e) => e.status === 'Active').length;
    const totalMonthlyGross = allEmployees.reduce((s, e) => s + (e.master.monthlyGross || 0), 0);

    const presentWithGps = allEmployees.filter(
      (e) =>
        (e.attendance.punchedIn || e.attendance.punchOutTime) &&
        (e.attendance.punchInLocation || e.attendance.punchOutLocation)
    ).length;

    const pendingLeaves = allLeaveRequests.filter((l) => l.status === 'Pending Approval').length;
    const approvedLeaves = allLeaveRequests.filter((l) => l.status === 'Approved').length;

    const pendingClaims = allExpenseClaims.filter(
      (c) => c.status === 'Under Verification' || c.status === 'Approved & Queued for Payroll'
    );
    const totalClaimsAmount = allExpenseClaims.reduce((s, c) => s + c.amount, 0);

    const allLoans = loadAllEmployeeLoans();
    const activeLoans = allLoans.filter((l) => l.status === 'Active - Disbursed');
    const pendingLoans = allLoans.filter(
      (l) =>
        l.status === 'Submitted - Pending HR Verification' ||
        l.status === 'HR Verified - Pending Manager/HR Approval' ||
        l.status === 'Approved - Pending Finance Disbursement' ||
        l.status === 'Returned for Clarification'
    );
    const totalOutstandingLoanBalance = activeLoans.reduce(
      (s, l) => s + (l.outstandingBalance || 0),
      0
    );
    const totalLoanRecoveredToDate = allLoans.reduce(
      (s, l) => s + (l.totalRecovered || 0),
      0
    );

    return {
      totalEmployees,
      activeEmployees,
      totalMonthlyGross,
      presentWithGps,
      pendingLeaves,
      approvedLeaves,
      totalLeaves: allLeaveRequests.length,
      pendingClaimsCount: pendingClaims.length,
      totalClaimsCount: allExpenseClaims.length,
      totalClaimsAmount,
      allLoans,
      activeLoansCount: activeLoans.length,
      pendingLoansCount: pendingLoans.length,
      totalOutstandingLoanBalance,
      totalLoanRecoveredToDate,
    };
  }, [allEmployees, allLeaveRequests, allExpenseClaims, employeeSalaryMasters, refreshTick]);

  // Admin Request Handlers (Approve / Reject Leave or Claim for ANY employee)
  const handleAdminUpdateLeaveStatus = (
    empId: string,
    leaveId: string,
    nextStatus: LeaveRequestItem['status']
  ) => {
    const targetEmp = allEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;
    const updated = targetEmp.leaves.map((lv) =>
      lv.id === leaveId ? { ...lv, status: nextStatus } : lv
    );
    saveEmployeeLeaves(empId, updated, true);
    if (empId === activeEmployeeId && setActiveLeaves) {
      setActiveLeaves(updated);
    }
    setRefreshTick((t) => t + 1);
    setStatusBanner(
      `Admin Updated Leave Request ${leaveId} (${targetEmp.name}) status to "${nextStatus}".`
    );
  };

  const handleAdminUpdateClaimStatus = (
    empId: string,
    claimId: string,
    nextStatus: ExpenseClaimItem['status']
  ) => {
    const targetEmp = allEmployees.find((e) => e.id === empId);
    if (!targetEmp) return;
    const updated = targetEmp.claims.map((cl) =>
      cl.id === claimId ? { ...cl, status: nextStatus } : cl
    );
    saveEmployeeClaims(empId, updated, true);
    if (empId === activeEmployeeId && setActiveClaims) {
      setActiveClaims(updated);
    }
    setRefreshTick((t) => t + 1);
    setStatusBanner(
      `Admin Updated Expense Claim ${claimId} (${targetEmp.name}) status to "${nextStatus}".`
    );
  };

  // Export CSVs
  const handleExportAttendanceGpsCsv = () => {
    const currentMonthKey = todayIso.slice(0, 7);
    const rows = [
      [
        'EmpCode',
        'EmployeeName',
        'Department',
        'Role',
        'Date',
        'PolicyStatus_CS_HR_POL_001',
        'GraceUsedThisMonth',
        'LateCountThisMonth',
        'PolicyLopDays',
        'WorkMode',
        'PunchInTime',
        'RecordedInTime_Policy',
        'PunchInLatitude',
        'PunchInLongitude',
        'PunchInGoogleCoordinates',
        'PunchInGoogleAddress',
        'PunchOutTime',
        'NetWorkedHours_After1HrBreak',
        'PunchOutLatitude',
        'PunchOutLongitude',
        'PunchOutGoogleCoordinates',
        'PunchOutGoogleAddress',
      ].join(','),
      ...filteredEmployees.map((emp) => {
        const att = emp.attendance;
        const inLoc = att.punchInLocation;
        const outLoc = att.punchOutLocation;
        const calc = calculateEmployeePolicyPayroll({
          monthKey: currentMonthKey,
          master: emp.master,
          policy: adminPolicyMaster,
          attendance: att,
          leaves: emp.leaves,
          claims: emp.claims,
        });
        return [
          emp.master.empCode,
          `"${emp.name}"`,
          `"${emp.department}"`,
          `"${emp.role}"`,
          att.date || todayIso,
          `"${calc.policyEval.finalStatus}"`,
          `${calc.graceUsedThisMonth}/${calc.graceLimitPerMonth}`,
          calc.lateCountThisMonth,
          calc.lopDays,
          `"${att.workMode}"`,
          att.punchInTime || '—',
          calc.shiftHours.recordedInTime || '—',
          inLoc ? inLoc.lat.toFixed(5) : '—',
          inLoc ? inLoc.lng.toFixed(5) : '—',
          inLoc ? `"${inLoc.lat.toFixed(5)}, ${inLoc.lng.toFixed(5)}"` : '—',
          `"${(inLoc?.formattedAddress || 'Not Recorded').replace(/"/g, '""')}"`,
          att.punchOutTime || '—',
          `"${calc.shiftHours.netHoursFormatted}"`,
          outLoc ? outLoc.lat.toFixed(5) : '—',
          outLoc ? outLoc.lng.toFixed(5) : '—',
          outLoc ? `"${outLoc.lat.toFixed(5)}, ${outLoc.lng.toFixed(5)}"` : '—',
          `"${(outLoc?.formattedAddress || '—').replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Admin_Attendance_Google_Coordinates_Report_${todayIso}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(
      `Exported Admin Attendance Report with Google Coordinates & Policy CS-HR-POL-001 calculations for ${filteredEmployees.length} employees.`
    );
  };

  const handleExportAllEmployeesCsv = () => {
    const currentMonthKey = todayIso.slice(0, 7);
    const rows = [
      [
        'EmpCode',
        'FullName',
        'Email',
        'Phone',
        'Role',
        'Department',
        'Designation',
        'ReportingManager',
        'Location',
        'SystemSync',
        'Status',
        'FixedMonthlyGrossINR',
        'PaidDays',
        'PolicyLopDays',
        'PolicyLopDeductionINR',
        'NetPayableINR',
        'PAN',
        'UAN',
        'BankName',
        'BankAccountNo',
        'IFSC',
        'ShiftTiming',
      ].join(','),
      ...filteredEmployees.map((emp) => {
        const m = emp.master;
        const calc = calculateEmployeePolicyPayroll({
          monthKey: currentMonthKey,
          master: m,
          policy: adminPolicyMaster,
          attendance: emp.attendance,
          leaves: emp.leaves,
          claims: emp.claims,
        });
        return [
          m.empCode,
          `"${emp.name}"`,
          `"${emp.email}"`,
          `"${emp.phone}"`,
          `"${emp.role}"`,
          `"${emp.department}"`,
          `"${emp.designation}"`,
          `"${emp.reportingManager}"`,
          `"${emp.location}"`,
          emp.inCrm ? 'CRM+Payroll' : 'PayrollOnly',
          emp.status,
          calc.baseMonthlyGross,
          calc.paidDays,
          calc.lopDays,
          calc.policyLopDeductionAmount,
          calc.netPayable,
          m.panNumber,
          m.uanNumber,
          `"${m.bankName}"`,
          m.bankAccountNo,
          m.ifscCode,
          `"${m.shiftTiming || `${adminPolicyMaster.shiftStartTime} - ${adminPolicyMaster.shiftEndTime}`}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Admin_All_Employee_Information_Report_${todayIso}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(
      `Exported Complete Employee Information Report (${filteredEmployees.length} employees).`
    );
  };

  const focusedEmployee =
    allEmployees.find((e) => e.id === focusedMapEmpId) ||
    allEmployees.find((e) => e.attendance.punchInLocation || e.attendance.punchOutLocation) ||
    allEmployees[0];

  const focusedLocation =
    focusedEmployee?.attendance.punchOutLocation ||
    focusedEmployee?.attendance.punchInLocation ||
    null;

  return (
    <div className="sh-scope space-y-4">
      {localBanner && !propSetStatusBanner && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-2 font-medium text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{localBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ADMIN DASHBOARD & REPORTS HEADER BAR */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
              Admin Command Center
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-sky-300 font-semibold">
              Live Organization Attendance (Google Coordinates), Employee Requests &amp; 360° Directory
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-1">
            Admin Employee Dashboard &amp; Consolidated Reports
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {[
              { id: 'all', label: 'All Dashboard & Reports' },
              { id: 'attendance_gps', label: 'Attendance & Google Coordinates' },
              { id: 'requests', label: 'Employee Requests (Leaves & Claims)' },
              { id: 'loans_report', label: 'Loans, EMIs & Ledger Report' },
              { id: 'employee_info', label: 'All Employee Information' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportSectionFilter(tab.id as typeof reportSectionFilter)}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs whitespace-nowrap transition cursor-pointer ${
                  reportSectionFilter === tab.id
                    ? 'bg-[#1f7e9e] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Total Employees (360° Master)</span>
            <Users className="w-4 h-4 text-[#1f7e9e] shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {dashboardStats.totalEmployees} Employees
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center justify-between">
            <span>{dashboardStats.activeEmployees} Active</span>
            <span>Monthly Payroll: {formatCurrency(dashboardStats.totalMonthlyGross)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Attendance (Google Coordinates)</span>
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1.5 font-mono tabular-nums">
            {dashboardStats.presentWithGps} / {dashboardStats.totalEmployees} Verified
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>GPS Lat/Lng Recorded</span>
            <span className="font-mono text-[#1f7e9e] font-semibold">Google Maps</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Employee Leave Requests</span>
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {dashboardStats.totalLeaves} Requests
          </div>
          <div className="text-[11px] font-semibold mt-1 flex items-center justify-between">
            <span className="text-amber-700">{dashboardStats.pendingLeaves} Pending Approval</span>
            <span className="text-emerald-700">{dashboardStats.approvedLeaves} Approved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Reimbursement &amp; Expense Requests</span>
            <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {formatCurrency(dashboardStats.totalClaimsAmount)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center justify-between">
            <span>{dashboardStats.totalClaimsCount} Total Claims</span>
            <span>{dashboardStats.pendingClaimsCount} Queued / Under Review</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Loans &amp; Salary Advances</span>
            <Landmark className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1.5 font-mono tabular-nums">
            {formatCurrency(dashboardStats.totalOutstandingLoanBalance)}
          </div>
          <div className="text-[11px] font-semibold mt-1 flex items-center justify-between">
            <span className="text-slate-600">{dashboardStats.activeLoansCount} Active</span>
            <span className="text-amber-700">{dashboardStats.pendingLoansCount} Pending Approval</span>
          </div>
        </div>
      </div>

      {/* GLOBAL FILTER & EXPORT TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee name, emp code, role, city, or Google Maps address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#1f7e9e]"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Departments</option>
            <option value="Sales">Sales Dept</option>
            <option value="Finance">Finance Dept</option>
            <option value="Executive">Executive Dept</option>
            <option value="Operations">Operations Dept</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPolicyEditor((prev) => !prev)}
            className={`px-3 py-1.5 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
              showPolicyEditor
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#1f7e9e] hover:bg-[#17647e] text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {showPolicyEditor
                ? 'Close Policy Editor'
                : `Edit & Apply All Policies (${adminPolicyMaster.policyCode || 'CS-HR-POL-001'})`}
            </span>
          </button>
          <button
            type="button"
            onClick={handleExportAttendanceGpsCsv}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Attendance (Google Coordinates) CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportAllEmployeesCsv}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Employee Info CSV</span>
          </button>
        </div>
      </div>

      {/* EDITABLE ADMIN POLICY ENGINE DRAWER (APPLY ALL POLICIES ACROSS PAYROLL) */}
      {showPolicyEditor && (
        <div className="bg-white rounded-xl border-2 border-[#1f7e9e] shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Admin Editable Policy Engine · {adminPolicyMaster.policyCode || 'CS-HR-POL-001'} v
                {adminPolicyMaster.policyVersion || '1.0'}
              </div>
              <h4 className="font-bold text-sm text-white">
                Edit &amp; Apply All Policies Across All Employees &amp; Payroll Calculations
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const reset = {
                    ...DEFAULT_ADMIN_POLICY_MASTER,
                    lastPublishedMonth: adminPolicyMaster.lastPublishedMonth,
                  };
                  updatePolicyMaster(reset);
                  setStatusBanner(
                    'Reset policy rules to official Coreenact Solutions Policy CS-HR-POL-001 v1.0 defaults.'
                  );
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePolicyMaster(adminPolicyMaster);
                  // Propagate shift, leave quotas & formula defaults to all employees and re-evaluate attendance
                  const nextMasters: Record<string, EmployeeSalaryMasterRecord> = {
                    ...employeeSalaryMasters,
                  };
                  allEmployees.forEach((emp, idx) => {
                    nextMasters[emp.id] = {
                      ...emp.master,
                      shiftTiming: `${adminPolicyMaster.shiftStartTime} - ${adminPolicyMaster.shiftEndTime}`,
                      plQuota: adminPolicyMaster.plQuota,
                      clQuota: adminPolicyMaster.clQuota,
                      slQuota: adminPolicyMaster.slQuota,
                      compOffQuota: adminPolicyMaster.compOffQuota,
                      basicPct: adminPolicyMaster.defaultBasicPct,
                      hraPct: adminPolicyMaster.defaultHraPct,
                      specialPct: adminPolicyMaster.defaultSpecialPct,
                      commissionPct: adminPolicyMaster.defaultSalesCommissionPct,
                      profTax: adminPolicyMaster.defaultProfTax,
                      tdsPct: adminPolicyMaster.defaultTdsPct,
                    };
                    const att = emp.attendance;
                    if (att.punchInTime) {
                      const evalRes = evaluateAttendancePolicy({
                        punchInTime: att.punchInTime,
                        punchOutTime: att.punchOutTime,
                        priorGraceUsed: Math.max(0, (att.graceUsedThisMonth || 0) - 1),
                        priorLateCount: Math.max(0, (att.lateCountThisMonth || 0) - 1),
                        hasPriorApproval: Boolean(att.hasPriorApproval),
                        managementAuthorizedEarly: Boolean(att.managementAuthorizedEarly),
                        breakDurationMins: att.breakDurationMins || 45,
                        policy: adminPolicyMaster,
                      });
                      saveEmployeeAttendance(
                        emp.id,
                        {
                          ...att,
                          recordedInTime: evalRes.recordedInTime,
                          policyStatus: evalRes.finalStatus,
                          policyRemarks: evalRes.summaryCitation,
                        },
                        false
                      );
                    }
                  });
                  if (propSetEmployeeSalaryMasters) {
                    propSetEmployeeSalaryMasters(nextMasters);
                  }
                  setLocalSalaryMasters(nextMasters);
                  saveEmployeeSalaryMasters(nextMasters);
                  setRefreshTick((t) => t + 1);
                  setStatusBanner(
                    `Applied all edited policies (${adminPolicyMaster.shiftStartTime}–${
                      adminPolicyMaster.shiftEndTime
                    }, Early Floor ${adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}, Grace ${
                      adminPolicyMaster.monthlyGraceLimit ?? 3
                    }x until ${adminPolicyMaster.graceEndTime || '09:45 AM'}, Every ${
                      adminPolicyMaster.lateCycleHalfDayNth ?? 4
                    }th Late = ${adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP, ${
                      adminPolicyMaster.monthlyLeaveLimit ?? 1
                    } Leave/Mo) across all ${allEmployees.length} employees.`
                  );
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save &amp; Apply All Policies Now</span>
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-slate-50/60">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shift Start Time</label>
              <input
                type="text"
                value={adminPolicyMaster.shiftStartTime}
                onChange={(e) =>
                  updatePolicyMaster({ ...adminPolicyMaster, shiftStartTime: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shift End Time</label>
              <input
                type="text"
                value={adminPolicyMaster.shiftEndTime}
                onChange={(e) =>
                  updatePolicyMaster({ ...adminPolicyMaster, shiftEndTime: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Early Floor Cutoff</label>
              <input
                type="text"
                value={adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}
                onChange={(e) =>
                  updatePolicyMaster({ ...adminPolicyMaster, earlyArrivalCutoff: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-indigo-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Grace End Time</label>
              <input
                type="text"
                value={adminPolicyMaster.graceEndTime || '09:45 AM'}
                onChange={(e) =>
                  updatePolicyMaster({ ...adminPolicyMaster, graceEndTime: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Grace Limit / Mo</label>
              <input
                type="number"
                min={0}
                value={adminPolicyMaster.monthlyGraceLimit ?? 3}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    monthlyGraceLimit: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nth Late = Half Day</label>
              <input
                type="number"
                min={1}
                value={adminPolicyMaster.lateCycleHalfDayNth ?? 4}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    lateCycleHalfDayNth: Math.max(1, Number(e.target.value)),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-rose-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Late Cycle LOP (d)</label>
              <input
                type="number"
                step="0.25"
                min={0}
                value={adminPolicyMaster.lateCycleDeductionDays ?? 0.5}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    lateCycleDeductionDays: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-rose-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Paid Leave / Mo</label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={adminPolicyMaster.monthlyLeaveLimit ?? 1}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    monthlyLeaveLimit: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Midday Entry Start</label>
              <input
                type="text"
                value={adminPolicyMaster.middayEntryStartTime || '12:00 PM'}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    middayEntryStartTime: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Midday Entry End</label>
              <input
                type="text"
                value={adminPolicyMaster.middayEntryEndTime || '01:00 PM'}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    middayEntryEndTime: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Exit Absent Before</label>
              <input
                type="text"
                value={adminPolicyMaster.earlyExitAbsentBeforeTime || '12:30 PM'}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    earlyExitAbsentBeforeTime: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-rose-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Regular Exit After</label>
              <input
                type="text"
                value={adminPolicyMaster.earlyExitHalfDayEndTime || '04:00 PM'}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    earlyExitHalfDayEndTime: e.target.value,
                    regularExitAfterTime: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Max Break (Mins)</label>
              <input
                type="number"
                min={15}
                value={adminPolicyMaster.maxBreakDurationMins ?? 60}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    maxBreakDurationMins: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Break Window</label>
              <input
                type="text"
                value={adminPolicyMaster.dailyBreakWindow || '01:00 PM - 02:00 PM'}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    dailyBreakWindow: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Basic %</label>
              <input
                type="number"
                value={adminPolicyMaster.defaultBasicPct}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    defaultBasicPct: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default HRA %</label>
              <input
                type="number"
                value={adminPolicyMaster.defaultHraPct}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    defaultHraPct: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">PF Wage Ceiling (₹)</label>
              <input
                type="number"
                value={adminPolicyMaster.defaultPfCapBasic}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    defaultPfCapBasic: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default TDS %</label>
              <input
                type="number"
                step="0.5"
                value={adminPolicyMaster.defaultTdsPct}
                onChange={(e) =>
                  updatePolicyMaster({
                    ...adminPolicyMaster,
                    defaultTdsPct: Number(e.target.value),
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          REPORT SECTION 1: ATTENDANCE REPORT WITH GOOGLE COORDINATES & LIVE MAP
          ===================================================================== */}
      {(reportSectionFilter === 'all' || reportSectionFilter === 'attendance_gps') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#1f7e9e]" />
                <h4 className="font-bold text-sm text-slate-900">
                  Admin Attendance Report with Google Coordinates (Latitude &amp; Longitude)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time employee Punch-In &amp; Punch-Out register with verified Google Maps GPS coordinates (Lat, Lng), Plus Codes, and formatted street addresses.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg whitespace-nowrap">
              Date: {todayIso} · Google Maps Geolocation
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* Left / Main 8 Cols: Attendance Register Table with Google Coordinates */}
            <div className="xl:col-span-8 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="table-modern w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Work Mode</th>
                    <th className="py-2.5 px-3">Punch-In &amp; Google Coordinates</th>
                    <th className="py-2.5 px-3">Punch-Out &amp; Google Coordinates</th>
                    <th className="py-2.5 px-3">Verified Google Maps Address</th>
                    <th className="py-2.5 px-3 text-right">Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        <Users className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        <span className="font-semibold text-slate-600 block">No Employees in Payroll Database</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          All employees have been removed from the payroll register. Administrators count as CRM system users and are not automatically enrolled in payroll.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                    const att = emp.attendance;
                    const inLoc = att.punchInLocation;
                    const outLoc = att.punchOutLocation;
                    const activeLoc = outLoc || inLoc;
                    const isFocused = focusedEmployee?.id === emp.id;

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-sky-50/50 transition ${
                          isFocused ? 'bg-sky-50/80' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {emp.master.empCode} · {emp.department}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-[#1f7e9e]">{att.workMode}</div>
                          <div
                            className={`text-[10px] font-bold ${
                              att.punchedIn
                                ? 'text-emerald-700'
                                : att.punchOutTime
                                ? 'text-slate-600'
                                : 'text-amber-700'
                            }`}
                          >
                            {att.punchedIn
                              ? '● Present · Checked In'
                              : att.punchOutTime
                              ? '● Shift Completed'
                              : '○ Not Punched In'}
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                            {att.policyStatus || 'Regular Day'} · Grace {att.graceUsedThisMonth ?? 0}/3 · Late #{att.lateCountThisMonth ?? 0}
                          </div>
                        </td>

                        {/* Punch-In Time + Google Coordinates */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {att.punchInTime && inLoc ? (
                            <div>
                              <div className="font-mono font-bold text-emerald-700">
                                In: {att.punchInTime}
                                {att.recordedInTime && att.recordedInTime !== att.punchInTime && (
                                  <span className="text-[10px] text-indigo-700 ml-1">
                                    (Rec: {att.recordedInTime})
                                  </span>
                                )}
                              </div>
                              <div
                                className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-[10px] font-bold"
                                title="Punch-In Google Latitude & Longitude Coordinates"
                              >
                                <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>
                                  {inLoc.lat.toFixed(5)}° N, {inLoc.lng.toFixed(5)}° E
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-semibold text-[11px]">
                              Not Recorded
                            </span>
                          )}
                        </td>

                        {/* Punch-Out Time + Google Coordinates */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {att.punchOutTime && outLoc ? (
                            <div>
                              <div className="font-mono font-bold text-rose-700">
                                Out: {att.punchOutTime}
                              </div>
                              <div
                                className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[10px] font-bold"
                                title="Punch-Out Google Latitude & Longitude Coordinates"
                              >
                                <MapPin className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                <span>
                                  {outLoc.lat.toFixed(5)}° N, {outLoc.lng.toFixed(5)}° E
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              {att.punchedIn ? 'Active Shift' : '—'}
                            </span>
                          )}
                        </td>

                        {/* Formatted Google Maps Address */}
                        <td className="py-2.5 px-3 max-w-[260px]">
                          {activeLoc ? (
                            <div>
                              <div
                                className="text-slate-800 font-medium truncate"
                                title={activeLoc.formattedAddress}
                              >
                                {activeLoc.formattedAddress}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {activeLoc.plusCode ? `Plus Code: ${activeLoc.plusCode} · ` : ''}
                                Accuracy: ±{activeLoc.accuracyMeters || 15}m · Google Maps
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              No GPS coordinates recorded
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (editingAttEmpId === emp.id) {
                                  setEditingAttEmpId(null);
                                  setEditingAttDraft(null);
                                } else {
                                  setEditingAttEmpId(emp.id);
                                  setEditingAttDraft({
                                    punchInTime: att.punchInTime || '09:30 AM',
                                    punchOutTime: att.punchOutTime || '06:00 PM',
                                    graceUsedThisMonth: att.graceUsedThisMonth ?? 0,
                                    lateCountThisMonth: att.lateCountThisMonth ?? 0,
                                    breakDurationMins: att.breakDurationMins ?? 45,
                                    hasPriorApproval: Boolean(att.hasPriorApproval),
                                    managementAuthorizedEarly: Boolean(
                                      att.managementAuthorizedEarly
                                    ),
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title="Edit Employee Attendance & Apply Policy"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Policy</span>
                            </button>
                            {activeLoc ? (
                              <button
                                type="button"
                                onClick={() => setFocusedMapEmpId(emp.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition ${
                                  isFocused
                                    ? 'bg-[#1f7e9e] text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Locate</span>
                              </button>
                            ) : null}
                          </div>
                          {editingAttEmpId === emp.id && editingAttDraft && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-white text-left space-y-2 min-w-[270px] shadow-md">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                Edit &amp; Apply Policy for {emp.name}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                <div>
                                  <label className="text-[10px] text-slate-300 block">Punch In</label>
                                  <input
                                    type="text"
                                    value={editingAttDraft.punchInTime}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        punchInTime: e.target.value,
                                      })
                                    }
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-300 block">Punch Out</label>
                                  <input
                                    type="text"
                                    value={editingAttDraft.punchOutTime}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        punchOutTime: e.target.value,
                                      })
                                    }
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-300 block">
                                    Grace Used
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editingAttDraft.graceUsedThisMonth}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        graceUsedThisMonth: Number(e.target.value),
                                      })
                                    }
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-300 block">
                                    Late Count
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editingAttDraft.lateCountThisMonth}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        lateCountThisMonth: Number(e.target.value),
                                      })
                                    }
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-white text-[11px]"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 text-[10px]">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingAttDraft.hasPriorApproval}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        hasPriorApproval: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Prior Manager/HR Approval</span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingAttDraft.managementAuthorizedEarly}
                                    onChange={(e) =>
                                      setEditingAttDraft({
                                        ...editingAttDraft,
                                        managementAuthorizedEarly: e.target.checked,
                                      })
                                    }
                                  />
                                  <span>Authorize &lt;9:00 AM Extra Time</span>
                                </label>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAttEmpId(null);
                                    setEditingAttDraft(null);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-[10px] font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const evalRes = evaluateAttendancePolicy({
                                      punchInTime: editingAttDraft.punchInTime,
                                      punchOutTime: editingAttDraft.punchOutTime || null,
                                      priorGraceUsed: Math.max(
                                        0,
                                        editingAttDraft.graceUsedThisMonth - 1
                                      ),
                                      priorLateCount: Math.max(
                                        0,
                                        editingAttDraft.lateCountThisMonth - 1
                                      ),
                                      hasPriorApproval: editingAttDraft.hasPriorApproval,
                                      managementAuthorizedEarly:
                                        editingAttDraft.managementAuthorizedEarly,
                                      breakDurationMins: editingAttDraft.breakDurationMins,
                                      policy: adminPolicyMaster,
                                    });
                                    saveEmployeeAttendance(
                                      emp.id,
                                      {
                                        ...att,
                                        punchInTime: editingAttDraft.punchInTime,
                                        recordedInTime: evalRes.recordedInTime,
                                        punchOutTime: editingAttDraft.punchOutTime || null,
                                        graceUsedThisMonth: editingAttDraft.graceUsedThisMonth,
                                        lateCountThisMonth: editingAttDraft.lateCountThisMonth,
                                        breakDurationMins: editingAttDraft.breakDurationMins,
                                        hasPriorApproval: editingAttDraft.hasPriorApproval,
                                        managementAuthorizedEarly:
                                          editingAttDraft.managementAuthorizedEarly,
                                        policyStatus: evalRes.finalStatus,
                                        policyRemarks: evalRes.summaryCitation,
                                      },
                                      true
                                    );
                                    setEditingAttEmpId(null);
                                    setEditingAttDraft(null);
                                    setRefreshTick((t) => t + 1);
                                    setStatusBanner(
                                      `Updated & applied policy for ${emp.name}: Status = ${evalRes.finalStatus} (Recorded In: ${evalRes.recordedInTime}).`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Save &amp; Apply Policy
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            {/* Right 4 Cols: Interactive Google Map for Selected Employee's Coordinates */}
            <div className="xl:col-span-4 bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1f7e9e]">
                    Live Google Maps Coordinate Inspector
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs mt-0.5">
                    {focusedEmployee?.name} ({focusedEmployee?.master.empCode})
                  </h5>
                </div>
                {focusedLocation && (
                  <span className="font-mono text-[11px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-800">
                    {focusedLocation.lat.toFixed(5)}, {focusedLocation.lng.toFixed(5)}
                  </span>
                )}
              </div>

              {mapsApiKey && focusedLocation ? (
                <div className="w-full h-52 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 relative">
                  <APIProvider apiKey={mapsApiKey} libraries={GMP_LIBRARIES}>
                    <Map
                      key={`${focusedEmployee?.id}-${focusedLocation.lat}-${focusedLocation.lng}`}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
                      defaultCenter={{ lat: focusedLocation.lat, lng: focusedLocation.lng }}
                      defaultZoom={15}
                      gestureHandling="cooperative"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      {filteredEmployees.map((emp) => {
                        const loc =
                          emp.attendance.punchOutLocation || emp.attendance.punchInLocation;
                        if (!loc) return null;
                        return (
                          <AdvancedMarker
                            key={emp.id}
                            position={{ lat: loc.lat, lng: loc.lng }}
                            title={`${emp.name} (${emp.master.empCode}) — ${loc.lat.toFixed(
                              5
                            )}, ${loc.lng.toFixed(5)}`}
                            onClick={() => setFocusedMapEmpId(emp.id)}
                          />
                        );
                      })}
                    </Map>
                  </APIProvider>
                </div>
              ) : (
                <div className="w-full h-44 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center p-4 text-center text-slate-500">
                  <MapPin className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="font-semibold text-xs">
                    Select an employee with recorded GPS punch coordinates to inspect on Google Maps
                  </span>
                </div>
              )}

              {focusedLocation && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Google Coordinates:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      Lat {focusedLocation.lat.toFixed(5)}°, Lng {focusedLocation.lng.toFixed(5)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Timestamp &amp; Mode:</span>
                    <span className="font-semibold text-slate-800">
                      {focusedLocation.fetchedAt} ({focusedEmployee?.attendance.workMode})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-100 leading-snug">
                    <strong className="text-slate-900">Address:</strong>{' '}
                    {focusedLocation.formattedAddress}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Google Maps</div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Punch-In / Punch-Out Coordinate Log Table */}
          {allPunchCoordinateLogs.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-slate-800">
                  Detailed Punch-In &amp; Punch-Out Google Coordinate Audit Log ({allPunchCoordinateLogs.length} Events)
                </h5>
                <span className="text-[11px] text-slate-500">Google Maps</span>
              </div>
              <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-xl">
                <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Employee</th>
                      <th className="py-2 px-3">Date &amp; Time</th>
                      <th className="py-2 px-3">Work Mode</th>
                      <th className="py-2 px-3">Latitude</th>
                      <th className="py-2 px-3">Longitude</th>
                      <th className="py-2 px-3">Google Maps Verified Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPunchCoordinateLogs.map((log) => (
                      <tr key={`${log.empId}-${log.id}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                              log.action === 'PUNCH_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.action === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {log.empName}{' '}
                          <span className="font-mono text-slate-500 font-normal">
                            ({log.empCode})
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {log.date} · <strong>{log.time}</strong>
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1f7e9e]">{log.workMode}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {log.location.lat.toFixed(5)}° N
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {log.location.lng.toFixed(5)}° E
                        </td>
                        <td className="py-2 px-3 text-slate-700 max-w-md truncate">
                          {log.location.formattedAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          REPORT SECTION 2: ALL EMPLOYEE REQUESTS (LEAVES & REIMBURSEMENTS)
          ===================================================================== */}
      {(reportSectionFilter === 'all' || reportSectionFilter === 'requests') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                All Employee Requests — Leave Applications &amp; Reimbursement Claims
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Consolidated organization-wide requests queue. Approve, reject, or verify any employee request directly.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'PENDING', label: `Pending Action (${dashboardStats.pendingLeaves + dashboardStats.pendingClaimsCount})` },
                { id: 'LEAVES', label: `Leaves (${allLeaveRequests.length})` },
                { id: 'CLAIMS', label: `Expense Claims (${allExpenseClaims.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRequestTypeFilter(f.id as typeof requestTypeFilter)}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition cursor-pointer ${
                    requestTypeFilter === f.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Leave Requests Table */}
            {(requestTypeFilter === 'ALL' ||
              requestTypeFilter === 'PENDING' ||
              requestTypeFilter === 'LEAVES') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    Employee Leave Requests ({allLeaveRequests.length})
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700">
                    {dashboardStats.pendingLeaves} Pending Approval
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase bg-white">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">Leave &amp; Dates</th>
                        <th className="py-2 px-3">Reason</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allLeaveRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No leave requests found. (0 employees in payroll)
                          </td>
                        </tr>
                      ) : (
                        allLeaveRequests
                        .filter((lv) =>
                          requestTypeFilter === 'PENDING'
                            ? lv.status === 'Pending Approval'
                            : true
                        )
                        .map((lv) => (
                          <tr key={`${lv.empId}-${lv.id}`} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{lv.empName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {lv.empCode} · {lv.department}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">
                                {lv.leaveType} ({lv.days}d)
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {lv.startDate} to {lv.endDate}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 max-w-[180px] truncate" title={lv.reason}>
                              {lv.reason}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold text-[11px] ${
                                  lv.status === 'Approved'
                                    ? 'text-emerald-700'
                                    : lv.status === 'Pending Approval'
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {lv.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminUpdateLeaveStatus(lv.empId, lv.id, 'Approved')
                                  }
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminUpdateLeaveStatus(lv.empId, lv.id, 'Cancelled')
                                  }
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expense & Reimbursement Claims Table */}
            {(requestTypeFilter === 'ALL' ||
              requestTypeFilter === 'PENDING' ||
              requestTypeFilter === 'CLAIMS') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    Employee Reimbursement Requests ({allExpenseClaims.length})
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#1f7e9e]">
                    Total: {formatCurrency(dashboardStats.totalClaimsAmount)}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase bg-white">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">Claim &amp; Category</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allExpenseClaims.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            No reimbursement claims submitted. (0 employees in payroll)
                          </td>
                        </tr>
                      ) : (
                        allExpenseClaims
                        .filter((cl) =>
                          requestTypeFilter === 'PENDING'
                            ? cl.status !== 'Paid in Payslip'
                            : true
                        )
                        .map((cl) => (
                          <tr key={`${cl.empId}-${cl.id}`} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{cl.empName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {cl.empCode} · {cl.department}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">{cl.category}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {cl.claimNo} · {cl.expenseDate}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(cl.amount)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold text-[11px] ${
                                  cl.status === 'Paid in Payslip'
                                    ? 'text-emerald-700'
                                    : cl.status === 'Approved & Queued for Payroll'
                                    ? 'text-[#1f7e9e]'
                                    : 'text-amber-700'
                                }`}
                              >
                                {cl.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminUpdateClaimStatus(
                                      cl.empId,
                                      cl.id,
                                      'Approved & Queued for Payroll'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminUpdateClaimStatus(
                                      cl.empId,
                                      cl.id,
                                      'Paid in Payslip'
                                    )
                                  }
                                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] cursor-pointer"
                                >
                                  Mark Paid
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          REPORT SECTION 3: ALL EMPLOYEE INFORMATION & MASTER DIRECTORY REPORT
          ===================================================================== */}
      {(reportSectionFilter === 'all' || reportSectionFilter === 'employee_info') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Complete Employee Information, Compensation &amp; Statutory Master Report ({filteredEmployees.length} Employees)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All employee profile details, CRM &amp; Payroll sync status, salary structures, PAN/UAN statutory identifiers, bank accounts, and leave quotas.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Employee Name &amp; Contact</th>
                  <th className="py-2.5 px-3">Role &amp; Department</th>
                  <th className="py-2.5 px-3">Location &amp; Shift</th>
                  <th className="py-2.5 px-3">System Sync</th>
                  <th className="py-2.5 px-3 text-right">Monthly Gross</th>
                  <th className="py-2.5 px-3 text-right">Net Payable</th>
                  <th className="py-2.5 px-3">PAN &amp; UAN</th>
                  <th className="py-2.5 px-3">Salary Bank &amp; A/C</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      <Users className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                      <span className="font-semibold text-slate-600 block">No Employees Enrolled in Payroll Master</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        All employee records have been removed. Admins are CRM system users and manage the system. Add employees via Admin Payroll Master.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                  const m = emp.master;
                  const calc = calculateEmployeePolicyPayroll({
                    monthKey: todayIso.slice(0, 7),
                    master: m,
                    policy: adminPolicyMaster,
                    attendance: emp.attendance,
                    leaves: emp.leaves,
                    claims: emp.claims,
                  });
                  const net = calc.netPayable;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                        {m.empCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp.email} · {emp.phone}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{emp.designation}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.department} Dept · Reports to {emp.reportingManager}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{emp.location}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {m.shiftTiming ||
                            `${adminPolicyMaster.shiftStartTime} - ${adminPolicyMaster.shiftEndTime}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold text-[11px] ${
                            emp.inCrm && emp.inPayroll
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {emp.inCrm && emp.inPayroll
                            ? 'CRM + Payroll'
                            : emp.inCrm
                            ? 'CRM Only'
                            : 'Payroll Only'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        <div>{formatCurrency(m.monthlyGross)}</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          Paid: {calc.paidDays}/{calc.calendar.totalCalendarDays}d (LOP: {calc.lopDays}d)
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        <div>{formatCurrency(net)}</div>
                        {calc.policyLopDeductionAmount > 0 && (
                          <div className="text-[10px] text-rose-600">
                            LOP Ded: -{formatCurrency(calc.policyLopDeductionAmount)}
                          </div>
                        )}
                        {(calc.loanRecovery + calc.advanceRecovery) > 0 && (
                          <div className="text-[10px] text-indigo-700">
                            Loan/Adv EMI: -{formatCurrency(calc.loanRecovery + calc.advanceRecovery)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        <div>PAN: {m.panNumber}</div>
                        <div className="text-slate-500">UAN: {m.uanNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        <div className="font-sans font-semibold text-slate-800">{m.bankName}</div>
                        <div className="text-slate-500">
                          {m.bankAccountNo} ({m.ifscCode})
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAdminUserId(emp.id);
                            if (onJumpToManageEmployee) {
                              onJumpToManageEmployee(emp.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          REPORT SECTION 4: EMPLOYEE LOANS, PENDING APPROVALS, EMI RECOVERIES & OUTSTANDING BALANCES
          ===================================================================== */}
      {(reportSectionFilter === 'all' || reportSectionFilter === 'loans_report') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#1f7e9e]" />
                <span>
                  Employee Loans &amp; Salary Advances Register ({dashboardStats.allLoans.length} Records)
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active loans, pending multi-stage approvals (HR, Manager, Finance), monthly payroll EMI recoveries, and employee-wise outstanding balances.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onJumpToLoansModule && (
                <button
                  type="button"
                  onClick={onJumpToLoansModule}
                  className="px-3 py-1.5 rounded-lg bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Open Loan &amp; Advance Workflow Desk →</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const header = [
                    'Loan ID',
                    'Emp Code',
                    'Employee Name',
                    'Department',
                    'Loan Type',
                    'Application Date',
                    'Requested Amount',
                    'Sanctioned Amount',
                    'Disbursed Amount',
                    'Interest Rate (%)',
                    'Calculation Method',
                    'Tenure (Months)',
                    'Monthly EMI',
                    'Total Payable',
                    'Total Recovered',
                    'Outstanding Balance',
                    'Status',
                  ];
                  const csvRows = [
                    header.join(','),
                    ...dashboardStats.allLoans.map((ln: EmployeeLoanRecord) =>
                      [
                        ln.loanNumber,
                        ln.empCode,
                        `"${ln.employeeName}"`,
                        `"${ln.department}"`,
                        `"${ln.loanType}"`,
                        ln.applicationDate,
                        ln.requestedAmount,
                        ln.approvedAmount,
                        ln.disbursedAmount,
                        ln.interestRateAnnual,
                        `"${ln.calculationMethod}"`,
                        ln.tenureMonths,
                        ln.monthlyEmi,
                        ln.totalPayableAmount,
                        ln.totalRecovered,
                        ln.outstandingBalance,
                        `"${ln.status}"`,
                      ].join(',')
                    ),
                  ].join('\n');
                  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Employee_Loan_And_Advance_Register_${todayIso}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setStatusBanner(
                    `Exported Employee Loan & Advance Register CSV (${dashboardStats.allLoans.length} records).`
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Loan Register CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Loan ID &amp; Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Loan Type &amp; Terms</th>
                  <th className="py-2.5 px-3 text-right">Sanctioned / Disbursed</th>
                  <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                  <th className="py-2.5 px-3 text-right">Recovered</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Bal</th>
                  <th className="py-2.5 px-3">Approval &amp; Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardStats.allLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 text-xs">
                      No employee loan or salary advance records found.
                    </td>
                  </tr>
                ) : (
                  dashboardStats.allLoans.map((ln: EmployeeLoanRecord) => (
                    <tr key={ln.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-[#1f7e9e]">{ln.loanNumber}</div>
                        <div className="text-[10px] text-slate-500">App: {ln.applicationDate}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{ln.employeeName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {ln.empCode} · {ln.department}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{ln.loanType}</div>
                        <div className="text-[10px] text-slate-500">
                          {ln.interestRateAnnual}% p.a. ({ln.calculationMethod}) · {ln.tenureMonths}m
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(ln.approvedAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Disb: {formatCurrency(ln.disbursedAmount)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums">
                        {formatCurrency(ln.monthlyEmi)}/mo
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(ln.totalRecovered)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                        {formatCurrency(ln.outstandingBalance)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold text-[11px] ${
                            ln.status === 'Active - Disbursed'
                              ? 'text-emerald-700'
                              : ln.status.startsWith('Closed')
                              ? 'text-slate-600'
                              : ln.status === 'Rejected' || ln.status === 'Cancelled'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {ln.status}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          HR: {ln.hrVerification.verified ? 'Verified' : 'Pending'} · Mgr:{' '}
                          {ln.managerApproval.status} · Fin:{' '}
                          {ln.financeDisbursement.disbursed ? 'Disbursed' : 'Pending'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {ln.status !== 'Rejected' && !ln.status.startsWith('Closed') && (
                            <button
                              type="button"
                              onClick={() => {
                                rejectEmployeeLoan({
                                  loanId: ln.id,
                                  actorName: currentUser.name,
                                  actorRole: currentUser.role,
                                  isAdminUser: true,
                                  remarks: 'Loan request rejected by Admin from Dashboard.',
                                });
                                setRefreshTick((t) => t + 1);
                                setStatusBanner(
                                  `Admin rejected loan request ${ln.loanNumber} (${ln.employeeName}).`
                                );
                              }}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              deleteEmployeeLoan(ln.id);
                              setRefreshTick((t) => t + 1);
                              setStatusBanner(
                                `Admin deleted loan request ${ln.loanNumber} (${ln.employeeName}) permanently.`
                              );
                            }}
                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
