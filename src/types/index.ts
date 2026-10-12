export type UserRole =
  | 'Super Admin'
  | 'Administrator'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Finance Manager'
  | 'Finance Executive'
  | 'Management/Viewer'
  | string;

export type CrmModuleKey =
  | 'dashboard'
  | 'leads'
  | 'opportunities'
  | 'customers'
  | 'orders'
  | 'purchases'
  | 'support'
  | 'milestones'
  | 'invoices'
  | 'payments'
  | 'ledger'
  | 'activities'
  | 'reports'
  | 'masters'
  | 'database';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissionsMap = Record<CrmModuleKey, ModulePermission>;

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  tempPassword?: string;
  mustChangePassword?: boolean;
  mustChangePasswordOnFirstLogin?: boolean;
  accessScope?: 'all' | 'payroll_only' | 'FULL_CRM_AND_PAYROLL' | 'PAYROLL_ONLY';
  accessType?: 'payroll_only' | 'crm_and_payroll' | 'crm_only';
  empCode?: string;
  phone?: string;
  designation?: string;
  role: UserRole;
  department: 'Sales' | 'Finance' | 'Executive' | 'Operations' | string;
  status?: 'Active' | 'Inactive';
  avatar?: string;
  lastLoginAt?: string;
  location?: string;
  reportingManager?: string;
  assignedTerritory?: string;
  customPermissions?: Partial<RolePermissionsMap>;
}

export interface StateMasterItem {
  id: string;
  stateName: string;
  stateCode: string; // 2-digit GST State Code, e.g. "07", "27", "29"
  country: string;
  zone?: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'Union Territory';
  isActive?: boolean;
}

export type ProductType = 'Product' | 'Service' | 'Subscription';

export interface ProductMasterItem {
  id: string;
  code: string; // SKU or Item code
  name: string;
  type: ProductType;
  category: string;
  subcategory?: string;
  description: string;
  uom: string; // Nos, Hours, Months, Mandays, License, Units
  hsnSac: string; // HSN or SAC code e.g. "998313"
  gstRate: number; // 0, 5, 12, 18, 28
  costPrice: number;
  sellingPrice: number;
  discountDefault?: number;
  isActive: boolean;
  image?: string;
}

export interface TaxRateMasterItem {
  id: string;
  name: string;
  code: string;
  gstRate: number; // Total GST %
  cgstRate: number; // Intra-state CGST %
  sgstRate: number; // Intra-state SGST %
  igstRate: number; // Inter-state IGST %
  defaultHsnSac?: string;
  applicableTo: 'Service' | 'Product' | 'Both';
  description: string;
  isActive: boolean;
}

export interface PaymentTermItem {
  id: string;
  name: string;
  code: string;
  creditDays: number;
  description: string;
  defaultMilestones?: string; // e.g. "30,40,20,10"
  isActive?: boolean;
}

export interface CompanyBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType?: 'Current A/c' | 'Savings A/c' | 'OD / CC A/c';
  isPrimary?: boolean;
}

export interface CompanyProfileMaster {
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  cin?: string;
  state: string;
  stateCode: string;
  city: string;
  pincode: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    accountName: string;
  };
  bankAccounts?: CompanyBankAccount[];
  uiFontSize?: 'compact' | 'standard' | 'comfortable' | 'large';
  uiTheme?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'ocean' | 'midnight';
}

export type LeadStatus =
  | 'New'
  | 'Contact'
  | 'Contacted'
  | 'Qualified'
  | 'Unqualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Deferred';

export type LeadRating = 'Hot' | 'Warm' | 'Cold';

export type LeadPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type LeadSourceType =
  | 'Website'
  | 'Referral'
  | 'Microsoft'
  | 'LinkedIn'
  | 'Partner'
  | 'Event'
  | 'Outbound'
  | 'Expo/Event'
  | 'Cold Call'
  | 'Other';

export interface LeadTimelineEvent {
  id: string;
  type: 'Remark' | 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Status Update' | 'Other';
  title: string;
  status: string;
  detail: string;
  date: string; // ISO or YYYY-MM-DD HH:mm
  followUpAt?: string;
  user: string;
}

export interface LeadLinkedContact {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedin?: string;
  source?: string;
  mailingAddress?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  leadNumber: string; // LEAD-2026-00001
  leadDate: string; // YYYY-MM-DD
  companyName: string;
  contactPerson: string;
  designation?: string;
  mobile: string;
  email: string;
  website?: string;
  address: string;
  country: string;
  state: string;
  stateCode: string; // auto-populated from StateMaster
  city: string;
  pincode: string;
  leadSource: LeadSourceType;
  leadType: 'Inbound' | 'Outbound' | 'Existing Account';
  industry: string;
  requirement: string;
  primaryProductId?: string;
  productInterestIds: string[]; // IDs from ProductMaster
  estimatedValue: number;
  budget?: number;
  expectedClosingDate: string;
  expectedGoLive?: string;
  rating?: LeadRating;
  score?: number; // 0 to 100
  createPrimaryContact?: boolean;
  contactFirstName?: string;
  contactLastName?: string;
  contactDepartment?: string;
  contactMobile?: string;
  contactLinkedin?: string;
  nextActivity?: string;
  timelineEvents?: LeadTimelineEvent[];
  linkedContacts?: LeadLinkedContact[];
  leadOwnerId: string;
  leadOwnerName: string;
  priority: LeadPriority;
  status: LeadStatus;
  lostReason?: string;
  remarks?: string;
  isConverted: boolean;
  convertedCustomerId?: string;
  convertedOpportunityId?: string;
  convertedOpportunityNumber?: string;
  convertedSalesOrderId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStage =
  | 'Qualification'
  | 'Requirement Analysis'
  | 'Demo / Presentation'
  | 'Proposal Submitted'
  | 'Negotiation'
  | 'Commercial Discussion'
  | 'Decision Pending'
  | 'Won'
  | 'Lost';

export type OpportunityStatus =
  | 'Open'
  | 'In Progress'
  | 'On Hold'
  | 'Won'
  | 'Lost'
  | 'Cancelled';

export interface OpportunityRemark {
  id: string;
  remark: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
}

export type OpportunityTaskStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface OpportunityTask {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  assignedToName: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: OpportunityTaskStatus;
  reminder?: string;
  completionDate?: string;
}

export interface OpportunityAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Opportunity {
  id: string;
  opportunityNumber: string; // OPP-2026-00125
  opportunityName: string;
  leadId?: string;
  leadNumber?: string;
  customerId?: string;
  customerName: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  state: string;
  stateCode: string;
  salesOwnerId: string;
  salesOwnerName: string;
  expectedClosingDate: string;
  estimatedDealValue: number;
  probability: number; // 0 to 100
  stage: OpportunityStage;
  status: OpportunityStatus;
  remarks: OpportunityRemark[];
  tasks: OpportunityTask[];
  nextFollowUp?: string;
  lastActivity?: string;
  productInterestIds: string[];
  attachments: OpportunityAttachment[];
  isConvertedToOrder: boolean;
  convertedSalesOrderId?: string;
  convertedSalesOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  type: 'Billing' | 'Shipping' | 'Registered Office' | 'Other';
  title?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string; // auto from State Master
  country: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  designation: string;
  department: string;
  mobile: string;
  email: string;
  alternatePhone?: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface Customer {
  id: string;
  customerCode: string; // CUS-2026-00001
  name: string;
  customerType: 'Enterprise' | 'SME' | 'Government' | 'Startup' | 'International';
  customerGroup: 'Direct' | 'Channel' | 'Strategic';
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  website?: string;
  industry: string;
  paymentTermsId: string;
  paymentTermsName: string;
  creditLimit: number;
  currency: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  salesOwnerId: string;
  salesOwnerName: string;
  remarks?: string;
  solution?: string;
  projectPhase?: string;
  gstRule?: 'IGST' | 'CGST + SGST' | 'UTGST';
  addresses: CustomerAddress[];
  fromLeadId?: string;
  fromLeadNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  description: string;
  uom: string;
  hsnSac: string;
  quantity: number;
  unitRate: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export type SalesOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Confirmed';

export type OrderPaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export type PaymentStage =
  | 'Advance'
  | 'Milestone'
  | 'Delivery'
  | 'UAT / Go-Live'
  | 'Final Settlement'
  | 'Retention'
  | 'On Account'
  | 'Balance'
  | 'Other';

export interface SalesOrder {
  id: string;
  orderNumber: string; // SO-2026-00001
  orderDate: string;
  deliveryDate?: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  leadReferenceId?: string;
  leadReferenceNumber?: string;
  opportunityReferenceId?: string;
  opportunityReferenceNumber?: string;
  salespersonId: string;
  salespersonName: string;
  paymentTermsId: string;
  paymentTermsName: string;
  currency: string;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  isInterState: boolean; // Computed by comparing supplier state code with customer billing state code
  supplierStateCode: string;
  subtotal: number;
  totalDiscount: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  status: SalesOrderStatus;
  paymentStatus?: OrderPaymentStatus;
  invoicedAmount?: number;
  paidAmount?: number;
  remainingBalance?: number;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalRemarks?: string;
  remarks?: string;
  items: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Issued to Vendor'
  | 'Partially Received'
  | 'Received / Completed'
  | 'Cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  description: string;
  hsnSac: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. CS/PO/26/03/00001
  poDate: string; // YYYY-MM-DD
  expectedDeliveryDate?: string;
  vendorId: string; // Can be a customer ID (when customer is vendor) or standalone
  vendorName: string;
  vendorCode?: string;
  vendorGstin?: string;
  vendorPan?: string;
  vendorAddress: string;
  vendorState: string;
  vendorStateCode: string;
  vendorCity: string;
  vendorPincode: string;
  vendorPhone: string;
  vendorEmail: string;
  contactPerson?: string;
  isSameAsCustomer?: boolean;
  linkedCustomerId?: string;
  referenceQuotationNo?: string;
  paymentTerms: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  shippingAddress?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  termsAndConditions?: string;
  notes?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MilestoneStatus =
  | 'Draft'
  | 'Upcoming'
  | 'Due'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export interface PaymentMilestone {
  id: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  milestoneCode: string; // M1, M2, M3...
  description: string;
  percentage: number;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  invoicedAmount: number;
  paidAmount: number;
  proformaInvoiceId?: string;
  proformaInvoiceNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  isShared?: boolean;
  remarks?: string;
}

export type InvoiceType = 'Proforma' | 'Tax';

export type InvoiceStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Issued'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Converted'
  | 'Cancelled';

export interface InvoiceItem {
  id: string;
  productId?: string;
  productName: string;
  description: string;
  hsnSac: string;
  uom: string;
  quantity: number;
  unitRate: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-00001 or PI-2026-00001
  invoiceType?: InvoiceType; // 'Proforma' | 'Tax' (defaults to 'Tax')
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  salesOrderId?: string;
  salesOrderNumber?: string;
  milestoneId?: string; // crm_milestone_id
  milestoneCode?: string;
  sourceType?: 'Sales Order' | 'Milestone' | 'AMC Renewal' | 'Change Request' | 'Ticket' | 'Manual' | 'License' | 'CRM Opportunity';
  billingComponent?: 'License' | 'Implementation';
  supplyType?: 'B2B' | 'B2C';
  reverseCharge?: 'Yes' | 'No';
  amcContractId?: string;
  amcContractNumber?: string;
  changeRequestId?: string;
  changeRequestNumber?: string;
  ticketId?: string;
  ticketNumber?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  proformaInvoiceId?: string;
  proformaInvoiceNumber?: string;
  convertedToTaxInvoiceId?: string;
  convertedToTaxInvoiceNumber?: string;
  paymentStage?: PaymentStage;
  poNumber?: string;
  poDate?: string;
  isShared?: boolean; // mark_shared
  sharedAt?: string;
  sharedBy?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  isInterState: boolean;
  paymentTermsName: string;
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number; // remaining_balance
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    accountName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode =
  | 'Bank Transfer'
  | 'NEFT/RTGS'
  | 'UPI'
  | 'Cheque'
  | 'Cash'
  | 'Card'
  | 'Other';

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // REC-2026-00001
  paymentDate: string;
  customerId: string;
  customerName: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  milestoneId?: string; // crm_milestone_id
  milestoneCode?: string;
  paymentStage?: PaymentStage; // payment_stage
  amount: number;
  tdsDeducted?: number;
  netReceived: number;
  remainingBalance?: number; // remaining_balance after payment
  paymentMode: PaymentMode; // payment_mode
  bankCashAccount: string; // e.g. "HDFC Current A/c - 4081"
  transactionReference: string; // UTR or Cheque number
  remarks?: string;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
  referenceNumber: string;
  description: string;
  debit: number; // Invoice amounts (Increases receivable)
  credit: number; // Payment received (Reduces receivable)
  runningBalance: number;
  invoiceId?: string;
  paymentId?: string;
}

export type ActivityType =
  | 'Call'
  | 'Meeting'
  | 'Email'
  | 'Task'
  | 'Follow-up'
  | 'Demo'
  | 'Site Visit'
  | 'Reminder';

export type ActivityStatus = 'Pending' | 'Completed' | 'Overdue' | 'Cancelled' | 'Scheduled';

export interface Activity {
  id: string;
  activityType: ActivityType;
  subject: string;
  date: string;
  time?: string;
  assignedUserId: string;
  assignedUserName: string;
  priority: 'Low' | 'Medium' | 'High';
  status: ActivityStatus;
  notes?: string;
  leadId?: string;
  leadNumber?: string;
  opportunityId?: string;
  opportunityNumber?: string;
  customerId?: string;
  customerName?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  contactPerson?: string;
  completionDate?: string;
  completionNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'LEAD' | 'OPPORTUNITY' | 'FOLLOWUP' | 'ORDER' | 'MILESTONE' | 'INVOICE' | 'PAYMENT' | 'USER' | 'SYSTEM' | 'SUPPORT' | 'AMC';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkType?: 'lead' | 'opportunity' | 'customer' | 'order' | 'milestone' | 'invoice' | 'payment' | 'user' | 'masters' | 'support';
  linkId?: string;
  emailStatus?: 'Sent via Outlook' | 'Queued for Outlook' | 'Skipped';
  emailRecipient?: string;
  emailSentAt?: string;
}

export interface OutlookEmailNotificationConfig {
  enabled: boolean;
  outlookEmail: string;
  ccEmails: string;
  senderDisplayName: string;
  serverType: 'office365' | 'outlook_personal';
  smtpHost: string;
  smtpPort: number;
  useStartTls: boolean;
  // Microsoft Entra ID (Azure AD) App Registration Essentials
  appDisplayName: string;
  clientId: string;
  objectId: string;
  tenantId: string;
  supportedAccountTypes: string;
  redirectUriConfig: string;
  managedApplication: string;
  appState: 'Activated' | 'Disabled';
  notifyOnLead: boolean;
  notifyOnOpportunity: boolean;
  notifyOnOrder: boolean;
  notifyOnInvoice: boolean;
  notifyOnPayment: boolean;
  notifyOnMilestone: boolean;
  notifyOnSupport: boolean;
  notifyOnActivity: boolean;
  notifyOnUser: boolean;
  autoIncludeAssignedOwner: boolean;
}

export interface AuditLogItem {
  id: string;
  entityType: 'Lead' | 'Opportunity' | 'Customer' | 'SalesOrder' | 'PurchaseOrder' | 'Milestone' | 'Invoice' | 'Payment' | 'User' | 'Master' | 'SupportTicket' | 'AmcContract' | 'ChangeRequest';
  entityId: string;
  entityNumber: string;
  action: 'Created' | 'Updated' | 'Converted' | 'Approved' | 'Rejected' | 'Status Changed' | 'Payment Recorded' | 'Deleted';
  description: string;
  oldValue?: string;
  newValue?: string;
  performedById: string;
  performedByName: string;
  timestamp: string;
}

export type AmcContractType = 'AMC' | 'Support Retainer' | 'Warranty Support' | 'Dedicated SLA' | 'Managed Services';
export type AmcBillingCycle = 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly';
export type AmcContractStatus = 'Active' | 'Expiring Soon' | 'Pending Renewal' | 'Expired' | 'Draft' | 'Cancelled';

export interface AmcContract {
  id: string;
  contractNumber: string; // e.g. TAJ-AMC-2026-27
  customerId: string;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  solution: string; // e.g. MS D365 Business Central, Education ERP
  projectPhase: string; // e.g. Live Support, Implementation, UAT, Go-Live, Discovery
  contractType: AmcContractType;
  billingCycle: AmcBillingCycle;
  startDate: string;
  endDate: string;
  includedHours: number;
  consumedHours: number;
  hourlyOverageRate: number;
  annualValue: number; // Taxable value
  gstRate: number;
  totalValue: number; // Including GST
  slaTier: 'Platinum (2h / 8h)' | 'Gold (4h / 24h)' | 'Silver (8h / 48h)';
  accountManagerId: string;
  accountManagerName: string;
  status: AmcContractStatus;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketCategory =
  | 'Bug / Defect'
  | 'Change Request (CR)'
  | 'New Report'
  | 'Customization'
  | 'Support Query'
  | 'Training'
  | 'Data Upload / Migration'
  | 'License / Access';

export type SupportDepartment =
  | 'Technical Support'
  | 'Functional ERP'
  | 'Development / CR'
  | 'Finance & Billing'
  | 'QA & UAT';

export type SupportTicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type SupportTicketStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting on Customer'
  | 'Under UAT'
  | 'Resolved'
  | 'Closed'
  | 'Reopened';

export interface SupportTicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  isInternal: boolean;
  department?: SupportDepartment;
  attachmentName?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. TKT-00190
  ticketDate: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contractId?: string;
  contractNumber?: string;
  solution: string;
  moduleName: string;
  category: SupportTicketCategory;
  department: SupportDepartment;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignedToId: string;
  assignedToName: string;
  slaStatus: 'Within SLA' | 'At Risk' | 'Breached';
  responseDueAt: string;
  resolutionDueAt: string;
  hoursLogged: number;
  isBillable: boolean;
  estimatedBillingAmount?: number;
  changeRequestId?: string;
  changeRequestNumber?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  portalSource: 'Internal Desk' | 'Customer Portal' | 'Excel Import' | 'Email';
  resolutionSummary?: string;
  comments: SupportTicketComment[];
  createdAt: string;
  updatedAt: string;
}

export type ChangeRequestStatus =
  | 'Draft'
  | 'Submitted for Approval'
  | 'Customer Approved'
  | 'In Development'
  | 'UAT Sign-off'
  | 'Completed'
  | 'Invoiced'
  | 'Rejected';

export interface SupportChangeRequest {
  id: string;
  crNumber: string; // e.g. CHG-00001
  ticketId?: string;
  ticketNumber?: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  contractId?: string;
  contractNumber?: string;
  title: string;
  moduleName: string;
  scopeDescription: string;
  estimatedHours: number;
  hourlyRate: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  status: ChangeRequestStatus;
  proformaInvoiceId?: string;
  proformaInvoiceNumber?: string;
  taxInvoiceId?: string;
  taxInvoiceNumber?: string;
  approvedByCustomerAt?: string;
  requestedBy: string;
  assignedDeveloperName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseTypeMasterItem {
  id: string;
  code: string;
  name: string;
  description: string;
  hsnSac: string;
  monthlyCost: number;
  yearlyCost: number;
  status: 'Active' | 'Inactive';
}

