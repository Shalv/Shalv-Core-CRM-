/**
 * Decides whether an /api/auth/verify response is an *authoritative* rejection of the supplied
 * credentials, as opposed to the server being unreachable or unhealthy.
 *
 * This distinction is what stops the offline credential fallback from turning a real rejection
 * into a tokenless fake session. A fabricated session renders the workspace briefly, then the
 * /api/auth/session check clears isAuthenticated and dumps the user back on the login screen -
 * the "admin cannot log in, again and again" loop with no error message anywhere.
 *
 * Rules:
 *  - No parseable JSON body  -> not authoritative (network failure, HTML error page, proxy).
 *  - 4xx with success:false / authenticated:false -> authoritative rejection.
 *  - 2xx that explicitly says success:false      -> authoritative rejection.
 *  - 5xx -> not authoritative: the server was reachable but could not decide, so the caller may
 *    still fall back to locally cached credentials for offline/mock use.
 */
export const isAuthoritativeAuthRejection = (
  status: number,
  data: unknown
): data is { message?: string } => {
  if (!data || typeof data !== 'object') return false;
  const body = data as { success?: unknown; authenticated?: unknown };
  const saysNo = body.success === false || body.authenticated === false;
  if (!saysNo) return false;
  if (status >= 500) return false;
  return status >= 400 || status < 300;
};
