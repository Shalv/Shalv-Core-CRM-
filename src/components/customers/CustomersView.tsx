import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { crmVisibleUsers } from '../../shared/userScope';
import { Customer, CustomerAddress, CustomerContact } from '../../types';
import {
  Building,
  Plus,
  Search,
  Filter,
  Download,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  UserCheck,
  Edit3,
  Trash2,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenTrace: (leadId?: string, customerId?: string, orderId?: string) => void;
  onNavigateToOrder: (orderId: string) => void;
  onNavigateToInvoice: (invoiceId: string) => void;
  onNavigateToPayment: (paymentId: string) => void;
  initialCustomerId?: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenTrace,
  onNavigateToOrder,
  onNavigateToInvoice,
  onNavigateToPayment,
  initialCustomerId,
}) => {
  const {
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
    milestones,
    invoices,
    payments,
    ledgerEntries,
    getCustomerBalance,
    formatCurrency,
    states,
    getStateCode,
    paymentTerms,
    users,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || customers[0]?.id || ''
  );

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);
  const [activeTab, setActiveTab] = useState<
    'ledger' | 'orders' | 'milestones' | 'invoices' | 'payments' | 'contacts_addresses' | 'timeline'
  >('ledger');

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    designation: 'Director',
    department: 'Management',
    mobile: '',
    email: '',
    isPrimary: true,
    isDecisionMaker: true,
    status: 'Active' as 'Active' | 'Inactive',
    notes: '',
  });

  // New Customer Form State
  const [newCust, setNewCust] = useState({
    name: '',
    customerType: 'Enterprise' as Customer['customerType'],
    customerGroup: 'Direct' as Customer['customerGroup'],
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Information Technology',
    paymentTermsId: paymentTerms[0]?.id || '',
    creditLimit: 2000000,
    currency: 'INR',
    status: 'Active' as Customer['status'],
    salesOwnerId: crmVisibleUsers(users)[0]?.id || '',
    remarks: '',
    addressLine1: '',
    city: 'New Delhi',
    state: states[6]?.stateName || 'Delhi',
    stateCode: '07',
    country: 'India',
    pincode: '110020',
  });

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
    type: 'Shipping' as CustomerAddress['type'],
    title: 'Site Delivery Office',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: states[0]?.stateName || 'Delhi',
    stateCode: '01',
    country: 'India',
    pincode: '',
    isDefault: false,
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Financial stats for selected customer
  const balance = selectedCustomer ? getCustomerBalance(selectedCustomer.id) : {
    totalInvoiced: 0,
    totalReceived: 0,
    outstanding: 0,
    creditLimit: 0,
    availableCredit: 0,
  };

  const customerOrders = selectedCustomer ? orders.filter((o) => o.customerId === selectedCustomer.id) : [];
  const customerMilestones = selectedCustomer ? milestones.filter((m) => m.customerId === selectedCustomer.id) : [];
  const customerInvoices = selectedCustomer ? invoices.filter((i) => i.customerId === selectedCustomer.id) : [];
  const customerPayments = selectedCustomer ? payments.filter((p) => p.customerId === selectedCustomer.id) : [];
  const customerLedger = selectedCustomer ? ledgerEntries.filter((l) => l.customerId === selectedCustomer.id) : [];
  const customerContacts = selectedCustomer ? contacts.filter((cnt) => cnt.customerId === selectedCustomer.id) : [];

  const openEditSelectedCustomer = () => {
    if (!selectedCustomer) return;
    const addr = selectedCustomer.addresses[0];
    setEditingCustomerId(selectedCustomer.id);
    setNewCust({
      name: selectedCustomer.name,
      customerType: selectedCustomer.customerType,
      customerGroup: selectedCustomer.customerGroup,
      gstin: selectedCustomer.gstin || '',
      pan: selectedCustomer.pan || '',
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      website: selectedCustomer.website || '',
      industry: selectedCustomer.industry,
      paymentTermsId: selectedCustomer.paymentTermsId,
      creditLimit: selectedCustomer.creditLimit,
      currency: selectedCustomer.currency,
      status: selectedCustomer.status,
      salesOwnerId: selectedCustomer.salesOwnerId,
      remarks: selectedCustomer.remarks || '',
      addressLine1: addr?.addressLine1 || '',
      city: addr?.city || 'New Delhi',
      state: addr?.state || 'Delhi',
      stateCode: addr?.stateCode || getStateCode(addr?.state || 'Delhi'),
      country: addr?.country || 'India',
      pincode: addr?.pincode || '110020',
    });
    setIsAddCustomerOpen(true);
  };

  const openAddNewCustomer = () => {
    setEditingCustomerId(null);
    setNewCust({
      name: '',
      customerType: 'Enterprise',
      customerGroup: 'Direct',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      website: '',
      industry: 'Information Technology',
      paymentTermsId: paymentTerms[0]?.id || '',
      creditLimit: 2000000,
      currency: 'INR',
      status: 'Active',
      salesOwnerId: crmVisibleUsers(users)[0]?.id || '',
      remarks: '',
      addressLine1: '',
      city: 'New Delhi',
      state: states[6]?.stateName || 'Delhi',
      stateCode: '07',
      country: 'India',
      pincode: '110020',
    });
    setIsAddCustomerOpen(true);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const owner =
      users.find((u) => u.id === newCust.salesOwnerId) || crmVisibleUsers(users)[0];
    const pTerm = paymentTerms.find((p) => p.id === newCust.paymentTermsId) || paymentTerms[0];
    const computedCode = getStateCode(newCust.state);

    if (editingCustomerId) {
      const target = customers.find((c) => c.id === editingCustomerId);
      const nextAddresses =
        target && target.addresses.length > 0
          ? target.addresses.map((a, idx) =>
              idx === 0
                ? {
                    ...a,
                    addressLine1: newCust.addressLine1 || a.addressLine1,
                    city: newCust.city,
                    state: newCust.state,
                    stateCode: computedCode,
                    pincode: newCust.pincode,
                  }
                : a
            )
          : [
              {
                id: `addr-${Date.now()}`,
                type: 'Billing' as const,
                title: 'Corporate Office',
                addressLine1: newCust.addressLine1 || 'Business District',
                city: newCust.city,
                state: newCust.state,
                stateCode: computedCode,
                country: newCust.country,
                pincode: newCust.pincode,
                isDefault: true,
              },
            ];

      updateCustomer(editingCustomerId, {
        name: newCust.name,
        customerType: newCust.customerType,
        customerGroup: newCust.customerGroup,
        gstin: newCust.gstin,
        pan: newCust.pan,
        email: newCust.email,
        phone: newCust.phone,
        website: newCust.website,
        industry: newCust.industry,
        paymentTermsId: pTerm.id,
        paymentTermsName: pTerm.name,
        creditLimit: newCust.creditLimit,
        status: newCust.status,
        salesOwnerId: owner.id,
        salesOwnerName: owner.name,
        remarks: newCust.remarks,
        addresses: nextAddresses,
      });
      setIsAddCustomerOpen(false);
      setEditingCustomerId(null);
      return;
    }

    const initialAddress: CustomerAddress = {
      id: `addr-${Date.now()}`,
      type: 'Billing',
      title: 'Corporate Office',
      addressLine1: newCust.addressLine1 || 'Business District',
      city: newCust.city,
      state: newCust.state,
      stateCode: computedCode,
      country: newCust.country,
      pincode: newCust.pincode,
      isDefault: true,
    };

    const created = addCustomer({
      name: newCust.name,
      customerType: newCust.customerType,
      customerGroup: newCust.customerGroup,
      gstin: newCust.gstin,
      pan: newCust.pan,
      email: newCust.email,
      phone: newCust.phone,
      website: newCust.website,
      industry: newCust.industry,
      paymentTermsId: pTerm.id,
      paymentTermsName: pTerm.name,
      creditLimit: newCust.creditLimit,
      currency: newCust.currency,
      status: newCust.status,
      salesOwnerId: owner.id,
      salesOwnerName: owner.name,
      remarks: newCust.remarks,
      addresses: [initialAddress],
    });

    setIsAddCustomerOpen(false);
    setSelectedCustomerId(created.id);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const computedCode = getStateCode(newAddr.state);

    if (editingAddressId) {
      updateCustomerAddress(selectedCustomer.id, editingAddressId, {
        type: newAddr.type,
        title: newAddr.title,
        addressLine1: newAddr.addressLine1,
        addressLine2: newAddr.addressLine2,
        city: newAddr.city,
        state: newAddr.state,
        stateCode: computedCode,
        country: newAddr.country,
        pincode: newAddr.pincode,
        isDefault: newAddr.isDefault,
      });
      setEditingAddressId(null);
      setIsAddAddressOpen(false);
      return;
    }

    addCustomerAddress(selectedCustomer.id, {
      type: newAddr.type,
      title: newAddr.title,
      addressLine1: newAddr.addressLine1,
      addressLine2: newAddr.addressLine2,
      city: newAddr.city,
      state: newAddr.state,
      stateCode: computedCode,
      country: newAddr.country,
      pincode: newAddr.pincode,
      isDefault: newAddr.isDefault,
    });

    setIsAddAddressOpen(false);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (editingContactId) {
      updateCustomerContact(editingContactId, {
        ...contactForm,
        customerId: selectedCustomer.id,
      });
    } else {
      addCustomerContact({
        ...contactForm,
        customerId: selectedCustomer.id,
      });
    }
    setIsContactModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" />
            <span>Customer Master & 360 Financial Profile</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddNewCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Directory */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers by code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 px-1">
              <span>{filteredCustomers.length} Accounts Registered</span>
              <span className="font-semibold text-indigo-600">Active Master</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const custBal = getCustomerBalance(cust.id);

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start justify-between text-xs ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.2 rounded">
                        {cust.customerCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">({cust.customerType})</span>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug">{cust.name}</h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{cust.addresses[0]?.city || 'City'}, {cust.addresses[0]?.state} (Code {cust.addresses[0]?.stateCode})</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] pt-1">
                      <span className="text-slate-500">Outstanding:</span>
                      <span className={`font-bold ${custBal.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(custBal.outstanding)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-2 ${isSelected ? 'text-indigo-600' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer 360 Profile & Statements */}
        {selectedCustomer ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {selectedCustomer.customerCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                      {selectedCustomer.status}
                    </span>
                    {selectedCustomer.fromLeadNumber && (
                      <span className="text-xs text-slate-400">
                        Origin: {selectedCustomer.fromLeadNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedCustomer.name}</h3>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                    <span>GSTIN: <strong className="font-mono text-slate-700">{selectedCustomer.gstin || 'Unregistered'}</strong></span>
                    <span>•</span>
                    <span>Industry: <strong className="text-slate-700">{selectedCustomer.industry}</strong></span>
                    <span>•</span>
                    <span>Owner: <strong className="text-slate-700">{selectedCustomer.salesOwnerName}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditSelectedCustomer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Customer</span>
                  </button>
                  <button
                    onClick={() => onOpenTrace(selectedCustomer.fromLeadId, selectedCustomer.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Trace Full Lifecycle</span>
                  </button>
                </div>
              </div>

              {/* Clickable Financial Dashboard Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden ${
                    activeTab === 'orders'
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                  }`}
                >
                  <span className="text-slate-500 block text-[11px] truncate">Total Sales</span>
                  <span
                    className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5 block truncate"
                    title={formatCurrency(balance.totalInvoiced)}
                  >
                    {formatCurrency(balance.totalInvoiced)}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium truncate block">
                    {customerOrders.length} Orders · View Tab →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden ${
                    activeTab === 'payments'
                      ? 'bg-emerald-100/70 border-emerald-400 shadow-2xs'
                      : 'bg-emerald-50/60 hover:bg-emerald-100/50 border-emerald-100'
                  }`}
                >
                  <span className="text-emerald-700 block text-[11px] truncate">Total Collected</span>
                  <span
                    className="text-sm font-bold font-mono tabular-nums text-emerald-800 mt-0.5 block truncate"
                    title={formatCurrency(balance.totalReceived)}
                  >
                    {formatCurrency(balance.totalReceived)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium truncate block">
                    {customerPayments.length} Receipts · View Tab →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden ${
                    activeTab === 'ledger'
                      ? 'bg-rose-100/70 border-rose-400 shadow-2xs'
                      : 'bg-rose-50/60 hover:bg-rose-100/50 border-rose-100'
                  }`}
                >
                  <span className="text-rose-700 block text-[11px] truncate">Outstanding Balance</span>
                  <span
                    className="text-sm font-bold font-mono tabular-nums text-rose-800 mt-0.5 block truncate"
                    title={formatCurrency(balance.outstanding)}
                  >
                    {formatCurrency(balance.outstanding)}
                  </span>
                  <span className="text-[10px] text-rose-700 font-medium truncate block">
                    AR Statement · View Tab →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openEditSelectedCustomer}
                  className="text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-indigo-300 transition cursor-pointer min-w-0 overflow-hidden"
                >
                  <span className="text-slate-500 block text-[11px] truncate">Credit Limit</span>
                  <span
                    className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5 block truncate"
                    title={formatCurrency(balance.creditLimit)}
                  >
                    {formatCurrency(balance.creditLimit)}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium truncate block">
                    Edit Credit Limit →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer min-w-0 overflow-hidden ${
                    activeTab === 'invoices'
                      ? 'bg-indigo-100/70 border-indigo-400 shadow-2xs'
                      : 'bg-indigo-50/60 hover:bg-indigo-100/50 border-indigo-100'
                  }`}
                >
                  <span className="text-indigo-700 block text-[11px] truncate">Available Credit</span>
                  <span
                    className="text-sm font-bold font-mono tabular-nums text-indigo-800 mt-0.5 block truncate"
                    title={formatCurrency(balance.availableCredit)}
                  >
                    {formatCurrency(balance.availableCredit)}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium truncate block">
                    {customerInvoices.length} Invoices · View Tab →
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center gap-1.5 p-2 border-b border-slate-200 bg-slate-50/80 overflow-x-auto text-xs font-semibold max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'ledger'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Customer Ledger Statement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'orders'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>Sales Orders ({customerOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'milestones'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span>Milestones ({customerMilestones.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'invoices'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Invoices ({customerInvoices.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'payments'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Payments ({customerPayments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('contacts_addresses')}
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'contacts_addresses'
                      ? 'sidebar-tab-active-depth text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Addresses & Masters</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 text-xs">
                {/* TAB 1: Customer Financial Ledger */}
                {activeTab === 'ledger' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Account Ledger Statement</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Net Closing Outstanding:</span>
                        <span className="font-bold text-sm text-slate-900">{formatCurrency(balance.outstanding)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Reference #</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Debit (₹)</th>
                            <th className="p-3 text-right">Credit (₹)</th>
                            <th className="p-3 text-right">Running Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerLedger.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400">
                                No ledger transactions posted yet.
                              </td>
                            </tr>
                          ) : (
                            customerLedger.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-slate-600">{entry.date}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      entry.type === 'INVOICE'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-indigo-700">{entry.referenceNumber}</td>
                                <td className="p-3 text-slate-700">{entry.description}</td>
                                <td className="p-3 text-right font-medium text-rose-600">
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                                </td>
                                <td className="p-3 text-right font-medium text-emerald-600">
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900 font-mono">
                                  {formatCurrency(entry.runningBalance)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: Sales Orders */}
                {activeTab === 'orders' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 text-sm">Linked Sales Orders</h4>
                    </div>

                    <div className="space-y-2">
                      {customerOrders.length === 0 ? (
                        <p className="text-slate-400 italic">No orders found.</p>
                      ) : (
                        customerOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-indigo-50/40 transition"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700">{ord.orderNumber}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                  {ord.orderDate}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{ord.items.map((i) => i.productName).join(', ')}</p>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <span className="font-bold text-slate-900 block">{formatCurrency(ord.grandTotal)}</span>
                                <span className="text-[10px] text-slate-400">{ord.status}</span>
                              </div>
                              <button
                                onClick={() => onNavigateToOrder(ord.id)}
                                className="p-1.5 text-indigo-600 hover:bg-white rounded-lg border border-slate-200"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Milestones */}
                {activeTab === 'milestones' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">Milestone Schedule</h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Description</th>
                            <th className="p-2.5 text-right">%</th>
                            <th className="p-2.5 text-right">Amount</th>
                            <th className="p-2.5">Due Date</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerMilestones.map((m) => (
                            <tr key={m.id}>
                              <td className="p-2.5 font-bold text-indigo-700">{m.milestoneCode}</td>
                              <td className="p-2.5 text-slate-700">{m.description}</td>
                              <td className="p-2.5 text-right font-medium">{m.percentage}%</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(m.amount)}</td>
                              <td className="p-2.5 font-mono text-slate-600">{m.dueDate}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                  m.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                                  m.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: Invoices */}
                {activeTab === 'invoices' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">Tax Invoices</h4>
                    <div className="space-y-2">
                      {customerInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-700">{inv.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Date: {inv.invoiceDate}</span>
                            </div>
                            <span className="text-[11px] text-slate-600">Due: {inv.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="font-bold text-slate-900 block">{formatCurrency(inv.grandTotal)}</span>
                              <span className={`text-[10px] font-bold ${inv.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                Bal: {formatCurrency(inv.balanceAmount)}
                              </span>
                            </div>
                            <button
                              onClick={() => onNavigateToInvoice(inv.id)}
                              className="p-1.5 text-indigo-600 hover:bg-white rounded-lg border border-slate-200"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: Payments */}
                {activeTab === 'payments' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">Payment Receipts</h4>
                    <div className="space-y-2">
                      {customerPayments.map((pmt) => (
                        <div
                          key={pmt.id}
                          className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-emerald-800">{pmt.receiptNumber}</span>
                            <div className="text-[11px] text-slate-600">
                              Mode: {pmt.paymentMode} ({pmt.transactionReference})
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-700 text-sm">{formatCurrency(pmt.amount)}</span>
                            <span className="text-[10px] text-slate-400 block">{pmt.paymentDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 6: Addresses & Contacts Masters */}
                {activeTab === 'contacts_addresses' && (
                  <div className="space-y-6">
                    {/* Customer Contacts Section */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Customer Contact Persons</h4>
                        </div>
                        <button
                          onClick={() => {
                            setEditingContactId(null);
                            setContactForm({
                              name: '',
                              designation: 'Manager',
                              department: 'Operations',
                              mobile: '+91 ',
                              email: '',
                              isPrimary: customerContacts.length === 0,
                              isDecisionMaker: true,
                              status: 'Active',
                              notes: '',
                            });
                            setIsContactModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                        >
                          + Add Contact Person
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customerContacts.length === 0 ? (
                          <div className="col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400">
                            No contacts added for this customer yet.
                          </div>
                        ) : (
                          customerContacts.map((cnt) => (
                            <div key={cnt.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>{cnt.name}</span>
                                    {cnt.isPrimary && (
                                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {cnt.designation} • {cnt.department}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingContactId(cnt.id);
                                      setContactForm({
                                        name: cnt.name,
                                        designation: cnt.designation,
                                        department: cnt.department,
                                        mobile: cnt.mobile,
                                        email: cnt.email,
                                        isPrimary: cnt.isPrimary,
                                        isDecisionMaker: cnt.isDecisionMaker,
                                        status: cnt.status,
                                        notes: cnt.notes || '',
                                      });
                                      setIsContactModalOpen(true);
                                    }}
                                    className="p-1 text-indigo-600 hover:bg-white rounded border border-slate-200"
                                    title="Edit Contact"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteCustomerContact(cnt.id)}
                                    className="p-1 text-rose-600 hover:bg-white rounded border border-slate-200"
                                    title="Delete Contact"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-[11px] font-mono text-slate-700 pt-1">
                                <div>{cnt.mobile}</div>
                                <div className="text-slate-500">{cnt.email}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Customer Addresses Section */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm">Customer Delivery & Billing Addresses</h4>
                        <button
                          onClick={() => {
                            setEditingAddressId(null);
                            setNewAddr({
                              type: 'Shipping',
                              title: 'Site Delivery Office',
                              addressLine1: '',
                              addressLine2: '',
                              city: '',
                              state: states[0]?.stateName || 'Delhi',
                              stateCode: getStateCode(states[0]?.stateName || 'Delhi'),
                              country: 'India',
                              pincode: '',
                              isDefault: false,
                            });
                            setIsAddAddressOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                        >
                          + Add Address
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedCustomer.addresses.map((addr) => (
                          <div key={addr.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                  {addr.type} Address
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">
                                    Default
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingAddressId(addr.id);
                                    setNewAddr({
                                      type: addr.type,
                                      title: addr.title || '',
                                      addressLine1: addr.addressLine1,
                                      addressLine2: addr.addressLine2 || '',
                                      city: addr.city,
                                      state: addr.state,
                                      stateCode: addr.stateCode,
                                      country: addr.country,
                                      pincode: addr.pincode,
                                      isDefault: addr.isDefault,
                                    });
                                    setIsAddAddressOpen(true);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-white rounded border border-slate-200"
                                  title="Edit Address"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {selectedCustomer.addresses.length > 1 && (
                                  <button
                                    onClick={() => deleteCustomerAddress(selectedCustomer.id, addr.id)}
                                    className="p-1 text-rose-600 hover:bg-white rounded border border-slate-200"
                                    title="Delete Address"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-800 text-xs font-medium pt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p className="text-slate-600 text-[11px]">{addr.addressLine2}</p>}
                            <p className="text-slate-600 text-[11px]">
                              {addr.city}, {addr.pincode}
                            </p>
                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">State: {addr.state}</span>
                              <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                GST Code: {addr.stateCode}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingCustomerId ? 'Edit Master Customer' : 'Register Master Customer'}
                </h3>
              </div>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Customer / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newCust.name}
                    onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="e.g. Tata Consultancy Services Ltd"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Type</label>
                  <select
                    value={newCust.customerType}
                    onChange={(e) => setNewCust({ ...newCust, customerType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="SME">SME</option>
                    <option value="Government">Government</option>
                    <option value="Startup">Startup</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Industry</label>
                  <input
                    type="text"
                    value={newCust.industry}
                    onChange={(e) => setNewCust({ ...newCust, industry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={newCust.gstin}
                    onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value })}
                    placeholder="07AAACA1234F1Z5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN</label>
                  <input
                    type="text"
                    value={newCust.pan}
                    onChange={(e) => setNewCust({ ...newCust, pan: e.target.value })}
                    placeholder="AAACA1234F"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                  <select
                    value={newCust.paymentTermsId}
                    onChange={(e) => setNewCust({ ...newCust, paymentTermsId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium"
                  >
                    {paymentTerms.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    step="100000"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Address with automatic state code */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3">
                <div className="font-bold text-indigo-900 text-xs">Primary Billing Address</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">State *</label>
                    <select
                      value={newCust.state}
                      onChange={(e) => {
                        const stName = e.target.value;
                        const code = getStateCode(stName);
                        setNewCust({ ...newCust, state: stName, stateCode: code });
                      }}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-medium"
                    >
                      {states.map((s) => (
                        <option key={s.id} value={s.stateName}>{s.stateName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">GST State Code (Auto)</label>
                    <input
                      type="text"
                      readOnly
                      value={newCust.stateCode}
                      className="w-full bg-slate-200 border border-slate-300 font-mono font-bold text-indigo-800 rounded p-1.5 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">City</label>
                    <input
                      type="text"
                      value={newCust.city}
                      onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">Address Line</label>
                  <input
                    type="text"
                    value={newCust.addressLine1}
                    onChange={(e) => setNewCust({ ...newCust, addressLine1: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md"
                >
                  {editingCustomerId ? 'Update Master Customer' : 'Save Master Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CONTACT MODAL */}
      {isContactModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">
                {editingContactId ? 'Edit Customer Contact' : 'Add Customer Contact'}
              </h3>
              <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSaveContact} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.designation}
                    onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={contactForm.isPrimary}
                    onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  />
                  <span>Primary Contact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={contactForm.isDecisionMaker}
                    onChange={(e) => setContactForm({ ...contactForm, isDecisionMaker: e.target.checked })}
                  />
                  <span>Decision Maker</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md"
                >
                  {editingContactId ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {isAddAddressOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Customer Address</h3>
              </div>
              <button onClick={() => setIsAddAddressOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddAddress} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Address Type</label>
                  <select
                    value={newAddr.type}
                    onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="Shipping">Shipping</option>
                    <option value="Billing">Billing</option>
                    <option value="Registered Office">Registered Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Address Title / Label</label>
                  <input
                    type="text"
                    value={newAddr.title}
                    onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
                    placeholder="e.g. Pune Factory Warehouse"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                  placeholder="Plot / Street / Building"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <select
                    value={newAddr.state}
                    onChange={(e) => {
                      const stName = e.target.value;
                      const code = getStateCode(stName);
                      setNewAddr({ ...newAddr, state: stName, stateCode: code });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.stateName}>{s.stateName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST State Code (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value={newAddr.stateCode}
                    className="w-full bg-slate-200 border border-slate-300 font-mono font-bold text-indigo-700 rounded-lg p-2 text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
