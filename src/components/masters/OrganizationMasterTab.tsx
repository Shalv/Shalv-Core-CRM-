import React, { useState, useRef, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { BrandLogo } from '../common/BrandLogo';
import { CompanyBankAccount } from '../../types';
import {
  Building2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  ShieldCheck,
  CreditCard,
  MapPin,
  Mail,
  BadgeCheck,
  Link2,
  Plus,
  Send,
} from 'lucide-react';

export const OrganizationMasterTab: React.FC = () => {
  const {
    supplierCompany,
    updateSupplierCompany,
    states,
    getStateCode,
    outlookEmailConfig,
    updateOutlookEmailConfig,
    sendTestOutlookEmail,
    sendAllNotificationsToOutlook,
  } = useCrm();
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatusBanner, setEmailStatusBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [companyForm, setCompanyForm] = useState({
    name: supplierCompany.name,
    legalName: supplierCompany.legalName,
    gstin: supplierCompany.gstin,
    pan: supplierCompany.pan,
    state: supplierCompany.state,
    stateCode: supplierCompany.stateCode,
    address: supplierCompany.address,
    city: supplierCompany.city,
    pincode: supplierCompany.pincode,
    phone: supplierCompany.phone,
    email: supplierCompany.email,
    website: supplierCompany.website,
    logoUrl: supplierCompany.logoUrl || '',
    bankDetails: {
      bankName: supplierCompany.bankDetails?.bankName || supplierCompany.bankName || '',
      accountName: supplierCompany.bankDetails?.accountName || supplierCompany.name || '',
      accountNumber:
        supplierCompany.bankDetails?.accountNumber || supplierCompany.accountNumber || '',
      ifscCode: supplierCompany.bankDetails?.ifscCode || supplierCompany.ifscCode || '',
      branch: supplierCompany.bankDetails?.branch || supplierCompany.branch || '',
    },
    bankAccounts: Array.isArray(supplierCompany.bankAccounts)
      ? [...supplierCompany.bankAccounts]
      : ([] as CompanyBankAccount[]),
  });

  const [logoUrlInput, setLogoUrlInput] = useState(
    supplierCompany.logoUrl?.startsWith('http') ? supplierCompany.logoUrl : ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // Keep form synced if supplierCompany updates externally
  useEffect(() => {
    setCompanyForm((prev) => ({
      ...prev,
      logoUrl: supplierCompany.logoUrl || '',
    }));
  }, [supplierCompany.logoUrl]);

  // Smart client-side image optimizer to prevent localStorage QuotaExceededError
  const processAndApplyImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadStatusMsg('Please select a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // Keep SVG as-is; resize raster images > 600px to keep localStorage fast and reliable
      if (file.type === 'image/svg+xml') {
        setCompanyForm((prev) => ({ ...prev, logoUrl: rawDataUrl }));
        updateSupplierCompany({ logoUrl: rawDataUrl });
        setUploadStatusMsg(`Uploaded "${file.name}" and synced to Navbar, Dashboard & Invoices!`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.92);
          setCompanyForm((prev) => ({ ...prev, logoUrl: optimizedDataUrl }));
          updateSupplierCompany({ logoUrl: optimizedDataUrl });
        } else {
          setCompanyForm((prev) => ({ ...prev, logoUrl: rawDataUrl }));
          updateSupplierCompany({ logoUrl: rawDataUrl });
        }
        setUploadStatusMsg(`Uploaded "${file.name}" and synced to Navbar, Dashboard & Invoices!`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
      };
      img.onerror = () => {
        setCompanyForm((prev) => ({ ...prev, logoUrl: rawDataUrl }));
        updateSupplierCompany({ logoUrl: rawDataUrl });
        setUploadStatusMsg(`Uploaded "${file.name}" and synced to Navbar, Dashboard & Invoices!`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndApplyImageFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndApplyImageFile(file);
    }
  };

  const handleApplyLogoUrl = () => {
    const trimmed = logoUrlInput.trim();
    if (!trimmed) return;
    setCompanyForm((prev) => ({ ...prev, logoUrl: trimmed }));
    updateSupplierCompany({ logoUrl: trimmed });
    setUploadStatusMsg('Custom logo URL saved to backend & applied across Navbar and Dashboard!');
    setTimeout(() => setUploadStatusMsg(null), 4000);
  };

  const handleRemoveLogo = () => {
    setCompanyForm((prev) => ({ ...prev, logoUrl: '' }));
    setLogoUrlInput('');
    updateSupplierCompany({ logoUrl: '' });
    setUploadStatusMsg('Custom logo removed from Company Setup.');
    setTimeout(() => setUploadStatusMsg(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupplierCompany(companyForm);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-2xl text-indigo-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Company Branding, Logo & Statutory Supplier Setup</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                <span>GST Registered</span>
              </span>
            </h3>
          </div>
        </div>

        {(savedToast || uploadStatusMsg) && (
          <div className="px-3.5 py-2 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{uploadStatusMsg || 'Company Master Updated Successfully!'}</span>
          </div>
        )}
      </div>

      {/* Global Font Size & Multi-Theme Master Studio */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="font-bold text-slate-900 text-sm mb-1">
              Application Font Size Scale (Global Master)
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Set the default typography scale across the entire CRM and Payroll application.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'compact', label: 'Compact', sub: '12.25px · Dense' },
                  { id: 'standard', label: 'Standard', sub: '13.5px · Default' },
                  { id: 'comfortable', label: 'Comfortable', sub: '14.5px · Roomy' },
                  { id: 'large', label: 'Large', sub: '15.5px · High Legibility' },
                ] as const
              ).map((opt) => {
                const active = (supplierCompany.uiFontSize || 'standard') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      updateSupplierCompany({ uiFontSize: opt.id });
                      setUploadStatusMsg(`Application font size set to "${opt.label}"!`);
                      setTimeout(() => setUploadStatusMsg(null), 3000);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 text-sm mb-1">
              Application Theme Palette (Global Master)
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Switch between curated workspace themes for the entire organization.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'indigo', label: 'Indigo Slate', dot: '#4f46e5' },
                  { id: 'emerald', label: 'Emerald Mint', dot: '#059669' },
                  { id: 'violet', label: 'Royal Violet', dot: '#7c3aed' },
                  { id: 'amber', label: 'Saffron Gold', dot: '#d97706' },
                  { id: 'ocean', label: 'Ocean Cyan', dot: '#0284c7' },
                  { id: 'midnight', label: 'Midnight Navy', dot: '#312e81' },
                ] as const
              ).map((thm) => {
                const active = (supplierCompany.uiTheme || 'indigo') === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => {
                      updateSupplierCompany({ uiTheme: thm.id });
                      setUploadStatusMsg(`Application theme switched to "${thm.label}"!`);
                      setTimeout(() => setUploadStatusMsg(null), 3000);
                    }}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700 font-semibold'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: thm.dot }}
                    />
                    <span className="text-xs truncate">{thm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Form on Left, Live Tax ID Card & Letterhead Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Dedicated Brand Logo Upload & Identity Studio */}
            <div className="p-4 sm:p-5 bg-indigo-50/40 rounded-2xl border border-indigo-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Corporate Brand Logo Upload</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Applies immediately across Navbar, Sidebar, Login Screen, Tax Invoices, Purchase Orders, and Browser Favicon.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/*"
                    onChange={handleLogoFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{companyForm.logoUrl ? 'Replace Image' : 'Upload Brand Image'}</span>
                  </button>
                  {companyForm.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
                      title="Remove Custom Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/80'
                    : 'border-slate-300 bg-white hover:border-indigo-500 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {companyForm.logoUrl ? (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={companyForm.logoUrl}
                        alt="Uploaded Company Logo"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      {companyForm.logoUrl
                        ? 'Custom Brand Logo Active — Click or drag a new image to replace'
                        : 'Click to browse or drag & drop your brand logo image here'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Supports PNG (transparent recommended), JPG, SVG, or WebP. Automatically optimized for instant rendering.
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 shrink-0">
                  Browse File
                </span>
              </div>

              {/* Optional Direct Image URL Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    placeholder="Or paste direct image URL (https://example.com/logo.png)"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyLogoUrl}
                  disabled={!logoUrlInput.trim()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition cursor-pointer whitespace-nowrap"
                >
                  Apply Image URL
                </button>
              </div>

              {/* Live Multi-Surface Brand Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400">Light Navbar Preview</span>
                  <BrandLogo variant="full" size="sm" theme="light" />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400">Dark Portal Preview</span>
                  <BrandLogo variant="full" size="sm" theme="dark" />
                </div>
              </div>
            </div>

            {/* Corporate Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Trading / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Registered Name *</label>
                <input
                  type="text"
                  required
                  value={companyForm.legalName}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier GSTIN *</label>
                <input
                  type="text"
                  required
                  value={companyForm.gstin}
                  onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate PAN *</label>
                <input
                  type="text"
                  required
                  value={companyForm.pan}
                  onChange={(e) => setCompanyForm({ ...companyForm, pan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Home State *</label>
                <select
                  value={companyForm.state}
                  onChange={(e) => {
                    const st = e.target.value;
                    setCompanyForm({
                      ...companyForm,
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
                  value={companyForm.stateCode}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-extrabold text-indigo-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Registered Corporate Address *
              </label>
              <input
                type="text"
                required
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#1f7e9e]" />
                  <span>
                    Primary Bank Account (Synced to Invoices, POs &amp; Payment Collection)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      bankAccounts: [
                        ...(prev.bankAccounts || []),
                        {
                          id: `bnk-${Date.now()}`,
                          bankName: '',
                          accountName: prev.legalName || prev.name,
                          accountNumber: '',
                          ifscCode: '',
                          branch: '',
                          accountType: 'Current A/c',
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1f7e9e]" />
                  <span>Add Secondary Bank A/c</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={companyForm.bankDetails.bankName}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        bankDetails: { ...companyForm.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={companyForm.bankDetails.accountName}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        bankDetails: { ...companyForm.bankDetails, accountName: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={companyForm.bankDetails.accountNumber}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        bankDetails: { ...companyForm.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">IFSC Code &amp; Branch</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="IFSC"
                      value={companyForm.bankDetails.ifscCode}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          bankDetails: { ...companyForm.bankDetails, ifscCode: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700"
                    />
                    <input
                      type="text"
                      placeholder="Branch"
                      value={companyForm.bankDetails.branch}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          bankDetails: { ...companyForm.bankDetails, branch: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Company Bank Accounts (for Payment Collection & Reconciliation) */}
              {companyForm.bankAccounts && companyForm.bankAccounts.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700">
                    Additional Bank Accounts (Available in Payment Collection &amp; Reconciliation)
                  </div>
                  {companyForm.bankAccounts.map((acc, idx) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-700">
                          Bank Account #{idx + 2}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              bankAccounts: prev.bankAccounts.filter((item) => item.id !== acc.id),
                            }))
                          }
                          className="text-rose-500 hover:text-rose-700 p-1 rounded cursor-pointer"
                          title="Remove Bank Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Bank Name"
                          value={acc.bankName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyForm((prev) => ({
                              ...prev,
                              bankAccounts: prev.bankAccounts.map((b) =>
                                b.id === acc.id ? { ...b, bankName: val } : b
                              ),
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Account Number"
                          value={acc.accountNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyForm((prev) => ({
                              ...prev,
                              bankAccounts: prev.bankAccounts.map((b) =>
                                b.id === acc.id ? { ...b, accountNumber: val } : b
                              ),
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                        <input
                          type="text"
                          placeholder="IFSC Code"
                          value={acc.ifscCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyForm((prev) => ({
                              ...prev,
                              bankAccounts: prev.bankAccounts.map((b) =>
                                b.id === acc.id ? { ...b, ifscCode: val } : b
                              ),
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Branch"
                          value={acc.branch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyForm((prev) => ({
                              ...prev,
                              bankAccounts: prev.bankAccounts.map((b) =>
                                b.id === acc.id ? { ...b, branch: val } : b
                              ),
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Save Organization Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Tax ID Card & Letterhead Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-indigo-900/40">
            {/* Background Glow */}
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-300 block">
                    Statutory Supplier Master
                  </span>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">
                    {companyForm.name || 'Coreenact Solutions'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                    {companyForm.legalName}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shrink-0">
                  {companyForm.logoUrl ? (
                    <img
                      src={companyForm.logoUrl}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <BrandLogo variant="mark" size="sm" />
                  )}
                </div>
              </div>

              {/* GSTIN & State Badge */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 backdrop-blur-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">GSTIN:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {companyForm.gstin || '07AABCS1429B1Z8'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">PAN:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {companyForm.pan || 'AABCS1429B'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Place of Origin:</span>
                  <span className="font-semibold text-indigo-200">
                    {companyForm.state} (Code: {companyForm.stateCode})
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="text-[11px] text-slate-300 space-y-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    {companyForm.address}, {companyForm.city}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{companyForm.email}</span>
                </div>
              </div>

              {/* Bank Remittance Preview */}
              <div className="pt-3 border-t border-white/10 text-[11px] text-slate-300">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Bank Remittance Route
                </span>
                <div className="font-mono text-slate-200">
                  {companyForm.bankDetails.bankName} • A/C: {companyForm.bankDetails.accountNumber}
                </div>
                <div className="font-mono text-slate-400 text-[10px]">
                  IFSC: {companyForm.bankDetails.ifscCode} • {companyForm.bankDetails.branch}
                </div>
              </div>
            </div>
          </div>

          {/* Microsoft Outlook Email Notifications Card */}
          <div className="bg-white border border-sky-200 rounded-2xl p-4 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#1f7e9e]" />
                <span>Microsoft Outlook Email Notifications</span>
              </div>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={outlookEmailConfig.enabled}
                  onChange={(e) => updateOutlookEmailConfig({ enabled: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-[#1f7e9e]"
                />
                <span className="text-[11px] font-bold text-emerald-700">
                  {outlookEmailConfig.enabled ? 'Active' : 'Paused'}
                </span>
              </label>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              All CRM notifications (Leads, Opportunities, Follow-ups, Sales Orders, Milestones,
              Invoices, Payments, Support &amp; AMC) are automatically dispatched to your Outlook
              account via <code className="font-mono text-sky-700">{outlookEmailConfig.smtpHost}:{outlookEmailConfig.smtpPort}</code>.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Primary Outlook Recipient Email
                </label>
                <input
                  type="email"
                  value={outlookEmailConfig.outlookEmail}
                  onChange={(e) => updateOutlookEmailConfig({ outlookEmail: e.target.value })}
                  placeholder="your.name@outlook.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  CC Outlook Emails (Optional)
                </label>
                <input
                  type="text"
                  value={outlookEmailConfig.ccEmails}
                  onChange={(e) => updateOutlookEmailConfig({ ccEmails: e.target.value })}
                  placeholder="finance@company.com, sales@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Microsoft Entra ID App Registration Essentials */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  Essentials — {outlookEmailConfig.appDisplayName || 'Enact360'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {outlookEmailConfig.appState || 'Activated'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={outlookEmailConfig.appDisplayName || 'Enact360'}
                      onChange={(e) =>
                        updateOutlookEmailConfig({
                          appDisplayName: e.target.value,
                          managedApplication: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-sky-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Supported account types
                    </label>
                    <input
                      type="text"
                      value={outlookEmailConfig.supportedAccountTypes || 'My organization only'}
                      onChange={(e) =>
                        updateOutlookEmailConfig({ supportedAccountTypes: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    Application (client) ID
                  </label>
                  <input
                    type="text"
                    value={
                      outlookEmailConfig.clientId || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a'
                    }
                    onChange={(e) => updateOutlookEmailConfig({ clientId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    Object ID
                  </label>
                  <input
                    type="text"
                    value={
                      outlookEmailConfig.objectId || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f'
                    }
                    onChange={(e) => updateOutlookEmailConfig({ objectId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    Directory (tenant) ID
                  </label>
                  <input
                    type="text"
                    value={
                      outlookEmailConfig.tenantId || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733'
                    }
                    onChange={(e) => updateOutlookEmailConfig({ tenantId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>
                    Redirect URIs:{' '}
                    <strong className="text-sky-700">
                      {outlookEmailConfig.redirectUriConfig || '1 web, 0 spa, 0 public client'}
                    </strong>
                  </span>
                  <span>
                    Managed app:{' '}
                    <strong className="text-sky-700">
                      {outlookEmailConfig.managedApplication || 'Enact360'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {emailStatusBanner && (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                {emailStatusBanner}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  updateOutlookEmailConfig({
                    appDisplayName: outlookEmailConfig.appDisplayName || 'Enact360',
                    clientId:
                      outlookEmailConfig.clientId || 'af71a4c3-ed1d-45cd-9969-62f8ae0b510a',
                    objectId:
                      outlookEmailConfig.objectId || 'f39ca6c9-66d2-4bbe-aa2b-53c68637e00f',
                    tenantId:
                      outlookEmailConfig.tenantId || 'd74b8bb7-09a3-4a3c-9ca7-49b9a9dea733',
                    supportedAccountTypes:
                      outlookEmailConfig.supportedAccountTypes || 'My organization only',
                    redirectUriConfig:
                      outlookEmailConfig.redirectUriConfig || '1 web, 0 spa, 0 public client',
                    managedApplication: outlookEmailConfig.managedApplication || 'Enact360',
                    appState: 'Activated',
                  });
                  setEmailStatusBanner(
                    'Saved Enact360 Outlook App Registration & Email values!'
                  );
                  setTimeout(() => setEmailStatusBanner(null), 5000);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Enact360 Outlook Values
              </button>
              <button
                type="button"
                disabled={testingEmail}
                onClick={async () => {
                  setTestingEmail(true);
                  const res = await sendTestOutlookEmail();
                  setTestingEmail(false);
                  setEmailStatusBanner(
                    res.success
                      ? `Test notification dispatched to ${res.recipient} via Outlook (${outlookEmailConfig.smtpHost}:${outlookEmailConfig.smtpPort})`
                      : `Queued test notification for ${res.recipient}`
                  );
                  setTimeout(() => setEmailStatusBanner(null), 5000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[11px] transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#1f7e9e]" />
                {testingEmail ? 'Sending...' : 'Send Test Email'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const count = await sendAllNotificationsToOutlook();
                  setEmailStatusBanner(
                    `Synced ${count} notification(s) to ${outlookEmailConfig.outlookEmail}`
                  );
                  setTimeout(() => setEmailStatusBanner(null), 5000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0078D4] hover:bg-[#106EBE] text-white font-bold text-[11px] transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Sync All to Outlook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
