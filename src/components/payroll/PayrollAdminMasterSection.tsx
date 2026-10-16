import React, { useState, useEffect } from 'react';
import { localIsoDate } from '../../shared/geo';
import { useCrm } from '../../context/CrmContext';
import {
  User,
  UserRole,
  CrmModuleKey,
  PermissionAction,
  RolePermissionsMap,
} from '../../types';
import { ALL_CRM_MODULES, DEFAULT_ROLE_PERMISSIONS } from '../../data/initialData';
import {
  AdminPolicyMaster,
  EmployeeSalaryMasterRecord,
  LeaveRequestItem,
  ExpenseClaimItem,
  StatutoryDetails,
  OrgMasterItem,
  PayrollOrgMasters,
  loadPayrollOrgMasters,
  savePayrollOrgMasters,
  PAYROLL_ORG_MASTERS_SYNC_EVENT,
  PAYROLL_MASTERS_SYNC_EVENT,
  PAYROLL_MASTERS_STORAGE_KEY,
  generateRandomPassword,
  clearAllPayrollData,
  loadEmployeeSalaryMasters,
  saveEmployeeSalaryMasters,
  fetchServerEmployeeSalaryMasters,
  restoreLocalEmployeeSalaryMasters,
  getNextAvailableEmpCode,
  collectExistingEmpCodes,
  normalizeEmpCode,
  parseEmpCodeNumber,
  formatEmpCode,
  resequenceEmployeeRecords,
  isDuplicateEmpCode,
  getDeletedPayrollMasterIds,
  recordDeletedPayrollMasterIds,
  forgetDeletedPayrollMasterIds,
  getRoleDefaultGross,
  buildDefaultSalaryMasterRecord,
  loadEmployeeAttendance,
  saveEmployeeAttendance,
  loadEmployeeLeaves,
  loadEmployeeClaims,
  DEFAULT_ADMIN_POLICY_MASTER,
  saveAdminPolicyMaster,
  evaluateAttendancePolicy,
  calculateEmployeePolicyPayroll,
} from './payrollTypes';
import {
  Loader2,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Download,
  UserPlus,
  Check,
  X,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRightLeft,
  Key,
  Copy,
  RefreshCw,
  Briefcase,
  Building,
  MapPin,
  Sparkles,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Lock,
  Layers,
  Search,
  Eye,
  EyeOff,
  Share2,
  Unlink,
  Users,
  FileText,
  Clock,
  Landmark,
  Wallet,
} from 'lucide-react';

interface PayrollAdminMasterSectionProps {
  selectedAdminUserId: string;
  setSelectedAdminUserId: (id: string) => void;
  adminPolicyMaster: AdminPolicyMaster;
  setAdminPolicyMaster: React.Dispatch<React.SetStateAction<AdminPolicyMaster>>;
  employeeSalaryMasters: Record<string, EmployeeSalaryMasterRecord>;
  setEmployeeSalaryMasters: React.Dispatch<
    React.SetStateAction<Record<string, EmployeeSalaryMasterRecord>>
  >;
  leaves: LeaveRequestItem[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequestItem[]>>;
  claims: ExpenseClaimItem[];
  setClaims: React.Dispatch<React.SetStateAction<ExpenseClaimItem[]>>;
  setStatutory: React.Dispatch<React.SetStateAction<StatutoryDetails>>;
  selectedMonthMeta: {
    key: string;
    label: string;
    payDate: string;
    paidDays: number;
    lopDays: number;
  };
  setStatusBanner: (msg: string | null) => void;
  integrationSectionNode?: React.ReactNode;
  /** Focus a specific sub-section when navigated to from the header menu. */
  focusSection?: string;
  /** Bump to re-apply focusSection even when the value is unchanged. */
  focusNonce?: number;
  /** Open the "create employee" form directly (header "Add New Employee"). */
  openCreateUser?: boolean;
}

const USER_ROLES: UserRole[] = [
  'Super Admin',
  'Administrator',
  'Sales Manager',
  'Sales Executive',
  'Finance Manager',
  'Finance Executive',
  'Management/Viewer',
];

const USER_DEPARTMENTS: User['department'][] = [
  'Sales',
  'Finance',
  'Executive',
  'Operations',
];

export const PayrollAdminMasterSection: React.FC<PayrollAdminMasterSectionProps> = ({
  selectedAdminUserId,
  setSelectedAdminUserId,
  adminPolicyMaster,
  setAdminPolicyMaster,
  employeeSalaryMasters,
  setEmployeeSalaryMasters,
  leaves,
  setLeaves,
  claims,
  setClaims,
  setStatutory,
  selectedMonthMeta,
  setStatusBanner,
  integrationSectionNode,
  focusSection,
  focusNonce,
  openCreateUser,
}) => {
  const {
    currentUser,
    users,
    customers,
    addUser,
    updateUser,
    deleteUser,
    rolePermissions,
    updateUserCustomPermissions,
    supplierCompany,
    formatCurrency,
    canEdit,
    auditLogs,
  } = useCrm();

  const [employeeDetailView, setEmployeeDetailView] = useState<'allocations' | 'employee_info'>('allocations');

  const isSystemAdmin =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Administrator' ||
    currentUser.role?.toLowerCase().includes('admin') ||
    currentUser.role?.toLowerCase().includes('hr') ||
    currentUser.role?.toLowerCase().includes('manager') ||
    canEdit('masters') ||
    currentUser.id === 'usr-1';

  const [adminSubTab, setAdminSubTab] = useState<
    'salary_master' | 'org_masters' | 'policy_master' | 'approvals' | 'payroll_run' | 'external_integration'
  >('salary_master');

  const [userFormMode, setUserFormMode] = useState<'edit' | 'create'>('edit');

  // Apply a section focus requested from the header sub-navigation, so every header
  // option lands on the section it names rather than all on the first one.
  useEffect(() => {
    const valid = [
      'salary_master',
      'org_masters',
      'policy_master',
      'approvals',
      'payroll_run',
      'external_integration',
    ];
    if (focusSection && valid.includes(focusSection)) {
      setAdminSubTab(focusSection as typeof adminSubTab);
    }
    if (openCreateUser) {
      setUserFormMode('create');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection, focusNonce, openCreateUser]);

  // Option: "Do you want to create this user in CRM as well?" when creating in Payroll
  const [alsoCreateInCrm, setAlsoCreateInCrm] = useState<boolean>(true);
  const [crmPermPreset, setCrmPermPreset] = useState<
    'role_default' | 'full_access' | 'read_only' | 'custom'
  >('role_default');
  const [showCustomPermMatrix, setShowCustomPermMatrix] = useState<boolean>(false);
  const [customPermsDraft, setCustomPermsDraft] = useState<RolePermissionsMap>(
    () => ({ ...(rolePermissions['Sales Executive'] || DEFAULT_ROLE_PERMISSIONS['Sales Executive']) })
  );

  // Organization Masters state (Roles, Designations, Locations, Departments)
  const [orgMasters, setOrgMasters] = useState<PayrollOrgMasters>(() => loadPayrollOrgMasters());
  useEffect(() => {
    const syncOrg = () => setOrgMasters(loadPayrollOrgMasters());
    window.addEventListener(PAYROLL_ORG_MASTERS_SYNC_EVENT, syncOrg);
    return () => window.removeEventListener(PAYROLL_ORG_MASTERS_SYNC_EVENT, syncOrg);
  }, []);

  // Real-time auto-refresh open admin views when an employee updates fields via ESS or PostgreSQL updates
  useEffect(() => {
    const syncPayrollMasters = () => {
      const reloaded = loadEmployeeSalaryMasters(
        users,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
      setEmployeeSalaryMasters((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(reloaded)) return prev;
        return reloaded;
      });
    };
    window.addEventListener(PAYROLL_MASTERS_SYNC_EVENT, syncPayrollMasters);
    window.addEventListener('crm-payroll-masters-updated', syncPayrollMasters);
    window.addEventListener('crm-employee-updated', syncPayrollMasters);
    window.addEventListener('crm-payroll-refresh', syncPayrollMasters);
    return () => {
      window.removeEventListener(PAYROLL_MASTERS_SYNC_EVENT, syncPayrollMasters);
      window.removeEventListener('crm-payroll-masters-updated', syncPayrollMasters);
      window.removeEventListener('crm-employee-updated', syncPayrollMasters);
      window.removeEventListener('crm-payroll-refresh', syncPayrollMasters);
    };
  }, [users, supplierCompany?.bankName, supplierCompany?.ifscCode, setEmployeeSalaryMasters]);

  const [orgMasterCategory, setOrgMasterCategory] = useState<
    'roles' | 'designations' | 'locations' | 'departments'
  >('roles');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [editingOrgItem, setEditingOrgItem] = useState<{
    category: 'roles' | 'designations' | 'locations' | 'departments';
    mode: 'create' | 'edit';
    item: OrgMasterItem;
  } | null>(null);

  // Clear All Data modal state
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [toastCopiedMessage, setToastCopiedMessage] = useState<string | null>(null);
  const [unlinkConfirmTarget, setUnlinkConfirmTarget] = useState<any | null>(null);

  const [newUserDraft, setNewUserDraft] = useState(() => {
    // No auto-generated temporary password — the Admin sets the login password.
    return {
      name: '',
      username: '',
      email: '',
      password: 'Welcome@123',
      tempPassword: 'Welcome@123',
      mustChangePasswordOnFirstLogin: false,
      accessType: 'payroll_only' as 'payroll_only' | 'crm_and_payroll',
      phone: '+91 ',
      role: 'Sales Executive',
      department: 'Sales',
      designation: 'Sales Executive',
      location: 'Mumbai HQ',
      reportingManager: users[0]?.name || 'Vikramaditya Rathore',
      assignedTerritory: 'West Zone (Maharashtra & Gujarat)',
      status: 'Active' as 'Active' | 'Inactive',
      empCode: getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users)),
      monthlyGross: 78000,
      basicPct: 50,
      hraPct: 25,
      specialPct: 18,
      commissionPct: 1.5,
      pfAmount: 1800,
      profTax: 200,
      tdsPct: 8.5,
      lopDays: 0,
      panNumber: 'ABCDE5678F',
      uanNumber: '101489203999',
      pfAccountNo: 'MH/BAN/0048291/000/000199',
      taxRegime: 'New Tax Regime (Section 115BAC)' as
        | 'New Tax Regime (Section 115BAC)'
        | 'Old Tax Regime (With Exemptions)',
      bankName: supplierCompany?.bankName || 'HDFC Bank Ltd',
      bankAccountNo: '50100482910999',
      ifscCode: supplierCompany?.ifscCode || 'HDFC0001245',
      plQuota: adminPolicyMaster.plQuota || 12,
      clQuota: adminPolicyMaster.clQuota || 6,
      slQuota: adminPolicyMaster.slQuota || 6,
      compOffQuota: adminPolicyMaster.compOffQuota || 4,
      shiftTiming: `${adminPolicyMaster.shiftStartTime} - ${adminPolicyMaster.shiftEndTime}`,
      workMode: 'Office HQ' as 'Office HQ' | 'Work From Home' | 'Client Site Visit',
    };
  });

  // Inline Edit States for Leave & Expense Claim in Admin Desk
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [editingLeaveDraft, setEditingLeaveDraft] = useState<LeaveRequestItem | null>(null);

  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingClaimDraft, setEditingClaimDraft] = useState<ExpenseClaimItem | null>(null);
  const [editEmpPasswordDraft, setEditEmpPasswordDraft] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    designation: string;
    location: string;
    status: 'Active' | 'Inactive';
    inCrm: boolean;
    inPayroll: boolean;
    master: EmployeeSalaryMasterRecord;
  } | null>(null);
  const [deleteFromCrmCheckbox, setDeleteFromCrmCheckbox] = useState<boolean>(true);

  // Build employee list from enrolled employees and sort naturally by Employee Code (EMP-101, EMP-102...)
  const unifiedEmployeeList = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      designation: string;
      location: string;
      status: 'Active' | 'Inactive';
      inCrm: boolean;
      inPayroll: boolean;
      master: EmployeeSalaryMasterRecord;
    }> = [];

    const enrolledUserIds = new Set<string>();

    Object.values(employeeSalaryMasters).forEach((m) => {
      if (!m || !m.userId) return;
      enrolledUserIds.add(m.userId);
      const mEmail = m.email ? m.email.toLowerCase() : '';
      const crmUser =
        users.find((u) => u.id === m.userId) ||
        (mEmail ? users.find((u) => u.email?.toLowerCase() === mEmail) : undefined);
      if (crmUser) enrolledUserIds.add(crmUser.id);
      list.push({
        id: m.userId,
        name: m.name || crmUser?.name || 'Employee',
        email: m.email || crmUser?.email || '',
        phone: m.phone || crmUser?.phone || '',
        role: m.role || crmUser?.role || 'Sales Executive',
        department: m.department || crmUser?.department || 'Sales',
        designation: m.designation || crmUser?.designation || m.role || 'Employee',
        location: m.location || crmUser?.location || 'Corporate HQ',
        status: m.status || crmUser?.status || 'Active',
        inCrm: Boolean(crmUser && m.accessType !== 'payroll_only'),
        inPayroll: true,
        master: m,
      });
    });

    // Also include CRM users not yet enrolled in employeeSalaryMasters
    const deletedMasterIds = new Set(getDeletedPayrollMasterIds());
    users.forEach((u, idx) => {
      if (!u || !u.id || enrolledUserIds.has(u.id)) return;
      // Do not auto-enroll employees that were explicitly deleted from payroll
      if (deletedMasterIds.has(u.id)) return;
      // Payroll-only accounts are dedicated ESS users, not CRM users
      if (u.accessScope === 'payroll_only' || u.accessType === 'payroll_only') return;
      const uEmail = (u.email || '').toLowerCase();
      if (uEmail && list.some((item) => item.email.toLowerCase() === uEmail)) return;

      const fallbackMaster = buildDefaultSalaryMasterRecord(u, idx + 1);
      list.push({
        id: u.id,
        name: u.name || 'User',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'Sales Executive',
        department: u.department || 'Sales',
        designation: u.designation || u.role || 'Employee',
        location: u.location || 'Mumbai HQ',
        status: u.status || 'Active',
        inCrm: true,
        inPayroll: false,
        master: fallbackMaster,
      });
    });

    // Natural numeric sequence sort: Super Admin first (EMP-101), then by code ascending
    list.sort((a, b) => {
      const isSuperA = a.id === 'usr-1' || a.role === 'Super Admin';
      const isSuperB = b.id === 'usr-1' || b.role === 'Super Admin';
      if (isSuperA && !isSuperB) return -1;
      if (!isSuperA && isSuperB) return 1;
      const numA = parseEmpCodeNumber(a.master?.empCode);
      const numB = parseEmpCodeNumber(b.master?.empCode);
      if (numA !== numB) return numA - numB;
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [users, employeeSalaryMasters]);

  const activeEmployeesCount = React.useMemo(
    () => unifiedEmployeeList.filter((e) => e.status !== 'Inactive').length,
    [unifiedEmployeeList]
  );

  const inactiveEmployeesCount = React.useMemo(
    () => unifiedEmployeeList.filter((e) => e.status === 'Inactive').length,
    [unifiedEmployeeList]
  );

  const filteredEmployeeList = React.useMemo(() => {
    return unifiedEmployeeList.filter((entry) => {
      if (employeeStatusFilter === 'Active' && entry.status === 'Inactive') return false;
      if (employeeStatusFilter === 'Inactive' && entry.status !== 'Inactive') return false;
      if (employeeSearchQuery.trim()) {
        const q = employeeSearchQuery.trim().toLowerCase();
        const matchesName = (entry.name || '').toLowerCase().includes(q);
        const matchesCode = (entry.master?.empCode || '').toLowerCase().includes(q);
        const matchesEmail = (entry.email || '').toLowerCase().includes(q);
        const matchesDept = (entry.department || '').toLowerCase().includes(q);
        const matchesRole = (entry.role || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail && !matchesDept && !matchesRole) return false;
      }
      return true;
    });
  }, [unifiedEmployeeList, employeeStatusFilter, employeeSearchQuery]);

  const hasEmpCodeCollisions = React.useMemo(() => {
    const seen = new Set<string>();
    for (const entry of unifiedEmployeeList) {
      const code = normalizeEmpCode(entry.master?.empCode);
      if (!code) continue;
      if (seen.has(code)) return true;
      seen.add(code);
    }
    return false;
  }, [unifiedEmployeeList]);

  // Dynamic Org Options derived from Org Masters (fallback to defaults if empty)
  const dynamicRoles = React.useMemo(() => {
    const fromMaster = orgMasters.roles.filter((r) => r.isActive).map((r) => r.name);
    return Array.from(new Set([...fromMaster, ...USER_ROLES]));
  }, [orgMasters.roles]);

  const dynamicDesignations = React.useMemo(() => {
    const fromMaster = orgMasters.designations.filter((d) => d.isActive).map((d) => d.name);
    const defaults = [
      'Sales Executive',
      'Sales Manager',
      'Account Executive',
      'Finance Executive',
      'Finance Manager',
      'Operations Specialist',
      'Customer Support Lead',
      'Technical Support Specialist',
      'Administrator',
      'Director',
    ];
    return Array.from(new Set([...fromMaster, ...defaults]));
  }, [orgMasters.designations]);

  const dynamicLocations = React.useMemo(() => {
    const fromMaster = orgMasters.locations.filter((l) => l.isActive).map((l) => l.name);
    const defaults = [
      'Mumbai HQ',
      'New Delhi HQ',
      'Bengaluru Branch',
      'Pune Hub',
      'Hyderabad Center',
      'Chennai Office',
      'Kolkata Office',
    ];
    return Array.from(new Set([...fromMaster, ...defaults]));
  }, [orgMasters.locations]);

  const dynamicDepartments = React.useMemo(() => {
    const fromMaster = orgMasters.departments.filter((d) => d.isActive).map((d) => d.name);
    return Array.from(
      new Set([
        ...fromMaster,
        ...USER_DEPARTMENTS,
        'Customer Support',
        'Engineering',
        'Human Resources',
      ])
    );
  }, [orgMasters.departments]);

  // Org Master CRUD actions
  const handleSaveOrgItem = (itemData: {
    category: 'roles' | 'designations' | 'locations' | 'departments';
    id?: string;
    name: string;
    code?: string;
    description?: string;
    isActive: boolean;
  }) => {
    if (!itemData.name.trim()) return;
    const { category } = itemData;
    const currentList = orgMasters[category] || [];

    let updatedList: OrgMasterItem[];
    if (itemData.id) {
      updatedList = currentList.map((item) =>
        item.id === itemData.id
          ? {
              ...item,
              name: itemData.name.trim(),
              code: itemData.code?.trim() || item.code,
              description: itemData.description?.trim() || '',
              isActive: itemData.isActive,
            }
          : item
      );
    } else {
      const prefix =
        category === 'roles'
          ? 'ROL'
          : category === 'designations'
          ? 'DES'
          : category === 'locations'
          ? 'LOC'
          : 'DEP';
      const newItem: OrgMasterItem = {
        id: `${prefix}-${Date.now().toString().slice(-5)}`,
        name: itemData.name.trim(),
        code:
          itemData.code?.trim() ||
          `${prefix}-${String(currentList.length + 1).padStart(2, '0')}`,
        description: itemData.description?.trim() || '',
        isActive: itemData.isActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updatedList = [...currentList, newItem];
    }

    const nextMasters: PayrollOrgMasters = {
      ...orgMasters,
      [category]: updatedList,
    };
    setOrgMasters(nextMasters);
    savePayrollOrgMasters(nextMasters, true);
    setEditingOrgItem(null);
    setStatusBanner(
      `Saved ${category.slice(0, -1)} master "${itemData.name.trim()}" successfully.`
    );
  };

  const handleDeleteOrgItem = (
    category: 'roles' | 'designations' | 'locations' | 'departments',
    item: OrgMasterItem
  ) => {
    const updatedList = (orgMasters[category] || []).filter((i) => i.id !== item.id);
    const nextMasters: PayrollOrgMasters = {
      ...orgMasters,
      [category]: updatedList,
    };
    setOrgMasters(nextMasters);
    savePayrollOrgMasters(nextMasters, true);
    setStatusBanner(`Deleted ${category.slice(0, -1)} master "${item.name}".`);
  };

  const handlePreFillDefaultOrgMasters = () => {
    const defaultRoles: OrgMasterItem[] = [
      { id: 'ROL-01', name: 'Sales Executive', code: 'ROL-01', description: 'Frontline sales and customer relationship', isActive: true, createdAt: '2026-01-01' },
      { id: 'ROL-02', name: 'Sales Manager', code: 'ROL-02', description: 'Sales team lead, pipeline and quota management', isActive: true, createdAt: '2026-01-01' },
      { id: 'ROL-03', name: 'Finance Executive', code: 'ROL-03', description: 'Billing, collections and reconciliation', isActive: true, createdAt: '2026-01-01' },
      { id: 'ROL-04', name: 'Finance Manager', code: 'ROL-04', description: 'Financial controls, audit and taxation', isActive: true, createdAt: '2026-01-01' },
      { id: 'ROL-05', name: 'Super Admin', code: 'ROL-05', description: 'Full system privileges across all modules', isActive: true, createdAt: '2026-01-01' },
      { id: 'ROL-06', name: 'Administrator', code: 'ROL-06', description: 'Company operations and master configurations', isActive: true, createdAt: '2026-01-01' },
    ];
    const defaultDesigs: OrgMasterItem[] = [
      { id: 'DES-01', name: 'Business Development Manager', code: 'DES-01', description: 'Enterprise deal acquisition', isActive: true, createdAt: '2026-01-01' },
      { id: 'DES-02', name: 'Account Executive', code: 'DES-02', description: 'Direct customer engagement', isActive: true, createdAt: '2026-01-01' },
      { id: 'DES-03', name: 'Senior Finance Specialist', code: 'DES-03', description: 'Invoicing & ledger reconciliation', isActive: true, createdAt: '2026-01-01' },
      { id: 'DES-04', name: 'Operations Lead', code: 'DES-04', description: 'Order fulfillment & supply chain', isActive: true, createdAt: '2026-01-01' },
      { id: 'DES-05', name: 'Technical Support Lead', code: 'DES-05', description: 'Support ticket resolution & AMC maintenance', isActive: true, createdAt: '2026-01-01' },
    ];
    const defaultLocs: OrgMasterItem[] = [
      { id: 'LOC-01', name: 'Mumbai HQ', code: 'LOC-01', description: 'Corporate headquarters, Bandra Kurla Complex', isActive: true, createdAt: '2026-01-01' },
      { id: 'LOC-02', name: 'New Delhi HQ', code: 'LOC-02', description: 'North Zone regional office, Okhla', isActive: true, createdAt: '2026-01-01' },
      { id: 'LOC-03', name: 'Bengaluru Branch', code: 'LOC-03', description: 'South Zone tech & customer delivery center', isActive: true, createdAt: '2026-01-01' },
      { id: 'LOC-04', name: 'Pune Hub', code: 'LOC-04', description: 'West Zone operations and logistics hub', isActive: true, createdAt: '2026-01-01' },
      { id: 'LOC-05', name: 'Hyderabad Center', code: 'LOC-05', description: 'HITEC City regional branch', isActive: true, createdAt: '2026-01-01' },
    ];
    const defaultDepts: OrgMasterItem[] = [
      { id: 'DEP-01', name: 'Sales', code: 'DEP-01', description: 'Commercial business and accounts', isActive: true, createdAt: '2026-01-01' },
      { id: 'DEP-02', name: 'Finance', code: 'DEP-02', description: 'Accounts, taxes and receivables', isActive: true, createdAt: '2026-01-01' },
      { id: 'DEP-03', name: 'Operations', code: 'DEP-03', description: 'Logistics, delivery and orders', isActive: true, createdAt: '2026-01-01' },
      { id: 'DEP-04', name: 'Executive', code: 'DEP-04', description: 'Leadership and management', isActive: true, createdAt: '2026-01-01' },
      { id: 'DEP-05', name: 'Customer Support', code: 'DEP-05', description: 'After-sales, warranties and service contracts', isActive: true, createdAt: '2026-01-01' },
    ];
    const populated = {
      roles: defaultRoles,
      designations: defaultDesigs,
      locations: defaultLocs,
      departments: defaultDepts,
    };
    setOrgMasters(populated);
    savePayrollOrgMasters(populated, true);
    setStatusBanner('Pre-filled standard corporate defaults for Roles, Designations, Locations, and Departments.');
  };

  const handleRegeneratePasswordForEmployee = (empId: string, customPass?: string) => {
    const newPass = (customPass && customPass.trim()) || generateRandomPassword();
    setEmployeeSalaryMasters((prev) => {
      const fallbackEntry = unifiedEmployeeList.find((e) => e.id === empId);
      const existing = prev[empId] || fallbackEntry?.master;
      if (!existing) return prev;
      const updated: EmployeeSalaryMasterRecord = {
        ...existing,
        userId: empId,
        password: newPass,
        tempPassword: newPass,
        mustChangePasswordOnFirstLogin: false,
      };
      const next = {
        ...prev,
        [empId]: updated,
      };
      forgetDeletedPayrollMasterIds([empId]);
      saveEmployeeSalaryMasters(next, true, false, [empId]);
      return next;
    });
    const crmMatch = users.find((u) => u.id === empId);
    if (crmMatch) {
      updateUser(crmMatch.id, {
        password: newPass,
        tempPassword: newPass,
        mustChangePassword: false,
        mustChangePasswordOnFirstLogin: false,
      });
    }
    setStatusBanner('Updated login password for employee.');
  };

  const targetEntry =
    unifiedEmployeeList.find((e) => e.id === selectedAdminUserId) || unifiedEmployeeList[0] || null;

  const targetMaster = targetEntry?.master || buildDefaultSalaryMasterRecord(currentUser, 0);

  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  const updateSelectedMaster = (patch: Partial<EmployeeSalaryMasterRecord>) => {
    if (!targetEntry) return;
    const nextPatch = { ...patch };
    if (nextPatch.empCode !== undefined) {
      nextPatch.empCode = normalizeEmpCode(nextPatch.empCode) || nextPatch.empCode;
    }
    if (nextPatch.password !== undefined) {
      nextPatch.tempPassword = nextPatch.password;
    } else if (nextPatch.tempPassword !== undefined) {
      nextPatch.password = nextPatch.tempPassword;
    }
    const updated: EmployeeSalaryMasterRecord = {
      ...targetMaster,
      ...nextPatch,
      userId: targetEntry.id,
    };
    setEmployeeSalaryMasters((prev) => {
      const next = {
        ...prev,
        [targetEntry.id]: updated,
      };
      try {
        localStorage.setItem(PAYROLL_MASTERS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (targetEntry.id === currentUser.id) {
      setStatutory((prevStat) => ({
        ...prevStat,
        empCode: updated.empCode,
        panNumber: updated.panNumber,
        uanNumber: updated.uanNumber,
        bankName: updated.bankName,
        bankAccountNo: updated.bankAccountNo,
        ifscCode: updated.ifscCode,
      }));
    }
  };

  const handleSaveExistingEmployee = async () => {
    if (!targetEntry) return;
    const current = targetMaster;
    const cleanName = current.name ? String(current.name).trim() : '';
    const cleanEmail = current.email ? String(current.email).trim().toLowerCase() : '';
    if (!cleanName) {
      setStatusBanner('Please specify the employee name.');
      return;
    }
    if (!cleanEmail) {
      setStatusBanner('Please specify an official email address.');
      return;
    }

    let normCode = normalizeEmpCode(current.empCode);
    if (!normCode) {
      normCode = getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users));
    }

    if (isDuplicateEmpCode(normCode, employeeSalaryMasters, targetEntry.id)) {
      const nextFree = getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users));
      setStatusBanner(
        `Employee Code "${normCode}" is already in use by another employee. Please change it or use next free code (${nextFree}).`
      );
      return;
    }

    setIsSavingEmployee(true);
    try {
      const updatedRecord: EmployeeSalaryMasterRecord = {
        ...current,
        name: cleanName,
        email: cleanEmail,
        empCode: normCode,
        userId: targetEntry.id,
      };

      const nextMasters: Record<string, EmployeeSalaryMasterRecord> = {
        ...employeeSalaryMasters,
        [targetEntry.id]: updatedRecord,
      };

      forgetDeletedPayrollMasterIds([targetEntry.id]);
      setEmployeeSalaryMasters(nextMasters);

      // Keep linked CRM User record in sync including all profile and statutory fields
      const linkedCrmUser = users.find(
        (u) =>
          u.id === targetEntry.id ||
          (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail)
      );
      if (linkedCrmUser) {
        const resolvedAccessType =
          updatedRecord.accessType !== undefined
            ? updatedRecord.accessType
            : updatedRecord.syncedWithCrm
            ? 'crm_and_payroll'
            : 'payroll_only';
        updateUser(linkedCrmUser.id, {
          name: updatedRecord.name,
          email: updatedRecord.email,
          phone: updatedRecord.phone,
          department: updatedRecord.department as any,
          designation: updatedRecord.designation,
          location: updatedRecord.location,
          role: updatedRecord.role as UserRole,
          status: updatedRecord.status,
          empCode: normCode,
          gender: (updatedRecord as any).gender,
          dateOfBirth: (updatedRecord as any).dateOfBirth,
          bloodGroup: (updatedRecord as any).bloodGroup,
          maritalStatus: (updatedRecord as any).maritalStatus,
          panNumber: updatedRecord.panNumber,
          bankName: updatedRecord.bankName,
          bankAccountNo: updatedRecord.bankAccountNo,
          ifscCode: updatedRecord.ifscCode,
          uanNumber: updatedRecord.uanNumber,
          pfAccountNo: updatedRecord.pfAccountNo,
          taxRegime: updatedRecord.taxRegime,
          ...(updatedRecord.password
            ? {
                password: updatedRecord.password,
                tempPassword: updatedRecord.password,
                mustChangePassword: false,
                mustChangePasswordOnFirstLogin: false,
              }
            : {}),
          accessType: resolvedAccessType,
          accessScope: resolvedAccessType === 'payroll_only' ? 'payroll_only' : 'all',
        });
      }

      const saveRes = await saveEmployeeSalaryMasters({ [targetEntry.id]: updatedRecord }, true, false, [targetEntry.id]);
      if (saveRes.ok) {
        setStatusBanner(
          `✓ Successfully saved employee "${updatedRecord.name}" (${updatedRecord.empCode}) in Payroll & CRM!`
        );
      } else {
        setStatusBanner(`✕ Could not save employee on server: ${saveRes.message || 'Validation error'}`);
      }
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const handleResequenceAllEmployees = async () => {
    const { resequencedMasters, resequencedUsers, changedCount } = resequenceEmployeeRecords(
      employeeSalaryMasters,
      users
    );
    if (changedCount === 0) {
      setStatusBanner('✓ All employee records are already cleanly sequenced (EMP-101 onwards).');
      return;
    }

    // Synchronize CRM user empCodes
    for (const u of resequencedUsers) {
      const match = users.find((existing) => existing.id === u.id);
      if (match && match.empCode !== u.empCode) {
        updateUser(u.id, { empCode: u.empCode });
      }
    }

    setEmployeeSalaryMasters(resequencedMasters);
    const res = await saveEmployeeSalaryMasters(resequencedMasters, true, true);
    if (res.ok) {
      setStatusBanner(
        `✓ Successfully re-sequenced ${resequencedUsers.length} employees starting from EMP-101. All duplicate codes resolved!`
      );
    } else {
      setStatusBanner(`✕ Could not re-sequence on server: ${res.message || 'Error occurred'}`);
    }
  };

  const applyCrmPresetToDraft = (
    preset: 'role_default' | 'full_access' | 'read_only' | 'custom',
    role: UserRole
  ) => {
    setCrmPermPreset(preset);
    if (preset === 'role_default') {
      const base = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
      setCustomPermsDraft({ ...base });
    } else if (preset === 'full_access') {
      const next = {} as RolePermissionsMap;
      ALL_CRM_MODULES.forEach((m) => {
        next[m.id] = { view: true, create: true, edit: true, delete: true };
      });
      setCustomPermsDraft(next);
    } else if (preset === 'read_only') {
      const next = {} as RolePermissionsMap;
      ALL_CRM_MODULES.forEach((m) => {
        next[m.id] = { view: true, create: false, edit: false, delete: false };
      });
      setCustomPermsDraft(next);
    } else {
      setShowCustomPermMatrix(true);
    }
  };

  const toggleDraftModulePerm = (mod: CrmModuleKey, action: PermissionAction) => {
    setCrmPermPreset('custom');
    setCustomPermsDraft((prev) => {
      const current = prev[mod]?.[action] ?? false;
      const nextVal = !current;
      const updatedMod = { ...prev[mod], [action]: nextVal };
      if (action === 'view' && !nextVal) {
        updatedMod.create = false;
        updatedMod.edit = false;
        updatedMod.delete = false;
      } else if (action !== 'view' && nextVal) {
        updatedMod.view = true;
      }
      return { ...prev, [mod]: updatedMod };
    });
  };

  const handleCreateEmployeeWithAllocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserDraft.name.trim() || !newUserDraft.email.trim()) {
      setStatusBanner('Please enter Employee Full Name and Official Email.');
      return;
    }

    const cleanEmail = newUserDraft.email.trim().toLowerCase();
    const existingEmailUser = users.find(
      (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
    );
    const existingEmailMaster = Object.values(employeeSalaryMasters).find(
      (m) => m && m.email && m.email.trim().toLowerCase() === cleanEmail
    );
    const excludeId = existingEmailUser?.id || existingEmailMaster?.userId;

    // The server enforces unique employee codes across EVERY master and rejects the whole batch
    // when one collides, so allocate against its authoritative set merged with the local cache -
    // the cache alone cannot prove a code is free. This field is auto-generated and read-only, so
    // moving to the next free code is safer than failing the save after the CRM login has already
    // been created (which used to leave an employee in the Users master but not in payroll).
    const serverMasters = await fetchServerEmployeeSalaryMasters();
    const mastersForCodes: Record<string, EmployeeSalaryMasterRecord> = serverMasters
      ? { ...serverMasters, ...employeeSalaryMasters }
      : employeeSalaryMasters;
    const draftedEmpCode = normalizeEmpCode(newUserDraft.empCode);
    const resolvedEmpCode =
      draftedEmpCode && !isDuplicateEmpCode(draftedEmpCode, mastersForCodes, excludeId)
        ? draftedEmpCode
        : getNextAvailableEmpCode(mastersForCodes, collectExistingEmpCodes(users));
    if (isDuplicateEmpCode(resolvedEmpCode, mastersForCodes, excludeId)) {
      setStatusBanner(
        `Employee Code "${resolvedEmpCode}" is already assigned to another employee. Please choose a unique Employee Code.`
      );
      return;
    }

    const finalPass = newUserDraft.password?.trim();
    if (!finalPass) {
      setStatusBanner('Please enter a login password for the new employee. Passwords must be explicitly configured.');
      return;
    }
    const resolvedUsername =
      newUserDraft.username.trim() || newUserDraft.email.trim().split('@')[0];
    const mustChange = false;

    const createdUser = addUser({
      name: newUserDraft.name.trim(),
      username: resolvedUsername,
      email: newUserDraft.email.trim(),
      empCode: resolvedEmpCode,
      password: finalPass,
      tempPassword: finalPass,
      mustChangePassword: mustChange,
      mustChangePasswordOnFirstLogin: mustChange,
      accessScope: alsoCreateInCrm ? 'all' : 'payroll_only',
      accessType: alsoCreateInCrm ? 'crm_and_payroll' : 'payroll_only',
      phone: newUserDraft.phone.trim() || '+91 98200 00000',
      role: newUserDraft.role,
      department: newUserDraft.department,
      designation: newUserDraft.designation.trim() || newUserDraft.role,
      location: newUserDraft.location.trim() || 'Mumbai HQ',
      reportingManager: newUserDraft.reportingManager.trim(),
      assignedTerritory: newUserDraft.assignedTerritory.trim(),
      status: newUserDraft.status,
      customPermissions:
        alsoCreateInCrm && crmPermPreset !== 'role_default' ? customPermsDraft : undefined,
    });
    const finalUserId = createdUser.id;

    if (alsoCreateInCrm && crmPermPreset !== 'role_default') {
      updateUserCustomPermissions(finalUserId, customPermsDraft);
    }

    const newMasterRecord: EmployeeSalaryMasterRecord = {
      userId: finalUserId,
      empCode: resolvedEmpCode,
      name: newUserDraft.name.trim(),
      email: newUserDraft.email.trim(),
      password: finalPass,
      tempPassword: finalPass,
      mustChangePasswordOnFirstLogin: mustChange,
      accessType: alsoCreateInCrm ? 'crm_and_payroll' : 'payroll_only',
      phone: newUserDraft.phone.trim() || '+91 98200 00000',
      role: newUserDraft.role,
      department: newUserDraft.department,
      designation: newUserDraft.designation.trim() || newUserDraft.role,
      location: newUserDraft.location.trim() || 'Mumbai HQ',
      reportingManager: newUserDraft.reportingManager.trim(),
      assignedTerritory: newUserDraft.assignedTerritory.trim(),
      status: newUserDraft.status,
      syncedWithCrm: alsoCreateInCrm,
      enrolledInPayroll: true,
      monthlyGross: Number(newUserDraft.monthlyGross) || getRoleDefaultGross(newUserDraft.role),
      basicPct: Number.isFinite(Number(newUserDraft.basicPct)) ? Number(newUserDraft.basicPct) : 50,
      hraPct: Number.isFinite(Number(newUserDraft.hraPct)) ? Number(newUserDraft.hraPct) : 25,
      specialPct: Number.isFinite(Number(newUserDraft.specialPct)) ? Number(newUserDraft.specialPct) : 18,
      commissionPct: Number.isFinite(Number(newUserDraft.commissionPct)) ? Number(newUserDraft.commissionPct) : 1.5,
      pfAmount: Number.isFinite(Number(newUserDraft.pfAmount)) && Number(newUserDraft.pfAmount) >= 0 ? Math.round(Number(newUserDraft.pfAmount)) : 1800,
      profTax: Number.isFinite(Number(newUserDraft.profTax)) && Number(newUserDraft.profTax) >= 0 ? Math.round(Number(newUserDraft.profTax)) : 200,
      tdsPct: Number.isFinite(Number(newUserDraft.tdsPct)) && Number(newUserDraft.tdsPct) >= 0 ? Number(newUserDraft.tdsPct) : 8.5,
      lopDays: Number.isFinite(Number(newUserDraft.lopDays)) && Number(newUserDraft.lopDays) >= 0 ? Number(newUserDraft.lopDays) : 0,
      deductionsLockedByAdmin: true,
      panNumber: newUserDraft.panNumber.trim().toUpperCase() || 'ABCDE1234F',
      uanNumber: newUserDraft.uanNumber.trim() || '101489203912',
      pfAccountNo: newUserDraft.pfAccountNo.trim() || 'MH/BAN/0048291/000/000199',
      taxRegime: newUserDraft.taxRegime,
      bankName: newUserDraft.bankName.trim() || supplierCompany?.bankName || 'HDFC Bank Ltd',
      bankAccountNo: newUserDraft.bankAccountNo.trim() || '50100482910482',
      ifscCode: newUserDraft.ifscCode.trim().toUpperCase() || 'HDFC0001245',
      plQuota: Number(newUserDraft.plQuota) || 12,
      clQuota: Number(newUserDraft.clQuota) || 6,
      slQuota: Number(newUserDraft.slQuota) || 6,
      compOffQuota: Number(newUserDraft.compOffQuota) || 4,
      shiftTiming: newUserDraft.shiftTiming || '09:30 AM - 06:30 PM',
      workMode: newUserDraft.workMode,
    };

    const nextMasters = {
      ...employeeSalaryMasters,
    };
    if (existingEmailMaster && existingEmailMaster.userId !== finalUserId) {
      recordDeletedPayrollMasterIds([existingEmailMaster.userId]);
      delete nextMasters[existingEmailMaster.userId];
    }
    nextMasters[finalUserId] = newMasterRecord;
    forgetDeletedPayrollMasterIds([finalUserId]);
    const saveResult = await saveEmployeeSalaryMasters({ [finalUserId]: newMasterRecord }, true, false, [finalUserId]);

    if (!saveResult.ok) {
      if (serverMasters) {
        restoreLocalEmployeeSalaryMasters(serverMasters);
        setEmployeeSalaryMasters(serverMasters);
      }
      setStatusBanner(
        `✕ Created the CRM login for "${newMasterRecord.name}", but the PAYROLL record was NOT saved: ${saveResult.message || 'the server rejected the save.'} Resolve that clash, then save this employee again from Payroll.`
      );
      return;
    }

    setEmployeeSalaryMasters(nextMasters);

    setSelectedAdminUserId(finalUserId);
    setUserFormMode('edit');
    setNewUserDraft({
      ...newUserDraft,
      name: '',
      username: '',
      email: '',
      password: 'Welcome@123',
      tempPassword: 'Welcome@123',
      mustChangePasswordOnFirstLogin: false,
      phone: '+91 ',
      empCode: getNextAvailableEmpCode(
        { ...(serverMasters || {}), ...nextMasters },
        [...collectExistingEmpCodes(users), newMasterRecord.empCode]
      ),
    });

    setStatusBanner(
      alsoCreateInCrm
        ? `✓ Created "${newMasterRecord.name}" (${newMasterRecord.empCode}) in BOTH Payroll & CRM.`
        : `✓ Created "${newMasterRecord.name}" (${newMasterRecord.empCode}) in Payroll Master.`
    );
  };

  // Promote a Payroll-Only employee to CRM with 1 click
  const handleSyncPayrollEmployeeToCrm = (entry: (typeof unifiedEmployeeList)[number]) => {
    const existingCrmUser = users.find(
      (u) => u.id === entry.id || u.email?.toLowerCase() === entry.email.toLowerCase()
    );
    const explicitPass =
      entry.master.password ||
      entry.master.tempPassword ||
      existingCrmUser?.password ||
      undefined;

    let targetId = entry.id;
    if (existingCrmUser) {
      targetId = existingCrmUser.id;
      updateUser(targetId, {
        accessScope: 'all',
        accessType: 'crm_and_payroll',
        ...(explicitPass ? { password: explicitPass, tempPassword: explicitPass } : {}),
      });
    } else {
      const createdCrmUser = addUser({
        name: entry.name,
        username: entry.email.split('@')[0],
        email: entry.email,
        ...(explicitPass ? { password: explicitPass, tempPassword: explicitPass } : {}),
        accessScope: 'all',
        accessType: 'crm_and_payroll',
        phone: entry.phone,
        role: entry.role,
        department: entry.department,
        designation: entry.designation,
        location: entry.location,
        reportingManager: entry.master.reportingManager,
        assignedTerritory: entry.master.assignedTerritory,
        status: entry.status,
      });
      targetId = createdCrmUser.id;
    }

    setEmployeeSalaryMasters((prev) => {
      const next = { ...prev };
      const oldRecord = next[entry.id] || entry.master;
      if (targetId !== entry.id) {
        delete next[entry.id];
      }
      next[targetId] = {
        ...oldRecord,
        userId: targetId,
        ...(explicitPass ? { password: explicitPass, tempPassword: explicitPass } : {}),
        accessType: 'crm_and_payroll',
        syncedWithCrm: true,
        enrolledInPayroll: true,
      };
      // Re-linking the employee replaces their master record — clear any stale tombstone
      forgetDeletedPayrollMasterIds([entry.id, targetId]);
      saveEmployeeSalaryMasters(next, true, false, [entry.id, targetId]);
      return next;
    });

    setSelectedAdminUserId(targetId);
    setStatusBanner(
      `Synced "${entry.name}" (${entry.master.empCode}) into CRM User Master with role ${entry.role}.`
    );
  };

  // Enroll a CRM-only user into Payroll Master with 1 click
  const handleEnrollCrmUserInPayroll = (entry: (typeof unifiedEmployeeList)[number]) => {
    setEmployeeSalaryMasters((prev) => {
      const next = {
        ...prev,
        [entry.id]: {
          ...entry.master,
          userId: entry.id,
          enrolledInPayroll: true,
          syncedWithCrm: true,
        },
      };
      forgetDeletedPayrollMasterIds([entry.id]);
      saveEmployeeSalaryMasters(next, true, false, [entry.id]);
      return next;
    });
    setStatusBanner(
      `Enrolled CRM user "${entry.name}" (${entry.master.empCode}) into Payroll & ESS Master.`
    );
  };

  // Unlink an employee from CRM Workspace, revoking CRM access and restricting them to Payroll ESS Portal only
  const handleUnlinkFromCrm = (entry: (typeof unifiedEmployeeList)[number]) => {
    if (!isSystemAdmin && currentUser.role !== 'Super Admin' && currentUser.role !== 'Administrator') {
      setStatusBanner('Access Denied: Administrator or HR Manager rights required to unlink users from CRM.');
      return;
    }

    if (
      entry.id === 'usr-1' ||
      entry.role === 'Super Admin' ||
      (entry.id === currentUser.id && currentUser.role === 'Super Admin')
    ) {
      setStatusBanner('Super Admin cannot be unlinked from CRM Workspace.');
      return;
    }

    const linkedCrmUser = users.find(
      (u) =>
        u.id === entry.id ||
        (entry.email && u.email && u.email.trim().toLowerCase() === entry.email.trim().toLowerCase())
    );

    // 1. Update the Payroll Master record: mark accessType as payroll_only, syncedWithCrm as false
    setEmployeeSalaryMasters((prev) => {
      const next = { ...prev };
      const currentMaster = next[entry.id] || entry.master;
      next[entry.id] = {
        ...currentMaster,
        userId: entry.id,
        accessType: 'payroll_only',
        syncedWithCrm: false,
        enrolledInPayroll: true,
      };
      saveEmployeeSalaryMasters(next, true, false, [entry.id]);
      return next;
    });

    // 2. Revoke CRM Access on linked CRM User profile
    if (linkedCrmUser) {
      updateUser(linkedCrmUser.id, {
        accessType: 'payroll_only',
        accessScope: 'payroll_only',
        customPermissions: {},
      });
    }

    setStatusBanner(
      `Unlinked "${entry.name}" (${entry.master.empCode}) from CRM. CRM access has been revoked; user is now restricted to Payroll ESS Portal only.`
    );
  };

  const handleToggleEmployeeStatus = (entry: (typeof unifiedEmployeeList)[number]) => {
    if (entry.id === 'usr-1' || entry.role === 'Super Admin') {
      setStatusBanner('Cannot deactivate the primary Super Admin account.');
      return;
    }
    const currentStatus = entry.status || 'Active';
    const nextStatus: 'Active' | 'Inactive' = currentStatus === 'Active' ? 'Inactive' : 'Active';

    // 1. Update in CRM Users if linked
    if (entry.inCrm) {
      updateUser(entry.id, { status: nextStatus });
    }

    // 2. Update in employeeSalaryMasters
    const next = { ...employeeSalaryMasters };
    const existing = next[entry.id] || entry.master;
    next[entry.id] = {
      ...existing,
      status: nextStatus,
    };
    setEmployeeSalaryMasters(next);
    saveEmployeeSalaryMasters(next, true, false, [entry.id]);

    setStatusBanner(
      nextStatus === 'Inactive'
        ? `Marked "${entry.name}" (${entry.master.empCode}) as Inactive. Payroll generation is paused.`
        : `Marked "${entry.name}" (${entry.master.empCode}) as Active. Payroll processing enabled.`
    );
  };

  const handleInitiateDeleteEmployee = (entry: (typeof unifiedEmployeeList)[number]) => {
    if (entry.id === 'usr-1' || entry.role === 'Super Admin') {
      setStatusBanner('Super Admin account cannot be deleted.');
      return;
    }
    if (entry.inCrm && users.length <= 1) {
      setStatusBanner('Cannot delete the last remaining CRM user in the system.');
      return;
    }
    setEmployeeToDelete(entry);
    setDeleteFromCrmCheckbox(entry.inCrm);
  };

  const handleConfirmDeleteEmployee = async (deleteFromCrm: boolean) => {
    if (!employeeToDelete) return;
    const entry = employeeToDelete;
    const targetId = entry.id;

    // 1. If deleting from CRM as well or if payroll_only, delete CRM user identity
    if (deleteFromCrm || !entry.inCrm) {
      if (entry.inCrm && users.length <= 1) {
        setStatusBanner('Cannot delete the last remaining CRM user in the system.');
        setEmployeeToDelete(null);
        return;
      }
      deleteUser(targetId);
    }

    // 2. Remove from employeeSalaryMasters
    const next = { ...employeeSalaryMasters };
    delete next[targetId];
    const cleanEmail = (entry.email || '').trim().toLowerCase();
    for (const [k, m] of Object.entries(next)) {
      if (
        m &&
        (m.userId === targetId ||
          (cleanEmail && m.email && String(m.email).trim().toLowerCase() === cleanEmail))
      ) {
        delete next[k];
      }
    }
    setEmployeeSalaryMasters(next);
    saveEmployeeSalaryMasters(next, true);

    // 3. Record tombstone so syncs and fallback synthesizer never resurrect it
    recordDeletedPayrollMasterIds([targetId]);

    // 4. API deletion
    fetch(
      `/api/payroll/masters/${encodeURIComponent(targetId)}?deleteUser=${deleteFromCrm || !entry.inCrm ? 'true' : 'false'}`,
      { method: 'DELETE' }
    ).catch(() => {});

    setEmployeeToDelete(null);
    const remaining = Object.values(next)[0];
    setSelectedAdminUserId(remaining ? remaining.userId : '');
    setStatusBanner(
      deleteFromCrm && entry.inCrm
        ? `Permanently deleted "${entry.name}" (${entry.master.empCode}) from both CRM Users & Payroll Master.`
        : `Removed "${entry.name}" (${entry.master.empCode}) from Payroll Master.`
    );
  };

  const handleDeleteUnifiedEmployee = (
    entry: (typeof unifiedEmployeeList)[number],
    deleteFromCrmAsWell = false
  ) => {
    handleInitiateDeleteEmployee(entry);
  };

  return (
    <div className="sh-scope space-y-4">
      {/* Admin Control Header Bar — Responsive Layout, Zero Horizontal Scrolling */}
      <div className="bg-slate-900 text-white rounded-xl px-4 sm:px-5 py-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Admin Control ({currentUser.role})
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-white text-sm">
              Unified Payroll &amp; CRM User Master Allocation Center
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-medium">
              {unifiedEmployeeList.length} Total Employees
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 truncate">
            Allocate everything at user creation: Salary Structure, Statutory &amp; Bank, Leave Quotas, Shift, and choose whether to create in CRM as well.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Clear All Data Button */}
          <button
            type="button"
            onClick={() => setIsClearAllConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Remove all data from payroll to create from scratch"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Payroll Data</span>
          </button>

          {/* Mobile / Tablet Dropdown Selector for Admin Sections */}
          <div className="block 2xl:hidden w-full sm:w-auto">
            <select
              value={adminSubTab}
              onChange={(e) => setAdminSubTab(e.target.value as typeof adminSubTab)}
              aria-label="Select Admin Section"
              className="w-full header-dropdown-select bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer focus:ring-2 focus:ring-[#1f7e9e]"
            >
              <option value="salary_master">1. Employees &amp; Full Allocation (CRUD)</option>
              <option value="org_masters">
                2. Org Masters ({orgMasters.roles.length + orgMasters.designations.length + orgMasters.locations.length + orgMasters.departments.length})
              </option>
              <option value="policy_master">3. Leave &amp; Shift Policy</option>
              <option value="approvals">4. Leaves &amp; Claims (CRUD / Approve)</option>
              <option value="payroll_run">5. Monthly Payroll Run</option>
              {integrationSectionNode && (
                <option value="external_integration">6. External Payroll Link (Admin)</option>
              )}
            </select>
          </div>

          {/* Large Screen Segmented Sub-Navigation */}
          <div className="hidden 2xl:flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
            {[
              { id: 'salary_master', label: '1. Employees & Full Allocation (CRUD)' },
              {
                id: 'org_masters',
                label: `2. Org Masters (${
                  orgMasters.roles.length +
                  orgMasters.designations.length +
                  orgMasters.locations.length +
                  orgMasters.departments.length
                })`,
              },
              { id: 'policy_master', label: '3. Leave & Shift Policy' },
              { id: 'approvals', label: '4. Leaves & Claims (CRUD / Approve)' },
              { id: 'payroll_run', label: '5. Monthly Payroll Run' },
              ...(integrationSectionNode
                ? [{ id: 'external_integration', label: '6. External Payroll Link (Admin)' }]
                : []),
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setAdminSubTab(sub.id as typeof adminSubTab)}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs whitespace-nowrap transition cursor-pointer ${
                  adminSubTab === sub.id
                    ? 'bg-[#1f7e9e] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: UNIFIED EMPLOYEE CREATION & FULL ALLOCATION */}
      {adminSubTab === 'salary_master' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left 6 Cols: Create or Edit Employee with Complete Allocation */}
          <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap truncate">
                  {userFormMode === 'create'
                    ? 'Create Employee & Allocate Everything'
                    : `Edit Allocations: ${targetEntry?.name || ''}`}
                </h4>
                <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                  {userFormMode === 'create'
                    ? 'Allocate Salary, Statutory, Leave Quotas, Shift & CRM Rights in one place'
                    : 'Live-edit CRM Profile, Salary Formula, Leave Quotas, Shift & Bank Details'}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setUserFormMode('edit')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    userFormMode === 'edit'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Edit Existing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewUserDraft((prev) => ({
                      ...prev,
                      empCode: getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users)),
                    }));
                    setUserFormMode('create');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition cursor-pointer ${
                    userFormMode === 'create'
                      ? 'bg-[#1f7e9e] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ New Employee</span>
                </button>
              </div>
            </div>

            {userFormMode === 'create' ? (
              <form onSubmit={handleCreateEmployeeWithAllocations} className="space-y-3.5 text-xs">
                {/* CROSS-SYSTEM PROMPT: DO YOU WANT TO CREATE IN CRM? */}
                <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs whitespace-nowrap">
                        Do you want to create this user in CRM as well?
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setAlsoCreateInCrm(true)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                          alsoCreateInCrm
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        ✓ Yes, Create in CRM &amp; Payroll
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlsoCreateInCrm(false)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                          !alsoCreateInCrm
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        No, Payroll Only
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {alsoCreateInCrm
                      ? 'Creates the employee in Employee Master AND automatically provisions login credentials (Official Email ID & Admin-set Password) for both ESS Portal & CRM.'
                      : 'Creates the employee in Employee Master AND provisions ESS Portal login credentials (Official Email ID & Admin-set Password) for the Employee ESS Dashboard.'}
                  </p>
                </div>

                {/* SECTION 1: BASIC IDENTITY & ORGANIZATION ALLOCATION */}
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center justify-between">
                    <span>1. Identity, Login Credentials (Email &amp; Password) &amp; Org Allocation</span>
                    <span className="text-[#1f7e9e] font-mono">{newUserDraft.empCode}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Employee Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserDraft.name}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          const prevAuto = newUserDraft.name
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, '.');
                          const shouldUpdateUsername =
                            !newUserDraft.username || newUserDraft.username === prevAuto;
                          setNewUserDraft({
                            ...newUserDraft,
                            name: nextName,
                            username: shouldUpdateUsername
                              ? nextName.toLowerCase().trim().replace(/\s+/g, '.')
                              : newUserDraft.username,
                          });
                        }}
                        placeholder="e.g. Rohan Mehta"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Official Email (Login ID) *
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserDraft.email}
                        onChange={(e) => setNewUserDraft({ ...newUserDraft, email: e.target.value })}
                        placeholder="rohan@company.com"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Login Password (Set by Admin) *
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.password}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            password: e.target.value,
                            tempPassword: e.target.value,
                          })
                        }
                        placeholder="Set password (e.g. Welcome@123)"
                        className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Mobile Phone
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.phone}
                        onChange={(e) => setNewUserDraft({ ...newUserDraft, phone: e.target.value })}
                        placeholder="+91 98200 11223"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Role
                      </label>
                      <select
                        value={newUserDraft.role}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          setNewUserDraft({
                            ...newUserDraft,
                            role,
                            designation: role,
                            monthlyGross: getRoleDefaultGross(role),
                          });
                          if (crmPermPreset === 'role_default') {
                            applyCrmPresetToDraft('role_default', role);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {dynamicRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Department
                      </label>
                      <select
                        value={newUserDraft.department}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            department: e.target.value as User['department'],
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {dynamicDepartments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Reporting Manager
                      </label>
                      <select
                        value={newUserDraft.reportingManager}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, reportingManager: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Location / Branch
                      </label>
                      <input
                        type="text"
                        list="org-locations-list"
                        value={newUserDraft.location}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            location: e.target.value,
                            assignedTerritory: e.target.value,
                          })
                        }
                        placeholder="e.g. Mumbai HQ / Pune"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                      />
                      <datalist id="org-locations-list">
                        {dynamicLocations.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Official Designation
                      </label>
                      <input
                        type="text"
                        list="org-designations-list"
                        value={newUserDraft.designation}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, designation: e.target.value })
                        }
                        placeholder="e.g. Senior Account Executive"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                      />
                      <datalist id="org-designations-list">
                        {dynamicDesignations.map((des) => (
                          <option key={des} value={des} />
                        ))}
                      </datalist>
                    </div>
                    <div className="w-48 shrink-0">
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Work Mode
                      </label>
                      <select
                        value={newUserDraft.workMode}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            workMode: e.target.value as typeof newUserDraft.workMode,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="Office HQ">Office HQ</option>
                        <option value="Work From Home">Work From Home</option>
                        <option value="Client Site Visit">Client Site Visit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PAYROLL SALARY, STATUTORY, BANK & LEAVE ALLOCATION */}
                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-2.5">
                  <div className="font-bold text-emerald-950 uppercase tracking-wider text-[10px] flex items-center justify-between">
                    <span>2. Payroll Compensation, Statutory, Bank &amp; Leave Allocation</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      Gross: {formatCurrency(newUserDraft.monthlyGross)}/mo
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 block whitespace-nowrap">
                          Emp Code *
                        </label>
                        {isDuplicateEmpCode(newUserDraft.empCode, employeeSalaryMasters) && (
                          <span className="text-[10px] font-bold text-rose-600">Taken</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          required
                          value={newUserDraft.empCode}
                          onChange={(e) =>
                            setNewUserDraft({
                              ...newUserDraft,
                              empCode: e.target.value.toUpperCase(),
                            })
                          }
                          className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs font-mono font-bold ${
                            isDuplicateEmpCode(newUserDraft.empCode, employeeSalaryMasters)
                              ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                              : 'border-slate-200 text-[#1f7e9e]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextCode = getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users));
                            setNewUserDraft((prev) => ({ ...prev, empCode: nextCode }));
                          }}
                          className="px-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer border border-slate-200 shrink-0"
                          title="Generate next sequential code"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Monthly Gross (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={newUserDraft.monthlyGross}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            monthlyGross: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Basic / HRA / Special %
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          value={newUserDraft.basicPct}
                          onChange={(e) =>
                            setNewUserDraft({ ...newUserDraft, basicPct: Number(e.target.value) })
                          }
                          title="Basic %"
                          className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                        />
                        <input
                          type="number"
                          value={newUserDraft.hraPct}
                          onChange={(e) =>
                            setNewUserDraft({ ...newUserDraft, hraPct: Number(e.target.value) })
                          }
                          title="HRA %"
                          className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                        />
                        <input
                          type="number"
                          value={newUserDraft.specialPct}
                          onChange={(e) =>
                            setNewUserDraft({ ...newUserDraft, specialPct: Number(e.target.value) })
                          }
                          title="Special Allowance %"
                          className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1.5 text-xs font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Sales Comm %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newUserDraft.commissionPct}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            commissionPct: Number(e.target.value),
                          })
                        }
                        title="Sales Commission %"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Tax Regime
                      </label>
                      <select
                        value={newUserDraft.taxRegime}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            taxRegime: e.target.value as typeof newUserDraft.taxRegime,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs font-semibold"
                      >
                        <option value="New Tax Regime (Section 115BAC)">New Regime (115BAC)</option>
                        <option value="Old Tax Regime (With Exemptions)">Old Regime</option>
                      </select>
                    </div>
                  </div>

                  {/* FIXED DEDUCTIONS ALLOCATION (LOCKED UNTIL ADMIN EDITS) */}
                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1 min-w-0 truncate">
                        <Lock className="w-3 h-3 text-rose-700 shrink-0" />
                        <span className="truncate">Employee Deductions Allocation (Locked Until Admin Edits)</span>
                      </span>
                      <span className="text-[10px] font-semibold text-rose-800 bg-white/80 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                        Editable PF · Fixed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1 whitespace-nowrap min-w-0">
                          <label className="font-semibold text-rose-950 block truncate text-[11px]">
                            PF Amount (₹) *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const basicAmt = Math.round(
                                (Number(newUserDraft.monthlyGross) || 0) *
                                  ((Number(newUserDraft.basicPct) || 50) / 100)
                              );
                              const autoPf = Math.round(
                                Math.min(basicAmt, adminPolicyMaster.defaultPfCapBasic || 15000) * 0.12
                              );
                              setNewUserDraft({ ...newUserDraft, pfAmount: autoPf });
                            }}
                            className="text-[9.5px] font-bold text-[#1f7e9e] hover:underline cursor-pointer shrink-0"
                            title="Calculate 12% of Basic (capped)"
                          >
                            12% Calc
                          </button>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={newUserDraft.pfAmount}
                          onChange={(e) =>
                            setNewUserDraft({
                              ...newUserDraft,
                              pfAmount: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                          Prof. Tax (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newUserDraft.profTax}
                          onChange={(e) =>
                            setNewUserDraft({
                              ...newUserDraft,
                              profTax: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                          TDS Tax (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={newUserDraft.tdsPct}
                          onChange={(e) =>
                            setNewUserDraft({
                              ...newUserDraft,
                              tdsPct: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                          LOP Days
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={newUserDraft.lopDays}
                          onChange={(e) =>
                            setNewUserDraft({
                              ...newUserDraft,
                              lopDays: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.panNumber}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            panNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        PF UAN No
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.uanNumber}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, uanNumber: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.bankName}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, bankName: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Bank A/C No
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.bankAccountNo}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, bankAccountNo: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.ifscCode}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            ifscCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Leave Quota & Shift Allocation Row */}
                  <div className="grid grid-cols-6 gap-2 pt-1 border-t border-emerald-200/60">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        PL Quota
                      </label>
                      <input
                        type="number"
                        value={newUserDraft.plQuota}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, plQuota: Number(e.target.value) })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        CL Quota
                      </label>
                      <input
                        type="number"
                        value={newUserDraft.clQuota}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, clQuota: Number(e.target.value) })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        SL Quota
                      </label>
                      <input
                        type="number"
                        value={newUserDraft.slQuota}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, slQuota: Number(e.target.value) })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Comp-Off
                      </label>
                      <input
                        type="number"
                        value={newUserDraft.compOffQuota}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            compOffQuota: Number(e.target.value),
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Allocated Shift Timing
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.shiftTiming}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, shiftTiming: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LOGIN CREDENTIALS & MODULE ACCESS ALLOCATION (ALWAYS VISIBLE FOR BOTH PAYROLL-ONLY & CRM+PAYROLL) */}
                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-indigo-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {alsoCreateInCrm
                          ? '3. Login Credentials & CRM Module Permissions Allocation'
                          : '3. Employee Portal Login Credentials'}
                      </span>
                    </div>
                    {alsoCreateInCrm && (
                      <button
                        type="button"
                        onClick={() => setShowCustomPermMatrix(!showCustomPermMatrix)}
                        className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>
                          {showCustomPermMatrix
                            ? 'Hide 15-Module Matrix'
                            : 'Customize 15 CRM Modules'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className={`grid ${alsoCreateInCrm ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Login Username
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.username}
                        onChange={(e) =>
                          setNewUserDraft({ ...newUserDraft, username: e.target.value })
                        }
                        placeholder="e.g. rohan.mehta"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                        Login Password *
                      </label>
                      <input
                        type="text"
                        value={newUserDraft.password}
                        onChange={(e) =>
                          setNewUserDraft({
                            ...newUserDraft,
                            password: e.target.value,
                            tempPassword: e.target.value,
                          })
                        }
                        placeholder="Set login password (e.g. Welcome@123)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-indigo-700"
                      />
                    </div>
                    {alsoCreateInCrm && (
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          CRM Access Preset
                        </label>
                        <select
                          value={crmPermPreset}
                          onChange={(e) =>
                            applyCrmPresetToDraft(
                              e.target.value as typeof crmPermPreset,
                              newUserDraft.role
                            )
                          }
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-900"
                        >
                          <option value="role_default">
                            Inherit {newUserDraft.role} Defaults
                          </option>
                          <option value="full_access">Grant Full Control (All 15 Modules)</option>
                          <option value="read_only">View-Only (Read All 15 Modules)</option>
                          <option value="custom">Custom Module Allocation</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {alsoCreateInCrm && showCustomPermMatrix && (
                    <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden max-h-48 overflow-y-auto">
                      <table className="table-modern w-full text-left text-[11px] whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-1.5 px-2.5">CRM Module</th>
                            <th className="py-1.5 px-2 text-center">View</th>
                            <th className="py-1.5 px-2 text-center">Create</th>
                            <th className="py-1.5 px-2 text-center">Edit</th>
                            <th className="py-1.5 px-2 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ALL_CRM_MODULES.map((m) => {
                            const p = customPermsDraft[m.id] || {
                              view: false,
                              create: false,
                              edit: false,
                              delete: false,
                            };
                            return (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="py-1 px-2.5 font-semibold text-slate-800">
                                  {m.label}
                                </td>
                                {(['view', 'create', 'edit', 'delete'] as PermissionAction[]).map(
                                  (act) => (
                                    <td key={act} className="py-1 px-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={!!p[act]}
                                        onChange={() => toggleDraftModulePerm(m.id, act)}
                                        className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                    </td>
                                  )
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg shadow-xs whitespace-nowrap transition cursor-pointer"
                  >
                    {alsoCreateInCrm
                      ? 'Create Employee in Both Payroll & CRM (With Allocations)'
                      : 'Create Employee in Payroll Master Only'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserFormMode('edit')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* EDIT EXISTING EMPLOYEE ALLOCATIONS */
              <div className="space-y-3 text-xs">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                      Select Employee to Manage Allocations
                    </label>
                    <select
                      value={targetEntry?.id || ''}
                      onChange={(e) => setSelectedAdminUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                    >
                      {unifiedEmployeeList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.role} ({u.department}) [{u.master.empCode}] ·{' '}
                          {u.inCrm && u.inPayroll
                            ? 'CRM + Payroll'
                            : u.inCrm
                            ? 'CRM Only'
                            : 'Payroll Only'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetEntry && !targetEntry.inCrm && (
                    <button
                      type="button"
                      onClick={() => handleSyncPayrollEmployeeToCrm(targetEntry)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer transition shadow-2xs shrink-0"
                    >
                      + Also Create in CRM
                    </button>
                  )}

                  {targetEntry && targetEntry.inCrm && targetEntry.id !== 'usr-1' && targetEntry.role !== 'Super Admin' && (
                    <button
                      type="button"
                      onClick={() => setUnlinkConfirmTarget(targetEntry)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 transition shadow-xs shrink-0"
                      title="Unlink this employee from CRM Workspace. Revokes CRM access and restricts account to Payroll ESS Portal only."
                    >
                      <Unlink className="w-3.5 h-3.5 text-white" />
                      <span>Unlink from CRM</span>
                    </button>
                  )}
                </div>

                {/* View Switcher: Allocations vs Employee Information Screen */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEmployeeDetailView('allocations')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition cursor-pointer ${
                      employeeDetailView === 'allocations'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Salary &amp; Deductions Allocations (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeDetailView('employee_info')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      employeeDetailView === 'employee_info'
                        ? 'bg-[#1f7e9e] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>2. Employee Information &amp; ESS Profile</span>
                  </button>
                </div>

                {employeeDetailView === 'allocations' ? (
                  <>
                    {/* Direct Credentials & Link Quick Access */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs min-w-0 truncate">
                        <Key className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="shrink-0">Portal Login:</span>
                        <span className="font-mono text-slate-800 font-bold truncate">
                          {targetMaster.email || targetEntry?.email}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] shrink-0">
                          ({targetMaster.empCode})
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            targetEntry?.inCrm
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-200/70 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {targetEntry?.inCrm ? 'CRM + Payroll' : 'Payroll-Only'}
                        </span>
                        {targetEntry && targetEntry.inCrm && targetEntry.id !== 'usr-1' && targetEntry.role !== 'Super Admin' && (
                          <button
                            type="button"
                            onClick={() => setUnlinkConfirmTarget(targetEntry)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                            title="Unlink from CRM Workspace (Revoke CRM access)"
                          >
                            <Unlink className="w-2.5 h-2.5 text-rose-600" />
                            <span>Unlink CRM</span>
                          </button>
                        )}
                        {targetEntry && !targetEntry.inCrm && (
                          <button
                            type="button"
                            onClick={() => handleSyncPayrollEmployeeToCrm(targetEntry)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                            title="Promote / Link to CRM Workspace"
                          >
                            <ArrowRightLeft className="w-2.5 h-2.5 text-indigo-600" />
                            <span>Link to CRM</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="text"
                          value={editEmpPasswordDraft}
                          onChange={(e) => setEditEmpPasswordDraft(e.target.value)}
                          placeholder="Set new login password..."
                          className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 w-48"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!targetEntry) return;
                            if (!editEmpPasswordDraft.trim()) {
                              setStatusBanner('Please enter a password to set for this employee.');
                              return;
                            }
                            handleRegeneratePasswordForEmployee(targetEntry.id, editEmpPasswordDraft.trim());
                            setEditEmpPasswordDraft('');
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer whitespace-nowrap"
                        >
                          Set Password
                        </button>
                      </div>
                    </div>

                    {/* Identity & Role Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Employee Full Name
                        </label>
                        <input
                          type="text"
                          value={targetEntry?.name || ''}
                          onChange={(e) => {
                            if (targetEntry?.inCrm) {
                              updateUser(targetEntry.id, { name: e.target.value });
                            }
                            updateSelectedMaster({ name: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Official Email
                        </label>
                        <input
                          type="email"
                          value={targetEntry?.email || ''}
                          onChange={(e) => {
                            if (targetEntry?.inCrm) {
                              updateUser(targetEntry.id, { email: e.target.value });
                            }
                            updateSelectedMaster({ email: e.target.value });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Role &amp; Department
                        </label>
                        <select
                          value={targetEntry?.role || 'Sales Executive'}
                          onChange={(e) => {
                            const nextRole = e.target.value as UserRole;
                            if (targetEntry?.inCrm) {
                              updateUser(targetEntry.id, {
                                role: nextRole,
                                designation: nextRole,
                              });
                            }
                            updateSelectedMaster({ role: nextRole, designation: nextRole });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {dynamicRoles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Employment Status
                        </label>
                        <select
                          value={targetMaster.status || targetEntry?.status || 'Active'}
                          disabled={targetEntry?.id === 'usr-1' || targetEntry?.role === 'Super Admin'}
                          onChange={(e) => {
                            const nextStatus = e.target.value as 'Active' | 'Inactive';
                            if (targetEntry?.inCrm) {
                              updateUser(targetEntry.id, { status: nextStatus });
                            }
                            updateSelectedMaster({ status: nextStatus });
                            setStatusBanner(`Employee "${targetEntry?.name}" status updated to ${nextStatus}.`);
                          }}
                          className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                            (targetMaster.status || targetEntry?.status) === 'Inactive'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          } ${targetEntry?.id === 'usr-1' || targetEntry?.role === 'Super Admin' ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        >
                          <option value="Active">● Active (Enrolled)</option>
                          <option value="Inactive">○ Inactive (Suspended/Resigned)</option>
                        </select>
                      </div>
                    </div>

                    {/* Payroll Compensation & Statutory Fields */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-700 block whitespace-nowrap">
                            Employee Code
                          </label>
                          {isDuplicateEmpCode(targetMaster.empCode, employeeSalaryMasters, targetEntry?.id) && (
                            <span className="text-[10px] font-bold text-rose-600">Duplicate</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={targetMaster.empCode}
                            onChange={(e) =>
                              updateSelectedMaster({ empCode: e.target.value.toUpperCase() })
                            }
                            className={`w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold ${
                              isDuplicateEmpCode(targetMaster.empCode, employeeSalaryMasters, targetEntry?.id)
                                ? 'border-rose-400 text-rose-700 bg-rose-50/50'
                                : 'border-slate-200 text-[#1f7e9e]'
                            }`}
                          />
                          {isDuplicateEmpCode(targetMaster.empCode, employeeSalaryMasters, targetEntry?.id) && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextFree = getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users));
                                updateSelectedMaster({ empCode: nextFree });
                              }}
                              className="px-2 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer shrink-0"
                              title="Assign next available unique code"
                            >
                              Auto-Fix
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Monthly Gross Salary (₹)
                        </label>
                        <input
                          type="number"
                          value={targetMaster.monthlyGross}
                          onChange={(e) =>
                            updateSelectedMaster({ monthlyGross: Number(e.target.value) })
                          }
                          className="w-full bg-emerald-50/70 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Sales Comm %
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={targetMaster.commissionPct}
                          onChange={(e) =>
                            updateSelectedMaster({ commissionPct: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Basic %
                        </label>
                        <input
                          type="number"
                          value={targetMaster.basicPct}
                          onChange={(e) => updateSelectedMaster({ basicPct: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          HRA %
                        </label>
                        <input
                          type="number"
                          value={targetMaster.hraPct}
                          onChange={(e) => updateSelectedMaster({ hraPct: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Special Allowance %
                        </label>
                        <input
                          type="number"
                          value={targetMaster.specialPct}
                          onChange={(e) =>
                            updateSelectedMaster({ specialPct: Number(e.target.value) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* ADMIN DEDUCTIONS CONTROL PANEL (LOCKED UNTIL ADMIN EDITS) */}
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1 min-w-0 truncate">
                          <Lock className="w-3 h-3 text-rose-700 shrink-0" />
                          <span className="truncate">Admin Deduction Controls (PF Amount, PT, TDS &amp; LOP)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200 shrink-0">
                          Locked Until Admin Edits
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1 whitespace-nowrap min-w-0">
                            <label className="font-semibold text-rose-950 block truncate text-[11px]">
                              PF Amount (₹)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const basicAmt = Math.round(
                                  (targetMaster.monthlyGross || 0) *
                                    ((targetMaster.basicPct || 50) / 100)
                                );
                                const autoPf = Math.round(
                                  Math.min(basicAmt, adminPolicyMaster.defaultPfCapBasic || 15000) * 0.12
                                );
                                updateSelectedMaster({
                                  pfAmount: autoPf,
                                  deductionsLockedByAdmin: true,
                                });
                              }}
                              className="text-[9.5px] font-bold text-[#1f7e9e] hover:underline cursor-pointer shrink-0"
                              title="Reset PF Amount to 12% of Basic (capped)"
                            >
                              12% Calc
                            </button>
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={
                              targetMaster.pfAmount ??
                              Math.round(
                                Math.min(
                                  Math.round(
                                    (targetMaster.monthlyGross || 0) *
                                      ((targetMaster.basicPct || 50) / 100)
                                  ),
                                  adminPolicyMaster.defaultPfCapBasic || 15000
                                ) * 0.12
                              )
                            }
                            onChange={(e) =>
                              updateSelectedMaster({
                                pfAmount: Math.max(0, Number(e.target.value)),
                                deductionsLockedByAdmin: true,
                              })
                            }
                            className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                            Prof. Tax (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={targetMaster.profTax}
                            onChange={(e) =>
                              updateSelectedMaster({
                                profTax: Math.max(0, Number(e.target.value)),
                                deductionsLockedByAdmin: true,
                              })
                            }
                            className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                            TDS Tax %
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            value={targetMaster.tdsPct}
                            onChange={(e) =>
                              updateSelectedMaster({
                                tdsPct: Math.max(0, Number(e.target.value)),
                                deductionsLockedByAdmin: true,
                              })
                            }
                            className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="font-semibold text-rose-950 block mb-1 whitespace-nowrap truncate text-[11px]">
                            LOP Days
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={30}
                            value={targetMaster.lopDays}
                            onChange={(e) =>
                              updateSelectedMaster({
                                lopDays: Math.max(0, Number(e.target.value)),
                                deductionsLockedByAdmin: true,
                              })
                            }
                            className="w-full bg-white border border-rose-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-rose-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          PL Quota
                        </label>
                        <input
                          type="number"
                          value={targetMaster.plQuota ?? adminPolicyMaster.plQuota}
                          onChange={(e) => updateSelectedMaster({ plQuota: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          CL Quota
                        </label>
                        <input
                          type="number"
                          value={targetMaster.clQuota ?? adminPolicyMaster.clQuota}
                          onChange={(e) => updateSelectedMaster({ clQuota: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          SL Quota
                        </label>
                        <input
                          type="number"
                          value={targetMaster.slQuota ?? adminPolicyMaster.slQuota}
                          onChange={(e) => updateSelectedMaster({ slQuota: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Shift Timing
                        </label>
                        <input
                          type="text"
                          value={targetMaster.shiftTiming || '09:30 AM - 06:30 PM'}
                          onChange={(e) => updateSelectedMaster({ shiftTiming: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          value={targetMaster.panNumber}
                          onChange={(e) =>
                            updateSelectedMaster({ panNumber: e.target.value.toUpperCase() })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={targetMaster.bankName}
                          onChange={(e) => updateSelectedMaster({ bankName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                          Bank Account No
                        </label>
                        <input
                          type="text"
                          value={targetMaster.bankAccountNo}
                          onChange={(e) => updateSelectedMaster({ bankAccountNo: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* EMPLOYEE INFORMATION SCREEN: 360° Profile synchronized with ESS & PostgreSQL */
                  <div className="space-y-3.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-center justify-between gap-2">
                      <div>
                        <strong className="block">Employee Information Screen (PostgreSQL Record)</strong>
                        <span className="text-[11px] text-teal-800">
                          Linked by Employee ID: <strong className="font-mono">{targetMaster.empCode}</strong> ({targetEntry?.id}). Showing real-time values from PostgreSQL. Updates made by employee in ESS portal reflect here automatically.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-teal-200/80 text-teal-900 font-bold text-[10px] shrink-0">
                        Live Synced
                      </span>
                    </div>

                    {/* 1. PERSONAL INFORMATION */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <Users className="w-3.5 h-3.5 text-[#1f7e9e]" />
                        <span>1. Personal Information</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Gender</label>
                          <select
                            value={(targetMaster as any).gender || 'Male'}
                            onChange={(e) => updateSelectedMaster({ gender: e.target.value as any })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Date of Birth</label>
                          <input
                            type="date"
                            value={(targetMaster as any).dateOfBirth || ''}
                            onChange={(e) => updateSelectedMaster({ dateOfBirth: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Blood Group</label>
                          <input
                            type="text"
                            value={(targetMaster as any).bloodGroup || ''}
                            onChange={(e) => updateSelectedMaster({ bloodGroup: e.target.value })}
                            placeholder="e.g. O+"
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Marital Status</label>
                          <select
                            value={(targetMaster as any).maritalStatus || 'Single'}
                            onChange={(e) => updateSelectedMaster({ maritalStatus: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 2. CONTACT DETAILS & ADDRESSES */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1f7e9e]" />
                        <span>2. Contact &amp; Residential Addresses</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Personal Email</label>
                          <input
                            type="email"
                            value={(targetMaster as any).personalEmail || ''}
                            onChange={(e) => updateSelectedMaster({ personalEmail: e.target.value })}
                            placeholder="personal@email.com"
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Primary Mobile</label>
                          <input
                            type="text"
                            value={targetMaster.phone || ''}
                            onChange={(e) => updateSelectedMaster({ phone: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Alternate Phone</label>
                          <input
                            type="text"
                            value={(targetMaster as any).alternatePhone || ''}
                            onChange={(e) => updateSelectedMaster({ alternatePhone: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Work Location</label>
                          <input
                            type="text"
                            value={targetMaster.location || ''}
                            onChange={(e) => updateSelectedMaster({ location: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Current Address</label>
                          <textarea
                            rows={2}
                            value={(targetMaster as any).currentAddress || ''}
                            onChange={(e) => updateSelectedMaster({ currentAddress: e.target.value })}
                            placeholder="Flat/House, Street, Area"
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Permanent Address</label>
                          <textarea
                            rows={2}
                            value={(targetMaster as any).permanentAddress || ''}
                            onChange={(e) => updateSelectedMaster({ permanentAddress: e.target.value })}
                            placeholder="Permanent family address"
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">City</label>
                          <input
                            type="text"
                            value={(targetMaster as any).city || ''}
                            onChange={(e) => updateSelectedMaster({ city: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">State</label>
                          <input
                            type="text"
                            value={(targetMaster as any).state || ''}
                            onChange={(e) => updateSelectedMaster({ state: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">PIN Code</label>
                          <input
                            type="text"
                            value={(targetMaster as any).pinCode || ''}
                            onChange={(e) => updateSelectedMaster({ pinCode: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. BANK & STATUTORY */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                        <Wallet className="w-3.5 h-3.5 text-[#1f7e9e]" />
                        <span>3. Bank Account &amp; Statutory Identifiers</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Salary Bank Name</label>
                          <input
                            type="text"
                            value={targetMaster.bankName || ''}
                            onChange={(e) => updateSelectedMaster({ bankName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Account Number</label>
                          <input
                            type="text"
                            value={targetMaster.bankAccountNo || ''}
                            onChange={(e) => updateSelectedMaster({ bankAccountNo: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">IFSC Code</label>
                          <input
                            type="text"
                            value={targetMaster.ifscCode || ''}
                            onChange={(e) => updateSelectedMaster({ ifscCode: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Account Holder Name</label>
                          <input
                            type="text"
                            value={(targetMaster as any).accountHolderName || ''}
                            onChange={(e) => updateSelectedMaster({ accountHolderName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">PAN Number</label>
                          <input
                            type="text"
                            value={targetMaster.panNumber || ''}
                            onChange={(e) => updateSelectedMaster({ panNumber: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">UAN Number</label>
                          <input
                            type="text"
                            value={targetMaster.uanNumber || ''}
                            onChange={(e) => updateSelectedMaster({ uanNumber: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">PF Account No</label>
                          <input
                            type="text"
                            value={targetMaster.pfAccountNo || ''}
                            onChange={(e) => updateSelectedMaster({ pfAccountNo: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Tax Regime</label>
                          <select
                            value={targetMaster.taxRegime || 'New Tax Regime (Section 115BAC)'}
                            onChange={(e) => updateSelectedMaster({ taxRegime: e.target.value as any })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          >
                            <option value="New Tax Regime (Section 115BAC)">New Tax Regime (115BAC)</option>
                            <option value="Old Tax Regime (With Exemptions)">Old Tax Regime</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 4. EMERGENCY & QUALIFICATIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                          <span>4. Emergency Contact</span>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Contact Name</label>
                          <input
                            type="text"
                            value={(targetMaster as any).emergencyContactName || ''}
                            onChange={(e) => updateSelectedMaster({ emergencyContactName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Phone Number</label>
                            <input
                              type="text"
                              value={(targetMaster as any).emergencyContactPhone || ''}
                              onChange={(e) => updateSelectedMaster({ emergencyContactPhone: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Relationship</label>
                            <input
                              type="text"
                              value={(targetMaster as any).emergencyContactRelation || ''}
                              onChange={(e) => updateSelectedMaster({ emergencyContactRelation: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>5. Qualifications &amp; Education</span>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Highest Qualification</label>
                          <input
                            type="text"
                            value={(targetMaster as any).highestQualification || ''}
                            onChange={(e) => updateSelectedMaster({ highestQualification: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Institute / University</label>
                            <input
                              type="text"
                              value={(targetMaster as any).institute || ''}
                              onChange={(e) => updateSelectedMaster({ institute: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-500 block text-[10px] mb-0.5">Passing Year</label>
                            <input
                              type="text"
                              value={(targetMaster as any).passingYear || ''}
                              onChange={(e) => updateSelectedMaster({ passingYear: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. DOCUMENTS REPOSITORY */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>6. Uploaded Documents &amp; Identity Proofs ({((targetMaster as any).documents || []).length})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Uploaded by employee in ESS portal</span>
                      </div>
                      {((targetMaster as any).documents || []).length === 0 ? (
                        <div className="py-2.5 text-center text-slate-400 italic">No documents attached to this employee record yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {((targetMaster as any).documents || []).map((doc: any, i: number) => (
                            <div key={doc.id || i} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                                <div className="text-[10px] text-slate-500">
                                  {doc.type} {doc.documentNumber ? `· Ref: ${doc.documentNumber}` : ''}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 6. EMPLOYEE CHANGE AUDIT HISTORY */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>7. Employee Change History &amp; Audit Trail</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          Immutable Trace
                        </span>
                      </div>
                      {(() => {
                        const targetIdStr = String(targetEntry?.id || '');
                        const targetCodeStr = String(targetMaster.empCode || '').toUpperCase();
                        const empLogs = (auditLogs || []).filter(
                          (l) =>
                            l.entityType === 'Employee' &&
                            (String(l.entityId) === targetIdStr ||
                              String(l.entityNumber).toUpperCase() === targetCodeStr ||
                              String((l as any).employeeId) === targetIdStr)
                        );
                        if (empLogs.length === 0) {
                          return (
                            <div className="py-2.5 text-center text-slate-400 italic">
                              No changes recorded for this employee yet. Changes saved via ESS portal or Admin will appear here.
                            </div>
                          );
                        }
                        return (
                          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                            <table className="table-modern w-full text-left text-[11px] whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                                <tr>
                                  <th className="py-1.5 px-2.5">Timestamp</th>
                                  <th className="py-1.5 px-2">Field</th>
                                  <th className="py-1.5 px-2">Old Value</th>
                                  <th className="py-1.5 px-2">New Value</th>
                                  <th className="py-1.5 px-2.5 text-right">Changed By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {empLogs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="py-1 px-2.5 text-slate-500 font-sans">
                                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 16) : '—'}
                                    </td>
                                    <td className="py-1 px-2 font-bold text-slate-800">
                                      {log.fieldName || log.action}
                                    </td>
                                    <td className="py-1 px-2 text-rose-700 max-w-xs truncate">
                                      {log.oldValue || '—'}
                                    </td>
                                    <td className="py-1 px-2 text-emerald-700 max-w-xs truncate font-bold">
                                      {log.newValue || '—'}
                                    </td>
                                    <td className="py-1 px-2.5 text-right font-sans text-slate-600">
                                      {log.performedByName}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSavingEmployee}
                    onClick={handleSaveExistingEmployee}
                    className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-2xs whitespace-nowrap transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingEmployee ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Saving Employee...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save Employee Record</span>
                      </>
                    )}
                  </button>

                  {targetEntry && targetEntry.inCrm && targetEntry.id !== 'usr-1' && targetEntry.role !== 'Super Admin' && (
                    <button
                      type="button"
                      onClick={() => setUnlinkConfirmTarget(targetEntry)}
                      className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shadow-2xs"
                      title="Unlink this employee from CRM Workspace and restrict to Payroll ESS Portal only"
                    >
                      <Unlink className="w-3.5 h-3.5 text-rose-600" />
                      <span>Unlink from CRM</span>
                    </button>
                  )}

                  {targetEntry && !targetEntry.inCrm && (
                    <button
                      type="button"
                      onClick={() => handleSyncPayrollEmployeeToCrm(targetEntry)}
                      className="py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shadow-2xs"
                      title="Link this employee to CRM Workspace"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Link to CRM</span>
                    </button>
                  )}

                  {targetEntry && (
                    <button
                      type="button"
                      onClick={() => handleInitiateDeleteEmployee(targetEntry)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
                      title="Delete or remove employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Employee</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right 6 Cols: Unified CRM & Payroll Employee Directory Table */}
          <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap">
                  Unified Employee Directory ({unifiedEmployeeList.length})
                </h4>
                <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                  View CRM &amp; Payroll sync status, allocated salary, leave quotas, or promote between systems
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResequenceAllEmployees}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer border border-slate-300"
                  title="Re-sequence all existing employees sequentially starting from EMP-101 and fix duplicate codes"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Re-sequence Codes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextCode = getNextAvailableEmpCode(employeeSalaryMasters, collectExistingEmpCodes(users));
                    setNewUserDraft((prev) => ({
                      ...prev,
                      empCode: nextCode,
                    }));
                    setUserFormMode('create');
                  }}
                  className="px-3 py-1.5 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shadow-2xs transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    employeeStatusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({unifiedEmployeeList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('Active')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                    employeeStatusFilter === 'Active'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active ({activeEmployeesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeStatusFilter('Inactive')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                    employeeStatusFilter === 'Inactive'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Inactive ({inactiveEmployeesCount})</span>
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  placeholder="Filter name, code, email, dept..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1 text-xs text-slate-800 focus:bg-white"
                />
                {employeeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmployeeSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {hasEmpCodeCollisions && (
              <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">
                    Duplicate or out-of-order Employee Codes detected. Click to re-sequence all employees sequentially (EMP-101 onwards).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResequenceAllEmployees}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  Fix &amp; Re-sequence
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Employee &amp; Role</th>
                    <th className="py-2.5 px-3">System Allocation</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Monthly Gross</th>
                    <th className="py-2.5 px-3 text-center">Leaves (PL/CL/SL)</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEmployeeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No employees found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployeeList.map((entry) => {
                      const m = entry.master;
                      const isSelected = entry.id === targetEntry?.id;
                      return (
                        <tr
                          key={entry.id}
                          onClick={() => {
                            setSelectedAdminUserId(entry.id);
                            setUserFormMode('edit');
                          }}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-sky-50/90' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                            {m.empCode}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{entry.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {entry.role} · {entry.department}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {entry.inCrm && entry.inPayroll ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  CRM + Payroll Synced
                                </span>
                                {entry.id !== 'usr-1' && entry.role !== 'Super Admin' && (
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setUnlinkConfirmTarget(entry);
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-0.5"
                                    title="Unlink from CRM (Revoke CRM access)"
                                  >
                                    <Unlink className="w-2.5 h-2.5" />
                                    <span>Unlink CRM</span>
                                  </button>
                                )}
                              </div>
                            ) : !entry.inCrm ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  Payroll Only
                                </span>
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleSyncPayrollEmployeeToCrm(entry);
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  + Create in CRM
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  CRM Only
                                </span>
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleEnrollCrmUserInPayroll(entry);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                >
                                  + Create in Payroll
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center" onClick={(ev) => ev.stopPropagation()}>
                            <button
                              type="button"
                              disabled={entry.id === 'usr-1' || entry.role === 'Super Admin'}
                              onClick={() => handleToggleEmployeeStatus(entry)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border transition ${
                                entry.status === 'Inactive'
                                  ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 cursor-pointer'
                              } ${entry.id === 'usr-1' || entry.role === 'Super Admin' ? 'opacity-80 cursor-default' : ''}`}
                              title={
                                entry.id === 'usr-1' || entry.role === 'Super Admin'
                                  ? 'Super Admin cannot be deactivated'
                                  : `Click to mark as ${entry.status === 'Inactive' ? 'Active' : 'Inactive'}`
                              }
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                              <span>{entry.status === 'Inactive' ? 'Inactive' : 'Active'}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatCurrency(m.monthlyGross)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {m.plQuota ?? adminPolicyMaster.plQuota}/
                            {m.clQuota ?? adminPolicyMaster.clQuota}/
                            {m.slQuota ?? adminPolicyMaster.slQuota}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAdminUserId(entry.id);
                                  setUserFormMode('edit');
                                }}
                                className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-[#1f7e9e] text-slate-700 hover:text-[#1f7e9e] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              {entry.inCrm && entry.id !== 'usr-1' && entry.role !== 'Super Admin' && (
                                <button
                                  type="button"
                                  onClick={() => setUnlinkConfirmTarget(entry)}
                                  className="p-1 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Unlink from CRM (Revoke CRM access)"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {entry.id !== 'usr-1' && entry.role !== 'Super Admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateDeleteEmployee(entry)}
                                  className="p-1 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Delete Employee / User</span>
              </div>
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">{employeeToDelete.name}</div>
              <div className="text-slate-600 font-mono">{employeeToDelete.master?.empCode || 'No Code'} · {employeeToDelete.email}</div>
              <div className="text-slate-500">{employeeToDelete.role} · {employeeToDelete.department}</div>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {employeeToDelete.inCrm && employeeToDelete.inPayroll ? 'CRM + Payroll Linked' : employeeToDelete.inCrm ? 'CRM Only' : 'Payroll Only'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${employeeToDelete.status === 'Inactive' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {employeeToDelete.status}
                </span>
              </div>
            </div>

            {employeeToDelete.inCrm ? (
              <div className="space-y-2 text-xs">
                <p className="text-slate-600">
                  This employee is linked to a <strong>CRM Workspace User Account</strong>. How would you like to handle this deletion?
                </p>
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteFromCrmCheckbox}
                    onChange={() => setDeleteFromCrmCheckbox(true)}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <strong className="block text-slate-900">Delete from both Payroll &amp; CRM Users (Recommended)</strong>
                    <span className="text-slate-500 text-[11px]">
                      Permanently removes the employee from Payroll Master and deletes their CRM user account so they no longer appear anywhere.
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={!deleteFromCrmCheckbox}
                    onChange={() => setDeleteFromCrmCheckbox(false)}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <strong className="block text-slate-900">Remove from Payroll Master only</strong>
                    <span className="text-slate-500 text-[11px]">
                      Keeps the CRM user active for CRM modules, but removes them completely from payroll salary processing and payroll directory.
                    </span>
                  </div>
                </label>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete this employee from Payroll Master? Their salary records and ESS portal login will be removed.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteEmployee(employeeToDelete.inCrm ? deleteFromCrmCheckbox : true)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ORGANIZATION MASTERS (ROLES, DESIGNATIONS, LOCATIONS, DEPARTMENTS) */}
      {adminSubTab === 'org_masters' && (
        <div className="space-y-4 text-xs">
          {/* Top Banner & Category Tabs */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400 shrink-0" />
                <h3 className="font-bold text-sm text-white">
                  Payroll Organization Masters
                </h3>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Create, customize, and maintain foundational corporate masters: Roles, Designations, Locations, and Departments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreFillDefaultOrgMasters}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pre-fill Standard Corporate Defaults</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingOrgItem({
                    category: orgMasterCategory,
                    mode: 'create',
                    item: {
                      id: '',
                      name: '',
                      code: '',
                      description: '',
                      isActive: true,
                      createdAt: new Date().toISOString().split('T')[0],
                    },
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-[#1f7e9e] hover:bg-[#1a6b86] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  Add{' '}
                  {orgMasterCategory === 'roles'
                    ? 'Role'
                    : orgMasterCategory === 'designations'
                    ? 'Designation'
                    : orgMasterCategory === 'locations'
                    ? 'Location'
                    : 'Department'}
                </span>
              </button>
            </div>
          </div>

          {/* Category Switcher & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'roles', label: 'Roles', icon: ShieldCheck, count: orgMasters.roles.length },
                {
                  id: 'designations',
                  label: 'Designations',
                  icon: Briefcase,
                  count: orgMasters.designations.length,
                },
                {
                  id: 'locations',
                  label: 'Locations & Branches',
                  icon: MapPin,
                  count: orgMasters.locations.length,
                },
                {
                  id: 'departments',
                  label: 'Departments',
                  icon: Building,
                  count: orgMasters.departments.length,
                },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = orgMasterCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setOrgMasterCategory(cat.id as typeof orgMasterCategory);
                      setOrgSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-sky-400' : 'text-slate-500'
                      }`}
                    />
                    <span>{cat.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                placeholder={`Search ${orgMasterCategory}...`}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {(() => {
              const currentList = orgMasters[orgMasterCategory] || [];
              const filteredList = currentList.filter(
                (item) =>
                  item.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                  (item.code &&
                    item.code.toLowerCase().includes(orgSearchQuery.toLowerCase())) ||
                  (item.description &&
                    item.description.toLowerCase().includes(orgSearchQuery.toLowerCase()))
              );

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {currentList.length === 0
                          ? `No ${orgMasterCategory} created yet`
                          : 'No matching records found'}
                      </h4>
                      <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                        {currentList.length === 0
                          ? `Create your first ${orgMasterCategory.slice(
                              0,
                              -1
                            )} master from scratch, or click "Pre-fill Standard Corporate Defaults" above.`
                          : 'Try modifying your search filter.'}
                      </p>
                    </div>
                    {currentList.length === 0 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingOrgItem({
                              category: orgMasterCategory,
                              mode: 'create',
                              item: {
                                id: '',
                                name: '',
                                code: '',
                                description: '',
                                isActive: true,
                                createdAt: new Date().toISOString().split('T')[0],
                              },
                            })
                          }
                          className="px-3.5 py-1.5 bg-[#1f7e9e] hover:bg-[#1a6b86] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add First {orgMasterCategory.slice(0, -1).toUpperCase()}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="table-modern w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Code / ID</th>
                        <th className="py-2.5 px-3">Master Name</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Assigned Employees</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredList.map((item) => {
                        const assignedCount = unifiedEmployeeList.filter((emp) => {
                          if (orgMasterCategory === 'roles') return emp.role === item.name;
                          if (orgMasterCategory === 'designations')
                            return emp.designation === item.name;
                          if (orgMasterCategory === 'locations')
                            return emp.location === item.name;
                          if (orgMasterCategory === 'departments')
                            return emp.department === item.name;
                          return false;
                        }).length;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                              {item.code || item.id}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                              {item.description || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                              {assignedCount > 0 ? (
                                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                                  {assignedCount} employee{assignedCount !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingOrgItem({
                                      category: orgMasterCategory,
                                      mode: 'edit',
                                      item,
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-[#1f7e9e] text-slate-700 hover:text-[#1f7e9e] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteOrgItem(orgMasterCategory, item)
                                  }
                                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-rose-400 text-rose-600 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPANY LEAVE QUOTAS, SHIFT TIMING & PAYROLL FORMULA POLICY (CS-HR-POL-001) */}
      {adminSubTab === 'policy_master' && (
        <div className="space-y-4">
          {/* Top Action Bar for Admin Policy Master */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-[10px]">
                  {adminPolicyMaster.policyCode || 'CS-HR-POL-001'} · v
                  {adminPolicyMaster.policyVersion || '1.0'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                  Admin Editable Policy Engine
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1">
                {adminPolicyMaster.policyTitle ||
                  'Attendance, Working Hours & Leave Policy Rollout — Full Admin Configuration'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Edit any rule below and click &ldquo;Save &amp; Apply All Policies to Payroll&rdquo;
                to immediately recalculate attendance, late cycles, leaves, and salaries across all{' '}
                {unifiedEmployeeList.length} employees.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const resetPolicy: AdminPolicyMaster = {
                    ...DEFAULT_ADMIN_POLICY_MASTER,
                    lastPublishedMonth: adminPolicyMaster.lastPublishedMonth,
                  };
                  setAdminPolicyMaster(resetPolicy);
                  saveAdminPolicyMaster(resetPolicy, true);
                  setStatusBanner(
                    'Reset all policy parameters to official Coreenact Solutions Policy CS-HR-POL-001 v1.0 defaults.'
                  );
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Reset to CS-HR-POL-001 Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  saveAdminPolicyMaster(adminPolicyMaster, true);
                  const todayIso = localIsoDate();

                  // 1. Propagate updated policy shift & leave quotas ONLY (NEVER overwrite existing employee deductions or PF amounts!)
                  setEmployeeSalaryMasters((prev) => {
                    const next = { ...prev };
                    unifiedEmployeeList.forEach((emp) => {
                      const existing = next[emp.id] || emp.master;
                      next[emp.id] = {
                        ...existing,
                        shiftTiming: `${adminPolicyMaster.shiftStartTime} - ${adminPolicyMaster.shiftEndTime}`,
                        plQuota: adminPolicyMaster.plQuota,
                        clQuota: adminPolicyMaster.clQuota,
                        slQuota: adminPolicyMaster.slQuota,
                        compOffQuota: adminPolicyMaster.compOffQuota,
                      };
                    });
                    return next;
                  });

                  // 2. Re-evaluate every employee's attendance session against the edited policy
                  unifiedEmployeeList.forEach((emp, idx) => {
                    const att = loadEmployeeAttendance(
                      emp.id,
                      emp.location || 'New Delhi',
                      todayIso,
                      idx
                    );
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

                  window.dispatchEvent(new CustomEvent('crm-payroll-data-sync'));
                  setStatusBanner(
                    `Saved & Applied Policy ${adminPolicyMaster.policyCode || 'CS-HR-POL-001'} v${
                      adminPolicyMaster.policyVersion || '1.0'
                    } across all ${unifiedEmployeeList.length} employees (${
                      adminPolicyMaster.shiftStartTime
                    }–${adminPolicyMaster.shiftEndTime}, ${
                      adminPolicyMaster.monthlyLeaveLimit ?? 1
                    } Leave/Mo, ${adminPolicyMaster.monthlyGraceLimit ?? 3}x Grace until ${
                      adminPolicyMaster.graceEndTime || '09:45 AM'
                    }, Every ${
                      adminPolicyMaster.lateCycleHalfDayNth ?? 4
                    }th Late = ${adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP).`
                  );
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save &amp; Apply All Policies to Payroll</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CARD 1: IDENTITY, WORKING HOURS, WEEKLY CALENDAR & EARLY ARRIVAL / GRACE */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    1 &amp; 2. Working Hours, Calendar, Early Arrival &amp; Grace Policy
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Edit standard shift timings, Saturday holiday rules, &lt;9:00 AM floor, and grace
                    window
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] shrink-0">
                  Sections 1 &amp; 2
                </span>
              </div>

              {/* Policy Code, Version, Title */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Policy Code</label>
                  <input
                    type="text"
                    value={adminPolicyMaster.policyCode || 'CS-HR-POL-001'}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        policyCode: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Version</label>
                  <input
                    type="text"
                    value={adminPolicyMaster.policyVersion || '1.0'}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        policyVersion: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Policy Name</label>
                  <input
                    type="text"
                    value={
                      adminPolicyMaster.policyTitle ||
                      'Attendance, Working Hours & Leave Policy Rollout'
                    }
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        policyTitle: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Shift Start, Shift End, Early Arrival Cutoff, Grace End Time */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shift Start Time
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shift End Time
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Early Floor Cutoff
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-indigo-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Grace End Time
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>

              {/* Grace Period Mins, Grace Limit / Month & Early Arrival Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Grace Window (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={adminPolicyMaster.gracePeriodMins ?? 15}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        gracePeriodMins: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Grace Limit / Month
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={adminPolicyMaster.capEarlyArrival !== false}
                      onChange={(e) =>
                        setAdminPolicyMaster({
                          ...adminPolicyMaster,
                          capEarlyArrival: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-[#1f7e9e]"
                    />
                    <span className="font-semibold text-slate-700 leading-tight">
                      Cap arrival &lt;{adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'} unless
                      authorized
                    </span>
                  </label>
                </div>
              </div>

              {/* Interactive Weekly Calendar: Holiday Saturdays & Sunday Off */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Weekly Off Calendar Configuration (Saturdays &amp; Sundays)
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminPolicyMaster.sundaysOff !== false}
                      onChange={(e) =>
                        setAdminPolicyMaster({
                          ...adminPolicyMaster,
                          sundaysOff: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-700">All Sundays Holiday</span>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((satNum) => {
                    const currentHolidays = Array.isArray(adminPolicyMaster.holidaySaturdayNumbers)
                      ? adminPolicyMaster.holidaySaturdayNumbers
                      : [2, 4];
                    const isHoliday = currentHolidays.includes(satNum);
                    const ord =
                      satNum === 1
                        ? '1st'
                        : satNum === 2
                        ? '2nd'
                        : satNum === 3
                        ? '3rd'
                        : satNum === 4
                        ? '4th'
                        : '5th';
                    return (
                      <button
                        key={satNum}
                        type="button"
                        onClick={() => {
                          const nextHolidays = isHoliday
                            ? currentHolidays.filter((n) => n !== satNum)
                            : [...currentHolidays, satNum].sort((a, b) => a - b);
                          const allSats = [1, 2, 3, 4, 5];
                          const workingSats = allSats.filter((n) => !nextHolidays.includes(n));
                          const fmtOrd = (n: number) =>
                            n === 1
                              ? '1st'
                              : n === 2
                              ? '2nd'
                              : n === 3
                              ? '3rd'
                              : n === 4
                              ? '4th'
                              : '5th';
                          setAdminPolicyMaster({
                            ...adminPolicyMaster,
                            holidaySaturdayNumbers: nextHolidays,
                            weeklyHolidaySaturdays: `${
                              nextHolidays.map(fmtOrd).join(', ') || 'No'
                            } Saturdays${
                              adminPolicyMaster.sundaysOff !== false ? ' + All Sundays' : ''
                            }`,
                            workingSaturdays: `${
                              workingSats.map(fmtOrd).join(', ') || 'No'
                            } Saturdays`,
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                          isHoliday
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {ord} Sat: {isHoliday ? 'Holiday Off' : 'Working Day'}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-500">
                  Click any Saturday above to toggle between <strong>Holiday Off</strong> and{' '}
                  <strong>Working Day</strong>. Monthly working days recalculate automatically.
                </div>
              </div>
            </div>

            {/* CARD 2: LATE-COMING CYCLE, MIDDAY ENTRY, EARLY EXIT & BREAK / LEAVE RULES */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    3, 4 &amp; 5. Late-Coming Cycle, Midday/Exit &amp; Break / Leave Rules
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Edit late cycle LOP triggers, midday entry/exit cutoffs, break limits &amp;
                    leave quotas
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] shrink-0">
                  Sections 3, 4 &amp; 5
                </span>
              </div>

              {/* Section 3: Late-Coming Cycle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-rose-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Late Cycle LOP (Days)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    value={adminPolicyMaster.lateCycleDeductionDays ?? 0.5}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        lateCycleDeductionDays: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-rose-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Paid Leave / Month
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Max Break (Mins)
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Section 4: Midday Entry & Early Exit Time Cutoffs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Midday Entry Start
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Midday Entry End
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Exit Absent Before
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-rose-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Regular Exit After
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Section 5: Break Window & Annual Leave Quotas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2 border-t border-slate-100">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Daily Break Window
                  </label>
                  <input
                    type="text"
                    value={adminPolicyMaster.dailyBreakWindow || '01:00 PM - 02:00 PM'}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        dailyBreakWindow: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Annual PL</label>
                  <input
                    type="number"
                    value={adminPolicyMaster.plQuota}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        plQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Annual CL</label>
                  <input
                    type="number"
                    value={adminPolicyMaster.clQuota}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        clQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Comp-Off</label>
                  <input
                    type="number"
                    value={adminPolicyMaster.compOffQuota}
                    onChange={(e) =>
                      setAdminPolicyMaster({
                        ...adminPolicyMaster,
                        compOffQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-700">
                <div>
                  <strong>Live Rule Preview:</strong> Arrival &lt;{' '}
                  <span className="font-mono font-bold">
                    {adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}
                  </span>{' '}
                  recorded as{' '}
                  <span className="font-mono font-bold">
                    {adminPolicyMaster.earlyArrivalCutoff || '09:00 AM'}
                  </span>{' '}
                  · Grace until{' '}
                  <span className="font-mono font-bold">
                    {adminPolicyMaster.graceEndTime || '09:45 AM'}
                  </span>{' '}
                  (Max {adminPolicyMaster.monthlyGraceLimit ?? 3}x/mo).
                </div>
                <div>
                  <strong>Late Cycle &amp; Midday/Exit:</strong> Every{' '}
                  <strong>{adminPolicyMaster.lateCycleHalfDayNth ?? 4}th</strong> late ={' '}
                  <strong>{adminPolicyMaster.lateCycleDeductionDays ?? 0.5}d LOP</strong> · Entry{' '}
                  {adminPolicyMaster.middayEntryStartTime || '12:00 PM'}–
                  {adminPolicyMaster.middayEntryEndTime || '01:00 PM'} = Half Day · Exit &lt;{' '}
                  {adminPolicyMaster.earlyExitAbsentBeforeTime || '12:30 PM'} = Absent · Exit &gt;{' '}
                  {adminPolicyMaster.earlyExitHalfDayEndTime || '04:00 PM'} = Regular Day.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap">
                6. Default Statutory &amp; Salary Formula Master
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap truncate">
                Set organization-wide default salary split and statutory deduction rules.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  Default Basic %
                </label>
                <input
                  type="number"
                  value={adminPolicyMaster.defaultBasicPct}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultBasicPct: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  Default HRA %
                </label>
                <input
                  type="number"
                  value={adminPolicyMaster.defaultHraPct}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultHraPct: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  Default Sales Comm %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={adminPolicyMaster.defaultSalesCommissionPct}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultSalesCommissionPct: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  PF Wage Ceiling (₹)
                </label>
                <input
                  type="number"
                  value={adminPolicyMaster.defaultPfCapBasic}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultPfCapBasic: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  Monthly Prof. Tax (₹)
                </label>
                <input
                  type="number"
                  value={adminPolicyMaster.defaultProfTax}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultProfTax: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                  Default TDS %
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adminPolicyMaster.defaultTdsPct}
                  onChange={(e) =>
                    setAdminPolicyMaster({
                      ...adminPolicyMaster,
                      defaultTdsPct: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                saveAdminPolicyMaster(adminPolicyMaster, true);
                setStatusBanner(
                  `Saved Default Statutory & Salary Formula Master (${adminPolicyMaster.defaultBasicPct}% Basic, ${adminPolicyMaster.defaultHraPct}% HRA, ${adminPolicyMaster.defaultSalesCommissionPct}% Commission) for new employees. Existing employee deductions remain locked until edited individually by Admin.`
                );
              }}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs whitespace-nowrap transition cursor-pointer"
            >
              Save Default Formula for New Employees (Keep Existing Deductions Locked)
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ADMIN APPROVALS & CRUD DESK (LEAVES & REIMBURSEMENTS) */}
      {adminSubTab === 'approvals' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Leave Requests Admin CRUD & Approval Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap">
                Leave Applications — Create, Edit, Approve, Delete ({leaves.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  const newLv: LeaveRequestItem = {
                    id: `LV-${Math.floor(100 + Math.random() * 900)}`,
                    employeeId: targetEntry?.id,
                    employeeName: targetEntry?.name,
                    leaveType: 'Casual Leave',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    days: 1,
                    dayType: 'Full Day',
                    reason: 'Admin allocated leave entry',
                    handoverTo: 'Team Lead',
                    status: 'Approved',
                    appliedOn: 'Today',
                  };
                  setLeaves((prev) => [newLv, ...prev]);
                  setStatusBanner(`Created new leave record ${newLv.id} for ${targetEntry?.name}.`);
                }}
                className="px-2.5 py-1 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-semibold rounded-md text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Leave</span>
              </button>
            </div>

            <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
              {leaves.map((lv) => {
                const isEditing = editingLeaveId === lv.id && editingLeaveDraft;
                return (
                  <div key={lv.id} className="p-3.5 hover:bg-slate-50 text-xs">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={editingLeaveDraft.leaveType}
                            onChange={(e) =>
                              setEditingLeaveDraft({
                                ...editingLeaveDraft,
                                leaveType: e.target.value as LeaveRequestItem['leaveType'],
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
                          >
                            <option value="Privilege Leave">Privilege Leave</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Comp-Off">Comp-Off</option>
                          </select>
                          <input
                            type="date"
                            value={editingLeaveDraft.startDate}
                            onChange={(e) =>
                              setEditingLeaveDraft({
                                ...editingLeaveDraft,
                                startDate: e.target.value,
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                          />
                          <input
                            type="number"
                            step="0.5"
                            min={0.5}
                            value={editingLeaveDraft.days}
                            onChange={(e) =>
                              setEditingLeaveDraft({
                                ...editingLeaveDraft,
                                days: Number(e.target.value),
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingLeaveDraft.reason}
                            onChange={(e) =>
                              setEditingLeaveDraft({
                                ...editingLeaveDraft,
                                reason: e.target.value,
                              })
                            }
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLeaves((prev) =>
                                prev.map((item) =>
                                  item.id === lv.id ? editingLeaveDraft : item
                                )
                              );
                              setEditingLeaveId(null);
                              setEditingLeaveDraft(null);
                              setStatusBanner(`Updated leave request ${lv.id}.`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLeaveId(null);
                              setEditingLeaveDraft(null);
                            }}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 whitespace-nowrap truncate">
                            {lv.id} · {lv.leaveType} ({lv.days}d — {lv.dayType})
                          </div>
                          <div className="text-slate-500 mt-0.5 whitespace-nowrap truncate">
                            {lv.startDate} to {lv.endDate} · {lv.reason}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold">
                            Status:{' '}
                            <span
                              className={
                                lv.status === 'Approved'
                                  ? 'text-emerald-600'
                                  : lv.status === 'Pending Approval'
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }
                            >
                              {lv.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setLeaves((prev) =>
                                prev.map((x) =>
                                  x.id === lv.id ? { ...x, status: 'Approved' } : x
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setLeaves((prev) =>
                                prev.map((x) =>
                                  x.id === lv.id ? { ...x, status: 'Cancelled' } : x
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold whitespace-nowrap cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLeaveId(lv.id);
                              setEditingLeaveDraft({ ...lv });
                            }}
                            className="p-1.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-600 cursor-pointer"
                            title="Edit Leave"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLeaves((prev) => prev.filter((x) => x.id !== lv.id));
                              setStatusBanner(`Deleted leave record ${lv.id}.`);
                            }}
                            className="p-1.5 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Leave"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reimbursement Claims Admin CRUD & Approval Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap">
                Expense Claims — Create, Edit, Verify, Delete ({claims.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  const newClm: ExpenseClaimItem = {
                    id: `EXP-${Math.floor(300 + Math.random() * 600)}`,
                    employeeId: targetEntry?.id,
                    employeeName: targetEntry?.name,
                    claimNo: `CLM-2026-${Math.floor(100 + Math.random() * 899)}`,
                    category: 'Client Visit Travel',
                    expenseDate: new Date().toISOString().split('T')[0],
                    amount: 2500,
                    linkedCustomer: customers[0]?.name || 'Enterprise Client',
                    billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
                    description: 'Admin added reimbursement entry',
                    status: 'Approved & Queued for Payroll',
                  };
                  setClaims((prev) => [newClm, ...prev]);
                  setStatusBanner(
                    `Created reimbursement claim ${newClm.claimNo} (${formatCurrency(
                      newClm.amount
                    )}).`
                  );
                }}
                className="px-2.5 py-1 bg-[#1f7e9e] hover:bg-[#17647e] text-white font-semibold rounded-md text-xs flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Claim</span>
              </button>
            </div>

            <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
              {claims.map((c) => {
                const isEditing = editingClaimId === c.id && editingClaimDraft;
                return (
                  <div key={c.id} className="p-3.5 hover:bg-slate-50 text-xs">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={editingClaimDraft.category}
                            onChange={(e) =>
                              setEditingClaimDraft({
                                ...editingClaimDraft,
                                category: e.target.value as ExpenseClaimItem['category'],
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold"
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
                          <input
                            type="number"
                            value={editingClaimDraft.amount}
                            onChange={(e) =>
                              setEditingClaimDraft({
                                ...editingClaimDraft,
                                amount: Number(e.target.value),
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={editingClaimDraft.linkedCustomer}
                            onChange={(e) =>
                              setEditingClaimDraft({
                                ...editingClaimDraft,
                                linkedCustomer: e.target.value,
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingClaimDraft.description}
                            onChange={(e) =>
                              setEditingClaimDraft({
                                ...editingClaimDraft,
                                description: e.target.value,
                              })
                            }
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setClaims((prev) =>
                                prev.map((item) =>
                                  item.id === c.id ? editingClaimDraft : item
                                )
                              );
                              setEditingClaimId(null);
                              setEditingClaimDraft(null);
                              setStatusBanner(`Updated expense claim ${c.claimNo}.`);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClaimId(null);
                              setEditingClaimDraft(null);
                            }}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 whitespace-nowrap truncate">
                            {c.claimNo} · {c.category} —{' '}
                            <span className="font-mono text-emerald-700">
                              {formatCurrency(c.amount)}
                            </span>
                          </div>
                          <div className="text-slate-500 mt-0.5 whitespace-nowrap truncate">
                            {c.linkedCustomer} · {c.description}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold">
                            Status:{' '}
                            <span
                              className={
                                c.status === 'Approved & Queued for Payroll'
                                  ? 'text-emerald-600'
                                  : c.status === 'Paid in Payslip'
                                  ? 'text-[#1f7e9e]'
                                  : 'text-amber-600'
                              }
                            >
                              {c.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setClaims((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, status: 'Approved & Queued for Payroll' }
                                    : x
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap cursor-pointer"
                          >
                            Queue
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setClaims((prev) =>
                                prev.map((x) =>
                                  x.id === c.id ? { ...x, status: 'Paid in Payslip' } : x
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold whitespace-nowrap cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClaimId(c.id);
                              setEditingClaimDraft({ ...c });
                            }}
                            className="p-1.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-600 cursor-pointer"
                            title="Edit Claim"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setClaims((prev) => prev.filter((x) => x.id !== c.id));
                              setStatusBanner(`Deleted expense claim ${c.claimNo}.`);
                            }}
                            className="p-1.5 rounded bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Claim"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MONTHLY PAYROLL RUN & REGISTER */}
      {adminSubTab === 'payroll_run' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-slate-900 whitespace-nowrap">
                Organization Monthly Payroll Register — {selectedMonthMeta.label}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap truncate">
                Last Published Cycle: <strong>{adminPolicyMaster.lastPublishedMonth}</strong> ·{' '}
                {unifiedEmployeeList.length} Employees
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAdminPolicyMaster({
                    ...adminPolicyMaster,
                    lastPublishedMonth: selectedMonthMeta.label,
                  });
                  setStatusBanner(
                    `Executed Monthly Payroll Run for ${selectedMonthMeta.label} across all ${unifiedEmployeeList.length} employees.`
                  );
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Run &amp; Publish {selectedMonthMeta.label} Payslips</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayIso = localIsoDate();
                  const csvRows = [
                    [
                      'EmpCode',
                      'EmployeeName',
                      'Role',
                      'Department',
                      'SystemSync',
                      'BankName',
                      'AccountNo',
                      'IFSC',
                      'FixedMonthlyGross',
                      'PaidDays',
                      'PolicyLopDays',
                      'PolicyLopDeductionINR',
                      'AdjustedGrossEarningsINR',
                      'StatutoryDeductionsINR',
                      'ApprovedReimbursementsINR',
                      'NetPayableINR',
                    ].join(','),
                    ...unifiedEmployeeList.map((entry, idx) => {
                      const m = entry.master;
                      const empAtt = loadEmployeeAttendance(
                        entry.id,
                        entry.location || 'New Delhi',
                        todayIso,
                        idx
                      );
                      const empLeaves =
                        entry.id === selectedAdminUserId
                          ? leaves
                          : loadEmployeeLeaves(entry.id, entry.name, 'Reporting Manager', idx);
                      const empClaims =
                        entry.id === selectedAdminUserId
                          ? claims
                          : loadEmployeeClaims(entry.id, entry.name, 'Enterprise Client', idx);
                      const calc = calculateEmployeePolicyPayroll({
                        monthKey: selectedMonthMeta.key,
                        master: m,
                        policy: adminPolicyMaster,
                        attendance: empAtt,
                        leaves: empLeaves,
                        claims: empClaims,
                      });
                      return [
                        m.empCode,
                        `"${entry.name}"`,
                        `"${entry.role}"`,
                        `"${entry.department}"`,
                        entry.inCrm ? 'CRM+Payroll' : 'PayrollOnly',
                        `"${m.bankName}"`,
                        m.bankAccountNo,
                        m.ifscCode,
                        calc.baseMonthlyGross,
                        calc.paidDays,
                        calc.lopDays,
                        calc.policyLopDeductionAmount,
                        calc.grossEarnings,
                        calc.totalDeductions,
                        calc.approvedReimbursements,
                        calc.netPayable,
                      ].join(',');
                    }),
                  ].join('\n');
                  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Bank_Disbursement_${selectedMonthMeta.key}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setStatusBanner(
                    `Exported Policy CS-HR-POL-001 NEFT Bank Advice CSV for ${unifiedEmployeeList.length} employees.`
                  );
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Bank NEFT CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Policy Attendance &amp; Leaves</th>
                  <th className="py-2.5 px-3">Bank A/C &amp; IFSC</th>
                  <th className="py-2.5 px-3 text-right">Fixed Gross</th>
                  <th className="py-2.5 px-3 text-right">Policy LOP Ded.</th>
                  <th className="py-2.5 px-3 text-right">PF + PT + TDS</th>
                  <th className="py-2.5 px-3 text-right">Reimb.</th>
                  <th className="py-2.5 px-3 text-right">Net Disbursement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unifiedEmployeeList.map((entry, idx) => {
                  const m = entry.master;
                  const todayIso = localIsoDate();
                  const empAtt = loadEmployeeAttendance(
                    entry.id,
                    entry.location || 'New Delhi',
                    todayIso,
                    idx
                  );
                  const empLeaves =
                    entry.id === selectedAdminUserId
                      ? leaves
                      : loadEmployeeLeaves(entry.id, entry.name, 'Reporting Manager', idx);
                  const empClaims =
                    entry.id === selectedAdminUserId
                      ? claims
                      : loadEmployeeClaims(entry.id, entry.name, 'Enterprise Client', idx);
                  const calc = calculateEmployeePolicyPayroll({
                    monthKey: selectedMonthMeta.key,
                    master: m,
                    policy: adminPolicyMaster,
                    attendance: empAtt,
                    leaves: empLeaves,
                    claims: empClaims,
                  });
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1f7e9e]">
                        {m.empCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{entry.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {entry.role} · {entry.inCrm ? 'CRM + Payroll' : 'Payroll Only'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        <div>
                          Paid: <strong>{calc.paidDays}/{calc.calendar.totalCalendarDays}d</strong> · LOP: <strong className={calc.lopDays > 0 ? 'text-rose-700' : 'text-emerald-700'}>{calc.lopDays}d</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Grace {calc.graceUsedThisMonth}/3 · Late #{calc.lateCountThisMonth} · Leave {calc.paidLeaveDaysAllowed}/1d
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {m.bankName} · {m.bankAccountNo} ({m.ifscCode})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(calc.baseMonthlyGross)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700 tabular-nums">
                        {calc.policyLopDeductionAmount > 0
                          ? `-${formatCurrency(calc.policyLopDeductionAmount)}`
                          : '₹0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 tabular-nums">
                        -{formatCurrency(calc.totalDeductions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1f7e9e] tabular-nums">
                        +{formatCurrency(calc.approvedReimbursements)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(calc.netPayable)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: ADMIN EXTERNAL PAYROLL LINK & API BRIDGE */}
      {adminSubTab === 'external_integration' && integrationSectionNode && (
        <div>{integrationSectionNode}</div>
      )}

      {/* MODAL: ADD / EDIT ORG MASTER ITEM */}
      {editingOrgItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {editingOrgItem.mode === 'create' ? 'Add New' : 'Edit'}{' '}
                  {editingOrgItem.category === 'roles'
                    ? 'Role'
                    : editingOrgItem.category === 'designations'
                    ? 'Designation'
                    : editingOrgItem.category === 'locations'
                    ? 'Location'
                    : 'Department'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Configure corporate master record for employee assignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrgItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveOrgItem({
                  category: editingOrgItem.category,
                  id: editingOrgItem.mode === 'edit' ? editingOrgItem.item.id : undefined,
                  name: editingOrgItem.item.name,
                  code: editingOrgItem.item.code,
                  description: editingOrgItem.item.description,
                  isActive: editingOrgItem.item.isActive,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Master Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingOrgItem.item.name}
                  onChange={(e) =>
                    setEditingOrgItem({
                      ...editingOrgItem,
                      item: { ...editingOrgItem.item, name: e.target.value },
                    })
                  }
                  placeholder={`e.g. ${
                    editingOrgItem.category === 'roles'
                      ? 'Sales Manager'
                      : editingOrgItem.category === 'designations'
                      ? 'Senior Account Executive'
                      : editingOrgItem.category === 'locations'
                      ? 'Bengaluru Branch Office'
                      : 'Product Operations'
                  }`}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#1f7e9e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Code / Abbreviation
                  </label>
                  <input
                    type="text"
                    value={editingOrgItem.item.code || ''}
                    onChange={(e) =>
                      setEditingOrgItem({
                        ...editingOrgItem,
                        item: { ...editingOrgItem.item, code: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="e.g. MGR-01 / BLR"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#1f7e9e]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingOrgItem.item.isActive ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setEditingOrgItem({
                        ...editingOrgItem,
                        item: { ...editingOrgItem.item, isActive: e.target.value === 'active' },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#1f7e9e]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingOrgItem.item.description || ''}
                  onChange={(e) =>
                    setEditingOrgItem({
                      ...editingOrgItem,
                      item: { ...editingOrgItem.item, description: e.target.value },
                    })
                  }
                  placeholder="Optional details, job family or regional notes..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-normal text-slate-900 focus:outline-hidden focus:border-[#1f7e9e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrgItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1f7e9e] hover:bg-[#1a6b86] text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingOrgItem.mode === 'create' ? 'Create Master' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR ALL PAYROLL DATA CONFIRMATION */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900">
                  Remove All Data From Payroll?
                </h4>
                <p className="text-slate-600 text-xs mt-1">
                  This will completely clear all employee salary master records, daily attendance logs, leave requests, and expense claims.
                </p>
                <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 text-[11px] mt-2 font-medium">
                  You requested to start from scratch. You will be able to manually create employees, define Org Masters (Role, Designation, Location, Department), and manage payroll records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllPayrollData();
                  setEmployeeSalaryMasters({});
                  saveEmployeeSalaryMasters({}, true, true);
                  setSelectedAdminUserId('');
                  setIsClearAllConfirmOpen(false);
                  setStatusBanner(
                    'All payroll data removed. You can now build employee salary masters and org masters from scratch.'
                  );
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNLINK FROM CRM CONFIRMATION */}
      {unlinkConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-3">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Unlink className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900">
                  Unlink &ldquo;{unlinkConfirmTarget.name}&rdquo; from CRM Workspace?
                </h4>
                <p className="text-slate-600 text-xs mt-1">
                  Employee Code: <span className="font-mono font-bold text-[#1f7e9e]">{unlinkConfirmTarget.master?.empCode}</span> · Login: <span className="font-mono text-slate-700">{unlinkConfirmTarget.email}</span>
                </p>
                <div className="text-rose-900 bg-rose-50 border border-rose-200 rounded-md p-2.5 text-[11px] mt-2.5 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>User will no longer be allowed to access CRM</span>
                  </div>
                  <p className="text-slate-700">
                    This action revokes all CRM Workspace access (Leads, Deals, Orders, Invoices, Customers, Reports).
                  </p>
                  <p className="text-slate-700 font-medium">
                    The employee will remain strictly in <strong>Payroll &amp; ESS Portal</strong> to view their salary slips, leave balances, and tax deductions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnlinkConfirmTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUnlinkFromCrm(unlinkConfirmTarget);
                  setUnlinkConfirmTarget(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Yes, Unlink &amp; Revoke CRM Access</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST COPIED MESSAGE */}
      {toastCopiedMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastCopiedMessage}</span>
        </div>
      )}
    </div>
  );
};
