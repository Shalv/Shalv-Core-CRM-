import type { User } from '../types';

// An employee marked "Payroll Only" still owns a record in the CRM `users` slice, because identity,
// login and the /api/sync payload are all keyed there - removing the record would break their ESS
// sign-in. What must change is visibility: a payroll-only person is not a CRM user, so they cannot
// be listed in the User Master, counted in CRM statistics, offered as a lead/opportunity owner or
// appear in the persona switcher.
//
// Look up an existing record by id WITHOUT this filter. Legacy leads can still be owned by someone
// who was later moved to payroll-only; suppressing that lookup would render those records ownerless.
export const isPayrollOnlyUser = (
  u?: Pick<User, 'accessType' | 'accessScope'> | null
): boolean =>
  Boolean(
    u &&
      (u.accessType === 'payroll_only' ||
        u.accessScope === 'payroll_only' ||
        u.accessScope === 'PAYROLL_ONLY')
  );

// CRM surfaces should enumerate this list instead of the raw `users` array.
export const crmVisibleUsers = (users?: User[]): User[] =>
  (users || []).filter((u) => u && !isPayrollOnlyUser(u));
