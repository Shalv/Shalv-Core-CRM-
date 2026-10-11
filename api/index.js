// backend/initial-store.json
var initial_store_default = {
  stateInitialized: true,
  documentCounters: {
    leads: 997569,
    customers: 791939,
    opportunities: 644,
    orders: 2,
    "invoices:Tax": 47,
    "invoices:Proforma": 37,
    payments: 5,
    purchaseOrders: 3,
    supportTickets: 197,
    changeRequests: 3
  },
  users: [
    {
      id: "usr-1",
      name: "Shalv Sharma",
      username: "admin",
      email: "admin@coreenact.com",
      passwordHash: "$2b$08$id5mmf8BQGhkPiGkeXsOV.AD96gtEc.3zpd/1gX5LdohGtmJflGvK",
      phone: "9810998290",
      role: "Super Admin",
      department: "Executive",
      designation: "Managing Director / Super Admin",
      status: "Active",
      location: "New Delhi",
      created_at: "2026-09-01T09:00:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:56.585Z"
    },
    {
      id: "usr-2",
      name: "Tabassum",
      username: "tabassum",
      email: "tabassum@coreenact.com",
      passwordHash: "$2b$08$CLVPK3L1X8eBMsvrIXmeWO5rHNMecJ2Kx2B8oKhWbDegqZ4CJZO4S",
      phone: "9810998291",
      role: "Sales Manager",
      department: "Sales",
      designation: "Sales & Support Manager",
      status: "Active",
      location: "New Delhi",
      created_at: "2026-09-01T09:05:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:56.773Z"
    },
    {
      id: "usr-3",
      name: "Rohan Verma",
      username: "rohan",
      email: "rohan.verma@coreenact.com",
      passwordHash: "$2b$08$ONxLn2UOhcZxkTGsczglCOYnmzp7iESQpal56/iFHt2yhzWS77iwm",
      phone: "9810998292",
      role: "Sales Executive",
      department: "Sales",
      designation: "Senior Account Executive",
      status: "Active",
      location: "Mumbai",
      created_at: "2026-09-01T09:10:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:56.959Z"
    },
    {
      id: "usr-4",
      name: "Priya Nair",
      username: "priya",
      email: "priya.nair@coreenact.com",
      passwordHash: "$2b$08$OjWRdM8jGaMkdizMT82v5u08Tw9n1odcYjTq4eh4cYpN5hoASpVYy",
      phone: "9810998293",
      role: "Finance Manager",
      department: "Finance",
      designation: "Head of Billing & Receivables",
      status: "Active",
      location: "Bengaluru",
      created_at: "2026-09-01T09:15:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:57.147Z"
    },
    {
      id: "usr-5",
      name: "Amit Patel",
      username: "amit",
      email: "amit.patel@coreenact.com",
      passwordHash: "$2b$08$ktzgy0KSZ2d57.Bsdw67n.mM9iM34XfIH221nmCEriuIbA1zuEToq",
      phone: "9810998294",
      role: "Finance Executive",
      department: "Finance",
      designation: "Accounts & GST Officer",
      status: "Active",
      location: "Ahmedabad",
      created_at: "2026-09-01T09:20:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:57.337Z"
    },
    {
      id: "usr-6",
      name: "Neha Gupta",
      username: "neha",
      email: "neha.gupta@coreenact.com",
      passwordHash: "$2b$08$EmB6KP1uTJmZWl5R5bP6teTdBhKKdmi9NtceOQ/4pzJ0M/rA8ktqu",
      phone: "9810998295",
      role: "Management/Viewer",
      department: "Executive",
      designation: "VP of Strategy (Read-Only)",
      status: "Active",
      location: "New Delhi",
      created_at: "2026-09-01T09:25:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:57.524Z"
    },
    {
      id: "usr-7",
      name: "Vikram Malhotra",
      username: "vikram",
      email: "vikram.m@coreenact.com",
      passwordHash: "$2b$08$xwDRMuS96okEb2NHhp/we.UOqGx7JAhHEUjVPjkqgSDkQ42MA0Z8a",
      phone: "9810998296",
      role: "Administrator",
      department: "Operations",
      designation: "Operations Director",
      status: "Active",
      location: "Pune",
      created_at: "2026-09-01T09:30:00Z",
      accessScope: "all",
      avatar: "",
      customPermissions: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-06T17:06:57.713Z"
    },
    {
      id: "employee-1",
      name: "Employee",
      username: "employee",
      email: "employee@example.com",
      passwordHash: "$2b$08$XyEH7sDzPL577j1lHk2VR.X3tYovmoEI/GYDZmRzYlJcmhYl8m9/K",
      accessScope: "payroll_only",
      accessType: "payroll_only",
      empCode: "EMP-001",
      phone: "",
      role: "Sales Executive",
      department: "Operations",
      designation: "Employee",
      status: "Active",
      location: "Mumbai HQ",
      created_at: "2026-10-11T14:33:49.195Z",
      customPermissions: null,
      avatar: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-11T14:33:51.439Z"
    },
    {
      id: "usr-crm-new",
      name: "Neha Kapoor",
      username: "neha.kapoor",
      email: "neha.kapoor@coreenact.com",
      passwordHash: "$2b$08$eIXJbZP0xAXG1916gVJV/uNz/dB4dQ4rfEZyU4bgPVkqa2YtLa3lu",
      accessScope: "all",
      accessType: "crm_and_payroll",
      phone: "9811122233",
      role: "Sales Executive",
      department: "Sales",
      designation: "",
      status: "Active",
      avatar: "",
      location: "",
      reportingManager: "",
      assignedTerritory: "",
      custom_permissions: {},
      customPermissions: {},
      created_at: "2026-10-11T14:33:49.979Z",
      lastLoginAt: "2026-10-11T14:33:53.072Z",
      last_login_at: null,
      updated_at: "2026-10-11T14:33:50.255Z"
    },
    {
      id: "emp-pay-901",
      name: "Vikram Malhotra",
      username: "vikram.malhotra",
      email: "vikram.malhotra@coreenact.com",
      passwordHash: "$2b$08$8xdppwP/4EgMgQHzmyYnK.QA0cjK0DITK6sIQbSkglVFmjCQk.PP2",
      accessScope: "payroll_only",
      accessType: "payroll_only",
      empCode: "EMP-099",
      phone: "",
      role: "Support",
      department: "Technical Support & AMC",
      designation: "Support Engineer",
      status: "Active",
      location: "Mumbai HQ",
      created_at: "2026-10-11T14:33:56.411Z",
      lastLoginAt: "2026-10-11T14:34:00.164Z",
      customPermissions: null,
      avatar: null,
      last_login_at: null,
      custom_permissions: null,
      updated_at: "2026-10-11T14:33:58.191Z"
    }
  ],
  payroll_masters: [
    {
      userId: "emp-pay-901",
      empCode: "EMP-099",
      name: "Vikram Malhotra",
      email: "vikram.malhotra@coreenact.com",
      username: "vikram.malhotra",
      role: "Support",
      department: "Technical Support & AMC",
      designation: "Support Engineer",
      joiningDate: "2026-10-01",
      employmentStatus: "Active",
      monthlyGross: 65e3,
      basicPercent: 50,
      hraPercent: 25,
      pfApplicable: true,
      esiApplicable: false,
      professionalTax: 200,
      tdsPercent: 5,
      panNumber: "ABCDE1234F",
      uanNumber: "100900100900",
      bankName: "HDFC Bank",
      accountNumber: "501002345678",
      ifscCode: "HDFC0001234",
      leaveBalance: {
        casualLeave: 12,
        sickLeave: 8,
        earnedLeave: 15
      },
      status: "Active",
      passwordHash: "$2b$08$8xdppwP/4EgMgQHzmyYnK.QA0cjK0DITK6sIQbSkglVFmjCQk.PP2"
    }
  ],
  payrollMasters: {
    "emp-pay-901": {
      userId: "emp-pay-901",
      empCode: "EMP-099",
      name: "Vikram Malhotra",
      email: "vikram.malhotra@coreenact.com",
      username: "vikram.malhotra",
      role: "Support",
      department: "Technical Support & AMC",
      designation: "Support Engineer",
      joiningDate: "2026-10-01",
      employmentStatus: "Active",
      monthlyGross: 65e3,
      basicPercent: 50,
      hraPercent: 25,
      pfApplicable: true,
      esiApplicable: false,
      professionalTax: 200,
      tdsPercent: 5,
      panNumber: "ABCDE1234F",
      uanNumber: "100900100900",
      bankName: "HDFC Bank",
      accountNumber: "501002345678",
      ifscCode: "HDFC0001234",
      leaveBalance: {
        casualLeave: 12,
        sickLeave: 8,
        earnedLeave: 15
      },
      status: "Active",
      passwordHash: "$2b$08$8xdppwP/4EgMgQHzmyYnK.QA0cjK0DITK6sIQbSkglVFmjCQk.PP2"
    }
  },
  deletedPayrollMasterIds: [],
  payrollLoans: [],
  deletedLoanIds: [],
  payrollPolicy: {
    policyCode: "CS-HR-POL-001",
    policyVersion: "1.0",
    policyTitle: "Attendance, Working Hours & Leave Policy",
    plQuota: 12,
    clQuota: 0,
    slQuota: 0,
    compOffQuota: 4,
    monthlyLeaveLimit: 1,
    shiftStartTime: "09:30 AM",
    shiftEndTime: "06:00 PM",
    earlyArrivalCutoff: "09:00 AM",
    capEarlyArrival: true,
    graceEndTime: "09:45 AM",
    gracePeriodMins: 15,
    monthlyGraceLimit: 3,
    lateCycleHalfDayNth: 4,
    lateCycleDeductionDays: 0.5,
    middayEntryStartTime: "12:00 PM",
    middayEntryEndTime: "01:00 PM",
    middayEntryDeductionDays: 0.5,
    postMiddayAbsentDeductionDays: 1,
    earlyExitAbsentBeforeTime: "12:30 PM",
    earlyExitHalfDayEndTime: "04:00 PM",
    regularExitAfterTime: "04:00 PM",
    dailyBreakWindow: "01:00 PM - 02:00 PM",
    maxBreakDurationMins: 60,
    breakExceededDeductionDays: 0.5,
    holidaySaturdayNumbers: [
      2,
      4
    ],
    sundaysOff: true,
    weeklyHolidaySaturdays: "2nd and 4th Saturdays + All Sundays",
    workingSaturdays: "1st, 3rd and 5th Saturdays",
    requireAdvanceLeaveApproval: true,
    payDisbursementDay: "Last Working Day of Month",
    defaultBasicPct: 50,
    defaultHraPct: 25,
    defaultSpecialPct: 18,
    defaultSalesCommissionPct: 1.5,
    defaultPfCapBasic: 15e3,
    defaultProfTax: 200,
    defaultTdsPct: 8.5,
    lastPublishedMonth: "September 2026",
    loanShortfallPolicy: "cap_at_max_takehome_pct",
    loanMaxDeductionPctOfNet: 50,
    loanMaxEligibilityMultiple: 3,
    loanDefaultInterestRate: 8.5
  },
  payrollOrgMasters: null,
  payrollAttendance: {
    "emp-pay-901": {
      date: "2026-10-11",
      punchedIn: false,
      punchInTime: null,
      punchOutTime: null,
      workMode: "Office HQ",
      locationSharingEnabled: false,
      punchInLocation: null,
      punchOutLocation: null,
      punchHistory: [],
      dailyRecords: {},
      dayLog: {}
    }
  },
  payrollLeaves: {
    "employee-1": [
      {
        id: "lv1",
        employeeId: "employee-1",
        startDate: "2026-10-01",
        endDate: "2026-10-01",
        days: 1,
        status: "Approved"
      }
    ],
    "emp-pay-901": []
  },
  payrollClaims: {
    "emp-pay-901": []
  },
  payrollStatutory: {
    "emp-pay-901": {
      empCode: "EMP-099",
      panNumber: "ABCDE1234F",
      uanNumber: "100900100900",
      pfAccountNo: "\u2014",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
      taxRegime: "New Tax Regime (Section 115BAC)",
      sec80CDeclared: 0,
      sec80DDeclared: 0,
      hraMonthlyRent: 0,
      npsContribution: 0
    }
  },
  payrollIntegrationConfig: {
    provider: "custom",
    providerLabel: "Inbuilt CRM Payroll & ESS",
    portalUrl: "",
    ssoEnabled: true,
    launchMode: "integrated_ess",
    operationMode: "standalone_builtin",
    fetchApiEndpoint: "",
    pushWebhookEndpoint: "",
    apiTenantKey: "",
    syncCrmIncentives: true,
    syncReimbursements: true,
    autoPushAttendanceAndLeaves: true,
    fetchedGrossSalaryOverride: null,
    lastSyncedAt: "11 Oct 2026, 07:53 pm",
    lastFetchedAt: "Not linked yet",
    lastPushedAt: "Not linked yet"
  },
  crmSlices: {
    states: [
      {
        id: "st-01",
        stateName: "Jammu and Kashmir",
        stateCode: "01",
        country: "India",
        zone: "North"
      },
      {
        id: "st-02",
        stateName: "Himachal Pradesh",
        stateCode: "02",
        country: "India",
        zone: "North"
      },
      {
        id: "st-03",
        stateName: "Punjab",
        stateCode: "03",
        country: "India",
        zone: "North"
      },
      {
        id: "st-04",
        stateName: "Chandigarh",
        stateCode: "04",
        country: "India",
        zone: "Union Territory"
      },
      {
        id: "st-05",
        stateName: "Uttarakhand",
        stateCode: "05",
        country: "India",
        zone: "North"
      },
      {
        id: "st-06",
        stateName: "Haryana",
        stateCode: "06",
        country: "India",
        zone: "North"
      },
      {
        id: "st-07",
        stateName: "Delhi",
        stateCode: "07",
        country: "India",
        zone: "North"
      },
      {
        id: "st-08",
        stateName: "Rajasthan",
        stateCode: "08",
        country: "India",
        zone: "North"
      },
      {
        id: "st-09",
        stateName: "Uttar Pradesh",
        stateCode: "09",
        country: "India",
        zone: "North"
      },
      {
        id: "st-10",
        stateName: "Bihar",
        stateCode: "10",
        country: "India",
        zone: "East"
      },
      {
        id: "st-19",
        stateName: "West Bengal",
        stateCode: "19",
        country: "India",
        zone: "East"
      },
      {
        id: "st-24",
        stateName: "Gujarat",
        stateCode: "24",
        country: "India",
        zone: "West"
      },
      {
        id: "st-27",
        stateName: "Maharashtra",
        stateCode: "27",
        country: "India",
        zone: "West"
      },
      {
        id: "st-29",
        stateName: "Karnataka",
        stateCode: "29",
        country: "India",
        zone: "South"
      },
      {
        id: "st-33",
        stateName: "Tamil Nadu",
        stateCode: "33",
        country: "India",
        zone: "South"
      },
      {
        id: "st-36",
        stateName: "Telangana",
        stateCode: "36",
        country: "India",
        zone: "South"
      },
      {
        id: "st-99",
        stateName: "Other / International",
        stateCode: "99",
        country: "International",
        zone: "Union Territory"
      }
    ],
    taxRates: [
      {
        id: "tax-01",
        name: "GST 18% (Standard IT Services & Software)",
        code: "GST-18",
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        defaultHsnSac: "998313",
        applicableTo: "Both",
        description: "Applicable on ERP Consulting, AMC & Software Licenses",
        isActive: true
      },
      {
        id: "tax-02",
        name: "GST 0% (Exempt)",
        code: "GST-00",
        gstRate: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        defaultHsnSac: "998314",
        applicableTo: "Both",
        description: "Nil Rated supply",
        isActive: true
      }
    ],
    paymentTerms: [
      {
        id: "pt-1",
        name: "30 Days Net",
        code: "30-DAYS",
        creditDays: 30,
        defaultMilestones: "100",
        isActive: true,
        description: "Standard credit period 30 days"
      },
      {
        id: "pt-2",
        name: "7 Days Net",
        code: "7-DAYS",
        creditDays: 7,
        defaultMilestones: "100",
        isActive: true,
        description: "Professional consulting term 7 days"
      },
      {
        id: "pt-3",
        name: "100% Advance",
        code: "ADV-100",
        creditDays: 0,
        defaultMilestones: "100",
        isActive: true,
        description: "100% Advance Payment"
      },
      {
        id: "pt-4",
        name: "Milestone Based (Advance + Milestones)",
        code: "MILESTONE",
        creditDays: 30,
        defaultMilestones: "12.5,20,37.5,20,10",
        isActive: true,
        description: "Implementation milestones"
      }
    ],
    contacts: [
      {
        id: "cnt-1",
        customerId: "cus-1",
        name: "Sawan Pathak",
        designation: "Finance Manager",
        department: "Finance & Accounts",
        mobile: "+91 72909 96601",
        email: "sawankumar@tajcomputersolutions.com",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "Taj computer Solutions Pvt Ltd"
      },
      {
        id: "cnt-2",
        customerId: "cus-2",
        name: "Srikant Jena",
        designation: "Director",
        department: "Executive Management",
        mobile: "8290090611",
        email: "srikant@incitegravity.com",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "incite Gravity Pvt Ltd"
      },
      {
        id: "cnt-3",
        customerId: "cus-3",
        name: "Shruthi",
        designation: "Founder",
        department: "Executive Management",
        mobile: "97403 82382",
        email: "shruthi@buildstorys.com",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "Build Storys Pvt Ltd"
      },
      {
        id: "cnt-4",
        customerId: "cus-4",
        name: "Eshant Sharma",
        designation: "Founder / Director",
        department: "Leadership",
        mobile: "9999100186",
        email: "eshant.sharma@eduvrse.com",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "Eduvrse Pvt ltd"
      },
      {
        id: "cnt-5",
        customerId: "cus-5",
        name: "Jiten",
        designation: "Director",
        department: "Management",
        mobile: "9878681000",
        email: "jitengoyal@rrgg.in",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD"
      },
      {
        id: "cnt-6",
        customerId: "cus-6",
        name: "Ankur Goyal",
        designation: "Director",
        department: "Management",
        mobile: "98147 55580",
        email: "info@sssteelindustry.com",
        isPrimary: true,
        isDecisionMaker: true,
        status: "Active",
        customerName: "SS Steel Industry"
      }
    ],
    supplierCompany: {
      name: "Coreenact Solutions",
      legalName: "Coreenact Solutions",
      gstin: "07FLTPS4666B1ZI",
      pan: "FLTPS4666B",
      cin: "",
      state: "Delhi",
      stateCode: "07",
      city: "New Delhi",
      pincode: "110020",
      address: "Innov8, 3rd Floor, 211, Okhla Industrial Estate Phase-3",
      email: "infor@coreenact.com",
      phone: "9810998290",
      website: "www.coreenact.com",
      logoUrl: "",
      bankName: "Bank of Baroda",
      accountNumber: "71000200001745",
      ifscCode: "BARB0DBOKHL",
      branch: "Okhla Industrial Phase-3, New Delhi, 110020",
      bankDetails: {
        bankName: "Bank of Baroda",
        accountNumber: "71000200001745",
        ifscCode: "BARB0DBOKHL",
        branch: "Okhla Industrial Phase-3, New Delhi, 110020",
        accountName: "Coreenact Solutions"
      },
      bankAccounts: []
    },
    licenseTypes: [
      {
        id: "lic-1",
        code: "BC ESSENTIAL",
        name: "MS D365 Business Central Essential",
        description: "Full ERP user subscription for finance, supply chain, manufacturing, and project management",
        hsnSac: "997331",
        monthlyCost: 6655,
        yearlyCost: 79860,
        status: "Active"
      },
      {
        id: "lic-2",
        code: "BC- DEVICE",
        name: "Dynamics 365 Business Central Device",
        description: "Shared point-of-sale, shop floor, or warehouse device subscription for Business Central",
        hsnSac: "997331",
        monthlyCost: 3780,
        yearlyCost: 45360,
        status: "Active"
      },
      {
        id: "lic-3",
        code: "DYNAMICS 365 BUSINESS CENTRAL TEAM",
        name: "Dynamics 365 Business Central Team",
        description: "Team Member license for read access, approvals, time sheets, and self-service requisitions",
        hsnSac: "997331",
        monthlyCost: 665,
        yearlyCost: 7980,
        status: "Active"
      },
      {
        id: "lic-4",
        code: "M365-BASIC",
        name: "Microsoft 365 Business Basic",
        description: "Microsoft 365 Business Basic annual license (Exchange, Teams, SharePoint, OneDrive)",
        hsnSac: "997331",
        monthlyCost: 170,
        yearlyCost: 2040,
        status: "Active"
      }
    ],
    products: [
      {
        id: "prod-d365",
        code: "D365",
        name: "MS D365 Business Central",
        type: "Service",
        category: "ERP Solution",
        description: "Microsoft Dynamics 365 Business Central implementation, customization, and upgrade services",
        uom: "Each",
        hsnSac: "998313",
        gstRate: 18,
        costPrice: 12e5,
        sellingPrice: 15e5,
        isActive: true
      },
      {
        id: "prod-hrms",
        code: "HRMS",
        name: "ENACT Chakra (HRMS)",
        type: "Service",
        category: "HRMS Solution",
        description: "Enterprise HRMS, Attendance, Payroll, and Self Service Portal",
        uom: "Each",
        hsnSac: "998313",
        gstRate: 18,
        costPrice: 35e4,
        sellingPrice: 5e5,
        isActive: true
      },
      {
        id: "prod-crm",
        code: "CRM",
        name: "ENACT360 (CRM)",
        type: "Service",
        category: "CRM Solution",
        description: "Enterprise Sales, Leads, Pipeline & Order Management CRM",
        uom: "Each",
        hsnSac: "998313",
        gstRate: 18,
        costPrice: 35e4,
        sellingPrice: 5e5,
        isActive: true
      },
      {
        id: "prod-support",
        code: "Support",
        name: "ENACTSupport (AMC 400 hrs)",
        type: "Subscription",
        category: "Support & Maintenance",
        description: "Comprehensive AMC Support contract 400 hours annual package with SLA guarantees",
        uom: "Hours",
        hsnSac: "998313",
        gstRate: 18,
        costPrice: 3e5,
        sellingPrice: 425e3,
        isActive: true
      },
      {
        id: "lic-bc-essential",
        code: "BC ESSENTIAL",
        name: "MS D365 Business Central Essential",
        type: "Product",
        category: "Microsoft License",
        description: "Annual license subscription for Dynamics 365 Business Central Essential user",
        uom: "License",
        hsnSac: "997331",
        gstRate: 18,
        costPrice: 65e3,
        sellingPrice: 79860,
        isActive: true
      },
      {
        id: "lic-bc-device",
        code: "BC- DEVICE",
        name: "Dynamics 365 Business Central Device",
        type: "Product",
        category: "Microsoft License",
        description: "Shared device license subscription for Business Central operations",
        uom: "License",
        hsnSac: "997331",
        gstRate: 18,
        costPrice: 38e3,
        sellingPrice: 45360,
        isActive: true
      },
      {
        id: "lic-bc-team",
        code: "DYNAMICS 365 BUSINESS CENTRAL TEAM",
        name: "Dynamics 365 Business Central Team",
        type: "Product",
        category: "Microsoft License",
        description: "Team member annual license for read and lightweight approval access",
        uom: "License",
        hsnSac: "997331",
        gstRate: 18,
        costPrice: 6500,
        sellingPrice: 7980,
        isActive: true
      },
      {
        id: "lic-m365-basic",
        code: "M365-BASIC",
        name: "Microsoft 365 Business Basic",
        type: "Product",
        category: "Microsoft License",
        description: "Microsoft 365 Business Basic annual license",
        uom: "License",
        hsnSac: "997331",
        gstRate: 18,
        costPrice: 1800,
        sellingPrice: 2040,
        isActive: true
      }
    ],
    milestones: [
      {
        id: "mls-1",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-2026-0001",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        milestoneCode: "M1",
        description: "Advance Payment",
        percentage: 12.5,
        amount: 177e3,
        dueDate: "2026-09-29",
        status: "Overdue",
        invoicedAmount: 177e3,
        paidAmount: 0,
        invoiceId: "inv-13",
        invoiceNumber: "CSINV-00040",
        openingPaidAmount: 0
      },
      {
        id: "mls-2",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-2026-0001",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        milestoneCode: "M2",
        description: "Functional Requirement Document (FRD)",
        percentage: 20,
        amount: 283200,
        dueDate: "2026-11-15",
        status: "Upcoming",
        invoicedAmount: 0,
        paidAmount: 0,
        openingPaidAmount: 0
      },
      {
        id: "mls-3",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-2026-0001",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        milestoneCode: "M3",
        description: "Core System Development",
        percentage: 37.5,
        amount: 531e3,
        dueDate: "2026-12-30",
        status: "Upcoming",
        invoicedAmount: 0,
        paidAmount: 0,
        openingPaidAmount: 0
      },
      {
        id: "mls-4",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-2026-0001",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        milestoneCode: "M4",
        description: "User Acceptance Testing (UAT)",
        percentage: 20,
        amount: 283200,
        dueDate: "2027-01-20",
        status: "Upcoming",
        invoicedAmount: 0,
        paidAmount: 0,
        openingPaidAmount: 0
      },
      {
        id: "mls-5",
        salesOrderId: "so-1",
        salesOrderNumber: "SO-2026-0001",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        milestoneCode: "M5",
        description: "Go-Live and Handover",
        percentage: 10,
        amount: 141600,
        dueDate: "2027-02-15",
        status: "Upcoming",
        invoicedAmount: 0,
        paidAmount: 0,
        openingPaidAmount: 0
      }
    ],
    rolePermissions: {
      "Super Admin": {
        dashboard: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        leads: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        opportunities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        customers: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        orders: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        purchases: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        milestones: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        invoices: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        payments: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        ledger: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        reports: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        masters: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        database: {
          view: true,
          create: true,
          edit: true,
          delete: true
        }
      },
      Administrator: {
        dashboard: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        leads: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        opportunities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        customers: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        orders: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        purchases: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        milestones: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        invoices: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        payments: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        ledger: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        reports: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        masters: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        database: {
          view: true,
          create: false,
          edit: false,
          delete: false
        }
      },
      "Sales Manager": {
        dashboard: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        leads: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        opportunities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        customers: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        orders: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        purchases: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        milestones: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        invoices: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        payments: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        ledger: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        reports: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        masters: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        database: {
          view: false,
          create: false,
          edit: false,
          delete: false
        }
      },
      "Sales Executive": {
        dashboard: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        leads: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        opportunities: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        customers: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        orders: {
          view: true,
          create: true,
          edit: false,
          delete: false
        },
        purchases: {
          view: true,
          create: true,
          edit: false,
          delete: false
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        milestones: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        invoices: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        payments: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        ledger: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        reports: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        masters: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        database: {
          view: false,
          create: false,
          edit: false,
          delete: false
        }
      },
      "Finance Manager": {
        dashboard: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        leads: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        opportunities: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        customers: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        orders: {
          view: true,
          create: false,
          edit: true,
          delete: false
        },
        purchases: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        milestones: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        invoices: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        payments: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        ledger: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: true
        },
        reports: {
          view: true,
          create: true,
          edit: false,
          delete: false
        },
        masters: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        database: {
          view: false,
          create: false,
          edit: false,
          delete: false
        }
      },
      "Finance Executive": {
        dashboard: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        leads: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        opportunities: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        customers: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        orders: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        purchases: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        support: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        milestones: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        invoices: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        payments: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        ledger: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        activities: {
          view: true,
          create: true,
          edit: true,
          delete: false
        },
        reports: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        masters: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        database: {
          view: false,
          create: false,
          edit: false,
          delete: false
        }
      },
      "Management/Viewer": {
        dashboard: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        leads: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        opportunities: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        customers: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        orders: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        purchases: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        support: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        milestones: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        invoices: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        payments: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        ledger: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        activities: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        reports: {
          view: true,
          create: false,
          edit: false,
          delete: false
        },
        masters: {
          view: false,
          create: false,
          edit: false,
          delete: false
        },
        database: {
          view: false,
          create: false,
          edit: false,
          delete: false
        }
      }
    },
    opportunities: [
      {
        id: "opp-641",
        opportunityNumber: "OPP-2026-00641",
        opportunityName: "Build Storys Pvt Ltd - AI Application & CRM",
        leadId: "641",
        leadNumber: "LEAD-2026-159378",
        customerId: "cus-3",
        customerName: "Build Storys Pvt Ltd",
        contactPerson: "Shruthi",
        contactMobile: "97403 82382",
        contactEmail: "shruthi@buildstorys.com",
        state: "Karnataka",
        stateCode: "29",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        expectedClosingDate: "2027-01-27",
        estimatedDealValue: 18e5,
        probability: 100,
        stage: "Won",
        status: "Won",
        remarks: [
          {
            id: "rem-1",
            remark: "Opportunity won and converted to customer",
            userId: "usr-1",
            userName: "Shalv Sharma",
            date: "2026-09-19",
            time: "17:28"
          }
        ],
        tasks: [],
        productInterestIds: [
          "prod-crm",
          "prod-hrms"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-15T04:23:02Z",
        updatedAt: "2026-09-28T04:15:02Z"
      },
      {
        id: "opp-643",
        opportunityNumber: "OPP-2026-00643",
        opportunityName: "DHIMAN IRON AND STEEL - D365 ERP",
        leadId: "643",
        leadNumber: "LEAD-2026-924909",
        customerId: "cus-5",
        customerName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        contactPerson: "Jiten",
        contactMobile: "9878681000",
        contactEmail: "jitengoyal@rrgg.in",
        state: "Punjab",
        stateCode: "03",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        expectedClosingDate: "2027-02-15",
        estimatedDealValue: 165e4,
        probability: 100,
        stage: "Won",
        status: "Won",
        remarks: [
          {
            id: "rem-2",
            remark: "Order SO/2026-27/00001 signed for 17.7 Lakhs",
            userId: "usr-1",
            userName: "Shalv Sharma",
            date: "2026-10-05",
            time: "10:58"
          }
        ],
        tasks: [],
        productInterestIds: [
          "prod-d365"
        ],
        attachments: [],
        isConvertedToOrder: true,
        convertedSalesOrderId: "ord-1",
        convertedSalesOrderNumber: "SO/2026-27/00001",
        createdAt: "2026-09-15T04:27:20Z",
        updatedAt: "2026-10-05T05:28:13Z"
      },
      {
        id: "opp-640",
        opportunityNumber: "OPP-2026-00640",
        opportunityName: "Eduvrse Pvt ltd - Education ERP",
        leadId: "640",
        leadNumber: "LEAD-2026-776094",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        contactPerson: "Eshant Sharma",
        contactMobile: "9999100186",
        contactEmail: "eshant.sharma@eduvrse.com",
        state: "Haryana",
        stateCode: "06",
        salesOwnerId: "usr-2",
        salesOwnerName: "Tabassum",
        expectedClosingDate: "2027-01-29",
        estimatedDealValue: 12e5,
        probability: 100,
        stage: "Won",
        status: "Won",
        remarks: [
          {
            id: "rem-3",
            remark: "Project won and converted to customer",
            userId: "usr-2",
            userName: "Tabassum",
            date: "2026-09-21",
            time: "05:19"
          }
        ],
        tasks: [],
        productInterestIds: [
          "prod-d365"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-15T04:15:51Z",
        updatedAt: "2026-09-29T13:00:15Z"
      },
      {
        id: "opp-644",
        opportunityNumber: "OPP-2026-00644",
        opportunityName: "SS Steel Industry - Enterprise ERP",
        leadId: "644",
        leadNumber: "LEAD-2026-161436",
        customerId: "cus-6",
        customerName: "SS Steel Industry",
        contactPerson: "Ankur Goyal",
        contactMobile: "98147 55580",
        contactEmail: "info@sssteelindustry.com",
        state: "Punjab",
        stateCode: "03",
        salesOwnerId: "usr-3",
        salesOwnerName: "Rohan Verma",
        expectedClosingDate: "2027-03-15",
        estimatedDealValue: 15e5,
        probability: 80,
        stage: "Negotiation",
        status: "Open",
        remarks: [],
        tasks: [],
        productInterestIds: [
          "prod-d365"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-15T05:24:14Z",
        updatedAt: "2026-09-28T04:15:35Z"
      },
      {
        id: "opp-642",
        opportunityNumber: "OPP-2026-00642",
        opportunityName: "Taj Computers - ERP Enhancement & AMC",
        leadId: "642",
        leadNumber: "LEAD-2026-226508",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactPerson: "Sawan Pathak",
        contactMobile: "7290996601",
        contactEmail: "sawankumar@tajcomputers.com",
        state: "Delhi",
        stateCode: "07",
        salesOwnerId: "usr-2",
        salesOwnerName: "Tabassum",
        expectedClosingDate: "2027-03-30",
        estimatedDealValue: 17e5,
        probability: 70,
        stage: "Qualification",
        status: "Open",
        remarks: [],
        tasks: [],
        productInterestIds: [
          "prod-d365",
          "prod-support"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-15T04:24:37Z",
        updatedAt: "2026-09-15T04:24:37Z"
      },
      {
        id: "opp-639",
        opportunityNumber: "OPP-2026-00639",
        opportunityName: "Ratan Textiles PVT. LTD - Digitalization",
        leadId: "639",
        leadNumber: "LEAD-2026-488339",
        customerName: "Ratan Textiles PVT. LTD",
        contactPerson: "Yuvraj Jain",
        contactMobile: "9950285767",
        contactEmail: "yuvraj@ratantextiles.com",
        state: "Rajasthan",
        stateCode: "08",
        salesOwnerId: "usr-3",
        salesOwnerName: "Rohan Verma",
        expectedClosingDate: "2027-03-15",
        estimatedDealValue: 85e4,
        probability: 40,
        stage: "Qualification",
        status: "Open",
        remarks: [],
        tasks: [],
        productInterestIds: [
          "prod-d365"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-14T07:02:36Z",
        updatedAt: "2026-09-28T04:16:25Z"
      },
      {
        id: "opp-256",
        opportunityNumber: "OPP-2026-00256",
        opportunityName: "INTERARCH BUILDING PRODUCTS LIMITED",
        leadId: "256",
        leadNumber: "LEAD-2026-532661",
        customerName: "INTERARCH BUILDING PRODUCTS LIMITED",
        contactPerson: "ANIL CHANDANI",
        contactMobile: "9717225566",
        contactEmail: "anil.chandani@interarch.com",
        state: "Delhi",
        stateCode: "07",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        expectedClosingDate: "2027-06-30",
        estimatedDealValue: 0,
        probability: 10,
        stage: "Decision Pending",
        status: "Open",
        remarks: [],
        tasks: [],
        productInterestIds: [
          "prod-d365"
        ],
        attachments: [],
        isConvertedToOrder: false,
        createdAt: "2026-09-16T05:04:12Z",
        updatedAt: "2026-09-19T17:30:28Z"
      }
    ],
    changeRequests: [
      {
        id: "cr-1",
        crNumber: "CHG-00001",
        ticketId: "tkt-190",
        ticketNumber: "TKT-00190",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        title: "Vendor Wise Ageing & Customer Wise Ageing Custom Reports",
        moduleName: "Reports",
        scopeDescription: "Design and develop custom AL RDLC / Excel exportable Vendor Wise Ageing and Customer Wise Ageing reports in MS D365 Business Central with bucket filters (0-30, 31-60, 61-90, 90+ days) and branch dimension filters.",
        estimatedHours: 20,
        hourlyRate: 1500,
        taxableAmount: 3e4,
        gstRate: 18,
        cgstAmount: 2700,
        sgstAmount: 2700,
        igstAmount: 0,
        totalAmount: 35400,
        status: "Invoiced",
        proformaInvoiceId: "inv-10",
        proformaInvoiceNumber: "CSINV-00037",
        taxInvoiceId: "inv-12",
        taxInvoiceNumber: "CSINV-00039",
        approvedByCustomerAt: "2026-09-24",
        requestedBy: "Sawan Pathak",
        assignedDeveloperName: "Rohan Verma",
        createdAt: "2026-09-23T10:00:00Z",
        updatedAt: "2026-09-28T06:22:12Z"
      },
      {
        id: "cr-2",
        crNumber: "CHG-00002",
        ticketId: "tkt-192",
        ticketNumber: "TKT-00192",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        title: "Scrap Management Form & Bulk Excel Uploader Utility",
        moduleName: "Scrap Management",
        scopeDescription: "Custom Scrap Management journal card, automated lot tracking, and Excel template uploader in Business Central with auto-posting to scrap inventory location.",
        estimatedHours: 32,
        hourlyRate: 1500,
        taxableAmount: 48e3,
        gstRate: 18,
        cgstAmount: 4320,
        sgstAmount: 4320,
        igstAmount: 0,
        totalAmount: 56640,
        status: "Invoiced",
        taxInvoiceId: "inv-15",
        taxInvoiceNumber: "CSINV-00042",
        approvedByCustomerAt: "2026-09-29",
        requestedBy: "Sawan Pathak",
        assignedDeveloperName: "Rohan Verma",
        createdAt: "2026-09-28T09:15:00Z",
        updatedAt: "2026-09-30T06:30:44Z"
      },
      {
        id: "cr-3",
        crNumber: "CHG-00003",
        ticketId: "tkt-195",
        ticketNumber: "TKT-00195",
        customerId: "cus-4",
        customerCode: "CUS-2026-586749",
        customerName: "Eduvrse Pvt ltd",
        customerGstin: "06AAJCE9775G1Z5",
        contractId: "amc-4",
        contractNumber: "EPL-SUP-2026-27",
        title: "Automated Parent Fee Reminder WhatsApp & Payment Gateway Webhook",
        moduleName: "Fee Management",
        scopeDescription: "Integration of automated WhatsApp templates for due fee installments and real-time Razorpay webhook reconciliation into Student Ledger.",
        estimatedHours: 24,
        hourlyRate: 1500,
        taxableAmount: 36e3,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 6480,
        totalAmount: 42480,
        status: "Customer Approved",
        approvedByCustomerAt: "2026-10-05",
        requestedBy: "Eshant Sharma",
        assignedDeveloperName: "Vikram Malhotra",
        createdAt: "2026-10-03T11:30:00Z",
        updatedAt: "2026-10-05T16:00:00Z"
      }
    ],
    amcContracts: [
      {
        id: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        solution: "MS D365 Business Central",
        projectPhase: "Live Support",
        contractType: "AMC",
        billingCycle: "Annual",
        startDate: "2026-09-08",
        endDate: "2027-09-07",
        includedHours: 400,
        consumedHours: 112,
        hourlyOverageRate: 1500,
        annualValue: 3e5,
        gstRate: 18,
        totalValue: 354e3,
        slaTier: "Platinum (2h / 8h)",
        accountManagerId: "usr-2",
        accountManagerName: "Tabassum",
        status: "Active",
        linkedInvoiceId: "inv-7",
        linkedInvoiceNumber: "CSINV-00035",
        notes: "Annual Maintenance Contract for MS Dynamics 365 Business Central including 400 support hours, GST statutory updates, and SLA coverage.",
        createdAt: "2026-09-07T07:47:30Z",
        updatedAt: "2026-09-15T03:57:29Z",
        openingConsumedHours: 44
      },
      {
        id: "amc-2",
        contractNumber: "IGPL-AMC-2026-27",
        customerId: "cus-2",
        customerCode: "IGPL",
        customerName: "incite Gravity Pvt Ltd",
        customerGstin: "06AAHCI1841H1ZQ",
        solution: "Microsoft Cloud & ERP Consulting",
        projectPhase: "Live Support",
        contractType: "Support Retainer",
        billingCycle: "Annual",
        startDate: "2026-09-15",
        endDate: "2027-09-14",
        includedHours: 250,
        consumedHours: 64,
        hourlyOverageRate: 1800,
        annualValue: 25e4,
        gstRate: 18,
        totalValue: 295e3,
        slaTier: "Gold (4h / 24h)",
        accountManagerId: "usr-1",
        accountManagerName: "Shalv Sharma",
        status: "Active",
        linkedInvoiceId: "inv-9",
        linkedInvoiceNumber: "CSINV-00036",
        notes: "Managed technical consultancy & email/cloud infrastructure support retainer.",
        createdAt: "2026-09-15T03:31:45Z",
        updatedAt: "2026-09-29T14:11:51Z",
        openingConsumedHours: 59
      },
      {
        id: "amc-3",
        contractNumber: "BSIPL-AMC-2026-27",
        customerId: "cus-3",
        customerCode: "CUS-2026-473740",
        customerName: "Build Storys Pvt Ltd",
        customerGstin: "",
        solution: "Real Estate CRM & HRMS",
        projectPhase: "Live Support",
        contractType: "AMC",
        billingCycle: "Annual",
        startDate: "2026-09-20",
        endDate: "2027-09-19",
        includedHours: 300,
        consumedHours: 45,
        hourlyOverageRate: 1500,
        annualValue: 27e4,
        gstRate: 18,
        totalValue: 318600,
        slaTier: "Gold (4h / 24h)",
        accountManagerId: "usr-1",
        accountManagerName: "Shalv Sharma",
        status: "Active",
        notes: "Post Go-Live AMC for Real Estate CRM, HRMS & AI Operations suite.",
        createdAt: "2026-09-20T10:00:00Z",
        updatedAt: "2026-09-20T10:00:00Z",
        openingConsumedHours: 43.5
      },
      {
        id: "amc-4",
        contractNumber: "EPL-SUP-2026-27",
        customerId: "cus-4",
        customerCode: "CUS-2026-586749",
        customerName: "Eduvrse Pvt ltd",
        customerGstin: "06AAJCE9775G1Z5",
        solution: "Education ERP",
        projectPhase: "Implementation",
        contractType: "Warranty Support",
        billingCycle: "Annual",
        startDate: "2026-09-29",
        endDate: "2027-03-28",
        includedHours: 180,
        consumedHours: 28,
        hourlyOverageRate: 1500,
        annualValue: 15e4,
        gstRate: 18,
        totalValue: 177e3,
        slaTier: "Platinum (2h / 8h)",
        accountManagerId: "usr-1",
        accountManagerName: "Shalv Sharma",
        status: "Active",
        linkedInvoiceId: "inv-13",
        linkedInvoiceNumber: "CSINV-00040",
        notes: "Implementation hypercare & warranty support for School Admin, Student & Parent Portals.",
        createdAt: "2026-09-29T13:22:23Z",
        updatedAt: "2026-09-29T13:25:13Z",
        openingConsumedHours: 18
      },
      {
        id: "amc-5",
        contractNumber: "DHM-AMC-2026-27",
        customerId: "cus-5",
        customerCode: "CUS-2026-791939",
        customerName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        customerGstin: "03AABCD1234E1Z1",
        solution: "MS D365 Business Central",
        projectPhase: "Implementation",
        contractType: "AMC",
        billingCycle: "Annual",
        startDate: "2026-10-05",
        endDate: "2027-10-04",
        includedHours: 400,
        consumedHours: 14,
        hourlyOverageRate: 1600,
        annualValue: 32e4,
        gstRate: 18,
        totalValue: 377600,
        slaTier: "Platinum (2h / 8h)",
        accountManagerId: "usr-1",
        accountManagerName: "Shalv Sharma",
        status: "Pending Renewal",
        notes: "Annual enterprise support contract linked to SO/2026-27/00001.",
        createdAt: "2026-10-05T05:28:13Z",
        updatedAt: "2026-10-05T05:28:13Z",
        openingConsumedHours: 14
      }
    ],
    customers: [
      {
        id: "cus-1",
        customerCode: "TAJ01",
        name: "Taj computer Solutions Pvt Ltd",
        customerType: "Enterprise",
        customerGroup: "Direct",
        gstin: "07AAECT3412A1ZZ",
        pan: "AAECT3412A",
        email: "sawankumar@tajcomputersolutions.com",
        phone: "+91 72909 96601",
        website: "www.tajcomputersolutions.com",
        industry: "Trading & Hardware",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        creditLimit: 1e6,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-2",
        salesOwnerName: "Tabassum",
        solution: "MS D365 Business Central",
        projectPhase: "Live Support",
        gstRule: "CGST + SGST",
        remarks: "Active AMC Support & License contract (TAJ-AMC-2026-27)",
        addresses: [
          {
            id: "addr-taj-1",
            type: "Billing",
            title: "Registered Office",
            addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
            addressLine2: "Badarpur",
            city: "New Delhi",
            state: "Delhi",
            stateCode: "07",
            country: "India",
            pincode: "110044",
            isDefault: true
          }
        ],
        createdAt: "2026-09-02T07:12:32Z",
        updatedAt: "2026-09-07T06:41:09Z"
      },
      {
        id: "cus-2",
        customerCode: "IGPL",
        name: "incite Gravity Pvt Ltd",
        customerType: "Enterprise",
        customerGroup: "Direct",
        gstin: "06AAHCI1841H1ZQ",
        pan: "AAHCI1841H",
        email: "srikant@incitegravity.com",
        phone: "8290090611",
        website: "https://incitegravity.com/",
        industry: "Information Technology",
        paymentTermsId: "pt-2",
        paymentTermsName: "7 Days Net",
        creditLimit: 5e5,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        solution: "Microsoft Cloud & ERP Consulting",
        projectPhase: "Live Support",
        gstRule: "IGST",
        remarks: "Professional services & Microsoft cloud subscriptions",
        addresses: [
          {
            id: "addr-igpl-1",
            type: "Billing",
            title: "Corporate Office",
            addressLine1: "EROS CORPORATE PARK, 1023-1024, 10th Floor",
            addressLine2: "Sec-2, IMT, Manesar",
            city: "Gurugram",
            state: "Haryana",
            stateCode: "06",
            country: "India",
            pincode: "122052",
            isDefault: true
          }
        ],
        createdAt: "2026-09-07T07:13:21Z",
        updatedAt: "2026-09-07T07:13:21Z"
      },
      {
        id: "cus-3",
        customerCode: "CUS-2026-473740",
        name: "Build Storys Pvt Ltd",
        customerType: "Enterprise",
        customerGroup: "Strategic",
        gstin: "",
        pan: "",
        email: "shruthi@buildstorys.com",
        phone: "97403 82382",
        website: "https://buildstorys.com/",
        industry: "Real Estate",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        creditLimit: 2e6,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        solution: "Real Estate CRM & HRMS",
        projectPhase: "Live Support",
        gstRule: "IGST",
        remarks: "AI Based application for their operations along with CRM & HRMS (Value: 18 Lakhs)",
        fromLeadId: "641",
        fromLeadNumber: "LEAD-2026-159378",
        addresses: [
          {
            id: "addr-bs-1",
            type: "Billing",
            title: "Headquarters",
            addressLine1: "Building No.2122/5, 1st floor, 2nd main road",
            addressLine2: "D block, opposite BSNL Telephone Exchange, Sahakarnagar",
            city: "Bengaluru",
            state: "Karnataka",
            stateCode: "29",
            country: "India",
            pincode: "560092",
            isDefault: true
          }
        ],
        createdAt: "2026-09-19T17:28:27Z",
        updatedAt: "2026-09-19T17:31:07Z"
      },
      {
        id: "cus-4",
        customerCode: "CUS-2026-586749",
        name: "Eduvrse Pvt ltd",
        customerType: "Startup",
        customerGroup: "Direct",
        gstin: "06AAJCE9775G1Z5",
        pan: "AAJCE9775G",
        email: "eshant.sharma@eduvrse.com",
        phone: "9999100186",
        website: "",
        industry: "Education Technology",
        paymentTermsId: "pt-4",
        paymentTermsName: "Milestone Based (Advance + Milestones)",
        creditLimit: 15e5,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        solution: "Education ERP",
        projectPhase: "Discovery",
        gstRule: "IGST",
        remarks: "Education ERP with 5-stage payment milestones (Value: 12 Lakhs)",
        fromLeadId: "640",
        fromLeadNumber: "LEAD-2026-776094",
        addresses: [
          {
            id: "addr-epl-1",
            type: "Billing",
            title: "Registered Office",
            addressLine1: "107, Vipul Trade Centre, Sohna - Gurgaon Rd",
            addressLine2: "Sector 48",
            city: "Gurugram",
            state: "Haryana",
            stateCode: "06",
            country: "India",
            pincode: "122018",
            isDefault: true
          }
        ],
        createdAt: "2026-09-21T05:19:53Z",
        updatedAt: "2026-09-29T13:21:15Z"
      },
      {
        id: "cus-5",
        customerCode: "CUS-2026-791939",
        name: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        customerType: "Enterprise",
        customerGroup: "Direct",
        gstin: "03AABCD1234E1Z1",
        pan: "AABCD1234E",
        email: "jitengoyal@rrgg.in",
        phone: "9878681000",
        website: "https://www.rrgg.in/",
        industry: "Manufacturing & Steel",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        creditLimit: 25e5,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        remarks: "Signed Sales Order SO/2026-27/00001 for MS D365 Business Central (17.7 Lakhs)",
        fromLeadId: "643",
        fromLeadNumber: "LEAD-2026-924909",
        addresses: [
          {
            id: "addr-dhiman-1",
            type: "Billing",
            title: "Factory & Head Office",
            addressLine1: "G.T. Road, Khanna Side",
            addressLine2: "",
            city: "Mandi Gobindgarh",
            state: "Punjab",
            stateCode: "03",
            country: "India",
            pincode: "141401",
            isDefault: true
          }
        ],
        createdAt: "2026-09-19T17:30:12Z",
        updatedAt: "2026-09-28T04:13:53Z"
      },
      {
        id: "cus-6",
        customerCode: "CUS-2026-390234",
        name: "SS Steel Industry",
        customerType: "Enterprise",
        customerGroup: "Direct",
        gstin: "03AAASS5555G1Z9",
        pan: "AAASS5555G",
        email: "info@sssteelindustry.com",
        phone: "98147 55580",
        website: "",
        industry: "Manufacturing",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        creditLimit: 15e5,
        currency: "INR",
        status: "Active",
        salesOwnerId: "usr-1",
        salesOwnerName: "Shalv Sharma",
        remarks: "Enterprise ERP Negotiation stage (Value: 15 Lakhs)",
        fromLeadId: "644",
        fromLeadNumber: "LEAD-2026-161436",
        addresses: [
          {
            id: "addr-ss-1",
            type: "Billing",
            title: "Works Office",
            addressLine1: "Industrial Area Phase 2",
            addressLine2: "",
            city: "Mandi Gobindgarh",
            state: "Punjab",
            stateCode: "03",
            country: "India",
            pincode: "141401",
            isDefault: true
          }
        ],
        createdAt: "2026-09-22T08:23:17Z",
        updatedAt: "2026-09-28T04:15:35Z"
      }
    ],
    orders: [
      {
        id: "ord-1",
        orderNumber: "SO/2026-27/00001",
        orderDate: "2026-10-05",
        customerId: "cus-5",
        customerName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        salespersonId: "usr-1",
        salespersonName: "Shalv Sharma",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        currency: "INR",
        billingAddress: {
          id: "addr-dhiman-1",
          type: "Billing",
          title: "Factory & Head Office",
          addressLine1: "G.T. Road, Khanna Side",
          addressLine2: "",
          city: "Mandi Gobindgarh",
          state: "Punjab",
          stateCode: "03",
          country: "India",
          pincode: "141401",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-dhiman-1",
          type: "Billing",
          title: "Factory & Head Office",
          addressLine1: "G.T. Road, Khanna Side",
          addressLine2: "",
          city: "Mandi Gobindgarh",
          state: "Punjab",
          stateCode: "03",
          country: "India",
          pincode: "141401",
          isDefault: true
        },
        isInterState: true,
        supplierStateCode: "07",
        subtotal: 1500150,
        totalDiscount: 0,
        totalTaxable: 1500150,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 270027,
        totalTax: 270027,
        grandTotal: 1770177,
        status: "Confirmed",
        paymentStatus: "Unpaid",
        invoicedAmount: 0,
        paidAmount: 0,
        remainingBalance: 1770177,
        remarks: "MS D365 Business Central full deployment & licensing contract",
        items: [
          {
            id: "ord-item-1",
            productId: "prod-d365",
            productCode: "D365",
            productName: "MS D365 Business Central",
            description: "MS D365 Business Central implementation and deployment",
            uom: "Each",
            hsnSac: "998313",
            quantity: 1,
            unitRate: 1500150,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 1500150,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 270027,
            totalTax: 270027,
            lineTotal: 1770177
          }
        ],
        createdAt: "2026-10-05T05:28:13Z",
        updatedAt: "2026-10-05T05:28:13Z"
      },
      {
        id: "ord-2",
        orderNumber: "SO/2026-27/00002",
        orderDate: "2026-10-06",
        customerId: "cus-3",
        customerName: "Build Storys Pvt Ltd",
        salespersonId: "usr-3",
        salespersonName: "Rohan Verma",
        paymentTermsId: "pt-1",
        paymentTermsName: "30 Days Net",
        currency: "INR",
        billingAddress: {
          id: "addr-bs-1",
          type: "Billing",
          title: "Headquarters",
          addressLine1: "Building No.2122/5, 1st floor, 2nd main road",
          addressLine2: "D block, opposite BSNL Telephone Exchange, Sahakarnagar",
          city: "Bengaluru",
          state: "Karnataka",
          stateCode: "29",
          country: "India",
          pincode: "560092",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-bs-1",
          type: "Billing",
          title: "Headquarters",
          addressLine1: "Building No.2122/5, 1st floor, 2nd main road",
          addressLine2: "D block, opposite BSNL Telephone Exchange, Sahakarnagar",
          city: "Bengaluru",
          state: "Karnataka",
          stateCode: "29",
          country: "India",
          pincode: "560092",
          isDefault: true
        },
        isInterState: true,
        supplierStateCode: "07",
        subtotal: 105e4,
        totalDiscount: 0,
        totalTaxable: 105e4,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 189e3,
        totalTax: 189e3,
        grandTotal: 1239e3,
        status: "Confirmed",
        paymentStatus: "Unpaid",
        invoicedAmount: 0,
        paidAmount: 0,
        remainingBalance: 1239e3,
        remarks: "Real Estate CRM & HRMS automation platform order",
        items: [
          {
            id: "ord-item-2",
            productId: "prod-crm",
            productCode: "CRM-ENT",
            productName: "Enact CRM Enterprise",
            description: "CRM Enterprise License & Custom Workflows",
            uom: "License",
            hsnSac: "998313",
            quantity: 1,
            unitRate: 105e4,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 105e4,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 189e3,
            totalTax: 189e3,
            lineTotal: 1239e3
          }
        ],
        createdAt: "2026-10-06T08:15:00Z",
        updatedAt: "2026-10-06T08:15:00Z"
      },
      {
        id: "so-1",
        orderNumber: "SO-2026-0001",
        orderDate: "2026-09-29",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        salespersonId: "usr-2",
        salespersonName: "Tabassum",
        paymentTermsId: "pt-4",
        paymentTermsName: "Milestone Based (Advance + Milestones)",
        currency: "INR",
        billingAddress: {
          id: "addr-epl-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "107, Vipul Trade Centre, Sohna - Gurgaon Rd",
          addressLine2: "Sector 48",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122018",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-epl-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "107, Vipul Trade Centre, Sohna - Gurgaon Rd",
          addressLine2: "Sector 48",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122018",
          isDefault: true
        },
        isInterState: true,
        supplierStateCode: "07",
        subtotal: 12e5,
        totalDiscount: 0,
        totalTaxable: 12e5,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 216e3,
        totalTax: 216e3,
        grandTotal: 1416e3,
        status: "Confirmed",
        paymentStatus: "Unpaid",
        invoicedAmount: 0,
        paidAmount: 0,
        remainingBalance: 1416e3,
        remarks: "Education ERP 5-stage milestone deployment order",
        items: [
          {
            id: "ord-item-3",
            productId: "prod-d365",
            productCode: "D365",
            productName: "Education ERP System",
            description: "Education ERP End-to-End Implementation & Deployment",
            uom: "Project",
            hsnSac: "998313",
            quantity: 1,
            unitRate: 12e5,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 12e5,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 216e3,
            totalTax: 216e3,
            lineTotal: 1416e3
          }
        ],
        createdAt: "2026-09-29T10:00:00Z",
        updatedAt: "2026-09-29T13:25:13Z"
      }
    ],
    purchaseOrders: [
      {
        id: "po-1",
        poNumber: "CS/PO/26/03/00001",
        poDate: "2026-10-05",
        expectedDeliveryDate: "2026-10-06",
        vendorId: "cus-2",
        vendorName: "incite Gravity Pvt Ltd",
        vendorCode: "IGPL",
        vendorGstin: "06AAHCI1841H1ZQ",
        vendorPan: "AAHCI1841H",
        vendorAddress: "EROS CORPORATE PARK, 1023-1024, 10th Floor, Sec-2, IMT, Manesar",
        vendorCity: "Gurugram",
        vendorState: "Haryana",
        vendorStateCode: "06",
        vendorPincode: "122052",
        vendorPhone: "8290090611",
        vendorEmail: "srikant@incitegravity.com",
        contactPerson: "Srikant Jena",
        isSameAsCustomer: true,
        linkedCustomerId: "cus-2",
        referenceQuotationNo: "IG-QT-2026-88",
        paymentTerms: "30 Days",
        placeOfSupply: "Delhi",
        placeOfSupplyCode: "07",
        shippingAddress: "Innov8, 3rd Floor, 211, Okhla Industrial Estate Phase-3, New Delhi 110020",
        subtotal: 4080,
        totalDiscount: 0,
        taxableAmount: 4080,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 734.4,
        totalTax: 734.4,
        grandTotal: 4814.4,
        status: "Approved",
        termsAndConditions: "1. Goods / Services to be delivered within the stipulated delivery period.\n2. Invoices must reference this PO number.\n3. Statutory GST compliance required.",
        notes: "Procurement of technical consulting support and software license distribution.",
        approvedById: "usr-1",
        approvedByName: "Shalv Sharma",
        approvedAt: "2026-10-05T11:00:00Z",
        items: [
          {
            id: "poi-1",
            productId: "lic-m365-basic",
            productCode: "M365-BASIC",
            productName: "Microsoft 365 Business Basic",
            description: "Microsoft 365 Business Basic annual license partner procurement",
            hsnSac: "997331",
            unit: "License",
            quantity: 2,
            unitPrice: 2040,
            discountPercent: 0,
            taxableAmount: 4080,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 734.4,
            totalTax: 734.4,
            lineTotal: 4814.4
          }
        ],
        createdAt: "2026-10-05T08:15:00Z",
        updatedAt: "2026-10-05T11:00:00Z"
      },
      {
        id: "po-2",
        poNumber: "CS/PO/26/03/00002",
        poDate: "2026-10-06",
        expectedDeliveryDate: "2026-10-15",
        vendorId: "cus-1",
        vendorName: "Taj computer Solutions Pvt Ltd",
        vendorCode: "TAJ01",
        vendorGstin: "07AAECT3412A1ZZ",
        vendorPan: "AAECT3412A",
        vendorAddress: "B-2/28, Mohan Cooperative Industrial Area, Badarpur",
        vendorCity: "New Delhi",
        vendorState: "Delhi",
        vendorStateCode: "07",
        vendorPincode: "110044",
        vendorPhone: "+91 72909 96601",
        vendorEmail: "sawankumar@tajcomputersolutions.com",
        contactPerson: "Sawan Pathak",
        isSameAsCustomer: true,
        linkedCustomerId: "cus-1",
        referenceQuotationNo: "TAJ-QT-2026-09",
        paymentTerms: "30 Days",
        placeOfSupply: "Delhi",
        placeOfSupplyCode: "07",
        shippingAddress: "Innov8, 3rd Floor, 211, Okhla Industrial Estate Phase-3, New Delhi 110020",
        subtotal: 3e5,
        totalDiscount: 0,
        taxableAmount: 3e5,
        cgstAmount: 27e3,
        sgstAmount: 27e3,
        igstAmount: 0,
        totalTax: 54e3,
        grandTotal: 354e3,
        status: "Issued to Vendor",
        termsAndConditions: "1. Vendor certifies GST compliance and timely GSTR-1 filing.\n2. Payment within 30 days of service milestone sign-off.",
        notes: "Hardware infrastructure, backup servers & cloud virtualization appliances procurement.",
        approvedById: "usr-1",
        approvedByName: "Shalv Sharma",
        approvedAt: "2026-10-06T09:30:00Z",
        items: [
          {
            id: "poi-2",
            productId: "prod-d365",
            productCode: "D365",
            productName: "MS D365 Business Central Server Appliance",
            description: "Server appliances and secure gateway hardware modules for ERP rollout",
            hsnSac: "998313",
            unit: "Each",
            quantity: 1,
            unitPrice: 3e5,
            discountPercent: 0,
            taxableAmount: 3e5,
            gstRate: 18,
            cgstAmount: 27e3,
            sgstAmount: 27e3,
            igstAmount: 0,
            totalTax: 54e3,
            lineTotal: 354e3
          }
        ],
        createdAt: "2026-10-06T09:00:00Z",
        updatedAt: "2026-10-06T09:30:00Z"
      },
      {
        id: "po-3",
        poNumber: "CS/PO/26/03/00003",
        poDate: "2026-10-06",
        expectedDeliveryDate: "2026-10-20",
        vendorId: "cus-5",
        vendorName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        vendorCode: "CUS-2026-791939",
        vendorGstin: "03AAACD1234A1Z1",
        vendorPan: "AAACD1234A",
        vendorAddress: "G.T.Road, Khanna Side, Mandi Gobindgarh",
        vendorCity: "Mandi Gobindgarh",
        vendorState: "Punjab",
        vendorStateCode: "03",
        vendorPincode: "141401",
        vendorPhone: "9878681000",
        vendorEmail: "jitengoyal@rrgg.in",
        contactPerson: "Jiten Goyal",
        isSameAsCustomer: true,
        linkedCustomerId: "cus-5",
        referenceQuotationNo: "RRGG-QUO-501",
        paymentTerms: "30 Days",
        placeOfSupply: "Delhi",
        placeOfSupplyCode: "07",
        shippingAddress: "Innov8, 3rd Floor, 211, Okhla Industrial Estate Phase-3, New Delhi 110020",
        subtotal: 15e4,
        totalDiscount: 0,
        taxableAmount: 15e4,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 27e3,
        totalTax: 27e3,
        grandTotal: 177e3,
        status: "Pending Approval",
        termsAndConditions: "1. Standard commercial procurement terms apply.",
        notes: "Structural server racks and industrial server chassis components.",
        items: [
          {
            id: "poi-3",
            productId: "prod-d365",
            productCode: "D365-SRV",
            productName: "Industrial Server Chassis & Plant Mounting Rack",
            description: "Industrial grade server chassis and control room enclosure systems",
            hsnSac: "998313",
            unit: "Set",
            quantity: 1,
            unitPrice: 15e4,
            discountPercent: 0,
            taxableAmount: 15e4,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 27e3,
            totalTax: 27e3,
            lineTotal: 177e3
          }
        ],
        createdAt: "2026-10-06T10:00:00Z",
        updatedAt: "2026-10-06T10:00:00Z"
      }
    ],
    payments: [
      {
        id: "pay-1",
        receiptNumber: "REC-2026-00001",
        paymentDate: "2026-09-08",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        invoiceId: "inv-7",
        invoiceNumber: "CSINV-00035",
        paymentStage: "Advance",
        amount: 347e3,
        netReceived: 347e3,
        paymentMode: "Bank Transfer",
        bankCashAccount: "Bank of Baroda - 1745",
        transactionReference: "UTR-BOB-99824",
        remarks: "Advance Part Payment against AMC Invoice CSINV-00035",
        recordedById: "usr-1",
        recordedByName: "Shalv Sharma",
        createdAt: "2026-09-08T11:04:21Z",
        tdsDeducted: 0,
        remainingBalance: 7e3
      },
      {
        id: "pay-2",
        receiptNumber: "REC-2026-00002",
        paymentDate: "2026-09-15",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        invoiceId: "inv-7",
        invoiceNumber: "CSINV-00035",
        paymentStage: "Balance",
        amount: 7e3,
        netReceived: 7e3,
        paymentMode: "Bank Transfer",
        bankCashAccount: "Bank of Baroda - 1745",
        transactionReference: "UTR-BOB-99890",
        remarks: "Balance Payment settling AMC Invoice CSINV-00035",
        recordedById: "usr-5",
        recordedByName: "Amit Patel",
        createdAt: "2026-09-15T03:57:29Z",
        tdsDeducted: 0,
        remainingBalance: 0
      },
      {
        id: "pay-3",
        receiptNumber: "REC-2026-00003",
        paymentDate: "2026-09-29",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        invoiceId: "inv-12",
        invoiceNumber: "CSINV-00039",
        paymentStage: "Final Settlement",
        amount: 35400,
        netReceived: 35400,
        paymentMode: "Bank Transfer",
        bankCashAccount: "Bank of Baroda - 1745",
        transactionReference: "NEFT-TAJ-7712",
        remarks: "Full settlement for CR Invoice CSINV-00039",
        recordedById: "usr-1",
        recordedByName: "Shalv Sharma",
        createdAt: "2026-09-29T14:09:46Z",
        tdsDeducted: 0,
        remainingBalance: 0
      },
      {
        id: "pay-5",
        receiptNumber: "REC-2026-00005",
        paymentDate: "2026-09-29",
        customerId: "cus-2",
        customerName: "incite Gravity Pvt Ltd",
        invoiceId: "inv-9",
        invoiceNumber: "CSINV-00036",
        paymentStage: "Advance",
        amount: 135e3,
        netReceived: 135e3,
        paymentMode: "Bank Transfer",
        bankCashAccount: "Bank of Baroda - 1745",
        transactionReference: "RTGS-IGPL-5541",
        remarks: "Part payment received for Consultancy Invoice CSINV-00036",
        recordedById: "usr-1",
        recordedByName: "Shalv Sharma",
        createdAt: "2026-09-29T14:11:51Z",
        tdsDeducted: 0,
        remainingBalance: 16e4
      }
    ],
    ledgerEntries: [
      {
        id: "led-1",
        customerId: "cus-1",
        date: "2026-09-07",
        type: "INVOICE",
        referenceNumber: "CSINV-00035",
        description: "AMC TAJ-AMC-2026-27 Renewal Invoice",
        debit: 354e3,
        credit: 0,
        runningBalance: 354e3,
        invoiceId: "inv-7"
      },
      {
        id: "led-2",
        customerId: "cus-1",
        date: "2026-09-08",
        type: "PAYMENT",
        referenceNumber: "REC-2026-00001",
        description: "Advance payment received (UTR-BOB-99824)",
        debit: 0,
        credit: 347e3,
        runningBalance: 7e3,
        paymentId: "pay-1"
      },
      {
        id: "led-9",
        customerId: "cus-2",
        date: "2026-09-15",
        type: "INVOICE",
        referenceNumber: "CSINV-00036",
        description: "Consultancy Services Invoice",
        debit: 295e3,
        credit: 0,
        runningBalance: 295e3,
        invoiceId: "inv-9"
      },
      {
        id: "led-3",
        customerId: "cus-1",
        date: "2026-09-15",
        type: "PAYMENT",
        referenceNumber: "REC-2026-00002",
        description: "Balance payment received (UTR-BOB-99890)",
        debit: 0,
        credit: 7e3,
        runningBalance: 0,
        paymentId: "pay-2"
      },
      {
        id: "led-4",
        customerId: "cus-1",
        date: "2026-09-25",
        type: "INVOICE",
        referenceNumber: "CSINV-00038",
        description: "Reports Change Request Tax Invoice",
        debit: 35400,
        credit: 0,
        runningBalance: 35400,
        invoiceId: "inv-11"
      },
      {
        id: "led-5",
        customerId: "cus-1",
        date: "2026-09-28",
        type: "INVOICE",
        referenceNumber: "CSINV-00039",
        description: "Reports Change Request Final Tax Invoice",
        debit: 35400,
        credit: 0,
        runningBalance: 70800,
        invoiceId: "inv-12"
      },
      {
        id: "led-11",
        customerId: "cus-4",
        date: "2026-09-29",
        type: "INVOICE",
        referenceNumber: "CSINV-00040",
        description: "Education ERP Phase 1 Milestone Invoice",
        debit: 177e3,
        credit: 0,
        runningBalance: 177e3,
        invoiceId: "inv-13"
      },
      {
        id: "led-10",
        customerId: "cus-2",
        date: "2026-09-29",
        type: "PAYMENT",
        referenceNumber: "REC-2026-00005",
        description: "Part payment received (RTGS-IGPL-5541)",
        debit: 0,
        credit: 135e3,
        runningBalance: 16e4,
        paymentId: "pay-5"
      },
      {
        id: "led-6",
        customerId: "cus-1",
        date: "2026-09-29",
        type: "PAYMENT",
        referenceNumber: "REC-2026-00003",
        description: "Payment for CSINV-00039 (NEFT-TAJ-7712)",
        debit: 0,
        credit: 35400,
        runningBalance: 35400,
        paymentId: "pay-3"
      },
      {
        id: "led-7",
        customerId: "cus-1",
        date: "2026-09-30",
        type: "INVOICE",
        referenceNumber: "CSINV-00042",
        description: "Scrap Management Form & Uploader Invoice",
        debit: 56640,
        credit: 0,
        runningBalance: 92040,
        invoiceId: "inv-15"
      },
      {
        id: "led-8",
        customerId: "cus-1",
        date: "2026-10-06",
        type: "INVOICE",
        referenceNumber: "CSINV-00047",
        description: "D365 Team & Essential Annual Licenses Invoice",
        debit: 424021.2,
        credit: 0,
        runningBalance: 516061.2,
        invoiceId: "inv-20"
      }
    ],
    supportTickets: [
      {
        id: "tkt-190",
        ticketNumber: "TKT-00190",
        ticketDate: "2026-09-23",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactName: "Sawan Pathak",
        contactEmail: "sawankumar@tajcomputersolutions.com",
        contactPhone: "+91 72909 96601",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        solution: "MS D365 Business Central",
        moduleName: "Reports",
        category: "New Report",
        department: "Development / CR",
        subject: "New Report Change Request - Vendor Wise Ageing & Customer Wise Ageing",
        description: "Requirement for customized Vendor Wise Ageing and Customer Wise Ageing report with 0-30, 31-60, 61-90, 90+ day columns and shortcut dimension filters.",
        priority: "High",
        status: "Closed",
        assignedToId: "usr-3",
        assignedToName: "Rohan Verma",
        slaStatus: "Within SLA",
        responseDueAt: "2026-09-23 14:00",
        resolutionDueAt: "2026-09-26 18:00",
        hoursLogged: 20,
        isBillable: true,
        estimatedBillingAmount: 3e4,
        changeRequestId: "cr-1",
        changeRequestNumber: "CHG-00001",
        linkedInvoiceId: "inv-12",
        linkedInvoiceNumber: "CSINV-00039",
        portalSource: "Customer Portal",
        resolutionSummary: "Deployed AL extension v1.0.4 with Vendor & Customer Ageing reports to Production environment and signed off by Sawan Pathak.",
        comments: [
          {
            id: "tcmt-1",
            ticketId: "tkt-190",
            authorId: "cus-1",
            authorName: "Sawan Pathak (Customer)",
            authorRole: "Customer",
            message: "Please share effort estimate and proforma invoice for the Vendor Wise Ageing report.",
            isInternal: false,
            createdAt: "2026-09-23 11:15"
          },
          {
            id: "tcmt-2",
            ticketId: "tkt-190",
            authorId: "usr-2",
            authorName: "Tabassum",
            authorRole: "Sales Manager",
            message: "Created Change Request CHG-00001 (\u20B930,000 + GST) and issued Proforma Invoice CSINV-00037.",
            isInternal: false,
            department: "Finance & Billing",
            createdAt: "2026-09-24 10:58"
          },
          {
            id: "tcmt-3",
            ticketId: "tkt-190",
            authorId: "usr-3",
            authorName: "Rohan Verma",
            authorRole: "Sales Executive",
            message: "Report deployed to Production and verified with Finance team. Tax Invoice CSINV-00039 issued and settled.",
            isInternal: false,
            department: "Development / CR",
            createdAt: "2026-09-28 16:40"
          }
        ],
        createdAt: "2026-09-23T10:00:00Z",
        updatedAt: "2026-09-28T16:40:00Z"
      },
      {
        id: "tkt-191",
        ticketNumber: "TKT-00191",
        ticketDate: "2026-09-25",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactName: "Sawan Pathak",
        contactEmail: "sawankumar@tajcomputersolutions.com",
        contactPhone: "+91 72909 96601",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        solution: "MS D365 Business Central",
        moduleName: "Finance & GST",
        category: "Bug / Defect",
        department: "Functional ERP",
        subject: "GST E-Invoice IRN generation error for B2B credit notes with TCS",
        description: "While generating IRN on IRP portal from Posted Sales Credit Memo, JSON payload validation fails when rounding difference is 0.01 INR.",
        priority: "Critical",
        status: "Resolved",
        assignedToId: "usr-2",
        assignedToName: "Tabassum",
        slaStatus: "Within SLA",
        responseDueAt: "2026-09-25 13:00",
        resolutionDueAt: "2026-09-25 19:00",
        hoursLogged: 6,
        isBillable: false,
        portalSource: "Excel Import",
        resolutionSummary: "Updated GST E-Invoice JSON rounding setup in Tax Engine and regenerated IRN successfully.",
        comments: [
          {
            id: "tcmt-4",
            ticketId: "tkt-191",
            authorId: "usr-2",
            authorName: "Tabassum",
            authorRole: "Sales Manager",
            message: "Investigated JSON schema on Sandbox; fixed TCS rounding precision in GST Setup.",
            isInternal: false,
            department: "Functional ERP",
            createdAt: "2026-09-25 15:20"
          }
        ],
        createdAt: "2026-09-25T10:30:00Z",
        updatedAt: "2026-09-25T17:10:00Z"
      },
      {
        id: "tkt-192",
        ticketNumber: "TKT-00192",
        ticketDate: "2026-09-28",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactName: "Sawan Pathak",
        contactEmail: "sawankumar@tajcomputersolutions.com",
        contactPhone: "+91 72909 96601",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        solution: "MS D365 Business Central",
        moduleName: "Scrap Management",
        category: "Change Request (CR)",
        department: "Development / CR",
        subject: "Scrap Management form & bulk Excel uploader in Business Central",
        description: "Need a dedicated Scrap Management entry page and bulk Excel import utility to record damaged/scrap serials and post inventory adjustments.",
        priority: "High",
        status: "Resolved",
        assignedToId: "usr-3",
        assignedToName: "Rohan Verma",
        slaStatus: "Within SLA",
        responseDueAt: "2026-09-28 14:00",
        resolutionDueAt: "2026-10-02 18:00",
        hoursLogged: 32,
        isBillable: true,
        estimatedBillingAmount: 48e3,
        changeRequestId: "cr-2",
        changeRequestNumber: "CHG-00002",
        linkedInvoiceId: "inv-15",
        linkedInvoiceNumber: "CSINV-00042",
        portalSource: "Customer Portal",
        resolutionSummary: "Delivered Scrap Management form & Excel uploader package; Tax Invoice CSINV-00042 (\u20B956,640) issued.",
        comments: [
          {
            id: "tcmt-5",
            ticketId: "tkt-192",
            authorId: "usr-3",
            authorName: "Rohan Verma",
            authorRole: "Sales Executive",
            message: "UAT completed with warehouse supervisor. Tax Invoice CSINV-00042 raised.",
            isInternal: false,
            department: "Development / CR",
            createdAt: "2026-09-30 12:00"
          }
        ],
        createdAt: "2026-09-28T09:00:00Z",
        updatedAt: "2026-09-30T12:00:00Z"
      },
      {
        id: "tkt-193",
        ticketNumber: "TKT-00193",
        ticketDate: "2026-10-02",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactName: "Sawan Pathak",
        contactEmail: "sawankumar@tajcomputersolutions.com",
        contactPhone: "+91 72909 96601",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        solution: "MS D365 Business Central",
        moduleName: "Inventory",
        category: "Support Query",
        department: "Functional ERP",
        subject: "Serial Number tracking mismatch on Inter-Location Transfer Order",
        description: "When receiving goods at Okhla warehouse from Badarpur transfer order, serial number reservation entries show locked quantity.",
        priority: "High",
        status: "In Progress",
        assignedToId: "usr-2",
        assignedToName: "Tabassum",
        slaStatus: "Within SLA",
        responseDueAt: "2026-10-02 16:00",
        resolutionDueAt: "2026-10-07 18:00",
        hoursLogged: 8,
        isBillable: false,
        portalSource: "Excel Import",
        comments: [
          {
            id: "tcmt-6",
            ticketId: "tkt-193",
            authorId: "usr-2",
            authorName: "Tabassum",
            authorRole: "Sales Manager",
            message: "Reviewing item tracking specification and reservation entries on Transfer Line #40000.",
            isInternal: true,
            department: "Functional ERP",
            createdAt: "2026-10-03 11:30"
          }
        ],
        createdAt: "2026-10-02T11:20:00Z",
        updatedAt: "2026-10-05T14:00:00Z"
      },
      {
        id: "tkt-194",
        ticketNumber: "TKT-00194",
        ticketDate: "2026-10-04",
        customerId: "cus-2",
        customerCode: "IGPL",
        customerName: "incite Gravity Pvt Ltd",
        contactName: "Srikant Jena",
        contactEmail: "srikant@incitegravity.com",
        contactPhone: "8290090611",
        contractId: "amc-2",
        contractNumber: "IGPL-AMC-2026-27",
        solution: "Microsoft Cloud & ERP Consulting",
        moduleName: "Licensing",
        category: "License / Access",
        department: "Technical Support",
        subject: "M365 Business Basic tenant DKIM & DMARC policy alignment for bulk outbound",
        description: "Configure custom DKIM selector and DMARC quarantine policy for primary domain and verify connector relay.",
        priority: "Medium",
        status: "Under UAT",
        assignedToId: "usr-7",
        assignedToName: "Vikram Malhotra",
        slaStatus: "Within SLA",
        responseDueAt: "2026-10-04 15:00",
        resolutionDueAt: "2026-10-08 18:00",
        hoursLogged: 5,
        isBillable: false,
        portalSource: "Customer Portal",
        comments: [],
        createdAt: "2026-10-04T10:15:00Z",
        updatedAt: "2026-10-06T09:00:00Z"
      },
      {
        id: "tkt-195",
        ticketNumber: "TKT-00195",
        ticketDate: "2026-10-05",
        customerId: "cus-4",
        customerCode: "CUS-2026-586749",
        customerName: "Eduvrse Pvt ltd",
        contactName: "Eshant Sharma",
        contactEmail: "eshant.sharma@eduvrse.com",
        contactPhone: "9999100186",
        contractId: "amc-4",
        contractNumber: "EPL-SUP-2026-27",
        solution: "Education ERP",
        moduleName: "Fee Management",
        category: "Change Request (CR)",
        department: "Development / CR",
        subject: "WhatsApp Fee Reminder & Razorpay Auto-Reconciliation Webhook",
        description: "Requesting automated parent WhatsApp notification 3 days prior to fee due date and instant receipt generation via Razorpay webhook.",
        priority: "High",
        status: "In Progress",
        assignedToId: "usr-7",
        assignedToName: "Vikram Malhotra",
        slaStatus: "Within SLA",
        responseDueAt: "2026-10-05 14:00",
        resolutionDueAt: "2026-10-12 18:00",
        hoursLogged: 10,
        isBillable: true,
        estimatedBillingAmount: 36e3,
        changeRequestId: "cr-3",
        changeRequestNumber: "CHG-00003",
        portalSource: "Customer Portal",
        comments: [
          {
            id: "tcmt-7",
            ticketId: "tkt-195",
            authorId: "cus-4",
            authorName: "Eshant Sharma (Customer)",
            authorRole: "Customer",
            message: "Approved Change Request CHG-00003 commercial estimate of \u20B936,000 + GST. Please proceed with development.",
            isInternal: false,
            createdAt: "2026-10-05 16:00"
          }
        ],
        createdAt: "2026-10-05T09:30:00Z",
        updatedAt: "2026-10-06T11:00:00Z"
      },
      {
        id: "tkt-196",
        ticketNumber: "TKT-00196",
        ticketDate: "2026-10-06",
        customerId: "cus-1",
        customerCode: "TAJ01",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactName: "Sawan Pathak",
        contactEmail: "sawankumar@tajcomputersolutions.com",
        contactPhone: "+91 72909 96601",
        contractId: "amc-1",
        contractNumber: "TAJ-AMC-2026-27",
        solution: "MS D365 Business Central",
        moduleName: "Licensing",
        category: "License / Access",
        department: "Finance & Billing",
        subject: "Provision 5 D365 Business Central Team & 4 Essential Yearly Licenses",
        description: "Add 5 Dynamics 365 Business Central Team licenses and 4 Essential yearly licenses to tenant and issue tax invoice.",
        priority: "High",
        status: "Resolved",
        assignedToId: "usr-1",
        assignedToName: "Shalv Sharma",
        slaStatus: "Within SLA",
        responseDueAt: "2026-10-06 11:00",
        resolutionDueAt: "2026-10-06 18:00",
        hoursLogged: 2,
        isBillable: true,
        estimatedBillingAmount: 359340,
        linkedInvoiceId: "inv-20",
        linkedInvoiceNumber: "CSINV-00047",
        portalSource: "Internal Desk",
        resolutionSummary: "Licenses assigned in Microsoft Partner Center and Tax Invoice CSINV-00047 (\u20B94,24,021.20) issued.",
        comments: [],
        createdAt: "2026-10-06T06:15:00Z",
        updatedAt: "2026-10-06T06:35:00Z"
      },
      {
        id: "tkt-197",
        ticketNumber: "TKT-00197",
        ticketDate: "2026-10-06",
        customerId: "cus-3",
        customerCode: "CUS-2026-473740",
        customerName: "Build Storys Pvt Ltd",
        contactName: "Shruthi",
        contactEmail: "shruthi@buildstorys.com",
        contactPhone: "97403 82382",
        contractId: "amc-3",
        contractNumber: "BSIPL-AMC-2026-27",
        solution: "Real Estate CRM & HRMS",
        moduleName: "Sales",
        category: "Bug / Defect",
        department: "Technical Support",
        subject: "Site Visit lead auto-assignment rule not triggering for Sunday bookings",
        description: "Weekend site visit leads from website webhook are remaining in Unassigned queue instead of round-robin routing.",
        priority: "High",
        status: "Open",
        assignedToId: "usr-3",
        assignedToName: "Rohan Verma",
        slaStatus: "At Risk",
        responseDueAt: "2026-10-06 18:00",
        resolutionDueAt: "2026-10-07 14:00",
        hoursLogged: 1.5,
        isBillable: false,
        portalSource: "Customer Portal",
        comments: [],
        createdAt: "2026-10-06T12:10:00Z",
        updatedAt: "2026-10-06T12:10:00Z"
      }
    ],
    invoices: [
      {
        id: "inv-7",
        invoiceNumber: "CSINV-00035",
        invoiceType: "Tax",
        sourceType: "AMC Renewal",
        amcContractId: "amc-1",
        amcContractNumber: "TAJ-AMC-2026-27",
        servicePeriodStart: "2026-09-08",
        servicePeriodEnd: "2027-09-07",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-07",
        dueDate: "2026-09-09",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 3e5,
        totalCgst: 27e3,
        totalSgst: 27e3,
        totalIgst: 0,
        totalTax: 54e3,
        grandTotal: 354e3,
        paidAmount: 354e3,
        balanceAmount: 0,
        status: "Paid",
        notes: "Created from Proforma CSPI-00034 \xB7 AMC TAJ-AMC-2026-27 Renewal (Period: 08-Sep-2026 to 07-Sep-2027)",
        items: [
          {
            id: "inv-item-7",
            productName: "AMC TAJ-AMC-2026-27 \xB7 Renewal",
            description: "AMC TAJ-AMC-2026-27 \xB7 Renewal (400 hours annual support coverage)",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 3e5,
            taxableAmount: 3e5,
            gstRate: 18,
            cgstAmount: 27e3,
            sgstAmount: 27e3,
            igstAmount: 0,
            totalTax: 54e3,
            lineTotal: 354e3
          }
        ],
        createdAt: "2026-09-07T07:47:30Z",
        updatedAt: "2026-09-15T03:57:29Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-9",
        invoiceNumber: "CSINV-00036",
        invoiceType: "Tax",
        sourceType: "Manual",
        amcContractId: "amc-2",
        amcContractNumber: "IGPL-AMC-2026-27",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-15",
        dueDate: "2026-10-17",
        customerId: "cus-2",
        customerName: "incite Gravity Pvt Ltd",
        customerGstin: "06AAHCI1841H1ZQ",
        billingAddress: {
          id: "addr-igpl-1",
          type: "Billing",
          title: "Corporate Office",
          addressLine1: "EROS CORPORATE PARK, 1023-1024, 10th Floor",
          addressLine2: "Sec-2, IMT, Manesar",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122052",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-igpl-1",
          type: "Billing",
          title: "Corporate Office",
          addressLine1: "EROS CORPORATE PARK, 1023-1024, 10th Floor",
          addressLine2: "Sec-2, IMT, Manesar",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122052",
          isDefault: true
        },
        isInterState: true,
        paymentTermsName: "7 Days Net",
        subtotalTaxable: 25e4,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 45e3,
        totalTax: 45e3,
        grandTotal: 295e3,
        paidAmount: 135e3,
        balanceAmount: 16e4,
        status: "Partially Paid",
        notes: "Professional Service Invoice for ERP Consulting and Architecture Services",
        items: [
          {
            id: "inv-item-9",
            productName: "Consultancy",
            description: "Professional ERP Consulting and Solutions Architecture",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 25e4,
            taxableAmount: 25e4,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 45e3,
            totalTax: 45e3,
            lineTotal: 295e3
          }
        ],
        createdAt: "2026-09-15T03:31:45Z",
        updatedAt: "2026-09-29T14:11:51Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-10",
        invoiceNumber: "CSINV-00037",
        invoiceType: "Proforma",
        sourceType: "Change Request",
        changeRequestId: "cr-1",
        changeRequestNumber: "CHG-00001",
        ticketId: "tkt-190",
        ticketNumber: "TKT-00190",
        convertedToTaxInvoiceId: "inv-12",
        convertedToTaxInvoiceNumber: "CSINV-00039",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-24",
        dueDate: "2026-10-24",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 3e4,
        totalCgst: 2700,
        totalSgst: 2700,
        totalIgst: 0,
        totalTax: 5400,
        grandTotal: 35400,
        paidAmount: 35400,
        balanceAmount: 0,
        status: "Paid",
        notes: "New Report Change Request (CHG-00001 \xB7 Vendor Wise Ageing Report)",
        items: [
          {
            id: "inv-item-10",
            productName: "CHG-00001 \xB7 Reports",
            description: "Change request - Reports = Vendor wise Ageing & Vendor wise Ageing",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 3e4,
            taxableAmount: 3e4,
            gstRate: 18,
            cgstAmount: 2700,
            sgstAmount: 2700,
            igstAmount: 0,
            totalTax: 5400,
            lineTotal: 35400
          }
        ],
        createdAt: "2026-09-24T10:57:46Z",
        updatedAt: "2026-09-29T14:11:14Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-11",
        invoiceNumber: "CSINV-00038",
        invoiceType: "Tax",
        sourceType: "Change Request",
        changeRequestId: "cr-1",
        changeRequestNumber: "CHG-00001",
        ticketId: "tkt-190",
        ticketNumber: "TKT-00190",
        proformaInvoiceId: "inv-10",
        proformaInvoiceNumber: "CSINV-00037",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-25",
        dueDate: "2026-10-24",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 3e4,
        totalCgst: 2700,
        totalSgst: 2700,
        totalIgst: 0,
        totalTax: 5400,
        grandTotal: 35400,
        paidAmount: 0,
        balanceAmount: 35400,
        status: "Issued",
        notes: "Created from Proforma CSINV-00037",
        items: [
          {
            id: "inv-item-11",
            productName: "CHG-00001 \xB7 Reports",
            description: "CHG-00001 \xB7 Reports customization",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 3e4,
            taxableAmount: 3e4,
            gstRate: 18,
            cgstAmount: 2700,
            sgstAmount: 2700,
            igstAmount: 0,
            totalTax: 5400,
            lineTotal: 35400
          }
        ],
        createdAt: "2026-09-25T04:12:36Z",
        updatedAt: "2026-09-25T04:12:36Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-12",
        invoiceNumber: "CSINV-00039",
        invoiceType: "Tax",
        sourceType: "Change Request",
        changeRequestId: "cr-1",
        changeRequestNumber: "CHG-00001",
        ticketId: "tkt-190",
        ticketNumber: "TKT-00190",
        proformaInvoiceId: "inv-10",
        proformaInvoiceNumber: "CSINV-00037",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-28",
        dueDate: "2026-10-24",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 3e4,
        totalCgst: 2700,
        totalSgst: 2700,
        totalIgst: 0,
        totalTax: 5400,
        grandTotal: 35400,
        paidAmount: 35400,
        balanceAmount: 0,
        status: "Paid",
        notes: "Created from Proforma CSINV-00037",
        items: [
          {
            id: "inv-item-12",
            productName: "CHG-00001 \xB7 Reports",
            description: "CHG-00001 \xB7 Reports customization",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 3e4,
            taxableAmount: 3e4,
            gstRate: 18,
            cgstAmount: 2700,
            sgstAmount: 2700,
            igstAmount: 0,
            totalTax: 5400,
            lineTotal: 35400
          }
        ],
        createdAt: "2026-09-28T06:22:12Z",
        updatedAt: "2026-09-29T14:09:46Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-13",
        invoiceNumber: "CSINV-00040",
        invoiceType: "Tax",
        sourceType: "Milestone",
        milestoneId: "mls-1",
        milestoneCode: "M1",
        amcContractId: "amc-4",
        amcContractNumber: "EPL-SUP-2026-27",
        billingComponent: "Implementation",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-29",
        dueDate: "2026-10-01",
        customerId: "cus-4",
        customerName: "Eduvrse Pvt ltd",
        customerGstin: "06AAJCE9775G1Z5",
        billingAddress: {
          id: "addr-epl-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "107, Vipul Trade Centre, Sohna - Gurgaon Rd",
          addressLine2: "Sector 48",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122018",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-epl-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "107, Vipul Trade Centre, Sohna - Gurgaon Rd",
          addressLine2: "Sector 48",
          city: "Gurugram",
          state: "Haryana",
          stateCode: "06",
          country: "India",
          pincode: "122018",
          isDefault: true
        },
        isInterState: true,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 15e4,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 27e3,
        totalTax: 27e3,
        grandTotal: 177e3,
        paidAmount: 0,
        balanceAmount: 177e3,
        status: "Overdue",
        notes: "Education ERP - School Admin Portal, Student Portal, Parent Portal & Mobile Application Milestone",
        items: [
          {
            id: "inv-item-13",
            productName: "Education ERP Solution",
            description: "Education ERP - School Admin Portal, Student Portal, Parent Portal & Mobile Application",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 15e4,
            taxableAmount: 15e4,
            gstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 27e3,
            totalTax: 27e3,
            lineTotal: 177e3
          }
        ],
        createdAt: "2026-09-29T13:22:23Z",
        updatedAt: "2026-09-29T13:25:13Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-15",
        invoiceNumber: "CSINV-00042",
        invoiceType: "Tax",
        sourceType: "Change Request",
        changeRequestId: "cr-2",
        changeRequestNumber: "CHG-00002",
        ticketId: "tkt-192",
        ticketNumber: "TKT-00192",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-09-30",
        dueDate: "2026-10-01",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 48e3,
        totalCgst: 4320,
        totalSgst: 4320,
        totalIgst: 0,
        totalTax: 8640,
        grandTotal: 56640,
        paidAmount: 0,
        balanceAmount: 56640,
        status: "Overdue",
        notes: "Scrap Management form & uploader customization",
        items: [
          {
            id: "inv-item-15",
            productName: "Scrap Management Module",
            description: "Scrap Management form & uploader",
            hsnSac: "998313",
            uom: "Service",
            quantity: 1,
            unitRate: 48e3,
            taxableAmount: 48e3,
            gstRate: 18,
            cgstAmount: 4320,
            sgstAmount: 4320,
            igstAmount: 0,
            totalTax: 8640,
            lineTotal: 56640
          }
        ],
        createdAt: "2026-09-30T06:30:44Z",
        updatedAt: "2026-09-30T06:30:44Z",
        openingPaidAmount: 0
      },
      {
        id: "inv-20",
        invoiceNumber: "CSINV-00047",
        invoiceType: "Tax",
        sourceType: "License",
        billingComponent: "License",
        ticketId: "tkt-196",
        ticketNumber: "TKT-00196",
        amcContractId: "amc-1",
        amcContractNumber: "TAJ-AMC-2026-27",
        supplyType: "B2B",
        reverseCharge: "No",
        invoiceDate: "2026-10-06",
        dueDate: "2026-10-09",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        customerGstin: "07AAECT3412A1ZZ",
        billingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        shippingAddress: {
          id: "addr-taj-1",
          type: "Billing",
          title: "Registered Office",
          addressLine1: "B-2/28, Mohan Cooperative Industrial Area",
          addressLine2: "Badarpur",
          city: "New Delhi",
          state: "Delhi",
          stateCode: "07",
          country: "India",
          pincode: "110044",
          isDefault: true
        },
        isInterState: false,
        paymentTermsName: "30 Days Net",
        subtotalTaxable: 359340,
        totalCgst: 32340.6,
        totalSgst: 32340.6,
        totalIgst: 0,
        totalTax: 64681.2,
        grandTotal: 424021.2,
        paidAmount: 0,
        balanceAmount: 424021.2,
        status: "Overdue",
        notes: "Dynamics 365 Business Central Team & Essential Yearly Licenses",
        items: [
          {
            id: "inv-item-28",
            productName: "Dynamics 365 Business Central Team \xB7 Yearly",
            description: "Dynamics 365 Business Central Team \xB7 Yearly (5 licenses)",
            hsnSac: "997331",
            uom: "License",
            quantity: 5,
            unitRate: 7980,
            taxableAmount: 39900,
            gstRate: 18,
            cgstAmount: 3591,
            sgstAmount: 3591,
            igstAmount: 0,
            totalTax: 7182,
            lineTotal: 47082
          },
          {
            id: "inv-item-29",
            productName: "MS D365 Business Central Essential \xB7 Yearly",
            description: "MS D365 Business Central Essential \xB7 Yearly (4 licenses)",
            hsnSac: "997331",
            uom: "License",
            quantity: 4,
            unitRate: 79860,
            taxableAmount: 319440,
            gstRate: 18,
            cgstAmount: 28749.6,
            sgstAmount: 28749.6,
            igstAmount: 0,
            totalTax: 57499.2,
            lineTotal: 376939.2
          }
        ],
        createdAt: "2026-10-06T06:31:30Z",
        updatedAt: "2026-10-06T06:31:30Z",
        openingPaidAmount: 0
      }
    ],
    activities: [
      {
        id: "act-1",
        activityType: "Meeting",
        subject: "Meeting for Digitalization",
        date: "2026-09-15",
        time: "11:00",
        assignedUserId: "usr-3",
        assignedUserName: "Rohan Verma",
        priority: "Medium",
        status: "Scheduled",
        notes: "Meeting With Yuvraj Jain regarding ERP evaluation & licensing",
        leadId: "639",
        leadNumber: "LEAD-2026-488339",
        contactPerson: "Yuvraj Jain",
        createdAt: "2026-09-14T07:03:28Z"
      },
      {
        id: "act-2",
        activityType: "Meeting",
        subject: "Discovery Meeting",
        date: "2026-09-11",
        time: "11:30",
        assignedUserId: "usr-1",
        assignedUserName: "Shalv Sharma",
        priority: "Medium",
        status: "Completed",
        notes: "Introductory discussion with Anil Chandani",
        leadId: "256",
        leadNumber: "LEAD-2026-532661",
        contactPerson: "ANIL CHANDANI",
        completionDate: "2026-09-16T05:05:46Z",
        createdAt: "2026-09-16T05:05:25Z"
      },
      {
        id: "act-3",
        activityType: "Follow-up",
        subject: "Commercial Proposal Follow-up",
        date: "2026-10-08",
        time: "14:30",
        assignedUserId: "usr-3",
        assignedUserName: "Rohan Verma",
        priority: "High",
        status: "Pending",
        notes: "Follow up on D365 pricing proposal and milestone schedule with Ankur Goyal",
        leadId: "644",
        leadNumber: "LEAD-2026-161436",
        customerId: "cus-6",
        customerName: "SS Steel Industry",
        contactPerson: "Ankur Goyal",
        createdAt: "2026-09-28T04:18:16Z"
      },
      {
        id: "act-4",
        activityType: "Call",
        subject: "Technical Demo & Requirement Walkthrough",
        date: "2026-10-08",
        time: "16:00",
        assignedUserId: "usr-2",
        assignedUserName: "Tabassum",
        priority: "High",
        status: "Pending",
        notes: "Coordinate D365 Business Central module demo with technical team",
        leadId: "642",
        leadNumber: "LEAD-2026-226508",
        customerId: "cus-1",
        customerName: "Taj computer Solutions Pvt Ltd",
        contactPerson: "Sawan Pathak",
        createdAt: "2026-10-01T09:00:00Z"
      },
      {
        id: "act-5",
        activityType: "Follow-up",
        subject: "Executive Review & Delivery Signoff",
        date: "2026-10-09",
        time: "11:00",
        assignedUserId: "usr-1",
        assignedUserName: "Shalv Sharma",
        priority: "Medium",
        status: "Pending",
        notes: "Check deployment progress on Dhiman Steel project",
        salesOrderId: "ord-1",
        salesOrderNumber: "SO/2026-27/00001",
        customerName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        contactPerson: "Jiten",
        createdAt: "2026-10-05T06:00:00Z"
      }
    ],
    notifications: [
      {
        id: "notif-1",
        type: "PAYMENT",
        title: "Payment Received",
        message: "\u20B93,47,000 received for Taj computer Solutions (CSINV-00035)",
        timestamp: "2026-09-08T11:04:21Z",
        isRead: false,
        linkType: "payment",
        linkId: "pay-1",
        emailStatus: "Sent via Outlook",
        emailRecipient: "admin@coreenact.com"
      },
      {
        id: "notif-2",
        type: "ORDER",
        title: "Sales Order Created",
        message: "New order SO/2026-27/00001 created for DHIMAN IRON AND STEEL (\u20B917,70,177)",
        timestamp: "2026-10-05T05:28:13Z",
        isRead: false,
        linkType: "order",
        linkId: "ord-1",
        emailStatus: "Sent via Outlook",
        emailRecipient: "admin@coreenact.com"
      },
      {
        id: "notif-3",
        type: "INVOICE",
        title: "License Invoice Issued",
        message: "CSINV-00047 issued to Taj computer Solutions for Dynamics 365 licenses (\u20B94,24,021.20)",
        timestamp: "2026-10-06T06:31:30Z",
        isRead: false,
        linkType: "invoice",
        linkId: "inv-20",
        emailStatus: "Sent via Outlook",
        emailRecipient: "admin@coreenact.com"
      }
    ],
    outlookEmailConfig: {
      enabled: true,
      outlookEmail: "admin@coreenact.com",
      ccEmails: "infor@coreenact.com",
      senderDisplayName: "Enact360 CRM Alerts",
      serverType: "office365",
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
      useStartTls: true,
      appDisplayName: "Enact360",
      clientId: "af71a4c3-ed1d-45cd-9969-62f8ae0b510a",
      objectId: "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
      tenantId: "d74b8bb7-09a3-4a3c-9ca7-49b9a9dea733",
      supportedAccountTypes: "My organization only",
      redirectUriConfig: "1 web, 0 spa, 0 public client",
      managedApplication: "Enact360",
      appState: "Activated",
      notifyOnLead: true,
      notifyOnOpportunity: true,
      notifyOnOrder: true,
      notifyOnInvoice: true,
      notifyOnPayment: true,
      notifyOnMilestone: true,
      notifyOnSupport: true,
      notifyOnActivity: true,
      notifyOnUser: true,
      autoIncludeAssignedOwner: true
    },
    auditLogs: [
      {
        id: "aud-1",
        entityType: "Payment",
        entityId: "pay-1",
        entityNumber: "REC-2026-00001",
        action: "Created",
        description: "Advance payment of \u20B93,47,000 recorded for CSINV-00035",
        performedById: "usr-1",
        performedByName: "Shalv Sharma",
        timestamp: "2026-09-08T11:04:21Z"
      },
      {
        id: "aud-2",
        entityType: "Customer",
        entityId: "cus-3",
        entityNumber: "CUS-2026-473740",
        action: "Converted",
        description: "Lead LEAD-2026-159378 converted to Build Storys Pvt Ltd",
        performedById: "usr-1",
        performedByName: "Shalv Sharma",
        timestamp: "2026-09-19T17:28:27Z"
      },
      {
        id: "aud-3",
        entityType: "SalesOrder",
        entityId: "ord-1",
        entityNumber: "SO/2026-27/00001",
        action: "Created",
        description: "Sales Order SO/2026-27/00001 generated for DHIMAN IRON AND STEEL",
        performedById: "usr-1",
        performedByName: "Shalv Sharma",
        timestamp: "2026-10-05T05:28:13Z"
      },
      {
        id: "aud-4",
        entityType: "Invoice",
        entityId: "inv-20",
        entityNumber: "CSINV-00047",
        action: "Created",
        description: "Tax Invoice CSINV-00047 for \u20B94,24,021.20 generated for Taj computer Solutions",
        performedById: "usr-1",
        performedByName: "Shalv Sharma",
        timestamp: "2026-10-06T06:31:30Z"
      }
    ],
    leads: [
      {
        id: "639",
        leadNumber: "LEAD-2026-488339",
        leadDate: "2026-09-14",
        companyName: "Ratan Textiles PVT. LTD",
        contactPerson: "Yuvraj Jain",
        designation: "Management Merchandiser",
        mobile: "9950285767",
        email: "yuvraj@ratantextiles.com",
        website: "https://www.ratantextiles.com/",
        address: "F200-201, E.P.I.P., SITAPURA, SANGANER, JAIPUR RAJASTHAN, 302022",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "302022",
        leadSource: "Outbound",
        leadType: "Outbound",
        industry: "Manufacturing",
        requirement: "Meeting for Digitalization and ERP Evaluation",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        leadOwnerId: "usr-3",
        leadOwnerName: "Rohan Verma",
        estimatedValue: 85e4,
        expectedClosingDate: "2027-03-15",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "Qualified",
        isConverted: false,
        remarks: "Meeting With Yuvraj Jain scheduled for 15-Sep",
        createdAt: "2026-09-14T07:02:36Z",
        updatedAt: "2026-09-28T04:16:25Z"
      },
      {
        id: "640",
        leadNumber: "LEAD-2026-776094",
        leadDate: "2026-09-15",
        companyName: "Eduvrse Pvt ltd",
        contactPerson: "Eshant Sharma",
        designation: "Founder",
        mobile: "9999100186",
        email: "eshant.sharma@eduvrse.com",
        website: "",
        address: "107, Vipul Trade Centre, Sohna - Gurgaon Rd, Sector 48, Gurugram, Haryana 122018",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "122018",
        leadSource: "Referral",
        leadType: "Inbound",
        industry: "Education Technology",
        requirement: "Education ERP - School Admin Portal, Student Portal, Parent Portal & Mobile App",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 12e5,
        expectedClosingDate: "2027-01-29",
        expectedGoLive: "2027-01-29",
        rating: "Hot",
        score: 100,
        priority: "High",
        status: "Won",
        isConverted: true,
        convertedCustomerId: "cus-4",
        convertedOpportunityId: "opp-640",
        convertedOpportunityNumber: "OPP-2026-00640",
        convertedAt: "2026-09-21T05:19:53Z",
        remarks: "Signed 5 milestone contract (Advance, FRD, Dev, UAT, Go-live)",
        createdAt: "2026-09-15T04:15:51Z",
        updatedAt: "2026-09-29T13:00:15Z",
        leadOwnerId: "usr-2",
        leadOwnerName: "Tabassum"
      },
      {
        id: "641",
        leadNumber: "LEAD-2026-159378",
        leadDate: "2026-09-15",
        companyName: "Build Storys Pvt Ltd",
        contactPerson: "Shruthi",
        designation: "Founder",
        mobile: "97403 82382",
        email: "shruthi@buildstorys.com",
        website: "https://buildstorys.com/",
        address: "Building No.2122/5, 1st floor, 2nd main road, D block, opposite BSNL Telephone Exchange, Sahakarnagar, Bengaluru, 560092",
        country: "India",
        state: "Karnataka",
        stateCode: "29",
        city: "Bengaluru",
        pincode: "560092",
        leadSource: "Referral",
        leadType: "Inbound",
        industry: "Real Estate",
        requirement: "AI Based application for operations along with CRM & HRMS",
        primaryProductId: "prod-crm",
        productInterestIds: [
          "prod-crm",
          "prod-hrms"
        ],
        estimatedValue: 18e5,
        expectedClosingDate: "2027-01-27",
        expectedGoLive: "2027-01-27",
        rating: "Hot",
        score: 90,
        priority: "High",
        status: "Won",
        isConverted: true,
        convertedCustomerId: "cus-3",
        convertedOpportunityId: "opp-641",
        convertedOpportunityNumber: "OPP-2026-00641",
        convertedAt: "2026-09-19T17:28:27Z",
        remarks: "Meeting Schedule completed on 19th September. Deal Closed.",
        createdAt: "2026-09-15T04:23:02Z",
        updatedAt: "2026-09-28T04:15:02Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "642",
        leadNumber: "LEAD-2026-226508",
        leadDate: "2026-09-15",
        companyName: "Taj Computers",
        contactPerson: "Sawan Pathak",
        designation: "Finance Head",
        mobile: "7290996601",
        email: "sawankumar@tajcomputers.com",
        website: "",
        address: "B-2/28, Mohan Cooperative Industrial Area, Badarpur, New Delhi, 110044",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "110044",
        leadSource: "Referral",
        leadType: "Inbound",
        industry: "Trading & Hardware",
        requirement: "MS Dynamics 365 Business Central Support, Customizations & Licenses",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365",
          "prod-support"
        ],
        estimatedValue: 17e5,
        expectedClosingDate: "2027-03-30",
        expectedGoLive: "2027-03-30",
        rating: "Warm",
        score: 70,
        priority: "Medium",
        status: "Qualified",
        isConverted: false,
        remarks: "Ongoing proposal for D365 ERP enhancement",
        createdAt: "2026-09-15T04:24:37Z",
        updatedAt: "2026-09-15T04:24:37Z",
        leadOwnerId: "usr-2",
        leadOwnerName: "Tabassum"
      },
      {
        id: "643",
        leadNumber: "LEAD-2026-924909",
        leadDate: "2026-09-15",
        companyName: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD",
        contactPerson: "Jiten",
        designation: "Director",
        mobile: "9878681000",
        email: "jitengoyal@rrgg.in",
        website: "https://www.rrgg.in/",
        address: "G.T. Road, Khanna Side, Mandi Gobindgarh, Punjab, 141401",
        country: "India",
        state: "Punjab",
        stateCode: "03",
        city: "Mandi Gobindgarh",
        pincode: "141401",
        leadSource: "Outbound",
        leadType: "Outbound",
        industry: "Manufacturing & Steel",
        requirement: "D365 Business Central full deployment and inventory tracking",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 165e4,
        expectedClosingDate: "2027-02-15",
        rating: "Hot",
        score: 100,
        priority: "High",
        status: "Won",
        isConverted: true,
        convertedCustomerId: "cus-5",
        convertedOpportunityId: "opp-643",
        convertedOpportunityNumber: "OPP-2026-00643",
        convertedSalesOrderId: "ord-1",
        convertedAt: "2026-09-19T17:30:12Z",
        remarks: "Sales Order SO/2026-27/00001 confirmed for 17.7 Lakhs",
        createdAt: "2026-09-15T04:27:20Z",
        updatedAt: "2026-10-05T05:28:13Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "644",
        leadNumber: "LEAD-2026-161436",
        leadDate: "2026-09-15",
        companyName: "SS Steel Industry",
        contactPerson: "Ankur Goyal",
        designation: "Director",
        mobile: "98147 55580",
        email: "info@sssteelindustry.com",
        website: "",
        address: "Industrial Area, Mandi Gobindgarh, Punjab, 141401",
        country: "India",
        state: "Punjab",
        stateCode: "03",
        city: "Mandi Gobindgarh",
        pincode: "141401",
        leadSource: "Website",
        leadType: "Inbound",
        industry: "Manufacturing",
        requirement: "Enterprise ERP solution for steel manufacturing & accounts",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 15e5,
        expectedClosingDate: "2027-03-15",
        rating: "Hot",
        score: 80,
        priority: "High",
        status: "Negotiation",
        isConverted: false,
        remarks: "Follow-up scheduled for commercial negotiation with Ankur Goyal",
        createdAt: "2026-09-15T05:24:14Z",
        updatedAt: "2026-09-28T04:15:35Z",
        leadOwnerId: "usr-3",
        leadOwnerName: "Rohan Verma"
      },
      {
        id: "645",
        leadNumber: "LEAD-2026-845580",
        leadDate: "2026-09-28",
        companyName: "King Steel",
        contactPerson: "Rakesh",
        designation: "Director",
        mobile: "98140 16229",
        email: "rakesh@kingsteels.com",
        website: "https://www.kingsteels.com/",
        address: "Ludhiana Road, Punjab",
        country: "India",
        state: "Punjab",
        stateCode: "03",
        city: "Ludhiana",
        pincode: "141001",
        leadSource: "Website",
        leadType: "Inbound",
        industry: "Manufacturing",
        requirement: "Enquiry for ERP & Billing solution",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 1e6,
        expectedClosingDate: "2027-04-15",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Website enquiry received",
        createdAt: "2026-09-28T10:34:15Z",
        updatedAt: "2026-09-28T10:34:15Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "256",
        leadNumber: "LEAD-2026-532661",
        leadDate: "2026-09-14",
        companyName: "INTERARCH BUILDING PRODUCTS LIMITED",
        contactPerson: "ANIL CHANDANI",
        designation: "PRESIDENT -CORPORATE FINANCE & STATEGY",
        mobile: "9717225566",
        email: "anil.chandani@interarch.com",
        website: "",
        address: "FARM NO.-8, KHASARA NO. 56/23/2, DERA MANDI ROAD, MANDI VILLAGE, TEHSIL MEHRAULI, NEW DELHI, DELHI, 110047",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "110047",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - FABRICATED METAL PRODUCTS",
        requirement: "ERP Modernization & Dynamics consulting",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Cold",
        score: 10,
        priority: "Low",
        status: "Deferred",
        isConverted: false,
        remarks: "Meeting conducted. Opportunity currently deferred.",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-19T17:30:28Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "1",
        leadNumber: "LEAD-2026-405477",
        leadDate: "2026-09-14",
        companyName: "A.B. GRAIN SPIRITS PRIVATE LIMITED",
        contactPerson: "JASDEEP KAUR CHADHA",
        designation: "DIRECTOR",
        mobile: "9990600000",
        email: "jasdeep.kaur.chadha@a.b..com",
        website: "",
        address: "AMBIENCE MALL, AMBIENCE ISLAND, NH - 8, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - FOOD AND KINDRED PRODUCTS",
        requirement: "ERP & Technology requirements evaluation for A.B. GRAIN SPIRITS PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "2",
        leadNumber: "LEAD-2026-461907",
        leadDate: "2026-09-14",
        companyName: "A G INDUSTRIES PRIVATE LIMITED",
        contactPerson: "GEETA ANAND",
        designation: "MD",
        mobile: "9810022252",
        email: "geeta.anand@a.com",
        website: "",
        address: "402-409, 4TH FLOOR, SQUARE ONE MALL, SAKET DISTRICT CENTRE, NEW DELHI",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - RUBBER AND MISCELLANEOUS PLASTIC",
        requirement: "ERP & Technology requirements evaluation for A G INDUSTRIES PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "3",
        leadNumber: "LEAD-2026-471644",
        leadDate: "2026-09-14",
        companyName: "AAROGYA DAIRY PRODUCTS PRIVATE LIMITED",
        contactPerson: "SWAMI ARSHDEV",
        designation: "DIRECTOR",
        mobile: "9557561234",
        email: "swami.arshdev@aarogya.com",
        website: "",
        address: "F-2, VAISHALI NAGAR, JAIPUR, RAJASTHAN, 302021",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "SERVICES - BUSINESS SERVICES",
        requirement: "ERP & Technology requirements evaluation for AAROGYA DAIRY PRODUCTS PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "5",
        leadNumber: "LEAD-2026-852333",
        leadDate: "2026-09-14",
        companyName: "AAVAS FINANCIERS LIMITED",
        contactPerson: "GHANSHYAM RAWAT",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9873581311",
        email: "ghanshyam.rawat@aavas.com",
        website: "",
        address: "201-202, 2ND FLOOR, SOUTH END SQUARE, MANSAROVAR, JAIPUR, RAJASTHAN",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FINANCE & CREDIT INSTITUTIONS",
        requirement: "ERP & Technology requirements evaluation for AAVAS FINANCIERS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "6",
        leadNumber: "LEAD-2026-327242",
        leadDate: "2026-09-14",
        companyName: "ABC TRANSFORMERS PVT LTD",
        contactPerson: "Gurinder Bansal",
        designation: "DIRECTOR",
        mobile: "9810039483",
        email: "gurinder.bansal@abc.com",
        website: "",
        address: "Noida, Uttar Pradesh",
        country: "India",
        state: "Uttar Pradesh",
        stateCode: "09",
        city: "Noida",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING",
        requirement: "ERP & Technology requirements evaluation for ABC TRANSFORMERS PVT LTD",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "8",
        leadNumber: "LEAD-2026-474394",
        leadDate: "2026-09-14",
        companyName: "ACC MINING PRIVATE LIMITED",
        contactPerson: "MADAN LAL KOTHARI",
        designation: "DIRECTOR",
        mobile: "7726008121",
        email: "madan.lal.kothari@acc.com",
        website: "",
        address: "201, SIDHI VINAYAK, ASHOK MARGC- SCHEME, JAIPUR, RAJASTHAN",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CONSTRUCTION - GENERAL CONTRACTORS",
        requirement: "ERP & Technology requirements evaluation for ACC MINING PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "11",
        leadNumber: "LEAD-2026-498755",
        leadDate: "2026-09-14",
        companyName: "ADIDAS INDIA MARKETING PRIVATE LIMITED",
        contactPerson: "NEELENDRA SINGH",
        designation: "MD",
        mobile: "9953004030",
        email: "neelendra.singh@adidas.com",
        website: "",
        address: "PLOT NO-53, SECTOR-32, INSTITUTIONAL AREA, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "WHOLESALE - NONDURABLE GOODS",
        requirement: "ERP & Technology requirements evaluation for ADIDAS INDIA MARKETING PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "12",
        leadNumber: "LEAD-2026-403136",
        leadDate: "2026-09-14",
        companyName: "AECOM INDIA PRIVATE LIMITED",
        contactPerson: "MADHAV SRIVASTAVA",
        designation: "DIRECTOR - IT",
        mobile: "8826011446",
        email: "madhav.srivastava@aecom.com",
        website: "",
        address: "9TH FLOOR, INFINITY TOWER - C, DLF CYBER CITY, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "ENGINEERING & MANAGEMENT SERVICES",
        requirement: "ERP & Technology requirements evaluation for AECOM INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "14",
        leadNumber: "LEAD-2026-253007",
        leadDate: "2026-09-14",
        companyName: "AFFLE (INDIA) LIMITED",
        contactPerson: "NIMISHA AGARWAL",
        designation: "DIRECTOR",
        mobile: "9674011770",
        email: "nimisha.agarwal@affle.com",
        website: "",
        address: "3RD FLOOR, TOWER-B, AWFIS UNITECH CYBER PARK, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "SERVICES - DIGITAL & BUSINESS SERVICES",
        requirement: "ERP & Technology requirements evaluation for AFFLE (INDIA) LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "15",
        leadNumber: "LEAD-2026-198448",
        leadDate: "2026-09-14",
        companyName: "AGARWAL PACKERS AND MOVERS LIMITED",
        contactPerson: "NAVNEET AGARWAL",
        designation: "CEO",
        mobile: "9810647388",
        email: "navneet.agarwal@agarwal.com",
        website: "",
        address: "AGARWAL MOVERS GROUP, PITAMPURA, NEW DELHI, DELHI, 110034",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "TRANSPORTATION & LOGISTICS",
        requirement: "ERP & Technology requirements evaluation for AGARWAL PACKERS AND MOVERS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "16",
        leadNumber: "LEAD-2026-997569",
        leadDate: "2026-09-14",
        companyName: "AGI GREENPAC LIMITED",
        contactPerson: "PRASHANT KUNJIR",
        designation: "HEAD - IT",
        mobile: "9503007012",
        email: "prashant.kunjir@agi.com",
        website: "",
        address: "301-302, III FLOOR, PARK CENTRA, SECTOR 30, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - PACKAGING PRODUCTS",
        requirement: "ERP & Technology requirements evaluation for AGI GREENPAC LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "17",
        leadNumber: "LEAD-2026-272801",
        leadDate: "2026-09-14",
        companyName: "AGILENT TECHNOLOGIES INDIA PRIVATE LIMITED",
        contactPerson: "NITIN GUPTA",
        designation: "ASSOCIATE VP - IT & DIGITAL",
        mobile: "9899047377",
        email: "nitin.gupta@agilent.com",
        website: "",
        address: "ELEGANCE TOWER, PLOT NO. 8, JASOLA DISTRICT CENTER, NEW DELHI, DELHI, 110025",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "WHOLESALE - DURABLE GOODS",
        requirement: "ERP & Technology requirements evaluation for AGILENT TECHNOLOGIES INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "18",
        leadNumber: "LEAD-2026-654785",
        leadDate: "2026-09-14",
        companyName: "AGILUS DIAGNOSTICS LIMITED",
        contactPerson: "ANUPKUMAR NAIR",
        designation: "HEAD - IT",
        mobile: "9004444484",
        email: "anupkumar.nair@agilus.com",
        website: "",
        address: "306, TOWER-A, 3RD FLOOR, UNITECH CYBER PARK, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "HEALTHCARE & DIAGNOSTICS",
        requirement: "ERP & Technology requirements evaluation for AGILUS DIAGNOSTICS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "20",
        leadNumber: "LEAD-2026-334207",
        leadDate: "2026-09-14",
        companyName: "AGRAWAL METAL WORKS PRIVATE LIMITED",
        contactPerson: "DEEPAK SANGHI",
        designation: "CEO",
        mobile: "9828551486",
        email: "deepak.sanghi@agrawal.com",
        website: "",
        address: "19, BARAKHAMBA ROAD, NEW DELHI, DELHI, 110001",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - PRIMARY METAL",
        requirement: "ERP & Technology requirements evaluation for AGRAWAL METAL WORKS PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "23",
        leadNumber: "LEAD-2026-777137",
        leadDate: "2026-09-14",
        companyName: "AHLUWALIA CONTRACTS (INDIA) LIMITED",
        contactPerson: "BIKRAMJIT AHLUWALIA",
        designation: "MD",
        mobile: "9999317849",
        email: "bikramjit.ahluwalia@ahluwalia.com",
        website: "",
        address: "A-177, OKHLA INDUSTRIAL AREA, PHASE I, NEW DELHI, DELHI, 110020",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CONSTRUCTION - GENERAL CONTRACTORS",
        requirement: "ERP & Technology requirements evaluation for AHLUWALIA CONTRACTS (INDIA) LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "25",
        leadNumber: "LEAD-2026-929681",
        leadDate: "2026-09-14",
        companyName: "AIRBUS INDIA PRIVATE LIMITED",
        contactPerson: "REMI MAILLARD",
        designation: "MD",
        mobile: "9311744335",
        email: "remi.maillard@airbus.com",
        website: "",
        address: "5TH FLOOR, WEST WING, WORLD MARK 1, AEROCITY, NEW DELHI, DELHI, 110037",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "AEROSPACE & BUSINESS SERVICES",
        requirement: "ERP & Technology requirements evaluation for AIRBUS INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "26",
        leadNumber: "LEAD-2026-762965",
        leadDate: "2026-09-14",
        companyName: "AIRTEL PAYMENTS BANK LIMITED",
        contactPerson: "ANUBRATA BISWAS",
        designation: "MD",
        mobile: "8879993066",
        email: "anubrata.biswas@airtel.com",
        website: "",
        address: "AIRTEL CENTRE, PLOT NO. 16, UDYOG VIHAR, PHASE - IV, GURUGRAM, HARYANA, 122015",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FINANCE & BANKING",
        requirement: "ERP & Technology requirements evaluation for AIRTEL PAYMENTS BANK LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "31",
        leadNumber: "LEAD-2026-867601",
        leadDate: "2026-09-14",
        companyName: "AKZO NOBEL INDIA LIMITED",
        contactPerson: "KRISHNA RALLAPALLI",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9739009090",
        email: "krishna.rallapalli@akzo.com",
        website: "",
        address: "MAGNUM TOWERS, GOLF COURSE EXTENSION ROAD, GURUGRAM, HARYANA, 122011",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CHEMICALS & PAINTS",
        requirement: "ERP & Technology requirements evaluation for AKZO NOBEL INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "39",
        leadNumber: "LEAD-2026-518287",
        leadDate: "2026-09-14",
        companyName: "AMBER ENTERPRISES INDIA LIMITED",
        contactPerson: "SUDHIR GOYAL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9811170834",
        email: "sudhir.goyal@amber.com",
        website: "",
        address: "UNIVERSAL TRADE TOWER, SOHNA ROAD, GURUGRAM, HARYANA, 122018",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FABRICATED METAL PRODUCTS",
        requirement: "ERP & Technology requirements evaluation for AMBER ENTERPRISES INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "48",
        leadNumber: "LEAD-2026-417704",
        leadDate: "2026-09-14",
        companyName: "APOLLO TYRES LIMITED",
        contactPerson: "BAPPADITYA DESARKAR",
        designation: "DIVISIONAL HEAD",
        mobile: "9891219714",
        email: "bappaditya.desarkar@apollo.com",
        website: "",
        address: "APOLLO HOUSE, 7, INSTITUTIONAL AREA, SECTOR-32, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MANUFACTURING - TYRES",
        requirement: "ERP & Technology requirements evaluation for APOLLO TYRES LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "54",
        leadNumber: "LEAD-2026-820565",
        leadDate: "2026-09-14",
        companyName: "ASAHI INDIA GLASS LIMITED",
        contactPerson: "SHAILESH AGARWAL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9312723327",
        email: "shailesh.agarwal@asahi.com",
        website: "",
        address: "TOWER D, GLOBAL BUSINESS PARK, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "STONE, CLAY, GLASS PRODUCTS",
        requirement: "ERP & Technology requirements evaluation for ASAHI INDIA GLASS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "61",
        leadNumber: "LEAD-2026-955119",
        leadDate: "2026-09-14",
        companyName: "BACARDI INDIA PRIVATE LIMITED",
        contactPerson: "VINAY RAMMOHAN GOLIKERI",
        designation: "MD",
        mobile: "9871672288",
        email: "vinay.rammohan.golikeri@bacardi.com",
        website: "",
        address: "805 - 808, 8TH FLOOR, TIME TOWER, M.G. ROAD, GURUGRAM, HARYANA, 122009",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD & BEVERAGES",
        requirement: "ERP & Technology requirements evaluation for BACARDI INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "84",
        leadNumber: "LEAD-2026-678080",
        leadDate: "2026-09-14",
        companyName: "BIKAJI FOODS INTERNATIONAL LIMITED",
        contactPerson: "RISHABH NARENDRA JAIN",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9667744123",
        email: "rishabh.narendra.jain@bikaji.com",
        website: "",
        address: "F 196 -199, BICHHWAL INDUSTRIAL AREA, BIKANER, RAJASTHAN, 334006",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Bikaner",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD AND KINDRED PRODUCTS",
        requirement: "ERP & Technology requirements evaluation for BIKAJI FOODS INTERNATIONAL LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "88",
        leadNumber: "LEAD-2026-241982",
        leadDate: "2026-09-14",
        companyName: "BMW INDIA PRIVATE LIMITED",
        contactPerson: "VIKRAM PAWAH",
        designation: "MD",
        mobile: "9810104338",
        email: "vikram.pawah@bmw.com",
        website: "",
        address: "2ND FLOOR, OBEROI CENTRE, BUILDING NO.11, DLF CYBER CITY, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "TRANSPORTATION EQUIPMENT",
        requirement: "ERP & Technology requirements evaluation for BMW INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "89",
        leadNumber: "LEAD-2026-475033",
        leadDate: "2026-09-14",
        companyName: "BOEING INDIA PRIVATE LIMITED",
        contactPerson: "SHALINI GROVER",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810117700",
        email: "shalini.grover@boeing.com",
        website: "",
        address: "3RD FLOOR, DLF CENTER, SANSAD MARG, NEW DELHI, DELHI, 110001",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "ENGINEERING & MANAGEMENT SERVICES",
        requirement: "ERP & Technology requirements evaluation for BOEING INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "102",
        leadNumber: "LEAD-2026-401169",
        leadDate: "2026-09-14",
        companyName: "CAMPUS ACTIVEWEAR LIMITED",
        contactPerson: "HARI KRISHAN AGARWAL",
        designation: "MD",
        mobile: "9811170531",
        email: "hari.krishan.agarwal@campus.com",
        website: "",
        address: "D-1, UDYOG NAGAR, MAIN ROHTAK ROAD, NEW DELHI, DELHI, 110041",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOTWEAR & APPAREL",
        requirement: "ERP & Technology requirements evaluation for CAMPUS ACTIVEWEAR LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "135",
        leadNumber: "LEAD-2026-360491",
        leadDate: "2026-09-14",
        companyName: "DABUR INDIA LIMITED",
        contactPerson: "ANKUSH JAIN",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9910345422",
        email: "ankush.jain@dabur.com",
        website: "",
        address: "DABUR CORPORATE OFFICE, KAUSHAMBI, GHAZIABAD, UTTAR PRADESH, 201010",
        country: "India",
        state: "Uttar Pradesh",
        stateCode: "09",
        city: "Ghaziabad",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CHEMICALS & FMCG",
        requirement: "ERP & Technology requirements evaluation for DABUR INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "136",
        leadNumber: "LEAD-2026-596116",
        leadDate: "2026-09-14",
        companyName: "DAIKIN AIRCONDITIONING INDIA PRIVATE LIMITED",
        contactPerson: "KANWAL JEET JAWA",
        designation: "MD",
        mobile: "9899687650",
        email: "kanwal.jeet.jawa@daikin.com",
        website: "",
        address: "12TH FLOOR, BUILDING NO. 9, DLF CYBER CITY, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "MACHINERY & HVAC",
        requirement: "ERP & Technology requirements evaluation for DAIKIN AIRCONDITIONING INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "161",
        leadNumber: "LEAD-2026-247912",
        leadDate: "2026-09-14",
        companyName: "DR. LAL PATHLABS LIMITED",
        contactPerson: "VED PRAKASH GOEL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810409486",
        email: "ved.prakash.goel@dr..com",
        website: "",
        address: "12TH FLOOR, TOWER B, SAS TOWER, MEDICITY, SECTOR-38, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "HEALTH SERVICES",
        requirement: "ERP & Technology requirements evaluation for DR. LAL PATHLABS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "166",
        leadNumber: "LEAD-2026-254853",
        leadDate: "2026-09-14",
        companyName: "EICHER MOTORS LIMITED",
        contactPerson: "VIDHYA SRINIVASAN",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9702289563",
        email: "vidhya.srinivasan@eicher.com",
        website: "",
        address: "PLOT NO. 96, INSTITUTIONAL AREA, SECTOR 32, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "TRANSPORTATION EQUIPMENT",
        requirement: "ERP & Technology requirements evaluation for EICHER MOTORS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "204",
        leadNumber: "LEAD-2026-371076",
        leadDate: "2026-09-14",
        companyName: "GLOBAL HEALTH LIMITED (MEDANTA)",
        contactPerson: "YOGESH KUMAR GUPTA",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9971112814",
        email: "yogesh.kumar.gupta@global.com",
        website: "",
        address: "MEDANTA THE MEDICITY, SECTOR 38, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "HEALTH SERVICES",
        requirement: "ERP & Technology requirements evaluation for GLOBAL HEALTH LIMITED (MEDANTA)",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "210",
        leadNumber: "LEAD-2026-981294",
        leadDate: "2026-09-14",
        companyName: "GOOGLE CLOUD INDIA PRIVATE LIMITED",
        contactPerson: "THIRUMALESH GANGAPPA",
        designation: "DIRECTOR",
        mobile: "6591005807",
        email: "thirumalesh.gangappa@google.com",
        website: "",
        address: "5TH FLOOR, DLF CENTRE, SANSAD MARG, NEW DELHI, DELHI, 110001",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "BUSINESS SERVICES & CLOUD",
        requirement: "ERP & Technology requirements evaluation for GOOGLE CLOUD INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "213",
        leadNumber: "LEAD-2026-247635",
        leadDate: "2026-09-14",
        companyName: "GRAVITA INDIA LIMITED",
        contactPerson: "CHIRAG SOMANI",
        designation: "DGM - FINANCE",
        mobile: "9320927182",
        email: "chirag.somani@gravita.com",
        website: "",
        address: "402, GRAVITA TOWER, SHANTI PATH, TILAK NAGAR, JAIPUR, RAJASTHAN, 302004",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "PRIMARY METAL INDUSTRIES",
        requirement: "ERP & Technology requirements evaluation for GRAVITA INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "231",
        leadNumber: "LEAD-2026-106001",
        leadDate: "2026-09-14",
        companyName: "HINDUSTAN ZINC LIMITED",
        contactPerson: "SANDEEP MODI",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9820546887",
        email: "sandeep.modi@hindustan.com",
        website: "",
        address: "YASHAD BHAVAN, YASHADGARH, UDAIPUR, RAJASTHAN, 313004",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Udaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "METAL MINING",
        requirement: "ERP & Technology requirements evaluation for HINDUSTAN ZINC LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "254",
        leadNumber: "LEAD-2026-870717",
        leadDate: "2026-09-14",
        companyName: "INDUS TOWERS LIMITED",
        contactPerson: "VIKAS PODDAR",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9311718813",
        email: "vikas.poddar@indus.com",
        website: "",
        address: "901, TOWER B, BPTP PARK CENTRA, SECTOR - 30, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "TELECOM INFRASTRUCTURE",
        requirement: "ERP & Technology requirements evaluation for INDUS TOWERS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "261",
        leadNumber: "LEAD-2026-396471",
        leadDate: "2026-09-14",
        companyName: "J. K. CEMENT LIMITED",
        contactPerson: "AJAY KUMAR SARAOGI",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810006205",
        email: "ajay.kumar.saraogi@j..com",
        website: "",
        address: "PADAM TOWER, PLOT NO. 19, DDA COMMUNITY CENTER, OKHLA, NEW DELHI, DELHI, 110020",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CEMENT & BUILDING MATERIALS",
        requirement: "ERP & Technology requirements evaluation for J. K. CEMENT LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "268",
        leadNumber: "LEAD-2026-374068",
        leadDate: "2026-09-14",
        companyName: "JAQUAR AND COMPANY PRIVATE LIMITED",
        contactPerson: "VIKAS KATARE",
        designation: "CIO",
        mobile: "9868096480",
        email: "vikas.katare@jaquar.com",
        website: "",
        address: "PLOT NO.3, SECTOR-11, IMT MANESAR, GURUGRAM, HARYANA, 122050",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "BATH FITTINGS & MANUFACTURING",
        requirement: "ERP & Technology requirements evaluation for JAQUAR AND COMPANY PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "275",
        leadNumber: "LEAD-2026-210082",
        leadDate: "2026-09-14",
        companyName: "JINDAL STAINLESS LIMITED",
        contactPerson: "ARUN PRADHAN",
        designation: "HEAD - IT & SAP",
        mobile: "9337244943",
        email: "arun.pradhan@jindal.com",
        website: "",
        address: "JINDAL CENTRE, 12 BHIKAJI CAMA PALACE, NEW DELHI, DELHI, 110066",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "PRIMARY METAL INDUSTRIES",
        requirement: "ERP & Technology requirements evaluation for JINDAL STAINLESS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "277",
        leadNumber: "LEAD-2026-669212",
        leadDate: "2026-09-14",
        companyName: "JINDAL STEEL & POWER LIMITED",
        contactPerson: "SUNIL KUMAR AGRAWAL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "7898905139",
        email: "sunil.kumar.agrawal@jindal.com",
        website: "",
        address: "JINDAL CENTRE, 12, BHIKAIJI CAMA PLACE, NEW DELHI, DELHI, 110066",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "PRIMARY METAL INDUSTRIES",
        requirement: "ERP & Technology requirements evaluation for JINDAL STEEL & POWER LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "295",
        leadNumber: "LEAD-2026-538972",
        leadDate: "2026-09-14",
        companyName: "KAJARIA CERAMICS LIMITED",
        contactPerson: "RISHI KAJARIA",
        designation: "MD",
        mobile: "9810007994",
        email: "rishi.kajaria@kajaria.com",
        website: "",
        address: "SF-11, JMD REGENT PLAZA, MEHRAULI GURGAON ROAD, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CERAMICS & TILES",
        requirement: "ERP & Technology requirements evaluation for KAJARIA CERAMICS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "304",
        leadNumber: "LEAD-2026-825225",
        leadDate: "2026-09-14",
        companyName: "KEI INDUSTRIES LIMITED",
        contactPerson: "ANIL GUPTA",
        designation: "MD",
        mobile: "9810004410",
        email: "anil.gupta@kei.com",
        website: "",
        address: "D-90, OKHLA INDUSTRIAL AREA, PHASE -I, NEW DELHI, DELHI, 110020",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CABLES & WIRES",
        requirement: "ERP & Technology requirements evaluation for KEI INDUSTRIES LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "356",
        leadNumber: "LEAD-2026-569996",
        leadDate: "2026-09-14",
        companyName: "MARUTI SUZUKI INDIA LIMITED",
        contactPerson: "ARNAB ROY",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9560111991",
        email: "arnab.roy@maruti.com",
        website: "",
        address: "1, NELSON MANDELA ROAD, VASANT KUNJ, NEW DELHI, DELHI, 110070",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "AUTOMOTIVE MANUFACTURING",
        requirement: "ERP & Technology requirements evaluation for MARUTI SUZUKI INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "360",
        leadNumber: "LEAD-2026-729896",
        leadDate: "2026-09-14",
        companyName: "MAX HEALTHCARE INSTITUTE LIMITED",
        contactPerson: "YOGESH KUMAR SAREEN",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9871327382",
        email: "yogesh.kumar.sareen@max.com",
        website: "",
        address: "CAPITAL CYBERSCAPE, GOLF COURSE EXTENSION ROAD, GURUGRAM, HARYANA, 122011",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "HEALTHCARE SERVICES",
        requirement: "ERP & Technology requirements evaluation for MAX HEALTHCARE INSTITUTE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "392",
        leadNumber: "LEAD-2026-959510",
        leadDate: "2026-09-14",
        companyName: "NESTLE INDIA LIMITED",
        contactPerson: "SURESH NARAYANAN",
        designation: "MD",
        mobile: "9650433633",
        email: "suresh.narayanan@nestle.com",
        website: "",
        address: "100 / 101, WORLD TRADE CENTRE, BARAKHAMBA LANE, NEW DELHI, DELHI, 110001",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD AND BEVERAGES",
        requirement: "ERP & Technology requirements evaluation for NESTLE INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "425",
        leadNumber: "LEAD-2026-163700",
        leadDate: "2026-09-14",
        companyName: "PEPSICO INDIA HOLDINGS PRIVATE LIMITED",
        contactPerson: "RINKESH SATIJA",
        designation: "DIRECTOR",
        mobile: "8334889889",
        email: "rinkesh.satija@pepsico.com",
        website: "",
        address: "TOWER-A, INTELLION EDGE, SOUTHERN PERIPHERY ROAD, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD & BEVERAGES",
        requirement: "ERP & Technology requirements evaluation for PEPSICO INDIA HOLDINGS PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "430",
        leadNumber: "LEAD-2026-745009",
        leadDate: "2026-09-14",
        companyName: "PI INDUSTRIES LIMITED",
        contactPerson: "SUJIT MANDAL",
        designation: "SR GM FINANCE",
        mobile: "9617773329",
        email: "sujit.mandal@pi.com",
        website: "",
        address: "5TH FLOOR, VIPUL SQUARE, SUSHANT LOK 1, GURUGRAM, HARYANA, 122009",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "AGRO CHEMICALS",
        requirement: "ERP & Technology requirements evaluation for PI INDUSTRIES LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "452",
        leadNumber: "LEAD-2026-253702",
        leadDate: "2026-09-14",
        companyName: "RADICO KHAITAN LIMITED",
        contactPerson: "DILIP KUMAR BANTHIYA",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810065541",
        email: "dilip.kumar.banthiya@radico.com",
        website: "",
        address: "PLOT NO. J-I, MOHAN CO-OPERATIVE INDUSTRIAL AREA, NEW DELHI, DELHI, 110044",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD AND BEVERAGES",
        requirement: "ERP & Technology requirements evaluation for RADICO KHAITAN LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "473",
        leadNumber: "LEAD-2026-811035",
        leadDate: "2026-09-14",
        companyName: "RELAXO FOOTWEARS LIMITED",
        contactPerson: "SUSHIL BATRA",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810458568",
        email: "sushil.batra@relaxo.com",
        website: "",
        address: "MANGLAM PLACE, SECTOR-3, ROHINI, NEW DELHI, DELHI, 110085",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOTWEAR MANUFACTURING",
        requirement: "ERP & Technology requirements evaluation for RELAXO FOOTWEARS LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "491",
        leadNumber: "LEAD-2026-585672",
        leadDate: "2026-09-14",
        companyName: "SAMSUNG INDIA ELECTRONICS PRIVATE LIMITED",
        contactPerson: "ABHISHEK MUDGAL",
        designation: "CEO",
        mobile: "9871379501",
        email: "abhishek.mudgal@samsung.com",
        website: "",
        address: "TWO HORIZON CENTRE, GOLF COURSE ROAD, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "ELECTRONICS & APPLIANCES",
        requirement: "ERP & Technology requirements evaluation for SAMSUNG INDIA ELECTRONICS PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "501",
        leadNumber: "LEAD-2026-299367",
        leadDate: "2026-09-14",
        companyName: "SCHNEIDER ELECTRIC INDIA PRIVATE LIMITED",
        contactPerson: "DEEPAK SHARMA",
        designation: "MD",
        mobile: "7428380570",
        email: "deepak.sharma@schneider.com",
        website: "",
        address: "DLF BUILDING NO. 10, DLF CYBER CITY, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "ELECTRICAL EQUIPMENT",
        requirement: "ERP & Technology requirements evaluation for SCHNEIDER ELECTRIC INDIA PRIVATE LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "528",
        leadNumber: "LEAD-2026-985026",
        leadDate: "2026-09-14",
        companyName: "SHRIRAM GENERAL INSURANCE COMPANY LIMITED",
        contactPerson: "ANIL KUMAR AGGARWAL",
        designation: "CEO",
        mobile: "9352599900",
        email: "anil.kumar.aggarwal@shriram.com",
        website: "",
        address: "E-8, EPIP, RIICO INDUSTRIAL AREA, SITAPURA, JAIPUR, RAJASTHAN, 302022",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Jaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "INSURANCE",
        requirement: "ERP & Technology requirements evaluation for SHRIRAM GENERAL INSURANCE COMPANY LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "567",
        leadNumber: "LEAD-2026-138723",
        leadDate: "2026-09-14",
        companyName: "SURYA ROSHNI LIMITED",
        contactPerson: "BHARAT BHUSHAN SINGAL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810123337",
        email: "bharat.bhushan.singal@surya.com",
        website: "",
        address: "PADMA TOWER - 1, RAJENDRA PLACE, NEW DELHI, DELHI, 110008",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "LIGHTING & PIPES",
        requirement: "ERP & Technology requirements evaluation for SURYA ROSHNI LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "576",
        leadNumber: "LEAD-2026-367154",
        leadDate: "2026-09-14",
        companyName: "TATA POWER DELHI DISTRIBUTION LIMITED",
        contactPerson: "SURANJIT MISHRA",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9810147924",
        email: "suranjit.mishra@tata.com",
        website: "",
        address: "NDPL HOUSE, HUDSON LINES, KINGSWAY CAMP, NEW DELHI, DELHI, 110009",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "ENERGY & UTILITIES",
        requirement: "ERP & Technology requirements evaluation for TATA POWER DELHI DISTRIBUTION LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "593",
        leadNumber: "LEAD-2026-793830",
        leadDate: "2026-09-14",
        companyName: "TRANSPORT CORPORATION OF INDIA LIMITED",
        contactPerson: "ASHISH KUMAR TIWARI",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9811633980",
        email: "ashish.kumar.tiwari@transport.com",
        website: "",
        address: "TCI HOUSE, 69 INSTITUTIONAL AREA, SECTOR-32, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "LOGISTICS & SUPPLY CHAIN",
        requirement: "ERP & Technology requirements evaluation for TRANSPORT CORPORATION OF INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "608",
        leadNumber: "LEAD-2026-572002",
        leadDate: "2026-09-14",
        companyName: "VARUN BEVERAGES LIMITED",
        contactPerson: "NARESH TREHAN",
        designation: "DIRECTOR",
        mobile: "9971644444",
        email: "naresh.trehan@varun.com",
        website: "",
        address: "PLOT NO.31, INSTITUTIONAL AREA, SECTOR- 44, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "FOOD & BEVERAGES",
        requirement: "ERP & Technology requirements evaluation for VARUN BEVERAGES LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "609",
        leadNumber: "LEAD-2026-858282",
        leadDate: "2026-09-14",
        companyName: "VE COMMERCIAL VEHICLES LIMITED (EICHER-VOLVO)",
        contactPerson: "KEN BO REINHOLD TROLLE",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9289906727",
        email: "ken.bo.reinhold.trolle@ve.com",
        website: "",
        address: "NO - 96, SECTOR 32, GURUGRAM, HARYANA, 122001",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "COMMERCIAL VEHICLES",
        requirement: "ERP & Technology requirements evaluation for VE COMMERCIAL VEHICLES LIMITED (EICHER-VOLVO)",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "628",
        leadNumber: "LEAD-2026-665811",
        leadDate: "2026-09-14",
        companyName: "WHIRLPOOL OF INDIA LIMITED",
        contactPerson: "ADITYA JAIN",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "8447015777",
        email: "aditya.jain@whirlpool.com",
        website: "",
        address: "WHIRPOOL HOUSE, PLOT NO. 40, SECTOR 44, GURUGRAM, HARYANA, 122002",
        country: "India",
        state: "Haryana",
        stateCode: "06",
        city: "Gurugram",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "HOME APPLIANCES",
        requirement: "ERP & Technology requirements evaluation for WHIRLPOOL OF INDIA LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "629",
        leadNumber: "LEAD-2026-962984",
        leadDate: "2026-09-14",
        companyName: "WONDER CEMENT LIMITED",
        contactPerson: "KIRAN DATTATRAYRAO PATIL",
        designation: "MD",
        mobile: "9977244855",
        email: "kiran.dattatrayrao.patil@wonder.com",
        website: "",
        address: "17, OLD FATEHPURA, UDAIPUR, RAJASTHAN, 313004",
        country: "India",
        state: "Rajasthan",
        stateCode: "08",
        city: "Udaipur",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "CEMENT MANUFACTURING",
        requirement: "ERP & Technology requirements evaluation for WONDER CEMENT LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      },
      {
        id: "636",
        leadNumber: "LEAD-2026-150211",
        leadDate: "2026-09-14",
        companyName: "ZOMATO LIMITED",
        contactPerson: "AKSHANT GOYAL",
        designation: "CHIEF FINANCIAL OFFICER",
        mobile: "9920213572",
        email: "akshant.goyal@zomato.com",
        website: "",
        address: "94 MEGHDOOT, NEHRU PLACE, NEW DELHI, DELHI, 110019",
        country: "India",
        state: "Delhi",
        stateCode: "07",
        city: "New Delhi",
        pincode: "",
        leadSource: "Other",
        leadType: "Outbound",
        industry: "DIGITAL COMMERCE & FOOD TECH",
        requirement: "ERP & Technology requirements evaluation for ZOMATO LIMITED",
        primaryProductId: "prod-d365",
        productInterestIds: [
          "prod-d365"
        ],
        estimatedValue: 0,
        expectedClosingDate: "2027-06-30",
        rating: "Warm",
        score: 50,
        priority: "Medium",
        status: "New",
        isConverted: false,
        remarks: "Source reference: enact360_crm_ master database",
        createdAt: "2026-09-14T05:42:11Z",
        updatedAt: "2026-09-14T05:42:11Z",
        leadOwnerId: "usr-1",
        leadOwnerName: "Shalv Sharma"
      }
    ],
    users: [
      {
        id: "usr-1",
        name: "Shalv Sharma",
        username: "admin",
        email: "admin@coreenact.com",
        phone: "9810998290",
        role: "Super Admin",
        department: "Executive",
        designation: "Managing Director / Super Admin",
        status: "Active",
        location: "New Delhi",
        created_at: "2026-09-01T09:00:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:56.585Z"
      },
      {
        id: "usr-2",
        name: "Tabassum",
        username: "tabassum",
        email: "tabassum@coreenact.com",
        phone: "9810998291",
        role: "Sales Manager",
        department: "Sales",
        designation: "Sales & Support Manager",
        status: "Active",
        location: "New Delhi",
        created_at: "2026-09-01T09:05:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:56.773Z"
      },
      {
        id: "usr-3",
        name: "Rohan Verma",
        username: "rohan",
        email: "rohan.verma@coreenact.com",
        phone: "9810998292",
        role: "Sales Executive",
        department: "Sales",
        designation: "Senior Account Executive",
        status: "Active",
        location: "Mumbai",
        created_at: "2026-09-01T09:10:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:56.959Z"
      },
      {
        id: "usr-4",
        name: "Priya Nair",
        username: "priya",
        email: "priya.nair@coreenact.com",
        phone: "9810998293",
        role: "Finance Manager",
        department: "Finance",
        designation: "Head of Billing & Receivables",
        status: "Active",
        location: "Bengaluru",
        created_at: "2026-09-01T09:15:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:57.147Z"
      },
      {
        id: "usr-5",
        name: "Amit Patel",
        username: "amit",
        email: "amit.patel@coreenact.com",
        phone: "9810998294",
        role: "Finance Executive",
        department: "Finance",
        designation: "Accounts & GST Officer",
        status: "Active",
        location: "Ahmedabad",
        created_at: "2026-09-01T09:20:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:57.337Z"
      },
      {
        id: "usr-6",
        name: "Neha Gupta",
        username: "neha",
        email: "neha.gupta@coreenact.com",
        phone: "9810998295",
        role: "Management/Viewer",
        department: "Executive",
        designation: "VP of Strategy (Read-Only)",
        status: "Active",
        location: "New Delhi",
        created_at: "2026-09-01T09:25:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:57.524Z"
      },
      {
        id: "usr-7",
        name: "Vikram Malhotra",
        username: "vikram",
        email: "vikram.m@coreenact.com",
        phone: "9810998296",
        role: "Administrator",
        department: "Operations",
        designation: "Operations Director",
        status: "Active",
        location: "Pune",
        created_at: "2026-09-01T09:30:00Z",
        accessScope: "all",
        avatar: "",
        customPermissions: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-06T17:06:57.713Z"
      },
      {
        id: "employee-1",
        name: "Employee",
        username: "employee",
        email: "employee@example.com",
        accessScope: "payroll_only",
        accessType: "payroll_only",
        empCode: "EMP-001",
        phone: "",
        role: "Sales Executive",
        department: "Operations",
        designation: "Employee",
        status: "Active",
        location: "Mumbai HQ",
        created_at: "2026-10-11T14:33:49.195Z",
        customPermissions: null,
        avatar: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-11T14:33:51.439Z"
      },
      {
        id: "usr-crm-new",
        name: "Neha Kapoor",
        username: "neha.kapoor",
        email: "neha.kapoor@coreenact.com",
        accessScope: "all",
        accessType: "crm_and_payroll",
        phone: "9811122233",
        role: "Sales Executive",
        department: "Sales",
        designation: "",
        status: "Active",
        avatar: "",
        location: "",
        reportingManager: "",
        assignedTerritory: "",
        custom_permissions: {},
        customPermissions: {},
        created_at: "2026-10-11T14:33:49.979Z",
        lastLoginAt: "2026-10-11T14:33:53.072Z",
        last_login_at: null,
        updated_at: "2026-10-11T14:33:50.255Z"
      },
      {
        id: "emp-pay-901",
        name: "Vikram Malhotra",
        username: "vikram.malhotra",
        email: "vikram.malhotra@coreenact.com",
        accessScope: "payroll_only",
        accessType: "payroll_only",
        empCode: "EMP-099",
        phone: "",
        role: "Support",
        department: "Technical Support & AMC",
        designation: "Support Engineer",
        status: "Active",
        location: "Mumbai HQ",
        created_at: "2026-10-11T14:33:56.411Z",
        lastLoginAt: "2026-10-11T14:34:00.164Z",
        customPermissions: null,
        avatar: null,
        last_login_at: null,
        custom_permissions: null,
        updated_at: "2026-10-11T14:33:58.191Z"
      }
    ],
    milestoneTemplates: []
  },
  company_setup: [
    {
      id: 1,
      name: "Coreenact Solutions",
      legal_name: "Coreenact Solutions",
      gstin: "07FRWPS7255E1Z3",
      pan: "FRWPS7255E",
      city: "New Delhi",
      state: "Delhi",
      state_code: "07",
      logo_url: "",
      bank_name: "Bank of Baroda",
      bank_account_no: "71000200001745",
      bank_ifsc: "BARB0VJOKHL",
      bank_branch: "Okhla Phase-3, New Delhi"
    }
  ],
  outlook_app_config: [
    {
      id: 1,
      display_name: "Enact360",
      client_id: "af71a4c3-ed1d-45cd-9969-62f8ae0b510a",
      object_id: "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
      tenant_id: "d74b8bb7-09a3-4a3c-9ca7-49b9a9dea733",
      supported_account_types: "My organization only",
      redirect_uris: "1 web, 0 spa, 0 public client",
      managed_application: "Enact360",
      state: "Activated",
      smtp_host: "smtp.office365.com",
      smtp_port: 587,
      updated_at: "2026-10-10T07:21:10.792Z"
    }
  ],
  updatedAt: "2026-10-11T14:59:31.318Z"
};

// backend/postgresState.ts
function postgresStateMiddleware(pool2, hooks) {
  let tail = Promise.resolve();
  return (req, res, next) => {
    const previous = tail;
    let unlock;
    tail = new Promise((resolve) => {
      unlock = resolve;
    });
    void (async () => {
      await previous;
      let client, before, dirty = false, completed = false;
      const originalEnd = res.end.bind(res);
      const fail = () => {
        res.statusCode = 503;
        res.removeHeader("Content-Length");
        res.removeHeader("ETag");
        res.removeHeader("Set-Cookie");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        originalEnd(JSON.stringify({ success: false, message: "Saved data storage is unavailable. Check the Vercel DATABASE_URL setting and Render database access. No changes were committed." }));
      };
      const finish = async (args, aborted = false) => {
        if (completed) return;
        completed = true;
        try {
          if (aborted || res.statusCode >= 400) {
            await client.query("ROLLBACK");
            hooks.restore(before);
          } else {
            if (dirty) await client.query("UPDATE crm_state_store SET payload=$1, updated_at=NOW() WHERE id='app'", [JSON.stringify(hooks.capture())]);
            await client.query("COMMIT");
          }
          if (!aborted) originalEnd(...args);
        } catch {
          try {
            await client?.query("ROLLBACK");
          } catch {
          }
          if (before) hooks.restore(before);
          if (!aborted && !res.headersSent) fail();
        } finally {
          hooks.setWriter(null);
          client?.release();
          unlock();
        }
      };
      try {
        client = await pool2.connect();
        await client.query("BEGIN");
        await client.query("SET LOCAL lock_timeout = '15s'");
        await client.query("SET LOCAL statement_timeout = '20s'");
        await client.query("SELECT pg_advisory_xact_lock(360026)");
        await client.query("CREATE TABLE IF NOT EXISTS crm_state_store (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
        await client.query("INSERT INTO crm_state_store (id,payload) VALUES ('app',$1) ON CONFLICT (id) DO NOTHING", [JSON.stringify(hooks.capture())]);
        const loaded = await client.query("SELECT payload FROM crm_state_store WHERE id='app' FOR UPDATE");
        before = loaded.rows[0]?.payload;
        if (typeof before === "string") before = JSON.parse(before);
        if (!before || !Array.isArray(before.users) || typeof before.stateInitialized !== "boolean") throw new Error("Invalid application store");
        hooks.restore(before);
        hooks.setWriter(() => {
          dirty = true;
        });
        res.end = ((...args) => {
          void finish(args);
          return res;
        });
        res.once("close", () => {
          if (!res.writableFinished) void finish([], true);
        });
        next();
      } catch {
        try {
          await client?.query("ROLLBACK");
        } catch {
        }
        if (before) hooks.restore(before);
        hooks.setWriter(null);
        client?.release();
        unlock();
        fail();
      }
    })();
  };
}

// server.ts
import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/shared/integrity.ts
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
var rows = (s, key) => Array.isArray(s[key]) ? s[key] : [];
var DOCUMENTS = {
  leads: { field: "leadNumber", prefix: "LEAD" },
  customers: { field: "customerCode", prefix: "CUS" },
  opportunities: { field: "opportunityNumber", prefix: "OPP" },
  orders: { field: "orderNumber", prefix: "SO" },
  invoices: { field: "invoiceNumber", prefix: "CSINV" },
  payments: { field: "receiptNumber", prefix: "REC" },
  purchaseOrders: { field: "poNumber", prefix: "PO" },
  supportTickets: { field: "ticketNumber", prefix: "TKT" },
  changeRequests: { field: "crNumber", prefix: "CHG" }
};
var sequenceKey = (slice, row) => slice === "invoices" ? `invoices:${row?.invoiceType === "Proforma" ? "Proforma" : "Tax"}` : slice;
var suffix = (value) => Number(String(value || "").match(/(\d+)$/)?.[1] || 0);
function assignDocumentNumbers(before, next, counters) {
  const out = { ...next };
  for (const [slice, config] of Object.entries(DOCUMENTS)) {
    const old = new Set(rows(before, slice).map((r) => String(r.id)));
    for (const row of rows(before, slice)) {
      const key = sequenceKey(slice, row);
      counters[key] = Math.max(counters[key] || 0, suffix(row[config.field]));
    }
    out[slice] = rows(next, slice).map((row) => {
      const key = sequenceKey(slice, row);
      if (old.has(String(row.id))) return row;
      counters[key] = (counters[key] || 0) + 1;
      const prefix = slice === "invoices" && row.invoiceType === "Proforma" ? "CSPI" : config.prefix;
      return { ...row, [config.field]: `${prefix}-${String(counters[key]).padStart(5, "0")}` };
    });
  }
  return out;
}
var RELATIONS = [
  { from: "leads", field: "leadOwnerId", to: "users", label: "leadOwnerName" },
  { from: "leads", field: "convertedCustomerId", to: "customers" },
  { from: "leads", field: "convertedOpportunityId", to: "opportunities", label: "convertedOpportunityNumber" },
  { from: "leads", field: "convertedSalesOrderId", to: "orders" },
  { from: "opportunities", field: "leadId", to: "leads", label: "leadNumber" },
  { from: "opportunities", field: "customerId", to: "customers", label: "customerName" },
  { from: "opportunities", field: "salesOwnerId", to: "users", label: "salesOwnerName" },
  { from: "opportunities", field: "convertedSalesOrderId", to: "orders", label: "convertedSalesOrderNumber" },
  { from: "customers", field: "salesOwnerId", to: "users", label: "salesOwnerName" },
  { from: "customers", field: "paymentTermsId", to: "paymentTerms", label: "paymentTermsName" },
  { from: "contacts", field: "customerId", to: "customers", label: "customerName", required: true },
  { from: "orders", field: "customerId", to: "customers", label: "customerName", required: true },
  { from: "orders", field: "contactId", to: "contacts", label: "contactName" },
  { from: "orders", field: "leadReferenceId", to: "leads", label: "leadReferenceNumber" },
  { from: "orders", field: "opportunityReferenceId", to: "opportunities", label: "opportunityReferenceNumber" },
  { from: "orders", field: "salespersonId", to: "users", label: "salespersonName" },
  { from: "orders", field: "paymentTermsId", to: "paymentTerms", label: "paymentTermsName" },
  { from: "orders", field: "productId", to: "products", nested: "items" },
  { from: "purchaseOrders", field: "productId", to: "products", nested: "items" },
  { from: "milestones", field: "customerId", to: "customers", label: "customerName", required: true },
  { from: "milestones", field: "salesOrderId", to: "orders", label: "salesOrderNumber", required: true },
  { from: "milestones", field: "invoiceId", to: "invoices", label: "invoiceNumber" },
  { from: "milestones", field: "proformaInvoiceId", to: "invoices", label: "proformaInvoiceNumber" },
  ...["invoices", "payments", "amcContracts", "supportTickets", "changeRequests", "ledgerEntries"].map((from) => ({ from, field: "customerId", to: "customers", label: from === "ledgerEntries" ? void 0 : "customerName", required: true })),
  ...["invoices", "payments"].flatMap((from) => [
    { from, field: "salesOrderId", to: "orders", label: "salesOrderNumber" },
    { from, field: "milestoneId", to: "milestones", label: "milestoneCode" }
  ]),
  { from: "payments", field: "invoiceId", to: "invoices", label: "invoiceNumber" },
  { from: "invoices", field: "proformaInvoiceId", to: "invoices", label: "proformaInvoiceNumber" },
  { from: "invoices", field: "convertedToTaxInvoiceId", to: "invoices", label: "convertedToTaxInvoiceNumber" },
  { from: "invoices", field: "amcContractId", to: "amcContracts", label: "amcContractNumber" },
  { from: "invoices", field: "ticketId", to: "supportTickets", label: "ticketNumber" },
  { from: "invoices", field: "changeRequestId", to: "changeRequests", label: "changeRequestNumber" },
  ...["supportTickets", "changeRequests"].map((from) => ({ from, field: "contractId", to: "amcContracts", label: "contractNumber" })),
  { from: "supportTickets", field: "assignedToId", to: "users", label: "assignedToName" },
  { from: "supportTickets", field: "changeRequestId", to: "changeRequests", label: "changeRequestNumber" },
  ...["supportTickets", "amcContracts"].map((from) => ({ from, field: "linkedInvoiceId", to: "invoices", label: "linkedInvoiceNumber" })),
  { from: "amcContracts", field: "accountManagerId", to: "users", label: "accountManagerName" },
  { from: "changeRequests", field: "ticketId", to: "supportTickets", label: "ticketNumber" },
  { from: "changeRequests", field: "taxInvoiceId", to: "invoices", label: "taxInvoiceNumber" },
  { from: "changeRequests", field: "proformaInvoiceId", to: "invoices", label: "proformaInvoiceNumber" },
  { from: "ledgerEntries", field: "invoiceId", to: "invoices" },
  { from: "ledgerEntries", field: "paymentId", to: "payments" },
  { from: "activities", field: "customerId", to: "customers" },
  { from: "activities", field: "leadId", to: "leads" },
  { from: "activities", field: "opportunityId", to: "opportunities" }
];
var targetLabel = (slice, row, field) => {
  if (slice === "users" || slice === "customers" || slice === "paymentTerms") return row.name;
  if (slice === "contacts") return row.name || row.contactName || row.firstName;
  if (slice === "milestones") return row.milestoneCode;
  return row[DOCUMENTS[slice]?.field || field];
};
function auditSnapshot(snapshot) {
  const issues = [];
  const issue = (slice, id, field, message) => issues.push({ key: `${slice}/${id}/${field}/${message}`, slice, id: String(id), field, message });
  for (const [slice, records] of Object.entries(snapshot)) {
    if (!Array.isArray(records)) continue;
    const seen = /* @__PURE__ */ new Set();
    const numbers = /* @__PURE__ */ new Set();
    for (const row of records) {
      if (!row || row.id === void 0 || row.id === "") {
        issue(slice, "?", "id", "Missing record ID");
        continue;
      }
      if (seen.has(String(row.id))) issue(slice, row.id, "id", "Duplicate record ID");
      seen.add(String(row.id));
      const doc = DOCUMENTS[slice];
      if (doc && row[doc.field]) {
        const num = String(row[doc.field]).trim().toUpperCase();
        if (numbers.has(num)) issue(slice, row.id, doc.field, "Duplicate document number");
        numbers.add(num);
      }
      for (const field of ["amount", "quantity", "unitRate", "grandTotal", "monthlyGross", "hoursLogged", "estimatedHours", "hourlyRate", "includedHours", "consumedHours", "percentage", "discountPercent", "tdsDeducted"]) {
        if (row[field] !== void 0 && (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)) issue(slice, row.id, field, "Invalid negative or non-finite value");
      }
      if (row.discountPercent > 100 || row.percentage > 100) issue(slice, row.id, "percentage", "Percentage exceeds 100");
      if (slice === "payments" && (Number(row.amount) <= 0 || Number(row.tdsDeducted || 0) > Number(row.amount))) issue(slice, row.id, "amount", "Invalid payment or TDS amount");
      if (slice === "invoices") {
        try {
          validateInvoiceDocument(row);
        } catch (error) {
          issue(slice, row.id, "items", error.message);
        }
        if (Number(row.paidAmount || 0) > Number(row.grandTotal || 0) + 0.01) issue(slice, row.id, "paidAmount", "Allocated payments exceed invoice total");
      }
      if (slice === "orders" && Array.isArray(row.items)) {
        if (row.items.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0 || !Number.isFinite(i.unitRate) || i.unitRate < 0 || i.discountPercent < 0 || i.discountPercent > 100)) issue(slice, row.id, "items", "Invalid order quantity, rate or discount");
        if (Math.abs(money(row.items.reduce((n, i) => n + Number(i.lineTotal || 0), 0)) - Number(row.grandTotal || 0)) > 0.02) issue(slice, row.id, "grandTotal", "Order total does not match line items");
      }
      if (row.startDate && row.endDate && row.endDate < row.startDate) issue(slice, row.id, "endDate", "End date precedes start date");
      if (row.invoiceDate && row.dueDate && row.dueDate < row.invoiceDate) issue(slice, row.id, "dueDate", "Due date precedes invoice date");
    }
  }
  const indexes = Object.fromEntries(Object.keys(snapshot).map((key) => [key, new Map(rows(snapshot, key).map((r) => [String(r.id), r]))]));
  for (const rel of RELATIONS) for (const row of rows(snapshot, rel.from)) {
    for (const entry of rel.nested ? row[rel.nested] || [] : [row]) {
      const value = entry[rel.field];
      if (!value) {
        if (rel.required) issue(rel.from, row.id, rel.field, "Required connection is missing");
        continue;
      }
      if (!indexes[rel.to]?.has(String(value))) {
        issue(rel.from, row.id, rel.field, `Missing ${rel.to} record ${value}`);
        continue;
      }
      const parent = indexes[rel.to].get(String(value));
      if (row.customerId && parent.customerId && String(row.customerId) !== String(parent.customerId)) issue(rel.from, row.id, rel.field, "Connected records belong to different customers");
      if (row.salesOrderId && parent.salesOrderId && String(row.salesOrderId) !== String(parent.salesOrderId)) issue(rel.from, row.id, rel.field, "Connected records belong to different orders");
    }
  }
  for (const order of rows(snapshot, "orders")) {
    const schedule = rows(snapshot, "milestones").filter((m) => m.salesOrderId === order.id && m.status !== "Cancelled");
    if (schedule.length && (Math.abs(schedule.reduce((n, m) => n + Number(m.percentage), 0) - 100) > 0.01 || Math.abs(schedule.reduce((n, m) => n + Number(m.amount), 0) - Number(order.grandTotal)) > 0.02)) issue("orders", order.id, "milestones", "Milestones do not match 100% of order total");
  }
  for (const slice of ["users", "products", "licenseTypes"]) {
    for (const field of slice === "users" ? ["email", "username"] : ["code"]) {
      const seen = /* @__PURE__ */ new Set();
      for (const row of rows(snapshot, slice)) {
        const value = String(row[field] || "").trim().toLowerCase();
        if (value && seen.has(value)) issue(slice, row.id, field, `Duplicate ${field}`);
        if (value) seen.add(value);
      }
    }
  }
  return issues;
}
function reconcileSnapshot(input, today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const s = JSON.parse(JSON.stringify(input));
  if (Array.isArray(s.users)) s.users = s.users.map((user) => ({ ...user, accessScope: user.accessScope === "PAYROLL_ONLY" || user.accessScope === "payroll_only" || user.accessType === "payroll_only" ? "payroll_only" : "all" }));
  for (const rel of RELATIONS.filter((r) => r.label && !r.nested)) {
    const map = new Map(rows(s, rel.to).map((r) => [String(r.id), r]));
    s[rel.from] = rows(s, rel.from).map((row) => {
      const target = map.get(String(row[rel.field]));
      const label = target && targetLabel(rel.to, target, rel.label);
      return label !== void 0 ? { ...row, [rel.label]: label } : row;
    });
  }
  const customersById = new Map(rows(s, "customers").map((c) => [c.id, c]));
  for (const key of ["amcContracts", "supportTickets", "changeRequests"]) s[key] = rows(s, key).map((row) => {
    const customer = customersById.get(row.customerId);
    return customer ? { ...row, customerCode: customer.customerCode } : row;
  });
  s.opportunities = rows(s, "opportunities").map((o) => ({ ...o, status: o.stage === "Won" ? "Won" : o.stage === "Lost" ? "Lost" : o.stage === "Deferred" ? "Deferred" : "Open", probability: o.stage === "Won" ? 100 : o.stage === "Lost" ? 0 : Math.max(0, Math.min(100, Number(o.probability || 0))) }));
  const invMap = new Map(rows(s, "invoices").map((r) => [r.id, r]));
  const canonical = (id) => {
    const invoice = invMap.get(id);
    if (invoice?.invoiceType === "Proforma" && invoice.convertedToTaxInvoiceId && invMap.has(invoice.convertedToTaxInvoiceId)) return invMap.get(invoice.convertedToTaxInvoiceId);
    return invoice;
  };
  s.payments = rows(s, "payments").map((p) => {
    let invoice = p.invoiceId ? canonical(p.invoiceId) : void 0;
    if (!invoice && !p.invoiceId && p.milestoneId) invoice = rows(s, "invoices").find((i) => i.milestoneId === p.milestoneId && i.invoiceType !== "Proforma" && i.status !== "Cancelled");
    const linked = invoice ? { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, salesOrderId: invoice.salesOrderId || p.salesOrderId, milestoneId: invoice.milestoneId || p.milestoneId } : {};
    return { ...p, ...linked, amount: money(Number(p.amount)), tdsDeducted: money(Number(p.tdsDeducted || 0)), netReceived: money(Number(p.amount) - Number(p.tdsDeducted || 0)) };
  });
  const sumPayments = (filter) => money(rows(s, "payments").filter(filter).reduce((n, p) => n + Number(p.amount || 0), 0));
  s.invoices = rows(s, "invoices").map((i) => {
    const target = canonical(i.id);
    const fromReceipts = sumPayments((p) => p.invoiceId === target?.id);
    const openingPaidAmount = i.openingPaidAmount ?? Math.max(0, money(Number(i.paidAmount || 0) - fromReceipts));
    const paidAmount = money(fromReceipts + Number(openingPaidAmount));
    const balanceAmount = Math.max(0, money(Number(i.grandTotal || 0) - paidAmount));
    const status = ["Cancelled", "Converted", "Draft", "Submitted", "Approved"].includes(i.status) ? i.status : balanceAmount <= 0 && i.grandTotal > 0 ? "Paid" : paidAmount > 0 ? "Partially Paid" : i.dueDate < today ? "Overdue" : "Issued";
    return { ...i, openingPaidAmount, paidAmount, balanceAmount, status };
  });
  s.milestones = rows(s, "milestones").map((m) => {
    const tax = rows(s, "invoices").find((i) => i.milestoneId === m.id && i.invoiceType !== "Proforma" && i.status !== "Cancelled");
    const pi = rows(s, "invoices").find((i) => i.milestoneId === m.id && i.invoiceType === "Proforma" && i.status !== "Cancelled");
    const receiptTotal = sumPayments((p) => p.milestoneId === m.id || p.invoiceId && rows(s, "invoices").some((i) => i.id === p.invoiceId && i.milestoneId === m.id));
    const openingPaidAmount = m.openingPaidAmount ?? Math.max(0, money(Number(m.paidAmount || 0) - receiptTotal));
    const paidAmount = money(receiptTotal + Number(openingPaidAmount));
    const status = m.status === "Cancelled" ? m.status : paidAmount >= m.amount && m.amount > 0 ? "Paid" : paidAmount > 0 ? "Partially Paid" : m.dueDate < today ? "Overdue" : tax || pi ? "Due" : "Upcoming";
    return { ...m, openingPaidAmount, paidAmount, status, invoicedAmount: tax?.grandTotal || 0, invoiceId: tax?.id, invoiceNumber: tax?.invoiceNumber, proformaInvoiceId: pi?.id, proformaInvoiceNumber: pi?.invoiceNumber };
  });
  const receiptTotals = /* @__PURE__ */ new Map();
  const updatedReceipts = /* @__PURE__ */ new Map();
  for (const p of [...rows(s, "payments")].sort((a, b) => String(a.paymentDate).localeCompare(String(b.paymentDate)) || String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)))) {
    const target = p.invoiceId ? rows(s, "invoices").find((i) => i.id === p.invoiceId) : p.milestoneId ? rows(s, "milestones").find((m) => m.id === p.milestoneId) : rows(s, "orders").find((o) => o.id === p.salesOrderId);
    const key = p.invoiceId ? `invoice/${p.invoiceId}` : p.milestoneId ? `milestone/${p.milestoneId}` : `order/${p.salesOrderId}`;
    const paid = money((receiptTotals.get(key) || 0) + p.amount);
    receiptTotals.set(key, paid);
    updatedReceipts.set(p.id, { ...p, remainingBalance: target ? Math.max(0, money(Number(target.grandTotal ?? target.amount ?? 0) - Number(target.openingPaidAmount || 0) - paid)) : 0 });
  }
  s.payments = rows(s, "payments").map((p) => updatedReceipts.get(p.id) || p);
  s.orders = rows(s, "orders").map((o) => {
    const paidAmount = sumPayments((p) => p.salesOrderId === o.id);
    const invoicedAmount = money(rows(s, "invoices").filter((i) => i.salesOrderId === o.id && i.invoiceType !== "Proforma" && i.status !== "Cancelled").reduce((n, i) => n + Number(i.grandTotal), 0));
    return { ...o, paidAmount, invoicedAmount, remainingBalance: Math.max(0, money(o.grandTotal - paidAmount)), paymentStatus: paidAmount >= o.grandTotal && o.grandTotal > 0 ? "Paid" : paidAmount > 0 ? "Partially Paid" : "Unpaid" };
  });
  s.amcContracts = rows(s, "amcContracts").map((c) => {
    const hours = rows(s, "supportTickets").filter((t) => t.contractId === c.id).reduce((n, t) => n + Number(t.hoursLogged || 0), 0);
    const openingConsumedHours = c.openingConsumedHours ?? Math.max(0, Number(c.consumedHours || 0) - hours);
    return { ...c, openingConsumedHours, consumedHours: money(hours + Number(openingConsumedHours)), status: !["Draft", "Cancelled"].includes(c.status) && c.endDate < today ? "Expired" : c.status };
  });
  const existing = rows(s, "ledgerEntries");
  const manual = existing.filter((e) => e.type !== "INVOICE" && e.type !== "PAYMENT" && !String(e.id).startsWith("ledger-opening-payment-"));
  const postings = [...manual];
  for (const i of rows(s, "invoices").filter((i2) => i2.invoiceType !== "Proforma" && !["Cancelled", "Draft", "Submitted"].includes(i2.status))) {
    const prev = existing.find((e) => e.invoiceId === i.id && e.type === "INVOICE");
    postings.push({ ...prev, id: prev?.id || `ledger-invoice-${i.id}`, customerId: i.customerId, date: i.invoiceDate, type: "INVOICE", referenceNumber: i.invoiceNumber, description: prev?.description || `Invoice ${i.invoiceNumber}`, debit: money(i.grandTotal), credit: 0, invoiceId: i.id });
  }
  for (const i of rows(s, "invoices").filter((i2) => i2.invoiceType !== "Proforma" && i2.status !== "Cancelled" && Number(i2.openingPaidAmount) > 0)) {
    postings.push({ id: `ledger-opening-payment-${i.id}`, customerId: i.customerId, date: i.invoiceDate, type: "OPENING_BALANCE", referenceNumber: i.invoiceNumber, description: "Migrated previously recorded collection (receipt detail not available)", debit: 0, credit: money(i.openingPaidAmount), invoiceId: i.id });
  }
  for (const p of rows(s, "payments")) {
    const prev = existing.find((e) => e.paymentId === p.id && e.type === "PAYMENT");
    postings.push({ ...prev, id: prev?.id || `ledger-payment-${p.id}`, customerId: p.customerId, date: p.paymentDate, type: "PAYMENT", referenceNumber: p.receiptNumber, description: prev?.description || `Payment ${p.receiptNumber}`, debit: 0, credit: money(p.amount), paymentId: p.id });
  }
  const balances = /* @__PURE__ */ new Map();
  s.ledgerEntries = postings.sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.type === "INVOICE" ? 0 : 1) - (b.type === "INVOICE" ? 0 : 1) || String(a.id).localeCompare(String(b.id))).map((e) => {
    const balance = money((balances.get(e.customerId) || 0) + Number(e.debit || 0) - Number(e.credit || 0));
    balances.set(e.customerId, balance);
    return { ...e, runningBalance: balance };
  });
  return s;
}
function mergeSnapshots(base, local, remote) {
  const snapshot = { ...remote };
  const conflicts = [];
  for (const key of Object.keys(local)) {
    if (same(base[key], local[key])) continue;
    if (Array.isArray(local[key])) {
      const b = new Map(rows(base, key).map((r2) => [String(r2.id), r2]));
      const l = new Map(rows(local, key).map((r2) => [String(r2.id), r2]));
      const r = new Map(rows(remote, key).map((r2) => [String(r2.id), r2]));
      for (const id of /* @__PURE__ */ new Set([...b.keys(), ...l.keys()])) {
        const before = b.get(id), next = l.get(id), current = r.get(id);
        if (same(before, next)) continue;
        if (!next) {
          if (current && !same(current, before)) conflicts.push(`${key}/${id}: record changed before deletion`);
          else r.delete(id);
        } else if (!before) {
          if (current && !same(current, next)) conflicts.push(`${key}/${id}: conflicting new record`);
          else r.set(id, next);
        } else if (!current) conflicts.push(`${key}/${id}: record was deleted elsewhere`);
        else {
          const merged = { ...current };
          for (const field of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(next)])) {
            if (same(before[field], next[field])) continue;
            if (!same(current[field], before[field]) && !same(current[field], next[field]) && !["updatedAt", "lastLoginAt", "paidAmount", "balanceAmount", "remainingBalance", "runningBalance", "consumedHours", "invoicedAmount", "paymentStatus"].includes(field) && !(field === "status" && ["invoices", "milestones"].includes(key) && ["Paid", "Partially Paid", "Issued", "Overdue", "Due", "Upcoming"].includes(String(next[field])))) conflicts.push(`${key}/${id}/${field}: concurrent change`);
            else if (next[field] === void 0) delete merged[field];
            else merged[field] = next[field];
          }
          r.set(id, merged);
        }
      }
      snapshot[key] = [...r.values()];
    } else if (!same(remote[key], base[key]) && !same(remote[key], local[key])) conflicts.push(`${key}: concurrent change`);
    else snapshot[key] = local[key];
  }
  return { snapshot, conflicts };
}
function validateInvoiceDocument(invoice) {
  if (!invoice.customerId || !invoice.billingAddress?.stateCode) throw new Error("Select a customer with a complete billing address and state code.");
  if (!Array.isArray(invoice.items) || !invoice.items.length) throw new Error("Add at least one invoice item.");
  for (const item of invoice.items) {
    for (const field of ["quantity", "unitRate", "taxableAmount", "gstRate", "cgstAmount", "sgstAmount", "igstAmount", "totalTax", "lineTotal"]) if (!Number.isFinite(item[field]) || item[field] < 0) throw new Error(`Invoice item ${field} must be a valid non-negative number.`);
    if (item.quantity <= 0 || item.gstRate > 100) throw new Error("Invoice quantities must be positive and tax rates cannot exceed 100%.");
    if (Math.abs(money(item.cgstAmount + item.sgstAmount + item.igstAmount) - item.totalTax) > 0.02 || Math.abs(money(item.taxableAmount + item.totalTax) - item.lineTotal) > 0.02) throw new Error("Invoice item tax and total amounts do not match.");
    if (invoice.isInterState ? item.cgstAmount > 0 || item.sgstAmount > 0 : item.igstAmount > 0) throw new Error("Invoice tax split does not match the place of supply.");
  }
  const totals = { subtotalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalTax: 0, grandTotal: 0 };
  for (const item of invoice.items) {
    totals.subtotalTaxable += item.taxableAmount;
    totals.totalCgst += item.cgstAmount;
    totals.totalSgst += item.sgstAmount;
    totals.totalIgst += item.igstAmount;
    totals.totalTax += item.totalTax;
    totals.grandTotal += item.lineTotal;
  }
  for (const [field, total] of Object.entries(totals)) if (!Number.isFinite(invoice[field]) || Math.abs(money(total) - invoice[field]) > 0.02) throw new Error(`Invoice ${field} must match its line items.`);
  if (invoice.dueDate < invoice.invoiceDate) throw new Error("Invoice due date cannot precede its invoice date.");
}

// server.ts
dotenv.config({ quiet: true });
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var AUTH_TOKEN_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}
var initialSeedHashCache = /* @__PURE__ */ new Map();
function hashPassword(rawPassword, useSeedCache = false) {
  const trimmed = String(rawPassword || "").trim();
  if (!trimmed) return "";
  if (isBcryptHash(trimmed)) return trimmed;
  if (useSeedCache && initialSeedHashCache.has(trimmed)) {
    return initialSeedHashCache.get(trimmed);
  }
  const hashed = bcrypt.hashSync(trimmed, 8);
  if (useSeedCache) {
    initialSeedHashCache.set(trimmed, hashed);
  }
  return hashed;
}
function verifyPasswordHash(plainPassword, storedHash) {
  const plain = String(plainPassword || "").trim();
  const hash = String(storedHash || "").trim();
  if (!plain || !hash) return false;
  if (isBcryptHash(hash)) {
    return bcrypt.compareSync(plain, hash);
  }
  return plain === hash;
}
function issueAuthToken(userId) {
  const payload = Buffer.from(JSON.stringify({ id: String(userId), expires: Date.now() + 8 * 60 * 60 * 1e3 }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyAuthToken(token) {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.replace(/^Bearer\s+/i, "").trim();
  const parts = trimmed.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(payload).digest("base64url");
  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.expires > Date.now() && typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}
function sanitizeUserForClient(user) {
  if (!user || typeof user !== "object") return user;
  const clone = { ...user };
  delete clone.password;
  delete clone.tempPassword;
  delete clone.temp_password;
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.mustChangePasswordOnFirstLogin;
  delete clone.mustChangePassword;
  delete clone.forcePasswordReset;
  delete clone.firstLogin;
  return clone;
}
function sanitizePayrollMasterForClient(master) {
  if (!master || typeof master !== "object") return master;
  const clone = { ...master };
  delete clone.password;
  delete clone.tempPassword;
  delete clone.temp_password;
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.mustChangePasswordOnFirstLogin;
  delete clone.mustChangePassword;
  delete clone.forcePasswordReset;
  delete clone.firstLogin;
  return clone;
}
function sanitizePayrollMastersMapForClient(map) {
  if (!map || typeof map !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (v && typeof v === "object") {
      out[k] = sanitizePayrollMasterForClient(v);
    }
  }
  return out;
}
var DEFAULT_SEED_PASSWORD_HASH = hashPassword("password123", true);
var app = express();
var port = parseInt(process.env.PORT || "3000", 10);
app.set("trust proxy", 1);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
var MOCK_TABLES = {
  users: [
    { id: "usr-1", name: "Shalv Sharma", username: "admin", email: "admin@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998290", role: "Super Admin", department: "Executive", designation: "Managing Director / Super Admin", status: "Active", location: "New Delhi", created_at: "2026-09-01T09:00:00Z" },
    { id: "usr-2", name: "Tabassum", username: "tabassum", email: "tabassum@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998291", role: "Sales Manager", department: "Sales", designation: "Sales & Support Manager", status: "Active", location: "New Delhi", created_at: "2026-09-01T09:05:00Z" },
    { id: "usr-3", name: "Rohan Verma", username: "rohan", email: "rohan.verma@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998292", role: "Sales Executive", department: "Sales", designation: "Senior Account Executive", status: "Active", location: "Mumbai", created_at: "2026-09-01T09:10:00Z" },
    { id: "usr-4", name: "Priya Nair", username: "priya", email: "priya.nair@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998293", role: "Finance Manager", department: "Finance", designation: "Head of Billing & Receivables", status: "Active", location: "Bengaluru", created_at: "2026-09-01T09:15:00Z" },
    { id: "usr-5", name: "Amit Patel", username: "amit", email: "amit.patel@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998294", role: "Finance Executive", department: "Finance", designation: "Accounts & GST Officer", status: "Active", location: "Ahmedabad", created_at: "2026-09-01T09:20:00Z" },
    { id: "usr-6", name: "Neha Gupta", username: "neha", email: "neha.gupta@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998295", role: "Management/Viewer", department: "Executive", designation: "VP of Strategy (Read-Only)", status: "Active", location: "New Delhi", created_at: "2026-09-01T09:25:00Z" },
    { id: "usr-7", name: "Vikram Malhotra", username: "vikram", email: "vikram.m@coreenact.com", passwordHash: DEFAULT_SEED_PASSWORD_HASH, phone: "9810998296", role: "Administrator", department: "Operations", designation: "Operations Director", status: "Active", location: "Pune", created_at: "2026-09-01T09:30:00Z" }
  ],
  payroll_masters: [],
  leads: [
    { id: "lead-1", lead_number: "LEAD-2026-00001", company_name: "Taj computer Solutions Pvt Ltd", contact_person: "Sawan Pathak", mobile: "+91 72909 96601", email: "sawankumar@tajcomputersolutions.com", status: "Won", estimated_value: 17e5, created_at: "2026-09-01T10:00:00Z" },
    { id: "lead-2", lead_number: "LEAD-2026-00002", company_name: "incite Gravity Pvt Ltd", contact_person: "Srikant Jena", mobile: "8290090611", email: "srikant@incitegravity.com", status: "Won", estimated_value: 295e3, created_at: "2026-09-05T10:00:00Z" },
    { id: "lead-3", lead_number: "LEAD-2026-00003", company_name: "Build Storys Pvt Ltd", contact_person: "Shruthi", mobile: "97403 82382", email: "shruthi@buildstorys.com", status: "Won", estimated_value: 18e5, created_at: "2026-09-12T10:00:00Z" },
    { id: "lead-4", lead_number: "LEAD-2026-00004", company_name: "Eduvrse Pvt ltd", contact_person: "Eshant Sharma", mobile: "9999100186", email: "eshant.sharma@eduvrse.com", status: "Won", estimated_value: 12e5, created_at: "2026-09-18T10:00:00Z" },
    { id: "lead-5", lead_number: "LEAD-2026-00005", company_name: "DHIMAN IRON AND STEEL INDUSTRIES PVT LTD", contact_person: "Jiten", mobile: "9878681000", email: "jitengoyal@rrgg.in", status: "Won", estimated_value: 165e4, created_at: "2026-09-22T10:00:00Z" }
  ],
  customers: [
    { id: 1, customer_code: "CUST-2026-001", company_name: "Taj computer Solutions Pvt Ltd", contact_name: "Sawan Pathak", email: "sawankumar@tajcomputersolutions.com", phone: "+91 72909 96601", state: "Delhi", gstin: "07AAACT2727Q1ZW", status: "Active" },
    { id: 2, customer_code: "CUST-2026-002", company_name: "incite Gravity Pvt Ltd", contact_name: "Srikant Jena", email: "srikant@incitegravity.com", phone: "8290090611", state: "Haryana", gstin: "06AABCI1234F1Z5", status: "Active" },
    { id: 3, customer_code: "CUST-2026-003", company_name: "Build Storys Pvt Ltd", contact_name: "Shruthi", email: "shruthi@buildstorys.com", phone: "97403 82382", state: "Karnataka", gstin: "29AABCB5678G1Z2", status: "Active" }
  ],
  customer_contacts: [],
  products: [
    { id: "prod-1", code: "D365-BC-ESS", name: "MS D365 Business Central Essential", type: "Service", uom: "License", hsn_sac: "997331", gst_rate: 18, cost_price: 6655, selling_price: 79860 },
    { id: "prod-2", code: "D365-BC-DEV", name: "MS D365 Business Central Device", type: "Service", uom: "License", hsn_sac: "997331", gst_rate: 18, cost_price: 3780, selling_price: 45360 },
    { id: "prod-3", code: "D365-BC-TEAM", name: "MS D365 Business Central Team Member", type: "Service", uom: "License", hsn_sac: "997331", gst_rate: 18, cost_price: 665, selling_price: 7980 },
    { id: "prod-5", code: "SRV-ERP-IMP", name: "Enterprise ERP Implementation Service", type: "Service", uom: "Mandays", hsn_sac: "998313", gst_rate: 18, cost_price: 12e5, selling_price: 15e5 }
  ],
  finance_invoices: [
    { id: 1, invoice_no: "INV/2026-27/001", invoice_type: "Tax Invoice", customer_name: "Taj computer Solutions Pvt Ltd", invoice_date: "2026-09-05", due_date: "2026-10-05", subtotal: 1440678, grand_total: 17e5, amount_paid: 17e5, status: "Paid" },
    { id: 2, invoice_no: "INV/2026-27/002", invoice_type: "Tax Invoice", customer_name: "incite Gravity Pvt Ltd", invoice_date: "2026-09-10", due_date: "2026-10-10", subtotal: 25e4, grand_total: 295e3, amount_paid: 15e4, status: "Partially Paid" }
  ],
  finance_invoice_items: [],
  finance_payments: [
    { id: 1, invoice_id: 1, payment_date: "2026-09-15", amount: 17e5, payment_stage: "Full Payment", payment_mode: "NEFT", reference_no: "UTR9988776655" }
  ],
  sales_orders: [
    { id: 1, order_no: "SO-2026-0001", order_date: "2026-09-02", customer_name: "Taj computer Solutions Pvt Ltd", currency: "INR", status: "Completed", subtotal: 1440678, grand_total: 17e5 }
  ],
  opportunities: [
    { id: 1, opportunity_no: "OPP-2026-0001", customer_id: 1, title: "Taj Computer Solutions - D365 Renewal", stage: "Closed Won", status: "Won", probability: 100, estimated_deal_value: 17e5 }
  ],
  opportunity_payment_milestones: [
    { id: 1, customer_id: 1, milestone_name: "100% Advance on Order", percentage: 100, milestone_amount: 17e5, status: "Paid" }
  ],
  activities: [
    { id: 1, customer_id: 1, type: "Meeting", subject: "Kickoff & License Provisioning", due_at: "2026-09-03", status: "Completed", priority: "High" }
  ],
  company_setup: [
    { id: 1, name: "Coreenact Solutions", legal_name: "Coreenact Solutions", gstin: "07FRWPS7255E1Z3", pan: "FRWPS7255E", city: "New Delhi", state: "Delhi", state_code: "07", logo_url: "", bank_name: "Bank of Baroda", bank_account_no: "71000200001745", bank_ifsc: "BARB0VJOKHL", bank_branch: "Okhla Phase-3, New Delhi" }
  ],
  outlook_app_config: [
    {
      id: 1,
      display_name: process.env.OUTLOOK_APP_DISPLAY_NAME || "Enact360",
      client_id: process.env.OUTLOOK_CLIENT_ID || "af71a4c3-ed1d-45cd-9969-62f8ae0b510a",
      object_id: process.env.OUTLOOK_OBJECT_ID || "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
      tenant_id: process.env.OUTLOOK_TENANT_ID || "d74b8bb7-09a3-4a3c-9ca7-49b9a9dea733",
      supported_account_types: "My organization only",
      redirect_uris: "1 web, 0 spa, 0 public client",
      managed_application: "Enact360",
      state: "Activated",
      smtp_host: process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com",
      smtp_port: Number(process.env.OUTLOOK_SMTP_PORT || 587),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  audit_logs: [],
  email_notifications: [],
  payroll_loans: [],
  payroll_policy: [],
  payroll_org_masters: [],
  payroll_attendance: [],
  payroll_leaves: [],
  payroll_claims: [],
  payroll_statutory: [],
  purchase_orders: [],
  amc_contracts: [],
  support_tickets: [],
  change_requests: [],
  license_types: [],
  customer_ledger: []
};
var PERSISTED_CRM_STATE = {
  stateInitialized: false,
  documentCounters: {},
  payrollMasters: {},
  deletedPayrollMasterIds: [],
  payrollLoans: [],
  deletedLoanIds: [],
  payrollPolicy: null,
  payrollOrgMasters: null,
  payrollAttendance: {},
  payrollLeaves: {},
  payrollClaims: {},
  payrollStatutory: {},
  payrollIntegrationConfig: null,
  crmSlices: {}
};
var getPersistedStorePath = () => process.env.CRM_STORE_PATH ? path.resolve(process.env.CRM_STORE_PATH) : path.resolve(__dirname, ".crm_persisted_store.json");
function resolveRecordPasswordHash(record, existingRecord, fallbackRecord) {
  const explicitPlain = typeof record?.password === "string" && record.password.trim() ? record.password.trim() : typeof record?.tempPassword === "string" && record.tempPassword.trim() ? record.tempPassword.trim() : typeof record?.temp_password === "string" && record.temp_password.trim() ? record.temp_password.trim() : "";
  if (explicitPlain) {
    return hashPassword(explicitPlain);
  }
  const explicitHash = typeof record?.passwordHash === "string" && record.passwordHash.trim() ? record.passwordHash.trim() : typeof record?.password_hash === "string" && record.password_hash.trim() ? record.password_hash.trim() : "";
  if (explicitHash) {
    return hashPassword(explicitHash);
  }
  const prevHash = existingRecord?.passwordHash || existingRecord?.password_hash || existingRecord?.password || existingRecord?.tempPassword || fallbackRecord?.passwordHash || fallbackRecord?.password_hash || fallbackRecord?.password || fallbackRecord?.tempPassword || "";
  if (prevHash) {
    return hashPassword(String(prevHash));
  }
  return DEFAULT_SEED_PASSWORD_HASH;
}
function stripPlaintextAndResetFlags(obj) {
  const clean = { ...obj };
  delete clean.password;
  delete clean.tempPassword;
  delete clean.temp_password;
  delete clean.password_hash;
  delete clean.mustChangePasswordOnFirstLogin;
  delete clean.mustChangePassword;
  delete clean.forcePasswordReset;
  delete clean.firstLogin;
  return clean;
}
function relinkUsersAndPayrollMasters() {
  const usersById = /* @__PURE__ */ new Map();
  const idByEmail = /* @__PURE__ */ new Map();
  const idByUsername = /* @__PURE__ */ new Map();
  const sliceUsers = Array.isArray(PERSISTED_CRM_STATE.crmSlices?.users) ? PERSISTED_CRM_STATE.crmSlices.users : [];
  const allCandidateUsers = [...MOCK_TABLES.users || [], ...sliceUsers];
  for (const u of allCandidateUsers) {
    if (!u || !u.id) continue;
    const rawId = String(u.id);
    const emailLower = u.email ? String(u.email).trim().toLowerCase() : "";
    const usernameLower = u.username ? String(u.username).trim().toLowerCase() : "";
    const canonicalId = usersById.has(rawId) ? rawId : emailLower && idByEmail.get(emailLower) || usernameLower && idByUsername.get(usernameLower) || rawId;
    const prev = usersById.get(canonicalId);
    const resolvedHash = resolveRecordPasswordHash(u, prev);
    const merged = stripPlaintextAndResetFlags(
      prev ? {
        ...prev,
        ...u,
        id: canonicalId,
        username: u.username || prev.username || (emailLower ? emailLower.split("@")[0] : "user"),
        passwordHash: resolvedHash,
        customPermissions: u.customPermissions || u.custom_permissions || prev.customPermissions || prev.custom_permissions
      } : {
        ...u,
        id: canonicalId,
        username: u.username || (emailLower ? emailLower.split("@")[0] : "user"),
        passwordHash: resolvedHash,
        customPermissions: u.customPermissions || u.custom_permissions
      }
    );
    usersById.set(canonicalId, merged);
    if (emailLower) {
      idByEmail.set(emailLower, canonicalId);
    }
    if (merged.username) {
      idByUsername.set(String(merged.username).trim().toLowerCase(), canonicalId);
    }
  }
  MOCK_TABLES.users = Array.from(usersById.values());
  const rawMastersObj = PERSISTED_CRM_STATE.payrollMasters || {};
  const relinkedMasters = {};
  for (const m of Object.values(rawMastersObj)) {
    if (!m || !m.userId) continue;
    const mId = String(m.userId);
    const mEmail = m.email ? String(m.email).trim().toLowerCase() : "";
    const mUsername = m.username ? String(m.username).trim().toLowerCase() : "";
    const matchedUser = (MOCK_TABLES.users || []).find((u) => u && String(u.id) === mId) || (mEmail ? (MOCK_TABLES.users || []).find(
      (u) => u && u.email && String(u.email).trim().toLowerCase() === mEmail
    ) : void 0) || (mUsername ? (MOCK_TABLES.users || []).find(
      (u) => u && u.username && String(u.username).trim().toLowerCase() === mUsername
    ) : void 0);
    const targetId = matchedUser ? String(matchedUser.id) : mId;
    const resolvedHash = resolveRecordPasswordHash(m, relinkedMasters[targetId], matchedUser);
    const effectiveStatus = m.status || m.employmentStatus || matchedUser?.status || "Active";
    relinkedMasters[targetId] = stripPlaintextAndResetFlags({
      ...relinkedMasters[targetId],
      ...m,
      userId: targetId,
      status: effectiveStatus,
      passwordHash: resolvedHash
    });
    if (matchedUser) {
      const uIdx = (MOCK_TABLES.users || []).findIndex((u) => u && String(u.id) === targetId);
      if (uIdx >= 0) {
        const currU = MOCK_TABLES.users[uIdx];
        const syncedHash = resolveRecordPasswordHash(m, currU, relinkedMasters[targetId]);
        MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
          ...currU,
          passwordHash: syncedHash,
          empCode: m.empCode || currU?.empCode,
          status: m.status || currU?.status || "Active"
        });
        relinkedMasters[targetId].passwordHash = syncedHash;
      }
    } else if (effectiveStatus !== "Inactive") {
      MOCK_TABLES.users.push(
        stripPlaintextAndResetFlags({
          id: targetId,
          name: m.name || "Employee",
          username: m.username || (m.email ? String(m.email).split("@")[0] : m.empCode || "employee"),
          email: m.email || "",
          passwordHash: resolvedHash,
          accessScope: m.accessType === "payroll_only" ? "payroll_only" : "all",
          accessType: m.accessType || "payroll_only",
          empCode: m.empCode,
          phone: m.phone || "",
          role: m.role || "Sales Executive",
          department: m.department || "Operations",
          designation: m.designation || m.role || "Employee",
          status: effectiveStatus,
          location: m.location || "Mumbai HQ",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        })
      );
    }
  }
  PERSISTED_CRM_STATE.payrollMasters = relinkedMasters;
  MOCK_TABLES.payroll_masters = Object.values(relinkedMasters);
  if (PERSISTED_CRM_STATE.crmSlices && typeof PERSISTED_CRM_STATE.crmSlices === "object") {
    PERSISTED_CRM_STATE.crmSlices.users = MOCK_TABLES.users.map(sanitizeUserForClient);
  }
}
function syncMockTablesFromState() {
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === "object") {
    MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters).filter(Boolean);
  }
  if (Array.isArray(PERSISTED_CRM_STATE.payrollLoans)) {
    MOCK_TABLES.payroll_loans = PERSISTED_CRM_STATE.payrollLoans;
  }
  if (PERSISTED_CRM_STATE.payrollPolicy) {
    MOCK_TABLES.payroll_policy = [PERSISTED_CRM_STATE.payrollPolicy];
  }
  if (PERSISTED_CRM_STATE.payrollOrgMasters) {
    MOCK_TABLES.payroll_org_masters = [PERSISTED_CRM_STATE.payrollOrgMasters];
  }
  if (PERSISTED_CRM_STATE.payrollAttendance && typeof PERSISTED_CRM_STATE.payrollAttendance === "object") {
    MOCK_TABLES.payroll_attendance = Object.entries(PERSISTED_CRM_STATE.payrollAttendance).map(
      ([empId, att]) => ({ employee_id: empId, ...att || {} })
    );
  }
  if (PERSISTED_CRM_STATE.payrollLeaves && typeof PERSISTED_CRM_STATE.payrollLeaves === "object") {
    const allLeaves = [];
    for (const [empId, list] of Object.entries(PERSISTED_CRM_STATE.payrollLeaves)) {
      if (Array.isArray(list)) {
        for (const item of list) {
          allLeaves.push({ employee_id: empId, ...item });
        }
      }
    }
    MOCK_TABLES.payroll_leaves = allLeaves;
  }
  if (PERSISTED_CRM_STATE.payrollClaims && typeof PERSISTED_CRM_STATE.payrollClaims === "object") {
    const allClaims = [];
    for (const [empId, list] of Object.entries(PERSISTED_CRM_STATE.payrollClaims)) {
      if (Array.isArray(list)) {
        for (const item of list) {
          allClaims.push({ employee_id: empId, ...item });
        }
      }
    }
    MOCK_TABLES.payroll_claims = allClaims;
  }
  if (PERSISTED_CRM_STATE.payrollStatutory && typeof PERSISTED_CRM_STATE.payrollStatutory === "object") {
    MOCK_TABLES.payroll_statutory = Object.entries(PERSISTED_CRM_STATE.payrollStatutory).map(
      ([empId, stat]) => ({ employee_id: empId, ...stat || {} })
    );
  }
  const slices = PERSISTED_CRM_STATE.crmSlices || {};
  if (Array.isArray(slices.leads)) {
    MOCK_TABLES.leads = slices.leads.map((l) => ({
      id: l.id,
      lead_number: l.leadNumber || l.lead_number || l.id,
      company_name: l.companyName || l.company_name || "",
      contact_person: l.contactPerson || l.contact_person || "",
      mobile: l.mobile || l.phone || "",
      email: l.email || "",
      status: l.status || "New",
      estimated_value: l.estimatedValue ?? l.estimated_value ?? 0,
      created_at: l.createdAt || l.leadDate || l.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      ...l
    }));
  }
  if (Array.isArray(slices.customers)) {
    MOCK_TABLES.customers = slices.customers.map((c) => ({
      id: c.id,
      customer_code: c.customerCode || c.customer_code || c.id,
      company_name: c.name || c.companyName || c.company_name || "",
      contact_name: c.contactPerson || c.contact_name || "",
      email: c.email || "",
      phone: c.phone || c.mobile || "",
      state: c.state || "",
      gstin: c.gstin || "",
      status: c.status || "Active",
      ...c
    }));
  }
  if (Array.isArray(slices.contacts)) {
    MOCK_TABLES.customer_contacts = slices.contacts;
  }
  if (Array.isArray(slices.products)) {
    MOCK_TABLES.products = slices.products.map((p) => ({
      id: p.id,
      code: p.code || p.sku || p.id,
      name: p.name || "",
      type: p.type || p.category || "Service",
      uom: p.uom || p.unit || "License",
      hsn_sac: p.hsnSac || p.hsn_sac || "",
      gst_rate: p.gstRate ?? p.taxRate ?? p.gst_rate ?? 18,
      cost_price: p.costPrice ?? p.cost_price ?? 0,
      selling_price: p.sellingPrice ?? p.price ?? p.selling_price ?? 0,
      ...p
    }));
  }
  if (Array.isArray(slices.invoices)) {
    MOCK_TABLES.finance_invoices = slices.invoices.map((inv) => ({
      id: inv.id,
      invoice_no: inv.invoiceNumber || inv.invoice_no || inv.id,
      invoice_type: inv.type || inv.invoice_type || "Tax Invoice",
      customer_name: inv.customerName || inv.customer_name || "",
      invoice_date: inv.date || inv.invoiceDate || inv.invoice_date || "",
      due_date: inv.dueDate || inv.due_date || "",
      subtotal: inv.subtotal ?? 0,
      grand_total: inv.totalAmount ?? inv.grandTotal ?? inv.grand_total ?? 0,
      amount_paid: inv.paidAmount ?? inv.amount_paid ?? 0,
      status: inv.status || "Draft",
      ...inv
    }));
  }
  if (Array.isArray(slices.payments)) {
    MOCK_TABLES.finance_payments = slices.payments.map((pay) => ({
      id: pay.id,
      invoice_id: pay.invoiceId || pay.invoice_id || "",
      payment_date: pay.date || pay.paymentDate || pay.payment_date || "",
      amount: pay.amount ?? 0,
      payment_stage: pay.stage || pay.payment_stage || "Payment",
      payment_mode: pay.mode || pay.paymentMode || pay.payment_mode || "NEFT",
      reference_no: pay.referenceNumber || pay.reference_no || "",
      ...pay
    }));
  }
  if (Array.isArray(slices.orders)) {
    MOCK_TABLES.sales_orders = slices.orders.map((ord) => ({
      id: ord.id,
      order_no: ord.orderNumber || ord.order_no || ord.id,
      order_date: ord.date || ord.orderDate || ord.order_date || "",
      customer_name: ord.customerName || ord.customer_name || "",
      currency: ord.currency || "INR",
      status: ord.status || "Confirmed",
      subtotal: ord.subtotal ?? 0,
      grand_total: ord.totalAmount ?? ord.grand_total ?? 0,
      ...ord
    }));
  }
  if (Array.isArray(slices.opportunities)) {
    MOCK_TABLES.opportunities = slices.opportunities.map((opp) => ({
      id: opp.id,
      opportunity_no: opp.opportunityNumber || opp.opportunity_no || opp.id,
      customer_id: opp.customerId || opp.customer_id || "",
      title: opp.title || opp.companyName || "",
      stage: opp.stage || "Qualification",
      status: opp.status || "Open",
      probability: opp.probability ?? 50,
      estimated_deal_value: opp.value ?? opp.estimatedValue ?? opp.estimated_deal_value ?? 0,
      ...opp
    }));
  }
  if (Array.isArray(slices.milestones)) {
    MOCK_TABLES.opportunity_payment_milestones = slices.milestones;
  }
  if (Array.isArray(slices.activities)) {
    MOCK_TABLES.activities = slices.activities;
  }
  if (Array.isArray(slices.purchaseOrders)) {
    MOCK_TABLES.purchase_orders = slices.purchaseOrders;
  }
  if (Array.isArray(slices.amcContracts)) {
    MOCK_TABLES.amc_contracts = slices.amcContracts;
  }
  if (Array.isArray(slices.supportTickets)) {
    MOCK_TABLES.support_tickets = slices.supportTickets;
  }
  if (Array.isArray(slices.changeRequests)) {
    MOCK_TABLES.change_requests = slices.changeRequests;
  }
  if (Array.isArray(slices.licenseTypes)) {
    MOCK_TABLES.license_types = slices.licenseTypes;
  }
  if (Array.isArray(slices.ledgerEntries)) {
    MOCK_TABLES.customer_ledger = slices.ledgerEntries;
  }
  if (Array.isArray(slices.auditLogs)) {
    MOCK_TABLES.audit_logs = slices.auditLogs;
  }
}
function applyParsedStore(parsed) {
  if (!parsed || typeof parsed !== "object") return;
  {
    if (typeof parsed?.stateInitialized === "boolean") {
      PERSISTED_CRM_STATE.stateInitialized = parsed.stateInitialized;
    }
    if (parsed?.documentCounters && typeof parsed.documentCounters === "object") {
      PERSISTED_CRM_STATE.documentCounters = parsed.documentCounters;
    }
    if (Array.isArray(parsed?.users) && parsed.users.length > 0) {
      const merged = /* @__PURE__ */ new Map();
      for (const u of MOCK_TABLES.users) {
        if (u && u.id) merged.set(String(u.id), u);
      }
      for (const u of parsed.users) {
        if (u && u.id) merged.set(String(u.id), { ...merged.get(String(u.id)), ...u });
      }
      MOCK_TABLES.users = Array.from(merged.values());
    }
    if (Array.isArray(parsed?.payroll_masters)) {
      MOCK_TABLES.payroll_masters = parsed.payroll_masters;
      for (const m of parsed.payroll_masters) {
        if (m && m.userId) {
          PERSISTED_CRM_STATE.payrollMasters[m.userId] = m;
        }
      }
    }
    if (parsed?.payrollMasters && typeof parsed.payrollMasters === "object") {
      PERSISTED_CRM_STATE.payrollMasters = {
        ...PERSISTED_CRM_STATE.payrollMasters,
        ...parsed.payrollMasters
      };
    }
    if (Array.isArray(parsed?.deletedPayrollMasterIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = parsed.deletedPayrollMasterIds;
      for (const id of parsed.deletedPayrollMasterIds) {
        delete PERSISTED_CRM_STATE.payrollMasters[id];
      }
    }
    if (Array.isArray(parsed?.deletedLoanIds)) {
      PERSISTED_CRM_STATE.deletedLoanIds = parsed.deletedLoanIds;
    }
    if (Array.isArray(parsed?.payrollLoans)) {
      const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
      PERSISTED_CRM_STATE.payrollLoans = parsed.payrollLoans.filter(
        (l) => l && l.id && !delSet.has(l.id)
      );
    }
    if (parsed?.payrollPolicy) {
      PERSISTED_CRM_STATE.payrollPolicy = parsed.payrollPolicy;
    }
    if (parsed?.payrollOrgMasters) {
      PERSISTED_CRM_STATE.payrollOrgMasters = parsed.payrollOrgMasters;
    }
    if (parsed?.payrollAttendance && typeof parsed.payrollAttendance === "object") {
      PERSISTED_CRM_STATE.payrollAttendance = parsed.payrollAttendance;
    }
    if (parsed?.payrollLeaves && typeof parsed.payrollLeaves === "object") {
      PERSISTED_CRM_STATE.payrollLeaves = parsed.payrollLeaves;
    }
    if (parsed?.payrollClaims && typeof parsed.payrollClaims === "object") {
      PERSISTED_CRM_STATE.payrollClaims = parsed.payrollClaims;
    }
    if (parsed?.payrollStatutory && typeof parsed.payrollStatutory === "object") {
      PERSISTED_CRM_STATE.payrollStatutory = parsed.payrollStatutory;
    }
    if (parsed?.payrollIntegrationConfig) {
      PERSISTED_CRM_STATE.payrollIntegrationConfig = parsed.payrollIntegrationConfig;
    }
    if (parsed?.crmSlices && typeof parsed.crmSlices === "object") {
      PERSISTED_CRM_STATE.crmSlices = parsed.crmSlices;
    }
    if (Array.isArray(parsed?.company_setup) && parsed.company_setup.length > 0) {
      MOCK_TABLES.company_setup = parsed.company_setup;
    }
    if (Array.isArray(parsed?.outlook_app_config) && parsed.outlook_app_config.length > 0) {
      MOCK_TABLES.outlook_app_config = parsed.outlook_app_config;
    }
    relinkUsersAndPayrollMasters();
    syncMockTablesFromState();
  }
}
function loadPersistedStore() {
  try {
    const storePath = getPersistedStorePath();
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, "utf-8");
      applyParsedStore(JSON.parse(raw));
    }
  } catch {
  }
}
function savePersistedStore() {
  transactionWriter?.();
  if (!isTestMode()) return;
  try {
    relinkUsersAndPayrollMasters();
    syncMockTablesFromState();
    const storePath = getPersistedStorePath();
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        {
          stateInitialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
          documentCounters: PERSISTED_CRM_STATE.documentCounters || {},
          users: MOCK_TABLES.users,
          payroll_masters: MOCK_TABLES.payroll_masters,
          payrollMasters: PERSISTED_CRM_STATE.payrollMasters,
          deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
          payrollLoans: PERSISTED_CRM_STATE.payrollLoans,
          deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
          payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy,
          payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters,
          payrollAttendance: PERSISTED_CRM_STATE.payrollAttendance,
          payrollLeaves: PERSISTED_CRM_STATE.payrollLeaves,
          payrollClaims: PERSISTED_CRM_STATE.payrollClaims,
          payrollStatutory: PERSISTED_CRM_STATE.payrollStatutory,
          payrollIntegrationConfig: PERSISTED_CRM_STATE.payrollIntegrationConfig,
          crmSlices: PERSISTED_CRM_STATE.crmSlices,
          company_setup: MOCK_TABLES.company_setup,
          outlook_app_config: MOCK_TABLES.outlook_app_config,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch {
  }
}
if (isTestMode()) loadPersistedStore();
else applyParsedStore(initial_store_default);
function runMockQuery(sql, _params = []) {
  const normalized = sql.trim().replace(/\s+/g, " ");
  const upper = normalized.toUpperCase();
  if (upper.includes("SELECT NOW()")) {
    return {
      rows: [{ current_time: (/* @__PURE__ */ new Date()).toISOString(), db: "postgresqlcrm_go7i", usr: "postgresqlcrm_go7i_user" }],
      rowCount: 1,
      fields: [{ name: "current_time", dataTypeID: 1184 }, { name: "db", dataTypeID: 25 }, { name: "usr", dataTypeID: 25 }]
    };
  }
  if (upper.includes("INFORMATION_SCHEMA.TABLES")) {
    const rows2 = Object.keys(MOCK_TABLES).sort().map((table_name) => ({ table_name }));
    return { rows: rows2, rowCount: rows2.length, fields: [{ name: "table_name", dataTypeID: 25 }] };
  }
  const countMatch = normalized.match(/SELECT\s+COUNT\(\*\)\s+as\s+cnt\s+FROM\s+"?([a-zA-Z0-9_]+)"?/i);
  if (countMatch) {
    const tbl = countMatch[1].toLowerCase();
    const cnt = MOCK_TABLES[tbl]?.length ?? 0;
    return { rows: [{ cnt: String(cnt) }], rowCount: 1, fields: [{ name: "cnt", dataTypeID: 20 }] };
  }
  const selectMatch = normalized.match(/SELECT\s+\*\s+FROM\s+"?([a-zA-Z0-9_]+)"?/i);
  if (selectMatch) {
    const tbl = selectMatch[1].toLowerCase();
    const rawRows = MOCK_TABLES[tbl] ? [...MOCK_TABLES[tbl]] : [];
    const rows2 = tbl === "users" ? rawRows.map((r) => sanitizeUserForClient(r)) : tbl === "payroll_masters" ? rawRows.map((r) => sanitizePayrollMasterForClient(r)) : rawRows;
    const fields = rows2.length > 0 ? Object.keys(rows2[0]).map((name) => ({ name, dataTypeID: 25 })) : [];
    return { rows: rows2, rowCount: rows2.length, fields };
  }
  return { rows: [], rowCount: 0, fields: [] };
}
function isTestMode() {
  return process.env.CRM_TEST_MODE === "true";
}
var getEffectiveDatabaseUrl = () => (process.env.DATABASE_URL || "").trim();
var livePool = getEffectiveDatabaseUrl() ? new Pool({
  connectionString: getEffectiveDatabaseUrl(),
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 1e4,
  connectionTimeoutMillis: 8e3
}) : null;
livePool?.on("error", () => console.error("PostgreSQL connection unavailable"));
var db = {
  query: async (sql, params = []) => runMockQuery(sql, params),
  connect: async () => ({ query: async (sql, params = []) => runMockQuery(sql, params), release() {
  } })
};
var transactionWriter = null;
var isDatabaseActive = () => Boolean(getEffectiveDatabaseUrl());
function buildPersistedStoreObject() {
  relinkUsersAndPayrollMasters();
  syncMockTablesFromState();
  return {
    stateInitialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
    documentCounters: PERSISTED_CRM_STATE.documentCounters || {},
    users: MOCK_TABLES.users,
    payroll_masters: MOCK_TABLES.payroll_masters,
    payrollMasters: PERSISTED_CRM_STATE.payrollMasters,
    deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
    payrollLoans: PERSISTED_CRM_STATE.payrollLoans,
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
    payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy,
    payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters,
    payrollAttendance: PERSISTED_CRM_STATE.payrollAttendance,
    payrollLeaves: PERSISTED_CRM_STATE.payrollLeaves,
    payrollClaims: PERSISTED_CRM_STATE.payrollClaims,
    payrollStatutory: PERSISTED_CRM_STATE.payrollStatutory,
    payrollIntegrationConfig: PERSISTED_CRM_STATE.payrollIntegrationConfig,
    crmSlices: PERSISTED_CRM_STATE.crmSlices,
    company_setup: MOCK_TABLES.company_setup,
    outlook_app_config: MOCK_TABLES.outlook_app_config,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function flushStateToDatabase() {
  transactionWriter?.();
}
async function hydrateStoreFromDatabase() {
  return true;
}
app.use("/api", (req, res, next) => {
  if (isTestMode()) return next();
  if (!livePool || !process.env.AUTH_SECRET) return res.status(503).json({ success: false, message: "Configure DATABASE_URL and AUTH_SECRET on the server." });
  return durableMiddleware(req, res, next);
});
var durableMiddleware = livePool ? postgresStateMiddleware(livePool, {
  capture: buildPersistedStoreObject,
  restore: (value) => {
    for (const key of Object.keys(PERSISTED_CRM_STATE)) delete PERSISTED_CRM_STATE[key];
    Object.assign(PERSISTED_CRM_STATE, {
      payrollMasters: {},
      deletedPayrollMasterIds: [],
      deletedLoanIds: [],
      payrollLoans: [],
      crmSlices: {},
      ...value
    });
    MOCK_TABLES.users = value.users || [];
    applyParsedStore(value);
  },
  setWriter: (writer) => {
    transactionWriter = writer;
  }
}) : null;
var pool = db;
var server_default = app;
async function query(sql, params = []) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const duration = Date.now() - start;
  return { ...res, duration };
}
function sessionToken(req) {
  return req.headers?.authorization || req.headers?.cookie?.split(";").map((x) => x.trim()).find((x) => x.startsWith("crm_session="))?.slice(12);
}
app.use("/api", (req, res, next) => {
  if (isTestMode() || ["/health", "/auth/login", "/auth/verify", "/auth/logout"].includes(req.path)) return next();
  const id = verifyAuthToken(sessionToken(req));
  const account = MOCK_TABLES.users.find((u) => String(u.id) === id);
  if (!account || String(account.status).toLowerCase() === "inactive") return res.status(401).json({ success: false, message: "Please sign in again." });
  req.account = account;
  const admin = ["Super Admin", "Administrator"].includes(account.role);
  if ((req.path.startsWith("/database") || (req.path.startsWith("/users") || req.path === "/notifications/email-config" || req.path.startsWith("/payroll/masters")) && req.method !== "GET") && !admin) return res.status(403).json({ success: false, message: "Administrator permission required." });
  if (req.method !== "GET" && req.headers.origin && new URL(req.headers.origin).host !== req.get("host")) return res.status(403).json({ success: false, message: "Request origin is not allowed." });
  next();
});
app.get("/api/auth/session", (req, res) => res.json({ success: true, user: sanitizeUserForClient(req.account) }));
app.get("/api/database/export", (_req, res) => {
  res.type("application/json").attachment("enact360-data.json").send(JSON.stringify(getCurrentSnapshot(), null, 2));
});
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("crm_session", { path: "/" });
  res.json({ success: true });
});
app.get("/api/health", async (_req, res) => {
  try {
    const start = Date.now();
    const dbRes = await livePool.query("SELECT NOW() as current_time, current_database() as db, current_user as usr;");
    const latency = Date.now() - start;
    const tablesRes = await livePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    res.json({
      status: "healthy",
      database: "connected",
      target: "Render PostgreSQL",
      host: "dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com",
      databaseName: dbRes.rows[0]?.db || "postgresqlcrm_go7i",
      databaseUser: dbRes.rows[0]?.usr || "postgresqlcrm_go7i_user",
      serverTime: dbRes.rows[0]?.current_time,
      latencyMs: latency,
      tableCount: tablesRes.rows.length,
      tables: tablesRes.rows.map((r) => r.table_name)
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: err.message || "Failed to connect to database"
    });
  }
});
app.get("/api/database/status", async (_req, res) => {
  try {
    const tablesRes = await livePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tableStats = await Promise.all(
      tablesRes.rows.map(async (row) => {
        try {
          const countRes = await livePool.query(`SELECT COUNT(*) as cnt FROM "${row.table_name}"`);
          return {
            tableName: row.table_name,
            rowCount: parseInt(countRes.rows[0]?.cnt || "0", 10)
          };
        } catch {
          return { tableName: row.table_name, rowCount: 0 };
        }
      })
    );
    res.json({
      connected: true,
      database: "postgresqlcrm_go7i",
      host: "dpg-db2iikpsrm7s73bhre6g-a.oregon-postgres.render.com",
      tables: tableStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/database/query", async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== "string") {
    return res.status(400).json({ error: "SQL string is required" });
  }
  const stripped = sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
  const statements = stripped.split(";").map((s) => s.trim()).filter(Boolean);
  if (statements.length !== 1) {
    return res.status(400).json({
      success: false,
      error: "Only a single read-only SQL statement is allowed."
    });
  }
  const singleStmt = statements[0];
  if (!/^(SELECT|WITH|SHOW|EXPLAIN)\b/i.test(singleStmt) || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|COPY)\b/i.test(singleStmt)) {
    return res.status(400).json({
      success: false,
      error: "SQL mutations are not allowed; use application APIs so relationship integrity is enforced."
    });
  }
  try {
    if (!/^SELECT\s+\*\s+FROM\s+"?[a-z_]+"?\s*;?$/i.test(sql.trim()) && !/^SELECT\s+COUNT\(\*\)\s+as\s+cnt\s+FROM\s+"?[a-z_]+"?\s*;?$/i.test(sql.trim())) {
      return res.status(400).json({ success: false, error: "Explorer supports SELECT * FROM table and SELECT COUNT(*) as cnt FROM table for application projections. Use psql for other database queries." });
    }
    const result = await query(sql);
    res.json({
      success: true,
      rowCount: result.rowCount,
      durationMs: result.duration,
      fields: result.fields?.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
      rows: result.rows
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});
function getCurrentSnapshot() {
  relinkUsersAndPayrollMasters();
  const slices = PERSISTED_CRM_STATE.crmSlices || {};
  return {
    customers: Array.isArray(slices.customers) ? slices.customers : [],
    contacts: Array.isArray(slices.contacts) ? slices.contacts : [],
    leads: Array.isArray(slices.leads) ? slices.leads : [],
    opportunities: Array.isArray(slices.opportunities) ? slices.opportunities : [],
    orders: Array.isArray(slices.orders) ? slices.orders : [],
    milestones: Array.isArray(slices.milestones) ? slices.milestones : [],
    invoices: Array.isArray(slices.invoices) ? slices.invoices : [],
    payments: Array.isArray(slices.payments) ? slices.payments : [],
    purchaseOrders: Array.isArray(slices.purchaseOrders) ? slices.purchaseOrders : [],
    products: Array.isArray(slices.products) ? slices.products : [],
    taxRates: Array.isArray(slices.taxRates) ? slices.taxRates : [],
    states: Array.isArray(slices.states) ? slices.states : [],
    paymentTerms: Array.isArray(slices.paymentTerms) ? slices.paymentTerms : [],
    milestoneTemplates: Array.isArray(slices.milestoneTemplates) ? slices.milestoneTemplates : [],
    activities: Array.isArray(slices.activities) ? slices.activities : [],
    auditLogs: Array.isArray(slices.auditLogs) ? slices.auditLogs : [],
    notifications: Array.isArray(slices.notifications) ? slices.notifications : [],
    supportTickets: Array.isArray(slices.supportTickets) ? slices.supportTickets : [],
    amcContracts: Array.isArray(slices.amcContracts) ? slices.amcContracts : [],
    changeRequests: Array.isArray(slices.changeRequests) ? slices.changeRequests : [],
    licenseTypes: Array.isArray(slices.licenseTypes) ? slices.licenseTypes : [],
    ledgerEntries: Array.isArray(slices.ledgerEntries) ? slices.ledgerEntries : [],
    ...slices,
    users: (Array.isArray(MOCK_TABLES.users) ? MOCK_TABLES.users : []).filter(Boolean).map(sanitizeUserForClient)
  };
}
function findAccountByIdentifier(rawIdentifier) {
  const identifier = String(rawIdentifier || "").trim().toLowerCase();
  if (!identifier) return { user: null, master: null };
  const norm = (v) => String(v ?? "").trim().toLowerCase();
  const normCode = (v) => {
    const m = v.trim().match(/^emp[-_\s]*(\d+)$/i);
    return m ? `emp-${m[1].padStart(3, "0")}` : v.trim().toLowerCase();
  };
  const wantedCode = normCode(identifier);
  const users = MOCK_TABLES.users || [];
  const masters = [
    ...Object.values(PERSISTED_CRM_STATE.payrollMasters || {}),
    ...MOCK_TABLES.payroll_masters || []
  ].filter(Boolean);
  let master = masters.find((m) => norm(m.email) === identifier) || masters.find((m) => m.username && norm(m.username) === identifier) || masters.find((m) => m.empCode && (norm(m.empCode) === identifier || normCode(String(m.empCode)) === wantedCode)) || masters.find((m) => norm(m.userId) === identifier) || null;
  let user = users.find((u) => norm(u.email) === identifier) || users.find((u) => norm(u.username) === identifier) || users.find((u) => norm(u.id) === identifier) || users.find((u) => u.empCode && (norm(u.empCode) === identifier || normCode(String(u.empCode)) === wantedCode)) || null;
  if (master && !user) {
    user = users.find((u) => String(u.id) === String(master.userId)) || users.find((u) => master.email && norm(u.email) === norm(master.email)) || users.find((u) => master.username && norm(u.username) === norm(master.username)) || null;
  }
  if (user && !master) {
    master = masters.find((m) => String(m.userId) === String(user.id)) || masters.find((m) => user.email && norm(m.email) === norm(user.email)) || null;
  }
  return { user, master };
}
async function handleAuthLogin(req, res) {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();
    const identifier = String(
      req.body?.identifier ?? req.body?.email ?? req.body?.username ?? ""
    ).trim().toLowerCase();
    const password = String(req.body?.password ?? "").trim();
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        message: "Username/Email and password are required."
      });
    }
    const { user, master } = findAccountByIdentifier(identifier);
    if (!user && !master) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: "Invalid username/email or password."
      });
    }
    const userInactive = user && String(user.status || "").toLowerCase() === "inactive";
    const masterInactive = master && (String(master.status || "").toLowerCase() === "inactive" || String(master.employmentStatus || "").toLowerCase() === "inactive");
    if (userInactive || masterInactive && !user) {
      return res.status(403).json({
        success: false,
        authenticated: false,
        message: "Your account is inactive. Please contact the Administrator."
      });
    }
    const storedHash = user?.passwordHash || master?.passwordHash;
    if (!verifyPasswordHash(password, storedHash)) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: "Invalid username/email or password."
      });
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (user) {
      const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(user.id));
      if (uIdx >= 0) {
        MOCK_TABLES.users[uIdx] = {
          ...MOCK_TABLES.users[uIdx],
          lastLoginAt: nowIso
        };
      }
    }
    const resolvedUser = user || (master ? {
      id: master.userId,
      name: master.name || "Employee",
      username: master.username || (master.email ? String(master.email).split("@")[0] : master.empCode || "employee"),
      email: master.email || "",
      accessScope: master.accessType === "payroll_only" ? "payroll_only" : "all",
      accessType: master.accessType || "payroll_only",
      phone: master.phone || "",
      role: master.role || "Sales Executive",
      department: master.department || "Operations",
      designation: master.designation || master.role || "Employee",
      status: master.status || master.employmentStatus || "Active",
      location: master.location || "Mumbai HQ",
      lastLoginAt: nowIso
    } : null);
    savePersistedStore();
    await flushStateToDatabase();
    const sanitizedUser = sanitizeUserForClient(resolvedUser);
    const sanitizedMaster = master ? sanitizePayrollMasterForClient(master) : null;
    const token = issueAuthToken(String(sanitizedUser.id));
    res.cookie?.("crm_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL), sameSite: "lax", maxAge: 8 * 60 * 60 * 1e3, path: "/" });
    return res.json({
      success: true,
      authenticated: true,
      token,
      user: sanitizedUser,
      payrollMaster: sanitizedMaster
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: err?.message || "Authentication failed."
    });
  }
}
app.post("/api/auth/login", handleAuthLogin);
app.post("/api/auth/verify", handleAuthLogin);
app.post("/api/auth/change-password", async (req, res) => {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || isDatabaseActive()) {
      await hydrateStoreFromDatabase();
    }
    relinkUsersAndPayrollMasters();
    const rawAuthHeader = req.headers?.authorization || req.headers?.["x-auth-token"] || req.body?.authToken || sessionToken(req);
    const tokenUserId = rawAuthHeader ? verifyAuthToken(rawAuthHeader) : null;
    if (rawAuthHeader && !tokenUserId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication session."
      });
    }
    const requestedUserId = String(req.body?.userId ?? req.body?.identifier ?? "").trim();
    const actorUserId = String(
      tokenUserId || req.body?.actorUserId || req.headers?.["x-user-id"] || ""
    ).trim();
    if (actorUserId && requestedUserId && actorUserId !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: "Users can only change their own password."
      });
    }
    const lookupId = requestedUserId || actorUserId;
    if (!lookupId) {
      return res.status(400).json({
        success: false,
        message: "User identifier is required."
      });
    }
    const { user, master } = findAccountByIdentifier(lookupId);
    if (!user && !master) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }
    if (user && String(user.status || "").toLowerCase() === "inactive" || !user && master && String(master.status || "").toLowerCase() === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Inactive accounts cannot change passwords."
      });
    }
    const currentPassword = String(req.body?.currentPassword ?? "").trim();
    const newPassword = String(req.body?.newPassword ?? "").trim();
    const confirmPasswordRaw = req.body?.confirmPassword ?? req.body?.confirmNewPassword;
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required."
      });
    }
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required."
      });
    }
    if (confirmPasswordRaw !== void 0 && String(confirmPasswordRaw).trim() !== newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match."
      });
    }
    const storedHash = user?.passwordHash || master?.passwordHash;
    if (!verifyPasswordHash(currentPassword, storedHash)) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }
    const newHash = hashPassword(newPassword);
    const canonicalUserId = String(user?.id || master?.userId);
    const uIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === canonicalUserId);
    if (uIdx >= 0) {
      MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
        ...MOCK_TABLES.users[uIdx],
        passwordHash: newHash
      });
    }
    if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === "object") {
      for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters)) {
        if (m && (String(k) === canonicalUserId || String(m.userId) === canonicalUserId || user?.email && m.email && String(m.email).trim().toLowerCase() === String(user.email).trim().toLowerCase())) {
          PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
            ...m,
            passwordHash: newHash
          });
        }
      }
    }
    savePersistedStore();
    try {
      await query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newHash, canonicalUserId]
      );
    } catch {
    }
    await flushStateToDatabase();
    const updatedUser = MOCK_TABLES.users.find((u) => String(u.id) === canonicalUserId) || user || master;
    return res.json({
      success: true,
      message: "Password updated successfully.",
      user: sanitizeUserForClient(updatedUser)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to update password."
    });
  }
});
app.get("/api/state", async (_req, res) => {
  try {
    if (isDatabaseActive() && !PERSISTED_CRM_STATE.stateInitialized) {
      await hydrateStoreFromDatabase();
    }
    return res.json({
      success: true,
      initialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
      snapshot: getCurrentSnapshot()
    });
  } catch (err) {
    console.error("Error in /api/state GET:", err);
    try {
      return res.json({
        success: true,
        initialized: Boolean(PERSISTED_CRM_STATE.stateInitialized),
        snapshot: getCurrentSnapshot()
      });
    } catch {
      return res.json({
        success: true,
        initialized: false,
        snapshot: {
          users: (Array.isArray(MOCK_TABLES.users) ? MOCK_TABLES.users : []).filter(Boolean).map(sanitizeUserForClient),
          customers: [],
          contacts: [],
          leads: [],
          opportunities: [],
          orders: [],
          milestones: [],
          invoices: [],
          payments: []
        }
      });
    }
  }
});
app.post("/api/state", async (req, res) => {
  try {
    const { base, snapshot: incoming, force } = req.body || {};
    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({ error: "snapshot is required" });
    }
    const explicitIncomingPasswordByUserId = /* @__PURE__ */ new Map();
    if (Array.isArray(incoming.users)) {
      for (const u of incoming.users) {
        if (u && u.id) {
          const rawP = typeof u.password === "string" && u.password.trim() || typeof u.tempPassword === "string" && u.tempPassword.trim() || typeof u.passwordHash === "string" && u.passwordHash.trim() || "";
          if (rawP) {
            explicitIncomingPasswordByUserId.set(String(u.id), rawP);
          }
        }
      }
    }
    const sanitizedIncoming = {
      ...incoming,
      ...Array.isArray(incoming.users) ? { users: incoming.users.map(sanitizeUserForClient) } : {}
    };
    const sanitizedBase = base && typeof base === "object" ? {
      ...base,
      ...Array.isArray(base.users) ? { users: base.users.map(sanitizeUserForClient) } : {}
    } : void 0;
    const current = getCurrentSnapshot();
    const actor = req.account;
    if (actor && !["Super Admin", "Administrator"].includes(actor.role)) {
      const protectedUsers = (rows2) => rows2.map((u) => {
        const copy = { ...u };
        if (String(u.id) === String(actor.id)) for (const key of ["name", "avatar", "phone", "location", "lastLoginAt"]) delete copy[key];
        return copy;
      });
      if (explicitIncomingPasswordByUserId.size || !same(protectedUsers(sanitizedIncoming.users || []), protectedUsers(current.users || [])) || !same(sanitizedIncoming.rolePermissions, current.rolePermissions)) {
        return res.status(403).json({ success: false, message: "User accounts and permissions require an administrator." });
      }
    }
    let candidate = sanitizedIncoming;
    if (PERSISTED_CRM_STATE.stateInitialized && sanitizedBase && !force) {
      const merged = mergeSnapshots(sanitizedBase, sanitizedIncoming, current);
      if (merged.conflicts.length > 0) {
        return res.status(409).json({
          error: "Conflict detected while merging state",
          conflicts: merged.conflicts,
          snapshot: current
        });
      }
      candidate = merged.snapshot;
    }
    if (!PERSISTED_CRM_STATE.documentCounters || typeof PERSISTED_CRM_STATE.documentCounters !== "object") {
      PERSISTED_CRM_STATE.documentCounters = {};
    }
    const countersCopy = { ...PERSISTED_CRM_STATE.documentCounters };
    const numbered = assignDocumentNumbers(
      PERSISTED_CRM_STATE.stateInitialized ? current : candidate,
      candidate,
      countersCopy
    );
    const canonical = reconcileSnapshot(numbered);
    const issues = auditSnapshot(canonical);
    if (issues.length > 0) {
      return res.status(422).json({
        error: issues[0]?.message || "Validation failed",
        issues,
        snapshot: current
      });
    }
    const baseUserIds = new Set(
      Array.isArray(sanitizedBase?.users) ? sanitizedBase.users.map((u) => String(u?.id || "")) : []
    );
    const canonicalUserIds = new Set(
      Array.isArray(canonical.users) ? canonical.users.map((u) => String(u?.id || "")) : []
    );
    const deletedFromBaseIds = /* @__PURE__ */ new Set();
    for (const bid of baseUserIds) {
      if (bid && !canonicalUserIds.has(bid)) deletedFromBaseIds.add(bid);
    }
    if (Array.isArray(canonical.users) && canonical.users.length > 0) {
      const prevById = new Map(
        MOCK_TABLES.users.map((u) => [String(u.id), u])
      );
      const updatedUsers = canonical.users.map((u) => {
        const uid = String(u.id);
        const prev = prevById.get(uid);
        const explicitPass = explicitIncomingPasswordByUserId.get(uid);
        const passwordHash = explicitPass ? hashPassword(explicitPass) : resolveRecordPasswordHash(u, prev);
        return stripPlaintextAndResetFlags({
          ...prev,
          ...u,
          passwordHash
        });
      });
      if (!force) {
        for (const existingU of MOCK_TABLES.users) {
          if (!existingU || !existingU.id) continue;
          const eid = String(existingU.id);
          if (deletedFromBaseIds.has(eid)) continue;
          const eEmail = existingU.email ? String(existingU.email).trim().toLowerCase() : "";
          const alreadyIn = updatedUsers.some(
            (u) => String(u.id) === eid || eEmail && u.email && String(u.email).trim().toLowerCase() === eEmail
          );
          if (!alreadyIn) {
            updatedUsers.push(stripPlaintextAndResetFlags(existingU));
          }
        }
      }
      MOCK_TABLES.users = updatedUsers;
      canonical.users = updatedUsers.map(sanitizeUserForClient);
    }
    PERSISTED_CRM_STATE.documentCounters = countersCopy;
    PERSISTED_CRM_STATE.crmSlices = {
      ...PERSISTED_CRM_STATE.crmSlices,
      ...canonical,
      users: MOCK_TABLES.users.map(sanitizeUserForClient)
    };
    PERSISTED_CRM_STATE.stateInitialized = true;
    savePersistedStore();
    return res.json({
      success: true,
      initialized: true,
      snapshot: { ...canonical, users: MOCK_TABLES.users.map(sanitizeUserForClient) },
      issues: []
    });
  } catch (err) {
    console.error("Error in /api/state POST:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to save application state"
    });
  }
});
function mergeUsersWithMemory(dbRows) {
  const mergedMap = /* @__PURE__ */ new Map();
  const idByEmail = /* @__PURE__ */ new Map();
  for (const row of dbRows || []) {
    if (!row || !row.id) continue;
    const id = String(row.id);
    mergedMap.set(
      id,
      stripPlaintextAndResetFlags({
        ...row,
        id,
        passwordHash: resolveRecordPasswordHash(row)
      })
    );
    if (row.email) {
      idByEmail.set(String(row.email).trim().toLowerCase(), id);
    }
  }
  for (const memRow of MOCK_TABLES.users || []) {
    if (!memRow || !memRow.id) continue;
    const rawId = String(memRow.id);
    const emailLower = memRow.email ? String(memRow.email).trim().toLowerCase() : "";
    const targetId = mergedMap.has(rawId) ? rawId : emailLower && idByEmail.get(emailLower) || rawId;
    const existing = mergedMap.get(targetId);
    if (existing) {
      mergedMap.set(
        targetId,
        stripPlaintextAndResetFlags({
          ...existing,
          ...memRow,
          id: targetId,
          passwordHash: resolveRecordPasswordHash(memRow, existing)
        })
      );
    } else {
      mergedMap.set(
        targetId,
        stripPlaintextAndResetFlags({
          ...memRow,
          id: targetId,
          passwordHash: resolveRecordPasswordHash(memRow)
        })
      );
    }
    if (emailLower) {
      idByEmail.set(emailLower, targetId);
    }
  }
  return Array.from(mergedMap.values());
}
app.get("/api/users", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM users ORDER BY created_at ASC;");
    res.json({ users: mergeUsersWithMemory(result.rows).map(sanitizeUserForClient) });
  } catch (err) {
    res.json({ users: MOCK_TABLES.users.map(sanitizeUserForClient) });
  }
});
app.post("/api/users", async (req, res) => {
  relinkUsersAndPayrollMasters();
  const u = req.body?.user && typeof req.body.user === "object" ? req.body.user : req.body;
  if (!u || typeof u !== "object") {
    return res.status(400).json({ success: false, message: "User payload is required." });
  }
  const rawPassword = String(u.password ?? u.tempPassword ?? "").trim();
  const rawConfirmPassword = u.confirmPassword !== void 0 ? String(u.confirmPassword).trim() : void 0;
  if (rawConfirmPassword !== void 0 && rawPassword !== rawConfirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Password and Confirm Password do not match."
    });
  }
  const cleanEmail = u.email ? String(u.email).trim().toLowerCase() : "";
  const resolvedUsername = String(
    u.username || (cleanEmail ? cleanEmail.split("@")[0] : "")
  ).trim();
  const cleanUsername = resolvedUsername.toLowerCase();
  if (!cleanEmail && !cleanUsername) {
    return res.status(400).json({
      success: false,
      message: "Username or Login Email is required."
    });
  }
  const existingByIdIdx = u.id ? MOCK_TABLES.users.findIndex((row) => String(row.id) === String(u.id)) : -1;
  const duplicateEmailUser = cleanEmail ? MOCK_TABLES.users.find(
    (row, idx) => idx !== existingByIdIdx && row.email && String(row.email).trim().toLowerCase() === cleanEmail
  ) : void 0;
  const duplicateUsernameUser = cleanUsername ? MOCK_TABLES.users.find(
    (row, idx) => idx !== existingByIdIdx && row.username && String(row.username).trim().toLowerCase() === cleanUsername
  ) : void 0;
  if (duplicateEmailUser) {
    return res.status(409).json({
      success: false,
      message: `A user with login email "${u.email}" already exists.`
    });
  }
  if (duplicateUsernameUser) {
    return res.status(409).json({
      success: false,
      message: `A user with username "${resolvedUsername}" already exists.`
    });
  }
  if (existingByIdIdx < 0 && !rawPassword && !u.passwordHash) {
    return res.status(400).json({
      success: false,
      message: "Password is required when creating a user."
    });
  }
  const id = existingByIdIdx >= 0 ? String(MOCK_TABLES.users[existingByIdIdx].id) : u.id || `usr-${Date.now()}`;
  const existingUser = existingByIdIdx >= 0 ? MOCK_TABLES.users[existingByIdIdx] : void 0;
  const passwordHash = rawPassword ? hashPassword(rawPassword) : resolveRecordPasswordHash(u, existingUser);
  const newUserRow = stripPlaintextAndResetFlags({
    id,
    name: String(u.name || existingUser?.name || "New User").trim(),
    username: resolvedUsername || existingUser?.username || "user",
    email: String(u.email || existingUser?.email || "").trim(),
    passwordHash,
    accessScope: u.accessScope || (u.accessType === "payroll_only" ? "payroll_only" : "all"),
    accessType: u.accessType || "crm_and_payroll",
    phone: u.phone ?? existingUser?.phone ?? "",
    role: u.role || existingUser?.role || "Sales Executive",
    department: u.department || existingUser?.department || "Sales",
    designation: u.designation ?? existingUser?.designation ?? "",
    status: u.status === "Inactive" ? "Inactive" : "Active",
    avatar: u.avatar ?? existingUser?.avatar ?? "",
    location: u.location ?? existingUser?.location ?? "",
    reportingManager: u.reportingManager ?? existingUser?.reportingManager ?? "",
    assignedTerritory: u.assignedTerritory ?? existingUser?.assignedTerritory ?? "",
    custom_permissions: u.customPermissions || existingUser?.custom_permissions || {},
    customPermissions: u.customPermissions || existingUser?.customPermissions,
    created_at: existingUser?.created_at || (/* @__PURE__ */ new Date()).toISOString()
  });
  if (existingByIdIdx >= 0) {
    MOCK_TABLES.users[existingByIdIdx] = {
      ...MOCK_TABLES.users[existingByIdIdx],
      ...newUserRow,
      id
    };
  } else {
    MOCK_TABLES.users.push(newUserRow);
  }
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === "object" && PERSISTED_CRM_STATE.payrollMasters[id]) {
    PERSISTED_CRM_STATE.payrollMasters[id] = stripPlaintextAndResetFlags({
      ...PERSISTED_CRM_STATE.payrollMasters[id],
      userId: id,
      name: newUserRow.name,
      username: newUserRow.username,
      email: newUserRow.email,
      role: newUserRow.role,
      department: newUserRow.department,
      designation: newUserRow.designation,
      location: newUserRow.location,
      status: newUserRow.status,
      phone: newUserRow.phone,
      passwordHash
    });
  }
  savePersistedStore();
  try {
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;").catch(() => {
    });
    await query(
      `INSERT INTO users (id, name, username, email, password_hash, phone, role, department, designation, status, avatar, location, custom_permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         designation = EXCLUDED.designation,
         status = EXCLUDED.status,
         avatar = EXCLUDED.avatar,
         location = EXCLUDED.location,
         custom_permissions = EXCLUDED.custom_permissions,
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        newUserRow.name,
        newUserRow.username,
        newUserRow.email,
        passwordHash,
        newUserRow.phone,
        newUserRow.role,
        newUserRow.department,
        newUserRow.designation,
        newUserRow.status,
        newUserRow.avatar,
        newUserRow.location,
        JSON.stringify(u.customPermissions || {})
      ]
    );
  } catch {
  }
  await flushStateToDatabase();
  const sanitized = sanitizeUserForClient(newUserRow);
  res.json({ success: true, id, user: sanitized });
});
app.put("/api/users/:id", async (req, res) => {
  relinkUsersAndPayrollMasters();
  const { id } = req.params;
  const u = req.body?.user && typeof req.body.user === "object" ? req.body.user : req.body;
  if (!u || typeof u !== "object") {
    return res.status(400).json({ success: false, message: "User update payload is required." });
  }
  const rawPassword = String(u.password ?? u.tempPassword ?? "").trim();
  const rawConfirmPassword = u.confirmPassword !== void 0 ? String(u.confirmPassword).trim() : void 0;
  if (rawPassword && rawConfirmPassword !== void 0 && rawPassword !== rawConfirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Password and Confirm Password do not match."
    });
  }
  const byIdIdx = MOCK_TABLES.users.findIndex((row) => String(row.id) === String(id));
  const cleanEmail = u.email ? String(u.email).trim().toLowerCase() : "";
  const cleanUsername = u.username ? String(u.username).trim().toLowerCase() : "";
  if (cleanEmail) {
    const emailConflict = MOCK_TABLES.users.find(
      (row, idx) => idx !== byIdIdx && String(row.id) !== String(id) && row.email && String(row.email).trim().toLowerCase() === cleanEmail
    );
    if (emailConflict) {
      return res.status(409).json({
        success: false,
        message: `Login email "${u.email}" is already assigned to another user.`
      });
    }
  }
  if (cleanUsername) {
    const usernameConflict = MOCK_TABLES.users.find(
      (row, idx) => idx !== byIdIdx && String(row.id) !== String(id) && row.username && String(row.username).trim().toLowerCase() === cleanUsername
    );
    if (usernameConflict) {
      return res.status(409).json({
        success: false,
        message: `Username "${u.username}" is already assigned to another user.`
      });
    }
  }
  let updatedRecord;
  let previousEmailLower = "";
  if (byIdIdx >= 0) {
    const curr = MOCK_TABLES.users[byIdIdx];
    previousEmailLower = curr.email ? String(curr.email).trim().toLowerCase() : "";
    const nextPasswordHash = rawPassword ? hashPassword(rawPassword) : resolveRecordPasswordHash(u, curr);
    updatedRecord = stripPlaintextAndResetFlags({
      ...curr,
      name: u.name !== void 0 ? String(u.name).trim() : curr.name,
      username: u.username !== void 0 ? String(u.username).trim() : curr.username,
      email: u.email !== void 0 ? String(u.email).trim() : curr.email,
      passwordHash: nextPasswordHash,
      accessScope: u.accessScope ?? curr.accessScope,
      accessType: u.accessType ?? curr.accessType,
      phone: u.phone ?? curr.phone,
      role: u.role ?? curr.role,
      department: u.department ?? curr.department,
      designation: u.designation ?? curr.designation,
      status: u.status ?? curr.status,
      avatar: u.avatar !== void 0 ? u.avatar : curr.avatar,
      location: u.location ?? curr.location,
      reportingManager: u.reportingManager ?? curr.reportingManager,
      assignedTerritory: u.assignedTerritory ?? curr.assignedTerritory,
      custom_permissions: u.customPermissions !== void 0 ? u.customPermissions : curr.custom_permissions,
      customPermissions: u.customPermissions !== void 0 ? u.customPermissions : curr.customPermissions
    });
    MOCK_TABLES.users[byIdIdx] = updatedRecord;
  } else {
    const nextPasswordHash = rawPassword ? hashPassword(rawPassword) : resolveRecordPasswordHash(u);
    updatedRecord = stripPlaintextAndResetFlags({
      id,
      name: String(u.name || "User").trim(),
      username: String(u.username || u.email?.split("@")[0] || "user").trim(),
      email: String(u.email || "").trim(),
      passwordHash: nextPasswordHash,
      accessScope: u.accessScope || "all",
      accessType: u.accessType || "crm_and_payroll",
      phone: u.phone || "",
      role: u.role || "Sales Executive",
      department: u.department || "Sales",
      designation: u.designation || "",
      status: u.status || "Active",
      avatar: u.avatar || "",
      location: u.location || "",
      custom_permissions: u.customPermissions || {},
      customPermissions: u.customPermissions,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    MOCK_TABLES.users.push(updatedRecord);
  }
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === "object") {
    for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters)) {
      if (!m) continue;
      const mEmailLower = m.email ? String(m.email).trim().toLowerCase() : "";
      if (String(k) === String(id) || String(m.userId) === String(id) || previousEmailLower && mEmailLower === previousEmailLower || cleanEmail && mEmailLower === cleanEmail) {
        PERSISTED_CRM_STATE.payrollMasters[k] = stripPlaintextAndResetFlags({
          ...m,
          userId: String(id),
          name: updatedRecord.name,
          username: updatedRecord.username,
          email: updatedRecord.email,
          role: updatedRecord.role,
          department: updatedRecord.department,
          designation: updatedRecord.designation,
          location: updatedRecord.location,
          status: updatedRecord.status,
          phone: updatedRecord.phone,
          passwordHash: updatedRecord.passwordHash
        });
      }
    }
  }
  savePersistedStore();
  try {
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;").catch(() => {
    });
    await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         username = COALESCE($2, username),
         email = COALESCE($3, email),
         password_hash = COALESCE($4, password_hash),
         phone = COALESCE($5, phone),
         role = COALESCE($6, role),
         department = COALESCE($7, department),
         designation = COALESCE($8, designation),
         status = COALESCE($9, status),
         avatar = COALESCE($10, avatar),
         location = COALESCE($11, location),
         custom_permissions = COALESCE($12, custom_permissions),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $13`,
      [
        updatedRecord.name,
        updatedRecord.username,
        updatedRecord.email,
        updatedRecord.passwordHash,
        updatedRecord.phone,
        updatedRecord.role,
        updatedRecord.department,
        updatedRecord.designation,
        updatedRecord.status,
        updatedRecord.avatar,
        updatedRecord.location,
        u.customPermissions ? JSON.stringify(u.customPermissions) : null,
        id
      ]
    );
  } catch {
  }
  await flushStateToDatabase();
  res.json({ success: true, id, user: sanitizeUserForClient(updatedRecord) });
});
app.get("/api/payroll/masters", (_req, res) => {
  const map = { ...PERSISTED_CRM_STATE.payrollMasters || {} };
  for (const item of MOCK_TABLES.payroll_masters) {
    if (item && item.userId) {
      map[item.userId] = item;
    }
  }
  res.json({ success: true, masters: sanitizePayrollMastersMapForClient(map) });
});
app.post("/api/payroll/masters", async (req, res) => {
  const rawMasters = req.body?.masters;
  const masters = Array.isArray(rawMasters) ? Object.fromEntries(
    rawMasters.filter((m) => m && m.userId).map((m) => [String(m.userId), m])
  ) : rawMasters;
  const deletedUserIds = Array.isArray(req.body?.deletedUserIds) ? req.body.deletedUserIds.filter((id) => typeof id === "string" && id) : [];
  const clearedUserIds = Array.isArray(req.body?.clearedUserIds) ? req.body.clearedUserIds.filter((id) => typeof id === "string" && id) : [];
  if (masters && typeof masters === "object") {
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedPayrollMasterIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = [];
    }
    for (const id of clearedUserIds) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = PERSISTED_CRM_STATE.deletedPayrollMasterIds.filter((t) => t !== id);
    }
    const currentMasters = {
      ...PERSISTED_CRM_STATE.payrollMasters || {}
    };
    const isPatch = Boolean(req.body?.patch);
    const baseMasters = req.body?.baseMasters;
    if (baseMasters && typeof baseMasters === "object") {
      for (const [k, nextVal] of Object.entries(masters)) {
        const baseVal = sanitizePayrollMasterForClient(baseMasters[k]);
        const currVal = sanitizePayrollMasterForClient(currentMasters[k]);
        const cleanNextVal = sanitizePayrollMasterForClient(nextVal);
        if (!same(baseVal, cleanNextVal) && currVal !== void 0 && !same(currVal, baseVal) && !same(currVal, cleanNextVal)) {
          return res.status(409).json({
            success: false,
            message: `Concurrent change detected for payroll master ${k}`
          });
        }
      }
    }
    const combined = isPatch ? { ...currentMasters, ...masters } : { ...masters };
    const tombstones = /* @__PURE__ */ new Set([
      ...PERSISTED_CRM_STATE.deletedPayrollMasterIds,
      ...deletedUserIds
    ]);
    for (const id of clearedUserIds) tombstones.delete(id);
    for (const id of deletedUserIds) delete combined[id];
    for (const key of Object.keys(combined)) {
      const uid = String(combined[key] && combined[key].userId || key);
      if (tombstones.has(uid)) delete combined[key];
    }
    PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.from(tombstones);
    const seenCodes = /* @__PURE__ */ new Map();
    const seenEmails = /* @__PURE__ */ new Map();
    for (const m of Object.values(combined)) {
      if (!m || !m.userId) continue;
      const uid = String(m.userId);
      const rawCode = String(m.empCode || "").trim().toUpperCase();
      const numMatch = rawCode.match(/^EMP[-_\s]*(\d+)$/i);
      const normCode = numMatch ? `EMP-${numMatch[1].padStart(3, "0")}` : rawCode;
      if (normCode) {
        const existingOwner = seenCodes.get(normCode);
        if (existingOwner && existingOwner !== uid) {
          return res.status(400).json({
            success: false,
            message: `Duplicate Employee Code ${normCode}`
          });
        }
        seenCodes.set(normCode, uid);
      }
      const normEmail = String(m.email || "").trim().toLowerCase();
      if (normEmail) {
        const existingEmailOwner = seenEmails.get(normEmail);
        if (existingEmailOwner && existingEmailOwner !== uid) {
          return res.status(400).json({
            success: false,
            message: `Duplicate Employee Email ${normEmail}`
          });
        }
        seenEmails.set(normEmail, uid);
      }
    }
    const entries = Object.values(combined);
    const relinkedMap = {};
    for (const m of entries) {
      if (!m || !m.userId) continue;
      const byIdIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(m.userId));
      const byEmailIdx = byIdIdx < 0 && m.email ? MOCK_TABLES.users.findIndex(
        (u) => u.email && u.email.toLowerCase() === String(m.email).toLowerCase()
      ) : -1;
      const existingIdx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
      const canonicalUserId = existingIdx >= 0 ? String(MOCK_TABLES.users[existingIdx].id) : String(m.userId);
      const existingUser = existingIdx >= 0 ? MOCK_TABLES.users[existingIdx] : void 0;
      const existingMaster = currentMasters[canonicalUserId] || currentMasters[String(m.userId)];
      const passwordHash = resolveRecordPasswordHash(m, existingMaster, existingUser);
      const effectiveStatus = m.status || m.employmentStatus || existingUser?.status || "Active";
      const normalizedMaster = stripPlaintextAndResetFlags({
        ...existingMaster,
        ...m,
        userId: canonicalUserId,
        status: effectiveStatus,
        passwordHash
      });
      relinkedMap[canonicalUserId] = normalizedMaster;
      if (existingIdx >= 0) {
        MOCK_TABLES.users[existingIdx] = stripPlaintextAndResetFlags({
          ...MOCK_TABLES.users[existingIdx],
          name: m.name || MOCK_TABLES.users[existingIdx].name,
          username: m.username || MOCK_TABLES.users[existingIdx].username,
          email: m.email || MOCK_TABLES.users[existingIdx].email,
          status: effectiveStatus,
          passwordHash,
          empCode: normalizedMaster.empCode
        });
      } else {
        MOCK_TABLES.users.push(
          stripPlaintextAndResetFlags({
            id: canonicalUserId,
            name: m.name || "Employee",
            username: m.username || (m.email ? m.email.split("@")[0] : normalizedMaster.empCode || "employee"),
            email: m.email || "",
            passwordHash,
            accessScope: m.accessType === "payroll_only" ? "payroll_only" : "all",
            accessType: m.accessType || "payroll_only",
            empCode: normalizedMaster.empCode,
            phone: m.phone || "",
            role: m.role || "Sales Executive",
            department: m.department || "Operations",
            designation: m.designation || m.role || "Employee",
            status: effectiveStatus,
            location: m.location || "Mumbai HQ",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          })
        );
      }
    }
    PERSISTED_CRM_STATE.payrollMasters = relinkedMap;
    MOCK_TABLES.payroll_masters = Object.values(relinkedMap);
    savePersistedStore();
  }
  await flushStateToDatabase();
  res.json({
    success: true,
    count: MOCK_TABLES.payroll_masters.length,
    masters: sanitizePayrollMastersMapForClient(PERSISTED_CRM_STATE.payrollMasters)
  });
});
app.delete("/api/payroll/masters/:id", async (req, res) => {
  const { id } = req.params;
  if (id) {
    delete PERSISTED_CRM_STATE.payrollMasters[id];
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedPayrollMasterIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = [];
    }
    if (!PERSISTED_CRM_STATE.deletedPayrollMasterIds.includes(id)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds.push(id);
    }
    MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters).filter(
      Boolean
    );
    savePersistedStore();
  }
  await flushStateToDatabase();
  res.json({ success: true, id });
});
app.get("/api/payroll/loans", (_req, res) => {
  const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
  const loans = (PERSISTED_CRM_STATE.payrollLoans || []).filter(
    (l) => l && l.id && !delSet.has(l.id)
  );
  res.json({
    success: true,
    loans,
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || []
  });
});
app.post("/api/payroll/loans", (req, res) => {
  const deletedLoanId = req.body?.deletedLoanId;
  if (deletedLoanId && typeof deletedLoanId === "string") {
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedLoanIds)) {
      PERSISTED_CRM_STATE.deletedLoanIds = [];
    }
    if (!PERSISTED_CRM_STATE.deletedLoanIds.includes(deletedLoanId)) {
      PERSISTED_CRM_STATE.deletedLoanIds.push(deletedLoanId);
    }
  }
  const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
  if (Array.isArray(req.body?.loans)) {
    PERSISTED_CRM_STATE.payrollLoans = req.body.loans.filter(
      (l) => l && l.id && !delSet.has(l.id)
    );
    savePersistedStore();
  }
  res.json({
    success: true,
    loans: PERSISTED_CRM_STATE.payrollLoans || [],
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || []
  });
});
app.delete("/api/payroll/loans/:id", (req, res) => {
  const { id } = req.params;
  if (id) {
    if (!Array.isArray(PERSISTED_CRM_STATE.deletedLoanIds)) {
      PERSISTED_CRM_STATE.deletedLoanIds = [];
    }
    if (!PERSISTED_CRM_STATE.deletedLoanIds.includes(id)) {
      PERSISTED_CRM_STATE.deletedLoanIds.push(id);
    }
    PERSISTED_CRM_STATE.payrollLoans = (PERSISTED_CRM_STATE.payrollLoans || []).filter(
      (l) => l && l.id !== id
    );
    savePersistedStore();
  }
  res.json({
    success: true,
    id,
    loans: PERSISTED_CRM_STATE.payrollLoans || [],
    deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || []
  });
});
app.get("/api/payroll/policy", (_req, res) => {
  res.json({ success: true, policy: PERSISTED_CRM_STATE.payrollPolicy || null });
});
app.post("/api/payroll/policy", (req, res) => {
  if (req.body?.policy && typeof req.body.policy === "object") {
    PERSISTED_CRM_STATE.payrollPolicy = req.body.policy;
    savePersistedStore();
  }
  res.json({ success: true, policy: PERSISTED_CRM_STATE.payrollPolicy });
});
app.get("/api/payroll/org-masters", (_req, res) => {
  res.json({ success: true, orgMasters: PERSISTED_CRM_STATE.payrollOrgMasters || null });
});
app.post("/api/payroll/org-masters", (req, res) => {
  if (req.body?.orgMasters && typeof req.body.orgMasters === "object") {
    PERSISTED_CRM_STATE.payrollOrgMasters = req.body.orgMasters;
    savePersistedStore();
  }
  res.json({ success: true, orgMasters: PERSISTED_CRM_STATE.payrollOrgMasters });
});
app.post("/api/payroll/ess/:empId", (req, res) => {
  const { empId } = req.params;
  if (!empId) {
    return res.status(400).json({ success: false, error: "empId is required" });
  }
  const { attendance, leaves, claims, statutory, base } = req.body || {};
  if (Array.isArray(leaves)) {
    for (const lv of leaves) {
      if (lv && lv.employeeId && String(lv.employeeId) !== String(empId)) {
        return res.status(400).json({
          success: false,
          message: `Leave record employeeId ${lv.employeeId} does not match ${empId}`
        });
      }
    }
    if (Array.isArray(base?.leaves)) {
      const currentLeaves = PERSISTED_CRM_STATE.payrollLeaves[empId] || [];
      const baseById = new Map(base.leaves.map((l) => [String(l.id), l]));
      const currById = new Map(currentLeaves.map((l) => [String(l.id), l]));
      for (const lv of leaves) {
        const id = String(lv.id);
        const b = baseById.get(id);
        const c = currById.get(id);
        if (!same(b, lv) && !same(c, b) && !same(c, lv)) {
          return res.status(409).json({
            success: false,
            message: `Concurrent leave modification detected for ${id}`
          });
        }
      }
    }
  }
  if (Array.isArray(claims)) {
    for (const cl of claims) {
      if (cl && cl.employeeId && String(cl.employeeId) !== String(empId)) {
        return res.status(400).json({
          success: false,
          message: `Claim record employeeId ${cl.employeeId} does not match ${empId}`
        });
      }
    }
    if (Array.isArray(base?.claims)) {
      const currentClaims = PERSISTED_CRM_STATE.payrollClaims[empId] || [];
      const baseById = new Map(base.claims.map((c) => [String(c.id), c]));
      const currById = new Map(currentClaims.map((c) => [String(c.id), c]));
      for (const cl of claims) {
        const id = String(cl.id);
        const b = baseById.get(id);
        const c = currById.get(id);
        if (!same(b, cl) && !same(c, b) && !same(c, cl)) {
          return res.status(409).json({
            success: false,
            message: `Concurrent claim modification detected for ${id}`
          });
        }
      }
    }
  }
  if (attendance !== void 0) {
    PERSISTED_CRM_STATE.payrollAttendance[empId] = attendance;
  }
  if (leaves !== void 0) {
    PERSISTED_CRM_STATE.payrollLeaves[empId] = leaves;
  }
  if (claims !== void 0) {
    PERSISTED_CRM_STATE.payrollClaims[empId] = claims;
  }
  if (statutory !== void 0) {
    PERSISTED_CRM_STATE.payrollStatutory[empId] = statutory;
  }
  savePersistedStore();
  res.json({ success: true, empId });
});
app.post("/api/sync/push", async (req, res) => {
  const {
    users: pushedUsers,
    payrollMasters: pushedMasters,
    payrollLoans: pushedLoans,
    payrollPolicy: pushedPolicy,
    payrollOrgMasters: pushedOrgMasters,
    payrollAttendance: pushedAttendance,
    payrollLeaves: pushedLeaves,
    payrollClaims: pushedClaims,
    payrollStatutory: pushedStatutory,
    payrollIntegrationConfig: pushedIntegrationConfig,
    crmSlices: pushedCrmSlices,
    sliceKey,
    sliceValue,
    replaceUsers,
    replacePayrollMasters,
    deletedMasterUserIds
  } = req.body || {};
  const actor = req.account;
  if (actor && !["Super Admin", "Administrator"].includes(actor.role) && (pushedUsers || pushedMasters || pushedCrmSlices || sliceKey === "rolePermissions" || replaceUsers || replacePayrollMasters || deletedMasterUserIds)) {
    return res.status(403).json({ success: false, message: "Administrator permission required." });
  }
  if (pushedCrmSlices || sliceKey) {
    return res.status(409).json({ success: false, message: "CRM records must use /api/state with a baseline snapshot." });
  }
  if (Array.isArray(pushedUsers)) {
    if (replaceUsers) {
      const prevById = new Map(
        MOCK_TABLES.users.map((u) => [String(u.id), u])
      );
      MOCK_TABLES.users = pushedUsers.map(
        (u) => stripPlaintextAndResetFlags({
          ...u,
          passwordHash: resolveRecordPasswordHash(u, prevById.get(String(u.id)))
        })
      );
    } else {
      for (const u of pushedUsers) {
        if (!u || !u.id) continue;
        const byIdIdx = MOCK_TABLES.users.findIndex((row) => String(row.id) === String(u.id));
        const byEmailIdx = byIdIdx < 0 && u.email ? MOCK_TABLES.users.findIndex(
          (row) => row.email && row.email.toLowerCase() === String(u.email).toLowerCase()
        ) : -1;
        const idx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
        if (idx >= 0) {
          const prev = MOCK_TABLES.users[idx];
          MOCK_TABLES.users[idx] = stripPlaintextAndResetFlags({
            ...prev,
            ...u,
            id: prev.id,
            passwordHash: resolveRecordPasswordHash(u, prev)
          });
        } else {
          MOCK_TABLES.users.push(
            stripPlaintextAndResetFlags({
              ...u,
              passwordHash: resolveRecordPasswordHash(u)
            })
          );
        }
      }
    }
  }
  if (pushedMasters && typeof pushedMasters === "object") {
    if (replacePayrollMasters) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.isArray(deletedMasterUserIds) ? deletedMasterUserIds.filter((id) => typeof id === "string" && id) : Object.keys(PERSISTED_CRM_STATE.payrollMasters || {});
      PERSISTED_CRM_STATE.payrollMasters = {};
      MOCK_TABLES.payroll_masters = [];
    }
    const existingMap = /* @__PURE__ */ new Map();
    if (!replacePayrollMasters) {
      for (const item of MOCK_TABLES.payroll_masters) {
        if (item && item.userId) existingMap.set(item.userId, item);
      }
    }
    const tombstones = /* @__PURE__ */ new Set([
      ...PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
      ...Array.isArray(deletedMasterUserIds) ? deletedMasterUserIds : []
    ]);
    if (Array.isArray(deletedMasterUserIds)) {
      PERSISTED_CRM_STATE.deletedPayrollMasterIds = Array.from(tombstones);
    }
    for (const m of Object.values(pushedMasters)) {
      if (!m || !m.userId || tombstones.has(m.userId)) continue;
      const byIdIdx = MOCK_TABLES.users.findIndex((u) => String(u.id) === String(m.userId));
      const byEmailIdx = byIdIdx < 0 && m.email ? MOCK_TABLES.users.findIndex(
        (u) => u.email && u.email.toLowerCase() === String(m.email).toLowerCase()
      ) : -1;
      const uIdx = byIdIdx >= 0 ? byIdIdx : byEmailIdx;
      const canonicalId = uIdx >= 0 ? String(MOCK_TABLES.users[uIdx].id) : String(m.userId);
      if (canonicalId !== String(m.userId)) {
        existingMap.delete(String(m.userId));
      }
      const prevMaster = existingMap.get(canonicalId);
      const prevUser = uIdx >= 0 ? MOCK_TABLES.users[uIdx] : void 0;
      const passwordHash = resolveRecordPasswordHash(m, prevMaster, prevUser);
      const effectiveStatus = m.status || m.employmentStatus || prevUser?.status || "Active";
      existingMap.set(
        canonicalId,
        stripPlaintextAndResetFlags({
          ...prevMaster,
          ...m,
          userId: canonicalId,
          status: effectiveStatus,
          passwordHash
        })
      );
      if (uIdx >= 0) {
        MOCK_TABLES.users[uIdx] = stripPlaintextAndResetFlags({
          ...MOCK_TABLES.users[uIdx],
          name: m.name || MOCK_TABLES.users[uIdx].name,
          email: m.email || MOCK_TABLES.users[uIdx].email,
          passwordHash,
          empCode: m.empCode
        });
      } else {
        MOCK_TABLES.users.push(
          stripPlaintextAndResetFlags({
            id: canonicalId,
            name: m.name || "Employee",
            username: m.username || (m.email ? m.email.split("@")[0] : m.empCode || "employee"),
            email: m.email || "",
            passwordHash,
            accessScope: m.accessType === "payroll_only" ? "payroll_only" : "all",
            accessType: m.accessType || "payroll_only",
            empCode: m.empCode,
            phone: m.phone || "",
            role: m.role || "Sales Executive",
            department: m.department || "Operations",
            designation: m.designation || m.role || "Employee",
            status: effectiveStatus,
            location: m.location || "Mumbai HQ",
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          })
        );
      }
    }
    MOCK_TABLES.payroll_masters = Array.from(existingMap.values());
    const nextMastersObj = {};
    for (const item of MOCK_TABLES.payroll_masters) {
      if (item && item.userId) nextMastersObj[item.userId] = item;
    }
    PERSISTED_CRM_STATE.payrollMasters = nextMastersObj;
  }
  if (Array.isArray(pushedLoans)) {
    const delSet = new Set(PERSISTED_CRM_STATE.deletedLoanIds || []);
    const existingMap = /* @__PURE__ */ new Map();
    for (const ln of PERSISTED_CRM_STATE.payrollLoans || []) {
      if (ln && ln.id && !delSet.has(ln.id)) {
        existingMap.set(ln.id, ln);
      }
    }
    for (const ln of pushedLoans) {
      if (!ln || !ln.id || delSet.has(ln.id)) continue;
      const prev = existingMap.get(ln.id);
      if (!prev) {
        existingMap.set(ln.id, ln);
      } else {
        const prevAuditLen = Array.isArray(prev.auditTrail) ? prev.auditTrail.length : 0;
        const nextAuditLen = Array.isArray(ln.auditTrail) ? ln.auditTrail.length : 0;
        const prevUpdated = Number(prev.updatedAt || 0);
        const nextUpdated = Number(ln.updatedAt || 0);
        if (nextUpdated >= prevUpdated && nextAuditLen >= prevAuditLen) {
          existingMap.set(ln.id, ln);
        }
      }
    }
    PERSISTED_CRM_STATE.payrollLoans = Array.from(existingMap.values());
  }
  if (pushedPolicy && typeof pushedPolicy === "object") {
    PERSISTED_CRM_STATE.payrollPolicy = pushedPolicy;
  }
  if (pushedOrgMasters && typeof pushedOrgMasters === "object") {
    PERSISTED_CRM_STATE.payrollOrgMasters = pushedOrgMasters;
  }
  if (pushedAttendance && typeof pushedAttendance === "object") {
    PERSISTED_CRM_STATE.payrollAttendance = {
      ...PERSISTED_CRM_STATE.payrollAttendance,
      ...pushedAttendance
    };
  }
  if (pushedLeaves && typeof pushedLeaves === "object") {
    PERSISTED_CRM_STATE.payrollLeaves = {
      ...PERSISTED_CRM_STATE.payrollLeaves,
      ...pushedLeaves
    };
  }
  if (pushedClaims && typeof pushedClaims === "object") {
    PERSISTED_CRM_STATE.payrollClaims = {
      ...PERSISTED_CRM_STATE.payrollClaims,
      ...pushedClaims
    };
  }
  if (pushedStatutory && typeof pushedStatutory === "object") {
    PERSISTED_CRM_STATE.payrollStatutory = {
      ...PERSISTED_CRM_STATE.payrollStatutory,
      ...pushedStatutory
    };
  }
  if (pushedIntegrationConfig && typeof pushedIntegrationConfig === "object") {
    PERSISTED_CRM_STATE.payrollIntegrationConfig = pushedIntegrationConfig;
  }
  if (pushedCrmSlices && typeof pushedCrmSlices === "object") {
    PERSISTED_CRM_STATE.crmSlices = {
      ...PERSISTED_CRM_STATE.crmSlices,
      ...pushedCrmSlices
    };
  }
  if (typeof sliceKey === "string" && sliceValue !== void 0) {
    PERSISTED_CRM_STATE.crmSlices[sliceKey] = sliceValue;
  }
  savePersistedStore();
  await flushStateToDatabase();
  const map = {};
  for (const item of MOCK_TABLES.payroll_masters) {
    if (item && item.userId) map[item.userId] = sanitizePayrollMasterForClient(item);
  }
  res.json({
    success: true,
    users: MOCK_TABLES.users.map(sanitizeUserForClient),
    payrollMasters: map,
    deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || []
  });
});
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const deletedUser = MOCK_TABLES.users.find((row) => String(row.id) === String(id));
  MOCK_TABLES.users = MOCK_TABLES.users.filter((row) => String(row.id) !== String(id));
  if (PERSISTED_CRM_STATE.payrollMasters && typeof PERSISTED_CRM_STATE.payrollMasters === "object") {
    for (const [k, m] of Object.entries(PERSISTED_CRM_STATE.payrollMasters)) {
      if (m && (k === id || m.userId === id || deletedUser?.email && m.email && String(m.email).toLowerCase() === String(deletedUser.email).toLowerCase())) {
        PERSISTED_CRM_STATE.payrollMasters[k] = {
          ...m,
          status: "Inactive",
          syncedWithCrm: false
        };
      }
    }
  }
  MOCK_TABLES.payroll_masters = Object.values(PERSISTED_CRM_STATE.payrollMasters || {});
  savePersistedStore();
  try {
    await query("DELETE FROM users WHERE id = $1", [id]);
  } catch {
  }
  res.json({ success: true, id });
});
app.get("/api/company", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM company_setup LIMIT 1;");
    res.json({ company: result.rows[0] || MOCK_TABLES.company_setup[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/company", async (req, res) => {
  const c = req.body;
  const current = MOCK_TABLES.company_setup[0] || { id: 1 };
  MOCK_TABLES.company_setup[0] = {
    ...current,
    name: c.name !== void 0 ? c.name : current.name,
    legal_name: c.legalName !== void 0 ? c.legalName : current.legal_name,
    gstin: c.gstin !== void 0 ? c.gstin : current.gstin,
    pan: c.pan !== void 0 ? c.pan : current.pan,
    city: c.city !== void 0 ? c.city : current.city,
    state: c.state !== void 0 ? c.state : current.state,
    state_code: c.stateCode !== void 0 ? c.stateCode : current.state_code,
    address: c.address !== void 0 ? c.address : current.address,
    pincode: c.pincode !== void 0 ? c.pincode : current.pincode,
    phone: c.phone !== void 0 ? c.phone : current.phone,
    email: c.email !== void 0 ? c.email : current.email,
    website: c.website !== void 0 ? c.website : current.website,
    logo_url: c.logoUrl !== void 0 ? c.logoUrl : current.logo_url,
    bank_name: c.bankDetails?.bankName || c.bankName || current.bank_name,
    bank_account_no: c.bankDetails?.accountNumber || c.accountNumber || current.bank_account_no,
    bank_ifsc: c.bankDetails?.ifscCode || c.ifscCode || current.bank_ifsc,
    bank_branch: c.bankDetails?.branch || c.branch || current.bank_branch
  };
  savePersistedStore();
  res.json({ success: true, company: MOCK_TABLES.company_setup[0] });
});
app.put("/api/company", async (req, res) => {
  const c = req.body;
  const current = MOCK_TABLES.company_setup[0] || { id: 1 };
  MOCK_TABLES.company_setup[0] = {
    ...current,
    name: c.name !== void 0 ? c.name : current.name,
    legal_name: c.legalName !== void 0 ? c.legalName : current.legal_name,
    gstin: c.gstin !== void 0 ? c.gstin : current.gstin,
    pan: c.pan !== void 0 ? c.pan : current.pan,
    city: c.city !== void 0 ? c.city : current.city,
    state: c.state !== void 0 ? c.state : current.state,
    state_code: c.stateCode !== void 0 ? c.stateCode : current.state_code,
    address: c.address !== void 0 ? c.address : current.address,
    pincode: c.pincode !== void 0 ? c.pincode : current.pincode,
    phone: c.phone !== void 0 ? c.phone : current.phone,
    email: c.email !== void 0 ? c.email : current.email,
    website: c.website !== void 0 ? c.website : current.website,
    logo_url: c.logoUrl !== void 0 ? c.logoUrl : current.logo_url,
    bank_name: c.bankDetails?.bankName || c.bankName || current.bank_name,
    bank_account_no: c.bankDetails?.accountNumber || c.accountNumber || current.bank_account_no,
    bank_ifsc: c.bankDetails?.ifscCode || c.ifscCode || current.bank_ifsc,
    bank_branch: c.bankDetails?.branch || c.branch || current.bank_branch
  };
  savePersistedStore();
  res.json({ success: true, company: MOCK_TABLES.company_setup[0] });
});
app.get("/api/leads", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM leads ORDER BY created_at DESC;");
    res.json({ leads: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/leads", async (req, res) => {
  const l = req.body;
  const id = l.id || `lead-${Date.now()}`;
  try {
    await query(
      `INSERT INTO leads (
         id, lead_number, lead_date, company_name, contact_person, designation, mobile, email,
         website, address, city, state, state_code, country, pincode, lead_source, lead_type,
         industry, requirement, estimated_value, budget, expected_closing_date, rating, score,
         priority, status, lead_owner_id, lead_owner_name, is_converted, raw_data
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, $15, $16, $17,
         $18, $19, $20, $21, $22, $23, $24,
         $25, $26, $27, $28, $29, $30
       ) ON CONFLICT (id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         contact_person = EXCLUDED.contact_person,
         mobile = EXCLUDED.mobile,
         email = EXCLUDED.email,
         status = EXCLUDED.status,
         estimated_value = EXCLUDED.estimated_value,
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        l.leadNumber || `LEAD-${Date.now()}`,
        l.leadDate || null,
        l.companyName,
        l.contactPerson,
        l.designation || null,
        l.mobile,
        l.email || null,
        l.website || null,
        l.address || null,
        l.city || null,
        l.state || null,
        l.stateCode || null,
        l.country || "India",
        l.pincode || null,
        l.leadSource || "Website",
        l.leadType || "Inbound",
        l.industry || null,
        l.requirement || null,
        l.estimatedValue || 0,
        l.budget || 0,
        l.expectedClosingDate || null,
        l.rating || "Warm",
        l.score || 50,
        l.priority || "Medium",
        l.status || "New",
        l.leadOwnerId || null,
        l.leadOwnerName || null,
        Boolean(l.isConverted),
        JSON.stringify(l)
      ]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/leads/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM leads WHERE id = $1", [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/customers", async (_req, res) => {
  try {
    const custRes = await query("SELECT * FROM customers ORDER BY id ASC;");
    const contactsRes = await query("SELECT * FROM customer_contacts ORDER BY id ASC;");
    res.json({
      customers: custRes.rows,
      contacts: contactsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/products", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM products ORDER BY code ASC;");
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/invoices", async (_req, res) => {
  try {
    const invRes = await query("SELECT * FROM finance_invoices ORDER BY id DESC;");
    const itemsRes = await query("SELECT * FROM finance_invoice_items ORDER BY id ASC;");
    res.json({
      invoices: invRes.rows,
      items: itemsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/payments", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM finance_payments ORDER BY payment_date DESC;");
    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/orders", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM sales_orders ORDER BY id DESC;");
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/opportunities", async (_req, res) => {
  try {
    const oppRes = await query("SELECT * FROM opportunities ORDER BY id DESC;");
    const milRes = await query("SELECT * FROM opportunity_payment_milestones ORDER BY id ASC;");
    res.json({
      opportunities: oppRes.rows,
      milestones: milRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/activities", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM activities ORDER BY id DESC;");
    res.json({ activities: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/audit-logs", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;");
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/audit-logs", async (req, res) => {
  const { action, entityType, entityId, details, userName, userId } = req.body;
  try {
    const id = `aud-${Date.now()}`;
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, details, user_name, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, action, entityType, entityId || null, details || "", userName || null, userId || null]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/notifications/email-config", (_req, res) => {
  res.json({
    success: true,
    config: MOCK_TABLES.outlook_app_config[0]
  });
});
app.post("/api/notifications/email-config", (req, res) => {
  const body = req.body || {};
  const current = MOCK_TABLES.outlook_app_config[0] || {};
  const updated = {
    ...current,
    display_name: body.appDisplayName || body.display_name || current.display_name || "Enact360",
    client_id: body.clientId || body.client_id || current.client_id || "af71a4c3-ed1d-45cd-9969-62f8ae0b510a",
    object_id: body.objectId || body.object_id || current.object_id || "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
    tenant_id: body.tenantId || body.tenant_id || current.tenant_id || "d74b8bb7-09a3-4a3c-9ca7-49b9a9dea733",
    supported_account_types: body.supportedAccountTypes || body.supported_account_types || current.supported_account_types || "My organization only",
    redirect_uris: body.redirectUriConfig || body.redirect_uris || current.redirect_uris || "1 web, 0 spa, 0 public client",
    managed_application: body.managedApplication || body.managed_application || current.managed_application || "Enact360",
    state: body.appState || body.state || current.state || "Activated",
    outlook_email: body.outlookEmail || current.outlook_email || "shalv.sharma@coreenact.com",
    cc_emails: body.ccEmails ?? current.cc_emails ?? "",
    smtp_host: body.smtpHost || current.smtp_host || "smtp.office365.com",
    smtp_port: Number(body.smtpPort || current.smtp_port || 587),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  MOCK_TABLES.outlook_app_config[0] = updated;
  savePersistedStore();
  res.json({ success: true, config: updated });
});
app.get("/api/auth/outlook/url", (req, res) => {
  const clientId = (process.env.OUTLOOK_CLIENT_ID || "").trim();
  const tenantId = (process.env.OUTLOOK_TENANT_ID || "").trim();
  const clientSecret = (process.env.OUTLOOK_CLIENT_SECRET || "").trim();
  if (!clientId || !tenantId || !clientSecret) {
    return res.status(503).json({
      error: "Microsoft Entra OAuth is not configured on the server."
    });
  }
  const cfg = MOCK_TABLES.outlook_app_config[0] || {};
  const origin = req.query.origin || process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${req.protocol}://${req.get("host")}`);
  const redirectUri = `${origin.replace(/\/$/, "")}/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid profile email offline_access https://graph.microsoft.com/Mail.Send"
  });
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({
    url,
    clientId,
    tenantId,
    objectId: cfg.object_id || "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
    displayName: cfg.display_name || "Enact360",
    redirectUri
  });
});
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const code = String(req.query?.code || "").trim();
  const clientSecret = (process.env.OUTLOOK_CLIENT_SECRET || "").trim();
  if (!clientSecret || !code || code === "invalid") {
    return res.status(400).json({
      success: false,
      error: "Unverified OAuth callback or missing server OAuth configuration."
    });
  }
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 24px; text-align: center;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'microsoft_entra_enact360' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Enact360 Microsoft Outlook authentication completed. Closing window...</p>
      </body>
    </html>
  `);
});
app.get("/api/notifications/email-log", (_req, res) => {
  res.json({
    success: true,
    smtpConfigured: Boolean(process.env.OUTLOOK_EMAIL_USER && process.env.OUTLOOK_EMAIL_PASS),
    smtpHost: process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com",
    smtpPort: Number(process.env.OUTLOOK_SMTP_PORT || 587),
    appConfig: MOCK_TABLES.outlook_app_config[0],
    logs: MOCK_TABLES.email_notifications.slice(0, 100)
  });
});
app.post("/api/notifications/email", async (req, res) => {
  const {
    to,
    cc,
    subject,
    title,
    message,
    type = "SYSTEM",
    senderName = process.env.OUTLOOK_FROM_NAME || "Enact360 CRM",
    smtpHost = process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com",
    smtpPort = Number(process.env.OUTLOOK_SMTP_PORT || 587),
    appDisplayName = "Enact360",
    clientId = "af71a4c3-ed1d-45cd-9969-62f8ae0b510a",
    objectId = "f39ca6c9-66d2-4bbe-aa2b-53c68637e00f",
    tenantId = "d74b8bb7-09a3-4a3c-9ca7-49b9a9dea733"
  } = req.body || {};
  const recipient = (to || process.env.OUTLOOK_EMAIL_USER || "shalv.sharma@coreenact.com").trim();
  const emailSubject = subject || `[${appDisplayName} CRM \xB7 ${type}] ${title || "System Notification"}`;
  const sentAt = (/* @__PURE__ */ new Date()).toISOString();
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(90deg, #0f172a 0%, #1f7e9e 100%); padding: 16px 22px; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #bae6fd; font-weight: 700;">
          ${appDisplayName} \u2022 Microsoft Outlook Notification \u2022 ${type}
        </div>
        <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800;">${title || emailSubject}</h2>
      </div>
      <div style="padding: 20px 22px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 14px 0;">${message || ""}</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #475569;">
          <div><strong>Recipient (Outlook):</strong> ${recipient}</div>
          ${cc ? `<div><strong>CC:</strong> ${cc}</div>` : ""}
          <div><strong>Entra App (Client ID):</strong> ${appDisplayName} (${clientId})</div>
          <div><strong>Directory (Tenant ID):</strong> ${tenantId}</div>
          <div><strong>Dispatched Via:</strong> ${smtpHost}:${smtpPort} (STARTTLS)</div>
          <div><strong>Timestamp:</strong> ${new Date(sentAt).toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 12px 22px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Automated CRM Notification from <strong>${senderName}</strong> \u2022 Object ID: ${objectId}
      </div>
    </div>
  `;
  let deliveryMode = "unconfigured";
  let smtpError = null;
  let sentSuccess = false;
  if (process.env.OUTLOOK_EMAIL_USER && process.env.OUTLOOK_EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: Number(smtpPort) === 465,
        requireTLS: true,
        auth: {
          user: process.env.OUTLOOK_EMAIL_USER,
          pass: process.env.OUTLOOK_EMAIL_PASS
        },
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false
        }
      });
      await transporter.sendMail({
        from: `"${senderName}" <${process.env.OUTLOOK_EMAIL_USER}>`,
        to: recipient,
        cc: cc || void 0,
        subject: emailSubject,
        text: `${title || emailSubject}

${message || ""}`,
        html: htmlBody
      });
      deliveryMode = "smtp";
      sentSuccess = true;
    } catch (err) {
      smtpError = err?.message || "SMTP connection failed";
    }
  } else {
    smtpError = "OUTLOOK_EMAIL_USER and OUTLOOK_EMAIL_PASS are not configured on the server.";
  }
  const logEntry = {
    id: `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to: recipient,
    cc: cc || "",
    subject: emailSubject,
    title: title || emailSubject,
    message: message || "",
    type,
    smtpHost,
    smtpPort,
    deliveryMode,
    status: sentSuccess ? "Sent via Outlook" : "Failed",
    smtpError,
    sentAt
  };
  MOCK_TABLES.email_notifications.unshift(logEntry);
  res.status(sentSuccess ? 200 : 503).json({
    success: sentSuccess,
    emailLog: logEntry
  });
});
var getGoogleMapsApiKey = () => {
  return (process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
};
async function fetchWithRetry(url, maxAttempts = 3) {
  let lastRes = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url);
    lastRes = res;
    if (res.status !== 500 && res.status !== 503 && res.status !== 504) {
      return res;
    }
    const baseDelayMs = 500 * Math.pow(1.5, attempt - 1);
    const jitteredDelayMs = baseDelayMs * (Math.random() + 0.5);
    await new Promise((r) => setTimeout(r, jitteredDelayMs));
  }
  return lastRes;
}
app.get("/api/maps/config", (_req, res) => {
  const apiKey = getGoogleMapsApiKey();
  res.json({
    apiKey,
    configured: Boolean(apiKey)
  });
});
app.get("/api/maps/reverse-geocode", async (req, res) => {
  const lat = parseFloat(String(req.query.lat ?? ""));
  const lng = parseFloat(String(req.query.lng ?? ""));
  const apiKey = getGoogleMapsApiKey();
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Valid lat and lng query parameters are required."
    });
  }
  if (!apiKey) {
    return res.status(500).json({
      status: "REQUEST_DENIED",
      error: "Google Maps Platform API key is not configured on the server."
    });
  }
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(
      apiKey
    )}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
    const response = await fetchWithRetry(geocodeUrl, 3);
    if (response.status === 429) {
      return res.status(429).json({
        status: "OVER_QUERY_LIMIT",
        quotaExceeded: true,
        error: "Google Maps Platform quota exceeded."
      });
    }
    const data = await response.json();
    if (data.status === "OVER_QUERY_LIMIT" || data?.error?.status === "RESOURCE_EXHAUSTED") {
      return res.status(429).json({
        status: "OVER_QUERY_LIMIT",
        quotaExceeded: true,
        error: data.error_message || "Google Maps Platform quota exceeded."
      });
    }
    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const topResult = data.results[0];
      return res.json({
        status: "OK",
        lat,
        lng,
        formattedAddress: topResult.formatted_address,
        placeId: topResult.place_id || "",
        plusCode: topResult.plus_code?.compound_code || data.plus_code?.compound_code || topResult.plus_code?.global_code || data.plus_code?.global_code || "",
        types: topResult.types || []
      });
    }
    return res.json({
      status: data.status || "ZERO_RESULTS",
      lat,
      lng,
      formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
      placeId: "",
      plusCode: data.plus_code?.compound_code || data.plus_code?.global_code || ""
    });
  } catch (err) {
    return res.status(500).json({
      status: "UNKNOWN_ERROR",
      error: err?.message || "Reverse geocoding request failed."
    });
  }
});
app.get("/api/maps/geocode", async (req, res) => {
  const address = String(req.query.address ?? "").trim();
  const apiKey = getGoogleMapsApiKey();
  if (!address) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Address query parameter is required."
    });
  }
  if (!apiKey) {
    return res.status(500).json({
      status: "REQUEST_DENIED",
      error: "Google Maps Platform API key is not configured on the server."
    });
  }
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${encodeURIComponent(apiKey)}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
    const response = await fetchWithRetry(geocodeUrl, 3);
    if (response.status === 429) {
      return res.status(429).json({
        status: "OVER_QUERY_LIMIT",
        quotaExceeded: true,
        error: "Google Maps Platform quota exceeded."
      });
    }
    const data = await response.json();
    if (data.status === "OVER_QUERY_LIMIT" || data?.error?.status === "RESOURCE_EXHAUSTED") {
      return res.status(429).json({
        status: "OVER_QUERY_LIMIT",
        quotaExceeded: true,
        error: data.error_message || "Google Maps Platform quota exceeded."
      });
    }
    if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const topResult = data.results[0];
      const loc = topResult.geometry?.location || { lat: 28.6139, lng: 77.209 };
      return res.json({
        status: "OK",
        lat: loc.lat,
        lng: loc.lng,
        formattedAddress: topResult.formatted_address,
        placeId: topResult.place_id || "",
        plusCode: topResult.plus_code?.compound_code || data.plus_code?.compound_code || topResult.plus_code?.global_code || data.plus_code?.global_code || ""
      });
    }
    return res.json({
      status: data.status || "ZERO_RESULTS",
      error: "No matching location found."
    });
  } catch (err) {
    return res.status(500).json({
      status: "UNKNOWN_ERROR",
      error: err?.message || "Geocoding request failed."
    });
  }
});
app.get("/api/sync/pull", async (_req, res) => {
  try {
    const [
      usersRes,
      leadsRes,
      custRes,
      contactsRes,
      prodRes,
      invRes,
      invItemsRes,
      payRes,
      orderRes,
      oppRes,
      milestoneRes,
      actRes,
      companyRes
    ] = await Promise.all([
      query("SELECT * FROM users ORDER BY created_at ASC;"),
      query("SELECT * FROM leads ORDER BY created_at DESC;"),
      query("SELECT * FROM customers ORDER BY id ASC;"),
      query("SELECT * FROM customer_contacts ORDER BY id ASC;"),
      query("SELECT * FROM products ORDER BY code ASC;"),
      query("SELECT * FROM finance_invoices ORDER BY id DESC;"),
      query("SELECT * FROM finance_invoice_items ORDER BY id ASC;"),
      query("SELECT * FROM finance_payments ORDER BY payment_date DESC;"),
      query("SELECT * FROM sales_orders ORDER BY id DESC;"),
      query("SELECT * FROM opportunities ORDER BY id DESC;"),
      query("SELECT * FROM opportunity_payment_milestones ORDER BY id ASC;"),
      query("SELECT * FROM activities ORDER BY id DESC;"),
      query("SELECT * FROM company_setup LIMIT 1;")
    ]);
    const payrollMastersMap = {
      ...PERSISTED_CRM_STATE.payrollMasters || {}
    };
    for (const item of MOCK_TABLES.payroll_masters) {
      if (item && item.userId) {
        payrollMastersMap[item.userId] = item;
      }
    }
    res.json({
      success: true,
      data: {
        users: mergeUsersWithMemory(usersRes.rows).map(sanitizeUserForClient),
        payrollMasters: sanitizePayrollMastersMapForClient(payrollMastersMap),
        deletedPayrollMasterIds: PERSISTED_CRM_STATE.deletedPayrollMasterIds || [],
        payrollLoans: PERSISTED_CRM_STATE.payrollLoans || [],
        deletedLoanIds: PERSISTED_CRM_STATE.deletedLoanIds || [],
        payrollPolicy: PERSISTED_CRM_STATE.payrollPolicy || null,
        payrollOrgMasters: PERSISTED_CRM_STATE.payrollOrgMasters || null,
        payrollAttendance: PERSISTED_CRM_STATE.payrollAttendance || {},
        payrollLeaves: PERSISTED_CRM_STATE.payrollLeaves || {},
        payrollClaims: PERSISTED_CRM_STATE.payrollClaims || {},
        payrollStatutory: PERSISTED_CRM_STATE.payrollStatutory || {},
        payrollIntegrationConfig: PERSISTED_CRM_STATE.payrollIntegrationConfig || null,
        crmSlices: PERSISTED_CRM_STATE.crmSlices || {},
        leads: leadsRes.rows,
        customers: custRes.rows,
        contacts: contactsRes.rows,
        products: prodRes.rows,
        invoices: invRes.rows,
        invoiceItems: invItemsRes.rows,
        payments: payRes.rows,
        orders: orderRes.rows,
        opportunities: oppRes.rows,
        milestones: milestoneRes.rows,
        activities: actRes.rows,
        companySetup: companyRes.rows[0] || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
async function startServer() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  const isProd = process.env.NODE_ENV === "production" || process.argv.includes("--production");
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, host: "0.0.0.0", port },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Enact360 Full-Stack Server running on http://0.0.0.0:${port}`);
    console.log(`Live PostgreSQL Target: Render (postgresqlcrm_go7i)`);
  });
}
var serverReady = process.env.CRM_TEST_MODE !== "true" ? startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    process.exit(1);
  }
}) : Promise.resolve();

// backend/vercelHandler.ts
async function handler(req, res) {
  if (req.url) {
    let url = req.url;
    if (!url.startsWith("/api/") && url !== "/api" && !url.startsWith("/auth")) {
      const clean = url.startsWith("/") ? url : "/" + url;
      url = "/api" + clean;
    }
    req.url = url;
  }
  await serverReady;
  return server_default(req, res);
}
export {
  handler as default
};
