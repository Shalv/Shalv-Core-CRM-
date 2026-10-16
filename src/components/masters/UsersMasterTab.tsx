import { confirmSave } from '../../shared/confirm';
import React, { useState, useEffect } from 'react';
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
  EmployeeSalaryMasterRecord,
  getRoleDefaultGross,
  loadEmployeeSalaryMasters,
  saveEmployeeSalaryMasters,
  buildDefaultSalaryMasterRecord,
  normalizeEmpCode,
  getNextAvailableEmpCode,
  collectExistingEmpCodes,
  isDuplicateEmpCode,
  forgetDeletedPayrollMasterIds,
  PAYROLL_MASTERS_SYNC_EVENT,
} from '../payroll/payrollTypes';
import { crmVisibleUsers } from '../../shared/userScope';
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  LogIn,
  Shield,
  ShieldCheck,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  Camera,
  Upload,
  Wallet,
  ArrowRightLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { UserAvatar, isImageAvatar, optimizeProfileImageFile } from '../common/UserAvatar';

interface UsersMasterTabProps {
  searchQuery: string;
  onOpenPermissionsMatrix: () => void;
  onConfigureUserPermissions: (user: User) => void;
}

export const UsersMasterTab: React.FC<UsersMasterTabProps> = ({
  searchQuery,
  onOpenPermissionsMatrix,
  onConfigureUserPermissions,
}) => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    loginAsUser,
    rolePermissions,
    updateUserCustomPermissions,
    supplierCompany,
    formatCurrency,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  // Payroll-Only employees keep a record in `users` for ESS login but are not CRM profiles: every
  // list, counter and default below reads crmUsers so they cannot leak into the CRM User Master.
  const crmUsers = crmVisibleUsers(users);

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const modalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const quickRowPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [quickPhotoTargetUser, setQuickPhotoTargetUser] = useState<User | null>(null);

  // Shared Payroll Master Records so CRM User Creation can allocate & sync Payroll data
  const [payrollMasters, setPayrollMasters] = useState<Record<string, EmployeeSalaryMasterRecord>>(
    () =>
      loadEmployeeSalaryMasters(
        users,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      )
  );

  useEffect(() => {
    const sync = () => {
      const loaded = loadEmployeeSalaryMasters(
        users,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
      setPayrollMasters((prev) =>
        JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded
      );
    };
    sync();
    window.addEventListener(PAYROLL_MASTERS_SYNC_EVENT, sync);
    return () => window.removeEventListener(PAYROLL_MASTERS_SYNC_EVENT, sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, supplierCompany?.bankName, supplierCompany?.ifscCode]);

  // Modal Allocation Sub-View & Cross-System Creation Option
  const [modalSection, setModalSection] = useState<'identity' | 'permissions' | 'payroll'>(
    'identity'
  );
  const [alsoCreateInPayroll, setAlsoCreateInPayroll] = useState<boolean>(true);
  const [permPreset, setPermPreset] = useState<
    'role_default' | 'full_access' | 'read_only' | 'custom'
  >('role_default');
  const [permsDraft, setPermsDraft] = useState<RolePermissionsMap>(
    () => ({ ...(rolePermissions['Sales Executive'] || DEFAULT_ROLE_PERMISSIONS['Sales Executive']) })
  );

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setFeedbackNotice({ type, message });
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const [form, setForm] = useState<{
    name: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    designation: string;
    location: string;
    reportingManager: string;
    assignedTerritory: string;
    role: UserRole;
    department: User['department'];
    status: 'Active' | 'Inactive';
    avatar: string;
  }>({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    location: 'New Delhi HQ',
    reportingManager: crmUsers[0]?.name || 'Vikramaditya Rathore',
    assignedTerritory: 'North Zone (Delhi NCR)',
    role: 'Sales Executive',
    department: 'Sales',
    status: 'Active',
    avatar: '',
  });

  const [payrollDraft, setPayrollDraft] = useState({
    empCode: getNextAvailableEmpCode(payrollMasters, collectExistingEmpCodes(users)),
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
    plQuota: 12,
    clQuota: 6,
    slQuota: 6,
    compOffQuota: 4,
    shiftTiming: '09:30 AM - 06:30 PM',
    workMode: 'Office HQ' as 'Office HQ' | 'Work From Home' | 'Client Site Visit',
  });

  const applyPermPreset = (
    preset: 'role_default' | 'full_access' | 'read_only' | 'custom',
    role: UserRole
  ) => {
    setPermPreset(preset);
    if (preset === 'role_default') {
      const base = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
      setPermsDraft({ ...base });
    } else if (preset === 'full_access') {
      const next = {} as RolePermissionsMap;
      ALL_CRM_MODULES.forEach((m) => {
        next[m.id] = { view: true, create: true, edit: true, delete: true };
      });
      setPermsDraft(next);
    } else if (preset === 'read_only') {
      const next = {} as RolePermissionsMap;
      ALL_CRM_MODULES.forEach((m) => {
        next[m.id] = { view: true, create: false, edit: false, delete: false };
      });
      setPermsDraft(next);
    }
  };

  const toggleModulePerm = (module: CrmModuleKey, action: PermissionAction) => {
    setPermPreset('custom');
    setPermsDraft((prev) => {
      const currentVal = prev[module]?.[action] ?? false;
      const nextVal = !currentVal;
      const updatedMod = { ...prev[module], [action]: nextVal };
      if (action === 'view' && !nextVal) {
        updatedMod.create = false;
        updatedMod.edit = false;
        updatedMod.delete = false;
      } else if (action !== 'view' && nextVal) {
        updatedMod.view = true;
      }
      return { ...prev, [module]: updatedMod };
    });
  };

  const handleToggleAllPermColumn = (action: PermissionAction, enable: boolean) => {
    setPermPreset('custom');
    setPermsDraft((prev) => {
      const updated = { ...prev };
      ALL_CRM_MODULES.forEach((m) => {
        updated[m.id] = {
          ...updated[m.id],
          [action]: enable,
          ...(action === 'view' && !enable ? { create: false, edit: false, delete: false } : {}),
          ...(action !== 'view' && enable ? { view: true } : {}),
        };
      });
      return updated;
    });
  };

  const openAddUser = () => {
    setEditingUserId(null);
    const defaultRole: UserRole = 'Sales Executive';
    setForm({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '+91 ',
      designation: 'Account Executive',
      location: 'New Delhi HQ',
      reportingManager: crmUsers[0]?.name || 'Vikramaditya Rathore',
      assignedTerritory: 'North Zone (Delhi NCR)',
      role: defaultRole,
      department: 'Sales',
      status: 'Active',
      avatar: '',
    });
    setAlsoCreateInPayroll(true);
    applyPermPreset('role_default', defaultRole);
    setPayrollDraft({
      empCode: getNextAvailableEmpCode(payrollMasters, collectExistingEmpCodes(users)),
      monthlyGross: getRoleDefaultGross(defaultRole),
      basicPct: 50,
      hraPct: 25,
      specialPct: 18,
      commissionPct: 1.5,
      pfAmount: 1800,
      profTax: 200,
      tdsPct: 8.5,
      lopDays: 0,
      panNumber: `ABCDE${1240 + users.length}F`,
      uanNumber: `1014892039${20 + users.length}`,
      pfAccountNo: `MH/BAN/0048291/000/000${110 + users.length}`,
      taxRegime: 'New Tax Regime (Section 115BAC)',
      bankName: supplierCompany?.bankName || 'HDFC Bank Ltd',
      bankAccountNo: `501004829105${10 + users.length}`,
      ifscCode: supplierCompany?.ifscCode || 'HDFC0001245',
      plQuota: 12,
      clQuota: 6,
      slQuota: 6,
      compOffQuota: 4,
      shiftTiming: '09:30 AM - 06:30 PM',
      workMode: 'Office HQ',
    });
    setModalSection('identity');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUserId(u.id);
    setForm({
      name: u.name,
      username: u.username || u.email.split('@')[0],
      email: u.email,
      password: '',
      phone: u.phone || '',
      designation: u.designation || '',
      location: u.location || 'New Delhi HQ',
      reportingManager: u.reportingManager || crmUsers[0]?.name || 'Vikramaditya Rathore',
      assignedTerritory: u.assignedTerritory || u.location || 'Pan-India',
      role: u.role,
      department: u.department,
      status: u.status || 'Active',
      avatar: u.avatar || '',
    });

    const baseRoleMap =
      rolePermissions[u.role] ||
      DEFAULT_ROLE_PERMISSIONS[u.role] ||
      DEFAULT_ROLE_PERMISSIONS['Sales Executive'];
    const initialMap: RolePermissionsMap = { ...baseRoleMap };
    if (u.customPermissions && Object.keys(u.customPermissions).length > 0) {
      ALL_CRM_MODULES.forEach((m) => {
        if (u.customPermissions?.[m.id]) {
          initialMap[m.id] = { ...initialMap[m.id], ...u.customPermissions[m.id] };
        }
      });
      setPermPreset('custom');
    } else {
      setPermPreset('role_default');
    }
    setPermsDraft(initialMap);

    const matchedExistingMaster =
      payrollMasters[u.id] ||
      (u.email
        ? Object.values(payrollMasters).find(
            (m) => m && m.email && m.email.trim().toLowerCase() === u.email.trim().toLowerCase()
          )
        : undefined);
    const hasExistingPayroll = Boolean(
      matchedExistingMaster && matchedExistingMaster.enrolledInPayroll !== false
    );
    const existingMaster =
      matchedExistingMaster ||
      buildDefaultSalaryMasterRecord(
        u,
        0,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
    setAlsoCreateInPayroll(hasExistingPayroll);
    setPayrollDraft({
      empCode: existingMaster.empCode,
      monthlyGross: existingMaster.monthlyGross,
      basicPct: existingMaster.basicPct,
      hraPct: existingMaster.hraPct,
      specialPct: existingMaster.specialPct,
      commissionPct: existingMaster.commissionPct,
      pfAmount: existingMaster.pfAmount ?? 1800,
      profTax: existingMaster.profTax,
      tdsPct: existingMaster.tdsPct,
      lopDays: existingMaster.lopDays,
      panNumber: existingMaster.panNumber,
      uanNumber: existingMaster.uanNumber,
      pfAccountNo: existingMaster.pfAccountNo || 'MH/BAN/0048291/000/000105',
      taxRegime: existingMaster.taxRegime || 'New Tax Regime (Section 115BAC)',
      bankName: existingMaster.bankName,
      bankAccountNo: existingMaster.bankAccountNo,
      ifscCode: existingMaster.ifscCode,
      plQuota: existingMaster.plQuota ?? 12,
      clQuota: existingMaster.clQuota ?? 6,
      slQuota: existingMaster.slQuota ?? 6,
      compOffQuota: existingMaster.compOffQuota ?? 4,
      shiftTiming: existingMaster.shiftTiming || '09:30 AM - 06:30 PM',
      workMode: existingMaster.workMode || 'Office HQ',
    });

    setModalSection('identity');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleModalPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    optimizeProfileImageFile(
      file,
      (dataUrl) => {
        setForm((prev) => ({ ...prev, avatar: dataUrl }));
      },
      (errMsg) => showToast('error', errMsg)
    );
    e.target.value = '';
  };

  const handleQuickRowPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickPhotoTargetUser) return;
    const target = quickPhotoTargetUser;
    optimizeProfileImageFile(
      file,
      (dataUrl) => {
        updateUser(target.id, { avatar: dataUrl });
        setHighlightedUserId(target.id);
        setTimeout(() => setHighlightedUserId(null), 3000);
        showToast('success', `Uploaded new profile picture for "${target.name}".`);
      },
      (errMsg) => showToast('error', errMsg)
    );
    e.target.value = '';
    setQuickPhotoTargetUser(null);
  };

  const handleSave = (e: React.FormEvent) => {
    if (!confirmSave('record')) return;
    e.preventDefault();
    if (!editingUserId && !form.password.trim()) {
      showToast('error', 'Please set a login password for the new user. Passwords are not auto-generated.');
      return;
    }
    const cleanEmail = form.email.trim().toLowerCase();
    const existingEmailUser = users.find(
      (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
    );
    const existingEmailMaster = Object.values(payrollMasters).find(
      (m) => m && m.email && m.email.trim().toLowerCase() === cleanEmail
    );
    const excludeUserId =
      editingUserId || existingEmailUser?.id || existingEmailMaster?.userId;

    const resolvedEmpCode =
      normalizeEmpCode(payrollDraft.empCode) ||
      existingEmailMaster?.empCode ||
      getNextAvailableEmpCode(payrollMasters, collectExistingEmpCodes(users));

    if (
      alsoCreateInPayroll &&
      isDuplicateEmpCode(resolvedEmpCode, payrollMasters, excludeUserId)
    ) {
      showToast(
        'error',
        `Employee Code "${resolvedEmpCode}" is already assigned to another employee. Please use a unique Employee Code.`
      );
      return;
    }

    let targetUserId = editingUserId;

    const explicitPassword = form.password.trim();

    if (editingUserId) {
      const userPatch = { ...form } as Partial<User>;
      if (!explicitPassword) {
        delete userPatch.password;
      } else {
        userPatch.password = explicitPassword;
      }
      updateUser(editingUserId, userPatch);
      if (permPreset === 'role_default') {
        updateUserCustomPermissions(editingUserId, undefined);
      } else {
        updateUserCustomPermissions(editingUserId, permsDraft);
      }
    } else {
      const created = addUser({
        ...form,
        password: explicitPassword,
        customPermissions: permPreset === 'role_default' ? undefined : permsDraft,
      });
      targetUserId = created.id;
      if (permPreset !== 'role_default') {
        updateUserCustomPermissions(created.id, permsDraft);
      }
      setRoleFilter('ALL');
      setStatusFilter('ALL');
    }

    if (targetUserId) {
      const updatedMasters = { ...payrollMasters };
      if (existingEmailMaster && existingEmailMaster.userId !== targetUserId) {
        delete updatedMasters[existingEmailMaster.userId];
      }
      if (alsoCreateInPayroll) {
        const prevMaster = updatedMasters[targetUserId] || existingEmailMaster;
        const finalPass = editingUserId
          ? explicitPassword || prevMaster?.password || undefined
          : explicitPassword || prevMaster?.password || undefined;
        updatedMasters[targetUserId] = {
          ...prevMaster,
          userId: targetUserId,
          empCode: resolvedEmpCode,
          name: form.name.trim(),
          username: form.username.trim() || form.email.trim().split('@')[0],
          email: form.email.trim(),
          ...(finalPass ? { password: finalPass, tempPassword: finalPass } : {}),
          accessType: prevMaster?.accessType || 'crm_and_payroll',
          phone: form.phone.trim(),
          role: form.role,
          department: form.department,
          designation: form.designation.trim() || form.role,
          location: form.location.trim(),
          reportingManager: form.reportingManager.trim(),
          assignedTerritory: form.assignedTerritory.trim(),
          status: form.status,
          syncedWithCrm: true,
          enrolledInPayroll: true,
          monthlyGross: Number(payrollDraft.monthlyGross) || getRoleDefaultGross(form.role),
          basicPct: Number(payrollDraft.basicPct) || 50,
          hraPct: Number(payrollDraft.hraPct) || 25,
          specialPct: Number(payrollDraft.specialPct) || 18,
          commissionPct: Number(payrollDraft.commissionPct) || 1.5,
          pfAmount:
            Number.isFinite(Number(payrollDraft.pfAmount)) && Number(payrollDraft.pfAmount) >= 0
              ? Math.round(Number(payrollDraft.pfAmount))
              : 1800,
          profTax:
            Number.isFinite(Number(payrollDraft.profTax)) && Number(payrollDraft.profTax) >= 0
              ? Math.round(Number(payrollDraft.profTax))
              : 200,
          tdsPct:
            Number.isFinite(Number(payrollDraft.tdsPct)) && Number(payrollDraft.tdsPct) >= 0
              ? Number(payrollDraft.tdsPct)
              : 8.5,
          lopDays:
            Number.isFinite(Number(payrollDraft.lopDays)) && Number(payrollDraft.lopDays) >= 0
              ? Number(payrollDraft.lopDays)
              : 0,
          deductionsLockedByAdmin: true,
          panNumber: payrollDraft.panNumber.trim().toUpperCase() || 'ABCDE1234F',
          uanNumber: payrollDraft.uanNumber.trim() || '101489203912',
          pfAccountNo: payrollDraft.pfAccountNo.trim() || 'MH/BAN/0048291/000/000105',
          taxRegime: payrollDraft.taxRegime,
          bankName: payrollDraft.bankName.trim() || supplierCompany?.bankName || 'HDFC Bank Ltd',
          bankAccountNo: payrollDraft.bankAccountNo.trim() || '50100482910482',
          ifscCode: payrollDraft.ifscCode.trim().toUpperCase() || 'HDFC0001245',
          plQuota: Number(payrollDraft.plQuota) || 12,
          clQuota: Number(payrollDraft.clQuota) || 6,
          slQuota: Number(payrollDraft.slQuota) || 6,
          compOffQuota: Number(payrollDraft.compOffQuota) || 4,
          shiftTiming: payrollDraft.shiftTiming || '09:30 AM - 06:30 PM',
          workMode: payrollDraft.workMode,
        };
        forgetDeletedPayrollMasterIds([targetUserId]);
      } else {
        delete updatedMasters[targetUserId];
      }
      setPayrollMasters(updatedMasters);
      saveEmployeeSalaryMasters(
        updatedMasters,
        true,
        false,
        alsoCreateInPayroll ? [targetUserId] : undefined
      );

      setHighlightedUserId(targetUserId);
      setTimeout(() => setHighlightedUserId(null), 3000);
    }

    if (editingUserId) {
      showToast(
        'success',
        `Updated "${form.name}" in CRM${
          alsoCreateInPayroll
            ? ` and synced Payroll Master (${payrollDraft.empCode} · ${formatCurrency(
                payrollDraft.monthlyGross
              )}/mo)`
            : ' (CRM Only)'
        }.`
      );
    } else {
      showToast(
        'success',
        alsoCreateInPayroll
          ? `Created "${form.name}" in BOTH CRM & Payroll (${payrollDraft.empCode} · ${formatCurrency(
              payrollDraft.monthlyGross
            )}/mo) with all allocated module permissions & leave quotas.`
          : `Created "${form.name}" in CRM Only with allocated permissions.`
      );
    }

    setIsModalOpen(false);
  };

  const handleQuickEnrollInPayroll = (u: User) => {
    const existing =
      payrollMasters[u.id] ||
      buildDefaultSalaryMasterRecord(
        u,
        0,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
    const updatedMasters = {
      ...payrollMasters,
      [u.id]: {
        ...existing,
        userId: u.id,
        name: u.name,
        email: u.email,
        password: u.password || existing.password || '',
        tempPassword: u.tempPassword || u.password || existing.tempPassword || '',
        enrolledInPayroll: true,
        syncedWithCrm: true,
      },
    };
    setPayrollMasters(updatedMasters);
    saveEmployeeSalaryMasters(updatedMasters, true);
    showToast(
      'success',
      `Created & enrolled "${u.name}" (${existing.empCode}) in Payroll & ESS Portal (${formatCurrency(
        existing.monthlyGross
      )}/mo).`
    );
  };

  const handleUnlinkFromPayroll = (u: User) => {
    const updatedMasters = { ...payrollMasters };
    delete updatedMasters[u.id];
    setPayrollMasters(updatedMasters);
    saveEmployeeSalaryMasters(updatedMasters, true);
    showToast(
      'info',
      `Unlinked "${u.name}" from Payroll. Employee is now CRM-only.`
    );
  };

  // Find any Payroll-Only employees so admin can import/create them in CRM with 1 click
  const payrollOnlyEmployees = Object.values(payrollMasters).filter(
    (m) =>
      m.accessType === 'payroll_only' ||
      !users.some(
        (u) =>
          (u.id === m.userId || (m.email && u.email?.toLowerCase() === m.email.toLowerCase())) &&
          u.accessType !== 'payroll_only' &&
          u.accessScope !== 'PAYROLL_ONLY' &&
          u.accessScope !== 'payroll_only'
      )
  );

  const handleSyncPayrollOnlyToCrm = (m: EmployeeSalaryMasterRecord) => {
    const existingUser = users.find(
      (u) => u.id === m.userId || (m.email && u.email?.toLowerCase() === m.email.toLowerCase())
    );
    const preservedPass = m.password || m.tempPassword || existingUser?.password || '';
    let targetId = m.userId;

    if (existingUser) {
      targetId = existingUser.id;
      updateUser(targetId, {
        accessScope: 'FULL_CRM_AND_PAYROLL',
        accessType: 'crm_and_payroll',
        password: preservedPass,
        tempPassword: preservedPass,
      });
    } else {
      const created = addUser({
        name: m.name || 'Employee',
        username: (m.email || 'user').split('@')[0],
        email: m.email || 'employee@company.com',
        password: preservedPass,
        tempPassword: preservedPass,
        accessScope: 'FULL_CRM_AND_PAYROLL',
        accessType: 'crm_and_payroll',
        phone: m.phone || '+91 98200 00000',
        role: m.role || 'Sales Executive',
        department: m.department || 'Sales',
        designation: m.designation || m.role || 'Sales Executive',
        location: m.location || 'Mumbai HQ',
        reportingManager: m.reportingManager,
        assignedTerritory: m.assignedTerritory,
        status: m.status || 'Active',
      });
      targetId = created.id;
    }

    const updatedMasters = { ...payrollMasters };
    if (targetId !== m.userId) {
      delete updatedMasters[m.userId];
    }
    updatedMasters[targetId] = {
      ...m,
      userId: targetId,
      password: preservedPass,
      tempPassword: preservedPass,
      accessType: 'crm_and_payroll',
      syncedWithCrm: true,
      enrolledInPayroll: true,
    };
    setPayrollMasters(updatedMasters);
    saveEmployeeSalaryMasters(updatedMasters, true);
    showToast(
      'success',
      `Created Payroll employee "${m.name}" (${m.empCode}) in CRM User Master.`
    );
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const name = userToDelete.name;
    const id = userToDelete.id;
    const cleanEmail = (userToDelete.email || '').trim().toLowerCase();
    deleteUser(id);
    const updatedMasters = { ...payrollMasters };
    delete updatedMasters[id];
    for (const [k, m] of Object.entries(updatedMasters)) {
      if (
        m &&
        (m.userId === id ||
          (cleanEmail && m.email && m.email.trim().toLowerCase() === cleanEmail))
      ) {
        delete updatedMasters[k];
      }
    }
    setPayrollMasters(updatedMasters);
    saveEmployeeSalaryMasters(updatedMasters, true);
    setUserToDelete(null);
    showToast('success', `User profile "${name}" has been permanently removed from CRM & Payroll.`);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredUsers = crmUsers.filter((u) => {
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q) ||
      (u.location || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Active' && u.status !== 'Inactive') ||
      (statusFilter === 'Inactive' && u.status === 'Inactive');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = crmUsers.filter((u) => u.status !== 'Inactive').length;
  const adminCount = crmUsers.filter(
    (u) => u.role === 'Super Admin' || u.role === 'Administrator'
  ).length;
  const salesCount = crmUsers.filter(
    (u) => u.role === 'Sales Manager' || u.role === 'Sales Executive'
  ).length;
  const financeCount = crmUsers.filter(
    (u) => u.role === 'Finance Manager' || u.role === 'Finance Executive'
  ).length;

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Administrator':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Sales Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Sales Executive':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Finance Manager':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Finance Executive':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for quick row avatar photo upload */}
      <input
        ref={quickRowPhotoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
        onChange={handleQuickRowPhotoSelect}
        className="hidden"
      />

      {/* Dynamic Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedbackNotice.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackNotice.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner if there are Payroll-Only employees waiting to be created in CRM */}
      {payrollOnlyEmployees.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <ArrowRightLeft className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {payrollOnlyEmployees.length} employee(s) were created in Payroll Only. Do you want to create them in CRM as well?
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {payrollOnlyEmployees.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => handleSyncPayrollOnlyToCrm(m)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                + Create {m.name} ({m.empCode}) in CRM
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total User Profiles
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{crmUsers.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Administrators
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-indigo-950">{adminCount}</span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Full Governance
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sales &amp; Commercial
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-950">{salesCount}</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Pipeline Owners
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Finance &amp; Billing
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-950">{financeCount}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Invoices &amp; Ledgers
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Unified CRM &amp; Payroll User Accounts &amp; Allocations</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Roles ({crmUsers.length})</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Administrator">Administrator</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Finance Executive">Finance Executive</option>
              <option value="Management/Viewer">Management/Viewer</option>
            </select>

            <button
              type="button"
              onClick={onOpenPermissionsMatrix}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200/80 transition cursor-pointer shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>RBAC Matrix</span>
            </button>

            {canCreate('masters') && (
              <button
                type="button"
                onClick={openAddUser}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User &amp; Allocate</span>
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="table-modern w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">Credentials &amp; Access</th>
                <th className="py-3 px-4">Role &amp; Department</th>
                <th className="py-3 px-4">CRM Module Rights</th>
                <th className="py-3 px-4">Payroll &amp; ESS Allocation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No user accounts found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const hasCustomOverrides =
                    !!u.customPermissions && Object.keys(u.customPermissions).length > 0;
                  const isActive = u.status !== 'Inactive';
                  const pMaster =
                    payrollMasters[u.id] ||
                    Object.values(payrollMasters).find(
                      (m) =>
                        m &&
                        m.email &&
                        u.email &&
                        m.email.toLowerCase() === u.email.toLowerCase()
                    );
                  const isPayrollEnrolled = Boolean(
                    pMaster && pMaster.enrolledInPayroll !== false
                  );

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 transition-all duration-200 ${
                        highlightedUserId === u.id
                          ? 'bg-indigo-50/80 ring-2 ring-indigo-500/40 shadow-xs'
                          : isCurrent
                          ? 'bg-indigo-50/30'
                          : ''
                      }`}
                    >
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => {
                              if (canEdit('masters')) {
                                setQuickPhotoTargetUser(u);
                                quickRowPhotoInputRef.current?.click();
                              }
                            }}
                            title={
                              canEdit('masters')
                                ? `Click to upload profile picture for ${u.name}`
                                : u.name
                            }
                            className={`relative group shrink-0 ${
                              canEdit('masters') ? 'cursor-pointer' : ''
                            }`}
                          >
                            <UserAvatar
                              name={u.name}
                              avatar={u.avatar}
                              className={`w-9 h-9 rounded-xl font-bold text-xs shadow-2xs ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-500/30'
                                  : 'bg-slate-800 text-white'
                              }`}
                            />
                            {canEdit('masters') && (
                              <div className="absolute inset-0 rounded-xl bg-slate-900/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {u.designation || u.role} · {u.location || 'HQ'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Credentials */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">{u.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>@{u.username || u.email.split('@')[0]}</span>
                          <span>·</span>
                          <span className="text-slate-400">
                            pwd: ••••••••
                          </span>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold text-[11px] px-2 py-0.5 rounded-lg border inline-block ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{u.department} Dept</div>
                      </td>

                      {/* Permissions */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {hasCustomOverrides ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <span>Custom Overrides Active</span>
                            </span>
                          ) : u.role === 'Super Admin' ? (
                            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-purple-600" />
                              <span>Full Master Access</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                              Standard {u.role} Defaults
                            </span>
                          )}

                          <div>
                            <button
                              type="button"
                              onClick={() => onConfigureUserPermissions(u)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              Configure Rights →
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Payroll & ESS Allocation */}
                      <td className="py-3.5 px-4">
                        {isPayrollEnrolled && pMaster ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.accessType === 'payroll_only' ||
                              u.accessScope === 'payroll_only' ||
                              pMaster.accessType === 'payroll_only' ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  Payroll Only (CRM Unlinked)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  CRM + Payroll ({pMaster.empCode})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-700 font-semibold">
                              {formatCurrency(pMaster.monthlyGross)}/mo · PL:{pMaster.plQuota ?? 12} CL:{pMaster.clQuota ?? 6}
                            </div>
                            {canEdit('masters') && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkFromPayroll(u)}
                                  className="text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                  title={`Remove ${u.name} from Payroll and keep CRM-only`}
                                >
                                  Unlink from Payroll
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                              CRM Only (Not in Payroll)
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleQuickEnrollInPayroll(u)}
                                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                + Create in Payroll →
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = isActive ? 'Inactive' : 'Active';
                            updateUser(u.id, {
                              status: nextStatus,
                            });
                            showToast('info', `User "${u.name}" account marked as ${nextStatus}.`);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {currentUser.role === 'Super Admin' && !isCurrent && isActive && (
                            <button
                              type="button"
                              onClick={() => loginAsUser(u.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Switch into this User's session"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Login As</span>
                            </button>
                          )}

                          {canEdit('masters') && (
                            <button
                              type="button"
                              onClick={() => openEditUser(u)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Edit User & Payroll Allocations"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {users.length > 1 && !isCurrent && canDelete('masters') && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Delete User"
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

      {/* Unified User Add / Edit & Full Allocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {editingUserId
                      ? `Edit User & Allocations: ${form.name}`
                      : 'Create User & Allocate Everything (CRM + Payroll & ESS)'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Configure user profile, role permissions, and optional Payroll &amp; ESS compensation in one place.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CROSS-SYSTEM QUESTION BANNER: DO YOU WANT TO CREATE IN PAYROLL? */}
            <div className="px-6 py-3 bg-indigo-950 text-white border-b border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold">
                  Do you want to create this user in Payroll &amp; ESS Portal as well?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAlsoCreateInPayroll(true)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    alsoCreateInPayroll
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800'
                  }`}
                >
                  ✓ Yes, Create in Both CRM &amp; Payroll
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAlsoCreateInPayroll(false);
                    if (modalSection === 'payroll') setModalSection('identity');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    !alsoCreateInPayroll
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800'
                  }`}
                >
                  No, Create in CRM Only
                </button>
              </div>
            </div>

            {/* Allocation Step / Tab Switcher — Zero Header Scrolling via Responsive Dropdown */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-100 border-b border-slate-200">
              {/* Mobile / Tablet Dropdown Selector */}
              <div className="block md:hidden w-full">
                <select
                  value={modalSection}
                  onChange={(e) => setModalSection(e.target.value as any)}
                  aria-label="Select User Allocation Step"
                  className="w-full header-dropdown-select bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="identity">1. CRM Profile, Role &amp; Territory Allocation</option>
                  <option value="permissions">2. CRM Module Rights Allocation (15 Modules)</option>
                  {alsoCreateInPayroll && (
                    <option value="payroll">
                      3. Payroll Salary, Statutory &amp; Leave Allocation ({payrollDraft.empCode})
                    </option>
                  )}
                </select>
              </div>

              {/* Desktop View Buttons */}
              <div className="hidden md:flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModalSection('identity')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                    modalSection === 'identity'
                      ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. CRM Profile, Role &amp; Territory Allocation
                </button>
                <button
                  type="button"
                  onClick={() => setModalSection('permissions')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                    modalSection === 'permissions'
                      ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>2. CRM Module Rights Allocation (15 Modules)</span>
                </button>
                {alsoCreateInPayroll && (
                  <button
                    type="button"
                    onClick={() => setModalSection('payroll')}
                    className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                      modalSection === 'payroll'
                        ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                        : 'text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>
                      3. Payroll Salary, Statutory, Bank &amp; Leave Allocation ({payrollDraft.empCode})
                    </span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* SECTION 1: CRM PROFILE, CREDENTIALS & ORG ALLOCATION */}
              {modalSection === 'identity' && (
                <div className="space-y-4">
                  {/* Optional Auto-Fill from Employee Master when creating a user */}
                  {!editingUserId && Object.values(payrollMasters).filter((m) => m && m.userId && m.enrolledInPayroll !== false).length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Auto-Fill Credentials from Employee Master (Optional)</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Select an employee from Employee Master to automatically use their official email ID, employee code, and department, then set their login password below.
                        </p>
                      </div>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (!selectedId) return;
                          const emp = payrollMasters[selectedId];
                          if (!emp) return;
                          setForm((prev) => ({
                            ...prev,
                            name: emp.name || prev.name,
                            username: emp.username || (emp.email ? emp.email.split('@')[0] : prev.username),
                            email: emp.email || prev.email,
                            phone: emp.phone || prev.phone,
                            role: (emp.role as UserRole) || prev.role,
                            department: (emp.department as User['department']) || prev.department,
                            designation: emp.designation || emp.role || prev.designation,
                            location: emp.location || prev.location,
                            reportingManager: emp.reportingManager || prev.reportingManager,
                            assignedTerritory: emp.assignedTerritory || prev.assignedTerritory,
                          }));
                          setAlsoCreateInPayroll(true);
                          setPayrollDraft((prev) => ({
                            ...prev,
                            empCode: emp.empCode || prev.empCode,
                            monthlyGross: emp.monthlyGross || prev.monthlyGross,
                            basicPct: emp.basicPct ?? prev.basicPct,
                            hraPct: emp.hraPct ?? prev.hraPct,
                            specialPct: emp.specialPct ?? prev.specialPct,
                            commissionPct: emp.commissionPct ?? prev.commissionPct,
                            pfAmount: emp.pfAmount ?? prev.pfAmount,
                            profTax: emp.profTax ?? prev.profTax,
                            tdsPct: emp.tdsPct ?? prev.tdsPct,
                            panNumber: emp.panNumber || prev.panNumber,
                            uanNumber: emp.uanNumber || prev.uanNumber,
                            pfAccountNo: emp.pfAccountNo || prev.pfAccountNo,
                            bankName: emp.bankName || prev.bankName,
                            bankAccountNo: emp.bankAccountNo || prev.bankAccountNo,
                            ifscCode: emp.ifscCode || prev.ifscCode,
                          }));
                        }}
                        className="bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 shrink-0 cursor-pointer"
                      >
                        <option value="">-- Select Employee from Master (or enter new below) --</option>
                        {Object.values(payrollMasters)
                          .filter((m) => m && m.userId && m.enrolledInPayroll !== false)
                          .map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.name} ({m.empCode} · {m.email})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Profile Picture Upload */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => modalPhotoInputRef.current?.click()}
                        className="relative group cursor-pointer"
                        title="Click to upload user profile picture"
                      >
                        <UserAvatar
                          name={form.name || 'User'}
                          avatar={form.avatar}
                          className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-sm border-2 border-white shadow-xs"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">User Profile Picture</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Shared across CRM Navigation, Activity Logs, and Payroll ESS Payslips.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        ref={modalPhotoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
                        onChange={handleModalPhotoSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => modalPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isImageAvatar(form.avatar) ? 'Replace Photo' : 'Upload Photo'}</span>
                      </button>
                      {isImageAvatar(form.avatar) && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, avatar: '' }))}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            name: e.target.value,
                            username:
                              form.username ||
                              e.target.value.toLowerCase().replace(/\s+/g, '.'),
                          })
                        }
                        placeholder="e.g. Rohan Deshmukh"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="rohan.deshmukh"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="rohan@enact360.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">
                          {editingUserId ? 'New Login Password' : 'Login Password *'}
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!editingUserId}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder={
                            editingUserId
                              ? 'Leave blank to keep current password'
                              : 'Enter login password for user'
                          }
                          className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl pl-3 pr-9 py-2 text-xs font-mono font-bold text-indigo-950"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Designation / Title
                      </label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="Regional Sales Manager"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone / Mobile</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98100 00000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Role *</label>
                      <select
                        value={form.role}
                        onChange={(e) => {
                          const nextRole = e.target.value as UserRole;
                          setForm({
                            ...form,
                            role: nextRole,
                            designation: form.designation || nextRole,
                          });
                          if (!editingUserId) {
                            setPayrollDraft((prev) => ({
                              ...prev,
                              monthlyGross: getRoleDefaultGross(nextRole),
                            }));
                            if (permPreset === 'role_default') {
                              applyPermPreset('role_default', nextRole);
                            }
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Sales Manager">Sales Manager</option>
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="Finance Executive">Finance Executive</option>
                        <option value="Management/Viewer">Management/Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <select
                        value={form.department}
                        onChange={(e) =>
                          setForm({ ...form, department: e.target.value as User['department'] })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs cursor-pointer"
                      >
                        <option value="Executive">Executive</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Office Location / Branch
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="New Delhi HQ"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Reporting Manager
                      </label>
                      <select
                        value={form.reportingManager}
                        onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                      >
                        {crmUsers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Allocated Territory / Region
                      </label>
                      <input
                        type="text"
                        value={form.assignedTerritory}
                        onChange={(e) => setForm({ ...form, assignedTerritory: e.target.value })}
                        placeholder="North Zone / Pan-India"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: CRM MODULE ACCESS & RBAC ALLOCATION AT CREATION TIME */}
              {modalSection === 'permissions' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        Allocate CRM Module Access Rights ({form.role})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Choose a role preset or customize View, Create, Edit, and Delete rights across all 15 modules right now.
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPermPreset('role_default', form.role)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs border cursor-pointer ${
                          permPreset === 'role_default'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Inherit {form.role} Defaults
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPermPreset('full_access', form.role)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs border cursor-pointer ${
                          permPreset === 'full_access'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        Grant Full Control
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPermPreset('read_only', form.role)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs border cursor-pointer ${
                          permPreset === 'read_only'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        View-Only (Read All)
                      </button>
                    </div>
                  </div>

                  {/* Column Quick Toggles */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-600">
                      Quick Column Allocation:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {(['view', 'create', 'edit', 'delete'] as PermissionAction[]).map((act) => (
                        <div key={act} className="flex items-center gap-1">
                          <span className="text-[11px] font-bold capitalize text-slate-700">
                            {act}:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAllPermColumn(act, true)}
                            className="px-2 py-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded font-bold cursor-pointer"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAllPermColumn(act, false)}
                            className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            None
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 15-Module Matrix Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="table-modern w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">CRM Module</th>
                          <th className="py-2 px-3">Section</th>
                          <th className="py-2 px-3 text-center">View</th>
                          <th className="py-2 px-3 text-center">Create</th>
                          <th className="py-2 px-3 text-center">Edit</th>
                          <th className="py-2 px-3 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ALL_CRM_MODULES.map((m) => {
                          const p = permsDraft[m.id] || {
                            view: false,
                            create: false,
                            edit: false,
                            delete: false,
                          };
                          return (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-900">{m.label}</td>
                              <td className="py-2 px-3 text-slate-500">{m.section}</td>
                              {(['view', 'create', 'edit', 'delete'] as PermissionAction[]).map(
                                (act) => (
                                  <td key={act} className="py-2 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!p[act]}
                                      onChange={() => toggleModulePerm(m.id, act)}
                                      className="rounded border-slate-300 text-indigo-600 cursor-pointer w-3.5 h-3.5"
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
                </div>
              )}

              {/* SECTION 3: PAYROLL & ESS ALLOCATION AT CREATION TIME */}
              {modalSection === 'payroll' && alsoCreateInPayroll && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-emerald-950">
                        Payroll &amp; ESS Master Allocation for {form.name || 'New Employee'}
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Allocates Salary Structure, Statutory PAN/UAN, Bank Account, and Leave Quotas in the Payroll ESS Portal.
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-900 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                      {payrollDraft.empCode} · {formatCurrency(payrollDraft.monthlyGross)}/mo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Employee Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={payrollDraft.empCode}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            empCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#1f7e9e]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Monthly Gross Salary (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={payrollDraft.monthlyGross}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            monthlyGross: Number(e.target.value),
                          })
                        }
                        className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 font-mono font-bold text-emerald-950"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tax Regime
                      </label>
                      <select
                        value={payrollDraft.taxRegime}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            taxRegime: e.target.value as typeof payrollDraft.taxRegime,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold"
                      >
                        <option value="New Tax Regime (Section 115BAC)">
                          New Regime (115BAC)
                        </option>
                        <option value="Old Tax Regime (With Exemptions)">Old Regime</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Default Work Mode
                      </label>
                      <select
                        value={payrollDraft.workMode}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            workMode: e.target.value as typeof payrollDraft.workMode,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold"
                      >
                        <option value="Office HQ">Office HQ</option>
                        <option value="Work From Home">Work From Home</option>
                        <option value="Client Site Visit">Client Site Visit</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Basic %</label>
                      <input
                        type="number"
                        value={payrollDraft.basicPct}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, basicPct: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">HRA %</label>
                      <input
                        type="number"
                        value={payrollDraft.hraPct}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, hraPct: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Sales Commission %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={payrollDraft.commissionPct}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            commissionPct: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-rose-800 block mb-1">
                        PF Amount (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={payrollDraft.pfAmount}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, pfAmount: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full bg-rose-50/70 border border-rose-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-rose-800 block mb-1">Prof. Tax (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={payrollDraft.profTax}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, profTax: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full bg-rose-50/70 border border-rose-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-rose-800 block mb-1">TDS Tax %</label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={payrollDraft.tdsPct}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, tdsPct: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full bg-rose-50/70 border border-rose-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                      <input
                        type="text"
                        value={payrollDraft.panNumber}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            panNumber: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PF UAN Number</label>
                      <input
                        type="text"
                        value={payrollDraft.uanNumber}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, uanNumber: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={payrollDraft.bankName}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, bankName: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Bank Account No
                      </label>
                      <input
                        type="text"
                        value={payrollDraft.bankAccountNo}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, bankAccountNo: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={payrollDraft.ifscCode}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            ifscCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Privilege Leave (PL)
                      </label>
                      <input
                        type="number"
                        value={payrollDraft.plQuota}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, plQuota: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Casual Leave (CL)
                      </label>
                      <input
                        type="number"
                        value={payrollDraft.clQuota}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, clQuota: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Sick Leave (SL)
                      </label>
                      <input
                        type="number"
                        value={payrollDraft.slQuota}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, slQuota: Number(e.target.value) })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Comp-Off Quota
                      </label>
                      <input
                        type="number"
                        value={payrollDraft.compOffQuota}
                        onChange={(e) =>
                          setPayrollDraft({
                            ...payrollDraft,
                            compOffQuota: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Allocated Shift Timing
                      </label>
                      <input
                        type="text"
                        value={payrollDraft.shiftTiming}
                        onChange={(e) =>
                          setPayrollDraft({ ...payrollDraft, shiftTiming: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>
                    Allocation Summary: <strong>{form.role}</strong> ·{' '}
                    <strong>
                      {permPreset === 'role_default' ? 'Role Default Rights' : 'Custom Module Rights'}
                    </strong>{' '}
                    ·{' '}
                    <strong>
                      {alsoCreateInPayroll
                        ? `Payroll Enrolled (${payrollDraft.empCode} · ${formatCurrency(
                            payrollDraft.monthlyGross
                          )}/mo)`
                        : 'CRM Only'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {editingUserId
                      ? 'Save CRM & Payroll Allocations'
                      : alsoCreateInPayroll
                      ? 'Create User in Both CRM & Payroll'
                      : 'Create User in CRM Only'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-50/70 border-b border-rose-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-900">Delete User Account</h3>
                <p className="text-xs text-rose-700 mt-0.5 font-medium">
                  Removes user from both CRM User Master and Payroll &amp; ESS Master.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <UserAvatar
                  name={userToDelete.name}
                  avatar={userToDelete.avatar}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{userToDelete.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {userToDelete.email}
                  </div>
                  <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                    {userToDelete.role} · {userToDelete.department} Dept
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
