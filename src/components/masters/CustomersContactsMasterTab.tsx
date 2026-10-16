import { confirmSave } from '../../shared/confirm';
import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { crmVisibleUsers } from '../../shared/userScope';
import { Customer, CustomerContact } from '../../types';
import {
  Building,
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

interface CustomersContactsMasterTabProps {
  searchQuery: string;
}

export const CustomersContactsMasterTab: React.FC<CustomersContactsMasterTabProps> = ({
  searchQuery,
}) => {
  const {
    customers,
    contacts,
    users,
    states,
    paymentTerms,
    getStateCode,
    currentUser,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerContact,
    updateCustomerContact,
    deleteCustomerContact,
    formatCurrency,
    canCreate,
    canEdit,
    canDelete,
  } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'contacts'>('customers');

  // Customer Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custForm, setCustForm] = useState<{
    name: string;
    customerType: Customer['customerType'];
    customerGroup: Customer['customerGroup'];
    gstin: string;
    pan: string;
    email: string;
    phone: string;
    website: string;
    industry: string;
    paymentTermsId: string;
    creditLimit: number;
    status: Customer['status'];
    salesOwnerId: string;
    state: string;
    stateCode: string;
    city: string;
    pincode: string;
    addressLine1: string;
    remarks: string;
  }>({
    name: '',
    customerType: 'Enterprise',
    customerGroup: 'Direct',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Manufacturing',
    paymentTermsId: paymentTerms[0]?.id || '',
    creditLimit: 2000000,
    status: 'Active',
    salesOwnerId: currentUser.id,
    state: 'Delhi',
    stateCode: getStateCode('Delhi'),
    city: 'New Delhi',
    pincode: '110020',
    addressLine1: '',
    remarks: '',
  });

  // Contact Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    customerId: customers[0]?.id || '',
    name: '',
    designation: '',
    department: 'Management',
    mobile: '',
    email: '',
    alternatePhone: '',
    isPrimary: true,
    isDecisionMaker: true,
    status: 'Active' as CustomerContact['status'],
  });

  const openAddCustomer = () => {
    setEditingCustomerId(null);
    setCustForm({
      name: '',
      customerType: 'Enterprise',
      customerGroup: 'Direct',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      website: '',
      industry: 'Manufacturing',
      paymentTermsId: paymentTerms[0]?.id || '',
      creditLimit: 2000000,
      status: 'Active',
      salesOwnerId: currentUser.id,
      state: 'Delhi',
      stateCode: getStateCode('Delhi'),
      city: 'New Delhi',
      pincode: '110020',
      addressLine1: '',
      remarks: '',
    });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (c: Customer) => {
    const primaryAddr = c.addresses[0];
    setEditingCustomerId(c.id);
    setCustForm({
      name: c.name,
      customerType: c.customerType,
      customerGroup: c.customerGroup,
      gstin: c.gstin || '',
      pan: c.pan || '',
      email: c.email,
      phone: c.phone,
      website: c.website || '',
      industry: c.industry,
      paymentTermsId: c.paymentTermsId,
      creditLimit: c.creditLimit,
      status: c.status,
      salesOwnerId: c.salesOwnerId,
      state: primaryAddr?.state || 'Delhi',
      stateCode: primaryAddr?.stateCode || getStateCode(primaryAddr?.state || 'Delhi'),
      city: primaryAddr?.city || '',
      pincode: primaryAddr?.pincode || '',
      addressLine1: primaryAddr?.addressLine1 || '',
      remarks: c.remarks || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    if (!confirmSave('customer')) return;
    e.preventDefault();
    const owner = users.find((u) => u.id === custForm.salesOwnerId) || currentUser;
    const pTerm =
      paymentTerms.find((p) => p.id === custForm.paymentTermsId) || paymentTerms[0];
    const resolvedCode = getStateCode(custForm.state);

    if (editingCustomerId) {
      const existing = customers.find((c) => c.id === editingCustomerId);
      const updatedAddresses =
        existing && existing.addresses.length > 0
          ? existing.addresses.map((a, idx) =>
              idx === 0
                ? {
                    ...a,
                    addressLine1: custForm.addressLine1 || a.addressLine1,
                    city: custForm.city,
                    state: custForm.state,
                    stateCode: resolvedCode,
                    pincode: custForm.pincode,
                  }
                : a
            )
          : [
              {
                id: `addr-${Date.now()}`,
                type: 'Billing' as const,
                title: 'Corporate Office',
                addressLine1: custForm.addressLine1 || 'Corporate HQ',
                city: custForm.city,
                state: custForm.state,
                stateCode: resolvedCode,
                country: 'India',
                pincode: custForm.pincode,
                isDefault: true,
              },
            ];

      updateCustomer(editingCustomerId, {
        name: custForm.name,
        customerType: custForm.customerType,
        customerGroup: custForm.customerGroup,
        gstin: custForm.gstin,
        pan: custForm.pan,
        email: custForm.email,
        phone: custForm.phone,
        website: custForm.website,
        industry: custForm.industry,
        paymentTermsId: pTerm.id,
        paymentTermsName: pTerm.name,
        creditLimit: custForm.creditLimit,
        status: custForm.status,
        salesOwnerId: owner.id,
        salesOwnerName: owner.name,
        remarks: custForm.remarks,
        addresses: updatedAddresses,
      });
    } else {
      addCustomer({
        name: custForm.name,
        customerType: custForm.customerType,
        customerGroup: custForm.customerGroup,
        gstin: custForm.gstin,
        pan: custForm.pan,
        email: custForm.email,
        phone: custForm.phone,
        website: custForm.website,
        industry: custForm.industry,
        paymentTermsId: pTerm.id,
        paymentTermsName: pTerm.name,
        creditLimit: custForm.creditLimit,
        currency: 'INR',
        status: custForm.status,
        salesOwnerId: owner.id,
        salesOwnerName: owner.name,
        remarks: custForm.remarks,
        addresses: [
          {
            id: `addr-${Date.now()}`,
            type: 'Billing',
            title: 'Corporate Office',
            addressLine1: custForm.addressLine1 || 'Corporate HQ',
            city: custForm.city,
            state: custForm.state,
            stateCode: resolvedCode,
            country: 'India',
            pincode: custForm.pincode,
            isDefault: true,
          },
        ],
      });
    }
    setIsCustomerModalOpen(false);
  };

  const openAddContact = () => {
    setEditingContactId(null);
    setContactForm({
      customerId: customers[0]?.id || '',
      name: '',
      designation: 'Director / Executive',
      department: 'Management',
      mobile: '+91 ',
      email: '',
      alternatePhone: '',
      isPrimary: true,
      isDecisionMaker: true,
      status: 'Active',
    });
    setIsContactModalOpen(true);
  };

  const openEditContact = (cnt: CustomerContact) => {
    setEditingContactId(cnt.id);
    setContactForm({
      customerId: cnt.customerId,
      name: cnt.name,
      designation: cnt.designation,
      department: cnt.department,
      mobile: cnt.mobile,
      email: cnt.email,
      alternatePhone: cnt.alternatePhone || '',
      isPrimary: cnt.isPrimary,
      isDecisionMaker: cnt.isDecisionMaker,
      status: cnt.status,
    });
    setIsContactModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    if (!confirmSave('contact')) return;
    e.preventDefault();
    if (editingContactId) {
      updateCustomerContact(editingContactId, contactForm);
    } else {
      addCustomerContact(contactForm);
    }
    setIsContactModalOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredCustomers = customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q)
  );

  const filteredContacts = contacts.filter(
    (cnt) =>
      !q ||
      cnt.name.toLowerCase().includes(q) ||
      cnt.email.toLowerCase().includes(q) ||
      cnt.mobile.toLowerCase().includes(q) ||
      cnt.designation.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      {/* Subtab Segmented Switcher & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'customers'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Customers Master Directory</span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md">
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('contacts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'contacts'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contact Stakeholders Master</span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md">
              {contacts.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'customers' && canCreate('masters') && (
            <button
              type="button"
              onClick={openAddCustomer}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer Master</span>
            </button>
          )}

          {activeSubTab === 'contacts' && canCreate('masters') && (
            <button
              type="button"
              onClick={openAddContact}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact Person</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Customers Table */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Enterprise Customer Legal Entities & GST Profiles</span>
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-mono">Code</th>
                  <th className="py-3 px-4">Customer Company & Industry</th>
                  <th className="py-3 px-4 font-mono">GSTIN / PAN</th>
                  <th className="py-3 px-4">Registered State & Code</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4">Sales Owner</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Building className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {c.customerCode}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {c.customerType} • {c.industry}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <div className="font-semibold">{c.gstin || 'Unregistered'}</div>
                        <div className="text-[10px] text-slate-400">PAN: {c.pan || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {c.addresses[0]?.state || 'Delhi'}
                        </div>
                        <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                          Code: {c.addresses[0]?.stateCode || '07'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.creditLimit)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">{c.salesOwnerName}</td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            c.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canEdit('masters') && (
                            <button
                              type="button"
                              onClick={() => openEditCustomer(c)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Edit Customer Master"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete('masters') && (
                            <button
                              type="button"
                              onClick={() => deleteCustomer(c.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Contacts Table */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Customer Contact Persons & Key Decision Makers</span>
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-modern w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Linked Customer</th>
                  <th className="py-3 px-4">Designation & Dept</th>
                  <th className="py-3 px-4 font-mono">Mobile & Email</th>
                  <th className="py-3 px-4 text-center">Stakeholder Tags</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No contact persons found</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((cnt) => {
                    const cust = customers.find((c) => c.id === cnt.customerId);
                    return (
                      <tr key={cnt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cnt.name}</td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-indigo-700 block">
                            {cust?.name || 'Customer'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {cust?.customerCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{cnt.designation}</div>
                          <div className="text-[11px] text-slate-500">{cnt.department}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-700">{cnt.mobile}</div>
                          <div className="font-mono text-[11px] text-slate-400">{cnt.email}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-wrap gap-1 justify-center">
                            {cnt.isPrimary && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                                Primary
                              </span>
                            )}
                            {cnt.isDecisionMaker && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                Decision Maker
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              cnt.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cnt.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {canEdit('masters') && (
                              <button
                                type="button"
                                onClick={() => openEditContact(cnt)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Edit Contact"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete('masters') && (
                              <button
                                type="button"
                                onClick={() => deleteCustomerContact(cnt.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Delete Contact"
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
      )}

      {/* Customer Add / Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingCustomerId ? 'Edit Customer Master' : 'Add Customer Master'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Entity details, GSTIN, credit limit, and registered state code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    value={custForm.name}
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Type</label>
                  <select
                    value={custForm.customerType}
                    onChange={(e) =>
                      setCustForm({
                        ...custForm,
                        customerType: e.target.value as Customer['customerType'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="SME">SME</option>
                    <option value="Government">Government</option>
                    <option value="Startup">Startup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client GSTIN</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    value={custForm.gstin}
                    onChange={(e) => setCustForm({ ...custForm, gstin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={custForm.pan}
                    onChange={(e) => setCustForm({ ...custForm, pan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing State *</label>
                  <select
                    value={custForm.state}
                    onChange={(e) => {
                      const st = e.target.value;
                      setCustForm({
                        ...custForm,
                        state: st,
                        stateCode: getStateCode(st),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.stateName}>
                        {s.stateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST State Code</label>
                  <input
                    type="text"
                    readOnly
                    value={custForm.stateCode}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={custForm.city}
                    onChange={(e) => setCustForm({ ...custForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Term *</label>
                  <select
                    value={custForm.paymentTermsId}
                    onChange={(e) => setCustForm({ ...custForm, paymentTermsId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    {paymentTerms.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.creditDays}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={custForm.creditLimit}
                    onChange={(e) => setCustForm({ ...custForm, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sales Account Owner</label>
                  <select
                    value={custForm.salesOwnerId}
                    onChange={(e) => setCustForm({ ...custForm, salesOwnerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    {crmVisibleUsers(users).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingCustomerId ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Add / Edit Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingContactId ? 'Edit Contact Person' : 'Add Contact Person'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Link stakeholder to corporate client master.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Linked Customer *</label>
                <select
                  value={contactForm.customerId}
                  onChange={(e) => setContactForm({ ...contactForm, customerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. VP Finance"
                    value={contactForm.designation}
                    onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98100 00000"
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="vikram@client.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roles checkboxes */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">
                  Stakeholder Governance Roles
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactForm.isPrimary}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, isPrimary: e.target.checked })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>Primary Contact</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactForm.isDecisionMaker}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, isDecisionMaker: e.target.checked })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>Decision Maker</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingContactId ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
