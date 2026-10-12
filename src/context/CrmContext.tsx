import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  CrmModuleKey,
  PermissionAction,
  ModulePermission,
  RolePermissionsMap,
  StateMasterItem,
  ProductMasterItem,
  TaxRateMasterItem,
  PaymentTermItem,
  Lead,
  LeadTimelineEvent,
  LeadLinkedContact,
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
  OpportunityTask,
  OpportunityTaskStatus,
  OpportunityRemark,
  Customer,
  CustomerAddress,
  CustomerContact,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PaymentMilestone,
  Invoice,
  InvoiceItem,
  PaymentReceipt,
  CustomerLedgerEntry,
  Activity,
  NotificationItem,
  OutlookEmailNotificationConfig,
  AuditLogItem,
  LeadStatus,
  SalesOrderStatus,
  AmcContract,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketComment,
  SupportChangeRequest,
  ChangeRequestStatus,
  LicenseTypeMasterItem,
} from '../types';
import {
  INITIAL_STATES,
  INITIAL_PRODUCTS,
  INITIAL_TAX_RATES,
  INITIAL_PAYMENT_TERMS,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_CONTACTS,
  INITIAL_LEADS,
  INITIAL_OPPORTUNITIES,
  INITIAL_ORDERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_MILESTONES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  SUPPLIER_COMPANY,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_CRM_MODULES,
} from '../data/initialData';
import {
  INITIAL_AMC_CONTRACTS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_CHANGE_REQUESTS,
  INITIAL_LICENSE_TYPES,
} from '../data/supportAmcData';
import { useApplicationSync, SyncStatus } from './useApplicationSync';
import { Snapshot } from '../shared/integrity';

interface CrmContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password?: string,
    options?: { portalMode?: 'payroll' | 'crm'; requiredEmail?: string }
  ) => {
    success: boolean;
    message?: string;
    user?: User;
    mustChangePassword?: boolean;
    payrollMaster?: any;
  };
  /** Validates credentials on the server and, if valid, refreshes the locally cached
   *  user/payroll credentials so a following login() succeeds. */
  syncCredentialsFromServer: (identifier: string, password: string) => Promise<boolean>;
  changeEmployeePassword: (emailOrUserId: string, newPassword: string) => boolean;
  loginAsUser: (userId: string) => void;
  logout: () => void;
  updateCurrentUserProfile: (data: Partial<User>) => void;

  // RBAC & Permissions
  rolePermissions: Record<UserRole, RolePermissionsMap>;
  updateRolePermission: (role: UserRole, module: CrmModuleKey, action: PermissionAction, value: boolean) => void;
  resetRolePermissions: (role?: UserRole) => void;
  hasPermission: (module: CrmModuleKey, action: PermissionAction) => boolean;
  canView: (module: CrmModuleKey) => boolean;
  canCreate: (module: CrmModuleKey) => boolean;
  canEdit: (module: CrmModuleKey) => boolean;
  canDelete: (module: CrmModuleKey) => boolean;
  updateUserCustomPermissions: (userId: string, permissions?: Partial<RolePermissionsMap>) => void;

  // Users Master
  users: User[];
  addUser: (user: Omit<User, 'id'> & { id?: string }) => User;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (identifier: string, newPassword: string) => { success: boolean; message: string; user?: User };
  
  // Masters
  states: StateMasterItem[];
  addState: (state: Omit<StateMasterItem, 'id'>) => void;
  updateState: (id: string, state: Partial<StateMasterItem>) => void;
  deleteState: (id: string) => void;
  getStateCode: (stateName: string) => string;
  
  products: ProductMasterItem[];
  addProduct: (product: Omit<ProductMasterItem, 'id'>) => void;
  updateProduct: (id: string, product: Partial<ProductMasterItem>) => void;
  deleteProduct: (id: string) => void;

  taxRates: TaxRateMasterItem[];
  addTaxRate: (taxRate: Omit<TaxRateMasterItem, 'id'>) => void;
  updateTaxRate: (id: string, taxRate: Partial<TaxRateMasterItem>) => void;
  deleteTaxRate: (id: string) => void;
  
  paymentTerms: PaymentTermItem[];
  addPaymentTerm: (term: Omit<PaymentTermItem, 'id'>) => void;
  updatePaymentTerm: (id: string, term: Partial<PaymentTermItem>) => void;
  deletePaymentTerm: (id: string) => void;
  
  // Leads
  leads: Lead[];
  addLead: (leadData: Omit<Lead, 'id' | 'leadNumber' | 'createdAt' | 'updatedAt' | 'isConverted'>) => Lead;
  updateLead: (id: string, leadData: Partial<Lead>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, lostReason?: string) => void;
  deleteLead: (id: string) => { success: boolean; message: string };
  addLeadTimelineEvent: (
    leadId: string,
    entry: {
      type: LeadTimelineEvent['type'];
      conversationAt: string;
      followUpAt?: string;
      remarks: string;
    }
  ) => void;
  createContactFromLead: (
    leadId: string,
    contactData: Omit<LeadLinkedContact, 'id' | 'leadId' | 'createdAt'>
  ) => void;
  qualifyLeadToOpportunity: (leadId: string) => Opportunity | null;
  importLeadsBatch: (rows: Array<Partial<Lead>>) => number;
  convertLead: (params: {
    leadId: string;
    existingCustomerId?: string;
    newCustomerData?: {
      name: string;
      customerType: Customer['customerType'];
      gstin?: string;
      pan?: string;
      email: string;
      phone: string;
      website?: string;
      industry: string;
      paymentTermsId: string;
      creditLimit: number;
    };
    createOpportunity?: boolean;
    opportunityName?: string;
    opportunityStage?: OpportunityStage;
    createOrderImmediately?: boolean;
    orderItems?: Array<{ productId: string; quantity: number; discountPercent: number }>;
  }) => { customer?: Customer; opportunity?: Opportunity; salesOrder?: SalesOrder };

  // Opportunities
  opportunities: Opportunity[];
  addOpportunity: (data: {
    opportunityName: string;
    leadId?: string;
    customerId?: string;
    customerName: string;
    contactPerson: string;
    contactMobile: string;
    contactEmail: string;
    state: string;
    salesOwnerId: string;
    expectedClosingDate: string;
    estimatedDealValue: number;
    probability: number;
    stage: OpportunityStage;
    status: OpportunityStatus;
    initialRemark?: string;
    nextFollowUp?: string;
    productInterestIds: string[];
  }) => Opportunity;
  updateOpportunityStageAndStatus: (
    id: string,
    stage: OpportunityStage,
    status: OpportunityStatus,
    probability?: number
  ) => void;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => void;
  addOpportunityRemark: (opportunityId: string, remarkText: string) => void;
  addOpportunityTask: (
    opportunityId: string,
    taskData: {
      title: string;
      description?: string;
      assignedToId: string;
      dueDate: string;
      priority: 'Low' | 'Medium' | 'High';
      reminder?: string;
    }
  ) => void;
  updateOpportunityTaskStatus: (
    opportunityId: string,
    taskId: string,
    status: OpportunityTaskStatus
  ) => void;
  addOpportunityAttachment: (opportunityId: string, fileName: string, fileSize: string) => void;
  convertOpportunityToSalesOrder: (params: {
    opportunityId: string;
    existingCustomerId?: string;
    newCustomerData?: {
      name: string;
      customerType: Customer['customerType'];
      gstin?: string;
      pan?: string;
      paymentTermsId: string;
      creditLimit: number;
    };
    paymentTermsId: string;
    deliveryDate?: string;
    items: Array<{ productId: string; quantity: number; discountPercent: number }>;
    milestonePercentages?: number[];
    remarks?: string;
  }) => { customer: Customer; salesOrder: SalesOrder };
  deleteOpportunity: (id: string) => { success: boolean; message: string };
  
  // Customers & Contacts Master
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => { success: boolean; message: string };
  addCustomerAddress: (customerId: string, address: Omit<CustomerAddress, 'id'>) => void;
  updateCustomerAddress: (customerId: string, addressId: string, address: Partial<CustomerAddress>) => void;
  deleteCustomerAddress: (customerId: string, addressId: string) => void;
  contacts: CustomerContact[];
  addCustomerContact: (contact: Omit<CustomerContact, 'id'>) => CustomerContact;
  updateCustomerContact: (id: string, contact: Partial<CustomerContact>) => void;
  deleteCustomerContact: (id: string) => void;
  
  // Sales Orders
  orders: SalesOrder[];
  addOrder: (orderData: {
    customerId: string;
    contactId?: string;
    leadReferenceId?: string;
    opportunityReferenceId?: string;
    paymentTermsId: string;
    deliveryDate?: string;
    billingAddress: CustomerAddress;
    shippingAddress: CustomerAddress;
    items: Array<{ productId: string; quantity: number; discountPercent: number }>;
    remarks?: string;
    milestonePercentages?: number[]; // e.g. [30, 40, 20, 10]
  }) => SalesOrder;
  updateOrderStatus: (id: string, status: SalesOrderStatus, remarks?: string) => void;
  updateOrderMilestones: (orderId: string, milestones: PaymentMilestone[]) => boolean;
  deleteOrder: (orderId: string) => { success: boolean; message: string };

  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, poData: Partial<PurchaseOrder>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => void;
  deletePurchaseOrder: (id: string) => { success: boolean; message: string };

  // Support & AMC Contracts, Tickets, Change Requests & License Billing
  amcContracts: AmcContract[];
  addAmcContract: (data: Omit<AmcContract, 'id' | 'createdAt' | 'updatedAt'>) => AmcContract;
  updateAmcContract: (id: string, data: Partial<AmcContract>) => void;
  deleteAmcContract: (id: string) => { success: boolean; message: string };
  renewAmcContract: (id: string, generateInvoiceType?: 'Proforma' | 'Tax') => { contract: AmcContract; invoice?: Invoice | null };
  generateInvoiceFromAmcContract: (contractId: string, invoiceType?: 'Proforma' | 'Tax') => Invoice | null;

  supportTickets: SupportTicket[];
  addSupportTicket: (data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'comments' | 'createdAt' | 'updatedAt'>) => SupportTicket;
  updateSupportTicket: (id: string, data: Partial<SupportTicket>) => void;
  updateSupportTicketStatus: (id: string, status: SupportTicketStatus, resolutionSummary?: string) => void;
  deleteSupportTicket: (id: string) => { success: boolean; message: string };
  addSupportTicketComment: (
    ticketId: string,
    comment: Omit<SupportTicketComment, 'id' | 'ticketId' | 'createdAt'>
  ) => void;
  logSupportTicketHours: (ticketId: string, hoursToAdd: number, note?: string) => void;
  importSupportTicketsBatch: (rows: Array<Partial<SupportTicket>>) => number;
  createChangeRequestFromTicket: (params: {
    ticketId: string;
    title: string;
    moduleName: string;
    scopeDescription: string;
    estimatedHours: number;
    hourlyRate: number;
    requestedBy: string;
    assignedDeveloperName: string;
  }) => SupportChangeRequest | null;
  generateInvoiceFromTicket: (ticketId: string, invoiceType?: 'Proforma' | 'Tax') => Invoice | null;

  changeRequests: SupportChangeRequest[];
  addChangeRequest: (data: Omit<SupportChangeRequest, 'id' | 'crNumber' | 'createdAt' | 'updatedAt'>) => SupportChangeRequest;
  updateChangeRequest: (id: string, data: Partial<SupportChangeRequest>) => void;
  updateChangeRequestStatus: (id: string, status: ChangeRequestStatus) => void;
  deleteChangeRequest: (id: string) => { success: boolean; message: string };
  generateInvoiceFromChangeRequest: (crId: string, invoiceType?: 'Proforma' | 'Tax') => Invoice | null;

  licenseTypes: LicenseTypeMasterItem[];
  addLicenseType: (data: Omit<LicenseTypeMasterItem, 'id'>) => LicenseTypeMasterItem;
  updateLicenseType: (id: string, data: Partial<LicenseTypeMasterItem>) => void;
  deleteLicenseType: (id: string) => void;
  generateLicenseInvoice: (params: {
    customerId: string;
    invoiceType: 'Proforma' | 'Tax';
    billingCycle: 'Monthly' | 'Yearly';
    items: Array<{ licenseId: string; quantity: number; customRate?: number }>;
    ticketId?: string;
    amcContractId?: string;
    notes?: string;
  }) => Invoice | null;
  
  // Milestones
  milestones: PaymentMilestone[];
  generateProformaFromMilestone: (milestoneId: string, paymentStage?: Invoice['paymentStage']) => Invoice | null;
  generateInvoiceFromMilestone: (milestoneId: string, paymentStage?: Invoice['paymentStage']) => Invoice | null;
  
  // Invoices (Proforma & Tax)
  invoices: Invoice[];
  createInvoiceDirect: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'balanceAmount' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (invoiceId: string, invoiceData: Partial<Invoice>) => { success: boolean; message: string; invoice?: Invoice };
  convertProformaToTaxInvoice: (proformaId: string) => Invoice | null;
  markInvoiceShared: (invoiceId: string) => void;
  cancelInvoice: (invoiceId: string, reason?: string) => { success: boolean; message: string };
  deleteProformaInvoice: (invoiceId: string) => { success: boolean; message: string };
  deleteTaxInvoice: (invoiceId: string) => { success: boolean; message: string };
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  
  // Payments
  payments: PaymentReceipt[];
  recordPayment: (paymentData: {
    customerId: string;
    salesOrderId?: string;
    invoiceId?: string;
    milestoneId?: string;
    paymentStage?: PaymentReceipt['paymentStage'];
    amount: number;
    tdsDeducted?: number;
    paymentMode: PaymentReceipt['paymentMode'];
    bankCashAccount: string;
    transactionReference: string;
    remarks?: string;
    paymentDate: string;
  }) => PaymentReceipt;
  deletePayment: (paymentId: string) => { success: boolean; message: string };
  getOrderFinanceSummary: (orderId: string) => {
    orderTotal: number;
    proformaTotal: number;
    taxInvoicedTotal: number;
    collectedTotal: number;
    remainingBalance: number;
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  };
  
  // Customer Ledger
  ledgerEntries: CustomerLedgerEntry[];
  getCustomerBalance: (customerId: string) => {
    totalInvoiced: number;
    totalReceived: number;
    outstanding: number;
    creditLimit: number;
    availableCredit: number;
  };
  
  // Activities
  activities: Activity[];
  addActivity: (activityData: Omit<Activity, 'id' | 'createdAt'>) => Activity;
  updateActivityStatus: (id: string, status: Activity['status'], completionNotes?: string) => void;
  deleteActivity: (id: string) => { success: boolean; message: string };
  
  // Notifications & Audit (All notifications routed to Outlook Email)
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  outlookEmailConfig: OutlookEmailNotificationConfig;
  updateOutlookEmailConfig: (data: Partial<OutlookEmailNotificationConfig>) => void;
  sendNotificationToOutlookEmail: (
    notification: NotificationItem,
    openInOutlookWeb?: boolean
  ) => Promise<void>;
  sendTestOutlookEmail: (
    targetEmail?: string
  ) => Promise<{ success: boolean; recipient: string }>;
  sendAllNotificationsToOutlook: () => Promise<number>;
  auditLogs: AuditLogItem[];
  
  // Helpers
  supplierCompany: typeof SUPPLIER_COMPANY;
  updateSupplierCompany: (data: Partial<typeof SUPPLIER_COMPANY>) => void;
  resetAllToSampleData: () => void;
  formatCurrency: (amount: number) => string;

  // Cross-tab & Server Sync
  hasRemoteConflict?: boolean;
  conflictMessage?: string;
  acceptRemoteConflict?: () => void;
  dismissConflict?: () => void;
  lastSyncedAt?: string | null;
  syncReady?: boolean;
  syncStatus?: SyncStatus;
  retrySync?: () => void;
  reloadSavedSync?: () => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'corecrm_v2_current_user',
  IS_AUTHENTICATED: 'corecrm_v2_is_authenticated',
  ROLE_PERMISSIONS: 'corecrm_v2_role_permissions',
  USERS: 'corecrm_v2_users',
  STATES: 'corecrm_v2_states',
  PRODUCTS: 'corecrm_v2_products',
  TAX_RATES: 'corecrm_v2_tax_rates',
  PAYMENT_TERMS: 'corecrm_v2_payment_terms',
  LEADS: 'corecrm_v2_leads',
  OPPORTUNITIES: 'corecrm_v2_opportunities',
  CUSTOMERS: 'corecrm_v2_customers',
  CONTACTS: 'corecrm_v2_contacts',
  ORDERS: 'corecrm_v2_orders',
  PURCHASE_ORDERS: 'corecrm_v2_purchase_orders',
  AMC_CONTRACTS: 'corecrm_v2_amc_contracts',
  SUPPORT_TICKETS: 'corecrm_v2_support_tickets',
  CHANGE_REQUESTS: 'corecrm_v2_change_requests',
  LICENSE_TYPES: 'corecrm_v2_license_types',
  MILESTONES: 'corecrm_v2_milestones',
  INVOICES: 'corecrm_v2_invoices',
  PAYMENTS: 'corecrm_v2_payments',
  LEDGER: 'corecrm_v2_ledger',
  ACTIVITIES: 'corecrm_v2_activities',
  NOTIFICATIONS: 'corecrm_v2_notifications',
  OUTLOOK_EMAIL_CONFIG: 'corecrm_v2_outlook_email_config',
  AUDIT: 'corecrm_v2_audit',
  SUPPLIER_COMPANY: 'corecrm_v2_supplier_company',
};

const sanitizeClientUser = (u: any): User => {
  if (!u || typeof u !== 'object') return u;
  const {
    password: _p,
    tempPassword: _tp,
    passwordHash: _ph,
    password_hash: _ph2,
    mustChangePassword: _m1,
    mustChangePasswordOnFirstLogin: _m2,
    forcePasswordReset: _m3,
    firstLogin: _m4,
    ...rest
  } = u;
  return {
    ...rest,
    mustChangePassword: false,
    mustChangePasswordOnFirstLogin: false,
  } as User;
};

const sanitizeClientPayrollObj = (m: any): any => {
  if (!m || typeof m !== 'object') return m;
  const {
    password: _p,
    tempPassword: _tp,
    passwordHash: _ph,
    password_hash: _ph2,
    mustChangePassword: _m1,
    mustChangePasswordOnFirstLogin: _m2,
    forcePasswordReset: _m3,
    firstLogin: _m4,
    ...rest
  } = m;
  return {
    ...rest,
    mustChangePasswordOnFirstLogin: false,
  };
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeClientUser);
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_USERS.map(sanitizeClientUser);
  });

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissionsMap>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
        }
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rolePermissions));
    } catch (e) { /* ignore */ }
  }, [rolePermissions]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    let activeUsersList = INITIAL_USERS.map(sanitizeClientUser);
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeUsersList = parsed.map(sanitizeClientUser);
        }
      } catch (e) { /* ignore */ }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = sanitizeClientUser(JSON.parse(saved));
        const matched = activeUsersList.find((u) => u.id === parsed.id);
        if (matched) {
          return sanitizeClientUser({ ...matched, ...parsed });
        }
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return activeUsersList[0] || sanitizeClientUser(INITIAL_USERS[0]);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('portal') === 'payroll') {
        const urlEmail = (urlParams.get('email') || '').trim().toLowerCase();
        const savedUserRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;
        const savedEmail = (savedUser?.email || '').trim().toLowerCase();
        // If opening a Payroll login link for a specific user or switching from CRM into Payroll login portal,
        // require authentication on the Separate Payroll Login Page unless already authenticated as that exact payroll user
        if (urlEmail && savedEmail !== urlEmail) {
          return false;
        }
        if (savedUser?.accessScope !== 'payroll_only') {
          return false;
        }
      }
    } catch (e) { /* ignore */ }

    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return true;
  });

  const [states, setStates] = useState<StateMasterItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_STATES;
  });

  const [products, setProducts] = useState<ProductMasterItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  const [taxRates, setTaxRates] = useState<TaxRateMasterItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TAX_RATES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_TAX_RATES;
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTermItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_TERMS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PAYMENT_TERMS;
  });

  const [contacts, setContacts] = useState<CustomerContact[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CONTACTS;
  });

  const [supplierCompany, setSupplierCompany] = useState<typeof SUPPLIER_COMPANY>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER_COMPANY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleanedName =
          parsed.name === 'Coreenact Solutions Pvt Ltd'
            ? SUPPLIER_COMPANY.name
            : parsed.name || SUPPLIER_COMPANY.name;
        const syncedBankName =
          parsed.bankDetails?.bankName || parsed.bankName || SUPPLIER_COMPANY.bankName;
        const syncedAccNo =
          parsed.bankDetails?.accountNumber ||
          parsed.accountNumber ||
          SUPPLIER_COMPANY.accountNumber;
        const syncedIfsc =
          parsed.bankDetails?.ifscCode || parsed.ifscCode || SUPPLIER_COMPANY.ifscCode;
        const syncedBranch =
          parsed.bankDetails?.branch || parsed.branch || SUPPLIER_COMPANY.branch;
        const syncedAccName =
          parsed.bankDetails?.accountName || cleanedName || SUPPLIER_COMPANY.bankDetails.accountName;
        return {
          ...SUPPLIER_COMPANY,
          ...parsed,
          name: cleanedName,
          logoUrl: parsed.logoUrl || '',
          bankName: syncedBankName,
          accountNumber: syncedAccNo,
          ifscCode: syncedIfsc,
          branch: syncedBranch,
          bankDetails: {
            bankName: syncedBankName,
            accountNumber: syncedAccNo,
            ifscCode: syncedIfsc,
            branch: syncedBranch,
            accountName: syncedAccName,
          },
          bankAccounts: Array.isArray(parsed.bankAccounts) ? parsed.bankAccounts : [],
        };
      } catch (e) {
        return SUPPLIER_COMPANY;
      }
    }
    return SUPPLIER_COMPANY;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_LEADS;
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_OPPORTUNITIES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CUSTOMERS;
  });

  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  const [amcContracts, setAmcContracts] = useState<AmcContract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AMC_CONTRACTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_AMC_CONTRACTS;
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SUPPORT_TICKETS;
  });

  const [changeRequests, setChangeRequests] = useState<SupportChangeRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHANGE_REQUESTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CHANGE_REQUESTS;
  });

  const [licenseTypes, setLicenseTypes] = useState<LicenseTypeMasterItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LICENSE_TYPES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_LICENSE_TYPES;
  });

  const [milestones, setMilestones] = useState<PaymentMilestone[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MILESTONES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState<PaymentReceipt[]>(() => {
    const primaryBank = (
      supplierCompany?.bankDetails?.bankName ||
      supplierCompany?.bankName ||
      SUPPLIER_COMPANY.bankName
    ).trim();
    const primaryAcc = (
      supplierCompany?.bankDetails?.accountNumber ||
      supplierCompany?.accountNumber ||
      SUPPLIER_COMPANY.accountNumber
    ).trim();
    const last4 = primaryAcc.length >= 4 ? primaryAcc.slice(-4) : primaryAcc;
    const companyBankLabel = last4 ? `${primaryBank} - ${last4}` : primaryBank;
    const legacyBankLabels = new Set([
      'HDFC Current A/c - 1734',
      'ICICI Current A/c - 8892',
      'Kotak Corporate A/c - 4410',
      'Bank of Baroda - 1745',
    ]);

    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (saved) {
      try {
        const parsed: PaymentReceipt[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p) =>
            p.bankCashAccount && legacyBankLabels.has(p.bankCashAccount)
              ? { ...p, bankCashAccount: companyBankLabel }
              : p
          );
        }
      } catch (e) {
        /* ignore */
      }
    }
    return INITIAL_PAYMENTS.map((p) =>
      p.bankCashAccount && legacyBankLabels.has(p.bankCashAccount)
        ? { ...p, bankCashAccount: companyBankLabel }
        : p
    );
  });

  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_LEDGER_ENTRIES;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ACTIVITIES;
  });

  const [outlookEmailConfig, setOutlookEmailConfig] = useState<OutlookEmailNotificationConfig>(() => {
    const defaultConfig: OutlookEmailNotificationConfig = {
      enabled: true,
      outlookEmail: currentUser?.email || SUPPLIER_COMPANY.email || 'shalv.sharma@coreenact.com',
      ccEmails: SUPPLIER_COMPANY.email || 'info@coreenact.com',
      senderDisplayName: 'Enact360 CRM Alerts',
      serverType: 'office365',
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      useStartTls: true,
      appDisplayName: 'Enact360',
      clientId: 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
      objectId: 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
      tenantId: 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
      supportedAccountTypes: 'My organization only',
      redirectUriConfig: '1 web, 0 spa, 0 public client',
      managedApplication: 'Enact360',
      appState: 'Activated',
      notifyOnLead: true,
      notifyOnOpportunity: true,
      notifyOnOrder: true,
      notifyOnInvoice: true,
      notifyOnPayment: true,
      notifyOnMilestone: true,
      notifyOnSupport: true,
      notifyOnActivity: true,
      notifyOnUser: true,
      autoIncludeAssignedOwner: true,
    };
    const saved = localStorage.getItem(STORAGE_KEYS.OUTLOOK_EMAIL_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: OutlookEmailNotificationConfig = {
          ...defaultConfig,
          ...parsed,
          appDisplayName: parsed.appDisplayName || defaultConfig.appDisplayName,
          clientId: parsed.clientId || defaultConfig.clientId,
          objectId: parsed.objectId || defaultConfig.objectId,
          tenantId: parsed.tenantId || defaultConfig.tenantId,
          supportedAccountTypes: parsed.supportedAccountTypes || defaultConfig.supportedAccountTypes,
          redirectUriConfig: parsed.redirectUriConfig || defaultConfig.redirectUriConfig,
          managedApplication: parsed.managedApplication || defaultConfig.managedApplication,
          appState: parsed.appState || defaultConfig.appState,
        };
        localStorage.setItem(STORAGE_KEYS.OUTLOOK_EMAIL_CONFIG, JSON.stringify(merged));
        return merged;
      } catch (e) {
        /* ignore */
      }
    }
    try {
      localStorage.setItem(STORAGE_KEYS.OUTLOOK_EMAIL_CONFIG, JSON.stringify(defaultConfig));
    } catch (e) {
      /* ignore */
    }
    return defaultConfig;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const defaultRecipient =
      currentUser?.email || SUPPLIER_COMPANY.email || 'shalv.sharma@coreenact.com';
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        const parsed: NotificationItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((n) => ({
            ...n,
            emailStatus: n.emailStatus || 'Sent via Outlook',
            emailRecipient: n.emailRecipient || defaultRecipient,
          }));
        }
      } catch (e) {
        /* ignore */
      }
    }
    return INITIAL_NOTIFICATIONS.map((n) => ({
      ...n,
      emailStatus: 'Sent via Outlook' as const,
      emailRecipient: defaultRecipient,
    }));
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Cross-tab BroadcastChannel, localStorage event, and remote server state synchronization
  const currentSnapshot: Snapshot = React.useMemo(() => ({
    rolePermissions,
    users,
    states,
    products,
    taxRates,
    paymentTerms,
    contacts,
    supplierCompany,
    leads,
    opportunities,
    customers,
    orders,
    purchaseOrders,
    amcContracts,
    supportTickets,
    changeRequests,
    licenseTypes,
    milestones,
    invoices,
    payments,
    ledgerEntries,
    activities,
    notifications,
    outlookEmailConfig,
    auditLogs,
  }), [
    rolePermissions,
    users,
    states,
    products,
    taxRates,
    paymentTerms,
    contacts,
    supplierCompany,
    leads,
    opportunities,
    customers,
    orders,
    purchaseOrders,
    amcContracts,
    supportTickets,
    changeRequests,
    licenseTypes,
    milestones,
    invoices,
    payments,
    ledgerEntries,
    activities,
    notifications,
    outlookEmailConfig,
    auditLogs,
  ]);

  const deletedUserIdsRef = React.useRef<Set<string>>(new Set());

  const mergeUserRecords = React.useCallback((localUsers: User[], incomingUsers: any[]): User[] => {
    const mergedById = new Map<string, User>();
    const idByEmail = new Map<string, string>();
    for (const u of localUsers || []) {
      if (!u || !u.id || deletedUserIdsRef.current.has(String(u.id))) continue;
      const uid = String(u.id);
      const cleanU = sanitizeClientUser(u);
      mergedById.set(uid, cleanU);
      if (cleanU.email) idByEmail.set(cleanU.email.trim().toLowerCase(), uid);
    }
    for (const raw of incomingUsers || []) {
      if (!raw || !raw.id || deletedUserIdsRef.current.has(String(raw.id))) continue;
      const rawId = String(raw.id);
      const emailLower = raw.email ? String(raw.email).trim().toLowerCase() : '';
      const resolvedId = mergedById.has(rawId)
        ? rawId
        : (emailLower && idByEmail.get(emailLower)) || rawId;
      const prev = mergedById.get(resolvedId);
      const merged: User = sanitizeClientUser(
        prev
          ? {
              ...prev,
              ...raw,
              id: resolvedId,
              customPermissions:
                raw.customPermissions || raw.custom_permissions || prev.customPermissions,
            }
          : {
              ...raw,
              id: resolvedId,
              customPermissions: raw.customPermissions || raw.custom_permissions,
            }
      );
      mergedById.set(resolvedId, merged);
      if (emailLower) idByEmail.set(emailLower, resolvedId);
    }
    return Array.from(mergedById.values());
  }, []);

  const applySnapshot = React.useCallback((s: Snapshot) => {
    if (!s) return;
    if (s.rolePermissions) setRolePermissions(s.rolePermissions);
    if (s.users) {
      setUsers((prev) => {
        const next = s.users.map(sanitizeClientUser);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
    if (s.states) setStates(s.states);
    if (s.products) setProducts(s.products);
    if (s.taxRates) setTaxRates(s.taxRates);
    if (s.paymentTerms) setPaymentTerms(s.paymentTerms);
    if (s.contacts) setContacts(s.contacts);
    if (s.supplierCompany) setSupplierCompany(s.supplierCompany);
    if (s.leads) setLeads(s.leads);
    if (s.opportunities) setOpportunities(s.opportunities);
    if (s.customers) setCustomers(s.customers);
    if (s.orders) setOrders(s.orders);
    if (s.purchaseOrders) setPurchaseOrders(s.purchaseOrders);
    if (s.amcContracts) setAmcContracts(s.amcContracts);
    if (s.supportTickets) setSupportTickets(s.supportTickets);
    if (s.changeRequests) setChangeRequests(s.changeRequests);
    if (s.licenseTypes) setLicenseTypes(s.licenseTypes);
    if (s.milestones) setMilestones(s.milestones);
    if (s.invoices) setInvoices(s.invoices);
    if (s.payments) setPayments(s.payments);
    if (s.ledgerEntries) setLedgerEntries(s.ledgerEntries);
    if (s.activities) setActivities(s.activities);
    if (s.notifications) setNotifications(s.notifications);
    if (s.outlookEmailConfig) setOutlookEmailConfig(s.outlookEmailConfig);
    if (s.auditLogs) setAuditLogs(s.auditLogs);
  }, [mergeUserRecords]);

  const {
    ready: syncReady,
    status: syncStatus,
    retry: retrySync,
    reloadSaved: reloadSavedSync,
  } = useApplicationSync(currentSnapshot, applySnapshot, isAuthenticated);

  const hasRemoteConflict = syncStatus.state === 'conflict';
  const conflictMessage = syncStatus.state === 'conflict' ? syncStatus.message : undefined;
  const acceptRemoteConflict = () => { void reloadSavedSync(); };
  const dismissConflict = () => { retrySync(); };
  const lastSyncedAt = syncStatus.state === 'saved' ? new Date().toISOString() : null;


  // Sync state to localStorage & Backend
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sanitizeClientUser(currentUser)));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    const cleanUsers = users.map(sanitizeClientUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanUsers));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(states));
  }, [states]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAX_RATES, JSON.stringify(taxRates));
  }, [taxRates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_TERMS, JSON.stringify(paymentTerms));
  }, [paymentTerms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLIER_COMPANY, JSON.stringify(supplierCompany));
      } catch (e) {
      console.warn('Could not persist supplierCompany to localStorage:', e);
    }
  }, [supplierCompany]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AMC_CONTRACTS, JSON.stringify(amcContracts));
  }, [amcContracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(supportTickets));
  }, [supportTickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHANGE_REQUESTS, JSON.stringify(changeRequests));
  }, [changeRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LICENSE_TYPES, JSON.stringify(licenseTypes));
  }, [licenseTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OUTLOOK_EMAIL_CONFIG, JSON.stringify(outlookEmailConfig));
      } catch (e) {
      /* ignore */
    }
  }, [outlookEmailConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Refresh payroll caches from the same authoritative database after sign-in.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const token = localStorage.getItem('crm_auth_token');
    void fetch('/api/sync/pull', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined).then(async res => {
      if (!res.ok) throw new Error('Payroll data could not load');
      return res.json();
    }).then(({data}) => {
      if (cancelled || !data) return;
      const entries: Array<[string, any]> = [
        ['crm_ess_admin_employee_masters', data.payrollMasters || {}],
        ['crm_ess_employee_loans', data.payrollLoans || []],
        ['crm_ess_admin_policy_master', data.payrollPolicy],
        ['crm_payroll_org_masters', data.payrollOrgMasters],
        ['crm_payroll_integration_config', data.payrollIntegrationConfig],
        ['crm_payroll_deleted_master_ids', data.deletedPayrollMasterIds || []],
      ];
      for (const [key,value] of entries) {
        if (value == null) localStorage.removeItem(key);
        else localStorage.setItem(key,JSON.stringify(value));
      }
      for (const [slice,suffix] of [['payrollAttendance','attendance'],['payrollLeaves','leaves'],['payrollClaims','claims'],['payrollStatutory','statutory']]) {
        const existing=Object.keys(localStorage).filter(k=>k.startsWith('crm_ess_') && k.endsWith('_'+suffix));
        for(const key of existing) localStorage.removeItem(key);
        for(const [id,value] of Object.entries(data[slice] || {})) localStorage.setItem(`crm_ess_${id}_${suffix}`,JSON.stringify(value));
      }
      window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
      window.dispatchEvent(new CustomEvent('crm-payroll-loans-updated'));
    }).catch(() => {});
    return () => {cancelled=true;};
  }, [isAuthenticated]);

  useEffect(() => {
    const token = localStorage.getItem('crm_auth_token');
    const loggedOut = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'false';
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (loggedOut) headers['X-CRM-Logged-Out'] = 'true';
    void fetch('/api/auth/session', Object.keys(headers).length ? { headers } : undefined).then(async response => {
      if (!response.ok) {setIsAuthenticated(false); return;}
      const data = await response.json();
      if (data.user) {setCurrentUser(sanitizeClientUser(data.user)); setIsAuthenticated(true);}
    }).catch(() => setIsAuthenticated(false));
  }, []);

  // Authentication & User Login Profile Methods
  const login = (
    identifier: string,
    password?: string,
    options?: { portalMode?: 'payroll' | 'crm'; requiredEmail?: string }
  ): {
    success: boolean;
    message?: string;
    user?: User;
    mustChangePassword?: boolean;
    payrollMaster?: any;
  } => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPassword = password !== undefined ? password.trim() : undefined;

    // Combine current React users state with latest localStorage users so synchronous login calls never see stale state
    const allKnownUsers: User[] = [...users];
    for (const initU of INITIAL_USERS) {
      if (!allKnownUsers.some((u) => u.id === initU.id || (u.email && initU.email && u.email.trim().toLowerCase() === initU.email.trim().toLowerCase()))) {
        allKnownUsers.push(initU);
      }
    }
    try {
      const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsersRaw) {
        const parsedUsers = JSON.parse(savedUsersRaw);
        if (Array.isArray(parsedUsers)) {
          for (const su of parsedUsers) {
            if (!su || !su.id) continue;
            const idx = allKnownUsers.findIndex((u) => u.id === su.id);
            if (idx >= 0) {
              allKnownUsers[idx] = { ...allKnownUsers[idx], ...su };
            } else {
              allKnownUsers.push(su);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // Check in employeeSalaryMasters (localStorage + default synthesized masters) and CRM users using strict priority order:
    // 1. Exact email or exact employee code
    // 2. Exact user ID
    // 3. Exact username
    // 4. Weak match (email prefix or full name) ONLY if it uniquely identifies one person
    let matchedPayrollMaster: any = null;
    let allPayrollMastersList: any[] = [];
    try {
      const savedMasters = localStorage.getItem('crm_ess_admin_employee_masters');
      if (savedMasters) {
        const mastersObj = JSON.parse(savedMasters);
        if (mastersObj && typeof mastersObj === 'object') {
          allPayrollMastersList = Object.values(mastersObj).filter(Boolean);
        }
      }
      // Also include default employee codes (EMP-001..EMP-007) for any known user not yet in savedMasters
      allKnownUsers.forEach((u, idx) => {
        const alreadyHasMaster = allPayrollMastersList.some(
          (m: any) =>
            m.userId === u.id ||
            (u.email && m.email && m.email.trim().toLowerCase() === u.email.trim().toLowerCase())
        );
        if (!alreadyHasMaster) {
          allPayrollMastersList.push({
            userId: u.id,
            empCode: (u as any).empCode || `EMP-${String(idx + 1).padStart(3, '0')}`,
            name: u.name,
            email: u.email,
            password: u.password || u.tempPassword || 'password123',
            tempPassword: u.tempPassword || u.password || 'password123',
            role: u.role,
            department: u.department,
            designation: u.designation || u.role,
            status: u.status || 'Active',
            location: u.location || 'New Delhi',
            accessType: u.accessType || 'crm_and_payroll',
            enrolledInPayroll: true,
          });
        }
      });
    } catch {
      // ignore
    }

    const normalizeCodeInput = (val: string) => {
      const m = val.trim().match(/^emp[-_\s]*(\d+)$/i);
      return m ? `emp-${m[1].padStart(3, '0')}` : val.trim().toLowerCase();
    };
    const normalizedInputCode = normalizeCodeInput(cleanId);

    // Priority 1: Exact email or exact employee code (ambiguity-safe: if multiple
    // legacy records share an identity key, prefer the one linked to a real user ID)
    const masterMatches = allPayrollMastersList.filter((m: any) => {
      const mEmail = (m.email || '').trim().toLowerCase();
      const mCode = (m.empCode || '').trim().toLowerCase();
      const mCodeNorm = mCode ? normalizeCodeInput(mCode) : '';
      return (
        (mEmail && mEmail === cleanId) ||
        (mCode && (mCode === cleanId || mCodeNorm === normalizedInputCode))
      );
    });
    if (masterMatches.length > 1) {
      matchedPayrollMaster =
        masterMatches.find((m: any) => allKnownUsers.some((u) => u.id === m.userId)) || null;
    } else {
      matchedPayrollMaster = masterMatches[0] || null;
    }

    let matchedUser: User | undefined = allKnownUsers.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      return Boolean(uEmail && uEmail === cleanId);
    });

    // Priority 2: Exact ID / userId
    if (!matchedPayrollMaster && !matchedUser) {
      matchedPayrollMaster =
        allPayrollMastersList.find(
          (m: any) => (m.userId || '').trim().toLowerCase() === cleanId
        ) || null;
      matchedUser = allKnownUsers.find(
        (u) => (u.id || '').trim().toLowerCase() === cleanId
      );
    }

    // Priority 3: Exact CRM username
    if (!matchedPayrollMaster && !matchedUser) {
      matchedUser = allKnownUsers.find(
        (u) => (u.username || '').trim().toLowerCase() === cleanId
      );
    }

    // Priority 4: Weak match (email prefix or full name) ONLY if unambiguous across all records
    if (!matchedPayrollMaster && !matchedUser && cleanId) {
      const weakMasters = allPayrollMastersList.filter((m: any) => {
        const mEmail = (m.email || '').trim().toLowerCase();
        const mPrefix = mEmail ? mEmail.split('@')[0] : '';
        const mName = (m.name || '').trim().toLowerCase();
        return (mPrefix && mPrefix === cleanId) || (mName && mName === cleanId);
      });
      const weakUsers = allKnownUsers.filter((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uPrefix = uEmail ? uEmail.split('@')[0] : '';
        const uName = (u.name || '').trim().toLowerCase();
        return (uPrefix && uPrefix === cleanId) || (uName && uName === cleanId);
      });

      const distinctIdentityKeys = new Set<string>();
      for (const m of weakMasters) {
        const linkedU = allKnownUsers.find(
          (u) =>
            u.id === m.userId ||
            (m.email && u.email && u.email.trim().toLowerCase() === m.email.trim().toLowerCase())
        );
        distinctIdentityKeys.add(linkedU ? `id:${linkedU.id}` : `m:${m.userId || m.email}`);
      }
      for (const u of weakUsers) {
        distinctIdentityKeys.add(`id:${u.id}`);
      }

      if (distinctIdentityKeys.size === 1) {
        if (weakMasters.length === 1) matchedPayrollMaster = weakMasters[0];
        if (weakUsers.length === 1) matchedUser = weakUsers[0];
      }
    }

    // Strictly link counterpart by ID first, then exact email
    if (matchedPayrollMaster && !matchedUser) {
      const mId = matchedPayrollMaster.userId;
      const mEmail = (matchedPayrollMaster.email || '').trim().toLowerCase();
      matchedUser =
        allKnownUsers.find((u) => u.id === mId) ||
        (mEmail
          ? allKnownUsers.find((u) => (u.email || '').trim().toLowerCase() === mEmail)
          : undefined);
    } else if (matchedUser && !matchedPayrollMaster && allPayrollMastersList.length > 0) {
      const targetUser = matchedUser;
      const uEmail = (targetUser.email || '').trim().toLowerCase();
      matchedPayrollMaster =
        allPayrollMastersList.find((m: any) => m.userId === targetUser.id) ||
        (uEmail
          ? allPayrollMastersList.find(
              (m: any) => (m.email || '').trim().toLowerCase() === uEmail
            )
          : null) ||
        null;
    }

    const isPayrollPortalLogin =
      options?.portalMode === 'payroll' ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('portal') === 'payroll');

    if (!matchedUser && !matchedPayrollMaster) {
      if (['shalv.sharma@coreenact.com', 'shalvpersonal@gmail.com', 'admin@coreenact.com', 'shalv', 'admin'].includes(cleanId)) {
        matchedUser = allKnownUsers.find((u) => u.id === 'usr-1');
      }
    }

    if (!matchedUser && !matchedPayrollMaster) {
      return {
        success: false,
        message: 'No user account found with that email, employee code, or username.',
      };
    }

    // Case 1: Payroll-only user (only exists in Payroll Master)
    if (!matchedUser && matchedPayrollMaster) {
      if (
        matchedPayrollMaster.status === 'Inactive' ||
        matchedPayrollMaster.employmentStatus === 'Inactive'
      ) {
        return {
          success: false,
          message: 'This payroll account is currently inactive. Contact Administrator.',
        };
      }

      const isAdminRole =
        matchedPayrollMaster.role === 'Super Admin' ||
        matchedPayrollMaster.role === 'Administrator';
      const resolvedScope: 'all' | 'payroll_only' =
        !isAdminRole && isPayrollPortalLogin ? 'payroll_only' : 'all';

      const payrollUser: User = sanitizeClientUser({
        id: matchedPayrollMaster.userId || `usr-${Date.now()}`,
        name: matchedPayrollMaster.name || 'Payroll Employee',
        username:
          matchedPayrollMaster.username ||
          (matchedPayrollMaster.email
            ? matchedPayrollMaster.email.split('@')[0]
            : 'employee'),
        email: matchedPayrollMaster.email,
        phone: matchedPayrollMaster.phone || '',
        designation: matchedPayrollMaster.designation || 'Employee',
        role: matchedPayrollMaster.role || 'Sales Executive',
        department: matchedPayrollMaster.department || 'Operations',
        status: matchedPayrollMaster.status || 'Active',
        location: matchedPayrollMaster.location || 'Mumbai HQ',
        accessScope: resolvedScope,
        accessType: matchedPayrollMaster.accessType || 'payroll_only',
        mustChangePasswordOnFirstLogin: false,
      });

      const nowFormatted = new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const updated = sanitizeClientUser({ ...payrollUser, lastLoginAt: nowFormatted });
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === updated.id);
        const next = exists
          ? prev.map((u) => (u.id === updated.id ? sanitizeClientUser({ ...u, ...updated }) : u))
          : [...prev, updated];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setCurrentUser(updated);
      setIsAuthenticated(true);
      return { success: true, user: updated, mustChangePassword: false };
    }

    // Case 2: User exists in CRM users (may also be in payroll master)
    if (matchedUser) {
      if (
        matchedUser.status === 'Inactive' ||
        matchedPayrollMaster?.status === 'Inactive' ||
        matchedPayrollMaster?.employmentStatus === 'Inactive'
      ) {
        return {
          success: false,
          message: 'This user account is currently inactive. Contact Super Admin.',
        };
      }

      const isAdminUser =
        matchedUser.role === 'Super Admin' ||
        matchedUser.role === 'Administrator' ||
        matchedUser.id === 'usr-1' ||
        ['admin', 'admin@coreenact.com', 'shalv', 'shalv.sharma@coreenact.com', 'shalvpersonal@gmail.com'].includes(cleanId);

      // Route to dedicated Payroll Portal ONLY when explicitly signing in via the Payroll & ESS login view;
      // signing in via the main CRM Enterprise Login grants full access to the CRM application according to role/custom permissions.
      const isPayrollOnly = isAdminUser ? false : Boolean(isPayrollPortalLogin);

      const nowFormatted = new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedUser: User = sanitizeClientUser({
        ...matchedUser,
        accessScope: isPayrollOnly ? 'payroll_only' : 'all',
        lastLoginAt: nowFormatted,
      });
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === matchedUser.id);
        const next = exists
          ? prev.map((u) =>
              u.id === matchedUser.id
                ? sanitizeClientUser({ ...updatedUser, accessScope: updatedUser.accessScope })
                : u
            )
          : [...prev, sanitizeClientUser({ ...updatedUser, accessScope: updatedUser.accessScope })];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);

      return { success: true, user: updatedUser, mustChangePassword: false };
    }

    return { success: false, message: 'Authentication error.' };
  };

  const changeEmployeePassword = (emailOrUserId: string, newPassword: string): boolean => {
    const clean = (emailOrUserId || '').trim().toLowerCase();
    const trimmedNewPass = newPassword.trim();
    const matchedEmails = new Set<string>();
    const matchedUserIds = new Set<string>();
    if (clean) {
      matchedEmails.add(clean);
      matchedUserIds.add(clean);
    }

    // 1. Update employeeSalaryMasters on server & keep sanitized records in localStorage
    try {
      const savedMasters = localStorage.getItem('crm_ess_admin_employee_masters');
      if (savedMasters) {
        const mastersObj = JSON.parse(savedMasters);
        const serverPatch: Record<string, any> = {};
        let updated = false;
        Object.keys(mastersObj).forEach((k) => {
          const m = mastersObj[k];
          if (!m) return;
          const mEmail = (m.email || '').trim().toLowerCase();
          const mEmailPrefix = mEmail ? mEmail.split('@')[0] : '';
          const mCode = (m.empCode || '').trim().toLowerCase();
          const mUserId = (m.userId || '').trim().toLowerCase();
          const mName = (m.name || '').trim().toLowerCase();
          if (
            k.toLowerCase() === clean ||
            mUserId === clean ||
            mEmail === clean ||
            mEmailPrefix === clean ||
            mCode === clean ||
            mName === clean
          ) {
            if (mEmail) matchedEmails.add(mEmail);
            if (mUserId) matchedUserIds.add(mUserId);
            serverPatch[k] = {
              ...m,
              password: trimmedNewPass,
              mustChangePasswordOnFirstLogin: false,
            };
            mastersObj[k] = sanitizeClientPayrollObj(m);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem('crm_ess_admin_employee_masters', JSON.stringify(mastersObj));
          fetch('/api/payroll/masters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ masters: serverPatch, patch: true }),
          }).catch(() => {});
          window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
        }
      }
    } catch {
      // ignore
    }

    // 2. Send password update to backend /api/users/:id while keeping local state sanitized
    const updateUsersArray = (list: User[], sendToBackend = false): User[] =>
      list.map((u) => {
        const uId = (u.id || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uEmailPrefix = uEmail ? uEmail.split('@')[0] : '';
        const uUsername = (u.username || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        if (
          matchedUserIds.has(uId) ||
          matchedEmails.has(uEmail) ||
          uUsername === clean ||
          uEmailPrefix === clean ||
          uName === clean
        ) {
          if (sendToBackend) {
            fetch(`/api/users/${u.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...sanitizeClientUser(u),
                password: trimmedNewPass,
              }),
            }).catch(() => {});
          }
          return sanitizeClientUser(u);
        }
        return sanitizeClientUser(u);
      });

    try {
      const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsersRaw) {
        const parsed = JSON.parse(savedUsersRaw);
        if (Array.isArray(parsed)) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updateUsersArray(parsed, false)));
        }
      }
    } catch {
      // ignore
    }

    setUsers((prev) => {
      const next = updateUsersArray(prev, true);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Update currentUser if matching
    const currId = (currentUser.id || '').trim().toLowerCase();
    const currEmail = (currentUser.email || '').trim().toLowerCase();
    if (matchedUserIds.has(currId) || matchedEmails.has(currEmail)) {
      setCurrentUser((prev) => sanitizeClientUser(prev));
    }

    return true;
  };

  const syncCredentialsFromServer = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`The application backend returned HTTP ${response.status}. Check Vercel Runtime Logs for /api/auth/verify.`);
      }
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.authenticated) throw new Error(data.message || `Sign-in API returned HTTP ${response.status}.`);
      if (data.token) {
        try { localStorage.setItem('crm_auth_token', String(data.token)); } catch { /* ignore */ }
      }

      const serverUser = data.user;
      const serverMaster = data.payrollMaster;

      const effectiveUser =
        serverUser ||
        (serverMaster
          ? {
              id: serverMaster.userId,
              name: serverMaster.name || 'Employee',
              username:
                serverMaster.username ||
                (serverMaster.email
                  ? String(serverMaster.email).split('@')[0]
                  : serverMaster.empCode || 'employee'),
              email: serverMaster.email || '',
              mustChangePasswordOnFirstLogin: false,
              accessScope: serverMaster.accessType === 'payroll_only' ? 'payroll_only' : 'all',
              accessType: serverMaster.accessType || 'payroll_only',
              phone: serverMaster.phone || '',
              role: serverMaster.role || 'Sales Executive',
              department: serverMaster.department || 'Operations',
              designation: serverMaster.designation || serverMaster.role || 'Employee',
              status: serverMaster.status || 'Active',
              location: serverMaster.location || 'Mumbai HQ',
            }
          : null);

      if (effectiveUser?.id) {
        let current: User[] = users;
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.USERS);
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed) && parsed.length > 0) current = parsed.map(sanitizeClientUser);
        } catch {
          // ignore
        }
        const cleanEmail = (effectiveUser.email || '').trim().toLowerCase();
        const existsIdx = current.findIndex(
          (u) =>
            u.id === effectiveUser.id ||
            (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail)
        );
        const next: User[] =
          existsIdx >= 0
            ? current.map((u, i) =>
                i === existsIdx
                  ? sanitizeClientUser({
                      ...u,
                      ...effectiveUser,
                      id: u.id,
                      customPermissions:
                        effectiveUser.customPermissions ||
                        effectiveUser.custom_permissions ||
                        u.customPermissions,
                    })
                  : sanitizeClientUser(u)
              )
            : [
                ...current.map(sanitizeClientUser),
                sanitizeClientUser({
                  ...effectiveUser,
                  customPermissions:
                    effectiveUser.customPermissions || effectiveUser.custom_permissions,
                }),
              ];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
        } catch {
          // ignore
        }
        setUsers(next);
      }

      if (serverMaster?.userId) {
        try {
          const raw = localStorage.getItem('crm_ess_admin_employee_masters');
          const masters: Record<string, any> = raw ? JSON.parse(raw) : {};
          masters[serverMaster.userId] = sanitizeClientPayrollObj(
            masters[serverMaster.userId]
              ? { ...masters[serverMaster.userId], ...serverMaster }
              : serverMaster
          );
          localStorage.setItem('crm_ess_admin_employee_masters', JSON.stringify(masters));
        } catch {
          // ignore
        }
      }
      return true;
    } catch (error) {
      if (error instanceof TypeError) throw new Error('The login server could not be reached. Check your connection and Vercel deployment.');
      throw error;
    }
  };

  const loginAsUser = (userId: string) => {
    if (currentUser.role !== 'Super Admin') return;
    const found = users.find((u) => u.id === userId);
    if (!found) return;
    const nowFormatted = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const updatedUser: User = { ...found, lastLoginAt: nowFormatted };
    setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    try { localStorage.removeItem('crm_auth_token'); } catch { /* ignore */ }
    void fetch('/api/auth/logout', {method:'POST'});
    setIsAuthenticated(false);
  };

  const updateCurrentUserProfile = (data: Partial<User>) => {
    setCurrentUser((prev) => {
      const safeData =
        prev.role === 'Super Admin'
          ? data
          : { ...data, role: prev.role };
      const nextName = safeData.name || prev.name;
      const initials = nextName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const nextAvatar =
        safeData.avatar !== undefined
          ? safeData.avatar || initials
          : prev.avatar && (prev.avatar.startsWith('data:image') || prev.avatar.startsWith('http') || prev.avatar.startsWith('/'))
          ? prev.avatar
          : initials;

      const updated: User = {
        ...prev,
        ...safeData,
        avatar: nextAvatar,
      };
      setUsers((uList) => {
        const nextList = uList.map((u) => (u.id === prev.id ? updated : u));
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextList));
        } catch (e) { /* ignore */ }
        return nextList;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      } catch (e) { /* ignore */ }

      fetch(`/api/users/${prev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});

      return updated;
    });
  };

  // Users Master CRUD
  const addUser = (userData: Omit<User, 'id'> & { id?: string }): User => {
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const cleanEmail = (userData.email || '').trim().toLowerCase();
    let existingUser = users.find(
      (u) =>
        (userData.id && u.id === userData.id) ||
        (cleanEmail && u.email?.trim().toLowerCase() === cleanEmail)
    );
    if (!existingUser) {
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedRaw) {
          const parsed: User[] = JSON.parse(savedRaw);
          if (Array.isArray(parsed)) {
            existingUser = parsed.find(
              (u) =>
                (userData.id && u.id === userData.id) ||
                (cleanEmail && u.email?.trim().toLowerCase() === cleanEmail)
            );
          }
        }
      } catch {
        // ignore
      }
    }

    const resolvedId =
      existingUser?.id ||
      userData.id ||
      `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    deletedUserIdsRef.current.delete(resolvedId);
    const resolvedPass =
      userData.password?.trim() ||
      userData.tempPassword?.trim() ||
      undefined;
    const rawScope = String(userData.accessScope || existingUser?.accessScope || 'all');
    const normalizedScope: 'all' | 'payroll_only' =
      rawScope.toLowerCase() === 'payroll_only' ? 'payroll_only' : 'all';
    const baseUser: User = {
      ...existingUser,
      ...userData,
      id: resolvedId,
      username:
        userData.username?.trim() ||
        existingUser?.username ||
        (userData.email ? userData.email.trim().split('@')[0] : 'user'),
      email: userData.email?.trim() || existingUser?.email || '',
      avatar: userData.avatar || existingUser?.avatar || initials,
      status: userData.status || existingUser?.status || 'Active',
      accessScope: normalizedScope,
    };
    const newUser = sanitizeClientUser(baseUser);
    setUsers((prev) => {
      const existingIdx = prev.findIndex(
        (u) =>
          u.id === resolvedId ||
          (cleanEmail && u.email?.trim().toLowerCase() === cleanEmail)
      );
      const nextUsers =
        existingIdx >= 0
          ? prev.map((u, i) => (i === existingIdx ? sanitizeClientUser({ ...u, ...newUser, id: resolvedId }) : u))
          : [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
      } catch (e) { /* ignore */ }
      return nextUsers;
    });

    // Commit to backend with password if provided so backend stores secure hash
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newUser,
        ...(resolvedPass ? { password: resolvedPass } : {}),
      }),
    }).catch(() => {});

    addAuditLog({
      entityType: 'User',
      entityId: newUser.id,
      entityNumber: newUser.name,
      action: 'Created',
      description: `New user account created: "${newUser.name}" (${newUser.email}, ${newUser.role}) in ${newUser.department}`,
    });

    addNotification({
      title: 'New User Registered',
      message: `${newUser.name} created as ${newUser.role} in ${newUser.department} department.`,
      type: 'USER',
      linkType: 'user',
      linkId: newUser.id,
    });

    return newUser;
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    let targetUserName = '';
    let targetEmail = userData.email?.trim() || '';
    const nextPass = userData.password?.trim() || userData.tempPassword?.trim();
    const rawScope = userData.accessScope ? String(userData.accessScope) : undefined;
    const normalizedPatch: Partial<User> = {
      ...userData,
      ...(rawScope
        ? { accessScope: rawScope.toLowerCase() === 'payroll_only' ? 'payroll_only' : 'all' }
        : {}),
    };
    delete (normalizedPatch as Record<string, unknown>).password;
    delete (normalizedPatch as Record<string, unknown>).tempPassword;
    delete (normalizedPatch as Record<string, unknown>).mustChangePassword;
    delete (normalizedPatch as Record<string, unknown>).mustChangePasswordOnFirstLogin;

    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id !== id) return u;
        const nextName = normalizedPatch.name || u.name;
        targetUserName = nextName;
        if (!targetEmail && u.email) targetEmail = u.email;
        const initials = nextName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const nextAvatar =
          normalizedPatch.avatar !== undefined
            ? normalizedPatch.avatar || initials
            : u.avatar && (u.avatar.startsWith('data:image') || u.avatar.startsWith('http') || u.avatar.startsWith('/'))
            ? u.avatar
            : u.avatar || initials;
        const updated = sanitizeClientUser({ ...u, ...normalizedPatch, avatar: nextAvatar });
        if (currentUser.id === id) {
          setCurrentUser(updated);
          try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
          } catch (e) { /* ignore */ }
        }
        return updated;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
      } catch (e) { /* ignore */ }
      return nextUsers;
    });

    // Keep linked Payroll Master credentials & profile in sync when user is updated in CRM Masters
    try {
      const rawMasters = localStorage.getItem('crm_ess_admin_employee_masters');
      if (rawMasters) {
        const parsedMasters = JSON.parse(rawMasters);
        if (parsedMasters && typeof parsedMasters === 'object') {
          let changed = false;
          const serverMastersPatch: Record<string, any> = {};
          const cleanTargetEmail = targetEmail.toLowerCase();
          for (const [k, m] of Object.entries(parsedMasters) as Array<[string, any]>) {
            if (
              m &&
              (k === id ||
                m.userId === id ||
                (cleanTargetEmail &&
                  m.email &&
                  String(m.email).trim().toLowerCase() === cleanTargetEmail))
            ) {
              const updatedMaster = sanitizeClientPayrollObj({
                ...m,
                ...(normalizedPatch.name ? { name: normalizedPatch.name } : {}),
                ...(normalizedPatch.username ? { username: normalizedPatch.username } : {}),
                ...(normalizedPatch.email ? { email: normalizedPatch.email } : {}),
                ...(normalizedPatch.role ? { role: normalizedPatch.role } : {}),
                ...(normalizedPatch.department ? { department: normalizedPatch.department } : {}),
                ...(normalizedPatch.designation ? { designation: normalizedPatch.designation } : {}),
                ...(normalizedPatch.status ? { status: normalizedPatch.status } : {}),
              });
              parsedMasters[k] = updatedMaster;
              serverMastersPatch[k] = {
                ...updatedMaster,
                ...(nextPass ? { password: nextPass } : {}),
              };
              changed = true;
            }
          }
          if (changed) {
            localStorage.setItem('crm_ess_admin_employee_masters', JSON.stringify(parsedMasters));
            fetch('/api/payroll/masters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ masters: serverMastersPatch, patch: true }),
            }).catch(() => {});
            window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
          }
        }
      }
    } catch {
      // ignore
    }

    // Commit update to backend (including password if admin explicitly reset it)
    fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...normalizedPatch,
        ...(nextPass ? { password: nextPass } : {}),
      }),
    }).catch(() => {});

    addAuditLog({
      entityType: 'User',
      entityId: id,
      entityNumber: targetUserName || id,
      action: 'Updated',
      description: `User profile "${targetUserName || id}" updated by ${currentUser.name}`,
    });
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    const target = users.find((u) => u.id === id);
    if (!target) return;
    deletedUserIdsRef.current.add(id);

    setUsers((prev) => {
      const remaining = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remaining));
      } catch (e) { /* ignore */ }

      // If active current user is the one deleted, switch session immediately to first remaining user
      if (currentUser.id === id && remaining.length > 0) {
        setCurrentUser(remaining[0]);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(remaining[0]));
        } catch (e) { /* ignore */ }
      }

      return remaining;
    });

    // Deactivate payroll login for the deleted CRM user while preserving their historical payroll record
    try {
      const rawMasters = localStorage.getItem('crm_ess_admin_employee_masters');
      if (rawMasters) {
        const parsedMasters = JSON.parse(rawMasters);
        if (parsedMasters && typeof parsedMasters === 'object') {
          let changed = false;
          const cleanTargetEmail = (target.email || '').trim().toLowerCase();
          for (const [k, m] of Object.entries(parsedMasters) as Array<[string, any]>) {
            if (
              m &&
              (k === id ||
                m.userId === id ||
                (cleanTargetEmail && m.email && String(m.email).trim().toLowerCase() === cleanTargetEmail))
            ) {
              parsedMasters[k] = {
                ...m,
                status: 'Inactive',
                syncedWithCrm: false,
              };
              changed = true;
            }
          }
          if (changed) {
            localStorage.setItem('crm_ess_admin_employee_masters', JSON.stringify(parsedMasters));
            window.dispatchEvent(new CustomEvent('crm-payroll-masters-updated'));
          }
        }
      }
    } catch {
      // ignore
    }

    // Delete from Render PostgreSQL backend
    fetch(`/api/users/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    addAuditLog({
      entityType: 'User',
      entityId: id,
      entityNumber: target.name,
      action: 'Deleted',
      description: `User account "${target.name}" (${target.email}, ${target.role}) deleted by ${currentUser.name}`,
    });

    addNotification({
      title: 'User Account Deleted',
      message: `User "${target.name}" (${target.role}) has been removed from User Master.`,
      type: 'USER',
      linkType: 'masters',
    });
  };

  const resetUserPassword = (
    identifier: string,
    newPassword: string
  ): { success: boolean; message: string; user?: User } => {
    const cleanId = identifier.trim().toLowerCase();
    const targetUser = users.find(
      (u) =>
        u.id.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId) ||
        u.name.toLowerCase() === cleanId
    );

    if (!targetUser) {
      return {
        success: false,
        message: 'No registered user found in the application User Master with this email or username.',
      };
    }

    if (targetUser.status === 'Inactive') {
      return {
        success: false,
        message: 'This user account is currently marked Inactive in the User Master. Please contact your administrator.',
      };
    }

    updateUser(targetUser.id, { password: newPassword });
    return {
      success: true,
      message: `Password successfully updated for ${targetUser.name}.`,
      user: targetUser,
    };
  };

  // Permission checks & RBAC helpers (User-Wise Permissions Primary Engine)
  const hasPermission = (module: CrmModuleKey, action: PermissionAction): boolean => {
    // 1. User-wise permission is the primary authority
    if (currentUser.customPermissions?.[module]?.[action] !== undefined) {
      return !!currentUser.customPermissions[module]![action];
    }

    if (currentUser.role === 'Super Admin') return true;

    // 2. Role-level default baseline if user has not customized this module yet
    const roleMap = rolePermissions[currentUser.role] || DEFAULT_ROLE_PERMISSIONS[currentUser.role];
    if (roleMap?.[module]?.[action] !== undefined) {
      return roleMap[module][action];
    }

    return false;
  };

  const canView = (module: CrmModuleKey) => hasPermission(module, 'view');
  const canCreate = (module: CrmModuleKey) => hasPermission(module, 'create');
  const canEdit = (module: CrmModuleKey) => hasPermission(module, 'edit');
  const canDelete = (module: CrmModuleKey) => hasPermission(module, 'delete');

  const updateRolePermission = (
    role: UserRole,
    module: CrmModuleKey,
    action: PermissionAction,
    value: boolean
  ) => {
    setRolePermissions((prev) => {
      const currentRoleObj = prev[role] || DEFAULT_ROLE_PERMISSIONS[role];
      const currentModuleObj = currentRoleObj[module] || { view: true, create: true, edit: true, delete: true };
      const updated = {
        ...prev,
        [role]: {
          ...currentRoleObj,
          [module]: {
            ...currentModuleObj,
            [action]: value,
          },
        },
      };
      return updated;
    });

    addAuditLog({
      entityType: 'User',
      entityId: `role-${role}`,
      entityNumber: role,
      action: 'Updated',
      description: `Permission updated for role ${role}: ${module}.${action} = ${value ? 'Allowed' : 'Denied'}`,
    });
  };

  const resetRolePermissions = (role?: UserRole) => {
    if (role) {
      setRolePermissions((prev) => ({
        ...prev,
        [role]: DEFAULT_ROLE_PERMISSIONS[role],
      }));
    } else {
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    }
  };

  const updateUserCustomPermissions = (
    userId: string,
    permissions?: Partial<RolePermissionsMap>
  ) => {
    setUsers((prev) => {
      const nextUsers = prev.map((u) =>
        u.id === userId ? { ...u, customPermissions: permissions } : u
      );
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
      } catch (e) {
        /* ignore */
      }
      return nextUsers;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => {
        const updatedCurrent = { ...prev, customPermissions: permissions };
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedCurrent));
        } catch (e) {
          /* ignore */
        }
        return updatedCurrent;
      });
    }
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetUser, customPermissions: permissions }),
      }).catch(() => {});

      addAuditLog({
        entityType: 'User',
        entityId: targetUser.id,
        entityNumber: targetUser.name,
        action: 'Updated',
        description: `User-wise RBAC permissions updated for ${targetUser.name} (${targetUser.role})`,
      });
    }
  };

  // Master Helpers
  const getStateCode = (stateName: string): string => {
    const found = states.find(
      (s) => s.stateName.trim().toLowerCase() === stateName.trim().toLowerCase()
    );
    return found ? found.stateCode : '99';
  };

  const addState = (stateData: Omit<StateMasterItem, 'id'>) => {
    const newState: StateMasterItem = {
      id: `st-${Date.now()}`,
      isActive: true,
      ...stateData,
    };
    setStates((prev) => {
      const next = [...prev, newState];
      try { localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: newState.id,
      entityNumber: newState.stateName,
      action: 'Created',
      description: `State ${newState.stateName} (${newState.stateCode}) added to Master`,
    });
  };

  const updateState = (id: string, stateData: Partial<StateMasterItem>) => {
    setStates((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...stateData } : s));
      try { localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: id,
      entityNumber: stateData.stateName || id,
      action: 'Updated',
      description: `State record updated`,
    });
  };

  const deleteState = (id: string) => {
    const target = states.find((s) => s.id === id);
    setStates((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (target) {
      addAuditLog({
        entityType: 'Master',
        entityId: id,
        entityNumber: target.stateName,
        action: 'Deleted',
        description: `State ${target.stateName} removed from Master`,
      });
    }
  };

  const addProduct = (productData: Omit<ProductMasterItem, 'id'>) => {
    const newProduct: ProductMasterItem = {
      id: `prod-${Date.now()}`,
      ...productData,
    };
    setProducts((prev) => {
      const next = [...prev, newProduct];
      try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: newProduct.id,
      entityNumber: newProduct.code,
      action: 'Created',
      description: `Product ${newProduct.name} (${newProduct.code}) created`,
    });
  };

  const updateProduct = (id: string, productData: Partial<ProductMasterItem>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...productData } : p));
      try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: id,
      entityNumber: productData.code || id,
      action: 'Updated',
      description: `Product record updated`,
    });
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (target) {
      addAuditLog({
        entityType: 'Master',
        entityId: id,
        entityNumber: target.code,
        action: 'Deleted',
        description: `Product ${target.name} removed from Master`,
      });
    }
  };

  const addTaxRate = (taxData: Omit<TaxRateMasterItem, 'id'>) => {
    const newTax: TaxRateMasterItem = {
      id: `tax-${Date.now()}`,
      ...taxData,
    };
    setTaxRates((prev) => {
      const next = [...prev, newTax];
      try { localStorage.setItem(STORAGE_KEYS.TAX_RATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: newTax.id,
      entityNumber: `${newTax.gstRate}%`,
      action: 'Created',
      description: `Tax slab ${newTax.name} (${newTax.gstRate}%) created`,
    });
  };

  const updateTaxRate = (id: string, taxData: Partial<TaxRateMasterItem>) => {
    setTaxRates((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...taxData } : t));
      try { localStorage.setItem(STORAGE_KEYS.TAX_RATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: id,
      entityNumber: taxData.name || id,
      action: 'Updated',
      description: `Tax slab updated`,
    });
  };

  const deleteTaxRate = (id: string) => {
    const target = taxRates.find((t) => t.id === id);
    setTaxRates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.TAX_RATES, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (target) {
      addAuditLog({
        entityType: 'Master',
        entityId: id,
        entityNumber: target.name,
        action: 'Deleted',
        description: `Tax slab ${target.name} (${target.gstRate}%) removed from Master`,
      });
    }
  };

  const addPaymentTerm = (termData: Omit<PaymentTermItem, 'id'>) => {
    const newTerm: PaymentTermItem = {
      id: `pt-${Date.now()}`,
      isActive: true,
      ...termData,
    };
    setPaymentTerms((prev) => {
      const next = [...prev, newTerm];
      try { localStorage.setItem(STORAGE_KEYS.PAYMENT_TERMS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: newTerm.id,
      entityNumber: newTerm.name,
      action: 'Created',
      description: `Payment term ${newTerm.name} created`,
    });
  };

  const updatePaymentTerm = (id: string, termData: Partial<PaymentTermItem>) => {
    setPaymentTerms((prev) => {
      const next = prev.map((pt) => (pt.id === id ? { ...pt, ...termData } : pt));
      try { localStorage.setItem(STORAGE_KEYS.PAYMENT_TERMS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    addAuditLog({
      entityType: 'Master',
      entityId: id,
      entityNumber: termData.name || id,
      action: 'Updated',
      description: `Payment term updated`,
    });
  };

  const deletePaymentTerm = (id: string) => {
    const target = paymentTerms.find((pt) => pt.id === id);
    setPaymentTerms((prev) => {
      const next = prev.filter((pt) => pt.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.PAYMENT_TERMS, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (target) {
      addAuditLog({
        entityType: 'Master',
        entityId: id,
        entityNumber: target.name,
        action: 'Deleted',
        description: `Payment term ${target.name} removed from Master`,
      });
    }
  };

  const updateSupplierCompany = (data: Partial<typeof SUPPLIER_COMPANY>) => {
    setSupplierCompany((prev) => {
      const nextBankDetails = {
        bankName:
          data.bankDetails?.bankName ??
          data.bankName ??
          prev.bankDetails?.bankName ??
          prev.bankName,
        accountNumber:
          data.bankDetails?.accountNumber ??
          data.accountNumber ??
          prev.bankDetails?.accountNumber ??
          prev.accountNumber,
        ifscCode:
          data.bankDetails?.ifscCode ??
          data.ifscCode ??
          prev.bankDetails?.ifscCode ??
          prev.ifscCode,
        branch:
          data.bankDetails?.branch ??
          data.branch ??
          prev.bankDetails?.branch ??
          prev.branch,
        accountName:
          data.bankDetails?.accountName ??
          prev.bankDetails?.accountName ??
          data.name ??
          prev.name,
      };
      const prevBankName = (prev.bankDetails?.bankName || prev.bankName || '').trim();
      const prevAccNo = (prev.bankDetails?.accountNumber || prev.accountNumber || '').trim();
      const prevLast4 = prevAccNo.length >= 4 ? prevAccNo.slice(-4) : prevAccNo;
      const prevBankLabel = prevLast4 ? `${prevBankName} - ${prevLast4}` : prevBankName;

      const nextBankNameTrim = (nextBankDetails.bankName || '').trim();
      const nextAccTrim = (nextBankDetails.accountNumber || '').trim();
      const nextLast4 = nextAccTrim.length >= 4 ? nextAccTrim.slice(-4) : nextAccTrim;
      const nextBankLabel = nextLast4 ? `${nextBankNameTrim} - ${nextLast4}` : nextBankNameTrim;

      if (nextBankLabel && nextBankLabel !== prevBankLabel) {
        const replaceable = new Set([
          prevBankLabel,
          'HDFC Current A/c - 1734',
          'ICICI Current A/c - 8892',
          'Kotak Corporate A/c - 4410',
          'Bank of Baroda - 1745',
        ]);
        setPayments((currPayments) =>
          currPayments.map((p) =>
            p.bankCashAccount && replaceable.has(p.bankCashAccount)
              ? { ...p, bankCashAccount: nextBankLabel }
              : p
          )
        );
      }

      const updated = {
        ...prev,
        ...data,
        stateCode: data.state ? getStateCode(data.state) : data.stateCode || prev.stateCode,
        bankName: nextBankDetails.bankName,
        accountNumber: nextBankDetails.accountNumber,
        ifscCode: nextBankDetails.ifscCode,
        branch: nextBankDetails.branch,
        bankDetails: nextBankDetails,
        bankAccounts: Array.isArray(data.bankAccounts)
          ? data.bankAccounts
          : prev.bankAccounts || [],
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SUPPLIER_COMPANY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist supplierCompany update:', e);
      }
      fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addAuditLog = (log: Omit<AuditLogItem, 'id' | 'timestamp' | 'performedById' | 'performedByName'>) => {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...log,
      performedById: currentUser.id,
      performedByName: currentUser.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const shouldSendEmailForType = (
    type: NotificationItem['type'],
    cfg: OutlookEmailNotificationConfig
  ): boolean => {
    if (!cfg.enabled) return false;
    switch (type) {
      case 'LEAD':
        return cfg.notifyOnLead;
      case 'OPPORTUNITY':
        return cfg.notifyOnOpportunity;
      case 'ORDER':
        return cfg.notifyOnOrder;
      case 'INVOICE':
        return cfg.notifyOnInvoice;
      case 'PAYMENT':
        return cfg.notifyOnPayment;
      case 'MILESTONE':
        return cfg.notifyOnMilestone;
      case 'SUPPORT':
      case 'AMC':
        return cfg.notifyOnSupport;
      case 'FOLLOWUP':
        return cfg.notifyOnActivity;
      case 'USER':
        return cfg.notifyOnUser;
      default:
        return true;
    }
  };

  const dispatchOutlookEmailBackend = async (
    notif: { title: string; message: string; type: string },
    cfg: OutlookEmailNotificationConfig
  ) => {
    const targetEmail = (
      cfg.outlookEmail ||
      currentUser.email ||
      supplierCompany.email ||
      'shalv.sharma@coreenact.com'
    ).trim();
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          cc: cfg.ccEmails || '',
          subject: `[${supplierCompany.name} · ${notif.type}] ${notif.title}`,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          senderName: cfg.senderDisplayName || `${supplierCompany.name} CRM`,
          smtpHost: cfg.smtpHost || 'smtp.office365.com',
          smtpPort: cfg.smtpPort || 587,
          appDisplayName: cfg.appDisplayName || 'Enact360',
          clientId: cfg.clientId || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
          objectId: cfg.objectId || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
          tenantId: cfg.tenantId || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
          appState: cfg.appState || 'Activated',
        }),
      });
    } catch {
      // Non-blocking fallback
    }
  };

  const updateOutlookEmailConfig = (data: Partial<OutlookEmailNotificationConfig>) => {
    setOutlookEmailConfig((prev) => {
      const next = { ...prev, ...data };
      if (data.serverType === 'office365' && !data.smtpHost) {
        next.smtpHost = 'smtp.office365.com';
        next.smtpPort = 587;
      } else if (data.serverType === 'outlook_personal' && !data.smtpHost) {
        next.smtpHost = 'smtp-mail.outlook.com';
        next.smtpPort = 587;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.OUTLOOK_EMAIL_CONFIG, JSON.stringify(next));
      } catch {
        // ignore
      }
      fetch('/api/notifications/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
      if (next.outlookEmail) {
        setNotifications((curr) =>
          curr.map((n) => ({
            ...n,
            emailRecipient: next.outlookEmail,
            emailStatus: next.enabled ? 'Sent via Outlook' : n.emailStatus,
          }))
        );
      }
      return next;
    });
  };

  const sendNotificationToOutlookEmail = async (
    notification: NotificationItem,
    openInOutlookWeb = false
  ) => {
    const targetEmail = (
      outlookEmailConfig.outlookEmail ||
      currentUser.email ||
      supplierCompany.email ||
      'shalv.sharma@coreenact.com'
    ).trim();
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await dispatchOutlookEmailBackend(notification, outlookEmailConfig);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id
          ? {
              ...n,
              emailStatus: 'Sent via Outlook',
              emailRecipient: targetEmail,
              emailSentAt: nowTime,
            }
          : n
      )
    );

    if (openInOutlookWeb) {
      const subject = encodeURIComponent(
        `[${supplierCompany.name} · ${notification.type}] ${notification.title}`
      );
      const body = encodeURIComponent(
        `Hello,\n\nCRM Notification Details:\n• Event: ${notification.title}\n• Category: ${notification.type}\n• Message: ${notification.message}\n• Time: ${notification.timestamp}\n\n— ${supplierCompany.name} CRM`
      );
      const ccParam = outlookEmailConfig.ccEmails
        ? `&cc=${encodeURIComponent(outlookEmailConfig.ccEmails)}`
        : '';
      const mailtoLink = `mailto:${encodeURIComponent(targetEmail)}?subject=${subject}&body=${body}${ccParam}`;
      const a = document.createElement('a');
      a.href = mailtoLink;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const sendTestOutlookEmail = async (
    targetEmail?: string
  ): Promise<{ success: boolean; recipient: string }> => {
    const recipient = (
      targetEmail ||
      outlookEmailConfig.outlookEmail ||
      currentUser.email ||
      supplierCompany.email
    ).trim();
    const testNotif = {
      title: 'Outlook Email Notification Channel Verified',
      message: `All CRM notifications (Leads, Opportunities, Sales Orders, Purchase Orders, Invoices, Payments, Milestones & Support) are actively routing to your Outlook account (${recipient}) via ${outlookEmailConfig.smtpHost}:${outlookEmailConfig.smtpPort}.`,
      type: 'SYSTEM' as const,
    };
    await dispatchOutlookEmailBackend(testNotif, {
      ...outlookEmailConfig,
      outlookEmail: recipient,
    });
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      ...testNotif,
      timestamp: 'Just now',
      isRead: false,
      emailStatus: 'Sent via Outlook',
      emailRecipient: recipient,
      emailSentAt: nowTime,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return { success: true, recipient };
  };

  const sendAllNotificationsToOutlook = async (): Promise<number> => {
    const recipient = (
      outlookEmailConfig.outlookEmail ||
      currentUser.email ||
      supplierCompany.email
    ).trim();
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await Promise.all(
      notifications.map((n) => dispatchOutlookEmailBackend(n, outlookEmailConfig))
    );
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        emailStatus: 'Sent via Outlook',
        emailRecipient: recipient,
        emailSentAt: nowTime,
      }))
    );
    return notifications.length;
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'isRead' | 'timestamp'> & { timestamp?: string }) => {
    const willEmail = shouldSendEmailForType(item.type, outlookEmailConfig);
    const recipient = (
      outlookEmailConfig.outlookEmail ||
      currentUser.email ||
      supplierCompany.email ||
      'shalv.sharma@coreenact.com'
    ).trim();
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
      timestamp: item.timestamp || 'Just now',
      isRead: false,
      emailStatus: willEmail ? 'Sent via Outlook' : 'Skipped',
      emailRecipient: recipient,
      emailSentAt: willEmail ? nowTime : undefined,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (willEmail) {
      dispatchOutlookEmailBackend(newNotif, outlookEmailConfig);
    }
  };

  // Lead Management
  const addLead = (leadData: Omit<Lead, 'id' | 'leadNumber' | 'createdAt' | 'updatedAt' | 'isConverted'>): Lead => {
    const nextSeq = leads.length + 1;
    const leadNumber = `LEAD-2026-${String(nextSeq).padStart(5, '0')}`;
    const stateCode = getStateCode(leadData.state);
    const now = new Date().toISOString();
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const nameParts = (leadData.contactPerson || '').trim().split(/\s+/);
    const autoFirst = leadData.contactFirstName || nameParts[0] || '';
    const autoLast = leadData.contactLastName || nameParts.slice(1).join(' ') || '-';

    const initialContacts: LeadLinkedContact[] =
      leadData.createPrimaryContact !== false
        ? [
            {
              id: `lcnt-${Date.now()}`,
              leadId,
              firstName: autoFirst,
              lastName: autoLast,
              title: leadData.designation || '',
              department: leadData.contactDepartment || '',
              email: leadData.email || '',
              phone: leadData.mobile || '',
              mobile: leadData.contactMobile || leadData.mobile || '',
              linkedin: leadData.contactLinkedin || '',
              source: 'Lead',
              mailingAddress: leadData.address || '',
              createdAt: now,
            },
          ]
        : [];

    const initialTimeline: LeadTimelineEvent[] = [
      {
        id: `lev-${Date.now()}`,
        type: 'Status Update',
        title: `Lead Created (${leadData.status || 'New'})`,
        status: leadData.status || 'New',
        detail:
          leadData.remarks ||
          `Lead captured via ${leadData.leadSource} for ${leadData.companyName}. Requirement: ${
            leadData.requirement || 'Initial inquiry'
          }`,
        date: now,
        user: currentUser.name,
      },
    ];

    const newLead: Lead = {
      id: leadId,
      leadNumber,
      ...leadData,
      contactFirstName: autoFirst,
      contactLastName: autoLast,
      linkedContacts: leadData.linkedContacts || initialContacts,
      timelineEvents: leadData.timelineEvents || initialTimeline,
      stateCode,
      isConverted: false,
      createdAt: now,
      updatedAt: now,
    };

    setLeads((prev) => [newLead, ...prev]);
    addAuditLog({
      entityType: 'Lead',
      entityId: newLead.id,
      entityNumber: newLead.leadNumber,
      action: 'Created',
      description: `New lead created for ${newLead.companyName} (${formatCurrency(newLead.estimatedValue)})`,
    });

    addNotification({
      type: 'LEAD',
      title: 'New Lead Added',
      message: `${newLead.companyName} assigned to ${newLead.leadOwnerName}`,
      timestamp: 'Just now',
      linkType: 'lead',
      linkId: newLead.id,
    });

    return newLead;
  };

  const updateLead = (id: string, leadData: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updatedState = leadData.state ? leadData.state : l.state;
          const updatedStateCode = leadData.state ? getStateCode(updatedState) : l.stateCode;
          return {
            ...l,
            ...leadData,
            stateCode: updatedStateCode,
            updatedAt: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    addAuditLog({
      entityType: 'Lead',
      entityId: id,
      entityNumber: leads.find((l) => l.id === id)?.leadNumber || id,
      action: 'Updated',
      description: `Lead details updated`,
    });
  };

  const updateLeadStatus = (id: string, status: LeadStatus, lostReason?: string) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const statusEvent: LeadTimelineEvent = {
            id: `lev-${Date.now()}`,
            type: 'Status Update',
            title: `Stage changed to ${status}`,
            status,
            detail: lostReason ? `Stage updated to ${status}: ${lostReason}` : `Lead stage updated from ${l.status} to ${status}.`,
            date: now,
            user: currentUser.name,
          };
          return {
            ...l,
            status,
            lostReason: status === 'Lost' ? (lostReason || l.lostReason) : undefined,
            timelineEvents: [statusEvent, ...(l.timelineEvents || [])],
            updatedAt: now,
          };
        }
        return l;
      })
    );
    const target = leads.find((l) => l.id === id);
    if (target) {
      addAuditLog({
        entityType: 'Lead',
        entityId: id,
        entityNumber: target.leadNumber,
        action: 'Status Changed',
        description: `Lead status changed to ${status}${lostReason ? `: ${lostReason}` : ''}`,
      });
    }
  };

  const deleteLead = (id: string): { success: boolean; message: string } => {
    if (!canDelete('leads')) {
      const msg = `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Leads.`;
      return { success: false, message: msg };
    }
    const target = leads.find((l) => l.id === id);
    if (!target) return { success: false, message: 'Lead not found.' };

    setLeads((prev) => prev.filter((l) => l.id !== id));
    addAuditLog({
      entityType: 'Lead',
      entityId: id,
      entityNumber: target.leadNumber,
      action: 'Deleted',
      description: `Lead ${target.leadNumber} (${target.companyName}) deleted by ${currentUser.name}`,
    });
    return { success: true, message: `Lead ${target.leadNumber} successfully deleted.` };
  };

  const addLeadTimelineEvent = (
    leadId: string,
    entry: {
      type: LeadTimelineEvent['type'];
      conversationAt: string;
      followUpAt?: string;
      remarks: string;
    }
  ) => {
    const target = leads.find((l) => l.id === leadId);
    if (!target) return;

    const newEvent: LeadTimelineEvent = {
      id: `lev-${Date.now()}`,
      type: entry.type,
      title: entry.followUpAt
        ? `Follow-up scheduled for ${new Date(entry.followUpAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : `${entry.type} logged`,
      status: target.status,
      detail: entry.remarks,
      date: entry.conversationAt || new Date().toISOString(),
      followUpAt: entry.followUpAt,
      user: currentUser.name,
    };

    const formattedNextActivity = entry.followUpAt
      ? `${entry.type} · ${new Date(entry.followUpAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : target.nextActivity;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              nextActivity: formattedNextActivity,
              timelineEvents: [newEvent, ...(l.timelineEvents || [])],
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );

    if (entry.followUpAt) {
      addActivity({
        activityType:
          entry.type === 'Call' || entry.type === 'Meeting' || entry.type === 'Email' || entry.type === 'Follow-up'
            ? entry.type
            : 'Follow-up',
        subject: `[${target.leadNumber}] ${entry.remarks.slice(0, 50)}`,
        date: entry.followUpAt.split('T')[0],
        time: entry.followUpAt.split('T')[1] || '11:00',
        assignedUserId: target.leadOwnerId,
        assignedUserName: target.leadOwnerName,
        priority: 'Medium',
        status: 'Pending',
        leadId: target.id,
        leadNumber: target.leadNumber,
        contactPerson: target.contactPerson,
        notes: entry.remarks,
      });
    }
  };

  const createContactFromLead = (
    leadId: string,
    contactData: Omit<LeadLinkedContact, 'id' | 'leadId' | 'createdAt'>
  ) => {
    const newContact: LeadLinkedContact = {
      id: `lcnt-${Date.now()}`,
      leadId,
      ...contactData,
      createdAt: new Date().toISOString(),
    };

    const contactEvent: LeadTimelineEvent = {
      id: `lev-${Date.now()}-cnt`,
      type: 'Remark',
      title: `Contact Created & Linked`,
      status: 'Linked',
      detail: `Created contact ${contactData.firstName} ${contactData.lastName} (${contactData.title || 'Contact'}) in Contacts and linked to this lead.`,
      date: new Date().toISOString(),
      user: currentUser.name,
    };

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              linkedContacts: [...(l.linkedContacts || []), newContact],
              timelineEvents: [contactEvent, ...(l.timelineEvents || [])],
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const qualifyLeadToOpportunity = (leadId: string): Opportunity | null => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return null;

    const result = convertLead({
      leadId: targetLead.id,
      createOpportunity: true,
      opportunityName: `${targetLead.companyName} — ${
        products.find((p) => p.id === (targetLead.primaryProductId || targetLead.productInterestIds[0]))?.name ||
        targetLead.requirement.slice(0, 40) ||
        'Commercial Deal'
      }`,
      opportunityStage: 'Qualification',
      createOrderImmediately: false,
    });

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: 'Qualified',
              timelineEvents: [
                {
                  id: `lev-${Date.now()}-qual`,
                  type: 'Status Update',
                  title: `Lead Qualified → ${result.opportunity?.opportunityNumber || 'Opportunity'}`,
                  status: 'Qualified',
                  detail: `Lead qualified and converted into Opportunity Card ${result.opportunity?.opportunityNumber}.`,
                  date: new Date().toISOString(),
                  user: currentUser.name,
                },
                ...(l.timelineEvents || []),
              ],
            }
          : l
      )
    );

    return result.opportunity || null;
  };

  const importLeadsBatch = (rows: Array<Partial<Lead>>): number => {
    let count = 0;
    const createdLeads: Lead[] = [];
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    rows.forEach((row, idx) => {
      if (!row.companyName || !row.contactPerson || !row.mobile) return;
      const seq = leads.length + count + 1;
      const leadNumber = `LEAD-2026-${String(seq).padStart(5, '0')}`;
      const stateName = row.state || 'Delhi';
      const stateCode = getStateCode(stateName);
      const owner =
        users.find((u) => u.email.toLowerCase() === (row as any).ownerEmail?.toLowerCase()) ||
        currentUser;

      const leadId = `lead-${Date.now()}-${idx}`;
      const parts = row.contactPerson.trim().split(/\s+/);

      createdLeads.push({
        id: leadId,
        leadNumber,
        leadDate: today,
        companyName: row.companyName,
        contactPerson: row.contactPerson,
        designation: row.designation || 'Decision Maker',
        mobile: row.mobile,
        email: row.email || '',
        website: row.website || '',
        address: row.address || '',
        country: 'India',
        state: stateName,
        stateCode,
        city: row.city || stateName,
        pincode: row.pincode || '110001',
        leadSource: (row.leadSource as any) || 'Website',
        leadType: 'Inbound',
        industry: row.industry || 'Manufacturing',
        requirement: row.requirement || 'Imported via CSV bulk upload',
        primaryProductId: row.primaryProductId || products[0]?.id,
        productInterestIds: row.productInterestIds || (products[0] ? [products[0].id] : []),
        estimatedValue: Number(row.estimatedValue) || 0,
        budget: Number(row.budget) || 0,
        expectedClosingDate: row.expectedClosingDate || row.expectedGoLive || today,
        expectedGoLive: row.expectedGoLive || row.expectedClosingDate || today,
        rating: (row.rating as any) || 'Warm',
        score: Number(row.score) || 50,
        createPrimaryContact: true,
        contactFirstName: parts[0] || '',
        contactLastName: parts.slice(1).join(' ') || '-',
        leadOwnerId: owner.id,
        leadOwnerName: owner.name,
        priority: 'Medium',
        status: (row.status as any) || 'New',
        remarks: row.remarks || '',
        isConverted: false,
        timelineEvents: [
          {
            id: `lev-imp-${Date.now()}-${idx}`,
            type: 'Status Update',
            title: 'Imported via Bulk CSV',
            status: (row.status as any) || 'New',
            detail: row.remarks || 'Lead created from CSV bulk import.',
            date: now,
            user: currentUser.name,
          },
        ],
        createdAt: now,
        updatedAt: now,
      });
      count++;
    });

    if (createdLeads.length > 0) {
      setLeads((prev) => [...createdLeads, ...prev]);
    }
    return count;
  };

  // Customer Management
  const addCustomer = (customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt'>): Customer => {
    const nextSeq = customers.length + 1;
    const customerCode = `CUS-2026-${String(nextSeq).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      id: `cus-${Date.now()}`,
      customerCode,
      ...customerData,
      createdAt: now,
      updatedAt: now,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    addAuditLog({
      entityType: 'Customer',
      entityId: newCustomer.id,
      entityNumber: newCustomer.customerCode,
      action: 'Created',
      description: `Customer ${newCustomer.name} created`,
    });
    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customerData, updatedAt: new Date().toISOString() } : c))
    );
    addAuditLog({
      entityType: 'Customer',
      entityId: id,
      entityNumber: customers.find((c) => c.id === id)?.customerCode || id,
      action: 'Updated',
      description: `Customer record updated`,
    });
  };

  const deleteCustomer = (id: string): { success: boolean; message: string } => {
    if (!canDelete('customers')) {
      const msg = `Permission Denied: Your role (${currentUser.role}) does not have permission to delete customers.`;
      return { success: false, message: msg };
    }
    const cust = customers.find((c) => c.id === id);
    if (!cust) return { success: false, message: 'Customer not found.' };

    const linkedOrders = orders.filter((o) => o.customerId === id);
    if (linkedOrders.length > 0) {
      return {
        success: false,
        message: `Cannot delete customer "${cust.name}": ${linkedOrders.length} active Sales Order(s) are linked (${linkedOrders.map((o) => o.orderNumber).join(', ')}). Delete or reassign orders first.`,
      };
    }
    const linkedInvoices = invoices.filter((i) => i.customerId === id && i.status !== 'Cancelled');
    if (linkedInvoices.length > 0) {
      return {
        success: false,
        message: `Cannot delete customer "${cust.name}": ${linkedInvoices.length} active Invoice(s) are linked (${linkedInvoices.map((i) => i.invoiceNumber).join(', ')}). Cancel or delete invoices first.`,
      };
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setContacts((prev) => prev.filter((cnt) => cnt.customerId !== id));
    addAuditLog({
      entityType: 'Customer',
      entityId: cust.id,
      entityNumber: cust.customerCode || cust.name,
      action: 'Deleted',
      description: `Customer "${cust.name}" deleted by ${currentUser.name}`,
    });
    return { success: true, message: `Customer "${cust.name}" successfully deleted.` };
  };

  const addCustomerAddress = (customerId: string, address: Omit<CustomerAddress, 'id'>) => {
    const stateCode = getStateCode(address.state);
    const newAddress: CustomerAddress = {
      id: `addr-${Date.now()}`,
      ...address,
      stateCode,
    };

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedAddresses = address.isDefault
            ? c.addresses.map((a) => (a.type === address.type ? { ...a, isDefault: false } : a))
            : c.addresses;
          return {
            ...c,
            addresses: [...updatedAddresses, newAddress],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const updateCustomerAddress = (customerId: string, addressId: string, addressData: Partial<CustomerAddress>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const resolvedStateCode = addressData.state ? getStateCode(addressData.state) : undefined;
        const nextAddresses = c.addresses.map((a) => {
          if (a.id === addressId) {
            return {
              ...a,
              ...addressData,
              stateCode: resolvedStateCode || addressData.stateCode || a.stateCode,
            };
          }
          if (addressData.isDefault && a.type === (addressData.type || a.type)) {
            return { ...a, isDefault: false };
          }
          return a;
        });
        return {
          ...c,
          addresses: nextAddresses,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteCustomerAddress = (customerId: string, addressId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              addresses: c.addresses.filter((a) => a.id !== addressId),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const addCustomerContact = (contactData: Omit<CustomerContact, 'id'>): CustomerContact => {
    const newContact: CustomerContact = {
      id: `cnt-${Date.now()}`,
      ...contactData,
    };
    setContacts((prev) => {
      const cleaned = contactData.isPrimary
        ? prev.map((c) => (c.customerId === contactData.customerId ? { ...c, isPrimary: false } : c))
        : prev;
      return [newContact, ...cleaned];
    });
    return newContact;
  };

  const updateCustomerContact = (id: string, contactData: Partial<CustomerContact>) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === id) return { ...c, ...contactData };
        return c;
      })
    );
  };

  const deleteCustomerContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Lead Conversion Workflow
  const convertLead = (params: {
    leadId: string;
    existingCustomerId?: string;
    newCustomerData?: {
      name: string;
      customerType: Customer['customerType'];
      gstin?: string;
      pan?: string;
      email: string;
      phone: string;
      website?: string;
      industry: string;
      paymentTermsId: string;
      creditLimit: number;
    };
    createOpportunity?: boolean;
    opportunityName?: string;
    opportunityStage?: OpportunityStage;
    createOrderImmediately?: boolean;
    orderItems?: Array<{ productId: string; quantity: number; discountPercent: number }>;
  }): { customer?: Customer; opportunity?: Opportunity; salesOrder?: SalesOrder } => {
    const targetLead = leads.find((l) => l.id === params.leadId);
    if (!targetLead) {
      throw new Error('Lead not found');
    }

    let customer: Customer | undefined;

    if (params.existingCustomerId) {
      const found = customers.find((c) => c.id === params.existingCustomerId);
      if (found) customer = found;
    } else if (params.newCustomerData) {
      const pTerm = paymentTerms.find((p) => p.id === params.newCustomerData!.paymentTermsId) || paymentTerms[0];
      const stateCode = getStateCode(targetLead.state);

      const billingAddress: CustomerAddress = {
        id: `addr-${Date.now()}`,
        type: 'Billing',
        title: 'Primary Office',
        addressLine1: targetLead.address || 'Corporate Office',
        city: targetLead.city || 'City',
        state: targetLead.state,
        stateCode: stateCode,
        country: targetLead.country || 'India',
        pincode: targetLead.pincode || '110001',
        isDefault: true,
      };

      const primaryContact: CustomerContact = {
        id: `cnt-${Date.now()}`,
        customerId: '',
        name: targetLead.contactPerson,
        designation: targetLead.designation || 'Key Contact',
        department: 'Management',
        mobile: targetLead.mobile,
        email: targetLead.email,
        isPrimary: true,
        isDecisionMaker: true,
        status: 'Active',
      };

      const nextCustSeq = customers.length + 1;
      const customerCode = `CUS-2026-${String(nextCustSeq).padStart(5, '0')}`;
      const now = new Date().toISOString();

      customer = {
        id: `cus-${Date.now()}`,
        customerCode,
        name: params.newCustomerData.name || targetLead.companyName,
        customerType: params.newCustomerData.customerType || 'Enterprise',
        customerGroup: 'Direct',
        gstin: params.newCustomerData.gstin || '',
        pan: params.newCustomerData.pan || '',
        email: params.newCustomerData.email || targetLead.email,
        phone: params.newCustomerData.phone || targetLead.mobile,
        website: params.newCustomerData.website || targetLead.website,
        industry: params.newCustomerData.industry || targetLead.industry,
        paymentTermsId: pTerm.id,
        paymentTermsName: pTerm.name,
        creditLimit: params.newCustomerData.creditLimit || 1000000,
        currency: 'INR',
        status: 'Active',
        salesOwnerId: targetLead.leadOwnerId,
        salesOwnerName: targetLead.leadOwnerName,
        remarks: `Converted from Lead ${targetLead.leadNumber}`,
        addresses: [billingAddress],
        fromLeadId: targetLead.id,
        fromLeadNumber: targetLead.leadNumber,
        createdAt: now,
        updatedAt: now,
      };

      primaryContact.customerId = customer.id;
      setCustomers((prev) => [customer!, ...prev]);
    }

    let createdOpportunity: Opportunity | undefined;

    if (params.createOpportunity !== false) {
      const oppStage = params.opportunityStage || (params.createOrderImmediately ? 'Won' : 'Qualification');
      const oppStatus: OpportunityStatus = params.createOrderImmediately ? 'Won' : 'In Progress';
      const oppProb = oppStage === 'Won' ? 100 : oppStage === 'Negotiation' ? 80 : oppStage === 'Proposal Submitted' ? 65 : 40;

      createdOpportunity = addOpportunity({
        opportunityName: params.opportunityName || `${targetLead.companyName} - ${targetLead.requirement.slice(0, 48)}`,
        leadId: targetLead.id,
        customerId: customer?.id,
        customerName: customer?.name || targetLead.companyName,
        contactPerson: targetLead.contactPerson,
        contactMobile: targetLead.mobile,
        contactEmail: targetLead.email,
        state: targetLead.state,
        salesOwnerId: targetLead.leadOwnerId,
        expectedClosingDate: targetLead.expectedClosingDate,
        estimatedDealValue: targetLead.estimatedValue,
        probability: oppProb,
        stage: oppStage,
        status: oppStatus,
        initialRemark: targetLead.remarks || `Converted from qualified lead ${targetLead.leadNumber}`,
        productInterestIds: targetLead.productInterestIds,
      });
    }

    let createdOrder: SalesOrder | undefined;

    if (params.createOrderImmediately && customer && params.orderItems && params.orderItems.length > 0) {
      const defaultBilling = customer.addresses.find((a) => a.type === 'Billing') || customer.addresses[0];
      const defaultShipping = customer.addresses.find((a) => a.type === 'Shipping') || defaultBilling;

      createdOrder = addOrder({
        customerId: customer.id,
        leadReferenceId: targetLead.id,
        opportunityReferenceId: createdOpportunity?.id,
        paymentTermsId: customer.paymentTermsId,
        billingAddress: defaultBilling,
        shippingAddress: defaultShipping,
        items: params.orderItems,
        remarks: `Auto-generated from Lead conversion (${targetLead.leadNumber})`,
      });
    }

    // Mark lead as converted
    const nowIso = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) =>
        l.id === params.leadId
          ? {
              ...l,
              status: params.createOrderImmediately ? 'Won' : l.status === 'New' || l.status === 'Contacted' ? 'Qualified' : l.status,
              isConverted: true,
              convertedCustomerId: customer?.id || l.convertedCustomerId,
              convertedOpportunityId: createdOpportunity?.id || l.convertedOpportunityId,
              convertedOpportunityNumber: createdOpportunity?.opportunityNumber || l.convertedOpportunityNumber,
              convertedSalesOrderId: createdOrder?.id || l.convertedSalesOrderId,
              convertedAt: nowIso,
              updatedAt: nowIso,
            }
          : l
      )
    );

    addAuditLog({
      entityType: 'Lead',
      entityId: targetLead.id,
      entityNumber: targetLead.leadNumber,
      action: 'Converted',
      description: `Lead converted${createdOpportunity ? ` to Opportunity ${createdOpportunity.opportunityNumber}` : ''}${
        customer ? ` & Customer ${customer.name} (${customer.customerCode})` : ''
      }${createdOrder ? ` & Sales Order ${createdOrder.orderNumber}` : ''}`,
    });

    addNotification({
      type: 'OPPORTUNITY',
      title: 'Lead Converted to Opportunity',
      message: `${targetLead.companyName} converted to ${createdOpportunity?.opportunityNumber || customer?.customerCode || 'Customer'}`,
      timestamp: 'Just now',
      linkType: createdOpportunity ? 'opportunity' : 'customer',
      linkId: createdOpportunity?.id || customer?.id,
    });

    return { customer, opportunity: createdOpportunity, salesOrder: createdOrder };
  };

  // Opportunity Management
  const addOpportunity = (data: {
    opportunityName: string;
    leadId?: string;
    customerId?: string;
    customerName: string;
    contactPerson: string;
    contactMobile: string;
    contactEmail: string;
    state: string;
    salesOwnerId: string;
    expectedClosingDate: string;
    estimatedDealValue: number;
    probability: number;
    stage: OpportunityStage;
    status: OpportunityStatus;
    initialRemark?: string;
    nextFollowUp?: string;
    productInterestIds: string[];
  }): Opportunity => {
    const nextOppSeq = opportunities.length + 1;
    const opportunityNumber = `OPP-2026-${String(nextOppSeq).padStart(5, '0')}`;
    const stateCode = getStateCode(data.state);
    const owner = users.find((u) => u.id === data.salesOwnerId) || currentUser;
    const linkedLead = data.leadId ? leads.find((l) => l.id === data.leadId) : undefined;
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = nowIso.split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const initialRemarks: OpportunityRemark[] = data.initialRemark
      ? [
          {
            id: `rem-${Date.now()}`,
            remark: data.initialRemark,
            userId: currentUser.id,
            userName: currentUser.name,
            date: dateStr,
            time: timeStr,
          },
        ]
      : [];

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      opportunityNumber,
      opportunityName: data.opportunityName,
      leadId: linkedLead?.id || data.leadId,
      leadNumber: linkedLead?.leadNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      contactPerson: data.contactPerson,
      contactMobile: data.contactMobile,
      contactEmail: data.contactEmail,
      state: data.state,
      stateCode,
      salesOwnerId: owner.id,
      salesOwnerName: owner.name,
      expectedClosingDate: data.expectedClosingDate,
      estimatedDealValue: data.estimatedDealValue,
      probability: data.probability,
      stage: data.stage,
      status: data.status,
      remarks: initialRemarks,
      tasks: [],
      nextFollowUp: data.nextFollowUp,
      lastActivity: data.initialRemark || 'Opportunity created',
      productInterestIds: data.productInterestIds,
      attachments: [],
      isConvertedToOrder: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setOpportunities((prev) => [newOpp, ...prev]);

    if (linkedLead) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === linkedLead.id
            ? {
                ...l,
                isConverted: true,
                convertedOpportunityId: newOpp.id,
                convertedOpportunityNumber: newOpp.opportunityNumber,
                updatedAt: nowIso,
              }
            : l
        )
      );
    }

    addAuditLog({
      entityType: 'Opportunity',
      entityId: newOpp.id,
      entityNumber: newOpp.opportunityNumber,
      action: 'Created',
      description: `Opportunity ${newOpp.opportunityNumber} (${newOpp.opportunityName}) created for ${newOpp.customerName}`,
    });

    return newOpp;
  };

  const STAGE_PROBABILITY_MAP: Record<OpportunityStage, number> = {
    Qualification: 20,
    'Requirement Analysis': 35,
    'Demo / Presentation': 50,
    'Proposal Submitted': 65,
    Negotiation: 80,
    'Commercial Discussion': 85,
    'Decision Pending': 90,
    Won: 100,
    Lost: 0,
  };

  const updateOpportunityStageAndStatus = (
    id: string,
    stage: OpportunityStage,
    status: OpportunityStatus,
    probability?: number
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = nowIso.split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const computedProb =
      probability !== undefined ? probability : STAGE_PROBABILITY_MAP[stage] ?? 50;

    const autoStatus: OpportunityStatus =
      stage === 'Won' ? 'Won' : stage === 'Lost' ? 'Lost' : status;

    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === id) {
          const stageChanged = opp.stage !== stage;
          const statusChanged = opp.status !== autoStatus;
          const sysRemark: OpportunityRemark | null =
            stageChanged || statusChanged
              ? {
                  id: `rem-${Date.now()}`,
                  remark: `Updated Stage to "${stage}" and Status to "${autoStatus}" (Probability: ${computedProb}%).`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                  date: dateStr,
                  time: timeStr,
                }
              : null;

          return {
            ...opp,
            stage,
            status: autoStatus,
            probability: computedProb,
            remarks: sysRemark ? [sysRemark, ...opp.remarks] : opp.remarks,
            lastActivity: `Stage: ${stage} (${autoStatus})`,
            updatedAt: nowIso,
          };
        }
        return opp;
      })
    );

    const target = opportunities.find((o) => o.id === id);
    if (target) {
      addAuditLog({
        entityType: 'Opportunity',
        entityId: id,
        entityNumber: target.opportunityNumber,
        action: 'Status Changed',
        description: `Opportunity stage set to ${stage} | status: ${autoStatus}`,
      });
    }
  };

  const updateOpportunity = (id: string, data: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === id) {
          const stateCode = data.state ? getStateCode(data.state) : opp.stateCode;
          return {
            ...opp,
            ...data,
            stateCode,
            updatedAt: new Date().toISOString(),
          };
        }
        return opp;
      })
    );
  };

  const addOpportunityRemark = (opportunityId: string, remarkText: string) => {
    if (!remarkText.trim()) return;
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = nowIso.split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newRemark: OpportunityRemark = {
      id: `rem-${Date.now()}`,
      remark: remarkText.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: dateStr,
      time: timeStr,
    };

    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              remarks: [newRemark, ...opp.remarks],
              lastActivity: remarkText.trim().slice(0, 65),
              updatedAt: nowIso,
            }
          : opp
      )
    );
  };

  const addOpportunityTask = (
    opportunityId: string,
    taskData: {
      title: string;
      description?: string;
      assignedToId: string;
      dueDate: string;
      priority: 'Low' | 'Medium' | 'High';
      reminder?: string;
    }
  ) => {
    const assignee = users.find((u) => u.id === taskData.assignedToId) || currentUser;
    const newTask: OpportunityTask = {
      id: `tsk-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      assignedToId: assignee.id,
      assignedToName: assignee.name,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: 'Pending',
      reminder: taskData.reminder,
    };

    const opp = opportunities.find((o) => o.id === opportunityId);

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === opportunityId
          ? {
              ...o,
              tasks: [...o.tasks, newTask],
              nextFollowUp: taskData.dueDate,
              lastActivity: `Task added: ${taskData.title}`,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    // Also sync to central Activities so sales user gets follow-up tracking in Activities module
    if (opp) {
      addActivity({
        activityType: 'Task',
        subject: `[${opp.opportunityNumber}] ${taskData.title}`,
        date: taskData.dueDate,
        assignedUserId: assignee.id,
        assignedUserName: assignee.name,
        priority: taskData.priority,
        status: 'Pending',
        notes: taskData.description || `Opportunity task for ${opp.customerName}`,
        opportunityId: opp.id,
        opportunityNumber: opp.opportunityNumber,
        leadId: opp.leadId,
        leadNumber: opp.leadNumber,
        customerId: opp.customerId,
        customerName: opp.customerName,
        contactPerson: opp.contactPerson,
      });
    }
  };

  const updateOpportunityTaskStatus = (
    opportunityId: string,
    taskId: string,
    status: OpportunityTaskStatus
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === opportunityId) {
          return {
            ...opp,
            tasks: opp.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status,
                    completionDate: status === 'Completed' ? todayStr : undefined,
                  }
                : t
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return opp;
      })
    );
  };

  const addOpportunityAttachment = (opportunityId: string, fileName: string, fileSize: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              attachments: [
                ...opp.attachments,
                {
                  id: `att-${Date.now()}`,
                  fileName,
                  fileSize,
                  uploadedBy: currentUser.name,
                  uploadedAt: todayStr,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : opp
      )
    );
  };

  const convertOpportunityToSalesOrder = (params: {
    opportunityId: string;
    existingCustomerId?: string;
    newCustomerData?: {
      name: string;
      customerType: Customer['customerType'];
      gstin?: string;
      pan?: string;
      paymentTermsId: string;
      creditLimit: number;
    };
    paymentTermsId: string;
    deliveryDate?: string;
    items: Array<{ productId: string; quantity: number; discountPercent: number }>;
    milestonePercentages?: number[];
    remarks?: string;
  }): { customer: Customer; salesOrder: SalesOrder } => {
    const opp = opportunities.find((o) => o.id === params.opportunityId);
    if (!opp) throw new Error('Opportunity not found');

    let customer: Customer | undefined;

    if (params.existingCustomerId) {
      customer = customers.find((c) => c.id === params.existingCustomerId);
    } else if (opp.customerId) {
      customer = customers.find((c) => c.id === opp.customerId);
    }

    if (!customer) {
      const pTerm =
        paymentTerms.find((p) => p.id === (params.newCustomerData?.paymentTermsId || params.paymentTermsId)) ||
        paymentTerms[0];
      const stateCode = opp.stateCode || getStateCode(opp.state);
      const linkedLead = opp.leadId ? leads.find((l) => l.id === opp.leadId) : undefined;

      const billingAddress: CustomerAddress = {
        id: `addr-${Date.now()}`,
        type: 'Billing',
        title: 'Primary Corporate Address',
        addressLine1: linkedLead?.address || `${opp.customerName} HQ`,
        city: linkedLead?.city || opp.state,
        state: opp.state,
        stateCode,
        country: 'India',
        pincode: linkedLead?.pincode || '110001',
        isDefault: true,
      };

      const nextCustSeq = customers.length + 1;
      const customerCode = `CUS-2026-${String(nextCustSeq).padStart(5, '0')}`;
      const now = new Date().toISOString();

      customer = {
        id: `cus-${Date.now()}`,
        customerCode,
        name: params.newCustomerData?.name || opp.customerName,
        customerType: params.newCustomerData?.customerType || 'Enterprise',
        customerGroup: 'Direct',
        gstin: params.newCustomerData?.gstin || '',
        pan: params.newCustomerData?.pan || '',
        email: opp.contactEmail,
        phone: opp.contactMobile,
        website: linkedLead?.website,
        industry: linkedLead?.industry || 'Enterprise',
        paymentTermsId: pTerm.id,
        paymentTermsName: pTerm.name,
        creditLimit: params.newCustomerData?.creditLimit || 2000000,
        currency: 'INR',
        status: 'Active',
        salesOwnerId: opp.salesOwnerId,
        salesOwnerName: opp.salesOwnerName,
        remarks: `Created from Won Opportunity ${opp.opportunityNumber}`,
        addresses: [billingAddress],
        fromLeadId: opp.leadId,
        fromLeadNumber: opp.leadNumber,
        createdAt: now,
        updatedAt: now,
      };

      setCustomers((prev) => [customer!, ...prev]);
    }

    const defaultBilling = customer.addresses.find((a) => a.type === 'Billing') || customer.addresses[0];
    const defaultShipping = customer.addresses.find((a) => a.type === 'Shipping') || defaultBilling;

    const salesOrder = addOrder({
      customerId: customer.id,
      leadReferenceId: opp.leadId,
      opportunityReferenceId: opp.id,
      paymentTermsId: params.paymentTermsId || customer.paymentTermsId,
      deliveryDate: params.deliveryDate,
      billingAddress: defaultBilling,
      shippingAddress: defaultShipping,
      items: params.items,
      milestonePercentages: params.milestonePercentages,
      remarks: params.remarks || `Converted from Won Opportunity ${opp.opportunityNumber}`,
    });

    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = nowIso.split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const conversionRemark: OpportunityRemark = {
      id: `rem-${Date.now()}`,
      remark: `Opportunity Won & converted into Sales Order ${salesOrder.orderNumber} (${formatCurrency(salesOrder.grandTotal)}).`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: dateStr,
      time: timeStr,
    };

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === opp.id
          ? {
              ...o,
              customerId: customer!.id,
              customerName: customer!.name,
              stage: 'Won',
              status: 'Won',
              probability: 100,
              isConvertedToOrder: true,
              convertedSalesOrderId: salesOrder.id,
              convertedSalesOrderNumber: salesOrder.orderNumber,
              remarks: [conversionRemark, ...o.remarks],
              lastActivity: `Converted to ${salesOrder.orderNumber}`,
              updatedAt: nowIso,
            }
          : o
      )
    );

    if (opp.leadId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === opp.leadId
            ? {
                ...l,
                status: 'Won',
                isConverted: true,
                convertedCustomerId: customer!.id,
                convertedOpportunityId: opp.id,
                convertedOpportunityNumber: opp.opportunityNumber,
                convertedSalesOrderId: salesOrder.id,
                updatedAt: nowIso,
              }
            : l
        )
      );
    }

    addAuditLog({
      entityType: 'Opportunity',
      entityId: opp.id,
      entityNumber: opp.opportunityNumber,
      action: 'Converted',
      description: `Opportunity ${opp.opportunityNumber} converted to Sales Order ${salesOrder.orderNumber}`,
    });

    return { customer, salesOrder };
  };

  const deleteOpportunity = (opportunityId: string): { success: boolean; message: string } => {
    if (!canDelete('opportunities')) {
      return {
        success: false,
        message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Opportunities.`,
      };
    }
    const opp = opportunities.find((o) => o.id === opportunityId);
    if (!opp) return { success: false, message: 'Opportunity not found.' };

    if (opp.isConvertedToOrder && opp.convertedSalesOrderId) {
      const linkedOrder = orders.find((o) => o.id === opp.convertedSalesOrderId);
      if (linkedOrder) {
        return {
          success: false,
          message: `Cannot delete Opportunity ${opp.opportunityNumber}: It is already converted to active Sales Order ${linkedOrder.orderNumber}. Delete the order first if needed.`,
        };
      }
    }

    setOpportunities((prev) => prev.filter((o) => o.id !== opportunityId));
    if (opp.leadId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === opp.leadId && l.convertedOpportunityId === opp.id
            ? { ...l, convertedOpportunityId: undefined, convertedOpportunityNumber: undefined }
            : l
        )
      );
    }

    addAuditLog({
      entityType: 'Opportunity',
      entityId: opp.id,
      entityNumber: opp.opportunityNumber,
      action: 'Deleted',
      description: `Opportunity ${opp.opportunityNumber} (${opp.opportunityName}) deleted by ${currentUser.name}.`,
    });

    return {
      success: true,
      message: `Opportunity ${opp.opportunityNumber} was successfully deleted.`,
    };
  };

  // Sales Order Management
  const addOrder = (orderData: {
    customerId: string;
    contactId?: string;
    leadReferenceId?: string;
    opportunityReferenceId?: string;
    paymentTermsId: string;
    deliveryDate?: string;
    billingAddress: CustomerAddress;
    shippingAddress: CustomerAddress;
    items: Array<{ productId: string; quantity: number; discountPercent: number }>;
    remarks?: string;
    milestonePercentages?: number[];
  }): SalesOrder => {
    const customer = customers.find((c) => c.id === orderData.customerId);
    if (!customer) throw new Error('Customer not found');

    const nextOrderSeq = orders.length + 1;
    const orderNumber = `SO-2026-${String(nextOrderSeq).padStart(5, '0')}`;
    const pTerm = paymentTerms.find((p) => p.id === orderData.paymentTermsId) || paymentTerms[0];

    const supplierStateCode = SUPPLIER_COMPANY.stateCode; // "07" Delhi
    const customerStateCode = orderData.billingAddress.stateCode || getStateCode(orderData.billingAddress.state);
    const isInterState = supplierStateCode !== customerStateCode;

    // Calculate line items
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const items: SalesOrderItem[] = orderData.items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      if (!prod) throw new Error(`Product ${it.productId} not found`);

      const lineSubtotal = prod.sellingPrice * it.quantity;
      const discountAmount = (lineSubtotal * (it.discountPercent || 0)) / 100;
      const taxableAmount = lineSubtotal - discountAmount;
      const gstRate = prod.gstRate;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = (taxableAmount * gstRate) / 100;
      } else {
        cgst = (taxableAmount * (gstRate / 2)) / 100;
        sgst = (taxableAmount * (gstRate / 2)) / 100;
      }

      const totalTax = cgst + sgst + igst;
      const lineTotal = taxableAmount + totalTax;

      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      totalTaxable += taxableAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      return {
        id: `soi-${Date.now()}-${idx}`,
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        description: prod.description,
        uom: prod.uom,
        hsnSac: prod.hsnSac,
        quantity: it.quantity,
        unitRate: prod.sellingPrice,
        discountPercent: it.discountPercent || 0,
        discountAmount,
        taxableAmount,
        gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalTax,
        lineTotal,
      };
    });

    const totalTax = totalCgst + totalSgst + totalIgst;
    const grandTotal = totalTaxable + totalTax;

    const linkedLead = orderData.leadReferenceId
      ? leads.find((l) => l.id === orderData.leadReferenceId)
      : undefined;

    const linkedOpportunity = orderData.opportunityReferenceId
      ? opportunities.find((o) => o.id === orderData.opportunityReferenceId)
      : linkedLead
      ? opportunities.find((o) => o.leadId === linkedLead.id)
      : undefined;

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      orderDate: todayStr,
      deliveryDate: orderData.deliveryDate,
      customerId: customer.id,
      customerName: customer.name,
      contactId: orderData.contactId,
      leadReferenceId: linkedLead?.id || linkedOpportunity?.leadId,
      leadReferenceNumber: linkedLead?.leadNumber || linkedOpportunity?.leadNumber,
      opportunityReferenceId: linkedOpportunity?.id,
      opportunityReferenceNumber: linkedOpportunity?.opportunityNumber,
      salespersonId: currentUser.id,
      salespersonName: currentUser.name,
      paymentTermsId: pTerm.id,
      paymentTermsName: pTerm.name,
      currency: customer.currency || 'INR',
      billingAddress: orderData.billingAddress,
      shippingAddress: orderData.shippingAddress,
      isInterState,
      supplierStateCode,
      subtotal,
      totalDiscount,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      grandTotal,
      status: 'Pending Approval',
      remarks: orderData.remarks,
      items,
      createdAt: now,
      updatedAt: now,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Generate Default Milestones satisfying 100% and matching Grand Total!
    const percentages = orderData.milestonePercentages || [30, 40, 20, 10];
    const generatedMilestones: PaymentMilestone[] = [];
    const milestoneLabels = [
      'Project Kickoff & Advance',
      'Delivery / Core Implementation',
      'User Acceptance Testing (UAT)',
      'Final Sign-off & Handover',
    ];

    let allocatedAmount = 0;
    percentages.forEach((pct, idx) => {
      // Calculate amount for milestone, rounding correctly and adjusting final milestone for penny difference
      let mAmount = Math.round((grandTotal * pct) / 100);
      if (idx === percentages.length - 1) {
        mAmount = grandTotal - allocatedAmount;
      } else {
        allocatedAmount += mAmount;
      }

      // Stagger due dates 30, 60, 90, 120 days
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + (idx + 1) * 30);
      const dueDate = dueDateObj.toISOString().split('T')[0];

      generatedMilestones.push({
        id: `mls-${Date.now()}-${idx}`,
        salesOrderId: newOrder.id,
        salesOrderNumber: newOrder.orderNumber,
        customerId: customer.id,
        customerName: customer.name,
        milestoneCode: `M${idx + 1}`,
        description: milestoneLabels[idx] || `Milestone ${idx + 1}`,
        percentage: pct,
        amount: mAmount,
        dueDate,
        status: 'Upcoming',
        invoicedAmount: 0,
        paidAmount: 0,
      });
    });

    setMilestones((prev) => [...prev, ...generatedMilestones]);

    addAuditLog({
      entityType: 'SalesOrder',
      entityId: newOrder.id,
      entityNumber: newOrder.orderNumber,
      action: 'Created',
      description: `Sales Order created for ${customer.name} with value ${formatCurrency(grandTotal)}`,
    });

    addNotification({
      type: 'ORDER',
      title: 'Sales Order Needs Approval',
      message: `${newOrder.orderNumber} for ${customer.name} submitted for review`,
      timestamp: 'Just now',
      linkType: 'order',
      linkId: newOrder.id,
    });

    return newOrder;
  };

  const updateOrderStatus = (id: string, status: SalesOrderStatus, remarks?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status,
            approvedById: status === 'Approved' ? currentUser.id : o.approvedById,
            approvedByName: status === 'Approved' ? currentUser.name : o.approvedByName,
            approvedAt: status === 'Approved' ? new Date().toISOString() : o.approvedAt,
            approvalRemarks: remarks || o.approvalRemarks,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    const order = orders.find((o) => o.id === id);
    if (order) {
      addAuditLog({
        entityType: 'SalesOrder',
        entityId: id,
        entityNumber: order.orderNumber,
        action: status === 'Approved' ? 'Approved' : 'Status Changed',
        description: `Order status updated to ${status}${remarks ? `: ${remarks}` : ''}`,
      });
    }
  };

  // Milestone Validation & Updating
  const updateOrderMilestones = (orderId: string, updatedMilestones: PaymentMilestone[]): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    // Strict validation requirement: Total percentage must equal 100% and total amount must equal grand total!
    const totalPercentage = updatedMilestones.reduce((acc, m) => acc + Number(m.percentage), 0);
    const totalAmount = updatedMilestones.reduce((acc, m) => acc + Number(m.amount), 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      addNotification({
        type: 'MILESTONE',
        title: 'Milestone Validation Error',
        message: `Total milestone percentage must equal 100%. Currently: ${totalPercentage}%`,
        timestamp: 'Just now',
        linkType: 'order',
        linkId: orderId,
      });
      return false;
    }

    if (Math.abs(totalAmount - order.grandTotal) > 1.0) {
      addNotification({
        type: 'MILESTONE',
        title: 'Milestone Validation Error',
        message: `Total milestone amount (₹${totalAmount.toLocaleString()}) must match Order Grand Total (₹${order.grandTotal.toLocaleString()}).`,
        timestamp: 'Just now',
        linkType: 'order',
        linkId: orderId,
      });
      return false;
    }

    // Replace old milestones for this order with new ones
    setMilestones((prev) => [...prev.filter((m) => m.salesOrderId !== orderId), ...updatedMilestones]);

    addAuditLog({
      entityType: 'Milestone',
      entityId: orderId,
      entityNumber: order.orderNumber,
      action: 'Updated',
      description: `Milestone schedule revised for order ${order.orderNumber}`,
    });

    return true;
  };

  // Helper: map milestone index/code to default PaymentStage
  const resolveMilestoneStage = (milestoneCode?: string): Invoice['paymentStage'] => {
    if (!milestoneCode) return 'Milestone';
    if (milestoneCode === 'M1') return 'Advance';
    if (milestoneCode === 'M2') return 'Delivery';
    if (milestoneCode === 'M3') return 'UAT / Go-Live';
    return 'Final Settlement';
  };

  // Milestone to Proforma Invoice Generator
  const generateProformaFromMilestone = (
    milestoneId: string,
    paymentStage?: Invoice['paymentStage']
  ): Invoice | null => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    const order = orders.find((o) => o.id === milestone.salesOrderId);
    if (!order) return null;

    const customer = customers.find((c) => c.id === milestone.customerId);
    if (!customer) return null;

    if (milestone.proformaInvoiceId) {
      const existingPi = invoices.find(
        (i) => i.id === milestone.proformaInvoiceId && i.status !== 'Cancelled'
      );
      if (existingPi) {
        return existingPi;
      }
    }

    const piCount = invoices.filter((i) => i.invoiceType === 'Proforma').length + 1;
    const invoiceNumber = `PI-2026-${String(piCount).padStart(5, '0')}`;
    const now = new Date().toISOString();
    const invoiceDate = now.split('T')[0];

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 15);
    const dueDate = milestone.dueDate || dueDateObj.toISOString().split('T')[0];

    const taxRatio = order.totalTax / order.grandTotal;
    const milestoneTotalTax = Math.round(milestone.amount * taxRatio);
    const milestoneTaxable = milestone.amount - milestoneTotalTax;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (order.isInterState) {
      igst = milestoneTotalTax;
    } else {
      cgst = Math.round(milestoneTotalTax / 2);
      sgst = milestoneTotalTax - cgst;
    }

    const item: InvoiceItem = {
      id: `invi-pi-${Date.now()}`,
      productName: `${order.items[0]?.productName || 'Project Service'} - ${milestone.milestoneCode} (${milestone.percentage}%)`,
      description: `${milestone.milestoneCode}: ${milestone.description}`,
      hsnSac: order.items[0]?.hsnSac || '998313',
      uom: 'Lot',
      quantity: 1,
      unitRate: milestoneTaxable,
      taxableAmount: milestoneTaxable,
      gstRate: order.items[0]?.gstRate || 18,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax: milestoneTotalTax,
      lineTotal: milestone.amount,
    };

    const newProforma: Invoice = {
      id: `pi-${Date.now()}`,
      invoiceNumber,
      invoiceType: 'Proforma',
      invoiceDate,
      dueDate,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      salesOrderId: order.id,
      salesOrderNumber: order.orderNumber,
      milestoneId: milestone.id,
      milestoneCode: milestone.milestoneCode,
      paymentStage: paymentStage || resolveMilestoneStage(milestone.milestoneCode),
      isShared: false,
      isInterState: order.isInterState,
      paymentTermsName: order.paymentTermsName,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      subtotalTaxable: milestoneTaxable,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: igst,
      totalTax: milestoneTotalTax,
      grandTotal: milestone.amount,
      paidAmount: milestone.paidAmount || 0,
      balanceAmount: Math.max(0, milestone.amount - (milestone.paidAmount || 0)),
      status: 'Issued',
      items: [item],
      bankDetails: SUPPLIER_COMPANY.bankDetails,
      notes: `Proforma Invoice issued against Sales Order ${order.orderNumber} - Milestone ${milestone.milestoneCode}`,
      createdAt: now,
      updatedAt: now,
    };

    setInvoices((prev) => [newProforma, ...prev]);

    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              proformaInvoiceId: newProforma.id,
              proformaInvoiceNumber: newProforma.invoiceNumber,
              status: m.status === 'Upcoming' ? 'Due' : m.status,
            }
          : m
      )
    );

    addAuditLog({
      entityType: 'Invoice',
      entityId: newProforma.id,
      entityNumber: newProforma.invoiceNumber,
      action: 'Created',
      description: `Proforma Invoice ${newProforma.invoiceNumber} generated for Milestone ${milestone.milestoneCode} of ${order.orderNumber} (${formatCurrency(milestone.amount)})`,
    });

    addNotification({
      type: 'INVOICE',
      title: 'Proforma Invoice Generated',
      message: `${newProforma.invoiceNumber} created for ${customer.name} (${milestone.milestoneCode})`,
      timestamp: 'Just now',
      linkType: 'invoice',
      linkId: newProforma.id,
    });

    return newProforma;
  };

  // Convert Proforma Invoice -> GST Tax Invoice
  const convertProformaToTaxInvoice = (proformaId: string): Invoice | null => {
    const proforma = invoices.find((i) => i.id === proformaId && i.invoiceType === 'Proforma');
    if (!proforma) return null;

    if (proforma.convertedToTaxInvoiceId) {
      const existingTax = invoices.find((i) => i.id === proforma.convertedToTaxInvoiceId);
      if (existingTax) return existingTax;
    }

    const taxInvCount = invoices.filter((i) => i.invoiceType !== 'Proforma').length + 48;
    const invoiceNumber = `CSINV-${String(taxInvCount).padStart(5, '0')}`;
    const now = new Date().toISOString();
    const invoiceDate = now.split('T')[0];

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 15);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const newTaxInvoice: Invoice = {
      ...proforma,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceType: 'Tax',
      invoiceDate,
      dueDate,
      proformaInvoiceId: proforma.id,
      proformaInvoiceNumber: proforma.invoiceNumber,
      isShared: false,
      sharedAt: undefined,
      sharedBy: undefined,
      status:
        proforma.paidAmount >= proforma.grandTotal
          ? 'Paid'
          : proforma.paidAmount > 0
          ? 'Partially Paid'
          : 'Issued',
      notes: `Created from Proforma ${proforma.invoiceNumber}. ${proforma.notes || ''}`.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setInvoices((prev) => [
      newTaxInvoice,
      ...prev.map((inv) =>
        inv.id === proforma.id
          ? {
              ...inv,
              status: 'Converted' as Invoice['status'],
              convertedToTaxInvoiceId: newTaxInvoice.id,
              convertedToTaxInvoiceNumber: newTaxInvoice.invoiceNumber,
              updatedAt: now,
            }
          : inv
      ),
    ]);

    // Sync linked Change Request if applicable
    if (proforma.changeRequestId) {
      setChangeRequests((prev) =>
        prev.map((cr) =>
          cr.id === proforma.changeRequestId
            ? {
                ...cr,
                taxInvoiceId: newTaxInvoice.id,
                taxInvoiceNumber: newTaxInvoice.invoiceNumber,
                status: 'Invoiced',
                updatedAt: now,
              }
            : cr
        )
      );
    }

    // Sync linked AMC Contract if applicable
    if (proforma.amcContractId) {
      setAmcContracts((prev) =>
        prev.map((amc) =>
          amc.id === proforma.amcContractId
            ? {
                ...amc,
                linkedInvoiceId: newTaxInvoice.id,
                linkedInvoiceNumber: newTaxInvoice.invoiceNumber,
                status: 'Active',
                updatedAt: now,
              }
            : amc
        )
      );
    }

    // Sync linked Support Ticket if applicable
    if (proforma.ticketId) {
      setSupportTickets((prev) =>
        prev.map((tkt) =>
          tkt.id === proforma.ticketId
            ? {
                ...tkt,
                linkedInvoiceId: newTaxInvoice.id,
                linkedInvoiceNumber: newTaxInvoice.invoiceNumber,
                updatedAt: now,
              }
            : tkt
        )
      );
    }

    if (proforma.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === proforma.milestoneId
            ? {
                ...m,
                invoicedAmount: newTaxInvoice.grandTotal,
                invoiceId: newTaxInvoice.id,
                invoiceNumber: newTaxInvoice.invoiceNumber,
                status:
                  m.paidAmount >= m.amount
                    ? 'Paid'
                    : m.paidAmount > 0
                    ? 'Partially Paid'
                    : 'Due',
              }
            : m
        )
      );
    }

    // Re-link any payments that were recorded against the Proforma or Milestone
    setPayments((prev) =>
      prev.map((p) => {
        if (p.invoiceId === proforma.id || (proforma.milestoneId && p.milestoneId === proforma.milestoneId && !p.invoiceId)) {
          return {
            ...p,
            invoiceId: newTaxInvoice.id,
            invoiceNumber: newTaxInvoice.invoiceNumber,
          };
        }
        return p;
      })
    );

    // Post Tax Invoice to Customer Ledger (Debit)
    const prevLedger = ledgerEntries.filter((l) => l.customerId === newTaxInvoice.customerId);
    const lastBalance = prevLedger.length > 0 ? prevLedger[prevLedger.length - 1].runningBalance : 0;
    const newRunningBalance = lastBalance + newTaxInvoice.grandTotal;

    const ledgerEntry: CustomerLedgerEntry = {
      id: `ldg-${Date.now()}`,
      customerId: newTaxInvoice.customerId,
      date: invoiceDate,
      type: 'INVOICE',
      referenceNumber: newTaxInvoice.invoiceNumber,
      description: `Tax Invoice (Converted from ${proforma.invoiceNumber})${
        newTaxInvoice.milestoneCode ? ` - ${newTaxInvoice.milestoneCode}` : ''
      }`,
      debit: newTaxInvoice.grandTotal,
      credit: 0,
      runningBalance: newRunningBalance,
      invoiceId: newTaxInvoice.id,
    };

    setLedgerEntries((prev) => [...prev, ledgerEntry]);

    addAuditLog({
      entityType: 'Invoice',
      entityId: newTaxInvoice.id,
      entityNumber: newTaxInvoice.invoiceNumber,
      action: 'Converted',
      description: `Proforma ${proforma.invoiceNumber} converted to Tax Invoice ${newTaxInvoice.invoiceNumber} (${formatCurrency(newTaxInvoice.grandTotal)})`,
    });

    addNotification({
      type: 'INVOICE',
      title: 'Tax Invoice Generated from Proforma',
      message: `${proforma.invoiceNumber} converted into ${newTaxInvoice.invoiceNumber}`,
      timestamp: 'Just now',
      linkType: 'invoice',
      linkId: newTaxInvoice.id,
    });

    return newTaxInvoice;
  };

  // Milestone to Tax Invoice Generator
  const generateInvoiceFromMilestone = (
    milestoneId: string,
    paymentStage?: Invoice['paymentStage']
  ): Invoice | null => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    // If a Proforma already exists for this milestone and is not converted, convert it directly!
    if (milestone.proformaInvoiceId && !milestone.invoiceId) {
      const existingPi = invoices.find(
        (i) => i.id === milestone.proformaInvoiceId && i.status !== 'Cancelled'
      );
      if (existingPi) {
        return convertProformaToTaxInvoice(existingPi.id);
      }
    }

    const order = orders.find((o) => o.id === milestone.salesOrderId);
    if (!order) return null;

    const customer = customers.find((c) => c.id === milestone.customerId);
    if (!customer) return null;

    if (milestone.invoiceId && milestone.invoicedAmount >= milestone.amount) {
      const existingInv = invoices.find((i) => i.id === milestone.invoiceId && i.status !== 'Cancelled');
      if (existingInv) return existingInv;
    }

    const taxInvCount = invoices.filter((i) => i.invoiceType !== 'Proforma').length + 1;
    const invoiceNumber = `INV-2026-${String(taxInvCount).padStart(5, '0')}`;
    const now = new Date().toISOString();
    const invoiceDate = now.split('T')[0];

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 15);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Compute taxable and tax proportionally for the milestone amount
    const taxRatio = order.totalTax / order.grandTotal;
    const milestoneTotalTax = Math.round(milestone.amount * taxRatio);
    const milestoneTaxable = milestone.amount - milestoneTotalTax;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (order.isInterState) {
      igst = milestoneTotalTax;
    } else {
      cgst = Math.round(milestoneTotalTax / 2);
      sgst = milestoneTotalTax - cgst;
    }

    const item: InvoiceItem = {
      id: `invi-${Date.now()}`,
      productName: `${order.items[0]?.productName || 'Project Service'} - ${milestone.milestoneCode} (${milestone.percentage}%)`,
      description: `${milestone.milestoneCode}: ${milestone.description}`,
      hsnSac: order.items[0]?.hsnSac || '998313',
      uom: 'Lot',
      quantity: 1,
      unitRate: milestoneTaxable,
      taxableAmount: milestoneTaxable,
      gstRate: order.items[0]?.gstRate || 18,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax: milestoneTotalTax,
      lineTotal: milestone.amount,
    };

    const alreadyPaid = milestone.paidAmount || 0;
    const balance = Math.max(0, milestone.amount - alreadyPaid);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceType: 'Tax',
      invoiceDate,
      dueDate,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      salesOrderId: order.id,
      salesOrderNumber: order.orderNumber,
      milestoneId: milestone.id,
      milestoneCode: milestone.milestoneCode,
      paymentStage: paymentStage || resolveMilestoneStage(milestone.milestoneCode),
      isShared: false,
      isInterState: order.isInterState,
      paymentTermsName: order.paymentTermsName,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      subtotalTaxable: milestoneTaxable,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: igst,
      totalTax: milestoneTotalTax,
      grandTotal: milestone.amount,
      paidAmount: alreadyPaid,
      balanceAmount: balance,
      status: balance <= 0 ? 'Paid' : alreadyPaid > 0 ? 'Partially Paid' : 'Issued',
      items: [item],
      bankDetails: SUPPLIER_COMPANY.bankDetails,
      notes: `Invoice issued against Sales Order ${order.orderNumber} - Milestone ${milestone.milestoneCode}`,
      createdAt: now,
      updatedAt: now,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Update milestone invoicedAmount and link invoice
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              invoicedAmount: milestone.amount,
              invoiceId: newInvoice.id,
              invoiceNumber: newInvoice.invoiceNumber,
              status: m.paidAmount >= m.amount ? 'Paid' : m.paidAmount > 0 ? 'Partially Paid' : 'Due',
            }
          : m
      )
    );

    // Append to Customer Ledger: INVOICE (Debit - increases customer balance)
    const prevLedger = ledgerEntries.filter((l) => l.customerId === customer.id);
    const lastBalance = prevLedger.length > 0 ? prevLedger[prevLedger.length - 1].runningBalance : 0;
    const newRunningBalance = lastBalance + milestone.amount;

    const ledgerEntry: CustomerLedgerEntry = {
      id: `ldg-${Date.now()}`,
      customerId: customer.id,
      date: invoiceDate,
      type: 'INVOICE',
      referenceNumber: newInvoice.invoiceNumber,
      description: `Invoice for ${milestone.milestoneCode}: ${milestone.description}`,
      debit: milestone.amount,
      credit: 0,
      runningBalance: newRunningBalance,
      invoiceId: newInvoice.id,
    };

    setLedgerEntries((prev) => [...prev, ledgerEntry]);

    addAuditLog({
      entityType: 'Invoice',
      entityId: newInvoice.id,
      entityNumber: newInvoice.invoiceNumber,
      action: 'Created',
      description: `Invoice generated for Milestone ${milestone.milestoneCode} of ${order.orderNumber} (${formatCurrency(milestone.amount)})`,
    });

    addNotification({
      type: 'INVOICE',
      title: 'Tax Invoice Issued',
      message: `${newInvoice.invoiceNumber} generated for ${customer.name}`,
      timestamp: 'Just now',
      linkType: 'invoice',
      linkId: newInvoice.id,
    });

    return newInvoice;
  };

  const createInvoiceDirect = (
    invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'balanceAmount' | 'createdAt' | 'updatedAt'>
  ): Invoice => {
    const isProforma = invoiceData.invoiceType === 'Proforma';
    const seq = isProforma
      ? invoices.filter((i) => i.invoiceType === 'Proforma').length + 36
      : invoices.filter((i) => i.invoiceType !== 'Proforma').length + 48;
    const invoiceNumber = `${isProforma ? 'CSPI' : 'CSINV'}-${String(seq).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newInvoice: Invoice = {
      id: `${isProforma ? 'pi' : 'inv'}-${Date.now()}`,
      invoiceNumber,
      invoiceType: invoiceData.invoiceType || 'Tax',
      paidAmount: 0,
      balanceAmount: invoiceData.grandTotal,
      supplyType: invoiceData.customerGstin ? 'B2B' : 'B2C',
      reverseCharge: 'No',
      ...invoiceData,
      bankDetails: SUPPLIER_COMPANY.bankDetails,
      createdAt: now,
      updatedAt: now,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Sync with AMC Contract if amcContractId was provided
    if (newInvoice.amcContractId) {
      setAmcContracts((prev) =>
        prev.map((amc) =>
          amc.id === newInvoice.amcContractId
            ? {
                ...amc,
                linkedInvoiceId: newInvoice.id,
                linkedInvoiceNumber: newInvoice.invoiceNumber,
                status: 'Active',
                updatedAt: now,
              }
            : amc
        )
      );
    }

    // Sync with Change Request if changeRequestId was provided
    if (newInvoice.changeRequestId) {
      setChangeRequests((prev) =>
        prev.map((cr) => {
          if (cr.id !== newInvoice.changeRequestId) return cr;
          if (isProforma) {
            return {
              ...cr,
              proformaInvoiceId: newInvoice.id,
              proformaInvoiceNumber: newInvoice.invoiceNumber,
              updatedAt: now,
            };
          }
          return {
            ...cr,
            taxInvoiceId: newInvoice.id,
            taxInvoiceNumber: newInvoice.invoiceNumber,
            status: 'Invoiced',
            updatedAt: now,
          };
        })
      );
    }

    // Sync with Support Ticket if ticketId was provided
    if (newInvoice.ticketId) {
      setSupportTickets((prev) =>
        prev.map((tkt) =>
          tkt.id === newInvoice.ticketId
            ? {
                ...tkt,
                linkedInvoiceId: newInvoice.id,
                linkedInvoiceNumber: newInvoice.invoiceNumber,
                updatedAt: now,
              }
            : tkt
        )
      );
    }

    // Link to CRM Milestone if milestoneId (crm_milestone_id) was provided
    if (newInvoice.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== newInvoice.milestoneId) return m;
          if (isProforma) {
            return {
              ...m,
              proformaInvoiceId: newInvoice.id,
              proformaInvoiceNumber: newInvoice.invoiceNumber,
              status: m.status === 'Upcoming' ? 'Due' : m.status,
            };
          }
          return {
            ...m,
            invoicedAmount: newInvoice.grandTotal,
            invoiceId: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            status: m.paidAmount >= m.amount ? 'Paid' : m.paidAmount > 0 ? 'Partially Paid' : 'Due',
          };
        })
      );
    }

    // Append to Customer Ledger only for statutory Tax Invoices
    if (!isProforma) {
      const prevLedger = ledgerEntries.filter((l) => l.customerId === newInvoice.customerId);
      const lastBalance = prevLedger.length > 0 ? prevLedger[prevLedger.length - 1].runningBalance : 0;
      const newRunningBalance = lastBalance + newInvoice.grandTotal;

      const ledgerEntry: CustomerLedgerEntry = {
        id: `ldg-${Date.now()}`,
        customerId: newInvoice.customerId,
        date: newInvoice.invoiceDate,
        type: 'INVOICE',
        referenceNumber: newInvoice.invoiceNumber,
        description: `Tax Invoice issued: ${newInvoice.notes || newInvoice.paymentStage || 'Direct Invoice'}`,
        debit: newInvoice.grandTotal,
        credit: 0,
        runningBalance: newRunningBalance,
        invoiceId: newInvoice.id,
      };

      setLedgerEntries((prev) => [...prev, ledgerEntry]);
    }

    addAuditLog({
      entityType: 'Invoice',
      entityId: newInvoice.id,
      entityNumber: newInvoice.invoiceNumber,
      action: 'Created',
      description: `${isProforma ? 'Proforma' : 'Tax'} invoice ${newInvoice.invoiceNumber} created for ${newInvoice.customerName} (${formatCurrency(newInvoice.grandTotal)})`,
    });

    return newInvoice;
  };

  // mark_shared operation
  const markInvoiceShared = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    const nowFormatted = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              isShared: true,
              sharedAt: nowFormatted,
              sharedBy: currentUser.name,
              updatedAt: new Date().toISOString(),
            }
          : inv
      )
    );

    if (target.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === target.milestoneId ? { ...m, isShared: true } : m))
      );
    }

    addAuditLog({
      entityType: 'Invoice',
      entityId: target.id,
      entityNumber: target.invoiceNumber,
      action: 'Status Changed',
      description: `${target.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'} Invoice ${target.invoiceNumber} marked as shared with client (${target.customerName})`,
    });
  };

  // Helper to recalculate running balances for a customer's ledger
  const recomputeLedgerBalances = (entries: CustomerLedgerEntry[], customerId: string): CustomerLedgerEntry[] => {
    let running = 0;
    return entries.map((e) => {
      if (e.customerId !== customerId) return e;
      running = running + (e.debit || 0) - (e.credit || 0);
      return { ...e, runningBalance: running };
    });
  };

  // update_invoice operation (supports editing Tax & Proforma Invoices even after payment record entries)
  const updateInvoice = (
    invoiceId: string,
    invoiceData: Partial<Invoice>
  ): { success: boolean; message: string; invoice?: Invoice } => {
    if (!canEdit('invoices')) {
      return {
        success: false,
        message: `Permission Denied: Your role (${currentUser.role}) does not have edit rights for Invoices.`,
      };
    }

    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) {
      return { success: false, message: 'Invoice not found.' };
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    // Find all payment receipts linked to this invoice (including via proforma or milestone)
    const linkedPayments = payments.filter(
      (p) =>
        (p.invoiceId && p.invoiceId === invoiceId) ||
        (p.invoiceNumber && p.invoiceNumber === target.invoiceNumber) ||
        (target.proformaInvoiceId && p.invoiceId === target.proformaInvoiceId) ||
        (target.milestoneId && p.milestoneId && p.milestoneId === target.milestoneId)
    );
    const paidFromReceipts = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
    const effectivePaidAmount =
      invoiceData.paidAmount !== undefined
        ? invoiceData.paidAmount
        : linkedPayments.length > 0
        ? paidFromReceipts
        : target.paidAmount;

    const nextGrandTotal =
      invoiceData.grandTotal !== undefined ? invoiceData.grandTotal : target.grandTotal;
    const nextDueDate = invoiceData.dueDate || target.dueDate;
    const nextBalanceAmount = Math.max(0, nextGrandTotal - effectivePaidAmount);

    let nextStatus: Invoice['status'] = invoiceData.status || target.status;
    if (nextStatus !== 'Cancelled' && nextStatus !== 'Converted') {
      if (nextBalanceAmount <= 0 && nextGrandTotal > 0) {
        nextStatus = 'Paid';
      } else if (effectivePaidAmount > 0) {
        nextStatus = 'Partially Paid';
      } else if (nextDueDate < todayStr) {
        nextStatus = 'Overdue';
      } else {
        nextStatus = 'Issued';
      }
    }

    const updatedInvoice: Invoice = {
      ...target,
      ...invoiceData,
      paidAmount: effectivePaidAmount,
      balanceAmount: nextBalanceAmount,
      status: nextStatus,
      supplyType: (invoiceData.customerGstin ?? target.customerGstin) ? 'B2B' : 'B2C',
      updatedAt: nowIso,
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) return updatedInvoice;
        if (inv.convertedToTaxInvoiceId === invoiceId) {
          return {
            ...inv,
            convertedToTaxInvoiceNumber: updatedInvoice.invoiceNumber,
            updatedAt: nowIso,
          };
        }
        if (inv.proformaInvoiceId === invoiceId) {
          return {
            ...inv,
            proformaInvoiceNumber: updatedInvoice.invoiceNumber,
            updatedAt: nowIso,
          };
        }
        return inv;
      })
    );

    // Recalculate running remainingBalance and sync metadata on linked payment receipts
    if (linkedPayments.length > 0) {
      let runningPaid = 0;
      const linkedIds = new Set(linkedPayments.map((p) => p.id));
      const chronologicalIds = [...linkedPayments]
        .sort(
          (a, b) =>
            a.paymentDate.localeCompare(b.paymentDate) ||
            a.createdAt.localeCompare(b.createdAt)
        )
        .map((p) => p.id);
      const remainingMap = new Map<string, number>();
      for (const pid of chronologicalIds) {
        const pObj = linkedPayments.find((p) => p.id === pid)!;
        runningPaid += pObj.amount;
        remainingMap.set(pid, Math.max(0, nextGrandTotal - runningPaid));
      }

      setPayments((prev) =>
        prev.map((p) => {
          if (!linkedIds.has(p.id)) return p;
          return {
            ...p,
            invoiceNumber:
              p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber
                ? updatedInvoice.invoiceNumber
                : p.invoiceNumber,
            customerId: updatedInvoice.customerId,
            customerName: updatedInvoice.customerName,
            paymentStage: updatedInvoice.paymentStage || p.paymentStage,
            remainingBalance: remainingMap.get(p.id) ?? p.remainingBalance,
          };
        })
      );
    }

    // Sync linked CRM Milestone
    if (updatedInvoice.milestoneId || target.milestoneId) {
      const targetMsId = updatedInvoice.milestoneId || target.milestoneId;
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== targetMsId) return m;
          if (updatedInvoice.invoiceType === 'Proforma') {
            return {
              ...m,
              proformaInvoiceId: updatedInvoice.id,
              proformaInvoiceNumber: updatedInvoice.invoiceNumber,
            };
          }
          return {
            ...m,
            invoicedAmount: updatedInvoice.grandTotal,
            invoiceId: updatedInvoice.id,
            invoiceNumber: updatedInvoice.invoiceNumber,
            status:
              m.paidAmount >= m.amount
                ? 'Paid'
                : m.paidAmount > 0
                ? 'Partially Paid'
                : 'Due',
          };
        })
      );
    }

    // Sync linked AMC Contract, Change Request, Support Ticket
    if (updatedInvoice.amcContractId) {
      setAmcContracts((prev) =>
        prev.map((amc) =>
          amc.id === updatedInvoice.amcContractId
            ? {
                ...amc,
                linkedInvoiceId: updatedInvoice.id,
                linkedInvoiceNumber: updatedInvoice.invoiceNumber,
                updatedAt: nowIso,
              }
            : amc
        )
      );
    }
    if (updatedInvoice.changeRequestId) {
      setChangeRequests((prev) =>
        prev.map((cr) => {
          if (cr.id !== updatedInvoice.changeRequestId) return cr;
          if (updatedInvoice.invoiceType === 'Proforma') {
            return {
              ...cr,
              proformaInvoiceId: updatedInvoice.id,
              proformaInvoiceNumber: updatedInvoice.invoiceNumber,
              updatedAt: nowIso,
            };
          }
          return {
            ...cr,
            taxInvoiceId: updatedInvoice.id,
            taxInvoiceNumber: updatedInvoice.invoiceNumber,
            updatedAt: nowIso,
          };
        })
      );
    }
    if (updatedInvoice.ticketId) {
      setSupportTickets((prev) =>
        prev.map((tkt) =>
          tkt.id === updatedInvoice.ticketId
            ? {
                ...tkt,
                linkedInvoiceId: updatedInvoice.id,
                linkedInvoiceNumber: updatedInvoice.invoiceNumber,
                updatedAt: nowIso,
              }
            : tkt
        )
      );
    }

    // Sync Customer Ledger Entry for Tax Invoices
    setLedgerEntries((prev) => {
      if (updatedInvoice.invoiceType === 'Proforma') {
        const filtered = prev.filter((l) => l.invoiceId !== invoiceId);
        return recomputeLedgerBalances(filtered, target.customerId);
      }

      const existingIdx = prev.findIndex((l) => l.invoiceId === invoiceId);
      let nextEntries: CustomerLedgerEntry[];
      if (existingIdx >= 0) {
        nextEntries = prev.map((l) =>
          l.invoiceId === invoiceId
            ? {
                ...l,
                customerId: updatedInvoice.customerId,
                date: updatedInvoice.invoiceDate,
                referenceNumber: updatedInvoice.invoiceNumber,
                description: `Tax Invoice: ${
                  updatedInvoice.notes || updatedInvoice.paymentStage || 'Updated Invoice'
                }`,
                debit: updatedInvoice.grandTotal,
              }
            : l
        );
      } else {
        const newLedgerEntry: CustomerLedgerEntry = {
          id: `ldg-${Date.now()}`,
          customerId: updatedInvoice.customerId,
          date: updatedInvoice.invoiceDate,
          type: 'INVOICE',
          referenceNumber: updatedInvoice.invoiceNumber,
          description: `Tax Invoice: ${
            updatedInvoice.notes || updatedInvoice.paymentStage || 'Issued Invoice'
          }`,
          debit: updatedInvoice.grandTotal,
          credit: 0,
          runningBalance: 0,
          invoiceId: updatedInvoice.id,
        };
        nextEntries = [...prev, newLedgerEntry];
      }

      let recomputed = recomputeLedgerBalances(nextEntries, updatedInvoice.customerId);
      if (target.customerId !== updatedInvoice.customerId) {
        recomputed = recomputeLedgerBalances(recomputed, target.customerId);
      }
      return recomputed;
    });

    addAuditLog({
      entityType: 'Invoice',
      entityId: updatedInvoice.id,
      entityNumber: updatedInvoice.invoiceNumber,
      action: 'Updated',
      description: `${
        updatedInvoice.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'
      } Invoice ${updatedInvoice.invoiceNumber} updated (${formatCurrency(
        updatedInvoice.grandTotal
      )})${
        linkedPayments.length > 0
          ? ` with ${linkedPayments.length} payment record(s) reconciled`
          : ''
      }`,
    });

    return {
      success: true,
      message: `${
        updatedInvoice.invoiceType === 'Proforma' ? 'Proforma' : 'Tax'
      } Invoice ${updatedInvoice.invoiceNumber} updated and balances recalculated.`,
      invoice: updatedInvoice,
    };
  };

  // cancel_invoice operation (allowed even after payment record entry)
  const cancelInvoice = (invoiceId: string, reason?: string): { success: boolean; message: string } => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return { success: false, message: 'Invoice not found.' };
    if (target.status === 'Cancelled') {
      return { success: false, message: 'Invoice is already cancelled.' };
    }

    const linkedPayments = payments.filter(
      (p) => p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber
    );
    const nowIso = new Date().toISOString();

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'Cancelled',
              balanceAmount: 0,
              cancellationReason: reason || 'Cancelled by Finance',
              cancelledAt: nowIso.split('T')[0],
              updatedAt: nowIso,
            }
          : inv
      )
    );

    if (linkedPayments.length > 0) {
      setPayments((prev) =>
        prev.map((p) =>
          p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber
            ? {
                ...p,
                invoiceId: undefined,
                invoiceNumber: undefined,
                remainingBalance: 0,
              }
            : p
        )
      );
    }

    if (target.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== target.milestoneId) return m;
          if (target.invoiceType === 'Proforma') {
            return {
              ...m,
              proformaInvoiceId: undefined,
              proformaInvoiceNumber: undefined,
            };
          }
          return {
            ...m,
            invoicedAmount: 0,
            invoiceId: undefined,
            invoiceNumber: undefined,
            status: m.paidAmount > 0 ? 'Partially Paid' : 'Upcoming',
          };
        })
      );
    }

    if (target.invoiceType !== 'Proforma') {
      setLedgerEntries((prev) => {
        const filtered = prev.filter((l) => l.invoiceId !== invoiceId);
        return recomputeLedgerBalances(filtered, target.customerId);
      });
    }

    addAuditLog({
      entityType: 'Invoice',
      entityId: target.id,
      entityNumber: target.invoiceNumber,
      action: 'Status Changed',
      description: `Invoice ${target.invoiceNumber} cancelled. Reason: ${reason || 'Cancelled by Finance'}`,
    });

    return {
      success: true,
      message: `${target.invoiceNumber} has been cancelled and milestone/ledger balances updated.`,
    };
  };

  // delete_proforma operation (allowed even after payment record entry or conversion)
  const deleteProformaInvoice = (invoiceId: string): { success: boolean; message: string } => {
    if (!canDelete('invoices')) {
      return {
        success: false,
        message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Invoices.`,
      };
    }
    const target = invoices.find((i) => i.id === invoiceId && i.invoiceType === 'Proforma');
    if (!target) return { success: false, message: 'Proforma Invoice not found.' };

    const linkedPayments = payments.filter(
      (p) => p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber
    );

    setInvoices((prev) =>
      prev
        .filter((i) => i.id !== invoiceId)
        .map((i) =>
          i.proformaInvoiceId === invoiceId
            ? {
                ...i,
                proformaInvoiceId: undefined,
                proformaInvoiceNumber: undefined,
              }
            : i
        )
    );

    if (linkedPayments.length > 0) {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber) {
            if (target.convertedToTaxInvoiceId) {
              return {
                ...p,
                invoiceId: target.convertedToTaxInvoiceId,
                invoiceNumber: target.convertedToTaxInvoiceNumber,
              };
            }
            return {
              ...p,
              invoiceId: undefined,
              invoiceNumber: undefined,
              remainingBalance: 0,
            };
          }
          return p;
        })
      );
    }

    if (target.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === target.milestoneId
            ? {
                ...m,
                proformaInvoiceId: undefined,
                proformaInvoiceNumber: undefined,
              }
            : m
        )
      );
    }

    if (target.changeRequestId) {
      setChangeRequests((prev) =>
        prev.map((cr) =>
          cr.id === target.changeRequestId && cr.proformaInvoiceId === invoiceId
            ? {
                ...cr,
                proformaInvoiceId: undefined,
                proformaInvoiceNumber: undefined,
              }
            : cr
        )
      );
    }

    if (target.amcContractId) {
      setAmcContracts((prev) =>
        prev.map((amc) =>
          amc.id === target.amcContractId && amc.linkedInvoiceId === invoiceId
            ? {
                ...amc,
                linkedInvoiceId: undefined,
                linkedInvoiceNumber: undefined,
              }
            : amc
        )
      );
    }

    if (target.ticketId) {
      setSupportTickets((prev) =>
        prev.map((tkt) =>
          tkt.id === target.ticketId && tkt.linkedInvoiceId === invoiceId
            ? {
                ...tkt,
                linkedInvoiceId: undefined,
                linkedInvoiceNumber: undefined,
              }
            : tkt
        )
      );
    }

    addAuditLog({
      entityType: 'Invoice',
      entityId: target.id,
      entityNumber: target.invoiceNumber,
      action: 'Deleted',
      description: `Proforma Invoice ${target.invoiceNumber} deleted${
        linkedPayments.length > 0
          ? ` (${linkedPayments.length} linked payment receipt(s) retained as On Account)`
          : ''
      }`,
    });

    return {
      success: true,
      message: `Proforma Invoice ${target.invoiceNumber} deleted${
        linkedPayments.length > 0
          ? ` (${linkedPayments.length} payment receipt(s) retained on account)`
          : ''
      }.`,
    };
  };

  // delete_tax_invoice operation (allowed even after payment record entry)
  const deleteTaxInvoice = (invoiceId: string): { success: boolean; message: string } => {
    if (!canDelete('invoices')) {
      return {
        success: false,
        message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Invoices.`,
      };
    }
    const target = invoices.find((i) => i.id === invoiceId && i.invoiceType !== 'Proforma');
    if (!target) return { success: false, message: 'Tax Invoice not found.' };

    const linkedPayments = payments.filter(
      (p) => p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber
    );
    const sourceProforma = target.proformaInvoiceId
      ? invoices.find((i) => i.id === target.proformaInvoiceId)
      : undefined;

    setInvoices((prev) =>
      prev
        .filter((i) => i.id !== invoiceId)
        .map((i) =>
          i.convertedToTaxInvoiceId === invoiceId
            ? {
                ...i,
                status: (i.paidAmount >= i.grandTotal && i.grandTotal > 0
                  ? 'Paid'
                  : i.paidAmount > 0
                  ? 'Partially Paid'
                  : 'Issued') as Invoice['status'],
                convertedToTaxInvoiceId: undefined,
                convertedToTaxInvoiceNumber: undefined,
              }
            : i
        )
    );

    if (linkedPayments.length > 0) {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.invoiceId === invoiceId || p.invoiceNumber === target.invoiceNumber) {
            if (sourceProforma) {
              return {
                ...p,
                invoiceId: sourceProforma.id,
                invoiceNumber: sourceProforma.invoiceNumber,
              };
            }
            return {
              ...p,
              invoiceId: undefined,
              invoiceNumber: undefined,
              remainingBalance: 0,
            };
          }
          return p;
        })
      );
    }

    if (target.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === target.milestoneId
            ? {
                ...m,
                invoicedAmount: 0,
                invoiceId: undefined,
                invoiceNumber: undefined,
                status:
                  m.paidAmount >= m.amount
                    ? 'Paid'
                    : m.paidAmount > 0
                    ? 'Partially Paid'
                    : 'Due',
              }
            : m
        )
      );
    }

    if (target.changeRequestId) {
      setChangeRequests((prev) =>
        prev.map((cr) =>
          cr.id === target.changeRequestId && cr.taxInvoiceId === invoiceId
            ? {
                ...cr,
                taxInvoiceId: undefined,
                taxInvoiceNumber: undefined,
                status: 'Completed',
              }
            : cr
        )
      );
    }

    if (target.amcContractId) {
      setAmcContracts((prev) =>
        prev.map((amc) =>
          amc.id === target.amcContractId && amc.linkedInvoiceId === invoiceId
            ? {
                ...amc,
                linkedInvoiceId: undefined,
                linkedInvoiceNumber: undefined,
              }
            : amc
        )
      );
    }

    if (target.ticketId) {
      setSupportTickets((prev) =>
        prev.map((tkt) =>
          tkt.id === target.ticketId && tkt.linkedInvoiceId === invoiceId
            ? {
                ...tkt,
                linkedInvoiceId: undefined,
                linkedInvoiceNumber: undefined,
              }
            : tkt
        )
      );
    }

    setLedgerEntries((prev) => {
      const filtered = prev.filter((l) => l.invoiceId !== invoiceId);
      return recomputeLedgerBalances(filtered, target.customerId);
    });

    addAuditLog({
      entityType: 'Invoice',
      entityId: target.id,
      entityNumber: target.invoiceNumber,
      action: 'Deleted',
      description: `Tax Invoice ${target.invoiceNumber} deleted and CRM milestone / ledger recalculated${
        linkedPayments.length > 0
          ? ` (${linkedPayments.length} linked payment receipt(s) retained)`
          : ''
      }`,
    });

    return {
      success: true,
      message: `Tax Invoice ${target.invoiceNumber} deleted and balances recalculated${
        linkedPayments.length > 0
          ? ` (${linkedPayments.length} payment receipt(s) retained)`
          : ''
      }.`,
    };
  };

  // delete_order operation
  const deleteOrder = (orderId: string): { success: boolean; message: string } => {
    if (!canDelete('orders')) {
      return { success: false, message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Sales Orders.` };
    }
    const target = orders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'Sales Order not found.' };

    // 1. Guard against linked payment receipts
    const linkedPayments = payments.filter((p) => p.salesOrderId === orderId);
    if (linkedPayments.length > 0) {
      return {
        success: false,
        message: `Cannot delete Sales Order ${target.orderNumber} because ${linkedPayments.length} payment receipt(s) (${linkedPayments.map((p) => p.receiptNumber).join(', ')}) are recorded against it. Delete the payment receipt(s) first.`,
      };
    }

    // 2. Guard against active Tax Invoices
    const linkedActiveTaxInvoices = invoices.filter(
      (i) => i.salesOrderId === orderId && i.invoiceType !== 'Proforma' && i.status !== 'Cancelled'
    );
    if (linkedActiveTaxInvoices.length > 0) {
      return {
        success: false,
        message: `Cannot delete Sales Order ${target.orderNumber} because active Tax Invoice(s) exist for it (${linkedActiveTaxInvoices.map((i) => i.invoiceNumber).join(', ')}). Please cancel or delete the tax invoices first.`,
      };
    }

    // 3. Clean up any remaining linked invoices (e.g. Proforma invoices or cancelled tax invoices)
    const linkedInvoiceIds = new Set(
      invoices.filter((i) => i.salesOrderId === orderId).map((i) => i.id)
    );
    if (linkedInvoiceIds.size > 0) {
      setInvoices((prev) => prev.filter((i) => !linkedInvoiceIds.has(i.id)));
      setLedgerEntries((prev) => {
        const filtered = prev.filter((l) => !l.invoiceId || !linkedInvoiceIds.has(l.invoiceId));
        return recomputeLedgerBalances(filtered, target.customerId);
      });
    }

    // 4. Remove all linked milestones
    setMilestones((prev) => prev.filter((m) => m.salesOrderId !== orderId));

    // 5. Remove the sales order
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    // 6. Reset converted references in leads and opportunities
    setLeads((prev) =>
      prev.map((l) =>
        l.convertedSalesOrderId === orderId
          ? {
              ...l,
              convertedSalesOrderId: undefined,
            }
          : l
      )
    );

    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.convertedSalesOrderId === orderId
          ? {
              ...opp,
              convertedSalesOrderId: undefined,
              convertedSalesOrderNumber: undefined,
              isConvertedToOrder: false,
            }
          : opp
      )
    );

    // 7. Add Audit Log & Notification
    addAuditLog({
      entityType: 'SalesOrder',
      entityId: target.id,
      entityNumber: target.orderNumber,
      action: 'Deleted',
      description: `Sales Order ${target.orderNumber} for ${target.customerName} (${formatCurrency(target.grandTotal)}) deleted`,
    });

    addNotification({
      type: 'ORDER',
      title: 'Sales Order Deleted',
      message: `${target.orderNumber} for ${target.customerName} has been deleted`,
      timestamp: 'Just now',
      linkType: 'order',
    });

    return { success: true, message: `Sales Order ${target.orderNumber} deleted successfully.` };
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv))
    );
  };

  // Payment Recording & Collection with payment_stage, remaining_balance, and crm_milestone_id sync
  const recordPayment = (paymentData: {
    customerId: string;
    salesOrderId?: string;
    invoiceId?: string;
    milestoneId?: string;
    paymentStage?: PaymentReceipt['paymentStage'];
    amount: number;
    tdsDeducted?: number;
    paymentMode: PaymentReceipt['paymentMode'];
    bankCashAccount: string;
    transactionReference: string;
    remarks?: string;
    paymentDate: string;
  }): PaymentReceipt => {
    const customer = customers.find((c) => c.id === paymentData.customerId);
    if (!customer) throw new Error('Customer not found');

    const nextRecSeq = payments.length + 1;
    const receiptNumber = `REC-2026-${String(nextRecSeq).padStart(5, '0')}`;
    const tds = paymentData.tdsDeducted || 0;
    const netReceived = paymentData.amount - tds;
    const now = new Date().toISOString();

    const targetInvoice = paymentData.invoiceId
      ? invoices.find((inv) => inv.id === paymentData.invoiceId)
      : undefined;

    const targetMilestone = paymentData.milestoneId
      ? milestones.find((m) => m.id === paymentData.milestoneId)
      : targetInvoice?.milestoneId
      ? milestones.find((m) => m.id === targetInvoice.milestoneId)
      : undefined;

    const targetOrder = paymentData.salesOrderId
      ? orders.find((o) => o.id === paymentData.salesOrderId)
      : targetInvoice?.salesOrderId
      ? orders.find((o) => o.id === targetInvoice.salesOrderId)
      : targetMilestone?.salesOrderId
      ? orders.find((o) => o.id === targetMilestone.salesOrderId)
      : undefined;

    // Compute remaining_balance after this payment
    const computedRemainingBalance = targetInvoice
      ? Math.max(0, targetInvoice.balanceAmount - paymentData.amount)
      : targetMilestone
      ? Math.max(0, targetMilestone.amount - (targetMilestone.paidAmount + paymentData.amount))
      : targetOrder
      ? Math.max(
          0,
          targetOrder.grandTotal -
            (payments
              .filter((p) => p.salesOrderId === targetOrder.id)
              .reduce((sum, p) => sum + p.amount, 0) +
              paymentData.amount)
        )
      : 0;

    const resolvedStage: PaymentReceipt['paymentStage'] =
      paymentData.paymentStage ||
      targetInvoice?.paymentStage ||
      resolveMilestoneStage(targetMilestone?.milestoneCode) ||
      'On Account';

    const newPayment: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      paymentDate: paymentData.paymentDate || now.split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      salesOrderId: targetOrder?.id,
      salesOrderNumber: targetOrder?.orderNumber,
      invoiceId: targetInvoice?.id,
      invoiceNumber: targetInvoice?.invoiceNumber,
      milestoneId: targetMilestone?.id,
      milestoneCode: targetMilestone?.milestoneCode,
      paymentStage: resolvedStage,
      amount: paymentData.amount,
      tdsDeducted: tds,
      netReceived,
      remainingBalance: computedRemainingBalance,
      paymentMode: paymentData.paymentMode,
      bankCashAccount: paymentData.bankCashAccount,
      transactionReference: paymentData.transactionReference,
      remarks: paymentData.remarks,
      recordedById: currentUser.id,
      recordedByName: currentUser.name,
      createdAt: now,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update Invoice balance and status
    if (targetInvoice) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === targetInvoice.id) {
            const newPaid = inv.paidAmount + paymentData.amount;
            const newBal = Math.max(0, inv.grandTotal - newPaid);
            const status: Invoice['status'] =
              inv.status === 'Converted'
                ? 'Converted'
                : newBal <= 0
                ? 'Paid'
                : 'Partially Paid';
            return {
              ...inv,
              paidAmount: newPaid,
              balanceAmount: newBal,
              status,
              updatedAt: now,
            };
          }
          return inv;
        })
      );
    }

    // Update Milestone paidAmount and status (crm_milestone_id)
    if (targetMilestone) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id === targetMilestone.id) {
            const newPaid = m.paidAmount + paymentData.amount;
            const status: PaymentMilestone['status'] = newPaid >= m.amount ? 'Paid' : 'Partially Paid';
            return {
              ...m,
              paidAmount: newPaid,
              status,
            };
          }
          return m;
        })
      );
    }

    // Append to Customer Ledger: PAYMENT (Credit - reduces customer balance)
    const prevLedger = ledgerEntries.filter((l) => l.customerId === customer.id);
    const lastBalance = prevLedger.length > 0 ? prevLedger[prevLedger.length - 1].runningBalance : 0;
    const newRunningBalance = lastBalance - paymentData.amount;

    const ledgerEntry: CustomerLedgerEntry = {
      id: `ldg-${Date.now()}`,
      customerId: customer.id,
      date: newPayment.paymentDate,
      type: 'PAYMENT',
      referenceNumber: newPayment.receiptNumber,
      description: `Payment (${resolvedStage}) via ${newPayment.paymentMode} · Ref: ${newPayment.transactionReference}`,
      debit: 0,
      credit: paymentData.amount,
      runningBalance: newRunningBalance,
      paymentId: newPayment.id,
    };

    setLedgerEntries((prev) => [...prev, ledgerEntry]);

    addAuditLog({
      entityType: 'Payment',
      entityId: newPayment.id,
      entityNumber: newPayment.receiptNumber,
      action: 'Payment Recorded',
      description: `Payment receipt of ${formatCurrency(paymentData.amount)} (${resolvedStage}) logged for ${customer.name}. Remaining balance: ${formatCurrency(computedRemainingBalance)}`,
    });

    addNotification({
      type: 'PAYMENT',
      title: 'Payment Receipt Created',
      message: `${formatCurrency(paymentData.amount)} received from ${customer.name} (${newPayment.receiptNumber})`,
      timestamp: 'Just now',
      linkType: 'payment',
      linkId: newPayment.id,
    });

    return newPayment;
  };

  // Delete Payment & Recalculate Invoice, Milestone, Order, and Ledger Balances
  const deletePayment = (paymentId: string): { success: boolean; message: string } => {
    if (!canDelete('payments')) {
      return { success: false, message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Payments.` };
    }
    const target = payments.find((p) => p.id === paymentId);
    if (!target) return { success: false, message: 'Payment receipt not found.' };

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    setPayments((prev) => prev.filter((p) => p.id !== paymentId));

    // Recalculate linked Invoice status & balance
    if (target.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== target.invoiceId) return inv;
          const nextPaid = Math.max(0, inv.paidAmount - target.amount);
          const nextBal = Math.max(0, inv.grandTotal - nextPaid);
          let nextStatus: Invoice['status'] = inv.status;
          if (inv.status !== 'Cancelled' && inv.status !== 'Converted') {
            if (nextBal <= 0) nextStatus = 'Paid';
            else if (nextPaid > 0) nextStatus = 'Partially Paid';
            else if (inv.dueDate < todayStr) nextStatus = 'Overdue';
            else nextStatus = 'Issued';
          }
          return {
            ...inv,
            paidAmount: nextPaid,
            balanceAmount: nextBal,
            status: nextStatus,
            updatedAt: now,
          };
        })
      );
    }

    // Recalculate linked CRM Milestone status & paidAmount
    if (target.milestoneId) {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== target.milestoneId) return m;
          const nextPaid = Math.max(0, m.paidAmount - target.amount);
          let nextStatus: PaymentMilestone['status'] = 'Upcoming';
          if (nextPaid >= m.amount) nextStatus = 'Paid';
          else if (nextPaid > 0) nextStatus = 'Partially Paid';
          else if (m.dueDate < todayStr) nextStatus = 'Overdue';
          else if (m.invoiceId || m.proformaInvoiceId) nextStatus = 'Due';
          return {
            ...m,
            paidAmount: nextPaid,
            status: nextStatus,
          };
        })
      );
    }

    // Remove ledger entry and recompute running balances
    setLedgerEntries((prev) => {
      const filtered = prev.filter((l) => l.paymentId !== paymentId);
      return recomputeLedgerBalances(filtered, target.customerId);
    });

    addAuditLog({
      entityType: 'Payment',
      entityId: target.id,
      entityNumber: target.receiptNumber,
      action: 'Updated',
      description: `Payment receipt ${target.receiptNumber} (${formatCurrency(target.amount)}) deleted and invoice/milestone balances recalculated`,
    });

    return {
      success: true,
      message: `Payment ${target.receiptNumber} deleted and invoice/milestone balances recalculated.`,
    };
  };

  // Order Finance Summary & Payment Status Recalculation Helper
  const getOrderFinanceSummary = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const orderTotal = order?.grandTotal || 0;

    const orderInvoices = invoices.filter(
      (i) => i.salesOrderId === orderId && i.status !== 'Cancelled'
    );
    const proformaTotal = orderInvoices
      .filter((i) => i.invoiceType === 'Proforma')
      .reduce((acc, i) => acc + i.grandTotal, 0);
    const taxInvoicedTotal = orderInvoices
      .filter((i) => i.invoiceType !== 'Proforma')
      .reduce((acc, i) => acc + i.grandTotal, 0);

    const orderMilestones = milestones.filter((m) => m.salesOrderId === orderId);
    const milestoneIds = new Set(orderMilestones.map((m) => m.id));
    const invoiceIds = new Set(orderInvoices.map((i) => i.id));

    const collectedTotal = payments
      .filter(
        (p) =>
          p.salesOrderId === orderId ||
          (p.invoiceId && invoiceIds.has(p.invoiceId)) ||
          (p.milestoneId && milestoneIds.has(p.milestoneId))
      )
      .reduce((acc, p) => acc + p.amount, 0);

    const remainingBalance = Math.max(0, orderTotal - collectedTotal);
    const paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' =
      collectedTotal >= orderTotal && orderTotal > 0
        ? 'Paid'
        : collectedTotal > 0
        ? 'Partially Paid'
        : 'Unpaid';

    return {
      orderTotal,
      proformaTotal,
      taxInvoicedTotal,
      collectedTotal,
      remainingBalance,
      paymentStatus,
    };
  };

  // Customer Financial Profile Calculations
  const getCustomerBalance = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    const custInvoices = invoices.filter(
      (i) => i.customerId === customerId && i.status !== 'Cancelled' && i.invoiceType !== 'Proforma'
    );
    const custPayments = payments.filter((p) => p.customerId === customerId);

    const totalInvoiced = custInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const totalReceived = custPayments.reduce((acc, p) => acc + p.amount, 0);
    const outstanding = Math.max(0, totalInvoiced - totalReceived);
    const creditLimit = cust?.creditLimit || 0;
    const availableCredit = Math.max(0, creditLimit - outstanding);

    return {
      totalInvoiced,
      totalReceived,
      outstanding,
      creditLimit,
      availableCredit,
    };
  };

  // Activity Management
  const addActivity = (activityData: Omit<Activity, 'id' | 'createdAt'>): Activity => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      ...activityData,
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);

    addNotification({
      type: 'FOLLOWUP',
      title: `New Activity: ${activityData.activityType}`,
      message: `${activityData.subject} scheduled for ${activityData.date}`,
      timestamp: 'Just now',
    });

    return newActivity;
  };

  const updateActivityStatus = (id: string, status: Activity['status'], completionNotes?: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === id
          ? {
              ...act,
              status,
              completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : act.completionDate,
              completionNotes: completionNotes || act.completionNotes,
            }
          : act
      )
    );
  };

  const deleteActivity = (id: string): { success: boolean; message: string } => {
    if (!canDelete('activities')) {
      return {
        success: false,
        message: `Permission Denied: Your role (${currentUser.role}) does not have delete rights for Activities.`,
      };
    }
    const act = activities.find((a) => a.id === id);
    if (!act) return { success: false, message: 'Activity not found.' };

    setActivities((prev) => prev.filter((a) => a.id !== id));
    return {
      success: true,
      message: `Activity "${act.subject}" was successfully deleted.`,
    };
  };

  // Purchase Orders Management (finance_purchase_orders)
  const addPurchaseOrder = (
    poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): PurchaseOrder => {
    const now = new Date().toISOString();
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      ...poData,
      createdAt: now,
      updatedAt: now,
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);

    addAuditLog({
      entityType: 'PurchaseOrder',
      entityId: newPo.id,
      entityNumber: newPo.poNumber,
      action: 'Created',
      description: `Purchase Order ${newPo.poNumber} created for vendor ${newPo.vendorName} (${formatCurrency(newPo.grandTotal)})`,
    });

    return newPo;
  };

  const updatePurchaseOrder = (id: string, poData: Partial<PurchaseOrder>) => {
    const now = new Date().toISOString();
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, ...poData, updatedAt: now } : po))
    );
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrderStatus) => {
    const now = new Date().toISOString();
    const target = purchaseOrders.find((p) => p.id === id);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === id
          ? {
              ...po,
              status,
              approvedById: status === 'Approved' ? currentUser.id : po.approvedById,
              approvedByName: status === 'Approved' ? currentUser.name : po.approvedByName,
              approvedAt: status === 'Approved' ? now : po.approvedAt,
              updatedAt: now,
            }
          : po
      )
    );
    if (target) {
      addAuditLog({
        entityType: 'PurchaseOrder',
        entityId: target.id,
        entityNumber: target.poNumber,
        action: 'Status Changed',
        description: `Purchase Order ${target.poNumber} status updated to ${status}`,
      });
    }
  };

  const deletePurchaseOrder = (id: string): { success: boolean; message: string } => {
    const target = purchaseOrders.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Purchase Order not found.' };
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({
      entityType: 'PurchaseOrder',
      entityId: target.id,
      entityNumber: target.poNumber,
      action: 'Deleted',
      description: `Purchase Order ${target.poNumber} for ${target.vendorName} deleted`,
    });
    return { success: true, message: `Purchase Order ${target.poNumber} deleted.` };
  };

  // ============================================================================
  // SUPPORT & AMC MODULE + MERGED FINANCIAL TRANSACTIONS
  // ============================================================================

  // 1. AMC Contracts CRUD & Financial Invoicing
  const addAmcContract = (
    data: Omit<AmcContract, 'id' | 'createdAt' | 'updatedAt'>
  ): AmcContract => {
    const now = new Date().toISOString();
    const newContract: AmcContract = {
      id: `amc-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    setAmcContracts((prev) => [newContract, ...prev]);

    addAuditLog({
      entityType: 'AmcContract',
      entityId: newContract.id,
      entityNumber: newContract.contractNumber,
      action: 'Created',
      description: `AMC Contract ${newContract.contractNumber} registered for ${newContract.customerName} (${formatCurrency(newContract.totalValue)})`,
    });

    addNotification({
      type: 'AMC',
      title: 'New AMC Contract Registered',
      message: `${newContract.contractNumber} created for ${newContract.customerName}`,
      timestamp: 'Just now',
      linkType: 'support',
      linkId: newContract.id,
    });

    return newContract;
  };

  const updateAmcContract = (id: string, data: Partial<AmcContract>) => {
    const now = new Date().toISOString();
    setAmcContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now } : c))
    );
  };

  const deleteAmcContract = (id: string): { success: boolean; message: string } => {
    const target = amcContracts.find((c) => c.id === id);
    if (!target) return { success: false, message: 'AMC Contract not found.' };
    setAmcContracts((prev) => prev.filter((c) => c.id !== id));
    addAuditLog({
      entityType: 'AmcContract',
      entityId: target.id,
      entityNumber: target.contractNumber,
      action: 'Deleted',
      description: `AMC Contract ${target.contractNumber} for ${target.customerName} deleted`,
    });
    return { success: true, message: `AMC Contract ${target.contractNumber} deleted.` };
  };

  const generateInvoiceFromAmcContract = (
    contractId: string,
    invoiceType: 'Proforma' | 'Tax' = 'Tax'
  ): Invoice | null => {
    const contract = amcContracts.find((c) => c.id === contractId);
    if (!contract) return null;

    const customer = customers.find((c) => c.id === contract.customerId);
    const defaultAddr: CustomerAddress = customer?.addresses?.[0] || {
      id: `addr-${Date.now()}`,
      type: 'Billing',
      addressLine1: contract.customerName,
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      country: 'India',
      pincode: '110020',
      isDefault: true,
    };

    const isInterState = (defaultAddr.stateCode || '07') !== (supplierCompany.stateCode || '07');
    const taxable = contract.annualValue;
    const gstRate = contract.gstRate || 18;
    const totalTax = Math.round((taxable * gstRate) / 100);
    const cgst = isInterState ? 0 : totalTax / 2;
    const sgst = isInterState ? 0 : totalTax / 2;
    const igst = isInterState ? totalTax : 0;
    const grandTotal = taxable + totalTax;

    const nowDate = new Date().toISOString().split('T')[0];
    const dueObj = new Date();
    dueObj.setDate(dueObj.getDate() + 30);
    const dueDate = dueObj.toISOString().split('T')[0];

    const item: InvoiceItem = {
      id: `inv-item-amc-${Date.now()}`,
      productName: `AMC ${contract.contractNumber} · Renewal`,
      description: `AMC ${contract.contractNumber} · Renewal (${contract.solution} · ${contract.includedHours} hrs · Period: ${contract.startDate} to ${contract.endDate})`,
      hsnSac: '998313',
      uom: 'Service',
      quantity: 1,
      unitRate: taxable,
      taxableAmount: taxable,
      gstRate,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax,
      lineTotal: grandTotal,
    };

    const createdInvoice = createInvoiceDirect({
      invoiceType,
      sourceType: 'AMC Renewal',
      amcContractId: contract.id,
      amcContractNumber: contract.contractNumber,
      servicePeriodStart: contract.startDate,
      servicePeriodEnd: contract.endDate,
      invoiceDate: nowDate,
      dueDate,
      customerId: contract.customerId,
      customerName: contract.customerName,
      customerGstin: contract.customerGstin || customer?.gstin,
      billingAddress: defaultAddr,
      shippingAddress: defaultAddr,
      isInterState,
      paymentTermsName: customer?.paymentTermsName || '30 Days Net',
      subtotalTaxable: taxable,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: igst,
      totalTax,
      grandTotal,
      status: 'Issued',
      items: [item],
      notes: `AMC ${contract.contractNumber} · Renewal (${contract.startDate} to ${contract.endDate})`,
    });

    return createdInvoice;
  };

  const renewAmcContract = (
    id: string,
    generateInvoiceType?: 'Proforma' | 'Tax'
  ): { contract: AmcContract; invoice?: Invoice | null } => {
    const existing = amcContracts.find((c) => c.id === id);
    if (!existing) throw new Error('AMC Contract not found');

    const prevEnd = new Date(existing.endDate || new Date());
    const nextStartObj = new Date(prevEnd);
    nextStartObj.setDate(nextStartObj.getDate() + 1);
    const nextEndObj = new Date(nextStartObj);
    nextEndObj.setFullYear(nextEndObj.getFullYear() + 1);
    nextEndObj.setDate(nextEndObj.getDate() - 1);

    const nextStart = nextStartObj.toISOString().split('T')[0];
    const nextEnd = nextEndObj.toISOString().split('T')[0];
    const now = new Date().toISOString();

    const updatedContract: AmcContract = {
      ...existing,
      startDate: nextStart,
      endDate: nextEnd,
      consumedHours: 0,
      status: 'Active',
      updatedAt: now,
    };

    setAmcContracts((prev) => prev.map((c) => (c.id === id ? updatedContract : c)));

    let generatedInv: Invoice | null = null;
    if (generateInvoiceType) {
      generatedInv = generateInvoiceFromAmcContract(id, generateInvoiceType);
    }

    addAuditLog({
      entityType: 'AmcContract',
      entityId: existing.id,
      entityNumber: existing.contractNumber,
      action: 'Updated',
      description: `AMC Contract ${existing.contractNumber} renewed for period ${nextStart} to ${nextEnd}`,
    });

    return { contract: updatedContract, invoice: generatedInv };
  };

  // 2. Support Tickets CRUD, Hours Logging, CR Escalation & Direct Invoicing
  const addSupportTicket = (
    data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'comments' | 'createdAt' | 'updatedAt'>
  ): SupportTicket => {
    const now = new Date().toISOString();
    const maxNum = supportTickets.reduce((max, t) => {
      const m = t.ticketNumber.match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, 197);
    const ticketNumber = `TKT-${String(maxNum + 1).padStart(5, '0')}`;

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      ...data,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    setSupportTickets((prev) => [newTicket, ...prev]);

    // If hoursLogged > 0 on creation and linked to a contract, increment contract consumedHours
    if (newTicket.contractId && newTicket.hoursLogged > 0) {
      setAmcContracts((prev) =>
        prev.map((c) =>
          c.id === newTicket.contractId
            ? { ...c, consumedHours: c.consumedHours + newTicket.hoursLogged, updatedAt: now }
            : c
        )
      );
    }

    addAuditLog({
      entityType: 'SupportTicket',
      entityId: newTicket.id,
      entityNumber: newTicket.ticketNumber,
      action: 'Created',
      description: `Support Ticket ${newTicket.ticketNumber} (${newTicket.category} · ${newTicket.priority}) logged for ${newTicket.customerName}`,
    });

    addNotification({
      type: 'SUPPORT',
      title: `New Support Ticket: ${newTicket.ticketNumber}`,
      message: `${newTicket.subject} (${newTicket.customerName})`,
      timestamp: 'Just now',
      linkType: 'support',
      linkId: newTicket.id,
    });

    return newTicket;
  };

  const updateSupportTicket = (id: string, data: Partial<SupportTicket>) => {
    const now = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: now } : t))
    );
  };

  const updateSupportTicketStatus = (
    id: string,
    status: SupportTicketStatus,
    resolutionSummary?: string
  ) => {
    const now = new Date().toISOString();
    const target = supportTickets.find((t) => t.id === id);
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              resolutionSummary: resolutionSummary !== undefined ? resolutionSummary : t.resolutionSummary,
              updatedAt: now,
            }
          : t
      )
    );
    if (target) {
      addAuditLog({
        entityType: 'SupportTicket',
        entityId: target.id,
        entityNumber: target.ticketNumber,
        action: 'Status Changed',
        description: `Ticket ${target.ticketNumber} status updated to ${status}`,
      });
    }
  };

  const deleteSupportTicket = (id: string): { success: boolean; message: string } => {
    const target = supportTickets.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Support Ticket not found.' };
    setSupportTickets((prev) => prev.filter((t) => t.id !== id));
    addAuditLog({
      entityType: 'SupportTicket',
      entityId: target.id,
      entityNumber: target.ticketNumber,
      action: 'Deleted',
      description: `Support Ticket ${target.ticketNumber} deleted`,
    });
    return { success: true, message: `Ticket ${target.ticketNumber} deleted.` };
  };

  const addSupportTicketComment = (
    ticketId: string,
    commentData: Omit<SupportTicketComment, 'id' | 'ticketId' | 'createdAt'>
  ) => {
    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newComment: SupportTicketComment = {
      id: `tcmt-${Date.now()}`,
      ticketId,
      ...commentData,
      createdAt: nowFormatted,
    };
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              comments: [...t.comments, newComment],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const logSupportTicketHours = (ticketId: string, hoursToAdd: number, note?: string) => {
    if (hoursToAdd <= 0) return;
    const target = supportTickets.find((t) => t.id === ticketId);
    if (!target) return;

    const now = new Date().toISOString();
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              hoursLogged: Number((t.hoursLogged + hoursToAdd).toFixed(2)),
              updatedAt: now,
            }
          : t
      )
    );

    if (target.contractId) {
      setAmcContracts((prev) =>
        prev.map((c) =>
          c.id === target.contractId
            ? {
                ...c,
                consumedHours: Number((c.consumedHours + hoursToAdd).toFixed(2)),
                updatedAt: now,
              }
            : c
        )
      );
    }

    if (note) {
      addSupportTicketComment(ticketId, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        message: `Logged ${hoursToAdd} support hrs: ${note}`,
        isInternal: true,
        department: target.department,
      });
    }
  };

  const importSupportTicketsBatch = (rows: Array<Partial<SupportTicket>>): number => {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    let baseNum = supportTickets.reduce((max, t) => {
      const m = t.ticketNumber.match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, 197);

    const createdList: SupportTicket[] = rows.map((r, idx) => {
      baseNum += 1;
      const matchedCust =
        customers.find(
          (c) =>
            c.name.toLowerCase() === (r.customerName || '').toLowerCase() ||
            c.customerCode.toLowerCase() === (r.customerCode || '').toLowerCase()
        ) || customers[0];
      const matchedContract = amcContracts.find((a) => a.customerId === matchedCust?.id);

      return {
        id: `tkt-imp-${Date.now()}-${idx}`,
        ticketNumber: `TKT-${String(baseNum).padStart(5, '0')}`,
        ticketDate: r.ticketDate || todayStr,
        customerId: matchedCust?.id || 'cus-1',
        customerCode: matchedCust?.customerCode || 'TAJ01',
        customerName: r.customerName || matchedCust?.name || 'Customer',
        contactName: r.contactName || 'Primary Contact',
        contactEmail: r.contactEmail || matchedCust?.email || '',
        contactPhone: r.contactPhone || matchedCust?.phone || '',
        contractId: matchedContract?.id,
        contractNumber: matchedContract?.contractNumber,
        solution: r.solution || matchedContract?.solution || matchedCust?.solution || 'MS D365 Business Central',
        moduleName: r.moduleName || 'General',
        category: r.category || 'Support Query',
        department: r.department || 'Functional ERP',
        subject: r.subject || 'Imported Support Ticket',
        description: r.description || r.subject || 'Imported via Excel/CSV upload',
        priority: r.priority || 'Medium',
        status: r.status || 'Open',
        assignedToId: currentUser.id,
        assignedToName: currentUser.name,
        slaStatus: 'Within SLA',
        responseDueAt: `${todayStr} 18:00`,
        resolutionDueAt: `${todayStr} 23:59`,
        hoursLogged: Number(r.hoursLogged || 0),
        isBillable: Boolean(r.isBillable),
        estimatedBillingAmount: r.estimatedBillingAmount ? Number(r.estimatedBillingAmount) : undefined,
        portalSource: 'Excel Import',
        comments: [],
        createdAt: now,
        updatedAt: now,
      };
    });

    setSupportTickets((prev) => [...createdList, ...prev]);
    return createdList.length;
  };

  // 3. Change Requests (CR) CRUD, Ticket-to-CR Conversion & Financial Invoicing
  const addChangeRequest = (
    data: Omit<SupportChangeRequest, 'id' | 'crNumber' | 'createdAt' | 'updatedAt'>
  ): SupportChangeRequest => {
    const now = new Date().toISOString();
    const maxCr = changeRequests.reduce((max, cr) => {
      const m = cr.crNumber.match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, 3);
    const crNumber = `CHG-${String(maxCr + 1).padStart(5, '0')}`;

    const newCr: SupportChangeRequest = {
      id: `cr-${Date.now()}`,
      crNumber,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    setChangeRequests((prev) => [newCr, ...prev]);

    if (newCr.ticketId) {
      setSupportTickets((prev) =>
        prev.map((t) =>
          t.id === newCr.ticketId
            ? {
                ...t,
                changeRequestId: newCr.id,
                changeRequestNumber: newCr.crNumber,
                isBillable: true,
                estimatedBillingAmount: newCr.taxableAmount,
                updatedAt: now,
              }
            : t
        )
      );
    }

    addAuditLog({
      entityType: 'ChangeRequest',
      entityId: newCr.id,
      entityNumber: newCr.crNumber,
      action: 'Created',
      description: `Change Request ${newCr.crNumber} (${newCr.title}) created for ${newCr.customerName} (${formatCurrency(newCr.totalAmount)})`,
    });

    return newCr;
  };

  const createChangeRequestFromTicket = (params: {
    ticketId: string;
    title: string;
    moduleName: string;
    scopeDescription: string;
    estimatedHours: number;
    hourlyRate: number;
    requestedBy: string;
    assignedDeveloperName: string;
  }): SupportChangeRequest | null => {
    const ticket = supportTickets.find((t) => t.id === params.ticketId);
    if (!ticket) return null;

    const customer = customers.find((c) => c.id === ticket.customerId);
    const stateCode = customer?.addresses?.[0]?.stateCode || '07';
    const isInterState = stateCode !== (supplierCompany.stateCode || '07');

    const taxableAmount = params.estimatedHours * params.hourlyRate;
    const gstRate = 18;
    const totalTax = Math.round((taxableAmount * gstRate) / 100);
    const cgstAmount = isInterState ? 0 : totalTax / 2;
    const sgstAmount = isInterState ? 0 : totalTax / 2;
    const igstAmount = isInterState ? totalTax : 0;
    const totalAmount = taxableAmount + totalTax;

    return addChangeRequest({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      customerId: ticket.customerId,
      customerCode: ticket.customerCode,
      customerName: ticket.customerName,
      customerGstin: customer?.gstin,
      contractId: ticket.contractId,
      contractNumber: ticket.contractNumber,
      title: params.title,
      moduleName: params.moduleName || ticket.moduleName,
      scopeDescription: params.scopeDescription,
      estimatedHours: params.estimatedHours,
      hourlyRate: params.hourlyRate,
      taxableAmount,
      gstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      status: 'Customer Approved',
      approvedByCustomerAt: new Date().toISOString().split('T')[0],
      requestedBy: params.requestedBy || ticket.contactName,
      assignedDeveloperName: params.assignedDeveloperName || ticket.assignedToName,
    });
  };

  const updateChangeRequest = (id: string, data: Partial<SupportChangeRequest>) => {
    const now = new Date().toISOString();
    setChangeRequests((prev) =>
      prev.map((cr) => (cr.id === id ? { ...cr, ...data, updatedAt: now } : cr))
    );
  };

  const updateChangeRequestStatus = (id: string, status: ChangeRequestStatus) => {
    const now = new Date().toISOString();
    setChangeRequests((prev) =>
      prev.map((cr) =>
        cr.id === id
          ? {
              ...cr,
              status,
              approvedByCustomerAt:
                status === 'Customer Approved' && !cr.approvedByCustomerAt
                  ? now.split('T')[0]
                  : cr.approvedByCustomerAt,
              updatedAt: now,
            }
          : cr
      )
    );
  };

  const deleteChangeRequest = (id: string): { success: boolean; message: string } => {
    const target = changeRequests.find((c) => c.id === id);
    if (!target) return { success: false, message: 'Change Request not found.' };
    setChangeRequests((prev) => prev.filter((c) => c.id !== id));
    return { success: true, message: `Change Request ${target.crNumber} deleted.` };
  };

  const generateInvoiceFromChangeRequest = (
    crId: string,
    invoiceType: 'Proforma' | 'Tax' = 'Tax'
  ): Invoice | null => {
    const cr = changeRequests.find((c) => c.id === crId);
    if (!cr) return null;

    // If requesting Tax Invoice and a Proforma already exists on this CR, convert the Proforma directly!
    if (invoiceType === 'Tax' && cr.proformaInvoiceId && !cr.taxInvoiceId) {
      const existingPi = invoices.find(
        (i) => i.id === cr.proformaInvoiceId && i.status !== 'Cancelled'
      );
      if (existingPi) {
        return convertProformaToTaxInvoice(existingPi.id);
      }
    }

    const customer = customers.find((c) => c.id === cr.customerId);
    const defaultAddr: CustomerAddress = customer?.addresses?.[0] || {
      id: `addr-${Date.now()}`,
      type: 'Billing',
      addressLine1: cr.customerName,
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      country: 'India',
      pincode: '110020',
      isDefault: true,
    };

    const isInterState = (defaultAddr.stateCode || '07') !== (supplierCompany.stateCode || '07');
    const nowDate = new Date().toISOString().split('T')[0];
    const dueObj = new Date();
    dueObj.setDate(dueObj.getDate() + 30);
    const dueDate = dueObj.toISOString().split('T')[0];

    const totalTax = cr.cgstAmount + cr.sgstAmount + cr.igstAmount;

    const item: InvoiceItem = {
      id: `inv-item-cr-${Date.now()}`,
      productName: `${cr.crNumber} · ${cr.moduleName}`,
      description: `${cr.crNumber} · ${cr.title} (${cr.estimatedHours} hrs @ ₹${cr.hourlyRate}/hr)`,
      hsnSac: '998313',
      uom: 'Service',
      quantity: 1,
      unitRate: cr.taxableAmount,
      taxableAmount: cr.taxableAmount,
      gstRate: cr.gstRate || 18,
      cgstAmount: cr.cgstAmount,
      sgstAmount: cr.sgstAmount,
      igstAmount: cr.igstAmount,
      totalTax,
      lineTotal: cr.totalAmount,
    };

    return createInvoiceDirect({
      invoiceType,
      sourceType: 'Change Request',
      changeRequestId: cr.id,
      changeRequestNumber: cr.crNumber,
      ticketId: cr.ticketId,
      ticketNumber: cr.ticketNumber,
      amcContractId: cr.contractId,
      amcContractNumber: cr.contractNumber,
      invoiceDate: nowDate,
      dueDate,
      customerId: cr.customerId,
      customerName: cr.customerName,
      customerGstin: cr.customerGstin || customer?.gstin,
      billingAddress: defaultAddr,
      shippingAddress: defaultAddr,
      isInterState,
      paymentTermsName: customer?.paymentTermsName || '30 Days Net',
      subtotalTaxable: cr.taxableAmount,
      totalCgst: cr.cgstAmount,
      totalSgst: cr.sgstAmount,
      totalIgst: cr.igstAmount,
      totalTax,
      grandTotal: cr.totalAmount,
      status: 'Issued',
      items: [item],
      notes: `${cr.crNumber} · ${cr.title}${cr.ticketNumber ? ` (Ticket ${cr.ticketNumber})` : ''}`,
    });
  };

  const generateInvoiceFromTicket = (
    ticketId: string,
    invoiceType: 'Proforma' | 'Tax' = 'Tax'
  ): Invoice | null => {
    const ticket = supportTickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    // If ticket is linked to a Change Request, delegate to CR invoice generator
    if (ticket.changeRequestId) {
      return generateInvoiceFromChangeRequest(ticket.changeRequestId, invoiceType);
    }

    const customer = customers.find((c) => c.id === ticket.customerId);
    const contract = amcContracts.find((a) => a.id === ticket.contractId);
    const defaultAddr: CustomerAddress = customer?.addresses?.[0] || {
      id: `addr-${Date.now()}`,
      type: 'Billing',
      addressLine1: ticket.customerName,
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      country: 'India',
      pincode: '110020',
      isDefault: true,
    };

    const isInterState = (defaultAddr.stateCode || '07') !== (supplierCompany.stateCode || '07');
    const rate = contract?.hourlyOverageRate || 1500;
    const taxable =
      ticket.estimatedBillingAmount && ticket.estimatedBillingAmount > 0
        ? ticket.estimatedBillingAmount
        : Math.max(1, ticket.hoursLogged) * rate;
    const gstRate = 18;
    const totalTax = Math.round((taxable * gstRate) / 100);
    const cgst = isInterState ? 0 : totalTax / 2;
    const sgst = isInterState ? 0 : totalTax / 2;
    const igst = isInterState ? totalTax : 0;
    const grandTotal = taxable + totalTax;

    const nowDate = new Date().toISOString().split('T')[0];
    const dueObj = new Date();
    dueObj.setDate(dueObj.getDate() + 15);
    const dueDate = dueObj.toISOString().split('T')[0];

    const item: InvoiceItem = {
      id: `inv-item-tkt-${Date.now()}`,
      productName: `${ticket.ticketNumber} · ${ticket.moduleName}`,
      description: `${ticket.subject} (Ticket ${ticket.ticketNumber})`,
      hsnSac: ticket.category === 'License / Access' ? '997331' : '998313',
      uom: ticket.category === 'License / Access' ? 'License' : 'Service',
      quantity: 1,
      unitRate: taxable,
      taxableAmount: taxable,
      gstRate,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalTax,
      lineTotal: grandTotal,
    };

    return createInvoiceDirect({
      invoiceType,
      sourceType: 'Ticket',
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      amcContractId: ticket.contractId,
      amcContractNumber: ticket.contractNumber,
      invoiceDate: nowDate,
      dueDate,
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      customerGstin: customer?.gstin,
      billingAddress: defaultAddr,
      shippingAddress: defaultAddr,
      isInterState,
      paymentTermsName: customer?.paymentTermsName || '30 Days Net',
      subtotalTaxable: taxable,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: igst,
      totalTax,
      grandTotal,
      status: 'Issued',
      items: [item],
      notes: `Support Ticket ${ticket.ticketNumber}: ${ticket.subject}`,
    });
  };

  // 4. License Types Catalog & License Subscription Invoicing
  const addLicenseType = (data: Omit<LicenseTypeMasterItem, 'id'>): LicenseTypeMasterItem => {
    const newLic: LicenseTypeMasterItem = {
      id: `lic-${Date.now()}`,
      ...data,
    };
    setLicenseTypes((prev) => [...prev, newLic]);
    return newLic;
  };

  const updateLicenseType = (id: string, data: Partial<LicenseTypeMasterItem>) => {
    setLicenseTypes((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  };

  const deleteLicenseType = (id: string) => {
    setLicenseTypes((prev) => prev.filter((l) => l.id !== id));
  };

  const generateLicenseInvoice = (params: {
    customerId: string;
    invoiceType: 'Proforma' | 'Tax';
    billingCycle: 'Monthly' | 'Yearly';
    items: Array<{ licenseId: string; quantity: number; customRate?: number }>;
    ticketId?: string;
    amcContractId?: string;
    notes?: string;
  }): Invoice | null => {
    const customer = customers.find((c) => c.id === params.customerId);
    if (!customer || params.items.length === 0) return null;

    const defaultAddr: CustomerAddress = customer.addresses?.[0] || {
      id: `addr-${Date.now()}`,
      type: 'Billing',
      addressLine1: customer.name,
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      country: 'India',
      pincode: '110020',
      isDefault: true,
    };

    const isInterState = (defaultAddr.stateCode || '07') !== (supplierCompany.stateCode || '07');
    const invoiceItems: InvoiceItem[] = params.items.map((row, idx) => {
      const lic = licenseTypes.find((l) => l.id === row.licenseId) || licenseTypes[0];
      const unitRate =
        row.customRate !== undefined
          ? row.customRate
          : params.billingCycle === 'Yearly'
          ? lic.yearlyCost
          : lic.monthlyCost;
      const qty = Math.max(1, row.quantity);
      const taxableAmount = Number((qty * unitRate).toFixed(2));
      const gstRate = 18;
      const totalTax = Number(((taxableAmount * gstRate) / 100).toFixed(2));
      const cgstAmount = isInterState ? 0 : Number((totalTax / 2).toFixed(2));
      const sgstAmount = isInterState ? 0 : Number((totalTax - cgstAmount).toFixed(2));
      const igstAmount = isInterState ? totalTax : 0;

      return {
        id: `inv-lic-${Date.now()}-${idx}`,
        productName: `${lic.name} · ${params.billingCycle}`,
        description: `${lic.name} · ${params.billingCycle} (${qty} licenses)`,
        hsnSac: lic.hsnSac || '997331',
        uom: 'License',
        quantity: qty,
        unitRate,
        taxableAmount,
        gstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTax,
        lineTotal: Number((taxableAmount + totalTax).toFixed(2)),
      };
    });

    const subtotalTaxable = Number(
      invoiceItems.reduce((s, it) => s + it.taxableAmount, 0).toFixed(2)
    );
    const totalCgst = Number(invoiceItems.reduce((s, it) => s + it.cgstAmount, 0).toFixed(2));
    const totalSgst = Number(invoiceItems.reduce((s, it) => s + it.sgstAmount, 0).toFixed(2));
    const totalIgst = Number(invoiceItems.reduce((s, it) => s + it.igstAmount, 0).toFixed(2));
    const totalTax = Number(invoiceItems.reduce((s, it) => s + it.totalTax, 0).toFixed(2));
    const grandTotal = Number((subtotalTaxable + totalTax).toFixed(2));

    const nowDate = new Date().toISOString().split('T')[0];
    const dueObj = new Date();
    dueObj.setDate(dueObj.getDate() + 7);
    const dueDate = dueObj.toISOString().split('T')[0];

    const linkedTkt = params.ticketId ? supportTickets.find((t) => t.id === params.ticketId) : undefined;
    const linkedAmc = params.amcContractId ? amcContracts.find((a) => a.id === params.amcContractId) : undefined;

    return createInvoiceDirect({
      invoiceType: params.invoiceType,
      sourceType: 'License',
      billingComponent: 'License',
      ticketId: linkedTkt?.id,
      ticketNumber: linkedTkt?.ticketNumber,
      amcContractId: linkedAmc?.id,
      amcContractNumber: linkedAmc?.contractNumber,
      invoiceDate: nowDate,
      dueDate,
      customerId: customer.id,
      customerName: customer.name,
      customerGstin: customer.gstin,
      billingAddress: defaultAddr,
      shippingAddress: defaultAddr,
      isInterState,
      paymentTermsName: customer.paymentTermsName || '30 Days Net',
      subtotalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      grandTotal,
      status: 'Issued',
      items: invoiceItems,
      notes: params.notes || `${params.billingCycle} Software License Subscription Invoice`,
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const resetAllToSampleData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setStates(INITIAL_STATES);
    setProducts(INITIAL_PRODUCTS);
    setTaxRates(INITIAL_TAX_RATES);
    setPaymentTerms(INITIAL_PAYMENT_TERMS);
    setLeads(INITIAL_LEADS);
    setOpportunities(INITIAL_OPPORTUNITIES);
    setCustomers(INITIAL_CUSTOMERS);
    setContacts(INITIAL_CONTACTS);
    setOrders(INITIAL_ORDERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setAmcContracts(INITIAL_AMC_CONTRACTS);
    setSupportTickets(INITIAL_SUPPORT_TICKETS);
    setChangeRequests(INITIAL_CHANGE_REQUESTS);
    setLicenseTypes(INITIAL_LICENSE_TYPES);
    setMilestones(INITIAL_MILESTONES);
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setLedgerEntries(INITIAL_LEDGER_ENTRIES);
    setActivities(INITIAL_ACTIVITIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSupplierCompany(SUPPLIER_COMPANY);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setCurrentUser(INITIAL_USERS[0]);
    setIsAuthenticated(true);
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        changeEmployeePassword,
        syncCredentialsFromServer,
        loginAsUser,
        logout,
        updateCurrentUserProfile,
        rolePermissions,
        updateRolePermission,
        resetRolePermissions,
        hasPermission,
        canView,
        canCreate,
        canEdit,
        canDelete,
        updateUserCustomPermissions,
        users,
        addUser,
        updateUser,
        deleteUser,
        resetUserPassword,
        states,
        addState,
        updateState,
        deleteState,
        getStateCode,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        taxRates,
        addTaxRate,
        updateTaxRate,
        deleteTaxRate,
        paymentTerms,
        addPaymentTerm,
        updatePaymentTerm,
        deletePaymentTerm,
        leads,
        addLead,
        updateLead,
        updateLeadStatus,
        deleteLead,
        addLeadTimelineEvent,
        createContactFromLead,
        qualifyLeadToOpportunity,
        importLeadsBatch,
        convertLead,
        opportunities,
        addOpportunity,
        updateOpportunityStageAndStatus,
        updateOpportunity,
        addOpportunityRemark,
        addOpportunityTask,
        updateOpportunityTaskStatus,
        addOpportunityAttachment,
        convertOpportunityToSalesOrder,
        deleteOpportunity,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCustomerAddress,
        updateCustomerAddress,
        deleteCustomerAddress,
        contacts,
        addCustomerContact,
        updateCustomerContact,
        deleteCustomerContact,
        orders,
        addOrder,
        updateOrderStatus,
        updateOrderMilestones,
        deleteOrder,
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        updatePurchaseOrderStatus,
        deletePurchaseOrder,
        amcContracts,
        addAmcContract,
        updateAmcContract,
        deleteAmcContract,
        renewAmcContract,
        generateInvoiceFromAmcContract,
        supportTickets,
        addSupportTicket,
        updateSupportTicket,
        updateSupportTicketStatus,
        deleteSupportTicket,
        addSupportTicketComment,
        logSupportTicketHours,
        importSupportTicketsBatch,
        createChangeRequestFromTicket,
        generateInvoiceFromTicket,
        changeRequests,
        addChangeRequest,
        updateChangeRequest,
        updateChangeRequestStatus,
        deleteChangeRequest,
        generateInvoiceFromChangeRequest,
        licenseTypes,
        addLicenseType,
        updateLicenseType,
        deleteLicenseType,
        generateLicenseInvoice,
        milestones,
        generateProformaFromMilestone,
        generateInvoiceFromMilestone,
        invoices,
        createInvoiceDirect,
        updateInvoice,
        convertProformaToTaxInvoice,
        markInvoiceShared,
        cancelInvoice,
        deleteProformaInvoice,
        deleteTaxInvoice,
        updateInvoiceStatus,
        payments,
        recordPayment,
        deletePayment,
        getOrderFinanceSummary,
        ledgerEntries,
        getCustomerBalance,
        activities,
        addActivity,
        updateActivityStatus,
        deleteActivity,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        outlookEmailConfig,
        updateOutlookEmailConfig,
        sendNotificationToOutlookEmail,
        sendTestOutlookEmail,
        sendAllNotificationsToOutlook,
        auditLogs,
        supplierCompany,
        updateSupplierCompany,
        resetAllToSampleData,
        formatCurrency,
        hasRemoteConflict,
        conflictMessage,
        acceptRemoteConflict,
        dismissConflict,
        lastSyncedAt,
        syncReady,
        syncStatus,
        retrySync,
        reloadSavedSync,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
