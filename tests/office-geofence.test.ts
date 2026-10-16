import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICE_GEOFENCE,
  DEFAULT_ADMIN_POLICY_MASTER,
} from '../src/components/payroll/payrollTypes.ts';
import { checkGeofence, haversineMeters } from '../src/shared/geo.ts';

test('office geofence is centred on SRS Tower, Sector 31, Faridabad', () => {
  assert.equal(OFFICE_GEOFENCE.lat, 28.4457691);
  assert.equal(OFFICE_GEOFENCE.lng, 77.3082054);
});

test('office geofence allows a 100 m radius', () => {
  assert.equal(OFFICE_GEOFENCE.radiusMeters, 100);
});

test('the default policy carries the office geofence', () => {
  assert.equal(DEFAULT_ADMIN_POLICY_MASTER.officeLat, OFFICE_GEOFENCE.lat);
  assert.equal(DEFAULT_ADMIN_POLICY_MASTER.officeLng, OFFICE_GEOFENCE.lng);
  assert.equal(DEFAULT_ADMIN_POLICY_MASTER.geofenceRadiusMeters, 100);
});

test('~50 m from the office is allowed; ~200 m is blocked', () => {
  const c = { lat: OFFICE_GEOFENCE.lat, lng: OFFICE_GEOFENCE.lng };
  const near = { lat: c.lat + 0.00045, lng: c.lng }; // ≈ 50 m north
  const far = { lat: c.lat + 0.0018, lng: c.lng }; //  ≈ 200 m north

  const nearDist = haversineMeters(near.lat, near.lng, c.lat, c.lng);
  const farDist = haversineMeters(far.lat, far.lng, c.lat, c.lng);
  assert.ok(nearDist < 100, `expected <100 m, got ${nearDist}`);
  assert.ok(farDist > 100, `expected >100 m, got ${farDist}`);

  assert.equal(checkGeofence(near.lat, near.lng, c, OFFICE_GEOFENCE.radiusMeters)!.within, true);
  assert.equal(checkGeofence(far.lat, far.lng, c, OFFICE_GEOFENCE.radiusMeters)!.within, false);
});
