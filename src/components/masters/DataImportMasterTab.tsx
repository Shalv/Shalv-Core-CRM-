import React, { useState, useMemo, useRef } from 'react';
import { useCrm } from '../../context/CrmContext';
import { User, UserRole, Customer, Lead } from '../../types';
import {
  EmployeeSalaryMasterRecord,
  loadEmployeeSalaryMasters,
  saveEmployeeSalaryMasters,
  buildDefaultSalaryMasterRecord,
  normalizeEmpCode,
  getNextAvailableEmpCode,
  forgetDeletedPayrollMasterIds,
} from '../payroll/payrollTypes';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  Target,
  ArrowRight,
  RefreshCw,
  FileText,
  Sparkles,
  Check,
  ShieldAlert,
  Trash2,
  Table,
  SlidersHorizontal,
} from 'lucide-react';

export type BulkImportEntityType = 'employees' | 'customers' | 'leads';

interface FieldSpec {
  key: string;
  label: string;
  required?: boolean;
  description: string;
  defaultValueHint: string;
  aliases: string[];
}

const EMPLOYEE_FIELD_SPECS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Full Name',
    required: true,
    description: 'Employee full legal name (`User.name` & `PayrollMaster.name`)',
    defaultValueHint: 'Required',
    aliases: ['name', 'full name', 'fullname', 'employee name', 'emp name', 'staff name'],
  },
  {
    key: 'email',
    label: 'Login Email',
    required: true,
    description: 'Primary login email address (`User.email` & `PayrollMaster.email`)',
    defaultValueHint: 'Required',
    aliases: ['email', 'login email', 'email address', 'official email', 'work email', 'mail'],
  },
  {
    key: 'username',
    label: 'Username',
    description: 'Login username (`User.username`)',
    defaultValueHint: 'Email prefix',
    aliases: ['username', 'user name', 'login id', 'userid'],
  },
  {
    key: 'password',
    label: 'Initial Password',
    description: 'Initial login password for CRM / Payroll ESS portal',
    defaultValueHint: 'Welcome@123',
    aliases: ['password', 'temp password', 'temppassword', 'initial password', 'pass'],
  },
  {
    key: 'empCode',
    label: 'Employee Code',
    description: 'Unique employee code (`EMP-001`, `EMP-002`, etc.)',
    defaultValueHint: 'Auto-sequenced (EMP-XXX)',
    aliases: ['empcode', 'emp code', 'employee code', 'employee id', 'emp id', 'code'],
  },
  {
    key: 'role',
    label: 'System Role',
    description: 'RBAC Role (`Sales Executive`, `Sales Manager`, `Finance Executive`, `Finance Manager`, `Administrator`)',
    defaultValueHint: 'Sales Executive',
    aliases: ['role', 'user role', 'crm role', 'system role', 'profile'],
  },
  {
    key: 'department',
    label: 'Department',
    description: 'Organizational department (`Sales`, `Finance`, `Operations`, `Executive`, `HR`)',
    defaultValueHint: 'Operations',
    aliases: ['department', 'dept', 'division', 'team'],
  },
  {
    key: 'designation',
    label: 'Designation / Title',
    description: 'Job title (`User.designation` & `PayrollMaster.designation`)',
    defaultValueHint: 'Matches Role',
    aliases: ['designation', 'job title', 'title', 'position'],
  },
  {
    key: 'phone',
    label: 'Mobile / Phone',
    description: '10-digit mobile number (`User.phone`)',
    defaultValueHint: 'Blank',
    aliases: ['phone', 'mobile', 'mobile number', 'contact number', 'phone number', 'cell'],
  },
  {
    key: 'location',
    label: 'Work Location',
    description: 'Office city/branch (`New Delhi`, `Mumbai`, `Bengaluru`, etc.)',
    defaultValueHint: 'New Delhi',
    aliases: ['location', 'work location', 'branch', 'city', 'office'],
  },
  {
    key: 'accessType',
    label: 'Portal Access Scope',
    description: '`crm_and_payroll` (Full CRM + Payroll) or `payroll_only` (Payroll ESS Only)',
    defaultValueHint: 'payroll_only',
    aliases: ['accesstype', 'access type', 'access scope', 'portal access', 'access', 'scope'],
  },
  {
    key: 'status',
    label: 'Employment Status',
    description: '`Active` or `Inactive`',
    defaultValueHint: 'Active',
    aliases: ['status', 'employment status', 'account status'],
  },
  {
    key: 'monthlyGross',
    label: 'Monthly Gross Salary (₹)',
    description: 'Monthly fixed gross pay in INR (`PayrollMaster.monthlyGross`)',
    defaultValueHint: 'Role default or 0',
    aliases: ['monthlygross', 'monthly gross', 'gross salary', 'gross', 'salary', 'monthly salary', 'ctc monthly'],
  },
  {
    key: 'basicPct',
    label: 'Basic Salary %',
    description: 'Basic percentage of Monthly Gross (`PayrollMaster.basicPct`)',
    defaultValueHint: '50%',
    aliases: ['basicpct', 'basic pct', 'basic %', 'basic percent'],
  },
  {
    key: 'hraPct',
    label: 'HRA %',
    description: 'HRA percentage of Monthly Gross (`PayrollMaster.hraPct`)',
    defaultValueHint: '25%',
    aliases: ['hrapct', 'hra pct', 'hra %', 'hra percent'],
  },
  {
    key: 'specialPct',
    label: 'Special Allowance %',
    description: 'Special allowance percentage (`PayrollMaster.specialPct`)',
    defaultValueHint: '18%',
    aliases: ['specialpct', 'special pct', 'special %', 'special allowance %'],
  },
  {
    key: 'joiningDate',
    label: 'Joining Date',
    description: 'Date of joining (`YYYY-MM-DD`)',
    defaultValueHint: 'Today',
    aliases: ['joiningdate', 'joining date', 'date of joining', 'doj', 'start date'],
  },
  {
    key: 'panNumber',
    label: 'PAN Number',
    description: '10-character Income Tax PAN (`PayrollMaster.panNumber`)',
    defaultValueHint: 'Blank',
    aliases: ['pannumber', 'pan number', 'pan', 'tax pan'],
  },
  {
    key: 'uanNumber',
    label: 'PF UAN Number',
    description: '12-digit EPFO UAN (`PayrollMaster.uanNumber`)',
    defaultValueHint: 'Blank',
    aliases: ['uannumber', 'uan number', 'uan', 'pf uan'],
  },
  {
    key: 'bankName',
    label: 'Bank Name',
    description: 'Salary disbursement bank name (`PayrollMaster.bankName`)',
    defaultValueHint: 'Company default bank',
    aliases: ['bankname', 'bank name', 'bank'],
  },
  {
    key: 'bankAccountNo',
    label: 'Bank Account No',
    description: 'Salary account number (`PayrollMaster.bankAccountNo`)',
    defaultValueHint: 'Blank',
    aliases: ['bankaccountno', 'bank account no', 'account number', 'account no', 'ac no', 'bank account'],
  },
  {
    key: 'ifscCode',
    label: 'IFSC Code',
    description: 'Bank branch IFSC code (`PayrollMaster.ifscCode`)',
    defaultValueHint: 'Company default IFSC',
    aliases: ['ifsccode', 'ifsc code', 'ifsc'],
  },
  {
    key: 'reportingManager',
    label: 'Reporting Manager',
    description: 'Reporting manager name (`User.reportingManager`)',
    defaultValueHint: 'Super Admin',
    aliases: ['reportingmanager', 'reporting manager', 'manager', 'supervisor'],
  },
];

const CUSTOMER_FIELD_SPECS: FieldSpec[] = [
  {
    key: 'name',
    label: 'Company / Customer Name',
    required: true,
    description: 'Legal or trade name of the client (`Customer.name`)',
    defaultValueHint: 'Required',
    aliases: ['name', 'company name', 'customer name', 'client name', 'organization', 'account name', 'company'],
  },
  {
    key: 'email',
    label: 'Primary Email',
    description: 'Official billing/account email (`Customer.email`)',
    defaultValueHint: 'Blank',
    aliases: ['email', 'primary email', 'company email', 'client email', 'billing email', 'email address'],
  },
  {
    key: 'phone',
    label: 'Primary Phone / Mobile',
    description: 'Primary contact number (`Customer.phone`)',
    defaultValueHint: 'Blank',
    aliases: ['phone', 'mobile', 'contact number', 'phone number', 'telephone'],
  },
  {
    key: 'customerType',
    label: 'Customer Type',
    description: '`Enterprise`, `SME`, `Government`, `Startup`, or `International`',
    defaultValueHint: 'Enterprise',
    aliases: ['customertype', 'customer type', 'type', 'segment', 'account type'],
  },
  {
    key: 'customerGroup',
    label: 'Customer Group',
    description: '`Direct`, `Channel`, or `Strategic`',
    defaultValueHint: 'Direct',
    aliases: ['customergroup', 'customer group', 'group', 'channel'],
  },
  {
    key: 'industry',
    label: 'Industry Sector',
    description: 'Vertical / industry (`Customer.industry`)',
    defaultValueHint: 'Enterprise Services',
    aliases: ['industry', 'sector', 'vertical', 'domain'],
  },
  {
    key: 'gstin',
    label: 'GSTIN Number',
    description: '15-character GST Identification Number (`Customer.gstin`)',
    defaultValueHint: 'Unregistered',
    aliases: ['gstin', 'gst number', 'gst no', 'gst'],
  },
  {
    key: 'pan',
    label: 'PAN Number',
    description: '10-character Permanent Account Number (`Customer.pan`)',
    defaultValueHint: 'Blank',
    aliases: ['pan', 'pan number', 'pan no'],
  },
  {
    key: 'addressLine1',
    label: 'Billing Street Address',
    description: 'Primary billing address line 1 (`CustomerAddress.addressLine1`)',
    defaultValueHint: '<Company Name> Office',
    aliases: ['addressline1', 'address line 1', 'address', 'billing address', 'street', 'street address'],
  },
  {
    key: 'city',
    label: 'Billing City',
    description: 'Billing city (`CustomerAddress.city`)',
    defaultValueHint: 'Matches State',
    aliases: ['city', 'billing city', 'town'],
  },
  {
    key: 'state',
    label: 'Billing State (GST)',
    description: 'Indian State name — auto-maps GST State Code & CGST/IGST rule',
    defaultValueHint: 'Delhi (07)',
    aliases: ['state', 'billing state', 'province', 'region'],
  },
  {
    key: 'pincode',
    label: 'Billing Pincode',
    description: '6-digit postal code (`CustomerAddress.pincode`)',
    defaultValueHint: '110001',
    aliases: ['pincode', 'pin code', 'zip', 'zipcode', 'postal code', 'pin'],
  },
  {
    key: 'paymentTermsName',
    label: 'Payment Terms',
    description: 'Matches Payment Terms Master (`100% Advance`, `Net 30 Days`, etc.)',
    defaultValueHint: '100% Advance',
    aliases: ['paymenttermsname', 'payment terms', 'payment term', 'terms', 'credit terms'],
  },
  {
    key: 'creditLimit',
    label: 'Credit Limit (₹)',
    description: 'Approved credit exposure limit in INR (`Customer.creditLimit`)',
    defaultValueHint: '0',
    aliases: ['creditlimit', 'credit limit', 'limit'],
  },
  {
    key: 'website',
    label: 'Website URL',
    description: 'Company website (`Customer.website`)',
    defaultValueHint: 'Blank',
    aliases: ['website', 'web', 'url', 'domain'],
  },
  {
    key: 'ownerEmail',
    label: 'Account Owner (Email / Name)',
    description: 'Matches User Master for `Customer.salesOwnerId`',
    defaultValueHint: 'Current Admin',
    aliases: ['owneremail', 'owner email', 'sales owner', 'account owner', 'owner', 'account manager'],
  },
  {
    key: 'contactName',
    label: 'Primary Contact Person',
    description: 'Automatically creates a linked primary `CustomerContact` record',
    defaultValueHint: 'Optional',
    aliases: ['contactname', 'contact name', 'contact person', 'primary contact', 'poc', 'spoc'],
  },
  {
    key: 'contactDesignation',
    label: 'Contact Designation',
    description: 'Designation for the linked primary contact (`CustomerContact.designation`)',
    defaultValueHint: 'Primary Contact',
    aliases: ['contactdesignation', 'contact designation', 'poc title', 'contact title'],
  },
  {
    key: 'status',
    label: 'Account Status',
    description: '`Active`, `Inactive`, or `Blocked`',
    defaultValueHint: 'Active',
    aliases: ['status', 'customer status', 'account status'],
  },
  {
    key: 'remarks',
    label: 'Remarks / Notes',
    description: 'Internal account notes (`Customer.remarks`)',
    defaultValueHint: 'Blank',
    aliases: ['remarks', 'notes', 'comment', 'comments', 'description'],
  },
];

const LEAD_FIELD_SPECS: FieldSpec[] = [
  {
    key: 'companyName',
    label: 'Company Name',
    required: true,
    description: 'Prospect organization name (`Lead.companyName`)',
    defaultValueHint: 'Required',
    aliases: ['companyname', 'company name', 'company', 'organization', 'client name', 'account'],
  },
  {
    key: 'contactPerson',
    label: 'Contact Person',
    required: true,
    description: 'Primary prospect contact name (`Lead.contactPerson`)',
    defaultValueHint: 'Required',
    aliases: ['contactperson', 'contact person', 'contact name', 'name', 'poc', 'decision maker'],
  },
  {
    key: 'mobile',
    label: 'Mobile Number',
    required: true,
    description: 'Primary mobile/phone number (`Lead.mobile`)',
    defaultValueHint: 'Required',
    aliases: ['mobile', 'phone', 'mobile number', 'contact number', 'phone number', 'cell'],
  },
  {
    key: 'email',
    label: 'Email Address',
    description: 'Prospect email address (`Lead.email`)',
    defaultValueHint: 'Blank',
    aliases: ['email', 'email address', 'work email', 'contact email', 'mail'],
  },
  {
    key: 'designation',
    label: 'Contact Designation',
    description: 'Job title of contact person (`Lead.designation`)',
    defaultValueHint: 'Decision Maker',
    aliases: ['designation', 'title', 'job title', 'role', 'position'],
  },
  {
    key: 'state',
    label: 'State (GST)',
    description: 'State name — auto-populates `Lead.stateCode` from State Master',
    defaultValueHint: 'Delhi (07)',
    aliases: ['state', 'province', 'region'],
  },
  {
    key: 'city',
    label: 'City',
    description: 'City name (`Lead.city`)',
    defaultValueHint: 'Matches State',
    aliases: ['city', 'town', 'location'],
  },
  {
    key: 'pincode',
    label: 'Pincode',
    description: 'Postal code (`Lead.pincode`)',
    defaultValueHint: '110001',
    aliases: ['pincode', 'pin code', 'zip', 'postal code'],
  },
  {
    key: 'address',
    label: 'Street Address',
    description: 'Mailing address (`Lead.address`)',
    defaultValueHint: 'Blank',
    aliases: ['address', 'street address', 'mailing address', 'office address'],
  },
  {
    key: 'website',
    label: 'Website',
    description: 'Company website URL (`Lead.website`)',
    defaultValueHint: 'Blank',
    aliases: ['website', 'url', 'web'],
  },
  {
    key: 'leadSource',
    label: 'Lead Source',
    description: '`Website`, `Referral`, `Microsoft`, `LinkedIn`, `Partner`, `Event`, `Outbound`, `Cold Call`',
    defaultValueHint: 'Website',
    aliases: ['leadsource', 'lead source', 'source', 'channel'],
  },
  {
    key: 'leadType',
    label: 'Lead Type',
    description: '`Inbound`, `Outbound`, or `Existing Account`',
    defaultValueHint: 'Inbound',
    aliases: ['leadtype', 'lead type', 'type'],
  },
  {
    key: 'industry',
    label: 'Industry',
    description: 'Industry vertical (`Lead.industry`)',
    defaultValueHint: 'Technology & IT Services',
    aliases: ['industry', 'sector', 'vertical'],
  },
  {
    key: 'requirement',
    label: 'Requirement / Scope',
    description: 'Business requirement summary (`Lead.requirement`)',
    defaultValueHint: 'Imported via CSV bulk upload',
    aliases: ['requirement', 'requirements', 'scope', 'inquiry', 'need', 'subject'],
  },
  {
    key: 'productCodeOrName',
    label: 'Product Interest (Code / Name)',
    description: 'Matches Product Master (`D365-BC-ESS`, `Enterprise ERP Implementation`, etc.)',
    defaultValueHint: 'First Active Product',
    aliases: ['product', 'productcodeorname', 'product code', 'product name', 'solution', 'service'],
  },
  {
    key: 'estimatedValue',
    label: 'Estimated Deal Value (₹)',
    description: 'Expected deal value in INR (`Lead.estimatedValue`)',
    defaultValueHint: '0',
    aliases: ['estimatedvalue', 'estimated value', 'deal value', 'value', 'amount', 'revenue'],
  },
  {
    key: 'budget',
    label: 'Customer Budget (₹)',
    description: 'Prospect budget in INR (`Lead.budget`)',
    defaultValueHint: '0',
    aliases: ['budget', 'client budget', 'customer budget'],
  },
  {
    key: 'expectedClosingDate',
    label: 'Expected Closing Date',
    description: 'Target close date (`YYYY-MM-DD`)',
    defaultValueHint: 'Today',
    aliases: ['expectedclosingdate', 'expected closing date', 'closing date', 'close date', 'target date'],
  },
  {
    key: 'rating',
    label: 'Lead Rating',
    description: '`Hot`, `Warm`, or `Cold`',
    defaultValueHint: 'Warm',
    aliases: ['rating', 'lead rating', 'temperature'],
  },
  {
    key: 'priority',
    label: 'Priority',
    description: '`Low`, `Medium`, `High`, or `Urgent`',
    defaultValueHint: 'Medium',
    aliases: ['priority', 'lead priority', 'urgency'],
  },
  {
    key: 'status',
    label: 'Pipeline Status',
    description: '`New`, `Contacted`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`',
    defaultValueHint: 'New',
    aliases: ['status', 'lead status', 'stage'],
  },
  {
    key: 'ownerEmail',
    label: 'Lead Owner (Email / Name)',
    description: 'Matches User Master for `Lead.leadOwnerId`',
    defaultValueHint: 'Current Admin',
    aliases: ['owneremail', 'owner email', 'lead owner', 'owner', 'assigned to'],
  },
  {
    key: 'remarks',
    label: 'Remarks / Notes',
    description: 'Initial timeline remark (`Lead.remarks`)',
    defaultValueHint: 'Blank',
    aliases: ['remarks', 'notes', 'comments', 'comment'],
  },
];

const SAMPLE_CSV_TEMPLATES: Record<BulkImportEntityType, string> = {
  employees: [
    'Full Name,Login Email,Username,Initial Password,Employee Code,System Role,Department,Designation,Mobile,Work Location,Portal Access Scope,Employment Status,Monthly Gross Salary,Basic %,HRA %,Special %,Joining Date,PAN Number,PF UAN Number,Bank Name,Bank Account No,IFSC Code,Reporting Manager',
    'Aarav Mehta,aarav.mehta@coreenact.com,aarav.mehta,Welcome@123,EMP-101,Sales Manager,Sales,Regional Sales Manager,9811001122,New Delhi,crm_and_payroll,Active,95000,50,25,18,2026-10-01,ABCDE1234F,100900112233,HDFC Bank Ltd,5010099887766,HDFC0001245,Shalv Sharma',
    'Divya Krishnan,divya.k@coreenact.com,divya.k,Welcome@123,EMP-102,Finance Executive,Finance,Senior Accounts Officer,9822003344,Mumbai,payroll_only,Active,68000,50,25,18,2026-10-05,FGHIJ5678K,100900445566,HDFC Bank Ltd,5010055443322,HDFC0001245,Shalv Sharma',
    'Karthik Rao,karthik.rao@coreenact.com,karthik.rao,Welcome@123,EMP-103,Sales Executive,Sales,Account Executive,9844005566,Bengaluru,payroll_only,Active,58000,50,25,18,2026-10-10,KLMNO9012P,100900778899,HDFC Bank Ltd,5010011223344,HDFC0001245,Shalv Sharma',
  ].join('\n'),
  customers: [
    'Company Name,Primary Email,Primary Phone,Customer Type,Customer Group,Industry,GSTIN,PAN,Billing Street Address,Billing City,Billing State,Billing Pincode,Payment Terms,Credit Limit,Website,Account Owner,Primary Contact Person,Contact Designation,Account Status,Remarks',
    'Apex Precision Manufacturing Ltd,accounts@apexprecision.in,+91 9811223344,Enterprise,Direct,Manufacturing,07AABCA1122D1Z5,AABCA1122D,"Plot 42, Okhla Industrial Area Phase-2",New Delhi,Delhi,110020,Net 30 Days,2500000,https://apexprecision.in,admin@coreenact.com,Rajeev Khanna,Director - Operations,Active,Key D365 Business Central Enterprise Account',
    'NovaTech Cloud Systems Pvt Ltd,finance@novatechcloud.com,+91 9820112233,SME,Channel,Technology & SaaS,27AABCN3344E1Z1,AABCN3344E,"Tower B, Bandra Kurla Complex",Mumbai,Maharashtra,400051,100% Advance,1200000,https://novatechcloud.com,admin@coreenact.com,Meera Deshmukh,VP Engineering,Active,Annual Cloud Licensing & Support Client',
    'Zenith Healthcare Diagnostics Ltd,procurement@zenithhealth.org,+91 9845098450,Enterprise,Strategic,Healthcare,29AABCZ7788F1Z9,AABCZ7788F,"104 MG Road, Indiranagar",Bengaluru,Karnataka,560038,Net 15 Days,3000000,https://zenithhealth.org,admin@coreenact.com,Dr. Siddharth Pai,Chief Operating Officer,Active,Multi-location ERP Rollout',
  ].join('\n'),
  leads: [
    'Company Name,Contact Person,Mobile Number,Email Address,Contact Designation,State,City,Pincode,Street Address,Website,Lead Source,Lead Type,Industry,Requirement,Product Interest,Estimated Deal Value,Customer Budget,Expected Closing Date,Lead Rating,Priority,Pipeline Status,Lead Owner,Remarks',
    'Vanguard Logistics India Pvt Ltd,Anirudh Singhania,9810445566,anirudh@vanguardlogistics.in,Head of Supply Chain,Delhi,New Delhi,110037,"NH-8 Mahipalpur Logistics Park",https://vanguardlogistics.in,Microsoft,Inbound,Logistics & Supply Chain,End-to-end ERP for 12 warehouses with GST e-Invoicing,D365-BC-ESS,1850000,2000000,2026-11-15,Hot,High,Qualified,admin@coreenact.com,Demo requested for next Tuesday',
    'Stellar Solar Energy Solutions,Prashant Joshi,9823556677,p.joshi@stellarsolar.co.in,Finance Controller,Maharashtra,Pune,411014,"World Trade Center, Kharadi",https://stellarsolar.co.in,LinkedIn,Outbound,Renewable Energy,Project accounting and multi-branch inventory tracking,SRV-ERP-IMP,1450000,1500000,2026-11-30,Warm,Medium,Contacted,admin@coreenact.com,Initial discovery call completed',
    'Horizon Finserv Advisors LLP,Nandini Iyer,9840778899,nandini@horizonfinserv.com,Managing Partner,Karnataka,Bengaluru,560001,"Prestige Meridian, MG Road",https://horizonfinserv.com,Referral,Inbound,Financial Services,25 User CRM & Automated Billing Suite,D365-BC-TEAM,650000,750000,2026-11-20,Hot,High,New,admin@coreenact.com,Referred by existing client',
  ].join('\n'),
};

/** RFC-4180 compliant CSV parser supporting quoted commas, newlines, and escaped double quotes */
export function parseCsvContent(rawText: string): { headers: string[]; rows: string[][] } {
  const cleaned = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return { headers: [], rows: [] };

  const records: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const nextCh = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (ch === '\r' && nextCh === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== '')) {
          records.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== '')) {
          records.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== '')) {
    records.push(currentRow);
  }

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h, idx) => h || `Column_${idx + 1}`);
  const rows = records.slice(1);
  return { headers, rows };
}

function normalizeHeaderToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();
}

function computeAutoMapping(headers: string[], specs: FieldSpec[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  // Pass 1: exact match on key, label, or alias
  for (const spec of specs) {
    const candidates = [spec.key, spec.label, ...spec.aliases].map(normalizeHeaderToken);
    const matched = headers.find(
      (h) => !usedHeaders.has(h) && candidates.includes(normalizeHeaderToken(h))
    );
    if (matched) {
      mapping[spec.key] = matched;
      usedHeaders.add(matched);
    }
  }

  // Pass 2: substring / partial match for any still-unmapped fields
  for (const spec of specs) {
    if (mapping[spec.key]) continue;
    const candidates = [spec.key, spec.label, ...spec.aliases].map(normalizeHeaderToken);
    const matched = headers.find((h) => {
      if (usedHeaders.has(h)) return false;
      const normH = normalizeHeaderToken(h);
      return candidates.some((c) => c.length >= 4 && (normH.includes(c) || c.includes(normH)));
    });
    if (matched) {
      mapping[spec.key] = matched;
      usedHeaders.add(matched);
    }
  }

  return mapping;
}

interface DataImportMasterTabProps {
  onNavigateTab?: (tab: 'users' | 'customers_contacts') => void;
  onNavigateModule?: (module: string) => void;
}

export const DataImportMasterTab: React.FC<DataImportMasterTabProps> = ({
  onNavigateTab,
  onNavigateModule,
}) => {
  const {
    currentUser,
    users,
    customers,
    leads,
    supplierCompany,
    importUsersBatch,
    importCustomersBatch,
    importLeadsBatch,
    formatCurrency,
  } = useCrm();

  const isAdmin =
    currentUser.role === 'Super Admin' || currentUser.role === 'Administrator';

  const [entityType, setEntityType] = useState<BulkImportEntityType>('employees');
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [showRawPasteBox, setShowRawPasteBox] = useState<boolean>(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [updateExistingDuplicates, setUpdateExistingDuplicates] = useState<boolean>(true);
  const [importResult, setImportResult] = useState<{
    entityType: BulkImportEntityType;
    totalProcessed: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    timestamp: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeSpecs = useMemo(() => {
    if (entityType === 'employees') return EMPLOYEE_FIELD_SPECS;
    if (entityType === 'customers') return CUSTOMER_FIELD_SPECS;
    return LEAD_FIELD_SPECS;
  }, [entityType]);

  const parsedCsv = useMemo(() => parseCsvContent(rawCsvText), [rawCsvText]);

  const loadCsvString = (text: string, sourceLabel: string, targetEntity = entityType) => {
    const specs =
      targetEntity === 'employees'
        ? EMPLOYEE_FIELD_SPECS
        : targetEntity === 'customers'
        ? CUSTOMER_FIELD_SPECS
        : LEAD_FIELD_SPECS;
    const parsed = parseCsvContent(text);
    setRawCsvText(text);
    setCsvFileName(sourceLabel);
    setFieldMapping(computeAutoMapping(parsed.headers, specs));
    setImportResult(null);
  };

  const handleEntitySwitch = (nextEntity: BulkImportEntityType) => {
    setEntityType(nextEntity);
    setCsvFileName('');
    setRawCsvText('');
    setFieldMapping({});
    setImportResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      loadCsvString(content, file.name, entityType);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const csvContent = SAMPLE_CSV_TEMPLATES[entityType];
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enact360_${entityType}_import_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleData = () => {
    loadCsvString(
      SAMPLE_CSV_TEMPLATES[entityType],
      `sample_${entityType}_template.csv`,
      entityType
    );
  };

  // Extract mapped rows and validate each row against the target schema
  const mappedRowsPreview = useMemo(() => {
    if (parsedCsv.headers.length === 0 || parsedCsv.rows.length === 0) return [];
    const headerIndexMap = new Map<string, number>();
    parsedCsv.headers.forEach((h, i) => headerIndexMap.set(h, i));

    return parsedCsv.rows.map((rowCells, rowIdx) => {
      const record: Record<string, string> = {};
      for (const spec of activeSpecs) {
        const mappedHeader = fieldMapping[spec.key];
        if (mappedHeader && headerIndexMap.has(mappedHeader)) {
          const colIdx = headerIndexMap.get(mappedHeader)!;
          record[spec.key] = (rowCells[colIdx] ?? '').trim();
        } else {
          record[spec.key] = '';
        }
      }

      const missingRequired: string[] = [];
      for (const spec of activeSpecs) {
        if (spec.required && !record[spec.key]) {
          missingRequired.push(spec.label);
        }
      }

      let isExistingDuplicate = false;
      let duplicateMatchInfo = '';

      if (entityType === 'employees') {
        const emailLower = (record.email || '').toLowerCase();
        const empCodeUpper = (record.empCode || '').toUpperCase();
        const existingU = users.find(
          (u) =>
            (emailLower && u.email?.trim().toLowerCase() === emailLower) ||
            (empCodeUpper && u.empCode?.trim().toUpperCase() === empCodeUpper)
        );
        if (existingU) {
          isExistingDuplicate = true;
          duplicateMatchInfo = `Matches existing user ${existingU.name} (${existingU.email})`;
        }
      } else if (entityType === 'customers') {
        const emailLower = (record.email || '').toLowerCase();
        const gstinUpper = (record.gstin || '').toUpperCase();
        const nameLower = (record.name || '').toLowerCase();
        const existingC = customers.find(
          (c) =>
            (gstinUpper && c.gstin?.trim().toUpperCase() === gstinUpper) ||
            (emailLower && c.email?.trim().toLowerCase() === emailLower) ||
            (nameLower && c.name.trim().toLowerCase() === nameLower)
        );
        if (existingC) {
          isExistingDuplicate = true;
          duplicateMatchInfo = `Matches existing customer ${existingC.name} (${existingC.customerCode})`;
        }
      } else if (entityType === 'leads') {
        const emailLower = (record.email || '').toLowerCase();
        const companyLower = (record.companyName || '').toLowerCase();
        const mobileTrim = (record.mobile || '').trim();
        const existingL = leads.find(
          (l) =>
            (emailLower && l.email?.trim().toLowerCase() === emailLower) ||
            (companyLower &&
              l.companyName.trim().toLowerCase() === companyLower &&
              l.mobile.trim() === mobileTrim)
        );
        if (existingL) {
          isExistingDuplicate = true;
          duplicateMatchInfo = `Matches existing lead ${existingL.companyName} (${existingL.leadNumber})`;
        }
      }

      const isValid =
        missingRequired.length === 0 &&
        (!isExistingDuplicate || updateExistingDuplicates);

      return {
        rowNumber: rowIdx + 1,
        record,
        missingRequired,
        isExistingDuplicate,
        duplicateMatchInfo,
        isValid,
      };
    });
  }, [
    parsedCsv,
    activeSpecs,
    fieldMapping,
    entityType,
    users,
    customers,
    leads,
    updateExistingDuplicates,
  ]);

  const validRowsCount = mappedRowsPreview.filter((r) => r.isValid).length;
  const duplicateRowsCount = mappedRowsPreview.filter((r) => r.isExistingDuplicate).length;
  const invalidRowsCount = mappedRowsPreview.filter((r) => !r.isValid).length;

  const handleExecuteImport = () => {
    if (!isAdmin || validRowsCount === 0) return;

    const validRecords = mappedRowsPreview
      .filter((r) => r.isValid)
      .map((r) => r.record);

    if (entityType === 'employees') {
      const currentPayrollMasters = loadEmployeeSalaryMasters(
        users,
        supplierCompany?.bankName || 'HDFC Bank Ltd',
        supplierCompany?.ifscCode || 'HDFC0001245'
      );
      const workingMasters: Record<string, EmployeeSalaryMasterRecord> = {
        ...currentPayrollMasters,
      };

      // Assign or normalize empCodes before importing users
      const userPayloads: Array<Partial<User> & { password?: string; tempPassword?: string; _rawRow: Record<string, string> }> = [];
      const tempMastersForCodeGen: Record<string, EmployeeSalaryMasterRecord> = {
        ...workingMasters,
      };

      validRecords.forEach((rec, idx) => {
        const cleanEmail = rec.email.trim().toLowerCase();
        const existingUser = users.find(
          (u) => u.email?.trim().toLowerCase() === cleanEmail
        );
        const existingMaster = existingUser
          ? workingMasters[existingUser.id]
          : undefined;

        const assignedCode = rec.empCode
          ? normalizeEmpCode(rec.empCode)
          : existingMaster?.empCode ||
            existingUser?.empCode ||
            getNextAvailableEmpCode(tempMastersForCodeGen);

        // Reserve this code in tempMastersForCodeGen so subsequent rows get the next code
        const reserveKey = existingUser?.id || `temp-${idx}`;
        tempMastersForCodeGen[reserveKey] = {
          ...(tempMastersForCodeGen[reserveKey] || ({} as EmployeeSalaryMasterRecord)),
          userId: reserveKey,
          empCode: assignedCode,
        };

        const rawAccess = (rec.accessType || 'payroll_only').trim().toLowerCase();
        const accessType: 'payroll_only' | 'crm_and_payroll' =
          rawAccess === 'crm_and_payroll' || rawAccess === 'all' || rawAccess === 'full'
            ? 'crm_and_payroll'
            : 'payroll_only';

        userPayloads.push({
          name: rec.name.trim(),
          email: rec.email.trim(),
          username: rec.username?.trim() || rec.email.trim().split('@')[0],
          password: rec.password?.trim() || (existingUser ? undefined : 'Welcome@123'),
          tempPassword: rec.password?.trim() || (existingUser ? undefined : 'Welcome@123'),
          empCode: assignedCode,
          role: (rec.role?.trim() || 'Sales Executive') as UserRole,
          department: rec.department?.trim() || 'Operations',
          designation: rec.designation?.trim() || rec.role?.trim() || 'Employee',
          phone: rec.phone?.trim() || '',
          location: rec.location?.trim() || 'New Delhi',
          reportingManager: rec.reportingManager?.trim() || currentUser.name,
          accessType,
          accessScope: accessType === 'payroll_only' ? 'payroll_only' : 'all',
          status:
            rec.status?.trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
          _rawRow: { ...rec, empCode: assignedCode, accessType },
        });
      });

      const batchRes = importUsersBatch(userPayloads, {
        updateExisting: updateExistingDuplicates,
      });

      const clearedIds: string[] = [];
      batchRes.users.forEach((createdOrUpdatedUser) => {
        const matchedPayload = userPayloads.find(
          (p) => p.email?.toLowerCase() === createdOrUpdatedUser.email.toLowerCase()
        );
        const raw = matchedPayload?._rawRow || {};
        const uid = createdOrUpdatedUser.id;
        clearedIds.push(uid);

        const baseMaster =
          workingMasters[uid] ||
          buildDefaultSalaryMasterRecord(
            createdOrUpdatedUser,
            0,
            supplierCompany?.bankName || 'HDFC Bank Ltd',
            supplierCompany?.ifscCode || 'HDFC0001245'
          );

        const parsedGross =
          raw.monthlyGross !== undefined && raw.monthlyGross !== ''
            ? Math.max(0, Number(String(raw.monthlyGross).replace(/[^0-9.]/g, '')) || 0)
            : baseMaster.monthlyGross;
        const parsedBasicPct =
          raw.basicPct !== undefined && raw.basicPct !== ''
            ? Math.min(100, Math.max(0, Number(raw.basicPct) || 50))
            : baseMaster.basicPct || 50;
        const parsedHraPct =
          raw.hraPct !== undefined && raw.hraPct !== ''
            ? Math.min(100, Math.max(0, Number(raw.hraPct) || 25))
            : baseMaster.hraPct || 25;
        const parsedSpecialPct =
          raw.specialPct !== undefined && raw.specialPct !== ''
            ? Math.min(100, Math.max(0, Number(raw.specialPct) || 18))
            : baseMaster.specialPct || 18;
        const pfCalc =
          parsedGross > 0
            ? Math.round(Math.min(Math.round(parsedGross * (parsedBasicPct / 100)), 15000) * 0.12)
            : 0;

        const accessType: 'payroll_only' | 'crm_and_payroll' =
          raw.accessType === 'crm_and_payroll' ? 'crm_and_payroll' : 'payroll_only';

        workingMasters[uid] = {
          ...baseMaster,
          userId: uid,
          empCode: raw.empCode || createdOrUpdatedUser.empCode || baseMaster.empCode,
          name: createdOrUpdatedUser.name,
          username: createdOrUpdatedUser.username || createdOrUpdatedUser.email.split('@')[0],
          email: createdOrUpdatedUser.email,
           ...(matchedPayload?.password
            ? {
                password: matchedPayload.password,
                tempPassword: matchedPayload.password,
              }
            : {}),
          accessType,
          syncedWithCrm: accessType === 'crm_and_payroll',
          enrolledInPayroll: true,
          role: createdOrUpdatedUser.role,
          department: createdOrUpdatedUser.department,
          designation: createdOrUpdatedUser.designation || createdOrUpdatedUser.role,
          location: createdOrUpdatedUser.location || 'New Delhi',
          joiningDate: raw.joiningDate || baseMaster.joiningDate || new Date().toISOString().slice(0, 10),
          status: createdOrUpdatedUser.status || 'Active',
          monthlyGross: parsedGross,
          basicPct: parsedBasicPct,
          hraPct: parsedHraPct,
          specialPct: parsedSpecialPct,
          pfAmount: pfCalc,
          panNumber: (raw.panNumber || baseMaster.panNumber || '').toUpperCase(),
          uanNumber: raw.uanNumber || baseMaster.uanNumber || '',
          bankName: raw.bankName || baseMaster.bankName || supplierCompany?.bankName || 'HDFC Bank Ltd',
          bankAccountNo: raw.bankAccountNo || baseMaster.bankAccountNo || '',
          ifscCode: (raw.ifscCode || baseMaster.ifscCode || supplierCompany?.ifscCode || 'HDFC0001245').toUpperCase(),
        };
      });

      if (clearedIds.length > 0) {
        forgetDeletedPayrollMasterIds(clearedIds);
      }
      saveEmployeeSalaryMasters(workingMasters, true, false, clearedIds);

      setImportResult({
        entityType: 'employees',
        totalProcessed: batchRes.created + batchRes.updated,
        createdCount: batchRes.created,
        updatedCount: batchRes.updated,
        skippedCount: mappedRowsPreview.length - (batchRes.created + batchRes.updated),
        timestamp: new Date().toLocaleTimeString('en-IN'),
      });
      return;
    }

    if (entityType === 'customers') {
      const customerPayloads = validRecords.map((rec) => ({
        name: rec.name,
        email: rec.email,
        phone: rec.phone,
        customerType: (rec.customerType || 'Enterprise') as Customer['customerType'],
        customerGroup: (rec.customerGroup || 'Direct') as Customer['customerGroup'],
        industry: rec.industry || 'Enterprise Services',
        gstin: rec.gstin,
        pan: rec.pan,
        addressLine1: rec.addressLine1,
        city: rec.city,
        state: rec.state || 'Delhi',
        pincode: rec.pincode || '110001',
        paymentTermsName: rec.paymentTermsName,
        creditLimit: Number(String(rec.creditLimit || '0').replace(/[^0-9.]/g, '')) || 0,
        website: rec.website,
        ownerEmail: rec.ownerEmail,
        contactName: rec.contactName,
        contactDesignation: rec.contactDesignation,
        status: (rec.status || 'Active') as Customer['status'],
        remarks: rec.remarks,
      }));

      const res = importCustomersBatch(customerPayloads, {
        updateExisting: updateExistingDuplicates,
      });

      setImportResult({
        entityType: 'customers',
        totalProcessed: res.created + res.updated,
        createdCount: res.created,
        updatedCount: res.updated,
        skippedCount: mappedRowsPreview.length - (res.created + res.updated),
        timestamp: new Date().toLocaleTimeString('en-IN'),
      });
      return;
    }

    if (entityType === 'leads') {
      const leadPayloads: Array<Partial<Lead> & { ownerEmail?: string; productCodeOrName?: string }> =
        validRecords.map((rec) => ({
          companyName: rec.companyName,
          contactPerson: rec.contactPerson,
          mobile: rec.mobile,
          email: rec.email,
          designation: rec.designation,
          state: rec.state || 'Delhi',
          city: rec.city,
          pincode: rec.pincode,
          address: rec.address,
          website: rec.website,
          leadSource: (rec.leadSource || 'Website') as Lead['leadSource'],
          leadType: (rec.leadType || 'Inbound') as Lead['leadType'],
          industry: rec.industry || 'Technology & IT Services',
          requirement: rec.requirement || 'Imported via CSV bulk upload',
          productCodeOrName: rec.productCodeOrName,
          estimatedValue: Number(String(rec.estimatedValue || '0').replace(/[^0-9.]/g, '')) || 0,
          budget: Number(String(rec.budget || '0').replace(/[^0-9.]/g, '')) || 0,
          expectedClosingDate: rec.expectedClosingDate,
          rating: (rec.rating || 'Warm') as Lead['rating'],
          priority: (rec.priority || 'Medium') as Lead['priority'],
          status: (rec.status || 'New') as Lead['status'],
          ownerEmail: rec.ownerEmail,
          remarks: rec.remarks,
        }));

      const preCount = leads.length;
      const totalImported = importLeadsBatch(leadPayloads, {
        updateExisting: updateExistingDuplicates,
      });
      const estimatedCreated = Math.min(totalImported, Math.max(0, validRecords.length - duplicateRowsCount));
      const estimatedUpdated = Math.max(0, totalImported - estimatedCreated);
      void preCount;

      setImportResult({
        entityType: 'leads',
        totalProcessed: totalImported,
        createdCount: estimatedCreated,
        updatedCount: estimatedUpdated,
        skippedCount: mappedRowsPreview.length - totalImported,
        timestamp: new Date().toLocaleTimeString('en-IN'),
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">
          Administrator Permission Required
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Bulk CSV Data Import for Employees, Customers, and Leads is restricted to{' '}
          <strong className="text-slate-900">Super Admin</strong> and{' '}
          <strong className="text-slate-900">Administrator</strong> accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Entity Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Administrator Bulk CSV Import Engine
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Direct Schema Field Mapper
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              Bulk Upload Employees, Customers & Sales Leads via CSV
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload any standard `.csv` file, review or customize column-to-schema field mappings, validate records, and commit directly into the live database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download {entityType === 'employees' ? 'Employees' : entityType === 'customers' ? 'Customers' : 'Leads'} CSV Template</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100/80 text-indigo-700 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample CSV Preview</span>
            </button>
          </div>
        </div>

        {/* Step 1: Select Target Data Structure */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            1. Select Target Data Module & Schema
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleEntitySwitch('employees')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                entityType === 'employees'
                  ? 'sidebar-tab-active-depth border-indigo-500/80 bg-indigo-50/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  entityType === 'employees'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Employees (User & Payroll)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {users.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Maps to <code className="text-[10px] font-mono text-indigo-700">User</code> &{' '}
                  <code className="text-[10px] font-mono text-indigo-700">EmployeeSalaryMasterRecord</code> (Login, Role, Emp Code, Gross Pay, Bank & Statutory).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleEntitySwitch('customers')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                entityType === 'customers'
                  ? 'sidebar-tab-active-depth border-indigo-500/80 bg-indigo-50/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  entityType === 'customers'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Customers & Contacts
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {customers.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Maps to <code className="text-[10px] font-mono text-indigo-700">Customer</code>,{' '}
                  <code className="text-[10px] font-mono text-indigo-700">CustomerAddress</code> &{' '}
                  <code className="text-[10px] font-mono text-indigo-700">CustomerContact</code> (GSTIN, State Code, Terms, Credit Limit).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleEntitySwitch('leads')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 cursor-pointer ${
                entityType === 'leads'
                  ? 'sidebar-tab-active-depth border-indigo-500/80 bg-indigo-50/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  entityType === 'leads'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Sales Pipeline Leads
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {leads.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Maps to <code className="text-[10px] font-mono text-indigo-700">Lead</code> (Company, Contact Person, Mobile, State Code, Product Interest, Deal Value & Owner).
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Upload CSV File or Paste CSV Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2. Upload CSV File or Paste Delimited Data
            </span>
            <button
              type="button"
              onClick={() => setShowRawPasteBox((prev) => !prev)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showRawPasteBox ? 'Hide Raw CSV Editor' : 'Paste / Edit Raw CSV Text'}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const content = typeof reader.result === 'string' ? reader.result : '';
                loadCsvString(content, file.name, entityType);
              };
              reader.readAsText(file);
            }}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            {csvFileName ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Loaded: {csvFileName}</span>
                  <span className="font-mono text-[11px] text-emerald-700">
                    ({parsedCsv.headers.length} columns · {parsedCsv.rows.length} data rows)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Click or drop another <code className="font-mono">.csv</code> file here to replace
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Click to select a <span className="text-indigo-600">.CSV</span> file or drag and drop it here
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports UTF-8 CSV exports from Microsoft Excel, Google Sheets, Tally, Zoho, or Dynamics 365
                </p>
              </div>
            )}
          </div>

          {showRawPasteBox && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Raw CSV Content (First line must be column headers)
                </label>
                {rawCsvText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawCsvText('');
                      setCsvFileName('');
                      setFieldMapping({});
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear CSV</span>
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={rawCsvText}
                onChange={(e) => loadCsvString(e.target.value, csvFileName || 'pasted_data.csv', entityType)}
                placeholder={SAMPLE_CSV_TEMPLATES[entityType]}
                className="w-full font-mono text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Post-Import Success Banner */}
      {importResult && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950">
                Bulk CSV Import Completed at {importResult.timestamp}
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Successfully processed{' '}
                <strong className="font-bold">{importResult.totalProcessed}</strong>{' '}
                {importResult.entityType} record(s):{' '}
                <strong className="font-bold">{importResult.createdCount} newly created</strong>,{' '}
                <strong className="font-bold">{importResult.updatedCount} updated</strong>
                {importResult.skippedCount > 0
                  ? `, and ${importResult.skippedCount} skipped`
                  : ''}
                . All records are synced to the backend state store.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {importResult.entityType === 'employees' && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('users')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 cursor-pointer transition"
              >
                <span>View Users & Payroll Master</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {importResult.entityType === 'customers' && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('customers_contacts')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 cursor-pointer transition"
              >
                <span>View Customers Master</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {importResult.entityType === 'leads' && onNavigateModule && (
              <button
                type="button"
                onClick={() => onNavigateModule('leads')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 cursor-pointer transition"
              >
                <span>Open Sales Leads Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3 & Step 4: Field Mapping & Live Validation Preview */}
      {parsedCsv.headers.length > 0 && (
        <div className="space-y-6">
          {/* Step 3: Interactive Schema Field Mapping */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    3. Map CSV Columns to Application Data Structure
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Matched{' '}
                    <strong className="text-slate-800">
                      {Object.values(fieldMapping).filter(Boolean).length} of {activeSpecs.length}
                    </strong>{' '}
                    schema fields automatically. Adjust any column mapping below before importing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={updateExistingDuplicates}
                    onChange={(e) => setUpdateExistingDuplicates(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Update existing records if Email / Code / GSTIN matches</span>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setFieldMapping(computeAutoMapping(parsedCsv.headers, activeSpecs))
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Map</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Target Schema Field</th>
                    <th className="py-2.5 px-4">Requirement</th>
                    <th className="py-2.5 px-4">CSV Column Mapping</th>
                    <th className="py-2.5 px-4">Row 1 Sample Value</th>
                    <th className="py-2.5 px-4">Schema Description & Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeSpecs.map((spec) => {
                    const selectedHeader = fieldMapping[spec.key] || '';
                    const headerIdx = selectedHeader
                      ? parsedCsv.headers.indexOf(selectedHeader)
                      : -1;
                    const sampleVal =
                      headerIdx >= 0 && parsedCsv.rows[0]
                        ? parsedCsv.rows[0][headerIdx] || ''
                        : '';

                    return (
                      <tr key={spec.key} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          <div>{spec.label}</div>
                          <div className="text-[10px] font-mono font-normal text-indigo-600">
                            {spec.key}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {spec.required ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <select
                            value={selectedHeader}
                            onChange={(e) =>
                              setFieldMapping((prev) => ({
                                ...prev,
                                [spec.key]: e.target.value,
                              }))
                            }
                            className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              selectedHeader
                                ? 'bg-indigo-50/50 border-indigo-300 text-slate-900'
                                : spec.required
                                ? 'bg-rose-50/60 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <option value="">-- Unmapped (Use Default: {spec.defaultValueHint}) --</option>
                            {parsedCsv.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700 max-w-[200px] truncate">
                          {sampleVal ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {sampleVal}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {selectedHeader ? '(Empty in Row 1)' : `Default: ${spec.defaultValueHint}`}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-slate-500">
                          {spec.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 4: Pre-Import Validation & Data Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <Table className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    4. Pre-Import Validation & Mapped Data Preview ({mappedRowsPreview.length} Rows)
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validRowsCount} Ready to Import
                    </span>
                    {duplicateRowsCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {duplicateRowsCount} Existing Match ({updateExistingDuplicates ? 'Will Update' : 'Will Skip'})
                      </span>
                    )}
                    {invalidRowsCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        {invalidRowsCount} Skipped / Missing Required Fields
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={validRowsCount === 0}
                  onClick={handleExecuteImport}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer ${
                    validRowsCount > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Import {validRowsCount}{' '}
                    {entityType === 'employees'
                      ? 'Employee(s)'
                      : entityType === 'customers'
                      ? 'Customer(s)'
                      : 'Lead(s)'}{' '}
                    Now
                  </span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Validation Status</th>
                    {entityType === 'employees' && (
                      <>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Login Email</th>
                        <th className="py-2.5 px-3">Emp Code</th>
                        <th className="py-2.5 px-3">Role / Dept</th>
                        <th className="py-2.5 px-3">Portal Scope</th>
                        <th className="py-2.5 px-3">Monthly Gross</th>
                        <th className="py-2.5 px-3">PAN / UAN</th>
                      </>
                    )}
                    {entityType === 'customers' && (
                      <>
                        <th className="py-2.5 px-3">Company Name</th>
                        <th className="py-2.5 px-3">Email & Phone</th>
                        <th className="py-2.5 px-3">GSTIN / PAN</th>
                        <th className="py-2.5 px-3">State & City</th>
                        <th className="py-2.5 px-3">Payment Terms</th>
                        <th className="py-2.5 px-3">Credit Limit</th>
                        <th className="py-2.5 px-3">Primary Contact</th>
                      </>
                    )}
                    {entityType === 'leads' && (
                      <>
                        <th className="py-2.5 px-3">Company Name</th>
                        <th className="py-2.5 px-3">Contact Person</th>
                        <th className="py-2.5 px-3">Mobile & Email</th>
                        <th className="py-2.5 px-3">State & City</th>
                        <th className="py-2.5 px-3">Source & Product</th>
                        <th className="py-2.5 px-3">Est. Value</th>
                        <th className="py-2.5 px-3">Stage / Rating</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mappedRowsPreview.map((row) => {
                    const r = row.record;
                    return (
                      <tr
                        key={row.rowNumber}
                        className={
                          !row.isValid
                            ? 'bg-rose-50/40 text-slate-500'
                            : row.isExistingDuplicate
                            ? 'bg-amber-50/30'
                            : 'hover:bg-slate-50/70'
                        }
                      >
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          #{row.rowNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {row.missingRequired.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Missing: {row.missingRequired.join(', ')}
                            </span>
                          ) : row.isExistingDuplicate ? (
                            <span
                              title={row.duplicateMatchInfo}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                updateExistingDuplicates
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {updateExistingDuplicates ? 'Update Existing' : 'Duplicate (Skip)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Valid New Record
                            </span>
                          )}
                        </td>

                        {entityType === 'employees' && (
                          <>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {r.name || <span className="text-rose-500 italic">Missing</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              {r.email || <span className="text-rose-500 italic">Missing</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700">
                              {r.empCode || 'Auto (EMP-XXX)'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="font-semibold">{r.role || 'Sales Executive'}</div>
                              <div className="text-[10px] text-slate-500">
                                {r.department || 'Operations'} · {r.designation || r.role || 'Employee'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.accessType === 'crm_and_payroll'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {r.accessType === 'crm_and_payroll'
                                  ? 'CRM + Payroll'
                                  : 'Payroll Only'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {r.monthlyGross
                                ? formatCurrency(
                                    Number(String(r.monthlyGross).replace(/[^0-9.]/g, '')) || 0
                                  )
                                : '₹0'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600">
                              <div>PAN: {r.panNumber || '—'}</div>
                              <div>UAN: {r.uanNumber || '—'}</div>
                            </td>
                          </>
                        )}

                        {entityType === 'customers' && (
                          <>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div>{r.name || <span className="text-rose-500 italic">Missing</span>}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {r.customerType || 'Enterprise'} · {r.industry || 'Enterprise Services'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-700">
                              <div>{r.email || '—'}</div>
                              <div className="font-mono text-[10px] text-slate-500">{r.phone || '—'}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              <div>GST: {r.gstin || 'Unregistered'}</div>
                              <div className="text-[10px] text-slate-500">PAN: {r.pan || '—'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="font-semibold">{r.state || 'Delhi'}</div>
                              <div className="text-[10px] text-slate-500">
                                {r.city || r.state || 'Delhi'} · {r.pincode || '110001'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {r.paymentTermsName || '100% Advance'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                              {formatCurrency(
                                Number(String(r.creditLimit || '0').replace(/[^0-9.]/g, '')) || 0
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div>{r.contactName || '—'}</div>
                              <div className="text-[10px] text-slate-500">
                                {r.contactDesignation || ''}
                              </div>
                            </td>
                          </>
                        )}

                        {entityType === 'leads' && (
                          <>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div>
                                {r.companyName || <span className="text-rose-500 italic">Missing</span>}
                              </div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {r.industry || 'Technology & IT Services'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">
                              <div className="font-semibold">
                                {r.contactPerson || <span className="text-rose-500 italic">Missing</span>}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {r.designation || 'Decision Maker'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-700">
                              <div className="font-mono">
                                {r.mobile || <span className="text-rose-500 italic">Missing</span>}
                              </div>
                              <div className="text-[10px] text-slate-500">{r.email || '—'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="font-semibold">{r.state || 'Delhi'}</div>
                              <div className="text-[10px] text-slate-500">{r.city || r.state || 'Delhi'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="font-semibold">{r.leadSource || 'Website'}</div>
                              <div className="text-[10px] text-indigo-600 font-mono">
                                {r.productCodeOrName || 'Default Product'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {formatCurrency(
                                Number(String(r.estimatedValue || '0').replace(/[^0-9.]/g, '')) || 0
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {r.status || 'New'} · {r.rating || 'Warm'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
