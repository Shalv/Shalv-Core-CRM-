import {
  StateMasterItem,
  ProductMasterItem,
  TaxRateMasterItem,
  PaymentTermItem,
  User,
  UserRole,
  CrmModuleKey,
  RolePermissionsMap,
  PayrollModuleKey,
  PayrollModulePermission,
  PayrollPermissionsMap,
  Lead,
  Opportunity,
  Customer,
  CustomerContact,
  SalesOrder,
  PurchaseOrder,
  PurchaseOrderItem,
  PaymentMilestone,
  Invoice,
  PaymentReceipt,
  CustomerLedgerEntry,
  Activity,
  NotificationItem,
  AuditLogItem,
  CompanyProfileMaster,
} from '../types';

export const SUPPLIER_COMPANY: CompanyProfileMaster = {
  name: 'Coreenact Solutions',
  legalName: 'Coreenact Solutions',
  gstin: '07FLTPS4666B1ZI',
  pan: 'FLTPS4666B',
  cin: '',
  state: 'Delhi',
  stateCode: '07',
  city: 'New Delhi',
  pincode: '110020',
  address: 'Innov8, 3rd Floor, 211, Okhla Industrial Estate Phase-3',
  email: 'infor@coreenact.com',
  phone: '9810998290',
  website: 'www.coreenact.com',
  logoUrl: '',
  bankName: 'Bank of Baroda',
  accountNumber: '71000200001745',
  ifscCode: 'BARB0DBOKHL',
  branch: 'Okhla Industrial Phase-3, New Delhi, 110020',
  bankDetails: {
    bankName: 'Bank of Baroda',
    accountNumber: '71000200001745',
    ifscCode: 'BARB0DBOKHL',
    branch: 'Okhla Industrial Phase-3, New Delhi, 110020',
    accountName: 'Coreenact Solutions',
  },
};

export const INITIAL_STATES: StateMasterItem[] = [
  { id: 'st-01', stateName: 'Jammu and Kashmir', stateCode: '01', country: 'India', zone: 'North' },
  { id: 'st-02', stateName: 'Himachal Pradesh', stateCode: '02', country: 'India', zone: 'North' },
  { id: 'st-03', stateName: 'Punjab', stateCode: '03', country: 'India', zone: 'North' },
  { id: 'st-04', stateName: 'Chandigarh', stateCode: '04', country: 'India', zone: 'Union Territory' },
  { id: 'st-05', stateName: 'Uttarakhand', stateCode: '05', country: 'India', zone: 'North' },
  { id: 'st-06', stateName: 'Haryana', stateCode: '06', country: 'India', zone: 'North' },
  { id: 'st-07', stateName: 'Delhi', stateCode: '07', country: 'India', zone: 'North' },
  { id: 'st-08', stateName: 'Rajasthan', stateCode: '08', country: 'India', zone: 'North' },
  { id: 'st-09', stateName: 'Uttar Pradesh', stateCode: '09', country: 'India', zone: 'North' },
  { id: 'st-10', stateName: 'Bihar', stateCode: '10', country: 'India', zone: 'East' },
  { id: 'st-19', stateName: 'West Bengal', stateCode: '19', country: 'India', zone: 'East' },
  { id: 'st-24', stateName: 'Gujarat', stateCode: '24', country: 'India', zone: 'West' },
  { id: 'st-27', stateName: 'Maharashtra', stateCode: '27', country: 'India', zone: 'West' },
  { id: 'st-29', stateName: 'Karnataka', stateCode: '29', country: 'India', zone: 'South' },
  { id: 'st-33', stateName: 'Tamil Nadu', stateCode: '33', country: 'India', zone: 'South' },
  { id: 'st-36', stateName: 'Telangana', stateCode: '36', country: 'India', zone: 'South' },
  { id: 'st-99', stateName: 'Other / International', stateCode: '99', country: 'International', zone: 'Union Territory' },
];

export const INITIAL_PAYMENT_TERMS: PaymentTermItem[] = [
  { id: 'pt-1', name: '30 Days Net', code: '30-DAYS', creditDays: 30, defaultMilestones: '100', isActive: true, description: 'Standard credit period 30 days' },
  { id: 'pt-2', name: '7 Days Net', code: '7-DAYS', creditDays: 7, defaultMilestones: '100', isActive: true, description: 'Professional consulting term 7 days' },
  { id: 'pt-3', name: '100% Advance', code: 'ADV-100', creditDays: 0, defaultMilestones: '100', isActive: true, description: '100% Advance Payment' },
  { id: 'pt-4', name: 'Milestone Based (Advance + Milestones)', code: 'MILESTONE', creditDays: 30, defaultMilestones: '12.5,20,37.5,20,10', isActive: true, description: 'Implementation milestones' },
];

export const INITIAL_TAX_RATES: TaxRateMasterItem[] = [
  { id: 'tax-01', name: 'GST 18% (Standard IT Services & Software)', code: 'GST-18', gstRate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, defaultHsnSac: '998313', applicableTo: 'Both', description: 'Applicable on ERP Consulting, AMC & Software Licenses', isActive: true },
  { id: 'tax-02', name: 'GST 0% (Exempt)', code: 'GST-00', gstRate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, defaultHsnSac: '998314', applicableTo: 'Both', description: 'Nil Rated supply', isActive: true },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Admin',
    username: 'admin',
    email: 'admin@coreenact.com',
    role: 'Super Admin',
    department: 'Executive',
    designation: 'Managing Director / Super Admin',
    status: 'Active',
    accessScope: 'all',
    password: 'CoreEnact@2026#',
    tempPassword: 'CoreEnact@2026#',
  },
];

export const ALL_CRM_MODULES: { id: CrmModuleKey; label: string; section: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', section: 'Main', description: 'Overview KPI tiles, sales trends, quick actions' },
  { id: 'leads', label: 'Lead Management', section: 'Sales Engine', description: 'Inbound & outbound leads, qualification, timeline events' },
  { id: 'opportunities', label: 'Opportunity Pipeline', section: 'Sales Engine', description: 'Deal stages, probabilities, tasks & follow-up remarks' },
  { id: 'customers', label: 'Customer Master 360', section: 'Sales Engine', description: 'Customer profiles, GSTIN, addresses, and key contacts' },
  { id: 'orders', label: 'Sales Orders', section: 'Sales Engine', description: 'Sales contracts, order items, GST calculation, approval workflow' },
  { id: 'purchases', label: 'Purchase Orders', section: 'Procurement', description: 'Vendor & supplier purchase orders, tax invoice formats, delivery tracking' },
  { id: 'support', label: 'Support & AMC Desk', section: 'Support & AMC', description: 'AMC contracts, SLA support tickets, Change Requests (CR), and license billing' },
  { id: 'milestones', label: 'Payment Milestones', section: 'Finance & Billing', description: 'CRM milestone schedules, billing stages, progress tracking' },
  { id: 'invoices', label: 'Invoices & GST', section: 'Finance & Billing', description: 'Proforma & Tax Invoices, GST tax breakdowns, sharing & status' },
  { id: 'payments', label: 'Payments & Collections', section: 'Finance & Billing', description: 'Payment receipts, TDS deductions, bank allocation, milestones sync' },
  { id: 'ledger', label: 'Customer Ledger & AR', section: 'Finance & Billing', description: 'Running balance ledger, debit/credit audit, receivables analysis' },
  { id: 'activities', label: 'Activities & Follow-ups', section: 'Management', description: 'Calls, meetings, demonstrations, tasks & deadlines' },
  { id: 'reports', label: 'Reports & Analytics', section: 'Management', description: 'Sales register, GST register, collection reports, aging analysis' },
  { id: 'masters', label: 'Masters & Settings', section: 'Management', description: 'Users, States, Products, Tax Rates, Payment Terms, RBAC matrix' },
  { id: 'database', label: 'Database & SQL View', section: 'Management', description: 'Schema introspection, raw SQL viewer, data exports' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissionsMap> = {
  'Super Admin': {
    dashboard: { view: true, create: true, edit: true, delete: true },
    leads: { view: true, create: true, edit: true, delete: true },
    opportunities: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    purchases: { view: true, create: true, edit: true, delete: true },
    support: { view: true, create: true, edit: true, delete: true },
    milestones: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    ledger: { view: true, create: true, edit: true, delete: true },
    activities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    masters: { view: true, create: true, edit: true, delete: true },
    database: { view: true, create: true, edit: true, delete: true },
  },
  'Administrator': {
    dashboard: { view: true, create: true, edit: true, delete: true },
    leads: { view: true, create: true, edit: true, delete: true },
    opportunities: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    purchases: { view: true, create: true, edit: true, delete: true },
    support: { view: true, create: true, edit: true, delete: true },
    milestones: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    ledger: { view: true, create: true, edit: true, delete: true },
    activities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    masters: { view: true, create: true, edit: true, delete: false },
    database: { view: true, create: false, edit: false, delete: false },
  },
  'Sales Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: true, edit: true, delete: true },
    opportunities: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    purchases: { view: true, create: true, edit: true, delete: true },
    support: { view: true, create: true, edit: true, delete: true },
    milestones: { view: true, create: false, edit: false, delete: false },
    invoices: { view: true, create: false, edit: false, delete: false },
    payments: { view: true, create: false, edit: false, delete: false },
    ledger: { view: true, create: false, edit: false, delete: false },
    activities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: false, edit: false, delete: false },
    masters: { view: true, create: false, edit: false, delete: false },
    database: { view: false, create: false, edit: false, delete: false },
  },
  'Sales Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: true, edit: true, delete: false },
    opportunities: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    orders: { view: true, create: true, edit: false, delete: false },
    purchases: { view: true, create: true, edit: false, delete: false },
    support: { view: true, create: true, edit: true, delete: false },
    milestones: { view: true, create: false, edit: false, delete: false },
    invoices: { view: false, create: false, edit: false, delete: false },
    payments: { view: false, create: false, edit: false, delete: false },
    ledger: { view: false, create: false, edit: false, delete: false },
    activities: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    masters: { view: false, create: false, edit: false, delete: false },
    database: { view: false, create: false, edit: false, delete: false },
  },
  'Finance Manager': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: false, edit: false, delete: false },
    opportunities: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    orders: { view: true, create: false, edit: true, delete: false },
    purchases: { view: true, create: true, edit: true, delete: true },
    support: { view: true, create: true, edit: true, delete: false },
    milestones: { view: true, create: true, edit: true, delete: true },
    invoices: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    ledger: { view: true, create: true, edit: true, delete: true },
    activities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: false, delete: false },
    masters: { view: true, create: true, edit: true, delete: false },
    database: { view: false, create: false, edit: false, delete: false },
  },
  'Finance Executive': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    leads: { view: false, create: false, edit: false, delete: false },
    opportunities: { view: false, create: false, edit: false, delete: false },
    customers: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: false, edit: false, delete: false },
    purchases: { view: true, create: true, edit: true, delete: false },
    support: { view: true, create: true, edit: true, delete: false },
    milestones: { view: true, create: false, edit: false, delete: false },
    invoices: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    ledger: { view: true, create: false, edit: false, delete: false },
    activities: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    masters: { view: false, create: false, edit: false, delete: false },
    database: { view: false, create: false, edit: false, delete: false },
  },
  'Management/Viewer': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    leads: { view: true, create: false, edit: false, delete: false },
    opportunities: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: false, edit: false, delete: false },
    purchases: { view: true, create: false, edit: false, delete: false },
    support: { view: true, create: false, edit: false, delete: false },
    milestones: { view: true, create: false, edit: false, delete: false },
    invoices: { view: true, create: false, edit: false, delete: false },
    payments: { view: true, create: false, edit: false, delete: false },
    ledger: { view: true, create: false, edit: false, delete: false },
    activities: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    masters: { view: false, create: false, edit: false, delete: false },
    database: { view: false, create: false, edit: false, delete: false },
  },
};

/* ----------------------------------------------------------------------------
 * Payroll (PayChakra) permission matrix — modules and default role grants.
 * Mirrors ALL_CRM_MODULES / DEFAULT_ROLE_PERMISSIONS above.
 * -------------------------------------------------------------------------- */
export const PAYROLL_MODULES: { id: PayrollModuleKey; label: string; section: string; description: string }[] = [
  { id: 'payroll_overview', label: 'Payroll Dashboard', section: 'Payroll Core', description: 'Company payroll KPIs, headcount and monthly cost overview' },
  { id: 'employees', label: 'Employee Masters', section: 'Payroll Core', description: 'Employee records, salary structure, onboarding and ESS enrolment' },
  { id: 'attendance', label: 'Monthly Attendance', section: 'Payroll Operations', description: 'Attendance capture, shifts and monthly day-logs' },
  { id: 'leaves', label: 'Leave Management', section: 'Payroll Operations', description: 'Leave balances, applications and approvals' },
  { id: 'reimbursements', label: 'Reimbursements & Claims', section: 'Payroll Operations', description: 'Expense claims, verification and settlement' },
  { id: 'loans', label: 'Loans & Advances', section: 'Payroll Operations', description: 'Employee loan applications, EMI schedules and recovery' },
  { id: 'payslips', label: 'Payslips & Salary Run', section: 'Payroll Operations', description: 'Monthly salary computation, payslip generation and disbursement' },
  { id: 'tax', label: 'Tax & Statutory', section: 'Payroll Admin', description: 'PF, ESI, Professional Tax and TDS statutory computation' },
  { id: 'reports', label: 'Payroll Reports', section: 'Payroll Admin', description: 'Payroll registers, cost reports and statutory returns' },
  { id: 'policy', label: 'Payroll Policy & Org Masters', section: 'Payroll Admin', description: 'Payroll policy, salary components and organisation structure' },
  { id: 'integration', label: 'Payroll Integration', section: 'Payroll Admin', description: 'External payroll/bank integration and API configuration' },
];

const payrollAll = (): PayrollModulePermission => ({ view: true, create: true, edit: true, approve: true });
const payrollNone = (): PayrollModulePermission => ({ view: false, create: false, edit: false, approve: false });
const payrollPerm = (view: boolean, create = false, edit = false, approve = false): PayrollModulePermission => ({ view, create, edit, approve });

const payrollMap = (fn: (module: PayrollModuleKey) => PayrollModulePermission): PayrollPermissionsMap =>
  PAYROLL_MODULES.reduce((acc, module) => {
    acc[module.id] = fn(module.id);
    return acc;
  }, {} as PayrollPermissionsMap);

export const DEFAULT_PAYROLL_ROLE_PERMISSIONS: Record<UserRole, PayrollPermissionsMap> = {
  'Super Admin': payrollMap(() => payrollAll()),
  'Administrator': payrollMap(() => payrollAll()),
  'Sales Manager': payrollMap((m) => {
    switch (m) {
      case 'payroll_overview': return payrollPerm(true);
      case 'employees': return payrollPerm(true, false, true, false);
      case 'attendance': return payrollPerm(true, true, true, true);
      case 'leaves': return payrollPerm(true, true, true, true);
      case 'reimbursements': return payrollPerm(true, false, false, true);
      case 'loans': return payrollPerm(true, false, false, true);
      case 'payslips': return payrollPerm(true);
      case 'reports': return payrollPerm(true);
      default: return payrollNone();
    }
  }),
  'Sales Executive': payrollMap((m) => {
    switch (m) {
      case 'payroll_overview': return payrollPerm(true);
      case 'employees': return payrollPerm(true);
      case 'attendance': return payrollPerm(true);
      case 'leaves': return payrollPerm(true, true);
      case 'reimbursements': return payrollPerm(true, true);
      case 'payslips': return payrollPerm(true);
      default: return payrollNone();
    }
  }),
  'Finance Manager': payrollMap((m) => {
    switch (m) {
      case 'integration': return payrollPerm(false);
      default: return payrollAll();
    }
  }),
  'Finance Executive': payrollMap((m) => {
    switch (m) {
      case 'payroll_overview': return payrollPerm(true);
      case 'employees': return payrollPerm(true, false, true, false);
      case 'attendance': return payrollPerm(true, true, true, false);
      case 'leaves': return payrollPerm(true, true, true, false);
      case 'reimbursements': return payrollPerm(true, true, true, false);
      case 'loans': return payrollPerm(true, true, true, false);
      case 'payslips': return payrollPerm(true, true, true, false);
      case 'tax': return payrollPerm(true, false, true, false);
      case 'reports': return payrollPerm(true);
      default: return payrollNone();
    }
  }),
  'Management/Viewer': payrollMap((m) => {
    switch (m) {
      case 'policy':
      case 'integration':
        return payrollNone();
      default:
        return payrollPerm(true);
    }
  }),
};

export const INITIAL_PRODUCTS: ProductMasterItem[] = [
  {
    id: 'prod-d365',
    code: 'D365',
    name: 'MS D365 Business Central',
    type: 'Service',
    category: 'ERP Solution',
    description: 'Microsoft Dynamics 365 Business Central implementation, customization, and upgrade services',
    uom: 'Each',
    hsnSac: '998313',
    gstRate: 18,
    costPrice: 1200000,
    sellingPrice: 1500000,
    isActive: true,
  },
  {
    id: 'prod-hrms',
    code: 'HRMS',
    name: 'ENACT Chakra (HRMS)',
    type: 'Service',
    category: 'HRMS Solution',
    description: 'Enterprise HRMS, Attendance, Payroll, and Self Service Portal',
    uom: 'Each',
    hsnSac: '998313',
    gstRate: 18,
    costPrice: 350000,
    sellingPrice: 500000,
    isActive: true,
  },
  {
    id: 'prod-crm',
    code: 'CRM',
    name: 'ENACT360 (CRM)',
    type: 'Service',
    category: 'CRM Solution',
    description: 'Enterprise Sales, Leads, Pipeline & Order Management CRM',
    uom: 'Each',
    hsnSac: '998313',
    gstRate: 18,
    costPrice: 350000,
    sellingPrice: 500000,
    isActive: true,
  },
  {
    id: 'prod-support',
    code: 'Support',
    name: 'ENACTSupport (AMC 400 hrs)',
    type: 'Subscription',
    category: 'Support & Maintenance',
    description: 'Comprehensive AMC Support contract 400 hours annual package with SLA guarantees',
    uom: 'Hours',
    hsnSac: '998313',
    gstRate: 18,
    costPrice: 300000,
    sellingPrice: 425000,
    isActive: true,
  },
  {
    id: 'lic-bc-essential',
    code: 'BC ESSENTIAL',
    name: 'MS D365 Business Central Essential',
    type: 'Product',
    category: 'Microsoft License',
    description: 'Annual license subscription for Dynamics 365 Business Central Essential user',
    uom: 'License',
    hsnSac: '997331',
    gstRate: 18,
    costPrice: 65000,
    sellingPrice: 79860,
    isActive: true,
  },
  {
    id: 'lic-bc-device',
    code: 'BC- DEVICE',
    name: 'Dynamics 365 Business Central Device',
    type: 'Product',
    category: 'Microsoft License',
    description: 'Shared device license subscription for Business Central operations',
    uom: 'License',
    hsnSac: '997331',
    gstRate: 18,
    costPrice: 38000,
    sellingPrice: 45360,
    isActive: true,
  },
  {
    id: 'lic-bc-team',
    code: 'DYNAMICS 365 BUSINESS CENTRAL TEAM',
    name: 'Dynamics 365 Business Central Team',
    type: 'Product',
    category: 'Microsoft License',
    description: 'Team member annual license for read and lightweight approval access',
    uom: 'License',
    hsnSac: '997331',
    gstRate: 18,
    costPrice: 6500,
    sellingPrice: 7980,
    isActive: true,
  },
  {
    id: 'lic-m365-basic',
    code: 'M365-BASIC',
    name: 'Microsoft 365 Business Basic',
    type: 'Product',
    category: 'Microsoft License',
    description: 'Microsoft 365 Business Basic annual license',
    uom: 'License',
    hsnSac: '997331',
    gstRate: 18,
    costPrice: 1800,
    sellingPrice: 2040,
    isActive: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cus-1',
    customerCode: 'TAJ01',
    name: 'Taj computer Solutions Pvt Ltd',
    customerType: 'Enterprise',
    customerGroup: 'Direct',
    gstin: '07AAECT3412A1ZZ',
    pan: 'AAECT3412A',
    email: 'sawankumar@tajcomputersolutions.com',
    phone: '+91 72909 96601',
    website: 'www.tajcomputersolutions.com',
    industry: 'Trading & Hardware',
    paymentTermsId: 'pt-1',
    paymentTermsName: '30 Days Net',
    creditLimit: 1000000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    solution: 'MS D365 Business Central',
    projectPhase: 'Live Support',
    gstRule: 'CGST + SGST',
    remarks: 'Active AMC Support & License contract (TAJ-AMC-2026-27)',
    addresses: [
      {
        id: 'addr-taj-1',
        type: 'Billing',
        title: 'Registered Office',
        addressLine1: 'B-2/28, Mohan Cooperative Industrial Area',
        addressLine2: 'Badarpur',
        city: 'New Delhi',
        state: 'Delhi',
        stateCode: '07',
        country: 'India',
        pincode: '110044',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-02T07:12:32Z',
    updatedAt: '2026-09-07T06:41:09Z',
  },
  {
    id: 'cus-2',
    customerCode: 'IGPL',
    name: 'incite Gravity Pvt Ltd',
    customerType: 'Enterprise',
    customerGroup: 'Direct',
    gstin: '06AAHCI1841H1ZQ',
    pan: 'AAHCI1841H',
    email: 'srikant@incitegravity.com',
    phone: '8290090611',
    website: 'https://incitegravity.com/',
    industry: 'Information Technology',
    paymentTermsId: 'pt-2',
    paymentTermsName: '7 Days Net',
    creditLimit: 500000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    solution: 'Microsoft Cloud & ERP Consulting',
    projectPhase: 'Live Support',
    gstRule: 'IGST',
    remarks: 'Professional services & Microsoft cloud subscriptions',
    addresses: [
      {
        id: 'addr-igpl-1',
        type: 'Billing',
        title: 'Corporate Office',
        addressLine1: 'EROS CORPORATE PARK, 1023-1024, 10th Floor',
        addressLine2: 'Sec-2, IMT, Manesar',
        city: 'Gurugram',
        state: 'Haryana',
        stateCode: '06',
        country: 'India',
        pincode: '122052',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-07T07:13:21Z',
    updatedAt: '2026-09-07T07:13:21Z',
  },
  {
    id: 'cus-3',
    customerCode: 'CUS-2026-473740',
    name: 'Build Storys Pvt Ltd',
    customerType: 'Enterprise',
    customerGroup: 'Strategic',
    gstin: '',
    pan: '',
    email: 'shruthi@buildstorys.com',
    phone: '97403 82382',
    website: 'https://buildstorys.com/',
    industry: 'Real Estate',
    paymentTermsId: 'pt-1',
    paymentTermsName: '30 Days Net',
    creditLimit: 2000000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    solution: 'Real Estate CRM & HRMS',
    projectPhase: 'Live Support',
    gstRule: 'IGST',
    remarks: 'AI Based application for their operations along with CRM & HRMS (Value: 18 Lakhs)',
    fromLeadId: '641',
    fromLeadNumber: 'LEAD-2026-159378',
    addresses: [
      {
        id: 'addr-bs-1',
        type: 'Billing',
        title: 'Headquarters',
        addressLine1: 'Building No.2122/5, 1st floor, 2nd main road',
        addressLine2: 'D block, opposite BSNL Telephone Exchange, Sahakarnagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        stateCode: '29',
        country: 'India',
        pincode: '560092',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-19T17:28:27Z',
    updatedAt: '2026-09-19T17:31:07Z',
  },
  {
    id: 'cus-4',
    customerCode: 'CUS-2026-586749',
    name: 'Eduvrse Pvt ltd',
    customerType: 'Startup',
    customerGroup: 'Direct',
    gstin: '06AAJCE9775G1Z5',
    pan: 'AAJCE9775G',
    email: 'eshant.sharma@eduvrse.com',
    phone: '9999100186',
    website: '',
    industry: 'Education Technology',
    paymentTermsId: 'pt-4',
    paymentTermsName: 'Milestone Based',
    creditLimit: 1500000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    solution: 'Education ERP',
    projectPhase: 'Discovery',
    gstRule: 'IGST',
    remarks: 'Education ERP with 5-stage payment milestones (Value: 12 Lakhs)',
    fromLeadId: '640',
    fromLeadNumber: 'LEAD-2026-776094',
    addresses: [
      {
        id: 'addr-epl-1',
        type: 'Billing',
        title: 'Registered Office',
        addressLine1: '107, Vipul Trade Centre, Sohna - Gurgaon Rd',
        addressLine2: 'Sector 48',
        city: 'Gurugram',
        state: 'Haryana',
        stateCode: '06',
        country: 'India',
        pincode: '122018',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-21T05:19:53Z',
    updatedAt: '2026-09-29T13:21:15Z',
  },
  {
    id: 'cus-5',
    customerCode: 'CUS-2026-791939',
    name: 'DHIMAN IRON AND STEEL INDUSTRIES PVT LTD',
    customerType: 'Enterprise',
    customerGroup: 'Direct',
    gstin: '03AABCD1234E1Z1',
    pan: 'AABCD1234E',
    email: 'jitengoyal@rrgg.in',
    phone: '9878681000',
    website: 'https://www.rrgg.in/',
    industry: 'Manufacturing & Steel',
    paymentTermsId: 'pt-1',
    paymentTermsName: '30 Days Net',
    creditLimit: 2500000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    remarks: 'Signed Sales Order SO/2026-27/00001 for MS D365 Business Central (17.7 Lakhs)',
    fromLeadId: '643',
    fromLeadNumber: 'LEAD-2026-924909',
    addresses: [
      {
        id: 'addr-dhiman-1',
        type: 'Billing',
        title: 'Factory & Head Office',
        addressLine1: 'G.T. Road, Khanna Side',
        addressLine2: '',
        city: 'Mandi Gobindgarh',
        state: 'Punjab',
        stateCode: '03',
        country: 'India',
        pincode: '141401',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-19T17:30:12Z',
    updatedAt: '2026-09-28T04:13:53Z',
  },
  {
    id: 'cus-6',
    customerCode: 'CUS-2026-390234',
    name: 'SS Steel Industry',
    customerType: 'Enterprise',
    customerGroup: 'Direct',
    gstin: '03AAASS5555G1Z9',
    pan: 'AAASS5555G',
    email: 'info@sssteelindustry.com',
    phone: '98147 55580',
    website: '',
    industry: 'Manufacturing',
    paymentTermsId: 'pt-1',
    paymentTermsName: '30 Days Net',
    creditLimit: 1500000,
    currency: 'INR',
    status: 'Active',
    salesOwnerId: 'usr-1',
    salesOwnerName: 'Shalv Sharma',
    remarks: 'Enterprise ERP Negotiation stage (Value: 15 Lakhs)',
    fromLeadId: '644',
    fromLeadNumber: 'LEAD-2026-161436',
    addresses: [
      {
        id: 'addr-ss-1',
        type: 'Billing',
        title: 'Works Office',
        addressLine1: 'Industrial Area Phase 2',
        addressLine2: '',
        city: 'Mandi Gobindgarh',
        state: 'Punjab',
        stateCode: '03',
        country: 'India',
        pincode: '141401',
        isDefault: true,
      },
    ],
    createdAt: '2026-09-22T08:23:17Z',
    updatedAt: '2026-09-28T04:15:35Z',
  },
];

export const INITIAL_CONTACTS: CustomerContact[] = [
  { id: 'cnt-1', customerId: 'cus-1', name: 'Sawan Pathak', designation: 'Finance Manager', department: 'Finance & Accounts', mobile: '+91 72909 96601', email: 'sawankumar@tajcomputersolutions.com', isPrimary: true, isDecisionMaker: true, status: 'Active' },
  { id: 'cnt-2', customerId: 'cus-2', name: 'Srikant Jena', designation: 'Director', department: 'Executive Management', mobile: '8290090611', email: 'srikant@incitegravity.com', isPrimary: true, isDecisionMaker: true, status: 'Active' },
  { id: 'cnt-3', customerId: 'cus-3', name: 'Shruthi', designation: 'Founder', department: 'Executive Management', mobile: '97403 82382', email: 'shruthi@buildstorys.com', isPrimary: true, isDecisionMaker: true, status: 'Active' },
  { id: 'cnt-4', customerId: 'cus-4', name: 'Eshant Sharma', designation: 'Founder / Director', department: 'Leadership', mobile: '9999100186', email: 'eshant.sharma@eduvrse.com', isPrimary: true, isDecisionMaker: true, status: 'Active' },
  { id: 'cnt-5', customerId: 'cus-5', name: 'Jiten', designation: 'Director', department: 'Management', mobile: '9878681000', email: 'jitengoyal@rrgg.in', isPrimary: true, isDecisionMaker: true, status: 'Active' },
  { id: 'cnt-6', customerId: 'cus-6', name: 'Ankur Goyal', designation: 'Director', department: 'Management', mobile: '98147 55580', email: 'info@sssteelindustry.com', isPrimary: true, isDecisionMaker: true, status: 'Active' },
];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_PAYMENTS: PaymentReceipt[] = [];

export const INITIAL_LEDGER_ENTRIES: CustomerLedgerEntry[] = [];

export const INITIAL_ORDERS: SalesOrder[] = [];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const INITIAL_MILESTONES: PaymentMilestone[] = [];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [];

export const INITIAL_ACTIVITIES: Activity[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export { INITIAL_LEADS } from './leadsData';

