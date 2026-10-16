import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Landmark,
  Calendar,
  TrendingUp,
  Download,
  Plus,
  X,
  Check,
  RotateCcw,
  Lock,
  Search,
  Eye,
  ArrowRight,
  Ban,
  Receipt,
  UserCheck,
  Calculator,
  History,
  LogOut,
  Trash2,
} from 'lucide-react';
import {
  AdminPolicyMaster,
  EmployeeSalaryMasterRecord,
  EmployeeLoanRecord,
  LoanType,
  LoanCalculationMethod,
  LoanWorkflowStatus,
  LoanShortfallPolicy,
  LoanLedgerEntry,
  LoanAuditLogEntry,
  PAYSLIP_MONTHS,
  PAYROLL_LOANS_SYNC_EVENT,
  loadAllEmployeeLoans,
  saveAllEmployeeLoans,
  rejectEmployeeLoan,
  deleteEmployeeLoan,
  generateLoanAmortizationSchedule,
  reconcileMonthlyLoanDeductions,
  formatMonthKeyLabel,
  saveAdminPolicyMaster,
} from './payrollTypes';

interface PayrollLoanManagementSectionProps {
  isAdminUser: boolean;
  activeEmployee: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    designation: string;
    location: string;
    status: 'Active' | 'Inactive';
  } | null;
  activeUserMaster: EmployeeSalaryMasterRecord | null;
  employeeSalaryMasters: Record<string, EmployeeSalaryMasterRecord>;
  adminPolicyMaster: AdminPolicyMaster;
  setAdminPolicyMaster: React.Dispatch<React.SetStateAction<AdminPolicyMaster>>;
  selectedMonthKey: string;
  setStatusBanner: (msg: string | null) => void;
}

const LOAN_TYPES: LoanType[] = [
  'Personal Loan',
  'Salary Advance',
  'Emergency Medical Loan',
  'Vehicle / Two-Wheeler Loan',
  'Education / Skill Loan',
  'Festival / Housing Advance',
];

const WORKFLOW_STEPS = [
  { step: 1, title: 'Loan Request', desc: 'Employee / HR Application' },
  { step: 2, title: 'HR Verification', desc: 'Status, Salary & Eligibility' },
  { step: 3, title: 'Manager / HR Approval', desc: 'Approve, Return or Reject' },
  { step: 4, title: 'Finance Disbursement', desc: 'Authorize & Record Payment' },
  { step: 5, title: 'EMI Schedule', desc: 'Auto-Generate Instalments' },
  { step: 6, title: 'Payroll Deduction', desc: 'Auto-Deduct in Monthly Salary' },
  { step: 7, title: 'Reconciliation', desc: 'Update Recovered & Balance' },
  { step: 8, title: 'Loan Closure', desc: 'Full Recovery / Preclose / FnF' },
];

export const getLoanWorkflowStepNumber = (status: LoanWorkflowStatus): number => {
  switch (status) {
    case 'Submitted - Pending HR Verification':
    case 'Returned for Clarification':
      return 2;
    case 'HR Verified - Pending Manager/HR Approval':
      return 3;
    case 'Approved - Pending Finance Disbursement':
      return 4;
    case 'Active - Disbursed':
      return 6;
    case 'Closed - Fully Recovered':
    case 'Closed - Early Preclosure':
    case 'Closed - Exit FnF Settlement':
      return 8;
    case 'Rejected':
    case 'Cancelled':
      return 0;
    default:
      return 1;
  }
};

export const PayrollLoanManagementSection: React.FC<PayrollLoanManagementSectionProps> = ({
  isAdminUser,
  activeEmployee,
  activeUserMaster,
  employeeSalaryMasters,
  adminPolicyMaster,
  setAdminPolicyMaster,
  selectedMonthKey,
  setStatusBanner,
}) => {
  const { currentUser, formatCurrency } = useCrm();

  const [allLoans, setAllLoans] = useState<EmployeeLoanRecord[]>(() => loadAllEmployeeLoans());
  const [subTab, setSubTab] = useState<
    'applications' | 'workflow_desk' | 'emi_ledger' | 'reports'
  >('applications');

  // Filter state
  const [employeeScopeFilter, setEmployeeScopeFilter] = useState<'SELECTED' | 'ALL'>(
    isAdminUser ? 'ALL' : 'SELECTED'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reportView, setReportView] = useState<
    'active_loans' | 'pending_approvals' | 'monthly_recoveries' | 'employee_balances' | 'audit_trail'
  >('active_loans');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected loan for EMI schedule, Ledger, Closure & Audit inspection
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');

  // Action Modals State
  const [hrVerifyModalLoan, setHrVerifyModalLoan] = useState<EmployeeLoanRecord | null>(null);
  const [hrVerifyForm, setHrVerifyForm] = useState({
    employeeStatusCheck: 'Active' as 'Active' | 'Probation' | 'Notice Period',
    eligibilityPassed: true,
    remarks: 'Verified active employment, salary slip, and 3x gross eligibility norm.',
  });

  const [managerApproveModalLoan, setManagerApproveModalLoan] =
    useState<EmployeeLoanRecord | null>(null);
  const [managerApproveForm, setManagerApproveForm] = useState({
    action: 'Approved' as 'Approved' | 'Returned' | 'Rejected',
    approvedAmount: 0,
    interestRateAnnual: 8.5,
    calculationMethod: 'reducing_balance' as LoanCalculationMethod,
    tenureMonths: 12,
    emiStartMonth: selectedMonthKey || '2026-09',
    remarks: 'Sanctioned as per corporate employee loan policy.',
  });

  const [financeDisburseModalLoan, setFinanceDisburseModalLoan] =
    useState<EmployeeLoanRecord | null>(null);
  const [financeDisburseForm, setFinanceDisburseForm] = useState({
    disbursementDate: new Date().toISOString().split('T')[0],
    paymentMode: 'NEFT / Bank Transfer' as
      | 'NEFT / Bank Transfer'
      | 'RTGS'
      | 'UPI Corporate'
      | 'Cheque'
      | 'Salary Cycle Credit',
    transactionReference: `UTR${Date.now().toString().slice(-8)}`,
    disbursedAmount: 0,
    remarks: 'Disbursed to employee registered salary bank account.',
  });

  const [closureModalLoan, setClosureModalLoan] = useState<EmployeeLoanRecord | null>(null);
  const [closureForm, setClosureForm] = useState({
    closureType: 'Early Lump-Sum Preclosure' as
      | 'Early Lump-Sum Preclosure'
      | 'Employee Exit / Resignation FnF Settlement',
    closureDate: new Date().toISOString().split('T')[0],
    settlementMode: 'Bank Transfer / NEFT' as
      | 'Bank Transfer / NEFT'
      | 'Final Salary & Leave Encashment Offset'
      | 'Gratuity / Bonus Offset',
    settlementReference: `SET-${Date.now().toString().slice(-6)}`,
    interestWaivedOrAdjusted: 0,
    exitLastWorkingDay: new Date().toISOString().split('T')[0],
    finalSalaryPayableBeforeLoan: 0,
    leaveEncashmentAmount: 0,
    gratuityOrBonusOffset: 0,
    remarks: 'Full & final settlement of remaining loan balance.',
  });

  const [clarificationLoan, setClarificationLoan] = useState<EmployeeLoanRecord | null>(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationRequestedAmount, setClarificationRequestedAmount] = useState(0);

  // Reject & Delete Modals (Available to both Employee & Admin)
  const [rejectModalLoan, setRejectModalLoan] = useState<EmployeeLoanRecord | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [deleteModalLoan, setDeleteModalLoan] = useState<EmployeeLoanRecord | null>(null);

  // Sync loans with localStorage
  useEffect(() => {
    const syncLoans = () => {
      const loaded = loadAllEmployeeLoans();
      setAllLoans((prev) =>
        JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded
      );
    };
    window.addEventListener(PAYROLL_LOANS_SYNC_EVENT, syncLoans);
    return () => window.removeEventListener(PAYROLL_LOANS_SYNC_EVENT, syncLoans);
  }, []);

  const updateAndSaveLoans = (nextLoans: EmployeeLoanRecord[]) => {
    setAllLoans(nextLoans);
    saveAllEmployeeLoans(nextLoans, true);
  };

  // Enrolled employees list for Admin applicant selector
  const enrolledEmployeesList = useMemo(() => {
    return Object.values(employeeSalaryMasters).filter(
      (m) => m && m.userId && m.enrolledInPayroll !== false
    );
  }, [employeeSalaryMasters]);

  // Loan Application Form State (Step 1)
  const [loanForm, setLoanForm] = useState({
    applicantUserId: activeEmployee?.id || '',
    loanType: 'Personal Loan' as LoanType,
    requestedAmount: '60000',
    tenureMonths: '12',
    interestRateAnnual: '8.5',
    calculationMethod: 'reducing_balance' as LoanCalculationMethod,
    emiStartMonth: selectedMonthKey || '2026-09',
    purpose: '',
    supportingDocumentRef: '',
    applicationDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (activeEmployee?.id && (!isAdminUser || !loanForm.applicantUserId)) {
      setLoanForm((prev) => ({ ...prev, applicantUserId: activeEmployee.id }));
    }
  }, [activeEmployee?.id, isAdminUser, loanForm.applicantUserId]);

  // Target applicant master for Step 1 form
  const applicantMaster = useMemo(() => {
    if (!isAdminUser) return activeUserMaster;
    return (
      employeeSalaryMasters[loanForm.applicantUserId] ||
      activeUserMaster ||
      enrolledEmployeesList[0] ||
      null
    );
  }, [isAdminUser, activeUserMaster, employeeSalaryMasters, loanForm.applicantUserId, enrolledEmployeesList]);

  // Live EMI & Eligibility Preview for Application Form
  const liveLoanPreview = useMemo(() => {
    const reqAmt = Math.max(0, Number(loanForm.requestedAmount) || 0);
    const tenure = Math.max(1, Number(loanForm.tenureMonths) || 1);
    const isSalaryAdvance = loanForm.loanType === 'Salary Advance';
    const calcMethod: LoanCalculationMethod = isSalaryAdvance
      ? 'interest_free'
      : loanForm.calculationMethod;
    const rate = isSalaryAdvance ? 0 : Math.max(0, Number(loanForm.interestRateAnnual) || 0);

    const schedulePreview = generateLoanAmortizationSchedule({
      principal: reqAmt,
      interestRateAnnual: rate,
      tenureMonths: tenure,
      calculationMethod: calcMethod,
      emiStartMonth: loanForm.emiStartMonth || selectedMonthKey,
    });

    const empGross = applicantMaster?.monthlyGross || 0;
    const maxMult = adminPolicyMaster.loanMaxEligibilityMultiple ?? 3;
    const maxEligible = isSalaryAdvance ? empGross : empGross * maxMult;
    const empExistingLoans = allLoans.filter(
      (l) =>
        l.employeeId === applicantMaster?.userId &&
        l.status === 'Active - Disbursed'
    );
    const existingOutstanding = empExistingLoans.reduce(
      (s, l) => s + l.outstandingBalance,
      0
    );
    const remainingEligibility = Math.max(0, maxEligible - existingOutstanding);
    const isWithinEligibility = reqAmt <= remainingEligibility || empGross === 0;

    return {
      ...schedulePreview,
      empGross,
      maxEligible,
      existingActiveCount: empExistingLoans.length,
      existingOutstanding,
      remainingEligibility,
      isWithinEligibility,
    };
  }, [
    loanForm,
    applicantMaster,
    adminPolicyMaster.loanMaxEligibilityMultiple,
    allLoans,
    selectedMonthKey,
  ]);

  // Visible loans based on role & scope
  const visibleLoans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allLoans.filter((loan) => {
      // Strictly isolate non-admin to their own loans
      if (!isAdminUser) {
        if (loan.employeeId !== activeEmployee?.id) return false;
      } else if (employeeScopeFilter === 'SELECTED' && activeEmployee?.id) {
        if (loan.employeeId !== activeEmployee.id) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && loan.status !== 'Active - Disbursed') return false;
        if (
          statusFilter === 'PENDING' &&
          ![
            'Submitted - Pending HR Verification',
            'HR Verified - Pending Manager/HR Approval',
            'Approved - Pending Finance Disbursement',
            'Returned for Clarification',
          ].includes(loan.status)
        ) {
          return false;
        }
        if (
          statusFilter === 'CLOSED' &&
          ![
            'Closed - Fully Recovered',
            'Closed - Early Preclosure',
            'Closed - Exit FnF Settlement',
          ].includes(loan.status)
        ) {
          return false;
        }
        if (
          statusFilter === 'REJECTED' &&
          loan.status !== 'Rejected' &&
          loan.status !== 'Cancelled'
        ) {
          return false;
        }
      }

      if (q) {
        const match =
          loan.loanNumber.toLowerCase().includes(q) ||
          loan.employeeName.toLowerCase().includes(q) ||
          loan.empCode.toLowerCase().includes(q) ||
          loan.loanType.toLowerCase().includes(q) ||
          loan.purpose.toLowerCase().includes(q) ||
          loan.status.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allLoans, isAdminUser, activeEmployee?.id, employeeScopeFilter, statusFilter, searchQuery]);

  // Auto-select a loan for EMI & Ledger view
  const inspectedLoan = useMemo(() => {
    if (selectedLoanId) {
      const found = visibleLoans.find((l) => l.id === selectedLoanId);
      if (found) return found;
    }
    return visibleLoans[0] || null;
  }, [visibleLoans, selectedLoanId]);

  // Summary KPIs
  const loanKpis = useMemo(() => {
    const scoped = !isAdminUser
      ? allLoans.filter((l) => l.employeeId === activeEmployee?.id)
      : employeeScopeFilter === 'SELECTED' && activeEmployee?.id
      ? allLoans.filter((l) => l.employeeId === activeEmployee.id)
      : allLoans;

    const activeLoans = scoped.filter((l) => l.status === 'Active - Disbursed');
    const pendingLoans = scoped.filter((l) =>
      [
        'Submitted - Pending HR Verification',
        'HR Verified - Pending Manager/HR Approval',
        'Approved - Pending Finance Disbursement',
        'Returned for Clarification',
      ].includes(l.status)
    );
    const totalDisbursed = scoped.reduce((s, l) => s + (l.disbursedAmount || 0), 0);
    const totalRecovered = scoped.reduce((s, l) => s + (l.totalRecovered || 0), 0);
    const totalOutstanding = activeLoans.reduce((s, l) => s + (l.outstandingBalance || 0), 0);

    const dueThisMonth = activeLoans.reduce((sum, l) => {
      const inst = l.emiSchedule.find(
        (i) =>
          i.dueMonthKey === selectedMonthKey &&
          i.status !== 'Deferred / On Hold' &&
          i.status !== 'Settled via Preclosure / Exit FnF'
      );
      if (!inst) return sum;
      return (
        sum +
        (inst.status === 'Recovered via Payroll' ||
        inst.status === 'Partial - Shortfall Carried Forward'
          ? inst.deductedAmount
          : inst.totalDueThisMonth || inst.scheduledEmi)
      );
    }, 0);

    return {
      totalCount: scoped.length,
      activeCount: activeLoans.length,
      pendingCount: pendingLoans.length,
      totalDisbursed,
      totalRecovered,
      totalOutstanding,
      dueThisMonth,
    };
  }, [allLoans, isAdminUser, activeEmployee?.id, employeeScopeFilter, selectedMonthKey]);

  const nowTimestamp = () =>
    new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ==========================================================================
  // STEP 1: SUBMIT LOAN / SALARY ADVANCE APPLICATION
  // ==========================================================================
  const handleCreateLoanApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantMaster) {
      setStatusBanner('Please select or enroll an employee in Payroll Master first.');
      return;
    }
    const reqAmt = Math.round(Number(loanForm.requestedAmount) || 0);
    const tenure = Math.max(1, Math.min(60, Math.round(Number(loanForm.tenureMonths) || 1)));
    if (reqAmt <= 0) {
      setStatusBanner('Requested loan amount must be greater than ₹0.');
      return;
    }
    if (!loanForm.purpose.trim()) {
      setStatusBanner('Please enter the reason / purpose for the loan request.');
      return;
    }

    const isAdvance = loanForm.loanType === 'Salary Advance';
    const calcMethod: LoanCalculationMethod = isAdvance
      ? 'interest_free'
      : loanForm.calculationMethod;
    const rate = isAdvance ? 0 : Math.max(0, Number(loanForm.interestRateAnnual) || 0);

    const scheduleData = generateLoanAmortizationSchedule({
      principal: reqAmt,
      interestRateAnnual: rate,
      tenureMonths: tenure,
      calculationMethod: calcMethod,
      emiStartMonth: loanForm.emiStartMonth || selectedMonthKey,
    });

    const seqNum = 101 + allLoans.length;
    const loanNumber = `${isAdvance ? 'ADV' : 'LN'}-2026-${seqNum}`;
    const nowStr = nowTimestamp();

    const newLoan: EmployeeLoanRecord = {
      id: `LOAN-${Date.now()}`,
      loanNumber,
      employeeId: applicantMaster.userId,
      empCode: applicantMaster.empCode,
      employeeName: applicantMaster.name || activeEmployee?.name || 'Employee',
      department: applicantMaster.department || activeEmployee?.department || 'General',
      designation:
        applicantMaster.designation ||
        applicantMaster.role ||
        activeEmployee?.designation ||
        'Employee',
      monthlyGrossAtApplication: applicantMaster.monthlyGross || 0,
      loanType: loanForm.loanType,
      requestedAmount: reqAmt,
      approvedAmount: reqAmt,
      interestRateAnnual: rate,
      calculationMethod: calcMethod,
      tenureMonths: tenure,
      repaymentFrequency: 'Monthly',
      emiStartMonth: loanForm.emiStartMonth || selectedMonthKey,
      monthlyEmi: scheduleData.monthlyEmi,
      totalInterestPayable: scheduleData.totalInterestPayable,
      totalPayableAmount: scheduleData.totalPayableAmount,
      purpose: loanForm.purpose.trim(),
      supportingDocumentRef:
        loanForm.supportingDocumentRef.trim() || `DOC-${seqNum}-DECLARATION`,
      applicationDate: loanForm.applicationDate || new Date().toISOString().split('T')[0],
      status: 'Submitted - Pending HR Verification',
      hrVerification: {
        verified: false,
        employeeStatusCheck: 'Active',
        monthlyGrossSalary: applicantMaster.monthlyGross || 0,
        existingActiveLoansCount: liveLoanPreview.existingActiveCount,
        existingOutstandingBalance: liveLoanPreview.existingOutstanding,
        maxEligibleAmount: liveLoanPreview.maxEligible,
        eligibilityPassed: liveLoanPreview.isWithinEligibility,
      },
      managerApproval: {
        status: 'Pending',
      },
      financeDisbursement: {
        disbursed: false,
        bankName: applicantMaster.bankName,
        bankAccountNo: applicantMaster.bankAccountNo,
      },
      emiSchedule: scheduleData.schedule,
      ledger: [],
      disbursedAmount: 0,
      totalRecovered: 0,
      totalAdjustments: 0,
      outstandingBalance: 0,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: nowStr,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          stage: '1. Employee Loan Request',
          action: 'Submitted Loan Application',
          remarks: `Applied for ${loanForm.loanType} of ${formatCurrency(
            reqAmt
          )} (${tenure} months tenure, Est. EMI ${formatCurrency(
            scheduleData.monthlyEmi
          )}/mo). Purpose: ${loanForm.purpose.trim()}`,
        },
      ],
    };

    const nextLoans = [newLoan, ...allLoans];
    updateAndSaveLoans(nextLoans);
    setSelectedLoanId(newLoan.id);
    setLoanForm((prev) => ({
      ...prev,
      purpose: '',
      supportingDocumentRef: '',
    }));
    setStatusBanner(
      `Loan Request ${loanNumber} (${loanForm.loanType} — ${formatCurrency(
        reqAmt
      )}) submitted and queued for Step 2: HR Verification.`
    );
  };

  // ==========================================================================
  // STEP 2: HR VERIFICATION HANDLER
  // ==========================================================================
  const handleConfirmHrVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrVerifyModalLoan) return;
    const nowStr = nowTimestamp();

    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== hrVerifyModalLoan.id) return ln;
      return {
        ...ln,
        status: 'HR Verified - Pending Manager/HR Approval' as LoanWorkflowStatus,
        hrVerification: {
          ...ln.hrVerification,
          verified: true,
          verifiedBy: `${currentUser.name} (${currentUser.role})`,
          verifiedAt: nowStr,
          employeeStatusCheck: hrVerifyForm.employeeStatusCheck,
          eligibilityPassed: hrVerifyForm.eligibilityPassed,
          remarks: hrVerifyForm.remarks,
        },
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '2. HR Verification',
            action: 'Completed HR Eligibility & Service Verification',
            remarks: `Employee Status: ${hrVerifyForm.employeeStatusCheck} · Eligibility Passed: ${
              hrVerifyForm.eligibilityPassed ? 'Yes' : 'Exception Noted'
            } · Remarks: ${hrVerifyForm.remarks}`,
          },
          ...ln.auditTrail,
        ],
      };
    });

    updateAndSaveLoans(nextLoans);
    setStatusBanner(
      `Step 2 Complete: HR Verification recorded for ${hrVerifyModalLoan.loanNumber}. Forwarded to Step 3: Manager / HR Approval.`
    );
    setHrVerifyModalLoan(null);
  };

  // ==========================================================================
  // STEP 3: MANAGER / HR APPROVAL, RETURN FOR CLARIFICATION, OR REJECTION
  // ==========================================================================
  const handleConfirmManagerDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerApproveModalLoan) return;
    const nowStr = nowTimestamp();
    const decision = managerApproveModalLoan;
    const approvedAmt = Math.max(
      1,
      Math.round(Number(managerApproveForm.approvedAmount) || decision.requestedAmount)
    );
    const tenure = Math.max(
      1,
      Math.round(Number(managerApproveForm.tenureMonths) || decision.tenureMonths)
    );
    const calcMethod = managerApproveForm.calculationMethod;
    const rate =
      calcMethod === 'interest_free'
        ? 0
        : Math.max(0, Number(managerApproveForm.interestRateAnnual) || 0);
    const startMonth = managerApproveForm.emiStartMonth || decision.emiStartMonth;

    const recomputedSchedule = generateLoanAmortizationSchedule({
      principal: approvedAmt,
      interestRateAnnual: rate,
      tenureMonths: tenure,
      calculationMethod: calcMethod,
      emiStartMonth: startMonth,
    });

    const nextStatus: LoanWorkflowStatus =
      managerApproveForm.action === 'Approved'
        ? 'Approved - Pending Finance Disbursement'
        : managerApproveForm.action === 'Returned'
        ? 'Returned for Clarification'
        : 'Rejected';

    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== decision.id) return ln;
      return {
        ...ln,
        approvedAmount: approvedAmt,
        interestRateAnnual: rate,
        calculationMethod: calcMethod,
        tenureMonths: tenure,
        emiStartMonth: startMonth,
        monthlyEmi: recomputedSchedule.monthlyEmi,
        totalInterestPayable: recomputedSchedule.totalInterestPayable,
        totalPayableAmount: recomputedSchedule.totalPayableAmount,
        emiSchedule: recomputedSchedule.schedule,
        status: nextStatus,
        managerApproval: {
          status: managerApproveForm.action,
          approvedBy: `${currentUser.name} (${currentUser.role})`,
          approvedAt: nowStr,
          approvedAmount: approvedAmt,
          interestRateAnnual: rate,
          calculationMethod: calcMethod,
          tenureMonths: tenure,
          emiStartMonth: startMonth,
          calculatedMonthlyEmi: recomputedSchedule.monthlyEmi,
          remarks: managerApproveForm.remarks,
        },
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '3. Manager / HR Approval',
            action:
              managerApproveForm.action === 'Approved'
                ? `Sanctioned & Approved Loan (${formatCurrency(approvedAmt)})`
                : managerApproveForm.action === 'Returned'
                ? 'Returned Request for Clarification / Correction'
                : 'Rejected Loan Application',
            remarks: `Decision: ${managerApproveForm.action} · Approved Amt: ${formatCurrency(
              approvedAmt
            )} @ ${rate}% (${calcMethod.replace('_', ' ')}) for ${tenure} mos · EMI: ${formatCurrency(
              recomputedSchedule.monthlyEmi
            )}/mo · Remarks: ${managerApproveForm.remarks}`,
          },
          ...ln.auditTrail,
        ],
      };
    });

    updateAndSaveLoans(nextLoans);
    setStatusBanner(
      managerApproveForm.action === 'Approved'
        ? `Step 3 Complete: ${decision.loanNumber} approved for ${formatCurrency(
            approvedAmt
          )} (EMI ${formatCurrency(
            recomputedSchedule.monthlyEmi
          )}/mo). Ready for Step 4: Finance Disbursement.`
        : managerApproveForm.action === 'Returned'
        ? `${decision.loanNumber} returned to employee for clarification.`
        : `${decision.loanNumber} rejected.`
    );
    setManagerApproveModalLoan(null);
  };

  // Employee responds to "Returned for Clarification"
  const handleResubmitClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationLoan || !clarificationText.trim()) return;
    const nowStr = nowTimestamp();
    const updatedReqAmt =
      clarificationRequestedAmount > 0
        ? clarificationRequestedAmount
        : clarificationLoan.requestedAmount;

    const recomputed = generateLoanAmortizationSchedule({
      principal: updatedReqAmt,
      interestRateAnnual: clarificationLoan.interestRateAnnual,
      tenureMonths: clarificationLoan.tenureMonths,
      calculationMethod: clarificationLoan.calculationMethod,
      emiStartMonth: clarificationLoan.emiStartMonth,
    });

    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== clarificationLoan.id) return ln;
      return {
        ...ln,
        requestedAmount: updatedReqAmt,
        approvedAmount: updatedReqAmt,
        monthlyEmi: recomputed.monthlyEmi,
        totalInterestPayable: recomputed.totalInterestPayable,
        totalPayableAmount: recomputed.totalPayableAmount,
        emiSchedule: recomputed.schedule,
        status: (ln.hrVerification.verified
          ? 'HR Verified - Pending Manager/HR Approval'
          : 'Submitted - Pending HR Verification') as LoanWorkflowStatus,
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '1B. Employee Clarification Resubmission',
            action: 'Resubmitted with Clarification',
            remarks: `Updated Amount: ${formatCurrency(
              updatedReqAmt
            )} · Clarification: ${clarificationText.trim()}`,
          },
          ...ln.auditTrail,
        ],
      };
    });

    updateAndSaveLoans(nextLoans);
    setStatusBanner(`Resubmitted ${clarificationLoan.loanNumber} with clarification.`);
    setClarificationLoan(null);
    setClarificationText('');
  };

  // ==========================================================================
  // STEP 4 & 5: FINANCE APPROVAL, DISBURSEMENT & EMI SCHEDULE ACTIVATION
  // ==========================================================================
  const handleConfirmFinanceDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeDisburseModalLoan) return;

    // Rule: Prevent duplicate disbursement transactions
    if (
      financeDisburseModalLoan.financeDisbursement.disbursed ||
      financeDisburseModalLoan.status === 'Active - Disbursed'
    ) {
      setStatusBanner(
        `Duplicate Disbursement Blocked: ${financeDisburseModalLoan.loanNumber} has already been disbursed (Ref: ${financeDisburseModalLoan.financeDisbursement.transactionReference}).`
      );
      setFinanceDisburseModalLoan(null);
      return;
    }

    // Rule: Prevent disbursement until all mandatory approvals (HR Verification + Manager Approval) are complete
    if (
      !financeDisburseModalLoan.hrVerification.verified ||
      financeDisburseModalLoan.managerApproval.status !== 'Approved'
    ) {
      setStatusBanner(
        `Disbursement Blocked: Mandatory HR Verification and Manager/HR Approval must be completed before Finance Disbursement.`
      );
      return;
    }

    if (!financeDisburseForm.transactionReference.trim()) {
      setStatusBanner('Please enter a valid payment transaction reference (UTR / Cheque No).');
      return;
    }

    // Prevent duplicate transaction reference across loans
    const refTrimmed = financeDisburseForm.transactionReference.trim();
    const duplicateRefLoan = allLoans.find(
      (l) =>
        l.id !== financeDisburseModalLoan.id &&
        l.financeDisbursement.transactionReference?.toLowerCase() === refTrimmed.toLowerCase()
    );
    if (duplicateRefLoan) {
      setStatusBanner(
        `Duplicate Transaction Reference Blocked: Reference "${refTrimmed}" is already used on loan ${duplicateRefLoan.loanNumber}.`
      );
      return;
    }

    const nowStr = nowTimestamp();
    const disbAmt = Math.max(
      1,
      Math.round(
        Number(financeDisburseForm.disbursedAmount) ||
          financeDisburseModalLoan.approvedAmount
      )
    );

    const finalSchedule = generateLoanAmortizationSchedule({
      principal: disbAmt,
      interestRateAnnual: financeDisburseModalLoan.interestRateAnnual,
      tenureMonths: financeDisburseModalLoan.tenureMonths,
      calculationMethod: financeDisburseModalLoan.calculationMethod,
      emiStartMonth: financeDisburseModalLoan.emiStartMonth,
    });

    const empMaster = employeeSalaryMasters[financeDisburseModalLoan.employeeId];

    const disbursementLedgerEntry: LoanLedgerEntry = {
      id: `LDG-DISB-${Date.now()}`,
      date: financeDisburseForm.disbursementDate,
      monthKey: financeDisburseForm.disbursementDate.slice(0, 7),
      transactionType: 'Disbursement',
      reference: refTrimmed,
      debit: finalSchedule.totalPayableAmount,
      credit: 0,
      balanceAfter: finalSchedule.totalPayableAmount,
      remarks: `Loan disbursed via ${financeDisburseForm.paymentMode} (Principal: ${formatCurrency(
        disbAmt
      )}, Total Interest: ${formatCurrency(finalSchedule.totalInterestPayable)})`,
      recordedBy: `${currentUser.name} (${currentUser.role})`,
    };

    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== financeDisburseModalLoan.id) return ln;
      return {
        ...ln,
        approvedAmount: disbAmt,
        disbursedAmount: disbAmt,
        monthlyEmi: finalSchedule.monthlyEmi,
        totalInterestPayable: finalSchedule.totalInterestPayable,
        totalPayableAmount: finalSchedule.totalPayableAmount,
        totalRecovered: 0,
        outstandingBalance: finalSchedule.totalPayableAmount,
        status: 'Active - Disbursed' as LoanWorkflowStatus,
        emiSchedule: finalSchedule.schedule,
        ledger: [disbursementLedgerEntry, ...ln.ledger],
        financeDisbursement: {
          disbursed: true,
          authorizedBy: `${currentUser.name} (${currentUser.role})`,
          disbursementDate: financeDisburseForm.disbursementDate,
          paymentMode: financeDisburseForm.paymentMode,
          transactionReference: refTrimmed,
          disbursedAmount: disbAmt,
          bankName: empMaster?.bankName || ln.financeDisbursement.bankName || 'HDFC Bank Ltd',
          bankAccountNo:
            empMaster?.bankAccountNo || ln.financeDisbursement.bankAccountNo || '—',
          remarks: financeDisburseForm.remarks,
        },
        auditTrail: [
          {
            id: `AUD-${Date.now()}-5`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '5. EMI Schedule & Payroll Integration Activated',
            action: `Generated ${ln.tenureMonths}-Month EMI Schedule`,
            remarks: `Monthly EMI ${formatCurrency(
              finalSchedule.monthlyEmi
            )} scheduled starting ${ln.emiStartMonth} for automatic monthly payroll deduction.`,
          },
          {
            id: `AUD-${Date.now()}-4`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '4. Finance Approval & Disbursement',
            action: `Disbursed ${formatCurrency(disbAmt)} (${financeDisburseForm.paymentMode})`,
            remarks: `Ref: ${refTrimmed} · Date: ${financeDisburseForm.disbursementDate} · ${financeDisburseForm.remarks}`,
          },
          ...ln.auditTrail,
        ],
      };
    });

    updateAndSaveLoans(nextLoans);
    setSelectedLoanId(financeDisburseModalLoan.id);
    setStatusBanner(
      `Steps 4, 5 & 6 Complete: Disbursed ${formatCurrency(disbAmt)} for ${
        financeDisburseModalLoan.loanNumber
      } (Ref: ${refTrimmed}). EMI Schedule (${formatCurrency(
        finalSchedule.monthlyEmi
      )}/mo starting ${financeDisburseModalLoan.emiStartMonth}) is now active in Payroll!`
    );
    setFinanceDisburseModalLoan(null);
  };

  // ==========================================================================
  // STEP 7: RECONCILE MONTHLY PAYROLL LOAN DEDUCTIONS
  // ==========================================================================
  const handleRunMonthlyLoanReconciliation = () => {
    const res = reconcileMonthlyLoanDeductions({
      monthKey: selectedMonthKey,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      employeeMasters: employeeSalaryMasters,
      policy: adminPolicyMaster,
    });
    setAllLoans(res.updatedLoans);

    const { label } = formatMonthKeyLabel(selectedMonthKey);
    if (res.reconciledCount === 0 && res.skippedAlreadyReconciled > 0) {
      setStatusBanner(
        `Idempotent Check Passed (${label}): All ${res.skippedAlreadyReconciled} due EMI instalment(s) for ${label} were already reconciled. Duplicate deduction prevented.`
      );
    } else if (res.reconciledCount === 0) {
      setStatusBanner(
        `No un-reconciled active loan instalments due for ${label} (${selectedMonthKey}).`
      );
    } else {
      setStatusBanner(
        `Step 7 Reconciliation Complete (${label}): Reconciled ${
          res.reconciledCount
        } loan instalment(s), recovered ${formatCurrency(res.totalRecoveredThisRun)}${
          res.shortfallCount > 0 ? `, applied shortfall policy on ${res.shortfallCount} loan(s)` : ''
        }${
          res.closedLoansCount > 0
            ? `, and auto-closed ${res.closedLoansCount} fully recovered loan(s)!`
            : '.'
        }`
      );
    }
  };

  // Toggle Hold / Defer or Resume on a specific scheduled EMI instalment
  const handleToggleHoldInstalment = (loan: EmployeeLoanRecord, instalmentNo: number) => {
    const nowStr = nowTimestamp();
    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== loan.id) return ln;
      const targetInst = ln.emiSchedule.find((i) => i.instalmentNo === instalmentNo);
      if (!targetInst || targetInst.status === 'Recovered via Payroll') return ln;

      const nextStatus: typeof targetInst.status =
        targetInst.status === 'Deferred / On Hold' ? 'Scheduled' : 'Deferred / On Hold';

      return {
        ...ln,
        emiSchedule: ln.emiSchedule.map((i) =>
          i.instalmentNo === instalmentNo
            ? {
                ...i,
                status: nextStatus,
                remarks:
                  nextStatus === 'Deferred / On Hold'
                    ? `Placed on hold by ${currentUser.name} on ${nowStr}`
                    : `Resumed for payroll deduction by ${currentUser.name}`,
              }
            : i
        ),
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '6. Payroll EMI Schedule Control',
            action:
              nextStatus === 'Deferred / On Hold'
                ? `Placed EMI #${instalmentNo} (${targetInst.dueMonthKey}) On Hold`
                : `Resumed EMI #${instalmentNo} (${targetInst.dueMonthKey})`,
            remarks: `Instalment #${instalmentNo} status changed to "${nextStatus}".`,
          },
          ...ln.auditTrail,
        ],
      };
    });
    updateAndSaveLoans(nextLoans);
    setStatusBanner(`Updated EMI #${instalmentNo} status on ${loan.loanNumber}.`);
  };

  // ==========================================================================
  // STEP 8: LOAN CLOSURE (EARLY PRECLOSURE OR EMPLOYEE EXIT FnF SETTLEMENT)
  // ==========================================================================
  const handleConfirmLoanClosure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureModalLoan) return;

    const nowStr = nowTimestamp();
    const todayIso = closureForm.closureDate || new Date().toISOString().split('T')[0];
    const remainingBalance = closureModalLoan.outstandingBalance;
    const waiver = Math.max(
      0,
      Math.min(remainingBalance, Math.round(Number(closureForm.interestWaivedOrAdjusted) || 0))
    );
    const netSettlementAmt = Math.max(0, remainingBalance - waiver);

    const isExitFnf =
      closureForm.closureType === 'Employee Exit / Resignation FnF Settlement';
    const finalSal = Math.max(0, Math.round(Number(closureForm.finalSalaryPayableBeforeLoan) || 0));
    const leaveEnc = Math.max(0, Math.round(Number(closureForm.leaveEncashmentAmount) || 0));
    const gratOffset = Math.max(0, Math.round(Number(closureForm.gratuityOrBonusOffset) || 0));
    const totalTerminalDues = finalSal + leaveEnc + gratOffset;
    const netFnfPayableOrRecoverable = totalTerminalDues - netSettlementAmt;

    const nextStatus: LoanWorkflowStatus = isExitFnf
      ? 'Closed - Exit FnF Settlement'
      : 'Closed - Early Preclosure';

    const nextLoans = allLoans.map((ln) => {
      if (ln.id !== closureModalLoan.id) return ln;

      const updatedSchedule = ln.emiSchedule.map((inst) =>
        inst.status === 'Scheduled' || inst.status === 'Deferred / On Hold'
          ? {
              ...inst,
              status: 'Settled via Preclosure / Exit FnF' as const,
              remarks: `Settled via ${closureForm.closureType} (${closureForm.settlementReference})`,
            }
          : inst
      );

      const nextLedger: LoanLedgerEntry[] = [
        ...ln.ledger,
        ...(waiver > 0
          ? [
              {
                id: `LDG-WV-${Date.now()}`,
                date: todayIso,
                transactionType: 'Admin Adjustment / Reversal' as const,
                reference: `${closureForm.settlementReference}-WAIVER`,
                debit: 0,
                credit: waiver,
                balanceAfter: netSettlementAmt,
                remarks: `Interest / Rebate adjustment on closure`,
                recordedBy: `${currentUser.name} (${currentUser.role})`,
              },
            ]
          : []),
        {
          id: `LDG-CLS-${Date.now()}`,
          date: todayIso,
          transactionType: isExitFnf
            ? ('Exit FnF Settlement' as const)
            : ('Early Repayment / Preclosure' as const),
          reference: closureForm.settlementReference,
          debit: 0,
          credit: netSettlementAmt,
          balanceAfter: 0,
          remarks: isExitFnf
            ? `Exit FnF Settlement (${closureForm.settlementMode}) · Terminal Dues ${formatCurrency(
                totalTerminalDues
              )} vs Loan ${formatCurrency(netSettlementAmt)} -> Net ${
                netFnfPayableOrRecoverable >= 0
                  ? `Payable to Emp: ${formatCurrency(netFnfPayableOrRecoverable)}`
                  : `Recoverable from Emp: ${formatCurrency(Math.abs(netFnfPayableOrRecoverable))}`
              }`
            : `Early Preclosure via ${closureForm.settlementMode} (${closureForm.settlementReference})`,
          recordedBy: `${currentUser.name} (${currentUser.role})`,
        },
      ];

      return {
        ...ln,
        status: nextStatus,
        emiSchedule: updatedSchedule,
        ledger: nextLedger,
        totalRecovered: ln.totalRecovered + netSettlementAmt,
        totalAdjustments: (ln.totalAdjustments || 0) + waiver,
        outstandingBalance: 0,
        closure: {
          closureType: closureForm.closureType,
          closureDate: todayIso,
          settlementMode: closureForm.settlementMode,
          settlementReference: closureForm.settlementReference,
          remainingPrincipalSettled: remainingBalance,
          interestWaivedOrAdjusted: waiver,
          finalSettlementAmount: netSettlementAmt,
          exitLastWorkingDay: isExitFnf ? closureForm.exitLastWorkingDay : undefined,
          finalSalaryPayableBeforeLoan: isExitFnf ? finalSal : undefined,
          leaveEncashmentAmount: isExitFnf ? leaveEnc : undefined,
          gratuityOrBonusOffset: isExitFnf ? gratOffset : undefined,
          netFnfPayableOrRecoverable: isExitFnf ? netFnfPayableOrRecoverable : undefined,
          approvedBy: `${currentUser.name} (${currentUser.role})`,
          remarks: closureForm.remarks,
        },
        auditTrail: [
          {
            id: `AUD-CLS-${Date.now()}`,
            timestamp: nowStr,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            stage: '8. Loan Closure & Final Settlement',
            action: `${closureForm.closureType} Approved & Loan Closed`,
            remarks: `Settled ${formatCurrency(netSettlementAmt)} (Waiver: ${formatCurrency(
              waiver
            )}) via ${closureForm.settlementMode} (Ref: ${
              closureForm.settlementReference
            }). Outstanding Balance: ₹0.`,
          },
          ...ln.auditTrail,
        ],
      };
    });

    updateAndSaveLoans(nextLoans);
    setStatusBanner(
      `Step 8 Complete: ${closureModalLoan.loanNumber} closed via ${
        closureForm.closureType
      } (${formatCurrency(netSettlementAmt)} settled, Balance ₹0).`
    );
    setClosureModalLoan(null);
  };

  // ==========================================================================
  // REJECT OR DELETE LOAN REQUEST (BOTH EMPLOYEE & ADMIN SIDES)
  // ==========================================================================
  const openRejectLoanModal = (loan: EmployeeLoanRecord) => {
    setRejectModalLoan(loan);
    setRejectRemarks(
      isAdminUser
        ? 'Loan application rejected by Admin / HR Management.'
        : 'Loan request rejected / withdrawn by Employee.'
    );
  };

  const handleConfirmRejectLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalLoan) return;
    const nextLoans = rejectEmployeeLoan({
      loanId: rejectModalLoan.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      isAdminUser,
      remarks: rejectRemarks,
    });
    setAllLoans(nextLoans);
    setStatusBanner(
      `Loan request ${rejectModalLoan.loanNumber} (${rejectModalLoan.employeeName}) marked as Rejected by ${
        isAdminUser ? 'Admin' : 'Employee'
      }.`
    );
    setRejectModalLoan(null);
    setRejectRemarks('');
  };

  const openDeleteLoanModal = (loan: EmployeeLoanRecord) => {
    setDeleteModalLoan(loan);
  };

  const handleConfirmDeleteLoan = () => {
    if (!deleteModalLoan) return;
    const deletedNum = deleteModalLoan.loanNumber;
    const deletedEmp = deleteModalLoan.employeeName;
    const deletedId = deleteModalLoan.id;
    const nextLoans = deleteEmployeeLoan(deletedId);
    setAllLoans(nextLoans);
    if (selectedLoanId === deletedId) {
      setSelectedLoanId(nextLoans[0]?.id || '');
    }
    setStatusBanner(
      `Deleted loan request ${deletedNum} (${deletedEmp}) permanently from Payroll & Backend.`
    );
    setDeleteModalLoan(null);
  };

  // Export Loan Reports to CSV
  const handleExportLoansCsv = () => {
    const rows = [
      [
        'LoanNumber',
        'EmpCode',
        'EmployeeName',
        'Department',
        'LoanType',
        'ApplicationDate',
        'RequestedAmountINR',
        'ApprovedAmountINR',
        'InterestRatePct',
        'CalculationMethod',
        'TenureMonths',
        'EmiStartMonth',
        'MonthlyEmiINR',
        'TotalPayableINR',
        'DisbursedAmountINR',
        'TotalRecoveredINR',
        'OutstandingBalanceINR',
        'WorkflowStatus',
        'DisbursementRef',
      ].join(','),
      ...visibleLoans.map((l) =>
        [
          l.loanNumber,
          l.empCode,
          `"${l.employeeName}"`,
          `"${l.department}"`,
          `"${l.loanType}"`,
          l.applicationDate,
          l.requestedAmount,
          l.approvedAmount,
          l.interestRateAnnual,
          l.calculationMethod,
          l.tenureMonths,
          l.emiStartMonth,
          l.monthlyEmi,
          l.totalPayableAmount,
          l.disbursedAmount,
          l.totalRecovered,
          l.outstandingBalance,
          `"${l.status}"`,
          `"${l.financeDisbursement.transactionReference || '—'}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Employee_Loans_Report_${selectedMonthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(`Exported Employee Loan & Advance Register CSV (${visibleLoans.length} records).`);
  };

  const renderStatusText = (status: LoanWorkflowStatus) => {
    if (status === 'Active - Disbursed') {
      return <span className="font-bold text-emerald-700">{status}</span>;
    }
    if (status.startsWith('Closed')) {
      return <span className="font-bold text-slate-700">{status}</span>;
    }
    if (status === 'Rejected' || status === 'Cancelled') {
      return <span className="font-bold text-rose-700">{status}</span>;
    }
    if (status === 'Returned for Clarification') {
      return <span className="font-bold text-amber-700">{status}</span>;
    }
    return <span className="font-bold text-[#1f7e9e]">{status}</span>;
  };

  return (
    <div className="sh-scope space-y-4 text-xs">
      {/* 8-STEP WORKFLOW ARCHITECTURE HEADER */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                Employee Loan &amp; Salary Advance Management
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300 font-medium">
                End-to-End 8-Stage Approval, Disbursement, EMI Payroll Deduction &amp; Exit FnF Engine
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5 truncate">
              Covers Loan Request → HR Verification → Manager/HR Approval → Finance Disbursement → EMI Schedule → Payroll Deduction → Reconciliation → Closure &amp; Exit Settlement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdminUser && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setEmployeeScopeFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition ${
                    employeeScopeFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  All Employees ({allLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeScopeFilter('SELECTED')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition ${
                    employeeScopeFilter === 'SELECTED'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Selected: {activeEmployee?.name || 'None'}
                </button>
              </div>
            )}

            {isAdminUser && (
              <button
                type="button"
                onClick={handleRunMonthlyLoanReconciliation}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Reconcile due loan EMIs for the selected payroll month and update Loan Ledgers (Idempotent)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reconcile {selectedMonthKey} Payroll EMIs</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportLoansCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 8-Step Pipeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 border-t border-slate-800">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.step}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-2 min-w-0"
            >
              <div className="text-[10px] font-mono font-bold text-amber-400">
                0{s.step}. {s.title}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Active Disbursed Loans</span>
            <Landmark className="w-4 h-4 text-[#1f7e9e] shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {loanKpis.activeCount} Active
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Requests: {loanKpis.totalCount}</span>
            <span className="text-amber-700 font-semibold">{loanKpis.pendingCount} Pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Total Sanctioned &amp; Disbursed</span>
            <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums">
            {formatCurrency(loanKpis.totalDisbursed)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Principal disbursed via Finance
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Recovered via Payroll</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1.5 font-mono tabular-nums">
            {formatCurrency(loanKpis.totalRecovered)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Reconciled EMI &amp; settlements
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>Outstanding Loan Balance</span>
            <TrendingUp className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1.5 font-mono tabular-nums">
            {formatCurrency(loanKpis.totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Remaining balance to recover
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>{selectedMonthKey} Payroll EMI Due</span>
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-xl font-bold text-[#1f7e9e] mt-1.5 font-mono tabular-nums">
            {formatCurrency(loanKpis.dueThisMonth)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Auto-synced to {selectedMonthKey} Payslip
          </div>
        </div>
      </div>

      {/* MODULE SUB-NAVIGATION BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            {
              id: 'applications',
              label: '1. Loan Request & My Loans',
              icon: FileText,
            },
            ...(isAdminUser
              ? [
                  {
                    id: 'workflow_desk',
                    label: `2. HR / Manager / Finance Approval & Disbursement (${loanKpis.pendingCount})`,
                    icon: UserCheck,
                  },
                ]
              : []),
            {
              id: 'emi_ledger',
              label: '3. EMI Schedule, Loan Ledger & Exit FnF Closure',
              icon: Calculator,
            },
            {
              id: 'reports',
              label: '4. Loan Reports & Audit Trail',
              icon: History,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as typeof subTab)}
                className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search loan no, employee, type..."
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 w-52 focus:outline-none focus:border-[#1f7e9e]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active - Disbursed</option>
            <option value="PENDING">Pending Approvals</option>
            <option value="CLOSED">Closed / Settled</option>
            <option value="REJECTED">Rejected / Cancelled</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: EMPLOYEE LOAN APPLICATION & ACTIVE/PENDING LOANS
          ===================================================================== */}
      {subTab === 'applications' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left 5 Cols: Step 1 Loan & Salary Advance Request Form */}
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  01. Submit Employee Loan / Salary Advance Request
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Apply for employee loan or interest-free salary advance with live EMI preview
                </p>
              </div>
              <Calculator className="w-4 h-4 text-[#1f7e9e] shrink-0" />
            </div>

            <form onSubmit={handleCreateLoanApplication} className="space-y-3">
              {isAdminUser ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Applicant Employee (Employee / HR Initiation) *
                  </label>
                  <select
                    value={applicantMaster?.userId || ''}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, applicantUserId: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {enrolledEmployeesList.length === 0 ? (
                      <option value="">No Employees Enrolled in Payroll</option>
                    ) : (
                      enrolledEmployeesList.map((emp) => (
                        <option key={emp.userId} value={emp.userId}>
                          {emp.name} ({emp.empCode}) — Gross {formatCurrency(emp.monthlyGross)}/mo
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">
                      Applicant Employee
                    </div>
                    <div className="font-bold text-slate-900">
                      {activeEmployee?.name} ({activeUserMaster?.empCode})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">
                      Monthly Gross
                    </div>
                    <div className="font-mono font-bold text-emerald-700">
                      {formatCurrency(activeUserMaster?.monthlyGross || 0)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Loan / Advance Type *
                  </label>
                  <select
                    value={loanForm.loanType}
                    onChange={(e) => {
                      const nextType = e.target.value as LoanType;
                      const isAdv = nextType === 'Salary Advance';
                      setLoanForm({
                        ...loanForm,
                        loanType: nextType,
                        interestRateAnnual: isAdv
                          ? '0'
                          : String(adminPolicyMaster.loanDefaultInterestRate ?? 8.5),
                        calculationMethod: isAdv ? 'interest_free' : 'reducing_balance',
                        tenureMonths: isAdv ? '3' : loanForm.tenureMonths,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900"
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Requested Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={loanForm.requestedAmount}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, requestedAmount: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={loanForm.tenureMonths}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, tenureMonths: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Interest Calculation
                  </label>
                  <select
                    value={
                      loanForm.loanType === 'Salary Advance'
                        ? 'interest_free'
                        : loanForm.calculationMethod
                    }
                    disabled={loanForm.loanType === 'Salary Advance'}
                    onChange={(e) => {
                      const m = e.target.value as LoanCalculationMethod;
                      setLoanForm({
                        ...loanForm,
                        calculationMethod: m,
                        interestRateAnnual: m === 'interest_free' ? '0' : loanForm.interestRateAnnual,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                  >
                    <option value="reducing_balance">Reducing Balance</option>
                    <option value="flat_rate">Flat Rate</option>
                    <option value="interest_free">Interest-Free (0%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Interest (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    max={24}
                    disabled={
                      loanForm.loanType === 'Salary Advance' ||
                      loanForm.calculationMethod === 'interest_free'
                    }
                    value={
                      loanForm.loanType === 'Salary Advance' ||
                      loanForm.calculationMethod === 'interest_free'
                        ? 0
                        : loanForm.interestRateAnnual
                    }
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, interestRateAnnual: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    EMI Deduction Start Month *
                  </label>
                  <select
                    value={loanForm.emiStartMonth}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, emiStartMonth: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold"
                  >
                    {PAYSLIP_MONTHS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.key})
                      </option>
                    ))}
                    <option value="2026-10">October 2026 (2026-10)</option>
                    <option value="2026-11">November 2026 (2026-11)</option>
                    <option value="2026-12">December 2026 (2026-12)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Supporting Document Ref
                  </label>
                  <input
                    type="text"
                    value={loanForm.supportingDocumentRef}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, supportingDocumentRef: e.target.value })
                    }
                    placeholder="e.g. Medical Estimate / Quotation No."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason / Purpose of Loan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  placeholder="Describe the purpose for the loan or salary advance request..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              {/* Live EMI & Eligibility Preview Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-bold text-slate-800 text-[11px]">
                    Live EMI &amp; Eligibility Check
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      liveLoanPreview.isWithinEligibility
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {liveLoanPreview.isWithinEligibility
                      ? '✓ Within Eligibility Limit'
                      : 'Requires Special HR/Manager Approval'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Estimated EMI / Mo</span>
                    <strong className="font-mono text-sm text-[#1f7e9e]">
                      {formatCurrency(liveLoanPreview.monthlyEmi)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Interest</span>
                    <strong className="font-mono text-sm text-slate-800">
                      {formatCurrency(liveLoanPreview.totalInterestPayable)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Repayable</span>
                    <strong className="font-mono text-sm text-emerald-700">
                      {formatCurrency(liveLoanPreview.totalPayableAmount)}
                    </strong>
                  </div>
                </div>
                <div className="text-[10.5px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>
                    Max Eligibility ({adminPolicyMaster.loanMaxEligibilityMultiple ?? 3}x Gross):{' '}
                    <strong className="font-mono text-slate-700">
                      {formatCurrency(liveLoanPreview.maxEligible)}
                    </strong>
                  </span>
                  <span>
                    Existing Active Loans:{' '}
                    <strong className="font-mono text-rose-700">
                      {liveLoanPreview.existingActiveCount} (
                      {formatCurrency(liveLoanPreview.existingOutstanding)})
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!applicantMaster}
                className="w-full py-2.5 px-4 bg-[#1f7e9e] hover:bg-[#17647e] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Loan Application for HR Verification</span>
              </button>
            </form>
          </div>

          {/* Right 7 Cols: Active Loans, Pending Requests & 8-Stage Tracker */}
          <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Employee Loan Applications &amp; Active Loans ({visibleLoans.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click any loan to inspect its EMI Amortization Schedule, Loan Ledger, or Approval Audit Trail
                </p>
              </div>
            </div>

            {visibleLoans.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Landmark className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-800 text-sm">
                  No Loan or Salary Advance Records Found
                </div>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Submit a new loan or salary advance request on the left to initiate the 8-step verification, approval, disbursement, and payroll EMI deduction workflow.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-[640px] overflow-y-auto">
                {visibleLoans.map((loan) => {
                  const stepNum = getLoanWorkflowStepNumber(loan.status);
                  const isSelected = inspectedLoan?.id === loan.id;
                  const recoveredInstallments = loan.emiSchedule.filter(
                    (i) => i.status === 'Recovered via Payroll'
                  ).length;

                  return (
                    <div
                      key={loan.id}
                      onClick={() => setSelectedLoanId(loan.id)}
                      className={`p-4 transition cursor-pointer ${
                        isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#1f7e9e]">
                            {loan.loanNumber}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="font-bold text-slate-900">{loan.loanType}</span>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="font-semibold text-slate-700">
                            {loan.employeeName} ({loan.empCode})
                          </span>
                        </div>
                        <div className="text-xs">{renderStatusText(loan.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3 p-2.5 rounded-lg bg-white border border-slate-200/90">
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Sanctioned / Requested
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(loan.approvedAmount || loan.requestedAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Monthly EMI ({loan.tenureMonths}m)
                          </span>
                          <span className="font-mono font-bold text-[#1f7e9e]">
                            {formatCurrency(loan.monthlyEmi)}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Interest &amp; Method
                          </span>
                          <span className="font-mono font-semibold text-slate-700">
                            {loan.interestRateAnnual}% ({loan.calculationMethod.replace('_', ' ')})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Recovered ({recoveredInstallments}/{loan.tenureMonths})
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            {formatCurrency(loan.totalRecovered)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Outstanding Balance
                          </span>
                          <span className="font-mono font-bold text-rose-700">
                            {formatCurrency(loan.outstandingBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                        <div className="truncate">
                          <span className="text-slate-400">Purpose:</span> {loan.purpose} ·{' '}
                          <span className="text-slate-400">EMI Start:</span>{' '}
                          <strong className="font-mono">{loan.emiStartMonth}</strong>
                        </div>

                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          {/* Action buttons based on workflow stage */}
                          {loan.status === 'Returned for Clarification' && (
                            <button
                              type="button"
                              onClick={() => {
                                setClarificationLoan(loan);
                                setClarificationRequestedAmount(loan.requestedAmount);
                                setClarificationText('');
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                            >
                              Respond &amp; Resubmit
                            </button>
                          )}

                          {isAdminUser &&
                            loan.status === 'Submitted - Pending HR Verification' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHrVerifyModalLoan(loan);
                                  setHrVerifyForm({
                                    employeeStatusCheck: 'Active',
                                    eligibilityPassed: loan.hrVerification.eligibilityPassed,
                                    remarks:
                                      'Verified employee active status, salary structure, and loan eligibility.',
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-[11px] cursor-pointer"
                              >
                                Step 2: HR Verify →
                              </button>
                            )}

                          {isAdminUser &&
                            loan.status === 'HR Verified - Pending Manager/HR Approval' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setManagerApproveModalLoan(loan);
                                  setManagerApproveForm({
                                    action: 'Approved',
                                    approvedAmount: loan.approvedAmount || loan.requestedAmount,
                                    interestRateAnnual: loan.interestRateAnnual,
                                    calculationMethod: loan.calculationMethod,
                                    tenureMonths: loan.tenureMonths,
                                    emiStartMonth: loan.emiStartMonth,
                                    remarks: 'Approved after HR eligibility verification.',
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Step 3: Manager Approve →
                              </button>
                            )}

                          {isAdminUser &&
                            loan.status === 'Approved - Pending Finance Disbursement' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFinanceDisburseModalLoan(loan);
                                  setFinanceDisburseForm({
                                    disbursementDate: new Date().toISOString().split('T')[0],
                                    paymentMode: 'NEFT / Bank Transfer',
                                    transactionReference: `UTR${Date.now().toString().slice(-8)}`,
                                    disbursedAmount: loan.approvedAmount,
                                    remarks:
                                      'Disbursed via corporate bank transfer to employee salary account.',
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Step 4: Disburse Loan →
                              </button>
                            )}

                          {isAdminUser && loan.status === 'Active - Disbursed' && (
                            <button
                              type="button"
                              onClick={() => {
                                const empMaster = employeeSalaryMasters[loan.employeeId];
                                setClosureModalLoan(loan);
                                setClosureForm({
                                  closureType: 'Early Lump-Sum Preclosure',
                                  closureDate: new Date().toISOString().split('T')[0],
                                  settlementMode: 'Bank Transfer / NEFT',
                                  settlementReference: `SET-${Date.now().toString().slice(-6)}`,
                                  interestWaivedOrAdjusted: 0,
                                  exitLastWorkingDay: new Date().toISOString().split('T')[0],
                                  finalSalaryPayableBeforeLoan: empMaster?.monthlyGross || 65000,
                                  leaveEncashmentAmount: Math.round(
                                    ((empMaster?.monthlyGross || 60000) / 30) *
                                      (empMaster?.plQuota || 12)
                                  ),
                                  gratuityOrBonusOffset: 0,
                                  remarks: 'Full & final settlement of remaining loan balance.',
                                });
                              }}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] cursor-pointer"
                            >
                              Preclose / Exit FnF
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLoanId(loan.id);
                              setSubTab('emi_ledger');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] cursor-pointer"
                          >
                            EMI &amp; Ledger
                          </button>

                          {loan.status !== 'Rejected' && !loan.status.startsWith('Closed') && (
                            <button
                              type="button"
                              onClick={() => openRejectLoanModal(loan)}
                              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                              title={
                                isAdminUser
                                  ? 'Reject this loan request (Admin)'
                                  : 'Reject / withdraw this loan request (Employee)'
                              }
                            >
                              <Ban className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDeleteLoanModal(loan)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                            title={
                              isAdminUser
                                ? 'Delete this loan request permanently (Admin)'
                                : 'Delete this loan request permanently (Employee)'
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* 8-Step Visual Progress Bar */}
                      {stepNum > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1">
                          {WORKFLOW_STEPS.map((st) => {
                            const done = stepNum >= st.step;
                            return (
                              <div key={st.step} className="flex-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    done ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}
                                  title={`Step ${st.step}: ${st.title}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: ADMIN / HR / FINANCE APPROVAL, DISBURSEMENT & SHORTFALL POLICY DESK
          ===================================================================== */}
      {subTab === 'workflow_desk' && isAdminUser && (
        <div className="space-y-4">
          {/* Configurable Payroll Shortfall & Eligibility Policy Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Payroll Loan Deduction &amp; Insufficient Salary Shortfall Policy
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure how the monthly payroll engine handles insufficient net salary when deducting loan EMIs
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-700">
                Idempotent Payroll Deduction Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Insufficient Salary Shortfall Policy
                </label>
                <select
                  value={adminPolicyMaster.loanShortfallPolicy || 'cap_at_max_takehome_pct'}
                  onChange={(e) => {
                    const updated: AdminPolicyMaster = {
                      ...adminPolicyMaster,
                      loanShortfallPolicy: e.target.value as LoanShortfallPolicy,
                    };
                    setAdminPolicyMaster(updated);
                    saveAdminPolicyMaster(updated, true);
                    setStatusBanner(
                      `Updated Payroll Loan Shortfall Policy to "${e.target.value}".`
                    );
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="cap_at_max_takehome_pct">
                    Cap Total Loan EMI at Max % of Net Salary &amp; Carry Forward Shortfall
                  </option>
                  <option value="partial_deduct_carry_forward">
                    Deduct Up to Available Net Salary &amp; Carry Forward Remainder
                  </option>
                  <option value="defer_full_emi_to_next_month">
                    Defer Full EMI to Next Month if EMI Exceeds Max % Cap
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Max EMI Cap (% of Net Pay)
                </label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={adminPolicyMaster.loanMaxDeductionPctOfNet ?? 50}
                  onChange={(e) => {
                    const updated: AdminPolicyMaster = {
                      ...adminPolicyMaster,
                      loanMaxDeductionPctOfNet: Math.max(
                        10,
                        Math.min(90, Number(e.target.value) || 50)
                      ),
                    };
                    setAdminPolicyMaster(updated);
                    saveAdminPolicyMaster(updated, true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Eligibility Limit (× Monthly Gross)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={adminPolicyMaster.loanMaxEligibilityMultiple ?? 3}
                  onChange={(e) => {
                    const updated: AdminPolicyMaster = {
                      ...adminPolicyMaster,
                      loanMaxEligibilityMultiple: Math.max(1, Number(e.target.value) || 3),
                    };
                    setAdminPolicyMaster(updated);
                    saveAdminPolicyMaster(updated, true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3-Column Approval & Disbursement Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage 2 Queue: HR Verification */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-slate-900">
                  Step 2: HR Verification Queue
                </div>
                <span className="font-mono font-bold text-[#1f7e9e]">
                  {
                    allLoans.filter(
                      (l) => l.status === 'Submitted - Pending HR Verification'
                    ).length
                  }
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {allLoans
                  .filter((l) => l.status === 'Submitted - Pending HR Verification')
                  .map((loan) => (
                    <div key={loan.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1f7e9e]">
                          {loan.loanNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(loan.requestedAmount)}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold">
                        {loan.employeeName} ({loan.empCode}) · {loan.loanType}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Gross: {formatCurrency(loan.monthlyGrossAtApplication)} · Max Eligible:{' '}
                        {formatCurrency(loan.hrVerification.maxEligibleAmount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHrVerifyModalLoan(loan);
                          setHrVerifyForm({
                            employeeStatusCheck: 'Active',
                            eligibilityPassed: loan.hrVerification.eligibilityPassed,
                            remarks:
                              'HR verified active employee status, salary, and existing loan exposure.',
                          });
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs cursor-pointer"
                      >
                        Verify Eligibility &amp; Forward to Approval
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRejectLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {allLoans.filter((l) => l.status === 'Submitted - Pending HR Verification')
                  .length === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    No applications awaiting HR Verification
                  </div>
                )}
              </div>
            </div>

            {/* Stage 3 Queue: Manager / HR Approval */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-slate-900">
                  Step 3: Manager / HR Approval
                </div>
                <span className="font-mono font-bold text-indigo-600">
                  {
                    allLoans.filter(
                      (l) => l.status === 'HR Verified - Pending Manager/HR Approval'
                    ).length
                  }
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {allLoans
                  .filter((l) => l.status === 'HR Verified - Pending Manager/HR Approval')
                  .map((loan) => (
                    <div key={loan.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-600">
                          {loan.loanNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(loan.requestedAmount)} ({loan.tenureMonths}m)
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold">
                        {loan.employeeName} ({loan.empCode}) · {loan.loanType}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        ✓ HR Verified by {loan.hrVerification.verifiedBy}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setManagerApproveModalLoan(loan);
                          setManagerApproveForm({
                            action: 'Approved',
                            approvedAmount: loan.approvedAmount || loan.requestedAmount,
                            interestRateAnnual: loan.interestRateAnnual,
                            calculationMethod: loan.calculationMethod,
                            tenureMonths: loan.tenureMonths,
                            emiStartMonth: loan.emiStartMonth,
                            remarks: 'Sanctioned & approved for Finance disbursement.',
                          });
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Review, Sanction / Return / Reject
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRejectLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {allLoans.filter(
                  (l) => l.status === 'HR Verified - Pending Manager/HR Approval'
                ).length === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    No applications awaiting Manager/HR Approval
                  </div>
                )}
              </div>
            </div>

            {/* Stage 4 Queue: Finance Approval & Disbursement */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-slate-900">
                  Step 4: Finance Disbursement
                </div>
                <span className="font-mono font-bold text-emerald-600">
                  {
                    allLoans.filter(
                      (l) => l.status === 'Approved - Pending Finance Disbursement'
                    ).length
                  }
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {allLoans
                  .filter((l) => l.status === 'Approved - Pending Finance Disbursement')
                  .map((loan) => (
                    <div key={loan.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-700">
                          {loan.loanNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(loan.approvedAmount)}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold">
                        {loan.employeeName} ({loan.empCode}) · EMI {formatCurrency(loan.monthlyEmi)}
                        /mo
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        ✓ Approved by {loan.managerApproval.approvedBy}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFinanceDisburseModalLoan(loan);
                          setFinanceDisburseForm({
                            disbursementDate: new Date().toISOString().split('T')[0],
                            paymentMode: 'NEFT / Bank Transfer',
                            transactionReference: `UTR${Date.now().toString().slice(-8)}`,
                            disbursedAmount: loan.approvedAmount,
                            remarks: 'Disbursed to employee registered salary bank account.',
                          });
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Authorize Payment &amp; Activate EMI Schedule
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRejectLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteLoanModal(loan)}
                          className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {allLoans.filter(
                  (l) => l.status === 'Approved - Pending Finance Disbursement'
                ).length === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    No approved loans awaiting Finance Disbursement
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: EMI SCHEDULE, LOAN LEDGER & LOAN CLOSURE / EXIT FnF
          ===================================================================== */}
      {subTab === 'emi_ledger' && (
        <div className="space-y-4">
          {/* Loan Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 flex-1">
              <span className="font-bold text-slate-700 whitespace-nowrap">
                Select Loan Account:
              </span>
              <select
                value={inspectedLoan?.id || ''}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 flex-1 max-w-xl"
              >
                {visibleLoans.length === 0 ? (
                  <option value="">No Loan Accounts Available</option>
                ) : (
                  visibleLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanNumber} — {l.employeeName} ({l.empCode}) · {l.loanType} · Bal:{' '}
                      {formatCurrency(l.outstandingBalance)} [{l.status}]
                    </option>
                  ))
                )}
              </select>
            </div>

            {inspectedLoan && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isAdminUser && inspectedLoan.status === 'Active - Disbursed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const empMaster = employeeSalaryMasters[inspectedLoan.employeeId];
                        setClosureModalLoan(inspectedLoan);
                        setClosureForm({
                          closureType: 'Early Lump-Sum Preclosure',
                          closureDate: new Date().toISOString().split('T')[0],
                          settlementMode: 'Bank Transfer / NEFT',
                          settlementReference: `PRE-${Date.now().toString().slice(-6)}`,
                          interestWaivedOrAdjusted: 0,
                          exitLastWorkingDay: new Date().toISOString().split('T')[0],
                          finalSalaryPayableBeforeLoan: empMaster?.monthlyGross || 65000,
                          leaveEncashmentAmount: Math.round(
                            ((empMaster?.monthlyGross || 60000) / 30) * (empMaster?.plQuota || 12)
                          ),
                          gratuityOrBonusOffset: 0,
                          remarks: 'Early lump-sum repayment to preclose loan.',
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs cursor-pointer"
                    >
                      Early Repayment / Preclosure
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const empMaster = employeeSalaryMasters[inspectedLoan.employeeId];
                        setClosureModalLoan(inspectedLoan);
                        setClosureForm({
                          closureType: 'Employee Exit / Resignation FnF Settlement',
                          closureDate: new Date().toISOString().split('T')[0],
                          settlementMode: 'Final Salary & Leave Encashment Offset',
                          settlementReference: `FNF-${Date.now().toString().slice(-6)}`,
                          interestWaivedOrAdjusted: 0,
                          exitLastWorkingDay: new Date().toISOString().split('T')[0],
                          finalSalaryPayableBeforeLoan: empMaster?.monthlyGross || 65000,
                          leaveEncashmentAmount: Math.round(
                            ((empMaster?.monthlyGross || 60000) / 30) * (empMaster?.plQuota || 12)
                          ),
                          gratuityOrBonusOffset: 0,
                          remarks:
                            'Employee resignation Full & Final (FnF) loan balance recovery offset.',
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Employee Exit (FnF) Settlement
                    </button>
                  </>
                )}

                {inspectedLoan.status !== 'Rejected' &&
                  !inspectedLoan.status.startsWith('Closed') && (
                    <button
                      type="button"
                      onClick={() => openRejectLoanModal(inspectedLoan)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Reject Loan</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => openDeleteLoanModal(inspectedLoan)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Loan</span>
                </button>
              </div>
            )}
          </div>

          {!inspectedLoan ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
              Select or create a loan application to view its EMI Schedule and Loan Ledger.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loan Sanction, Disbursement & Closure Summary Strip */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Loan Number &amp; Type
                  </span>
                  <span className="font-mono font-bold text-sm text-[#1f7e9e]">
                    {inspectedLoan.loanNumber}
                  </span>
                  <div className="text-[11px] font-semibold text-slate-700">
                    {inspectedLoan.loanType}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Employee
                  </span>
                  <span className="font-bold text-slate-900">
                    {inspectedLoan.employeeName}
                  </span>
                  <div className="text-[11px] font-mono text-slate-500">
                    {inspectedLoan.empCode} · {inspectedLoan.department}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Sanctioned &amp; Interest
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(inspectedLoan.approvedAmount)}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    {inspectedLoan.interestRateAnnual}% p.a. (
                    {inspectedLoan.calculationMethod.replace('_', ' ')})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Disbursement Ref
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {inspectedLoan.financeDisbursement.transactionReference || 'Pending'}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    {inspectedLoan.financeDisbursement.disbursementDate || 'Not Disbursed'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Total Repayable / Recovered
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(inspectedLoan.totalRecovered)} /{' '}
                    {formatCurrency(inspectedLoan.totalPayableAmount)}
                  </span>
                  <div className="text-[11px] text-slate-500">
                    EMI: {formatCurrency(inspectedLoan.monthlyEmi)}/mo
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Outstanding Balance
                  </span>
                  <span className="font-mono font-bold text-sm text-rose-700">
                    {formatCurrency(inspectedLoan.outstandingBalance)}
                  </span>
                  <div className="text-[11px]">{renderStatusText(inspectedLoan.status)}</div>
                </div>
              </div>

              {/* Closure / Exit FnF Certificate Banner if Closed */}
              {inspectedLoan.closure && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Loan Closed — {inspectedLoan.closure.closureType} (Ref:{' '}
                        {inspectedLoan.closure.settlementReference})
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Closed on <strong>{inspectedLoan.closure.closureDate}</strong> via{' '}
                      <strong>{inspectedLoan.closure.settlementMode}</strong> · Final Settlement:{' '}
                      <strong className="font-mono">
                        {formatCurrency(inspectedLoan.closure.finalSettlementAmount)}
                      </strong>{' '}
                      · Approved by {inspectedLoan.closure.approvedBy}.
                    </p>
                    {inspectedLoan.closure.netFnfPayableOrRecoverable !== undefined && (
                      <p className="text-xs font-mono font-bold text-slate-900">
                        Exit FnF Summary: Final Salary{' '}
                        {formatCurrency(
                          inspectedLoan.closure.finalSalaryPayableBeforeLoan || 0
                        )}{' '}
                        + Leave Encashment{' '}
                        {formatCurrency(inspectedLoan.closure.leaveEncashmentAmount || 0)} - Loan
                        Settled {formatCurrency(inspectedLoan.closure.finalSettlementAmount)} ={' '}
                        {inspectedLoan.closure.netFnfPayableOrRecoverable >= 0
                          ? `Net FnF Payable to Employee: ${formatCurrency(
                              inspectedLoan.closure.netFnfPayableOrRecoverable
                            )}`
                          : `Net Balance Recoverable from Employee: ${formatCurrency(
                              Math.abs(inspectedLoan.closure.netFnfPayableOrRecoverable)
                            )}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Monthly EMI Repayment Schedule Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      EMI Amortization &amp; Payroll Recovery Schedule ({inspectedLoan.emiSchedule.length}{' '}
                      Instalments)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Instalment breakdown of Opening Balance, Principal, Interest, Scheduled EMI, Payroll Deduction &amp; Closing Balance
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Inst #</th>
                        <th className="py-2.5 px-3">Due Month / Date</th>
                        <th className="py-2.5 px-3 text-right">Opening Bal</th>
                        <th className="py-2.5 px-3 text-right">Principal</th>
                        <th className="py-2.5 px-3 text-right">Interest</th>
                        <th className="py-2.5 px-3 text-right">Scheduled EMI</th>
                        <th className="py-2.5 px-3 text-right">Prior Shortfall</th>
                        <th className="py-2.5 px-3 text-right">Deducted in Payroll</th>
                        <th className="py-2.5 px-3 text-right">Closing Bal</th>
                        <th className="py-2.5 px-3">Status &amp; Payroll Ref</th>
                        {isAdminUser && <th className="py-2.5 px-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {inspectedLoan.emiSchedule.map((inst) => {
                        const isCurrentMonth = inst.dueMonthKey === selectedMonthKey;
                        return (
                          <tr
                            key={inst.instalmentNo}
                            className={isCurrentMonth ? 'bg-amber-50/60' : 'hover:bg-slate-50'}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              #{inst.instalmentNo}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              <span className="font-bold text-slate-800">{inst.dueMonthKey}</span>{' '}
                              <span className="text-slate-500">({inst.dueDate})</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {formatCurrency(inst.openingBalance)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                              {formatCurrency(inst.principalComponent)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                              {formatCurrency(inst.interestComponent)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#1f7e9e] tabular-nums">
                              {formatCurrency(inst.scheduledEmi)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-700">
                              {inst.shortfallAddedFromPrior > 0
                                ? `+${formatCurrency(inst.shortfallAddedFromPrior)}`
                                : '₹0'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                              {formatCurrency(inst.deductedAmount)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(inst.closingBalance)}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`font-bold ${
                                  inst.status === 'Recovered via Payroll'
                                    ? 'text-emerald-700'
                                    : inst.status === 'Partial - Shortfall Carried Forward'
                                    ? 'text-amber-700'
                                    : inst.status === 'Deferred / On Hold'
                                    ? 'text-rose-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {inst.status}
                              </span>
                              {inst.payrollRunRef && (
                                <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                                  ({inst.payrollRunRef})
                                </span>
                              )}
                            </td>
                            {isAdminUser && (
                              <td className="py-2 px-3 text-right">
                                {(inst.status === 'Scheduled' ||
                                  inst.status === 'Deferred / On Hold') &&
                                  inspectedLoan.status === 'Active - Disbursed' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleHoldInstalment(
                                          inspectedLoan,
                                          inst.instalmentNo
                                        )
                                      }
                                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                                    >
                                      {inst.status === 'Deferred / On Hold'
                                        ? 'Resume EMI'
                                        : 'Hold / Defer'}
                                    </button>
                                  )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Loan Ledger & Audit Trail Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Loan Ledger Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900">
                      Loan Ledger Statement ({inspectedLoan.ledger.length} Entries)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Disbursements, monthly payroll EMI recoveries, shortfall carry-forwards &amp; closure adjustments
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Transaction &amp; Ref</th>
                          <th className="py-2 px-3 text-right">Debit (+)</th>
                          <th className="py-2 px-3 text-right">Credit (-)</th>
                          <th className="py-2 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {inspectedLoan.ledger.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">
                              No ledger transactions posted yet (Loan not disbursed).
                            </td>
                          </tr>
                        ) : (
                          inspectedLoan.ledger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-600">{entry.date}</td>
                              <td className="py-2 px-3">
                                <div className="font-bold text-slate-900">
                                  {entry.transactionType}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {entry.reference} · {entry.remarks}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-rose-700 tabular-nums">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-700 tabular-nums">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                                {formatCurrency(entry.balanceAfter)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Loan Audit Trail */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900">
                      Complete Approval &amp; Deduction Audit Trail ({inspectedLoan.auditTrail.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Immutable chronological log of every verification, approval, disbursement &amp; recovery
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
                    {inspectedLoan.auditTrail.map((aud) => (
                      <div key={aud.id} className="p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#1f7e9e]">{aud.stage}</span>
                          <span className="font-mono text-slate-500">{aud.timestamp}</span>
                        </div>
                        <div className="font-bold text-slate-900">
                          {aud.action} —{' '}
                          <span className="font-normal text-slate-600">
                            by {aud.actorName} ({aud.actorRole})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">{aud.remarks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: CONSOLIDATED LOAN REPORTS & ANALYTICS
          ===================================================================== */}
      {subTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'active_loans', label: 'Active Loans Register' },
                { id: 'pending_approvals', label: 'Pending Approvals Queue' },
                { id: 'monthly_recoveries', label: `${selectedMonthKey} Monthly EMI Recoveries` },
                { id: 'employee_balances', label: 'Employee-Wise Outstanding Balances' },
                { id: 'audit_trail', label: 'Global Loan Audit Log' },
              ].map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setReportView(rep.id as typeof reportView)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition ${
                    reportView === rep.id
                      ? 'bg-[#1f7e9e] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportLoansCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report CSV</span>
            </button>
          </div>

          {reportView === 'active_loans' && (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Loan No</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Loan Type</th>
                    <th className="py-2.5 px-3 text-right">Disbursed</th>
                    <th className="py-2.5 px-3 text-right">Total Payable</th>
                    <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                    <th className="py-2.5 px-3 text-right">Recovered</th>
                    <th className="py-2.5 px-3 text-right">Outstanding</th>
                    <th className="py-2.5 px-3">Disbursement Ref</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleLoans
                    .filter((l) => l.status === 'Active - Disbursed')
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                          {l.loanNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {l.employeeName} ({l.empCode})
                        </td>
                        <td className="py-2.5 px-3">{l.loanType}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(l.disbursedAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(l.totalPayableAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1f7e9e] tabular-nums">
                          {formatCurrency(l.monthlyEmi)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(l.totalRecovered)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                          {formatCurrency(l.outstandingBalance)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {l.financeDisbursement.transactionReference} (
                          {l.financeDisbursement.disbursementDate})
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openRejectLoanModal(l)}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteLoanModal(l)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {reportView === 'pending_approvals' && (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Loan No</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Loan Type</th>
                    <th className="py-2.5 px-3">Applied On</th>
                    <th className="py-2.5 px-3 text-right">Requested Amt</th>
                    <th className="py-2.5 px-3 text-right">Est. Monthly EMI</th>
                    <th className="py-2.5 px-3">Current Approval Stage</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleLoans
                    .filter((l) =>
                      [
                        'Submitted - Pending HR Verification',
                        'HR Verified - Pending Manager/HR Approval',
                        'Approved - Pending Finance Disbursement',
                        'Returned for Clarification',
                      ].includes(l.status)
                    )
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                          {l.loanNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {l.employeeName} ({l.empCode})
                        </td>
                        <td className="py-2.5 px-3">{l.loanType}</td>
                        <td className="py-2.5 px-3 font-mono">{l.applicationDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                          {formatCurrency(l.requestedAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(l.monthlyEmi)}
                        </td>
                        <td className="py-2.5 px-3">{renderStatusText(l.status)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openRejectLoanModal(l)}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteLoanModal(l)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {reportView === 'monthly_recoveries' && (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Loan No</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Instalment</th>
                    <th className="py-2.5 px-3 text-right">Scheduled EMI</th>
                    <th className="py-2.5 px-3 text-right">Prior Shortfall</th>
                    <th className="py-2.5 px-3 text-right">Deducted Amount</th>
                    <th className="py-2.5 px-3 text-right">Shortfall Carried Fwd</th>
                    <th className="py-2.5 px-3">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleLoans.flatMap((l) =>
                    l.emiSchedule
                      .filter((i) => i.dueMonthKey === selectedMonthKey)
                      .map((inst) => (
                        <tr key={`${l.id}-${inst.instalmentNo}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                            {l.loanNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {l.employeeName} ({l.empCode})
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            EMI #{inst.instalmentNo}/{l.tenureMonths} ({inst.dueDate})
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            {formatCurrency(inst.scheduledEmi)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-700 tabular-nums">
                            {formatCurrency(inst.shortfallAddedFromPrior)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                            {formatCurrency(inst.deductedAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-700 tabular-nums">
                            {formatCurrency(inst.shortfallCarryForward)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">
                            {inst.status}{' '}
                            {inst.payrollRunRef ? `(${inst.payrollRunRef})` : ''}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {reportView === 'employee_balances' && (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Active Loans</th>
                    <th className="py-2.5 px-3 text-right">Total Disbursed</th>
                    <th className="py-2.5 px-3 text-right">Total Recovered</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enrolledEmployeesList.map((emp) => {
                    const empLoansList = allLoans.filter((l) => l.employeeId === emp.userId);
                    const activeCnt = empLoansList.filter(
                      (l) => l.status === 'Active - Disbursed'
                    ).length;
                    const disb = empLoansList.reduce((s, l) => s + l.disbursedAmount, 0);
                    const rec = empLoansList.reduce((s, l) => s + l.totalRecovered, 0);
                    const out = empLoansList.reduce((s, l) => s + l.outstandingBalance, 0);
                    return (
                      <tr key={emp.userId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                          {emp.empCode}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{emp.name}</td>
                        <td className="py-2.5 px-3">{emp.department}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {activeCnt}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(disb)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 tabular-nums">
                          {formatCurrency(rec)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                          {formatCurrency(out)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reportView === 'audit_trail' && (
            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Loan No &amp; Employee</th>
                    <th className="py-2.5 px-3">Workflow Stage</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">User &amp; Role</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleLoans.flatMap((l) =>
                    l.auditTrail.map((a) => (
                      <tr key={`${l.id}-${a.id}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-500">{a.timestamp}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          <span className="font-mono text-[#1f7e9e]">{l.loanNumber}</span> ·{' '}
                          {l.employeeName}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">{a.stage}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{a.action}</td>
                        <td className="py-2 px-3">
                          {a.actorName} ({a.actorRole})
                        </td>
                        <td className="py-2 px-3 text-slate-600">{a.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: STEP 2 — HR VERIFICATION
          ===================================================================== */}
      {hrVerifyModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  Step 2: HR Verification — {hrVerifyModalLoan.loanNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Verify employee status, salary, existing loans &amp; eligibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHrVerifyModalLoan(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmHrVerification} className="p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Employee:</span>
                  <strong>
                    {hrVerifyModalLoan.employeeName} ({hrVerifyModalLoan.empCode})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Requested Loan:</span>
                  <strong className="font-mono text-[#1f7e9e]">
                    {formatCurrency(hrVerifyModalLoan.requestedAmount)} (
                    {hrVerifyModalLoan.loanType})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Monthly Gross Salary:</span>
                  <strong className="font-mono">
                    {formatCurrency(hrVerifyModalLoan.monthlyGrossAtApplication)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Eligibility Limit:</span>
                  <strong className="font-mono text-emerald-700">
                    {formatCurrency(hrVerifyModalLoan.hrVerification.maxEligibleAmount)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Employment Status Check
                  </label>
                  <select
                    value={hrVerifyForm.employeeStatusCheck}
                    onChange={(e) =>
                      setHrVerifyForm({
                        ...hrVerifyForm,
                        employeeStatusCheck: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value="Active">Active Confirmed Employee</option>
                    <option value="Probation">On Probation</option>
                    <option value="Notice Period">Serving Notice Period</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Eligibility Assessment
                  </label>
                  <select
                    value={hrVerifyForm.eligibilityPassed ? 'yes' : 'no'}
                    onChange={(e) =>
                      setHrVerifyForm({
                        ...hrVerifyForm,
                        eligibilityPassed: e.target.value === 'yes',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value="yes">Eligible as per Policy</option>
                    <option value="no">Special Exception Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  HR Verification Remarks *
                </label>
                <textarea
                  rows={2}
                  required
                  value={hrVerifyForm.remarks}
                  onChange={(e) =>
                    setHrVerifyForm({ ...hrVerifyForm, remarks: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = hrVerifyModalLoan;
                    setHrVerifyModalLoan(null);
                    openRejectLoanModal(target);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Reject Request</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHrVerifyModalLoan(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold cursor-pointer"
                  >
                    Complete HR Verification →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: STEP 3 — MANAGER / HR APPROVAL
          ===================================================================== */}
      {managerApproveModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  Step 3: Manager / HR Approval — {managerApproveModalLoan.loanNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Sanction approved amount, interest rate &amp; EMI or return/reject
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagerApproveModalLoan(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmManagerDecision} className="p-5 space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {(['Approved', 'Returned', 'Rejected'] as const).map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setManagerApproveForm({ ...managerApproveForm, action: act })}
                    className={`py-2 px-3 rounded-lg font-bold border text-center cursor-pointer transition ${
                      managerApproveForm.action === act
                        ? act === 'Approved'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : act === 'Returned'
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {act === 'Approved'
                      ? '✓ Approve Loan'
                      : act === 'Returned'
                      ? '↺ Return for Clarification'
                      : '✕ Reject Request'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Sanctioned / Approved Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={managerApproveForm.approvedAmount}
                    onChange={(e) =>
                      setManagerApproveForm({
                        ...managerApproveForm,
                        approvedAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={managerApproveForm.tenureMonths}
                    onChange={(e) =>
                      setManagerApproveForm({
                        ...managerApproveForm,
                        tenureMonths: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Calculation Method
                  </label>
                  <select
                    value={managerApproveForm.calculationMethod}
                    onChange={(e) =>
                      setManagerApproveForm({
                        ...managerApproveForm,
                        calculationMethod: e.target.value as LoanCalculationMethod,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 font-semibold"
                  >
                    <option value="reducing_balance">Reducing Balance</option>
                    <option value="flat_rate">Flat Rate</option>
                    <option value="interest_free">Interest-Free (0%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    value={
                      managerApproveForm.calculationMethod === 'interest_free'
                        ? 0
                        : managerApproveForm.interestRateAnnual
                    }
                    onChange={(e) =>
                      setManagerApproveForm({
                        ...managerApproveForm,
                        interestRateAnnual: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    EMI Start Month
                  </label>
                  <input
                    type="text"
                    value={managerApproveForm.emiStartMonth}
                    onChange={(e) =>
                      setManagerApproveForm({
                        ...managerApproveForm,
                        emiStartMonth: e.target.value,
                      })
                    }
                    placeholder="2026-09"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Approval / Return / Rejection Remarks *
                </label>
                <textarea
                  rows={2}
                  required
                  value={managerApproveForm.remarks}
                  onChange={(e) =>
                    setManagerApproveForm({ ...managerApproveForm, remarks: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagerApproveModalLoan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Confirm Step 3 Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: STEP 4 & 5 — FINANCE DISBURSEMENT & EMI ACTIVATION
          ===================================================================== */}
      {financeDisburseModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  Step 4 &amp; 5: Finance Disbursement — {financeDisburseModalLoan.loanNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Authorize payment, record transaction reference &amp; activate monthly payroll EMI schedule
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFinanceDisburseModalLoan(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmFinanceDisbursement} className="p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-800">Employee &amp; Bank A/C:</span>
                  <strong className="font-mono text-emerald-950">
                    {financeDisburseModalLoan.employeeName} (
                    {financeDisburseModalLoan.financeDisbursement.bankAccountNo || 'Salary A/C'})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Approved Amount &amp; EMI:</span>
                  <strong className="font-mono text-emerald-950">
                    {formatCurrency(financeDisburseModalLoan.approvedAmount)} · EMI{' '}
                    {formatCurrency(financeDisburseModalLoan.monthlyEmi)}/mo ×{' '}
                    {financeDisburseModalLoan.tenureMonths}m
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={financeDisburseForm.disbursementDate}
                    onChange={(e) =>
                      setFinanceDisburseForm({
                        ...financeDisburseForm,
                        disbursementDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={financeDisburseForm.paymentMode}
                    onChange={(e) =>
                      setFinanceDisburseForm({
                        ...financeDisburseForm,
                        paymentMode: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold"
                  >
                    <option value="NEFT / Bank Transfer">NEFT / Bank Transfer</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI Corporate">UPI Corporate</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Salary Cycle Credit">Salary Cycle Credit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction Reference (UTR / Cheque) *
                  </label>
                  <input
                    type="text"
                    required
                    value={financeDisburseForm.transactionReference}
                    onChange={(e) =>
                      setFinanceDisburseForm({
                        ...financeDisburseForm,
                        transactionReference: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-[#1f7e9e]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Actual Disbursed Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={financeDisburseForm.disbursedAmount}
                    onChange={(e) =>
                      setFinanceDisburseForm({
                        ...financeDisburseForm,
                        disbursedAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Finance Disbursement Remarks
                </label>
                <input
                  type="text"
                  value={financeDisburseForm.remarks}
                  onChange={(e) =>
                    setFinanceDisburseForm({ ...financeDisburseForm, remarks: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFinanceDisburseModalLoan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Authorize Disbursement &amp; Generate EMI Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: STEP 8 — EARLY PRECLOSURE OR EXIT FnF SETTLEMENT
          ===================================================================== */}
      {closureModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  Step 8: Loan Closure &amp; Exit Settlement — {closureModalLoan.loanNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Process early lump-sum preclosure or employee resignation Full &amp; Final (FnF) settlement
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClosureModalLoan(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmLoanClosure} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    'Early Lump-Sum Preclosure',
                    'Employee Exit / Resignation FnF Settlement',
                  ] as const
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setClosureForm({
                        ...closureForm,
                        closureType: t,
                        settlementMode:
                          t === 'Employee Exit / Resignation FnF Settlement'
                            ? 'Final Salary & Leave Encashment Offset'
                            : 'Bank Transfer / NEFT',
                      })
                    }
                    className={`py-2 px-3 rounded-lg font-bold border text-center cursor-pointer transition ${
                      closureForm.closureType === t
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Total Repayable:</span>
                  <strong className="font-mono">
                    {formatCurrency(closureModalLoan.totalPayableAmount)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Recovered So Far:</span>
                  <strong className="font-mono text-emerald-700">
                    {formatCurrency(closureModalLoan.totalRecovered)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Remaining Balance:</span>
                  <strong className="font-mono text-rose-700">
                    {formatCurrency(closureModalLoan.outstandingBalance)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Settlement Mode
                  </label>
                  <select
                    value={closureForm.settlementMode}
                    onChange={(e) =>
                      setClosureForm({ ...closureForm, settlementMode: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 font-semibold"
                  >
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="Final Salary & Leave Encashment Offset">
                      Final Salary &amp; Leave Encashment Offset
                    </option>
                    <option value="Gratuity / Bonus Offset">Gratuity / Bonus Offset</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Interest Waiver / Rebate (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={closureModalLoan.outstandingBalance}
                    value={closureForm.interestWaivedOrAdjusted}
                    onChange={(e) =>
                      setClosureForm({
                        ...closureForm,
                        interestWaivedOrAdjusted: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Settlement Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={closureForm.settlementReference}
                    onChange={(e) =>
                      setClosureForm({
                        ...closureForm,
                        settlementReference: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono font-bold text-[#1f7e9e]"
                  />
                </div>
              </div>

              {closureForm.closureType === 'Employee Exit / Resignation FnF Settlement' && (
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2.5">
                  <div className="font-bold text-rose-950">
                    Employee Resignation Full &amp; Final (FnF) Settlement Calculator
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-semibold text-rose-900 block mb-1">
                        Final Month Salary (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={closureForm.finalSalaryPayableBeforeLoan}
                        onChange={(e) =>
                          setClosureForm({
                            ...closureForm,
                            finalSalaryPayableBeforeLoan: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-rose-900 block mb-1">
                        Leave Encashment (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={closureForm.leaveEncashmentAmount}
                        onChange={(e) =>
                          setClosureForm({
                            ...closureForm,
                            leaveEncashmentAmount: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-rose-900 block mb-1">
                        Gratuity / Bonus (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={closureForm.gratuityOrBonusOffset}
                        onChange={(e) =>
                          setClosureForm({
                            ...closureForm,
                            gratuityOrBonusOffset: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                      />
                    </div>
                  </div>
                  {(() => {
                    const netLoan = Math.max(
                      0,
                      closureModalLoan.outstandingBalance -
                        (Number(closureForm.interestWaivedOrAdjusted) || 0)
                    );
                    const totalDues =
                      (Number(closureForm.finalSalaryPayableBeforeLoan) || 0) +
                      (Number(closureForm.leaveEncashmentAmount) || 0) +
                      (Number(closureForm.gratuityOrBonusOffset) || 0);
                    const diff = totalDues - netLoan;
                    return (
                      <div className="pt-2 border-t border-rose-200 flex items-center justify-between font-bold">
                        <span>
                          Terminal Dues ({formatCurrency(totalDues)}) − Loan Balance (
                          {formatCurrency(netLoan)}):
                        </span>
                        <span
                          className={`font-mono text-sm ${
                            diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {diff >= 0
                            ? `Net Payable to Employee: ${formatCurrency(diff)}`
                            : `Net Recoverable from Employee: ${formatCurrency(Math.abs(diff))}`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Closure Approval Remarks
                </label>
                <input
                  type="text"
                  value={closureForm.remarks}
                  onChange={(e) => setClosureForm({ ...closureForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosureModalLoan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Approve Settlement &amp; Close Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EMPLOYEE CLARIFICATION RESUBMISSION
          ===================================================================== */}
      {clarificationLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-amber-500 text-slate-950 flex items-center justify-between">
              <h4 className="font-bold text-sm">
                Respond to Clarification — {clarificationLoan.loanNumber}
              </h4>
              <button
                type="button"
                onClick={() => setClarificationLoan(null)}
                className="text-slate-800 hover:text-slate-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResubmitClarification} className="p-5 space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <div className="font-bold">Manager / HR Remarks:</div>
                <div className="mt-0.5">
                  {clarificationLoan.managerApproval.remarks || 'Please provide clarification.'}
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Updated Requested Amount (₹)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={clarificationRequestedAmount}
                  onChange={(e) => setClarificationRequestedAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Clarification Response *
                </label>
                <textarea
                  rows={3}
                  required
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                  placeholder="Provide additional details or supporting document references..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClarificationLoan(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1f7e9e] text-white font-bold cursor-pointer"
                >
                  Resubmit Loan Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REJECT LOAN REQUEST (EMPLOYEE OR ADMIN)
          ===================================================================== */}
      {rejectModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span>Reject Loan Request — {rejectModalLoan.loanNumber}</span>
                </h4>
                <p className="text-[11px] text-amber-100">
                  {isAdminUser
                    ? 'Admin / HR rejection of employee loan request'
                    : 'Employee rejection / withdrawal of loan request'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalLoan(null)}
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmRejectLoan} className="p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <strong className="text-slate-900">
                    {rejectModalLoan.employeeName} ({rejectModalLoan.empCode})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loan Type &amp; Amount:</span>
                  <strong className="font-mono text-[#1f7e9e]">
                    {rejectModalLoan.loanType} · {formatCurrency(rejectModalLoan.requestedAmount)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Stage:</span>
                  <span className="font-semibold text-slate-700">{rejectModalLoan.status}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Rejection / Withdrawal Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Enter reason for rejecting this loan request..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalLoan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Reject Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE LOAN REQUEST (EMPLOYEE OR ADMIN)
          ===================================================================== */}
      {deleteModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Loan Request — {deleteModalLoan.loanNumber}</span>
                </h4>
                <p className="text-[11px] text-rose-100">
                  Permanently remove this loan record from Employee &amp; Admin registers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalLoan(null)}
                className="text-rose-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="font-bold">
                  Are you sure you want to permanently delete {deleteModalLoan.loanNumber}?
                </div>
                <p className="text-[11px] text-rose-800">
                  This will remove the {deleteModalLoan.loanType} request of{' '}
                  <strong className="font-mono">
                    {formatCurrency(deleteModalLoan.requestedAmount)}
                  </strong>{' '}
                  for <strong>{deleteModalLoan.employeeName}</strong> ({deleteModalLoan.empCode})
                  from both the frontend and backend database.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalLoan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLoan}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
