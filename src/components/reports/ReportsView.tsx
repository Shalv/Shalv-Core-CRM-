import React, { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  UserCheck,
  Briefcase,
  Building,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  FilterX,
  Search,
  Calendar,
  ChevronDown,
  LifeBuoy,
  ShoppingBag,
} from 'lucide-react';
import {
  DateRangePicker,
  DateRange,
  isDateInRange,
  formatDisplayDate,
} from '../common/DateRangePicker';
import { PayrollAdminDashboardReportSection } from '../payroll/PayrollAdminDashboardReportSection';

export type ReportTabKey =
  | 'lead_register'
  | 'opportunity_register'
  | 'customer_register'
  | 'sales_register'
  | 'support_register'
  | 'purchase_register'
  | 'milestone_register'
  | 'gst_tax_register'
  | 'collection_register'
  | 'ledger_aging_register'
  | 'activity_register'
  | 'employee_attendance_register';

interface ReportsViewProps {
  initialReportTab?: string;
  onNavigate?: (module: string, itemId?: string) => void;
}

const VALID_REPORT_TABS: ReportTabKey[] = [
  'lead_register',
  'opportunity_register',
  'customer_register',
  'sales_register',
  'support_register',
  'purchase_register',
  'milestone_register',
  'gst_tax_register',
  'collection_register',
  'ledger_aging_register',
  'activity_register',
  'employee_attendance_register',
];

const REPORT_META: Record<
  ReportTabKey,
  {
    moduleLabel: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  lead_register: {
    moduleLabel: 'Lead Management',
    title: 'Lead Conversion & Pipeline Register',
    subtitle: 'Track inbound/outbound lead velocity, qualification stages, state-wise distribution, and estimated deal values.',
    icon: UserCheck,
  },
  opportunity_register: {
    moduleLabel: 'Opportunity Management',
    title: 'Opportunity Deal & Stage Forecast Register',
    subtitle: 'Analyze active sales opportunities, closing probabilities, weighted revenue forecasts, and deal owners.',
    icon: Briefcase,
  },
  customer_register: {
    moduleLabel: 'Customer Master 360',
    title: 'Customer Master & GST Directory Report',
    subtitle: 'Complete directory of active customer accounts, GSTIN registrations, credit limits, and payment terms.',
    icon: Building,
  },
  sales_register: {
    moduleLabel: 'Sales Orders',
    title: 'Sales Order & Contract Booking Register',
    subtitle: 'Commercial sales order register with taxable contract values, inter/intra-state GST breakup, and order status.',
    icon: FileSpreadsheet,
  },
  support_register: {
    moduleLabel: 'Support & AMC Desk',
    title: 'Support Tickets, SLA & AMC Contracts Register',
    subtitle: 'Comprehensive register of support tickets, SLA compliance, billable tickets, AMC contract coverage, and Change Requests.',
    icon: LifeBuoy,
  },
  purchase_register: {
    moduleLabel: 'Purchase Orders',
    title: 'Vendor Purchase Order & Procurement Register',
    subtitle: 'Procurement register tracking vendor purchase orders, license provisioning, taxable values, GST input credit, and PO statuses.',
    icon: ShoppingBag,
  },
  milestone_register: {
    moduleLabel: 'Payment Milestones',
    title: 'Payment Milestones & Billing Schedule Report',
    subtitle: 'Milestone-wise billing schedule, due dates, invoiced progress, and payment realization across contracts.',
    icon: CalendarCheck,
  },
  gst_tax_register: {
    moduleLabel: 'Invoices & GST',
    title: 'GST Invoicing & Tax Ledger Register',
    subtitle: 'GSTR-1 ready invoice register detailing taxable values, CGST, SGST, IGST, collections, and balance dues.',
    icon: Receipt,
  },
  collection_register: {
    moduleLabel: 'Payments & Collections',
    title: 'Payment Receipt & Collection Register',
    subtitle: 'Audit-ready register of customer payment receipts, bank/cash accounts, payment modes, and UTR references.',
    icon: CreditCard,
  },
  ledger_aging_register: {
    moduleLabel: 'Customer Ledger & AR',
    title: 'Customer Receivables & AR Aging Statement',
    subtitle: 'Account-wise statement of booked orders, total billed debits, collected credits, net receivables, and overdue AR.',
    icon: BookOpen,
  },
  activity_register: {
    moduleLabel: 'Activities & Follow-ups',
    title: 'Sales Activities & Follow-up Execution Report',
    subtitle: 'Comprehensive log of scheduled calls, meetings, demos, follow-ups, priorities, and completion statuses.',
    icon: CalendarDays,
  },
  employee_attendance_register: {
    moduleLabel: 'Admin HR, Requests & GPS Attendance',
    title: 'All Employee Information, Requests & Google Coordinates Attendance Report',
    subtitle: 'Admin consolidated report of all employees, leave & reimbursement requests, and attendance with verified Google coordinates.',
    icon: UserCheck,
  },
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportTab,
  onNavigate,
}) => {
  const {
    leads,
    opportunities,
    customers,
    orders,
    purchaseOrders,
    milestones,
    invoices,
    payments,
    activities,
    supportTickets,
    amcContracts,
    changeRequests,
    formatCurrency,
    canView,
  } = useCrm();

  const REPORT_MODULE_MAP: Record<ReportTabKey, string> = {
    lead_register: 'leads',
    opportunity_register: 'opportunities',
    customer_register: 'customers',
    sales_register: 'orders',
    support_register: 'support',
    purchase_register: 'purchases',
    milestone_register: 'milestones',
    gst_tax_register: 'invoices',
    collection_register: 'payments',
    ledger_aging_register: 'ledger',
    activity_register: 'activities',
    employee_attendance_register: 'masters',
  };

  const permittedReportTabs = VALID_REPORT_TABS.filter((tab) =>
    canView(REPORT_MODULE_MAP[tab] as any)
  );
  const firstPermittedReportTab: ReportTabKey = permittedReportTabs[0] || 'lead_register';

  const [activeReport, setActiveReport] = useState<ReportTabKey>(firstPermittedReportTab);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (
      initialReportTab &&
      VALID_REPORT_TABS.includes(initialReportTab as ReportTabKey) &&
      canView(REPORT_MODULE_MAP[initialReportTab as ReportTabKey] as any)
    ) {
      const nextTab = initialReportTab as ReportTabKey;
      setActiveReport((prev) => (prev === nextTab ? prev : nextTab));
    } else if (!canView(REPORT_MODULE_MAP[activeReport] as any) && permittedReportTabs.length > 0) {
      const fallbackTab = permittedReportTabs[0];
      setActiveReport((prev) => (prev === fallbackTab ? prev : fallbackTab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReportTab, activeReport]);

  const q = searchQuery.trim().toLowerCase();

  // 1. Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchDate = isDateInRange(l.leadDate, dateRange);
      const matchSearch =
        !q ||
        l.leadNumber.toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        l.contactPerson.toLowerCase().includes(q) ||
        l.leadOwnerName.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [leads, dateRange, q]);

  // 2. Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((op) => {
      const matchDate = isDateInRange(op.expectedClosingDate || op.createdAt?.split('T')[0] || '', dateRange);
      const matchSearch =
        !q ||
        op.opportunityNumber.toLowerCase().includes(q) ||
        op.opportunityName.toLowerCase().includes(q) ||
        op.customerName.toLowerCase().includes(q) ||
        op.salesOwnerName.toLowerCase().includes(q) ||
        op.stage.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [opportunities, dateRange, q]);

  // 3. Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchDate = isDateInRange(c.createdAt?.split('T')[0] || '', dateRange);
      const matchSearch =
        !q ||
        c.customerCode.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        c.salesOwnerName.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [customers, dateRange, q]);

  // 4. Filtered Sales Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchDate = isDateInRange(o.orderDate, dateRange);
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.salespersonName.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [orders, dateRange, q]);

  // 5. Filtered Milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const matchDate = isDateInRange(m.dueDate, dateRange);
      const matchSearch =
        !q ||
        m.salesOrderNumber.toLowerCase().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        m.milestoneCode.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [milestones, dateRange, q]);

  // 6. Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchDate = isDateInRange(i.invoiceDate, dateRange);
      const matchSearch =
        !q ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        (i.customerGstin && i.customerGstin.toLowerCase().includes(q));
      return matchDate && matchSearch;
    });
  }, [invoices, dateRange, q]);

  // 7. Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchDate = isDateInRange(p.paymentDate, dateRange);
      const matchSearch =
        !q ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
        p.transactionReference.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [payments, dateRange, q]);

  // 8. Customer Ledger & AR Aging Summary (per Customer)
  const customerLedgerRows = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return customers
      .map((c) => {
        const custOrders = orders.filter((o) => o.customerId === c.id && o.status !== 'Cancelled');
        const custInvoices = invoices.filter(
          (i) => i.customerId === c.id && i.status !== 'Cancelled' && (i.invoiceType || 'Tax') === 'Tax'
        );
        const custPayments = payments.filter((p) => p.customerId === c.id);

        const totalOrdered = custOrders.reduce((s, o) => s + o.grandTotal, 0);
        const totalBilled = custInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const totalPaid = custPayments.reduce((s, p) => s + p.amount, 0);
        const netReceivable = Math.max(0, totalBilled - totalPaid);
        const overdueAmount = custInvoices
          .filter((i) => i.balanceAmount > 0 && i.dueDate < today)
          .reduce((s, i) => s + i.balanceAmount, 0);

        return {
          customer: c,
          ordersCount: custOrders.length,
          invoicesCount: custInvoices.length,
          totalOrdered,
          totalBilled,
          totalPaid,
          netReceivable,
          overdueAmount,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.customer.customerCode.toLowerCase().includes(q) ||
          row.customer.name.toLowerCase().includes(q) ||
          (row.customer.gstin && row.customer.gstin.toLowerCase().includes(q))
        );
      });
  }, [customers, orders, invoices, payments, q]);

  // 9. Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchDate = isDateInRange(a.date, dateRange);
      const matchSearch =
        !q ||
        a.subject.toLowerCase().includes(q) ||
        a.activityType.toLowerCase().includes(q) ||
        a.assignedUserName.toLowerCase().includes(q) ||
        (a.customerName && a.customerName.toLowerCase().includes(q)) ||
        (a.leadNumber && a.leadNumber.toLowerCase().includes(q));
      return matchDate && matchSearch;
    });
  }, [activities, dateRange, q]);

  // 10. Filtered Support Tickets & AMC
  const filteredSupportTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      const matchDate = isDateInRange(t.createdAt?.split('T')[0] || '', dateRange);
      const matchSearch =
        !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.moduleName.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.assignedToName.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [supportTickets, dateRange, q]);

  // 11. Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchDate = isDateInRange(po.poDate, dateRange);
      const matchSearch =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        (po.notes && po.notes.toLowerCase().includes(q)) ||
        po.status.toLowerCase().includes(q);
      return matchDate && matchSearch;
    });
  }, [purchaseOrders, dateRange, q]);

  const hasFilter = Boolean(dateRange.startDate || dateRange.endDate || searchQuery);

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    const dateSuffix =
      dateRange.startDate || dateRange.endDate
        ? `_${dateRange.startDate || 'start'}_to_${dateRange.endDate || 'end'}`
        : `_${new Date().toISOString().split('T')[0]}`;
    link.setAttribute('download', `${filename}${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportActiveReport = () => {
    switch (activeReport) {
      case 'lead_register':
        downloadCsv(
          'Lead_Management_Report',
          ['Lead Number', 'Date', 'Company', 'Contact', 'State', 'State Code', 'Source', 'Est Value', 'Status', 'Owner'],
          filteredLeads.map((l) => [
            l.leadNumber,
            l.leadDate,
            `"${l.companyName}"`,
            `"${l.contactPerson}"`,
            l.state,
            l.stateCode,
            l.leadSource,
            l.estimatedValue,
            l.status,
            `"${l.leadOwnerName}"`,
          ])
        );
        break;
      case 'opportunity_register':
        downloadCsv(
          'Opportunity_Management_Report',
          ['Opportunity #', 'Opportunity Name', 'Customer', 'Stage', 'Probability %', 'Expected Close', 'Deal Value', 'Weighted Value', 'Owner', 'Status'],
          filteredOpportunities.map((op) => [
            op.opportunityNumber,
            `"${op.opportunityName}"`,
            `"${op.customerName}"`,
            `"${op.stage}"`,
            op.probability,
            op.expectedClosingDate,
            op.estimatedDealValue,
            Math.round((op.estimatedDealValue * op.probability) / 100),
            `"${op.salesOwnerName}"`,
            op.status,
          ])
        );
        break;
      case 'customer_register':
        downloadCsv(
          'Customer_Master_360_Report',
          ['Customer Code', 'Customer Name', 'Type', 'Group', 'GSTIN', 'PAN', 'Industry', 'Payment Terms', 'Credit Limit', 'Account Owner', 'Status'],
          filteredCustomers.map((c) => [
            c.customerCode,
            `"${c.name}"`,
            c.customerType,
            c.customerGroup,
            c.gstin || 'Unregistered',
            c.pan || '',
            `"${c.industry}"`,
            `"${c.paymentTermsName}"`,
            c.creditLimit,
            `"${c.salesOwnerName}"`,
            c.status,
          ])
        );
        break;
      case 'sales_register':
        downloadCsv(
          'Sales_Order_Register',
          ['Order Number', 'Date', 'Customer', 'Tax Regime', 'Taxable Value', 'Total Tax', 'Grand Total', 'Status', 'Salesperson'],
          filteredOrders.map((o) => [
            o.orderNumber,
            o.orderDate,
            `"${o.customerName}"`,
            o.isInterState ? 'IGST' : 'CGST+SGST',
            o.totalTaxable,
            o.totalTax,
            o.grandTotal,
            o.status,
            `"${o.salespersonName}"`,
          ])
        );
        break;
      case 'milestone_register':
        downloadCsv(
          'Payment_Milestones_Report',
          ['Milestone Code', 'SO Number', 'Customer', 'Description', 'Percentage %', 'Due Date', 'Milestone Amount', 'Invoiced Amount', 'Paid Amount', 'Status'],
          filteredMilestones.map((m) => [
            m.milestoneCode,
            m.salesOrderNumber,
            `"${m.customerName}"`,
            `"${m.description}"`,
            m.percentage,
            m.dueDate,
            m.amount,
            m.invoicedAmount,
            m.paidAmount,
            m.status,
          ])
        );
        break;
      case 'gst_tax_register':
        downloadCsv(
          'GST_Tax_Register',
          ['Invoice #', 'Date', 'Customer', 'GSTIN', 'Place of Supply', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Invoice', 'Paid', 'Balance'],
          filteredInvoices.map((i) => [
            i.invoiceNumber,
            i.invoiceDate,
            `"${i.customerName}"`,
            i.customerGstin || 'Unregistered',
            `"${i.billingAddress.state} (${i.billingAddress.stateCode})"`,
            i.subtotalTaxable,
            i.totalCgst,
            i.totalSgst,
            i.totalIgst,
            i.grandTotal,
            i.paidAmount,
            i.balanceAmount,
          ])
        );
        break;
      case 'collection_register':
        downloadCsv(
          'Payment_Collection_Register',
          ['Receipt #', 'Date', 'Customer', 'Invoice #', 'Payment Mode', 'Bank Account', 'Transaction UTR', 'Amount', 'Recorded By'],
          filteredPayments.map((p) => [
            p.receiptNumber,
            p.paymentDate,
            `"${p.customerName}"`,
            p.invoiceNumber || '',
            p.paymentMode,
            `"${p.bankCashAccount}"`,
            p.transactionReference,
            p.amount,
            `"${p.recordedByName}"`,
          ])
        );
        break;
      case 'ledger_aging_register':
        downloadCsv(
          'Customer_Ledger_AR_Report',
          ['Customer Code', 'Customer Name', 'GSTIN', 'Orders Count', 'Total Ordered', 'Total Invoiced (Debit)', 'Total Collected (Credit)', 'Net Receivable Balance', 'Overdue Amount'],
          customerLedgerRows.map((r) => [
            r.customer.customerCode,
            `"${r.customer.name}"`,
            r.customer.gstin || 'Unregistered',
            r.ordersCount,
            r.totalOrdered,
            r.totalBilled,
            r.totalPaid,
            r.netReceivable,
            r.overdueAmount,
          ])
        );
        break;
      case 'activity_register':
        downloadCsv(
          'Activities_Followups_Report',
          ['Type', 'Subject', 'Date', 'Time', 'Customer / Lead', 'Assigned To', 'Priority', 'Status'],
          filteredActivities.map((a) => [
            a.activityType,
            `"${a.subject}"`,
            a.date,
            a.time || '',
            `"${a.customerName || a.leadNumber || 'General'}"`,
            `"${a.assignedUserName}"`,
            a.priority,
            a.status,
          ])
        );
        break;
      case 'support_register':
        downloadCsv(
          'Support_And_AMC_Register',
          ['Ticket #', 'Date', 'Customer', 'Subject', 'Module', 'Category', 'Priority', 'Status', 'AMC Contract #', 'Billable Amt', 'Invoice #', 'Assigned Engineer'],
          filteredSupportTickets.map((t) => [
            t.ticketNumber,
            t.createdAt?.split('T')[0] || '',
            `"${t.customerName}"`,
            `"${t.subject}"`,
            `"${t.moduleName}"`,
            t.category,
            t.priority,
            t.status,
            t.contractNumber || 'Non-AMC',
            t.estimatedBillingAmount || 0,
            t.linkedInvoiceNumber || '',
            `"${t.assignedToName}"`,
          ])
        );
        break;
      case 'purchase_register':
        downloadCsv(
          'Purchase_Orders_Register',
          ['PO Number', 'Date', 'Vendor Name', 'Vendor GSTIN', 'Terms', 'Taxable Value', 'GST Tax', 'Grand Total', 'Status'],
          filteredPurchaseOrders.map((po) => [
            po.poNumber,
            po.poDate,
            `"${po.vendorName}"`,
            po.vendorGstin || '',
            `"${po.paymentTerms || ''}"`,
            po.taxableAmount,
            po.totalTax,
            po.grandTotal,
            po.status,
          ])
        );
        break;
    }
  };

  // Contextual 4-metric KPI summary strip for the active report
  const activeSummaryKpis = useMemo(() => {
    switch (activeReport) {
      case 'lead_register': {
        const totalVal = filteredLeads.reduce((s, l) => s + l.estimatedValue, 0);
        const qualified = filteredLeads.filter((l) => ['Qualified', 'Proposal', 'Negotiation', 'Won'].includes(l.status)).length;
        const converted = filteredLeads.filter((l) => l.isConverted || l.status === 'Won').length;
        return [
          { label: 'Total Leads', value: String(filteredLeads.length), sub: 'Filtered pipeline records' },
          { label: 'Estimated Pipeline', value: formatCurrency(totalVal), sub: 'Total opportunity potential' },
          { label: 'Qualified & Active', value: String(qualified), sub: 'Ready for commercial proposal' },
          { label: 'Converted / Won', value: String(converted), sub: 'Converted to deals/customers' },
        ];
      }
      case 'opportunity_register': {
        const totalDeal = filteredOpportunities.reduce((s, o) => s + o.estimatedDealValue, 0);
        const weighted = filteredOpportunities.reduce(
          (s, o) => s + Math.round((o.estimatedDealValue * o.probability) / 100),
          0
        );
        const avgProb =
          filteredOpportunities.length > 0
            ? Math.round(filteredOpportunities.reduce((s, o) => s + o.probability, 0) / filteredOpportunities.length)
            : 0;
        return [
          { label: 'Active Opportunities', value: String(filteredOpportunities.length), sub: 'Deals in funnel' },
          { label: 'Total Deal Value', value: formatCurrency(totalDeal), sub: 'Unweighted pipeline value' },
          { label: 'Weighted Forecast', value: formatCurrency(weighted), sub: 'Probability-adjusted value' },
          { label: 'Average Win Prob.', value: `${avgProb}%`, sub: 'Across filtered deals' },
        ];
      }
      case 'customer_register': {
        const activeCount = filteredCustomers.filter((c) => c.status === 'Active').length;
        const gstRegistered = filteredCustomers.filter((c) => Boolean(c.gstin)).length;
        const totalCredit = filteredCustomers.reduce((s, c) => s + (c.creditLimit || 0), 0);
        return [
          { label: 'Total Accounts', value: String(filteredCustomers.length), sub: 'Registered in Customer Master' },
          { label: 'Active Accounts', value: String(activeCount), sub: 'Currently transacting' },
          { label: 'GST Registered', value: String(gstRegistered), sub: 'Verified GSTIN on file' },
          { label: 'Total Credit Limit', value: formatCurrency(totalCredit), sub: 'Approved credit exposure' },
        ];
      }
      case 'sales_register': {
        const taxable = filteredOrders.reduce((s, o) => s + o.totalTaxable, 0);
        const gst = filteredOrders.reduce((s, o) => s + o.totalTax, 0);
        const grand = filteredOrders.reduce((s, o) => s + o.grandTotal, 0);
        return [
          { label: 'Sales Orders', value: String(filteredOrders.length), sub: 'Booked commercial contracts' },
          { label: 'Taxable Contract Value', value: formatCurrency(taxable), sub: 'Net before GST' },
          { label: 'Total GST Component', value: formatCurrency(gst), sub: 'CGST + SGST + IGST' },
          { label: 'Gross Order Value', value: formatCurrency(grand), sub: 'Total contract value' },
        ];
      }
      case 'milestone_register': {
        const totalAmt = filteredMilestones.reduce((s, m) => s + m.amount, 0);
        const paidAmt = filteredMilestones.reduce((s, m) => s + m.paidAmount, 0);
        const pendingAmt = Math.max(0, totalAmt - paidAmt);
        return [
          { label: 'Total Milestones', value: String(filteredMilestones.length), sub: 'Scheduled billing stages' },
          { label: 'Scheduled Value', value: formatCurrency(totalAmt), sub: 'Total milestone value' },
          { label: 'Realized / Paid', value: formatCurrency(paidAmt), sub: 'Collected milestone value' },
          { label: 'Pending Realization', value: formatCurrency(pendingAmt), sub: 'Upcoming & due balance' },
        ];
      }
      case 'gst_tax_register': {
        const taxable = filteredInvoices.reduce((s, i) => s + i.subtotalTaxable, 0);
        const gst = filteredInvoices.reduce((s, i) => s + i.totalTax, 0);
        const grand = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const balance = filteredInvoices.reduce((s, i) => s + i.balanceAmount, 0);
        return [
          { label: 'Taxable Turnover', value: formatCurrency(taxable), sub: `${filteredInvoices.length} GST Invoices` },
          { label: 'Total Output GST', value: formatCurrency(gst), sub: 'CGST + SGST + IGST liability' },
          { label: 'Gross Billed Value', value: formatCurrency(grand), sub: 'Total invoiced with tax' },
          { label: 'Balance Receivable', value: formatCurrency(balance), sub: 'Unpaid invoice balance' },
        ];
      }
      case 'collection_register': {
        const totalRec = filteredPayments.reduce((s, p) => s + p.amount, 0);
        const netRec = filteredPayments.reduce((s, p) => s + (p.netReceived || p.amount), 0);
        const tds = filteredPayments.reduce((s, p) => s + (p.tdsDeducted || 0), 0);
        return [
          { label: 'Payment Receipts', value: String(filteredPayments.length), sub: 'Recorded payment vouchers' },
          { label: 'Gross Collected', value: formatCurrency(totalRec), sub: 'Total receipt amount' },
          { label: 'Net Bank Realization', value: formatCurrency(netRec), sub: 'Credited to bank/cash' },
          { label: 'TDS Deducted', value: formatCurrency(tds), sub: 'Withholding tax certificates' },
        ];
      }
      case 'ledger_aging_register': {
        const billed = customerLedgerRows.reduce((s, r) => s + r.totalBilled, 0);
        const paid = customerLedgerRows.reduce((s, r) => s + r.totalPaid, 0);
        const netAr = customerLedgerRows.reduce((s, r) => s + r.netReceivable, 0);
        const overdue = customerLedgerRows.reduce((s, r) => s + r.overdueAmount, 0);
        return [
          { label: 'Total Billed (Debit)', value: formatCurrency(billed), sub: `${customerLedgerRows.length} Customer Ledgers` },
          { label: 'Total Collected (Credit)', value: formatCurrency(paid), sub: 'Payments credited' },
          { label: 'Net Receivable Balance', value: formatCurrency(netAr), sub: 'Closing AR balance' },
          { label: 'Overdue Receivables', value: formatCurrency(overdue), sub: 'Past due date invoices' },
        ];
      }
      case 'activity_register': {
        const pending = filteredActivities.filter((a) => a.status === 'Pending').length;
        const completed = filteredActivities.filter((a) => a.status === 'Completed').length;
        const highPrio = filteredActivities.filter((a) => a.priority === 'High').length;
        return [
          { label: 'Total Activities', value: String(filteredActivities.length), sub: 'Logged tasks & calls' },
          { label: 'Pending Execution', value: String(pending), sub: 'Open follow-ups' },
          { label: 'Completed', value: String(completed), sub: 'Closed activities' },
          { label: 'High Priority', value: String(highPrio), sub: 'Urgent customer actions' },
        ];
      }
      case 'support_register': {
        const openCount = filteredSupportTickets.filter((t) => t.status !== 'Closed' && t.status !== 'Resolved').length;
        const activeAmcs = amcContracts.filter((a) => a.status === 'Active' || a.status === 'Expiring Soon').length;
        const amcArr = amcContracts.reduce((s, a) => s + a.annualValue, 0);
        const crRev = changeRequests.reduce((s, cr) => s + cr.totalAmount, 0);
        return [
          { label: 'Support Tickets', value: `${filteredSupportTickets.length} (${openCount} Open)`, sub: 'Logged service desk tickets' },
          { label: 'Active AMC Contracts', value: String(activeAmcs), sub: 'Annual Maintenance Agreements' },
          { label: 'Total AMC Value', value: formatCurrency(amcArr), sub: 'Contracted AMC portfolio' },
          { label: 'Change Request Value', value: formatCurrency(crRev), sub: `${changeRequests.length} CR enhancements` },
        ];
      }
      case 'purchase_register': {
        const taxable = filteredPurchaseOrders.reduce((s, p) => s + p.taxableAmount, 0);
        const tax = filteredPurchaseOrders.reduce((s, p) => s + p.totalTax, 0);
        const grand = filteredPurchaseOrders.reduce((s, p) => s + p.grandTotal, 0);
        return [
          { label: 'Purchase Orders', value: String(filteredPurchaseOrders.length), sub: 'Issued procurement orders' },
          { label: 'Taxable Procurement', value: formatCurrency(taxable), sub: 'Net vendor PO value' },
          { label: 'Input GST Credit', value: formatCurrency(tax), sub: 'CGST + SGST + IGST on POs' },
          { label: 'Gross PO Value', value: formatCurrency(grand), sub: 'Total vendor commitment' },
        ];
      }
    }
  }, [
    activeReport,
    filteredLeads,
    filteredOpportunities,
    filteredCustomers,
    filteredOrders,
    filteredMilestones,
    filteredInvoices,
    filteredPayments,
    customerLedgerRows,
    filteredActivities,
    filteredSupportTickets,
    filteredPurchaseOrders,
    amcContracts,
    changeRequests,
    formatCurrency,
  ]);

  const currentMeta = REPORT_META[activeReport];
  const ActiveIcon = currentMeta.icon;

  return (
    <div className="space-y-5">
      {/* Clean Top Header & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Active Module Report Title & Description */}
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
              <ActiveIcon className="w-3.5 h-3.5" />
              <span>{currentMeta.moduleLabel}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{currentMeta.title}</span>
            </h2>
          </div>

          {/* Right Toolbar: Module Selector, Date Range, Search & Export CSV */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Compact Module Report Switcher */}
            <div className="relative">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={activeReport}
                onChange={(e) => {
                  const next = e.target.value as ReportTabKey;
                  setActiveReport(next);
                  onNavigate?.('reports', next);
                }}
                aria-label="Select module report"
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer transition"
              >
                {(canView('leads') ||
                  canView('opportunities') ||
                  canView('customers') ||
                  canView('orders')) && (
                  <optgroup label="Sales Engine">
                    {canView('leads') && (
                      <option value="lead_register">Lead Management Report</option>
                    )}
                    {canView('opportunities') && (
                      <option value="opportunity_register">Opportunity Deal Report</option>
                    )}
                    {canView('customers') && (
                      <option value="customer_register">Customer Master 360 Report</option>
                    )}
                    {canView('orders') && (
                      <option value="sales_register">Sales Orders Report</option>
                    )}
                  </optgroup>
                )}
                {(canView('support') || canView('purchases')) && (
                  <optgroup label="Support, AMC & Procurement">
                    {canView('support') && (
                      <option value="support_register">Support & AMC Report</option>
                    )}
                    {canView('purchases') && (
                      <option value="purchase_register">Purchase Orders Report</option>
                    )}
                  </optgroup>
                )}
                {(canView('milestones') ||
                  canView('invoices') ||
                  canView('payments') ||
                  canView('ledger')) && (
                  <optgroup label="Finance & Billing">
                    {canView('milestones') && (
                      <option value="milestone_register">Payment Milestones Report</option>
                    )}
                    {canView('invoices') && (
                      <option value="gst_tax_register">Invoices & GST Report</option>
                    )}
                    {canView('payments') && (
                      <option value="collection_register">Payments & Collections Report</option>
                    )}
                    {canView('ledger') && (
                      <option value="ledger_aging_register">Customer Ledger & AR Report</option>
                    )}
                  </optgroup>
                )}
                {canView('activities') && (
                  <optgroup label="Operations">
                    <option value="activity_register">Activities & Follow-ups Report</option>
                  </optgroup>
                )}
                {canView('masters') && (
                  <optgroup label="Admin HR & Payroll">
                    <option value="employee_attendance_register">
                      Employee Info, Requests &amp; GPS Attendance Report
                    </option>
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {canView('masters') && (
              <button
                type="button"
                onClick={() => {
                  const next: ReportTabKey =
                    activeReport === 'employee_attendance_register'
                      ? 'lead_register'
                      : 'employee_attendance_register';
                  setActiveReport(next);
                  onNavigate?.('reports', next);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeReport === 'employee_attendance_register'
                    ? 'bg-[#1f7e9e] text-white border-[#1f7e9e]'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                }`}
              >
                {activeReport === 'employee_attendance_register'
                  ? 'Viewing Employee & GPS Attendance Report'
                  : 'Employee Info, Requests & GPS Attendance Report'}
              </button>
            )}

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="All Time Period"
              align="right"
            />

            <div className="relative min-w-[185px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none transition"
              />
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                title="Reset all filters"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportActiveReport}
              className="flex items-center gap-1.5 px-3.5 py-2 sidebar-tab-active-depth hover:bg-slate-200/70 text-slate-900 font-bold rounded-xl text-xs cursor-pointer transition whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Active Date Filter Banner */}
        {(dateRange.startDate || dateRange.endDate) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-blue-700">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date Filter:</span>
              </span>
              <span className="font-semibold text-slate-900 font-mono">
                {dateRange.startDate && dateRange.endDate
                  ? `${formatDisplayDate(dateRange.startDate)} – ${formatDisplayDate(dateRange.endDate)}`
                  : dateRange.startDate
                  ? `From ${formatDisplayDate(dateRange.startDate)} onwards`
                  : `Up to ${formatDisplayDate(dateRange.endDate)}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer shrink-0"
            >
              Clear Date Range
            </button>
          </div>
        )}
      </div>

      {/* Contextual 4-Card KPI Strip for the Active Module Report */}
      {activeReport !== 'employee_attendance_register' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {(activeSummaryKpis || []).map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {kpi.label}
              </div>
              <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 mt-1 truncate">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 0. ADMIN EMPLOYEE INFO, REQUESTS & GOOGLE COORDINATES ATTENDANCE REPORT */}
      {activeReport === 'employee_attendance_register' && (
        <PayrollAdminDashboardReportSection />
      )}

      {/* 1. LEAD MANAGEMENT REPORT TABLE */}
      {activeReport === 'lead_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Lead #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">State & Code</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Est. Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Lead Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No lead records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => onNavigate?.('leads', l.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{l.leadNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{l.leadDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{l.companyName}</td>
                      <td className="py-3 px-4 text-slate-700">{l.contactPerson}</td>
                      <td className="py-3 px-4 text-slate-600">{l.state} ({l.stateCode})</td>
                      <td className="py-3 px-4 text-slate-600">{l.leadSource}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(l.estimatedValue)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{l.leadOwnerName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. OPPORTUNITY MANAGEMENT REPORT TABLE */}
      {activeReport === 'opportunity_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Opportunity #</th>
                  <th className="py-3.5 px-4">Deal Name</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4 text-right">Prob. %</th>
                  <th className="py-3.5 px-4">Exp. Close</th>
                  <th className="py-3.5 px-4 text-right">Deal Value</th>
                  <th className="py-3.5 px-4 text-right">Weighted Forecast</th>
                  <th className="py-3.5 px-4">Sales Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No opportunity records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((op) => (
                    <tr
                      key={op.id}
                      onClick={() => onNavigate?.('opportunities', op.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{op.opportunityNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{op.opportunityName}</td>
                      <td className="py-3 px-4 text-slate-700">{op.customerName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700">
                          {op.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">{op.probability}%</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{op.expectedClosingDate}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(op.estimatedDealValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 tabular-nums">
                        {formatCurrency(Math.round((op.estimatedDealValue * op.probability) / 100))}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{op.salesOwnerName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER MASTER 360 REPORT TABLE */}
      {activeReport === 'customer_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Customer Code</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Segment</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">Industry</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4 text-right">Credit Limit</th>
                  <th className="py-3.5 px-4">Account Owner</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No customer accounts match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onNavigate?.('customers', c.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{c.customerCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.customerType} ({c.customerGroup})</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{c.gstin || 'Unregistered'}</td>
                      <td className="py-3 px-4 text-slate-600">{c.industry}</td>
                      <td className="py-3 px-4 text-slate-600">{c.paymentTermsName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.salesOwnerName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SALES ORDERS REPORT TABLE */}
      {activeReport === 'sales_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">SO #</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Tax Treatment</th>
                  <th className="py-3.5 px-4 text-right">Taxable</th>
                  <th className="py-3.5 px-4 text-right">GST Tax</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      No sales orders match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => onNavigate?.('orders', o.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{o.orderNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{o.orderDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{o.customerName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {o.isInterState ? 'Inter-state IGST' : 'Intra-state CGST+SGST'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium tabular-nums">{formatCurrency(o.totalTaxable)}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 tabular-nums">{formatCurrency(o.totalTax)}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(o.grandTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PAYMENT MILESTONES REPORT TABLE */}
      {activeReport === 'milestone_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Sales Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Share %</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Milestone Amt</th>
                  <th className="py-3.5 px-4 text-right">Paid Amt</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No payment milestones match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMilestones.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => onNavigate?.('milestones', m.salesOrderNumber)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{m.milestoneCode}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{m.salesOrderNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.customerName}</td>
                      <td className="py-3 px-4 text-slate-700">{m.description}</td>
                      <td className="py-3 px-4 text-right font-mono">{m.percentage}%</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.dueDate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(m.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatCurrency(m.paidAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. INVOICES & GST REPORT TABLE */}
      {activeReport === 'gst_tax_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Taxable</th>
                  <th className="py-3.5 px-4 text-right">CGST</th>
                  <th className="py-3.5 px-4 text-right">SGST</th>
                  <th className="py-3.5 px-4 text-right">IGST</th>
                  <th className="py-3.5 px-4 text-right">Invoice Total</th>
                  <th className="py-3.5 px-4 text-right text-rose-700">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400">
                      No GST invoices match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onNavigate?.('invoices', inv.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.customerGstin || 'Unregistered'}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium tabular-nums">{formatCurrency(inv.subtotalTaxable)}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 tabular-nums">
                        {inv.totalCgst > 0 ? formatCurrency(inv.totalCgst) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 tabular-nums">
                        {inv.totalSgst > 0 ? formatCurrency(inv.totalSgst) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 tabular-nums">
                        {inv.totalIgst > 0 ? formatCurrency(inv.totalIgst) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-600 tabular-nums">
                        {formatCurrency(inv.balanceAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. PAYMENTS & COLLECTIONS REPORT TABLE */}
      {activeReport === 'collection_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Bank Account</th>
                  <th className="py-3.5 px-4">UTR Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      No payment receipts match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pmt) => (
                    <tr
                      key={pmt.id}
                      onClick={() => onNavigate?.('payments', pmt.receiptNumber)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{pmt.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{pmt.paymentDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pmt.customerName}</td>
                      <td className="py-3 px-4 font-mono text-blue-700">{pmt.invoiceNumber || 'On Account'}</td>
                      <td className="py-3 px-4 text-slate-700">{pmt.paymentMode}</td>
                      <td className="py-3 px-4 text-slate-600">{pmt.bankCashAccount}</td>
                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold">{pmt.transactionReference}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700 font-mono tabular-nums">
                        {formatCurrency(pmt.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. CUSTOMER LEDGER & AR AGING REPORT TABLE */}
      {activeReport === 'ledger_aging_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Customer Code</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Booked Orders</th>
                  <th className="py-3.5 px-4 text-right">Total Billed (Dr)</th>
                  <th className="py-3.5 px-4 text-right">Total Received (Cr)</th>
                  <th className="py-3.5 px-4 text-right">Net Receivable</th>
                  <th className="py-3.5 px-4 text-right text-rose-700">Overdue AR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerLedgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      No customer ledger accounts match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  customerLedgerRows.map((row) => (
                    <tr
                      key={row.customer.id}
                      onClick={() => onNavigate?.('ledger', row.customer.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{row.customer.customerCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.customer.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{row.customer.gstin || 'Unregistered'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(row.totalOrdered)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(row.totalBilled)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                        {formatCurrency(row.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(row.netReceivable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                        {formatCurrency(row.overdueAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. ACTIVITIES & FOLLOW-UPS REPORT TABLE */}
      {activeReport === 'activity_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Activity Type</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Linked Account / Lead</th>
                  <th className="py-3.5 px-4">Assigned Executive</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      No activities match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => onNavigate?.('activities', a.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-bold text-blue-700">{a.activityType}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{a.subject}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {a.date} {a.time ? `• ${a.time}` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{a.customerName || a.leadNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{a.assignedUserName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {a.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. SUPPORT & AMC REPORT TABLE */}
      {activeReport === 'support_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Ticket #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject & Module</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">AMC Contract</th>
                  <th className="py-3.5 px-4 text-right">Billable / Invoice</th>
                  <th className="py-3.5 px-4">Assigned Engineer</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupportTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No support tickets match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSupportTickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => onNavigate?.('support', `TICKET:${t.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{t.ticketNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.customerName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{t.subject}</div>
                        <div className="text-[10px] text-slate-500">{t.moduleName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.category}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                        {t.contractNumber || 'Non-AMC'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {t.isBillable ? (
                          <div>
                            <div className="font-bold text-slate-900">{formatCurrency(t.estimatedBillingAmount || 0)}</div>
                            {t.linkedInvoiceNumber && (
                              <div className="text-[10px] text-indigo-600 font-bold">{t.linkedInvoiceNumber}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">AMC Covered</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{t.assignedToName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. PURCHASE ORDERS REPORT TABLE */}
      {activeReport === 'purchase_register' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">PO Date</th>
                  <th className="py-3.5 px-4">Vendor / Customer Ref</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">Linked SO #</th>
                  <th className="py-3.5 px-4 text-right">Taxable Value</th>
                  <th className="py-3.5 px-4 text-right">Input GST</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No purchase orders match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => onNavigate?.('purchases', po.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{po.poNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{po.poDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{po.vendorName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{po.vendorGstin || '—'}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700">{po.paymentTerms || 'Direct PO'}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(po.taxableAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 tabular-nums">{formatCurrency(po.totalTax)}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(po.grandTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700">
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
