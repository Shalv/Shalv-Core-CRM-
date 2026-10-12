import { User, UserRole } from '../../types';
import { mergeDayLog, type AttendanceDayLog } from './attendanceLog';
import { recordPendingUserPassword, isRemovedPredefinedUser } from '../../shared/integrity';

function payrollAuthHeaders(extra: Record<string, string> = { 'Content-Type': 'application/json' }): Record<string, string> {
  let token: string | null = null;
  try {
    token = localStorage.getItem('crm_auth_token');
  } catch {
    /* ignore */
  }
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export type EssTabKey =
  | 'overview'
  | 'profile'
  | 'admin_dashboard'
  | 'reports'
  | 'payslips'
  | 'loans'
  | 'leaves'
  | 'reimbursements'
  | 'tax'
  | 'integration'
  | 'admin_master';

export type LoanShortfallPolicy =
  | 'cap_at_max_takehome_pct'
  | 'partial_deduct_carry_forward'
  | 'defer_full_emi_to_next_month';

export type LoanType =
  | 'Personal Loan'
  | 'Salary Advance'
  | 'Emergency Medical Loan'
  | 'Vehicle / Two-Wheeler Loan'
  | 'Education / Skill Loan'
  | 'Festival / Housing Advance';

export type LoanCalculationMethod = 'reducing_balance' | 'flat_rate' | 'interest_free';

export type LoanWorkflowStatus =
  | 'Submitted - Pending HR Verification'
  | 'HR Verified - Pending Manager/HR Approval'
  | 'Approved - Pending Finance Disbursement'
  | 'Returned for Clarification'
  | 'Rejected'
  | 'Cancelled'
  | 'Active - Disbursed'
  | 'Closed - Fully Recovered'
  | 'Closed - Early Preclosure'
  | 'Closed - Exit FnF Settlement';

export interface LoanHrVerification {
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  employeeStatusCheck: 'Active' | 'Probation' | 'Notice Period';
  monthlyGrossSalary: number;
  existingActiveLoansCount: number;
  existingOutstandingBalance: number;
  maxEligibleAmount: number;
  eligibilityPassed: boolean;
  remarks?: string;
}

export interface LoanManagerApproval {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  approvedBy?: string;
  approvedAt?: string;
  approvedAmount?: number;
  interestRateAnnual?: number;
  calculationMethod?: LoanCalculationMethod;
  tenureMonths?: number;
  emiStartMonth?: string;
  calculatedMonthlyEmi?: number;
  remarks?: string;
}

export interface LoanFinanceDisbursement {
  disbursed: boolean;
  authorizedBy?: string;
  disbursementDate?: string;
  paymentMode?:
    | 'NEFT / Bank Transfer'
    | 'RTGS'
    | 'UPI Corporate'
    | 'Cheque'
    | 'Salary Cycle Credit';
  transactionReference?: string;
  disbursedAmount?: number;
  bankName?: string;
  bankAccountNo?: string;
  remarks?: string;
}

export interface LoanEmiInstalment {
  instalmentNo: number;
  dueMonthKey: string; // 'YYYY-MM'
  dueDate: string; // e.g., '30 Sep 2026'
  openingBalance: number;
  principalComponent: number;
  interestComponent: number;
  scheduledEmi: number;
  shortfallAddedFromPrior: number;
  totalDueThisMonth: number;
  deductedAmount: number;
  shortfallCarryForward: number;
  closingBalance: number;
  status:
    | 'Scheduled'
    | 'Recovered via Payroll'
    | 'Partial - Shortfall Carried Forward'
    | 'Deferred / On Hold'
    | 'Settled via Preclosure / Exit FnF';
  payrollRunRef?: string;
  recoveredAt?: string;
  remarks?: string;
}

export interface LoanLedgerEntry {
  id: string;
  date: string;
  monthKey?: string;
  transactionType:
    | 'Disbursement'
    | 'Monthly Payroll EMI Recovery'
    | 'Shortfall Carry-Forward'
    | 'Early Repayment / Preclosure'
    | 'Exit FnF Settlement'
    | 'Admin Adjustment / Reversal';
  reference: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  remarks: string;
  recordedBy: string;
}

export interface LoanClosureRecord {
  closureType:
    | 'Full EMI Recovery'
    | 'Early Lump-Sum Preclosure'
    | 'Employee Exit / Resignation FnF Settlement';
  closureDate: string;
  settlementMode:
    | 'Payroll Auto-Closure'
    | 'Bank Transfer / NEFT'
    | 'Final Salary & Leave Encashment Offset'
    | 'Gratuity / Bonus Offset';
  settlementReference: string;
  remainingPrincipalSettled: number;
  interestWaivedOrAdjusted: number;
  finalSettlementAmount: number;
  exitLastWorkingDay?: string;
  finalSalaryPayableBeforeLoan?: number;
  leaveEncashmentAmount?: number;
  gratuityOrBonusOffset?: number;
  netFnfPayableOrRecoverable?: number;
  approvedBy: string;
  remarks: string;
}

export interface LoanAuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  stage: string;
  action: string;
  remarks: string;
}

export interface EmployeeLoanRecord {
  id: string;
  loanNumber: string;
  employeeId: string;
  empCode: string;
  employeeName: string;
  department: string;
  designation: string;
  monthlyGrossAtApplication: number;
  loanType: LoanType;
  requestedAmount: number;
  approvedAmount: number;
  interestRateAnnual: number;
  calculationMethod: LoanCalculationMethod;
  tenureMonths: number;
  repaymentFrequency: 'Monthly';
  emiStartMonth: string; // 'YYYY-MM'
  monthlyEmi: number;
  totalInterestPayable: number;
  totalPayableAmount: number;
  purpose: string;
  supportingDocumentRef: string;
  applicationDate: string;
  status: LoanWorkflowStatus;
  hrVerification: LoanHrVerification;
  managerApproval: LoanManagerApproval;
  financeDisbursement: LoanFinanceDisbursement;
  emiSchedule: LoanEmiInstalment[];
  ledger: LoanLedgerEntry[];
  disbursedAmount: number;
  totalRecovered: number;
  totalAdjustments: number;
  outstandingBalance: number;
  closure?: LoanClosureRecord;
  auditTrail: LoanAuditLogEntry[];
  updatedAt?: number;
}

export interface AdminPolicyMaster {
  policyCode?: string;
  policyVersion?: string;
  policyTitle?: string;
  plQuota: number;
  clQuota: number;
  slQuota: number;
  compOffQuota: number;
  monthlyLeaveLimit?: number; // 1 leave per month per CS-HR-POL-001
  shiftStartTime: string; // '09:30 AM'
  shiftEndTime: string; // '06:00 PM'
  earlyArrivalCutoff?: string; // '09:00 AM' (Before 9:00 AM recorded as 9:00 AM)
  capEarlyArrival?: boolean; // true
  graceEndTime?: string; // '09:45 AM'
  gracePeriodMins: number; // 15 mins (until 09:45 AM)
  monthlyGraceLimit?: number; // 3 times per month
  lateCycleHalfDayNth?: number; // 4 (4th & 8th late = Half Day)
  lateCycleDeductionDays?: number; // 0.5 day
  middayEntryStartTime?: string; // '12:00 PM'
  middayEntryEndTime?: string; // '01:00 PM'
  middayEntryDeductionDays?: number; // 0.5 day
  postMiddayAbsentDeductionDays?: number; // 1.0 day
  earlyExitAbsentBeforeTime?: string; // '12:30 PM'
  earlyExitHalfDayEndTime?: string; // '04:00 PM'
  regularExitAfterTime?: string; // '04:00 PM'
  dailyBreakWindow?: string; // '01:00 PM - 02:00 PM'
  maxBreakDurationMins?: number; // 60 mins (1 hour)
  breakExceededDeductionDays?: number; // 0.5 day
  holidaySaturdayNumbers?: number[]; // [2, 4] -> 2nd & 4th Saturdays Off
  sundaysOff?: boolean; // true -> All Sundays Off
  weeklyHolidaySaturdays?: string; // '2nd and 4th Saturdays + All Sundays'
  workingSaturdays?: string; // '1st, 3rd and 5th Saturdays'
  requireAdvanceLeaveApproval?: boolean; // true
  payDisbursementDay: string;
  defaultBasicPct: number;
  defaultHraPct: number;
  defaultSpecialPct: number;
  defaultSalesCommissionPct: number;
  defaultPfCapBasic: number;
  defaultProfTax: number;
  defaultTdsPct: number;
  lastPublishedMonth: string;
  loanShortfallPolicy?: LoanShortfallPolicy;
  loanMaxDeductionPctOfNet?: number;
  loanMaxEligibilityMultiple?: number;
  loanDefaultInterestRate?: number;
}

export interface OrgMasterItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PayrollOrgMasters {
  roles: OrgMasterItem[];
  designations: OrgMasterItem[];
  locations: OrgMasterItem[];
  departments: OrgMasterItem[];
}

export interface EmployeeSalaryMasterRecord {
  userId: string;
  empCode: string;
  // Identity fields (used when created as Payroll-Only or synced with CRM)
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  tempPassword?: string;
  mustChangePasswordOnFirstLogin?: boolean;
  accessType?: 'payroll_only' | 'crm_and_payroll';
  phone?: string;
  role?: string;
  department?: string;
  designation?: string;
  location?: string;
  status?: 'Active' | 'Inactive';
  reportingManager?: string;
  assignedTerritory?: string;
  // Cross-system sync flags
  syncedWithCrm?: boolean; // true if user exists in CRM Users Master
  enrolledInPayroll?: boolean; // true if user is enrolled in Payroll Master
  // Compensation & Formula Allocation
  monthlyGross: number;
  basicPct: number;
  hraPct: number;
  specialPct: number;
  commissionPct: number;
  pfAmount?: number;
  profTax: number;
  tdsPct: number;
  lopDays: number;
  loanRecovery?: number;
  advanceRecovery?: number;
  otherDeductions?: number;
  deductionsLockedByAdmin?: boolean;
  // Statutory & Bank Allocation
  panNumber: string;
  uanNumber: string;
  pfAccountNo?: string;
  taxRegime?: 'New Tax Regime (Section 115BAC)' | 'Old Tax Regime (With Exemptions)';
  bankName: string;
  bankAccountNo: string;
  ifscCode: string;
  // Leave Quota & Shift Allocation
  plQuota?: number;
  clQuota?: number;
  slQuota?: number;
  compOffQuota?: number;
  shiftTiming?: string;
  workMode?: 'Office HQ' | 'Work From Home' | 'Client Site Visit';
}

export interface LeaveRequestItem {
  id: string;
  employeeId?: string;
  employeeName?: string;
  leaveType:
    | 'Privilege Leave'
    | 'Casual Leave'
    | 'Sick Leave'
    | 'Comp-Off'
    | 'Monthly Leave (1/Month)'
    | 'Early Exit Approval'
    | 'Half Day Approval'
    | 'Extended Break Approval'
    | 'Emergency Intimation';
  startDate: string;
  endDate: string;
  days: number;
  dayType: 'Full Day' | 'First Half' | 'Second Half' | 'Short Permission';
  reason: string;
  handoverTo: string;
  status: 'Approved' | 'Pending Approval' | 'Cancelled' | 'Unauthorized Absence (LOP)';
  appliedOn: string;
  requestedInAdvance?: boolean;
}

export interface ExpenseClaimItem {
  id: string;
  employeeId?: string;
  employeeName?: string;
  claimNo: string;
  category:
    | 'Client Visit Travel'
    | 'Meals & Client Hospitality'
    | 'Fuel & Cab Conveyance'
    | 'Mobile & Internet'
    | 'Software / Office Supplies';
  expenseDate: string;
  amount: number;
  linkedCustomer: string;
  billNumber: string;
  description: string;
  status: 'Approved & Queued for Payroll' | 'Under Verification' | 'Paid in Payslip';
}

export interface StatutoryDetails {
  empCode: string;
  panNumber: string;
  uanNumber: string;
  pfAccountNo: string;
  bankName: string;
  bankAccountNo: string;
  ifscCode: string;
  taxRegime: 'New Tax Regime (Section 115BAC)' | 'Old Tax Regime (With Exemptions)';
  sec80CDeclared: number;
  sec80DDeclared: number;
  hraMonthlyRent: number;
  npsContribution: number;
}

export interface PayrollIntegrationConfig {
  provider:
    | 'keka'
    | 'zoho_payroll'
    | 'greythr'
    | 'darwinbox'
    | 'razorpayx'
    | 'sap_sf'
    | 'custom';
  providerLabel: string;
  portalUrl: string;
  ssoEnabled: boolean;
  launchMode: 'integrated_ess' | 'embedded_iframe' | 'new_tab';
  operationMode: 'hybrid_bidirectional' | 'standalone_builtin';
  fetchApiEndpoint: string;
  pushWebhookEndpoint: string;
  apiTenantKey: string;
  syncCrmIncentives: boolean;
  syncReimbursements: boolean;
  autoPushAttendanceAndLeaves: boolean;
  fetchedGrossSalaryOverride?: number | null;
  lastSyncedAt: string;
  lastFetchedAt?: string;
  lastPushedAt?: string;
}

export interface SyncLogEntry {
  id: string;
  direction: 'FETCH (PULL FROM PAYROLL)' | 'PUSH (SEND TO PAYROLL)';
  timestamp: string;
  summary: string;
  status: 'Success' | 'Queued';
}

export interface GooglePunchLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
  plusCode?: string;
  accuracyMeters?: number;
  fetchedAt: string;
}

export interface AttendancePunchRecord {
  id: string;
  date: string;
  action: 'PUNCH_IN' | 'PUNCH_OUT';
  time: string;
  workMode: 'Office HQ' | 'Work From Home' | 'Client Site Visit';
  location: GooglePunchLocation;
}

export interface AttendanceSession {
  date: string;
  punchedIn: boolean;
  punchInTime: string | null;
  recordedInTime?: string | null; // Policy CS-HR-POL-001: Before 9:00 AM recorded as 09:00 AM unless management authorizes
  punchOutTime: string | null;
  workMode: 'Office HQ' | 'Work From Home' | 'Client Site Visit';
  locationSharingEnabled?: boolean;
  punchInLocation?: GooglePunchLocation | null;
  punchOutLocation?: GooglePunchLocation | null;
  punchHistory?: AttendancePunchRecord[];
  // Policy CS-HR-POL-001 Tracking Fields
  graceUsedThisMonth?: number; // Max 3 times per month (until 9:45 AM)
  lateCountThisMonth?: number; // 1st-3rd Late, 4th Half Day, 5th-7th Late, 8th Half Day
  breakWindow?: string; // 1:00 PM to 2:00 PM
  breakDurationMins?: number; // Must not exceed 60 mins (1 hour)
  hasPriorApproval?: boolean; // Planned leave, early exit, half days, extended breaks
  managementAuthorizedEarly?: boolean; // Authorizes < 9:00 AM as extra working time
  policyStatus?:
    | 'Regular Day'
    | 'On Time (Grace Used)'
    | 'Late'
    | 'Half Day'
    | 'Absent'
    | 'Awaiting Punch-In';
  policyRemarks?: string;
  dayLog?: AttendanceDayLog;
  dailyRecords?: Record<string, Partial<AttendanceSession> & { date: string }>;
}

export const PROVIDER_PRESETS: Record<
  PayrollIntegrationConfig['provider'],
  { label: string }
> = {
  keka: {
    label: 'Keka HR & Payroll ESS',
  },
  zoho_payroll: {
    label: 'Zoho Payroll Employee Portal',
  },
  greythr: {
    label: 'greytHR Employee Self Service (ESS)',
  },
  darwinbox: {
    label: 'Darwinbox HRMS & Payroll',
  },
  razorpayx: {
    label: 'RazorpayX Payroll ESS Portal',
  },
  sap_sf: {
    label: 'SAP SuccessFactors Employee Central',
  },
  custom: {
    label: 'External Payroll ESS Portal',
  },
};

export const LEGACY_HARDCODED_URLS = new Set([
  'https://app.keka.com/#/me/payroll/salary',
  'https://payroll.zoho.in/portal',
  'https://ess.greythr.com/v3/portal/ess/home',
  'https://app.darwinbox.in/ess/payroll',
  'https://payroll.razorpay.com/ess',
  'https://hcm.ondemand.com/sf/payroll',
  'https://ess.company-payroll.com/portal',
  'https://api.keka.com/v1/payroll/ess/employee-salary',
  'https://api.keka.com/v1/payroll/ess/sync-inputs',
]);

export const PAYSLIP_MONTHS = [
  { key: '2026-09', label: 'September 2026', payDate: '30 Sep 2026', paidDays: 30, lopDays: 0 },
  { key: '2026-08', label: 'August 2026', payDate: '31 Aug 2026', paidDays: 31, lopDays: 0 },
  { key: '2026-07', label: 'July 2026', payDate: '31 Jul 2026', paidDays: 31, lopDays: 0 },
  { key: '2026-06', label: 'June 2026', payDate: '30 Jun 2026', paidDays: 30, lopDays: 0 },
  { key: '2026-05', label: 'May 2026', payDate: '31 May 2026', paidDays: 31, lopDays: 0 },
  { key: '2026-04', label: 'April 2026', payDate: '30 Apr 2026', paidDays: 30, lopDays: 0 },
];

export const getRoleDefaultGross = (role: string): number => {
  switch (role) {
    case 'Super Admin':
      return 185000;
    case 'Administrator':
      return 140000;
    case 'Sales Manager':
    case 'Finance Manager':
      return 115000;
    case 'Sales Executive':
    case 'Finance Executive':
      return 78000;
    default:
      return 95000;
  }
};

export const PAYROLL_MASTERS_STORAGE_KEY = 'crm_ess_admin_employee_masters';
export const PAYROLL_MASTERS_SYNC_EVENT = 'crm-payroll-masters-updated';
export const PAYROLL_ORG_MASTERS_STORAGE_KEY = 'crm_payroll_org_masters';
export const PAYROLL_ORG_MASTERS_SYNC_EVENT = 'crm-payroll-org-masters-updated';
export const PAYROLL_LOANS_STORAGE_KEY = 'crm_ess_employee_loans';
export const PAYROLL_LOANS_SYNC_EVENT = 'crm-payroll-loans-updated';
export const PAYROLL_DELETED_MASTERS_STORAGE_KEY = 'crm_payroll_deleted_master_ids';

// Tombstones for employees deleted from Payroll Master — kept so syncs never
// resurrect a deleted employee's salary record under another user's identity.
export const getDeletedPayrollMasterIds = (): string[] => {
  try {
    const saved = localStorage.getItem(PAYROLL_DELETED_MASTERS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((id: any) => typeof id === 'string' && id) : [];
  } catch {
    return [];
  }
};

export const recordDeletedPayrollMasterIds = (ids: string[]): void => {
  try {
    const next = Array.from(new Set([...getDeletedPayrollMasterIds(), ...ids.filter(Boolean)]));
    localStorage.setItem(PAYROLL_DELETED_MASTERS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const forgetDeletedPayrollMasterIds = (ids: string[]): void => {
  try {
    const drop = new Set(ids.filter(Boolean));
    const next = getDeletedPayrollMasterIds().filter((id) => !drop.has(id));
    localStorage.setItem(PAYROLL_DELETED_MASTERS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const generateRandomPassword = (length = 9): string => {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const specials = '@#$%!';
  let pass = '';
  pass += uppers[Math.floor(Math.random() * uppers.length)];
  pass += letters[Math.floor(Math.random() * letters.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];
  pass += nums[Math.floor(Math.random() * nums.length)];
  const allChars = letters + uppers + nums + specials;
  for (let i = 4; i < length; i++) {
    pass += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return pass;
};

export const getPayrollLoginLink = (email?: string): string => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + window.location.pathname);
  if (email && email.trim()) {
    url.searchParams.set('email', email.trim());
  }
  return url.toString();
};

export const DEFAULT_PAYROLL_ORG_MASTERS: PayrollOrgMasters = {
  roles: [],
  designations: [],
  locations: [],
  departments: [],
};

export const loadPayrollOrgMasters = (): PayrollOrgMasters => {
  try {
    const saved = localStorage.getItem(PAYROLL_ORG_MASTERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        roles: Array.isArray(parsed.roles) ? parsed.roles : [],
        designations: Array.isArray(parsed.designations) ? parsed.designations : [],
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
        departments: Array.isArray(parsed.departments) ? parsed.departments : [],
      };
    }
  } catch {
    // ignore
  }
  return {
    roles: [],
    designations: [],
    locations: [],
    departments: [],
  };
};

export const savePayrollOrgMasters = (
  masters: PayrollOrgMasters,
  dispatchEvent = true
): void => {
  try {
    const nextJson = JSON.stringify(masters);
    const prevJson = localStorage.getItem(PAYROLL_ORG_MASTERS_STORAGE_KEY);
    localStorage.setItem(PAYROLL_ORG_MASTERS_STORAGE_KEY, nextJson);
    if (prevJson !== nextJson) {
      fetch('/api/payroll/org-masters', {
        method: 'POST',
        headers: payrollAuthHeaders(),
        body: JSON.stringify({ orgMasters: masters }),
      }).catch(() => {});
    }
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_ORG_MASTERS_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

export const clearAllPayrollData = (): void => {
  try {
    // Every remaining employee becomes a tombstone so other tabs/sessions drop them too
    const remainingIds = Object.keys(loadEmployeeSalaryMasters());
    recordDeletedPayrollMasterIds(remainingIds);
    localStorage.removeItem(PAYROLL_MASTERS_STORAGE_KEY);
    localStorage.removeItem(PAYROLL_LOANS_STORAGE_KEY);
    // remove any per-employee attendance, leaves, claims
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith('crm_ess_') &&
        key !== 'crm_ess_admin_policy_master' &&
        key !== PAYROLL_ORG_MASTERS_STORAGE_KEY
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    fetch('/api/sync/push', {
      method: 'POST',
      headers: payrollAuthHeaders(),
      body: JSON.stringify({
        replacePayrollMasters: true,
        payrollMasters: {},
        payrollLoans: [],
        payrollAttendance: {},
        payrollLeaves: {},
        payrollClaims: {},
        payrollStatutory: {},
      }),
    }).catch(() => {});
    window.dispatchEvent(new CustomEvent(PAYROLL_MASTERS_SYNC_EVENT));
    window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
    window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    window.dispatchEvent(new CustomEvent(PAYROLL_LOANS_SYNC_EVENT));
  } catch {
    // ignore
  }
};

export const normalizeEmpCode = (code?: string | null): string => {
  if (!code) return '';
  const trimmed = String(code).trim().toUpperCase();
  const numMatch = trimmed.match(/^EMP[-_\s]*(\d+)$/i);
  if (numMatch) {
    return `EMP-${numMatch[1].padStart(3, '0')}`;
  }
  return trimmed;
};

export const getNextAvailableEmpCode = (
  mastersInput?: Record<string, EmployeeSalaryMasterRecord> | EmployeeSalaryMasterRecord[],
  extraCodes: string[] = []
): string => {
  const list: EmployeeSalaryMasterRecord[] = mastersInput
    ? Array.isArray(mastersInput)
      ? mastersInput
      : Object.values(mastersInput)
    : Object.values(loadEmployeeSalaryMasters());
  let maxNum = 100;
  const allCodes = [...list.map((m) => m?.empCode || ''), ...extraCodes];
  for (const raw of allCodes) {
    const match = String(raw || '').trim().match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (Number.isFinite(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
};

export const isDuplicateEmpCode = (
  empCode: string,
  mastersInput: Record<string, EmployeeSalaryMasterRecord> | EmployeeSalaryMasterRecord[],
  excludeUserId?: string
): boolean => {
  const target = normalizeEmpCode(empCode);
  if (!target) return false;
  const list = Array.isArray(mastersInput) ? mastersInput : Object.values(mastersInput || {});
  return list.some(
    (m) => m && m.userId !== excludeUserId && normalizeEmpCode(m.empCode) === target
  );
};

export const sanitizeClientPayrollMaster = (
  record: EmployeeSalaryMasterRecord
): EmployeeSalaryMasterRecord => {
  const {
    password: _p,
    tempPassword: _tp,
    mustChangePasswordOnFirstLogin: _m1,
    ...rest
  } = record as EmployeeSalaryMasterRecord & Record<string, unknown>;
  delete (rest as Record<string, unknown>).passwordHash;
  delete (rest as Record<string, unknown>).mustChangePassword;
  delete (rest as Record<string, unknown>).forcePasswordReset;
  delete (rest as Record<string, unknown>).firstLogin;
  return {
    ...rest,
    mustChangePasswordOnFirstLogin: false,
  };
};

export const buildDefaultSalaryMasterRecord = (
  user: Partial<User> & { id: string; role?: string; empCode?: string; monthlyGross?: number },
  idx = 0,
  defaultBankName = 'HDFC Bank Ltd',
  defaultIfsc = 'HDFC0001245'
): EmployeeSalaryMasterRecord => {
  const existingMasters = loadEmployeeSalaryMasters();
  const requestedCode = user.empCode ? normalizeEmpCode(user.empCode) : '';
  const resolvedEmpCode =
    requestedCode && !isDuplicateEmpCode(requestedCode, existingMasters, user.id)
      ? requestedCode
      : getNextAvailableEmpCode(
          existingMasters,
          idx > 0 ? [`EMP-${String(100 + idx).padStart(3, '0')}`] : []
        );
  const explicitPass = user.password?.trim() || user.tempPassword?.trim() || undefined;
  const effectiveRole = user.role || 'Sales Executive';
  const gross = typeof user.monthlyGross === 'number' && Number.isFinite(user.monthlyGross) ? Math.max(0, user.monthlyGross) : 0;
  return {
    userId: user.id,
    empCode: resolvedEmpCode,
    name: user.name || 'Employee',
    username: user.username || (user.email ? user.email.split('@')[0] : undefined),
    email: user.email || '',
    ...(explicitPass ? { password: explicitPass } : {}),
    mustChangePasswordOnFirstLogin: false,
    accessType: user.accessScope === 'payroll_only' ? 'payroll_only' : (user.accessType || 'crm_and_payroll'),
    phone: user.phone || '+91 98200 00000',
    role: effectiveRole,
    department: user.department || 'Sales',
    designation: user.designation || effectiveRole,
    location: user.location || 'Mumbai HQ',
    status: user.status || 'Active',
    reportingManager: user.reportingManager || 'Vikramaditya Rathore',
    assignedTerritory: user.assignedTerritory || 'All India / Pan-India',
    syncedWithCrm: user.accessScope !== 'payroll_only',
    enrolledInPayroll: true,
    monthlyGross: gross,
    basicPct: 50,
    hraPct: 25,
    specialPct: 18,
    commissionPct: 1.5,
    pfAmount: gross > 0 ? Math.round(Math.min(Math.round(gross * 0.5), 15000) * 0.12) : 0,
    profTax: 200,
    tdsPct: 8.5,
    lopDays: 0,
    loanRecovery: 0,
    advanceRecovery: 0,
    otherDeductions: 0,
    deductionsLockedByAdmin: true,
    panNumber: '',
    uanNumber: '',
    pfAccountNo: '',
    taxRegime: 'New Tax Regime (Section 115BAC)',
    bankName: defaultBankName,
    bankAccountNo: '',
    ifscCode: defaultIfsc,
    plQuota: 12,
    clQuota: 0,
    slQuota: 0,
    compOffQuota: 4,
    shiftTiming: '09:30 AM - 06:00 PM',
    workMode: 'Office HQ',
  };
};

export const loadEmployeeSalaryMasters = (
  _users: User[] = [],
  _defaultBankName = 'HDFC Bank Ltd',
  _defaultIfsc = 'HDFC0001245'
): Record<string, EmployeeSalaryMasterRecord> => {
  try {
    const saved = localStorage.getItem(PAYROLL_MASTERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, EmployeeSalaryMasterRecord>;
      if (parsed && typeof parsed === 'object') {
        const sanitized: Record<string, EmployeeSalaryMasterRecord> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'object' && !isRemovedPredefinedUser({ id: v.userId || k, email: v.email })) {
            sanitized[k] = sanitizeClientPayrollMaster(v);
          }
        }
        return sanitized;
      }
    }
  } catch {
    // ignore
  }
  // Start completely clean and empty as requested: "Remove all data from payroll. I will create it from scratch"
  return {};
};

export const saveEmployeeSalaryMasters = (
  masters: Record<string, EmployeeSalaryMasterRecord>,
  dispatchSyncEvent = false,
  allowEmptyOverwrite = false,
  clearedUserIds: string[] = []
): void => {
  try {
    const nextKeys = Object.keys(masters || {});
    const prevJson = localStorage.getItem(PAYROLL_MASTERS_STORAGE_KEY);
    if (nextKeys.length === 0 && !allowEmptyOverwrite && prevJson) {
      try {
        const prevParsed = JSON.parse(prevJson);
        if (prevParsed && typeof prevParsed === 'object' && Object.keys(prevParsed).length > 0) {
          return;
        }
      } catch {
        // ignore
      }
    }
    const sanitizedForStorage: Record<string, EmployeeSalaryMasterRecord> = {};
    let hasExplicitPasswordUpdate = false;
    for (const [k, v] of Object.entries(masters || {})) {
      if (v && typeof v === 'object') {
        if (v.password || v.tempPassword) {
          hasExplicitPasswordUpdate = true;
          recordPendingUserPassword(v.userId || k, v.password || v.tempPassword);
        }
        sanitizedForStorage[k] = sanitizeClientPayrollMaster(v);
      }
    }
    const nextJson = JSON.stringify(sanitizedForStorage);
    if (prevJson === nextJson && !hasExplicitPasswordUpdate) return;
    localStorage.setItem(PAYROLL_MASTERS_STORAGE_KEY, nextJson);
    // Upsert-safe save: server merges per userId, hashes any newly provided password,
    // and applies delete tombstones.
    fetch('/api/payroll/masters', {
      method: 'POST',
      headers: payrollAuthHeaders(),
      body: JSON.stringify({
        masters,
        patch: !allowEmptyOverwrite,
        deletedUserIds: getDeletedPayrollMasterIds(),
        clearedUserIds,
      }),
    }).catch(() => {});
    if (dispatchSyncEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_MASTERS_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
    }
  } catch {
    // ignore
  }
};

export const PAYROLL_DATA_SYNC_EVENT = 'crm-payroll-data-updated';

const CITY_GOOGLE_COORDINATES: Record<
  string,
  { lat: number; lng: number; formattedAddress: string; plusCode: string; placeId: string }
> = {
  delhi: {
    lat: 28.54584,
    lng: 77.27318,
    formattedAddress: 'Innov8, 211, Okhla Industrial Estate Phase-3, New Delhi, Delhi 110020, India',
    plusCode: '7JWVGVW9+87',
    placeId: 'ChIJLbZ-NFv9DDkRzk0gTkm3wlI',
  },
  mumbai: {
    lat: 19.06598,
    lng: 72.86812,
    formattedAddress: 'One BKC, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051, India',
    plusCode: '7JFJ3V89+96',
    placeId: 'ChIJwe1EZjDG5zsRaYxkjY_tpF0',
  },
  bengaluru: {
    lat: 12.97159,
    lng: 77.59456,
    formattedAddress: 'Prestige Trade Tower, Palace Rd, Bengaluru, Karnataka 560001, India',
    plusCode: '7J4VXJCV+JR',
    placeId: 'ChIJbU60yXAWrjsR4E9-UejD3_g',
  },
  bangalore: {
    lat: 12.97159,
    lng: 77.59456,
    formattedAddress: 'Prestige Trade Tower, Palace Rd, Bengaluru, Karnataka 560001, India',
    plusCode: '7J4VXJCV+JR',
    placeId: 'ChIJbU60yXAWrjsR4E9-UejD3_g',
  },
  pune: {
    lat: 18.55291,
    lng: 73.95012,
    formattedAddress: 'World Trade Center Pune, Kharadi, Pune, Maharashtra 411014, India',
    plusCode: '7JCMHX32+52',
    placeId: 'ChIJARFGZy6_wjsRQ-O_G156789',
  },
  hyderabad: {
    lat: 17.44346,
    lng: 78.37719,
    formattedAddress: 'Raheja Mindspace IT Park, HITEC City, Hyderabad, Telangana 500081, India',
    plusCode: '7J9W99V4+9V',
    placeId: 'ChIJx9Lr6tqZyzsR23456789012',
  },
  chennai: {
    lat: 12.98964,
    lng: 80.24835,
    formattedAddress: 'TIDEL Park, Rajiv Gandhi Salai, Taramani, Chennai, Tamil Nadu 600113, India',
    plusCode: '7M42X6QX+V8',
    placeId: 'ChIJYTN9T-plUjoR34567890123',
  },
  ahmedabad: {
    lat: 23.02251,
    lng: 72.57136,
    formattedAddress: 'GIFT City Tower, SG Highway, Ahmedabad, Gujarat 380054, India',
    plusCode: '7JMJ2HFC+2G',
    placeId: 'ChIJSdRbuoqEXjkR45678901234',
  },
  gurugram: {
    lat: 28.49498,
    lng: 77.08954,
    formattedAddress: 'DLF Cyber City, Phase 2, Sector 24, Gurugram, Haryana 122002, India',
    plusCode: '7JWVF3V6+XR',
    placeId: 'ChIJN1t_tDeuEmsR56789012345',
  },
  kolkata: {
    lat: 22.57264,
    lng: 88.43389,
    formattedAddress: 'Godrej Waterside, Sector V, Bidhannagar, Kolkata, West Bengal 700091, India',
    plusCode: '7MJCGCFM+3H',
    placeId: 'ChIJZ_YISduC-DkR67890123456',
  },
};

export const getVerifiedGoogleCoordsForLocation = (
  locationStr = 'New Delhi',
  empIndex = 0,
  fetchedAt = '09:18 AM'
): GooglePunchLocation => {
  const lower = (locationStr || 'New Delhi').toLowerCase();
  const matchedKey =
    Object.keys(CITY_GOOGLE_COORDINATES).find((k) => lower.includes(k)) || 'delhi';
  const base = CITY_GOOGLE_COORDINATES[matchedKey];
  // Small deterministic micro-offset per employee index so multiple employees in same city have distinct pins on map
  const latOffset = ((empIndex % 5) - 2) * 0.0006;
  const lngOffset = ((empIndex % 4) - 1.5) * 0.0006;
  return {
    lat: Number((base.lat + latOffset).toFixed(5)),
    lng: Number((base.lng + lngOffset).toFixed(5)),
    formattedAddress: base.formattedAddress,
    placeId: base.placeId,
    plusCode: base.plusCode,
    accuracyMeters: 14 + (empIndex % 8),
    fetchedAt,
  };
};

export const loadEmployeeAttendance = (
  empId: string,
  empLocation = 'New Delhi',
  todayIso = new Date().toISOString().split('T')[0],
  empIndex = 0
): AttendanceSession => {
  const storageKey = `crm_ess_${empId}_attendance`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as AttendanceSession;
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return {
    date: todayIso,
    punchedIn: false,
    punchInTime: null,
    recordedInTime: null,
    punchOutTime: null,
    workMode: 'Office HQ',
    locationSharingEnabled: false,
    punchInLocation: null,
    punchOutLocation: null,
    graceUsedThisMonth: 0,
    lateCountThisMonth: 0,
    breakWindow: '01:00 PM - 02:00 PM',
    breakDurationMins: 0,
    hasPriorApproval: false,
    managementAuthorizedEarly: false,
    policyStatus: 'Awaiting Punch-In',
    policyRemarks: 'Awaiting punch-in for today shift',
    punchHistory: [],
  };
};

export const saveEmployeeAttendance = (
  empId: string,
  attendance: AttendanceSession,
  dispatchEvent = false,
  options?: { skipDayLogMerge?: boolean }
): void => {
  const storageKey = `crm_ess_${empId}_attendance`;
  try {
    const prev = loadEmployeeAttendance(empId);
    const nextDailyRecords: Record<string, Partial<AttendanceSession> & { date: string }> = {
      ...(prev.dailyRecords || {}),
      ...(attendance.dailyRecords || {}),
    };
    if (attendance.date && (attendance.punchInTime || attendance.punchOutTime || attendance.punchedIn)) {
      const { dailyRecords: _dr, dayLog: _dl, ...daySnapshot } = attendance;
      nextDailyRecords[attendance.date] = {
        ...(nextDailyRecords[attendance.date] || {}),
        ...daySnapshot,
        date: attendance.date,
      };
    }
    const nextDayLog = options?.skipDayLogMerge
      ? attendance.dayLog || {}
      : mergeDayLog(prev.dayLog, attendance);
    const mergedAttendance: AttendanceSession = {
      ...attendance,
      dailyRecords: nextDailyRecords,
      dayLog: nextDayLog,
    };
    const nextJson = JSON.stringify(mergedAttendance);
    const prevJson = localStorage.getItem(storageKey);
    if (prevJson === nextJson) return;
    localStorage.setItem(storageKey, nextJson);
    if (empId) {
      fetch(`/api/payroll/ess/${encodeURIComponent(empId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: mergedAttendance }),
      }).catch(() => {});
    }
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

export const loadEmployeeLeaves = (
  empId: string,
  _empName = 'Employee',
  _handoverName = 'Team Lead',
  _empIndex = 0
): LeaveRequestItem[] => {
  const storageKey = `crm_ess_${empId}_leaves`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as LeaveRequestItem[];
      if (Array.isArray(parsed)) {
        return parsed.map((lv) => ({
          ...lv,
          employeeId: lv.employeeId || empId,
          employeeName: lv.employeeName || _empName,
        }));
      }
    }
  } catch {
    // ignore
  }

  // Clean empty list when starting from scratch
  return [];
};

export const saveEmployeeLeaves = (
  empId: string,
  leaves: LeaveRequestItem[],
  dispatchEvent = false
): void => {
  const storageKey = `crm_ess_${empId}_leaves`;
  try {
    const nextJson = JSON.stringify(leaves);
    const prevJson = localStorage.getItem(storageKey);
    if (prevJson === nextJson) return;
    localStorage.setItem(storageKey, nextJson);
    if (empId) {
      fetch(`/api/payroll/ess/${encodeURIComponent(empId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaves }),
      }).catch(() => {});
    }
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

export const loadEmployeeClaims = (
  empId: string,
  _empName = 'Employee',
  _defaultCustomer = 'Enterprise Client Visit',
  _empIndex = 0
): ExpenseClaimItem[] => {
  const storageKey = `crm_ess_${empId}_claims`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as ExpenseClaimItem[];
      if (Array.isArray(parsed)) {
        return parsed.map((cl) => ({
          ...cl,
          employeeId: cl.employeeId || empId,
          employeeName: cl.employeeName || _empName,
        }));
      }
    }
  } catch {
    // ignore
  }

  // Clean empty list when starting from scratch
  return [];
};

export const saveEmployeeClaims = (
  empId: string,
  claims: ExpenseClaimItem[],
  dispatchEvent = false
): void => {
  const storageKey = `crm_ess_${empId}_claims`;
  try {
    const nextJson = JSON.stringify(claims);
    const prevJson = localStorage.getItem(storageKey);
    if (prevJson === nextJson) return;
    localStorage.setItem(storageKey, nextJson);
    if (empId) {
      fetch(`/api/payroll/ess/${encodeURIComponent(empId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claims }),
      }).catch(() => {});
    }
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

// ============================================================================
// COREENACT SOLUTIONS · EMPLOYEE ROLLOUT
// Attendance, Working Hours & Leave Policy (Policy CS-HR-POL-001 · Version 1.0)
// ============================================================================

export const COREENACT_HR_POLICY_CS_001 = {
  code: 'CS-HR-POL-001',
  version: '1.0',
  organization: 'COREENACT SOLUTIONS · EMPLOYEE ROLLOUT',
  title: 'Attendance, Working Hours & Leave Policy',
  workingHours: {
    standardTimings: '9:30 AM – 6:00 PM',
    shiftStart: '09:30 AM',
    shiftEnd: '06:00 PM',
    description: 'Report by 9:30 AM and stay available during working hours.',
    weeklyHolidays: '2nd and 4th Saturdays + All Sundays',
    workingSaturdays: '1st, 3rd and 5th Saturdays (5th Saturday applies wherever relevant)',
  },
  earlyArrivalAndGrace: {
    earlyArrivalRule: 'Before 9:00 AM -> Recorded as 9:00 AM',
    earlyArrivalNote:
      'Early arrival is not extra working time unless management authorizes it.',
    graceCutoff: 'Until 9:45 AM',
    graceLimitPerMonth: 3,
    graceNote:
      'Grace, 3 times per month. For occasional delays only. It does not extend the 9:30 AM reporting time.',
  },
  lateComingCycle: [
    { instances: '1st, 2nd, 3rd', treatment: 'Late' },
    { instances: '4th', treatment: 'Half Day' },
    { instances: '5th, 6th, 7th', treatment: 'Late' },
    { instances: '8th', treatment: 'Half Day' },
  ],
  lateCycleNote:
    'The cycle continues through the month (every 4th late instance = Half Day). Repeated lateness may lead to further action.',
  middayEntryAndEarlyExit: [
    { situation: 'Entry between 12:00 PM and 1:00 PM (without approval)', status: 'Half Day' },
    { situation: 'Exit before 12:30 PM (without approval)', status: 'Absent' },
    { situation: 'Exit between 12:30 PM and 4:00 PM (without approval)', status: 'Half Day' },
    {
      situation: 'Exit after 4:00 PM',
      status: 'Regular day, if hours and break rules are met',
    },
  ],
  leavesBreaksApprovals: {
    leavePerMonth: 1,
    leaveNote:
      '1 leave per month. Request in advance. Absence without approval is unauthorized absence.',
    breakDuration: '1 hour',
    breakWindow: '1:00 PM to 2:00 PM',
    breakNote:
      'Break per working day – 1:00 PM to 2:00 PM. Total break time must not exceed one hour.',
    approvalNote:
      'Get it first: Planned leave, early exit, half days, extended breaks. In emergencies, tell your manager or HR quickly.',
  },
  responsibilities: [
    'Report on time and record attendance correctly',
    'Use the grace facility responsibly',
    'Get approval for leave and permissions',
    'Keep breaks within one hour',
    'Tell your manager about emergencies',
  ],
};

export const parseTimeToMinutes = (timeStr: string | null | undefined): number | null => {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match12 = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3];
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return null;
};

export const DEFAULT_ADMIN_POLICY_MASTER: AdminPolicyMaster = {
  policyCode: 'CS-HR-POL-001',
  policyVersion: '1.0',
  policyTitle: 'Attendance, Working Hours & Leave Policy',
  plQuota: 12,
  clQuota: 0,
  slQuota: 0,
  compOffQuota: 4,
  monthlyLeaveLimit: 1,
  shiftStartTime: '09:30 AM',
  shiftEndTime: '06:00 PM',
  earlyArrivalCutoff: '09:00 AM',
  capEarlyArrival: true,
  graceEndTime: '09:45 AM',
  gracePeriodMins: 15,
  monthlyGraceLimit: 3,
  lateCycleHalfDayNth: 4,
  lateCycleDeductionDays: 0.5,
  middayEntryStartTime: '12:00 PM',
  middayEntryEndTime: '01:00 PM',
  middayEntryDeductionDays: 0.5,
  postMiddayAbsentDeductionDays: 1,
  earlyExitAbsentBeforeTime: '12:30 PM',
  earlyExitHalfDayEndTime: '04:00 PM',
  regularExitAfterTime: '04:00 PM',
  dailyBreakWindow: '01:00 PM - 02:00 PM',
  maxBreakDurationMins: 60,
  breakExceededDeductionDays: 0.5,
  holidaySaturdayNumbers: [2, 4],
  sundaysOff: true,
  weeklyHolidaySaturdays: '2nd and 4th Saturdays + All Sundays',
  workingSaturdays: '1st, 3rd and 5th Saturdays',
  requireAdvanceLeaveApproval: true,
  payDisbursementDay: 'Last Working Day of Month',
  defaultBasicPct: 50,
  defaultHraPct: 25,
  defaultSpecialPct: 18,
  defaultSalesCommissionPct: 1.5,
  defaultPfCapBasic: 15000,
  defaultProfTax: 200,
  defaultTdsPct: 8.5,
  lastPublishedMonth: 'September 2026',
  loanShortfallPolicy: 'cap_at_max_takehome_pct',
  loanMaxDeductionPctOfNet: 50,
  loanMaxEligibilityMultiple: 3,
  loanDefaultInterestRate: 8.5,
};

export const loadAdminPolicyMaster = (): AdminPolicyMaster => {
  try {
    const saved = localStorage.getItem('crm_ess_admin_policy_master');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_ADMIN_POLICY_MASTER,
        ...parsed,
        shiftEndTime:
          parsed.shiftEndTime === '06:30 PM' || !parsed.shiftEndTime
            ? DEFAULT_ADMIN_POLICY_MASTER.shiftEndTime
            : parsed.shiftEndTime,
        holidaySaturdayNumbers: Array.isArray(parsed.holidaySaturdayNumbers)
          ? parsed.holidaySaturdayNumbers
          : [2, 4],
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_ADMIN_POLICY_MASTER };
};

export const saveAdminPolicyMaster = (
  policy: AdminPolicyMaster,
  dispatchEvent = false
): void => {
  try {
    const nextJson = JSON.stringify(policy);
    const prevJson = localStorage.getItem('crm_ess_admin_policy_master');
    if (prevJson === nextJson) return;
    localStorage.setItem('crm_ess_admin_policy_master', nextJson);
    fetch('/api/payroll/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy }),
    }).catch(() => {});
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_MASTERS_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

export const getSaturdayCalendarInfo = (dateIso: string, policy?: AdminPolicyMaster) => {
  const pol = policy || DEFAULT_ADMIN_POLICY_MASTER;
  const holidaySats = pol.holidaySaturdayNumbers || [2, 4];
  const sundaysOff = pol.sundaysOff !== false;
  const d = dateIso ? new Date(`${dateIso}T00:00:00`) : new Date();
  const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
  const dateNum = d.getDate();
  if (dayOfWeek === 0 && sundaysOff) {
    return {
      isHoliday: true,
      dayType: 'Sunday Holiday',
      badge: 'Weekly Holiday (Sunday)',
      detail: `All Sundays are holidays (${pol.policyCode || 'CS-HR-POL-001'})`,
    };
  }
  if (dayOfWeek === 6) {
    const nthSaturday = Math.ceil(dateNum / 7);
    const ordinal =
      nthSaturday === 1
        ? '1st'
        : nthSaturday === 2
        ? '2nd'
        : nthSaturday === 3
        ? '3rd'
        : nthSaturday === 4
        ? '4th'
        : '5th';
    const isHolidaySat = holidaySats.includes(nthSaturday);
    return {
      isHoliday: isHolidaySat,
      dayType: isHolidaySat ? `${ordinal} Saturday (Holiday)` : `${ordinal} Saturday (Working)`,
      badge: isHolidaySat
        ? `Holiday (${ordinal} Saturday)`
        : `Working (${ordinal} Saturday)`,
      detail: isHolidaySat
        ? `${pol.weeklyHolidaySaturdays || '2nd and 4th Saturdays'} are holidays (${pol.policyCode || 'CS-HR-POL-001'})`
        : `${pol.workingSaturdays || '1st, 3rd and 5th Saturdays'} are working days (${pol.policyCode || 'CS-HR-POL-001'})`,
    };
  }
  return {
    isHoliday: false,
    dayType: 'Standard Working Day',
    badge: `Working Day (${pol.shiftStartTime} – ${pol.shiftEndTime})`,
    detail: `Report by ${pol.shiftStartTime} and stay available until ${pol.shiftEndTime} (${pol.policyCode || 'CS-HR-POL-001'})`,
  };
};

export interface PolicyEvaluationResult {
  recordedInTime: string | null;
  earlyArrivalCapped: boolean;
  entryRuleLabel: string;
  exitRuleLabel: string;
  finalStatus:
    | 'Regular Day'
    | 'On Time (Grace Used)'
    | 'Late'
    | 'Half Day'
    | 'Absent'
    | 'Awaiting Punch-In';
  deductionDays: number;
  graceUsedAfter: number;
  lateCountAfter: number;
  breakCompliant: boolean;
  summaryCitation: string;
  badgeColor: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';
}

export const evaluateAttendancePolicy = (params: {
  punchInTime: string | null;
  punchOutTime?: string | null;
  priorGraceUsed?: number;
  priorLateCount?: number;
  hasPriorApproval?: boolean;
  managementAuthorizedEarly?: boolean;
  breakDurationMins?: number;
  policy?: AdminPolicyMaster;
}): PolicyEvaluationResult => {
  const {
    punchInTime,
    punchOutTime = null,
    priorGraceUsed = 0,
    priorLateCount = 0,
    hasPriorApproval = false,
    managementAuthorizedEarly = false,
    breakDurationMins = 60,
    policy,
  } = params;

  const pol = policy || DEFAULT_ADMIN_POLICY_MASTER;
  const maxBreakMins = pol.maxBreakDurationMins ?? 60;
  const breakCompliant = breakDurationMins <= maxBreakMins;

  if (!punchInTime) {
    return {
      recordedInTime: null,
      earlyArrivalCapped: false,
      entryRuleLabel: 'Not Punched In',
      exitRuleLabel: 'Not Punched Out',
      finalStatus: 'Awaiting Punch-In',
      deductionDays: 0,
      graceUsedAfter: priorGraceUsed,
      lateCountAfter: priorLateCount,
      breakCompliant,
      summaryCitation: `Report by ${pol.shiftStartTime || '09:30 AM'} (Policy ${pol.policyCode || 'CS-HR-POL-001'})`,
      badgeColor: 'slate',
    };
  }

  const inMins = parseTimeToMinutes(punchInTime);
  const outMins = parseTimeToMinutes(punchOutTime);

  // Dynamic policy thresholds from AdminPolicyMaster:
  const earlyCutoffStr = pol.earlyArrivalCutoff || '09:00 AM';
  const earlyCutoffMins = parseTimeToMinutes(earlyCutoffStr) ?? 540;
  const capEarly = pol.capEarlyArrival !== false;

  const shiftStartStr = pol.shiftStartTime || '09:30 AM';
  const shiftStartMins = parseTimeToMinutes(shiftStartStr) ?? 570;

  const graceEndStr = pol.graceEndTime || '09:45 AM';
  const graceEndMins = parseTimeToMinutes(graceEndStr) ?? 585;
  const graceLimit = pol.monthlyGraceLimit ?? 3;

  const lateCycleNth = pol.lateCycleHalfDayNth ?? 4;
  const lateCycleDed = pol.lateCycleDeductionDays ?? 0.5;

  const middayStartStr = pol.middayEntryStartTime || '12:00 PM';
  const middayStartMins = parseTimeToMinutes(middayStartStr) ?? 720;
  const middayEndStr = pol.middayEntryEndTime || '01:00 PM';
  const middayEndMins = parseTimeToMinutes(middayEndStr) ?? 780;
  const middayDed = pol.middayEntryDeductionDays ?? 0.5;
  const postMiddayDed = pol.postMiddayAbsentDeductionDays ?? 1.0;

  const earlyExitAbsentStr = pol.earlyExitAbsentBeforeTime || '12:30 PM';
  const earlyExitAbsentMins = parseTimeToMinutes(earlyExitAbsentStr) ?? 750;
  const earlyExitHalfEndStr = pol.earlyExitHalfDayEndTime || '04:00 PM';
  const earlyExitHalfEndMins = parseTimeToMinutes(earlyExitHalfEndStr) ?? 960;
  const shiftEndStr = pol.shiftEndTime || '06:00 PM';
  const shiftEndMins = parseTimeToMinutes(shiftEndStr) ?? 1080;
  const breakDed = pol.breakExceededDeductionDays ?? 0.5;

  let recordedInTime = punchInTime;
  let earlyArrivalCapped = false;
  let entryRuleLabel = `On Time (<= ${shiftStartStr})`;
  let entryStatus: PolicyEvaluationResult['finalStatus'] = 'Regular Day';
  let entryDeduction = 0;
  let graceUsedAfter = priorGraceUsed;
  let lateCountAfter = priorLateCount;

  if (inMins !== null) {
    if (inMins < earlyCutoffMins) {
      if (capEarly && !managementAuthorizedEarly) {
        recordedInTime = earlyCutoffStr;
        earlyArrivalCapped = true;
        entryRuleLabel = `Before ${earlyCutoffStr} -> Recorded as ${earlyCutoffStr} (No extra time unless authorized)`;
      } else {
        entryRuleLabel = `Before ${earlyCutoffStr} (Management Authorized Early Arrival)`;
      }
      entryStatus = 'Regular Day';
    } else if (inMins <= shiftStartMins) {
      entryRuleLabel = `Reported by ${shiftStartStr} (On Time)`;
      entryStatus = 'Regular Day';
    } else if (inMins <= graceEndMins) {
      if (priorGraceUsed < graceLimit) {
        graceUsedAfter = priorGraceUsed + 1;
        entryRuleLabel = `Grace Period Used (${graceUsedAfter}/${graceLimit} this month · Until ${graceEndStr})`;
        entryStatus = 'On Time (Grace Used)';
      } else {
        lateCountAfter = priorLateCount + 1;
        const isNthTrigger = lateCycleNth > 0 && lateCountAfter % lateCycleNth === 0;
        if (isNthTrigger && !hasPriorApproval) {
          entryStatus = 'Half Day';
          entryDeduction = lateCycleDed;
          entryRuleLabel = `Grace Exhausted (${graceLimit}/${graceLimit}) -> Late Instance #${lateCountAfter} (Every ${lateCycleNth}th Late = Half Day)`;
        } else {
          entryStatus = 'Late';
          entryRuleLabel = `Grace Exhausted (${graceLimit}/${graceLimit}) -> Late Instance #${lateCountAfter} (Marked Late)`;
        }
      }
    } else if (inMins < middayStartMins) {
      lateCountAfter = priorLateCount + 1;
      const isNthTrigger = lateCycleNth > 0 && lateCountAfter % lateCycleNth === 0;
      if (isNthTrigger && !hasPriorApproval) {
        entryStatus = 'Half Day';
        entryDeduction = lateCycleDed;
        entryRuleLabel = `Late-Coming Cycle #${lateCountAfter} (${lateCountAfter}th Late = Half Day Treatment)`;
      } else {
        entryStatus = 'Late';
        entryRuleLabel = `Late-Coming Cycle #${lateCountAfter} (Marked Late · Half Day on every ${lateCycleNth}th)`;
      }
    } else if (inMins >= middayStartMins && inMins <= middayEndMins) {
      entryStatus = 'Half Day';
      entryDeduction = middayDed;
      entryRuleLabel = hasPriorApproval
        ? `Midday Entry (${middayStartStr} – ${middayEndStr}) with Prior Approval (Half Day)`
        : `Midday Entry between ${middayStartStr} and ${middayEndStr} (Without Approval) -> Half Day`;
    } else {
      if (hasPriorApproval) {
        entryStatus = 'Half Day';
        entryDeduction = middayDed;
        entryRuleLabel = `Post ${middayEndStr} Entry (With Prior Manager/HR Approval)`;
      } else {
        entryStatus = 'Absent';
        entryDeduction = postMiddayDed;
        entryRuleLabel = `Entry after ${middayEndStr} (Without Prior Approval) -> Unauthorized Absent`;
      }
    }
  }

  let exitRuleLabel = `Active Shift (Standard ${shiftEndStr} close)`;
  let finalStatus = entryStatus;
  let deductionDays = entryDeduction;

  if (outMins !== null) {
    if (outMins < earlyExitAbsentMins) {
      if (hasPriorApproval) {
        exitRuleLabel = `Exit before ${earlyExitAbsentStr} (Prior Emergency/Leave Approval on file)`;
        if (deductionDays < 0.5) {
          finalStatus = 'Half Day';
          deductionDays = 0.5;
        }
      } else {
        exitRuleLabel = `Exit before ${earlyExitAbsentStr} (Without Approval) -> Absent`;
        finalStatus = 'Absent';
        deductionDays = 1;
      }
    } else if (outMins >= earlyExitAbsentMins && outMins < earlyExitHalfEndMins) {
      exitRuleLabel = hasPriorApproval
        ? `Exit between ${earlyExitAbsentStr} and ${earlyExitHalfEndStr} (With Prior Approval) -> Half Day`
        : `Exit between ${earlyExitAbsentStr} and ${earlyExitHalfEndStr} (Without Approval) -> Half Day`;
      if (deductionDays < 1) {
        finalStatus = 'Half Day';
        deductionDays = Math.max(deductionDays, 0.5);
      }
    } else {
      if (!breakCompliant && !hasPriorApproval) {
        exitRuleLabel = `Exit after ${earlyExitHalfEndStr}, but break (${breakDurationMins}m) exceeded ${maxBreakMins}m without approval`;
        if (deductionDays === 0) {
          finalStatus = 'Half Day';
          deductionDays = breakDed;
        }
      } else {
        exitRuleLabel =
          outMins >= shiftEndMins
            ? `Standard Exit at/after ${shiftEndStr} -> Regular Day (Hours & ${maxBreakMins}m break met)`
            : `Exit after ${earlyExitHalfEndStr} -> Regular Day (Hours & ${maxBreakMins}m break rules met)`;
      }
    }
  } else if (!breakCompliant && !hasPriorApproval && deductionDays === 0) {
    exitRuleLabel = `Break (${breakDurationMins}m) exceeded ${maxBreakMins}m limit (${pol.dailyBreakWindow || '01:00 PM - 02:00 PM'})`;
  }

  const badgeColor: PolicyEvaluationResult['badgeColor'] =
    finalStatus === 'Regular Day'
      ? 'emerald'
      : finalStatus === 'On Time (Grace Used)'
      ? 'sky'
      : finalStatus === 'Late'
      ? 'amber'
      : finalStatus === 'Half Day'
      ? 'amber'
      : finalStatus === 'Absent'
      ? 'rose'
      : 'slate';

  const summaryCitation = punchOutTime
    ? `${entryRuleLabel} · ${exitRuleLabel}`
    : entryRuleLabel;

  return {
    recordedInTime,
    earlyArrivalCapped,
    entryRuleLabel,
    exitRuleLabel,
    finalStatus,
    deductionDays,
    graceUsedAfter,
    lateCountAfter,
    breakCompliant,
    summaryCitation,
    badgeColor,
  };
};

// ============================================================================
// UNIFIED POLICY CS-HR-POL-001 CALCULATION ENGINE
// (Calendar Working Days, Daily Shift Hours, Leave Quota & Monthly Payroll)
// ============================================================================

export interface MonthCalendarPolicyStats {
  monthKey: string;
  totalCalendarDays: number;
  sundaysCount: number;
  secondAndFourthSaturdaysCount: number;
  workingSaturdaysCount: number;
  totalWeeklyHolidays: number;
  scheduledWorkingDays: number;
  standardGrossShiftHoursPerDay: number; // 8.5 hrs (9:30 AM – 6:00 PM)
  mandatoryBreakHoursPerDay: number; // 1.0 hr (1:00 PM – 2:00 PM)
  netWorkingHoursPerDay: number; // 7.5 hrs net work
  totalMonthlyNetWorkingHours: number;
}

export const calculateMonthCalendarStats = (
  monthKey: string,
  policy?: AdminPolicyMaster
): MonthCalendarPolicyStats => {
  const pol = policy || DEFAULT_ADMIN_POLICY_MASTER;
  const holidaySats = pol.holidaySaturdayNumbers || [2, 4];
  const sundaysOff = pol.sundaysOff !== false;
  const parts = (monthKey || '2026-09').split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const monthNum = parseInt(parts[1], 10) || 9; // 1..12
  const totalCalendarDays = new Date(year, monthNum, 0).getDate();

  let sundaysCount = 0;
  let saturdayIndex = 0;
  let secondAndFourthSaturdaysCount = 0;
  let workingSaturdaysCount = 0;

  for (let day = 1; day <= totalCalendarDays; day++) {
    const d = new Date(year, monthNum - 1, day);
    const dow = d.getDay();
    if (dow === 0) {
      if (sundaysOff) sundaysCount++;
    } else if (dow === 6) {
      saturdayIndex++;
      if (holidaySats.includes(saturdayIndex)) {
        secondAndFourthSaturdaysCount++;
      } else {
        workingSaturdaysCount++;
      }
    }
  }

  const totalWeeklyHolidays = sundaysCount + secondAndFourthSaturdaysCount;
  const scheduledWorkingDays = totalCalendarDays - totalWeeklyHolidays;
  const startMins = parseTimeToMinutes(pol.shiftStartTime) ?? 570;
  const endMins = parseTimeToMinutes(pol.shiftEndTime) ?? 1080;
  const standardGrossShiftHoursPerDay = Math.max(
    1,
    Number(((endMins - startMins) / 60).toFixed(1))
  );
  const mandatoryBreakHoursPerDay = Number(
    ((pol.maxBreakDurationMins ?? 60) / 60).toFixed(1)
  );
  const netWorkingHoursPerDay = Math.max(
    1,
    Number((standardGrossShiftHoursPerDay - mandatoryBreakHoursPerDay).toFixed(1))
  );
  const totalMonthlyNetWorkingHours = Number(
    (scheduledWorkingDays * netWorkingHoursPerDay).toFixed(1)
  );

  return {
    monthKey,
    totalCalendarDays,
    sundaysCount,
    secondAndFourthSaturdaysCount,
    workingSaturdaysCount,
    totalWeeklyHolidays,
    scheduledWorkingDays,
    standardGrossShiftHoursPerDay,
    mandatoryBreakHoursPerDay,
    netWorkingHoursPerDay,
    totalMonthlyNetWorkingHours,
  };
};

export interface DailyShiftHoursResult {
  rawInTime: string | null;
  recordedInTime: string | null;
  earlyArrivalCapped: boolean;
  outTime: string | null;
  grossShiftMins: number;
  breakDeductionMins: number;
  excessBreakMins: number;
  netWorkedMins: number;
  grossHoursFormatted: string;
  netHoursFormatted: string;
  meetsStandardHoursAndBreak: boolean;
}

export const calculateDailyShiftHours = (params: {
  punchInTime: string | null;
  punchOutTime: string | null;
  managementAuthorizedEarly?: boolean;
  breakDurationMins?: number;
  maxBreakDurationMins?: number;
  policy?: AdminPolicyMaster;
}): DailyShiftHoursResult => {
  const {
    punchInTime,
    punchOutTime,
    managementAuthorizedEarly = false,
    breakDurationMins = 60,
    maxBreakDurationMins,
    policy,
  } = params;

  const pol = policy || DEFAULT_ADMIN_POLICY_MASTER;
  const effectiveMaxBreak = maxBreakDurationMins ?? pol.maxBreakDurationMins ?? 60;
  const earlyCutoffStr = pol.earlyArrivalCutoff || '09:00 AM';
  const earlyCutoffMins = parseTimeToMinutes(earlyCutoffStr) ?? 540;
  const capEarly = pol.capEarlyArrival !== false;
  const shiftStartMins = parseTimeToMinutes(pol.shiftStartTime) ?? 570;
  const regularExitMins = parseTimeToMinutes(pol.regularExitAfterTime || '04:00 PM') ?? 960;

  const formatMins = (totalMins: number) => {
    const safe = Math.max(0, Math.round(totalMins));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  if (!punchInTime) {
    return {
      rawInTime: null,
      recordedInTime: null,
      earlyArrivalCapped: false,
      outTime: punchOutTime,
      grossShiftMins: 0,
      breakDeductionMins: 0,
      excessBreakMins: 0,
      netWorkedMins: 0,
      grossHoursFormatted: '00h 00m',
      netHoursFormatted: '00h 00m',
      meetsStandardHoursAndBreak: false,
    };
  }

  const rawInMins = parseTimeToMinutes(punchInTime);
  const outMins = parseTimeToMinutes(punchOutTime);

  const earlyArrivalCapped =
    capEarly && rawInMins !== null && rawInMins < earlyCutoffMins && !managementAuthorizedEarly;
  const effectiveInMins =
    rawInMins === null ? shiftStartMins : earlyArrivalCapped ? earlyCutoffMins : rawInMins;
  const recordedInTime = earlyArrivalCapped ? earlyCutoffStr : punchInTime;

  if (outMins === null || outMins <= effectiveInMins) {
    return {
      rawInTime: punchInTime,
      recordedInTime,
      earlyArrivalCapped,
      outTime: punchOutTime,
      grossShiftMins: 0,
      breakDeductionMins: Math.min(breakDurationMins, effectiveMaxBreak),
      excessBreakMins: Math.max(0, breakDurationMins - effectiveMaxBreak),
      netWorkedMins: 0,
      grossHoursFormatted: punchOutTime ? '00h 00m' : 'Active Shift',
      netHoursFormatted: punchOutTime ? '00h 00m' : 'Active Shift',
      meetsStandardHoursAndBreak: false,
    };
  }

  const grossShiftMins = Math.max(0, outMins - effectiveInMins);
  const spansBreakWindow = effectiveInMins < 840 && outMins > 780;
  const actualBreakTaken = spansBreakWindow ? Math.max(effectiveMaxBreak, breakDurationMins) : 0;
  const excessBreakMins = Math.max(0, breakDurationMins - effectiveMaxBreak);
  const netWorkedMins = Math.max(0, grossShiftMins - actualBreakTaken);

  const meetsStandardHoursAndBreak =
    outMins >= regularExitMins && excessBreakMins === 0 && grossShiftMins >= 390;

  return {
    rawInTime: punchInTime,
    recordedInTime,
    earlyArrivalCapped,
    outTime: punchOutTime,
    grossShiftMins,
    breakDeductionMins: actualBreakTaken,
    excessBreakMins,
    netWorkedMins,
    grossHoursFormatted: formatMins(grossShiftMins),
    netHoursFormatted: formatMins(netWorkedMins),
    meetsStandardHoursAndBreak,
  };
};

export interface PolicyPayrollBreakdown {
  calendar: MonthCalendarPolicyStats;
  baseMonthlyGross: number;
  perCalendarDayRate: number;
  perWorkingDayRate: number;
  // Attendance & Leave Policy Metrics
  graceUsedThisMonth: number;
  graceLimitPerMonth: number;
  graceRemaining: number;
  lateCountThisMonth: number;
  lateCycleHalfDays: number;
  middayOrEarlyExitLopDays: number;
  breakViolationLopDays: number;
  // Leave Policy (1 Leave / Month)
  monthlyLeaveLimit: number;
  approvedMonthlyLeaveDays: number;
  paidLeaveDaysAllowed: number;
  excessMonthlyLeaveLopDays: number;
  unauthorizedAbsenceLopDays: number;
  manualAdminLopDays: number;
  // Consolidated LOP & Paid Days
  lopDays: number;
  paidDays: number;
  workingDaysAttended: number;
  // Rupee Deduction Breakdown by Policy Rule
  lateCycleDeductionAmount: number;
  middayOrEarlyExitDeductionAmount: number;
  leavePolicyDeductionAmount: number;
  manualLopDeductionAmount: number;
  policyLopDeductionAmount: number;
  // Earnings & Statutory Split
  adjustedGross: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  incentive: number;
  grossEarnings: number;
  pfDeduction: number;
  professionalTax: number;
  incomeTaxTds: number;
  loanRecovery: number;
  advanceRecovery: number;
  otherDeductions: number;
  scheduledLoanEmi: number;
  loanShortfallAmount: number;
  loanShortfallPolicyApplied: string | null;
  activeLoanInstalments: Array<{
    loanId: string;
    loanNumber: string;
    loanType: LoanType;
    instalmentNo: number;
    tenureMonths: number;
    scheduledEmi: number;
    deductedEmi: number;
    shortfall: number;
    balanceAfter: number;
    alreadyReconciled: boolean;
  }>;
  totalDeductions: number;
  approvedReimbursements: number;
  netPayable: number;
  policyEval: PolicyEvaluationResult;
  shiftHours: DailyShiftHoursResult;
}

// ============================================================================
// EMPLOYEE LOAN & SALARY ADVANCE MANAGEMENT ENGINE
// ============================================================================

export const formatMonthKeyLabel = (monthKey: string): { label: string; dueDate: string } => {
  const parts = (monthKey || '2026-09').split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 9;
  const dateObj = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const monthLong = dateObj.toLocaleString('en-IN', { month: 'long' });
  const monthShort = dateObj.toLocaleString('en-IN', { month: 'short' });
  return {
    label: `${monthLong} ${year}`,
    dueDate: `${String(lastDay).padStart(2, '0')} ${monthShort} ${year}`,
  };
};

export const addMonthsToMonthKey = (startMonthKey: string, offsetMonths: number): string => {
  const parts = (startMonthKey || '2026-09').split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 9;
  const totalMonths = year * 12 + (month - 1) + offsetMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

export const generateLoanAmortizationSchedule = (params: {
  principal: number;
  interestRateAnnual: number;
  tenureMonths: number;
  calculationMethod: LoanCalculationMethod;
  emiStartMonth: string;
}): {
  monthlyEmi: number;
  totalInterestPayable: number;
  totalPayableAmount: number;
  schedule: LoanEmiInstalment[];
} => {
  const principal = Math.max(0, Math.round(params.principal || 0));
  const tenure = Math.max(1, Math.min(120, Math.round(params.tenureMonths || 1)));
  const rateAnnual =
    params.calculationMethod === 'interest_free'
      ? 0
      : Math.max(0, Number(params.interestRateAnnual || 0));
  const startMonth = params.emiStartMonth || '2026-09';

  if (principal <= 0) {
    return {
      monthlyEmi: 0,
      totalInterestPayable: 0,
      totalPayableAmount: 0,
      schedule: [],
    };
  }

  const schedule: LoanEmiInstalment[] = [];

  if (params.calculationMethod === 'interest_free' || rateAnnual === 0) {
    const baseEmi = Math.round(principal / tenure);
    let opening = principal;
    for (let i = 1; i <= tenure; i++) {
      const dueMonthKey = addMonthsToMonthKey(startMonth, i - 1);
      const { dueDate } = formatMonthKeyLabel(dueMonthKey);
      const prinComp = i === tenure ? opening : Math.min(opening, baseEmi);
      const closing = Math.max(0, opening - prinComp);
      schedule.push({
        instalmentNo: i,
        dueMonthKey,
        dueDate,
        openingBalance: opening,
        principalComponent: prinComp,
        interestComponent: 0,
        scheduledEmi: prinComp,
        shortfallAddedFromPrior: 0,
        totalDueThisMonth: prinComp,
        deductedAmount: 0,
        shortfallCarryForward: 0,
        closingBalance: closing,
        status: 'Scheduled',
      });
      opening = closing;
    }
    return {
      monthlyEmi: baseEmi,
      totalInterestPayable: 0,
      totalPayableAmount: principal,
      schedule,
    };
  }

  if (params.calculationMethod === 'flat_rate') {
    const totalInterest = Math.round(principal * (rateAnnual / 100) * (tenure / 12));
    const totalPayable = principal + totalInterest;
    const monthlyEmi = Math.round(totalPayable / tenure);
    const monthlyInterest = Math.round(totalInterest / tenure);
    let opening = principal;

    for (let i = 1; i <= tenure; i++) {
      const dueMonthKey = addMonthsToMonthKey(startMonth, i - 1);
      const { dueDate } = formatMonthKeyLabel(dueMonthKey);
      const prinComp =
        i === tenure ? opening : Math.min(opening, Math.max(0, monthlyEmi - monthlyInterest));
      const intComp =
        i === tenure
          ? Math.max(0, totalInterest - monthlyInterest * (tenure - 1))
          : monthlyInterest;
      const emiThisMonth = prinComp + intComp;
      const closing = Math.max(0, opening - prinComp);
      schedule.push({
        instalmentNo: i,
        dueMonthKey,
        dueDate,
        openingBalance: opening,
        principalComponent: prinComp,
        interestComponent: intComp,
        scheduledEmi: emiThisMonth,
        shortfallAddedFromPrior: 0,
        totalDueThisMonth: emiThisMonth,
        deductedAmount: 0,
        shortfallCarryForward: 0,
        closingBalance: closing,
        status: 'Scheduled',
      });
      opening = closing;
    }
    return {
      monthlyEmi,
      totalInterestPayable: totalInterest,
      totalPayableAmount: totalPayable,
      schedule,
    };
  }

  // Default: 'reducing_balance' (Monthly Rest Standard Amortization)
  const monthlyRate = rateAnnual / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenure);
  const rawEmi = (principal * monthlyRate * factor) / (factor - 1);
  const monthlyEmi = Math.round(rawEmi);

  let opening = principal;
  let totalInterestAcc = 0;

  for (let i = 1; i <= tenure; i++) {
    const dueMonthKey = addMonthsToMonthKey(startMonth, i - 1);
    const { dueDate } = formatMonthKeyLabel(dueMonthKey);
    const interestComp = Math.round(opening * monthlyRate);
    const principalComp =
      i === tenure ? opening : Math.min(opening, Math.max(0, monthlyEmi - interestComp));
    const scheduledEmi = principalComp + interestComp;
    const closing = Math.max(0, opening - principalComp);
    totalInterestAcc += interestComp;

    schedule.push({
      instalmentNo: i,
      dueMonthKey,
      dueDate,
      openingBalance: opening,
      principalComponent: principalComp,
      interestComponent: interestComp,
      scheduledEmi,
      shortfallAddedFromPrior: 0,
      totalDueThisMonth: scheduledEmi,
      deductedAmount: 0,
      shortfallCarryForward: 0,
      closingBalance: closing,
      status: 'Scheduled',
    });
    opening = closing;
  }

  return {
    monthlyEmi,
    totalInterestPayable: totalInterestAcc,
    totalPayableAmount: principal + totalInterestAcc,
    schedule,
  };
};

export const loadAllEmployeeLoans = (): EmployeeLoanRecord[] => {
  try {
    const saved = localStorage.getItem(PAYROLL_LOANS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
};

export const saveAllEmployeeLoans = (
  loans: EmployeeLoanRecord[],
  dispatchEvent = true,
  deletedLoanId?: string
): void => {
  try {
    const nextJson = JSON.stringify(loans);
    const prevJson = localStorage.getItem(PAYROLL_LOANS_STORAGE_KEY);
    if (prevJson === nextJson && !deletedLoanId) return;
    localStorage.setItem(PAYROLL_LOANS_STORAGE_KEY, nextJson);
    fetch('/api/payroll/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loans, deletedLoanId }),
    }).catch(() => {});
    if (deletedLoanId) {
      fetch(`/api/payroll/loans/${encodeURIComponent(deletedLoanId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PAYROLL_LOANS_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent(PAYROLL_DATA_SYNC_EVENT));
    }
  } catch {
    // ignore
  }
};

export const rejectEmployeeLoan = (params: {
  loanId: string;
  actorName: string;
  actorRole: string;
  isAdminUser: boolean;
  remarks?: string;
}): EmployeeLoanRecord[] => {
  const allLoans = loadAllEmployeeLoans();
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const reasonText =
    params.remarks?.trim() ||
    (params.isAdminUser
      ? 'Loan request rejected by Admin / HR Management.'
      : 'Loan request rejected / withdrawn by Employee.');

  const nextLoans = allLoans.map((ln) => {
    if (ln.id !== params.loanId) return ln;
    return {
      ...ln,
      status: 'Rejected' as LoanWorkflowStatus,
      outstandingBalance: 0,
      updatedAt: Date.now(),
      managerApproval: {
        ...ln.managerApproval,
        status: 'Rejected' as const,
        approvedBy: `${params.actorName} (${params.actorRole})`,
        approvedAt: nowStr,
        remarks: reasonText,
      },
      auditTrail: [
        {
          id: `AUD-REJ-${Date.now()}`,
          timestamp: nowStr,
          actorName: params.actorName,
          actorRole: params.actorRole,
          stage: params.isAdminUser
            ? '3. Admin / HR Rejection'
            : '1. Employee Loan Rejection',
          action: params.isAdminUser
            ? 'Rejected Loan Application (Admin)'
            : 'Rejected / Withdrew Loan Request (Employee)',
          remarks: reasonText,
        },
        ...(ln.auditTrail || []),
      ],
    };
  });

  saveAllEmployeeLoans(nextLoans, true);
  return nextLoans;
};

export const deleteEmployeeLoan = (loanId: string): EmployeeLoanRecord[] => {
  const allLoans = loadAllEmployeeLoans();
  const nextLoans = allLoans.filter((ln) => ln.id !== loanId);
  saveAllEmployeeLoans(nextLoans, true, loanId);
  return nextLoans;
};

export const loadEmployeeLoans = (empId: string): EmployeeLoanRecord[] => {
  if (!empId) return [];
  return loadAllEmployeeLoans().filter((ln) => ln.employeeId === empId);
};

export const reconcileMonthlyLoanDeductions = (params: {
  monthKey: string;
  actorName: string;
  actorRole: string;
  employeeMasters: Record<string, EmployeeSalaryMasterRecord>;
  policy: AdminPolicyMaster;
}): {
  reconciledCount: number;
  skippedAlreadyReconciled: number;
  shortfallCount: number;
  closedLoansCount: number;
  totalRecoveredThisRun: number;
  updatedLoans: EmployeeLoanRecord[];
} => {
  const { monthKey, actorName, actorRole, employeeMasters, policy } = params;
  const allLoans = loadAllEmployeeLoans();
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const todayIso = new Date().toISOString().split('T')[0];

  let reconciledCount = 0;
  let skippedAlreadyReconciled = 0;
  let shortfallCount = 0;
  let closedLoansCount = 0;
  let totalRecoveredThisRun = 0;

  const updatedLoans = allLoans.map((loan) => {
    // Rule 1: Only reconcile approved, active disbursed loans
    if (loan.status !== 'Active - Disbursed') return loan;

    const dueIdx = loan.emiSchedule.findIndex((inst) => inst.dueMonthKey === monthKey);
    if (dueIdx === -1) return loan;

    const inst = loan.emiSchedule[dueIdx];

    // Rule 2: Prevent duplicate EMI deduction if payroll is recalculated or re-reconciled
    if (
      inst.status === 'Recovered via Payroll' ||
      inst.status === 'Settled via Preclosure / Exit FnF' ||
      Boolean(inst.payrollRunRef)
    ) {
      skippedAlreadyReconciled++;
      return loan;
    }

    if (inst.status === 'Deferred / On Hold') {
      return loan;
    }

    // Compute employee's payroll breakdown for this month to check sufficient salary & shortfall policy
    const empMaster = employeeMasters[loan.employeeId];
    const calc = empMaster
      ? calculateEmployeePolicyPayroll({
          monthKey,
          master: empMaster,
          policy,
          loansOverride: [loan],
        })
      : null;

    const matchedBreak = calc?.activeLoanInstalments.find((x) => x.loanId === loan.id);
    const totalDue = inst.totalDueThisMonth || inst.scheduledEmi;
    const actualDeducted = matchedBreak
      ? matchedBreak.deductedEmi
      : Math.min(totalDue, loan.outstandingBalance);
    const shortfall = Math.max(0, totalDue - actualDeducted);

    if (shortfall > 0) {
      shortfallCount++;
    }

    const payrollRunRef = `PAY-${monthKey}-${loan.loanNumber}-EMI${inst.instalmentNo}`;
    const nextSchedule = loan.emiSchedule.map((item, idx) => {
      if (idx === dueIdx) {
        return {
          ...item,
          deductedAmount: actualDeducted,
          shortfallCarryForward: shortfall,
          status: (shortfall > 0
            ? 'Partial - Shortfall Carried Forward'
            : 'Recovered via Payroll') as LoanEmiInstalment['status'],
          payrollRunRef,
          recoveredAt: nowStr,
          remarks:
            shortfall > 0
              ? `Recovered ₹${actualDeducted.toLocaleString('en-IN')}; Shortfall ₹${shortfall.toLocaleString('en-IN')} carried forward per policy (${policy.loanShortfallPolicy || 'cap_at_max_takehome_pct'}).`
              : `Full EMI recovered in ${monthKey} payroll run (${payrollRunRef}).`,
        };
      }
      // Carry forward shortfall to next scheduled instalment
      if (idx === dueIdx + 1 && shortfall > 0) {
        const nextShortfallAdded = (item.shortfallAddedFromPrior || 0) + shortfall;
        return {
          ...item,
          shortfallAddedFromPrior: nextShortfallAdded,
          totalDueThisMonth: item.scheduledEmi + nextShortfallAdded,
        };
      }
      return item;
    });

    const newTotalRecovered = loan.totalRecovered + actualDeducted;
    const newOutstanding = Math.max(
      0,
      loan.totalPayableAmount - newTotalRecovered - (loan.totalAdjustments || 0)
    );

    const newLedgerEntries: LoanLedgerEntry[] = [...loan.ledger];
    if (actualDeducted > 0) {
      newLedgerEntries.push({
        id: `LDG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: todayIso,
        monthKey,
        transactionType: 'Monthly Payroll EMI Recovery',
        reference: payrollRunRef,
        debit: 0,
        credit: actualDeducted,
        balanceAfter: newOutstanding,
        remarks: `Payroll EMI #${inst.instalmentNo}/${loan.tenureMonths} recovered for ${monthKey}`,
        recordedBy: `${actorName} (${actorRole})`,
      });
    }
    if (shortfall > 0) {
      newLedgerEntries.push({
        id: `LDG-SF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: todayIso,
        monthKey,
        transactionType: 'Shortfall Carry-Forward',
        reference: `${payrollRunRef}-SF`,
        debit: 0,
        credit: 0,
        balanceAfter: newOutstanding,
        remarks: `Insufficient salary shortfall ₹${shortfall.toLocaleString('en-IN')} carried forward to next month`,
        recordedBy: `${actorName} (${actorRole})`,
      });
    }

    const isFullyRecovered = newOutstanding <= 0;
    if (isFullyRecovered) {
      closedLoansCount++;
    }
    reconciledCount++;
    totalRecoveredThisRun += actualDeducted;

    const nextAudit: LoanAuditLogEntry[] = [
      {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowStr,
        actorName,
        actorRole,
        stage: isFullyRecovered ? '8. Loan Closure (Auto)' : '7. Loan Balance Reconciliation',
        action: isFullyRecovered
          ? `EMI #${inst.instalmentNo} Recovered & Loan Auto-Closed`
          : shortfall > 0
          ? `Partial EMI Recovered (Shortfall Policy Applied)`
          : `EMI #${inst.instalmentNo} Reconciled with Payroll (${monthKey})`,
        remarks: `Deducted ₹${actualDeducted.toLocaleString('en-IN')} (${payrollRunRef}). Outstanding Balance: ₹${newOutstanding.toLocaleString('en-IN')}.`,
      },
      ...loan.auditTrail,
    ];

    return {
      ...loan,
      emiSchedule: nextSchedule,
      ledger: newLedgerEntries,
      totalRecovered: newTotalRecovered,
      outstandingBalance: newOutstanding,
      status: isFullyRecovered ? ('Closed - Fully Recovered' as LoanWorkflowStatus) : loan.status,
      closure: isFullyRecovered
        ? {
            closureType: 'Full EMI Recovery' as const,
            closureDate: todayIso,
            settlementMode: 'Payroll Auto-Closure' as const,
            settlementReference: payrollRunRef,
            remainingPrincipalSettled: actualDeducted,
            interestWaivedOrAdjusted: 0,
            finalSettlementAmount: actualDeducted,
            approvedBy: `${actorName} (${actorRole})`,
            remarks: `Automatically closed upon full recovery of all instalments in ${monthKey} payroll cycle.`,
          }
        : loan.closure,
      auditTrail: nextAudit,
    };
  });

  saveAllEmployeeLoans(updatedLoans, true);

  return {
    reconciledCount,
    skippedAlreadyReconciled,
    shortfallCount,
    closedLoansCount,
    totalRecoveredThisRun,
    updatedLoans,
  };
};

export const calculateEmployeePolicyPayroll = (params: {
  monthKey: string;
  master: EmployeeSalaryMasterRecord;
  policy: AdminPolicyMaster;
  attendance?: AttendanceSession;
  leaves?: LeaveRequestItem[];
  claims?: ExpenseClaimItem[];
  crmSalesIncentive?: number;
  syncCrmIncentives?: boolean;
  syncReimbursements?: boolean;
  grossOverride?: number | null;
  loansOverride?: EmployeeLoanRecord[];
}): PolicyPayrollBreakdown => {
  const {
    monthKey,
    master,
    policy,
    attendance,
    leaves = [],
    claims = [],
    crmSalesIncentive = 0,
    syncCrmIncentives = true,
    syncReimbursements = true,
    grossOverride = null,
    loansOverride,
  } = params;

  const calendar = calculateMonthCalendarStats(monthKey, policy);
  const rawGross =
    grossOverride !== null && grossOverride !== undefined
      ? Number(grossOverride)
      : Number(master.monthlyGross ?? 0);
  const baseMonthlyGross = Number.isFinite(rawGross) && rawGross >= 0 ? rawGross : 0;
  const perCalendarDayRate = Math.round(baseMonthlyGross / calendar.totalCalendarDays);
  const perWorkingDayRate = Math.round(baseMonthlyGross / calendar.scheduledWorkingDays);

  const graceLimitPerMonth = policy.monthlyGraceLimit ?? 3;
  const lateCycleNth = policy.lateCycleHalfDayNth ?? 4;
  const lateCycleDedDays = policy.lateCycleDeductionDays ?? 0.5;
  const monthlyLeaveLimit = policy.monthlyLeaveLimit ?? 1;
  const maxBreakMins = policy.maxBreakDurationMins ?? 60;

  const isSessionInMonth = !attendance?.date || attendance.date.startsWith(monthKey);
  const graceUsedThisMonth = isSessionInMonth
    ? Math.min(graceLimitPerMonth, attendance?.graceUsedThisMonth ?? 0)
    : 0;
  const graceRemaining = Math.max(0, graceLimitPerMonth - graceUsedThisMonth);
  const lateCountThisMonth = isSessionInMonth ? attendance?.lateCountThisMonth ?? 0 : 0;

  const policyEval = evaluateAttendancePolicy({
    punchInTime: isSessionInMonth ? attendance?.punchInTime || null : null,
    punchOutTime: isSessionInMonth ? attendance?.punchOutTime || null : null,
    priorGraceUsed: Math.max(0, graceUsedThisMonth - 1),
    priorLateCount: Math.max(0, lateCountThisMonth - 1),
    hasPriorApproval: isSessionInMonth ? attendance?.hasPriorApproval || false : false,
    managementAuthorizedEarly: isSessionInMonth
      ? attendance?.managementAuthorizedEarly || false
      : false,
    breakDurationMins: isSessionInMonth ? attendance?.breakDurationMins ?? 45 : 45,
    policy,
  });

  const shiftHours = calculateDailyShiftHours({
    punchInTime: isSessionInMonth ? attendance?.punchInTime || null : null,
    punchOutTime: isSessionInMonth ? attendance?.punchOutTime || null : null,
    managementAuthorizedEarly: isSessionInMonth
      ? attendance?.managementAuthorizedEarly || false
      : false,
    breakDurationMins: isSessionInMonth ? attendance?.breakDurationMins ?? 45 : 45,
    maxBreakDurationMins: maxBreakMins,
    policy,
  });

  // 1. Late-Coming Cycle Deduction (Configurable by Admin):
  const lateCycleHalfDays =
    lateCycleNth > 0
      ? Number((Math.floor(lateCountThisMonth / lateCycleNth) * lateCycleDedDays).toFixed(1))
      : 0;

  // 2. Midday Entry & Early Exit Deduction (Configurable by Admin) across all recorded days in monthKey
  const middayStartMins = parseTimeToMinutes(policy.middayEntryStartTime || '12:00 PM') ?? 720;
  const middayEndMins = parseTimeToMinutes(policy.middayEntryEndTime || '01:00 PM') ?? 780;
  const earlyExitAbsentMins =
    parseTimeToMinutes(policy.earlyExitAbsentBeforeTime || '12:30 PM') ?? 750;
  const earlyExitHalfEndMins =
    parseTimeToMinutes(policy.earlyExitHalfDayEndTime || '04:00 PM') ?? 960;
  const middayDed = policy.middayEntryDeductionDays ?? 0.5;
  const postMiddayDed = policy.postMiddayAbsentDeductionDays ?? 1.0;

  const monthAttendanceRecordsMap = new Map<string, Partial<AttendanceSession>>();
  if (attendance?.dailyRecords && typeof attendance.dailyRecords === 'object') {
    for (const [k, rec] of Object.entries(attendance.dailyRecords)) {
      const dKey = rec?.date || k;
      if (dKey && dKey.startsWith(monthKey)) {
        monthAttendanceRecordsMap.set(dKey, rec);
      }
    }
  }
  if (attendance && isSessionInMonth) {
    const sessionKey = attendance.date || `${monthKey}-01`;
    if (!monthAttendanceRecordsMap.has(sessionKey)) {
      monthAttendanceRecordsMap.set(sessionKey, attendance);
    }
  }

  let middayOrEarlyExitLopDays = 0;
  let breakViolationLopDays = 0;
  for (const dayRec of monthAttendanceRecordsMap.values()) {
    if (dayRec.hasPriorApproval) continue;
    const inMins = parseTimeToMinutes(dayRec.punchInTime);
    const outMins = parseTimeToMinutes(dayRec.punchOutTime);
    let dayMiddayOrEarlyLop = 0;
    if (outMins !== null && outMins < earlyExitAbsentMins) {
      dayMiddayOrEarlyLop = 1.0;
    } else if (outMins !== null && outMins >= earlyExitAbsentMins && outMins < earlyExitHalfEndMins) {
      dayMiddayOrEarlyLop = 0.5;
    } else if (inMins !== null && inMins > middayEndMins) {
      dayMiddayOrEarlyLop = postMiddayDed;
    } else if (inMins !== null && inMins >= middayStartMins && inMins <= middayEndMins) {
      dayMiddayOrEarlyLop = middayDed;
    }
    middayOrEarlyExitLopDays += dayMiddayOrEarlyLop;

    const dayBreakMins = dayRec.breakDurationMins ?? 45;
    if (dayBreakMins > maxBreakMins && dayMiddayOrEarlyLop === 0) {
      breakViolationLopDays += policy.breakExceededDeductionDays ?? 0.5;
    }
  }

  // 4. Leave Policy Calculation (1 Leave per Month — Page 6)
  const monthStartIso = `${monthKey}-01`;
  const monthEndIso = `${monthKey}-${String(calendar.totalCalendarDays).padStart(2, '0')}`;
  const getLeaveDaysInSelectedMonth = (lv: LeaveRequestItem): number => {
    if (!lv.startDate) return Number(lv.days || 0);
    const sDate = lv.startDate;
    const eDate = lv.endDate || lv.startDate;
    if (eDate < monthStartIso || sDate > monthEndIso) return 0;
    if (sDate >= monthStartIso && eDate <= monthEndIso) return Number(lv.days || 0);
    const startMs = Date.parse(`${sDate > monthStartIso ? sDate : monthStartIso}T00:00:00Z`);
    const endMs = Date.parse(`${eDate < monthEndIso ? eDate : monthEndIso}T00:00:00Z`);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return 0;
    const overlapDays = Math.round((endMs - startMs) / 86400000) + 1;
    return Math.min(Number(lv.days || overlapDays), overlapDays);
  };

  // Permission-only categories do not consume the 1 full-day leave quota unless they are actual leave days
  const isLeaveQuotaType = (t: LeaveRequestItem['leaveType']) =>
    t === 'Monthly Leave (1/Month)' ||
    t === 'Privilege Leave' ||
    t === 'Casual Leave' ||
    t === 'Sick Leave';

  const approvedMonthlyLeaveDays = leaves
    .filter((lv) => lv.status === 'Approved' && isLeaveQuotaType(lv.leaveType))
    .reduce((sum, lv) => sum + getLeaveDaysInSelectedMonth(lv), 0);

  // Up to 1 leave per month is paid; any excess beyond monthlyLeaveLimit is LOP
  const paidLeaveDaysAllowed = Math.min(approvedMonthlyLeaveDays, monthlyLeaveLimit);
  const excessMonthlyLeaveLopDays = Math.max(
    0,
    Number((approvedMonthlyLeaveDays - monthlyLeaveLimit).toFixed(1))
  );

  // Absence without approval is unauthorized absence (LOP) scoped to selected month
  const unauthorizedAbsenceLopDays = leaves
    .filter((lv) => lv.status === 'Unauthorized Absence (LOP)')
    .reduce((sum, lv) => sum + getLeaveDaysInSelectedMonth(lv), 0);

  const manualAdminLopDays = master.lopDays || 0;

  // Total Policy LOP Days
  const lopDays = Number(
    (
      manualAdminLopDays +
      lateCycleHalfDays +
      middayOrEarlyExitLopDays +
      breakViolationLopDays +
      excessMonthlyLeaveLopDays +
      unauthorizedAbsenceLopDays
    ).toFixed(1)
  );

  const paidDays = Math.max(0, Number((calendar.totalCalendarDays - lopDays).toFixed(1)));
  const workingDaysAttended = Math.max(
    0,
    Number((calendar.scheduledWorkingDays - lopDays - paidLeaveDaysAllowed).toFixed(1))
  );

  const paidFactor = Math.max(0, paidDays / calendar.totalCalendarDays);
  const adjustedGross = Math.round(baseMonthlyGross * paidFactor);
  const policyLopDeductionAmount = Math.max(0, baseMonthlyGross - adjustedGross);

  const lateCycleDeductionAmount = Math.round(
    (baseMonthlyGross * lateCycleHalfDays) / calendar.totalCalendarDays
  );
  const middayOrEarlyExitDeductionAmount = Math.round(
    (baseMonthlyGross * (middayOrEarlyExitLopDays + breakViolationLopDays)) /
      calendar.totalCalendarDays
  );
  const leavePolicyDeductionAmount = Math.round(
    (baseMonthlyGross * (excessMonthlyLeaveLopDays + unauthorizedAbsenceLopDays)) /
      calendar.totalCalendarDays
  );
  const manualLopDeductionAmount = Math.max(
    0,
    policyLopDeductionAmount -
      lateCycleDeductionAmount -
      middayOrEarlyExitDeductionAmount -
      leavePolicyDeductionAmount
  );

  const basicPct = Math.max(0, (master.basicPct ?? policy.defaultBasicPct) / 100);
  const hraPct = Math.max(0, (master.hraPct ?? policy.defaultHraPct) / 100);
  const specialPct = Math.max(0, (master.specialPct ?? policy.defaultSpecialPct) / 100);

  const basic = Math.min(adjustedGross, Math.round(adjustedGross * basicPct));
  const hra = Math.min(Math.max(0, adjustedGross - basic), Math.round(adjustedGross * hraPct));
  const specialAllowance = Math.min(
    Math.max(0, adjustedGross - basic - hra),
    Math.round(adjustedGross * specialPct)
  );
  const conveyance = Math.max(0, adjustedGross - basic - hra - specialAllowance);
  const incentive = syncCrmIncentives ? crmSalesIncentive : 0;

  const approvedReimbursements = syncReimbursements
    ? claims
        .filter(
          (c) =>
            c.status === 'Approved & Queued for Payroll' &&
            (!c.expenseDate || c.expenseDate.startsWith(monthKey))
        )
        .reduce((s, c) => s + c.amount, 0)
    : 0;

  const grossEarnings = basic + hra + specialAllowance + conveyance + incentive;
  const pfDeduction =
    grossEarnings <= 0
      ? 0
      : typeof master.pfAmount === 'number' && !Number.isNaN(master.pfAmount) && master.pfAmount >= 0
      ? Math.round(master.pfAmount)
      : Math.round(Math.min(basic, policy.defaultPfCapBasic || 15000) * 0.12);
  const professionalTax =
    grossEarnings <= 0
      ? 0
      : typeof master.profTax === 'number' && !Number.isNaN(master.profTax)
      ? Math.round(master.profTax)
      : policy.defaultProfTax;
  const tdsRate =
    (typeof master.tdsPct === 'number' && !Number.isNaN(master.tdsPct)
      ? master.tdsPct
      : policy.defaultTdsPct) / 100;
  const incomeTaxTds = grossEarnings <= 0 ? 0 : Math.round(grossEarnings * tdsRate);
  const statutoryDeductions = pfDeduction + professionalTax + incomeTaxTds;
  const otherDeductions =
    typeof master.otherDeductions === 'number' && !Number.isNaN(master.otherDeductions)
      ? Math.max(0, Math.round(master.otherDeductions))
      : 0;

  // ==========================================================================
  // STEP 6: PAYROLL LOAN & SALARY ADVANCE EMI INTEGRATION
  // Rules:
  // 1. Deduct automatically ONLY for approved, active ('Active - Disbursed') loans
  //    (or loans that already had an instalment reconciled in this specific monthKey).
  // 2. Do NOT deduct the same EMI twice if payroll is recalculated (idempotent per loan + monthKey).
  // 3. Apply configurable Insufficient Salary / Shortfall Policy if net salary before loan is insufficient.
  // ==========================================================================
  const empLoans = loansOverride ?? (master.userId ? loadEmployeeLoans(master.userId) : []);
  const netPayBeforeLoans = Math.max(0, grossEarnings - statutoryDeductions - otherDeductions);
  const shortfallPolicy: LoanShortfallPolicy =
    policy.loanShortfallPolicy || 'cap_at_max_takehome_pct';
  const maxDedPct = policy.loanMaxDeductionPctOfNet ?? 50;
  const maxAllowedLoanDeductionPool =
    shortfallPolicy === 'cap_at_max_takehome_pct'
      ? Math.round(netPayBeforeLoans * (maxDedPct / 100))
      : netPayBeforeLoans;

  let remainingDeductionCapacity = maxAllowedLoanDeductionPool;
  let computedLoanEmiRecovery = 0;
  let computedAdvanceEmiRecovery = 0;
  let scheduledLoanEmi = 0;
  let loanShortfallAmount = 0;
  let loanShortfallPolicyApplied: string | null = null;
  const activeLoanInstalments: PolicyPayrollBreakdown['activeLoanInstalments'] = [];

  empLoans.forEach((loan) => {
    const inst = loan.emiSchedule?.find((i) => i.dueMonthKey === monthKey);
    if (!inst) return;

    const alreadyReconciled =
      inst.status === 'Recovered via Payroll' ||
      inst.status === 'Partial - Shortfall Carried Forward' ||
      Boolean(inst.payrollRunRef);

    // Only process if loan is currently Active - Disbursed OR if this month's instalment was already reconciled
    if (loan.status !== 'Active - Disbursed' && !alreadyReconciled) {
      return;
    }
    if (inst.status === 'Deferred / On Hold' || inst.status === 'Settled via Preclosure / Exit FnF') {
      return;
    }

    const dueAmount = Math.min(
      loan.outstandingBalance > 0 ? loan.outstandingBalance + (alreadyReconciled ? inst.deductedAmount : 0) : inst.totalDueThisMonth || inst.scheduledEmi,
      inst.totalDueThisMonth || inst.scheduledEmi
    );
    scheduledLoanEmi += dueAmount;

    let deductedThisLoan = 0;
    let shortfallThisLoan = 0;

    if (alreadyReconciled) {
      // Rule 2: Idempotent — use exact reconciled amount, never deduct twice on recalculation
      deductedThisLoan = inst.deductedAmount;
      shortfallThisLoan = inst.shortfallCarryForward || 0;
      remainingDeductionCapacity = Math.max(0, remainingDeductionCapacity - deductedThisLoan);
    } else {
      // Calculate deduction per Shortfall Policy
      if (dueAmount <= remainingDeductionCapacity) {
        deductedThisLoan = dueAmount;
        shortfallThisLoan = 0;
        remainingDeductionCapacity -= deductedThisLoan;
      } else {
        if (shortfallPolicy === 'defer_full_emi_to_next_month') {
          deductedThisLoan = 0;
          shortfallThisLoan = dueAmount;
          loanShortfallPolicyApplied = `Deferred Full EMI (Exceeds ${maxDedPct}% Net Salary Cap)`;
        } else if (shortfallPolicy === 'cap_at_max_takehome_pct') {
          deductedThisLoan = Math.max(0, remainingDeductionCapacity);
          shortfallThisLoan = Math.max(0, dueAmount - deductedThisLoan);
          remainingDeductionCapacity = 0;
          loanShortfallPolicyApplied = `Capped at ${maxDedPct}% of Net Pay (₹${shortfallThisLoan.toLocaleString('en-IN')} Shortfall Carried Forward)`;
        } else {
          // partial_deduct_carry_forward
          deductedThisLoan = Math.max(0, remainingDeductionCapacity);
          shortfallThisLoan = Math.max(0, dueAmount - deductedThisLoan);
          remainingDeductionCapacity = 0;
          loanShortfallPolicyApplied = `Partial Deduction Applied (₹${shortfallThisLoan.toLocaleString('en-IN')} Shortfall Carried Forward)`;
        }
      }
    }

    loanShortfallAmount += shortfallThisLoan;

    if (loan.loanType === 'Salary Advance') {
      computedAdvanceEmiRecovery += deductedThisLoan;
    } else {
      computedLoanEmiRecovery += deductedThisLoan;
    }

    const postBalance = alreadyReconciled
      ? Math.max(0, inst.closingBalance)
      : Math.max(0, loan.outstandingBalance - deductedThisLoan);

    activeLoanInstalments.push({
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      loanType: loan.loanType,
      instalmentNo: inst.instalmentNo,
      tenureMonths: loan.tenureMonths,
      scheduledEmi: dueAmount,
      deductedEmi: deductedThisLoan,
      shortfall: shortfallThisLoan,
      balanceAfter: postBalance,
      alreadyReconciled,
    });
  });

  const manualLoanRecovery =
    typeof master.loanRecovery === 'number' && !Number.isNaN(master.loanRecovery)
      ? Math.max(0, Math.round(master.loanRecovery))
      : 0;
  const manualAdvanceRecovery =
    typeof master.advanceRecovery === 'number' && !Number.isNaN(master.advanceRecovery)
      ? Math.max(0, Math.round(master.advanceRecovery))
      : 0;

  const loanRecovery = computedLoanEmiRecovery + manualLoanRecovery;
  const advanceRecovery = computedAdvanceEmiRecovery + manualAdvanceRecovery;

  const totalDeductions =
    statutoryDeductions + loanRecovery + advanceRecovery + otherDeductions;
  const netPayable = grossEarnings - totalDeductions + approvedReimbursements;

  return {
    calendar,
    baseMonthlyGross,
    perCalendarDayRate,
    perWorkingDayRate,
    graceUsedThisMonth,
    graceLimitPerMonth,
    graceRemaining,
    lateCountThisMonth,
    lateCycleHalfDays,
    middayOrEarlyExitLopDays,
    breakViolationLopDays,
    monthlyLeaveLimit,
    approvedMonthlyLeaveDays,
    paidLeaveDaysAllowed,
    excessMonthlyLeaveLopDays,
    unauthorizedAbsenceLopDays,
    manualAdminLopDays,
    lopDays,
    paidDays,
    workingDaysAttended,
    lateCycleDeductionAmount,
    middayOrEarlyExitDeductionAmount,
    leavePolicyDeductionAmount,
    manualLopDeductionAmount,
    policyLopDeductionAmount,
    adjustedGross,
    basic,
    hra,
    specialAllowance,
    conveyance,
    incentive,
    grossEarnings,
    pfDeduction,
    professionalTax,
    incomeTaxTds,
    loanRecovery,
    advanceRecovery,
    otherDeductions,
    scheduledLoanEmi,
    loanShortfallAmount,
    loanShortfallPolicyApplied,
    activeLoanInstalments,
    totalDeductions,
    approvedReimbursements,
    netPayable,
    policyEval,
    shiftHours,
  };
};

