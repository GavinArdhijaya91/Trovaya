import assert from "node:assert/strict";
import test from "node:test";
import { resolveEntitlement } from "../lib/asset-access.ts";

test("a wallet that already paid keeps access after the session state is gone", () => {
  const entitlement = resolveEntitlement({
    sessionLicenseConfirmed: false,
    sessionUnlockConfirmed: false,
    chainLicense: true,
    chainVaultAccess: true,
  });

  assert.equal(entitlement.licensed, true);
  assert.equal(entitlement.authorized, true);
  assert.equal(entitlement.chainVerified, true);
});

test("a failed chain read never revokes access proven in the current session", () => {
  const entitlement = resolveEntitlement({
    sessionLicenseConfirmed: true,
    sessionUnlockConfirmed: true,
    chainLicense: undefined,
    chainVaultAccess: undefined,
  });

  assert.equal(entitlement.licensed, true);
  assert.equal(entitlement.authorized, true);
  assert.equal(entitlement.chainVerified, false);
});

test("an explicit on-chain denial alone never grants entitlement", () => {
  const entitlement = resolveEntitlement({
    sessionLicenseConfirmed: false,
    sessionUnlockConfirmed: false,
    chainLicense: false,
    chainVaultAccess: false,
  });

  assert.deepEqual(entitlement, { licensed: false, authorized: false, chainVerified: false });
});

test("a vault grant without a license still opens the original it was granted for", () => {
  const entitlement = resolveEntitlement({
    sessionLicenseConfirmed: false,
    sessionUnlockConfirmed: false,
    chainLicense: false,
    chainVaultAccess: true,
  });

  assert.equal(entitlement.licensed, false);
  assert.equal(entitlement.authorized, true);
});
