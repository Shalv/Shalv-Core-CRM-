import { AmcContract, SupportTicket, SupportChangeRequest, LicenseTypeMasterItem } from '../types';

export const INITIAL_LICENSE_TYPES: LicenseTypeMasterItem[] = [
  {
    id: 'lic-1',
    code: 'BC ESSENTIAL',
    name: 'MS D365 Business Central Essential',
    description: 'Full ERP user subscription for finance, supply chain, manufacturing, and project management',
    hsnSac: '997331',
    monthlyCost: 6655,
    yearlyCost: 79860,
    status: 'Active',
  },
  {
    id: 'lic-2',
    code: 'BC- DEVICE',
    name: 'Dynamics 365 Business Central Device',
    description: 'Shared point-of-sale, shop floor, or warehouse device subscription for Business Central',
    hsnSac: '997331',
    monthlyCost: 3780,
    yearlyCost: 45360,
    status: 'Active',
  },
  {
    id: 'lic-3',
    code: 'DYNAMICS 365 BUSINESS CENTRAL TEAM',
    name: 'Dynamics 365 Business Central Team',
    description: 'Team Member license for read access, approvals, time sheets, and self-service requisitions',
    hsnSac: '997331',
    monthlyCost: 665,
    yearlyCost: 7980,
    status: 'Active',
  },
  {
    id: 'lic-4',
    code: 'M365-BASIC',
    name: 'Microsoft 365 Business Basic',
    description: 'Microsoft 365 Business Basic annual license (Exchange, Teams, SharePoint, OneDrive)',
    hsnSac: '997331',
    monthlyCost: 170,
    yearlyCost: 2040,
    status: 'Active',
  },
];

export const INITIAL_AMC_CONTRACTS: AmcContract[] = [];

export const INITIAL_CHANGE_REQUESTS: SupportChangeRequest[] = [];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];
