/**
 * Server sync for the real-time HR collections.
 *
 * Each collection is stored in the durable server state (`/api/payroll/collections`),
 * so every write is captured server-side and is visible to all users and devices —
 * not just the browser that made the change.
 */

export type PayrollCollectionKey =
  | 'locations'
  | 'regularization'
  | 'shifts'
  | 'shiftAssignments'
  | 'shiftSwaps'
  | 'helpdesk'
  | 'runs'
  | 'lifecycle'
  | 'assets'
  | 'assetCategories'
  | 'assetAllocations'
  | 'jobOpenings'
  | 'candidates'
  | 'onboarding'
  | 'performance'
  | 'trainingPrograms'
  | 'trainingNominations';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('crm_auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

/** Fetch every HR collection from the server. Returns null when unreachable. */
export async function fetchPayrollCollections(): Promise<Record<string, any[]> | null> {
  try {
    const res = await fetch('/api/payroll/collections', { headers: authHeaders() });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const collections = json?.collections;
    return collections && typeof collections === 'object' ? collections : null;
  } catch {
    return null;
  }
}

/** Persist one collection to the server. */
export async function pushPayrollCollection(
  key: PayrollCollectionKey,
  data: unknown[]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/payroll/collections/${key}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
