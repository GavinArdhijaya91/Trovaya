import assert from "node:assert/strict";
import test from "node:test";
import { isDeliveryEligible } from "../lib/vault/delivery-policy.ts";

test("delivery requires license, vault authorization, and an active key", () => {
  assert.equal(isDeliveryEligible({ licensed: true, authorized: true, keyActive: true }), true);
  assert.equal(isDeliveryEligible({ licensed: false, authorized: true, keyActive: true }), false);
  assert.equal(isDeliveryEligible({ licensed: true, authorized: false, keyActive: true }), false);
  assert.equal(isDeliveryEligible({ licensed: true, authorized: true, keyActive: false }), false);
});
