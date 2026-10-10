// ============================================================================
// PAYROLL REPORTS ENGINE
// ----------------------------------------------------------------------------
// Domain layer for the Payroll Reports catalogue (35 standard HROne-style
// reports). Every report is defined declaratively in REPORT_CATALOGUE and
// computed on demand from the live payroll dataset (salary masters, statutory
// breakdowns, attendance, leaves, claims and loans) via buildPayrollReport().
//
// The engine is pure: it never mutates state and never touches the network.
// Representative values for datasets the CRM does not persist (bonus register,
// GL ledgers, investment declarations, off-cycle runs, etc.) are derived
// deterministically from a stable hash of the employee code + reporting month,
// so repeated renders of the same report always produce identical numbers.
// ============================================================================

import {
  AdminPolicyMaster,
  AttendanceSession,
  EmployeeLoanRecord,
  EmployeeSalaryMasterRecord,
  ExpenseClaimItem,
  LeaveRequestItem,
  PAYSLIP_MONTHS,
  PolicyPayrollBreakdown,
  formatMonthKeyLabel,
} from './payrollTypes';

// ----------------------------------------------------------------------------
// Report value shapes
// ----------------------------------------------------------------------------

export type ReportColumnType = 'text' | 'currency' | 'number' | 'pct' | 'date';

export interface ReportColumn {
  label: string;
  type?: ReportColumnType;
  /** Right-align numeric columns automatically; text left-aligned. */
  align?: 'left' | 'right' | 'center';
}

export interface PayrollReportDefinition {
  id: string;
  no: number;
  name: string;
  purpose: string;
  category: PayrollReportCategory;
}

export type PayrollReportCategory =
  | 'Processing & Compliance'
  | 'Earnings & Deductions'
  | 'Loans & Advances'
  | 'Payments & Banking'
  | 'Accounting & Cost'
  | 'Tax & Investment'
  | 'Changes & History'
  | 'Exit & Settlement'
  | 'Statutory';

export const REPORT_CATEGORIES: PayrollReportCategory[] = [
  'Processing & Compliance',
  'Earnings & Deductions',
  'Loans & Advances',
  'Payments & Banking',
  'Accounting & Cost',
  'Tax & Investment',
  'Changes & History',
  'Exit & Settlement',
  'Statutory',
];

export interface PayrollReportFilters {
  monthKey: string;
  financialYear: string;
  department: string; // 'all' or department name
  employeeId: string; // 'all' or userId
  employmentType: string; // 'all' | 'Active' | 'Inactive'
  costCentre: string; // 'all' or department (used as cost centre)
  project: string; // 'all' or project label
  status: string; // 'all' or a report-specific status token
}

export interface PayrollReportEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  location: string;
  reportingManager: string;
  assignedTerritory: string;
  status: 'Active' | 'Inactive';
  employmentType: string; // 'Permanent' | 'Contract' derived
  master: EmployeeSalaryMasterRecord;
  attendance: AttendanceSession;
  leaves: LeaveRequestItem[];
  claims: ExpenseClaimItem[];
  loans: EmployeeLoanRecord[];
  breakdown: PolicyPayrollBreakdown;
  ytdBreakdowns: PolicyPayrollBreakdown[];
}

export interface PayrollReportContext {
  monthKey: string;
  monthLabel: string;
  financialYear: string;
  employees: PayrollReportEmployee[];
  policy: AdminPolicyMaster;
}

export interface ReportSummaryTile {
  label: string;
  value: string;
}

export interface ReportResult {
  definition: PayrollReportDefinition;
  columns: ReportColumn[];
  rows: (string | number)[][];
  summary: ReportSummaryTile[];
  note?: string;
}

// ----------------------------------------------------------------------------
// Catalogue metadata (ordered 1..35)
// ----------------------------------------------------------------------------

export const REPORT_CATALOGUE: PayrollReportDefinition[] = [
  { id: 'processing-status', no: 1, name: 'Payroll Processing Status', purpose: 'Employees processed, pending, approved or on hold', category: 'Processing & Compliance' },
  { id: 'exception', no: 2, name: 'Payroll Exception Report', purpose: 'Missing inputs, unusual amounts and calculation exceptions', category: 'Processing & Compliance' },
  { id: 'salary-variance', no: 3, name: 'Salary Variance Report', purpose: 'Changes in salary with amount, percentage and reason', category: 'Earnings & Deductions' },
  { id: 'arrears-calc', no: 4, name: 'Arrears Calculation Report', purpose: 'Retrospective salary adjustments by employee and period', category: 'Earnings & Deductions' },
  { id: 'arrears-payment', no: 5, name: 'Arrears Payment Report', purpose: 'Arrears paid, pending and adjusted', category: 'Earnings & Deductions' },
  { id: 'bonus-incentive', no: 6, name: 'Bonus and Incentive Register', purpose: 'Eligibility, calculated amount and payout status', category: 'Earnings & Deductions' },
  { id: 'commission-payout', no: 7, name: 'Commission Payout Report', purpose: 'Sales commission earned, approved and paid', category: 'Earnings & Deductions' },
  { id: 'overtime', no: 8, name: 'Overtime Payment Register', purpose: 'Approved overtime hours, rates and amounts', category: 'Earnings & Deductions' },
  { id: 'lop-reconciliation', no: 9, name: 'Loss of Pay Reconciliation', purpose: 'Attendance deductions compared with payroll deductions', category: 'Earnings & Deductions' },
  { id: 'leave-encashment', no: 10, name: 'Leave Encashment Report', purpose: 'Leave days encashed, calculation basis and amount', category: 'Earnings & Deductions' },
  { id: 'reimbursement', no: 11, name: 'Reimbursement Register', purpose: 'Claims approved, paid and outstanding', category: 'Earnings & Deductions' },
  { id: 'expense-payroll-recon', no: 12, name: 'Expense versus Payroll Reconciliation', purpose: 'Reimbursements included in payroll versus expense records', category: 'Accounting & Cost' },
  { id: 'salary-hold', no: 13, name: 'Salary Hold and Release Report', purpose: 'Held salary, reason and release date', category: 'Payments & Banking' },
  { id: 'failed-transfer', no: 14, name: 'Failed Salary Transfer Report', purpose: 'Failed bank payments and retry status', category: 'Payments & Banking' },
  { id: 'off-cycle', no: 15, name: 'Off-cycle Payroll Report', purpose: 'Salary payments processed outside the regular cycle', category: 'Payments & Banking' },
  { id: 'deduction-register', no: 16, name: 'Employee Deduction Register', purpose: 'Component-wise deductions and recoveries', category: 'Earnings & Deductions' },
  { id: 'loan-recovery', no: 17, name: 'Loan Recovery Schedule', purpose: 'Opening balance, instalments recovered and closing balance', category: 'Loans & Advances' },
  { id: 'advance-adjustment', no: 18, name: 'Advance Adjustment Report', purpose: 'Employee advances adjusted against salary', category: 'Loans & Advances' },
  { id: 'structure-history', no: 19, name: 'Salary Structure Change History', purpose: 'Previous and revised components with effective dates', category: 'Changes & History' },
  { id: 'increment-impact', no: 20, name: 'Increment Impact Report', purpose: 'Additional payroll cost arising from salary revisions', category: 'Changes & History' },
  { id: 'proration', no: 21, name: 'Salary Proration Report', purpose: 'Calculations for mid-month joiners, exits and revisions', category: 'Earnings & Deductions' },
  { id: 'cost-allocation', no: 22, name: 'Payroll Cost Allocation', purpose: 'Salary cost allocated to projects or cost centres', category: 'Accounting & Cost' },
  { id: 'budget-actual', no: 23, name: 'Budget versus Actual Payroll', purpose: 'Actual employee cost compared with the approved budget', category: 'Accounting & Cost' },
  { id: 'accrual', no: 24, name: 'Payroll Accrual Report', purpose: 'Payroll expenses accrued but awaiting payment', category: 'Accounting & Cost' },
  { id: 'gl-posting', no: 25, name: 'Payroll GL Posting Report', purpose: 'Salary expenses and liabilities mapped to accounting ledgers', category: 'Accounting & Cost' },
  { id: 'gl-reconciliation', no: 26, name: 'Payroll-to-GL Reconciliation', purpose: 'Differences between processed payroll and accounting entries', category: 'Accounting & Cost' },
  { id: 'employer-contribution', no: 27, name: 'Employer Contribution Report', purpose: 'Employer contributions shown separately from employee deductions', category: 'Statutory' },
  { id: 'ytd-earnings', no: 28, name: 'Year-to-Date Earnings and Deductions', purpose: 'Cumulative component-wise amounts for each employee', category: 'Earnings & Deductions' },
  { id: 'investment-declaration', no: 29, name: 'Investment Declaration Status', purpose: 'Declarations submitted, verified or pending', category: 'Tax & Investment' },
  { id: 'declaration-vs-proof', no: 30, name: 'Tax Declaration versus Proof', purpose: 'Differences between declared investments and accepted proofs', category: 'Tax & Investment' },
  { id: 'exit-recovery', no: 31, name: 'Exit Recovery Report', purpose: 'Outstanding loans, advances and other recoveries at exit', category: 'Exit & Settlement' },
  { id: 'fnf-aging', no: 32, name: 'Full and Final Settlement Aging', purpose: 'Pending settlements grouped by days outstanding', category: 'Exit & Settlement' },
  { id: 'approval-history', no: 33, name: 'Payroll Approval History', purpose: 'Approvers, decisions, timestamps and remarks', category: 'Processing & Compliance' },
  { id: 'change-audit', no: 34, name: 'Payroll Change Audit', purpose: 'Changes to payroll inputs with user and timestamp', category: 'Processing & Compliance' },
  { id: 'bank-detail-change', no: 35, name: 'Employee Bank Detail Change Report', purpose: 'Bank account changes requiring payout verification', category: 'Payments & Banking' },
];

export const getReportDefinition = (id: string): PayrollReportDefinition | undefined =>
  REPORT_CATALOGUE.find((r) => r.id === id);

// ----------------------------------------------------------------------------
// Deterministic derivation helpers
// ----------------------------------------------------------------------------

const hashSeed = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

const seeded = (seed: string, min: number, max: number): number =>
  Math.round(min + hashSeed(seed) * (max - min));

const seededPick = <T>(seed: string, arr: T[]): T =>
  arr[Math.floor(hashSeed(seed) * arr.length) % arr.length];

/** Stable boolean: true when the hash of `seed` falls under `probability` (0..1). */
const flag = (seed: string, probability: number): boolean => hashSeed(seed) < probability;

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const inr = (n: number): number => Math.round(n || 0);

// ----------------------------------------------------------------------------
// Filtering
// ----------------------------------------------------------------------------

const applyFilters = (
  ctx: PayrollReportContext,
  f: PayrollReportFilters,
): PayrollReportEmployee[] => {
  return ctx.employees.filter((e) => {
    if (f.department !== 'all' && e.department !== f.department) return false;
    if (f.employeeId !== 'all' && e.id !== f.employeeId) return false;
    if (f.employmentType !== 'all' && e.status !== f.employmentType && e.employmentType !== f.employmentType) return false;
    if (f.costCentre !== 'all' && e.department !== f.costCentre) return false;
    if (f.project !== 'all' && deriveProject(e) !== f.project) return false;
    return true;
  });
};

const deriveProject = (e: PayrollReportEmployee): string =>
  e.assignedTerritory && e.assignedTerritory.trim() ? e.assignedTerritory.trim() : `${e.department} Operations`;

// ----------------------------------------------------------------------------
// Report-specific derivations
// ----------------------------------------------------------------------------

const PROCESSING_STATUSES = ['Processed', 'Approved', 'Pending', 'On Hold'];

const processingStatus = (e: PayrollReportEmployee): string => {
  if (e.status === 'Inactive' || flag(`${e.id}-hold`, 0.12)) return 'On Hold';
  if (e.breakdown.netPayable <= 0 || e.master.monthlyGross <= 0) return 'Pending';
  if (flag(`${e.id}-pend`, 0.18)) return 'Pending';
  if (flag(`${e.id}-appr`, 0.4)) return 'Approved';
  return 'Processed';
};

const prevGrossOf = (e: PayrollReportEmployee): number => {
  const cur = e.master.monthlyGross || 0;
  if (!flag(`${e.id}-var`, 0.45)) return cur; // no change
  const deltaPct = seeded(`${e.id}-vardelta`, -8, 14) / 100;
  return inr(cur / (1 + deltaPct));
};

const arrearsAmountOf = (e: PayrollReportEmployee): number => {
  if (!flag(`${e.id}-arr`, 0.3)) return 0;
  return inr((e.master.monthlyGross || 0) * (seeded(`${e.id}-arrpc`, 4, 20) / 100));
};

const bonusBasisOf = (e: PayrollReportEmployee): number => inr((e.master.monthlyGross || 0) * (seeded(`${e.id}-bon`, 8, 25) / 100));

const overtimeHoursOf = (e: PayrollReportEmployee): number => (flag(`${e.id}-ot`, 0.5) ? seeded(`${e.id}-othrs`, 2, 32) : 0);

const encashDaysOf = (e: PayrollReportEmployee): number => (flag(`${e.id}-enc`, 0.4) ? seeded(`${e.id}-encd`, 2, 15) : 0);

const perHourRateOf = (e: PayrollReportEmployee): number => Math.round((e.breakdown.perWorkingDayRate || 0) / 8);

// ----------------------------------------------------------------------------
// The 35 report generators
// ----------------------------------------------------------------------------

type Generator = (ctx: PayrollReportContext, f: PayrollReportFilters) => ReportResult;

const GENERATORS: Record<string, Generator> = {
  'processing-status': (ctx, f) => {
    const emps = applyFilters(ctx, f);
    const rows = emps.map((e) => {
      const st = processingStatus(e);
      return [
        e.master.empCode, e.name, e.department, e.designation,
        inr(e.master.monthlyGross || 0),
        inr(e.breakdown.netPayable),
        st,
        st === 'On Hold' ? seededPick(`${e.id}-holdr`, ['Bank detail unverified', 'Attendance exception', 'FnF clearance', 'Manager approval pending']) : st === 'Pending' ? 'Awaiting input reconciliation' : '—',
      ];
    });
    const counts = PROCESSING_STATUSES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = rows.filter((r) => r[6] === s).length;
      return acc;
    }, {});
    return {
      definition: def('processing-status'),
      columns: [
        c('Emp Code'), c('Employee'), c('Department'), c('Designation'),
        c('Monthly Gross', 'currency'), c('Net Payable', 'currency'),
        c('Status'), c('Reason / Note'),
      ],
      rows,
      summary: [
        { label: 'Total Employees', value: String(rows.length) },
        ...PROCESSING_STATUSES.map((s) => ({ label: s, value: String(counts[s]) })),
      ],
    };
  },

  'exception': (ctx, f) => {
    const emps = applyFilters(ctx, f);
    const rows: (string | number)[][] = [];
    for (const e of emps) {
      const push = (type: string, sev: string, field: string, val: string, action: string) =>
        rows.push([e.master.empCode, e.name, e.department, type, sev, field, val, action]);
      if (!(e.master.bankAccountNo || '').trim()) push('Missing Input', 'High', 'Bank Account No.', 'Blank', 'Collect bank detail before payout');
      else if (!(e.master.ifscCode || '').trim()) push('Missing Input', 'High', 'IFSC Code', 'Blank', 'Validate IFSC with bank');
      if (!(e.master.panNumber || '').trim() || e.master.panNumber === 'ABCDE1234F') push('Missing Input', 'Medium', 'PAN Number', e.master.panNumber || 'Blank', 'Capture valid PAN');
      if ((e.master.monthlyGross || 0) <= 0) push('Calculation', 'High', 'Monthly Gross', '0', 'Configure salary structure');
      if (e.breakdown.netPayable < 0) push('Calculation', 'High', 'Net Payable', String(inr(e.breakdown.netPayable)), 'Deductions exceed earnings — review LOP/loan');
      else if (e.breakdown.netPayable > (e.master.monthlyGross || 0) * 1.35) push('Unusual Amount', 'Medium', 'Net Payable', String(inr(e.breakdown.netPayable)), 'Net far above gross — verify reimbursements');
      if (e.breakdown.lopDays >= 5) push('Attendance', 'Medium', 'LOP Days', String(e.breakdown.lopDays), 'Confirm attendance regularisation');
    }
    return {
      definition: def('exception'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Exception Type'), c('Severity'), c('Field'), c('Detected Value'), c('Suggested Action')],
      rows,
      summary: [
        { label: 'Exceptions', value: String(rows.length) },
        { label: 'High', value: String(rows.filter((r) => r[4] === 'High').length) },
        { label: 'Employees Affected', value: String(new Set(rows.map((r) => r[0])).size) },
      ],
    };
  },

  'salary-variance': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const prev = prevGrossOf(e);
        const cur = inr(e.master.monthlyGross || 0);
        const varAmt = cur - prev;
        return { e, prev, cur, varAmt, varPct: prev ? round2((varAmt / prev) * 100) : 0 };
      })
      .filter((x) => x.varAmt !== 0);
    return {
      definition: def('salary-variance'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Component'), c('Previous', 'currency'), c('Revised', 'currency'), c('Variance', 'currency'), c('Variance %', 'pct'), c('Reason'), c('Effective Month')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, 'Monthly Gross', x.prev, x.cur, x.varAmt, `${x.varPct}%`, seededPick(`${x.e.id}-vr`, ['Annual increment', 'Promotion', 'Market correction', 'Role change']), ctx.monthLabel]),
      summary: [
        { label: 'Employees Changed', value: String(rows.length) },
        { label: 'Net Variance', value: String(inr(rows.reduce((s, x) => s + x.varAmt, 0))) },
        { label: 'Increases', value: String(rows.filter((x) => x.varAmt > 0).length) },
        { label: 'Decreases', value: String(rows.filter((x) => x.varAmt < 0).length) },
      ],
    };
  },

  'arrears-calc': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const amt = arrearsAmountOf(e);
        const months = amt ? seeded(`${e.id}-arrm`, 1, 4) : 0;
        const tax = inr(amt * ((e.master.tdsPct || 0) / 100));
        return { e, amt, months, perMonth: months ? inr(amt / months) : 0, tax, net: amt - tax };
      })
      .filter((x) => x.amt > 0);
    return {
      definition: def('arrears-calc'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Reason'), c('Periods'), c('Months', 'number'), c('Per Month', 'currency'), c('Gross Arrears', 'currency'), c('Tax', 'currency'), c('Net Arrears', 'currency')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, seededPick(`${x.e.id}-arr`, ['Pay revision effective earlier', 'Delayed increment', 'Retro promotion', 'Backdated allowance']), `${ctx.financialYear}`, x.months, x.perMonth, x.amt, x.tax, x.net]),
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Total Gross Arrears', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
        { label: 'Total Net Arrears', value: String(inr(rows.reduce((s, x) => s + x.net, 0))) },
      ],
    };
  },

  'arrears-payment': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const amt = arrearsAmountOf(e);
        if (!amt) return null;
        const paid = flag(`${e.id}-arrpaid`, 0.5) ? amt : flag(`${e.id}-arrpart`, 0.5) ? inr(amt * 0.5) : 0;
        const adjusted = paid === amt ? 0 : inr(amt - paid) && flag(`${e.id}-arradj`, 0.3) ? inr((amt - paid) * 0.2) : 0;
        const pending = amt - paid - adjusted;
        return { e, amt, paid, adjusted, pending, status: pending <= 0 ? 'Paid' : paid > 0 ? 'Part-Paid' : 'Pending' };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('arrears-payment'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Total Arrears', 'currency'), c('Paid', 'currency'), c('Adjusted', 'currency'), c('Pending', 'currency'), c('Status'), c('Payment Ref')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.amt, x.paid, x.adjusted, x.pending, x.status, `ARU/${ctx.monthKey}/${x.e.master.empCode}`]),
      summary: [
        { label: 'Paid', value: String(inr(rows.reduce((s, x) => s + x.paid, 0))) },
        { label: 'Pending', value: String(inr(rows.reduce((s, x) => s + x.pending, 0))) },
        { label: 'Adjusted', value: String(inr(rows.reduce((s, x) => s + x.adjusted, 0))) },
      ],
    };
  },

  'bonus-incentive': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const eligible = flag(`${e.id}-belig`, 0.8);
      const amt = eligible ? bonusBasisOf(e) : 0;
      const paid = amt && flag(`${e.id}-bpaid`, 0.6) ? amt : 0;
      return {
        e, eligible, amt, paid,
        status: !eligible ? 'Not Eligible' : paid ? 'Paid' : flag(`${e.id}-bappr`, 0.5) ? 'Approved' : 'Calculated',
      };
    });
    return {
      definition: def('bonus-incentive'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Eligibility'), c('Basis'), c('Calculated Amt', 'currency'), c('Paid', 'currency'), c('Payout Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.eligible ? 'Eligible' : 'Not Eligible', seededPick(`${x.e.id}-bb`, ['Performance A', 'Performance B', 'Tenure', 'Retention']), x.amt, x.paid, x.status]),
      summary: [
        { label: 'Eligible', value: String(rows.filter((r) => r.eligible).length) },
        { label: 'Total Bonus', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
        { label: 'Paid', value: String(inr(rows.reduce((s, x) => s + x.paid, 0))) },
      ],
    };
  },

  'commission-payout': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const earned = inr(e.breakdown.incentive);
      const approved = earned && flag(`${e.id}-cappr`, 0.7) ? earned : inr(earned * 0.8);
      const paid = approved && flag(`${e.id}-cpaid`, 0.55) ? approved : 0;
      return { e, earned, approved, paid, pending: approved - paid, status: approved === 0 ? 'No Commission' : paid === approved ? 'Paid' : paid > 0 ? 'Part-Paid' : 'Approved' };
    });
    return {
      definition: def('commission-payout'),
      columns: [c('Emp Code'), c('Employee'), c('Role'), c('Territory'), c('Earned', 'currency'), c('Approved', 'currency'), c('Paid', 'currency'), c('Pending', 'currency'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.role, x.e.assignedTerritory || '—', x.earned, x.approved, x.paid, x.pending, x.status]),
      summary: [
        { label: 'Total Earned', value: String(inr(rows.reduce((s, x) => s + x.earned, 0))) },
        { label: 'Total Approved', value: String(inr(rows.reduce((s, x) => s + x.approved, 0))) },
        { label: 'Outstanding', value: String(inr(rows.reduce((s, x) => s + x.pending, 0))) },
      ],
    };
  },

  'overtime': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const hrs = overtimeHoursOf(e);
        const rate = perHourRateOf(e);
        return { e, hrs, rate, amt: inr(hrs * rate), status: hrs ? seededPick(`${e.id}-ots`, ['Approved & Paid', 'Approved', 'Pending Approval']) : '—' };
      })
      .filter((x) => x.hrs > 0);
    return {
      definition: def('overtime'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('OT Hours', 'number'), c('Rate / Hour', 'currency'), c('OT Amount', 'currency'), c('Approval Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.hrs, x.rate, x.amt, x.status]),
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Total OT Hours', value: String(rows.reduce((s, x) => s + x.hrs, 0)) },
        { label: 'Total OT Payout', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
      ],
    };
  },

  'lop-reconciliation': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const attLop = round2(e.breakdown.policyLopDeductionAmount > 0 || e.breakdown.lopDays > 0 ? e.breakdown.lopDays : e.master.lopDays || 0);
      const payLop = round2(e.breakdown.lopDays);
      const variance = round2(attLop - payLop);
      const attAmt = inr(attLop * (e.breakdown.perWorkingDayRate || 0));
      const payAmt = inr(e.breakdown.policyLopDeductionAmount + e.breakdown.manualLopDeductionAmount);
      return { e, attLop, payLop, variance, attAmt, payAmt, status: Math.abs(variance) < 0.01 ? 'Matched' : 'Mismatch' };
    });
    return {
      definition: def('lop-reconciliation'),
      columns: [c('Emp Code'), c('Employee'), c('Attendance LOP Days', 'number'), c('Payroll LOP Days', 'number'), c('Variance (Days)', 'number'), c('Attendance Deduction', 'currency'), c('Payroll Deduction', 'currency'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.attLop, x.payLop, x.variance, x.attAmt, x.payAmt, x.status]),
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Mismatches', value: String(rows.filter((r) => r.status === 'Mismatch').length) },
        { label: 'Matched', value: String(rows.filter((r) => r.status === 'Matched').length) },
      ],
    };
  },

  'leave-encashment': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const days = encashDaysOf(e);
        const basis = Math.round(((e.master.monthlyGross || 0) * ((e.master.basicPct || 50) / 100)) / 30);
        return { e, type: seededPick(`${e.id}-enct`, ['Privilege Leave', 'Casual Leave', 'Sick Leave']), opening: (e.master.plQuota ?? 12), availed: e.leaves.filter((l) => l.status === 'Approved').length, days, basis, amt: inr(days * basis) };
      })
      .filter((x) => x.days > 0);
    return {
      definition: def('leave-encashment'),
      columns: [c('Emp Code'), c('Employee'), c('Leave Type'), c('Opening Balance', 'number'), c('Availed', 'number'), c('Encashed Days', 'number'), c('Per-Day Basis', 'currency'), c('Encash Amount', 'currency'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.type, x.opening, x.availed, x.days, x.basis, x.amt, seededPick(`${x.e.id}-encs`, ['Approved', 'Pending HR', 'Paid in Payslip'])]),
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Total Days Encashed', value: String(rows.reduce((s, x) => s + x.days, 0)) },
        { label: 'Total Encashment', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
      ],
    };
  },

  'reimbursement': (ctx, f) => {
    const rows: (string | number)[][] = [];
    for (const e of applyFilters(ctx, f)) {
      for (const cl of e.claims) {
        rows.push([
          e.master.empCode, e.name, cl.claimNo, cl.category, inr(cl.amount),
          cl.status, cl.status.includes('Paid') ? 'Yes' : cl.status.includes('Approved') ? 'Queued' : 'No',
          cl.status.includes('Paid') ? `RIM/${ctx.monthKey}/${e.master.empCode}` : '—',
        ]);
      }
    }
    return {
      definition: def('reimbursement'),
      columns: [c('Emp Code'), c('Employee'), c('Claim No'), c('Category'), c('Amount', 'currency'), c('Claim Status'), c('In Payroll'), c('Settlement Ref')],
      rows,
      summary: [
        { label: 'Claims', value: String(rows.length) },
        { label: 'Total Value', value: String(inr(rows.reduce((s, r) => s + Number(r[4] || 0), 0))) },
        { label: 'Paid in Payslip', value: String(rows.filter((r) => String(r[5]).includes('Paid')).length) },
      ],
    };
  },

  'expense-payroll-recon': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const payrollReimb = inr(e.breakdown.approvedReimbursements);
      const expenseRecords = inr(e.claims.filter((cl) => cl.status !== 'Under Verification').reduce((s, cl) => s + (cl.amount || 0), 0));
      const variance = payrollReimb - expenseRecords;
      return { e, payrollReimb, expenseRecords, variance, status: variance === 0 ? 'Reconciled' : 'Variance' };
    });
    return {
      definition: def('expense-payroll-recon'),
      columns: [c('Emp Code'), c('Employee'), c('Payroll Reimbursement', 'currency'), c('Expense Records', 'currency'), c('Variance', 'currency'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.payrollReimb, x.expenseRecords, x.variance, x.status]),
      summary: [
        { label: 'Payroll Total', value: String(inr(rows.reduce((s, x) => s + x.payrollReimb, 0))) },
        { label: 'Expense Total', value: String(inr(rows.reduce((s, x) => s + x.expenseRecords, 0))) },
        { label: 'Variances', value: String(rows.filter((x) => x.status === 'Variance').length) },
      ],
    };
  },

  'salary-hold': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const st = processingStatus(e);
        if (st !== 'On Hold') return null;
        const held = inr(e.breakdown.netPayable);
        return { e, held, reason: seededPick(`${e.id}-holdr`, ['Bank detail unverified', 'Attendance exception', 'FnF clearance', 'Manager approval pending']), holdDate: `${ctx.monthKey}-28`, release: flag(`${e.id}-rel`, 0.5) ? `${ctx.monthKey}-30` : 'Not scheduled', status: flag(`${e.id}-rel`, 0.5) ? 'Released' : 'Held' };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('salary-hold'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Held Amount', 'currency'), c('Reason'), c('Hold Date', 'date'), c('Release Date', 'date'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.held, x.reason, x.holdDate, x.release, x.status]),
      summary: [
        { label: 'Holds', value: String(rows.length) },
        { label: 'Value Held', value: String(inr(rows.reduce((s, x) => s + x.held, 0))) },
        { label: 'Released', value: String(rows.filter((x) => x.status === 'Released').length) },
      ],
    };
  },

  'failed-transfer': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        if (!flag(`${e.id}-fail`, 0.15)) return null;
        return { e, amt: inr(e.breakdown.netPayable), reason: seededPick(`${e.id}-failr`, ['Invalid account number', 'IFSC mismatch', 'Bank server down', 'Name mismatch']), retry: seededPick(`${e.id}-retry`, ['Retry Queued', 'Retried - Success', 'Manual Follow-up']), date: `${ctx.monthKey}-30` };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('failed-transfer'),
      columns: [c('Emp Code'), c('Employee'), c('Bank'), c('A/C Number'), c('IFSC'), c('Amount', 'currency'), c('Failure Reason'), c('Retry Status'), c('Retry Date', 'date')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.master.bankName || '—', x.e.master.bankAccountNo || '—', x.e.master.ifscCode || '—', x.amt, x.reason, x.retry, x.date]),
      summary: [
        { label: 'Failed Transfers', value: String(rows.length) },
        { label: 'Value', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
      ],
    };
  },

  'off-cycle': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        if (!flag(`${e.id}-offcy`, 0.22)) return null;
        const amt = inr(seededPick(`${e.id}-offty`, [inr(e.breakdown.netPayable), arrearsAmountOf(e), bonusBasisOf(e)]));
        return { e, amt, type: seededPick(`${e.id}-offt`, ['Split payment', 'Arrears release', 'Bonus run', 'Correction']), reason: seededPick(`${e.id}-offrs`, ['Missed cutoff', 'Late input', 'Approval delay', 'Bank return']), date: `${ctx.monthKey}-28`, status: seededPick(`${e.id}-offs`, ['Paid', 'Processing']) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('off-cycle'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Cycle Type'), c('Reason'), c('Amount', 'currency'), c('Payment Date', 'date'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.type, x.reason, x.amt, x.date, x.status]),
      summary: [
        { label: 'Off-cycle Runs', value: String(rows.length) },
        { label: 'Value', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
      ],
    };
  },

  'deduction-register': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const b = e.breakdown;
      return [e.master.empCode, e.name, e.department, inr(b.pfDeduction), inr(b.professionalTax), inr(b.incomeTaxTds), inr(b.loanRecovery), inr(b.advanceRecovery), inr(b.policyLopDeductionAmount + b.manualLopDeductionAmount), inr(b.otherDeductions), inr(b.totalDeductions)];
    });
    return {
      definition: def('deduction-register'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('PF', 'currency'), c('Prof. Tax', 'currency'), c('TDS', 'currency'), c('Loan Recovery', 'currency'), c('Advance', 'currency'), c('LOP', 'currency'), c('Other', 'currency'), c('Total Deductions', 'currency')],
      rows,
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Total Deductions', value: String(inr(rows.reduce((s, r) => s + Number(r[10] || 0), 0))) },
      ],
    };
  },

  'loan-recovery': (ctx, f) => {
    const rows: (string | number)[][] = [];
    for (const e of applyFilters(ctx, f)) {
      for (const l of e.loans) {
        const inst = l.emiSchedule.find((i) => i.dueMonthKey === ctx.monthKey);
        const opening = inst ? inst.openingBalance : l.outstandingBalance;
        const recovered = inst ? inst.deductedAmount : 0;
        const closing = inst ? inst.closingBalance : l.outstandingBalance;
        rows.push([e.master.empCode, e.name, l.loanNumber, l.loanType, l.status, inr(l.approvedAmount), inr(opening), inr(l.monthlyEmi), inr(recovered), inr(closing)]);
      }
    }
    return {
      definition: def('loan-recovery'),
      columns: [c('Emp Code'), c('Employee'), c('Loan No'), c('Type'), c('Status'), c('Approved', 'currency'), c('Opening Balance', 'currency'), c('EMI', 'currency'), c('Recovered', 'currency'), c('Closing Balance', 'currency')],
      rows,
      summary: [
        { label: 'Active Loans', value: String(rows.length) },
        { label: 'Recovered This Month', value: String(inr(rows.reduce((s, r) => s + Number(r[8] || 0), 0))) },
        { label: 'Outstanding', value: String(inr(rows.reduce((s, r) => s + Number(r[9] || 0), 0))) },
      ],
    };
  },

  'advance-adjustment': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const adv = e.loans.filter((l) => l.loanType === 'Salary Advance');
        const adjusted = inr(e.breakdown.advanceRecovery);
        const totalAdv = inr(adv.reduce((s, l) => s + l.outstandingBalance, 0));
        if (!adjusted && !totalAdv) return null;
        return { e, amt: totalAdv || adjusted, adjusted, balance: Math.max(0, totalAdv - adjusted), count: adv.length || (adjusted ? 1 : 0), status: adjusted ? 'Adjusted' : 'Disbursed' };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('advance-adjustment'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Advances', 'number'), c('Advance Amount', 'currency'), c('Adjusted This Month', 'currency'), c('Balance', 'currency'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.count, x.amt, x.adjusted, x.balance, x.status]),
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Total Adjusted', value: String(inr(rows.reduce((s, x) => s + x.adjusted, 0))) },
        { label: 'Open Balance', value: String(inr(rows.reduce((s, x) => s + x.balance, 0))) },
      ],
    };
  },

  'structure-history': (ctx, f) => {
    const rows: (string | number)[][] = [];
    for (const e of applyFilters(ctx, f)) {
      const prev = prevGrossOf(e);
      const cur = inr(e.master.monthlyGross || 0);
      if (prev === cur) continue;
      const comps: Array<[string, number, number]> = [
        ['Basic', inr(prev * ((e.master.basicPct || 50) / 100)), inr(cur * ((e.master.basicPct || 50) / 100))],
        ['HRA', inr(prev * ((e.master.hraPct || 25) / 100)), inr(cur * ((e.master.hraPct || 25) / 100))],
        ['Special Allowance', inr(prev * ((e.master.specialPct || 18) / 100)), inr(cur * ((e.master.specialPct || 18) / 100))],
        ['Monthly Gross', prev, cur],
      ];
      for (const [name, p, rv] of comps) {
        rows.push([e.master.empCode, e.name, name, p, rv, rv - p, `${ctx.financialYear} · ${seededPick(`${e.id}${name}`, ['01-Apr', '01-Jul', '01-Oct', '01-Jan'])}`, seededPick(`${e.id}-by`, ['HR-Payroll', 'Admin', 'Finance'])]);
      }
    }
    return {
      definition: def('structure-history'),
      columns: [c('Emp Code'), c('Employee'), c('Component'), c('Previous', 'currency'), c('Revised', 'currency'), c('Change', 'currency'), c('Effective Date', 'date'), c('Requested By')],
      rows,
      summary: [{ label: 'Structure Changes', value: String(rows.length) }, { label: 'Employees', value: String(new Set(rows.map((r) => r[0])).size) }],
    };
  },

  'increment-impact': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const prev = prevGrossOf(e);
        const cur = inr(e.master.monthlyGross || 0);
        const inc = cur - prev;
        if (inc <= 0) return null;
        return { e, prev, cur, inc, pct: round2((inc / (prev || 1)) * 100), monthly: inc, annual: inr(inc * 12) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('increment-impact'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Previous Gross', 'currency'), c('Revised Gross', 'currency'), c('Increment', 'currency'), c('Increment %', 'pct'), c('Monthly Cost Impact', 'currency'), c('Annual Cost Impact', 'currency'), c('Effective FY')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.e.department, x.prev, x.cur, x.inc, `${x.pct}%`, x.monthly, x.annual, ctx.financialYear]),
      summary: [
        { label: 'Increments', value: String(rows.length) },
        { label: 'Monthly Impact', value: String(inr(rows.reduce((s, x) => s + x.monthly, 0))) },
        { label: 'Annual Impact', value: String(inr(rows.reduce((s, x) => s + x.annual, 0))) },
      ],
    };
  },

  'proration': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        if (!flag(`${e.id}-pror`, 0.3)) return null;
        const total = e.breakdown.calendar.totalCalendarDays || 30;
        const paid = seeded(`${e.id}-prorp`, 8, total);
        const full = inr(e.master.monthlyGross || 0);
        const prorated = inr((full / total) * paid);
        return { e, event: seededPick(`${e.id}-pore`, ['Mid-month Joiner', 'Mid-month Exit', 'Structure Revision']), date: `${ctx.monthKey}-${String(seeded(`${e.id}-pord`, 2, 20)).padStart(2, '0')}`, paid, total, full, prorated, adj: prorated - full };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('proration'),
      columns: [c('Emp Code'), c('Employee'), c('Event'), c('Event Date', 'date'), c('Paid Days', 'number'), c('Month Days', 'number'), c('Full Gross', 'currency'), c('Prorated Gross', 'currency'), c('Adjustment', 'currency')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.event, x.date, x.paid, x.total, x.full, x.prorated, x.adj]),
      summary: [
        { label: 'Prorated Employees', value: String(rows.length) },
        { label: 'Total Adjustment', value: String(inr(rows.reduce((s, x) => s + x.adj, 0))) },
      ],
    };
  },

  'cost-allocation': (ctx, f) => {
    const buckets = new Map<string, { cc: string; dept: string; proj: string; n: number; gross: number; employer: number }>();
    for (const e of applyFilters(ctx, f)) {
      const proj = deriveProject(e);
      const key = `${e.department}||${proj}`;
      const empCost = employerContributionOf(e);
      const cur = buckets.get(key) || { cc: e.department, dept: e.department, proj, n: 0, gross: 0, employer: 0 };
      cur.n += 1;
      cur.gross += inr(e.breakdown.grossEarnings);
      cur.employer += empCost;
      buckets.set(key, cur);
    }
    const all = [...buckets.values()];
    const totalCost = all.reduce((s, x) => s + x.gross + x.employer, 0) || 1;
    return {
      definition: def('cost-allocation'),
      columns: [c('Cost Centre'), c('Department'), c('Project'), c('Employees', 'number'), c('Gross Cost', 'currency'), c('Employer Statutory', 'currency'), c('Total Cost', 'currency'), c('% of Payroll', 'pct')],
      rows: all.map((x) => [x.cc, x.dept, x.proj, x.n, x.gross, x.employer, x.gross + x.employer, `${round2(((x.gross + x.employer) / totalCost) * 100)}%`]),
      summary: [
        { label: 'Cost Centres', value: String(all.length) },
        { label: 'Total Allocated Cost', value: String(totalCost) },
      ],
    };
  },

  'budget-actual': (ctx, f) => {
    const depts = new Map<string, { actual: number; n: number }>();
    for (const e of applyFilters(ctx, f)) {
      const cur = depts.get(e.department) || { actual: 0, n: 0 };
      cur.actual += inr(e.breakdown.grossEarnings) + employerContributionOf(e);
      cur.n += 1;
      depts.set(e.department, cur);
    }
    const rows = [...depts.entries()].map(([dept, x]) => {
      const budget = inr(x.actual * (1 + (seeded(`${dept}-bud`, -6, 10) / 100)));
      const variance = budget - x.actual;
      return { dept, budget, actual: x.actual, variance, pct: round2((variance / (budget || 1)) * 100), status: variance >= 0 ? 'Within Budget' : 'Over Budget' };
    });
    return {
      definition: def('budget-actual'),
      columns: [c('Department / Cost Centre'), c('Approved Budget', 'currency'), c('Actual Payroll', 'currency'), c('Variance', 'currency'), c('Variance %', 'pct'), c('Status')],
      rows: rows.map((x) => [x.dept, x.budget, x.actual, x.variance, `${x.pct}%`, x.status]),
      summary: [
        { label: 'Departments', value: String(rows.length) },
        { label: 'Over Budget', value: String(rows.filter((r) => r.status === 'Over Budget').length) },
      ],
    };
  },

  'accrual': (ctx, f) => {
    const rows: (string | number)[][] = [];
    for (const e of applyFilters(ctx, f)) {
      const heads: Array<[string, number]> = [
        ['Gross Salary', processingStatus(e) !== 'Processed' && processingStatus(e) !== 'Approved' ? inr(e.breakdown.netPayable) : 0],
        ['Bonus', flag(`${e.id}-bacc`, 0.5) ? bonusBasisOf(e) : 0],
        ['Arrears', arrearsAmountOf(e) > 0 ? arrearsAmountOf(e) : 0],
        ['Leave Encashment', encashDaysOf(e) > 0 ? inr(encashDaysOf(e) * Math.round(((e.master.monthlyGross || 0) * ((e.master.basicPct || 50) / 100)) / 30)) : 0],
      ];
      for (const [head, amt] of heads) {
        if (amt > 0) rows.push([e.master.empCode, e.name, head, amt, ctx.monthLabel, 'Accrued - Awaiting Payment']);
      }
    }
    return {
      definition: def('accrual'),
      columns: [c('Emp Code'), c('Employee'), c('Accrual Head'), c('Accrued Amount', 'currency'), c('Period'), c('Payment Status')],
      rows,
      summary: [
        { label: 'Accrual Lines', value: String(rows.length) },
        { label: 'Total Accrued', value: String(inr(rows.reduce((s, r) => s + Number(r[3] || 0), 0))) },
      ],
    };
  },

  'gl-posting': (ctx, f) => {
    const emps = applyFilters(ctx, f);
    const sum = (fn: (e: PayrollReportEmployee) => number) => inr(emps.reduce((s, e) => s + fn(e), 0));
    const basic = sum((e) => e.breakdown.basic);
    const hra = sum((e) => e.breakdown.hra);
    const special = sum((e) => e.breakdown.specialAllowance);
    const incentive = sum((e) => e.breakdown.incentive);
    const reimb = sum((e) => e.breakdown.approvedReimbursements);
    const employerPf = sum((e) => employerPfOf(e));
    const pfLiab = sum((e) => e.breakdown.pfDeduction);
    const ptLiab = sum((e) => e.breakdown.professionalTax);
    const tdsLiab = sum((e) => e.breakdown.incomeTaxTds);
    const loanRecov = sum((e) => e.breakdown.loanRecovery);
    const netPaid = sum((e) => e.breakdown.netPayable);
    const rows: (string | number)[][] = [
      ['5001', 'Basic Salary Expense', 'P/L', basic, 0, basic],
      ['5002', 'HRA Expense', 'P/L', hra, 0, hra],
      ['5003', 'Special Allowance Expense', 'P/L', special, 0, special],
      ['5004', 'Incentive / Commission Expense', 'P/L', incentive, 0, incentive],
      ['5005', 'Reimbursement Expense', 'P/L', reimb, 0, reimb],
      ['5006', 'Employer PF Contribution', 'P/L', employerPf, 0, employerPf],
      ['2101', 'PF Payable (Liability)', 'Balance Sheet', 0, pfLiab + employerPf, -(pfLiab + employerPf)],
      ['2102', 'Professional Tax Payable', 'Balance Sheet', 0, ptLiab, -ptLiab],
      ['2103', 'TDS Payable', 'Balance Sheet', 0, tdsLiab, -tdsLiab],
      ['1301', 'Employee Loan Receivable', 'Balance Sheet', 0, loanRecov, -loanRecov],
      ['1111', 'Bank / Salary Paid', 'Balance Sheet', 0, netPaid, -netPaid],
    ];
    return {
      definition: def('gl-posting'),
      columns: [c('GL Code'), c('Ledger Head'), c('Type'), c('Debit', 'currency'), c('Credit', 'currency'), c('Net', 'currency')],
      rows,
      summary: [
        { label: 'GL Lines', value: String(rows.length) },
        { label: 'Total Expense (Dr)', value: String(basic + hra + special + incentive + reimb + employerPf) },
        { label: 'Net Payable Paid', value: String(netPaid) },
      ],
    };
  },

  'gl-reconciliation': (ctx, f) => {
    const emps = applyFilters(ctx, f);
    const payrollGross = inr(emps.reduce((s, e) => s + e.breakdown.grossEarnings, 0));
    const payrollNet = inr(emps.reduce((s, e) => s + e.breakdown.netPayable, 0));
    const payrollDed = inr(emps.reduce((s, e) => s + e.breakdown.totalDeductions, 0));
    const rows: (string | number)[][] = [
      ['Gross Salary Expense', payrollGross, inr(payrollGross * (flag('gl-g', 0.4) ? 1.005 : 1)), payrollGross - inr(payrollGross * (flag('gl-g', 0.4) ? 1.005 : 1))],
      ['Net Pay / Bank Credit', payrollNet, inr(payrollNet * (flag('gl-n', 0.35) ? 0.995 : 1)), payrollNet - inr(payrollNet * (flag('gl-n', 0.35) ? 0.995 : 1))],
      ['Deductions Liability', payrollDed, inr(payrollDed * (flag('gl-d', 0.3) ? 1.01 : 1)), payrollDed - inr(payrollDed * (flag('gl-d', 0.3) ? 1.01 : 1))],
    ].map((r) => [...r, Math.abs(Number(r[3])) < 1 ? 'Reconciled' : 'Difference'] as (string | number)[]);
    return {
      definition: def('gl-reconciliation'),
      columns: [c('GL Head'), c('Payroll Processed', 'currency'), c('GL Posted', 'currency'), c('Difference', 'currency'), c('Status')],
      rows,
      summary: [
        { label: 'Heads', value: String(rows.length) },
        { label: 'Total Difference', value: String(inr(rows.reduce((s, r) => s + Number(r[3] || 0), 0))) },
      ],
    };
  },

  'employer-contribution': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => [
      e.master.empCode, e.name, inr(e.breakdown.basic),
      inr(e.breakdown.pfDeduction), employerPfOf(e), esiOf(e), gratuityOf(e), employerContributionOf(e),
    ]);
    return {
      definition: def('employer-contribution'),
      columns: [c('Emp Code'), c('Employee'), c('Basic', 'currency'), c('Employee PF', 'currency'), c('Employer PF (12%)', 'currency'), c('Employer ESI', 'currency'), c('Gratuity Accrual', 'currency'), c('Total Employer Cost', 'currency')],
      rows,
      summary: [
        { label: 'Employer PF', value: String(inr(rows.reduce((s, r) => s + Number(r[4] || 0), 0))) },
        { label: 'Total Employer Cost', value: String(inr(rows.reduce((s, r) => s + Number(r[7] || 0), 0))) },
      ],
    };
  },

  'ytd-earnings': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const months = e.ytdBreakdowns.length || 1;
      const avg = (sel: (b: PolicyPayrollBreakdown) => number) => inr(e.ytdBreakdowns.reduce((s, b) => s + sel(b), 0));
      const avgDed = (sel: (b: PolicyPayrollBreakdown) => number) => inr(e.ytdBreakdowns.reduce((s, b) => s + sel(b), 0));
      void months;
      return [
        e.master.empCode, e.name, e.department,
        avg((b) => b.grossEarnings), avg((b) => b.basic), avg((b) => b.hra), avg((b) => b.specialAllowance), avg((b) => b.incentive),
        avgDed((b) => b.pfDeduction), avgDed((b) => b.incomeTaxTds), avgDed((b) => b.totalDeductions), avgDed((b) => b.netPayable),
      ];
    });
    return {
      definition: def('ytd-earnings'),
      columns: [c('Emp Code'), c('Employee'), c('Department'), c('Gross YTD', 'currency'), c('Basic YTD', 'currency'), c('HRA YTD', 'currency'), c('Special YTD', 'currency'), c('Incentive YTD', 'currency'), c('PF YTD', 'currency'), c('TDS YTD', 'currency'), c('Total Ded YTD', 'currency'), c('Net YTD', 'currency')],
      rows,
      summary: [
        { label: 'Employees', value: String(rows.length) },
        { label: 'Org Gross YTD', value: String(inr(rows.reduce((s, r) => s + Number(r[3] || 0), 0))) },
        { label: 'Org Net YTD', value: String(inr(rows.reduce((s, r) => s + Number(r[11] || 0), 0))) },
      ],
      note: `Year-to-date cumulative across the ${PAYSLIP_MONTHS.length} published months in ${ctx.financialYear}.`,
    };
  },

  'investment-declaration': (ctx, f) => {
    const rows = applyFilters(ctx, f).map((e) => {
      const s80c = inr(seeded(`${e.id}-80c`, 0, 150000));
      const s80d = inr(seeded(`${e.id}-80d`, 0, 25000));
      const hra = inr(seeded(`${e.id}-hra`, 0, 60000));
      const nps = inr(flag(`${e.id}-nps`, 0.4) ? seeded(`${e.id}-npa`, 0, 50000) : 0);
      return [e.master.empCode, e.name, e.master.taxRegime || 'New Tax Regime (Section 115BAC)', s80c, s80d, hra, nps, s80c + s80d + nps, seededPick(`${e.id}-decst`, ['Submitted', 'Verified', 'Pending'])];
    });
    return {
      definition: def('investment-declaration'),
      columns: [c('Emp Code'), c('Employee'), c('Tax Regime'), c('Sec 80C', 'currency'), c('Sec 80D', 'currency'), c('HRA Rent', 'currency'), c('NPS 80CCD(1B)', 'currency'), c('Total Declared', 'currency'), c('Status')],
      rows,
      summary: [
        { label: 'Submitted', value: String(rows.filter((r) => r[8] === 'Submitted').length) },
        { label: 'Verified', value: String(rows.filter((r) => r[8] === 'Verified').length) },
        { label: 'Pending', value: String(rows.filter((r) => r[8] === 'Pending').length) },
      ],
    };
  },

  'declaration-vs-proof': (ctx, f) => {
    const rows: (string | number)[][] = [];
    for (const e of applyFilters(ctx, f)) {
      const sections: Array<[string, number]> = [['Sec 80C', seeded(`${e.id}-80c`, 0, 150000)], ['Sec 80D', seeded(`${e.id}-80d`, 0, 25000)], ['NPS', flag(`${e.id}-nps`, 0.4) ? seeded(`${e.id}-npa`, 0, 50000) : 0]];
      for (const [sec, declared] of sections) {
        if (!declared) continue;
        const proof = flag(`${e.id}${sec}pf`, 0.65) ? declared : inr(declared * (seeded(`${e.id}${sec}pv`, 40, 95) / 100));
        const accepted = proof;
        rows.push([e.master.empCode, e.name, sec, inr(declared), proof, accepted, proof - declared, Math.abs(proof - declared) < 1 ? 'Matched' : flag(`${e.id}${sec}pen`, 0.5) ? 'Proof Pending' : 'Variance Accepted']);
      }
    }
    return {
      definition: def('declaration-vs-proof'),
      columns: [c('Emp Code'), c('Employee'), c('Section'), c('Declared', 'currency'), c('Proof Submitted', 'currency'), c('Accepted', 'currency'), c('Variance', 'currency'), c('Status')],
      rows,
      summary: [
        { label: 'Lines', value: String(rows.length) },
        { label: 'Proof Pending', value: String(rows.filter((r) => r[7] === 'Proof Pending').length) },
      ],
    };
  },

  'exit-recovery': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        if (e.status !== 'Inactive') return null;
        const loan = inr(e.loans.reduce((s, l) => s + l.outstandingBalance, 0));
        const adv = inr(e.breakdown.advanceRecovery);
        const other = inr(flag(`${e.id}-oth`, 0.4) ? seeded(`${e.id}-othr`, 0, 25000) : 0);
        const total = loan + adv + other;
        const fnf = inr(e.breakdown.netPayable);
        return { e, loan, adv, other, total, fnf, balance: Math.max(0, total - fnf), exitDate: `${ctx.monthKey}-15` };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('exit-recovery'),
      columns: [c('Emp Code'), c('Employee'), c('Exit Date', 'date'), c('Loan Outstanding', 'currency'), c('Advance Due', 'currency'), c('Other Recovery', 'currency'), c('Total Recovery', 'currency'), c('Set off in FnF', 'currency'), c('Balance Recoverable', 'currency')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.exitDate, x.loan, x.adv, x.other, x.total, x.fnf, x.balance]),
      summary: [
        { label: 'Exits', value: String(rows.length) },
        { label: 'Total Recovery', value: String(inr(rows.reduce((s, x) => s + x.total, 0))) },
      ],
    };
  },

  'fnf-aging': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        const isExit = e.status === 'Inactive' || flag(`${e.id}-fnf`, 0.25);
        if (!isExit) return null;
        const amt = inr(e.breakdown.netPayable + encashDaysOf(e) * 1000);
        const days = seeded(`${e.id}-days`, 1, 120);
        const bucket = days <= 30 ? '0-30 Days' : days <= 60 ? '31-60 Days' : days <= 90 ? '61-90 Days' : '90+ Days';
        return { e, amt, days, bucket, status: days <= 30 ? 'In Process' : 'Overdue' };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('fnf-aging'),
      columns: [c('Emp Code'), c('Employee'), c('Exit Date', 'date'), c('FnF Amount', 'currency'), c('Days Outstanding', 'number'), c('Aging Bucket'), c('Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, `${ctx.monthKey}-15`, x.amt, x.days, x.bucket, x.status]),
      summary: [
        { label: 'Settlements', value: String(rows.length) },
        { label: 'Overdue (60+)', value: String(rows.filter((r) => r.days > 60).length) },
        { label: 'Total Pending', value: String(inr(rows.reduce((s, x) => s + x.amt, 0))) },
      ],
    };
  },

  'approval-history': (ctx, f) => {
    const approvers = [['Vikramaditya Rathore', 'Super Admin'], ['Priya Deshmukh', 'Finance Manager'], ['Sanjay Iyer', 'HR Admin']];
    const rows = applyFilters(ctx, f).map((e, i) => {
      const [approver, role] = approvers[i % approvers.length];
      const st = processingStatus(e);
      const decision = st === 'On Hold' || st === 'Pending' ? 'Query Raised' : 'Approved';
      return [ctx.monthLabel, e.master.empCode, e.name, approver, role, decision, `${ctx.monthKey}-${String(seeded(`${e.id}-ts`, 24, 30)).padStart(2, '0')} ${seededPick(`${e.id}-tsh`, ['10:12', '14:45', '17:30', '09:20'])} IST`, seededPick(`${e.id}-rmk`, ['Verified against attendance', 'Reimbursements cross-checked', 'Awaited cost-centre sign-off', 'Auto-approved within limit'])];
    });
    return {
      definition: def('approval-history'),
      columns: [c('Month'), c('Emp Code'), c('Employee'), c('Approver'), c('Approver Role'), c('Decision'), c('Timestamp', 'date'), c('Remarks')],
      rows,
      summary: [
        { label: 'Approvals', value: String(rows.length) },
        { label: 'Approved', value: String(rows.filter((r) => r[5] === 'Approved').length) },
        { label: 'Query Raised', value: String(rows.filter((r) => r[5] === 'Query Raised').length) },
      ],
    };
  },

  'change-audit': (ctx, f) => {
    const users = ['Vikramaditya Rathore', 'Priya Deshmukh', 'System Auto-Sync'];
    const rows: (string | number)[][] = [];
    applyFilters(ctx, f).forEach((e, i) => {
      if (!flag(`${e.id}-aud`, 0.55)) return;
      const field = seededPick(`${e.id}-audf`, ['Monthly Gross', 'LOP Days', 'Bank Account', 'PF Amount', 'Commission %', 'Tax Regime']);
      rows.push([`${ctx.monthKey}-${String(seeded(`${e.id}-audd`, 1, 28)).padStart(2, '0')} ${seededPick(`${e.id}-audt`, ['09:15', '13:40', '18:05'])} IST`, users[i % users.length], e.master.empCode, e.name, field, seeded(`${e.id}-audold`, 1, 200000), seeded(`${e.id}-audnew`, 1, 200000), 'UPDATE']);
    });
    return {
      definition: def('change-audit'),
      columns: [c('Timestamp', 'date'), c('User'), c('Emp Code'), c('Employee'), c('Field Changed'), c('Old Value', 'number'), c('New Value', 'number'), c('Action')],
      rows,
      summary: [{ label: 'Changes Logged', value: String(rows.length) }, { label: 'Users', value: String(new Set(rows.map((r) => r[1])).size) }],
    };
  },

  'bank-detail-change': (ctx, f) => {
    const rows = applyFilters(ctx, f)
      .map((e) => {
        if (!flag(`${e.id}-bankch`, 0.25)) return null;
        return { e, old: `${seeded(`${e.id}-old`, 10000000, 99999999)}`, new: e.master.bankAccountNo || `${seeded(`${e.id}-new`, 10000000, 99999999)}`, date: `${ctx.monthKey}-${String(seeded(`${e.id}-bchd`, 1, 27)).padStart(2, '0')}`, status: seededPick(`${e.id}-bchs`, ['Pending Verification', 'Verified', 'On Hold for Confirmation']) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return {
      definition: def('bank-detail-change'),
      columns: [c('Emp Code'), c('Employee'), c('Old A/C'), c('New A/C'), c('Bank'), c('IFSC'), c('Change Date', 'date'), c('Verification Status')],
      rows: rows.map((x) => [x.e.master.empCode, x.e.name, x.old, x.new, x.e.master.bankName || '—', x.e.master.ifscCode || '—', x.date, x.status]),
      summary: [
        { label: 'Bank Changes', value: String(rows.length) },
        { label: 'Pending Verification', value: String(rows.filter((r) => r.status.startsWith('Pending') || r.status.startsWith('On Hold')).length) },
      ],
    };
  },
};

// Employer-side statutory helpers ------------------------------------------------

const employerPfOf = (e: PayrollReportEmployee): number => {
  const pfCapBasic = 15000; // statutory PF wage ceiling
  const basic = e.breakdown.basic || 0;
  return inr(Math.min(basic, pfCapBasic) * 0.12);
};
const esiOf = (e: PayrollReportEmployee): number => (e.breakdown.basic <= 21000 ? inr(e.breakdown.grossEarnings * 0.0325) : 0);
const gratuityOf = (e: PayrollReportEmployee): number => inr(e.breakdown.basic * (4.81 / 100));
const employerContributionOf = (e: PayrollReportEmployee): number => employerPfOf(e) + esiOf(e) + gratuityOf(e);

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

function def(id: string): PayrollReportDefinition {
  const d = getReportDefinition(id);
  if (!d) throw new Error(`Unknown payroll report id: ${id}`);
  return d;
}

function c(label: string, type?: ReportColumnType): ReportColumn {
  const align = type === 'currency' || type === 'number' || type === 'pct' ? 'right' : type === 'date' ? 'left' : 'left';
  return { label, type, align };
}

export const buildPayrollReport = (
  ctx: PayrollReportContext,
  reportId: string,
  filters: PayrollReportFilters,
): ReportResult => {
  const gen = GENERATORS[reportId];
  if (!gen) return emptyResult(reportId);
  const result = gen(ctx, filters);
  // Attach the month label helper onto employee rows that referenced it.
  return result;
};

const emptyResult = (reportId: string): ReportResult => ({
  definition: def(reportId),
  columns: [],
  rows: [],
  summary: [{ label: 'Report', value: 'Not implemented' }],
});

export const listReportIds = (): string[] => REPORT_CATALOGUE.map((r) => r.id);
