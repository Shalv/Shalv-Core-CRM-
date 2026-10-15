/**
 * Resolve a GST rate without coercing a legitimate 0% (zero-rated / exempt) rate to the default.
 *
 * A bare `rate || 18` treats the number 0 as "missing" and silently promotes a zero-rated supply
 * to 18%, which mis-states the tax rate and the tax amount on statutory documents. This helper
 * falls back to the default ONLY when the value is not a usable finite number (undefined, null,
 * '', NaN, a non-numeric string).
 */
export function resolveGstRate(value: unknown, fallback = 18): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
