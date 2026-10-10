import type { OrgMasterItem, PayrollOrgMasters } from './payrollTypes';

/**
 * Standard organisation structure for payroll (job-architecture model).
 *
 *  Department  = the business FUNCTION an employee belongs to (cost-centre level).
 *  Designation = the JOB TITLE, always tied to one department and one GRADE (G1-G9).
 *  Role        = the SYSTEM ACCESS role (RBAC) - what the person may see/do in CRM & payroll.
 *                A role is NOT a job title; many designations map to one role.
 *
 * Existing CRM values (Sales / Finance / Operations / Executive and the CRM role names)
 * are deliberately kept so current users, filters and permissions keep working.
 */

export interface GradeBand {
  grade: string;
  level: number;
  band: string;
}

export const GRADE_BANDS: GradeBand[] = [
  { grade: 'G1', level: 1, band: 'Trainee / Intern' },
  { grade: 'G2', level: 2, band: 'Associate / Executive' },
  { grade: 'G3', level: 3, band: 'Senior Executive / Specialist' },
  { grade: 'G4', level: 4, band: 'Team Lead / Assistant Manager' },
  { grade: 'G5', level: 5, band: 'Manager' },
  { grade: 'G6', level: 6, band: 'Senior Manager' },
  { grade: 'G7', level: 7, band: 'Associate Director / AVP' },
  { grade: 'G8', level: 8, band: 'Director / VP' },
  { grade: 'G9', level: 9, band: 'C-Suite / Managing Director' },
];

export type AccessLevel = 'Full' | 'Admin' | 'Manager' | 'Standard' | 'Read-only';

export const ACCESS_LEVELS: AccessLevel[] = ['Full', 'Admin', 'Manager', 'Standard', 'Read-only'];

/** Roles that may sign in through the Payroll Admin login. */
export const PAYROLL_ADMIN_ROLES = ['Super Admin', 'Administrator', 'Payroll Admin', 'HR Admin'];

export const isPayrollAdminRole = (role?: string): boolean =>
  !!role && PAYROLL_ADMIN_ROLES.some((r) => r.toLowerCase() === role.trim().toLowerCase());

const D = '2026-01-01';

const dept = (
  n: number,
  name: string,
  code: string,
  description: string
): OrgMasterItem => ({
  id: `DEP-${String(n).padStart(2, '0')}`,
  code,
  name,
  description,
  isActive: true,
  createdAt: D,
});

export const STANDARD_DEPARTMENTS: OrgMasterItem[] = [
  dept(1, 'Executive', 'EXE', 'Executive management, strategy and governance'),
  dept(2, 'Sales', 'SAL', 'Business development, account management and revenue'),
  dept(3, 'Pre-Sales', 'PRS', 'Solution consulting, demos, proposals and RFP response'),
  dept(4, 'Operations', 'OPS', 'Project delivery, implementation and order fulfilment'),
  dept(5, 'Customer Support', 'CSP', 'Technical support, AMC and customer success'),
  dept(6, 'Finance', 'FIN', 'Accounts, billing, collections, taxation and audit'),
  dept(7, 'Human Resources', 'HRD', 'Talent acquisition, payroll, employee relations and admin'),
  dept(8, 'IT & Infrastructure', 'ITI', 'Internal systems, security, cloud and end-user support'),
  dept(9, 'Procurement', 'PRC', 'Vendor management, purchase orders and licensing'),
  dept(10, 'Marketing', 'MKT', 'Demand generation, brand and communications'),
  dept(11, 'Legal & Compliance', 'LGL', 'Contracts, statutory compliance and risk'),
];

interface DesigSeed {
  name: string;
  dept: string;
  grade: string;
  description: string;
}

const DESIGNATION_SEEDS: DesigSeed[] = [
  // Executive
  { name: 'Managing Director', dept: 'Executive', grade: 'G9', description: 'Overall company leadership' },
  { name: 'Chief Operating Officer', dept: 'Executive', grade: 'G9', description: 'Operational leadership' },
  { name: 'Vice President - Strategy', dept: 'Executive', grade: 'G8', description: 'Strategy and planning' },
  { name: 'Operations Director', dept: 'Executive', grade: 'G8', description: 'Head of operations' },
  // Sales
  { name: 'Sales Trainee', dept: 'Sales', grade: 'G1', description: 'Entry-level sales' },
  { name: 'Sales Executive', dept: 'Sales', grade: 'G2', description: 'Frontline lead and deal handling' },
  { name: 'Senior Sales Executive', dept: 'Sales', grade: 'G3', description: 'Owns larger deals and accounts' },
  { name: 'Account Manager', dept: 'Sales', grade: 'G4', description: 'Key account relationship' },
  { name: 'Sales Manager', dept: 'Sales', grade: 'G5', description: 'Team pipeline and quota' },
  { name: 'Senior Sales Manager', dept: 'Sales', grade: 'G6', description: 'Regional sales lead' },
  { name: 'Director - Sales & Business Development', dept: 'Sales', grade: 'G8', description: 'Head of sales' },
  // Pre-Sales
  { name: 'Pre-Sales Consultant', dept: 'Pre-Sales', grade: 'G3', description: 'Demos and solution fit' },
  { name: 'Solution Architect', dept: 'Pre-Sales', grade: 'G5', description: 'Solution design and estimation' },
  // Operations
  { name: 'Operations Executive', dept: 'Operations', grade: 'G2', description: 'Order and delivery coordination' },
  { name: 'Functional Consultant', dept: 'Operations', grade: 'G3', description: 'ERP functional implementation' },
  { name: 'Technical Consultant', dept: 'Operations', grade: 'G3', description: 'ERP customisation and integration' },
  { name: 'Project Lead', dept: 'Operations', grade: 'G4', description: 'Leads implementation workstream' },
  { name: 'Project Manager', dept: 'Operations', grade: 'G5', description: 'Owns project delivery' },
  { name: 'Delivery Head', dept: 'Operations', grade: 'G7', description: 'Head of delivery' },
  // Customer Support
  { name: 'Support Executive', dept: 'Customer Support', grade: 'G2', description: 'L1 ticket handling' },
  { name: 'Technical Support Specialist', dept: 'Customer Support', grade: 'G3', description: 'L2 technical resolution' },
  { name: 'Customer Support Lead', dept: 'Customer Support', grade: 'G4', description: 'Support team lead' },
  { name: 'Support Manager', dept: 'Customer Support', grade: 'G5', description: 'Support and AMC management' },
  // Finance
  { name: 'Finance Executive', dept: 'Finance', grade: 'G2', description: 'Billing and receivables' },
  { name: 'Accounts & GST Officer', dept: 'Finance', grade: 'G3', description: 'Accounts and GST compliance' },
  { name: 'Finance Manager', dept: 'Finance', grade: 'G5', description: 'Financial controls and reporting' },
  { name: 'Head of Finance', dept: 'Finance', grade: 'G7', description: 'Finance function lead' },
  { name: 'Chief Financial Officer', dept: 'Finance', grade: 'G9', description: 'Corporate finance leadership' },
  // HR
  { name: 'HR Executive', dept: 'Human Resources', grade: 'G2', description: 'HR operations and records' },
  { name: 'Payroll Specialist', dept: 'Human Resources', grade: 'G3', description: 'Payroll processing and statutory' },
  { name: 'HR Manager', dept: 'Human Resources', grade: 'G5', description: 'HR business partner' },
  { name: 'Head of HR', dept: 'Human Resources', grade: 'G7', description: 'HR function lead' },
  // IT
  { name: 'IT Support Engineer', dept: 'IT & Infrastructure', grade: 'G2', description: 'Internal IT support' },
  { name: 'IT Manager', dept: 'IT & Infrastructure', grade: 'G5', description: 'Internal systems and security' },
  // Procurement
  { name: 'Procurement Executive', dept: 'Procurement', grade: 'G2', description: 'Purchase orders and vendors' },
  { name: 'Procurement Manager', dept: 'Procurement', grade: 'G5', description: 'Vendor and licence strategy' },
  // Marketing
  { name: 'Marketing Executive', dept: 'Marketing', grade: 'G2', description: 'Campaigns and content' },
  { name: 'Marketing Manager', dept: 'Marketing', grade: 'G5', description: 'Demand generation' },
  // Legal
  { name: 'Compliance Officer', dept: 'Legal & Compliance', grade: 'G4', description: 'Statutory and contract compliance' },
];

export const STANDARD_DESIGNATIONS: OrgMasterItem[] = DESIGNATION_SEEDS.map((s, i) => ({
  id: `DES-${String(i + 1).padStart(2, '0')}`,
  code: `${(STANDARD_DEPARTMENTS.find((d) => d.name === s.dept)?.code || 'GEN')}-${s.grade}-${String(
    i + 1
  ).padStart(2, '0')}`,
  name: s.name,
  description: s.description,
  isActive: true,
  createdAt: D,
  department: s.dept,
  grade: s.grade,
}));

interface RoleSeed {
  name: string;
  access: AccessLevel;
  description: string;
}

const ROLE_SEEDS: RoleSeed[] = [
  { name: 'Super Admin', access: 'Full', description: 'Unrestricted access to CRM, payroll and all masters' },
  { name: 'Administrator', access: 'Admin', description: 'Company operations, masters and user administration' },
  { name: 'Payroll Admin', access: 'Admin', description: 'Runs payroll, attendance, loans and statutory; payroll admin login' },
  { name: 'HR Admin', access: 'Admin', description: 'Employee lifecycle, attendance and leave administration; payroll admin login' },
  { name: 'Sales Manager', access: 'Manager', description: 'Team pipeline, approvals and sales reporting' },
  { name: 'Finance Manager', access: 'Manager', description: 'Financial controls, invoices, payments and audit' },
  { name: 'Sales Executive', access: 'Standard', description: 'Leads, opportunities and own activities' },
  { name: 'Finance Executive', access: 'Standard', description: 'Billing, collections and reconciliation' },
  { name: 'Management/Viewer', access: 'Read-only', description: 'View-only access to dashboards and reports' },
];

export const STANDARD_ROLES: OrgMasterItem[] = ROLE_SEEDS.map((s, i) => ({
  id: `ROL-${String(i + 1).padStart(2, '0')}`,
  code: `ROL-${String(i + 1).padStart(2, '0')}`,
  name: s.name,
  description: s.description,
  isActive: true,
  createdAt: D,
  accessLevel: s.access,
}));

export const STANDARD_LOCATIONS: OrgMasterItem[] = [
  { id: 'LOC-01', name: 'Mumbai HQ', code: 'MUM', description: 'Corporate headquarters, Bandra Kurla Complex', isActive: true, createdAt: D },
  { id: 'LOC-02', name: 'New Delhi HQ', code: 'DEL', description: 'North Zone regional office, Okhla', isActive: true, createdAt: D },
  { id: 'LOC-03', name: 'Bengaluru Branch', code: 'BLR', description: 'South Zone delivery centre', isActive: true, createdAt: D },
  { id: 'LOC-04', name: 'Pune Hub', code: 'PUN', description: 'West Zone operations hub', isActive: true, createdAt: D },
  { id: 'LOC-05', name: 'Hyderabad Center', code: 'HYD', description: 'HITEC City regional branch', isActive: true, createdAt: D },
];

export const buildStandardOrgMasters = (): PayrollOrgMasters => ({
  roles: STANDARD_ROLES.map((r) => ({ ...r })),
  designations: STANDARD_DESIGNATIONS.map((r) => ({ ...r })),
  locations: STANDARD_LOCATIONS.map((r) => ({ ...r })),
  departments: STANDARD_DEPARTMENTS.map((r) => ({ ...r })),
});

/** Legacy free-text designations seen in existing data -> standard designation. */
export const LEGACY_DESIGNATION_MAP: Record<string, string> = {
  'Managing Director / Super Admin': 'Managing Director',
  'VP of Strategy (Read-Only)': 'Vice President - Strategy',
  'Sales & Support Manager': 'Sales Manager',
  'Senior Account Executive': 'Senior Sales Executive',
  'Head of Billing & Receivables': 'Head of Finance',
  'Business Development Manager': 'Sales Manager',
  'Account Executive': 'Sales Executive',
  'Senior Finance Specialist': 'Accounts & GST Officer',
  'Operations Lead': 'Project Lead',
  'Technical Support Lead': 'Customer Support Lead',
  'Operations Specialist': 'Operations Executive',
  Administrator: 'Operations Director',
  Director: 'Operations Director',
};

export const gradeLabel = (grade?: string): string => {
  const g = GRADE_BANDS.find((b) => b.grade === grade);
  return g ? `${g.grade} · ${g.band}` : grade || '—';
};
