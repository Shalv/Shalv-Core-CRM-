/**
 * Geographic and date helpers for attendance punch (location) logic.
 *
 * The punch flow must only ever record a location that came from a genuine
 * device GPS fix, and must be able to say whether that fix falls inside the
 * office geofence. These helpers keep that maths in one place.
 */

/** Great-circle distance in whole metres between two WGS84 points (Haversine). */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth mean radius, metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  return Math.round(R * c);
}

/**
 * Local calendar date as YYYY-MM-DD.
 * Deliberately NOT `toISOString()` — that returns the UTC date, which is the
 * previous day for early-morning punches in IST (UTC+05:30).
 */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local wall-clock time as e.g. '09:30 AM'. */
export function localTimeString(date: Date = new Date(), locale = 'en-IN'): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export interface GeofenceResult {
  /** Distance from the fix to the geofence centre, in metres. */
  distanceMeters: number;
  /** True when the fix is inside the radius. */
  within: boolean;
  /** The radius used, in metres. */
  radiusMeters: number;
}

/**
 * Evaluate a GPS fix against a circular geofence. Returns null when no
 * geofence centre is configured (so callers can skip enforcement rather than
 * silently pass or fail).
 */
export function checkGeofence(
  lat: number,
  lng: number,
  centre: { lat?: number | null; lng?: number | null } | null | undefined,
  radiusMeters: number
): GeofenceResult | null {
  if (!centre || typeof centre.lat !== 'number' || typeof centre.lng !== 'number') return null;
  if (!Number.isFinite(centre.lat) || !Number.isFinite(centre.lng)) return null;
  const distanceMeters = haversineMeters(lat, lng, centre.lat, centre.lng);
  const radius = Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : 300;
  return { distanceMeters, within: distanceMeters <= radius, radiusMeters: radius };
}

/** Human-readable distance, e.g. '180 m' or '1.4 km'. */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
