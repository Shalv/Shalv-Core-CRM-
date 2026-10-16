import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineMeters,
  localIsoDate,
  checkGeofence,
  formatDistance,
} from '../src/shared/geo.ts';

test('haversineMeters: ~111 km per degree of latitude', () => {
  const d = haversineMeters(0, 0, 1, 0);
  assert.ok(d > 110000 && d < 112000, `expected ~111km, got ${d}`);
});

test('haversineMeters: zero distance for identical points', () => {
  assert.equal(haversineMeters(19.076, 72.8777, 19.076, 72.8777), 0);
});

test('localIsoDate: uses local calendar date, not UTC', () => {
  // Local-time constructor: must render the same calendar day regardless of timezone.
  assert.equal(localIsoDate(new Date(2026, 0, 1, 0, 30)), '2026-01-01');
  assert.equal(localIsoDate(new Date(2026, 11, 31, 23, 30)), '2026-12-31');
  assert.equal(localIsoDate(new Date(2026, 5, 9, 12, 0)), '2026-06-09');
});

test('checkGeofence: inside the radius', () => {
  // ~55 m north of the centre -> inside a 300 m fence
  const r = checkGeofence(19.0765, 72.8777, { lat: 19.076, lng: 72.8777 }, 300);
  assert.ok(r);
  assert.equal(r!.within, true);
  assert.ok(r!.distanceMeters > 0 && r!.distanceMeters < 300);
});

test('checkGeofence: outside the radius', () => {
  // ~1.1 km north of the centre -> outside a 300 m fence
  const r = checkGeofence(19.086, 72.8777, { lat: 19.076, lng: 72.8777 }, 300);
  assert.ok(r);
  assert.equal(r!.within, false);
  assert.ok(r!.distanceMeters > 300);
});

test('checkGeofence: returns null when no centre is configured', () => {
  assert.equal(checkGeofence(19.076, 72.8777, null, 300), null);
  assert.equal(checkGeofence(19.076, 72.8777, { lat: null, lng: null }, 300), null);
});

test('checkGeofence: falls back to 300 m for an invalid radius', () => {
  const r = checkGeofence(19.0765, 72.8777, { lat: 19.076, lng: 72.8777 }, 0);
  assert.ok(r);
  assert.equal(r!.radiusMeters, 300);
});

test('formatDistance: metres and kilometres', () => {
  assert.equal(formatDistance(180), '180 m');
  assert.equal(formatDistance(1400), '1.4 km');
  assert.equal(formatDistance(NaN), '—');
});
