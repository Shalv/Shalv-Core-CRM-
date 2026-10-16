import React, { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useCrm } from '../../context/CrmContext';

const GMP_LIBRARIES: string[] = ['marker'];
const GMP_ATTRIBUTION_IDS: string[] = ['gmp_mcp_codeassist_v1_aistudio'];
import {
  Wallet,
  Users,
  Calendar,
  Clock,
  FileText,
  Receipt,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Printer,
  Download,
  Loader2,
  Settings,
  Link2,
  TrendingUp,
  RefreshCw,
  LogIn,
  LogOut,
  MapPin,
  Trash2,
  Edit3,
  X,
  UserPlus,
  Plus,
  Navigation,
  AlertTriangle,
  BarChart3,
  FileBarChart2,
  KeyRound,
  Lock,
  Landmark,
  ArrowRightLeft,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { BrandLogo } from '../common/BrandLogo';
import {
  exportElementToPortraitPdf,
  generateSalarySlipVectorPdf,
} from '../../utils/documentBranding';
import { amountInWords } from '../../utils/numberToWords';
import {
  EssTabKey,
  AdminPolicyMaster,
  EmployeeSalaryMasterRecord,
  LeaveRequestItem,
  ExpenseClaimItem,
  StatutoryDetails,
  PayrollIntegrationConfig,
  SyncLogEntry,
  AttendanceSession,
  GooglePunchLocation,
  AttendancePunchRecord,
  LEGACY_HARDCODED_URLS,
  PAYSLIP_MONTHS,
  getRoleDefaultGross,
  buildDefaultSalaryMasterRecord,
  normalizeEmpCode,
  loadEmployeeSalaryMasters,
  saveEmployeeSalaryMasters,
  PAYROLL_MASTERS_SYNC_EVENT,
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
  getSaturdayCalendarInfo,
  calculateDailyShiftHours,
  calculateEmployeePolicyPayroll,
  PAYROLL_LOANS_SYNC_EVENT,
  loadAllEmployeeLoans,
  reconcileMonthlyLoanDeductions,
  forgetDeletedPayrollMasterIds,
  OFFICE_GEOFENCE,
  loadPayrollLocations,
  savePayrollLocations,
  resolvePunchLocation,
  resolveEmployeeShift,
  loadRegularizationRequests,
  saveRegularizationRequests,
  loadShifts,
  saveShifts,
  loadShiftAssignments,
  saveShiftAssignments,
  loadShiftSwapRequests,
  saveShiftSwapRequests,
  loadHelpDeskTickets,
  saveHelpDeskTickets,
  loadPayrollRuns,
  savePayrollRuns,
  loadLifecycleEvents,
  saveLifecycleEvents,
  loadAssetCategories,
  saveAssetCategories,
  loadAssets,
  saveAssets,
  loadAssetAllocations,
  saveAssetAllocations,
  loadJobOpenings,
  saveJobOpenings,
  loadCandidates,
  saveCandidates,
  loadOnboardingPlans,
  saveOnboardingPlans,
  loadPerformanceReviews,
  savePerformanceReviews,
  loadTrainingPrograms,
  saveTrainingPrograms,
  loadTrainingNominations,
  saveTrainingNominations,
  type PayrollLocation,
  type RegularizationRequest,
  type ShiftDefinition,
  type ShiftAssignment,
  type ShiftSwapRequest,
  type HelpDeskTicket,
  type PayrollRun,
  type LifecycleEvent,
  type AssetCategory,
  type Asset,
  type AssetAllocation,
  type JobOpening,
  type Candidate,
  type OnboardingPlan,
  type PerformanceReview,
  type TrainingProgram,
  type TrainingNomination,
} from './payrollTypes';
import { checkGeofence, formatDistance, localIsoDate, localTimeString } from '../../shared/geo';
import { PayrollAdminMasterSection } from './PayrollAdminMasterSection';
import { PayrollAdminDashboardReportSection } from './PayrollAdminDashboardReportSection';
import { PayrollReportsSection } from './PayrollReportsSection';
import { PayrollIntegrationSection } from './PayrollIntegrationSection';
import { PayrollLoanManagementSection } from './PayrollLoanManagementSection';
import { PayChakraHeader, type PayChakraTab } from './PayChakraHeader';
import { PayChakraOverviewView } from './PayChakraOverviewView';
import { EssPersonalOverview } from './EssPersonalOverview';
import { AdminPunchOnBehalf } from './AdminPunchOnBehalf';
import { PayrollLocationMaster } from './PayrollLocationMaster';
import { PayrollRegularizationSection } from './PayrollRegularizationSection';
import { PayrollShiftRosterSection } from './PayrollShiftRosterSection';
import { PayrollHelpDeskSection } from './PayrollHelpDeskSection';
import { PayrollProcessingSection } from './PayrollProcessingSection';
import { PayrollLifecycleSection } from './PayrollLifecycleSection';
import { PayrollAuditTrailSection } from './PayrollAuditTrailSection';
import { PayrollAssetsSection } from './PayrollAssetsSection';
import { PayrollTalentSection } from './PayrollTalentSection';
import { PayrollHolidayMaster } from './PayrollHolidayMaster';
import { AdminDashboardSection } from './AdminDashboardSection';
import {
  fetchPayrollCollections,
  pushPayrollCollection,
  type PayrollCollectionKey,
} from './payrollCollectionsSync';

/**
 * Persist one HR collection to the server whenever it changes (after hydration).
 * Skips echoing back the value we just loaded, so hydration does not re-post itself.
 */
function useCollectionSync(
  key: PayrollCollectionKey,
  value: unknown[],
  hydrated: boolean,
  lastSyncedRef: { current: Record<string, string> }
) {
  useEffect(() => {
    if (!hydrated) return;
    let json = '';
    try {
      json = JSON.stringify(value);
    } catch {
      return;
    }
    if (lastSyncedRef.current[key] === json) return;
    lastSyncedRef.current[key] = json;
    void pushPayrollCollection(key, value);
  }, [key, value, hydrated, lastSyncedRef]);
}
import { PayChakraFooter } from './PayChakraFooter';

export type { EssTabKey };

interface PayrollEssPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: EssTabKey;
  asDedicatedPage?: boolean;
  onSwitchToCrm?: () => void;
}

export const PayrollEssPortalModal: React.FC<PayrollEssPortalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview',
  asDedicatedPage = false,
  onSwitchToCrm,
}) => {
  const {
    currentUser,
    users,
    customers,
    orders,
    supplierCompany,
    formatCurrency,
    canEdit,
    changeEmployeePassword,
    updateUser,
    updateCurrentUserProfile,
  } = useCrm();

  const isAdminUser =
    (currentUser.role === 'Super Admin' ||
      currentUser.role === 'Administrator' ||
      currentUser.role?.toLowerCase().includes('admin') ||
      currentUser.role?.toLowerCase().includes('hr') ||
      canEdit('masters')) &&
    currentUser.accessScope !== 'payroll_only';

  // If accessed by a non-admin / payroll-only employee, strictly isolate access to ONLY that employee's own payroll records
  const isDedicatedEmployeePortal =
    !isAdminUser && (asDedicatedPage || currentUser.accessScope === 'payroll_only');

  const [activeTab, setActiveTab] = useState<EssTabKey>(() => {
    if (!isAdminUser && (initialTab === 'admin_master' || initialTab === 'admin_dashboard' || initialTab === 'reports')) {
      return 'overview';
    }
    return initialTab || 'overview';
  });
  const [payChakraTab, setPayChakraTab] = useState<PayChakraTab>(() => {
    if (initialTab === 'admin_master') return 'employees';
    if (initialTab === 'admin_dashboard') return 'attendance';
    if (initialTab === 'reports') return 'reports';
    if (initialTab === 'payslips' || initialTab === 'loans' || initialTab === 'tax') return 'payroll';
    if (initialTab === 'leaves') return 'leaves';
    if (initialTab === 'reimbursements') return 'expenses';
    if (initialTab === 'integration') return 'administration';
    if (initialTab === 'profile') return 'profile';
    return 'overview';
  });
  const [globalPayrollSearch, setGlobalPayrollSearch] = useState<string>('');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-09');
  const [isPayslipPreviewOpen, setIsPayslipPreviewOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Self-service Change Password (available to every logged-in user from their profile)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePwdForm, setChangePwdForm] = useState({
    current: '',
    next: '',
    confirm: '',
    show: false,
  });
  const [changePwdError, setChangePwdError] = useState<string | null>(null);

  // Self-service Employee Profile Information Editing (syncs with Admin Dashboard & CRM)
  const [isEditingProfileInfo, setIsEditingProfileInfo] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileEditForm, setProfileEditForm] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    personalEmail: '',
    location: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: 'Single',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    pinCode: '',
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
    pfAccountNo: '',
    taxRegime: 'New Tax Regime (Section 115BAC)',
    accountHolderName: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    highestQualification: '',
    institute: '',
    passingYear: '',
    documents: [] as Array<{
      id: string;
      name: string;
      type: string;
      documentNumber?: string;
      uploadedAt: string;
    }>,
  });
  const [newDocDraft, setNewDocDraft] = useState({
    name: '',
    type: 'Identity Proof / Aadhaar',
    documentNumber: '',
  });

  // 0A. Admin Global Leave, Shift & Payroll Formula Policy Master (Policy CS-HR-POL-001 · Version 1.0)
  const [payrollLocations, setPayrollLocations] = useState<PayrollLocation[]>(() => loadPayrollLocations());
  useEffect(() => {
    savePayrollLocations(payrollLocations);
  }, [payrollLocations]);

  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>(() =>
    loadRegularizationRequests()
  );
  useEffect(() => {
    saveRegularizationRequests(regularizationRequests);
  }, [regularizationRequests]);

  const [shifts, setShifts] = useState<ShiftDefinition[]>(() => loadShifts());
  useEffect(() => { saveShifts(shifts); }, [shifts]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(() => loadShiftAssignments());
  useEffect(() => { saveShiftAssignments(shiftAssignments); }, [shiftAssignments]);
  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>(() => loadShiftSwapRequests());
  useEffect(() => { saveShiftSwapRequests(shiftSwaps); }, [shiftSwaps]);

  const [helpDeskTickets, setHelpDeskTickets] = useState<HelpDeskTicket[]>(() => loadHelpDeskTickets());
  useEffect(() => { saveHelpDeskTickets(helpDeskTickets); }, [helpDeskTickets]);

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => loadPayrollRuns());
  useEffect(() => { savePayrollRuns(payrollRuns); }, [payrollRuns]);

  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>(() => loadLifecycleEvents());
  useEffect(() => { saveLifecycleEvents(lifecycleEvents); }, [lifecycleEvents]);

  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>(() => loadAssetCategories());
  useEffect(() => { saveAssetCategories(assetCategories); }, [assetCategories]);
  const [assets, setAssets] = useState<Asset[]>(() => loadAssets());
  useEffect(() => { saveAssets(assets); }, [assets]);
  const [assetAllocations, setAssetAllocations] = useState<AssetAllocation[]>(() => loadAssetAllocations());
  useEffect(() => { saveAssetAllocations(assetAllocations); }, [assetAllocations]);

  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>(() => loadJobOpenings());
  useEffect(() => { saveJobOpenings(jobOpenings); }, [jobOpenings]);
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates());
  useEffect(() => { saveCandidates(candidates); }, [candidates]);
  const [onboardingPlans, setOnboardingPlans] = useState<OnboardingPlan[]>(() => loadOnboardingPlans());
  useEffect(() => { saveOnboardingPlans(onboardingPlans); }, [onboardingPlans]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => loadPerformanceReviews());
  useEffect(() => { savePerformanceReviews(performanceReviews); }, [performanceReviews]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>(() => loadTrainingPrograms());
  useEffect(() => { saveTrainingPrograms(trainingPrograms); }, [trainingPrograms]);
  const [trainingNominations, setTrainingNominations] = useState<TrainingNomination[]>(() => loadTrainingNominations());
  useEffect(() => { saveTrainingNominations(trainingNominations); }, [trainingNominations]);

  // ---- Real-time capture ----------------------------------------------------------
  // Load the HR collections from the server on mount (so this browser sees every other
  // user's changes), then push each collection back whenever it changes.
  const [collectionsHydrated, setCollectionsHydrated] = useState(false);
  const lastSyncedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchPayrollCollections();
      if (cancelled) return;
      const ref = lastSyncedRef.current;
      const take = <T,>(key: PayrollCollectionKey, local: T[], setter: (v: T[]) => void, keepLocalIfEmpty = false) => {
        const remoteVal = remote && Array.isArray(remote[key]) ? (remote[key] as T[]) : null;
        const next = remoteVal && (!keepLocalIfEmpty || remoteVal.length > 0) ? remoteVal : local;
        ref[key] = JSON.stringify(next);
        setter(next);
      };
      take('locations', loadPayrollLocations(), setPayrollLocations, true);
      take('regularization', loadRegularizationRequests(), setRegularizationRequests);
      take('shifts', loadShifts(), setShifts, true);
      take('shiftAssignments', loadShiftAssignments(), setShiftAssignments);
      take('shiftSwaps', loadShiftSwapRequests(), setShiftSwaps);
      take('helpdesk', loadHelpDeskTickets(), setHelpDeskTickets);
      take('runs', loadPayrollRuns(), setPayrollRuns);
      take('lifecycle', loadLifecycleEvents(), setLifecycleEvents);
      take('assetCategories', loadAssetCategories(), setAssetCategories, true);
      take('assets', loadAssets(), setAssets);
      take('assetAllocations', loadAssetAllocations(), setAssetAllocations);
      take('jobOpenings', loadJobOpenings(), setJobOpenings);
      take('candidates', loadCandidates(), setCandidates);
      take('onboarding', loadOnboardingPlans(), setOnboardingPlans);
      take('performance', loadPerformanceReviews(), setPerformanceReviews);
      take('trainingPrograms', loadTrainingPrograms(), setTrainingPrograms);
      take('trainingNominations', loadTrainingNominations(), setTrainingNominations);
      setCollectionsHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useCollectionSync('locations', payrollLocations, collectionsHydrated, lastSyncedRef);
  useCollectionSync('regularization', regularizationRequests, collectionsHydrated, lastSyncedRef);
  useCollectionSync('shifts', shifts, collectionsHydrated, lastSyncedRef);
  useCollectionSync('shiftAssignments', shiftAssignments, collectionsHydrated, lastSyncedRef);
  useCollectionSync('shiftSwaps', shiftSwaps, collectionsHydrated, lastSyncedRef);
  useCollectionSync('helpdesk', helpDeskTickets, collectionsHydrated, lastSyncedRef);
  useCollectionSync('runs', payrollRuns, collectionsHydrated, lastSyncedRef);
  useCollectionSync('lifecycle', lifecycleEvents, collectionsHydrated, lastSyncedRef);
  useCollectionSync('assetCategories', assetCategories, collectionsHydrated, lastSyncedRef);
  useCollectionSync('assets', assets, collectionsHydrated, lastSyncedRef);
  useCollectionSync('assetAllocations', assetAllocations, collectionsHydrated, lastSyncedRef);
  useCollectionSync('jobOpenings', jobOpenings, collectionsHydrated, lastSyncedRef);
  useCollectionSync('candidates', candidates, collectionsHydrated, lastSyncedRef);
  useCollectionSync('onboarding', onboardingPlans, collectionsHydrated, lastSyncedRef);
  useCollectionSync('performance', performanceReviews, collectionsHydrated, lastSyncedRef);
  useCollectionSync('trainingPrograms', trainingPrograms, collectionsHydrated, lastSyncedRef);
  useCollectionSync('trainingNominations', trainingNominations, collectionsHydrated, lastSyncedRef);

  // ---- ESS sub-navigation ----------------------------------------------------------
  // One unified scroll container for the whole employee portal, with the dashboard and
  // the self-service sections as segmented views instead of a detached second container.
  const [essView, setEssView] = useState<
    'dashboard' | 'shifts' | 'regularization' | 'helpdesk' | 'career' | 'assets'
  >('dashboard');

  const essLopDays = (() => {
    const run = payrollRuns.find((r) => r.month === (selectedMonthMeta?.key || ''));
    const line = run?.lines.find((l) => l.employeeId === currentUser.id);
    return line?.lopDays ?? 0;
  })();

  // One consistent navigation for the whole employee portal: entries either switch the
  // in-portal view (essView) or move to a detailed self-service tab.
  const essNav: {
    id: string;
    label: string;
    view?: typeof essView;
    tab?: EssTabKey;
    pay?: 'overview' | 'leaves' | 'payroll' | 'expenses' | 'profile';
  }[] = [
    { id: 'home', label: 'Home', view: 'dashboard', pay: 'overview' },
    { id: 'shifts', label: 'My Shifts & Swaps', view: 'shifts', pay: 'overview' },
    { id: 'regularization', label: 'Punch Regularization', view: 'regularization', pay: 'overview' },
    { id: 'helpdesk', label: 'HR Helpdesk', view: 'helpdesk', pay: 'overview' },
    { id: 'career', label: 'Career & Milestones', view: 'career', pay: 'overview' },
    { id: 'assets', label: 'My Assets', view: 'assets', pay: 'overview' },
    { id: 'leave', label: 'My Leave', tab: 'leaves', pay: 'leaves' },
    { id: 'pay', label: 'My Pay', tab: 'payslips', pay: 'payroll' },
    { id: 'claims', label: 'My Claims', tab: 'reimbursements', pay: 'expenses' },
    { id: 'profile', label: 'My Profile', tab: 'profile', pay: 'profile' },
  ];

  const goEss = (item: (typeof essNav)[number]) => {
    if (item.view) {
      setEssView(item.view);
      setPayChakraTab('overview');
      setActiveTab('overview');
      return;
    }
    if (item.tab) {
      setActiveTab(item.tab);
      setPayChakraTab((item.pay || 'overview') as any);
    }
  };

  const essNavActive = (item: (typeof essNav)[number]): boolean =>
    item.view ? payChakraTab === 'overview' && essView === item.view : payChakraTab !== 'overview' && activeTab === item.tab;

  const essNavBar = (
    <div className="sticky top-0 z-20 bg-[#f8fafc] pt-1">
      <div className="ess-tabs">
        {essNav.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => goEss(v)}
            className={`ess-tab ${essNavActive(v) ? 'is-active' : ''}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ---- Header sub-navigation focus -------------------------------------------------
  // Every header tab and dropdown option lands on the section it names, rather than
  // all of them opening the first section of the same screen.
  const [adminFocusSection, setAdminFocusSection] = useState<string | undefined>(undefined);
  const [adminFocusNonce, setAdminFocusNonce] = useState(0);
  const [adminOpenCreate, setAdminOpenCreate] = useState(false);
  const [sectionAnchor, setSectionAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionAnchor) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(sectionAnchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 140);
    return () => window.clearTimeout(t);
  }, [sectionAnchor, adminFocusNonce, payChakraTab]);

  const [adminPolicyMaster, setAdminPolicyMaster] = useState<AdminPolicyMaster>(() =>
    loadAdminPolicyMaster()
  );
  const [isEditingBoardPolicy, setIsEditingBoardPolicy] = useState<boolean>(false);
  const [loansSyncVersion, setLoansSyncVersion] = useState<number>(0);

  useEffect(() => {
    const onLoansSync = () => setLoansSyncVersion((v) => v + 1);
    window.addEventListener(PAYROLL_LOANS_SYNC_EVENT, onLoansSync);
    return () => window.removeEventListener(PAYROLL_LOANS_SYNC_EVENT, onLoansSync);
  }, []);

  useEffect(() => {
    saveAdminPolicyMaster(adminPolicyMaster, true);
  }, [adminPolicyMaster]);

  // 0B. Shared CRM & Payroll Per-Employee Salary & Statutory Master Map
  const [employeeSalaryMasters, setEmployeeSalaryMasters] = useState<
    Record<string, EmployeeSalaryMasterRecord>
  >(() =>
    loadEmployeeSalaryMasters(
      users,
      supplierCompany?.bankName || 'HDFC Bank Ltd',
      supplierCompany?.ifscCode || 'HDFC0001245'
    )
  );

  // Enrolled payroll employees (Admin is separate: admin is a CRM system user, not an employee)
  const enrolledEmployees = useMemo(() => {
    return Object.values(employeeSalaryMasters).filter(
      (m) => m && m.userId && m.enrolledInPayroll !== false
    );
  }, [employeeSalaryMasters]);

  // Find the logged-in user's own payroll master record using strict priority order:
  // 1. Exact userId match
  // 2. Exact email match
  // 3. Exact normalized empCode match
  const currentUserOwnMaster = useMemo(() => {
    const allMasters = Object.values(employeeSalaryMasters).filter(Boolean);
    const byId = allMasters.find((m) => m.userId === currentUser.id);
    if (byId) return byId;

    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    if (cleanEmail) {
      const byEmail = allMasters.find(
        (m) => m.email && m.email.trim().toLowerCase() === cleanEmail
      );
      if (byEmail) return byEmail;
    }

    const cleanCode = normalizeEmpCode(currentUser.empCode || currentUser.username || '');
    if (cleanCode && /^EMP-\d+$/i.test(cleanCode)) {
      const byCode = allMasters.find(
        (m) => m.empCode && normalizeEmpCode(m.empCode) === cleanCode
      );
      if (byCode) return byCode;
    }

    return null;
  }, [
    employeeSalaryMasters,
    currentUser.id,
    currentUser.email,
    currentUser.empCode,
    currentUser.username,
  ]);

  // Selected Employee (Admin in CRM can inspect/manage any enrolled payroll employee;
  // Employees / Dedicated Payroll Login Link users are strictly locked to their own user ID only)
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string>(() => {
    const loadedMasters = loadEmployeeSalaryMasters(
      users,
      supplierCompany?.bankName || 'HDFC Bank Ltd',
      supplierCompany?.ifscCode || 'HDFC0001245'
    );
    const allLoaded = Object.values(loadedMasters).filter(Boolean);
    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    const cleanCode = normalizeEmpCode(currentUser.empCode || currentUser.username || '');
    const ownMatch =
      allLoaded.find((m) => m.userId === currentUser.id) ||
      (cleanEmail
        ? allLoaded.find((m) => m.email && m.email.trim().toLowerCase() === cleanEmail)
        : undefined) ||
      (cleanCode && /^EMP-\d+$/i.test(cleanCode)
        ? allLoaded.find((m) => m.empCode && normalizeEmpCode(m.empCode) === cleanCode)
        : undefined);
    if (!isAdminUser) {
      return ownMatch?.userId || currentUser.id;
    }
    const list = Object.values(loadedMasters).filter(
      (m) => m && m.userId && m.enrolledInPayroll !== false
    );
    return ownMatch?.userId || list[0]?.userId || '';
  });

  // Keep selectedAdminUserId in sync with enrolled payroll employees (and locked to own user if not Admin)
  useEffect(() => {
    if (!isAdminUser) {
      const targetOwnId = currentUserOwnMaster?.userId || currentUser.id;
      if (selectedAdminUserId !== targetOwnId) {
        setSelectedAdminUserId(targetOwnId);
      }
      return;
    }
    if (enrolledEmployees.length > 0) {
      if (!selectedAdminUserId || !enrolledEmployees.some((e) => e.userId === selectedAdminUserId)) {
        setSelectedAdminUserId(enrolledEmployees[0].userId);
      }
    } else {
      if (selectedAdminUserId !== '') {
        setSelectedAdminUserId('');
      }
    }
  }, [isAdminUser, currentUserOwnMaster, currentUser.id, enrolledEmployees, selectedAdminUserId]);

  // Active enrolled master record:
  // - For non-admin or Payroll Login Link sessions: STRICTLY locked to currentUserOwnMaster ONLY (never another employee).
  // - For Admin in CRM: selected employee from switcher.
  const activeUserMaster: EmployeeSalaryMasterRecord | null = useMemo(() => {
    if (!isAdminUser) {
      if (currentUserOwnMaster) return currentUserOwnMaster;
      // Fallback: build a personal isolated record for the logged-in user so they only ever see their own info
      return buildDefaultSalaryMasterRecord(
        currentUser,
        0,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
    }
    if (enrolledEmployees.length === 0) return null;
    if (selectedAdminUserId) {
      const match = enrolledEmployees.find((e) => e.userId === selectedAdminUserId);
      if (match) return match;
    }
    return enrolledEmployees[0] || null;
  }, [
    isAdminUser,
    currentUserOwnMaster,
    currentUser,
    supplierCompany?.bankName,
    supplierCompany?.ifscCode,
    enrolledEmployees,
    selectedAdminUserId,
  ]);

  // Active employee whose ESS data is being viewed (null if 0 employees in payroll database)
  const activeEmployee = useMemo(() => {
    if (!activeUserMaster) return null;
    const masterEmail = activeUserMaster.email ? activeUserMaster.email.toLowerCase() : '';
    const crmUser =
      users.find((u) => u.id === activeUserMaster.userId) ||
      (masterEmail ? users.find((u) => u.email?.toLowerCase() === masterEmail) : undefined);
    return {
      id: activeUserMaster.userId,
      name: activeUserMaster.name || crmUser?.name || 'Employee',
      email: activeUserMaster.email || crmUser?.email || '',
      phone: activeUserMaster.phone || crmUser?.phone || '',
      role: activeUserMaster.role || crmUser?.role || 'Sales Executive',
      department: activeUserMaster.department || crmUser?.department || 'Sales',
      designation:
        activeUserMaster.designation ||
        crmUser?.designation ||
        activeUserMaster.role ||
        'Employee',
      location: activeUserMaster.location || crmUser?.location || 'Corporate HQ',
      status: activeUserMaster.status || crmUser?.status || 'Active',
      avatar: crmUser?.avatar,
    };
  }, [activeUserMaster, users]);

  // ---- Self-service Change Password -------------------------------------
  // The logged-in user changes their OWN password from their profile. The new
  // password is synced to BOTH the payroll master and the CRM user via
  // changeEmployeePassword(), so CRM login & Payroll ESS login stay identical.
  const openChangePassword = () => {
    setChangePwdForm({ current: '', next: '', confirm: '', show: false });
    setChangePwdError(null);
    setIsChangePasswordOpen(true);
  };

  const handleChangePasswordSubmit = async () => {
    const current = changePwdForm.current.trim();
    const next = changePwdForm.next.trim();
    const confirm = changePwdForm.confirm.trim();

    if (!current) {
      setChangePwdError('Please enter your current password (set by Admin or your previous password).');
      return;
    }
    if (next.length < 4) {
      setChangePwdError('New password must be at least 4 characters.');
      return;
    }
    if (next !== confirm) {
      setChangePwdError('New password and confirm password do not match.');
      return;
    }

    // Resolve the logged-in user's own master + identity for verification & sync.
    const ownMaster =
      currentUserOwnMaster ||
      Object.values(employeeSalaryMasters).find((m) => m && m.userId === currentUser.id) ||
      null;
    const identity = ownMaster?.userId || currentUser.id || currentUser.email || ownMaster?.email || '';

    try {
      let token: string | null = null;
      try {
        token = localStorage.getItem('crm_auth_token');
      } catch {
        // ignore
      }
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: identity,
          identifier: currentUser.email || ownMaster?.email || statutory.empCode || identity,
          currentPassword: current,
          newPassword: next,
          confirmPassword: confirm,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        setChangePwdError(data?.message || 'Current password is incorrect.');
        return;
      }
    } catch {
      // Fallback to local verification if offline
      const expected = ownMaster?.password || ownMaster?.tempPassword || currentUser.password || '';
      if (expected && current !== expected) {
        setChangePwdError('Current password is incorrect.');
        return;
      }
    }

    const synced = changeEmployeePassword(identity, next);

    // Reflect immediately in local payroll state
    const targetKey = ownMaster?.userId || currentUser.id;
    if (targetKey) {
      setEmployeeSalaryMasters((prev) => {
        const rec = prev[targetKey] || ownMaster;
        if (!rec) return prev;
        const nextMap = {
          ...prev,
          [targetKey]: {
            ...rec,
            mustChangePasswordOnFirstLogin: false,
          },
        };
        forgetDeletedPayrollMasterIds([targetKey]);
        return nextMap;
      });
    }

    setChangePwdForm({ current: '', next: '', confirm: '', show: false });
    setChangePwdError(null);
    setIsChangePasswordOpen(false);
    setStatusBanner(
      synced
        ? '✓ Password changed successfully! Please use your new password for all future ESS Portal and CRM logins.'
        : '✓ Password updated for your employee profile.'
    );
  };

  const handleStartEditProfile = () => {
    if (!activeEmployee) return;
    const currentMaster = employeeSalaryMasters[activeEmployee.id] || activeUserMaster || ({} as EmployeeSalaryMasterRecord);
    setProfileEditForm({
      name: currentMaster.name || activeEmployee.name || currentUser.name || '',
      phone: currentMaster.phone || activeEmployee.phone || currentUser.phone || '',
      alternatePhone: currentMaster.alternatePhone || (currentUser as any).alternatePhone || '',
      personalEmail: currentMaster.personalEmail || (currentUser as any).personalEmail || '',
      location: currentMaster.location || activeEmployee.location || currentUser.location || '',
      gender: currentMaster.gender || (currentUser as any).gender || 'Male',
      dateOfBirth: currentMaster.dateOfBirth || (currentUser as any).dateOfBirth || '',
      bloodGroup: currentMaster.bloodGroup || (currentUser as any).bloodGroup || '',
      maritalStatus: currentMaster.maritalStatus || (currentUser as any).maritalStatus || 'Single',
      currentAddress: currentMaster.currentAddress || (currentUser as any).currentAddress || '',
      permanentAddress: currentMaster.permanentAddress || (currentUser as any).permanentAddress || '',
      city: currentMaster.city || (currentUser as any).city || '',
      state: currentMaster.state || (currentUser as any).state || '',
      pinCode: currentMaster.pinCode || (currentUser as any).pinCode || '',
      bankName: currentMaster.bankName || statutory.bankName || '',
      bankAccountNo: currentMaster.bankAccountNo || statutory.bankAccountNo || '',
      ifscCode: currentMaster.ifscCode || statutory.ifscCode || '',
      panNumber: currentMaster.panNumber || statutory.panNumber || '',
      uanNumber: currentMaster.uanNumber || statutory.uanNumber || '',
      pfAccountNo: currentMaster.pfAccountNo || statutory.pfAccountNo || '',
      taxRegime: currentMaster.taxRegime || statutory.taxRegime || 'New Tax Regime (Section 115BAC)',
      accountHolderName: currentMaster.accountHolderName || (currentUser as any).accountHolderName || '',
      emergencyContactName: currentMaster.emergencyContactName || (currentUser as any).emergencyContactName || '',
      emergencyContactPhone: currentMaster.emergencyContactPhone || (currentUser as any).emergencyContactPhone || '',
      emergencyContactRelation: currentMaster.emergencyContactRelation || (currentUser as any).emergencyContactRelation || '',
      highestQualification: currentMaster.highestQualification || (currentUser as any).highestQualification || '',
      institute: currentMaster.institute || (currentUser as any).institute || '',
      passingYear: currentMaster.passingYear || (currentUser as any).passingYear || '',
      documents: currentMaster.documents || (currentUser as any).documents || [],
    });
    setIsEditingProfileInfo(true);
  };

  const handleSaveProfileInfo = async () => {
    if (!activeEmployee) return;
    if (!profileEditForm.name.trim()) {
      setStatusBanner('Name cannot be empty.');
      return;
    }
    const cleanName = profileEditForm.name.trim();
    const cleanPhone = profileEditForm.phone.trim();
    const cleanAlternatePhone = profileEditForm.alternatePhone.trim();
    const cleanPersonalEmail = profileEditForm.personalEmail.trim();
    const cleanLocation = profileEditForm.location.trim();
    const cleanBank = profileEditForm.bankName.trim();
    const cleanAccount = profileEditForm.bankAccountNo.trim();
    const cleanIfsc = profileEditForm.ifscCode.trim().toUpperCase();
    const cleanPan = profileEditForm.panNumber.trim().toUpperCase();
    const cleanUan = profileEditForm.uanNumber.trim();
    const cleanPf = profileEditForm.pfAccountNo.trim();
    const cleanTaxRegime = profileEditForm.taxRegime;
    const cleanHolder = profileEditForm.accountHolderName.trim();
    const cleanCurrentAddress = profileEditForm.currentAddress.trim();
    const cleanPermanentAddress = profileEditForm.permanentAddress.trim();
    const cleanCity = profileEditForm.city.trim();
    const cleanState = profileEditForm.state.trim();
    const cleanPin = profileEditForm.pinCode.trim();
    const cleanEmergName = profileEditForm.emergencyContactName.trim();
    const cleanEmergPhone = profileEditForm.emergencyContactPhone.trim();
    const cleanEmergRel = profileEditForm.emergencyContactRelation.trim();
    const cleanQual = profileEditForm.highestQualification.trim();
    const cleanInst = profileEditForm.institute.trim();
    const cleanYear = profileEditForm.passingYear.trim();

    setIsSavingProfile(true);
    setStatusBanner('Persisting employee information to PostgreSQL database...');

    const nextStatutory: StatutoryDetails = {
      ...statutory,
      bankName: cleanBank,
      bankAccountNo: cleanAccount,
      ifscCode: cleanIfsc,
      panNumber: cleanPan,
      uanNumber: cleanUan || statutory.uanNumber || '',
      pfAccountNo: cleanPf || statutory.pfAccountNo || '',
      taxRegime: cleanTaxRegime as any,
    };

    const updatedFields: Partial<EmployeeSalaryMasterRecord> = {
      name: cleanName,
      phone: cleanPhone,
      alternatePhone: cleanAlternatePhone,
      personalEmail: cleanPersonalEmail,
      location: cleanLocation,
      gender: profileEditForm.gender,
      dateOfBirth: profileEditForm.dateOfBirth,
      bloodGroup: profileEditForm.bloodGroup,
      maritalStatus: profileEditForm.maritalStatus,
      currentAddress: cleanCurrentAddress,
      permanentAddress: cleanPermanentAddress,
      city: cleanCity,
      state: cleanState,
      pinCode: cleanPin,
      bankName: cleanBank,
      bankAccountNo: cleanAccount,
      ifscCode: cleanIfsc,
      panNumber: cleanPan,
      uanNumber: cleanUan,
      pfAccountNo: cleanPf,
      taxRegime: cleanTaxRegime as any,
      accountHolderName: cleanHolder,
      emergencyContactName: cleanEmergName,
      emergencyContactPhone: cleanEmergPhone,
      emergencyContactRelation: cleanEmergRel,
      highestQualification: cleanQual,
      institute: cleanInst,
      passingYear: cleanYear,
      documents: profileEditForm.documents,
    };

    try {
      let token: string | null = null;
      try {
        token = localStorage.getItem('crm_auth_token');
      } catch {
        /* ignore */
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/payroll/ess/${activeEmployee.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          profile: updatedFields,
          statutory: nextStatutory,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Database persistence failed');
      }

      // Success: Database update confirmed
      setStatutory(nextStatutory);
      try {
        localStorage.setItem(`crm_ess_${activeEmployee.id}_statutory`, JSON.stringify(nextStatutory));
      } catch {
        /* ignore */
      }

      updateCurrentUserProfile({
        name: cleanName,
        phone: cleanPhone,
        location: cleanLocation,
        ...updatedFields,
      });

      const currentMaster = employeeSalaryMasters[activeEmployee.id] || activeUserMaster;
      if (currentMaster) {
        const nextUpdatedMaster: EmployeeSalaryMasterRecord = {
          ...currentMaster,
          ...updatedFields,
        };
        const nextMasters = {
          ...employeeSalaryMasters,
          [activeEmployee.id]: nextUpdatedMaster,
        };
        setEmployeeSalaryMasters(nextMasters);
        saveEmployeeSalaryMasters(nextMasters, true, false, [activeEmployee.id]);
      }

      if (Array.isArray(resData?.auditLogs) && resData.auditLogs.length > 0) {
        window.dispatchEvent(
          new CustomEvent('crm-audit-logs-updated', {
            detail: { auditLogs: resData.auditLogs },
          })
        );
      }

      window.dispatchEvent(new CustomEvent('crm-employee-updated', { detail: { empId: activeEmployee.id } }));
      window.dispatchEvent(new CustomEvent(PAYROLL_MASTERS_SYNC_EVENT));
      window.dispatchEvent(new CustomEvent('crm-payroll-refresh'));

      setIsEditingProfileInfo(false);
      setStatusBanner('✓ Your profile changes have been persisted to PostgreSQL database and synced with Admin.');
    } catch (err: any) {
      setStatusBanner(`✗ Failed to update employee record in database: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };


  // Reload from shared storage when modal opens or when CRM UsersMasterTab updates Payroll allocations
  useEffect(() => {
    const syncFromStorage = () => {
      const loaded = loadEmployeeSalaryMasters(
        users,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
      setEmployeeSalaryMasters((prev) =>
        JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded
      );
      const loadedPolicy = loadAdminPolicyMaster();
      setAdminPolicyMaster((prev) =>
        JSON.stringify(prev) === JSON.stringify(loadedPolicy) ? prev : loadedPolicy
      );
    };
    if (isOpen) {
      syncFromStorage();
    }
    window.addEventListener(PAYROLL_MASTERS_SYNC_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener(PAYROLL_MASTERS_SYNC_EVENT, syncFromStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplierCompany?.bankName, supplierCompany?.ifscCode, users, currentUser]);

  useEffect(() => {
    if (isOpen && initialTab) {
      const nextTab: EssTabKey =
        ((initialTab === 'admin_master' || initialTab === 'admin_dashboard') && !isAdminUser) ||
        initialTab === 'integration'
          ? 'overview'
          : initialTab;
      setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
    }
  }, [isOpen, initialTab, isAdminUser]);

  // Base monthly salary from Admin Employee Master
  const baseMonthlyGross = useMemo(() => {
    if (!activeEmployee || !activeUserMaster) return 0;
    if (activeUserMaster.monthlyGross && activeUserMaster.monthlyGross > 0) {
      return activeUserMaster.monthlyGross;
    }
    return getRoleDefaultGross(activeEmployee.role);
  }, [activeUserMaster, activeEmployee]);

  // Calculate CRM Sales Incentive linked to active employee's orders
  const crmSalesIncentive = useMemo(() => {
    if (!activeEmployee || !activeUserMaster) return 0;
    const commPct =
      (activeUserMaster.commissionPct ?? adminPolicyMaster.defaultSalesCommissionPct) / 100;
    const userOrders = orders.filter(
      (o) =>
        o.salespersonName?.toLowerCase() === activeEmployee.name.toLowerCase() ||
        o.salespersonId === activeEmployee.id
    );
    const totalOrderSubtotal = userOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    if (totalOrderSubtotal > 0) {
      return Math.round(Math.min(45000, totalOrderSubtotal * commPct));
    }
    return 0;
  }, [
    orders,
    activeEmployee,
    activeUserMaster,
    adminPolicyMaster.defaultSalesCommissionPct,
  ]);

  const storagePrefix = activeEmployee ? `crm_ess_${activeEmployee.id}` : '';

  // 1. Attendance State & Google Maps Location State
  // Local calendar date (NOT toISOString(), which returns the UTC date — the previous
  // day for early-morning punches in IST).
  const todayIso = localIsoDate();
  const [attendance, setAttendance] = useState<AttendanceSession>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_attendance`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      date: todayIso,
      punchedIn: false,
      punchInTime: null,
      punchOutTime: null,
      workMode: 'Office HQ',
      locationSharingEnabled: false,
      punchInLocation: null,
      punchOutLocation: null,
      punchHistory: [],
    };
  });

  const [mapsApiKey, setMapsApiKey] = useState<string>(
    () => (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);
  // Persistent alert state while location is OFF (remains visible until location is turned on)
  const [locationOffAlertAction, setLocationOffAlertAction] = useState<
    'PUNCH_IN' | 'PUNCH_OUT' | null
  >(null);
  const [isLocationOffModalOpen, setIsLocationOffModalOpen] = useState<boolean>(false);
  const [locationSharePromptReason, setLocationSharePromptReason] = useState<string>('');

  // Load Google Maps API Key from server config if not already injected in client env
  const fetchedMapsKeyRef = useRef(false);
  useEffect(() => {
    if (!isOpen || mapsApiKey || fetchedMapsKeyRef.current) return;
    fetchedMapsKeyRef.current = true;
    let cancelled = false;
    fetch('/api/maps/config')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.apiKey) {
          setMapsApiKey((prev) => prev || data.apiKey);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, mapsApiKey]);

  // Reload employee-specific attendance when switching employee in Admin mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_attendance`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAttendance((prev) =>
          JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed
        );
        return;
      }
    } catch {
      // ignore
    }
    const fallbackSession: AttendanceSession = {
      date: todayIso,
      punchedIn: false,
      punchInTime: null,
      punchOutTime: null,
      workMode: 'Office HQ',
      locationSharingEnabled: false,
      punchInLocation: null,
      punchOutLocation: null,
      punchHistory: [],
    };
    setAttendance((prev) =>
      JSON.stringify(prev) === JSON.stringify(fallbackSession) ? prev : fallbackSession
    );
  }, [storagePrefix, todayIso]);

  useEffect(() => {
    if (activeEmployee) {
      saveEmployeeAttendance(activeEmployee.id, attendance, true);
    }
  }, [attendance, activeEmployee]);

  // 2. Statutory & Bank Details State
  const defaultEmpCode =
    activeUserMaster?.empCode ||
    (activeEmployee ? `EMP-${activeEmployee.id.replace(/\D/g, '').padStart(3, '0') || '101'}` : 'EMP-000');
  const [statutory, setStatutory] = useState<StatutoryDetails>(() => {
    if (!activeEmployee) {
      return {
        empCode: 'EMP-000',
        panNumber: '—',
        uanNumber: '—',
        pfAccountNo: '—',
        bankName: '—',
        bankAccountNo: '—',
        ifscCode: '—',
        taxRegime: 'New Tax Regime (Section 115BAC)',
        sec80CDeclared: 0,
        sec80DDeclared: 0,
        hraMonthlyRent: 0,
        npsContribution: 0,
      };
    }
    try {
      const saved = localStorage.getItem(`${storagePrefix}_statutory`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      empCode: defaultEmpCode,
      panNumber: activeUserMaster?.panNumber || 'ABCDE1234F',
      uanNumber: activeUserMaster?.uanNumber || '101489203912',
      pfAccountNo: 'MH/BAN/0048291/000/000102',
      bankName: activeUserMaster?.bankName || supplierCompany?.bankName || 'HDFC Bank Ltd',
      bankAccountNo: activeUserMaster?.bankAccountNo || '50100482910482',
      ifscCode: activeUserMaster?.ifscCode || supplierCompany?.ifscCode || 'HDFC0001245',
      taxRegime: 'New Tax Regime (Section 115BAC)',
      sec80CDeclared: 150000,
      sec80DDeclared: 25000,
      hraMonthlyRent: 22000,
      npsContribution: 50000,
    };
  });

  // Sync statutory fields when activeEmployee or activeUserMaster changes
  useEffect(() => {
    if (activeUserMaster) {
      setStatutory((prev) => {
        if (
          prev.empCode === activeUserMaster.empCode &&
          prev.panNumber === activeUserMaster.panNumber &&
          prev.uanNumber === activeUserMaster.uanNumber &&
          prev.bankName === activeUserMaster.bankName &&
          prev.bankAccountNo === activeUserMaster.bankAccountNo &&
          prev.ifscCode === activeUserMaster.ifscCode
        ) {
          return prev;
        }
        return {
          ...prev,
          empCode: activeUserMaster.empCode,
          panNumber: activeUserMaster.panNumber,
          uanNumber: activeUserMaster.uanNumber,
          bankName: activeUserMaster.bankName,
          bankAccountNo: activeUserMaster.bankAccountNo,
          ifscCode: activeUserMaster.ifscCode,
        };
      });
    }
  }, [activeEmployee, activeUserMaster]);

  useEffect(() => {
    if (storagePrefix && activeEmployee) {
      try {
        const key = `${storagePrefix}_statutory`;
        const nextJson = JSON.stringify(statutory);
        const prevJson = localStorage.getItem(key);
        if (prevJson !== nextJson) {
          localStorage.setItem(key, nextJson);
          fetch(`/api/payroll/ess/${encodeURIComponent(activeEmployee.id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statutory }),
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [statutory, storagePrefix, activeEmployee]);

  // 3. Leave Requests State (with full Create, Edit, Delete support)
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>(() =>
    activeEmployee
      ? loadEmployeeLeaves(
          activeEmployee.id,
          activeEmployee.name,
          users.find((u) => u.id !== activeEmployee.id)?.name || 'Team Lead',
          0
        )
      : []
  );

  useEffect(() => {
    if (!activeEmployee) {
      setLeaves([]);
      return;
    }
    const loaded = loadEmployeeLeaves(
      activeEmployee.id,
      activeEmployee.name,
      users.find((u) => u.id !== activeEmployee.id)?.name || 'Team Lead',
      0
    );
    setLeaves((prev) => (JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded));
  }, [activeEmployee, users]);

  useEffect(() => {
    if (activeEmployee) {
      saveEmployeeLeaves(activeEmployee.id, leaves, true);
    }
  }, [leaves, activeEmployee]);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Monthly Leave (1/Month)' as LeaveRequestItem['leaveType'],
    startDate: todayIso,
    endDate: todayIso,
    dayType: 'Full Day' as LeaveRequestItem['dayType'],
    reason: '',
    handoverTo: users.find((u) => u.id !== activeEmployee?.id)?.name || '',
  });

  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [editingLeaveDraft, setEditingLeaveDraft] = useState<LeaveRequestItem | null>(null);

  // 4. Reimbursement Claims State (with full Create, Edit, Delete support)
  const [claims, setClaims] = useState<ExpenseClaimItem[]>(() =>
    activeEmployee
      ? loadEmployeeClaims(
          activeEmployee.id,
          activeEmployee.name,
          customers[0]?.name || 'Enterprise Client Visit',
          0
        )
      : []
  );

  useEffect(() => {
    if (!activeEmployee) {
      setClaims([]);
      return;
    }
    const loaded = loadEmployeeClaims(
      activeEmployee.id,
      activeEmployee.name,
      customers[0]?.name || 'Enterprise Client Visit',
      0
    );
    setClaims((prev) => (JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded));
  }, [activeEmployee, customers]);

  useEffect(() => {
    if (activeEmployee) {
      saveEmployeeClaims(activeEmployee.id, claims, true);
    }
  }, [claims, activeEmployee]);

  const [claimForm, setClaimForm] = useState({
    category: 'Client Visit Travel' as ExpenseClaimItem['category'],
    expenseDate: todayIso,
    amount: '',
    linkedCustomer: customers[0]?.name || 'General CRM Operations',
    billNumber: '',
    description: '',
  });

  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingClaimDraft, setEditingClaimDraft] = useState<ExpenseClaimItem | null>(null);

  // 5. Payroll Integration Config State (No hard-coded links)
  const [integrationConfig, setIntegrationConfig] = useState<PayrollIntegrationConfig>(() => {
    const defaults: PayrollIntegrationConfig = {
      provider: 'custom',
      providerLabel: 'Inbuilt CRM Payroll & ESS',
      portalUrl: '',
      ssoEnabled: true,
      launchMode: 'integrated_ess',
      operationMode: 'standalone_builtin',
      fetchApiEndpoint: '',
      pushWebhookEndpoint: '',
      apiTenantKey: '',
      syncCrmIncentives: true,
      syncReimbursements: true,
      autoPushAttendanceAndLeaves: true,
      fetchedGrossSalaryOverride: null,
      lastSyncedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      lastFetchedAt: 'Not linked yet',
      lastPushedAt: 'Not linked yet',
    };
    try {
      const saved = localStorage.getItem('crm_payroll_integration_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.portalUrl && LEGACY_HARDCODED_URLS.has(parsed.portalUrl)) {
          parsed.portalUrl = '';
        }
        if (parsed.fetchApiEndpoint && LEGACY_HARDCODED_URLS.has(parsed.fetchApiEndpoint)) {
          parsed.fetchApiEndpoint = '';
        }
        if (parsed.pushWebhookEndpoint && LEGACY_HARDCODED_URLS.has(parsed.pushWebhookEndpoint)) {
          parsed.pushWebhookEndpoint = '';
        }
        if (parsed.apiTenantKey === 'ESS-LIVE-SSO-98412-CRM') {
          parsed.apiTenantKey = '';
        }
        return { ...defaults, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaults;
  });

  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([
    {
      id: 'SYNC-01',
      direction: 'FETCH (PULL FROM PAYROLL)',
      timestamp: 'Today, 09:00 AM',
      summary: 'Fetched Master Salary Structure, Tax Regime & Published Payslips from Payroll API',
      status: 'Success',
    },
    {
      id: 'SYNC-02',
      direction: 'PUSH (SEND TO PAYROLL)',
      timestamp: 'Today, 09:18 AM',
      summary: 'Pushed Daily Attendance Punch-In, CRM Sales Incentives & Approved Reimbursements',
      status: 'Success',
    },
  ]);
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);

  useEffect(() => {
    try {
      const nextJson = JSON.stringify(integrationConfig);
      const prevJson = localStorage.getItem('crm_payroll_integration_config');
      if (prevJson !== nextJson) {
        localStorage.setItem('crm_payroll_integration_config', nextJson);
        fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payrollIntegrationConfig: integrationConfig }),
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [integrationConfig]);

  // Compute Payslip Numbers for Selected Month
  const selectedMonthMeta =
    PAYSLIP_MONTHS.find((m) => m.key === selectedMonthKey) || PAYSLIP_MONTHS[0];

  const effectiveMonthlyGross = integrationConfig.fetchedGrossSalaryOverride || baseMonthlyGross;

  // Evaluate current attendance session against Policy CS-HR-POL-001
  const currentPolicyEval = useMemo(() => {
    return evaluateAttendancePolicy({
      punchInTime: attendance.punchInTime,
      punchOutTime: attendance.punchOutTime,
      priorGraceUsed: Math.max(0, (attendance.graceUsedThisMonth || 0) - 1),
      priorLateCount: Math.max(0, (attendance.lateCountThisMonth || 0) - 1),
      hasPriorApproval: attendance.hasPriorApproval || false,
      managementAuthorizedEarly: attendance.managementAuthorizedEarly || false,
      breakDurationMins: attendance.breakDurationMins || 45,
      policy: adminPolicyMaster,
    });
  }, [
    attendance.punchInTime,
    attendance.punchOutTime,
    attendance.graceUsedThisMonth,
    attendance.lateCountThisMonth,
    attendance.hasPriorApproval,
    attendance.managementAuthorizedEarly,
    attendance.breakDurationMins,
    adminPolicyMaster,
  ]);

  const saturdayCalendarInfo = useMemo(
    () => getSaturdayCalendarInfo(todayIso, adminPolicyMaster),
    [todayIso, adminPolicyMaster]
  );

  const salaryBreakdown = useMemo(() => {
    if (!activeUserMaster || !activeEmployee) {
      const emptyMaster: EmployeeSalaryMasterRecord = {
        userId: '',
        empCode: 'EMP-000',
        name: 'No Employee',
        email: '',
        password: '',
        accessType: 'crm_and_payroll',
        phone: '',
        role: 'Employee',
        department: 'General',
        designation: 'Employee',
        location: 'Corporate HQ',
        status: 'Active',
        reportingManager: '',
        assignedTerritory: '',
        syncedWithCrm: false,
        enrolledInPayroll: false,
        monthlyGross: 0,
        basicPct: 50,
        hraPct: 25,
        specialPct: 18,
        commissionPct: 0,
        profTax: 0,
        tdsPct: 0,
        lopDays: 0,
        panNumber: '',
        uanNumber: '',
        pfAccountNo: '',
        taxRegime: 'New Tax Regime (Section 115BAC)',
        bankName: '',
        bankAccountNo: '',
        ifscCode: '',
        plQuota: 0,
        clQuota: 0,
        slQuota: 0,
        compOffQuota: 0,
        shiftTiming: '09:30 AM - 06:00 PM',
        workMode: 'Office HQ',
      };
      return calculateEmployeePolicyPayroll({
        monthKey: selectedMonthKey,
        master: emptyMaster,
        policy: adminPolicyMaster,
        attendance: attendance,
        leaves: [],
        claims: [],
        crmSalesIncentive: 0,
        grossOverride: 0,
      });
    }

    return calculateEmployeePolicyPayroll({
      monthKey: selectedMonthKey,
      master: activeUserMaster,
      policy: adminPolicyMaster,
      attendance,
      leaves,
      claims,
      crmSalesIncentive,
      syncCrmIncentives: integrationConfig.syncCrmIncentives,
      syncReimbursements: integrationConfig.syncReimbursements,
      grossOverride: effectiveMonthlyGross,
    });
  }, [
    selectedMonthKey,
    activeUserMaster,
    activeEmployee,
    adminPolicyMaster,
    attendance,
    leaves,
    claims,
    crmSalesIncentive,
    integrationConfig.syncCrmIncentives,
    integrationConfig.syncReimbursements,
    effectiveMonthlyGross,
    loansSyncVersion,
  ]);

  // Salary Slip PDF export state & handler
  const printableSlipRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const handleDownloadSalarySlipPdf = async () => {
    if (!activeEmployee) {
      setStatusBanner('No employee selected to generate salary slip.');
      return;
    }
    setIsDownloadingPdf(true);
    const safeEmpName = (activeEmployee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
    const safeMonth = selectedMonthMeta.label.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Salary_Slip_${safeEmpName}_${safeMonth}.pdf`;

    try {
      if (printableSlipRef.current) {
        await exportElementToPortraitPdf(printableSlipRef.current, fileName);
        setStatusBanner(`Official Salary Slip PDF with company logo branding downloaded (${fileName})!`);
      } else {
        throw new Error('Printable container not mounted');
      }
    } catch (err) {
      console.warn('Canvas export failed, using Vector PDF fallback:', err);
      try {
        const doc = generateSalarySlipVectorPdf({
          supplierCompany,
          employee: {
            name: activeEmployee.name,
            designation: activeEmployee.designation,
            department: activeEmployee.department,
            role: activeEmployee.role,
          },
          statutory,
          monthMeta: {
            label: selectedMonthMeta.label,
            payDate: selectedMonthMeta.payDate,
          },
          breakdown: {
            basic: salaryBreakdown.basic,
            hra: salaryBreakdown.hra,
            specialAllowance: salaryBreakdown.specialAllowance,
            conveyance: salaryBreakdown.conveyance,
            incentive: salaryBreakdown.incentive,
            grossEarnings: salaryBreakdown.grossEarnings,
            pfDeduction: salaryBreakdown.pfDeduction,
            professionalTax: salaryBreakdown.professionalTax,
            incomeTaxTds: salaryBreakdown.incomeTaxTds,
            loanRecovery: salaryBreakdown.loanRecovery,
            advanceRecovery: salaryBreakdown.advanceRecovery,
            otherDeductions: salaryBreakdown.otherDeductions,
            totalDeductions: salaryBreakdown.totalDeductions,
            approvedReimbursements: salaryBreakdown.approvedReimbursements,
            netPayable: salaryBreakdown.netPayable,
            paidDays: salaryBreakdown.paidDays,
            lopDays: salaryBreakdown.lopDays,
            policyLopDeductionAmount: salaryBreakdown.policyLopDeductionAmount,
          },
        });
        doc.save(fileName);
        setStatusBanner(`Official Salary Slip Vector PDF downloaded (${fileName})!`);
      } catch (vectorErr) {
        console.error('Vector PDF fallback failed:', vectorErr);
        window.print();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Leave Balances
  const approvedLeaveDays = useMemo(() => {
    const used: Record<string, number> = {
      'Privilege Leave': 0,
      'Casual Leave': 0,
      'Sick Leave': 0,
      'Comp-Off': 0,
      'Monthly Leave (1/Month)': 0,
      'Early Exit Approval': 0,
      'Half Day Approval': 0,
      'Extended Break Approval': 0,
      'Emergency Intimation': 0,
    };
    leaves
      .filter((l) => l.status !== 'Cancelled')
      .forEach((l) => {
        used[l.leaveType] = (used[l.leaveType] || 0) + l.days;
      });
    return used;
  }, [leaves]);

  if (!isOpen) return null;

  // Fetch the device's genuine GPS fix for a punch. We deliberately do NOT fall back
  // to IP geolocation or to the office address: a punch must record where the employee
  // actually is, otherwise the office geofence check below is meaningless.
  const fetchGoogleLocationForPunch = async (): Promise<{
    location: GooglePunchLocation | null;
    permissionDenied: boolean;
    reason: 'OK' | 'UNSUPPORTED' | 'DENIED' | 'UNAVAILABLE';
  }> => {
    const nowTime = localTimeString();

    const getBrowserCoords = (): Promise<{
      coords: GeolocationCoordinates | null;
      reason: 'OK' | 'UNSUPPORTED' | 'DENIED' | 'UNAVAILABLE';
    }> =>
      new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          resolve({ coords: null, reason: 'UNSUPPORTED' });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ coords: pos.coords, reason: 'OK' }),
          (err) => {
            if (err.code === err.PERMISSION_DENIED || err.code === 1) {
              resolve({ coords: null, reason: 'DENIED' });
              return;
            }
            // One retry at standard accuracy — high-accuracy often times out on laptops.
            navigator.geolocation.getCurrentPosition(
              (pos2) => resolve({ coords: pos2.coords, reason: 'OK' }),
              (err2) => {
                const denied = err2.code === err2.PERMISSION_DENIED || err2.code === 1;
                resolve({ coords: null, reason: denied ? 'DENIED' : 'UNAVAILABLE' });
              },
              { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 }
            );
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      });

    const { coords, reason } = await getBrowserCoords();
    if (!coords) {
      return { location: null, permissionDenied: reason === 'DENIED', reason };
    }

    // Reverse-geocode purely for a human-readable address; the coordinates stay the raw GPS fix.
    let resolvedAddress = '';
    let resolvedPlaceId = '';
    let resolvedPlusCode = '';
    try {
      const res = await fetch(
        `/api/maps/reverse-geocode?lat=${coords.latitude}&lng=${coords.longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.formattedAddress) {
          resolvedAddress = data.formattedAddress;
          resolvedPlaceId = data.placeId || '';
          resolvedPlusCode = data.plusCode || '';
        }
      }
    } catch {
      // cosmetic only — ignore
    }
    if (!resolvedAddress) {
      try {
        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
        );
        if (bdcRes.ok) {
          const bdc = await bdcRes.json();
          const parts = [
            bdc.locality,
            bdc.city && bdc.city !== bdc.locality ? bdc.city : '',
            bdc.principalSubdivision,
            bdc.postcode,
            bdc.countryName,
          ].filter(Boolean);
          if (parts.length > 0) resolvedAddress = parts.join(', ');
        }
      } catch {
        // ignore
      }
    }

    return {
      location: {
        lat: coords.latitude,
        lng: coords.longitude,
        formattedAddress:
          resolvedAddress ||
          `GPS Coordinates (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`,
        placeId: resolvedPlaceId,
        plusCode: resolvedPlusCode,
        accuracyMeters: Math.round(coords.accuracy || 15),
        fetchedAt: nowTime,
        source: 'gps',
      },
      permissionDenied: false,
      reason: 'OK',
    };
  };

  // Resolve the office geofence centre: explicit policy coordinates win, otherwise the
  // built-in office location (SRS Tower, Sector 31, Faridabad).
  // Resolve the punch geofence from the employee's assigned Location Master entry
  // (falling back to the default active location).
  const resolveOfficeCentre = (): { lat: number; lng: number; radiusMeters: number } => {
    const loc = resolvePunchLocation(payrollLocations, activeUserMaster?.locationId);
    return { lat: loc.lat, lng: loc.lng, radiusMeters: loc.radiusMeters };
  };

  const executePunchWithGoogleLocation = (
    action: 'PUNCH_IN' | 'PUNCH_OUT',
    googleLoc: GooglePunchLocation,
    overrideTime?: string
  ) => {
    const nowTime = overrideTime || googleLoc.fetchedAt;
    const newRecord: AttendancePunchRecord = {
      id: `PUNCH-${Date.now().toString().slice(-5)}`,
      date: todayIso,
      action,
      time: nowTime,
      workMode: attendance.workMode,
      location: { ...googleLoc, fetchedAt: nowTime },
    };

    // When an admin/HR user punches for someone else, say so explicitly.
    const onBehalfOf =
      isAdminUser && activeEmployee && String(activeEmployee.id) !== String(currentUser.id)
        ? `On behalf of ${activeEmployee.name} · `
        : '';

    if (action === 'PUNCH_IN') {
      const evalResult = evaluateAttendancePolicy({
        punchInTime: nowTime,
        punchOutTime: null,
        priorGraceUsed: attendance.graceUsedThisMonth || 0,
        priorLateCount: attendance.lateCountThisMonth || 0,
        hasPriorApproval: attendance.hasPriorApproval || false,
        managementAuthorizedEarly: attendance.managementAuthorizedEarly || false,
        breakDurationMins: attendance.breakDurationMins || 45,
        policy: adminPolicyMaster,
      });

      setAttendance((prev) => ({
        ...prev,
        date: todayIso,
        punchedIn: true,
        punchInTime: nowTime,
        recordedInTime: evalResult.recordedInTime,
        punchOutTime: null,
        locationSharingEnabled: true,
        punchInLocation: { ...googleLoc, fetchedAt: nowTime },
        graceUsedThisMonth: evalResult.graceUsedAfter,
        lateCountThisMonth: evalResult.lateCountAfter,
        policyStatus: evalResult.finalStatus,
        policyRemarks: evalResult.summaryCitation,
        punchHistory: [newRecord, ...(prev.punchHistory || []).slice(0, 14)],
      }));
      setStatusBanner(
        `${onBehalfOf}Punched In at ${nowTime} (Recorded as ${evalResult.recordedInTime}) · Status: ${evalResult.finalStatus} (${evalResult.entryRuleLabel}) · Google Maps: ${googleLoc.formattedAddress}`
      );
    } else {
      const evalResult = evaluateAttendancePolicy({
        punchInTime: attendance.punchInTime || adminPolicyMaster.shiftStartTime || '09:30 AM',
        punchOutTime: nowTime,
        priorGraceUsed: attendance.graceUsedThisMonth || 0,
        priorLateCount: attendance.lateCountThisMonth || 0,
        hasPriorApproval: attendance.hasPriorApproval || false,
        managementAuthorizedEarly: attendance.managementAuthorizedEarly || false,
        breakDurationMins: attendance.breakDurationMins || 45,
        policy: adminPolicyMaster,
      });

      setAttendance((prev) => ({
        ...prev,
        punchedIn: false,
        punchOutTime: nowTime,
        locationSharingEnabled: true,
        punchOutLocation: { ...googleLoc, fetchedAt: nowTime },
        policyStatus: evalResult.finalStatus,
        policyRemarks: evalResult.summaryCitation,
        punchHistory: [newRecord, ...(prev.punchHistory || []).slice(0, 14)],
      }));
      setStatusBanner(
        `${onBehalfOf}Punched Out at ${nowTime} · Final Status: ${evalResult.finalStatus} (${evalResult.exitRuleLabel}) · Google Maps: ${googleLoc.formattedAddress}`
      );
    }
  };

  const handleTogglePunch = async () => {
    // State-machine guards: never punch out without a punch-in, and never re-punch-in
    // once today's attendance is already complete.
    if (!attendance.punchedIn && attendance.punchInTime && attendance.punchOutTime) {
      setStatusBanner(
        'You have already punched out for today — this day\'s attendance is complete.'
      );
      return;
    }
    if (attendance.punchedIn && !attendance.punchInTime) {
      setAttendance((prev) => ({ ...prev, punchedIn: false }));
      setStatusBanner('Attendance session was incomplete and has been reset. Please punch in again.');
      return;
    }

    const nextAction: 'PUNCH_IN' | 'PUNCH_OUT' = attendance.punchedIn ? 'PUNCH_OUT' : 'PUNCH_IN';

    setIsFetchingLocation(true);
    const { location, reason } = await fetchGoogleLocationForPunch();
    setIsFetchingLocation(false);

    if (!location) {
      setAttendance((prev) => ({ ...prev, locationSharingEnabled: false }));
      const why =
        reason === 'DENIED'
          ? 'Location permission was denied.'
          : reason === 'UNSUPPORTED'
          ? 'This device or browser does not support location.'
          : 'Your device could not obtain a GPS fix.';
      setLocationSharePromptReason(
        `${why} Attendance is only recorded with a verified GPS location, so nothing was saved. Please enable location and try again to ${
          nextAction === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'
        }.`
      );
      setLocationOffAlertAction(nextAction);
      setIsLocationOffModalOpen(true);
      return;
    }

    // Geofence validation — the punch must fall inside the assigned location's radius.
    const centre = resolveOfficeCentre();
    const fence = checkGeofence(location.lat, location.lng, centre, centre.radiusMeters);
    if (fence) {
      location.distanceMeters = fence.distanceMeters;
      location.withinGeofence = fence.within;
    }

    const isOfficeMode = attendance.workMode === 'Office HQ';
    if (
      isOfficeMode &&
      fence &&
      !fence.within &&
      !adminPolicyMaster?.allowOutOfGeofencePunch
    ) {
      setStatusBanner(
        `Punch ${nextAction === 'PUNCH_IN' ? 'In' : 'Out'} blocked: you are ${formatDistance(
          fence.distanceMeters
        )} from the office (allowed radius ${formatDistance(
          fence.radiusMeters
        )}). Please move within the office premises, or change your work mode.`
      );
      return;
    }

    setLocationOffAlertAction(null);
    setIsLocationOffModalOpen(false);
    executePunchWithGoogleLocation(nextAction, location);
  };

  const handleConfirmShareLocationAndPunch = async () => {
    const actionToRun = locationOffAlertAction || (attendance.punchedIn ? 'PUNCH_OUT' : 'PUNCH_IN');
    setIsFetchingLocation(true);
    const { location } = await fetchGoogleLocationForPunch();
    setIsFetchingLocation(false);

    if (!location) {
      setStatusBanner(
        'Location is still unavailable. Attendance was NOT recorded. Please enable location permissions and try again.'
      );
      return;
    }

    const centre = resolveOfficeCentre();
    const fence = checkGeofence(location.lat, location.lng, centre, centre.radiusMeters);
    if (fence) {
      location.distanceMeters = fence.distanceMeters;
      location.withinGeofence = fence.within;
    }
    if (
      attendance.workMode === 'Office HQ' &&
      fence &&
      !fence.within &&
      !adminPolicyMaster?.allowOutOfGeofencePunch
    ) {
      setStatusBanner(
        `Punch blocked: you are ${formatDistance(fence.distanceMeters)} from the office (allowed radius ${formatDistance(
          fence.radiusMeters
        )}).`
      );
      return;
    }

    setLocationOffAlertAction(null);
    setIsLocationOffModalOpen(false);
    executePunchWithGoogleLocation(actionToRun, location);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim() || !activeEmployee) return;
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    const isPermissionType =
      leaveForm.leaveType === 'Early Exit Approval' ||
      leaveForm.leaveType === 'Extended Break Approval';
    const computedDays = isPermissionType
      ? 0
      : leaveForm.dayType === 'Full Day'
      ? diffDays
      : 0.5;

    const isRequestedInAdvance =
      leaveForm.startDate >= todayIso || leaveForm.leaveType === 'Emergency Intimation';

    // Policy CS-HR-POL-001: 1 leave per month. Request in advance. Absence without approval is unauthorized absence.
    const currentMonthLeavesUsed = leaves
      .filter(
        (l) =>
          l.status !== 'Cancelled' &&
          l.startDate.slice(0, 7) === leaveForm.startDate.slice(0, 7) &&
          l.days > 0
      )
      .reduce((s, l) => s + l.days, 0);

    const exceedsMonthlyQuota =
      computedDays > 0 &&
      currentMonthLeavesUsed + computedDays > (adminPolicyMaster.monthlyLeaveLimit || 1) &&
      !isAdminUser;

    const newLeave: LeaveRequestItem = {
      id: `LV-${Date.now().toString().slice(-4)}`,
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: computedDays,
      dayType: isPermissionType ? 'Short Permission' : leaveForm.dayType,
      reason: leaveForm.reason.trim(),
      handoverTo: leaveForm.handoverTo || 'Reporting Manager',
      status: !isRequestedInAdvance
        ? 'Unauthorized Absence (LOP)'
        : isAdminUser
        ? 'Approved'
        : 'Pending Approval',
      appliedOn: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      requestedInAdvance: isRequestedInAdvance,
    };

    if (
      (newLeave.status === 'Approved' || isAdminUser) &&
      (leaveForm.leaveType === 'Early Exit Approval' ||
        leaveForm.leaveType === 'Half Day Approval' ||
        leaveForm.leaveType === 'Extended Break Approval' ||
        leaveForm.leaveType === 'Emergency Intimation')
    ) {
      setAttendance((prev) => ({ ...prev, hasPriorApproval: true }));
    }

    setLeaves([newLeave, ...leaves]);
    setLeaveForm({ ...leaveForm, reason: '' });
    setStatusBanner(
      !isRequestedInAdvance
        ? `Policy CS-HR-POL-001 Alert: Retroactive absence without prior approval recorded as Unauthorized Absence (LOP).`
        : exceedsMonthlyQuota
        ? `Request submitted (${leaveForm.leaveType}). Note: Exceeds the 1 Leave/Month quota under Policy CS-HR-POL-001; subject to Manager/HR approval.`
        : `Prior Approval Request (${leaveForm.leaveType}) submitted under Policy CS-HR-POL-001.`
    );
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(claimForm.amount);
    if (!numericAmount || numericAmount <= 0 || !activeEmployee) return;

    const newClaim: ExpenseClaimItem = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      claimNo: `CLM-2026-${Math.floor(100 + Math.random() * 899)}`,
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      category: claimForm.category,
      expenseDate: claimForm.expenseDate,
      amount: numericAmount,
      linkedCustomer: claimForm.linkedCustomer,
      billNumber: claimForm.billNumber || 'BILL-NA',
      description: claimForm.description || claimForm.category,
      status: 'Approved & Queued for Payroll',
    };

    setClaims([newClaim, ...claims]);
    setClaimForm({
      ...claimForm,
      amount: '',
      billNumber: '',
      description: '',
    });
    setStatusBanner(
      `Expense claim ${newClaim.claimNo} for ${formatCurrency(
        numericAmount
      )} queued for next Payroll disbursement.`
    );
  };

  const buildOutboundPushPayload = () => ({
    event: 'CRM_TO_PAYROLL_BI_DIRECTIONAL_PUSH',
    timestamp: new Date().toISOString(),
    provider: integrationConfig.providerLabel,
    employee: {
      empCode: statutory.empCode,
      name: activeEmployee?.name || 'Employee',
      email: activeEmployee?.email || '',
      department: activeEmployee?.department || 'General',
      designation: activeEmployee?.designation || activeEmployee?.role || 'Employee',
      panNumber: statutory.panNumber,
      uanNumber: statutory.uanNumber,
    },
    attendancePush: attendance,
    leavesPush: leaves.filter((l) => l.status !== 'Cancelled'),
    reimbursementsPush: claims.filter((c) => c.status === 'Approved & Queued for Payroll'),
    crmSalesCommissionPush: {
      month: selectedMonthMeta.key,
      calculatedSalesIncentive: salaryBreakdown.incentive,
      autoSyncEnabled: integrationConfig.syncCrmIncentives,
    },
    taxDeclarationsPush: {
      taxRegime: statutory.taxRegime,
      sec80CDeclared: statutory.sec80CDeclared,
      sec80DDeclared: statutory.sec80DDeclared,
      hraMonthlyRent: statutory.hraMonthlyRent,
      npsContribution: statutory.npsContribution,
    },
  });

  const handleFetchFromPayroll = async () => {
    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (integrationConfig.fetchApiEndpoint) {
      try {
        const res = await fetch(integrationConfig.fetchApiEndpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${integrationConfig.apiTenantKey}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data?.grossSalary === 'number' && data.grossSalary > 0) {
            setIntegrationConfig((prev) => ({
              ...prev,
              fetchedGrossSalaryOverride: data.grossSalary,
              lastFetchedAt: nowFormatted,
              lastSyncedAt: nowFormatted,
            }));
          }
        }
      } catch {
        // Offline / CORS fallback
      }
    }

    setIntegrationConfig((prev) => ({
      ...prev,
      lastFetchedAt: nowFormatted,
      lastSyncedAt: nowFormatted,
    }));

    setSyncLogs((prev) => [
      {
        id: `FETCH-${Date.now().toString().slice(-4)}`,
        direction: 'FETCH (PULL FROM PAYROLL)',
        timestamp: nowFormatted,
        summary: `Pulled Salary Structure (${formatCurrency(
          salaryBreakdown.grossEarnings
        )} Gross), Payslips & Leave Balances from ${integrationConfig.providerLabel}`,
        status: 'Success',
      },
      ...prev.slice(0, 9),
    ]);

    setStatusBanner(
      `FETCH COMPLETE (Pull from ${integrationConfig.providerLabel}): Latest Salary Structure, Payslips, Leave Balances & Statutory Profile fetched into CRM ESS.`
    );
  };

  const handlePushToPayroll = async () => {
    const nowFormatted = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const payload = buildOutboundPushPayload();

    if (integrationConfig.pushWebhookEndpoint) {
      try {
        await fetch(integrationConfig.pushWebhookEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${integrationConfig.apiTenantKey}`,
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // Offline / CORS fallback
      }
    }

    setIntegrationConfig((prev) => ({
      ...prev,
      lastPushedAt: nowFormatted,
      lastSyncedAt: nowFormatted,
    }));

    setSyncLogs((prev) => [
      {
        id: `PUSH-${Date.now().toString().slice(-4)}`,
        direction: 'PUSH (SEND TO PAYROLL)',
        timestamp: nowFormatted,
        summary: `Pushed Attendance (${
          attendance.punchedIn ? 'Punched In' : 'Checked Out'
        }), ${leaves.length} Leaves, ${formatCurrency(
          salaryBreakdown.approvedReimbursements
        )} Claims & ${formatCurrency(salaryBreakdown.incentive)} CRM Incentive to ${
          integrationConfig.providerLabel
        }`,
        status: 'Success',
      },
      ...prev.slice(0, 9),
    ]);

    setStatusBanner(
      `PUSH COMPLETE (Sent to ${integrationConfig.providerLabel}): Attendance, Leave Requests, Expense Claims (${formatCurrency(
        salaryBreakdown.approvedReimbursements
      )}) & CRM Sales Incentives (${formatCurrency(
        salaryBreakdown.incentive
      )}) pushed to Payroll.`
    );
  };

  const handleDownloadPushBatchJson = () => {
    const payload = buildOutboundPushPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_Push_Batch_${statutory.empCode}_${selectedMonthMeta.key}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBanner(
      `Downloaded Payroll Push Payload (${statutory.empCode}) for ${integrationConfig.providerLabel}.`
    );
  };

  const handleSyncPayrollNow = () => {
    handleFetchFromPayroll();
    handlePushToPayroll();
  };

  const hasExternalLink = Boolean(
    integrationConfig.portalUrl.trim() ||
      integrationConfig.fetchApiEndpoint.trim() ||
      integrationConfig.pushWebhookEndpoint.trim()
  );

  const renderNoEmployeesEmptyState = (tabTitle: string) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-2xs my-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <Users className="w-7 h-7" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
        <span>System User: {currentUser.name} ({currentUser.role})</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Employees in Payroll Database</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        All employees have been removed from the payroll register. In Enact 360 CRM &amp; Payroll, Admin users are separate from payroll employees and count as <strong>System Users</strong> in CRM Masters.
        <br className="hidden sm:inline" />
        To view {tabTitle}, please add employees in the Admin Master.
      </p>
      {isAdminUser && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('admin_master')}
            className="px-5 py-2.5 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Go to Admin Payroll &amp; Users Master</span>
          </button>
        </div>
      )}
    </div>
  );

  // Personal overview for non-admin employees — their own records only, never company or admin data.
  const personalOverview = (
    <EssPersonalOverview
      employee={activeUserMaster}
      attendance={attendance}
      leaves={leaves}
      claims={claims}
      formatCurrency={formatCurrency}
      isFetchingLocation={isFetchingLocation}
      onPunch={handleTogglePunch}
      policy={adminPolicyMaster}
      shift={resolveEmployeeShift(shifts, shiftAssignments, currentUser.id)}
      officeLabel={resolvePunchLocation(payrollLocations, activeUserMaster?.locationId).name}
      payrollRuns={payrollRuns}
      lopDays={essLopDays}
      payslipMonth={selectedMonthMeta?.label}
      onWorkModeChange={(mode) => setAttendance((prev) => ({ ...prev, workMode: mode }))}
      onDownloadPayslip={() => { setPayChakraTab('payroll'); setActiveTab('payslips'); }}
      onNewClaim={() => { setPayChakraTab('expenses'); setActiveTab('reimbursements'); }}
      onFileRegularization={() => setEssView('regularization')}
      onNavigate={(tab) => {
        if (tab === 'payslips') { setPayChakraTab('payroll'); setActiveTab('payslips'); }
        else if (tab === 'leaves') { setPayChakraTab('leaves'); setActiveTab('leaves'); }
        else if (tab === 'reimbursements') { setPayChakraTab('expenses'); setActiveTab('reimbursements'); }
        else if (tab === 'profile') { setPayChakraTab('profile'); setActiveTab('profile'); }
        else if (tab === 'shifts') setEssView('shifts');
        else if (tab === 'regularization') setEssView('regularization');
        else if (tab === 'helpdesk') setEssView('helpdesk');
        else if (tab === 'lifecycle') setEssView('career');
      }}
    />
  );

  const essEmployeeList = enrolledEmployees.map((m) => ({
    userId: m.userId,
    name: m.name,
    empCode: m.empCode,
    department: m.department,
    designation: m.designation,
    monthlyGross: m.monthlyGross,
  }));

  // One unified scroll container for the whole employee portal: the dashboard and the
  // self-service sections are segmented views, so there is no detached second container
  // and no nested scrollbar.
  const essPortalView = (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4">
        {essNavBar}

        {essView === 'dashboard' && personalOverview}
        {essView === 'shifts' && (
          <PayrollShiftRosterSection
            mode="employee"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name || 'Employee'}
            employees={essEmployeeList}
            shifts={shifts}
            onChangeShifts={setShifts}
            assignments={shiftAssignments}
            onChangeAssignments={setShiftAssignments}
            swaps={shiftSwaps}
            onChangeSwaps={setShiftSwaps}
            setStatusBanner={setStatusBanner}
          />
        )}
        {essView === 'regularization' && (
          <PayrollRegularizationSection
            mode="employee"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name || 'Employee'}
            employees={essEmployeeList}
            requests={regularizationRequests}
            onChange={setRegularizationRequests}
            setStatusBanner={setStatusBanner}
          />
        )}
        {essView === 'helpdesk' && (
          <PayrollHelpDeskSection
            mode="employee"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name || 'Employee'}
            employees={essEmployeeList}
            tickets={helpDeskTickets}
            onChange={setHelpDeskTickets}
            setStatusBanner={setStatusBanner}
          />
        )}
        {essView === 'career' && (
          <>
            <PayrollLifecycleSection
              mode="employee"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Employee'}
              employees={essEmployeeList}
              events={lifecycleEvents}
              onChange={setLifecycleEvents}
              setStatusBanner={setStatusBanner}
            />
            <PayrollTalentSection
              mode="employee"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Employee'}
              employees={essEmployeeList}
              jobOpenings={jobOpenings}
              onChangeJobOpenings={setJobOpenings}
              candidates={candidates}
              onChangeCandidates={setCandidates}
              onboardingPlans={onboardingPlans}
              onChangeOnboardingPlans={setOnboardingPlans}
              performanceReviews={performanceReviews}
              onChangePerformanceReviews={setPerformanceReviews}
              trainingPrograms={trainingPrograms}
              onChangeTrainingPrograms={setTrainingPrograms}
              trainingNominations={trainingNominations}
              onChangeTrainingNominations={setTrainingNominations}
              setStatusBanner={setStatusBanner}
            />
          </>
        )}
        {essView === 'assets' && (
          <PayrollAssetsSection
            mode="employee"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name || 'Employee'}
            employees={essEmployeeList}
            categories={assetCategories}
            onChangeCategories={setAssetCategories}
            assets={assets}
            onChangeAssets={setAssets}
            allocations={assetAllocations}
            onChangeAllocations={setAssetAllocations}
            setStatusBanner={setStatusBanner}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className={asDedicatedPage ? "sh-scope fixed inset-0 z-50 flex flex-col bg-[#f8fafc] overflow-hidden text-xs" : "sh-scope fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-2 sm:p-3 overflow-hidden text-xs"}>
      {/* WIDE CONTAINER */}
      <div className={asDedicatedPage ? "w-full h-full bg-[#f8fafc] shadow-none border-none overflow-hidden flex flex-col" : "w-[98vw] max-w-[1680px] h-[94vh] max-h-[96vh] bg-[#f8fafc] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"}>
        {/* PAYCHAKRA TOP HEADER AND TOP NAVIGATION BAR */}
        <PayChakraHeader
          activeTab={payChakraTab}
          onSelectTab={(tab, sub) => {
            setPayChakraTab(tab);
            setAdminOpenCreate(false);
            setSectionAnchor(null);
            const focusAdmin = (section: string, openCreate = false) => {
              setActiveTab('admin_master');
              setAdminFocusSection(section);
              setAdminFocusNonce((n) => n + 1);
              setAdminOpenCreate(openCreate);
            };
            if (tab === 'overview') setActiveTab('overview');
            else if (tab === 'employees') {
              if (sub === 'org_structure') focusAdmin('org_masters');
              else if (sub === 'add_employee') focusAdmin('salary_master', true);
              else focusAdmin('salary_master');
            }
            else if (tab === 'attendance') {
              // Employees land on their own GPS-verified punch terminal, never the
              // company-wide admin dashboard.
              if (isAdminUser) setActiveTab('admin_dashboard');
              else { setPayChakraTab('overview'); setActiveTab('overview'); setEssView('dashboard'); }
            }
            else if (tab === 'leaves') setActiveTab('leaves');
            else if (tab === 'payroll') {
              if (sub === 'loans') setActiveTab('loans');
              else if (sub === 'tax') setActiveTab('tax');
              else if (sub === 'run_payroll') { setActiveTab('admin_master'); setSectionAnchor('payroll-processing'); }
              else setActiveTab('payslips');
            }
            else if (tab === 'expenses') setActiveTab('reimbursements');
            else if (tab === 'reports') setActiveTab('reports');
            else if (tab === 'administration') {
              if (sub === 'integrations') setActiveTab('integration');
              else if (sub === 'policies') focusAdmin('policy_master');
              else if (sub === 'audit') { setActiveTab('admin_master'); setSectionAnchor('payroll-audit-trail'); }
              else setActiveTab('admin_dashboard');
            }
            else if (tab === 'profile') setActiveTab('profile');
          }}
          searchQuery={globalPayrollSearch}
          onSearchChange={setGlobalPayrollSearch}
          onSwitchToCrm={onSwitchToCrm}
          onSignOut={onClose}
          onOpenProfile={() => {
            setPayChakraTab('profile');
            setActiveTab('profile');
          }}
          onOpenRunPayroll={() => {
            setPayChakraTab('payroll');
            setActiveTab('admin_master');
            setSectionAnchor('payroll-processing');
          }}
          onOpenAddEmployee={() => {
            setPayChakraTab('employees');
            setActiveTab('admin_master');
            setAdminFocusSection('salary_master');
            setAdminFocusNonce((n) => n + 1);
            setAdminOpenCreate(true);
          }}
          notificationsCount={3}
        />

        {/* SELF-SERVICE OVERVIEW — employees see only their own information */}
        {payChakraTab === 'overview' && !isAdminUser && essPortalView}

        {/* WORKFORCE OVERVIEW (admin only — company-wide workforce data) */}
        {payChakraTab === 'overview' && isAdminUser && (
          <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="p-3 sm:p-4 lg:p-6">
            <AdminDashboardSection
              employees={enrolledEmployees}
              leaves={leaves}
              claims={claims}
              regularization={regularizationRequests}
              swaps={shiftSwaps}
              tickets={helpDeskTickets}
              lifecycle={lifecycleEvents}
              jobOpenings={jobOpenings}
              candidates={candidates}
              payrollRuns={payrollRuns}
              locations={payrollLocations}
              policy={adminPolicyMaster}
              formatCurrency={formatCurrency}
              onNavigate={(target) => {
                if (target === 'employees') { setActiveTab('admin_master'); setAdminFocusSection('salary_master'); setAdminFocusNonce((n) => n + 1); }
                else if (target === 'payroll') { setActiveTab('admin_master'); setSectionAnchor('payroll-processing'); }
                else if (target === 'recruitment') { setActiveTab('admin_master'); setSectionAnchor('admin-talent'); }
                else setActiveTab('admin_master');
              }}
            />
          </div>
          <PayChakraOverviewView
            onNavigateTab={(tab, sub) => {
              setPayChakraTab(tab as PayChakraTab);
              if (tab === 'employees') setActiveTab('admin_master');
              else if (tab === 'attendance') setActiveTab('admin_dashboard');
              else if (tab === 'leaves') setActiveTab('leaves');
              else if (tab === 'payroll') setActiveTab(sub === 'loans' ? 'loans' : sub === 'tax' ? 'tax' : 'payslips');
              else if (tab === 'expenses') setActiveTab('reimbursements');
              else if (tab === 'reports') setActiveTab('reports');
              else if (tab === 'administration') setActiveTab(sub === 'integrations' ? 'integration' : 'admin_dashboard');
              else if (tab === 'profile') setActiveTab('profile');
            }}
            onPunchToggle={handleTogglePunch}
            isPunchedIn={Boolean(attendance.punchedIn)}
            activePunchTime={attendance.punchInTime || '09:30 AM'}
            onOpenAddEmployee={() => {
              setPayChakraTab('employees');
              setActiveTab('admin_master');
            }}
            onOpenRunPayroll={() => {
              setPayChakraTab('payroll');
              setActiveTab('payslips');
            }}
            onSwitchToCrm={onSwitchToCrm}
            onSignOut={onClose}
            searchFilter={globalPayrollSearch}
            pendingLeavesCount={leaves.filter((l) => l.status === 'Pending Approval').length}
            pendingClaimsCount={claims.filter((c) => c.status === 'Under Verification').length}
            pendingLoansCount={0}
          />
          </div>
        )}

        {/* PERSISTENT ALERT MESSAGE WHILE LOCATION IS OFF (Attendance Not Recorded) */}
        {locationOffAlertAction && (
          <div
            role="alert"
            className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-xs"
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <span className="font-bold text-rose-900">
                  Alert: Location is Turned OFF — Attendance Not Recorded!
                </span>{' '}
                <span className="text-rose-800">
                  Your{' '}
                  <strong>
                    {locationOffAlertAction === 'PUNCH_IN' ? 'Punch-In' : 'Punch-Out'}
                  </strong>{' '}
                  was not recorded because location is off. Attendance will not be recorded until you turn on location.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isFetchingLocation}
                onClick={handleConfirmShareLocationAndPunch}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {isFetchingLocation
                    ? 'Turning On Location...'
                    : `Turn On Location & ${
                        locationOffAlertAction === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'
                      }`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STATUS NOTIFICATION BANNER */}
        {statusBanner && (
          <div className="mx-5 mt-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN PORTAL BODY (SHOWN FOR DETAILED SUB-TABS) */}
        {payChakraTab !== 'overview' && (
          <div className="overflow-y-auto flex-1 p-3 sm:p-4 lg:p-6 space-y-4">
          {/* Employees get the same consistent navigation on every self-service tab */}
          {!isAdminUser && essNavBar}
          {/* Helper: No Enrolled Employees Empty State */}
          {(() => null)()}

          {/* Embedded iFrame Mode Banner */}
          {integrationConfig.launchMode === 'embedded_iframe' &&
            integrationConfig.portalUrl.trim() &&
            activeTab !== 'integration' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Link2 className="w-3.5 h-3.5 text-[#1f7e9e]" />
                    <span>
                      Embedded External Payroll Portal — {integrationConfig.providerLabel} (
                      {integrationConfig.portalUrl.trim()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setIntegrationConfig({
                          ...integrationConfig,
                          launchMode: 'integrated_ess',
                        })
                      }
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Switch to Native ESS View
                    </button>
                    <a
                      href={integrationConfig.portalUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-[#1f7e9e] text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Full Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <iframe
                  src={integrationConfig.portalUrl.trim()}
                  title="External Payroll ESS Portal"
                  className="w-full h-[440px] border-0 bg-slate-50"
                />
              </div>
            )}

          {/* TAB 1: ESS OVERVIEW & ATTENDANCE */}
          {activeTab === 'overview' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('Overview & Attendance')
            ) : (
            <div className="space-y-4">
              {/* Employee Master Profile & Self-Service Password Banner */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar
                    name={activeEmployee.name}
                    avatar={activeEmployee.avatar}
                    className="w-12 h-12 rounded-xl bg-[#1f7e9e] text-white font-bold text-base shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{activeEmployee.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[#1f7e9e] font-mono font-bold text-xs">
                        {statutory.empCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs">
                        {activeEmployee.designation || activeEmployee.role} · {activeEmployee.department}
                      </span>
                    </div>
                    <div className="text-slate-600 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Login Email ID: <strong className="font-mono text-slate-900">{activeEmployee.email}</strong>
                      </span>
                      {activeEmployee.phone && (
                        <span>
                          Phone: <strong className="font-mono text-slate-800">{activeEmployee.phone}</strong>
                        </span>
                      )}
                      <span>
                        Location: <strong className="text-slate-800">{activeEmployee.location}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Users className="w-3.5 h-3.5 text-[#1f7e9e]" />
                    <span>My Employee Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePwdForm({ current: '', next: '', confirm: '', show: false });
                      setChangePwdError(null);
                      setActiveTab('profile');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Password from Profile</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold whitespace-nowrap">
                    <span>Net Monthly Take-Home</span>
                    <Wallet className="w-4 h-4 text-[#1f7e9e] shrink-0" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums whitespace-nowrap">
                    {formatCurrency(salaryBreakdown.netPayable)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center justify-between whitespace-nowrap">
                    <span>
                      Paid: {salaryBreakdown.paidDays}/{salaryBreakdown.calendar.totalCalendarDays}d (LOP: {salaryBreakdown.lopDays}d)
                    </span>
                    <span>Work Days: {salaryBreakdown.calendar.scheduledWorkingDays}d</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold whitespace-nowrap">
                    <span>CRM Sales Incentive</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-1.5 font-mono tabular-nums whitespace-nowrap">
                    {formatCurrency(salaryBreakdown.incentive)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 whitespace-nowrap">
                    Auto-synced from CRM Orders ({activeUserMaster?.commissionPct ?? adminPolicyMaster.defaultSalesCommissionPct}%)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold whitespace-nowrap">
                    <span>Leave &amp; Grace Policy</span>
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums whitespace-nowrap">
                    {salaryBreakdown.monthlyLeaveLimit} Leave / Month
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between whitespace-nowrap">
                    <span>Paid Used: {salaryBreakdown.paidLeaveDaysAllowed}/{salaryBreakdown.monthlyLeaveLimit}d</span>
                    <span>Grace: {salaryBreakdown.graceUsedThisMonth}/{salaryBreakdown.graceLimitPerMonth}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 font-semibold whitespace-nowrap">
                    <span>Queued Reimbursements</span>
                    <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-1.5 font-mono tabular-nums whitespace-nowrap">
                    {formatCurrency(salaryBreakdown.approvedReimbursements)}
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-1 whitespace-nowrap">
                    {claims.filter((c) => c.status === 'Approved & Queued for Payroll').length}{' '}
                    claim(s) in next cycle
                  </div>
                </div>
              </div>

              {/* Employee Shift & Recent Attendance Log */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 whitespace-nowrap">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Employee Shift &amp; Work Mode
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Daily biometric / web attendance sync
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        attendance.punchedIn ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {attendance.punchedIn ? 'Present · Checked In' : 'Checked Out'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-slate-700 block whitespace-nowrap">
                      Select Work Location Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Office HQ', 'Work From Home', 'Client Site Visit'] as const).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setAttendance({ ...attendance, workMode: mode })}
                            className={`px-2 py-2 rounded-lg font-semibold text-[11px] border text-center whitespace-nowrap transition cursor-pointer ${
                              attendance.workMode === mode
                                ? 'bg-[#1f7e9e]/10 border-[#1f7e9e] text-[#1f7e9e] font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {mode}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Policy Rollout Code:</span>
                      <span className="font-mono font-bold text-[#1f7e9e]">
                        {COREENACT_HR_POLICY_CS_001.code} · v{COREENACT_HR_POLICY_CS_001.version}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Standard Office Timings:</span>
                      <span className="font-bold text-slate-900">
                        09:30 AM – 06:00 PM IST
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Weekly Holidays:</span>
                      <span className="font-semibold text-slate-800">
                        2nd &amp; 4th Sat + Sundays
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Working Saturdays:</span>
                      <span className="font-semibold text-emerald-700">
                        1st, 3rd &amp; 5th Saturdays
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Today&apos;s Calendar Rule:</span>
                      <span
                        className={`font-bold ${
                          saturdayCalendarInfo.isHoliday ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {saturdayCalendarInfo.badge}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap pt-1 border-t border-slate-200/70">
                      <span className="text-slate-500">Actual Punch-In:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {attendance.punchInTime || 'Not Punched In'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Recorded In (Policy):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currentPolicyEval.recordedInTime || '—'}
                        {currentPolicyEval.earlyArrivalCapped && (
                          <span className="ml-1 text-[10px] text-amber-700 font-semibold">
                            (&lt;9:00 AM Capped)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Punch-Out Time:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {attendance.punchOutTime ||
                          (attendance.punchedIn ? 'Active Shift (Till 6:00 PM)' : 'Not Punched Out')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Grace Used (Until 9:45 AM):</span>
                      <span className="font-mono font-bold text-sky-700">
                        {attendance.graceUsedThisMonth || 0} / 3 This Month
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Late-Coming Cycle Count:</span>
                      <span className="font-mono font-bold text-amber-700">
                        Instance #{attendance.lateCountThisMonth || 0} (4th &amp; 8th = Half Day)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs whitespace-nowrap">
                      <span className="text-slate-500">Daily Break (1:00–2:00 PM):</span>
                      <span
                        className={`font-mono font-bold ${
                          (attendance.breakDurationMins || 45) <= 60
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {attendance.breakDurationMins || 45} mins (Max 1 Hr)
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">CS-HR-POL-001 Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          currentPolicyEval.finalStatus === 'Regular Day'
                            ? 'bg-emerald-100 text-emerald-800'
                            : currentPolicyEval.finalStatus === 'On Time (Grace Used)'
                            ? 'bg-sky-100 text-sky-800'
                            : currentPolicyEval.finalStatus === 'Late'
                            ? 'bg-amber-100 text-amber-900'
                            : currentPolicyEval.finalStatus === 'Half Day'
                            ? 'bg-amber-200 text-amber-950'
                            : currentPolicyEval.finalStatus === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {currentPolicyEval.finalStatus}
                        {currentPolicyEval.deductionDays > 0
                          ? ` (-${currentPolicyEval.deductionDays} Day)`
                          : ''}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 leading-snug bg-white p-2 rounded border border-slate-200/80">
                      {currentPolicyEval.summaryCitation}
                    </div>
                  </div>

                  {/* Interactive Break, Approval & Policy Rule Controls */}
                  {!isAdminUser ? (
                    /* REGULAR USER / EMPLOYEE: ZERO EDITABLE RIGHTS PER CS-HR-POL-001 */
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                          <span>Break &amp; Approval Controls (CS-HR-POL-001)</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          <Lock className="w-2.5 h-2.5 text-slate-500" /> Read-Only · Policy Locked
                        </span>
                      </div>

                      {/* Explicit Strict Enforcement Notice */}
                      <div className="flex items-start gap-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded-lg text-[10.5px] text-amber-900 leading-snug">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">CS-HR-POL-001 Policy Enforcement:</span> Employees do not have editable rights to modify break duration, alter late arrival cycles, or self-certify approvals. All parameters are governed strictly by HR and verified punch logs.
                        </div>
                      </div>

                      {/* Read-Only Attendance Rule Displays */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-slate-500">Break Taken Today</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                (attendance.breakDurationMins || 45) <= 60
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {(attendance.breakDurationMins || 45) <= 60 ? 'Policy Compliant' : 'Exceeds 60m Limit'}
                            </span>
                          </div>
                          <div className="text-sm font-bold font-mono text-slate-900">
                            {attendance.breakDurationMins || 45} mins
                          </div>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">
                            Standard window: 1:00 PM – 2:00 PM (Max 60 mins). Automated via punch log.
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-slate-500">Late Count This Month</span>
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900">
                              System Tracked
                            </span>
                          </div>
                          <div className="text-sm font-bold font-mono text-slate-900">
                            Instance #{attendance.lateCountThisMonth || 0}
                          </div>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">
                            4th &amp; 8th late instances result in Half Day deduction per CS-HR-POL-001.
                          </div>
                        </div>
                      </div>

                      {/* Prior Manager/HR Approval Status (Read-Only) */}
                      <div className="p-2.5 rounded-lg border bg-white border-slate-200/80 shadow-2xs">
                        <div className="text-[10px] font-semibold text-slate-500 mb-1.5">
                          Prior Manager/HR Approval Status
                        </div>
                        {attendance.hasPriorApproval ? (
                          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200/80">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <div className="font-bold text-[11px]">Prior Manager/HR Approval Verified</div>
                              <div className="text-[10px] text-emerald-700">Official authorization on record for shift deviation or early departure.</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-[11px] text-slate-800">No Prior Approval on File (Self-Certification Disabled)</div>
                              <div className="text-[10px] text-slate-500 leading-tight">
                                Employees cannot self-grant approvals. To apply for scheduled early exit, half day, or emergency intimation, submit a formal request via the <span className="font-semibold text-slate-700">Prior Approval</span> tab.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ADMIN / HR OVERRIDE CONTROLS (ONLY ACCESSIBLE TO ADMINISTRATORS) */
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-[11px]">
                      <div className="font-bold text-amber-950 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Break &amp; Approval Controls (CS-HR-POL-001)</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800">
                          Admin / HR Override Mode
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-800 leading-snug">
                        Administrator Access: You have authorized management rights to override employee break duration, edit monthly late cycle count, and grant prior approvals under CS-HR-POL-001.
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            Break Taken Today
                          </label>
                          <select
                            value={attendance.breakDurationMins || 45}
                            onChange={(e) =>
                              setAttendance({
                                ...attendance,
                                breakDurationMins: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold"
                          >
                            <option value={30}>30 mins (1:00–1:30 PM)</option>
                            <option value={45}>45 mins (1:00–1:45 PM)</option>
                            <option value={60}>60 mins (1:00–2:00 PM Max)</option>
                            <option value={90}>90 mins (&gt;1 Hr Extended Break)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            Late Count This Month
                          </label>
                          <select
                            value={attendance.lateCountThisMonth || 0}
                            onChange={(e) =>
                              setAttendance({
                                ...attendance,
                                lateCountThisMonth: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold"
                          >
                            <option value={0}>0 Late Instances</option>
                            <option value={1}>1st Late -&gt; Late</option>
                            <option value={2}>2nd Late -&gt; Late</option>
                            <option value={3}>3rd Late -&gt; Late</option>
                            <option value={4}>4th Late -&gt; Half Day</option>
                            <option value={5}>5th Late -&gt; Late</option>
                            <option value={6}>6th Late -&gt; Late</option>
                            <option value={7}>7th Late -&gt; Late</option>
                            <option value={8}>8th Late -&gt; Half Day</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(attendance.hasPriorApproval)}
                            onChange={(e) =>
                              setAttendance({
                                ...attendance,
                                hasPriorApproval: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300"
                          />
                          <span className="font-semibold text-slate-700">
                            Prior Manager/HR Approval Obtained
                          </span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(attendance.managementAuthorizedEarly)}
                            onChange={(e) =>
                              setAttendance({
                                ...attendance,
                                managementAuthorizedEarly: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300"
                          />
                          <span className="font-semibold text-indigo-800">
                            Authorize &lt;9:00 AM Extra Time
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Google Maps Live Punch Location Verification Card */}
                  <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/90 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Navigation className="w-3.5 h-3.5 text-[#1f7e9e] shrink-0" />
                        <span>Google Location Verification</span>
                      </div>
                      <button
                        type="button"
                        disabled={isFetchingLocation}
                        onClick={handleTogglePunch}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition ${
                          attendance.punchedIn
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {attendance.punchedIn ? (
                          <>
                            <LogOut className="w-3 h-3" />
                            <span>Punch Out + Location</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3 h-3" />
                            <span>Punch In + Location</span>
                          </>
                        )}
                      </button>
                    </div>

                    {(() => {
                      const activeLoc =
                        (!attendance.punchedIn && attendance.punchOutLocation) ||
                        attendance.punchInLocation;
                      return (
                        <>
                          {activeLoc ? (
                            <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                              {mapsApiKey ? (
                                <APIProvider apiKey={mapsApiKey} libraries={GMP_LIBRARIES}>
                                  <Map
                                    key={`${activeLoc.lat}-${activeLoc.lng}`}
                                    mapId="DEMO_MAP_ID"
                                    internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
                                    defaultCenter={{ lat: activeLoc.lat, lng: activeLoc.lng }}
                                    defaultZoom={15}
                                    gestureHandling="cooperative"
                                    disableDefaultUI={true}
                                    className="w-full h-full"
                                  >
                                    <AdvancedMarker
                                      position={{ lat: activeLoc.lat, lng: activeLoc.lng }}
                                      title={activeLoc.formattedAddress}
                                    />
                                  </Map>
                                </APIProvider>
                              ) : (
                                <iframe
                                  key={`${activeLoc.lat}-${activeLoc.lng}`}
                                  title="Punch Location Map"
                                  src={`https://maps.google.com/maps?q=${activeLoc.lat},${activeLoc.lng}&z=15&output=embed`}
                                  className="w-full h-full border-0"
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                />
                              )}
                            </div>
                          ) : null}

                          <div className="space-y-1.5 text-[11px]">
                            {attendance.punchInLocation ? (
                              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase">
                                  <span>Punch-In Location ({attendance.punchInTime})</span>
                                  <span className="font-mono">
                                    {attendance.punchInLocation.lat.toFixed(4)},{' '}
                                    {attendance.punchInLocation.lng.toFixed(4)}
                                  </span>
                                </div>
                                <div className="text-slate-800 font-medium mt-0.5 leading-snug">
                                  {attendance.punchInLocation.formattedAddress}
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  Google Maps
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 italic">
                                Punch in with Location Sharing enabled to fetch your Google Maps address.
                              </div>
                            )}

                            {attendance.punchOutLocation && (
                              <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                <div className="flex items-center justify-between text-[10px] font-bold text-rose-700 uppercase">
                                  <span>Punch-Out Location ({attendance.punchOutTime})</span>
                                  <span className="font-mono">
                                    {attendance.punchOutLocation.lat.toFixed(4)},{' '}
                                    {attendance.punchOutLocation.lng.toFixed(4)}
                                  </span>
                                </div>
                                <div className="text-slate-800 font-medium mt-0.5 leading-snug">
                                  {attendance.punchOutLocation.formattedAddress}
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  Google Maps
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('payslips')}
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-center whitespace-nowrap transition cursor-pointer"
                    >
                      View Payslips
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leaves')}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-center whitespace-nowrap transition cursor-pointer"
                    >
                      Apply Leave
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs overflow-hidden">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 whitespace-nowrap">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Recent Attendance &amp; Timesheet Log
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Synced with {integrationConfig.providerLabel} Attendance Register
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">
                      100% Attendance This Month
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table-modern w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase whitespace-nowrap">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Work Mode</th>
                          <th className="py-2 px-3">Check-In</th>
                          <th className="py-2 px-3">Check-Out</th>
                          <th className="py-2 px-3">Google Maps Punch Location</th>
                          <th className="py-2 px-3">Logged Hours</th>
                          <th className="py-2 px-3 text-right">Payroll Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        <tr className="bg-sky-50/40 whitespace-nowrap">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            Today ({todayIso})
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#1f7e9e]">
                            {attendance.workMode}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <div>{attendance.punchInTime || 'Not Recorded'}</div>
                            {salaryBreakdown.shiftHours.earlyArrivalCapped && (
                              <div className="text-[10px] text-indigo-700 font-semibold">
                                Rec: 09:00 AM (&lt;9 AM Rule)
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {attendance.punchOutTime ||
                              (attendance.punchedIn ? 'In Progress (6:00 PM Close)' : 'Not Recorded')}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate">
                            {attendance.punchOutLocation ? (
                              <span
                                className="inline-flex items-center gap-1 text-slate-700"
                                title={`Out: ${attendance.punchOutLocation.formattedAddress}`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="truncate">
                                  Out ({attendance.punchOutLocation.lat.toFixed(4)},{' '}
                                  {attendance.punchOutLocation.lng.toFixed(4)}):{' '}
                                  {attendance.punchOutLocation.formattedAddress}
                                </span>
                              </span>
                            ) : attendance.punchInLocation ? (
                              <span
                                className="inline-flex items-center gap-1 text-slate-700"
                                title={`In: ${attendance.punchInLocation.formattedAddress}`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">
                                  In ({attendance.punchInLocation.lat.toFixed(4)},{' '}
                                  {attendance.punchInLocation.lng.toFixed(4)}):{' '}
                                  {attendance.punchInLocation.formattedAddress}
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                Turn on location &amp; punch in to record
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold">
                            {attendance.punchOutTime ? (
                              <div>
                                <div>{salaryBreakdown.shiftHours.netHoursFormatted} Net</div>
                                <div className="text-[10px] text-slate-500">
                                  ({salaryBreakdown.shiftHours.grossHoursFormatted} - 1h break)
                                </div>
                              </div>
                            ) : attendance.punchedIn ? (
                              'Active Shift'
                            ) : (
                              '00h 00m'
                            )}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              currentPolicyEval.finalStatus === 'Regular Day'
                                ? 'text-emerald-700'
                                : currentPolicyEval.finalStatus === 'On Time (Grace Used)'
                                ? 'text-sky-700'
                                : currentPolicyEval.finalStatus === 'Absent'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            <div>{currentPolicyEval.finalStatus}</div>
                            {currentPolicyEval.deductionDays > 0 && (
                              <div className="text-[10px] text-rose-600 font-mono">
                                -{currentPolicyEval.deductionDays}d LOP
                              </div>
                            )}
                          </td>
                        </tr>
                        {attendance.punchHistory && attendance.punchHistory.length > 0 ? (
                          attendance.punchHistory.slice(0, 10).map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-slate-50 whitespace-nowrap">
                              <td className="py-2.5 px-3 font-medium text-slate-800">{row.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-[#1f7e9e]">{row.workMode}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                {row.action === 'PUNCH_IN' ? row.time : '—'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                {row.action === 'PUNCH_OUT' ? row.time : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                                  <span className="truncate">
                                    {row.location?.formattedAddress || 'Location Recorded'}
                                  </span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                Recorded
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                {row.action === 'PUNCH_IN' ? 'Punch In Recorded' : 'Punch Out Recorded'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                              No prior attendance history recorded for {activeEmployee?.name || 'this employee'}. Use Punch In / Punch Out to log shift records.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Live Punch-In / Punch-Out Location Audit Log */}
                  {attendance.punchHistory && attendance.punchHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Today&apos;s Google Maps Punch-In / Punch-Out Location Log
                        </span>
                        <span className="text-[11px] text-slate-500">Google Maps</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {attendance.punchHistory.map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase shrink-0 ${
                                  item.action === 'PUNCH_IN'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.action === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'}
                              </span>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                {item.time}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="font-semibold text-[#1f7e9e] shrink-0">
                                {item.workMode}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-700 truncate">
                                {item.location.formattedAddress}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                              {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COREENACT SOLUTIONS · POLICY CS-HR-POL-001 · VERSION 1.0 FULL POLICY BOARD */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                      {COREENACT_HR_POLICY_CS_001.organization}
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {adminPolicyMaster.policyTitle || COREENACT_HR_POLICY_CS_001.title} — Policy{' '}
                      {adminPolicyMaster.policyCode || COREENACT_HR_POLICY_CS_001.code} · Version{' '}
                      {adminPolicyMaster.policyVersion || COREENACT_HR_POLICY_CS_001.version}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {isAdminUser && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditingBoardPolicy((prev) => !prev)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            isEditingBoardPolicy
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-[#1f7e9e] hover:bg-[#17647e] text-white'
                          }`}
                        >
                          {isEditingBoardPolicy
                            ? 'Close Inline Policy Editor'
                            : 'Edit & Apply All Policies (Admin)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('admin_master')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Full Admin Policy Master
                        </button>
                      </>
                    )}
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                      Active &amp; Enforced in Payroll
                    </span>
                  </div>
                </div>

                {/* INLINE ADMIN EDITABLE POLICY FORM ON THE ROLLOUT BOARD */}
                {isAdminUser && isEditingBoardPolicy && (
                  <div className="p-4 bg-amber-50/70 border-b border-amber-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-amber-950">
                          Admin Editable Policy Configuration — Apply Across All Employees &amp; Payroll
                        </div>
                        <div className="text-[11px] text-amber-900">
                          Modify any policy rule below and click &ldquo;Save &amp; Apply All Policies&rdquo; to update all calculations immediately.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const reset = {
                              ...DEFAULT_ADMIN_POLICY_MASTER,
                              lastPublishedMonth: adminPolicyMaster.lastPublishedMonth,
                            };
                            setAdminPolicyMaster(reset);
                            saveAdminPolicyMaster(reset, true);
                            setStatusBanner(
                              'Reset all policies to official Coreenact Solutions Policy CS-HR-POL-001 v1.0 defaults.'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                        >
                          Reset Defaults
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveAdminPolicyMaster(adminPolicyMaster, true);
                            setEmployeeSalaryMasters((prev) => {
                              const next = { ...prev };
                              Object.keys(next).forEach((uid) => {
                                next[uid] = {
                                  ...next[uid],
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
                              });
                              return next;
                            });
                            setStatusBanner(
                              `Saved & Applied all policies (${adminPolicyMaster.shiftStartTime}–${
                                adminPolicyMaster.shiftEndTime
                              }, Early Floor ${
                                adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'
                              }, Grace ${adminPolicyMaster.monthlyGraceLimit ?? 3}x until ${
                                adminPolicyMaster.graceEndTime || '09:45 AM'
                              }, Every ${adminPolicyMaster.lateCycleHalfDayNth ?? 4}th Late = ${
                                adminPolicyMaster.lateCycleDeductionDays ?? 0.5
                              }d LOP, ${adminPolicyMaster.monthlyLeaveLimit ?? 1} Leave/Mo) across payroll.`
                            );
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Save &amp; Apply All Policies
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Shift Start
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.shiftStartTime}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              shiftStartTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Shift End
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.shiftEndTime}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              shiftEndTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Early Floor
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              earlyArrivalCutoff: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Grace Until
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.graceEndTime || '09:45 AM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              graceEndTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Grace / Month
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={adminPolicyMaster.monthlyGraceLimit ?? 3}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              monthlyGraceLimit: Number(e.target.value),
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Nth Late = Half Day
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={adminPolicyMaster.lateCycleHalfDayNth ?? 4}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              lateCycleHalfDayNth: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Paid Leave / Mo
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={adminPolicyMaster.monthlyLeaveLimit ?? 1}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              monthlyLeaveLimit: Number(e.target.value),
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Midday Start
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.middayEntryStartTime || '12:00 PM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              middayEntryStartTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Midday End
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.middayEntryEndTime || '01:00 PM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              middayEntryEndTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Exit Absent &lt;
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.earlyExitAbsentBeforeTime || '12:30 PM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              earlyExitAbsentBeforeTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Regular Exit &gt;
                        </label>
                        <input
                          type="text"
                          value={adminPolicyMaster.earlyExitHalfDayEndTime || '04:00 PM'}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              earlyExitHalfDayEndTime: e.target.value,
                              regularExitAfterTime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          Max Break (m)
                        </label>
                        <input
                          type="number"
                          min={15}
                          value={adminPolicyMaster.maxBreakDurationMins ?? 60}
                          onChange={(e) =>
                            setAdminPolicyMaster({
                              ...adminPolicyMaster,
                              maxBreakDurationMins: Number(e.target.value),
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-xs">
                  {/* 1. Working Hours & Weekly Holidays */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      1. Working Hours &amp; Weekly Holidays
                    </div>
                    <div className="space-y-1.5 text-slate-700">
                      <div>
                        <strong className="text-slate-900">
                          {adminPolicyMaster.shiftStartTime} – {adminPolicyMaster.shiftEndTime}:
                        </strong>{' '}
                        Standard office timings. Report by {adminPolicyMaster.shiftStartTime} and
                        stay available during working hours.
                      </div>
                      <div>
                        <strong className="text-slate-900">
                          Holidays (
                          {adminPolicyMaster.weeklyHolidaySaturdays ||
                            '2nd & 4th Saturdays + All Sundays'}
                          ):
                        </strong>{' '}
                        Weekly off days per active policy.
                      </div>
                      <div>
                        <strong className="text-slate-900">
                          Working ({adminPolicyMaster.workingSaturdays || '1st, 3rd & 5th Saturdays'}
                          ):
                        </strong>{' '}
                        5th Saturday applies wherever relevant.
                      </div>
                    </div>
                  </div>

                  {/* 2. Early Arrival & Grace Period */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      2. Early Arrival &amp; Grace Period
                    </div>
                    <div className="space-y-1.5 text-slate-700">
                      <div>
                        <strong className="text-slate-900">
                          Before {adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'} (Recorded as{' '}
                          {adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}):
                        </strong>{' '}
                        Early arrival is not extra working time unless management authorizes it.
                      </div>
                      <div>
                        <strong className="text-slate-900">
                          Until {adminPolicyMaster.graceEndTime || '09:45 AM'} (Grace,{' '}
                          {adminPolicyMaster.monthlyGraceLimit ?? 3} times per month):
                        </strong>{' '}
                        For occasional delays only. It does not extend the{' '}
                        {adminPolicyMaster.shiftStartTime} reporting time.
                      </div>
                    </div>
                  </div>

                  {/* 3. Late-Coming Cycle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      3. Late-Coming Cycle (Every {adminPolicyMaster.lateCycleHalfDayNth ?? 4}th ={' '}
                      {adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP)
                    </div>
                    <table className="w-full text-[11px] border border-slate-200 rounded overflow-hidden">
                      <thead className="bg-slate-200/70 text-slate-700 font-bold">
                        <tr>
                          <th className="py-1 px-2 text-left">Late Instance</th>
                          <th className="py-1 px-2 text-left">Treatment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="py-1 px-2 font-medium">
                            1st to {(adminPolicyMaster.lateCycleHalfDayNth ?? 4) - 1}th
                          </td>
                          <td className="py-1 px-2 text-amber-700 font-bold">Late</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-medium">
                            {adminPolicyMaster.lateCycleHalfDayNth ?? 4}th
                          </td>
                          <td className="py-1 px-2 text-rose-700 font-bold">
                            Half Day ({adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-medium">
                            {(adminPolicyMaster.lateCycleHalfDayNth ?? 4) + 1}th to{' '}
                            {(adminPolicyMaster.lateCycleHalfDayNth ?? 4) * 2 - 1}th
                          </td>
                          <td className="py-1 px-2 text-amber-700 font-bold">Late</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 font-medium">
                            {(adminPolicyMaster.lateCycleHalfDayNth ?? 4) * 2}th
                          </td>
                          <td className="py-1 px-2 text-rose-700 font-bold">
                            Half Day ({adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="text-[10px] text-slate-500">
                      The cycle continues through the month. Repeated lateness may lead to further
                      action.
                    </div>
                  </div>

                  {/* 4. Midday Entry & Early Exit */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      4. Midday Entry &amp; Early Exit (Without Approval)
                    </div>
                    <table className="w-full text-[11px] border border-slate-200 rounded overflow-hidden">
                      <thead className="bg-slate-200/70 text-slate-700 font-bold">
                        <tr>
                          <th className="py-1 px-2 text-left">Situation (without approval)</th>
                          <th className="py-1 px-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="py-1 px-2">
                            Entry between {adminPolicyMaster.middayEntryStartTime || '12:00 PM'} and{' '}
                            {adminPolicyMaster.middayEntryEndTime || '01:00 PM'}
                          </td>
                          <td className="py-1 px-2 font-bold text-amber-800">Half Day</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2">
                            Exit before {adminPolicyMaster.earlyExitAbsentBeforeTime || '12:30 PM'}
                          </td>
                          <td className="py-1 px-2 font-bold text-rose-700">Absent</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2">
                            Exit between {adminPolicyMaster.earlyExitAbsentBeforeTime || '12:30 PM'}{' '}
                            and {adminPolicyMaster.earlyExitHalfDayEndTime || '04:00 PM'}
                          </td>
                          <td className="py-1 px-2 font-bold text-amber-800">Half Day</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2">
                            Exit after {adminPolicyMaster.earlyExitHalfDayEndTime || '04:00 PM'}
                          </td>
                          <td className="py-1 px-2 font-bold text-emerald-700">
                            Regular day, if hours &amp; break rules met
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 5. Leave, Breaks & Approvals */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      5. Leave, Breaks &amp; Approvals
                    </div>
                    <div className="space-y-1.5 text-slate-700">
                      <div>
                        <strong className="text-slate-900">
                          {adminPolicyMaster.monthlyLeaveLimit ?? 1} leave per month:
                        </strong>{' '}
                        Request in advance. Absence without approval is unauthorized absence.
                      </div>
                      <div>
                        <strong className="text-slate-900">
                          {adminPolicyMaster.maxBreakDurationMins ?? 60} mins break per working day (
                          {adminPolicyMaster.dailyBreakWindow || '1:00 PM to 2:00 PM'}):
                        </strong>{' '}
                        Total break time must not exceed {adminPolicyMaster.maxBreakDurationMins ?? 60}{' '}
                        minutes.
                      </div>
                      <div>
                        <strong className="text-slate-900">Approval – Get it first:</strong> Planned
                        leave, early exit, half days, extended breaks. In emergencies, tell your
                        manager or HR quickly.
                      </div>
                    </div>
                  </div>

                  {/* 6. Your Responsibilities */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-[#1f7e9e]">
                      6. Your Responsibilities
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {COREENACT_HR_POLICY_CS_001.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 2: PAYSLIPS & SALARY STRUCTURE */}
          {activeTab === 'payslips' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('Payslips & Salary Structure')
            ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-3 whitespace-nowrap">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                      Select Payroll Period
                    </label>
                    <select
                      value={selectedMonthKey}
                      onChange={(e) => setSelectedMonthKey(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#1f7e9e]"
                    >
                      {PAYSLIP_MONTHS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label} (Disbursed: {m.payDate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-slate-200" />

                  <div className="text-xs">
                    <div className="text-slate-500">Disbursement Status</div>
                    <div className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Credited on {selectedMonthMeta.payDate} via NEFT</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin_master')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit CTC Structure</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={() => {
                      if (!isPayslipPreviewOpen) {
                        setIsPayslipPreviewOpen(true);
                      }
                      setTimeout(() => {
                        handleDownloadSalarySlipPdf();
                      }, 250);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title={`Download Salary Slip PDF for ${selectedMonthMeta.label} with company logo`}
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPayslipPreviewOpen(true)}
                    className="px-4 py-2 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View &amp; Print Official Payslip</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-sky-400 font-bold">
                      {supplierCompany?.name || 'Enterprise CRM'} · Official Monthly Salary Slip
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Payslip for {selectedMonthMeta.label}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 truncate">
                      Employee: <strong className="text-white">{activeEmployee.name}</strong> (
                      {statutory.empCode}) · PAN: {statutory.panNumber} · UAN: {statutory.uanNumber}
                    </p>
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Net Salary Credited (Policy CS-HR-POL-001)
                    </div>
                    <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                      {formatCurrency(salaryBreakdown.netPayable)}
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                      Paid: {salaryBreakdown.paidDays}/{salaryBreakdown.calendar.totalCalendarDays}d · LOP: {salaryBreakdown.lopDays}d
                    </div>
                  </div>
                </div>

                {/* POLICY CS-HR-POL-001 MONTHLY CALCULATION ENGINE BREAKDOWN */}
                <div className="px-5 pt-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                          Policy CS-HR-POL-001 · Monthly Attendance, Working Hours &amp; Leave Calculation Sheet
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          All salary, working day, grace, late-coming cycle, midday/early-exit, and 1-leave/month calculations are strictly computed per Policy CS-HR-POL-001 v1.0.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] shrink-0">
                        Per-Day Rate: {formatCurrency(salaryBreakdown.perCalendarDayRate)}/day ({formatCurrency(salaryBreakdown.perWorkingDayRate)}/work day)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-[#1f7e9e]">
                          1. Calendar &amp; Working Days
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Calendar Days:</span>
                          <span className="font-mono font-bold">{salaryBreakdown.calendar.totalCalendarDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Weekly Offs (2nd/4th Sat + Sun):</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {salaryBreakdown.calendar.secondAndFourthSaturdaysCount} Sat + {salaryBreakdown.calendar.sundaysCount} Sun = {salaryBreakdown.calendar.totalWeeklyHolidays}d
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Working Saturdays (1st/3rd/5th):</span>
                          <span className="font-mono font-semibold text-emerald-700">
                            {salaryBreakdown.calendar.workingSaturdaysCount} Days
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-slate-900">
                          <span>Scheduled Working Days:</span>
                          <span className="font-mono">{salaryBreakdown.calendar.scheduledWorkingDays}d ({salaryBreakdown.calendar.totalMonthlyNetWorkingHours}h)</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-[#1f7e9e]">
                          2. Grace &amp; Late-Coming Cycle
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Grace (&le;9:45 AM, Max 3/Mo):</span>
                          <span className="font-mono font-semibold text-sky-700">
                            {salaryBreakdown.graceUsedThisMonth}/{salaryBreakdown.graceLimitPerMonth} Used (₹0 Ded.)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Late Instances (&gt;9:45 AM):</span>
                          <span className="font-mono font-bold text-slate-900">
                            #{salaryBreakdown.lateCountThisMonth} This Month
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">4th &amp; 8th Late = Half Day:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {salaryBreakdown.lateCycleHalfDays}d LOP
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-rose-700">
                          <span>Late-Cycle Deduction:</span>
                          <span className="font-mono">-{formatCurrency(salaryBreakdown.lateCycleDeductionAmount)}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-[#1f7e9e]">
                          3. Midday Entry, Exit &amp; Break
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Early Arrival (&lt;9:00 AM):</span>
                          <span className="font-mono font-semibold text-indigo-700">
                            {salaryBreakdown.shiftHours.earlyArrivalCapped ? 'Rec as 09:00 AM' : 'Standard'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Midday Entry / Early Exit LOP:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {salaryBreakdown.middayOrEarlyExitLopDays}d
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Break (&gt;1 Hr / 1–2 PM) LOP:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {salaryBreakdown.breakViolationLopDays}d
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-rose-700">
                          <span>Entry/Exit/Break Deduction:</span>
                          <span className="font-mono">-{formatCurrency(salaryBreakdown.middayOrEarlyExitDeductionAmount)}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold uppercase text-[#1f7e9e]">
                          4. Leave Quota (1 Leave / Month)
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Paid Leave Allowed (1/Mo):</span>
                          <span className="font-mono font-semibold text-emerald-700">
                            {salaryBreakdown.paidLeaveDaysAllowed}/{salaryBreakdown.monthlyLeaveLimit}d Paid
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Excess Leave (&gt;1/Mo) LOP:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {salaryBreakdown.excessMonthlyLeaveLopDays}d LOP
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Unauthorized Absence LOP:</span>
                          <span className="font-mono font-bold text-rose-700">
                            {salaryBreakdown.unauthorizedAbsenceLopDays}d LOP
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-rose-700">
                          <span>Leave Policy Deduction:</span>
                          <span className="font-mono">-{formatCurrency(salaryBreakdown.leavePolicyDeductionAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-slate-700">
                        <strong>Fixed Monthly Gross:</strong>{' '}
                        <span className="font-mono font-bold">{formatCurrency(salaryBreakdown.baseMonthlyGross)}</span>
                        {' · '}
                        <strong>Total Policy LOP ({salaryBreakdown.lopDays}d):</strong>{' '}
                        <span className="font-mono font-bold text-rose-700">
                          -{formatCurrency(salaryBreakdown.policyLopDeductionAmount)}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        Pro-Rata Payable Gross ({salaryBreakdown.paidDays}/{salaryBreakdown.calendar.totalCalendarDays} Days):{' '}
                        <span className="font-mono text-emerald-700">
                          {formatCurrency(salaryBreakdown.adjustedGross)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50/70 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center font-bold text-slate-800 whitespace-nowrap">
                      <span>Earnings &amp; Allowances</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="divide-y divide-slate-100 p-4 space-y-2.5">
                      <div className="flex justify-between pt-1 whitespace-nowrap">
                        <span className="text-slate-600">Basic Salary</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(salaryBreakdown.basic)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2.5 whitespace-nowrap">
                        <span className="text-slate-600">House Rent Allowance (HRA)</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(salaryBreakdown.hra)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2.5 whitespace-nowrap">
                        <span className="text-slate-600">Special &amp; Executive Allowance</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(salaryBreakdown.specialAllowance)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2.5 whitespace-nowrap">
                        <span className="text-slate-600">Conveyance &amp; Medical Allowance</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(salaryBreakdown.conveyance)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2.5 whitespace-nowrap">
                        <span className="text-emerald-700 font-semibold">
                          CRM Performance / Sales Incentive
                        </span>
                        <span className="font-mono font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(salaryBreakdown.incentive)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-slate-900 text-sm whitespace-nowrap">
                        <span>Gross Monthly Earnings (A)</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(salaryBreakdown.grossEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-rose-50/70 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center gap-2 font-bold text-slate-800 whitespace-nowrap min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">Statutory &amp; Tax Deductions</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                            <Lock className="w-2.5 h-2.5 text-rose-700 shrink-0" />
                            <span>Locked until Admin Edits</span>
                          </span>
                        </div>
                        <span className="shrink-0">Amount (INR)</span>
                      </div>
                      <div className="divide-y divide-slate-100 p-4 space-y-2.5">
                        <div className="flex justify-between items-center pt-1 whitespace-nowrap gap-2">
                          <span className="text-slate-600">
                            Employee Provident Fund (PF Amount)
                          </span>
                          {isAdminUser && activeUserMaster ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-semibold">Edit ₹:</span>
                              <input
                                type="number"
                                min={0}
                                value={
                                  activeUserMaster.pfAmount !== undefined &&
                                  Number.isFinite(Number(activeUserMaster.pfAmount))
                                    ? activeUserMaster.pfAmount
                                    : salaryBreakdown.pfDeduction
                                }
                                onChange={(e) => {
                                  const nextPf = Math.max(0, Math.round(Number(e.target.value) || 0));
                                  setEmployeeSalaryMasters((prev) => ({
                                    ...prev,
                                    [activeUserMaster.userId]: {
                                      ...activeUserMaster,
                                      pfAmount: nextPf,
                                      deductionsLockedByAdmin: true,
                                    },
                                  }));
                                }}
                                className="w-24 bg-rose-50 border border-rose-300 rounded px-2 py-0.5 text-right font-mono font-bold text-xs text-rose-900"
                                title="Admin: Directly edit fixed PF deduction amount (₹)"
                              />
                            </div>
                          ) : (
                            <span className="font-mono font-semibold text-rose-700 tabular-nums">
                              - {formatCurrency(salaryBreakdown.pfDeduction)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between pt-2.5 whitespace-nowrap">
                          <span className="text-slate-600">Professional Tax (PT)</span>
                          <span className="font-mono font-semibold text-rose-700 tabular-nums">
                            - {formatCurrency(salaryBreakdown.professionalTax)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2.5 whitespace-nowrap">
                          <span className="text-slate-600">
                            Income Tax TDS ({activeUserMaster?.tdsPct ?? 8.5}% · {statutory.taxRegime.split(' ')[0]} Regime)
                          </span>
                          <span className="font-mono font-semibold text-rose-700 tabular-nums">
                            - {formatCurrency(salaryBreakdown.incomeTaxTds)}
                          </span>
                        </div>
                        {salaryBreakdown.loanRecovery > 0 && (
                          <div className="flex justify-between pt-2.5 whitespace-nowrap">
                            <span className="text-slate-600">Loan EMI Recovery Deduction</span>
                            <span className="font-mono font-semibold text-rose-700 tabular-nums">
                              - {formatCurrency(salaryBreakdown.loanRecovery)}
                            </span>
                          </div>
                        )}
                        {salaryBreakdown.advanceRecovery > 0 && (
                          <div className="flex justify-between pt-2.5 whitespace-nowrap">
                            <span className="text-slate-600">Salary Advance Recovery</span>
                            <span className="font-mono font-semibold text-rose-700 tabular-nums">
                              - {formatCurrency(salaryBreakdown.advanceRecovery)}
                            </span>
                          </div>
                        )}
                        {salaryBreakdown.otherDeductions > 0 && (
                          <div className="flex justify-between pt-2.5 whitespace-nowrap">
                            <span className="text-slate-600">Other Admin Deductions</span>
                            <span className="font-mono font-semibold text-rose-700 tabular-nums">
                              - {formatCurrency(salaryBreakdown.otherDeductions)}
                            </span>
                          </div>
                        )}
                        {salaryBreakdown.activeLoanInstalments &&
                          salaryBreakdown.activeLoanInstalments.length > 0 && (
                            <div className="pt-2.5">
                              <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-indigo-950 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1">
                                    <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Active Loan / Advance EMI Schedule ({selectedMonthKey})</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('loans')}
                                    className="text-[#1f7e9e] hover:underline font-bold cursor-pointer"
                                  >
                                    Open Loan Ledger →
                                  </button>
                                </div>
                                {salaryBreakdown.activeLoanInstalments.map((item) => (
                                  <div
                                    key={`${item.loanId}-${item.instalmentNo}`}
                                    className="text-[10.5px] bg-white p-2 rounded border border-indigo-100 flex flex-col gap-0.5"
                                  >
                                    <div className="flex items-center justify-between gap-2 font-semibold text-slate-800 whitespace-nowrap">
                                      <span className="truncate">
                                        {item.loanNumber} · {item.loanType} (EMI #{item.instalmentNo}/{item.tenureMonths})
                                      </span>
                                      <span className="font-mono font-bold text-rose-700 shrink-0">
                                        - {formatCurrency(item.deductedEmi)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 whitespace-nowrap">
                                      <span>
                                        Scheduled EMI: {formatCurrency(item.scheduledEmi)} ·{' '}
                                        {item.alreadyReconciled ? 'Reconciled in Ledger' : 'Auto-Synced in Payroll'}
                                      </span>
                                      <span className="font-mono text-slate-700 font-semibold">
                                        Bal After: {formatCurrency(item.balanceAfter)}
                                      </span>
                                    </div>
                                    {item.shortfall > 0 && (
                                      <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                        Shortfall Policy Applied ({salaryBreakdown.loanShortfallPolicyApplied || 'Capped'}): Deferred {formatCurrency(item.shortfall)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {isAdminUser && activeEmployee && (
                                  <div className="pt-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = reconcileMonthlyLoanDeductions({
                                          monthKey: selectedMonthKey,
                                          actorName: currentUser.name,
                                          actorRole: currentUser.role,
                                          employeeMasters: employeeSalaryMasters,
                                          policy: adminPolicyMaster,
                                        });
                                        setLoansSyncVersion((v) => v + 1);
                                        setStatusBanner(
                                          res.reconciledCount > 0
                                            ? `Reconciled ${res.reconciledCount} EMI(s) totaling ${formatCurrency(res.totalRecoveredThisRun)} for ${selectedMonthMeta.label}.`
                                            : `All due EMIs in ${selectedMonthMeta.label} are already reconciled (duplicate deduction prevented).`
                                        );
                                      }}
                                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] cursor-pointer transition"
                                    >
                                      Reconcile &amp; Post Month EMI to Loan Ledger
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-rose-700 text-sm whitespace-nowrap">
                          <span>Total Deductions (B)</span>
                          <span className="font-mono tabular-nums">
                            - {formatCurrency(salaryBreakdown.totalDeductions)}
                          </span>
                        </div>
                        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                          <span className="inline-flex items-center gap-1 text-rose-800 font-medium min-w-0 truncate">
                            <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">
                              Deductions &amp; PF amount remain fixed until Admin edits them.
                            </span>
                          </span>
                          {isAdminUser && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('admin_master')}
                              className="text-[#1f7e9e] hover:underline font-bold shrink-0 cursor-pointer"
                            >
                              Edit All Deductions →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between gap-2 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-slate-900">
                          Approved Expense Reimbursements (C)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tax-exempt client travel &amp; operational claims
                        </div>
                      </div>
                      <div className="font-mono font-bold text-sm text-[#1f7e9e] tabular-nums">
                        + {formatCurrency(salaryBreakdown.approvedReimbursements)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 whitespace-nowrap">
                      <div>
                        <div className="text-[11px] text-slate-300">
                          Net Take-Home Pay (A - B + C)
                        </div>
                        <div className="font-bold text-sm">
                          Credited to {statutory.bankName} ({statutory.bankAccountNo})
                        </div>
                      </div>
                      <div className="font-mono font-bold text-lg text-emerald-400 tabular-nums">
                        {formatCurrency(salaryBreakdown.netPayable)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 2B: EMPLOYEE LOAN & SALARY ADVANCE MANAGEMENT */}
          {activeTab === 'loans' && (
            !activeEmployee && !isAdminUser ? (
              renderNoEmployeesEmptyState('Loans & Salary Advances')
            ) : (
              <PayrollLoanManagementSection
                isAdminUser={isAdminUser}
                activeEmployee={
                  activeEmployee
                    ? {
                        id: activeEmployee.id,
                        name: activeEmployee.name,
                        email: activeEmployee.email,
                        role: activeEmployee.role,
                        department: activeEmployee.department,
                        designation: activeEmployee.designation,
                        location: activeEmployee.location,
                        status: activeEmployee.status,
                      }
                    : null
                }
                activeUserMaster={activeUserMaster}
                employeeSalaryMasters={employeeSalaryMasters}
                adminPolicyMaster={adminPolicyMaster}
                setAdminPolicyMaster={setAdminPolicyMaster}
                selectedMonthKey={selectedMonthKey}
                setStatusBanner={setStatusBanner}
              />
            )
          )}

          {/* TAB 3: LEAVE MANAGEMENT (CREATE, EDIT, DELETE) */}
          {activeTab === 'leaves' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('Leave Management')
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Apply for Leave / Prior Approval (CS-HR-POL-001)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      1 Leave / Month quota · Request in advance (Planned leave, early exit, half
                      days, extended breaks)
                    </p>
                  </div>

                  <form onSubmit={handleApplyLeave} className="space-y-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Request / Approval Category *
                      </label>
                      <select
                        value={leaveForm.leaveType}
                        onChange={(e) =>
                          setLeaveForm({
                            ...leaveForm,
                            leaveType: e.target.value as LeaveRequestItem['leaveType'],
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold"
                      >
                        <option value="Monthly Leave (1/Month)">
                          Monthly Leave (1 Leave / Month Policy)
                        </option>
                        <option value="Early Exit Approval">
                          Prior Approval: Early Exit (Before 6:00 PM)
                        </option>
                        <option value="Half Day Approval">
                          Prior Approval: Half Day (Midday Entry / Exit)
                        </option>
                        <option value="Extended Break Approval">
                          Prior Approval: Extended Break (&gt; 1 Hr / 1:00–2:00 PM)
                        </option>
                        <option value="Emergency Intimation">
                          Emergency Intimation to Manager / HR
                        </option>
                        <option value="Privilege Leave">Privilege / Earned Leave (PL)</option>
                        <option value="Casual Leave">Casual Leave (CL)</option>
                        <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                        <option value="Comp-Off">Compensatory Off</option>
                      </select>
                    </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        From Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveForm.startDate}
                        onChange={(e) =>
                          setLeaveForm({ ...leaveForm, startDate: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        To Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Duration
                      </label>
                      <select
                        value={leaveForm.dayType}
                        onChange={(e) =>
                          setLeaveForm({
                            ...leaveForm,
                            dayType: e.target.value as LeaveRequestItem['dayType'],
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Full Day">Full Day</option>
                        <option value="First Half">Half Day (First Half)</option>
                        <option value="Second Half">Half Day (Second Half)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Work Handover To
                      </label>
                      {isAdminUser ? (
                        <select
                          value={leaveForm.handoverTo}
                          onChange={(e) =>
                            setLeaveForm({ ...leaveForm, handoverTo: e.target.value })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                        >
                          {users
                            .filter((u) => u.id !== activeEmployee.id)
                            .map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name} ({u.role})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={leaveForm.handoverTo}
                          onChange={(e) =>
                            setLeaveForm({ ...leaveForm, handoverTo: e.target.value })
                          }
                          placeholder={
                            activeUserMaster?.reportingManager || 'Reporting Manager / Team Lead'
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Reason for Leave *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      placeholder="Brief reason and emergency contact readiness..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg shadow-xs whitespace-nowrap transition cursor-pointer"
                  >
                    Submit Leave Request to ESS
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 whitespace-nowrap">
                    <div className="text-[11px] font-semibold text-amber-900">
                      Monthly Leave Quota (CS-HR-POL-001)
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                      1 Leave / Month
                    </div>
                    <div className="text-[10px] text-amber-800 mt-0.5">
                      Request in advance · Unapproved = LOP
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-200 whitespace-nowrap">
                    <div className="text-[11px] font-semibold text-sky-700">
                      Daily Break Rule (1:00 PM – 2:00 PM)
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                      Max 1 Hour
                    </div>
                    <div className="text-[10px] text-sky-800 mt-0.5">
                      Total break must not exceed 1 hr
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 whitespace-nowrap">
                    <div className="text-[11px] font-semibold text-emerald-700">
                      Weekly Offs &amp; Working Saturdays
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      2nd &amp; 4th Sat + Sun Off
                    </div>
                    <div className="text-[10px] text-emerald-800 mt-0.5">
                      1st, 3rd &amp; 5th Saturdays Working
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Leave Applications ({leaves.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {isAdminUser
                      ? 'Admin Rights Active: Create, Edit, Approve or Delete any leave record'
                      : 'Click Edit or Delete to manage your leave requests'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-modern w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase whitespace-nowrap">
                        <th className="py-2 px-3">Ref ID</th>
                        <th className="py-2 px-3">Leave Type</th>
                        <th className="py-2 px-3">Dates</th>
                        <th className="py-2 px-3">Days</th>
                        <th className="py-2 px-3">Reason &amp; Handover</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaves.map((lv) => {
                        const isEditing = editingLeaveId === lv.id && editingLeaveDraft;
                        return (
                          <tr key={lv.id} className="hover:bg-slate-50 whitespace-nowrap">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                              {lv.id}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {isEditing ? (
                                <select
                                  value={editingLeaveDraft.leaveType}
                                  onChange={(e) =>
                                    setEditingLeaveDraft({
                                      ...editingLeaveDraft,
                                      leaveType: e.target.value as LeaveRequestItem['leaveType'],
                                    })
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                >
                                  <option value="Casual Leave">Casual Leave</option>
                                  <option value="Privilege Leave">Privilege Leave</option>
                                  <option value="Sick Leave">Sick Leave</option>
                                  <option value="Comp-Off">Comp-Off</option>
                                </select>
                              ) : (
                                <>
                                  {lv.leaveType}{' '}
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    ({lv.dayType})
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editingLeaveDraft.startDate}
                                  onChange={(e) =>
                                    setEditingLeaveDraft({
                                      ...editingLeaveDraft,
                                      startDate: e.target.value,
                                      endDate: e.target.value,
                                    })
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                `${lv.startDate} to ${lv.endDate}`
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  value={editingLeaveDraft.days}
                                  onChange={(e) =>
                                    setEditingLeaveDraft({
                                      ...editingLeaveDraft,
                                      days: Number(e.target.value),
                                    })
                                  }
                                  className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                lv.days
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingLeaveDraft.reason}
                                  onChange={(e) =>
                                    setEditingLeaveDraft({
                                      ...editingLeaveDraft,
                                      reason: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                `${lv.reason} (Handover: ${lv.handoverTo})`
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isEditing && isAdminUser ? (
                                <select
                                  value={editingLeaveDraft.status}
                                  onChange={(e) =>
                                    setEditingLeaveDraft({
                                      ...editingLeaveDraft,
                                      status: e.target.value as LeaveRequestItem['status'],
                                    })
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                                >
                                  <option value="Approved">Approved</option>
                                  <option value="Pending Approval">Pending Approval</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              ) : (
                                <span
                                  className={`font-bold text-xs ${
                                    lv.status === 'Approved'
                                      ? 'text-emerald-700'
                                      : lv.status === 'Pending Approval'
                                      ? 'text-amber-700'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {lv.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLeaves(
                                        leaves.map((item) =>
                                          item.id === lv.id ? editingLeaveDraft : item
                                        )
                                      );
                                      setEditingLeaveId(null);
                                      setEditingLeaveDraft(null);
                                      setStatusBanner(`Updated leave request ${lv.id}.`);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLeaveId(null);
                                      setEditingLeaveDraft(null);
                                    }}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  {lv.status === 'Approved' && !isAdminUser ? (
                                    <span
                                      className="px-2 py-1 rounded bg-slate-100 text-slate-400 font-semibold text-[10px] inline-flex items-center gap-1"
                                      title="Approved records are locked per CS-HR-POL-001. Only HR can edit or revoke."
                                    >
                                      <Lock className="w-3 h-3" /> Approved &amp; Locked
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLeaveId(lv.id);
                                          setEditingLeaveDraft(lv);
                                        }}
                                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLeaves(leaves.filter((item) => item.id !== lv.id));
                                          setStatusBanner(`Deleted leave request ${lv.id}.`);
                                        }}
                                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] inline-flex items-center cursor-pointer"
                                        title="Delete Leave Request"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 4: REIMBURSEMENTS & EXPENSE CLAIMS (CREATE, EDIT, DELETE) */}
          {activeTab === 'reimbursements' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('Expense & Reimbursements')
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Submit Expense / Reimbursement Claim
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Approved claims are automatically added to your monthly payslip
                  </p>
                </div>

                <form onSubmit={handleSubmitClaim} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Expense Category *
                    </label>
                    <select
                      value={claimForm.category}
                      onChange={(e) =>
                        setClaimForm({
                          ...claimForm,
                          category: e.target.value as ExpenseClaimItem['category'],
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Client Visit Travel">Client Visit Travel</option>
                      <option value="Meals & Client Hospitality">
                        Meals &amp; Client Hospitality
                      </option>
                      <option value="Fuel & Cab Conveyance">Fuel &amp; Cab Conveyance</option>
                      <option value="Mobile & Internet">Mobile &amp; Internet</option>
                      <option value="Software / Office Supplies">
                        Software / Office Supplies
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Bill Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={claimForm.expenseDate}
                        onChange={(e) =>
                          setClaimForm({ ...claimForm, expenseDate: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Claim Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={claimForm.amount}
                        onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                        placeholder="e.g. 2500"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Linked CRM Customer
                      </label>
                      <select
                        value={claimForm.linkedCustomer}
                        onChange={(e) =>
                          setClaimForm({ ...claimForm, linkedCustomer: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="Internal Operations">Internal Operations</option>
                        <option value="Official Client / Field Visit">
                          Official Client / Field Visit
                        </option>
                        {isAdminUser
                          ? customers.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))
                          : null}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Receipt / Invoice #
                      </label>
                      <input
                        type="text"
                        value={claimForm.billNumber}
                        onChange={(e) =>
                          setClaimForm({ ...claimForm, billNumber: e.target.value })
                        }
                        placeholder="INV-9021"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Purpose / Remarks *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={claimForm.description}
                      onChange={(e) =>
                        setClaimForm({ ...claimForm, description: e.target.value })
                      }
                      placeholder="Client visit / meeting details..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg shadow-xs whitespace-nowrap transition cursor-pointer"
                  >
                    Submit Reimbursement to Payroll
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Reimbursement Claims Ledger ({claims.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Create, edit, or delete expense reimbursement claims
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Queued for Payout</div>
                    <div className="text-sm font-bold text-[#1f7e9e] font-mono tabular-nums">
                      {formatCurrency(salaryBreakdown.approvedReimbursements)}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table-modern w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase whitespace-nowrap">
                        <th className="py-2 px-3">Claim #</th>
                        <th className="py-2 px-3">Category &amp; Client</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claims.map((cl) => {
                        const isEditing = editingClaimId === cl.id && editingClaimDraft;
                        return (
                          <tr key={cl.id} className="hover:bg-slate-50 whitespace-nowrap">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                              {cl.claimNo}
                            </td>
                            <td className="py-2.5 px-3">
                              {isEditing ? (
                                <select
                                  value={editingClaimDraft.category}
                                  onChange={(e) =>
                                    setEditingClaimDraft({
                                      ...editingClaimDraft,
                                      category: e.target.value as ExpenseClaimItem['category'],
                                    })
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                                >
                                  <option value="Client Visit Travel">Client Visit Travel</option>
                                  <option value="Meals & Client Hospitality">
                                    Meals &amp; Client Hospitality
                                  </option>
                                  <option value="Fuel & Cab Conveyance">
                                    Fuel &amp; Cab Conveyance
                                  </option>
                                  <option value="Mobile & Internet">Mobile &amp; Internet</option>
                                  <option value="Software / Office Supplies">
                                    Software / Office Supplies
                                  </option>
                                </select>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-900">
                                    {cl.category}
                                  </span>
                                  <span aria-hidden="true"> · </span>
                                  <span className="text-[#1f7e9e] font-medium">
                                    {cl.linkedCustomer}
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {cl.expenseDate}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingClaimDraft.description}
                                  onChange={(e) =>
                                    setEditingClaimDraft({
                                      ...editingClaimDraft,
                                      description: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                />
                              ) : (
                                cl.description
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingClaimDraft.amount}
                                  onChange={(e) =>
                                    setEditingClaimDraft({
                                      ...editingClaimDraft,
                                      amount: Number(e.target.value),
                                    })
                                  }
                                  className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-right"
                                />
                              ) : (
                                formatCurrency(cl.amount)
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isEditing && isAdminUser ? (
                                <select
                                  value={editingClaimDraft.status}
                                  onChange={(e) =>
                                    setEditingClaimDraft({
                                      ...editingClaimDraft,
                                      status: e.target.value as ExpenseClaimItem['status'],
                                    })
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                                >
                                  <option value="Approved & Queued for Payroll">
                                    Approved &amp; Queued
                                  </option>
                                  <option value="Under Verification">Under Verification</option>
                                  <option value="Paid in Payslip">Paid in Payslip</option>
                                </select>
                              ) : (
                                <span
                                  className={`font-bold text-xs ${
                                    cl.status === 'Paid in Payslip'
                                      ? 'text-emerald-700'
                                      : 'text-sky-700'
                                  }`}
                                >
                                  {cl.status}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClaims(
                                        claims.map((item) =>
                                          item.id === cl.id ? editingClaimDraft : item
                                        )
                                      );
                                      setEditingClaimId(null);
                                      setEditingClaimDraft(null);
                                      setStatusBanner(`Updated reimbursement claim ${cl.claimNo}.`);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingClaimId(null);
                                      setEditingClaimDraft(null);
                                    }}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingClaimId(cl.id);
                                      setEditingClaimDraft(cl);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClaims(claims.filter((item) => item.id !== cl.id));
                                      setStatusBanner(`Deleted reimbursement claim ${cl.claimNo}.`);
                                    }}
                                    className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] inline-flex items-center cursor-pointer"
                                    title="Delete Reimbursement Claim"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB 5: TAX & STATUTORY (80C / PAN / UAN / BANK) */}
          {activeTab === 'tax' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('Tax & Statutory (80C / PAN)')
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Statutory Identity &amp; Salary Bank Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Used for Form 16, EPFO UAN contribution, and NEFT salary credit
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Employee Code {!isAdminUser && <span className="text-[10px] text-slate-400">(Assigned by Admin)</span>}
                    </label>
                    <input
                      type="text"
                      value={statutory.empCode}
                      readOnly={!isAdminUser}
                      onChange={(e) => {
                        if (isAdminUser) {
                          setStatutory({ ...statutory, empCode: e.target.value });
                        }
                      }}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold ${
                        !isAdminUser ? 'text-slate-500 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Income Tax PAN Number
                    </label>
                    <input
                      type="text"
                      value={statutory.panNumber}
                      onChange={(e) =>
                        setStatutory({ ...statutory, panNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      EPFO UAN Number
                    </label>
                    <input
                      type="text"
                      value={statutory.uanNumber}
                      onChange={(e) => setStatutory({ ...statutory, uanNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      PF Account Number
                    </label>
                    <input
                      type="text"
                      value={statutory.pfAccountNo}
                      onChange={(e) => setStatutory({ ...statutory, pfAccountNo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Salary Bank Name
                    </label>
                    <input
                      type="text"
                      value={statutory.bankName}
                      onChange={(e) => setStatutory({ ...statutory, bankName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={statutory.bankAccountNo}
                      onChange={(e) =>
                        setStatutory({ ...statutory, bankAccountNo: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    FY 2026-27 Income Tax Regime &amp; 80C Declarations
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure tax regime and investment declarations for TDS computation
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Selected Tax Regime
                    </label>
                    <select
                      value={statutory.taxRegime}
                      onChange={(e) =>
                        setStatutory({
                          ...statutory,
                          taxRegime: e.target.value as StatutoryDetails['taxRegime'],
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      <option value="New Tax Regime (Section 115BAC)">
                        New Tax Regime (Section 115BAC — Default)
                      </option>
                      <option value="Old Tax Regime (With Exemptions)">
                        Old Tax Regime (With 80C, 80D &amp; HRA Exemptions)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Section 80C Investments (₹)
                      </label>
                      <input
                        type="number"
                        value={statutory.sec80CDeclared}
                        onChange={(e) =>
                          setStatutory({ ...statutory, sec80CDeclared: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Section 80D Medical Insurance (₹)
                      </label>
                      <input
                        type="number"
                        value={statutory.sec80DDeclared}
                        onChange={(e) =>
                          setStatutory({ ...statutory, sec80DDeclared: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                      <span className="font-bold text-rose-950 text-xs flex items-center gap-1.5 min-w-0 truncate">
                        <Lock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span className="truncate">Admin-Locked Monthly Deductions &amp; PF Amount</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                        Fixed Until Admin Edits
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-lg border border-rose-100 min-w-0">
                        <span className="text-slate-500 block whitespace-nowrap truncate">PF Amount (₹)</span>
                        {isAdminUser && activeUserMaster ? (
                          <input
                            type="number"
                            min={0}
                            value={
                              activeUserMaster.pfAmount !== undefined
                                ? activeUserMaster.pfAmount
                                : salaryBreakdown.pfDeduction
                            }
                            onChange={(e) => {
                              const nextPf = Math.max(0, Math.round(Number(e.target.value) || 0));
                              setEmployeeSalaryMasters((prev) => ({
                                ...prev,
                                [activeUserMaster.userId]: {
                                  ...activeUserMaster,
                                  pfAmount: nextPf,
                                  deductionsLockedByAdmin: true,
                                },
                              }));
                            }}
                            className="w-full mt-0.5 bg-rose-50 border border-rose-300 rounded px-1.5 py-0.5 font-mono font-bold text-rose-900"
                          />
                        ) : (
                          <strong className="font-mono text-rose-800 block whitespace-nowrap truncate">
                            {formatCurrency(salaryBreakdown.pfDeduction)}
                          </strong>
                        )}
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 min-w-0">
                        <span className="text-slate-500 block whitespace-nowrap truncate">Prof. Tax (₹)</span>
                        <strong className="font-mono text-rose-800 block whitespace-nowrap truncate">
                          {formatCurrency(salaryBreakdown.professionalTax)}
                        </strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 min-w-0">
                        <span className="text-slate-500 block whitespace-nowrap truncate">TDS Rate (%)</span>
                        <strong className="font-mono text-rose-800 block whitespace-nowrap truncate">
                          {activeUserMaster?.tdsPct ?? 8.5}% ({formatCurrency(salaryBreakdown.incomeTaxTds)})
                        </strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 min-w-0">
                        <span className="text-slate-500 block whitespace-nowrap truncate">Admin LOP Days</span>
                        <strong className="font-mono text-rose-800 block whitespace-nowrap truncate">
                          {salaryBreakdown.lopDays} Days
                        </strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeSalaryMasters((prev) => ({
                        ...prev,
                        [activeEmployee.id]: {
                          ...(prev[activeEmployee.id] || {
                            userId: activeEmployee.id,
                            monthlyGross: baseMonthlyGross,
                            basicPct: 50,
                            hraPct: 25,
                            specialPct: 18,
                            commissionPct: 1.5,
                            pfAmount: 1800,
                            profTax: 200,
                            tdsPct: 8.5,
                            lopDays: 0,
                            deductionsLockedByAdmin: true,
                          }),
                          empCode: statutory.empCode,
                          panNumber: statutory.panNumber,
                          uanNumber: statutory.uanNumber,
                          pfAccountNo: statutory.pfAccountNo,
                          taxRegime: statutory.taxRegime,
                          bankName: statutory.bankName,
                          bankAccountNo: statutory.bankAccountNo,
                          ifscCode: statutory.ifscCode,
                          deductionsLockedByAdmin: true,
                        },
                      }));
                      setStatusBanner(
                        'Statutory Profile & Tax Investment Declarations saved to Payroll ESS (Admin-configured deductions remain locked).'
                      );
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
                  >
                    Save Statutory &amp; Tax Declarations
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {/* TAB: EMPLOYEE MY PROFILE & CHANGE PASSWORD FOR FURTHER LOGINS */}
          {activeTab === 'profile' && (
            !activeEmployee ? (
              renderNoEmployeesEmptyState('My Profile & Password')
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Employee Master Profile Details */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={activeEmployee.name}
                        avatar={activeEmployee.avatar}
                        className="w-12 h-12 rounded-xl bg-[#1f7e9e] text-white font-bold text-base"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Employee Master Profile &amp; Login Identity
                        </h3>
                        <p className="text-xs text-slate-500">
                          Official credentials and employment details linked to your Employee Master record
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs">
                        {statutory.empCode}
                      </span>
                      {!isEditingProfileInfo && (
                        <button
                          type="button"
                          onClick={handleStartEditProfile}
                          className="px-3 py-1 bg-[#1f7e9e] hover:bg-[#18647e] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingProfileInfo ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveProfileInfo();
                      }}
                      className="space-y-4"
                    >
                      <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 flex items-center justify-between gap-2">
                        <span>
                          Edit your permitted personal, address, bank, qualification, and document information. Changes persist directly to the PostgreSQL database upon saving and sync in real-time with the Admin Portal.
                        </span>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded shrink-0">
                          PostgreSQL Synced
                        </span>
                      </div>

                      {/* 1. PERSONAL INFORMATION */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Users className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>1. Personal Information</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 lg:col-span-1">
                            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={profileEditForm.name}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Gender</label>
                            <select
                              value={profileEditForm.gender}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, gender: e.target.value as any })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                            <input
                              type="date"
                              value={profileEditForm.dateOfBirth}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, dateOfBirth: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                            <select
                              value={profileEditForm.bloodGroup}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, bloodGroup: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Marital Status</label>
                            <select
                              value={profileEditForm.maritalStatus}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, maritalStatus: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            >
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. CONTACT DETAILS */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>2. Contact Information</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Personal Email</label>
                            <input
                              type="email"
                              value={profileEditForm.personalEmail}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, personalEmail: e.target.value })}
                              placeholder="employee@personal.com"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                            <input
                              type="text"
                              value={profileEditForm.phone}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value })}
                              placeholder="+91 98000 00000"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Alternate Phone</label>
                            <input
                              type="text"
                              value={profileEditForm.alternatePhone}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, alternatePhone: e.target.value })}
                              placeholder="+91 98111 22233"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Work Location</label>
                            <input
                              type="text"
                              value={profileEditForm.location}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, location: e.target.value })}
                              placeholder="e.g. Mumbai HQ / Remote"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. RESIDENTIAL ADDRESSES */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Landmark className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>3. Residential Address Details</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Current Residential Address</label>
                            <textarea
                              rows={2}
                              value={profileEditForm.currentAddress}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, currentAddress: e.target.value })}
                              placeholder="House/Flat No, Street, Landmark"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Permanent Residential Address</label>
                            <textarea
                              rows={2}
                              value={profileEditForm.permanentAddress}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, permanentAddress: e.target.value })}
                              placeholder="Permanent family address"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">City</label>
                            <input
                              type="text"
                              value={profileEditForm.city}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, city: e.target.value })}
                              placeholder="Mumbai / Delhi / Bengaluru"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">State</label>
                            <input
                              type="text"
                              value={profileEditForm.state}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, state: e.target.value })}
                              placeholder="Maharashtra / Delhi NCR"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                            <input
                              type="text"
                              value={profileEditForm.pinCode}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, pinCode: e.target.value })}
                              placeholder="400001"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. BANK & STATUTORY DETAILS */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Wallet className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>4. Bank Account &amp; Statutory Identifiers</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Salary Bank Name</label>
                            <input
                              type="text"
                              value={profileEditForm.bankName}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, bankName: e.target.value })}
                              placeholder="e.g. HDFC Bank Ltd"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Bank Account Number</label>
                            <input
                              type="text"
                              value={profileEditForm.bankAccountNo}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, bankAccountNo: e.target.value })}
                              placeholder="50100482910482"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code</label>
                            <input
                              type="text"
                              value={profileEditForm.ifscCode}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, ifscCode: e.target.value.toUpperCase() })}
                              placeholder="HDFC0001245"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Account Holder Name</label>
                            <input
                              type="text"
                              value={profileEditForm.accountHolderName}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, accountHolderName: e.target.value })}
                              placeholder="As per bank passbook"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                            <input
                              type="text"
                              value={profileEditForm.panNumber}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, panNumber: e.target.value.toUpperCase() })}
                              placeholder="ABCDE1234F"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">UAN Number</label>
                            <input
                              type="text"
                              value={profileEditForm.uanNumber}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, uanNumber: e.target.value })}
                              placeholder="100900100900"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">PF Account No</label>
                            <input
                              type="text"
                              value={profileEditForm.pfAccountNo}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, pfAccountNo: e.target.value })}
                              placeholder="MH/BAN/0012345/000/0000001"
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Tax Regime</label>
                            <select
                              value={profileEditForm.taxRegime}
                              onChange={(e) => setProfileEditForm({ ...profileEditForm, taxRegime: e.target.value as any })}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                            >
                              <option value="New Tax Regime (Section 115BAC)">New Tax Regime (Sec 115BAC)</option>
                              <option value="Old Tax Regime (With Exemptions)">Old Tax Regime (Exemptions)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 5. EMERGENCY CONTACT & QUALIFICATIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                            <span>5. Emergency Contact</span>
                          </div>
                          <div className="space-y-2.5">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Contact Name</label>
                              <input
                                type="text"
                                value={profileEditForm.emergencyContactName}
                                onChange={(e) => setProfileEditForm({ ...profileEditForm, emergencyContactName: e.target.value })}
                                placeholder="Contact person name"
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                                <input
                                  type="text"
                                  value={profileEditForm.emergencyContactPhone}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, emergencyContactPhone: e.target.value })}
                                  placeholder="+91 98000 00000"
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                                <input
                                  type="text"
                                  value={profileEditForm.emergencyContactRelation}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, emergencyContactRelation: e.target.value })}
                                  placeholder="Spouse / Parent / Sibling"
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>6. Qualifications &amp; Education</span>
                          </div>
                          <div className="space-y-2.5">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">Highest Qualification</label>
                              <input
                                type="text"
                                value={profileEditForm.highestQualification}
                                onChange={(e) => setProfileEditForm({ ...profileEditForm, highestQualification: e.target.value })}
                                placeholder="B.Tech Computer Science / MBA / B.Com"
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <label className="font-bold text-slate-700 block mb-1">Institute / University</label>
                                <input
                                  type="text"
                                  value={profileEditForm.institute}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, institute: e.target.value })}
                                  placeholder="University of Mumbai"
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">Passing Year</label>
                                <input
                                  type="text"
                                  value={profileEditForm.passingYear}
                                  onChange={(e) => setProfileEditForm({ ...profileEditForm, passingYear: e.target.value })}
                                  placeholder="2022"
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 7. DOCUMENTS REPOSITORY */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>7. Uploaded Documents &amp; Identity Proofs ({profileEditForm.documents.length})</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Add verified personal and statutory documents
                          </span>
                        </div>

                        {profileEditForm.documents.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 text-xs italic">
                            No documents attached yet. Add identity proof, degree certificate, or address proof below.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {profileEditForm.documents.map((doc, idx) => (
                              <div
                                key={doc.id || idx}
                                className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-semibold">{doc.type}</span>
                                    {doc.documentNumber && <span>Ref: {doc.documentNumber}</span>}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfileEditForm({
                                      ...profileEditForm,
                                      documents: profileEditForm.documents.filter((_, i) => i !== idx),
                                    });
                                  }}
                                  className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer shrink-0"
                                  title="Remove document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Add Document Form */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          <div className="sm:col-span-5">
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Document Title</label>
                            <input
                              type="text"
                              value={newDocDraft.name}
                              onChange={(e) => setNewDocDraft({ ...newDocDraft, name: e.target.value })}
                              placeholder="e.g. Aadhaar Card Front & Back"
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Category</label>
                            <select
                              value={newDocDraft.type}
                              onChange={(e) => setNewDocDraft({ ...newDocDraft, type: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                            >
                              <option value="Identity Proof / Aadhaar">Identity Proof / Aadhaar</option>
                              <option value="PAN Card Copy">PAN Card Copy</option>
                              <option value="Degree Certificate">Degree Certificate</option>
                              <option value="Address Proof / Passport">Address Proof / Passport</option>
                              <option value="Experience Certificate">Experience Certificate</option>
                              <option value="Other Document">Other Document</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (!newDocDraft.name.trim()) return;
                                const docItem = {
                                  id: `doc-${Date.now()}`,
                                  name: newDocDraft.name.trim(),
                                  type: newDocDraft.type,
                                  documentNumber: newDocDraft.documentNumber.trim() || undefined,
                                  uploadedAt: new Date().toISOString(),
                                };
                                setProfileEditForm({
                                  ...profileEditForm,
                                  documents: [...profileEditForm.documents, docItem],
                                });
                                setNewDocDraft({ name: '', type: 'Identity Proof / Aadhaar', documentNumber: '' });
                              }}
                              className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Document</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfileInfo(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-5 py-2.5 rounded-xl bg-[#1f7e9e] hover:bg-[#18647e] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
                        >
                          {isSavingProfile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Save &amp; Persist to Database</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      {/* VIEW: Personal & Identity Card */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#1f7e9e]" />
                            <span>1. Personal &amp; Identity Profile</span>
                          </span>
                          <span className="font-mono text-[#1f7e9e] font-bold text-xs">
                            {statutory.empCode}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Full Name</span>
                            <span className="font-bold text-slate-900 block truncate">{activeEmployee.name}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Official Login Email</span>
                            <span className="font-mono font-bold text-indigo-700 block truncate">{activeEmployee.email}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Gender &amp; DOB</span>
                            <span className="font-semibold text-slate-900 block">
                              {(activeUserMaster as any)?.gender || '—'} · {(activeUserMaster as any)?.dateOfBirth || '—'}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Blood Group &amp; Marital</span>
                            <span className="font-semibold text-slate-900 block">
                              {(activeUserMaster as any)?.bloodGroup || '—'} · {(activeUserMaster as any)?.maritalStatus || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* VIEW: Contact & Addresses Card */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>2. Contact &amp; Residential Addresses</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Primary Mobile</span>
                            <span className="font-mono font-bold text-slate-900 block">{activeEmployee.phone || '—'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Alternate Phone</span>
                            <span className="font-mono text-slate-800 block">{(activeUserMaster as any)?.alternatePhone || '—'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Personal Email</span>
                            <span className="text-slate-800 block truncate">{(activeUserMaster as any)?.personalEmail || '—'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Work Location</span>
                            <span className="font-semibold text-slate-900 block">{activeEmployee.location || 'Corporate HQ'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Current Address</span>
                            <span className="text-slate-800 block">
                              {(activeUserMaster as any)?.currentAddress || '—'}
                              {((activeUserMaster as any)?.city || (activeUserMaster as any)?.state) && (
                                <span className="block text-[11px] text-slate-500 mt-0.5">
                                  {[(activeUserMaster as any)?.city, (activeUserMaster as any)?.state, (activeUserMaster as any)?.pinCode].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Permanent Address</span>
                            <span className="text-slate-800 block">
                              {(activeUserMaster as any)?.permanentAddress || (activeUserMaster as any)?.currentAddress || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* VIEW: Bank & Statutory Identifiers Card */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                          <Wallet className="w-3.5 h-3.5 text-[#1f7e9e]" />
                          <span>3. Bank Account &amp; Statutory Identifiers</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Salary Bank &amp; IFSC</span>
                            <span className="font-semibold text-slate-900 block truncate">{statutory.bankName || 'HDFC Bank Ltd'}</span>
                            <span className="font-mono text-[10px] text-slate-500 block">{statutory.ifscCode || '—'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">Bank Account Number</span>
                            <span className="font-mono font-bold text-slate-900 block truncate">{statutory.bankAccountNo || '—'}</span>
                            {(activeUserMaster as any)?.accountHolderName && (
                              <span className="text-[10px] text-slate-500 block truncate">Holder: {(activeUserMaster as any).accountHolderName}</span>
                            )}
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">PAN / UAN</span>
                            <span className="font-mono font-bold text-slate-900 block">{statutory.panNumber || '—'}</span>
                            <span className="font-mono text-[10px] text-slate-500 block">UAN: {statutory.uanNumber || '—'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                            <span className="text-[10px] text-slate-500 font-semibold block">PF No &amp; Tax Regime</span>
                            <span className="font-mono text-[11px] text-slate-800 block truncate">{statutory.pfAccountNo || '—'}</span>
                            <span className="text-[10px] font-semibold text-emerald-700 block truncate">{statutory.taxRegime || 'New Tax Regime'}</span>
                          </div>
                        </div>
                      </div>

                      {/* VIEW: Emergency Contact, Education & Documents */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-rose-600" />
                            <span>Emergency Contact</span>
                          </div>
                          <div className="font-bold text-slate-900 truncate">
                            {(activeUserMaster as any)?.emergencyContactName || '—'}
                          </div>
                          <div className="font-mono text-slate-600 text-[11px]">
                            {(activeUserMaster as any)?.emergencyContactPhone || '—'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Rel: {(activeUserMaster as any)?.emergencyContactRelation || '—'}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>Education &amp; Degree</span>
                          </div>
                          <div className="font-bold text-slate-900 truncate">
                            {(activeUserMaster as any)?.highestQualification || '—'}
                          </div>
                          <div className="text-slate-600 text-[11px] truncate">
                            {(activeUserMaster as any)?.institute || '—'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Year: {(activeUserMaster as any)?.passingYear || '—'}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Documents</span>
                            </span>
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                              {((activeUserMaster as any)?.documents || []).length} Attached
                            </span>
                          </div>
                          {((activeUserMaster as any)?.documents || []).length === 0 ? (
                            <div className="text-slate-400 text-[11px] italic pt-1">No documents uploaded</div>
                          ) : (
                            <div className="space-y-1 max-h-16 overflow-y-auto pt-0.5">
                              {((activeUserMaster as any)?.documents || []).map((doc: any, i: number) => (
                                <div key={i} className="text-[11px] text-slate-700 truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="truncate">{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Change Password from Profile for Further Logins */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1f7e9e]/10 border border-[#1f7e9e]/30 flex items-center justify-center text-[#1f7e9e] shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Change Password for Further Logins
                      </h3>
                      <p className="text-xs text-slate-500">
                        Replace the initial password set by Admin with your own personal password
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950">
                    Your login email ID is <strong className="font-mono">{activeEmployee.email}</strong> (or Employee Code <strong className="font-mono">{statutory.empCode}</strong>). Once you update your password below, use your new password for all future ESS Portal and CRM logins.
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Current Password (Set by Admin or Previous Password) *
                      </label>
                      <input
                        type={changePwdForm.show ? 'text' : 'password'}
                        value={changePwdForm.current}
                        onChange={(e) => {
                          setChangePwdForm((p) => ({ ...p, current: e.target.value }));
                          setChangePwdError(null);
                        }}
                        placeholder="Enter current password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        New Login Password *
                      </label>
                      <input
                        type={changePwdForm.show ? 'text' : 'password'}
                        value={changePwdForm.next}
                        onChange={(e) => {
                          setChangePwdForm((p) => ({ ...p, next: e.target.value }));
                          setChangePwdError(null);
                        }}
                        placeholder="Enter new password (min 4 characters)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type={changePwdForm.show ? 'text' : 'password'}
                        value={changePwdForm.confirm}
                        onChange={(e) => {
                          setChangePwdForm((p) => ({ ...p, confirm: e.target.value }));
                          setChangePwdError(null);
                        }}
                        placeholder="Re-enter new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f7e9e]"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={changePwdForm.show}
                        onChange={(e) => setChangePwdForm((p) => ({ ...p, show: e.target.checked }))}
                        className="rounded text-[#1f7e9e]"
                      />
                      <span>Show passwords</span>
                    </label>

                    {changePwdError && (
                      <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{changePwdError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleChangePasswordSubmit}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Update My Password for Further Logins</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Employees must never see admin screens: if a non-admin reaches an admin tab, show their own overview */}
          {!isAdminUser && (activeTab === 'admin_dashboard' || activeTab === 'admin_master' || activeTab === 'reports' || activeTab === 'integration') && essPortalView}

          {/* TAB: ADMIN DASHBOARD & REPORTS (ALL EMPLOYEE INFO, REQUESTS & ATTENDANCE WITH GOOGLE COORDINATES) */}
          {activeTab === 'admin_dashboard' && isAdminUser && (
            <>
            <AdminPunchOnBehalf
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
                designation: m.designation,
              }))}
              selectedUserId={selectedAdminUserId}
              onSelectEmployee={setSelectedAdminUserId}
              isPunchedIn={Boolean(attendance.punchedIn)}
              punchInTime={attendance.punchInTime}
              punchOutTime={attendance.punchOutTime}
              workMode={attendance.workMode}
              isFetchingLocation={isFetchingLocation}
              onPunch={handleTogglePunch}
            />
            <PayrollAdminDashboardReportSection
              selectedAdminUserId={selectedAdminUserId}
              setSelectedAdminUserId={setSelectedAdminUserId}
              adminPolicyMaster={adminPolicyMaster}
              setAdminPolicyMaster={setAdminPolicyMaster}
              employeeSalaryMasters={employeeSalaryMasters}
              setEmployeeSalaryMasters={setEmployeeSalaryMasters}
              activeEmployeeId={activeEmployee?.id}
              activeAttendance={activeEmployee ? attendance : undefined}
              activeLeaves={activeEmployee ? leaves : undefined}
              setActiveLeaves={setLeaves}
              activeClaims={activeEmployee ? claims : undefined}
              setActiveClaims={setClaims}
              mapsApiKey={mapsApiKey}
              setStatusBanner={setStatusBanner}
              onJumpToManageEmployee={(empId) => {
                setSelectedAdminUserId(empId);
                setActiveTab('admin_master');
              }}
              onJumpToLoansModule={() => setActiveTab('loans')}
            />
            </>
          )}

          {/* TAB: PAYROLL REPORTS CATALOGUE (Admin only) */}
          {activeTab === 'reports' && isAdminUser && (
            <PayrollReportsSection
              employeeSalaryMasters={employeeSalaryMasters}
              adminPolicyMaster={adminPolicyMaster}
              setStatusBanner={setStatusBanner}
            />
          )}

          {/* TAB 7: ADMIN PAYROLL & SHARED CRM USERS MASTER CONTROL CENTER */}
          {activeTab === 'admin_master' && isAdminUser && (
            <>
            <PayrollLocationMaster
              locations={payrollLocations}
              onChangeLocations={setPayrollLocations}
              employees={enrolledEmployees}
              onAssignEmployee={(userId, locationId) => {
                setEmployeeSalaryMasters((prev) => {
                  const current = prev[userId];
                  if (!current) return prev;
                  return { ...prev, [userId]: { ...current, locationId } };
                });
              }}
              setStatusBanner={setStatusBanner}
            />
            <PayrollHolidayMaster
              policy={adminPolicyMaster}
              onChangePolicy={(patch) => setAdminPolicyMaster((prev) => ({ ...prev, ...patch }))}
              setStatusBanner={setStatusBanner}
            />
            <PayrollRegularizationSection
              mode="approver"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
              }))}
              requests={regularizationRequests}
              onChange={setRegularizationRequests}
              setStatusBanner={setStatusBanner}
            />
            <PayrollShiftRosterSection
              mode="admin"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
              }))}
              shifts={shifts}
              onChangeShifts={setShifts}
              assignments={shiftAssignments}
              onChangeAssignments={setShiftAssignments}
              swaps={shiftSwaps}
              onChangeSwaps={setShiftSwaps}
              setStatusBanner={setStatusBanner}
            />
            <PayrollHelpDeskSection
              mode="agent"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
              }))}
              tickets={helpDeskTickets}
              onChange={setHelpDeskTickets}
              setStatusBanner={setStatusBanner}
            />
            <div id="payroll-processing">
              <PayrollProcessingSection
                employees={enrolledEmployees}
                runs={payrollRuns}
                onChangeRuns={setPayrollRuns}
                currentUserName={currentUser.name || 'Administrator'}
                formatCurrency={formatCurrency}
                setStatusBanner={setStatusBanner}
              />
            </div>
            <PayrollLifecycleSection
              mode="admin"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
                designation: m.designation,
                monthlyGross: m.monthlyGross,
              }))}
              events={lifecycleEvents}
              onChange={setLifecycleEvents}
              setStatusBanner={setStatusBanner}
            />
            <div id="payroll-audit-trail">
              <PayrollAuditTrailSection
                runs={payrollRuns}
                regularization={regularizationRequests}
                swaps={shiftSwaps}
                tickets={helpDeskTickets}
                lifecycle={lifecycleEvents}
              />
            </div>
            <PayrollAssetsSection
              mode="admin"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
              }))}
              categories={assetCategories}
              onChangeCategories={setAssetCategories}
              assets={assets}
              onChangeAssets={setAssets}
              allocations={assetAllocations}
              onChangeAllocations={setAssetAllocations}
              setStatusBanner={setStatusBanner}
            />
            <div id="admin-talent">
            <PayrollTalentSection
              mode="admin"
              currentUserId={currentUser.id}
              currentUserName={currentUser.name || 'Administrator'}
              employees={enrolledEmployees.map((m) => ({
                userId: m.userId,
                name: m.name,
                empCode: m.empCode,
                department: m.department,
              }))}
              jobOpenings={jobOpenings}
              onChangeJobOpenings={setJobOpenings}
              candidates={candidates}
              onChangeCandidates={setCandidates}
              onboardingPlans={onboardingPlans}
              onChangeOnboardingPlans={setOnboardingPlans}
              performanceReviews={performanceReviews}
              onChangePerformanceReviews={setPerformanceReviews}
              trainingPrograms={trainingPrograms}
              onChangeTrainingPrograms={setTrainingPrograms}
              trainingNominations={trainingNominations}
              onChangeTrainingNominations={setTrainingNominations}
              setStatusBanner={setStatusBanner}
            />
            </div>
            <PayrollAdminMasterSection
              focusSection={adminFocusSection}
              focusNonce={adminFocusNonce}
              openCreateUser={adminOpenCreate}
              selectedAdminUserId={selectedAdminUserId}
              setSelectedAdminUserId={setSelectedAdminUserId}
              adminPolicyMaster={adminPolicyMaster}
              setAdminPolicyMaster={setAdminPolicyMaster}
              employeeSalaryMasters={employeeSalaryMasters}
              setEmployeeSalaryMasters={setEmployeeSalaryMasters}
              leaves={leaves}
              setLeaves={setLeaves}
              claims={claims}
              setClaims={setClaims}
              setStatutory={setStatutory}
              selectedMonthMeta={selectedMonthMeta}
              setStatusBanner={setStatusBanner}
              integrationSectionNode={
                <PayrollIntegrationSection
                  integrationConfig={integrationConfig}
                  setIntegrationConfig={setIntegrationConfig}
                  syncLogs={syncLogs}
                  showPayloadInspector={showPayloadInspector}
                  setShowPayloadInspector={setShowPayloadInspector}
                  baseMonthlyGross={baseMonthlyGross}
                  handleFetchFromPayroll={handleFetchFromPayroll}
                  handlePushToPayroll={handlePushToPayroll}
                  handleSyncPayrollNow={handleSyncPayrollNow}
                  handleDownloadPushBatchJson={handleDownloadPushBatchJson}
                  buildOutboundPushPayload={buildOutboundPushPayload}
                  setStatusBanner={setStatusBanner}
                />
              }
            />
            </>
          )}
        </div>
        )}

        {/* PAYCHAKRA SYSTEM FOOTER */}
        <PayChakraFooter />
      </div>

      {/* SELF-SERVICE CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Change Login Password</h3>
                  <p className="text-[11px] text-slate-300">
                    {activeEmployee?.name || currentUser.name || 'Your profile'} · synced to CRM &amp; Payroll ESS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type={changePwdForm.show ? 'text' : 'password'}
                  value={changePwdForm.current}
                  onChange={(e) => setChangePwdForm((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Enter your current password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type={changePwdForm.show ? 'text' : 'password'}
                  value={changePwdForm.next}
                  onChange={(e) => setChangePwdForm((p) => ({ ...p, next: e.target.value }))}
                  placeholder="Minimum 4 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type={changePwdForm.show ? 'text' : 'password'}
                  value={changePwdForm.confirm}
                  onChange={(e) => setChangePwdForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={changePwdForm.show}
                  onChange={(e) => setChangePwdForm((p) => ({ ...p, show: e.target.checked }))}
                  className="rounded text-slate-700"
                />
                Show passwords
              </label>

              {changePwdError && (
                <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{changePwdError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePasswordSubmit}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION OFF ALERT MODAL FOR PUNCH-IN / PUNCH-OUT */}
      {isLocationOffModalOpen && locationOffAlertAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="px-5 py-4 bg-rose-950 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Alert: Location is Turned Off
                  </h3>
                  <p className="text-[11px] text-rose-200">
                    Attendance Cannot Be Recorded While Location is Off
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationOffModalOpen(false)}
                className="text-rose-300 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Close popup (Alert banner will remain until location is turned on)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    {locationOffAlertAction === 'PUNCH_IN' ? 'Punch-In' : 'Punch-Out'} Not Recorded!
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    {locationSharePromptReason ||
                      'Your location is currently turned OFF. Attendance will not be recorded until you turn on location services and allow Google Maps coordinates to be fetched.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-bold text-slate-900">
                    {activeEmployee?.name || 'Employee'} ({statutory.empCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attempted Action:</span>
                  <span
                    className={`font-bold ${
                      locationOffAlertAction === 'PUNCH_IN'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {locationOffAlertAction === 'PUNCH_IN'
                      ? 'Punch In (Blocked — Location Off)'
                      : 'Punch Out (Blocked — Location Off)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendance Status:</span>
                  <span className="font-bold text-rose-700">Not Recorded</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsLocationOffModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition"
                >
                  Keep Location Off
                </button>
                <button
                  type="button"
                  disabled={isFetchingLocation}
                  onClick={handleConfirmShareLocationAndPunch}
                  className="px-4 py-2 rounded-xl bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-60"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {isFetchingLocation
                      ? 'Fetching Google Coordinates...'
                      : `Turn On Location & ${
                          locationOffAlertAction === 'PUNCH_IN' ? 'Punch In' : 'Punch Out'
                        }`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL PAYSLIP MODAL */}
      {isPayslipPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Official Salary Slip — {selectedMonthMeta.label}</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-sky-300">
                  {statutory.empCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadSalarySlipPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  title="Download Official Salary Slip PDF with logo branding"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPayslipPreviewOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>

            <div ref={printableSlipRef} className="p-8 space-y-6 text-xs text-slate-900 bg-white">
              {/* Top Company Header with Logo Branding */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 pt-0.5">
                    {supplierCompany?.logoUrl ? (
                      <img
                        src={supplierCompany.logoUrl}
                        alt={supplierCompany.name || 'Company Logo'}
                        className="h-12 w-auto max-w-[170px] object-contain rounded-lg border border-slate-200 p-0.5"
                      />
                    ) : (
                      <BrandLogo size="lg" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                      {supplierCompany?.legalName || supplierCompany?.name || 'Coreenact Solutions'}
                    </h2>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      {supplierCompany?.address}, {supplierCompany?.city}, {supplierCompany?.state} -{' '}
                      {supplierCompany?.pincode}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                      GSTIN: <strong>{supplierCompany?.gstin}</strong> · PAN: <strong>{supplierCompany?.pan}</strong>
                    </p>
                    <p className="text-slate-500 text-[10.5px]">
                      Phone: {supplierCompany?.phone} · Email: {supplierCompany?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="inline-block px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] rounded-md uppercase tracking-wider mb-1">
                    Official Salary Slip
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedMonthMeta.label}
                  </div>
                  <div className="text-slate-500 font-mono text-xs mt-0.5">
                    Emp Code: <strong>{statutory.empCode}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Pay Date: <strong>{selectedMonthMeta.payDate}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Employee Name:</span>{' '}
                    <strong>{activeEmployee?.name || 'Employee'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Designation:</span>{' '}
                    <strong>{activeEmployee?.designation || activeEmployee?.role || 'Employee'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Department:</span>{' '}
                    <strong>{activeEmployee?.department || 'General'}</strong>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">PAN / UAN:</span>{' '}
                    <strong className="font-mono">
                      {statutory.panNumber} / {statutory.uanNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Bank A/C:</span>{' '}
                    <strong className="font-mono">
                      {statutory.bankName} ({statutory.bankAccountNo})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Paid Days / Policy LOP:</span>{' '}
                    <strong>
                      {salaryBreakdown.paidDays} / {salaryBreakdown.calendar.totalCalendarDays} Days ({salaryBreakdown.lopDays} LOP · {salaryBreakdown.calendar.scheduledWorkingDays} Work Days)
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 block">Policy CS-HR-POL-001 Timings:</span>
                  <strong>9:30 AM – 6:00 PM (1h Break 1–2 PM)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Grace &amp; Late Cycle:</span>
                  <strong>
                    Grace {salaryBreakdown.graceUsedThisMonth}/3 · Late #{salaryBreakdown.lateCountThisMonth} ({salaryBreakdown.lateCycleHalfDays}d LOP)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">1 Leave / Month Quota:</span>
                  <strong>
                    {salaryBreakdown.paidLeaveDaysAllowed}d Paid · {salaryBreakdown.excessMonthlyLeaveLopDays + salaryBreakdown.unauthorizedAbsenceLopDays}d LOP
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Policy LOP Deduction:</span>
                  <strong className="font-mono text-rose-700">
                    -{formatCurrency(salaryBreakdown.policyLopDeductionAmount)} ({salaryBreakdown.lopDays}d)
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded-lg p-3 space-y-2">
                  <div className="font-bold border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-mono">{formatCurrency(salaryBreakdown.basic)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="font-mono">{formatCurrency(salaryBreakdown.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Allowance</span>
                    <span className="font-mono">
                      {formatCurrency(salaryBreakdown.specialAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conveyance Allowance</span>
                    <span className="font-mono">{formatCurrency(salaryBreakdown.conveyance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CRM Performance Incentive</span>
                    <span className="font-mono">{formatCurrency(salaryBreakdown.incentive)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-300 pt-1.5">
                    <span>Gross Earnings</span>
                    <span className="font-mono">
                      {formatCurrency(salaryBreakdown.grossEarnings)}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-lg p-3 space-y-2">
                  <div className="font-bold border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>Deductions &amp; Adjustments</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EPF Contribution (12%)</span>
                    <span className="font-mono">
                      - {formatCurrency(salaryBreakdown.pfDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax</span>
                    <span className="font-mono">
                      - {formatCurrency(salaryBreakdown.professionalTax)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Income Tax (TDS)</span>
                    <span className="font-mono">
                      - {formatCurrency(salaryBreakdown.incomeTaxTds)}
                    </span>
                  </div>
                  {salaryBreakdown.loanRecovery > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Loan EMI Recovery</span>
                      <span className="font-mono">
                        - {formatCurrency(salaryBreakdown.loanRecovery)}
                      </span>
                    </div>
                  )}
                  {salaryBreakdown.advanceRecovery > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Salary Advance Recovery</span>
                      <span className="font-mono">
                        - {formatCurrency(salaryBreakdown.advanceRecovery)}
                      </span>
                    </div>
                  )}
                  {salaryBreakdown.otherDeductions > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Other Admin Deductions</span>
                      <span className="font-mono">
                        - {formatCurrency(salaryBreakdown.otherDeductions)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700">
                    <span>Approved Reimbursements</span>
                    <span className="font-mono">
                      + {formatCurrency(salaryBreakdown.approvedReimbursements)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-300 pt-1.5">
                    <span>Net Salary Payable</span>
                    <span className="font-mono text-emerald-700">
                      {formatCurrency(salaryBreakdown.netPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay in words */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-blue-900 font-semibold">Net Salary in Words: </span>
                  <strong className="text-slate-900 font-bold">{amountInWords(salaryBreakdown.netPayable)}</strong>
                </div>
                <div className="font-mono text-sm font-extrabold text-emerald-700">
                  {formatCurrency(salaryBreakdown.netPayable)}
                </div>
              </div>

              {/* Signatory & Authorization Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-[11px] text-slate-600">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    Computer-generated ESS Salary Slip
                  </div>
                  <div>
                    Authorized by {supplierCompany?.legalName || supplierCompany?.name || 'HR & Payroll Operations'}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Synced with CRM Attendance &amp; Order Incentive Engine · {integrationConfig.providerLabel}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block text-center border-t border-slate-700 pt-1 min-w-[170px]">
                    <div className="text-[10px] text-blue-700 font-bold mb-1">✓ Digitally Signed &amp; Verified</div>
                    <div className="font-bold text-slate-900 text-xs">Authorized HR Signatory</div>
                    <div className="text-[10px] text-slate-500">{supplierCompany?.name || 'Coreenact Solutions'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
